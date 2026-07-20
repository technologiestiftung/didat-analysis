import time
from playwright.sync_api import sync_playwright

def inspect_pagination():
    url = "https://www.parlament-berlin.de/dokumente/sitzungsuebersicht?Wahlperiode=19&Ausschuss=19-ausschuss-fur-digitalisierung-und-datenschutz"
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto(url)
        page.wait_for_selector("table", timeout=10000)
        
        # Look for pagination elements
        pagination_links = page.query_selector_all(".pagination a, .pager a, a:has-text('Weiter'), a:has-text('Alle'), select[name*='limit']")
        
        print("Found pagination elements:")
        for link in pagination_links:
            try:
                print(f"- Text: '{link.inner_text()}', HTML: {link.evaluate('el => el.outerHTML')}")
            except:
                pass
                
        # Let's also print the whole HTML around the table to look for clues
        table_html = page.evaluate('() => { const t = document.querySelector("table"); return t ? t.parentElement.parentElement.outerHTML : "no table" }')
        
        with open("page_dump.html", "w") as f:
            f.write(table_html)
            
        browser.close()

if __name__ == "__main__":
    inspect_pagination()
