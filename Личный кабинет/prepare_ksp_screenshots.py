"""Pre-render screenshots of every lesson slide into ksp_screenshots/ (needs Chrome/Edge, run on the PC).

    python prepare_ksp_screenshots.py            # only missing screenshots
Then commit & push ksp_screenshots/ so the Render server can embed them into КСП.
"""
import sys
from pathlib import Path

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

BASE = Path(__file__).resolve().parent
ROOT = BASE.parent
sys.path.insert(0, str(BASE))

from ksp_document import capture_lesson_slides  # noqa: E402

for class_dir in ('9 класс', '10 ЕМН', '10 ОГН', '11 класс'):
    for html in sorted((ROOT / class_dir).rglob('*.html')):
        rel = html.relative_to(ROOT).as_posix()
        shots = capture_lesson_slides(rel)
        print(f"{rel}: {len([k for k in shots if isinstance(k, int)])} slides", flush=True)
