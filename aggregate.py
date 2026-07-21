from __future__ import annotations

import json
import os
import uuid

from pipeline_utils import (
    DEFAULT_CATEGORY,
    VALID_CATEGORIES,
    VALID_RESULTS,
    VALID_STANCES,
    compute_topic_trend,
    normalize_category,
    parse_date_from_raw,
    parse_session_number,
    session_id_from_number,
    topic_id_from_name,
)


def parse_title(raw: str, session_number: str | None) -> str:
    if session_number:
        return (
            f"{session_number}. Sitzung des Ausschusses "
            "für Digitalisierung und Datenschutz"
        )
    return "Sitzung des Ausschusses für Digitalisierung und Datenschutz"


def aggregate():
    input_file = "analysis_results.json"
    if not os.path.exists(input_file):
        print("No analysis_results.json found.")
        return

    with open(input_file, "r", encoding="utf-8") as f:
        data = json.load(f)

    parsed_texts_file = "parsed_texts.json"
    parsed_data = []
    if os.path.exists(parsed_texts_file):
        with open(parsed_texts_file, "r", encoding="utf-8") as f:
            parsed_data = json.load(f)

    parsed_by_id = {}
    for s in parsed_data:
        sid = str(s.get("session_id") or parse_session_number(s.get("session_raw", "")))
        if sid and sid != "None":
            parsed_by_id[sid] = s

    sessions = []
    topics_dict = {}
    trends_dict = {}
    invalid_category_count = 0

    for item in data:
        raw = item.get("session_raw", "")
        analysis = item.get("analysis", {})
        number = str(item.get("session_id") or parse_session_number(raw) or "")
        if not number:
            print(f"Skipping analysis entry without session number: {raw[:60]!r}")
            continue

        date_str = parse_date_from_raw(raw)
        if not date_str:
            parsed = parsed_by_id.get(number, {})
            date_str = parsed.get("date")
        if not date_str:
            print(f"Skipping session {number}: no parsable date.")
            continue

        title = parse_title(raw, number)
        session_id = session_id_from_number(number)

        session_topics = analysis.get("topics", [])
        session_decisions = analysis.get("decisions", [])
        session_positions = analysis.get("partyPositions", [])

        topic_names = []
        session_topic_ids = set()

        for t in session_topics:
            t_name = t.get("name")
            if not t_name:
                continue
            t_cat = normalize_category(t.get("category"))
            if t_cat is None:
                invalid_category_count += 1
                print(
                    f"Warning: invalid category {t.get('category')!r} "
                    f"for topic {t_name!r} in session {number}; "
                    f"using {DEFAULT_CATEGORY}."
                )
                t_cat = DEFAULT_CATEGORY

            t_id = topic_id_from_name(t_name)
            topic_names.append(t_name)
            session_topic_ids.add(t_id)

            if t_id not in topics_dict:
                topics_dict[t_id] = {
                    "id": t_id,
                    "name": t_name,
                    "category": t_cat,
                    "sessionIds": set(),
                    "sessionDates": [],
                    "partyPositions": [],
                }
            topics_dict[t_id]["sessionIds"].add(session_id)
            topics_dict[t_id]["sessionDates"].append(date_str)

            trend_key = f"{date_str[:7]}_{t_cat}"
            if trend_key not in trends_dict:
                trends_dict[trend_key] = {
                    "date": date_str[:7],
                    "category": t_cat,
                    "count": 0,
                }
            trends_dict[trend_key]["count"] += 1

        # Match party positions only to topics mentioned in this session
        name_to_id = {
            topics_dict[tid]["name"]: tid for tid in session_topic_ids if tid in topics_dict
        }
        for p in session_positions:
            t_name = p.get("topic")
            matched_id = name_to_id.get(t_name)
            if not matched_id:
                continue
            party = p.get("party")
            stance = p.get("stance")
            if party not in {"SPD", "CDU", "Grüne", "FDP", "Linke", "AfD"}:
                continue
            if stance not in VALID_STANCES:
                continue
            topics_dict[matched_id]["partyPositions"].append(
                {
                    "party": party,
                    "stance": stance,
                    "quote": p.get("quote"),
                    "sessionId": session_id,
                }
            )

        decisions_formatted = []
        for d in session_decisions:
            result = d.get("result", "zur Kenntnis genommen")
            if result not in VALID_RESULTS:
                result = "zur Kenntnis genommen"
            decisions_formatted.append(
                {
                    "id": "d_" + str(uuid.uuid4())[:8],
                    "text": d.get("text"),
                    "result": result,
                }
            )

        docs = parsed_by_id.get(number, {}).get("documents", [])
        bp_docs = [d for d in docs if "-bp.pdf" in d.get("url", "").lower()]
        has_bp = bool(bp_docs)
        if bp_docs:
            pdf_url = bp_docs[0]["url"]
            session_type = "Beschlussprotokoll"
        elif docs:
            pdf_url = docs[0]["url"]
            session_type = (
                "Einladung" if "-e.pdf" in docs[0].get("url", "").lower() else "Beschlussprotokoll"
            )
        else:
            pdf_url = (
                "https://www.parlament-berlin.de/dokumente/sitzungsuebersicht"
                "?Wahlperiode=19&Ausschuss=19-ausschuss-fur-digitalisierung-und-datenschutz"
            )
            session_type = "Einladung"

        # Prefer Beschlussprotokoll type when a -bp.pdf exists
        if has_bp:
            session_type = "Beschlussprotokoll"

        sessions.append(
            {
                "id": session_id,
                "date": f"{date_str}T10:00:00Z",
                "title": title,
                "pdfUrl": pdf_url,
                "type": session_type,
                "topics": topic_names,  # display names for SessionList badges
                "decisions": decisions_formatted,
                "attendees": [],
            }
        )

    final_topics = []
    for t in topics_dict.values():
        dates = t.pop("sessionDates")
        t["sessionIds"] = list(t["sessionIds"])
        t["trend"] = compute_topic_trend(dates)
        if t["category"] not in VALID_CATEGORIES:
            t["category"] = DEFAULT_CATEGORY
        final_topics.append(t)

    parties_data = []
    for t in final_topics:
        if t["partyPositions"]:
            parties_data.append(
                {"topicId": t["id"], "positions": t["partyPositions"]}
            )

    final_trends = list(trends_dict.values())

    # Sort sessions by date descending for stable frontend display
    sessions.sort(key=lambda s: s["date"], reverse=True)

    os.makedirs("public/data", exist_ok=True)
    with open("public/data/sessions.json", "w", encoding="utf-8") as f:
        json.dump(sessions, f, indent=2, ensure_ascii=False)
    with open("public/data/topics.json", "w", encoding="utf-8") as f:
        json.dump(final_topics, f, indent=2, ensure_ascii=False)
    with open("public/data/parties.json", "w", encoding="utf-8") as f:
        json.dump(parties_data, f, indent=2, ensure_ascii=False)
    with open("public/data/trends.json", "w", encoding="utf-8") as f:
        json.dump(final_trends, f, indent=2, ensure_ascii=False)

    print(
        f"Aggregation complete. Wrote {len(sessions)} sessions, "
        f"{len(final_topics)} topics, {len(final_trends)} trend points "
        f"({invalid_category_count} invalid categories remapped)."
    )


if __name__ == "__main__":
    aggregate()
