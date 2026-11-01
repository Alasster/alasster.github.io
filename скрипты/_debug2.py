import json
import urllib.parse

from playwright.sync_api import sync_playwright

BASE = 'http://127.0.0.1:8765/'


def check(page, folder, n, value, expect):
    url = BASE + urllib.parse.quote(f'{folder}/{n} урок.html')
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.goto(url, wait_until='load')
    page.wait_for_timeout(700)
    idx = page.evaluate("""() => {
        const slides = [...document.querySelectorAll('#q2-root .slide')];
        return slides.findIndex(s => s.querySelector('.q2-rec-lab'));
    }""")
    page.evaluate("(i) => window.goToSlide && window.goToSlide(i)", idx)
    page.wait_for_timeout(400)
    lab = page.locator('#q2-root .q2-rec-lab').first
    inp = lab.locator('.q2-input').first
    inp.fill(str(value))
    lab.locator('[data-apply]').click()
    page.wait_for_timeout(200)
    counter = lab.locator('.q2-rec-counter').inner_text()
    total = int(counter.split('/')[-1].strip())
    for _ in range(total):
        lab.locator('[data-next]').click()
    page.wait_for_timeout(150)
    result = lab.locator('.q2-rec-result').inner_text().replace('\n', ' ')
    return {
        'lesson': f'{folder}/{n}',
        'slide': idx,
        'counter': counter,
        'result': result,
        'expect': expect,
        'ok': expect in result,
        'errors': errors[:3],
    }


with sync_playwright() as p:
    browser = p.chromium.launch(channel='msedge')
    page = browser.new_page(viewport={'width': 1440, 'height': 950})
    out = [
        check(page, '10 ЕМН/2 четверть', 2, 4, '24'),
        check(page, '10 ЕМН/2 четверть', 3, 4, '4'),
        check(page, '10 ЕМН/2 четверть', 4, 5, '120'),
        check(page, '10 ЕМН/2 четверть', 5, 4721, '14'),
        check(page, '10 ЕМН/2 четверть', 6, 'дом', 'мод'),
        check(page, '10 ЕМН/2 четверть', 7, 3, '6'),
    ]
    browser.close()
print(json.dumps(out, ensure_ascii=False, indent=1))
