import json
import urllib.parse

from playwright.sync_api import sync_playwright

BASE = 'http://127.0.0.1:8765/'
url = BASE + urllib.parse.quote('10 ЕМН/2 четверть/4 урок.html')

with sync_playwright() as p:
    browser = p.chromium.launch(channel='msedge')
    page = browser.new_page(viewport={'width': 1440, 'height': 950})
    page.goto(url, wait_until='load')
    page.wait_for_timeout(900)
    print('after load', page.evaluate("() => [...document.querySelectorAll('#q2-root .slide')].findIndex(s=>s.classList.contains('active'))"))
    page.evaluate("() => window.goToSlide(3)")
    page.wait_for_timeout(600)
    print('after goto', page.evaluate("() => [...document.querySelectorAll('#q2-root .slide')].findIndex(s=>s.classList.contains('active'))"))
    lab = page.locator('#q2-root .q2-rec-lab').first
    box = lab.locator('[data-apply]').bounding_box()
    print('apply box', box)
    print('elementFromPoint', page.evaluate("""([x, y]) => {
        const el = document.elementFromPoint(x, y);
        return el ? el.tagName + '.' + el.className : null;
    }""", [box['x'] + box['width'] / 2, box['y'] + box['height'] / 2]))
    lab.locator('[data-apply]').click()
    page.wait_for_timeout(300)
    print('after apply', page.evaluate("() => [...document.querySelectorAll('#q2-root .slide')].findIndex(s=>s.classList.contains('active'))"))
    print('counter', lab.locator('.q2-rec-counter').inner_text())
    box2 = lab.locator('[data-next]').bounding_box()
    print('next box', box2)
    print('elementFromPoint next', page.evaluate("""([x, y]) => {
        const el = document.elementFromPoint(x, y);
        return el ? el.tagName + '.' + el.className : null;
    }""", [box2['x'] + box2['width'] / 2, box2['y'] + box2['height'] / 2]))
    browser.close()
