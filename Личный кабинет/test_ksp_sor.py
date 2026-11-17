"""SOR generation and real DOCX assembly; Google/Gemini/browser calls are mocked."""
import base64
import copy
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import Mock, patch

from docx import Document

import ksp_document
import ksp_service
from ksp_lesson_policy import SOR_STAGES, is_sor_lesson, normalize_sor_stages, normalize_lesson_timing

BASE = Path(__file__).resolve().parent
NORMAL_STAGES = (
    '1. ОРГ. МОМЕНТ (5 мин)',
    '2. АКТУАЛИЗАЦИЯ ЗНАНИЙ (5 мин)',
    '3. ОБЪЯСНЕНИЕ НОВОГО МАТЕРИАЛА (10 мин)',
    '4. ПРАКТИЧЕСКАЯ РАБОТА (15 мин)',
    '5. ПОДВЕДЕНИЕ ИТОГОВ УРОКА (5 мин)',
)
QUOTE = {'kz': 'Адал еңбек', 'ru': 'Честный труд'}


def source(title='СОР 2: Построение логических схем', variative=False):
    return dict(title=title, class_name='10 ОГН' if variative else '9 класс',
                is_variative=variative, key=('доп|' if variative else '') + 'lesson.html',
                lesson_path='lesson.html', quarter='2 четверть', number='7',
                section='Логические основы компьютера', date='17.11.2026',
                goals=['9.3.2.2 преобразовывать логические выражения в логические схемы и обратно'],
                content='Практическая работа: постройте схему для A ∧ B и проверьте её.')


def plan(sor=True):
    stages = [dict(stage_name=name, teacher_actions='Организует работу учащихся.',
                   student_actions='Выполняют задания по теме урока.',
                   assessment='Обратная связь по выполненной работе.', resources='Ресурсы урока.')
              for name in (SOR_STAGES if sor else NORMAL_STAGES)]
    if sor:
        stages[1].update(
            teacher_actions='Раздаёт утверждённые задания СОР. Наблюдает и собирает работы.',
            student_actions='Учащиеся самостоятельно выполняют задания СОР в течение 20 минут. Сдают работы.',
            assessment='После сбора работ учитель проверяет ответы по утверждённым критериям.')
    return dict(header=dict(school='Школа', teacher='Педагог', subject='Информатика',
                            section='Логические основы компьютера', date='17.11.2026',
                            grade='9 класс', theme='Построение логических схем',
                            curriculum_goal='9.3.2.2', lesson_goals='Построить логическую схему.',
                            values='Честность и самостоятельность.',
                            functional_literacy='Проверить условия доступа.',
                            ai_tools='Учитель готовит материалы до урока.'), stages=stages)


class SorPolicyTests(unittest.TestCase):
    def test_only_title_marks_main_lesson_as_sor(self):
        for title in ('СОР 2: Схемы', 'СОР №1. Схемы', 'Схемы. СОР№2', 'сор: Схемы'):
            with self.subTest(title=title):
                self.assertTrue(is_sor_lesson(source(title)))
        for title in ('Алгоритмы сортировки', 'СОРТИРОВКА', 'Построение схем', 'СОЧ 2'):
            data = source(title)
            data['content'] = 'Готовимся к СОР'
            self.assertFalse(is_sor_lesson(data))

    def test_dop_is_always_excluded(self):
        self.assertFalse(is_sor_lesson(source(variative=True)))
        data = source()
        data['key'] = 'доп|10 ОГН/2 четверть/7 урок.html'
        self.assertFalse(is_sor_lesson(data))

    def test_valid_sor_and_unchanged_normal_plans(self):
        ksp_service.validate_plan(plan(), source())
        original = plan(False)
        for data in (source('Обычный урок'), source(variative=True)):
            self.assertEqual(normalize_sor_stages(copy.deepcopy(original), data), original)
            ksp_service.validate_plan(copy.deepcopy(original), data)

    def test_invalid_sor_count_activity_and_timing_are_rejected(self):
        bad_plans = [plan(False)]
        no_time = plan()
        no_time['stages'][1]['student_actions'] = 'Самостоятельно выполняют задания СОР.'
        bad_plans.append(no_time)
        teaching = plan()
        teaching['stages'][1]['teacher_actions'] = 'Учитель объясняет новую тему.'
        bad_plans.append(teaching)
        wrong_order = plan()
        wrong_order['stages'].reverse()
        bad_plans.append(wrong_order)
        for bad in bad_plans:
            with self.subTest(bad=bad['stages'][0]['stage_name']):
                with self.assertRaises(ValueError):
                    ksp_service.validate_plan(bad, source())

    def test_ordinary_and_dop_cannot_accidentally_accept_four_stages(self):
        for data in (source('Обычный урок'), source(variative=True)):
            with self.assertRaises(ValueError):
                ksp_service.validate_plan(plan(), data)

    def test_generation_sor_branch_and_schema_do_not_leak(self):
        schema_before = copy.deepcopy(ksp_service.GEMINI_PLAN_SCHEMA)
        for data in (source(), source('Обычный урок'), source(variative=True)):
            sor = is_sor_lesson(data)
            expected = normalize_lesson_timing(plan(sor), data)
            response = Mock(status_code=200)
            response.json.return_value = {'candidates': [{'content': {'parts': [{'text': json.dumps(expected)}]}}]}
            client = Mock()
            client.post.return_value = response
            with patch.object(ksp_service, 'get_gemini_api_key', return_value='test-key'), \
                 patch.object(ksp_service, 'get_weekly_quote', return_value=QUOTE), \
                 patch.object(ksp_service.httpx, 'Client') as factory:
                factory.return_value.__enter__.return_value = client
                result = ksp_service.generate(data)
            self.assertEqual(result, expected)
            payload = client.post.call_args.kwargs['json']
            instructions = payload['contents'][0]['parts'][0]['text']
            schema = payload['generationConfig']['responseSchema']
            if sor:
                self.assertIn('Ровно четыре этапа', instructions)
                self.assertIn('самостоятельно выполняют задания СОР в течение 20 минут', instructions)
                self.assertEqual(schema['properties']['stages']['maxItems'], 4)
            else:
                self.assertNotIn('maxItems', schema['properties']['stages'])
                self.assertIn('5 ЭТАПОВ', instructions)
            self.assertEqual(ksp_service.GEMINI_PLAN_SCHEMA, schema_before)


