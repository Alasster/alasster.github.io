"""Scoped СОЧ/40-minute regression checks, without external service calls."""
import copy
import json
import re
import tempfile
import unittest
from pathlib import Path
from unittest.mock import Mock, patch

from docx import Document
import ksp_document
import ksp_service
from ksp_lesson_policy import (
    SOCH_STAGES, SOCH_DESCRIPTORS, SOR_STAGES, is_soch_lesson,
    normalize_soch_stages, normalize_lesson_timing, validate_soch_stages,
)
from test_ksp_sor import source, plan, QUOTE, BASE


def soch_source():
    data = source('СОЧ')
    data.update(class_name='10 ЕМН', key='10 ЕМН/2 четверть/15 урок.html')
    return data


def soch_plan():
    data = plan(False)
    data['stages'] = data['stages'][:3]
    data['stages'][1].update(
        teacher_actions='Раздаёт варианты СОЧ, наблюдает за самостоятельностью, собирает работы.',
        student_actions='Учащиеся самостоятельно выполняют задания СОЧ, проверяют и сдают работы.')
    return normalize_soch_stages(data, soch_source())


class SochTests(unittest.TestCase):
    def test_only_10emn_explicit_soch_is_selected(self):
        self.assertTrue(is_soch_lesson(soch_source()))
        for cls in ('9 класс', '10 ОГН', '11 класс'):
            self.assertFalse(is_soch_lesson({**soch_source(), 'class_name': cls}))
        self.assertFalse(is_soch_lesson({**soch_source(), 'title': 'Обычный урок', 'content': 'СОЧ'}))
        self.assertFalse(is_soch_lesson({**soch_source(), 'is_variative': True}))
        self.assertFalse(is_soch_lesson({**soch_source(), 'key': 'доп|lesson.html'}))

    def test_real_10emn_soch_pages_are_detected(self):
        for key in ('10 ЕМН/1 четверть/13 урок.html', '10 ЕМН/2 четверть/15 урок.html'):
            data = ksp_service.lesson_source(key)
            self.assertTrue(is_soch_lesson(data), data['title'])
            self.assertEqual(data['duration'], 40)
        sor = ksp_service.lesson_source('9 класс/1 четверть/7 урок.html')
        self.assertEqual(sor['assessment_type'], 'sor')
        self.assertIn('СОР', sor['title'])

    def test_three_stages_and_detailed_descriptors_are_required(self):
        good = soch_plan()
        validate_soch_stages(good)
        self.assertIn('самостоятельно выполняют задания СОЧ', good['stages'][1]['assessment'])
        self.assertIn('проверяют полноту', good['stages'][1]['assessment'])
        self.assertEqual(normalize_soch_stages(copy.deepcopy(good), soch_source()), good)
        for bad in (plan(), plan(False)):
            with self.assertRaises(ValueError):
                ksp_service.validate_plan(bad, soch_source())

    def test_all_four_lesson_types_have_40_minutes(self):
        cases = [(source('Обычный урок'), plan(False)),
                 (source(variative=True), plan(False)),
                 (source(), plan()), (soch_source(), soch_plan())]
        for data, content in cases:
            content = normalize_lesson_timing(content, data)
            names = [s['stage_name'] for s in content['stages']]
            self.assertEqual(sum(int(re.search(r'(\d+) мин', n)[1]) for n in names), 40)
        self.assertIn('(20 мин)', SOR_STAGES[1])

    def test_model_request_for_soch_is_isolated(self):
        before = copy.deepcopy(ksp_service.GEMINI_PLAN_SCHEMA)
        response = Mock(status_code=200)
        response.json.return_value = {'candidates': [{'content': {'parts': [{'text': json.dumps(soch_plan())}]}}]}
        client = Mock()
        client.post.return_value = response
        with patch.object(ksp_service, 'get_gemini_api_key', return_value='test-key'), \
             patch.object(ksp_service, 'get_weekly_quote', return_value=QUOTE), \
             patch.object(ksp_service.httpx, 'Client') as factory:
            factory.return_value.__enter__.return_value = client
            result = ksp_service.generate(soch_source())
        payload = client.post.call_args.kwargs['json']
        text = payload['contents'][0]['parts'][0]['text']
        self.assertIn('Ровно три этапа', text)
        self.assertIn('ЗА ЧЕТВЕРТЬ', text)
        self.assertIn('Всё основное время урока', text)
        self.assertEqual(payload['generationConfig']['responseSchema']['properties']['stages']['maxItems'], 3)
        self.assertEqual(before, ksp_service.GEMINI_PLAN_SCHEMA)
        self.assertEqual(tuple(s['stage_name'] for s in result['stages']), SOCH_STAGES)

    def test_real_docx_has_three_stages_without_practice_or_teaching(self):
        with tempfile.TemporaryDirectory() as temp:
            output = Path(temp) / 'soch.docx'
            with patch.object(ksp_document, 'get_lesson_slides_meta', return_value=[]), \
                 patch.object(ksp_document, 'capture_lesson_slides', return_value={}), \
                 patch.object(ksp_document, 'get_weekly_quote', return_value=QUOTE):
                ksp_document.build_docx(BASE / 'ksp_template.docx', output, soch_source(), soch_plan())
            rows = Document(output).tables[1].rows
            self.assertEqual(len(rows), 5)
            self.assertEqual(tuple(r.cells[0].text for r in rows[2:]), SOCH_STAGES)
            assessment = rows[3]
            self.assertIn('выполняют задания СОЧ', assessment.cells[2].text)
            self.assertIn('Дескрипторы выполнения СОЧ', assessment.cells[3].text)
            self.assertIn('за четверть', assessment.cells[4].text)
            self.assertFalse(assessment.cells[2]._tc.xpath('.//*[local-name()="pic"]'))
            text = '\n'.join(c.text for r in rows for c in r.cells)
            self.assertNotIn('АКТУАЛИЗАЦИЯ', text)
            self.assertNotIn('ОБЪЯСНЕНИЕ НОВОГО', text)
            self.assertNotIn('ПРАКТИЧЕСКАЯ РАБОТА', text)


if __name__ == '__main__':
    unittest.main()
