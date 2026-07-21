import hashlib
import json
import os
import time

import fitz  # PyMuPDF
import requests

from pipeline_utils import parse_session_number

CACHE_DIR = ".pdf_cache"
USER_AGENT = (
    "didat-analysis/1.0 (+https://github.com/technologiestiftung/didat-analysis; "
    "research pipeline)"
)
MAX_RETRIES = 3
RETRY_BACKOFF_SEC = 2


def _cache_path(url: str) -> str:
    digest = hashlib.sha1(url.encode("utf-8")).hexdigest()
    return os.path.join(CACHE_DIR, f"{digest}.pdf")


def download_pdf(url: str) -> bytes:
    os.makedirs(CACHE_DIR, exist_ok=True)
    path = _cache_path(url)
    if os.path.exists(path) and os.path.getsize(path) > 0:
        print(f"Cache hit {url}")
        with open(path, "rb") as f:
            return f.read()

    headers = {"User-Agent": USER_AGENT}
    last_error = None
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            print(f"Downloading {url} (attempt {attempt}/{MAX_RETRIES})...")
            response = requests.get(url, timeout=30, headers=headers)
            response.raise_for_status()
            content = response.content
            with open(path, "wb") as f:
                f.write(content)
            return content
        except Exception as e:
            last_error = e
            if attempt < MAX_RETRIES:
                time.sleep(RETRY_BACKOFF_SEC * attempt)

    raise RuntimeError(f"Failed to download {url}: {last_error}")


def extract_text(pdf_bytes: bytes) -> str:
    text = ""
    with fitz.open(stream=pdf_bytes, filetype="pdf") as doc:
        for page in doc:
            text += page.get_text()  # type: ignore
    return text


def parse_pdfs():
    input_file = "scraped_links.json"
    if not os.path.exists(input_file):
        print(f"File {input_file} not found. Run scrape_docs.py first.")
        return

    with open(input_file, "r", encoding="utf-8") as f:
        sessions = json.load(f)

    parsed_data = []

    for session in sessions:
        session_id = session.get("session_id") or parse_session_number(
            session.get("raw_text", "")
        )
        session_texts = []
        for url in session.get("pdfs", []):
            try:
                content = download_pdf(url)
                text = extract_text(content)
                if len(text.strip()) < 50:
                    print(
                        f"Warning: near-empty text extracted from {url} "
                        f"({len(text.strip())} chars). Possible scanned PDF."
                    )
                session_texts.append({"url": url, "text": text})
            except Exception as e:
                print(f"Error processing {url}: {e}")

        parsed_data.append(
            {
                "session_id": session_id,
                "date": session.get("date"),
                "session_raw": session["raw_text"],
                "documents": session_texts,
            }
        )

    output_file = "parsed_texts.json"
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(parsed_data, f, indent=2, ensure_ascii=False)

    print(f"Parsed {len(parsed_data)} sessions. Saved to {output_file}.")


if __name__ == "__main__":
    parse_pdfs()
