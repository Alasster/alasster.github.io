/* ==========================================================================
   10 ЕМН · 2 ЧЕТВЕРТЬ — РЕКУРСИЯ И СОРТИРОВКИ
   Данные уроков. Профильный уровень: Python-практикумы, стек вызовов,
   оценка алгоритмов, проект и подготовка к СОР/СОЧ.
   ========================================================================== */
(function () {
  'use strict';

  const REC_SVG = `<svg viewBox="0 0 540 280" role="img" aria-label="Стек вызовов рекурсивной функции">
    <defs><marker id="q10e-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#7c8aa5"/></marker></defs>
    <g class="q2-scene-stack">
      <rect x="40" y="40" width="250" height="46" rx="12"/>
      <text class="q2-scene-stack-label" x="60" y="69">factorial(4)</text>
      <rect x="40" y="94" width="250" height="46" rx="12"/>
      <text class="q2-scene-stack-label" x="60" y="123">factorial(3)</text>
      <rect x="40" y="148" width="250" height="46" rx="12"/>
      <text class="q2-scene-stack-label" x="60" y="177">factorial(2)</text>
      <rect x="40" y="202" width="250" height="46" rx="12"/>
      <text class="q2-scene-stack-label" x="60" y="231">factorial(1)</text>
    </g>
    <g class="q2-scene-stack is-base">
      <rect x="320" y="202" width="180" height="46" rx="12"/>
      <text class="q2-scene-stack-label" x="338" y="231">factorial(0) = 1</text>
    </g>
    <path class="q2-scene-arrow" d="M292 225 H 318" fill="none" marker-end="url(#q10e-arrow)"/>
    <path class="q2-scene-arrow" d="M410 198 V 160" fill="none" marker-end="url(#q10e-arrow)"/>
    <text class="q2-scene-caption" x="165" y="270" text-anchor="middle">вызовы идут вниз, возвраты — вверх</text>
    <text class="q2-scene-caption" x="410" y="150" text-anchor="middle">база</text>
  </svg>`;

  const BASE_SVG = `<svg viewBox="0 0 540 240" role="img" aria-label="Два обязательных элемента рекурсии">
    <rect class="q2-scene-panel" x="30" y="60" width="220" height="120" rx="18"/>
    <rect class="q2-scene-panel" x="290" y="60" width="220" height="120" rx="18"/>
    <text class="q2-scene-node-text" x="140" y="96" text-anchor="middle">База</text>
    <text class="q2-scene-caption" x="140" y="124" text-anchor="middle">условие остановки:</text>
    <text class="q2-scene-caption" x="140" y="146" text-anchor="middle">n == 0 → return 1</text>
    <text class="q2-scene-node-text" x="400" y="96" text-anchor="middle">Шаг</text>
    <text class="q2-scene-caption" x="400" y="124" text-anchor="middle">вызов с меньшей задачей:</text>
    <text class="q2-scene-caption" x="400" y="146" text-anchor="middle">n * factorial(n - 1)</text>
    <text class="q2-scene-caption" x="270" y="215" text-anchor="middle">нет базы → бесконечная рекурсия; нет шага → задача не уменьшается</text>
  </svg>`;

  const REC_SCREEN_SVG = `<svg viewBox="0 0 560 390" role="img" aria-label="Светлая анимированная трассировка countdown в окне Python IDLE">
    <style>
      @keyframes q2-rec-line-call {
        0%, 6% { fill: rgba(99, 102, 241, 0.34); }
        8%, 100% { fill: rgba(99, 102, 241, 0.04); }
      }
      @keyframes q2-rec-line-def {
        0%, 7% { fill: rgba(99, 102, 241, 0.04); }
        8%, 13%, 27%, 32%, 46%, 51%, 65%, 70% { fill: rgba(99, 102, 241, 0.34); }
        15%, 25%, 34%, 44%, 53%, 63%, 72%, 100% { fill: rgba(99, 102, 241, 0.04); }
      }
      @keyframes q2-rec-line-if {
        0%, 13% { fill: rgba(99, 102, 241, 0.04); }
        14%, 19%, 33%, 38%, 52%, 57%, 71%, 76% { fill: rgba(99, 102, 241, 0.34); }
        21%, 31%, 40%, 50%, 59%, 69%, 78%, 100% { fill: rgba(99, 102, 241, 0.04); }
      }
      @keyframes q2-rec-line-print {
        0%, 19% { fill: rgba(99, 102, 241, 0.04); }
        20%, 24%, 39%, 43%, 58%, 62% { fill: rgba(99, 102, 241, 0.34); }
        26%, 37%, 45%, 56%, 64%, 100% { fill: rgba(99, 102, 241, 0.04); }
      }
      @keyframes q2-rec-line-step {
        0%, 23% { fill: rgba(99, 102, 241, 0.04); }
        24%, 28%, 43%, 47%, 62%, 66% { fill: rgba(99, 102, 241, 0.34); }
        30%, 41%, 49%, 60%, 68%, 100% { fill: rgba(99, 102, 241, 0.04); }
      }
      @keyframes q2-rec-line-base-p {
        0%, 75% { fill: rgba(16, 185, 129, 0.05); }
        76%, 83% { fill: rgba(16, 185, 129, 0.36); }
        85%, 100% { fill: rgba(16, 185, 129, 0.05); }
      }
      @keyframes q2-rec-line-base-r {
        0%, 82% { fill: rgba(16, 185, 129, 0.05); }
        83%, 91% { fill: rgba(16, 185, 129, 0.36); }
        93%, 100% { fill: rgba(16, 185, 129, 0.05); }
      }
      @keyframes q2-rec-out-1 {
        0%, 20% { opacity: 0; transform: translateX(-6px); }
        24%, 92% { opacity: 1; transform: translateX(0); }
        97%, 100% { opacity: 0; transform: translateX(0); }
      }
      @keyframes q2-rec-out-2 {
        0%, 39% { opacity: 0; transform: translateX(-6px); }
        43%, 92% { opacity: 1; transform: translateX(0); }
        97%, 100% { opacity: 0; transform: translateX(0); }
      }
      @keyframes q2-rec-out-3 {
        0%, 58% { opacity: 0; transform: translateX(-6px); }
        62%, 92% { opacity: 1; transform: translateX(0); }
        97%, 100% { opacity: 0; transform: translateX(0); }
      }
      @keyframes q2-rec-out-4 {
        0%, 77% { opacity: 0; transform: translateX(-6px); }
        81%, 92% { opacity: 1; transform: translateX(0); }
        97%, 100% { opacity: 0; transform: translateX(0); }
      }
      .q2-rec-l-call { animation: q2-rec-line-call 10s linear infinite; }
      .q2-rec-l-def { animation: q2-rec-line-def 10s linear infinite; }
      .q2-rec-l-if { animation: q2-rec-line-if 10s linear infinite; }
      .q2-rec-l-print { animation: q2-rec-line-print 10s linear infinite; }
      .q2-rec-l-step { animation: q2-rec-line-step 10s linear infinite; }
      .q2-rec-l-bp { animation: q2-rec-line-base-p 10s linear infinite; }
      .q2-rec-l-br { animation: q2-rec-line-base-r 10s linear infinite; }
      .q2-rec-o1 { opacity: 0; animation: q2-rec-out-1 10s ease-out infinite; }
      .q2-rec-o2 { opacity: 0; animation: q2-rec-out-2 10s ease-out infinite; }
      .q2-rec-o3 { opacity: 0; animation: q2-rec-out-3 10s ease-out infinite; }
      .q2-rec-o4 { opacity: 0; animation: q2-rec-out-4 10s ease-out infinite; }
    </style>
    <rect x="8" y="8" width="544" height="374" rx="20" fill="#edf3f7"/>
    <path d="M28 8h504a20 20 0 0 1 20 20v30H8V28A20 20 0 0 1 28 8z" fill="#f9fbfd"/>
    <circle cx="32" cy="29" r="6" fill="#f87171"/><circle cx="52" cy="29" r="6" fill="#fbbf24"/><circle cx="72" cy="29" r="6" fill="#34d399"/>
    <text x="112" y="34" fill="#42586b" font-family="sans-serif" font-size="15" font-weight="700">Python IDLE · recursion.py</text>
    <rect x="18" y="52" width="326" height="310" rx="10" fill="#fff"/>
    <text x="34" y="76" fill="#64748b" font-family="sans-serif" font-size="13" font-weight="700">Код программы</text>
    <g font-family="'JetBrains Mono', Consolas, monospace" font-size="15" font-weight="600">
      <rect class="q2-rec-l-def" x="26" y="88" width="310" height="29" rx="6" fill="#f4f1ff"/>
      <text x="36" y="108" fill="#6d28d9">def countdown(n):</text>
      <rect class="q2-rec-l-if" x="26" y="120" width="310" height="29" rx="6" fill="#f4f1ff"/>
      <text x="58" y="140" fill="#334155">if n == 0:  # база</text>
      <rect class="q2-rec-l-bp" x="26" y="152" width="310" height="29" rx="6" fill="#ecfdf5"/>
      <text x="80" y="172" fill="#047857">print("Старт!")</text>
      <rect class="q2-rec-l-br" x="26" y="184" width="310" height="29" rx="6" fill="#ecfdf5"/>
      <text x="80" y="204" fill="#047857">return</text>
      <rect class="q2-rec-l-print" x="26" y="216" width="310" height="29" rx="6" fill="#f4f1ff"/>
      <text x="58" y="236" fill="#334155">print(n)</text>
      <rect class="q2-rec-l-step" x="26" y="248" width="310" height="29" rx="6" fill="#f4f1ff"/>
      <text x="58" y="268" fill="#4f46e5">countdown(n - 1)  # шаг</text>
      <rect class="q2-rec-l-call" x="26" y="280" width="310" height="29" rx="6" fill="#f4f1ff"/>
      <text x="36" y="300" fill="#0f766e">countdown(3)</text>
    </g>
    <rect x="356" y="52" width="186" height="310" rx="10" fill="#e7eef4"/>
    <text x="372" y="76" fill="#64748b" font-family="sans-serif" font-size="13" font-weight="700">Python Shell</text>
    <g font-family="monospace" font-size="17" font-weight="700" fill="#16734a">
      <text x="372" y="108" fill="#536679" font-size="12" font-weight="600">&gt;&gt;&gt; countdown(3)</text>
      <g class="q2-rec-o1"><text x="378" y="148">3  (n = 3)</text></g>
      <g class="q2-rec-o2"><text x="378" y="182">2  (n = 2)</text></g>
      <g class="q2-rec-o3"><text x="378" y="216">1  (n = 1)</text></g>
      <g class="q2-rec-o4"><text x="378" y="252" fill="#047857">Старт! (n = 0)</text></g>
    </g>
    <text x="372" y="334" fill="#486174" font-family="sans-serif" font-size="12" font-weight="700">База n == 0 остановила вызовы</text>
    <text x="18" y="377" fill="#64748b" font-family="sans-serif" font-size="12">Каждый шаг уменьшает n на 1, пока не сработает условие n == 0</text>
  </svg>`;

  const IDLE_GUIDE_HTML = `<div class="q2-idle-guide">
    <article class="q2-idle-step">
      <h3><span>1</span> Открой Python IDLE</h3>
      <svg viewBox="0 0 360 150" role="img" aria-label="Открой меню Пуск, затем папку Python и IDLE">
        <rect x="8" y="8" width="344" height="134" rx="14" fill="#f3f6fa" stroke="#d4dee8"/>
        <rect x="20" y="20" width="108" height="108" rx="10" fill="#e5edf5"/>
        <rect x="31" y="31" width="86" height="22" rx="6" fill="#fff" stroke="#d2dce6"/>
        <text x="74" y="46" text-anchor="middle" fill="#334155" font-size="12" font-family="sans-serif">Пуск</text>
        <path d="M75 54v10" stroke="#7c8da0" stroke-width="2"/>
        <rect x="31" y="65" width="86" height="22" rx="6" fill="#fff" stroke="#d2dce6"/>
        <text x="74" y="80" text-anchor="middle" fill="#334155" font-size="11" font-family="sans-serif">Python 3.x</text>
        <path d="M75 88v9" stroke="#7c8da0" stroke-width="2"/>
        <rect x="31" y="98" width="86" height="22" rx="6" fill="#dbeafe" stroke="#93c5fd"/>
        <text x="74" y="113" text-anchor="middle" fill="#1e40af" font-size="10" font-family="sans-serif">IDLE</text>
        <path d="M142 75h25" stroke="#71839a" stroke-width="2"/>
        <path d="m162 69 8 6-8 6" fill="none" stroke="#71839a" stroke-width="2"/>
        <rect x="180" y="38" width="150" height="74" rx="12" fill="#fff" stroke="#cbd5e1"/>
        <circle cx="196" cy="53" r="4" fill="#f87171"/><circle cx="209" cy="53" r="4" fill="#fbbf24"/><circle cx="222" cy="53" r="4" fill="#34d399"/>
        <text x="255" y="81" text-anchor="middle" fill="#334155" font-size="14" font-weight="700" font-family="sans-serif">Python IDLE</text>
        <text x="255" y="99" text-anchor="middle" fill="#64748b" font-size="11" font-family="sans-serif">откроется Shell</text>
      </svg>
      <p>Пуск → Python 3.x → IDLE (Python 3.x)</p>
    </article>
    <article class="q2-idle-step">
      <h3><span>2</span> Создай файл</h3>
      <svg viewBox="0 0 360 150" role="img" aria-label="В меню File выбери New File">
        <rect x="8" y="8" width="344" height="134" rx="14" fill="#f3f6fa" stroke="#d4dee8"/>
        <rect x="22" y="22" width="316" height="106" rx="10" fill="#fff" stroke="#cbd5e1"/>
        <rect x="22" y="22" width="316" height="24" rx="10" fill="#edf2f7"/>
        <text x="36" y="38" fill="#334155" font-size="12" font-family="sans-serif">File</text>
        <text x="66" y="38" fill="#64748b" font-size="11" font-family="sans-serif">Edit  Format  Run</text>
        <rect x="28" y="48" width="134" height="64" rx="7" fill="#fff" stroke="#cbd5e1"/>
        <text x="40" y="66" fill="#64748b" font-size="11" font-family="sans-serif">Open...</text>
        <rect x="34" y="72" width="122" height="25" rx="5" fill="#dbeafe" stroke="#93c5fd"/>
        <text x="44" y="89" fill="#1e40af" font-size="11" font-weight="700" font-family="sans-serif">New File</text>
        <path d="M186 80h37" stroke="#71839a" stroke-width="2"/>
        <path d="m218 74 8 6-8 6" fill="none" stroke="#71839a" stroke-width="2"/>
        <rect x="237" y="58" width="82" height="46" rx="8" fill="#e8f4ec" stroke="#a8cfb3"/>
        <text x="278" y="77" text-anchor="middle" fill="#315c3f" font-size="11" font-weight="700" font-family="sans-serif">Editor</text>
        <text x="278" y="93" text-anchor="middle" fill="#527083" font-size="10" font-family="sans-serif">новый файл</text>
      </svg>
      <p>В окне Shell нажми File → New File.</p>
    </article>
    <article class="q2-idle-step">
      <h3><span>3</span> Сохрани программу</h3>
      <svg viewBox="0 0 360 150" role="img" aria-label="Сохрани файл под именем recursion.py">
        <rect x="8" y="8" width="344" height="134" rx="14" fill="#f3f6fa" stroke="#d4dee8"/>
        <rect x="38" y="20" width="284" height="110" rx="12" fill="#fff" stroke="#cbd5e1"/>
        <text x="58" y="44" fill="#334155" font-size="13" font-weight="700" font-family="sans-serif">Сохранить как</text>
        <text x="58" y="68" fill="#64748b" font-size="10" font-family="sans-serif">Имя файла</text>
        <rect x="56" y="75" width="248" height="27" rx="6" fill="#f8fafc" stroke="#94a3b8"/>
        <text x="68" y="93" fill="#334155" font-size="12" font-family="monospace">recursion.py</text>
        <rect x="222" y="108" width="82" height="18" rx="6" fill="#dbeafe" stroke="#93c5fd"/>
        <text x="263" y="121" text-anchor="middle" fill="#1e40af" font-size="10" font-weight="700" font-family="sans-serif">Сохранить</text>
      </svg>
      <p>File → Save As… Укажи имя файла с окончанием <code>.py</code>.</p>
    </article>
    <article class="q2-idle-step">
      <h3><span>4</span> Запусти код</h3>
      <svg viewBox="0 0 360 150" role="img" aria-label="В меню Run выбери Run Module или нажми F5">
        <rect x="8" y="8" width="344" height="134" rx="14" fill="#f3f6fa" stroke="#d4dee8"/>
        <rect x="20" y="20" width="188" height="108" rx="10" fill="#fff" stroke="#cbd5e1"/>
        <rect x="20" y="20" width="188" height="24" rx="10" fill="#edf2f7"/>
        <text x="34" y="36" fill="#64748b" font-size="11" font-family="sans-serif">File  Edit  Format</text>
        <text x="160" y="36" fill="#334155" font-size="11" font-weight="700" font-family="sans-serif">Run</text>
        <rect x="112" y="47" width="87" height="34" rx="6" fill="#dbeafe" stroke="#93c5fd"/>
        <text x="155" y="62" text-anchor="middle" fill="#1e40af" font-size="9" font-weight="700" font-family="sans-serif">Run Module</text>
        <text x="155" y="75" text-anchor="middle" fill="#1e40af" font-size="9" font-family="sans-serif">F5</text>
        <path d="M213 64h18" stroke="#71839a" stroke-width="2"/>
        <path d="m227 58 8 6-8 6" fill="none" stroke="#71839a" stroke-width="2"/>
        <rect x="240" y="30" width="102" height="82" rx="10" fill="#e7eef4" stroke="#cbd5e1"/>
        <text x="291" y="48" text-anchor="middle" fill="#64748b" font-size="10" font-family="sans-serif">Python Shell</text>
        <text x="253" y="70" fill="#16734a" font-size="10" font-family="monospace">&gt;&gt;&gt; 3</text>
        <text x="253" y="86" fill="#16734a" font-size="10" font-family="monospace">&gt;&gt;&gt; 2</text>
        <text x="253" y="102" fill="#16734a" font-size="10" font-family="monospace">&gt;&gt;&gt; 1</text>
      </svg>
      <p>Run → Run Module или нажми F5. Результат появится в Shell.</p>
    </article>
  </div>`;

  /* ==========================================================================
     УРОК 1. Что такое рекурсия
     ========================================================================== */
  Q2.add('10emn-q2-1', {
    num: 1,
    cls: '10 ЕМН',
    title: 'Рекурсия',
    slides: [
      {
        k: 'hero',
        eyebrow: '10 ЕМН · 2 ЧЕТВЕРТЬ · УРОК 1',
        title: '<span class="accent-text">Рекурсия</span>',
        lead: 'Как функция может вызвать саму себя — и почему программа при этом не зацикливается?',
        goal: 'Вспомнить функции Python и научиться находить в рекурсии шаг и условие остановки.',
        goalCode: '10.2.1.1',
        chips: [
          { icon: 'fas fa-code', text: 'Вспоминаем def' },
          { icon: 'fas fa-rotate-left', text: 'Вызов самой себя' },
          { icon: 'fas fa-stop', text: 'Условие остановки' }
        ],
        visual: 'recursionIntro',
        visualCaption: 'Новое окно появляется на каждом рекурсивном вызове',
        cta: 'Начать урок'
      },
      {
        k: 'concept',
        eyebrow: '02 · ВСПОМИНАЕМ PYTHON',
        title: 'Что означают <code>def</code> и <code>return</code>?',
        lead: 'Ключевое слово <code>def</code> (от англ. <i>define</i> — определить) указывает Python, что мы создаём новую функцию. Это нужно, чтобы записать блок команд один раз, а затем многократно вызывать его по имени в любых местах программы с разными аргументами.',
        blocks: [
          {
            t: 'code',
            title: 'функция_с_возвратом.py',
            code: 'def double(x):\n    result = x * 2\n    return result  # возвращаем вычисленный результат\n\na = double(5)      # в переменную a запишется число 10\nprint("Итог:", a)'
          },
          {
            t: 'cards',
            cols: 3,
            items: [
              { icon: 'fas fa-code', title: 'def · Создание', text: '<code>def</code> создаёт функцию и задаёт её имя. Нужен, чтобы оформить повторяющийся алгоритм в один именованный блок.', tone: 'violet' },
              { icon: 'fas fa-play', title: 'Вызов функции', text: 'Вызов <code>double(5)</code> передаёт аргумент <code>5</code> в параметр <code>x</code> и запускает вычисления внутри функции.', tone: 'cyan' },
              { icon: 'fas fa-reply', title: 'return · Возврат', text: '<code>return</code> отдаёт готовое значение обратно в строку вызова и завершает функцию. Если значения нет, <code>return</code> просто прерывает выполнение.', tone: 'amber' }
            ]
          },
          {
            t: 'callout',
            icon: 'fas fa-lightbulb',
            title: 'Зачем нужны def и return?',
            text: 'Функции избавляют от дублирования кода, делают программу структурированной, а <code>return</code> позволяет передавать результаты вычислений между частями программы.'
          }
        ]
      },
      {
        k: 'concept',
        eyebrow: '03 · РЕКУРСИЯ',
        title: 'Что такое рекурсия и зачем она нужна?',
        lead: '<b>Рекурсия</b> — это способ организации алгоритма, при котором функция внутри себя вызывает саму же себя для решения уменьшенной подзадачи. Это нужно, чтобы легко и наглядно решать сложные задачи, которые естественно делятся на подобные шаги (факториал, обход деревьев и файлов, быстрая сортировка).',
        blocks: [
          {
            t: 'split',
            cls: 'q2-rec-slide-split',
            left: [
              {
                t: 'cards',
                cols: 1,
                items: [
                  { icon: 'fas fa-stop', title: 'База рекурсии (Stop)', text: 'Условие выхода: простейший случай (<code>if n == 0:</code>), где функция сразу завершается через <code>return</code> и больше себя не вызывает.', tone: 'green' },
                  { icon: 'fas fa-rotate-left', title: 'Рекурсивный шаг', text: 'Вызов той же функции с уменьшенным аргументом (<code>countdown(n - 1)</code>). Шаг за шагом задача уменьшается и приближается к базе.', tone: 'violet' }
                ]
              }
            ],
            right: [
              { t: 'svg', cls: 'q2-recursion-compact', svg: REC_SCREEN_SVG, caption: 'Ход выполнения countdown(3)' }
            ]
          },
          {
            t: 'callout',
            icon: 'fas fa-circle-info',
            title: 'Главное правило',
            text: 'В любой рекурсии <b>обязаны быть и база, и шаг</b>: без базы произойдёт переполнение стека (<code>RecursionError</code>), а без шага задача никогда не дойдёт до базы.'
          }
        ]
      },
      {
        k: 'concept',
        eyebrow: '04 · ПРИМЕРЫ С РАЗБОРОМ',
        title: 'Два классических примера и стек вызовов',
        lead: 'Посмотри, как рекурсия раскручивается вперёд до стоп-крана и как результаты собираются обратно.',
        blocks: [
          {
            t: 'cards',
            cols: 2,
            items: [
              {
                badge: 'Пример 1 · самый простой',
                icon: 'fas fa-stopwatch',
                title: 'Обратный отсчёт: от N до 1 и «Пуск!»',
                text: '<b>Что происходит под капотом:</b><br>' +
                      '• <code>countdown(3)</code> → печатает 3, зовёт <code>countdown(2)</code><br>' +
                      '• <code>countdown(2)</code> → печатает 2, зовёт <code>countdown(1)</code><br>' +
                      '• <code>countdown(1)</code> → печатает 1, зовёт <code>countdown(0)</code><br>' +
                      '• <code>countdown(0)</code> → сработал <b>стоп-кран</b>! Печатает «Пуск!» и завершается.',
                codeTitle: 'countdown.py',
                code: 'def countdown(n):\n    # 1. Базовый случай (стоп-кран)\n    if n <= 0:\n        print("Пуск!")\n        return\n\n    print(n)\n    # 2. Шаг рекурсии (уменьшаем n на 1)\n    countdown(n - 1)\n\ncountdown(3)',
                tone: 'violet'
              },
              {
                badge: 'Пример 2 · накопление',
                icon: 'fas fa-calculator',
                title: 'Сумма чисел от 1 до N',
                text: 'Сложим числа: для 3 нужно посчитать <code>3 + 2 + 1 = 6</code>.<br>' +
                      '<b>Как думает рекурсия:</b><br>' +
                      '• Сумма до 3 — это <code>3 + сумма до 2</code>.<br>' +
                      '• Сумма до 2 — это <code>2 + сумма до 1</code>.<br>' +
                      '• Сумма до 1 — это просто <code>1</code> (наш стоп-кран).',
                codeTitle: 'sum_to_n.py',
                code: 'def sum_to_n(n):\n    # Стоп-кран (база)\n    if n == 1:\n        return 1\n\n    # Рекурсивный шаг\n    return n + sum_to_n(n - 1)\n\nprint(sum_to_n(3))  # Выведет: 6',
                tone: 'cyan'
              }
            ]
          }
        ]
      },
      {
        k: 'concept',
        eyebrow: '05 · PYTHON IDLE',
        title: 'Открой IDLE и запусти программу',
        lead: 'Следуй схеме: открыть редактор, создать файл, сохранить его и запустить.',
        blocks: [
          { t: 'html', html: IDLE_GUIDE_HTML }
        ]
      },
      {
        k: 'concept',
        eyebrow: '06 · ПРАКТИКА В PYTHON IDLE',
        title: 'Три задачи для практики',
        lead: 'Попробуй написать код сам в Python IDLE, не подглядывая в готовые решения. В каждой функции обязательно выдели стоп-кран (базу) и рекурсивный шаг.',
        blocks: [
          {
            t: 'cards',
            cols: 3,
            items: [
              {
                badge: 'Задачка 1 · 3 балла',
                icon: 'fas fa-bullhorn',
                title: 'Эхо: echo(n)',
                text: 'Напиши функцию <code>echo(n)</code>, которая принимает число <code>n</code> и печатает фразу <code>"Ау!"</code> ровно <code>n</code> раз с помощью рекурсии.<br><br>' +
                      '<b>💡 Подсказка:</b><br>' +
                      'Стоп-кран — когда <code>n == 0</code> (сделать <code>return</code>). На шаге рекурсии печатай <code>print("Ау!")</code> и вызывай <code>echo(n - 1)</code>.',
                tone: 'violet'
              },
              {
                badge: 'Задачка 2 · 3 балла',
                icon: 'fas fa-calculator',
                title: 'Факториал: factorial(n)',
                text: 'Факториал числа <code>N</code> (обозначается <code>N!</code>) — это произведение всех чисел от 1 до <code>N</code> (например, <code>4! = 4 × 3 × 2 × 1 = 24</code>).<br><br>' +
                      '<b>💡 Подсказка:</b><br>' +
                      'Очень похоже на пример с суммой, только вместо знака <code>+</code> используй <code>*</code>, а стоп-кран при <code>n == 1</code> возвращает <code>1</code>.',
                tone: 'cyan'
              },
              {
                badge: 'Задачка 3 · 4 балла ★',
                icon: 'fas fa-star',
                title: 'Степень: power(base, exp)',
                text: 'Напиши функцию <code>power(base, exp)</code>, которая возводит число <code>base</code> в степень <code>exp</code> (например, <code>power(2, 3)</code> вернёт <code>8</code>: <code>2 × 2 × 2</code>).<br><br>' +
                      '<b>💡 Подсказка:</b><br>' +
                      'Любое число в степени <code>0</code> равно <code>1</code> (стоп-кран при <code>exp == 0</code>). Шаг: <code>base * power(base, exp - 1)</code>.',
                tone: 'amber'
              }
            ]
          },
          {
            t: 'callout',
            icon: 'fas fa-list-check',
            title: 'Чек-лист перед запуском (F5)',
            text: '1. Есть ли базовый случай со словом <code>return</code>?<br>' +
                  '2. Уменьшается ли аргумент в рекурсивном вызове (например, <code>n - 1</code> или <code>exp - 1</code>)?<br>' +
                  '3. Проверь тесты в Python Shell: <code>echo(3)</code>, <code>print(factorial(4))</code> → 24, <code>print(power(2, 3))</code> → 8.'
          }
        ]
      },
      {
        k: 'quiz',
        eyebrow: '07 · МИНИ-ПРОВЕРКА',
        title: 'Проверим, что запомнили',
        lead: 'Выбери один ответ в каждом вопросе.',
        questions: [
          { q: 'Для чего в Python используют слово def?', options: ['Чтобы объявить функцию', 'Чтобы вызвать цикл', 'Чтобы вывести текст', 'Чтобы остановить программу'], answer: 0, explain: 'После def записывают имя функции и её параметры.' },
          { q: 'Что делает вызов greet("Алия")?', options: ['Запускает тело функции с аргументом «Алия»', 'Создаёт новый файл', 'Объявляет параметр', 'Останавливает программу'], answer: 0, explain: 'Вызов запускает уже объявленную функцию.' },
          { q: 'Что такое рекурсия?', options: ['Функция вызывает саму себя', 'Функция всегда запускает цикл', 'Программа вызывает другую программу', 'Переменная хранит список'], answer: 0, explain: 'Рекурсивная функция содержит вызов самой себя.' },
          { q: 'Зачем нужна база рекурсии?', options: ['Чтобы остановить вызовы', 'Чтобы увеличить аргумент', 'Чтобы объявить функцию', 'Чтобы повторить вывод'], answer: 0, explain: 'Без базы вызовы не завершатся.' },
          { q: 'Что выведет countdown(3), если сначала печатать n, а потом вызывать countdown(n - 1)?', options: ['3, 2, 1, затем «Пуск!»', '1, 2, 3', 'Только «Пуск!»', '3 бесконечно'], answer: 0, explain: 'Каждый вызов печатает число n до следующего вызова, а при n <= 0 срабатывает стоп-кран и выводит «Пуск!».' }
        ]
      },
      {
        k: 'summary',
        eyebrow: '08 · ИТОГИ УРОКА',
        title: 'Главное и оценивание',
        lead: 'Максимум за практическую работу — 10 баллов.',
        points: [
          '<code>def</code> объявляет функцию, вызов запускает её тело.',
          'Рекурсивная функция вызывает саму себя.',
          'База останавливает вызовы, шаг упрощает задачу.'
        ],
        criteriaTitle: 'Дескриптор практики · 10 баллов',
        criteria: [
          { mark: '1 балл', text: 'Задача 1 (Эхо): верно оформлен стоп-кран if n == 0 с return.' },
          { mark: '1 балл', text: 'Задача 1 (Эхо): фраза "Ау!" печатается на каждом шаге ровно n раз.' },
          { mark: '1 балл', text: 'Задача 1 (Эхо): рекурсивный шаг вызывает echo(n - 1).' },
          { mark: '1 балл', text: 'Задача 2 (Факториал): стоп-кран при n == 1 возвращает 1.' },
          { mark: '1 балл', text: 'Задача 2 (Факториал): рекурсивный шаг выполняет n * factorial(n - 1).' },
          { mark: '1 балл', text: 'Задача 2 (Факториал): вызов factorial(4) возвращает 24.' },
          { mark: '1 балл', text: 'Задача 3 (Степень): функция принимает два параметра (base, exp).' },
          { mark: '1 балл', text: 'Задача 3 (Степень): стоп-кран при exp == 0 возвращает 1.' },
          { mark: '1 балл', text: 'Задача 3 (Степень): рекурсивный шаг выполняет base * power(base, exp - 1).' },
          { mark: '1 балл', text: 'Задача 3 (Степень): тестовый запуск power(2, 3) возвращает 8.' }
        ],
        ticketTitle: 'Выходной билет',
        ticketLead: 'Ответь устно или в тетради:',
        ticket: [
          'Что делает ключевое слово def?',
          'Как рекурсивная функция приближается к остановке?',
          'Какую из четырёх задач ты решил(а) и что было самым сложным?'
        ]
      }
    ]
  });

  /* ==========================================================================
     УРОК 2. База и рекурсивный шаг
     ========================================================================== */
  Q2.add('10emn-q2-2', {
    num: 2,
    cls: '10 ЕМН',
    title: 'Рекурсия',
    slides: [
      {
        k: 'hero',
        eyebrow: '01 · ВВЕДЕНИЕ',
        title: '<span class="accent-text">Рекурсия</span>',
        lead: 'Любая корректная рекурсия состоит из базы и шага. База отвечает «когда остановиться», шаг — «как приблизиться к остановке».',
        goal: 'Выделять базу и рекурсивный шаг в рекурсивной функции.',
        goalCode: '10.2.1.1',
        chips: [
          { icon: 'fas fa-stop', text: 'Условие остановки' },
          { icon: 'fas fa-arrow-down-short-wide', text: 'Уменьшение задачи' },
          { icon: 'fas fa-bug', text: 'Ошибки рекурсии' }
        ],
        visual: 'recursion',
        visualCaption: 'База — дно, шаг — путь к нему',
        cta: 'Разобрать структуру'
      },
      {
        k: 'review',
        questions: [
          { q: 'Что такое рекурсия?', options: ['Вызов функцией самой себя', 'Повторение цикла', 'Ошибка', 'Копирование'], answer: 0, explain: 'Функция вызывает себя с меньшей задачей.' },
          { q: 'Зачем нужна база?', options: ['Чтобы остановить вызовы', 'Чтобы ускорить программу', 'Чтобы сохранить файл', 'Чтобы вывести текст'], answer: 0, explain: 'База — условие остановки.' },
          { q: 'Что будет без условия остановки?', options: ['Бесконечная рекурсия', 'Ускорение', 'Ничего', 'Цикл for'], answer: 0, explain: 'Стек переполнится.' },
          { q: 'Какая задача естественно рекурсивна?', options: ['Обход дерева папок', 'Сложение двух чисел', 'Вывод строки', 'Сортировка'], answer: 0, explain: 'Дерево имеет рекурсивную структуру.' },
          { q: 'Что значит «меньшего размера»?', options: ['Меньше данных', 'Меньше файлов', 'Меньше кода', 'Меньше памяти'], answer: 0, explain: 'Например, n − 1.' }
        ]
      },
      {
        k: 'concept',
        eyebrow: '03 · СТРУКТУРА',
        title: 'База и шаг',
        lead: 'База — это самый простой случай, ответ для которого известен без вычислений. Шаг — правило перехода к более простому случаю.',
        blocks: [
          { t: 'svg', svg: BASE_SVG, caption: 'Две части рекурсивной функции' },
          {
            t: 'table',
            caption: 'База и шаг в знакомых задачах',
            head: ['Задача', 'База', 'Шаг'],
            rows: [
              ['Факториал', '0! = 1', 'n! = n × (n − 1)!'],
              ['Сумма 1…n', 'S(0) = 0', 'S(n) = n + S(n − 1)'],
              ['Сумма цифр', 'digit_sum(0) = 0', 'n % 10 + digit_sum(n // 10)'],
              ['Разворот строки', 'пустая строка', 'reverse(s[1:]) + s[0]']
            ],
            highlight: 0
          },
          {
            t: 'callout',
            tone: 'warn',
            icon: 'fas fa-triangle-exclamation',
            title: 'Две классические ошибки',
            text: 'Первая — нет базы: функция вызывает себя бесконечно. Вторая — шаг не уменьшает задачу: например, factorial(n) вызывает factorial(n) вместо factorial(n − 1).'
          },
          {
            t: 'code',
            title: 'ошибки.py',
            code: '# 1. Нет базы — RecursionError\n# def bad(n):\n#     return bad(n - 1)\n\n# 2. Шаг не уменьшает задачу\ndef bad2(n):\n    if n == 0:\n        return 1\n    return n * bad2(n)      # n не меняется!\n\nprint("Обе версии приведут к ошибке RecursionError")'
          }
        ]
      },
      {
        k: 'lab',
        eyebrow: '04 · ИНТЕРАКТИВ',
        title: 'Факториал: от базы к результату',
        lead: 'Постройте factorial(4). Найдите момент, когда срабатывает база, и проследите, как возвращаются значения.',
        widget: {
          kind: 'recursion',
          config: { fn: 'fact', n: 4 }
        },
        after: [
          {
            t: 'callout',
            tone: 'good',
            icon: 'fas fa-check',
            title: 'Эталон',
            text: 'factorial(4) = 4 × 3 × 2 × 1 × 1 = 24. База срабатывает на factorial(0) = 1, затем результаты умножаются при возврате.'
          }
        ]
      },
      {
        k: 'concept',
        eyebrow: '05 · ПРОВЕРКА',
        title: 'Как убедиться, что рекурсия корректна',
        lead: 'Проверка состоит из трёх вопросов. Задавайте их каждый раз, когда пишете рекурсивную функцию.',
        blocks: [
          {
            t: 'steps',
            items: [
              { title: 'Вопрос 1', text: 'Есть ли база и достигается ли она за конечное число шагов?' },
              { title: 'Вопрос 2', text: 'Уменьшается ли задача на каждом вызове?' },
              { title: 'Вопрос 3', text: 'Собирается ли результат правильно при возврате?' }
            ]
          },
          {
            t: 'compare',
            left: {
              title: 'Корректно',
              items: ['База покрывает простейший случай', 'Аргумент строго уменьшается', 'Возврат комбинирует результаты', 'Есть проверка на маленьких n']
            },
            right: {
              title: 'Некорректно',
              items: ['База недостижима', 'Аргумент не меняется', 'Результат теряется', 'Проверяли только на n = 1']
            },
            vs: '≠'
          },
          {
            t: 'callout',
            icon: 'fas fa-flask',
            title: 'Практический совет',
            text: 'Проверяйте рекурсию на n = 0, n = 1 и n = 2. Если все три случая верны и шаг уменьшает аргумент, скорее всего, функция корректна.'
          }
        ]
      },
      {
        k: 'practice',
        eyebrow: '06 · ПРАКТИКА',
        title: 'База или шаг?',
        lead: 'Определите, к какой части рекурсии относится строка.',
        tasks: [
          { title: 'База', q: 'Какая строка задаёт базу: «if n == 0: return 1» или «return n * f(n - 1)»?', answer: ['if n == 0: return 1', 'if n==0: return 1', 'первая', 'база'], explain: 'Условие n == 0 с возвратом 1 — это база.', hint: 'База — самый простой случай.' },
          { title: 'Шаг', q: 'Что делает строка return n * f(n - 1)?', answer: ['шаг', 'рекурсивный шаг', 'вызывает функцию', 'уменьшает n'], explain: 'Это шаг: задача уменьшается до n − 1.', hint: 'Она приближает к базе.' },
          { title: 'Ошибка', q: 'Что будет, если в функции нет базы?', answer: ['recursionerror', 'бесконечная рекурсия', 'ошибка', 'переполнение стека'], explain: 'Python выдаст RecursionError.', hint: 'Стек не бесконечен.' },
          { title: 'Значение', q: 'Чему равно 5!?', answer: '120', type: 'number', explain: '5! = 5 × 4 × 3 × 2 × 1 = 120.', hint: 'Умножьте 1·2·3·4·5.' },
          { title: 'Проверка', q: 'Чему равно 0! по базе рекурсии?', answer: '1', type: 'number', explain: 'База: 0! = 1.', hint: 'Это определение из математики.' }
        ],
        criteria: [
          { mark: '1 балл', text: 'База и шаг различены без ошибок.' },
          { mark: '1 балл', text: 'Ошибка отсутствия базы объяснена.' },
          { mark: '1 балл', text: 'Значения факториала вычислены верно.' }
        ]
      },
      {
        k: 'quiz',
        eyebrow: '07 · ПРОВЕРКА',
        questions: [
          { q: 'Что такое база рекурсии?', options: ['Простейший случай с известным ответом', 'Первый вызов', 'Последний вызов', 'Ошибка'], answer: 0, explain: 'База останавливает рекурсию.' },
          { q: 'Что должен делать рекурсивный шаг?', options: ['Уменьшать задачу', 'Увеличивать n', 'Повторять вызов без изменений', 'Останавливать программу'], answer: 0, explain: 'Иначе база не достигнется.' },
          { q: 'Что произойдёт при отсутствии базы?', options: ['RecursionError', 'Программа ускорится', 'Ничего', 'Появится цикл'], answer: 0, explain: 'Стек вызовов переполнится.' },
          { q: 'Чему равно 4!?', options: ['24', '12', '16', '4'], answer: 0, explain: '4 × 3 × 2 × 1 = 24.' },
          { q: 'Сколько вызовов сделает factorial(3), включая базовый?', options: ['4', '3', '2', '1'], answer: 0, explain: 'factorial(3), (2), (1), (0) — четыре вызова.' }
        ]
      },
      {
        k: 'summary',
        points: [
          'Рекурсия состоит из базы и шага.',
          'База — простейший случай с готовым ответом.',
          'Шаг уменьшает задачу и приближает базу.',
          'Без базы возникает RecursionError.',
          'Корректность проверяют на n = 0, 1, 2.'
        ],
        ticket: [
          'База нужна, чтобы ...',
          'Шаг должен ...',
          'Если база недостижима, то ...'
        ]
      }
    ]
  });

  /* ==========================================================================
     УРОК 3. Стек вызовов
     ========================================================================== */
  Q2.add('10emn-q2-3', {
    num: 3,
    cls: '10 ЕМН',
    title: 'Рекурсия',
    slides: [
      {
        k: 'hero',
        eyebrow: '01 · ВВЕДЕНИЕ',
        title: '<span class="accent-text">Рекурсия</span>',
        lead: 'Пока функция не завершилась, Python хранит её вызов в стеке. Стек растёт вниз при вызовах и разбирается вверх при возвратах.',
        goal: 'Объяснять, как работает стек вызовов и почему возникает RecursionError.',
        goalCode: '10.2.1.2',
        chips: [
          { icon: 'fas fa-layer-group', text: 'LIFO: последний пришёл — первый вышел' },
          { icon: 'fas fa-arrow-up', text: 'Возврат значений' },
          { icon: 'fas fa-triangle-exclamation', text: 'Глубина рекурсии' }
        ],
        visual: 'recursion',
        visualCaption: 'Кадры стека: вызовы вниз, возвраты вверх',
        cta: 'Открыть стек'
      },
      {
        k: 'review',
        questions: [
          { q: 'Что такое база рекурсии?', options: ['Простейший случай', 'Первый вызов', 'Ошибка', 'Цикл'], answer: 0, explain: 'База останавливает рекурсию.' },
          { q: 'Что делает рекурсивный шаг?', options: ['Уменьшает задачу', 'Увеличивает n', 'Ничего', 'Завершает программу'], answer: 0, explain: 'Он приближает базу.' },
          { q: 'Что будет без базы?', options: ['RecursionError', 'Ускорение', 'Ничего', 'Пустой вывод'], answer: 0, explain: 'Стек переполнится.' },
          { q: 'Чему равно 3!?', options: ['6', '3', '9', '12'], answer: 0, explain: '3 × 2 × 1 = 6.' },
          { q: 'Сколько вызовов у factorial(2) с базой?', options: ['3', '2', '1', '4'], answer: 0, explain: 'factorial(2), (1), (0).' }
        ]
      },
      {
        k: 'concept',
        eyebrow: '03 · МЕХАНИЗМ',
        title: 'Как устроен стек',
        lead: 'Каждый вызов создаёт кадр: имя функции, аргументы и место, куда вернуть результат. Кадры складываются друг на друга.',
        blocks: [
          { t: 'svg', svg: REC_SVG, caption: 'Стек вызовов factorial(4)' },
          {
            t: 'steps',
            items: [
              { title: 'Вызов', text: 'factorial(4) создаёт кадр и вызывает factorial(3).' },
              { title: 'Рост', text: 'Кадры накапливаются: 4 → 3 → 2 → 1 → 0.' },
              { title: 'База', text: 'factorial(0) возвращает 1 и больше никого не вызывает.' },
              { title: 'Возврат', text: 'Кадры закрываются сверху вниз: 1 → 1 → 2 → 6 → 24.' }
            ]
          },
          {
            t: 'callout',
            tone: 'warn',
            icon: 'fas fa-triangle-exclamation',
            title: 'RecursionError',
            text: 'По умолчанию Python допускает около 1000 вложенных вызовов. Если база не достигается, стек переполняется и программа падает с ошибкой RecursionError: maximum recursion depth exceeded.'
          },
          {
            t: 'code',
            title: 'stack_depth.py',
            code: 'import sys\n\nprint(sys.getrecursionlimit())   # 1000 — предел по умолчанию\n\ndef depth(n):\n    if n == 0:\n        return 0\n    return 1 + depth(n - 1)\n\nprint(depth(10))    # 10 кадров\n# depth(2000) → RecursionError'
          }
        ]
      },
      {
        k: 'lab',
        eyebrow: '04 · ИНТЕРАКТИВ',
        title: 'Понаблюдайте за стеком',
        lead: 'Запустите вычисление и следите, сколько кадров накоплено в каждый момент.',
        widget: {
          kind: 'recursion',
          config: { fn: 'countdown', n: 4 }
        },
        after: [
          {
            t: 'callout',
            tone: 'good',
            icon: 'fas fa-lightbulb',
            title: 'Вывод',
            text: 'Максимальная глубина стека равна n + 1: кадры от n до 0. Чем больше n, тем больше памяти занимает рекурсия.'
          }
        ]
      },
      {
        k: 'concept',
        eyebrow: '05 · ГЛУБИНА',
        title: 'Сколько кадров нужно',
        lead: 'Глубина рекурсии — это максимальное число одновременно открытых вызовов.',
        blocks: [
          {
            t: 'table',
            caption: 'Глубина для разных задач',
            head: ['Функция', 'Вызов', 'Глубина', 'Примечание'],
            rows: [
              ['factorial', 'factorial(5)', '6', 'от 5 до 0'],
              ['countdown', 'countdown(100)', '101', 'линейный рост'],
              ['digit_sum', 'digit_sum(12345)', '6', 'по числу цифр'],
              ['reverse', 'reverse("python")', '7', 'по длине строки']
            ],
            highlight: 1
          },
          {
            t: 'callout',
            icon: 'fas fa-gauge-high',
            title: 'Практическое правило',
            text: 'Если глубина может быть большой (десятки тысяч), рекурсию заменяют циклом. Рекурсия хороша там, где глубина невелика: деревья, разбор выражений, «разделяй и властвуй».'
          },
          {
            t: 'compare',
            left: { title: 'Плюсы стека', items: ['Автоматическое хранение состояния', 'Короткая запись', 'Естественность для деревьев'] },
            right: { title: 'Минусы стека', items: ['Ограничение глубины', 'Расход памяти на кадры', 'Риск RecursionError'] },
            vs: '⇄'
          }
        ]
      },
      {
        k: 'practice',
        eyebrow: '06 · ПРАКТИКА',
        title: 'Считаем кадры',
        lead: 'Определите глубину стека и предскажите результат.',
        tasks: [
          { title: 'Глубина', q: 'Сколько кадров одновременно открыто при вызове factorial(4)?', answer: '5', type: 'number', explain: 'Кадры 4, 3, 2, 1, 0 — пять.', hint: 'Не забудьте базу.' },
          { title: 'Порядок', q: 'Какой вызов закроется первым?', answer: ['factorial(0)', 'factorial0', 'база', 'последний'], explain: 'Стек работает по принципу LIFO.', hint: 'Последний пришёл — первый вышел.' },
          { title: 'Ошибка', q: 'Как называется ошибка переполнения стека?', answer: ['recursionerror', 'recursion error', 'maximum recursion depth exceeded'], explain: 'Python сообщает RecursionError.', hint: 'Слово начинается с «Recursion».' },
          { title: 'Предел', q: 'Сколько вызовов допускает Python по умолчанию (примерно)?', answer: '1000', type: 'number', explain: 'sys.getrecursionlimit() возвращает 1000.', hint: 'Круглое число, тысяча.' },
          { title: 'Вывод', q: 'Что выведет depth(3), если depth возвращает 1 + depth(n - 1), а база 0?', answer: '3', type: 'number', explain: 'Три шага до базы.', hint: 'Считайте кадры без базового.' }
        ],
        criteria: [
          { mark: '1 балл', text: 'Порядок LIFO объяснён.' },
          { mark: '1 балл', text: 'Глубина вычислена верно.' },
          { mark: '1 балл', text: 'Причина RecursionError названа.' }
        ]
      },
      {
        k: 'quiz',
        eyebrow: '07 · ПРОВЕРКА',
        questions: [
          { q: 'По какому принципу работает стек?', options: ['LIFO', 'FIFO', 'Случайно', 'По алфавиту'], answer: 0, explain: 'Последний пришёл — первый вышел.' },
          { q: 'Что хранится в кадре вызова?', options: ['Аргументы и точка возврата', 'Только имя функции', 'Только результат', 'Ничего'], answer: 0, explain: 'Кадр хранит состояние вызова.' },
          { q: 'Когда кадры закрываются?', options: ['При возврате значения', 'При новом вызове', 'При запуске', 'Никогда'], answer: 0, explain: 'Возврат закрывает верхний кадр.' },
          { q: 'Что вызовет RecursionError?', options: ['Отсутствие базы', 'Наличие базы', 'Маленькое n', 'Печать результата'], answer: 0, explain: 'Стек переполнится.' },
          { q: 'Сколько кадров у factorial(3)?', options: ['4', '3', '2', '5'], answer: 0, explain: '3, 2, 1, 0.' }
        ]
      },
      {
        k: 'summary',
        points: [
          'Стек вызовов хранит незавершённые вызовы.',
          'Работает по принципу LIFO.',
          'База закрывает верхний кадр.',
          'Глубина равна числу одновременных вызовов.',
          'Переполнение стека даёт RecursionError.'
        ],
        ticket: [
          'Стек вызовов нужен, чтобы ...',
          'LIFO означает ...',
          'RecursionError возникает, когда ...'
        ]
      }
    ]
  });

  /* ==========================================================================
     УРОК 4. Факториал
     ========================================================================== */
  Q2.add('10emn-q2-4', {
    num: 4,
    cls: '10 ЕМН',
    title: 'Рекурсия',
    slides: [
      {
        k: 'hero',
        eyebrow: '01 · ВВЕДЕНИЕ',
        title: '<span class="accent-text">Рекурсия</span>',
        lead: 'Факториал — первая рекурсивная функция, которую пишут почти все. Он короткий, но содержит всё: базу, шаг, стек и возврат значений.',
        goal: 'Записывать факториал рекурсивно и объяснять каждый шаг вычисления.',
        goalCode: '10.2.1.3',
        chips: [
          { icon: 'fas fa-superscript', text: '0! = 1' },
          { icon: 'fas fa-code', text: 'return n * f(n - 1)' },
          { icon: 'fas fa-database', text: 'Python-практикум' }
        ],
        visual: 'recursion',
        visualCaption: 'Умножение при возврате',
        cta: 'Разобрать код'
      },
      {
        k: 'review',
        questions: [
          { q: 'Как работает стек вызовов?', options: ['LIFO', 'FIFO', 'Случайно', 'По алфавиту'], answer: 0, explain: 'Последний пришёл — первый вышел.' },
          { q: 'Что хранит кадр вызова?', options: ['Аргументы и точку возврата', 'Только результат', 'Только имя', 'Ничего'], answer: 0, explain: 'Состояние вызова.' },
          { q: 'Когда закрывается кадр?', options: ['При возврате значения', 'При вызове', 'При старте', 'Никогда'], answer: 0, explain: 'Возврат закрывает кадр.' },
          { q: 'Что даёт RecursionError?', options: ['Переполнение стека', 'Наличие базы', 'Малое n', 'Печать'], answer: 0, explain: 'Стек не бесконечен.' },
          { q: 'Сколько кадров у factorial(2)?', options: ['3', '2', '1', '4'], answer: 0, explain: '2, 1, 0.' }
        ]
      },
      {
        k: 'concept',
        eyebrow: '03 · ОПРЕДЕЛЕНИЕ',
        title: 'Математика и код',
        lead: 'Факториал определён рекурсивно: 0! = 1, n! = n × (n − 1)!. Код повторяет это определение почти дословно.',
        blocks: [
          {
            t: 'definition',
            term: 'Факториал',
            text: 'Факториал числа n (n!) — произведение всех натуральных чисел от 1 до n. По определению 0! = 1.',
            sub: 'n! = n × (n − 1)!,  0! = 1'
          },
          {
            t: 'code',
            title: 'factorial.py',
            code: 'def factorial(n):\n    if n == 0:              # база\n        return 1\n    return n * factorial(n - 1)   # шаг\n\nprint(factorial(0))   # 1\nprint(factorial(1))   # 1\nprint(factorial(5))   # 120\nprint(factorial(10))  # 3628800'
          },
          {
            t: 'table',
            caption: 'Трассировка factorial(4)',
            head: ['Вызов', 'Возвращает', 'Значение'],
            rows: [
              ['factorial(0)', '1', '1'],
              ['factorial(1)', '1 × 1', '1'],
              ['factorial(2)', '2 × 1', '2'],
              ['factorial(3)', '3 × 2', '6'],
              ['factorial(4)', '4 × 6', '24']
            ],
            highlight: 4
          },
          {
            t: 'callout',
            icon: 'fas fa-lightbulb',
            title: 'Почему база именно 0',
            text: 'Можно взять базу n == 1 и вернуть 1 — результат тот же для n ≥ 1. Но тогда factorial(0) придётся обрабатывать отдельно, поэтому база n == 0 удобнее и соответствует математическому определению.'
          }
        ]
      },
      {
        k: 'lab',
        eyebrow: '04 · ИНТЕРАКТИВ',
        title: 'Соберите factorial(5)',
        lead: 'Запустите вычисление и проверьте, на каком шаге срабатывает база и как растёт произведение.',
        widget: {
          kind: 'recursion',
          config: { fn: 'fact', n: 5 }
        },
        after: [
          {
            t: 'callout',
            tone: 'good',
            icon: 'fas fa-check',
            title: 'Результат',
            text: 'factorial(5) = 120. Обратите внимание: умножение выполняется на обратном пути, когда кадры закрываются.'
          }
        ]
      },
      {
        k: 'concept',
        eyebrow: '05 · PYTHON-ПРАКТИКУМ',
        title: 'Пишем и проверяем',
        lead: 'Соберите функцию в редакторе, затем проверьте её на нескольких значениях.',
        blocks: [
          {
            t: 'widget',
            kind: 'pythonRef',
            config: {
              title: 'Напоминание Python',
              groups: [
                {
                  title: 'Функции',
                  items: [
                    { cmd: 'def f(n):', text: 'объявление функции' },
                    { cmd: 'return значение', text: 'вернуть результат' },
                    { cmd: 'if n == 0:', text: 'проверка базы' },
                    { cmd: 'f(n - 1)', text: 'рекурсивный вызов' }
                  ]
                },
                {
                  title: 'Проверка',
                  items: [
                    { cmd: 'print(f(5))', text: 'вывести результат' },
                    { cmd: 'assert f(5) == 120', text: 'проверка утверждением' },
                    { cmd: 'for n in range(6):', text: 'перебор значений' },
                    { cmd: 'math.factorial(5)', text: 'готовая функция из math' }
                  ]
                }
              ]
            }
          },
          {
            t: 'code',
            title: 'test_factorial.py',
            code: 'def factorial(n):\n    if n == 0:\n        return 1\n    return n * factorial(n - 1)\n\nfor n in range(6):\n    print(n, "! =", factorial(n))\n\nassert factorial(0) == 1\nassert factorial(5) == 120\nprint("Все проверки пройдены")'
          },
          {
            t: 'callout',
            tone: 'warn',
            icon: 'fas fa-triangle-exclamation',
            title: 'Отрицательные числа',
            text: 'factorial(-1) с такой базой уйдёт в бесконечную рекурсию: n == 0 никогда не станет истинным. Добавьте проверку if n < 0: raise ValueError("n должно быть неотрицательным").'
          }
        ]
      },
      {
        k: 'practice',
        eyebrow: '06 · ПРАКТИКА',
        title: 'Факториал в деталях',
        lead: 'Вычисляйте и объясняйте.',
        tasks: [
          { title: 'Значение', q: 'Чему равно 6!?', answer: '720', type: 'number', explain: '6 × 120 = 720.', hint: '5! = 120.' },
          { title: 'База', q: 'Какое условие является базой в factorial?', answer: ['n == 0', 'n==0', 'if n == 0', 'n = 0'], explain: 'При n == 0 возвращается 1.', hint: 'Самое маленькое значение.' },
          { title: 'Возврат', q: 'Что возвращает factorial(1)?', answer: '1', type: 'number', explain: '1 × factorial(0) = 1 × 1.', hint: 'Единица в любой степени.' },
          { title: 'Ошибка', q: 'Что будет при factorial(-1)?', answer: ['recursionerror', 'бесконечная рекурсия', 'ошибка'], explain: 'База не достигается.', hint: 'n уменьшается, но не равно 0.' },
          { title: 'Модуль', q: 'Из какого модуля готовая функция factorial?', answer: ['math', 'import math', 'math.factorial'], explain: 'math.factorial(n).', hint: 'Математический модуль.' }
        ],
        criteria: [
          { mark: '1 балл', text: 'Функция написана без ошибок.' },
          { mark: '1 балл', text: 'Проверки assert проходят.' },
          { mark: '1 балл', text: 'Обработка отрицательных чисел добавлена.' }
        ]
      },
      {
        k: 'quiz',
        eyebrow: '07 · ПРОВЕРКА',
        questions: [
          { q: 'Чему равно 0!?', options: ['1', '0', 'Не определено', '10'], answer: 0, explain: 'По определению 0! = 1.' },
          { q: 'Какая строка — рекурсивный шаг?', options: ['return n * factorial(n - 1)', 'if n == 0:', 'return 1', 'print(n)'], answer: 0, explain: 'Шаг вызывает функцию с меньшим n.' },
          { q: 'Чему равно 5!?', options: ['120', '60', '24', '100'], answer: 0, explain: '5 × 4 × 3 × 2 × 1.' },
          { q: 'Когда выполняется умножение?', options: ['При возврате из вызовов', 'До вызова', 'Одновременно', 'Никогда'], answer: 0, explain: 'На обратном пути.' },
          { q: 'Что будет при factorial(-1)?', options: ['RecursionError', '1', '0', '-1'], answer: 0, explain: 'База недостижима.' }
        ]
      },
      {
        k: 'summary',
        points: [
          'Факториал: 0! = 1, n! = n × (n − 1)!.',
          'Код повторяет математическое определение.',
          'Умножение происходит при возврате.',
          'Глубина стека равна n + 1.',
          'Отрицательные аргументы нужно проверять отдельно.'
        ],
        ticket: [
          'База факториала — ...',
          'Шаг факториала — ...',
          'Умножение выполняется, когда ...'
        ]
      }
    ]
  });

  /* ==========================================================================
     УРОК 5. Сумма цифр числа
     ========================================================================== */
  Q2.add('10emn-q2-5', {
    num: 5,
    cls: '10 ЕМН',
    title: 'Рекурсия',
    slides: [
      {
        k: 'hero',
        eyebrow: '01 · ВВЕДЕНИЕ',
        title: '<span class="accent-text">Рекурсия</span>',
        lead: 'Число 4721 — это 1 плюс сумма цифр числа 472. Один остаток от деления и один целочисленный раздел — и задача стала меньше.',
        goal: 'Применять рекурсию к разбору числа на цифры.',
        goalCode: '10.2.1.4',
        chips: [
          { icon: 'fas fa-percent', text: 'n % 10 — последняя цифра' },
          { icon: 'fas fa-divide', text: 'n // 10 — остальные цифры' },
          { icon: 'fas fa-arrow-trend-down', text: 'Число уменьшается' }
        ],
        visual: 'recursion',
        visualCaption: 'Каждый шаг отрезает одну цифру',
        cta: 'Разобрать пример'
      },
      {
        k: 'review',
        questions: [
          { q: 'Чему равно 0!?', options: ['1', '0', 'Не определено', '10'], answer: 0, explain: 'По определению.' },
          { q: 'Чему равно 5!?', options: ['120', '60', '24', '100'], answer: 0, explain: '5 × 4 × 3 × 2 × 1.' },
          { q: 'Какая строка — шаг в factorial?', options: ['return n * factorial(n - 1)', 'if n == 0:', 'return 1', 'print(n)'], answer: 0, explain: 'Вызов с меньшим n.' },
          { q: 'Когда выполняется умножение?', options: ['При возврате', 'До вызова', 'Сразу', 'Никогда'], answer: 0, explain: 'На обратном пути.' },
          { q: 'Что будет при factorial(-1)?', options: ['RecursionError', '1', '0', '-1'], answer: 0, explain: 'База недостижима.' }
        ]
      },
      {
        k: 'concept',
        eyebrow: '03 · ИДЕЯ',
        title: 'Последняя цифра и остаток',
        lead: 'Операция % 10 даёт последнюю цифру, // 10 отбрасывает её. Это готовый шаг уменьшения задачи.',
        blocks: [
          {
            t: 'table',
            caption: 'Разбор числа 4721',
            head: ['Число', 'n % 10', 'n // 10'],
            rows: [
              ['4721', '1', '472'],
              ['472', '2', '47'],
              ['47', '7', '4'],
              ['4', '4', '0']
            ],
            highlight: 0
          },
          {
            t: 'code',
            title: 'digit_sum.py',
            code: 'def digit_sum(n):\n    if n == 0:                      # база\n        return 0\n    return n % 10 + digit_sum(n // 10)   # шаг\n\nprint(digit_sum(4721))   # 4+7+2+1 = 14\nprint(digit_sum(9))      # 9\nprint(digit_sum(1000))   # 1'
          },
          {
            t: 'steps',
            items: [
              { title: 'Шаг 1', text: 'digit_sum(4721) = 1 + digit_sum(472)' },
              { title: 'Шаг 2', text: 'digit_sum(472) = 2 + digit_sum(47)' },
              { title: 'Шаг 3', text: 'digit_sum(47) = 7 + digit_sum(4)' },
              { title: 'Шаг 4', text: 'digit_sum(4) = 4 + digit_sum(0)' },
              { title: 'База', text: 'digit_sum(0) = 0, сумма собирается обратно: 4 + 7 + 2 + 1 = 14' }
            ]
          },
          {
            t: 'callout',
            tone: 'warn',
            icon: 'fas fa-triangle-exclamation',
            title: 'Ноль — особый случай',
            text: 'digit_sum(0) = 0 по базе. Но если спросить «сколько цифр в числе 0», ответ 1, а не 0. Для подсчёта цифр базу делают иначе: if n < 10: return 1.'
          }
        ]
      },
      {
        k: 'lab',
        eyebrow: '04 · ИНТЕРАКТИВ',
        title: 'Сумма цифр по шагам',
        lead: 'Введите число и проследите, как отрезаются цифры и складывается результат.',
        widget: {
          kind: 'recursion',
          config: { fn: 'digits', n: 4721 }
        },
        after: [
          {
            t: 'callout',
            tone: 'good',
            icon: 'fas fa-check',
            title: 'Проверка',
            text: 'Для 4721 сумма равна 14. Попробуйте 999 — получится 27, и 100000 — получится 1.'
          }
        ]
      },
      {
        k: 'concept',
        eyebrow: '05 · PYTHON-ПРАКТИКУМ',
        title: 'Считаем цифры и ищем максимум',
        lead: 'Тот же приём решает несколько задач: сумма, количество и максимальная цифра.',
        blocks: [
          {
            t: 'widget',
            kind: 'pythonRef',
            config: {
              title: 'Напоминание Python',
              groups: [
                {
                  title: 'Операции с числом',
                  items: [
                    { cmd: 'n % 10', text: 'последняя цифра' },
                    { cmd: 'n // 10', text: 'число без последней цифры' },
                    { cmd: 'max(a, b)', text: 'большее из двух' },
                    { cmd: 'n < 10', text: 'число из одной цифры' }
                  ]
                },
                {
                  title: 'Полезное',
                  items: [
                    { cmd: 'len(str(n))', text: 'количество цифр через строку' },
                    { cmd: 'sum(map(int, str(n)))', text: 'сумма цифр без рекурсии' },
                    { cmd: 'while n > 0:', text: 'циклический вариант' },
                    { cmd: 'n //= 10', text: 'сокращённая запись n = n // 10' }
                  ]
                }
              ]
            }
          },
          {
            t: 'code',
            title: 'digit_tasks.py',
            code: 'def digit_sum(n):\n    if n == 0:\n        return 0\n    return n % 10 + digit_sum(n // 10)\n\ndef digit_count(n):\n    if n < 10:\n        return 1\n    return 1 + digit_count(n // 10)\n\ndef max_digit(n):\n    if n < 10:\n        return n\n    return max(n % 10, max_digit(n // 10))\n\nprint(digit_sum(4721))     # 14\nprint(digit_count(4721))   # 4\nprint(max_digit(4721))     # 7'
          },
          {
            t: 'compare',
            left: { title: 'Рекурсия', items: ['Код повторяет определение', 'Не нужны счётчики', 'Глубина = число цифр'] },
            right: { title: 'Цикл', items: ['Не боится больших чисел', 'Нужна переменная-накопитель', 'Чуть длиннее'] },
            vs: '⇄'
          }
        ]
      },
      {
        k: 'practice',
        eyebrow: '06 · ПРАКТИКА',
        title: 'Считаем цифры',
        lead: 'Вычислите вручную или мысленно выполните код.',
        tasks: [
          { title: 'Сумма', q: 'Чему равна сумма цифр числа 4721?', answer: '14', type: 'number', explain: '4 + 7 + 2 + 1 = 14.', hint: 'Сложите все цифры.' },
          { title: 'Последняя', q: 'Что вернёт 4721 % 10?', answer: '1', type: 'number', explain: 'Остаток от деления на 10 — последняя цифра.', hint: 'Последняя цифра числа.' },
          { title: 'Остаток', q: 'Что вернёт 4721 // 10?', answer: '472', type: 'number', explain: 'Целочисленное деление отбрасывает последнюю цифру.', hint: 'Уберите последнюю цифру.' },
          { title: 'База', q: 'Что возвращает digit_sum(0)?', answer: '0', type: 'number', explain: 'База функции.', hint: 'Сумма цифр нуля по базе.' },
          { title: 'Цифры', q: 'Сколько цифр в числе 4721?', answer: '4', type: 'number', explain: 'Четыре цифры: 4, 7, 2, 1.', hint: 'Посчитайте символы.' }
        ],
        criteria: [
          { mark: '1 балл', text: 'Шаг уменьшения задачи объяснён.' },
          { mark: '1 балл', text: 'Значения вычислены верно.' },
          { mark: '1 балл', text: 'Различие базы для суммы и количества понято.' }
        ]
      },
      {
        k: 'quiz',
        eyebrow: '07 · ПРОВЕРКА',
        questions: [
          { q: 'Что даёт n % 10?', options: ['Последнюю цифру', 'Первую цифру', 'Количество цифр', 'Сумму цифр'], answer: 0, explain: 'Остаток от деления на 10.' },
          { q: 'Что даёт n // 10?', options: ['Число без последней цифры', 'Последнюю цифру', 'Удвоенное число', 'Ноль'], answer: 0, explain: 'Целочисленное деление.' },
          { q: 'База digit_sum — это ...', options: ['n == 0 → 0', 'n == 1 → 1', 'n < 10 → n', 'нет базы'], answer: 0, explain: 'Сумма цифр нуля равна нулю.' },
          { q: 'Сумма цифр 999?', options: ['27', '18', '9', '999'], answer: 0, explain: '9 + 9 + 9 = 27.' },
          { q: 'Глубина digit_sum(4721)?', options: ['5', '4', '3', '6'], answer: 0, explain: '4721, 472, 47, 4, 0 — пять кадров.' }
        ]
      },
      {
        k: 'summary',
        points: [
          'n % 10 — последняя цифра, n // 10 — остальные.',
          'Сумма цифр: n % 10 + digit_sum(n // 10).',
          'База суммы — digit_sum(0) = 0.',
          'Для количества цифр база другая: n < 10 → 1.',
          'Глубина равна числу цифр плюс один.'
        ],
        ticket: [
          'Последняя цифра числа — это ...',
          'Шаг digit_sum — ...',
          'Для количества цифр база ...'
        ]
      }
    ]
  });

  /* ==========================================================================
     УРОК 6. Переворот строки
     ========================================================================== */
  Q2.add('10emn-q2-6', {
    num: 6,
    cls: '10 ЕМН',
    title: 'Рекурсия',
    slides: [
      {
        k: 'hero',
        eyebrow: '01 · ВВЕДЕНИЕ',
        title: '<span class="accent-text">Рекурсия</span>',
        lead: '«дом» → «мод». Чтобы перевернуть строку рекурсивно, отрежем первый символ и перевернём остаток, а потом приклеим символ в конец.',
        goal: 'Писать рекурсивную функцию разворота строки и объяснять порядок склейки.',
        goalCode: '10.2.1.5',
        chips: [
          { icon: 'fas fa-scissors', text: 's[1:] — остаток строки' },
          { icon: 'fas fa-plus', text: 's[0] — первый символ' },
          { icon: 'fas fa-rotate-left', text: 'Склейка при возврате' }
        ],
        visual: 'recursion',
        visualCaption: 'Символы возвращаются в обратном порядке',
        cta: 'Перевернуть'
      },
      {
        k: 'review',
        questions: [
          { q: 'Что даёт n % 10?', options: ['Последнюю цифру', 'Первую цифру', 'Длину', 'Сумму'], answer: 0, explain: 'Остаток от деления на 10.' },
          { q: 'Что даёт n // 10?', options: ['Число без последней цифры', 'Последнюю цифру', 'Удвоение', 'Ноль'], answer: 0, explain: 'Целочисленное деление.' },
          { q: 'База digit_sum?', options: ['n == 0 → 0', 'n == 1 → 1', 'n < 10 → n', 'нет базы'], answer: 0, explain: 'Сумма цифр нуля.' },
          { q: 'Сумма цифр 999?', options: ['27', '18', '9', '999'], answer: 0, explain: '9 + 9 + 9.' },
          { q: 'Глубина digit_sum(4721)?', options: ['5', '4', '3', '6'], answer: 0, explain: 'Пять кадров.' }
        ]
      },
      {
        k: 'concept',
        eyebrow: '03 · СРЕЗЫ',
        title: 'Срез — это уменьшение',
        lead: 'Срез s[1:] возвращает строку без первого символа. Это и есть задача меньшего размера.',
        blocks: [
          {
            t: 'table',
            caption: 'Разбор строки «дом»',
            head: ['Строка', 's[0]', 's[1:]'],
            rows: [
              ['дом', 'д', 'ом'],
              ['ом', 'о', 'м'],
              ['м', 'м', ''],
              ['', '—', '—']
            ],
            highlight: 2
          },
          {
            t: 'code',
            title: 'reverse.py',
            code: 'def reverse(s):\n    if s == "":                 # база\n        return ""\n    return reverse(s[1:]) + s[0]   # шаг\n\nprint(reverse("дом"))     # мод\nprint(reverse("python"))  # nohtyp\nprint(reverse(""))        # пустая строка'
          },
          {
            t: 'steps',
            items: [
              { title: 'reverse("дом")', text: 'reverse("ом") + "д"' },
              { title: 'reverse("ом")', text: 'reverse("м") + "о"' },
              { title: 'reverse("м")', text: 'reverse("") + "м"' },
              { title: 'База', text: 'reverse("") = ""' },
              { title: 'Сборка', text: '"м" → "мо" → "мод"' }
            ]
          },
          {
            t: 'callout',
            icon: 'fas fa-lightbulb',
            title: 'Почему символ в конце',
            text: 'Первый символ должен оказаться последним, поэтому его приклеивают после результата разворота остатка. Если поставить s[0] + reverse(s[1:]), строка не изменится.'
          }
        ]
      },
      {
        k: 'lab',
        eyebrow: '04 · ИНТЕРАКТИВ',
        title: 'Разворот по шагам',
        lead: 'Введите слово и проследите, как символы «отклеиваются» и возвращаются в обратном порядке.',
        widget: {
          kind: 'recursion',
          config: { fn: 'reverse', n: 5 }
        },
        after: [
          {
            t: 'callout',
            tone: 'good',
            icon: 'fas fa-check',
            title: 'Сравнение',
            text: 'Для строки «python» результат — «nohtyp». В Python есть готовый способ: s[::-1], но рекурсивная версия показывает саму идею.'
          }
        ]
      },
      {
        k: 'lab',
        eyebrow: '05 · PYTHON-ПРАКТИКУМ',
        title: 'Что выведет программа',
        lead: 'Прочитайте код и выберите верный результат.',
        widget: {
          kind: 'codePredict',
          config: {
            title: 'predict.py',
            code: 'def reverse(s):\n    if s == "":\n        return ""\n    return reverse(s[1:]) + s[0]\n\nprint(reverse("abc"))',
            options: ['cba', 'abc', 'bc', 'Ошибка'],
            answer: 0,
            explain: 'Символы возвращаются в обратном порядке: reverse("bc") + "a" → reverse("c") + "b" + "a" → "c" + "b" + "a" = "cba".'
          }
        },
        after: [
          {
            t: 'code',
            title: 'варианты.py',
            code: '# без рекурсии\nprint("abc"[::-1])          # cba\nprint("".join(reversed("abc")))   # cba\n\n# палиндром\nword = "шалаш"\nprint(word == word[::-1])   # True'
          },
          {
            t: 'callout',
            tone: 'warn',
            icon: 'fas fa-triangle-exclamation',
            title: 'Срез и индекс',
            text: 's[1:] — строка без первого символа, а s[1] — второй символ. Не путайте срез с индексом: в базе нужно проверять пустую строку, а не длину 1.'
          }
        ]
      },
      {
        k: 'practice',
        eyebrow: '06 · ПРАКТИКА',
        title: 'Разворот строки',
        lead: 'Предскажите результат и запишите ответ без кавычек.',
        tasks: [
          { title: 'Слово', q: 'Что вернёт reverse("дом")?', answer: ['мод', 'mod'], explain: 'Символы идут в обратном порядке.', hint: 'Прочитайте справа налево.' },
          { title: 'Срез', q: 'Что вернёт "python"[1:]?', answer: 'ython', explain: 'Строка без первого символа.', hint: 'Уберите «p».' },
          { title: 'База', q: 'Что возвращает reverse("")?', answer: ['""', 'пустая строка', 'пусто'], explain: 'База — пустая строка.', hint: 'Ничего.' },
          { title: 'Палиндром', q: 'Является ли «шалаш» палиндромом?', answer: ['да', 'yes'], explain: 'Читается одинаково в обе стороны.', hint: 'Сравните с обратной записью.' },
          { title: 'Порядок', q: 'Что вернёт "abc"[::-1]?', answer: 'cba', explain: 'Срез с шагом −1 переворачивает строку.', hint: 'Справа налево.' }
        ],
        criteria: [
          { mark: '1 балл', text: 'Порядок склейки объяснён.' },
          { mark: '1 балл', text: 'Результаты предсказаны верно.' },
          { mark: '1 балл', text: 'Палиндром проверен через разворот.' }
        ]
      },
      {
        k: 'quiz',
        eyebrow: '07 · ПРОВЕРКА',
        questions: [
          { q: 'Что возвращает s[1:]?', options: ['Строку без первого символа', 'Первый символ', 'Строку без последнего', 'Пустую строку'], answer: 0, explain: 'Срез от второго символа до конца.' },
          { q: 'Где в шаге стоит s[0]?', options: ['После reverse(s[1:])', 'Перед reverse(s[1:])', 'Внутри базы', 'Нигде'], answer: 0, explain: 'Первый символ должен стать последним.' },
          { q: 'База reverse — это ...', options: ['s == "" → ""', 'len(s) == 1', 's == "a"', 'нет базы'], answer: 0, explain: 'Пустая строка.' },
          { q: 'Результат reverse("abc")?', options: ['cba', 'abc', 'bc', 'cb'], answer: 0, explain: 'Обратный порядок.' },
          { q: 'Альтернатива без рекурсии?', options: ['s[::-1]', 's[1:]', 's[0]', 'len(s)'], answer: 0, explain: 'Срез с шагом −1.' }
        ]
      },
      {
        k: 'summary',
        points: [
          'Срез s[1:] уменьшает строку на символ.',
          'Шаг: reverse(s[1:]) + s[0].',
          'База — пустая строка.',
          'Символы склеиваются при возврате.',
          'Без рекурсии работает s[::-1].'
        ],
        ticket: [
          'Срез s[1:] возвращает ...',
          'В шаге первый символ ставится ...',
          'База разворота — ...'
        ]
      }
    ]
  });

  /* ==========================================================================
     УРОК 7. Рекурсия и цикл
     ========================================================================== */
  Q2.add('10emn-q2-7', {
    num: 7,
    cls: '10 ЕМН',
    title: 'Рекурсия',
    slides: [
      {
        k: 'hero',
        eyebrow: '01 · ВВЕДЕНИЕ',
        title: '<span class="accent-text">Рекурсия</span>',
        lead: 'Любую линейную рекурсию можно записать циклом, и наоборот. Вопрос не «что лучше», а «что понятнее в конкретной задаче».',
        goal: 'Сравнивать рекурсивное и циклическое решения, переводить одно в другое.',
        goalCode: '10.2.1.6',
        chips: [
          { icon: 'fas fa-repeat', text: 'Цикл while' },
          { icon: 'fas fa-arrows-rotate', text: 'Перевод решения' },
          { icon: 'fas fa-scale-balanced', text: 'Выбор подхода' }
        ],
        visual: 'recursion',
        visualCaption: 'Одна задача — две записи',
        cta: 'Сравнить'
      },
      {
        k: 'review',
        questions: [
          { q: 'Что возвращает s[1:]?', options: ['Строку без первого символа', 'Первый символ', 'Строку без последнего', 'Пустую строку'], answer: 0, explain: 'Срез с индекса 1.' },
          { q: 'Где в шаге разворота стоит s[0]?', options: ['После reverse(s[1:])', 'Перед ним', 'В базе', 'Нигде'], answer: 0, explain: 'Первый символ должен стать последним.' },
          { q: 'База reverse?', options: ['s == "" → ""', 'len(s) == 1', 's == "a"', 'нет базы'], answer: 0, explain: 'Пустая строка.' },
          { q: 'Результат reverse("abc")?', options: ['cba', 'abc', 'bc', 'cb'], answer: 0, explain: 'Обратный порядок.' },
          { q: 'Альтернатива без рекурсии?', options: ['s[::-1]', 's[1:]', 's[0]', 'len(s)'], answer: 0, explain: 'Срез с шагом −1.' }
        ]
      },
      {
        k: 'concept',
        eyebrow: '03 · СРАВНЕНИЕ',
        title: 'Одна задача — две записи',
        lead: 'Сравним сумму чисел от 1 до n, записанную двумя способами.',
        blocks: [
          {
            t: 'compare',
            left: {
              title: 'Рекурсия',
              items: ['Короткая запись', 'Повторяет определение', 'Расходует стек', 'Глубина растёт с n']
            },
            right: {
              title: 'Цикл',
              items: ['Не ограничен глубиной', 'Нужна переменная-накопитель', 'Чуть более «процедурная» запись', 'Работает для больших n']
            },
            vs: '⇄'
          },
          {
            t: 'code',
            title: 'two_ways.py',
            code: '# рекурсия\ndef total_rec(n):\n    if n == 0:\n        return 0\n    return n + total_rec(n - 1)\n\n# цикл\ndef total_loop(n):\n    total = 0\n    while n > 0:\n        total += n\n        n -= 1\n    return total\n\nprint(total_rec(5), total_loop(5))   # 15 15'
          },
          {
            t: 'table',
            caption: 'Что выбрать',
            head: ['Ситуация', 'Лучше'],
            rows: [
              ['Дерево, граф, вложенные папки', 'Рекурсия'],
              ['Длинный список, десятки тысяч шагов', 'Цикл'],
              ['Математическое определение', 'Рекурсия'],
              ['Подсчёт в цикле по коллекции', 'Цикл']
            ],
            highlight: 0
          },
          {
            t: 'callout',
            icon: 'fas fa-code-branch',
            title: 'Правило перевода',
            text: 'База рекурсии становится начальным значением накопителя, а шаг — телом цикла. Например, для факториала: result = 1, затем result *= n при уменьшении n.'
          }
        ]
      },
      {
        k: 'lab',
        eyebrow: '04 · ТРЕНАЖЁР',
        title: 'Переведите рекурсию в цикл',
        lead: 'Пять коротких вопросов на соответствие двух записей.',
        widget: {
          kind: 'mini',
          config: {
            tasks: [
              { title: 'Накопитель', q: 'С чего начинается накопитель для суммы 1…n?', answer: '0', type: 'number', explain: 'Нейтральный элемент сложения — 0.', hint: 'Прибавление нуля ничего не меняет.' },
              { title: 'Факториал', q: 'С чего начинается накопитель для факториала?', answer: '1', type: 'number', explain: 'Нейтральный элемент умножения — 1.', hint: 'Умножение на единицу ничего не меняет.' },
              { title: 'Условие', q: 'Какое условие цикла соответствует базе n == 0?', answer: ['while n > 0', 'while n > 0:', 'n > 0'], explain: 'Цикл идёт, пока n положительно.', hint: 'Пока не дошли до нуля.' },
              { title: 'Шаг', q: 'Как в цикле уменьшить n на единицу?', answer: ['n -= 1', 'n = n - 1', 'n = n-1', 'n-=1'], explain: 'Уменьшение на 1.', hint: 'Сокращённая запись вычитания.' },
              { title: 'Стек', q: 'Что экономит цикл по сравнению с рекурсией?', answer: ['стек', 'память стека', 'стек вызовов'], explain: 'Цикл не создаёт кадры вызовов.', hint: 'То, что переполняется.' }
            ]
          }
        }
      },
      {
        k: 'concept',
        eyebrow: '05 · PYTHON-ПРАКТИКУМ',
        title: 'Две функции — один результат',
        lead: 'Напишите обе версии и сравните их на одинаковых данных.',
        blocks: [
          {
            t: 'widget',
            kind: 'pythonRef',
            config: {
              title: 'Напоминание Python',
              groups: [
                {
                  title: 'Цикл',
                  items: [
                    { cmd: 'while n > 0:', text: 'цикл с условием' },
                    { cmd: 'total += n', text: 'накопление суммы' },
                    { cmd: 'result *= n', text: 'накопление произведения' },
                    { cmd: 'n -= 1', text: 'уменьшение счётчика' }
                  ]
                },
                {
                  title: 'Сравнение',
                  items: [
                    { cmd: 'assert f(5) == g(5)', text: 'проверка совпадения' },
                    { cmd: 'range(1, n + 1)', text: 'числа от 1 до n' },
                    { cmd: 'for i in range(n):', text: 'цикл по количеству' },
                    { cmd: 'time.perf_counter()', text: 'замер времени' }
                  ]
                }
              ]
            }
          },
          {
            t: 'code',
            title: 'compare.py',
            code: 'import sys\nsys.setrecursionlimit(5000)\n\ndef fact_rec(n):\n    if n == 0:\n        return 1\n    return n * fact_rec(n - 1)\n\ndef fact_loop(n):\n    result = 1\n    for i in range(2, n + 1):\n        result *= i\n    return result\n\nfor n in (0, 1, 5, 10):\n    assert fact_rec(n) == fact_loop(n)\n    print(n, fact_rec(n), fact_loop(n))'
          },
          {
            t: 'callout',
            tone: 'warn',
            icon: 'fas fa-triangle-exclamation',
            title: 'Предел глубины',
            text: 'fact_rec(2000) при стандартном лимите вызовет RecursionError, а fact_loop(2000) посчитает огромное число без ошибки (хотя оно будет очень длинным).'
          }
        ]
      },
      {
        k: 'practice',
        eyebrow: '06 · ПРАКТИКА',
        title: 'Перевод и выбор',
        lead: 'Отвечайте коротко.',
        tasks: [
          { title: 'Выбор', q: 'Что лучше для обхода дерева папок: рекурсия или цикл?', answer: ['рекурсия', 'recursion'], explain: 'Дерево имеет рекурсивную структуру.', hint: 'Структура повторяет себя.' },
          { title: 'Выбор', q: 'Что лучше для суммы миллиона чисел?', answer: ['цикл', 'loop'], explain: 'Рекурсия упрётся в глубину стека.', hint: 'Не нужен стек.' },
          { title: 'Накопитель', q: 'Начальное значение накопителя произведения?', answer: '1', type: 'number', explain: 'Нейтральный элемент умножения.', hint: 'Не ноль.' },
          { title: 'Результат', q: 'Чему равна сумма 1…5?', answer: '15', type: 'number', explain: '1+2+3+4+5 = 15.', hint: 'Сложите числа.' },
          { title: 'Ошибка', q: 'Какая ошибка возникает у глубокой рекурсии?', answer: ['recursionerror', 'recursion error'], explain: 'Переполнение стека.', hint: 'Название начинается с Recursion.' }
        ],
        criteria: [
          { mark: '1 балл', text: 'Обе версии написаны и совпадают.' },
          { mark: '1 балл', text: 'Выбор подхода обоснован.' },
          { mark: '1 балл', text: 'Ограничение глубины упомянуто.' }
        ]
      },
      {
        k: 'quiz',
        eyebrow: '07 · ПРОВЕРКА',
        questions: [
          { q: 'Что становится базой при переводе в цикл?', options: ['Начальное значение накопителя', 'Тело цикла', 'Условие выхода', 'Комментарий'], answer: 0, explain: 'База задаёт стартовое значение.' },
          { q: 'Что экономит цикл?', options: ['Стек вызовов', 'Переменные', 'Числа', 'Строки'], answer: 0, explain: 'Нет кадров вызовов.' },
          { q: 'Когда рекурсия удобнее?', options: ['Для деревьев и графов', 'Для длинных списков', 'Для суммы миллиона чисел', 'Всегда'], answer: 0, explain: 'Структура задачи рекурсивна.' },
          { q: 'Начальное значение для произведения?', options: ['1', '0', '−1', 'n'], answer: 0, explain: 'Нейтральный элемент умножения.' },
          { q: 'Что случится с fact_rec(2000)?', options: ['RecursionError', 'Ноль', 'Бесконечность', 'Ничего'], answer: 0, explain: 'Превышен лимит глубины.' }
        ]
      },
      {
        k: 'summary',
        points: [
          'Линейная рекурсия переводится в цикл и наоборот.',
          'База → начальное значение, шаг → тело цикла.',
          'Цикл не ограничен глубиной стека.',
          'Рекурсия понятнее для деревьев и графов.',
          'Выбор зависит от структуры задачи.'
        ],
        ticket: [
          'Цикл экономит ...',
          'Рекурсия удобнее, когда ...',
          'При переводе база становится ...'
        ]
      }
    ]
  });

  /* ==========================================================================
     УРОК 8. Рекурсия: подготовка к СОР
     ========================================================================== */
  Q2.add('10emn-q2-8', {
    num: 8,
    cls: '10 ЕМН',
    title: 'Рекурсия',
    slides: [
      {
        k: 'hero',
        eyebrow: '01 · ВВЕДЕНИЕ',
        title: '<span class="accent-text">Рекурсия</span>',
        lead: 'Семь уроков рекурсии сводятся к четырём умениям: найти базу, записать шаг, объяснить стек и выбрать между рекурсией и циклом.',
        goal: 'Систематизировать тему рекурсии и подготовиться к суммативному оцениванию.',
        goalCode: '10.2.1.7',
        chips: [
          { icon: 'fas fa-list-check', text: 'Чек-лист темы' },
          { icon: 'fas fa-dumbbell', text: 'Тренажёр' },
          { icon: 'fas fa-file-pen', text: 'Формат СОР' }
        ],
        visual: 'recursion',
        visualCaption: 'Итоговая схема темы',
        cta: 'Повторить'
      },
      {
        k: 'review',
        questions: [
          { q: 'Что такое база рекурсии?', options: ['Простейший случай', 'Первый вызов', 'Ошибка', 'Цикл'], answer: 0, explain: 'Условие остановки.' },
          { q: 'Что делает шаг?', options: ['Уменьшает задачу', 'Увеличивает n', 'Ничего', 'Завершает программу'], answer: 0, explain: 'Приближает базу.' },
          { q: 'Как работает стек?', options: ['LIFO', 'FIFO', 'Случайно', 'По алфавиту'], answer: 0, explain: 'Последний пришёл — первый вышел.' },
          { q: 'Чему равно 4!?', options: ['24', '12', '16', '4'], answer: 0, explain: '4 × 3 × 2 × 1.' },
          { q: 'Что даёт n // 10?', options: ['Число без последней цифры', 'Последнюю цифру', 'Ноль', 'Сумму'], answer: 0, explain: 'Целочисленное деление.' }
        ]
      },
      {
        k: 'concept',
        eyebrow: '03 · ЧЕК-ЛИСТ',
        title: 'Что нужно уметь',
        lead: 'Проверьте себя по каждому пункту: если пункт вызывает сомнение, вернитесь к соответствующему уроку.',
        blocks: [
          {
            t: 'table',
            caption: 'Карта темы',
            head: ['Умение', 'Урок', 'Проверка'],
            rows: [
              ['Объяснить, что такое рекурсия', '1', 'Привести пример из жизни'],
              ['Найти базу и шаг', '2', 'Разметить код на две части'],
              ['Описать стек вызовов', '3', 'Назвать порядок возвратов'],
              ['Записать factorial', '4', 'Проверить на 0, 1, 5'],
              ['Сумма цифр числа', '5', 'digit_sum(4721) = 14'],
              ['Разворот строки', '6', 'reverse("дом") = "мод"'],
              ['Сравнить с циклом', '7', 'Перевести сумму в while']
            ],
            highlight: 1
          },
          {
            t: 'callout',
            tone: 'good',
            icon: 'fas fa-check',
            title: 'Универсальный шаблон',
            text: 'def f(n):\n    if <база>:\n        return <простой ответ>\n    return <комбинация f(<меньшая задача>)>'
          },
          {
            t: 'callout',
            tone: 'warn',
            icon: 'fas fa-triangle-exclamation',
            title: 'Три ошибки, которые чаще всего теряют баллы',
            text: 'Нет базы; шаг не уменьшает аргумент; результат не комбинируется (например, return factorial(n - 1) без умножения).'
          }
        ]
      },
      {
        k: 'lab',
        eyebrow: '04 · ТРЕНАЖЁР',
        title: 'Быстрая проверка',
        lead: 'Пять задач на все ключевые умения темы.',
        widget: {
          kind: 'mini',
          config: {
            tasks: [
              { title: 'База', q: 'Какое условие нужно сделать базой для суммы 1…n?', answer: ['n == 0', 'n==0', 'if n == 0'], explain: 'При n == 0 сумма равна 0.', hint: 'Самое маленькое значение.' },
              { title: 'Стек', q: 'Сколько кадров у factorial(4)?', answer: '5', type: 'number', explain: '4, 3, 2, 1, 0.', hint: 'Не забудьте базу.' },
              { title: 'Цифры', q: 'Сумма цифр 4721?', answer: '14', type: 'number', explain: '4+7+2+1.', hint: 'Сложите цифры.' },
              { title: 'Строка', q: 'Что вернёт reverse("кот")?', answer: ['ток', 'tok'], explain: 'Обратный порядок символов.', hint: 'Прочитайте справа налево.' },
              { title: 'Ошибка', q: 'Как называется ошибка переполнения стека?', answer: ['recursionerror', 'recursion error'], explain: 'RecursionError.', hint: 'Recursion...' }
            ]
          }
        }
      },
      {
        k: 'practice',
        eyebrow: '05 · ПРАКТИКА',
        title: 'Формат СОР',
        lead: 'Задания близки к тем, что будут на суммативном оценивании.',
        tasks: [
          { title: 'Код', q: 'Что вернёт factorial(3)?', answer: '6', type: 'number', explain: '3 × 2 × 1 = 6.', hint: 'Три множителя.' },
          { title: 'Код', q: 'Что вернёт digit_sum(2024)?', answer: '8', type: 'number', explain: '2 + 0 + 2 + 4 = 8.', hint: 'Сложите цифры.' },
          { title: 'Код', q: 'Что вернёт reverse("abc")?', answer: 'cba', explain: 'Обратный порядок.', hint: 'Справа налево.' },
          { title: 'Анализ', q: 'Сколько рекурсивных вызовов сделает digit_sum(999)?', answer: '3', type: 'number', explain: 'Три шага до нуля.', hint: 'По одной цифре за шаг.' },
          { title: 'Анализ', q: 'Какая ошибка появится, если убрать базу?', answer: ['recursionerror', 'recursion error', 'бесконечная рекурсия'], explain: 'Стек переполнится.', hint: 'Название ошибки на английском.' }
        ],
        criteria: [
          { mark: '1 балл', text: 'Значения вычислены верно.' },
          { mark: '1 балл', text: 'База и шаг определены в коде.' },
          { mark: '1 балл', text: 'Ошибки рекурсии объяснены.' }
        ]
      },
      {
        k: 'quiz',
        eyebrow: '06 · ПРОВЕРКА',
        questions: [
          { q: 'Что обязательно в рекурсивной функции?', options: ['База и шаг', 'Только база', 'Только шаг', 'Цикл'], answer: 0, explain: 'Обе части обязательны.' },
          { q: 'Порядок работы стека?', options: ['LIFO', 'FIFO', 'Случайный', 'По возрастанию'], answer: 0, explain: 'Последний пришёл — первый вышел.' },
          { q: 'Что вернёт factorial(4)?', options: ['24', '12', '16', '8'], answer: 0, explain: '4 × 3 × 2 × 1.' },
          { q: 'Что вернёт digit_sum(1234)?', options: ['10', '9', '8', '12'], answer: 0, explain: '1+2+3+4 = 10.' },
          { q: 'Что вернёт reverse("мир")?', options: ['рим', 'мир', 'ир', 'ми'], answer: 0, explain: 'Обратный порядок.' }
        ]
      },
      {
        k: 'summary',
        points: [
          'Рекурсия = база + шаг.',
          'Стек работает по принципу LIFO.',
          'Факториал: 0! = 1, n! = n × (n − 1)!.',
          'Сумма цифр: n % 10 + digit_sum(n // 10).',
          'Разворот строки: reverse(s[1:]) + s[0].',
          'Глубокая рекурсия заменяется циклом.'
        ],
        ticket: [
          'База нужна, чтобы ...',
          'Стек вызовов работает так: ...',
          'Рекурсию заменяют циклом, когда ...'
        ]
      }
    ]
  });

  /* ==========================================================================
     УРОК 9. Сортировка: постановка задачи
     ========================================================================== */
  Q2.add('10emn-q2-9', {
    num: 9,
    cls: '10 ЕМН',
    title: 'Алгоритмы сортировки',
    slides: [
      {
        k: 'hero',
        eyebrow: '01 · ВВЕДЕНИЕ',
        title: 'Алгоритмы <span class="accent-text">сортировки</span>',
        lead: 'Сортировка — приведение последовательности к порядку, заданному отношением «не больше». Формально это перестановка элементов, после которой a[i] ≤ a[i+1] для всех i.',
        goal: 'Формулировать задачу сортировки и оценивать её сложность.',
        goalCode: '10.2.2.1',
        chips: [
          { icon: 'fas fa-arrow-down-1-9', text: 'Отношение порядка' },
          { icon: 'fas fa-key', text: 'Ключ сортировки' },
          { icon: 'fas fa-gauge-high', text: 'Число операций' }
        ],
        visual: 'sort',
        visualCaption: 'Сортировка — перестановка, а не изменение данных',
        cta: 'Сформулировать задачу'
      },
      {
        k: 'review',
        questions: [
          { q: 'Что обязательно в рекурсивной функции?', options: ['База и шаг', 'Два цикла', 'Список', 'Модуль math'], answer: 0, explain: 'Без них рекурсия не завершится.' },
          { q: 'Что хранит стек вызовов?', options: ['Кадры активных вызовов', 'Только результат', 'Имя функции', 'Файл'], answer: 0, explain: 'Аргументы и локальные переменные.' },
          { q: 'Чему равно 4!?', options: ['24', '12', '16', '4'], answer: 0, explain: '4 × 3 × 2 × 1 = 24.' },
          { q: 'Что даёт n // 10?', options: ['Число без последней цифры', 'Последнюю цифру', 'Квадрат', 'Ноль'], answer: 0, explain: 'Целая часть деления на 10.' },
          { q: 'Когда лучше цикл?', options: ['При большой глубине и простом переборе', 'Для деревьев', 'Для графов', 'Для рекурсивных структур'], answer: 0, explain: 'Цикл не переполняет стек.' }
        ]
      },
      {
        k: 'concept',
        eyebrow: '03 · ФОРМУЛИРОВКА',
        title: 'Что значит «отсортировано»',
        lead: 'Последовательность отсортирована по возрастанию, если каждый элемент не больше следующего. Это свойство можно проверить за один проход.',
        blocks: [
          {
            t: 'definition',
            icon: 'fas fa-arrow-down-1-9',
            title: 'Сортировка',
            text: 'Сортировка — перестановка элементов последовательности так, чтобы для всех i выполнялось a[i] ≤ a[i+1]. Элементы не создаются и не удаляются, меняется только их порядок.'
          },
          {
            t: 'code',
            title: 'is_sorted.py',
            code: 'def is_sorted(a):\n    for i in range(len(a) - 1):\n        if a[i] > a[i + 1]:\n            return False\n    return True\n\nprint(is_sorted([1, 2, 2, 5]))   # True\nprint(is_sorted([1, 4, 3]))      # False'
          },
          {
            t: 'callout',
            icon: 'fas fa-key',
            title: 'Ключ сортировки',
            text: 'Сравнивать можно не сами элементы, а их ключи: например, студентов — по среднему баллу, товары — по цене. Ключ — это функция от элемента.'
          },
          {
            t: 'table',
            caption: 'Что считать операцией',
            head: ['Операция', 'Что означает'],
            rows: [
              ['Сравнение', 'Проверка a[i] > a[j]'],
              ['Обмен', 'Перестановка двух элементов'],
              ['Сдвиг', 'Перемещение элемента на соседнюю позицию'],
              ['Присваивание', 'Запись значения в ячейку']
            ]
          }
        ]
      },
      {
        k: 'lab',
        eyebrow: '04 · НАБЛЮДЕНИЕ',
        title: 'Сортировка с подсчётом операций',
        lead: 'Запустите сортировку и посмотрите на счётчики. Обратите внимание: даже для шести чисел операций довольно много.',
        widget: {
          kind: 'sort',
          config: { algo: 'bubble', array: [8, 3, 5, 1, 9, 2] }
        },
        after: [
          {
            t: 'callout',
            tone: 'good',
            icon: 'fas fa-check',
            title: 'Что заметить',
            text: 'Сравнений всегда больше, чем обменов. Число сравнений зависит от размера списка, а число обменов — ещё и от исходного порядка.'
          }
        ]
      },
      {
        k: 'concept',
        eyebrow: '05 · СЛОЖНОСТЬ',
        title: 'Как оценивают алгоритмы',
        lead: 'Оценка сложности показывает, как растёт число операций при увеличении входа. Запись O(n²) читается «порядка n в квадрате».',
        blocks: [
          {
            t: 'table',
            caption: 'Рост числа операций',
            head: ['n', 'n²', 'n log₂ n'],
            rows: [
              ['10', '100', '≈ 33'],
              ['100', '10 000', '≈ 664'],
              ['1 000', '1 000 000', '≈ 9 966'],
              ['10 000', '100 000 000', '≈ 132 877']
            ],
            highlight: 2
          },
          {
            t: 'compare',
            left: {
              title: 'Простые сортировки',
              items: ['Пузырёк, выбор, вставки', 'O(n²) сравнений', 'Хороши для малых n', 'Просты в реализации']
            },
            right: {
              title: 'Быстрые сортировки',
              items: ['Быстрая, слиянием, пирамидальная', 'O(n log n) в среднем', 'Нужны для больших данных', 'Сложнее в реализации']
            },
            vs: 'vs'
          },
          {
            t: 'callout',
            tone: 'warn',
            icon: 'fas fa-triangle-exclamation',
            title: 'O(n²) — это не «плохо»',
            text: 'На списке из 20 элементов разница незаметна. Проблемы начинаются на десятках тысяч: там n² превращается в сотни миллионов операций.'
          }
        ]
      },
      {
        k: 'practice',
        eyebrow: '06 · ПРАКТИКА',
        title: 'Проверяем порядок и оценки',
        lead: 'Отвечайте да/нет или числом.',
        tasks: [
          { title: 'Порядок', q: 'Отсортирован ли список 1, 2, 2, 5 по возрастанию?', answer: ['да', 'yes'], explain: 'Каждый элемент не больше следующего.', hint: 'Проверьте пары соседей.' },
          { title: 'Порядок', q: 'Отсортирован ли список 1, 4, 3?', answer: ['нет', 'no'], explain: '4 > 3 — порядок нарушен.', hint: 'Найдите пару, где число уменьшилось.' },
          { title: 'Операции', q: 'Сколько сравнений нужно, чтобы проверить отсортированность списка из 6 элементов?', answer: '5', type: 'number', explain: 'Проверяются пары (1,2), (2,3), …, (5,6) — пять сравнений.', hint: 'На одно меньше числа элементов.' },
          { title: 'Сложность', q: 'Какой сложностью обладают пузырёк, выбор и вставки?', answer: ['o(n²)', 'n^2', 'n2', 'квадратичной', 'o(n^2)'], explain: 'Число операций растёт как квадрат n.', hint: 'Смотрите на таблицу роста.' },
          { title: 'Ключ', q: 'Что такое ключ сортировки?', answer: ['признак сравнения', 'функция от элемента', 'поле для сравнения', 'критерий'], explain: 'Ключ — значение, по которому сравнивают элементы.', hint: 'Например, цена товара.' }
        ],
        criteria: [
          { mark: '1 балл', text: 'Отсортированность проверена по соседним парам.' },
          { mark: '1 балл', text: 'Число сравнений при проверке посчитано верно.' },
          { mark: '1 балл', text: 'Понятие сложности O(n²) объяснено.' }
        ]
      },
      {
        k: 'quiz',
        eyebrow: '07 · ПРОВЕРКА',
        questions: [
          { q: 'Что означает «список отсортирован по возрастанию»?', options: ['a[i] ≤ a[i+1]', 'a[i] ≥ a[i+1]', 'Все элементы равны', 'Элементы уникальны'], answer: 0, explain: 'Каждый следующий не меньше предыдущего.' },
          { q: 'Что происходит с элементами при сортировке?', options: ['Меняется порядок', 'Удаляются', 'Создаются новые', 'Меняются значения'], answer: 0, explain: 'Состав сохраняется.' },
          { q: 'Какова сложность простых сортировок?', options: ['O(n²)', 'O(n)', 'O(log n)', 'O(1)'], answer: 0, explain: 'Квадратичный рост.' },
          { q: 'Что такое ключ сортировки?', options: ['Признак сравнения', 'Первый элемент', 'Номер позиции', 'Тип данных'], answer: 0, explain: 'По ключу сравнивают элементы.' },
          { q: 'Сколько сравнений нужно для проверки списка из 5 элементов?', options: ['4', '5', '10', '25'], answer: 0, explain: 'n − 1 = 4.' }
        ]
      },
      {
        k: 'summary',
        points: [
          'Сортировка — перестановка элементов по отношению порядка.',
          'Отсортированность проверяется за один проход.',
          'Ключ задаёт признак сравнения.',
          'Простые сортировки имеют сложность O(n²).',
          'Для больших данных нужны алгоритмы O(n log n).'
        ],
        ticket: [
          'Отсортированный список — это ...',
          'Ключ сортировки нужен, когда ...',
          'O(n²) означает, что ...'
        ]
      }
    ]
  });

  /* ==========================================================================
     УРОК 10. Сортировка пузырьком
     ========================================================================== */
  Q2.add('10emn-q2-10', {
    num: 10,
    cls: '10 ЕМН',
    title: 'Алгоритмы сортировки',
    slides: [
      {
        k: 'hero',
        eyebrow: '01 · ВВЕДЕНИЕ',
        title: 'Алгоритмы <span class="accent-text">сортировки</span>',
        lead: 'После k-го прохода последние k элементов стоят на своих местах. Это инвариант пузырька — свойство, которое сохраняется на каждом шаге.',
        goal: 'Реализовывать пузырьковую сортировку и оценивать число операций.',
        goalCode: '10.2.2.1',
        chips: [
          { icon: 'fas fa-arrows-left-right', text: 'Обмен соседей' },
          { icon: 'fas fa-shield-halved', text: 'Инвариант' },
          { icon: 'fas fa-gauge', text: 'O(n²)' }
        ],
        visual: 'sort',
        visualCaption: 'Хвост растёт, работа сокращается',
        cta: 'Разобрать алгоритм'
      },
      {
        k: 'review',
        questions: [
          { q: 'Что означает «отсортирован по возрастанию»?', options: ['a[i] ≤ a[i+1]', 'a[i] ≥ a[i+1]', 'Все равны', 'Уникальны'], answer: 0, explain: 'Каждый следующий не меньше.' },
          { q: 'Что меняется при сортировке?', options: ['Порядок', 'Состав', 'Значения', 'Тип данных'], answer: 0, explain: 'Только порядок.' },
          { q: 'Сложность простых сортировок —', options: ['O(n²)', 'O(n)', 'O(log n)', 'O(1)'], answer: 0, explain: 'Квадратичный рост.' },
          { q: 'Что такое ключ сортировки?', options: ['Признак сравнения', 'Первый элемент', 'Номер', 'Тип'], answer: 0, explain: 'По ключу сравнивают.' },
          { q: 'Сколько сравнений при проверке 5 элементов?', options: ['4', '5', '10', '25'], answer: 0, explain: 'n − 1.' }
        ]
      },
      {
        k: 'concept',
        eyebrow: '03 · АЛГОРИТМ',
        title: 'Два вложенных цикла',
        lead: 'Внешний цикл задаёт номер прохода, внутренний сравнивает пары. С каждым проходом область сравнения уменьшается на один элемент.',
        blocks: [
          {
            t: 'code',
            title: 'bubble.py',
            code: 'def bubble_sort(a):\n    n = len(a)\n    for i in range(n - 1):\n        swapped = False\n        for j in range(n - 1 - i):\n            if a[j] > a[j + 1]:\n                a[j], a[j + 1] = a[j + 1], a[j]\n                swapped = True\n        if not swapped:      # уже отсортировано\n            break\n    return a\n\nprint(bubble_sort([5, 1, 4, 2, 8]))'
          },
          {
            t: 'steps',
            items: [
              { title: 'Проход 1', text: 'Сравниваем все пары от начала до конца. Максимум встаёт последним.' },
              { title: 'Проход 2', text: 'Область сравнения короче на один элемент: последний уже на месте.' },
              { title: 'Проход i', text: 'Хвост из i элементов отсортирован — его не трогаем.' },
              { title: 'Флаг swapped', text: 'Если за проход не было обменов, список отсортирован — выходим досрочно.' }
            ]
          },
          {
            t: 'callout',
            icon: 'fas fa-shield-halved',
            title: 'Инвариант',
            text: 'После i проходов последние i элементов — самые большие и стоят в правильном порядке. Отсюда и сокращение внутреннего цикла на i.'
          }
        ]
      },
      {
        k: 'lab',
        eyebrow: '04 · ИНТЕРАКТИВ',
        title: 'Пузырёк с оптимизацией',
        lead: 'Сравните число шагов для случайного и почти отсортированного списка. Для второго флаг swapped сработает раньше.',
        widget: {
          kind: 'sort',
          config: { algo: 'bubble', array: [6, 2, 8, 1, 5] }
        },
        after: [
          {
            t: 'callout',
            tone: 'good',
            icon: 'fas fa-check',
            title: 'Эксперимент',
            text: 'Введите в поле список 1, 2, 3, 5, 4 и нажмите «Применить». Алгоритм завершится после двух проходов вместо четырёх.'
          }
        ]
      },
      {
        k: 'concept',
        eyebrow: '05 · АНАЛИЗ',
        title: 'Сколько сравнений',
        lead: 'В худшем случае число сравнений равно n(n − 1)/2. Это и есть O(n²).',
        blocks: [
          {
            t: 'table',
            caption: 'Сравнения в пузырьке',
            head: ['n', 'n(n − 1)/2', 'Порядок'],
            rows: [
              ['5', '10', 'десятки'],
              ['10', '45', 'десятки'],
              ['100', '4 950', 'тысячи'],
              ['1 000', '499 500', 'сотни тысяч']
            ],
            highlight: 3
          },
          {
            t: 'widget',
            kind: 'codePredict',
            config: {
              title: 'predict_bubble.py',
              code: 'a = [3, 1, 2]\nbubble_sort(a)\nprint(a)',
              options: ['[1, 2, 3]', '[3, 2, 1]', '[3, 1, 2]', 'None'],
              answer: 0,
              explain: 'Функция сортирует список на месте и возвращает его же, но print(a) выводит уже изменённый список.'
            }
          },
          {
            t: 'callout',
            tone: 'warn',
            icon: 'fas fa-triangle-exclamation',
            title: 'Почему пузырёк редко используют',
            text: 'Даже с флагом swapped он остаётся квадратичным. Встроенная сортировка Python (Timsort) работает за O(n log n) и написана на C.'
          }
        ]
      },
      {
        k: 'practice',
        eyebrow: '06 · ПРАКТИКА',
        title: 'Пузырёк вручную',
        lead: 'Записывайте список после каждого прохода.',
        tasks: [
          { title: 'Проход', q: 'Список 4, 3, 2, 1. Каким он станет после первого прохода?', answer: ['3, 2, 1, 4', '3,2,1,4'], explain: '4 «всплывает» в конец, остальные сдвигаются.', hint: 'Максимум идёт вправо.' },
          { title: 'Сравнения', q: 'Сколько сравнений сделает пузырёк для 4 элементов в худшем случае?', answer: '6', type: 'number', explain: '4 × 3 / 2 = 6.', hint: 'n(n − 1)/2.' },
          { title: 'Оптимизация', q: 'Что проверяет флаг swapped?', answer: ['были ли обмены', 'был ли обмен', 'обмены', 'изменения'], explain: 'Если обменов не было, список уже отсортирован.', hint: 'Связано с обменами.' },
          { title: 'Инвариант', q: 'Что находится в конце списка после первого прохода?', answer: ['максимум', 'наибольшее', 'самое большое', 'максимальный элемент'], explain: 'Самое большое число встаёт на последнее место.', hint: 'Оно «всплывает».' },
          { title: 'Сложность', q: 'Какой сложностью обладает пузырёк?', answer: ['o(n²)', 'n^2', 'o(n^2)', 'квадратичной'], explain: 'O(n²).', hint: 'Квадрат числа элементов.' }
        ],
        criteria: [
          { mark: '1 балл', text: 'Проход выполнен с учётом направления.' },
          { mark: '1 балл', text: 'Число сравнений посчитано по формуле.' },
          { mark: '1 балл', text: 'Роль флага swapped объяснена.' }
        ]
      },
      {
        k: 'quiz',
        eyebrow: '07 · ПРОВЕРКА',
        questions: [
          { q: 'Что сравнивает пузырёк?', options: ['Соседние элементы', 'Первый и последний', 'Случайные', 'Сумму'], answer: 0, explain: 'Пары соседей.' },
          { q: 'Что происходит за один проход?', options: ['Максимум встаёт в конец', 'Минимум в конец', 'Полная сортировка', 'Ничего'], answer: 0, explain: 'Большое число всплывает вправо.' },
          { q: 'Сколько сравнений для 5 элементов в худшем случае?', options: ['10', '5', '25', '4'], answer: 0, explain: '5 × 4 / 2 = 10.' },
          { q: 'Зачем нужен флаг swapped?', options: ['Для досрочного выхода', 'Для сортировки', 'Для памяти', 'Для вывода'], answer: 0, explain: 'Нет обменов — список готов.' },
          { q: 'Сложность пузырька —', options: ['O(n²)', 'O(n log n)', 'O(n)', 'O(1)'], answer: 0, explain: 'Квадратичная.' }
        ]
      },
      {
        k: 'summary',
        points: [
          'Пузырёк сравнивает соседние элементы.',
          'После i проходов последние i элементов стоят на своих местах.',
          'Число сравнений — n(n − 1)/2.',
          'Флаг swapped даёт досрочный выход.',
          'Сложность — O(n²).'
        ],
        ticket: [
          'Инвариант пузырька — ...',
          'Флаг swapped позволяет ...',
          'Для 100 элементов пузырёк сделает около ... сравнений'
        ]
      }
    ]
  });

  /* ==========================================================================
     УРОК 11. Сортировка выбором
     ========================================================================== */
  Q2.add('10emn-q2-11', {
    num: 11,
    cls: '10 ЕМН',
    title: 'Алгоритмы сортировки',
    slides: [
      {
        k: 'hero',
        eyebrow: '01 · ВВЕДЕНИЕ',
        title: 'Алгоритмы <span class="accent-text">сортировки</span>',
        lead: 'Выбор не переставляет элементы десятки раз. Он находит минимум и меняет его с текущим — всего один обмен за проход.',
        goal: 'Реализовывать сортировку выбором и оценивать число обменов.',
        goalCode: '10.2.2.1',
        chips: [
          { icon: 'fas fa-magnifying-glass', text: 'Поиск минимума' },
          { icon: 'fas fa-right-left', text: 'Один обмен' },
          { icon: 'fas fa-gauge', text: 'O(n²) сравнений' }
        ],
        visual: 'sort',
        visualCaption: 'Много сравнений — мало перемещений',
        cta: 'Разобрать выбор'
      },
      {
        k: 'review',
        questions: [
          { q: 'Что сравнивает пузырёк?', options: ['Соседние элементы', 'Первый и последний', 'Случайные', 'Сумму'], answer: 0, explain: 'Пары соседей.' },
          { q: 'Что происходит за проход?', options: ['Максимум встаёт в конец', 'Минимум в конец', 'Полная сортировка', 'Ничего'], answer: 0, explain: 'Большое число всплывает.' },
          { q: 'Сколько сравнений для 5 элементов в худшем случае?', options: ['10', '5', '25', '4'], answer: 0, explain: '5 × 4 / 2 = 10.' },
          { q: 'Зачем флаг swapped?', options: ['Для досрочного выхода', 'Для сортировки', 'Для памяти', 'Для вывода'], answer: 0, explain: 'Нет обменов — готово.' },
          { q: 'Сложность пузырька —', options: ['O(n²)', 'O(n log n)', 'O(n)', 'O(1)'], answer: 0, explain: 'Квадратичная.' }
        ]
      },
      {
        k: 'concept',
        eyebrow: '03 · АЛГОРИТМ',
        title: 'Индекс минимума',
        lead: 'На каждом шаге запоминаем индекс минимального элемента в оставшейся части и меняем его с первым элементом этой части.',
        blocks: [
          {
            t: 'code',
            title: 'selection.py',
            code: 'def selection_sort(a):\n    n = len(a)\n    for i in range(n - 1):\n        min_index = i\n        for j in range(i + 1, n):\n            if a[j] < a[min_index]:\n                min_index = j\n        if min_index != i:\n            a[i], a[min_index] = a[min_index], a[i]\n    return a\n\nprint(selection_sort([7, 4, 9, 2, 6]))'
          },
          {
            t: 'table',
            caption: 'Трассировка для 7, 4, 9, 2, 6',
            head: ['i', 'min_index', 'Обмен', 'Список'],
            rows: [
              ['0', '3 (значение 2)', '7 ↔ 2', '2, 4, 9, 7, 6'],
              ['1', '1 (значение 4)', 'нет', '2, 4, 9, 7, 6'],
              ['2', '4 (значение 6)', '9 ↔ 6', '2, 4, 6, 7, 9'],
              ['3', '3 (значение 7)', 'нет', '2, 4, 6, 7, 9']
            ],
            highlight: 2
          },
          {
            t: 'callout',
            icon: 'fas fa-shield-halved',
            title: 'Инвариант',
            text: 'После i шагов первые i элементов — наименьшие из всех и стоят в правильном порядке. Остаток ещё не упорядочен.'
          }
        ]
      },
      {
        k: 'lab',
        eyebrow: '04 · ИНТЕРАКТИВ',
        title: 'Выбор с подсчётом',
        lead: 'Сравните число обменов с пузырьком на том же списке: 7, 4, 9, 2, 6.',
        widget: {
          kind: 'sort',
          config: { algo: 'selection', array: [7, 4, 9, 2, 6] }
        },
        after: [
          {
            t: 'callout',
            tone: 'good',
            icon: 'fas fa-check',
            title: 'Наблюдение',
            text: 'Обменов не больше четырёх, а сравнений всё равно около десяти. Выбор экономит перемещения, но не сравнения.'
          }
        ]
      },
      {
        k: 'concept',
        eyebrow: '05 · АНАЛИЗ',
        title: 'Когда выбор оправдан',
        lead: 'Если обмен элементов «дорогой» (например, пересылка большого объекта), выбор выгоднее пузырька.',
        blocks: [
          {
            t: 'compare',
            left: {
              title: 'Сравнения',
              items: ['Всегда n(n − 1)/2', 'Не зависит от исходного порядка', 'Список уже отсортирован — всё равно O(n²)']
            },
            right: {
              title: 'Обмены',
              items: ['Не более n − 1', 'Один обмен за шаг', 'Меньше, чем у пузырька']
            },
            vs: 'и'
          },
          {
            t: 'table',
            caption: 'Для n = 100',
            head: ['Показатель', 'Пузырёк', 'Выбор'],
            rows: [
              ['Сравнений', 'до 4 950', '4 950'],
              ['Обменов', 'до 4 950', 'до 99'],
              ['Досрочный выход', 'есть (флаг)', 'нет']
            ],
            highlight: 1
          },
          {
            t: 'callout',
            tone: 'warn',
            icon: 'fas fa-triangle-exclamation',
            title: 'Устойчивость',
            text: 'Выбор может поменять порядок равных элементов — он неустойчив. Если важно сохранить исходный порядок равных, выбирают вставки или устойчивые алгоритмы.'
          }
        ]
      },
      {
        k: 'practice',
        eyebrow: '06 · ПРАКТИКА',
        title: 'Выбор по шагам',
        lead: 'Записывайте индекс минимума и результат обмена.',
        tasks: [
          { title: 'Первый шаг', q: 'Список 7, 4, 9, 2, 6. Какое число встанет первым?', answer: '2', type: 'number', explain: 'Минимум списка — 2.', hint: 'Найдите наименьшее.' },
          { title: 'Список', q: 'Каким станет список 7, 4, 9, 2, 6 после первого шага?', answer: ['2, 4, 9, 7, 6', '2,4,9,7,6'], explain: '2 меняется местами с 7.', hint: 'Обмен с первым элементом.' },
          { title: 'Обмены', q: 'Сколько обменов сделает выбор для 6 элементов в худшем случае?', answer: '5', type: 'number', explain: 'Не больше n − 1 = 5.', hint: 'Один обмен на шаг.' },
          { title: 'Сравнения', q: 'Сколько сравнений сделает выбор для 4 элементов?', answer: '6', type: 'number', explain: '4 × 3 / 2 = 6.', hint: 'n(n − 1)/2.' },
          { title: 'Свойство', q: 'Зависит ли число сравнений выбора от исходного порядка?', answer: ['нет', 'no', 'не зависит'], explain: 'Выбор всегда просматривает весь остаток.', hint: 'Сравните с флагом swapped у пузырька.' }
        ],
        criteria: [
          { mark: '1 балл', text: 'Минимум найден на каждом шаге.' },
          { mark: '1 балл', text: 'Обмен выполнен с текущим первым элементом.' },
          { mark: '1 балл', text: 'Различие в числе обменов объяснено.' }
        ]
      },
      {
        k: 'quiz',
        eyebrow: '07 · ПРОВЕРКА',
        questions: [
          { q: 'Что ищет выбор на каждом шаге?', options: ['Минимум остатка', 'Максимум', 'Среднее', 'Сумму'], answer: 0, explain: 'Минимум ставится на текущее место.' },
          { q: 'Сколько обменов за шаг?', options: ['Не более одного', 'Всегда два', 'n обменов', 'Ни одного'], answer: 0, explain: 'Один обмен, если минимум не на месте.' },
          { q: 'Зависит ли число сравнений от порядка данных?', options: ['Нет', 'Да', 'Только для строк', 'Только для чисел'], answer: 0, explain: 'Всегда просматривается остаток.' },
          { q: 'Что экономит выбор по сравнению с пузырьком?', options: ['Обмены', 'Сравнения', 'Память', 'Строки кода'], answer: 0, explain: 'Обменов значительно меньше.' },
          { q: 'Сложность выбора —', options: ['O(n²)', 'O(n log n)', 'O(n)', 'O(1)'], answer: 0, explain: 'Квадратичная по сравнениям.' }
        ]
      },
      {
        k: 'summary',
        points: [
          'Выбор ищет минимум остатка.',
          'Минимум меняется с текущим элементом.',
          'Обменов не больше n − 1.',
          'Сравнений всегда n(n − 1)/2.',
          'Выбор неустойчив, но экономит перемещения.'
        ],
        ticket: [
          'Выбор экономит ..., но не экономит ...',
          'Инвариант выбора — ...',
          'Неустойчивость означает, что ...'
        ]
      }
    ]
  });

  /* ==========================================================================
     УРОК 12. Сортировка вставками
     ========================================================================== */
  Q2.add('10emn-q2-12', {
    num: 12,
    cls: '10 ЕМН',
    title: 'Алгоритмы сортировки',
    slides: [
      {
        k: 'hero',
        eyebrow: '01 · ВВЕДЕНИЕ',
        title: 'Алгоритмы <span class="accent-text">сортировки</span>',
        lead: 'Вставки — единственная из трёх простых сортировок, которая на почти отсортированном массиве работает почти за O(n). Это свойство называется адаптивностью.',
        goal: 'Реализовывать сортировку вставками и объяснять её адаптивность.',
        goalCode: '10.2.2.1',
        chips: [
          { icon: 'fas fa-arrow-right-to-bracket', text: 'Вставка со сдвигом' },
          { icon: 'fas fa-bolt', text: 'O(n) на готовых данных' },
          { icon: 'fas fa-shield-halved', text: 'Устойчивость' }
        ],
        visual: 'sort',
        visualCaption: 'Почти отсортированный список — лучший случай',
        cta: 'Разобрать вставки'
      },
      {
        k: 'review',
        questions: [
          { q: 'Что ищет выбор?', options: ['Минимум остатка', 'Максимум', 'Среднее', 'Сумму'], answer: 0, explain: 'Минимум ставится на место.' },
          { q: 'Сколько обменов за шаг у выбора?', options: ['Не более одного', 'Два', 'n', 'Ни одного'], answer: 0, explain: 'Один обмен при необходимости.' },
          { q: 'Зависит ли число сравнений выбора от данных?', options: ['Нет', 'Да', 'Только для строк', 'Только для чисел'], answer: 0, explain: 'Всегда просматривается остаток.' },
          { q: 'Что экономит выбор?', options: ['Обмены', 'Сравнения', 'Память', 'Код'], answer: 0, explain: 'Обменов меньше.' },
          { q: 'Сложность выбора —', options: ['O(n²)', 'O(n log n)', 'O(n)', 'O(1)'], answer: 0, explain: 'Квадратичная.' }
        ]
      },
      {
        k: 'concept',
        eyebrow: '03 · АЛГОРИТМ',
        title: 'Сдвиг вместо обмена',
        lead: 'Вставки не меняют элементы попарно. Они запоминают текущий элемент и сдвигают большие вправо, пока не найдётся место.',
        blocks: [
          {
            t: 'code',
            title: 'insertion.py',
            code: 'def insertion_sort(a):\n    for i in range(1, len(a)):\n        key = a[i]\n        j = i - 1\n        while j >= 0 and a[j] > key:\n            a[j + 1] = a[j]      # сдвиг\n            j -= 1\n        a[j + 1] = key           # вставка\n    return a\n\nprint(insertion_sort([5, 2, 9, 1, 6]))'
          },
          {
            t: 'table',
            caption: 'Трассировка для 5, 2, 9, 1, 6',
            head: ['i', 'key', 'Действие', 'Список'],
            rows: [
              ['1', '2', '2 встаёт перед 5', '2, 5, 9, 1, 6'],
              ['2', '9', '9 остаётся на месте', '2, 5, 9, 1, 6'],
              ['3', '1', '1 встаёт в начало', '1, 2, 5, 9, 6'],
              ['4', '6', '6 встаёт перед 9', '1, 2, 5, 6, 9']
            ],
            highlight: 3
          },
          {
            t: 'callout',
            icon: 'fas fa-shield-halved',
            title: 'Инвариант',
            text: 'Перед обработкой элемента с индексом i первые i элементов уже отсортированы. После вставки свойство сохраняется для i + 1.'
          }
        ]
      },
      {
        k: 'lab',
        eyebrow: '04 · ИНТЕРАКТИВ',
        title: 'Вставки: счётчик сдвигов',
        lead: 'Обратите внимание на счётчик «Сдвигов». Введите почти отсортированный список 1, 2, 3, 4, 6, 5 и сравните число шагов.',
        widget: {
          kind: 'sort',
          config: { algo: 'insertion', array: [5, 2, 9, 1, 6] }
        },
        after: [
          {
            t: 'callout',
            tone: 'good',
            icon: 'fas fa-check',
            title: 'Эксперимент',
            text: 'На списке 1, 2, 3, 4, 6, 5 вставки сделают всего один сдвиг, а пузырёк — целый проход. В этом и состоит адаптивность.'
          }
        ]
      },
      {
        k: 'concept',
        eyebrow: '05 · АНАЛИЗ',
        title: 'Три случая',
        lead: 'Вставки — редкий случай, когда сложность существенно зависит от исходных данных.',
        blocks: [
          {
            t: 'table',
            caption: 'Сложность вставок',
            head: ['Случай', 'Данные', 'Операций'],
            rows: [
              ['Лучший', 'Уже отсортированы', 'O(n) — по одному сравнению'],
              ['Средний', 'Случайный порядок', 'O(n²)'],
              ['Худший', 'Обратный порядок', 'O(n²), максимум сдвигов']
            ],
            highlight: 0
          },
          {
            t: 'compare',
            left: {
              title: 'Преимущества',
              items: ['Адаптивность', 'Устойчивость', 'Работает на месте', 'Хороша для малых массивов']
            },
            right: {
              title: 'Ограничения',
              items: ['O(n²) на случайных данных', 'Много сдвигов в худшем случае', 'Не подходит для больших массивов']
            },
            vs: 'и'
          },
          {
            t: 'callout',
            icon: 'fas fa-code',
            title: 'Где применяется',
            text: 'Вставки используют как «досортировку» в гибридных алгоритмах: Timsort в Python сортирует короткие участки именно вставками, а затем сливает их.'
          }
        ]
      },
      {
        k: 'practice',
        eyebrow: '06 · ПРАКТИКА',
        title: 'Вставки вручную',
        lead: 'Держите в голове отсортированную левую часть.',
        tasks: [
          { title: 'Первый шаг', q: 'Список 4, 2, 7. Каким он станет после первого шага вставок?', answer: ['2, 4, 7', '2,4,7'], explain: '2 встаёт перед 4.', hint: 'Сравните первые два числа.' },
          { title: 'Сдвиг', q: 'Список 1, 3, 5. Сколько сдвигов потребуется, чтобы вставить 2?', answer: '2', type: 'number', explain: 'Сдвигаются 5 и 3.', hint: 'Посчитайте элементы больше 2.' },
          { title: 'Лучший случай', q: 'Какова сложность вставок на уже отсортированном массиве?', answer: ['o(n)', 'n', 'линейная', 'o(n)'], explain: 'Каждый элемент сравнивается один раз.', hint: 'Не квадрат.' },
          { title: 'Худший случай', q: 'На каком порядке данных вставки работают дольше всего?', answer: ['обратном', 'по убыванию', 'обратный', 'убывание'], explain: 'Каждый элемент сдвигается через весь массив.', hint: 'Противоположность нужному порядку.' },
          { title: 'Устойчивость', q: 'Меняют ли вставки порядок равных элементов?', answer: ['нет', 'no', 'не меняют'], explain: 'Равные элементы не сдвигаются друг относительно друга.', hint: 'Сравнение строгое: a[j] > key.' }
        ],
        criteria: [
          { mark: '1 балл', text: 'Левая часть остаётся отсортированной.' },
          { mark: '1 балл', text: 'Число сдвигов посчитано верно.' },
          { mark: '1 балл', text: 'Лучший и худший случаи названы.' }
        ]
      },
      {
        k: 'quiz',
        eyebrow: '07 · ПРОВЕРКА',
        questions: [
          { q: 'Что делает вставка вместо обмена?', options: ['Сдвигает элементы', 'Удаляет элементы', 'Меняет значения', 'Создаёт копию'], answer: 0, explain: 'Большие элементы сдвигаются вправо.' },
          { q: 'Что уже отсортировано перед шагом i?', options: ['Первые i элементов', 'Последние i', 'Весь список', 'Ничего'], answer: 0, explain: 'Это инвариант вставок.' },
          { q: 'Сложность на готовом массиве —', options: ['O(n)', 'O(n²)', 'O(log n)', 'O(1)'], answer: 0, explain: 'По одному сравнению на элемент.' },
          { q: 'Худший случай вставок —', options: ['Обратный порядок', 'Прямой порядок', 'Все равны', 'Пустой массив'], answer: 0, explain: 'Максимум сдвигов.' },
          { q: 'Устойчива ли сортировка вставками?', options: ['Да', 'Нет', 'Только для чисел', 'Только для строк'], answer: 0, explain: 'Равные элементы сохраняют порядок.' }
        ]
      },
      {
        k: 'summary',
        points: [
          'Вставки сдвигают элементы, а не обменивают.',
          'Левая часть массива всегда отсортирована.',
          'На готовых данных сложность O(n).',
          'На случайных и обратных — O(n²).',
          'Вставки устойчивы и работают на месте.'
        ],
        ticket: [
          'Адаптивность означает, что ...',
          'В лучшем случае вставки делают ... операций',
          'Устойчивость важна, когда ...'
        ]
      }
    ]
  });

  /* ==========================================================================
     УРОК 13. Сравнение и оценка алгоритмов
     ========================================================================== */
  Q2.add('10emn-q2-13', {
    num: 13,
    cls: '10 ЕМН',
    title: 'СОР №2. Алгоритмы сортировки',
    slides: [
      {
        k: 'hero',
        eyebrow: '01 · ВВЕДЕНИЕ',
        title: 'СОР №2. <span class="accent-text">Алгоритмы сортировки</span>',
        lead: 'Алгоритмы сравнивают по времени, памяти и устойчивости. Для учебных задач важны первые две, для реальных отчётов — ещё и сохранение порядка равных.',
        goal: 'Сравнивать алгоритмы сортировки по сложности, памяти и устойчивости.',
        goalCode: '10.2.2.2',
        chips: [
          { icon: 'fas fa-gauge-high', text: 'Время' },
          { icon: 'fas fa-memory', text: 'Память' },
          { icon: 'fas fa-shield-halved', text: 'Устойчивость' }
        ],
        visual: 'sort',
        visualCaption: 'Три алгоритма, три профиля затрат',
        cta: 'Сравнить'
      },
      {
        k: 'review',
        questions: [
          { q: 'Что делает вставка вместо обмена?', options: ['Сдвигает элементы', 'Удаляет', 'Меняет значения', 'Копирует'], answer: 0, explain: 'Большие элементы сдвигаются вправо.' },
          { q: 'Что отсортировано перед шагом i?', options: ['Первые i элементов', 'Последние i', 'Весь список', 'Ничего'], answer: 0, explain: 'Инвариант вставок.' },
          { q: 'Сложность на готовом массиве —', options: ['O(n)', 'O(n²)', 'O(log n)', 'O(1)'], answer: 0, explain: 'Одно сравнение на элемент.' },
          { q: 'Худший случай вставок —', options: ['Обратный порядок', 'Прямой', 'Все равны', 'Пустой'], answer: 0, explain: 'Максимум сдвигов.' },
          { q: 'Устойчивы ли вставки?', options: ['Да', 'Нет', 'Только для чисел', 'Только для строк'], answer: 0, explain: 'Равные сохраняют порядок.' }
        ]
      },
      {
        k: 'concept',
        eyebrow: '03 · ТАБЛИЦА',
        title: 'Сводка по трём алгоритмам',
        lead: 'Запомните не числа, а форму поведения: кто экономит обмены, кто быстр на готовых данных, кто устойчив.',
        blocks: [
          {
            t: 'table',
            caption: 'Сравнение простых сортировок',
            head: ['Алгоритм', 'Лучший случай', 'Средний', 'Худший', 'Память', 'Устойчивость'],
            rows: [
              ['Пузырёк', 'O(n)', 'O(n²)', 'O(n²)', 'O(1)', 'да'],
              ['Выбор', 'O(n²)', 'O(n²)', 'O(n²)', 'O(1)', 'нет'],
              ['Вставки', 'O(n)', 'O(n²)', 'O(n²)', 'O(1)', 'да']
            ],
            highlight: 2
          },
          {
            t: 'cards',
            cols: 3,
            items: [
              { badge: 'Пузырёк', title: 'Учебный', text: 'Простой и наглядный, но много обменов. С флагом swapped быстр на готовых данных.', tone: 'violet' },
              { badge: 'Выбор', title: 'Экономия обменов', text: 'Не более n − 1 обменов, но всегда n(n − 1)/2 сравнений и неустойчивость.', tone: 'cyan' },
              { badge: 'Вставки', title: 'Адаптивный', text: 'Лучший выбор среди трёх для почти отсортированных данных и малых массивов.', tone: 'green' }
            ]
          },
          {
            t: 'callout',
            tone: 'warn',
            icon: 'fas fa-triangle-exclamation',
            title: 'Что такое устойчивость',
            text: 'Сортировка устойчива, если равные элементы сохраняют исходный порядок. Это важно, когда сортируют сначала по одному полю, потом по другому.'
          }
        ]
      },
      {
        k: 'lab',
        eyebrow: '04 · ИНТЕРАКТИВ',
        title: 'Один массив — три профиля',
        lead: 'Переключайте вкладки и выписывайте число сравнений и перемещений для массива 4, 8, 1, 6, 3.',
        widget: {
          kind: 'sort',
          config: { algo: 'bubble', array: [4, 8, 1, 6, 3] }
        },
        after: [
          {
            t: 'callout',
            tone: 'good',
            icon: 'fas fa-check',
            title: 'Как оформить вывод',
            text: 'Сравните три строки: «больше всего перемещений у …», «меньше всего перемещений у …», «на почти готовых данных быстрее всех …».'
          }
        ]
      },
      {
        k: 'concept',
        eyebrow: '05 · ВЫБОР',
        title: 'Алгоритм под задачу',
        lead: 'Нет «лучшего» алгоритма вообще — есть подходящий для конкретных данных и ограничений.',
        blocks: [
          {
            t: 'table',
            caption: 'Практические рекомендации',
            head: ['Ситуация', 'Выбор'],
            rows: [
              ['Массив из 10–20 элементов', 'Вставки'],
              ['Данные почти отсортированы', 'Вставки'],
              ['Дорогие обмены элементов', 'Выбор'],
              ['Нужна устойчивость', 'Вставки'],
              ['Массив из 100 000 элементов', 'Timsort (sorted) или quicksort'],
              ['Нужна простота объяснения', 'Пузырёк']
            ]
          },
          {
            t: 'compare',
            left: {
              title: 'Что учитывать',
              items: ['Размер данных', 'Исходный порядок', 'Стоимость обмена', 'Требование устойчивости']
            },
            right: {
              title: 'Что не учитывать',
              items: ['«Красоту» кода', 'Количество строк', 'Название алгоритма', 'Год создания']
            },
            vs: 'vs'
          },
          {
            t: 'callout',
            icon: 'fas fa-code',
            title: 'Встроенная сортировка',
            text: 'sorted() в Python — Timsort: гибрид сортировки слиянием и вставками. На практике почти всегда используют её, а не самодельные циклы.'
          }
        ]
      },
      {
        k: 'practice',
        eyebrow: '06 · ПРАКТИКА',
        title: 'Аргументируем выбор',
        lead: 'Отвечайте названием алгоритма или свойства.',
        tasks: [
          { title: 'Почти готовые данные', q: 'Какой из трёх алгоритмов быстрее на почти отсортированном массиве?', answer: ['вставки', 'вставками', 'insertion'], explain: 'Вставки адаптивны.', hint: 'Сложность O(n) в лучшем случае.' },
          { title: 'Мало обменов', q: 'У какого алгоритма меньше всего обменов?', answer: ['выбор', 'выбором', 'selection'], explain: 'Не более n − 1 обменов.', hint: 'Один обмен за шаг.' },
          { title: 'Устойчивость', q: 'Какой из трёх алгоритмов неустойчив?', answer: ['выбор', 'выбором', 'selection'], explain: 'Выбор может поменять порядок равных элементов.', hint: 'Не пузырёк и не вставки.' },
          { title: 'Сложность', q: 'Какая сложность у всех трёх в среднем случае?', answer: ['o(n²)', 'n^2', 'o(n^2)', 'квадратичная'], explain: 'O(n²).', hint: 'Квадрат числа элементов.' },
          { title: 'Память', q: 'Сколько дополнительной памяти требуют эти алгоритмы?', answer: ['o(1)', '1', 'константа', 'постоянную', 'o(1)'], explain: 'Сортируют на месте, память O(1).', hint: 'Не пропорционально n.' }
        ],
        criteria: [
          { mark: '1 балл', text: 'Выбор алгоритма обоснован свойствами данных.' },
          { mark: '1 балл', text: 'Устойчивость и сложность названы верно.' },
          { mark: '1 балл', text: 'Сделан вывод о применении встроенной сортировки.' }
        ]
      },
      {
        k: 'quiz',
        eyebrow: '07 · ПРОВЕРКА',
        questions: [
          { q: 'Какая сложность у простых сортировок в среднем?', options: ['O(n²)', 'O(n log n)', 'O(n)', 'O(1)'], answer: 0, explain: 'Квадратичная.' },
          { q: 'Какая сортировка адаптивна?', options: ['Вставки', 'Выбор', 'Пузырёк без флага', 'Никакая'], answer: 0, explain: 'Вставки ускоряются на готовых данных.' },
          { q: 'Что означает устойчивость?', options: ['Равные элементы сохраняют порядок', 'Алгоритм не падает', 'Алгоритм быстрый', 'Память не растёт'], answer: 0, explain: 'Порядок равных сохраняется.' },
          { q: 'Какая сортировка неустойчива?', options: ['Выбор', 'Вставки', 'Пузырёк', 'Timsort'], answer: 0, explain: 'Выбор может переставить равные.' },
          { q: 'Что использует sorted() в Python?', options: ['Timsort', 'Пузырёк', 'Выбор', 'Вставки без слияния'], answer: 0, explain: 'Гибрид слияния и вставок.' }
        ]
      },
      {
        k: 'summary',
        points: [
          'Простые сортировки имеют сложность O(n²).',
          'Вставки адаптивны: O(n) на готовых данных.',
          'Выбор экономит обмены, но неустойчив.',
          'Все три работают на месте, память O(1).',
          'На практике используют Timsort через sorted().'
        ],
        ticket: [
          'Для почти готовых данных я выберу ...',
          'Устойчивость нужна, когда ...',
          'На больших массивах я использую ...'
        ]
      }
    ]
  });

  /* ==========================================================================
     УРОК 14. Быстрая сортировка
     ========================================================================== */
  Q2.add('10emn-q2-14', {
    num: 14,
    cls: '10 ЕМН',
    title: 'Алгоритмы сортировки',
    slides: [
      {
        k: 'hero',
        eyebrow: '01 · ВВЕДЕНИЕ',
        title: 'Алгоритмы <span class="accent-text">сортировки</span>',
        lead: 'Быстрая сортировка выбирает опорный элемент, делит массив на меньшие и большие и рекурсивно сортирует части. В среднем это O(n log n).',
        goal: 'Объяснять идею быстрой сортировки и её сложность.',
        goalCode: '10.2.2.2',
        chips: [
          { icon: 'fas fa-scissors', text: 'Опорный элемент' },
          { icon: 'fas fa-code-branch', text: 'Две части' },
          { icon: 'fas fa-rotate-left', text: 'Рекурсия' }
        ],
        visual: 'sort',
        visualCaption: 'Задача делится пополам — и решается рекурсивно',
        cta: 'Разделить массив'
      },
      {
        k: 'review',
        questions: [
          { q: 'Сложность простых сортировок в среднем —', options: ['O(n²)', 'O(n log n)', 'O(n)', 'O(1)'], answer: 0, explain: 'Квадратичная.' },
          { q: 'Какая сортировка адаптивна?', options: ['Вставки', 'Выбор', 'Пузырёк без флага', 'Никакая'], answer: 0, explain: 'Быстрее на готовых данных.' },
          { q: 'Устойчивость означает...', options: ['Равные сохраняют порядок', 'Нет падений', 'Высокую скорость', 'Малую память'], answer: 0, explain: 'Порядок равных сохраняется.' },
          { q: 'Неустойчивая сортировка —', options: ['Выбор', 'Вставки', 'Пузырёк', 'Timsort'], answer: 0, explain: 'Выбор может переставить равные.' },
          { q: 'Что использует sorted()?', options: ['Timsort', 'Пузырёк', 'Выбор', 'Вставки'], answer: 0, explain: 'Гибрид слияния и вставок.' }
        ]
      },
      {
        k: 'concept',
        eyebrow: '03 · ИДЕЯ',
        title: 'Опорный элемент',
        lead: 'Выбираем pivot. Все элементы меньше него отправляем влево, больше — вправо. Затем сортируем обе части тем же способом.',
        blocks: [
          {
            t: 'steps',
            items: [
              { title: 'Шаг 1', text: 'Выбираем опорный элемент — например, средний.' },
              { title: 'Шаг 2', text: 'Разбиваем массив: меньше pivot — слева, больше — справа.' },
              { title: 'Шаг 3', text: 'Рекурсивно сортируем левую и правую части.' },
              { title: 'Шаг 4', text: 'База — массив из 0 или 1 элемента уже отсортирован.' }
            ]
          },
          {
            t: 'code',
            title: 'quick.py',
            code: 'def quick_sort(a):\n    if len(a) <= 1:              # база\n        return a\n    pivot = a[len(a) // 2]\n    left = [x for x in a if x < pivot]\n    middle = [x for x in a if x == pivot]\n    right = [x for x in a if x > pivot]\n    return quick_sort(left) + middle + quick_sort(right)\n\nprint(quick_sort([7, 2, 9, 4, 1, 8]))'
          },
          {
            t: 'callout',
            icon: 'fas fa-scissors',
            title: 'Почему быстро',
            text: 'Каждый уровень рекурсии обрабатывает все n элементов, а уровней примерно log₂ n — потому что массив делится примерно пополам. Итого O(n log n).'
          }
        ]
      },
      {
        k: 'lab',
        eyebrow: '04 · ИНТЕРАКТИВ',
        title: 'Сравните с простой сортировкой',
        lead: 'Запустите пузырёк на массиве из восьми чисел и посчитайте шаги. Затем оцените, сколько уровней было бы у быстрой сортировки.',
        widget: {
          kind: 'sort',
          config: { algo: 'bubble', array: [7, 2, 9, 4, 1, 8, 3, 6] }
        },
        after: [
          {
            t: 'callout',
            tone: 'good',
            icon: 'fas fa-check',
            title: 'Оценка',
            text: 'Для 8 элементов пузырёк делает около 28 сравнений. Быстрая сортировка — примерно 8 × log₂8 = 24 операции на всех уровнях, и разрыв растёт с n.'
          }
        ]
      },
      {
        k: 'concept',
        eyebrow: '05 · СЛОЖНОСТЬ',
        title: 'Когда quicksort замедляется',
        lead: 'В среднем O(n log n), но при неудачном выборе pivot — O(n²). Худший случай возникает, когда pivot оказывается минимумом или максимумом.',
        blocks: [
          {
            t: 'table',
            caption: 'Сложность быстрой сортировки',
            head: ['Случай', 'Условие', 'Сложность'],
            rows: [
              ['Лучший', 'Pivot делит массив пополам', 'O(n log n)'],
              ['Средний', 'Случайные данные', 'O(n log n)'],
              ['Худший', 'Pivot — крайний элемент', 'O(n²)'],
              ['Память', 'Копии подмассивов', 'O(n) в простой версии']
            ],
            highlight: 2
          },
          {
            t: 'compare',
            left: {
              title: 'Быстрая сортировка',
              items: ['O(n log n) в среднем', 'Рекурсивная', 'Чувствительна к pivot', 'Простая версия тратит память']
            },
            right: {
              title: 'Простые сортировки',
              items: ['O(n²) всегда', 'Итеративные', 'Не чувствительны к выбору', 'Память O(1)']
            },
            vs: 'vs'
          },
          {
            t: 'callout',
            tone: 'warn',
            icon: 'fas fa-triangle-exclamation',
            title: 'Риск глубокой рекурсии',
            text: 'При неудачных pivot глубина рекурсии достигает n. Поэтому в реальных реализациях pivot выбирают случайно или медианой из трёх.'
          }
        ]
      },
      {
        k: 'practice',
        eyebrow: '06 · ПРАКТИКА',
        title: 'Делим массив',
        lead: 'Считайте, сколько элементов попадёт в каждую часть.',
        tasks: [
          { title: 'Pivot', q: 'Массив 3, 1, 4, 2, 5. Сколько элементов меньше pivot = 3?', answer: '2', type: 'number', explain: 'Меньше 3 — это 1 и 2.', hint: 'Сравните каждый элемент с 3.' },
          { title: 'Разбиение', q: 'Массив 3, 1, 4, 2, 5, pivot = 3. Сколько элементов больше 3?', answer: '2', type: 'number', explain: 'Больше 3 — это 4 и 5.', hint: 'Не считайте сам pivot.' },
          { title: 'Сложность', q: 'Какова сложность быстрой сортировки в среднем?', answer: ['o(n log n)', 'n log n', 'o(nlogn)', 'n*logn'], explain: 'O(n log n).', hint: 'Логарифм появляется из деления.' },
          { title: 'Худший случай', q: 'При каком pivot быстрая сортировка работает за O(n²)?', answer: ['крайний', 'минимальный', 'максимальный', 'худший'], explain: 'Если pivot — минимум или максимум, деление получается неравномерным.', hint: 'Одна часть пустая, другая n − 1.' },
          { title: 'База', q: 'Какой массив считается отсортированным без рекурсии?', answer: ['из одного элемента', 'пустой', '0 или 1', 'из 0 или 1 элемента'], explain: 'База: len(a) <= 1.', hint: 'Самый маленький размер.' }
        ],
        criteria: [
          { mark: '1 балл', text: 'Разбиение на части выполнено верно.' },
          { mark: '1 балл', text: 'Сложность в среднем и худшем случае названа.' },
          { mark: '1 балл', text: 'База рекурсии определена.' }
        ]
      },
      {
        k: 'quiz',
        eyebrow: '07 · ПРОВЕРКА',
        questions: [
          { q: 'Что такое pivot?', options: ['Опорный элемент', 'Первый элемент массива', 'Размер массива', 'Индекс'], answer: 0, explain: 'Относительно него делят массив.' },
          { q: 'Сложность quicksort в среднем —', options: ['O(n log n)', 'O(n²)', 'O(n)', 'O(log n)'], answer: 0, explain: 'Деление даёт логарифм уровней.' },
          { q: 'Худший случай quicksort —', options: ['O(n²)', 'O(n log n)', 'O(n)', 'O(1)'], answer: 0, explain: 'При неудачном pivot.' },
          { q: 'Какая база у quicksort?', options: ['Массив из 0 или 1 элемента', 'Массив из 2 элементов', 'Пустая строка', 'Нет базы'], answer: 0, explain: 'Такой массив уже отсортирован.' },
          { q: 'Почему выбирают случайный pivot?', options: ['Чтобы избежать худшего случая', 'Для красоты', 'Чтобы уменьшить память', 'Чтобы убрать рекурсию'], answer: 0, explain: 'Случайность снижает риск O(n²).' }
        ]
      },
      {
        k: 'summary',
        points: [
          'Quicksort выбирает опорный элемент и делит массив.',
          'Части сортируются рекурсивно.',
          'В среднем сложность O(n log n).',
          'Худший случай — O(n²) при неудачном pivot.',
          'База — массив из 0 или 1 элемента.'
        ],
        ticket: [
          'Pivot нужен, чтобы ...',
          'Средняя сложность quicksort ...',
          'Худший случай возникает, когда ...'
        ]
      }
    ]
  });

  /* ==========================================================================
     УРОК 15. sorted(), key и сортировка записей
     ========================================================================== */
  Q2.add('10emn-q2-15', {
    num: 15,
    cls: '10 ЕМН',
    title: 'СОЧ',
    slides: [
      {
        k: 'hero',
        eyebrow: '01 · ВВЕДЕНИЕ',
        title: '<span class="accent-text">СОЧ</span>',
        lead: 'В реальных задачах сортируют не отдельные числа, а строки таблиц: учеников по баллам, товары по цене. Для этого в Python есть параметр key.',
        goal: 'Сортировать сложные структуры данных по ключу.',
        goalCode: '10.2.2.2',
        chips: [
          { icon: 'fas fa-key', text: 'key и lambda' },
          { icon: 'fas fa-table', text: 'Кортежи и словари' },
          { icon: 'fas fa-shield-halved', text: 'Устойчивость Timsort' }
        ],
        visual: 'sort',
        visualCaption: 'Один список — разные правила сравнения',
        cta: 'Сортировать записи'
      },
      {
        k: 'review',
        questions: [
          { q: 'Что такое pivot?', options: ['Опорный элемент', 'Первый элемент', 'Размер массива', 'Индекс'], answer: 0, explain: 'Относительно него делят массив.' },
          { q: 'Сложность quicksort в среднем —', options: ['O(n log n)', 'O(n²)', 'O(n)', 'O(log n)'], answer: 0, explain: 'Логарифм уровней деления.' },
          { q: 'Худший случай quicksort —', options: ['O(n²)', 'O(n log n)', 'O(n)', 'O(1)'], answer: 0, explain: 'При неудачном pivot.' },
          { q: 'База quicksort —', options: ['Массив из 0 или 1 элемента', 'Из 2 элементов', 'Пустая строка', 'Нет базы'], answer: 0, explain: 'Он уже отсортирован.' },
          { q: 'Зачем случайный pivot?', options: ['Избежать худшего случая', 'Для красоты', 'Для памяти', 'Убрать рекурсию'], answer: 0, explain: 'Снижает риск O(n²).' }
        ]
      },
      {
        k: 'concept',
        eyebrow: '03 · KEY',
        title: 'Ключ — функция от элемента',
        lead: 'key принимает элемент и возвращает значение для сравнения. Часто используют lambda — короткую безымянную функцию.',
        blocks: [
          {
            t: 'code',
            title: 'key.py',
            code: 'students = [\n    ("Аня", 78),\n    ("Бек", 91),\n    ("Дана", 78),\n    ("Егор", 64),\n]\n\n# по баллам по убыванию\nprint(sorted(students, key=lambda s: s[1], reverse=True))\n\n# по имени\nprint(sorted(students, key=lambda s: s[0]))\n\n# сначала по баллам, потом по имени\nprint(sorted(students, key=lambda s: (-s[1], s[0])))'
          },
          {
            t: 'table',
            caption: 'Что возвращает key',
            head: ['Запись', 'key', 'Сравнивается'],
            rows: [
              ['("Аня", 78)', 'lambda s: s[1]', '78'],
              ['("Аня", 78)', 'lambda s: s[0]', '"Аня"'],
              ['{"name": "Аня", "score": 78}', 'lambda s: s["score"]', '78'],
              ['"груша"', 'len', '6']
            ],
            highlight: 2
          },
          {
            t: 'callout',
            icon: 'fas fa-shield-halved',
            title: 'Устойчивость Timsort',
            text: 'sorted() устойчива: равные по ключу элементы сохраняют исходный порядок. Поэтому можно сортировать в два прохода — сначала по второстепенному признаку, затем по главному.'
          }
        ]
      },
      {
        k: 'lab',
        eyebrow: '04 · ИНТЕРАКТИВ',
        title: 'Предскажите вывод',
        lead: 'Прочитайте код и выберите результат. Обратите внимание на reverse=True и на порядок равных элементов.',
        widget: {
          kind: 'codePredict',
          config: {
            title: 'predict_key.py',
            code: 'data = [("Аня", 78), ("Бек", 91), ("Дана", 78)]\nresult = sorted(data, key=lambda s: -s[1])\nprint(result[0][0], result[-1][0])',
            options: ['Бек Дана', 'Аня Бек', 'Дана Бек', 'Бек Аня'],
            answer: 0,
            explain: 'Сортировка по убыванию баллов: Бек (91), затем Аня и Дана (78). Устойчивость сохраняет исходный порядок равных, поэтому последняя — Дана.'
          }
        },
        after: [
          {
            t: 'callout',
            tone: 'good',
            icon: 'fas fa-check',
            title: 'Разбор',
            text: 'Бек с 91 баллом идёт первым. Аня и Дана имеют по 78: Аня была раньше в списке, поэтому стоит перед Даной. Последняя — Дана.'
          }
        ]
      },
      {
        k: 'concept',
        eyebrow: '05 · ПРИЁМЫ',
        title: 'Два прохода вместо сложного ключа',
        lead: 'Благодаря устойчивости можно сначала отсортировать по второстепенному признаку, а потом по главному — результат будет правильным.',
        blocks: [
          {
            t: 'code',
            title: 'two_pass.py',
            code: 'students = [("Аня", 78), ("Бек", 91), ("Дана", 78)]\n\n# 1) сначала по имени\nstudents.sort(key=lambda s: s[0])\n# 2) затем по баллам (устойчиво!)\nstudents.sort(key=lambda s: s[1], reverse=True)\n\nprint(students)'
          },
          {
            t: 'widget',
            kind: 'pythonRef',
            config: {
              title: 'Напоминание Python',
              groups: [
                {
                  title: 'Сортировка',
                  items: [
                    { cmd: 'sorted(a, key=f)', text: 'новый список, сравнение по f' },
                    { cmd: 'a.sort(key=f, reverse=True)', text: 'на месте, по убыванию' },
                    { cmd: 'lambda x: x[1]', text: 'безымянная функция — второй элемент' },
                    { cmd: 'lambda s: (-s[1], s[0])', text: 'составной ключ' }
                  ]
                },
                {
                  title: 'Структуры',
                  items: [
                    { cmd: '("Аня", 78)', text: 'кортеж: имя и балл' },
                    { cmd: '{"name": "Аня"}', text: 'словарь: доступ по ключу' },
                    { cmd: 's[0], s[1]', text: 'элементы кортежа по индексу' },
                    { cmd: 's["score"]', text: 'значение из словаря' }
                  ]
                }
              ]
            }
          },
          {
            t: 'callout',
            tone: 'warn',
            icon: 'fas fa-triangle-exclamation',
            title: 'Частая ошибка',
            text: 'lambda s: s[1] и lambda s: s[1:] — разные вещи. Второй вариант возвращает список, и сравнение пойдёт по нему, а не по числу.'
          }
        ]
      },
      {
        k: 'practice',
        eyebrow: '06 · ПРАКТИКА',
        title: 'Пишем ключи',
        lead: 'Записывайте выражения коротко, без пробелов можно.',
        tasks: [
          { title: 'По баллу', q: 'Какой ключ отсортирует пары (имя, балл) по баллу?', answer: ['lambda s: s[1]', 'lambda x: x[1]', 's[1]', 'key=lambda s: s[1]'], explain: 'Балл — второй элемент кортежа.', hint: 'Индексы начинаются с 0.' },
          { title: 'По имени', q: 'Какой ключ отсортирует пары по имени?', answer: ['lambda s: s[0]', 'lambda x: x[0]', 's[0]', 'key=lambda s: s[0]'], explain: 'Имя — первый элемент кортежа.', hint: 'Индекс 0.' },
          { title: 'Убывание', q: 'Какой параметр включает сортировку по убыванию?', answer: ['reverse=true', 'reverse', 'reverse = true'], explain: 'reverse=True.', hint: 'Английское «обратный».' },
          { title: 'Результат', q: 'Что вернёт sorted([3, 1, 2], reverse=True)?', answer: ['[3, 2, 1]', '[3,2,1]', '3, 2, 1'], explain: 'Порядок по убыванию.', hint: 'Сначала наибольшее.' },
          { title: 'Устойчивость', q: 'Сохраняет ли sorted() порядок равных элементов?', answer: ['да', 'yes'], explain: 'Timsort устойчива.', hint: 'Это важно для двух проходов.' }
        ],
        criteria: [
          { mark: '1 балл', text: 'Ключ возвращает нужное поле.' },
          { mark: '1 балл', text: 'Направление сортировки задано верно.' },
          { mark: '1 балл', text: 'Устойчивость использована осознанно.' }
        ]
      },
      {
        k: 'quiz',
        eyebrow: '07 · ПРОВЕРКА',
        questions: [
          { q: 'Что делает key?', options: ['Задаёт значение для сравнения', 'Меняет список', 'Удаляет элементы', 'Задаёт размер'], answer: 0, explain: 'key превращает элемент в значение для сравнения.' },
          { q: 'Что такое lambda?', options: ['Безымянная функция', 'Тип списка', 'Модуль', 'Ошибка'], answer: 0, explain: 'Короткая функция в одну строку.' },
          { q: 'Что вернёт sorted([2, 5, 1])?', options: ['[1, 2, 5]', '[5, 2, 1]', '[2, 5, 1]', 'None'], answer: 0, explain: 'По возрастанию.' },
          { q: 'Устойчива ли sorted()?', options: ['Да', 'Нет', 'Только для чисел', 'Только для строк'], answer: 0, explain: 'Timsort сохраняет порядок равных.' },
          { q: 'Как отсортировать по убыванию?', options: ['reverse=True', 'reverse=False', 'desc=True', 'order=-1'], answer: 0, explain: 'Параметр reverse=True.' }
        ]
      },
      {
        k: 'summary',
        points: [
          'key задаёт значение для сравнения.',
          'lambda — короткая функция для ключа.',
          'sorted() устойчива, .sort() меняет список на месте.',
          'Устойчивость позволяет сортировать в два прохода.',
          'Составной ключ задают кортежем значений.'
        ],
        ticket: [
          'Для сортировки по баллу я напишу ключ ...',
          'Устойчивость позволяет ...',
          'Разница sorted() и .sort() в том, что ...'
        ]
      }
    ]
  });

  /* ==========================================================================
     УРОК 16. Проект и итоги четверти
     ========================================================================== */
  Q2.add('10emn-q2-16', {
    num: 16,
    cls: '10 ЕМН',
    title: 'Алгоритмы сортировки',
    slides: [
      {
        k: 'hero',
        eyebrow: '01 · ВВЕДЕНИЕ',
        title: 'Алгоритмы <span class="accent-text">сортировки</span>',
        lead: 'Итоговый проект соединяет обе темы: нужно обработать данные рекурсивно и упорядочить их, объяснив выбор алгоритма.',
        goal: 'Применять рекурсию и сортировки в практическом проекте.',
        goalCode: '10.2.2.2',
        chips: [
          { icon: 'fas fa-diagram-project', text: 'Проект' },
          { icon: 'fas fa-list-check', text: 'Критерии' },
          { icon: 'fas fa-graduation-cap', text: 'Итоги четверти' }
        ],
        visual: 'project',
        visualCaption: 'Знание становится результатом',
        cta: 'Собрать проект'
      },
      {
        k: 'review',
        questions: [
          { q: 'Что делает key?', options: ['Задаёт значение для сравнения', 'Меняет список', 'Удаляет элементы', 'Задаёт размер'], answer: 0, explain: 'Превращает элемент в ключ.' },
          { q: 'Что такое lambda?', options: ['Безымянная функция', 'Тип списка', 'Модуль', 'Ошибка'], answer: 0, explain: 'Короткая функция.' },
          { q: 'Что вернёт sorted([2, 5, 1])?', options: ['[1, 2, 5]', '[5, 2, 1]', '[2, 5, 1]', 'None'], answer: 0, explain: 'По возрастанию.' },
          { q: 'Устойчива ли sorted()?', options: ['Да', 'Нет', 'Только для чисел', 'Только для строк'], answer: 0, explain: 'Timsort устойчива.' },
          { q: 'Как включить убывание?', options: ['reverse=True', 'reverse=False', 'desc=True', 'order=-1'], answer: 0, explain: 'reverse=True.' }
        ]
      },
      {
        k: 'concept',
        eyebrow: '03 · ИТОГИ',
        title: 'Что должно остаться в памяти',
        lead: 'Проверьте себя: каждый пункт вы можете объяснить своими словами и показать в коде.',
        blocks: [
          {
            t: 'table',
            caption: 'Две темы четверти',
            head: ['Тема', 'Ключевые понятия', 'Код'],
            rows: [
              ['Рекурсия', 'База, шаг, стек, глубина', 'factorial, digit_sum, reverse'],
              ['Сортировки', 'Сравнения, обмены, сдвиги, сложность', 'bubble, selection, insertion'],
              ['Оценка', 'O(n²), O(n log n), устойчивость', 'счётчики и таблицы'],
              ['Python', 'sorted, .sort, key, lambda', 'сортировка записей']
            ]
          },
          {
            t: 'list',
            icon: 'fas fa-list-check',
            title: 'Минимальный набор умений',
            items: [
              'Написать рекурсивную функцию с базой и шагом.',
              'Построить трассировку и посчитать глубину.',
              'Объяснить, почему без базы возникает RecursionError.',
              'Реализовать одну простую сортировку по шагам.',
              'Сравнить алгоритмы по сложности и устойчивости.',
              'Отсортировать список записей по ключу.'
            ]
          },
          {
            t: 'callout',
            tone: 'good',
            icon: 'fas fa-graduation-cap',
            title: 'Главная мысль',
            text: 'Алгоритм — это не текст программы, а способ решения. Один и тот же результат можно получить разной ценой, и умение оценить эту цену отличает программиста от исполнителя.'
          }
        ]
      },
      {
        k: 'concept',
        eyebrow: '04 · ПРОЕКТ',
        title: 'Задание на проект',
        lead: 'Выберите набор данных из 8–12 записей с двумя числовыми или текстовыми признаками.',
        blocks: [
          {
            t: 'steps',
            items: [
              { title: 'Часть 1. Данные', text: 'Опишите записи: например, фильмы (название, год, рейтинг) или товары (название, цена, количество).' },
              { title: 'Часть 2. Рекурсия', text: 'Напишите рекурсивную функцию, которая обрабатывает данные: сумма цифр года, количество элементов, разворот названия.' },
              { title: 'Часть 3. Сортировка', text: 'Отсортируйте записи по двум критериям и объясните выбор алгоритма.' },
              { title: 'Часть 4. Оценка', text: 'Сравните число сравнений и перемещений для двух алгоритмов на ваших данных.' },
              { title: 'Часть 5. Вывод', text: 'Сделайте вывод: какой алгоритм и критерий подошли лучше и почему.' }
            ]
          },
          {
            t: 'rubric',
            title: 'Критерии оценивания',
            items: [
              { mark: '2 балла', text: 'Рекурсивная функция корректна, есть база и шаг.' },
              { mark: '2 балла', text: 'Сортировка по двум критериям работает верно.' },
              { mark: '2 балла', text: 'Приведено сравнение алгоритмов с числами.' },
              { mark: '1 балл', text: 'Код читаем, есть комментарии к неочевидным местам.' },
              { mark: '1 балл', text: 'Вывод обоснован, а не формален.' }
            ]
          }
        ]
      },
      {
        k: 'lab',
        eyebrow: '05 · ТРЕНАЖЁР',
        title: 'Проверка алгоритма перед защитой',
        lead: 'Введите данные своего проекта в поле списка и прогоните два алгоритма. Запишите число сравнений и перемещений — эти числа войдут в вывод.',
        widget: {
          kind: 'sort',
          config: { algo: 'insertion', array: [90, 75, 88, 64, 95, 70, 82] }
        },
        after: [
          {
            t: 'callout',
            tone: 'good',
            icon: 'fas fa-check',
            title: 'Что записать',
            text: 'Сравните вставки и выбор на одних данных. Если список почти упорядочен, вставки сделают заметно меньше перемещений — это готовый аргумент для вывода.'
          }
        ]
      },
      {
        k: 'practice',
        eyebrow: '06 · ПРАКТИКА',
        title: 'Черновик проекта',
        lead: 'Ответьте на вопросы — это основа вашей работы.',
        tasks: [
          { title: 'Данные', q: 'Сколько записей вы возьмёте в проект? (8–12)', answer: ['8', '9', '10', '11', '12'], type: 'number', explain: 'Достаточно 8–12 записей: их удобно показывать и анализировать.', hint: 'Не берите слишком много.' },
          { title: 'Признаки', q: 'Сколько признаков будет у каждой записи?', answer: '2', type: 'number', explain: 'Двух признаков достаточно для двух критериев сортировки.', hint: 'Например, цена и количество.' },
          { title: 'Рекурсия', q: 'Какую рекурсивную функцию вы напишете?', answer: ['сумма цифр', 'digit_sum', 'количество цифр', 'count', 'разворот строки', 'reverse', 'факториал'], explain: 'Подойдёт любая из изученных: сумма цифр, количество цифр, разворот строки.', hint: 'Выберите ту, что связана с вашими данными.' },
          { title: 'Сортировка', q: 'Какой алгоритм вы реализуете вручную?', answer: ['пузырёк', 'выбор', 'вставки', 'bubble', 'selection', 'insertion'], explain: 'Любой из трёх простых — главное объяснить выбор.', hint: 'Учитывайте свойства данных.' },
          { title: 'Оценка', q: 'Какой показатель вы сравните у двух алгоритмов?', answer: ['сравнения', 'обмены', 'сдвиги', 'число сравнений', 'число обменов'], explain: 'Число сравнений и перемещений — основной измеримый показатель.', hint: 'Счётчики в интерактиве.' }
        ],
        criteria: [
          { mark: '1 балл', text: 'Данные и признаки описаны конкретно.' },
          { mark: '1 балл', text: 'Рекурсивная функция связана с задачей.' },
          { mark: '1 балл', text: 'Алгоритм выбран с обоснованием.' }
        ]
      },
      {
        k: 'quiz',
        eyebrow: '07 · ИТОГОВАЯ ПРОВЕРКА',
        questions: [
          { q: 'Из чего состоит рекурсивная функция?', options: ['База и шаг', 'Два цикла', 'Список и словарь', 'Модуль и класс'], answer: 0, explain: 'Без них рекурсия не работает.' },
          { q: 'Что произойдёт без базы?', options: ['RecursionError', 'Ускорение', 'Ничего', 'Сортировка'], answer: 0, explain: 'Стек переполнится.' },
          { q: 'Какая сортировка адаптивна?', options: ['Вставки', 'Выбор', 'Пузырёк без флага', 'Никакая'], answer: 0, explain: 'O(n) на готовых данных.' },
          { q: 'Сложность quicksort в среднем —', options: ['O(n log n)', 'O(n²)', 'O(n)', 'O(1)'], answer: 0, explain: 'Деление даёт логарифм уровней.' },
          { q: 'Что задаёт key в sorted()?', options: ['Значение для сравнения', 'Размер списка', 'Тип данных', 'Имя файла'], answer: 0, explain: 'Ключ сравнения.' }
        ]
      },
      {
        k: 'summary',
        points: [
          'Рекурсия требует базы и уменьшения задачи.',
          'Стек ограничивает глубину рекурсии.',
          'Простые сортировки — O(n²), quicksort — O(n log n) в среднем.',
          'Вставки адаптивны, выбор экономит обмены.',
          'sorted() с key решает практические задачи сортировки.'
        ],
        ticket: [
          'Главное открытие четверти — ...',
          'В проекте я покажу ..., потому что ...',
          'Перед СОЧ я повторю ...'
        ]
      }
    ]
  });
})();
