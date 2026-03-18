import json
import os
import re
from playwright.sync_api import sync_playwright

def scrape_sessions():
    url = "https://www.parlament-berlin.de/dokumente/sitzungsuebersicht?Wahlperiode=19&Ausschuss=19-ausschuss-fur-digitalisierung-und-datenschutz"
    results = []

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto(url)
        
        # Wait for the table to render
        try:
            page.wait_for_selector("table", timeout=10000)
        except Exception as e:
            print("Timeout waiting for table:", e)
            browser.close()
            return
            
        rows = page.query_selector_all("table tr")
        for row in rows:
            text = row.inner_text()
            # Process sessions from 2025 and 2026
            if "2025" in text or "2026" in text:
                links = row.query_selector_all("a")
                pdf_urls = []
                for link in links:
                    href = link.get_attribute("href")
                    if href and ".pdf" in href.lower():
                        pdf_urls.append(href)
                
                if pdf_urls:
                    # Construct absolute URLs if needed
                    abs_urls = [u if u.startswith("http") else f"https://www.parlament-berlin.de{u}" for u in pdf_urls]
                    results.append({
                        "raw_text": text.strip(),
                        "pdfs": abs_urls
                    })
        
        browser.close()

    output_file = "scraped_links.json"
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
    
    print(f"Scraped {len(results)} sessions from 2025 and 2026. Saved to {output_file}.")

if __name__ == "__main__":
    scrape_sessions()
