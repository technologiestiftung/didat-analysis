import json
import os
import google.generativeai as genai
from google.generativeai.types import HarmCategory, HarmBlockThreshold

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
      "category": "eine von: Digitale Bürgerdienste (E-Government) | IT-Infrastruktur & ITDZ | Datenschutz & Informationsfreiheit | Verwaltungsreform & Haushalt | Künstliche Intelligenz (KI) | Cybersicherheit | Open Data & Open Source",
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

def analyze():
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("GEMINI_API_KEY is not set. Skipping analysis.")
        return

    genai.configure(api_key=api_key)

    input_file = "parsed_texts.json"
    if not os.path.exists(input_file):
        print(f"File {input_file} not found. Run parse_pdfs.py first.")
        return

    with open(input_file, "r", encoding="utf-8") as f:
        parsed_data = json.load(f)

    model = genai.GenerativeModel(
        model_name="gemini-2.5-pro",
        system_instruction=SYSTEM_PROMPT,
    )
    
    results = []
    output_file = "analysis_results.json"
    if os.path.exists(output_file):
        try:
            with open(output_file, "r", encoding="utf-8") as f:
                results = json.load(f)
        except json.JSONDecodeError:
            pass

    processed_sessions = {r["session_raw"] for r in results}

    for session in parsed_data:
        if session["session_raw"] in processed_sessions:
            print(f"Skipping already analyzed session.", flush=True)
            continue

        combined_text = "\\n".join([doc["text"] for doc in session.get("documents", [])])
        if not combined_text.strip():
            continue

        # Truncate if necessary to fit within context limits
        max_chars = 300000 
        if len(combined_text) > max_chars:
            combined_text = combined_text[:max_chars]

        user_prompt = USER_PROMPT_TEMPLATE.replace("{protocol_text}", combined_text)

        try:
            print("Calling Gemini API for session...", flush=True)
            response = model.generate_content(
                user_prompt,
                generation_config=genai.GenerationConfig(
                    response_mime_type="application/json",
                    temperature=0
                ),
                safety_settings={
                    HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_NONE,
                    HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_NONE,
                    HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_NONE,
                    HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_NONE,
                }
            )
            
            response_text = response.text
            # Parse the returned JSON
            structured_data = json.loads(response_text)
            
            results.append({
                "session_raw": session["session_raw"],
                "analysis": structured_data
            })
            
            with open(output_file, "w", encoding="utf-8") as f:
                json.dump(results, f, indent=2, ensure_ascii=False)
            
        except Exception as e:
            print(f"Error analyzing session: {e}", flush=True)

    output_file = "analysis_results.json"
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
        
    print(f"Analysis complete. Results saved to {output_file}.", flush=True)
    print("In a real scenario, this script would also aggregate and write to public/data/*.json files.", flush=True)

if __name__ == "__main__":
    analyze()
