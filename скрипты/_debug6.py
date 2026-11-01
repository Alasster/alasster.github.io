import json
import urllib.parse

from playwright.sync_api import sync_playwright

BASE = 'http://127.0.0.1:8765/'
url = BASE + urllib.parse.quote('10 ЕМН/2 четверть/4 урок.html')


def active(page):
    return page.evaluate("() => [...document.querySelectorAll('#q2-root .slide')].findIndex(s=>s.classList.contains('active'))")


with sync_playwright() as p:
    browser = p.chromium.launch(channel='msedge')
    page = browser.new_page(viewport={'width': 1440, 'height': 950})
    page.goto(url, wait_until='load')
    page.wait_for_timeout(800)
    idx = page.evaluate("""() => {
        const slides = [...document.querySelectorAll('#q2-root .slide')];
        return slides.findIndex(s => s.querySelector('.q2-rec-lab'));
    }""")
    page.evaluate("(i) => window.goToSlide && window.goToSlide(i)", idx)
    page.wait_for_timeout(500)
    lab = page.locator('#q2-root .q2-rec-lab').first
    lab.locator('.q2-input').first.fill('5')
    print('after fill', active(page))
    lab.locator('[data-apply]').click()
    page.wait_for_timeout(300)
    print('after apply', active(page), lab.locator('.q2-rec-counter').inner_text())
    try:
        lab.locator('[data-next]').click(timeout=3000)
        print('next clicked', active(page), lab.locator('.q2-rec-counter').inner_text())
    except Exception as exc:
        print('next failed', str(exc)[:400])
        print('active now', active(page))
        print(page.evaluate("""() => {
            const btn = document.querySelector('#q2-root .q2-rec-lab [data-next]');
            const r = btn.getBoundingClientRect();
            const el = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
            return { rect: r.toJSON(), hit: el ? el.tagName + '.' + el.className : null, disabled: btn.disabled };
        }"""))
    browser.close()
