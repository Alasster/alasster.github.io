import json
import sys
import urllib.parse

from playwright.sync_api import sync_playwright

BASE = 'http://127.0.0.1:8765/'

GROUPS = [
    ('9 класс/2 четверть', 8, '9 класс'),
    ('10 ЕМН/2 четверть', 16, '10 ЕМН'),
    ('10 ОГН/2 четверть', 8, '10 ОГН'),
    ('11 класс/2 четверть', 8, '11 класс'),
]

IGNORE = ('onrender.com', 'CORS', 'Failed to load resource', 'net::ERR')


def url_for(folder, n):
    return BASE + urllib.parse.quote(f'{folder}/{n} урок.html')


def main():
    only = sys.argv[1] if len(sys.argv) > 1 else None
    report = []
    with sync_playwright() as p:
        browser = p.chromium.launch(channel='msedge')
        for folder, count, cls in GROUPS:
            if only and only not in folder:
                continue
            for n in range(1, count + 1):
                context = browser.new_context(viewport={'width': 1440, 'height': 950})
                page = context.new_page()
                errors = []
                page.on('console', lambda m, errors=errors: errors.append(m.text) if m.type == 'error' else None)
                page.on('pageerror', lambda e, errors=errors: errors.append('PAGEERROR ' + str(e)))
                page.goto(url_for(folder, n), wait_until='load')
                page.wait_for_timeout(700)
                slides = page.locator('#q2-root .slide').count()
                title = page.locator('#q2-root .q2-hero-title, #q2-root h1').first
                text = (title.inner_text() if title.count() else '').strip().replace('\n', ' ')
                dots = page.locator('#dots .dot, #dots button').count()
                widgets = page.locator('#q2-root .q2-widget').count()
                bad = [e for e in errors if not any(k in e for k in IGNORE)]
                report.append({
                    'cls': cls,
                    'n': n,
                    'slides': slides,
                    'dots': dots,
                    'widgets': widgets,
                    'title': text[:70],
                    'errors': bad[:4],
                })
                context.close()
        browser.close()
    print(json.dumps(report, ensure_ascii=False, indent=1))


if __name__ == '__main__':
    main()
