import json
import os
import re
import uuid
from datetime import datetime

def parse_date_from_raw(raw):
    # E.g. "67\t23.02.2026\t..."
    match = re.search(r"(\d{1,2})\.(\d{1,2})\.(\d{4})", raw)
    if match:
        d, m, y = match.groups()
        # Fix known typo in parliament data where a date is wrongly put as 2026
        if y == "2026":
            y = "2025"
        elif y == "2025" and int(m) > 6 and int(d) > 0:
            pass # just leaving it as is for now, maybe it's correct
            
        return f"{y}-{m.zfill(2)}-{d.zfill(2)}"
    return "2024-01-01"

def parse_title(raw):
    # E.g. "67\\t23.02.2026"
    match = re.search(r"^(\d+)\s", raw)
    if match:
        return f"{match.group(1)}. Sitzung des Ausschusses für Digitalisierung und Datenschutz"
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
            
    parsed_dict = {s["session_raw"]: s.get("documents", []) for s in parsed_data}
        
    sessions = []
    topics_dict = {}
    trends_dict = {}
    
    for item in data:
        raw = item.get("session_raw", "")
        analysis = item.get("analysis", {})
        
        date_str = parse_date_from_raw(raw)
        title = parse_title(raw)
        session_id = date_str
        
        session_topics = analysis.get("topics", [])
        session_decisions = analysis.get("decisions", [])
        session_positions = analysis.get("partyPositions", [])
        
        topic_ids = []
        
        for t in session_topics:
            t_name = t.get("name")
            t_cat = t.get("category", "Digitale Bürgerdienste (E-Government)")
            t_id = "t_" + str(abs(hash(t_name)))[:8]
            topic_ids.append(t_name) # Store name instead of ID for frontend display
            
            if t_id not in topics_dict:
                topics_dict[t_id] = {
                    "id": t_id,
                    "name": t_name,
                    "category": t_cat,
                    "sessionIds": set(),
                    "trend": "konstant",
                    "partyPositions": []
                }
            topics_dict[t_id]["sessionIds"].add(session_id)
            
            # Trend calculation base
            trend_key = f"{date_str[:7]}_{t_cat}"
            if trend_key not in trends_dict:
                trends_dict[trend_key] = {"date": date_str[:7], "category": t_cat, "count": 0}
            trends_dict[trend_key]["count"] += 1
            
        for p in session_positions:
            # find matching topic
            t_name = p.get("topic")
            matched_id = None
            for tid, tval in topics_dict.items():
                if tval["name"] == t_name:
                    matched_id = tid
                    break
            
            if matched_id:
                pos = {
                    "party": p.get("party"),
                    "stance": p.get("stance"),
                    "quote": p.get("quote"),
                    "sessionId": session_id
                }
                topics_dict[matched_id]["partyPositions"].append(pos)
                
        # Format decisions
        decisions_formatted = []
        for d in session_decisions:
            decisions_formatted.append({
                "id": "d_" + str(uuid.uuid4())[:8],
                "text": d.get("text"),
                "result": d.get("result", "zur Kenntnis genommen")
            })
            
        # Extract PDF URL for Beschlussprotokoll from session documents
        pdf_url = "https://www.parlament-berlin.de/dokumente/sitzungsuebersicht?Wahlperiode=19&Ausschuss=19-ausschuss-fur-digitalisierung-und-datenschutz"
        docs = parsed_dict.get(raw, [])
        bp_docs = [d for d in docs if "-bp.pdf" in d.get("url", "").lower()]
        if bp_docs:
            pdf_url = bp_docs[0]["url"]
        elif docs:
            pdf_url = docs[0]["url"]

        sessions.append({
            "id": session_id,
            "date": f"{date_str}T10:00:00Z",
            "title": title,
            "pdfUrl": pdf_url,
            "type": "Beschlussprotokoll",
            "topics": topic_ids,
            "decisions": decisions_formatted,
            "attendees": []
        })

    # Convert sets to lists
    final_topics = []
    for t in topics_dict.values():
        t["sessionIds"] = list(t["sessionIds"])
        final_topics.append(t)
        
    # Parties data
    parties_data = []
    for t in final_topics:
        if t["partyPositions"]:
            parties_data.append({
                "topicId": t["id"],
                "positions": t["partyPositions"]
            })
            
    # Trends data
    final_trends = list(trends_dict.values())
    
    # Write files
    os.makedirs("public/data", exist_ok=True)
    with open("public/data/sessions.json", "w", encoding="utf-8") as f:
        json.dump(sessions, f, indent=2, ensure_ascii=False)
    with open("public/data/topics.json", "w", encoding="utf-8") as f:
        json.dump(final_topics, f, indent=2, ensure_ascii=False)
    with open("public/data/parties.json", "w", encoding="utf-8") as f:
        json.dump(parties_data, f, indent=2, ensure_ascii=False)
    with open("public/data/trends.json", "w", encoding="utf-8") as f:
        json.dump(final_trends, f, indent=2, ensure_ascii=False)

    print("Aggregation complete. Wrote to public/data/*.json")

if __name__ == "__main__":
    aggregate()
