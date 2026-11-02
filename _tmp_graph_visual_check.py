import json
import urllib.parse

from playwright.sync_api import sync_playwright


url = "http://127.0.0.1:8765/" + urllib.parse.quote(
    "11 класс/2 четверть/1 урок.html"
)

with sync_playwright() as p:
    browser = p.chromium.launch(channel="msedge")
    context = browser.new_context(
        viewport={"width": 1440, "height": 950}, reduced_motion="reduce"
    )
    page = context.new_page()
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.goto(url, wait_until="load")
    page.wait_for_timeout(300)
    first = page.eval_on_selector(
        ".q2-scene-edge-flow",
        "el => getComputedStyle(el).strokeDashoffset",
    )
    page.wait_for_timeout(800)
    second = page.eval_on_selector(
        ".q2-scene-edge-flow",
        "el => getComputedStyle(el).strokeDashoffset",
    )
    card = page.eval_on_selector(
        ".q2-hero-slide .q2-visual",
        """el => ({
            color: getComputedStyle(el).backgroundColor,
            image: getComputedStyle(el).backgroundImage
        })""",
    )
    page.locator(".q2-hero-slide .q2-visual").screenshot(
        path="C:/Users/stron/.codex/visualizations/2026/11/02/01a19beb-7a18-78c0-8f18-21877bd8f820/graph-card.png"
    )
    page.evaluate("window.goToSlide(1)")
    page.wait_for_timeout(250)
    second_slide_svg = page.locator(".q2-slide:nth-of-type(2) .q2-svg-wrap svg")
    second_box = second_slide_svg.bounding_box()
    second_slide_svg.locator("xpath=..").screenshot(
        path="C:/Users/stron/.codex/visualizations/2026/11/02/01a19beb-7a18-78c0-8f18-21877bd8f820/graph-slide-2-before.png"
    )
    print(json.dumps({"card": card, "animation_changed": first != second, "second_box": second_box, "errors": errors}, ensure_ascii=False))
    context.close()
    browser.close()
