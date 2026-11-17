"""Isolated regression checks; no Google credentials or document generation required."""
import ast
import re
import tempfile
import json
import time
import os
import shutil
import hashlib
import sqlite3
import uuid
from types import SimpleNamespace
import unittest
from pathlib import Path
from unittest.mock import Mock

BASE = Path(__file__).resolve().parent


def load_functions(filename, names, namespace):
    tree = ast.parse((BASE / filename).read_text(encoding='utf-8-sig'))
    selected = [node for node in tree.body if isinstance(node, ast.FunctionDef) and node.name in names]
    exec(compile(ast.Module(body=selected, type_ignores=[]), filename, 'exec'), namespace)
    return namespace


class KspRegressions(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.source = dict(number=2, title='New title', class_name='10 OGN', quarter='Q2')
        self.ns = load_functions('ksp_service.py', {'safe_name', 'output_path'}, {'Path': Path, 're': re})

    def test_renamed_lesson_reuses_existing_file(self):
        old = self.ns['output_path']({**self.source, 'title': 'Old title'}, self.root)
        old.parent.mkdir(parents=True)
        old.write_bytes(b'existing document')
        self.assertEqual(self.ns['output_path'](self.source, self.root), old)

    def test_ambiguous_files_do_not_choose_arbitrarily(self):
        target = self.ns['output_path'](self.source, self.root)
        target.parent.mkdir(parents=True)
        for title in ('Old title', 'Another title'):
            # Construct independent names before placing either candidate on disk.
            name = target.name.replace('New title', title)
            (target.parent / name).write_bytes(b'document')
        self.assertEqual(self.ns['output_path'](self.source, self.root), target)

    def test_other_quarters_and_variants_are_separate(self):
        old = self.ns['output_path']({**self.source, 'quarter': 'Q1'}, self.root)
        old.parent.mkdir(parents=True)
        old.write_bytes(b'other quarter')
        target = self.ns['output_path'](self.source, self.root)
        self.assertNotEqual(target, old)
        self.assertNotEqual(self.ns['output_path']({**self.source, 'is_variative': True}, self.root), target)

    def test_screenshot_directory_removed_after_success_and_failure(self):
        seen = []

        def build(*args):
            folder = Path(args[-1])
            seen.append(folder)
            (folder / 'screenshot.png').write_bytes(b'new shot')
            if len(seen) == 2:
                raise ValueError('Simulated document failure')
            return 'saved.docx'

        ns = load_functions('ksp_document.py', {'build_docx'},
                            {'Path': Path, 'tempfile': tempfile, '_build_docx': build})
        self.assertEqual(ns['build_docx']('template', 'target', {}, {}), 'saved.docx')
        with self.assertRaises(ValueError):
            ns['build_docx']('template', 'target', {}, {})
        self.assertNotEqual(seen[0], seen[1])
        self.assertTrue(all(not folder.exists() for folder in seen))

    def test_lesson_scan_uses_relative_class_name(self):
        for cls in ('Python основы', '10 ОГН'):
            folder = self.root / cls / 'Q2'
            folder.mkdir(parents=True)
            (folder / '2 урок.html').write_text('lesson', encoding='utf-8')
        tree = ast.parse((BASE / 'ksp_service.py').read_text(encoding='utf-8-sig'))
        service = next(n for n in tree.body if isinstance(n, ast.ClassDef) and n.name == 'KspService')
        method = next(n for n in service.body if isinstance(n, ast.FunctionDef) and n.name == '_all_lesson_keys')
        ns = {'ROOT': self.root, 'BASE': self.root, 'set': set}
        exec(compile(ast.Module(body=[method], type_ignores=[]), 'scan', 'exec'), ns)
        keys = ns['_all_lesson_keys'](None)
        self.assertEqual(keys, {'10 ОГН/Q2/2 урок.html', 'доп|10 ОГН/Q2/2 урок.html'})

    def test_cloud_upload_updates_renamed_file_instead_of_creating_duplicate(self):
        tree = ast.parse((BASE / 'ksp_drive.py').read_text(encoding='utf-8-sig'))
        client_class = next(n for n in tree.body if isinstance(n, ast.ClassDef) and n.name == 'DriveClient')
        ns = {'json': json, 'time': time, 'API': 'api', 'UPLOAD': 'upload',
              'GDOC_MIME': 'gdoc', 'DOCX_MIME': 'docx', '_oauth_configured': lambda: True}
        exec(compile(ast.Module(body=[client_class], type_ignores=[]), 'drive', 'exec'), ns)
        client = object.__new__(ns['DriveClient'])
        client.ensure_path = Mock(return_value='quarter-folder')
        client._find = Mock(return_value=None)
        client._list_files = Mock(return_value=[{'id': 'existing-id', 'name': 'Урок 02 КСП — Old.docx'}])
        client._req = Mock(return_value=Mock(json=lambda: {'id': 'existing-id'}))
        doc = self.root / 'new.docx'
        doc.write_bytes(b'current document contents')
        self.assertEqual(client.upload_docx_as_gdoc(doc, ['10 OGN', 'Q2'], 'Урок 02 КСП — New'), 'existing-id')
        args, kwargs = client._req.call_args
        self.assertEqual(args[0], 'PATCH')
        self.assertIn('existing-id', args[1])
        self.assertIn(b'current document contents', kwargs['content'])

    def test_screenshots_render_current_source_on_each_build(self):
        lesson = self.root / 'lesson.html'
        lesson.write_text('<head></head><body>Version one</body>', encoding='utf-8')
        rendered = []

        def render(cmd, **kwargs):
            from urllib.parse import urlparse, unquote
            html_path = unquote(urlparse(cmd[-1]).path)
            if os.name == 'nt':
                html_path = html_path.lstrip('/')
            rendered.append(Path(html_path).read_text(encoding='utf-8'))
            output = next(arg.split('=', 1)[1] for arg in cmd if arg.startswith('--screenshot='))
            Path(output).write_bytes(b'new image' * 200)

        fake_os = SimpleNamespace(path=SimpleNamespace(exists=lambda _: True, isdir=os.path.isdir))
        ns = load_functions('ksp_document.py', {'capture_lesson_slides'}, {
            'Path': Path, 'ROOT': self.root, 'os': fake_os, 're': re, 'tempfile': tempfile,
            'hashlib': hashlib, 'shutil': shutil, 'subprocess': SimpleNamespace(run=render),
            '_normalize_lesson_rel_path': lambda p: p,
            'get_lesson_slides_meta': lambda _: [{'index': 0, 'title': 'Current slide'}],
        })
        for i, text in enumerate(('Version one', 'Version two')):
            lesson.write_text(f'<head></head><body>{text}</body>', encoding='utf-8')
            shots = ns['capture_lesson_slides']('lesson.html', output_dir=self.root / f'build-{i}')
            self.assertTrue(Path(shots[0]).is_file())
            self.assertIn(text, rendered[-1])
        self.assertEqual(len(rendered), 2)

    def test_cloud_sync_marks_renamed_document_ready(self):
        tree = ast.parse((BASE / 'ksp_service.py').read_text(encoding='utf-8-sig'))
        service = next(n for n in tree.body if isinstance(n, ast.ClassDef) and n.name == 'KspService')
        method = next(n for n in service.body if isinstance(n, ast.FunctionDef) and n.name == 'sync_cloud')
        source = {**self.source, 'source_hash': 'current'}
        title = self.ns['output_path'](source, self.root).stem
        old_title = title.replace('New title', 'Old title')
        index = {(source['class_name'], source['quarter'], old_title): 'drive-document'}
        db = sqlite3.connect(':memory:')
        self.addCleanup(db.close)
        db.row_factory = sqlite3.Row
        db.execute('CREATE TABLE jobs (key TEXT PRIMARY KEY, id TEXT, status TEXT, message TEXT, path TEXT, source_hash TEXT)')
        obj = SimpleNamespace(_index_ts=0, _last_upload_ts=0, drive=SimpleNamespace(index_docs=lambda: index),
                              output_root=self.root, _all_lesson_keys=lambda: {'lesson-key'}, db=lambda: db)
        ns = {**self.ns, 'lesson_source': lambda _: source, 'uuid': uuid}
        exec(compile(ast.Module(body=[method], type_ignores=[]), 'sync', 'exec'), ns)
        ns['sync_cloud'](obj)
        row = db.execute('SELECT status,path FROM jobs WHERE key=?', ('lesson-key',)).fetchone()
        self.assertIsNotNone(row)
        self.assertEqual(tuple(row), ('ready', 'gdrive:drive-document'))
        for status in ('generating', 'error'):
            db.execute("UPDATE jobs SET status=?, message='Generation did not finish'", (status,))
            ns['sync_cloud'](obj, max_age=0)
            row = db.execute('SELECT status,message FROM jobs').fetchone()
            self.assertEqual(tuple(row), (status, 'Generation did not finish'))


if __name__ == '__main__':
    unittest.main()
