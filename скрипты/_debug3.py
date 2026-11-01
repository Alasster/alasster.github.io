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
    page.evaluate("""() => {
        const slides = [...document.querySelectorAll('#q2-root .slide')];
        const i = slides.findIndex(s => s.querySelector('.q2-rec-lab'));
        window.goToSlide && window.goToSlide(i);
    }""")
    page.wait_for_timeout(500)
    info = page.evaluate("""() => {
        const lab = document.querySelector('#q2-root .q2-rec-lab');
        const btn = lab.querySelector('[data-next]');
        const chain = [];
        let node = btn;
        while (node && node !== document.documentElement) {
            const cs = getComputedStyle(node);
            chain.push({
                tag: node.tagName + '.' + (node.className || ''),
                display: cs.display,
                visibility: cs.visibility,
                opacity: cs.opacity,
                rect: node.getBoundingClientRect().toJSON(),
            });
            node = node.parentElement;
        }
        return chain;
    }""")
    print(json.dumps(info, ensure_ascii=False, indent=1))
    browser.close()
