import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(channel="msedge", headless=True)
        context = await browser.new_context(viewport={"width": 1280, "height": 900})
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
        await page.click("#grading-table-container button:has-text('Просмотр')")
        await page.wait_for_timeout(800)

        # Scroll modal to find matching or classification table
        await page.evaluate("""() => {
            const el = document.getElementById('grade-modal-body');
            if (el) el.scrollTop = 2200;
        }""")
        await page.wait_for_timeout(500)
        await page.screenshot(path="scratch/modal_scroll_test.png")
        await browser.close()
        print("Scrolled modal screenshot saved successfully!")

if __name__ == "__main__":
    asyncio.run(run())
