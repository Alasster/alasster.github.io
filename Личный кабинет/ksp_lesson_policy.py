"""Rules specific to main-course lessons explicitly marked as СОР."""
import re


SOR_STAGES = (
    '1. ОРГ. МОМЕНТ (5 мин)',
    '2. СУММАТИВНОЕ ОЦЕНИВАНИЕ ЗА РАЗДЕЛ (20 мин)',
    '3. ПРАКТИЧЕСКАЯ РАБОТА (10 мин)',
    '4. ПОДВЕДЕНИЕ ИТОГОВ УРОКА (5 мин)',
)

SOCH_STAGES = (
    '1. ОРГ. МОМЕНТ (2 мин)',
    '2. СУММАТИВНОЕ ОЦЕНИВАНИЕ ЗА ЧЕТВЕРТЬ (36 мин)',
    '3. ПОДВЕДЕНИЕ ИТОГОВ УРОКА (2 мин)',
)

SOCH_DESCRIPTORS = ('**Дескрипторы выполнения СОЧ:**\n'
    '— учащиеся самостоятельно выполняют задания СОЧ по изученным за четверть целям;\n'
    '— читают условия и последовательно выполняют все задания своего варианта;\n'
    '— записывают ход решения и обосновывают ответы там, где это требуется;\n'
    '— проверяют полноту и правильность записей, оформляют и вовремя сдают работу.\n'
    'Учитель проверяет собранные работы по утверждённым критериям и дескрипторам СОЧ.')


def is_soch_lesson(source: dict) -> bool:
    if source.get('class_name') != '10 ЕМН':
        return False
    if source.get('is_variative') or str(source.get('key', '')).startswith('доп|'):
        return False
    return source.get('assessment_type') == 'soch' or bool(re.search(r'(?<!\w)СОЧ(?!\w)', str(source.get('title', '')), re.I))


def normalize_lesson_timing(plan: dict, source: dict) -> dict:
    if is_sor_lesson(source) or is_soch_lesson(source) or len(plan.get('stages', [])) != 5:
        return plan
    durations = (5, 5, 5, 20, 5) if source.get('is_variative') else (5, 5, 10, 15, 5)
    for stage, minutes in zip(plan['stages'], durations):
        name = stage.get('stage_name', '')
        name, count = re.subn(r'\b\d+\s*мин(?:ут[аы]?)?\b', f'{minutes} мин', name, count=1, flags=re.I)
        stage['stage_name'] = name if count else f'{name} ({minutes} мин)'
    return plan


def normalize_soch_stages(plan: dict, source: dict) -> dict:
    if is_soch_lesson(source) and len(plan.get('stages', [])) == 3:
        for stage, name in zip(plan['stages'], SOCH_STAGES):
            stage['stage_name'] = name
        stage = plan['stages'][1]
        if SOCH_DESCRIPTORS not in stage.get('assessment', ''):
            stage['assessment'] = (stage.get('assessment', '') + '\n\n' + SOCH_DESCRIPTORS).strip()
    return plan


def validate_soch_stages(plan: dict):
    stages = plan.get('stages', [])
    if len(stages) != 3 or tuple(s.get('stage_name') for s in stages) != SOCH_STAGES:
        raise ValueError('КСП СОЧ для 10 ЕМН должен содержать три этапа в установленном порядке')
    students = stages[1].get('student_actions', '')
    if not (re.search(r'самостоятельн|индивидуальн', students, re.I)
            and re.search(r'выполн|выполня', students, re.I)
            and re.search(r'СОЧ|суммативн', students, re.I)):
        raise ValueError('В основном этапе учащиеся самостоятельно выполняют задания СОЧ')
    if SOCH_DESCRIPTORS not in stages[1].get('assessment', ''):
        raise ValueError('Не заполнены дескрипторы выполнения СОЧ')
    if any(re.search(r'актуализация|объяснение|практическая работа', s['stage_name'], re.I) for s in stages):
        raise ValueError('Урок СОЧ не содержит этапов изучения материала или практической работы')


