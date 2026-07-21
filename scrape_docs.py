import json
import time
from datetime import datetime

from playwright.sync_api import sync_playwright

from pipeline_utils import CUTOFF_DATE, parse_date_from_raw, parse_session_number


def scrape_sessions():
    url = (
        "https://www.parlament-berlin.de/dokumente/sitzungsuebersicht"
        "?Wahlperiode=19&Ausschuss=19-ausschuss-fur-digitalisierung-und-datenschutz"
    )
    results = []
    seen_ids = set()
    cutoff = datetime.strptime(CUTOFF_DATE, "%Y-%m-%d")

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto(url)

        try:
            page.wait_for_selector("table", timeout=10000)

            select_selector = "select[name='itemPerPage']"
            if page.locator(select_selector).count() > 0:
                print("Changing items per page to 100...")
                page.select_option(select_selector, value="100")
                time.sleep(3)
            else:
                print("Items per page dropdown not found, scraping visible rows.")
        except Exception as e:
            print("Error waiting for table or interacting:", e)

        rows = page.query_selector_all("table tr")
        print(f"Found {len(rows)} rows in the table.")

        for row in rows:
            text = row.inner_text().strip()
            session_number = parse_session_number(text)
            date_str = parse_date_from_raw(text)
            if not session_number or not date_str:
                continue

            try:
                session_date = datetime.strptime(date_str, "%Y-%m-%d")
            except ValueError:
                continue

            if session_date < cutoff:
                continue

            links = row.query_selector_all("a")
            pdf_urls = []
            for link in links:
                href = link.get_attribute("href")
                if href and ".pdf" in href.lower():
                    pdf_urls.append(
                        href
                        if href.startswith("http")
                        else f"https://www.parlament-berlin.de{href}"
                    )

            if not pdf_urls:
                continue

            if session_number in seen_ids:
                continue
            seen_ids.add(session_number)

            results.append(
                {
                    "session_id": session_number,
                    "date": date_str,
                    "raw_text": text,
                    "pdfs": pdf_urls,
                }
            )

        browser.close()

    # Newest first (matches previous scrape order)
    results.sort(key=lambda s: int(s["session_id"]), reverse=True)

    output_file = "scraped_links.json"
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2, ensure_ascii=False)

    print(
        f"Scraped {len(results)} unique sessions from {CUTOFF_DATE} to present. "
        f"Saved to {output_file}."
    )


if __name__ == "__main__":
    scrape_sessions()
