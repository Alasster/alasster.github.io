import json
import urllib.parse

from playwright.sync_api import sync_playwright

BASE = 'http://127.0.0.1:8765/'
url = BASE + urllib.parse.quote('10 ЕМН/2 четверть/4 урок.html')

with sync_playwright() as p:
    browser = p.chromium.launch(channel='msedge')
    page = browser.new_page(viewport={'width': 1440, 'height': 950})
    page.goto(url, wait_until='load')
    page.wait_for_timeout(800)
    info = page.evaluate("""() => {
        const slides = [...document.querySelectorAll('#q2-root .slide')];
        return slides.map((s, i) => ({
            i,
            active: s.classList.contains('active'),
            cls: s.className,
            widgets: [...s.querySelectorAll('.q2-widget')].map(w => w.className + ' :: ' + (w.querySelector('.q2-input') ? 'has-input' : 'no-input')),
            display: getComputedStyle(s).display,
        }));
    }""")
    print(json.dumps(info, ensure_ascii=False, indent=1))
    browser.close()