def soch_instructions(source: dict, teacher: str, school: str, quote: dict) -> str:
    stages = '\n'.join(SOCH_STAGES)
    return f"""Составь подробный КСП основного курса информатики 10 ЕМН в JSON: header и stages.
Это СОЧ — СУММАТИВНОЕ ОЦЕНИВАНИЕ ЗА ЧЕТВЕРТЬ. Не называй его оцениванием за раздел.
Учитывай распределение времени ниже; не добавляй в документ отдельную строку о длительности урока.
Ровно три этапа, stage_name строго:
{stages}
1. Орг. момент: приветствие, готовность, раздача утверждённых вариантов и бланков,
краткий инструктаж о заполнении работы, самостоятельности и академической честности.
2. Всё основное время урока учащиеся индивидуально и самостоятельно выполняют задания СОЧ
по целям изученной четверти. Читают условия, распределяют время, выполняют задания своего варианта,
записывают решения и ответы, обосновывают их, проверяют полноту работы. Учитель фиксирует время,
наблюдает за самостоятельностью, отвечает только на организационные вопросы, собирает работы.
Никаких разминок, объяснения новой темы, подсказок, совместных решений, взаимопроверки,
дополнительной практики, ответов с платформы или использования ИИ учащимися во время СОЧ.
3. Итоги: организованная сдача работ, проверка комплектности бланков, сообщение о сроках
обратной связи после проверки. Не объявляй непроверенные оценки и не разбирай ответы СОЧ.
Не придумывай задания СОЧ, ключи и баллы. Пиши «утверждённые задания СОЧ за четверть».
В assessment основного этапа подробно опиши критерии и дескрипторы выполнения СОЧ:
самостоятельность, полнота заданий, ход решения и обоснования, самопроверка, оформление и сдача.
Проверка и баллы — только по утверждённым критериям после сбора работ.
Ресурсы: утверждённые варианты СОЧ, бланки ответов, критерии и дескрипторы учителя.
Без скриншотов теории, учебных подсказок и материалов с готовыми ответами.
Каждый этап: stage_name, teacher_actions, student_actions, assessment, resources.
Действия учителя и учащихся распиши подробно, по абзацам с маркерами **Название:**.
header: school, section, teacher, subject, date, grade, theme, curriculum_goal, lesson_goals,
values, functional_literacy, ai_tools. Цели обучения сохрани точно.
Ценности: честность и ответственность; цитата недели {quote['kz']} ({quote['ru']}) уместна
только в организационной части и не прерывает работу. ИИ — только подготовка учителя до урока.
Не добавляй блоки об особых образовательных потребностях, интерактивную доску или ноутбуки.
Школа: {school}. Учитель: {teacher}. Предмет: {source.get('subject') or 'Информатика'}.
Класс: {source.get('grade_label') or source['class_name']}. Дата: {source['date']}.
Раздел: {source['section']}. Тема: {source['title']}. Урок {source['number']}.
Цели: {' '.join(source['goals'])}
Материалы для определения содержания четверти, не для обучения во время СОЧ:
{source['content'][:25000]}
"""


def is_sor_lesson(source: dict) -> bool:
    # The Доп button keeps its existing five-stage variative-course plan,
    # even when the corresponding main lesson has СОР in its title.
    if source.get('is_variative') or str(source.get('key', '')).startswith('доп|'):
        return False
    if source.get('assessment_type') == 'soch':
        return False
    if source.get('assessment_type') == 'sor':
        return True
    return bool(re.search(r'(?<!\w)СОР(?!\w)', str(source.get('title', '')), re.I))


def normalize_sor_stages(plan: dict, source: dict) -> dict:
    if is_sor_lesson(source) and len(plan.get('stages', [])) == 4:
        for stage, name in zip(plan['stages'], SOR_STAGES):
            stage['stage_name'] = name
    return plan


def validate_sor_stages(plan: dict):
    stages = plan.get('stages', [])
    if len(stages) != 4:
        raise ValueError('КСП урока СОР должен содержать четыре этапа в установленном порядке')
    if tuple(stage.get('stage_name') for stage in stages) != SOR_STAGES:
        raise ValueError('Нарушены порядок или длительность четырёх этапов урока СОР')
    students = stages[1].get('student_actions', '')
    if not (re.search(r'самостоятельн|индивидуальн', students, re.I)
            and re.search(r'выполн|выполня', students, re.I)
            and re.search(r'СОР|суммативн', students, re.I)
            and re.search(r'20\s*мин', students, re.I)):
        raise ValueError('На этапе СОР учащиеся должны самостоятельно выполнять задания СОР в течение 20 минут')
    activity = stages[1].get('teacher_actions', '') + '\n' + students
    if re.search(r'актуализация знаний|объяснение нового материала|'
                 r'учитель\s+объясняет\s+нов|учащиеся\s+изучают\s+нов', activity, re.I):
        raise ValueError('Этап СОР предназначен для выполнения заданий, без изучения нового материала')


