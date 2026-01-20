from playwright.sync_api import sync_playwright, expect

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Navigate to dashboard directly (assuming no auth guards as per memory)
        page.goto("http://localhost:5173/dashboard")

        # Wait for content to load
        expect(page.get_by_role("heading", name="全景监控")).to_be_visible()

        # Wait for charts to load (assuming they load somewhat quickly or empty state)
        page.wait_for_timeout(3000)

        # Take screenshot
        page.screenshot(path="verification.png", full_page=True)

        browser.close()

if __name__ == "__main__":
    run()
