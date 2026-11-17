"""Rules specific to main-course lessons (regular, ДОП, СОР, СОЧ) and 40-minute timing."""
import re


REGULAR_STAGES = (
    '1. Организационный момент (2 мин)',
    '2. Актуализация знаний (5 мин)',
    '3. Объяснение нового материала (10 мин)',
    '4. Практическая работа (20 мин)',
    '5. Подведение итогов урока (3 мин)',
)

DOP_STAGES = (
    '1. Организационный момент (2 мин)',
    '2. Актуализация знаний (5 мин)',
    '3. Объяснение нового материала (5 мин)',
    '4. Практическая работа (25 мин)',
    '5. Подведение итогов урока (3 мин)',
)

SOR_STAGES = (
    '1. Организационный момент (2 мин)',
    '2. Суммативное оценивание за раздел (20 мин)',
    '3. Практическая работа (15 мин)',
    '4. Подведение итогов урока (3 мин)',
)

SOCH_STAGES = (
    '1. Организационный момент (2 мин)',
    '2. Суммативное оценивание за четверть (35 мин)',
    '3. Подведение итогов урока (3 мин)',
)

SOCH_DESCRIPTORS = (
    'Суммативное оценивание за четверть на платформе www.alasster.site '
    '(электронная проверка выполненных заданий по критериям и дескрипторам СОЧ).'
)


def is_soch_lesson(source: dict) -> bool:
    if source.get('class_name') != '10 ЕМН':
        return False
    if source.get('is_variative') or str(source.get('key', '')).startswith('доп|'):
        return False
    title = str(source.get('title', ''))
    return (
        source.get('assessment_type') == 'soch'
        or bool(re.search(r'(?<!\w)СОЧ(?!\w)|суммативн\w*\s+(?:работа|оценивание)\s+за\s+(?:\d+\s*)?четверть', title, re.I))
    )


def normalize_lesson_timing(plan: dict, source: dict) -> dict:
    stages = plan.get('stages', [])
    if is_soch_lesson(source):
        if len(stages) == 3:
            for stage, name in zip(stages, SOCH_STAGES):
                stage['stage_name'] = name
        return plan
    if is_sor_lesson(source):
        if len(stages) == 4:
            for stage, name in zip(stages, SOR_STAGES):
                stage['stage_name'] = name
        return plan
    if len(stages) != 5:
        return plan
    canonical = DOP_STAGES if source.get('is_variative') else REGULAR_STAGES
    for stage, target_name in zip(stages, canonical):
        stage['stage_name'] = target_name
    return plan


def normalize_soch_stages(plan: dict, source: dict) -> dict:
    if is_soch_lesson(source) and len(plan.get('stages', [])) == 3:
        for stage, name in zip(plan['stages'], SOCH_STAGES):
            stage['stage_name'] = name
        stage0, stage1, stage2 = plan['stages']
        if not stage0.get('assessment', '').strip():
            stage0['assessment'] = 'Устная обратная связь, готовность к работе на платформе.'
        raw_a1 = stage1.get('assessment', '').strip()
        if not raw_a1 or len(raw_a1) > 260 or re.search(r'утвержд[её]нн|бланк', raw_a1, re.I):
            stage1['assessment'] = SOCH_DESCRIPTORS
        if not stage2.get('assessment', '').strip() or len(stage2.get('assessment', '').strip()) > 220:
            stage2['assessment'] = 'Фиксация завершения и отправки электронной работы на платформе www.alasster.site.'
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
    if not stages[1].get('assessment', '').strip():
        raise ValueError('Не заполнено оценивание для этапа СОЧ')
    if any(re.search(r'актуализация|объяснение|практическая работа', s['stage_name'], re.I) for s in stages):
        raise ValueError('Урок СОЧ не содержит этапов изучения материала или практической работы')