class SorDocumentTests(unittest.TestCase):
    def test_invalid_sor_plan_does_not_overwrite_existing_document(self):
        with tempfile.TemporaryDirectory() as temp:
            target = Path(temp) / 'existing.docx'
            target.write_bytes(b'existing KSP stays intact')
            with self.assertRaises(ValueError):
                ksp_document.build_docx(BASE / 'ksp_template.docx', target, source(), plan(False))
            self.assertEqual(target.read_bytes(), b'existing KSP stays intact')

    def test_real_template_has_four_sor_rows_but_five_for_normal_and_dop(self):
        # A real tiny PNG exercises image embedding without launching a browser.
        png = base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=')
        with tempfile.TemporaryDirectory() as temp:
            folder = Path(temp)
            image = folder / 'slide.png'
            image.write_bytes(png)
            metadata = [{'index': i, 'title': f'Раздел {i+1}'} for i in range(7)]
            for index, data in enumerate((source(), source('Обычный урок'), source(variative=True))):
                sor = is_sor_lesson(data)
                target = folder / f'case-{index}.docx'
                expected = plan(sor)
                with patch.object(ksp_document, 'get_lesson_slides_meta', return_value=metadata), \
                     patch.object(ksp_document, 'capture_lesson_slides', return_value={i: str(image) for i in range(7)}), \
                     patch.object(ksp_document, 'get_weekly_quote', return_value=QUOTE):
                    ksp_document.build_docx(BASE / 'ksp_template.docx', target, data, expected)
                doc = Document(target)
                rows = doc.tables[1].rows
                self.assertEqual(len(rows), 6 if sor else 7)
                labels = [row.cells[0].text for row in rows[2:]]
                self.assertEqual(labels, list(SOR_STAGES if sor else NORMAL_STAGES))
                if sor:
                    assessment = rows[3]
                    self.assertIn('20 минут', assessment.cells[2].text)
                    self.assertIn('Утверждённые задания СОР', assessment.cells[4].text)
                    self.assertNotIn('alasster.site', assessment.cells[4].text)
                    self.assertFalse(assessment.cells[2]._tc.xpath('.//*[local-name()="pic"]'))
                    self.assertTrue(rows[4].cells[2]._tc.xpath('.//*[local-name()="pic"]'))
                    self.assertNotIn('Объяснение', '\n'.join(cell.text for cell in assessment.cells))
                    self.assertIn('Нравственный вывод', rows[5].cells[1].text)
                else:
                    self.assertIn('АКТУАЛИЗАЦИЯ', rows[3].cells[0].text)
                    self.assertIn('ОБЪЯСНЕНИЕ', rows[4].cells[0].text)


if __name__ == '__main__':
    unittest.main()
