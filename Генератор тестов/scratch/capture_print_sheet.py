import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(channel="msedge", headless=True)
        context = await browser.new_context(viewport={"width": 1000, "height": 1400})
        page = await context.new_page()

        res = await page.request.post("http://127.0.0.1:8000/api/teacher/login", data={"username": "teacher", "password": "bagalau2026"})
        token = (await res.json())["token"]
        await context.add_cookies([{"name": "bagalau_teacher_session", "value": token, "domain": "127.0.0.1", "path": "/"}])

        await page.goto("http://127.0.0.1:8000/teacher")
        await page.wait_for_selector("#teacher-fullname")
        await page.click("button[data-tab='launches']")
        await page.wait_for_timeout(600)
        await page.click("#launches-table-body button:has-text('Мониторинг')")
        await page.wait_for_timeout(600)
        await page.click("button[data-subtab='tab-live-results']")
        await page.wait_for_timeout(800)

        # Intercept window.open
        async with context.expect_page() as new_page_info:
            await page.click("#grading-table-container button:has-text('Печать в PDF')")
        
        print_page = await new_page_info.value
        await print_page.wait_for_load_state("domcontentloaded")
        await print_page.wait_for_timeout(500)

        # Take screenshot of printable sheet
        await print_page.screenshot(path="scratch/printed_sheet_view.png")
        print("Printed sheet screenshot saved!")
        await browser.close()

if __name__ == "__main__":
    asyncio.run(run())