def soch_instructions(source: dict, teacher: str, school: str, quote: dict) -> str:
    stages = '\n'.join(SOCH_STAGES)
    return f"""Составь подробный КСП основного курса информатики 10 ЕМН в JSON: header и stages.
Это СОЧ — СУММАТИВНОЕ ОЦЕНИВАНИЕ ЗА ЧЕТВЕРТЬ. Не называй его оцениванием за раздел.
Учитывай распределение времени ниже (40 минут: 2 + 35 + 3); не добавляй в документ отдельную строку о длительности урока.
Ровно три этапа, stage_name строго:
{stages}
1. Организационный момент (2 мин): приветствие, проверка готовности рабочих мест, вход учащихся на платформу www.alasster.site,
краткий инструктаж о порядке электронного выполнения СОЧ на сайте, самостоятельности и академической честности.
2. Суммативное оценивание за четверть (35 мин): почти весь урок учащиеся индивидуально и самостоятельно выполняют электронные задания СОЧ
на сайте www.alasster.site по целям изученной четверти. Читают условия на экране, распределяют время, выполняют задания на сайте,
проверяют полноту ответов и отправляют работу в электронной системе. Учитель фиксирует время,
наблюдает за самостоятельностью, отвечает только на организационные вопросы и контролирует отправку работ на сайте.
Никаких разминок, объяснения новой темы, подсказок, совместных решений, взаимопроверки,
дополнительной практики или использования ИИ учащимися во время СОЧ.
3. Подведение итогов урока (3 мин): организованное завершение электронной сдачи работ на сайте www.alasster.site,
проверка статуса отправки, краткая рефлексия и сообщение о публикации результатов после проверки.
СТРОЖАЙШИЙ ЗАПРЕТ: КАТЕГОРИЧЕСКИ ЗАПРЕЩЕНО использовать слова «утверждённые», «утвержденные», «бланки ответов», «бумажные бланки», «раздаёт варианты и бланки»! Всё проходит полностью электронно на сайте www.alasster.site.
В столбце оценивания (assessment) НЕ пиши много текста — формулируй кратко и разумно (1–2 предложения на этап):
- на 1 этапе: «Устная обратная связь, готовность к работе на платформе.»
- на 2 этапе: «{SOCH_DESCRIPTORS}»
- на 3 этапе: «Фиксация завершения и отправки электронной работы на платформе www.alasster.site.»
Ресурсы: Платформа www.alasster.site (электронные задания СОЧ за четверть).
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
    # The Доп button keeps its five-stage variative-course plan,
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
Это урок с суммативным оцениванием за раздел (СОР) и последующей практической работой (40 минут: 2 + 20 + 15 + 3).
Ровно четыре этапа. Не добавляй отдельную строку о длительности урока. stage_name строго:
{stages}

1. Организационный момент (2 мин): приветствие, готовность класса, объявление темы и целей,
инструктаж о порядке электронного прохождения СОР на сайте www.alasster.site и академической честности. Не проводи предметную разминку.

2. Суммативное оценивание за раздел (20 мин) — ровно 20 минут (пол-урока):
Учащиеся выполняют СОР в электронном виде на сайте www.alasster.site на своих рабочих местах.
Учитель открывает доступ к заданиям СОР на платформе www.alasster.site, объявляет время, наблюдает за самостоятельностью,
отвечает только на организационные вопросы и контролирует электронную отправку работ.
Учащиеся индивидуально и самостоятельно выполняют задания СОР в течение 20 минут на сайте www.alasster.site,
вводят решения и ответы, проверяют свою работу и отправляют её на платформе.
В student_actions обязательно прямо напиши про самостоятельное выполнение СОР в течение 20 минут на сайте www.alasster.site.
СТРОЖАЙШИЙ ЗАПРЕТ: КАТЕГОРИЧЕСКИ ЗАПРЕЩЕНО писать слова «утверждённые», «утвержденные», «бланки ответов», «бумажные бланки», «раздаёт бланки»! Всё выполняется электронно на сайте www.alasster.site.
Не включай сюда актуализацию знаний, объяснение нового материала, разбор решений,
подсказки учителя, совместное выполнение, взаимопроверку или использование ИИ учениками.
Ресурсы этого этапа: Платформа www.alasster.site (электронное выполнение заданий СОР по разделу).
Не используй скриншоты теории, разминку или материалы с готовыми ответами как ресурсы СОР.

3. Практическая работа (15 мин) — 15 минут, после завершения и отправки СОР:
самостоятельная практическая работа по теме урока на www.alasster.site, конкретные задания из материалов
платформы, действия учащихся и учителя, формативная обратная связь. Отдели эту практику от СОР;
не продолжай СОР и не выдавай ученикам ответы к нему. Указывай конкретные разделы платформы.

4. Подведение итогов урока (3 мин) — 3 минуты: краткие итоги практики, рефлексия,
информация о проверке электронных работ СОР на сайте, домашнее задание.
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
интерактивную или смарт-доску; для работы используй платформу www.alasster.site на рабочих местах.

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
