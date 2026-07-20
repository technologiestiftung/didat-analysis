import json
import os
import fitz  # PyMuPDF
import requests
from io import BytesIO

def parse_pdfs():
    input_file = "scraped_links.json"
    if not os.path.exists(input_file):
        print(f"File {input_file} not found. Run scrape_docs.py first.")
        return

    with open(input_file, "r", encoding="utf-8") as f:
        sessions = json.load(f)

    parsed_data = []

    for session in sessions:
        session_texts = []
        for url in session.get("pdfs", []):
            try:
                print(f"Downloading {url}...")
                response = requests.get(url, timeout=10)
                response.raise_for_status()
                
                text = ""
                # Parse PDF from memory
                with fitz.open(stream=response.content, filetype="pdf") as doc:
                    for page in doc:
                        text += page.get_text() # type: ignore
                
                session_texts.append({
                    "url": url,
                    "text": text
                })
            except Exception as e:
                print(f"Error processing {url}: {e}")
                
        parsed_data.append({
            "session_raw": session["raw_text"],
            "documents": session_texts
        })

    output_file = "parsed_texts.json"
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(parsed_data, f, indent=2, ensure_ascii=False)
        
    print(f"Parsed {len(parsed_data)} sessions. Saved to {output_file}.")

if __name__ == "__main__":
    parse_pdfs()
