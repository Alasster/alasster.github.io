"""Pre-render crisp screenshots of every lesson slide into ksp_screenshots/ (needs Chrome/Edge, run on the PC).

    python prepare_ksp_screenshots.py
Then commit & push ksp_screenshots/ so the Render server can embed them into КСП.
"""
import sys, re, os, glob, hashlib
from pathlib import Path

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

BASE = Path(__file__).resolve().parent
ROOT = BASE.parent
sys.path.insert(0, str(BASE))

from ksp_document import capture_lesson_slides, get_lesson_slides_meta, SCREENSHOTS_DIR  # noqa: E402

print("=== STARTING FULL SCREENSHOT GENERATION ===", flush=True)

# 1. First, re-render all 2nd quarter lessons with fresh dynamic rendering
total_rendered = 0
for class_dir in ('9 класс', '10 ЕМН', '10 ОГН', '11 класс'):
    q2_dir = ROOT / class_dir / '2 четверть'
    if not q2_dir.is_dir():
        continue
    for html in sorted(q2_dir.glob('*.html')):
        rel = html.relative_to(ROOT).as_posix()
        h_hash = hashlib.md5(rel.encode('utf-8')).hexdigest()[:10]
        meta = get_lesson_slides_meta(rel)
        total_meta = len(meta)

        # Remove any old orphaned slides with higher index than total_meta
        for old_file in SCREENSHOTS_DIR.glob(f'slide_{h_hash}_s*.png'):
            m_s = re.search(r'_s(\d+)\.png$', old_file.name)
            if m_s and int(m_s.group(1)) >= total_meta:
                old_file.unlink(missing_ok=True)

        shots = capture_lesson_slides(rel, force_rebuild=True)
        int_shots = [k for k in shots if isinstance(k, int)]
        print(f"[Q2] {rel}: {len(int_shots)}/{total_meta} slides captured", flush=True)
        total_rendered += len(int_shots)

# 2. Check 1st quarter lessons (capture any missing)
for class_dir in ('9 класс', '10 ЕМН', '10 ОГН', '11 класс'):
    q1_dir = ROOT / class_dir / '1 четверть'
    if not q1_dir.is_dir():
        continue
    for html in sorted(q1_dir.glob('*.html')):
        rel = html.relative_to(ROOT).as_posix()
        shots = capture_lesson_slides(rel, force_rebuild=False)
        int_shots = [k for k in shots if isinstance(k, int)]
        print(f"[Q1] {rel}: {len(int_shots)} slides ready", flush=True)

print(f"=== FINISHED! Total Q2 slides freshly rendered: {total_rendered} ===", flush=True)
