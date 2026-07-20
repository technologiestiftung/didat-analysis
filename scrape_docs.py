import json
import os
import re
import time
from datetime import datetime
from playwright.sync_api import sync_playwright

def scrape_sessions():
    url = "https://www.parlament-berlin.de/dokumente/sitzungsuebersicht?Wahlperiode=19&Ausschuss=19-ausschuss-fur-digitalisierung-und-datenschutz"
    results = []

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto(url)
        
        try:
            page.wait_for_selector("table", timeout=10000)
            
            # Select "je 100 anzeigen" to load all records
            select_selector = "select[name='itemPerPage']"
            if page.locator(select_selector).count() > 0:
                print("Changing items per page to 100...")
                page.select_option(select_selector, value="100")
                time.sleep(3) # Wait for the table to reload
            else:
                print("Items per page dropdown not found, trying to scrape what's visible.")
                
        except Exception as e:
            print("Error waiting for table or interacting:", e)
            
        rows = page.query_selector_all("table tr")
        print(f"Found {len(rows)} rows in the table.")
        
        for row in rows:
            text = row.inner_text()
            # Process sessions from Feb 2023 to present
            if any(year in text for year in ["2023", "2024", "2025", "2026"]):
                match = re.search(r"(\d{1,2})\.(\d{1,2})\.(\d{4})", text)
                if match:
                    d, m, y = match.groups()
                    try:
                        # Fix the specific 2026 typo for the date filtering logic
                        year_int = int(y)
                        if year_int == 2026:
                            year_int = 2025
                            
                        session_date = datetime(year_int, int(m), int(d))
                        if session_date >= datetime(2023, 2, 12):
                            links = row.query_selector_all("a")
                            pdf_urls = []
                            for link in links:
                                href = link.get_attribute("href")
                                if href and ".pdf" in href.lower():
                                    pdf_urls.append(href)
                            
                            if pdf_urls:
                                # Construct absolute URLs if needed
                                abs_urls = [u if u.startswith("http") else f"https://www.parlament-berlin.de{u}" for u in pdf_urls]
                                
                                # Avoid duplicates if row appears multiple times for some reason
                                if not any(r["raw_text"] == text.strip() for r in results):
                                    results.append({
                                        "raw_text": text.strip(),
                                        "pdfs": abs_urls
                                    })
                    except ValueError:
                        pass

        browser.close()

    output_file = "scraped_links.json"
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
    
    print(f"Scraped {len(results)} unique sessions from Feb 2023 to present. Saved to {output_file}.")

if __name__ == "__main__":
    scrape_sessions()
