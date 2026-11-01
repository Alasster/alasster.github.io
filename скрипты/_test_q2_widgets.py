import json
import sys
import urllib.parse

from playwright.sync_api import sync_playwright

BASE = 'http://127.0.0.1:8765/'


def url_for(folder, n):
    return BASE + urllib.parse.quote(f'{folder}/{n} урок.html')


CASES = [
    ('10 ЕМН/2 четверть', 4, 'recursion', {'n': 5, 'expect': '120'}),
    ('10 ЕМН/2 четверть', 5, 'recursion', {'n': 4721, 'expect': '14'}),
    ('10 ЕМН/2 четверть', 6, 'recursion', {'text': 'дом', 'expect': 'мод'}),
    ('10 ЕМН/2 четверть', 3, 'recursion', {'n': 4, 'expect': '4'}),
    ('10 ЕМН/2 четверть', 7, 'recursion', {'n': 3, 'expect': '3'}),
]


def run_case(browser, folder, n, kind, opts):
    context = browser.new_context(viewport={'width': 1440, 'height': 950})
    page = context.new_page()
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.on('console', lambda m: errors.append(m.text) if m.type == 'error' and 'onrender.com' not in m.text else None)
    page.goto(url_for(folder, n), wait_until='load')
    page.wait_for_timeout(600)
    out = {'page': f'{folder}/{n}', 'kind': kind}

    # найти слайд с виджетом
    widget = page.locator('#q2-root .q2-widget').first
    out['widgets_total'] = page.locator('#q2-root .q2-widget').count()

    # перейти на слайд, содержащий виджет
    idx = page.evaluate("""() => {
        const slides = [...document.querySelectorAll('#q2-root .slide')];
        return slides.findIndex(s => s.querySelector('.q2-widget'));
    }""")
    out['widget_slide'] = idx
    page.evaluate("""(i) => {
        const slides = [...document.querySelectorAll('#q2-root .slide')];
        slides.forEach((s, k) => s.classList.toggle('active', k === i));
    }""", idx)
    page.wait_for_timeout(200)

    lab = page.locator('#q2-root .slide.active .q2-widget').first
    if kind == 'recursion':
        inp = lab.locator('.q2-input').first
        inp.fill(str(opts.get('n', opts.get('text', ''))))
        lab.locator('[data-apply]').click()
        page.wait_for_timeout(200)
        out['counter'] = lab.locator('.q2-rec-counter').inner_text()
        steps = int(out['counter'].split('/')[-1].strip())
        for _ in range(steps):
            lab.locator('[data-next]').click()
        page.wait_for_timeout(150)
        out['result'] = lab.locator('.q2-rec-result').inner_text().replace('\n', ' ')
        out['expect'] = opts['expect']
        out['ok'] = opts['expect'] in out['result']
    out['errors'] = errors[:3]
    context.close()
    return out


def main():
    report = []
    with sync_playwright() as p:
        browser = p.chromium.launch(channel='msedge')
        for folder, n, kind, opts in CASES:
            report.append(run_case(browser, folder, n, kind, opts))
        browser.close()
    print(json.dumps(report, ensure_ascii=False, indent=1))


if __name__ == '__main__':
    main()