def sor_instructions(source: dict, teacher: str, school: str, quote: dict) -> str:
    stages = '\n'.join(SOR_STAGES)
    return f"""Ты составляешь подробный КСП по информатике для основного курса школы Казахстана.
Верни JSON с объектом header и массивом stages по переданной JSON-схеме.
Это урок с суммативным оцениванием за раздел (СОР), а не урок изучения новой темы.
Ровно четыре этапа. Не добавляй отдельную строку о длительности урока. stage_name строго:
{stages}

1. ОРГ. МОМЕНТ — 5 минут: приветствие, готовность класса, объявление темы и целей,
инструктаж о порядке выполнения СОР и академической честности. Не проводи предметную разминку.

2. СУММАТИВНОЕ ОЦЕНИВАНИЕ ЗА РАЗДЕЛ — ровно 20 минут.
Учитель раздаёт утверждённые варианты и бланки, объявляет время, наблюдает за самостоятельностью,
отвечает только на организационные вопросы и по окончании собирает работы.
Учащиеся индивидуально и самостоятельно выполняют задания СОР в течение 20 минут,
записывают решения и ответы, проверяют свою работу и сдают её учителю.
В student_actions обязательно прямо напиши про самостоятельное выполнение СОР в течение 20 минут.
Не включай сюда актуализацию знаний, объяснение нового материала, разбор решений,
подсказки учителя, совместное выполнение, взаимопроверку или использование ИИ учениками.
Не придумывай задания СОР, ключи или баллы: используй формулировку «утверждённые задания СОР
по разделу». Оценивание проводится после сбора работ по утверждённым критериям и дескрипторам.
Ресурсы этого этапа: утверждённые варианты СОР, бланки ответов, критерии и дескрипторы учителя.
Не используй скриншоты теории, разминку или материалы с готовыми ответами как ресурсы СОР.

3. ПРАКТИЧЕСКАЯ РАБОТА — 10 минут, только после завершения и сдачи СОР:
самостоятельное закрепление по теме урока на www.alasster.site, конкретные задания из материалов
платформы, действия учащихся и учителя, формативная обратная связь. Отдели эту практику от СОР;
не продолжай СОР и не выдавай ученикам ответы к нему. Указывай конкретные разделы платформы.

4. ПОДВЕДЕНИЕ ИТОГОВ УРОКА — 5 минут: итоги практики, краткая рефлексия,
порядок получения результатов СОР после проверки учителем, домашнее задание.
Не сообщай оценки за СОР до проверки и не смешивай баллы СОР с формативным оцениванием практики.

Каждый этап содержит stage_name, teacher_actions, student_actions, assessment, resources.
В teacher_actions и student_actions — подробные конкретные действия, абзацы через две новые строки,
с жирными маркерами **Название:**. Содержание строго по теме и целям ниже.
В header заполни school, section, teacher, subject, date, grade, theme, curriculum_goal,
lesson_goals, values, functional_literacy, ai_tools. Учебные цели сохрани точно.
В values свяжи тему с честностью, ответственностью и цитатой недели: {quote['kz']} ({quote['ru']}).
Цитата уместна при организации и подведении итогов, не прерывает выполнение СОР.
Функциональная грамотность — в практике после СОР. ИИ — только для подготовки учителя,
учащиеся не используют ИИ при выполнении СОР.
Не добавляй блоки об особых образовательных потребностях. Не упоминай ноутбуки,
интерактивную или смарт-доску; для практики используй платформу на рабочих местах.

Школа: {school}
Учитель: {teacher}
Предмет: {source.get('subject') or 'Информатика'}
Класс: {source.get('grade_label') or source['class_name']}
Дата: {source['date']}
Раздел: {source['section']}
Тема: {source['title']}. Урок {source['number']}
Цели обучения: {' '.join(source['goals'])}
Материалы платформы для практики после СОР:
{source['content'][:25000]}
"""
