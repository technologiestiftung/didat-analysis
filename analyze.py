from __future__ import annotations

import json
import os
import time

from google import genai
from google.genai import types

from pipeline_utils import parse_session_number

SYSTEM_PROMPT = """
Du bist ein Experte für Berliner Parlamentsdokumente. 
Analysiere das folgende Sitzungsprotokoll des Ausschusses für Digitalisierung und Datenschutz 
und extrahiere strukturierte Informationen. 
Antworte NUR mit validem JSON, ohne Markdown-Codeblöcke, ohne Erklärungen.
"""

USER_PROMPT_TEMPLATE = """
Analysiere dieses Sitzungsprotokoll und gib ein JSON-Objekt zurück mit:

{
  "topics": [
    {
      "name": "Themenname (max. 5 Wörter)",
      "category": "eine von: Bürgerdienste & Digitale Anträge | IT-Modernisierung & Infrastruktur | Datenschutz & Grundrechte | Informationsfreiheit & Transparenz | Künstliche Intelligenz (KI) | Cybersicherheit & Resilienz | Haushalt & Steuerung | Digitale Gesetze & Strategien",
      "summary": "2-3 Sätze Zusammenfassung"
    }
  ],
  "decisions": [
    {
      "text": "Beschlusstext (max. 150 Zeichen)",
      "result": "angenommen | abgelehnt | vertagt | zur Kenntnis genommen"
    }
  ],
  "partyPositions": [
    {
      "party": "SPD | CDU | Grüne | FDP | Linke | AfD",
      "topic": "Themenname",
      "stance": "pro | contra | neutral",
      "quote": "Wörtliches Kurzzitat wenn vorhanden (max. 100 Zeichen)"
    }
  ]
}

Protokoll-Text:
{protocol_text}
"""

MODEL_NAME = "gemini-3.5-flash"
MAX_CHARS = 300000
MAX_RETRIES = 3
RETRY_BACKOFF_SEC = 5


def parse_model_json(response_text: str) -> dict:
    """Parse model JSON, tolerating fences or trailing junk."""
    text = (response_text or "").strip()
    if text.startswith("```"):
        lines = text.splitlines()
        # Drop opening fence and optional language tag, and closing fence
        if lines and lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        text = "\n".join(lines).strip()

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        start = text.find("{")
        end = text.rfind("}")
        if start != -1 and end != -1 and end > start:
            return json.loads(text[start : end + 1])
        raise


def _result_session_id(entry: dict) -> str | None:
    if entry.get("session_id"):
        return str(entry["session_id"])
    return parse_session_number(entry.get("session_raw", ""))


def analyze():
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("GEMINI_API_KEY is not set. Skipping analysis.")
        return

    client = genai.Client(api_key=api_key)

    input_file = "parsed_texts.json"
    if not os.path.exists(input_file):
        print(f"File {input_file} not found. Run parse_pdfs.py first.")
        return

    with open(input_file, "r", encoding="utf-8") as f:
        parsed_data = json.load(f)

    results = []
    output_file = "analysis_results.json"
    if os.path.exists(output_file):
        try:
            with open(output_file, "r", encoding="utf-8") as f:
                results = json.load(f)
        except json.JSONDecodeError:
            pass

    # Re-key existing results onto stable session_id and drop orphans
    # whose session_id is not in the current parse set.
    current_ids = {
        str(s.get("session_id") or parse_session_number(s.get("session_raw", "")))
        for s in parsed_data
    }
    current_ids.discard("None")
    current_ids.discard(None)

    migrated = []
    seen = set()
    for entry in results:
        sid = _result_session_id(entry)
        if not sid or sid not in current_ids or sid in seen:
            continue
        seen.add(sid)
        migrated.append(
            {
                "session_id": sid,
                "session_raw": entry.get("session_raw", ""),
                "analysis": entry.get("analysis", {}),
            }
        )
    results = migrated
    processed_sessions = {r["session_id"] for r in results}

    for session in parsed_data:
        session_id = str(
            session.get("session_id")
            or parse_session_number(session.get("session_raw", ""))
        )
        if not session_id or session_id == "None":
            print("Skipping session without session_id.")
            continue

        if session_id in processed_sessions:
            print(f"Skipping already analyzed session {session_id}.", flush=True)
            continue

        combined_text = "\n".join(
            [doc["text"] for doc in session.get("documents", [])]
        )
        if not combined_text.strip():
            print(f"Skipping session {session_id}: empty document text.", flush=True)
            continue

        if len(combined_text) > MAX_CHARS:
            print(
                f"Warning: truncating session {session_id} from "
                f"{len(combined_text)} to {MAX_CHARS} chars.",
                flush=True,
            )
            combined_text = combined_text[:MAX_CHARS]

        user_prompt = USER_PROMPT_TEMPLATE.replace("{protocol_text}", combined_text)

        last_error = None
        for attempt in range(1, MAX_RETRIES + 1):
            try:
                print(
                    f"Calling Gemini API for session {session_id} "
                    f"(attempt {attempt}/{MAX_RETRIES})...",
                    flush=True,
                )
                response = client.models.generate_content(
                    model=MODEL_NAME,
                    contents=user_prompt,
                    config=types.GenerateContentConfig(
                        system_instruction=SYSTEM_PROMPT,
                        response_mime_type="application/json",
                        # Slight temperature on retries avoids identical broken JSON
                        temperature=0 if attempt == 1 else 0.2,
                        safety_settings=[
                            types.SafetySetting(
                                category="HARM_CATEGORY_HATE_SPEECH",
                                threshold="BLOCK_NONE",
                            ),
                            types.SafetySetting(
                                category="HARM_CATEGORY_HARASSMENT",
                                threshold="BLOCK_NONE",
                            ),
                            types.SafetySetting(
                                category="HARM_CATEGORY_SEXUALLY_EXPLICIT",
                                threshold="BLOCK_NONE",
                            ),
                            types.SafetySetting(
                                category="HARM_CATEGORY_DANGEROUS_CONTENT",
                                threshold="BLOCK_NONE",
                            ),
                        ],
                    ),
                )

                structured_data = parse_model_json(response.text)

                results.append(
                    {
                        "session_id": session_id,
                        "session_raw": session.get("session_raw", ""),
                        "analysis": structured_data,
                    }
                )
                processed_sessions.add(session_id)

                with open(output_file, "w", encoding="utf-8") as f:
                    json.dump(results, f, indent=2, ensure_ascii=False)
                last_error = None
                break
            except Exception as e:
                last_error = e
                print(
                    f"Error analyzing session {session_id} "
                    f"(attempt {attempt}): {e}",
                    flush=True,
                )
                if attempt < MAX_RETRIES:
                    time.sleep(RETRY_BACKOFF_SEC * attempt)

        if last_error is not None:
            print(
                f"Giving up on session {session_id} after {MAX_RETRIES} attempts.",
                flush=True,
            )

    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2, ensure_ascii=False)

    print(f"Analysis complete. Results saved to {output_file}.", flush=True)


if __name__ == "__main__":
    analyze()
