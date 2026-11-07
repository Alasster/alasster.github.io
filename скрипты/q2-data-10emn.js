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

  const BASE_STEP_SVG = `<svg viewBox="0 0 600 250" role="img" aria-label="Схема: База и рекурсивный шаг">
    <defs>
      <linearGradient id="g-base" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#ecfdf5"/>
        <stop offset="100%" stop-color="#d1fae5"/>
      </linearGradient>
      <linearGradient id="g-step" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#eff6ff"/>
        <stop offset="100%" stop-color="#dbeafe"/>
      </linearGradient>
      <marker id="arrow-blue" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M 0 0 L 10 5 L 0 10 z" fill="#2563eb"/>
      </marker>
      <marker id="arrow-green" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M 0 0 L 10 5 L 0 10 z" fill="#059669"/>
      </marker>
    </defs>
    <!-- Base Card -->
    <rect x="30" y="40" width="250" height="150" rx="14" fill="url(#g-base)" stroke="#10b981" stroke-width="2"/>
    <text x="155" y="70" font-family="system-ui, sans-serif" font-size="16" font-weight="700" fill="#065f46" text-anchor="middle">1. База рекурсии (Стоп-кран)</text>
    <rect x="50" y="85" width="210" height="38" rx="8" fill="#ffffff" stroke="#a7f3d0"/>
    <text x="155" y="109" font-family="'JetBrains Mono', monospace" font-size="13" font-weight="600" fill="#047857" text-anchor="middle">if n &lt;= 1: return 1</text>
    <text x="155" y="145" font-family="system-ui, sans-serif" font-size="12" fill="#065f46" text-anchor="middle">Простейший известный случай</text>
    <text x="155" y="165" font-family="system-ui, sans-serif" font-size="12" font-weight="600" fill="#059669" text-anchor="middle">Возврат БЕЗ новых вызовов</text>

    <!-- Step Card -->
    <rect x="320" y="40" width="250" height="150" rx="14" fill="url(#g-step)" stroke="#2563eb" stroke-width="2"/>
    <text x="445" y="70" font-family="system-ui, sans-serif" font-size="16" font-weight="700" fill="#1e40af" text-anchor="middle">2. Рекурсивный шаг</text>
    <rect x="340" y="85" width="210" height="38" rx="8" fill="#ffffff" stroke="#bfdbfe"/>
    <text x="445" y="109" font-family="'JetBrains Mono', monospace" font-size="13" font-weight="600" fill="#1d4ed8" text-anchor="middle">return n * f(n - 1)</text>
    <text x="445" y="145" font-family="system-ui, sans-serif" font-size="12" fill="#1e3a8a" text-anchor="middle">Уменьшение задачи на 1</text>
    <text x="445" y="165" font-family="system-ui, sans-serif" font-size="12" font-weight="600" fill="#2563eb" text-anchor="middle">Движение В СТОРОНУ базы</text>

    <!-- Flow Arrows -->
    <path d="M 320 115 C 295 115, 295 115, 288 115" fill="none" stroke="#2563eb" stroke-width="2" marker-end="url(#arrow-blue)"/>
    <text x="300" y="225" font-family="system-ui, sans-serif" font-size="13" font-weight="600" fill="#475569" text-anchor="middle">Без базы → переполнение стека | Без шага → задача не уменьшается</text>
  </svg>`;

  const STACK_ANIM_SVG = `<svg viewBox="0 0 600 270" role="img" aria-label="Стек вызовов LIFO">
    <defs>
      <style>
        @keyframes stack-pulse {
          0%, 100% { transform: translateY(0); opacity: 0.9; }
          50% { transform: translateY(-3px); opacity: 1; }
        }
        .stk-box { animation: stack-pulse 3s ease-in-out infinite; }
      </style>
      <marker id="stk-down" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M 0 0 L 10 5 L 0 10 z" fill="#2563eb"/>
      </marker>
      <marker id="stk-up" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M 0 0 L 10 5 L 0 10 z" fill="#10b981"/>
      </marker>
    </defs>
    <!-- Stack container -->
    <rect x="180" y="25" width="240" height="200" rx="12" fill="#f8fafc" stroke="#94a3b8" stroke-width="2" stroke-dasharray="6 4"/>
    <text x="300" y="18" font-family="system-ui, sans-serif" font-size="12" font-weight="700" fill="#64748b" text-anchor="middle">ОПЕРАТИВНАЯ ПАМЯТЬ · СТЕК ВЫЗОВОВ (LIFO)</text>

    <!-- Stack Frames from top to bottom -->
    <g class="stk-box">
      <rect x="195" y="40" width="210" height="34" rx="8" fill="#eff6ff" stroke="#3b82f6" stroke-width="1.5"/>
      <text x="300" y="62" font-family="'JetBrains Mono', monospace" font-size="12" font-weight="600" fill="#1d4ed8" text-anchor="middle">factorial(3) [ждет n=2]</text>
    </g>
    <g class="stk-box" style="animation-delay: 0.2s;">
      <rect x="195" y="82" width="210" height="34" rx="8" fill="#dbeafe" stroke="#2563eb" stroke-width="1.5"/>
      <text x="300" y="104" font-family="'JetBrains Mono', monospace" font-size="12" font-weight="600" fill="#1e40af" text-anchor="middle">factorial(2) [ждет n=1]</text>
    </g>
    <g class="stk-box" style="animation-delay: 0.4s;">
      <rect x="195" y="124" width="210" height="34" rx="8" fill="#bfdbfe" stroke="#1d4ed8" stroke-width="1.5"/>
      <text x="300" y="146" font-family="'JetBrains Mono', monospace" font-size="12" font-weight="600" fill="#1e3a8a" text-anchor="middle">factorial(1) [ждет n=0]</text>
    </g>
    <g class="stk-box" style="animation-delay: 0.6s;">
      <rect x="195" y="166" width="210" height="38" rx="8" fill="#d1fae5" stroke="#10b981" stroke-width="2"/>
      <text x="300" y="184" font-family="'JetBrains Mono', monospace" font-size="12" font-weight="700" fill="#065f46" text-anchor="middle">factorial(0) = 1 (БАЗА)</text>
      <text x="300" y="198" font-family="system-ui, sans-serif" font-size="10" fill="#047857" text-anchor="middle">Стоп! Начало возврата вверх</text>
    </g>

    <!-- Left Arrow: Push -->
    <path d="M 140 45 L 140 185" fill="none" stroke="#2563eb" stroke-width="2.5" marker-end="url(#stk-down)"/>
    <text x="130" y="115" font-family="system-ui, sans-serif" font-size="11" font-weight="700" fill="#2563eb" text-anchor="end">1. Погружение</text>
    <text x="130" y="130" font-family="system-ui, sans-serif" font-size="10" fill="#64748b" text-anchor="end">(вызовы вниз)</text>

    <!-- Right Arrow: Pop / Return -->
    <path d="M 460 185 L 460 45" fill="none" stroke="#10b981" stroke-width="2.5" marker-end="url(#stk-up)"/>
    <text x="470" y="115" font-family="system-ui, sans-serif" font-size="11" font-weight="700" fill="#059669" text-anchor="start">2. Возврат значений</text>
    <text x="470" y="130" font-family="system-ui, sans-serif" font-size="10" fill="#059669" text-anchor="start">1 → 1 → 2 → 6</text>

    <!-- Bottom summary -->
    <text x="300" y="250" font-family="system-ui, sans-serif" font-size="12" font-weight="600" fill="#475569" text-anchor="middle">LIFO: Последний вызванный фрейм завершается первым</text>
  </svg>`;

  const FIB_TREE_SVG = `<svg viewBox="0 0 600 250" role="img" aria-label="Дерево вызовов Фибоначчи">
    <defs>
      <marker id="fib-ar" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
        <path d="M 0 0 L 10 5 L 0 10 z" fill="#64748b"/>
      </marker>
    </defs>
    <!-- Root -->
    <rect x="250" y="15" width="100" height="34" rx="8" fill="#eff6ff" stroke="#2563eb" stroke-width="2"/>
    <text x="300" y="37" font-family="'JetBrains Mono', monospace" font-size="13" font-weight="700" fill="#1e40af" text-anchor="middle">fib(4)</text>

    <!-- Level 1 lines -->
    <line x1="275" y1="50" x2="175" y2="85" stroke="#64748b" stroke-width="1.5" marker-end="url(#fib-ar)"/>
    <line x1="325" y1="50" x2="425" y2="85" stroke="#64748b" stroke-width="1.5" marker-end="url(#fib-ar)"/>

    <!-- Level 1 nodes -->
    <rect x="130" y="85" width="90" height="32" rx="8" fill="#dbeafe" stroke="#3b82f6" stroke-width="1.5"/>
    <text x="175" y="106" font-family="'JetBrains Mono', monospace" font-size="12" font-weight="600" fill="#1d4ed8" text-anchor="middle">fib(3)</text>

    <rect x="380" y="85" width="90" height="32" rx="8" fill="#dbeafe" stroke="#3b82f6" stroke-width="1.5"/>
    <text x="425" y="106" font-family="'JetBrains Mono', monospace" font-size="12" font-weight="600" fill="#1d4ed8" text-anchor="middle">fib(2)</text>

    <!-- Level 2 lines -->
    <line x1="155" y1="118" x2="95" y2="155" stroke="#64748b" stroke-width="1.5" marker-end="url(#fib-ar)"/>
    <line x1="195" y1="118" x2="255" y2="155" stroke="#64748b" stroke-width="1.5" marker-end="url(#fib-ar)"/>
    <line x1="405" y1="118" x2="355" y2="155" stroke="#64748b" stroke-width="1.5" marker-end="url(#fib-ar)"/>
    <line x1="445" y1="118" x2="505" y2="155" stroke="#64748b" stroke-width="1.5" marker-end="url(#fib-ar)"/>

    <!-- Level 2 nodes (fib(2), leaves) -->
    <rect x="55" y="155" width="80" height="30" rx="6" fill="#bfdbfe" stroke="#1d4ed8"/>
    <text x="95" y="175" font-family="'JetBrains Mono', monospace" font-size="11" font-weight="600" fill="#1e3a8a" text-anchor="middle">fib(2)</text>

    <rect x="215" y="155" width="80" height="30" rx="6" fill="#d1fae5" stroke="#10b981" stroke-width="1.5"/>
    <text x="255" y="175" font-family="'JetBrains Mono', monospace" font-size="11" font-weight="700" fill="#065f46" text-anchor="middle">fib(1)=1</text>

    <rect x="315" y="155" width="80" height="30" rx="6" fill="#d1fae5" stroke="#10b981" stroke-width="1.5"/>
    <text x="355" y="175" font-family="'JetBrains Mono', monospace" font-size="11" font-weight="700" fill="#065f46" text-anchor="middle">fib(1)=1</text>

    <rect x="465" y="155" width="80" height="30" rx="6" fill="#d1fae5" stroke="#10b981" stroke-width="1.5"/>
    <text x="505" y="175" font-family="'JetBrains Mono', monospace" font-size="11" font-weight="700" fill="#065f46" text-anchor="middle">fib(0)=0</text>

    <!-- Bottom leaves of fib(2) -->
    <line x1="80" y1="186" x2="55" y2="210" stroke="#64748b" stroke-width="1.2"/>
    <line x1="110" y1="186" x2="135" y2="210" stroke="#64748b" stroke-width="1.2"/>
    <rect x="15" y="210" width="75" height="24" rx="5" fill="#d1fae5" stroke="#10b981"/>
    <text x="52" y="226" font-family="'JetBrains Mono', monospace" font-size="10" font-weight="700" fill="#065f46" text-anchor="middle">fib(1)=1</text>
    <rect x="100" y="210" width="75" height="24" rx="5" fill="#d1fae5" stroke="#10b981"/>
    <text x="137" y="226" font-family="'JetBrains Mono', monospace" font-size="10" font-weight="700" fill="#065f46" text-anchor="middle">fib(0)=0</text>

    <!-- Caption -->
    <text x="380" y="228" font-family="system-ui, sans-serif" font-size="12" font-weight="600" fill="#475569">Ветвящаяся рекурсия: O(2ⁿ) операций</text>
  </svg>`;

  const DIGIT_PARSE_SVG = `<svg viewBox="0 0 600 230" role="img" aria-label="Декомпозиция числа на цифры">
    <defs>
      <marker id="num-ar" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M 0 0 L 10 5 L 0 10 z" fill="#2563eb"/>
      </marker>
    </defs>
    <!-- Main Box: Number 482 -->
    <rect x="220" y="20" width="160" height="50" rx="10" fill="#eff6ff" stroke="#2563eb" stroke-width="2"/>
    <text x="300" y="52" font-family="'JetBrains Mono', monospace" font-size="24" font-weight="700" fill="#1e40af" text-anchor="middle">N = 482</text>

    <!-- Branch left: % 10 -->
    <line x1="250" y1="72" x2="150" y2="120" stroke="#2563eb" stroke-width="2" marker-end="url(#num-ar)"/>
    <rect x="60" y="125" width="170" height="60" rx="10" fill="#fef3c7" stroke="#f59e0b" stroke-width="2"/>
    <text x="145" y="148" font-family="system-ui, sans-serif" font-size="12" font-weight="700" fill="#b45309" text-anchor="middle">n % 10 (Остаток)</text>
    <text x="145" y="172" font-family="'JetBrains Mono', monospace" font-size="18" font-weight="700" fill="#92400e" text-anchor="middle">цифра = 2</text>

    <!-- Branch right: // 10 -->
    <line x1="350" y1="72" x2="450" y2="120" stroke="#2563eb" stroke-width="2" marker-end="url(#num-ar)"/>
    <rect x="370" y="125" width="170" height="60" rx="10" fill="#dbeafe" stroke="#3b82f6" stroke-width="2"/>
    <text x="455" y="148" font-family="system-ui, sans-serif" font-size="12" font-weight="700" fill="#1e40af" text-anchor="middle">n // 10 (Шаг)</text>
    <text x="455" y="172" font-family="'JetBrains Mono', monospace" font-size="18" font-weight="700" fill="#1e3a8a" text-anchor="middle">остаток = 48</text>

    <!-- Formula -->
    <text x="300" y="215" font-family="'JetBrains Mono', monospace" font-size="13" font-weight="600" fill="#0f172a" text-anchor="middle">digit_sum(482) = 2 + digit_sum(48) → ... → 2 + 8 + 4 = 14</text>
  </svg>`;

  const STRING_REVERSE_SVG = `<svg viewBox="0 0 600 230" role="img" aria-label="Схема рекурсивной обработки строки">
    <defs>
      <marker id="str-ar" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M 0 0 L 10 5 L 0 10 z" fill="#7c3aed"/>
      </marker>
    </defs>
    <!-- Original string "КОД" -->
    <rect x="180" y="20" width="240" height="46" rx="10" fill="#f5f3ff" stroke="#7c3aed" stroke-width="2"/>
    <text x="300" y="50" font-family="'JetBrains Mono', monospace" font-size="18" font-weight="700" fill="#5b21b6" text-anchor="middle">s = "КОД"</text>

    <!-- Slicing: Head and Tail -->
    <line x1="240" y1="68" x2="160" y2="110" stroke="#7c3aed" stroke-width="2" marker-end="url(#str-ar)"/>
    <line x1="360" y1="68" x2="440" y2="110" stroke="#7c3aed" stroke-width="2" marker-end="url(#str-ar)"/>

    <rect x="70" y="115" width="170" height="55" rx="8" fill="#ede9fe" stroke="#8b5cf6" stroke-width="1.5"/>
    <text x="155" y="137" font-family="system-ui, sans-serif" font-size="11" font-weight="700" fill="#6d28d9" text-anchor="middle">Голова: s[0]</text>
    <text x="155" y="158" font-family="'JetBrains Mono', monospace" font-size="16" font-weight="700" fill="#4c1d95" text-anchor="middle">"К"</text>

    <rect x="360" y="115" width="170" height="55" rx="8" fill="#ede9fe" stroke="#8b5cf6" stroke-width="1.5"/>
    <text x="445" y="137" font-family="system-ui, sans-serif" font-size="11" font-weight="700" fill="#6d28d9" text-anchor="middle">Хвост: s[1:]</text>
    <text x="445" y="158" font-family="'JetBrains Mono', monospace" font-size="16" font-weight="700" fill="#4c1d95" text-anchor="middle">"ОД"</text>

    <!-- Assembly -->
    <rect x="130" y="185" width="340" height="34" rx="8" fill="#d1fae5" stroke="#10b981" stroke-width="1.5"/>
    <text x="300" y="207" font-family="'JetBrains Mono', monospace" font-size="13" font-weight="700" fill="#065f46" text-anchor="middle">reverse(s[1:]) + s[0] → "ДО" + "К" = "ДОК"</text>
  </svg>`;

  const COMPARE_SVG = `<svg viewBox="0 0 600 240" role="img" aria-label="Сравнение цикла и рекурсии">
    <!-- Left: Loop -->
    <rect x="30" y="25" width="250" height="190" rx="12" fill="#f8fafc" stroke="#64748b" stroke-width="1.5"/>
    <text x="155" y="52" font-family="system-ui, sans-serif" font-size="15" font-weight="700" fill="#1e293b" text-anchor="middle">Итерация (Цикл for/while)</text>
    <rect x="50" y="65" width="210" height="50" rx="8" fill="#ffffff" stroke="#cbd5e1"/>
    <text x="155" y="88" font-family="'JetBrains Mono', monospace" font-size="12" fill="#334155" text-anchor="middle">res = 1</text>
    <text x="155" y="105" font-family="'JetBrains Mono', monospace" font-size="12" fill="#334155" text-anchor="middle">for i in range(1, n+1):</text>
    <text x="155" y="142" font-family="system-ui, sans-serif" font-size="12" font-weight="600" fill="#059669" text-anchor="middle">Память: O(1) (константа)</text>
    <text x="155" y="162" font-family="system-ui, sans-serif" font-size="11" fill="#64748b" text-anchor="middle">Переменные перезаписываются</text>
    <text x="155" y="182" font-family="system-ui, sans-serif" font-size="11" font-weight="700" fill="#059669" text-anchor="middle">✓ Нет риска RecursionError</text>

    <!-- Right: Recursion -->
    <rect x="320" y="25" width="250" height="190" rx="12" fill="#eff6ff" stroke="#2563eb" stroke-width="1.5"/>
    <text x="445" y="52" font-family="system-ui, sans-serif" font-size="15" font-weight="700" fill="#1e40af" text-anchor="middle">Рекурсия (Стек вызовов)</text>
    <rect x="340" y="65" width="210" height="50" rx="8" fill="#ffffff" stroke="#bfdbfe"/>
    <text x="445" y="88" font-family="'JetBrains Mono', monospace" font-size="12" fill="#1d4ed8" text-anchor="middle">if n == 1: return 1</text>
    <text x="445" y="105" font-family="'JetBrains Mono', monospace" font-size="12" fill="#1d4ed8" text-anchor="middle">return n * fact(n - 1)</text>
    <text x="445" y="142" font-family="system-ui, sans-serif" font-size="12" font-weight="600" fill="#dc2626" text-anchor="middle">Память: O(N) (линейная)</text>
    <text x="445" y="162" font-family="system-ui, sans-serif" font-size="11" fill="#64748b" text-anchor="middle">N фреймов хранятся в стеке</text>
    <text x="445" y="182" font-family="system-ui, sans-serif" font-size="11" font-weight="700" fill="#2563eb" text-anchor="middle">✓ Идеально для деревьев и графов</text>
  </svg>`;

  const EXAM_SUMMARY_SVG = `<svg viewBox="0 0 600 230" role="img" aria-label="План решения рекуррентных задач СОР">
    <!-- 4 Cards -->
    <rect x="20" y="30" width="125" height="150" rx="10" fill="#eff6ff" stroke="#3b82f6" stroke-width="1.5"/>
    <text x="82" y="58" font-family="system-ui, sans-serif" font-size="12" font-weight="700" fill="#1e40af" text-anchor="middle">1. БАЗА</text>
    <text x="82" y="90" font-family="system-ui, sans-serif" font-size="11" fill="#1e3a8a" text-anchor="middle">Найти F(1) или</text>
    <text x="82" y="110" font-family="system-ui, sans-serif" font-size="11" fill="#1e3a8a" text-anchor="middle">F(0), где нет</text>
    <text x="82" y="130" font-family="system-ui, sans-serif" font-size="11" fill="#1e3a8a" text-anchor="middle">новых вызовов</text>

    <rect x="165" y="30" width="125" height="150" rx="10" fill="#f5f3ff" stroke="#8b5cf6" stroke-width="1.5"/>
    <text x="227" y="58" font-family="system-ui, sans-serif" font-size="12" font-weight="700" fill="#6d28d9" text-anchor="middle">2. УСЛОВИЯ</text>
    <text x="227" y="90" font-family="system-ui, sans-serif" font-size="11" fill="#5b21b6" text-anchor="middle">Разделить n % 2</text>
    <text x="227" y="110" font-family="system-ui, sans-serif" font-size="11" fill="#5b21b6" text-anchor="middle">на четные и</text>
    <text x="227" y="130" font-family="system-ui, sans-serif" font-size="11" fill="#5b21b6" text-anchor="middle">нечетные ветки</text>

    <rect x="310" y="30" width="125" height="150" rx="10" fill="#fef3c7" stroke="#f59e0b" stroke-width="1.5"/>
    <text x="372" y="58" font-family="system-ui, sans-serif" font-size="12" font-weight="700" fill="#b45309" text-anchor="middle">3. ТРАССИРОВКА</text>
    <text x="372" y="90" font-family="system-ui, sans-serif" font-size="11" fill="#92400e" text-anchor="middle">Посчитать F(1),</text>
    <text x="372" y="110" font-family="system-ui, sans-serif" font-size="11" fill="#92400e" text-anchor="middle">F(2), F(3)...</text>
    <text x="372" y="130" font-family="system-ui, sans-serif" font-size="11" fill="#92400e" text-anchor="middle">последовательно</text>

    <rect x="455" y="30" width="125" height="150" rx="10" fill="#ecfdf5" stroke="#10b981" stroke-width="1.5"/>
    <text x="517" y="58" font-family="system-ui, sans-serif" font-size="12" font-weight="700" fill="#065f46" text-anchor="middle">4. IDLE ТЕСТ</text>
    <text x="517" y="90" font-family="system-ui, sans-serif" font-size="11" fill="#047857" text-anchor="middle">Запустить код</text>
    <text x="517" y="110" font-family="system-ui, sans-serif" font-size="11" fill="#047857" text-anchor="middle">и сверить ручной</text>
    <text x="517" y="130" font-family="system-ui, sans-serif" font-size="11" fill="#047857" text-anchor="middle">ответ с выводом</text>

    <text x="300" y="210" font-family="system-ui, sans-serif" font-size="13" font-weight="600" fill="#334155" text-anchor="middle">Алгоритм гарантирует 10 из 10 баллов на суммативном оценивании</text>
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
            code: 'def double(x):\n    result = x * 2\n    return result  # возвращаем вычисленный результат\n\na = double(5)      # в переменную a запишется число 10\nprint("Итог:", a)',
            trace: {
              title: 'Пошаговое выполнение double(5)',
              cmd: 'python функция_с_возвратом.py',
              steps: [
                { line: 5, phase: 'down', call: 'a = double(5)', desc: 'Вызываем функцию и передаём аргумент x = 5' },
                { line: 2, phase: 'down', call: 'result = 5 * 2', desc: 'Внутри тела функции вычисляем result = 10' },
                { line: 3, phase: 'base', call: 'return 10', desc: 'Возвращаем число 10 обратно в переменную a' },
                { line: 6, phase: 'out', call: 'print("Итог:", a)', desc: 'Выводим полученное значение в консоль', out: 'Итог: 10' }
              ]
            }
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
                badge: 'Задачка 1 · 1 балл',
                icon: 'fas fa-bullhorn',
                title: 'Эхо: echo(n)',
                text: 'Напиши функцию <code>echo(n)</code>, которая принимает число <code>n</code> и печатает фразу <code>"Ау!"</code> ровно <code>n</code> раз с помощью рекурсии.<br><br>' +
                      '<b>💡 Подсказка:</b><br>' +
                      'Стоп-кран — когда <code>n == 0</code> (сделать <code>return</code>). На шаге рекурсии печатай <code>print("Ау!")</code> и вызывай <code>echo(n - 1)</code>.',
                tone: 'violet'
              },
              {
                badge: 'Задачка 2 · 1 балл',
                icon: 'fas fa-calculator',
                title: 'Факториал: factorial(n)',
                text: 'Факториал числа <code>N</code> (обозначается <code>N!</code>) — это произведение всех чисел от 1 до <code>N</code> (например, <code>4! = 4 × 3 × 2 × 1 = 24</code>).<br><br>' +
                      '<b>💡 Подсказка:</b><br>' +
                      'Очень похоже на пример с суммой, только вместо знака <code>+</code> используй <code>*</code>, а стоп-кран при <code>n == 1</code> возвращает <code>1</code>.',
                tone: 'cyan'
              },
              {
                badge: 'Задачка 3 · 1 балл ★',
                icon: 'fas fa-star',
                title: 'Степень: power(base, exp)',
                text: 'Напиши функцию <code>power(base, exp)</code>, которая возводит число <code>base</code> в степень <code>exp</code> (например, <code>power(2, 3)</code> вернёт <code>8</code>: <code>2 × 2 × 2</code>).<br><br>' +
                      '<b>💡 Подсказка:</b><br>' +
                      'Любое число в степени <code>0</code> равно <code>1</code> (стоп-кран при <code>exp == 0</code>). Шаг: <code>base * power(base, exp - 1)</code>.',
                tone: 'amber'
              }
            ]
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
          { mark: '7 баллов', text: 'Конспект: полно и аккуратно записаны основные понятия урока — функция, рекурсия, база (условие остановки), рекурсивный шаг, а также разобран пример countdown.' },
          { mark: '1 балл', text: 'Задание 1 (Эхо): написана функция echo(n) со стоп-краном и рекурсивным вызовом.' },
          { mark: '1 балл', text: 'Задание 2 (Факториал): написана функция factorial(n), которая корректно возвращает результат.' },
          { mark: '1 балл', text: 'Задание 3 (Степень): написана функция power(base, exp) с базой exp == 0 и рекурсивным шагом.' }
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
        eyebrow: '10 ЕМН · 2 ЧЕТВЕРТЬ · УРОК 2',
        title: '<span class="accent-text">Рекурсия</span> · База и шаг',
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
          { q: 'Что такое рекурсия?', options: ['Повторение обычного цикла for', 'Вызов функцией самой себя', 'Случайная системная ошибка', 'Копирование блока кода в файл'], answer: 1, explain: 'Рекурсия — это процесс, когда функция вызывает саму себя для решения подзадачи.' },
          { q: 'Зачем в рекурсивной функции обязательно нужна база (условие выхода)?', options: ['Чтобы остановить вызовы и избежать переполнения стека', 'Чтобы ускорить работу процессора', 'Чтобы сохранить результат в файл', 'Чтобы напечатать ответ на экране'], answer: 0, explain: 'База (стоп-кран) прерывает бесконечную цепочку вызовов, когда задача дошла до простейшего случая.' },
          { q: 'Что произойдёт, если в рекурсивной функции не предусмотреть базу (условие остановки)?', options: ['Функция выполнится один раз и завершится', 'Программа автоматически оптимизирует код в цикл', 'Возникнет бесконечная рекурсия и ошибка RecursionError', 'Компьютер мгновенно перезагрузится'], answer: 2, explain: 'Стек вызовов будет бесконечно наполняться, пока не возникнет ошибка RecursionError: maximum recursion depth exceeded.' },
          { q: 'Какая задача по своей структуре естественно решается с помощью рекурсии?', options: ['Сложение двух простых чисел', 'Вывод одной строки текста', 'Присваивание переменной нового значения', 'Обход вложенных папок и файлов (дерева каталогов)'], answer: 3, explain: 'Папка может содержать внутри такие же папки — эта иерархическая структура естественно обходится рекурсией.' },
          { q: 'Для чего в теле функции Python используется ключевое слово return?', options: ['Для запуска выполнения функции заново', 'Для возврата результата в точку вызова и завершения функции', 'Для вывода текста в консоль вместо print()', 'Для объявления нового имени функции'], answer: 1, explain: 'Инструкция return не просто возвращает вычисленное значение, но и немедленно завершает работу функции.' }
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
        k: 'concept',
        eyebrow: '06 · ПРАКТИКА В PYTHON',
        title: 'Задачки для самостоятельной практики',
        lead: 'Попробуй написать код сам, не подглядывая в готовые решения. В каждой функции обязательно выдели базу (стоп-кран) и рекурсивный шаг.',
        blocks: [
          {
            t: 'cards',
            cols: 3,
            items: [
              {
                badge: 'Задачка 1 · 3 балла',
                icon: 'fas fa-calculator',
                title: 'Сумма цифр: digit_sum(n)',
                text: 'Напиши функцию <code>digit_sum(n)</code>, которая принимает целое неотрицательное число <code>n</code> и находит сумму его цифр (например, <code>digit_sum(345)</code> вернёт <code>12</code>, так как <code>3 + 4 + 5 = 12</code>).<br><br>' +
                      '<b>💡 Подсказка:</b><br>' +
                      'База: если <code>n &lt; 10</code> (осталась одна цифра), вернуть само <code>n</code>. Шаг рекурсии: последняя цифра плюс сумма оставшихся: <code>n % 10 + digit_sum(n // 10)</code>.',
                tone: 'violet'
              },
              {
                badge: 'Задачка 2 · 3 балла',
                icon: 'fas fa-arrows-rotate',
                title: 'Разворот: reverse_str(s)',
                text: 'Напиши функцию <code>reverse_str(s)</code>, которая переворачивает строку задом наперёд с помощью рекурсии (например, <code>reverse_str("код")</code> вернёт <code>"док"</code>, а <code>reverse_str("питон")</code> вернёт <code>"нотип"</code>).<br><br>' +
                      '<b>💡 Подсказка:</b><br>' +
                      'База: если длина строки <code>len(s) &lt;= 1</code>, вернуть саму строку <code>s</code>. Шаг: последний символ плюс разворот оставшейся части: <code>s[-1] + reverse_str(s[:-1])</code>.',
                tone: 'cyan'
              },
              {
                badge: 'Задачка 3 · 4 балла ★',
                icon: 'fas fa-star',
                title: 'Фибоначчи: fibonacci(n)',
                text: 'Числа Фибоначчи начинаются с 0 и 1, а каждое следующее число равно сумме двух предыдущих: <code>0, 1, 1, 2, 3, 5, 8, 13...</code> Напиши функцию <code>fibonacci(n)</code>, возвращающую <code>n</code>-е число (например, <code>fibonacci(6)</code> вернёт <code>8</code>).<br><br>' +
                      '<b>💡 Подсказка:</b><br>' +
                      'Двойная база: при <code>n == 0</code> вернуть <code>0</code>, при <code>n == 1</code> вернуть <code>1</code>. Шаг складывает два вызова: <code>fibonacci(n - 1) + fibonacci(n - 2)</code>.',
                tone: 'amber'
              }
            ]
          }
        ]
      },
      {
        k: 'quiz',
        eyebrow: '07 · МИНИ-ПРОВЕРКА',
        title: 'Проверим понимание базы и шага',
        lead: 'Выбери один правильный ответ в каждом вопросе.',
        questions: [
          { q: 'Что такое база рекурсии?', options: ['Первый запуск программы', 'Простейший случай с известным готовым ответом', 'Последняя строчка файла', 'Имя главной переменной'], answer: 1, explain: 'База — это условие остановки рекурсивных вызовов.' },
          { q: 'Что обязан делать каждый рекурсивный шаг?', options: ['Уменьшать задачу и приближать её к базе', 'Увеличивать значение аргумента n', 'Повторять вызов без изменения параметров', 'Очищать память компьютера'], answer: 0, explain: 'Если шаг не уменьшает задачу, база никогда не будет достигнута.' },
          { q: 'Что произойдёт, если запустить рекурсивную функцию без базы?', options: ['Код автоматически оптимизируется', 'Функция завершится без ошибок', 'Возникнет ошибка RecursionError из-за переполнения стека', 'Программа создаст цикл while'], answer: 2, explain: 'Стек вызовов будет расти до исчерпания лимита рекурсии в Python.' },
          { q: 'Чему равно значение факториала 4! (произведение 1·2·3·4)?', options: ['12', '16', '4', '24'], answer: 3, explain: '4! = 4 × 3 × 2 × 1 = 24.' },
          { q: 'Сколько вызовов сделает factorial(3), включая базовый вызов factorial(0)?', options: ['3 вызова', '4 вызова', '2 вызова', '1 вызов'], answer: 1, explain: 'Будут вызваны: factorial(3), factorial(2), factorial(1) и базовый factorial(0) — ровно 4 вызова.' }
        ]
      },
      {
        k: 'summary',
        eyebrow: '08 · ИТОГИ УРОКА',
        title: 'Главное и оценивание',
        lead: 'Максимум за практическую работу — 10 баллов.',
        points: [
          'Рекурсия всегда состоит из двух частей: базы и шага.',
          'База — простейший случай (стоп-кран), для которого ответ известен без вычислений.',
          'Рекурсивный шаг уменьшает задачу и обязательно приближает её к базе.',
          'Без базы возникает ошибка переполнения стека RecursionError.'
        ],
        criteriaTitle: 'Дескриптор практики · 10 баллов',
        criteria: [
          { mark: '1 балл', text: 'Задача 1 (Сумма цифр): выделена база if n < 10 с возвратом n.' },
          { mark: '1 балл', text: 'Задача 1 (Сумма цифр): рекурсивный шаг отделяет цифру через n % 10 и n // 10.' },
          { mark: '1 балл', text: 'Задача 1 (Сумма цифр): тестовый запуск digit_sum(345) возвращает 12.' },
          { mark: '1 балл', text: 'Задача 2 (Разворот строки): выделена база len(s) <= 1 с возвратом s.' },
          { mark: '1 балл', text: 'Задача 2 (Разворот строки): рекурсивный шаг уменьшает строку срезом.' },
          { mark: '1 балл', text: 'Задача 2 (Разворот строки): тестовый запуск reverse_str("код") возвращает "док".' },
          { mark: '1 балл', text: 'Задача 3 (Фибоначчи): функция принимает порядковый номер n.' },
          { mark: '1 балл', text: 'Задача 3 (Фибоначчи): правильно оформлена база для n == 0 и n == 1.' },
          { mark: '1 балл', text: 'Задача 3 (Фибоначчи): рекурсивный шаг выполняет fibonacci(n - 1) + fibonacci(n - 2).' },
          { mark: '1 балл', text: 'Задача 3 (Фибоначчи): тестовый запуск fibonacci(6) возвращает 8.' }
        ],
        ticketTitle: 'Выходной билет',
        ticketLead: 'Ответь устно или в тетради:',
        ticket: [
          'Что произойдёт, если в рекурсивной функции забыть базовый случай?',
          'Почему для функции Фибоначчи нужны сразу два базовых условия (0 и 1)?',
          'Какую из трёх практических задач тебе удалось решить самостоятельно?'
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
        eyebrow: '10 ЕМН · 2 ЧЕТВЕРТЬ · УРОК 3',
        title: '<span class="accent-text">Рекурсия</span> · Стек вызовов',
        lead: 'Как Python помнит, куда вернуться после каждого шага? Знакомимся с устройством стека вызовов (Call Stack), принципом LIFO и причиной RecursionError.',
        goal: 'Понять принцип работы стека вызовов LIFO, научиться анализировать прямой и обратный ход и управлять глубиной рекурсии.',
        goalCode: '10.2.1.1',
        chips: [
          { icon: 'fas fa-layer-group', text: 'Принцип LIFO' },
          { icon: 'fas fa-microchip', text: 'Кадры стека' },
          { icon: 'fas fa-triangle-exclamation', text: 'Лимит вызовов' }
        ],
        visual: 'recursionStack',
        visualCaption: 'Каждый вызов кладется на вершину стека и ждет завершения',
        cta: 'Исследовать стек'
      },
      {
        k: 'review',
        questions: [
          { q: 'Из каких двух обязательных частей состоит любая рекурсивная функция?', options: ['Цикл for и список', 'База (условие остановки) и рекурсивный шаг', 'Ввод input() и вывод print()', 'Глобальные и локальные переменные'], answer: 1, explain: 'Без базы рекурсия зациклится, а без шага не приблизится к остановке.' },
          { q: 'Что такое база рекурсии?', options: ['Простейший случай, для которого ответ известен сразу', 'Место сохранения файла на диске', 'Первая строчка вызова функции', 'Общий объем оперативной памяти'], answer: 0, explain: 'База — это граничный случай, не требующий дальнейших рекурсивных вызовов.' },
          { q: 'В какую сторону обязан двигаться аргумент на каждом рекурсивном шаге?', options: ['В сторону бесконечности', 'В сторону базового значения', 'Оставаться неизменным', 'Всегда становиться отрицательным'], answer: 1, explain: 'Каждый шаг обязан приближать параметры вызова к базе.' },
          { q: 'Что произойдет, если в функции написать return f(n + 1) при базе n <= 0 для положительного n?', options: ['Код выполнится мгновенно', 'Функция никогда не дойдет до базы и возникнет RecursionError', 'Программа посчитает корень из числа', 'Стек вызовов очистится'], answer: 1, explain: 'Аргумент удаляется от нуля, поэтому стоп-кран никогда не сработает.' },
          { q: 'Чему равен факториал 0! в математике и программировании?', options: ['0', '1', '-1', 'Не существует'], answer: 1, explain: 'По определению 0! = 1, и это базовый случай факториала.' }
        ]
      },
      {
        k: 'concept',
        eyebrow: '03 · ПРИНЦИП LIFO',
        title: 'Что такое стек вызовов (Call Stack)?',
        lead: 'Стек похож на стопку тарелок: положить новую тарелку можно только наверх, и снять можно только верхнюю. Это принцип <b>LIFO</b> (<i>Last In, First Out</i> — последним пришел, первым ушел).',
        blocks: [
          { t: 'svg', svg: STACK_ANIM_SVG, caption: 'Накопление фреймов в стеке и возврат значений' },
          {
            t: 'cards',
            cols: 2,
            items: [
              {
                badge: 'Фаза 1 · Погружение',
                icon: 'fas fa-arrow-down-short-wide',
                title: 'Прямой ход (Push)',
                text: 'При каждом вызове в памяти выделяется новый <b>кадр стека (stack frame)</b>. В нем хранятся аргументы и локальные переменные. Предыдущая функция «замирает» и ждет ответа.',
                tone: 'violet'
              },
              {
                badge: 'Фаза 2 · Всплытие',
                icon: 'fas fa-arrow-up',
                title: 'Обратный ход (Pop)',
                text: 'Когда база вернула значение, функции начинают завершаться в обратном порядке: снизу вверх. Кадр удаляется из памяти, а результат передается наверх.',
                tone: 'green'
              }
            ]
          }
        ]
      },
      {
        k: 'concept',
        eyebrow: '04 · ПРЯМОЙ И ОБРАТНЫЙ ХОД',
        title: 'Где писать команды: до вызова или после?',
        lead: 'Команды до рекурсивного вызова выполняются «на пути вниз» (прямой порядок), а команды после вызова — «на пути вверх» (обратный порядок).',
        blocks: [
          {
            t: 'code',
            title: 'прямой_и_обратный_ход.py',
            code: 'def trace(n):\n    if n == 0:\n        print("--- База достигнута! ---")\n        return\n\n    print("Вход в стек:", n)   # До вызова: 3, 2, 1\n    trace(n - 1)                # Рекурсивный спуск\n    print("Выход из стека:", n)  # После вызова: 1, 2, 3!\n\ntrace(3)',
            trace: {
              title: 'Пошаговое выполнение trace(3)',
              cmd: 'trace(3)',
              steps: [
                { line: 6, phase: 'down', call: 'trace(3)', desc: 'Прямой ход (n = 3) → печатаем и зовём trace(2)', out: 'Вход в стек: 3' },
                { line: 6, phase: 'down', call: 'trace(2)', desc: 'Прямой ход (n = 2) → печатаем и зовём trace(1)', out: 'Вход в стек: 2' },
                { line: 6, phase: 'down', call: 'trace(1)', desc: 'Прямой ход (n = 1) → печатаем и зовём trace(0)', out: 'Вход в стек: 1' },
                { line: 3, phase: 'base', call: 'trace(0)', desc: 'n == 0 → сработала база! Начинаем возврат LIFO', out: '--- База достигнута! ---' },
                { line: 8, phase: 'up', call: 'возврат в trace(1)', desc: 'Обратный ход (n = 1) → строка после вызова', out: 'Выход из стека: 1' },
                { line: 8, phase: 'up', call: 'возврат в trace(2)', desc: 'Обратный ход (n = 2) → строка после вызова', out: 'Выход из стека: 2' },
                { line: 8, phase: 'up', call: 'возврат в trace(3)', desc: 'Обратный ход (n = 3) → стек полностью пуст!', out: 'Выход из стека: 3' }
              ]
            }
          },
          {
            t: 'callout',
            tone: 'good',
            icon: 'fas fa-lightbulb',
            title: 'Почему обратный порядок выводит 1, 2, 3?',
            text: 'Потому что вызов <code>trace(1)</code> завершится раньше, чем <code>trace(2)</code>, а <code>trace(3)</code> завершится самым последним! В этом и заключается суть LIFO.'
          }
        ]
      },
      {
        k: 'concept',
        eyebrow: '05 · ЛИМИТ ГЛУБИНЫ',
        title: 'Модуль sys и переполнение стека',
        lead: 'Оперативная память не бесконечна. Чтобы защитить компьютер от зависания, Python по умолчанию ограничивает глубину рекурсии числом 1000 вызовов.',
        blocks: [
          {
            t: 'cards',
            cols: 2,
            items: [
              {
                badge: 'Проверка лимита',
                icon: 'fas fa-shield-halved',
                title: 'sys.getrecursionlimit()',
                text: 'Функция возвращает текущий системный лимит глубины вызовов (в стандартном Python он равен 1000).',
                codeTitle: 'проверка_лимита.py',
                code: 'import sys\nprint(sys.getrecursionlimit())  # 1000',
                tone: 'cyan'
              },
              {
                badge: 'Изменение лимита',
                icon: 'fas fa-sliders',
                title: 'sys.setrecursionlimit()',
                text: 'Позволяет увеличить допустимый предел, например до 2000 или 5000, если задача требует глубокого погружения.',
                codeTitle: 'смена_лимита.py',
                code: 'import sys\nsys.setrecursionlimit(2000)\nprint("Новый лимит:", sys.getrecursionlimit())',
                tone: 'amber'
              }
            ]
          }
        ]
      },
      {
        k: 'concept',
        eyebrow: '06 · ПРАКТИКА В PYTHON IDLE',
        title: 'Три задачи для практики',
        lead: 'Напиши и протестируй программы в среде IDLE. Каждая задача оценивается отдельно (3 + 3 + 4 = 10 баллов).',
        blocks: [
          {
            t: 'cards',
            cols: 3,
            items: [
              {
                badge: 'Задачка 1 · 3 балла',
                icon: 'fas fa-arrows-up-down',
                title: 'Зеркало: mirror_count(n)',
                text: 'Напиши функцию <code>mirror_count(n)</code>, которая принимает число <code>n</code> и выводит числа от <code>n</code> до 1 (при погружении), а затем от 1 до <code>n</code> (при выходе из стека).<br><br>' +
                      '<b>💡 Подсказка:</b><br>' +
                      'Один <code>print(n)</code> сделай <b>до</b> рекурсивного вызова, а второй <code>print(n)</code> — <b>после</b> него. База: <code>n == 0</code>.',
                tone: 'violet'
              },
              {
                badge: 'Задачка 2 · 3 балла',
                icon: 'fas fa-chart-line',
                title: 'Глубина: depth_tracker(n, d=1)',
                text: 'Напиши функцию <code>depth_tracker(n, d=1)</code>, которая печатает текущую глубину рекурсии <code>d</code> и значение <code>n</code> при спуске до базы <code>n == 1</code>.<br><br>' +
                      '<b>💡 Подсказка:</b><br>' +
                      'Печатай <code>"Глубина d, n = n"</code>. На шаге рекурсии передавай <code>n - 1</code> и увеличивай глубину: <code>d + 1</code>.',
                tone: 'cyan'
              },
              {
                badge: 'Задачка 3 · 4 балла ★',
                icon: 'fas fa-star',
                title: 'Безопасность: safe_factorial(n, max_d=20)',
                text: 'Напиши функцию <code>safe_factorial(n, max_d=20)</code>, которая вычисляет факториал, но если глубина <code>n &gt; max_d</code>, не падает, а печатает предупреждение о превышении лимита и возвращает <code>None</code>.<br><br>' +
                      '<b>💡 Подсказка:</b><br>' +
                      'В самом начале проверь: если <code>n &gt; max_d</code>, выведи сообщение и сделай <code>return None</code>. Если порог в норме, выполни расчет факториала.',
                tone: 'amber'
              }
            ]
          }
        ]
      },
      {
        k: 'quiz',
        eyebrow: '07 · МИНИ-ПРОВЕРКА',
        title: 'Проверим знания стека вызовов',
        lead: 'Выбери один правильный ответ в каждом вопросе.',
        questions: [
          { q: 'Что означает принцип LIFO?', options: ['Первым пришел — первым ушел', 'Последним пришел — первым ушел', 'Данные стираются случайным образом', 'Функции выполняются параллельно'], answer: 1, explain: 'LIFO (Last In, First Out): последний добавленный в стек кадр завершается первым.' },
          { q: 'Что такое фрейм (кадр) стека?', options: ['Участок памяти с аргументами и переменными одного вызова', 'Размер окна графической программы', 'Количество строк в файле Python', 'Скорость работы процессора'], answer: 0, explain: 'Кадр стека создается при каждом вызове функции и хранит ее локальный контекст.' },
          { q: 'Когда выполнится строчка print(n), если она написана ПОСЛЕ рекурсивного вызова?', options: ['До первого рекурсивного вызова', 'На обратном ходе рекурсии при выходе из стека', 'Она никогда не выполнится', 'Только в момент старта Python'], answer: 1, explain: 'Команды после рекурсивного вызова ждут возврата и выполняются на обратном ходе.' },
          { q: 'Какой системный лимит глубины рекурсии установлен в Python по умолчанию?', options: ['10 вызовов', '100 вызовов', '1000 вызовов', 'Бесконечность'], answer: 2, explain: 'Стандартный лимит sys.getrecursionlimit() составляет 1000 фреймов.' },
          { q: 'Какая ошибка возникает при превышении максимальной глубины стека?', options: ['ZeroDivisionError', 'RecursionError', 'IndexError', 'SyntaxError'], answer: 1, explain: 'Python защищает память и выбрасывает ошибку RecursionError: maximum recursion depth exceeded.' }
        ]
      },
      {
        k: 'summary',
        eyebrow: '08 · ИТОГИ УРОКА',
        title: 'Главное и оценивание',
        lead: 'Максимум за практическую работу — 10 баллов.',
        points: [
          'Стек вызовов работает по принципу LIFO: последняя вызванная функция завершается первой.',
          'Код до рекурсивного шага выполняется на прямом ходе, после шага — на обратном.',
          'Каждый вызов занимает кадр памяти, хранящий локальные переменные.',
          'Модуль sys позволяет отслеживать и настраивать лимит рекурсии (по умолчанию 1000).'
        ],
        criteriaTitle: 'Дескриптор практики · 10 баллов',
        criteria: [
          { mark: '1 балл', text: 'Задание 1: Задано базовое условие остановки зеркального вывода.' },
          { mark: '1 балл', text: 'Задание 1: Разделен вывод данных на прямом и обратном ходе стека.' },
          { mark: '1 балл', text: 'Задание 1: Программа протестирована в IDLE и демонстрирует принцип LIFO.' },
          { mark: '1 балл', text: 'Задание 2: Организован счетчик глубины рекурсии через параметры функции.' },
          { mark: '1 балл', text: 'Задание 2: На каждом шаге рекурсивного погружения глубина увеличивается.' },
          { mark: '1 балл', text: 'Задание 2: Программа корректно выводит историю погружения до базового случая.' },
          { mark: '1 балл', text: 'Задание 3: Реализована предварительная проверка глубины перед рекурсией.' },
          { mark: '1 балл', text: 'Задание 3: Предусмотрен вывод информативного сообщения о лимите стека.' },
          { mark: '1 балл', text: 'Задание 3: В безопасном режиме функция возвращает вычисленный факториал.' },
          { mark: '1 балл', text: 'Задание 3: Код проверен на штатных значениях и при превышении лимита.' }
        ],
        ticketTitle: 'Выходной билет',
        ticketLead: 'Ответь устно или в тетради:',
        ticket: [
          'В каком порядке завершаются вложенные функции согласно принципу LIFO?',
          'Чем отличается выполнение команд до рекурсивного вызова и после него?',
          'Почему Python ограничивает максимальную глубину рекурсии?'
        ]
      }
    ]
  });

  /* ==========================================================================
     УРОК 4. Факториал и степени
     ========================================================================== */
  Q2.add('10emn-q2-4', {
    num: 4,
    cls: '10 ЕМН',
    title: 'Рекурсия',
    slides: [
      {
        k: 'hero',
        eyebrow: '10 ЕМН · 2 ЧЕТВЕРТЬ · УРОК 4',
        title: '<span class="accent-text">Рекурсия</span> · Факториал и степени',
        lead: 'Математическая индукция на практике: как выразить факториал N!, быстрое возведение в степень aⁿ и ветвящееся дерево чисел Фибоначчи.',
        goal: 'Освоить классические математические рекуррентные алгоритмы, понять структуру дерева рекурсии и ветвление вызовов.',
        goalCode: '10.2.1.1',
        chips: [
          { icon: 'fas fa-calculator', text: 'Факториал n!' },
          { icon: 'fas fa-superscript', text: 'Степень aⁿ' },
          { icon: 'fas fa-sitemap', text: 'Дерево Фибоначчи' }
        ],
        visual: 'recursionTree',
        visualCaption: 'Каждый вызов делится на два новых: дерево Фибоначчи',
        cta: 'Перейти к вычислениям'
      },
      {
        k: 'review',
        questions: [
          { q: 'По какому принципу работает стек вызовов (Call Stack)?', options: ['FIFO (первым пришел — первым ушел)', 'LIFO (последним пришел — первым ушел)', 'Случайный выбор очередности', 'По алфавиту имен функций'], answer: 1, explain: 'Стек вызовов работает строго по принципу LIFO (Last In, First Out).' },
          { q: 'Что такое фрейм стека в оперативной памяти?', options: ['Файл с исходным кодом', 'Блок памяти для аргументов и переменных одного вызова', 'Разрешение экрана монитора', 'Кэш веб-браузера'], answer: 1, explain: 'Фрейм хранит параметры и контекст конкретного активного вызова функции.' },
          { q: 'Какая функция модуля sys позволяет узнать системный лимит глубины рекурсии?', options: ['sys.getdepth()', 'sys.getrecursionlimit()', 'sys.check_memory()', 'sys.max_calls()'], answer: 1, explain: 'sys.getrecursionlimit() возвращает текущее ограничение глубины вызовов (по умолчанию 1000).' },
          { q: 'Когда выполняются инструкции, написанные ПОСЛЕ строки рекурсивного вызова?', options: ['До первого рекурсивного вызова', 'На обратном ходе при возврате из стека', 'Они пропускаются интерпретатором', 'В момент компиляции файла'], answer: 1, explain: 'Строки после вызова ждут завершения дочерней функции и выполняются на обратном ходе.' },
          { q: 'Что произойдет, если рекурсивная глубина превысит установленный лимит?', options: ['Компьютер перезагрузится', 'Программа выбросит RecursionError', 'Код оптимизируется в цикл', 'Значения обнулятся'], answer: 1, explain: 'Python генерирует RecursionError: maximum recursion depth exceeded.' }
        ]
      },
      {
        k: 'concept',
        eyebrow: '03 · МАТЕМАТИЧЕСКАЯ ИНДУКЦИЯ',
        title: 'Как выводить каждый этап вычислений в рекурсии',
        lead: 'Часто нужно получить не только финальное число, но и вывести на экран всю цепочку промежуточных шагов (например, для факториала <code>n! = n × (n - 1)!</code> или степеней <code>aⁿ = a × aⁿ⁻¹</code> до <code>a⁰ = 1</code>). Разберем этот прием на аналогичных примерах.',
        blocks: [
          {
            t: 'cards',
            cols: 2,
            items: [
              {
                badge: 'Прием 1 · Вывод этапов на обратном ходе',
                icon: 'fas fa-calculator',
                title: 'Сохранение промежуточного шага',
                text: 'Чтобы напечатать каждый этап накопления (как в факториале <code>1! → 2! → ... → n!</code>), сначала сохрани результат вызова <code>prev</code> в переменную, вычисли новое значение, выведи его через <code>print()</code> и только затем сделай <code>return</code>.',
                codeTitle: 'этапы_суммы.py (аналог для 1-й задачи)',
                code: 'def sum_stages(n):\n    if n <= 1:\n        print("Этап 1: сумма = 1")\n        return 1\n    prev = sum_stages(n - 1)   # ждем предыдущий этап\n    curr = prev + n            # вычисляем текущий этап\n    print(f"Этап {n}: сумма = {curr}")\n    return curr\n\nsum_stages(4)',
                tone: 'violet'
              },
              {
                badge: 'Прием 2 · Таблица значений до 0',
                icon: 'fas fa-superscript',
                title: 'Пошаговый спуск показателя до нуля',
                text: 'Когда нужно вывести выражение для всех показателей от <code>n</code> вниз до <code>0</code> (как для степеней <code>aⁿ ... a⁰</code>), рекурсивный шаг уменьшает показатель <code>k - 1</code> вплоть до базового случая <code>k == 0</code>.',
                codeTitle: 'шкала_до_нуля.py (аналог для 2-й задачи)',
                code: 'def mult_table(x, k):\n    if k == 0:\n        print(f"{x} * 0 = 0")  # база на нуле\n        return\n    print(f"{x} * {k} = {x * k}")\n    mult_table(x, k - 1)       # шаг к нулю\n\nmult_table(5, 3)',
                tone: 'cyan'
              }
            ]
          }
        ]
      },
      {
        k: 'concept',
        eyebrow: '04 · ДЕРЕВО ВЕТВЛЕНИЯ',
        title: 'Ветвящаяся рекурсия и обход дерева вызовов',
        lead: 'Когда функция внутри себя вызывает саму себя <b>дважды</b> (обращаясь к <code>n - 1</code> и <code>n - 2</code>), возникает ветвящееся двоичное дерево вызовов.',
        blocks: [
          {
            t: 'code',
            title: 'маршруты_ступенек.py',
            code: 'def ways(n):\n    if n <= 1:\n        return 1               # База: 1 способ стоять на месте\n    step1 = ways(n - 1)        # Ветвь 1: шаг на 1 ступеньку\n    step2 = ways(n - 2)        # Ветвь 2: прыжок через ступеньку\n    total = step1 + step2\n    print(f"Ступенька {n}: способов = {total}")\n    return total\n\nways(3)',
            trace: {
              title: 'Пошаговое выполнение ways(3)',
              cmd: 'ways(3)',
              steps: [
                { line: 4, phase: 'down', call: 'ways(3) → ways(2) + ways(1)', desc: 'Делим задачу на две ветви: n = 2 и n = 1' },
                { line: 4, phase: 'down', call: 'ways(2) → ways(1) + ways(0)', desc: 'Левая ветвь спускается к базовым случаям' },
                { line: 3, phase: 'base', call: 'ways(1) = 1, ways(0) = 1', desc: 'Обе базы возвращают по 1' },
                { line: 7, phase: 'up', call: 'Ступенька 2: способов = 2', desc: 'В узле ways(2) складываем 1 + 1 = 2', out: 'Ступенька 2: способов = 2' },
                { line: 7, phase: 'out', call: 'Ступенька 3: способов = 3', desc: 'В корне ways(3) складываем 2 + 1 = 3', out: 'Ступенька 3: способов = 3' }
              ]
            }
          },
          { t: 'svg', svg: FIB_TREE_SVG, caption: 'Дерево рекурсивных вызовов для двукратного ветвления' },
          {
            t: 'callout',
            tone: 'warn',
            icon: 'fas fa-sitemap',
            title: 'Экспоненциальная сложность O(2ⁿ)',
            text: 'Обрати внимание на схему: одни и те же младшие значения вычисляются по нескольку раз в разных ветвях дерева!'
          }
        ]
      },
      {
        k: 'concept',
        eyebrow: '05 · ДВОЙНАЯ БАЗА',
        title: 'Двойная база и вывод всей последовательности до N',
        lead: 'Если формула складывает два предыдущих члена ряда (<code>n - 1</code> и <code>n - 2</code>), ей нужны <b>две базы</b> (для индекса 0 и индекса 1). Посмотрим на примере ряда Люка, как вывести все числа ряда от 0 до N:',
        blocks: [
          {
            t: 'code',
            title: 'ряд_люка_до_n.py',
            code: 'def lucas(k):\n    # Две базы: в ряду Люка L(0) = 2 и L(1) = 1\n    if k == 0:\n        return 2\n    if k == 1:\n        return 1\n    return lucas(k - 1) + lucas(k - 2)\n\ndef show_lucas(n):\n    if n > 0:\n        show_lucas(n - 1)      # сначала печатаем числа от 0 до n-1\n    print(f"L({n}) = {lucas(n)}")\n\nshow_lucas(4)',
            trace: {
              title: 'Вывод всех чисел ряда от 0 до 4',
              cmd: 'show_lucas(4)',
              steps: [
                { line: 12, phase: 'base', call: 'n = 0 → lucas(0)', desc: 'Первая база: индекс 0', out: 'L(0) = 2' },
                { line: 12, phase: 'base', call: 'n = 1 → lucas(1)', desc: 'Вторая база: индекс 1', out: 'L(1) = 1' },
                { line: 12, phase: 'up', call: 'n = 2 → 1 + 2 = 3', desc: 'Сумма двух предыдущих членов', out: 'L(2) = 3' },
                { line: 12, phase: 'up', call: 'n = 3 → 3 + 1 = 4', desc: 'Сумма L(2) + L(1)', out: 'L(3) = 4' },
                { line: 12, phase: 'out', call: 'n = 4 → 4 + 3 = 7', desc: 'Вся последовательность до N выведена!', out: 'L(4) = 7' }
              ]
            }
          },
          {
            t: 'table',
            caption: 'Справочник: как устроен ряд Фибоначчи (для задачи 3)',
            head: ['n (индекс)', '0 (база 1)', '1 (база 2)', '2', '3', '4', '5', '6'],
            rows: [
              ['Числа Фибоначчи F(n)', '0', '1', '1', '2', '3', '5', '8']
            ],
            highlight: 6
          }
        ]
      },
      {
        k: 'concept',
        eyebrow: '06 · ПРАКТИКА В PYTHON IDLE',
        title: 'Три задачи для практики',
        lead: 'Напиши и протестируй программы в среде IDLE. В каждой задаче программа должна выводить пошаговый процесс или весь ряд значений (3 + 3 + 4 = 10 баллов).',
        blocks: [
          {
            t: 'cards',
            cols: 3,
            items: [
              {
                badge: 'Задачка 1 · 3 балла',
                icon: 'fas fa-calculator',
                title: 'Этапы факториала: fact_steps(n)',
                text: 'Напиши рекурсивную функцию <code>fact_steps(n)</code>, которая не просто возвращает <code>n!</code>, а <b>печатает каждый этап вычисления</b> от <code>1!</code> до <code>n!</code> (например, для <code>n = 4</code> выведет построчно: <code>1! = 1</code>, <code>2! = 2</code>, <code>3! = 6</code>, <code>4! = 24</code>).<br><br>' +
                      '<b>💡 Подсказка:</b><br>' +
                      'В базе (<code>n &lt;= 1</code>) выведи <code>1! = 1</code> и верни <code>1</code>. На шаге сначала получи <code>prev = fact_steps(n - 1)</code>, умножь на <code>n</code>, напечатай текущий этап и верни результат.',
                tone: 'violet'
              },
              {
                badge: 'Задачка 2 · 3 балла',
                icon: 'fas fa-superscript',
                title: 'Все степени до 0: power_all(a, n)',
                text: 'Напиши рекурсивную функцию <code>power_all(a, n)</code>, которая для числа <code>a</code> и степени <code>n</code> <b>выводит все степени числа от <code>n</code> до <code>0</code></b> (или от <code>0</code> до <code>n</code>) вместе с ответами (например, для <code>a = 2, n = 3</code>: <code>2^3 = 8</code>, <code>2^2 = 4</code>, <code>2^1 = 2</code>, <code>2^0 = 1</code>).<br><br>' +
                      '<b>💡 Подсказка:</b><br>' +
                      'Базовый случай — нулевая степень (<code>n == 0</code>), где любое число равно <code>1</code>. На каждом шаге выводи текущую степень и вызывай функцию для <code>n - 1</code>.',
                tone: 'cyan'
              },
              {
                badge: 'Задачка 3 · 4 балла ★',
                icon: 'fas fa-star',
                title: 'Весь ряд Фибоначчи: fib_series(n)',
                text: 'Напиши рекурсивную программу, которая <b>выводит все числа Фибоначчи от 0-го до <code>n</code>-го включительно</b> (например, при <code>n = 6</code> на экране должны появиться все числа ряда: <code>0, 1, 1, 2, 3, 5, 8</code>).<br><br>' +
                      '<b>💡 Подсказка:</b><br>' +
                      'В отличие от ряда Люка со слайда 5, в Фибоначчи базы равны <code>0</code> (при <code>k == 0</code>) и <code>1</code> (при <code>k == 1</code>). Вызови расчёт для всех индексов от <code>0</code> до <code>n</code>.',
                tone: 'amber'
              }
            ]
          }
        ]
      },
      {
        k: 'quiz',
        eyebrow: '07 · МИНИ-ПРОВЕРКА',
        title: 'Проверим знания формул рекурсии',
        lead: 'Выбери один правильный ответ в каждом вопросе.',
        questions: [
          { q: 'Чему равно значение factorial(4)?', options: ['12', '16', '24', '48'], answer: 2, explain: '4! = 4 × 3 × 2 × 1 = 24.' },
          { q: 'Какое базовое условие используется при рекурсивном возведении в степень aⁿ до нулевого показателя?', options: ['n == 1: return a', 'n == 0: return 1', 'a == 0: return 0', 'n < 0: return -1'], answer: 1, explain: 'a⁰ = 1 — классическое базовое условие для нулевой степени.' },
          { q: 'Почему для вычисления чисел Фибоначчи необходимы две базы?', options: ['Потому что функция вызывается в двух файлах', 'Потому что рекурсивный шаг обращается к двум предыдущим членам (n-1 и n-2)', 'Чтобы занять больше оперативной памяти', 'Это требование операционной системы'], answer: 1, explain: 'Для вычисления n-го числа нужны два предшественника, поэтому начальные F(0) и F(1) должны быть заданы явно.' },
          { q: 'Где нужно разместить print() в рекурсивной функции, чтобы этапы выводились по возрастанию от 1! до n!?', options: ['После рекурсивного вызова (на обратном ходе стека)', 'В самом начале файла до def', 'После оператора return', 'Внутри комментария'], answer: 0, explain: 'На обратном ходе стека функции завершаются от базы 1! вверх до n!.' },
          { q: 'Какие числа будут выведены при печати всего ряда Фибоначчи от 0 до 5?', options: ['0, 1, 1, 2, 3, 5', '1, 2, 4, 8, 16', '2, 1, 3, 4, 7', '0, 2, 4, 6, 8'], answer: 0, explain: 'F(0)=0, F(1)=1, F(2)=1, F(3)=2, F(4)=3, F(5)=5.' }
        ]
      },
      {
        k: 'summary',
        eyebrow: '08 · ИТОГИ УРОКА',
        title: 'Главное и оценивание',
        lead: 'Максимум за практическую работу — 10 баллов.',
        points: [
          'Сохранение результата рекурсивного вызова в переменную позволяет печатать каждый этап вычислений.',
          'При спуске показателя от n до 0 базовым случаем выступает нулевая степень a⁰ = 1.',
          'Функция Фибоначчи имеет двойную базу (0 и 1) и позволяет вывести весь ряд чисел от 0 до n.',
          'Вывод после рекурсивного вызова печатает этапы по возрастанию (от базы к n).'
        ],
        criteriaTitle: 'Дескриптор практики · 10 баллов',
        criteria: [
          { mark: '1 балл', text: 'Задание 1: Задан базовый случай факториала с выводом первого этапа.' },
          { mark: '1 балл', text: 'Задание 1: На каждом шаге вычисляется и выводится текущее значение k!.' },
          { mark: '1 балл', text: 'Задание 1: Программа выводит всю цепочку этапов от 1! до n! в IDLE.' },
          { mark: '1 балл', text: 'Задание 2: Реализована база нулевой степени (показатель равен 0).' },
          { mark: '1 балл', text: 'Задание 2: Оформлен рекурсивный переход с выводом каждой степени числа.' },
          { mark: '1 балл', text: 'Задание 2: Программа корректно выводит все степени числа вплоть до нулевой.' },
          { mark: '1 балл', text: 'Задание 3: Заданы оба базовых условия ряда Фибоначчи (для 0 и 1).' },
          { mark: '1 балл', text: 'Задание 3: Описан рекурсивный шаг суммы двух предыдущих членов.' },
          { mark: '1 балл', text: 'Задание 3: Реализован вывод всех чисел Фибоначчи от 0-го до n-го.' },
          { mark: '1 балл', text: 'Задание 3: Программа протестирована в IDLE и выводит верную последовательность.' }
        ],
        ticketTitle: 'Выходной билет',
        ticketLead: 'Ответь устно или в тетради:',
        ticket: [
          'Как рекурсивное определение степени aⁿ связано с базовым случаем a⁰ = 1?',
          'Почему дерево вызовов Фибоначчи растет так быстро?',
          'Какая задача из трех вызвала наибольший интерес?'
        ]
      }
    ]
  });

  /* ==========================================================================
     УРОК 5. Разбор чисел
     ========================================================================== */
  Q2.add('10emn-q2-5', {
    num: 5,
    cls: '10 ЕМН',
    title: 'Рекурсия',
    slides: [
      {
        k: 'hero',
        eyebrow: '10 ЕМН · 2 ЧЕТВЕРТЬ · УРОК 5',
        title: '<span class="accent-text">Рекурсия</span> · Разбор чисел',
        lead: 'Фундаментальный алгоритмический прием: как разобрать число на разряды без циклов и строк, используя операции % 10 и // 10.',
        goal: 'Освоить декомпозицию целых чисел в рекурсии, научиться вычислять сумму цифр и переводить числа в двоичную систему счисления.',
        goalCode: '10.2.1.1',
        chips: [
          { icon: 'fas fa-divide', text: 'Срез n // 10' },
          { icon: 'fas fa-percent', text: 'Остаток n % 10' },
          { icon: 'fas fa-code', text: 'Двоичный перевод' }
        ],
        visual: 'recursionDigits',
        visualCaption: 'Отщепляем последнюю цифру и отправляем остаток на следующий шаг',
        cta: 'Изучить метод'
      },
      {
        k: 'review',
        questions: [
          { q: 'Чему равно значение 17 % 10 в языке Python?', options: ['1', '7', '1.7', '0'], answer: 1, explain: 'Оператор % вычисляет остаток от деления: 17 % 10 = 7 (последняя цифра).' },
          { q: 'Чему равен результат операции целочисленного деления 482 // 10?', options: ['48', '48.2', '2', '4'], answer: 0, explain: 'Оператор // отбрасывает дробную часть: 482 // 10 = 48 (число без последней цифры).' },
          { q: 'Какое условие является естественной базой при разборе положительного числа по одной цифре?', options: ['n < 10 (осталась одна цифра)', 'n > 100', 'n == 0', 'n % 2 == 0'], answer: 0, explain: 'Когда число n < 10, в нем осталась всего одна цифра, для которой ответ очевиден.' },
          { q: 'Сколько членов ряда Фибоначчи складываются на каждом шаге?', options: ['Один', 'Два (n-1 и n-2)', 'Три', 'Все предыдущие'], answer: 1, explain: 'Ряд Фибоначчи определяется как сумма двух предыдущих членов.' },
          { q: 'Чему равен факториал 1!?', options: ['0', '1', '2', '-1'], answer: 1, explain: '1! = 1.' }
        ]
      },
      {
        k: 'concept',
        eyebrow: '03 · ПРИЕМ ДЕКОМПОЗИЦИИ',
        title: 'Как рекурсия видит число?',
        lead: 'Любое десятичное число можно разделить на две части: <b>последнюю цифру</b> (<code>n % 10</code>) и <b>все остальные разряды</b> (<code>n // 10</code>).',
        blocks: [
          { t: 'svg', svg: DIGIT_PARSE_SVG, caption: 'Схема отщепления цифр числа 482' },
          {
            t: 'table',
            caption: 'Шаги рекурсивного разбора числа 482',
            head: ['Вызов', 'Последняя цифра (n % 10)', 'Остаток числа (n // 10)', 'Действие'],
            rows: [
              ['digit_sum(482)', '2', '48', '2 + digit_sum(48)'],
              ['digit_sum(48)', '8', '4', '8 + digit_sum(4)'],
              ['digit_sum(4)', '4 (база n < 10)', '—', 'Возврат 4']
            ],
            highlight: 2
          }
        ]
      },
      {
        k: 'concept',
        eyebrow: '04 · РАЗБОР КОДА',
        title: 'Сумма цифр числа в 4 строчки',
        lead: 'Посмотри, насколько лаконичным получается рекурсивный код по сравнению с громоздкими циклами.',
        blocks: [
          {
            t: 'code',
            title: 'сумма_цифр.py',
            code: 'def digit_sum(n):\n    # База: если число однозначное, сумма равна самой цифре\n    if n < 10:\n        return n\n\n    # Шаг: последняя цифра + сумма цифр оставшейся части\n    return (n % 10) + digit_sum(n // 10)\n\nprint("Сумма цифр 482:", digit_sum(482))  # 14',
            trace: {
              title: 'Пошаговое выполнение digit_sum(482)',
              cmd: 'digit_sum(482)',
              steps: [
                { line: 7, phase: 'down', call: 'digit_sum(482)', desc: '482 % 10 = 2 (последняя цифра), вызываем digit_sum(48)' },
                { line: 7, phase: 'down', call: 'digit_sum(48)', desc: '48 % 10 = 8 (последняя цифра), вызываем digit_sum(4)' },
                { line: 4, phase: 'base', call: 'digit_sum(4) → 4', desc: '4 < 10 → сработала база! Возвращаем 4' },
                { line: 7, phase: 'up', call: '8 + 4 = 12', desc: 'Возврат в digit_sum(48): складываем 8 + 4 = 12' },
                { line: 9, phase: 'out', call: '2 + 12 = 14', desc: 'Возврат в digit_sum(482): 2 + 12 = 14', out: 'Сумма цифр 482: 14' }
              ]
            }
          },
          {
            t: 'callout',
            tone: 'good',
            icon: 'fas fa-sparkles',
            title: 'Почему не через str(n)?',
            text: 'Преобразование числа в строку расходует дополнительную память на создание строкового объекта. Математический разбор через <code>% 10</code> и <code>// 10</code> работает напрямую с регистрами процессора.'
          }
        ]
      },
      {
        k: 'concept',
        eyebrow: '05 · ДВОИЧНЫЙ ПЕРЕВОД',
        title: 'Перевод чисел в двоичную систему',
        lead: 'Тот же принцип работает для перевода в любую систему счисления: делим не на 10, а на основание системы (на 2 для двоичной).',
        blocks: [
          {
            t: 'cards',
            cols: 2,
            items: [
              {
                badge: 'Логика перевода',
                icon: 'fas fa-code',
                title: 'Остатки от деления на 2',
                text: 'При делении числа на 2 остатки <code>n % 2</code> дают двоичные биты. Рекурсия удобна тем, что собирает биты на обратном ходе в правильном порядке!',
                tone: 'violet'
              },
              {
                badge: 'Код перевода',
                icon: 'fas fa-code',
                title: 'to_binary.py',
                text: 'База: если <code>n <= 1</code>, вернуть <code>str(n)</code>. Шаг: вызвать функцию от <code>n // 2</code> и приклеить остаток <code>str(n % 2)</code>.',
                tone: 'cyan'
              }
            ]
          }
        ]
      },
      {
        k: 'concept',
        eyebrow: '06 · ПРАКТИКА В PYTHON IDLE',
        title: 'Три задачи для практики',
        lead: 'Напиши и протестируй программы в среде IDLE. Каждая задача оценивается отдельно (3 + 3 + 4 = 10 баллов).',
        blocks: [
          {
            t: 'cards',
            cols: 3,
            items: [
              {
                badge: 'Задачка 1 · 3 балла',
                icon: 'fas fa-calculator',
                title: 'Сумма цифр: digit_sum(n)',
                text: 'Напиши функцию <code>digit_sum(n)</code>, которая принимает целое положительное число <code>n</code> и возвращает сумму его цифр.<br><br>' +
                      '<b>💡 Подсказка:</b><br>' +
                      'База: если <code>n &lt; 10</code>, вернуть <code>n</code>. Шаг: сложить последнюю цифру <code>n % 10</code> и вызов <code>digit_sum(n // 10)</code>.',
                tone: 'violet'
              },
              {
                badge: 'Задачка 2 · 3 балла',
                icon: 'fas fa-list-ol',
                title: 'Четные цифры: count_evens(n)',
                text: 'Напиши функцию <code>count_evens(n)</code>, которая подсчитывает количество четных цифр в числе <code>n</code> (например, для 2481 вернет 3).<br><br>' +
                      '<b>💡 Подсказка:</b><br>' +
                      'База: если <code>n &lt; 10</code>, вернуть 1 (если <code>n % 2 == 0</code>), иначе 0. Шаг: проверить последнюю цифру и сложить с результатом от <code>n // 10</code>.',
                tone: 'cyan'
              },
              {
                badge: 'Задачка 3 · 4 балла ★',
                icon: 'fas fa-star',
                title: 'Двоичный код: to_binary(n)',
                text: 'Напиши функцию <code>to_binary(n)</code>, которая принимает число <code>n</code> и возвращает его двоичную запись в виде строки (например, для 13 вернет "1101").<br><br>' +
                      '<b>💡 Подсказка:</b><br>' +
                      'База: если <code>n &lt;= 1</code>, вернуть <code>str(n)</code>. Шаг: соединить строки <code>to_binary(n // 2) + str(n % 2)</code>.',
                tone: 'amber'
              }
            ]
          }
        ]
      },
      {
        k: 'quiz',
        eyebrow: '07 · МИНИ-ПРОВЕРКА',
        title: 'Проверим знания разбора чисел',
        lead: 'Выбери один правильный ответ в каждом вопросе.',
        questions: [
          { q: 'Какая операция отщепляет последнюю цифру от десятичного числа?', options: ['n // 10', 'n % 10', 'n ** 10', 'n - 10'], answer: 1, explain: 'Остаток n % 10 возвращает последнюю цифру числа.' },
          { q: 'Какая операция удаляет последнюю цифру, уменьшая число для следующего вызова?', options: ['n // 10', 'n % 10', 'n / 10', 'abs(n)'], answer: 0, explain: 'Целочисленное деление n // 10 отбрасывает младший разряд.' },
          { q: 'Чему равна сумма цифр числа 502?', options: ['5', '7', '10', '52'], answer: 1, explain: '5 + 0 + 2 = 7.' },
          { q: 'Каков правильный базовый случай для нахождения суммы цифр натурального числа?', options: ['n == 0: return 0', 'n < 10: return n', 'n == 1: return 1', 'n > 10: return 0'], answer: 1, explain: 'Если n < 10, число состоит из единственной цифры, она и есть сумма.' },
          { q: 'Как запишется число 6 в двоичной системе счисления?', options: ['110', '101', '011', '111'], answer: 0, explain: '6 = 4 + 2 + 0, в двоичной системе это 110₂.' }
        ]
      },
      {
        k: 'summary',
        eyebrow: '08 · ИТОГИ УРОКА',
        title: 'Главное и оценивание',
        lead: 'Максимум за практическую работу — 10 баллов.',
        points: [
          'Операция % 10 выделяет младший разряд (последнюю цифру) числа.',
          'Операция // 10 выполняет шаг рекурсии, уменьшая число на один разряд.',
          'Условие n < 10 служит естественной базой для однозначных чисел.',
          'Тот же принцип деления на основание системы используется для перевода в двоичный код.'
        ],
        criteriaTitle: 'Дескриптор практики · 10 баллов',
        criteria: [
          { mark: '1 балл', text: 'Задание 1: Задано условие остановки для однозначного числа n < 10.' },
          { mark: '1 балл', text: 'Задание 1: Реализовано сложение последней цифры и уменьшенного числа.' },
          { mark: '1 балл', text: 'Задание 1: Программа протестирована в IDLE и возвращает верную сумму.' },
          { mark: '1 балл', text: 'Задание 2: Оформлена проверка базового случая с учетом четности.' },
          { mark: '1 балл', text: 'Задание 2: Реализован рекурсивный шаг инкремента счетчика четных цифр.' },
          { mark: '1 балл', text: 'Задание 2: Функция возвращает точное количество четных цифр.' },
          { mark: '1 балл', text: 'Задание 3: Реализована база рекурсии для значений n <= 1.' },
          { mark: '1 балл', text: 'Задание 3: Шаг формирует конкатенацию битовой строки на выходе.' },
          { mark: '1 балл', text: 'Задание 3: Функция возвращает двоичную строку в корректном порядке битов.' },
          { mark: '1 балл', text: 'Задание 3: Код проверен на контрольных числах в среде IDLE.' }
        ],
        ticketTitle: 'Выходной билет',
        ticketLead: 'Ответь устно или в тетради:',
        ticket: [
          'Как комбинация % 10 и // 10 позволяет разобрать любое число?',
          'Почему при переводе в двоичную систему остатки приклеиваются справа?',
          'С какой задачей удалось справиться без подсказок?'
        ]
      }
    ]
  });

  /* ==========================================================================
     УРОК 6. Строки и списки
     ========================================================================== */
  Q2.add('10emn-q2-6', {
    num: 6,
    cls: '10 ЕМН',
    title: 'Рекурсия',
    slides: [
      {
        k: 'hero',
        eyebrow: '10 ЕМН · 2 ЧЕТВЕРТЬ · УРОК 6',
        title: '<span class="accent-text">Рекурсия</span> · Строки и списки',
        lead: 'Рекурсивная обработка текста и коллекций: отделяем первый символ от хвоста срезом, разворачиваем слова и проверяем палиндромы.',
        goal: 'Научиться применять рекурсию к строкам и спискам через срезы [0] и [1:], решать задачи на поиск и симметрию.',
        goalCode: '10.2.1.1',
        chips: [
          { icon: 'fas fa-font', text: 'Срезы s[0] и s[1:]' },
          { icon: 'fas fa-arrows-rotate', text: 'Реверс строк' },
          { icon: 'fas fa-arrows-left-right', text: 'Палиндромы' }
        ],
        visual: 'recursionStrings',
        visualCaption: 'Голова s[0] и хвост s[1:] — стандартный шаблон рекурсии строк',
        cta: 'Разобрать строки'
      },
      {
        k: 'review',
        questions: [
          { q: 'Что вернет выражение "информатика"[0] в Python?', options: ['"и"', '"ин"', '"информатика"', 'Ошибку'], answer: 0, explain: 'Индекс [0] возвращает первый символ строки (голову).' },
          { q: 'Что вернет срез "питон"[1:]?', options: ['"итон"', '"п"', '"питон"', '"и"'], answer: 0, explain: 'Срез [1:] возвращает всю строку без первого символа (хвост).' },
          { q: 'Какова естественная база при рекурсивной обработке строки?', options: ['Длина строки len(s) <= 1', 'Строка состоит из 100 букв', 'Строка содержит цифры', 'Первая буква заглавная'], answer: 0, explain: 'Пустая строка или строка из одного символа не требует обработки.' },
          { q: 'Что такое палиндром?', options: ['Слово, которое читается одинаково слева направо и справа налево', 'Слово, написанное заглавными буквами', 'Функция без аргументов', 'Список целых чисел'], answer: 0, explain: 'Палиндромы («шалаш», «казак», «топот») абсолютно симметричны.' },
          { q: 'Какая операция отщепляет последнюю цифру десятичного числа?', options: ['n % 10', 'n // 10', 'n * 10', 'n / 10'], answer: 0, explain: 'Остаток от деления на 10 дает последнюю цифру.' }
        ]
      },
      {
        k: 'concept',
        eyebrow: '03 · ПРИЕМ «ГОЛОВА И ХВОСТ»',
        title: 'Как рекурсия разбирает последовательности',
        lead: 'Любую строку или список можно представить как первый элемент (голову) и оставшуюся подстроку (хвост): <code>s = s[0] + s[1:]</code>.',
        blocks: [
          { t: 'svg', svg: STRING_REVERSE_SVG, caption: 'Разбиение строки на голову s[0] и хвост s[1:]' },
          {
            t: 'cards',
            cols: 2,
            items: [
              {
                badge: 'Базовый случай',
                icon: 'fas fa-stop',
                title: 'Пустая строка или 1 символ',
                text: 'Если <code>len(s) &lt;= 1</code>, переворачивать нечего — возвращаем саму строку <code>return s</code>. Это наш стоп-кран.',
                tone: 'green'
              },
              {
                badge: 'Рекурсивный шаг',
                icon: 'fas fa-arrow-right-arrow-left',
                title: 'Хвост вперед, голова назад',
                text: 'Разворачиваем хвост и приписываем голову в самый конец: <code>reverse(s[1:]) + s[0]</code>. Для "КОД" это "ОД" + "К" → "ДО" + "К" = "ДОК".',
                tone: 'violet'
              }
            ]
          }
        ]
      },
      {
        k: 'concept',
        eyebrow: '04 · ПРОВЕРКА ПАЛИНДРОМОВ',
        title: 'Симметрия: сужение строки с двух концов',
        lead: 'Слово является палиндромом, если его первая и последняя буквы совпадают, а середина — тоже палиндром!',
        blocks: [
          {
            t: 'code',
            title: 'палиндром.py',
            code: 'def is_palindrome(s):\n    # База: строки длины 0 или 1 всегда палиндромы\n    if len(s) <= 1:\n        return True\n\n    # Если крайние буквы не равны — точно не палиндром\n    if s[0] != s[-1]:\n        return False\n\n    # Шаг: проверяем подстроку без крайних букв\n    return is_palindrome(s[1:-1])\n\nprint(is_palindrome("шалаш"))  # True\nprint(is_palindrome("питон"))  # False',
            trace: {
              title: 'Пошаговая проверка палиндрома',
              cmd: 'is_palindrome("шалаш") / is_palindrome("питон")',
              steps: [
                { line: 7, phase: 'down', call: 'is_palindrome("шалаш")', desc: 'Крайние буквы "ш" == "ш" совпадают → срез s[1:-1] = "ала"' },
                { line: 11, phase: 'down', call: 'is_palindrome("ала")', desc: 'Крайние буквы "а" == "а" совпадают → срез s[1:-1] = "л"' },
                { line: 4, phase: 'base', call: 'is_palindrome("л") → True', desc: 'len("л") <= 1 → база достигнута, возвращаем True!', out: 'True' },
                { line: 8, phase: 'out', call: 'is_palindrome("питон") → False', desc: 'Крайние буквы "п" != "н" не равны → сразу return False', out: 'False' }
              ]
            }
          },
          {
            t: 'callout',
            tone: 'good',
            icon: 'fas fa-check-double',
            title: 'Сужение срезом s[1:-1]',
            text: 'Срез <code>s[1:-1]</code> отсекает первый и последний символы одновременно: "шалаш" → "ала" → "л" (база reached, True).'
          }
        ]
      },
      {
        k: 'concept',
        eyebrow: '05 · РЕКУРСИЯ ПО СПИСКАМ',
        title: 'Обработка числовых списков',
        lead: 'Точно так же, как со строками, рекурсия легко считает сумму, максимум или количество элементов в обычном списке Python.',
        blocks: [
          {
            t: 'table',
            caption: 'Шаблон обхода последовательности',
            head: ['Элемент шаблона', 'Для строк (str)', 'Для списков (list)'],
            rows: [
              ['База', 'if len(s) == 0: return ""', 'if len(lst) == 0: return 0'],
              ['Голова', 's[0]', 'lst[0]'],
              ['Хвост', 's[1:]', 'lst[1:]'],
              ['Шаг суммирования', 's[0] + rec(s[1:])', 'lst[0] + rec(lst[1:])']
            ],
            highlight: 0
          }
        ]
      },
      {
        k: 'concept',
        eyebrow: '06 · ПРАКТИКА В PYTHON IDLE',
        title: 'Три задачи для практики',
        lead: 'Напиши и протестируй программы в среде IDLE. Каждая задача оценивается отдельно (3 + 3 + 4 = 10 баллов).',
        blocks: [
          {
            t: 'cards',
            cols: 3,
            items: [
              {
                badge: 'Задачка 1 · 3 балла',
                icon: 'fas fa-arrows-rotate',
                title: 'Реверс: reverse_str(s)',
                text: 'Напиши функцию <code>reverse_str(s)</code>, которая переворачивает строку задом наперед с помощью рекурсии.<br><br>' +
                      '<b>💡 Подсказка:</b><br>' +
                      'База: если <code>len(s) &lt;= 1</code>, вернуть <code>s</code>. Шаг: вызвать функцию для хвоста <code>s[1:]</code> и приклеить голову <code>s[0]</code> в конец.',
                tone: 'violet'
              },
              {
                badge: 'Задачка 2 · 3 балла',
                icon: 'fas fa-font',
                title: 'Гласные: count_vowels(s)',
                text: 'Напиши функцию <code>count_vowels(s)</code>, которая подсчитывает число гласных букв в строке <code>s</code> (гласные: "ауоыиэяюёе").<br><br>' +
                      '<b>💡 Подсказка:</b><br>' +
                      'База: пустая строка <code>len(s) == 0</code> вернет 0. Шаг: прибавить 1, если <code>s[0].lower()</code> среди гласных, плюс вызов для <code>s[1:]</code>.',
                tone: 'cyan'
              },
              {
                badge: 'Задачка 3 · 4 балла ★',
                icon: 'fas fa-star',
                title: 'Палиндром: is_palindrome(s)',
                text: 'Напиши функцию <code>is_palindrome(s)</code>, которая проверяет, читается ли слово одинаково в обе стороны.<br><br>' +
                      '<b>💡 Подсказка:</b><br>' +
                      'База: при <code>len(s) &lt;= 1</code> вернуть <code>True</code>. Если <code>s[0] != s[-1]</code>, вернуть <code>False</code>, иначе вызвать <code>is_palindrome(s[1:-1])</code>.',
                tone: 'amber'
              }
            ]
          }
        ]
      },
      {
        k: 'quiz',
        eyebrow: '07 · МИНИ-ПРОВЕРКА',
        title: 'Проверим знания рекурсии со строками',
        lead: 'Выбери один правильный ответ в каждом вопросе.',
        questions: [
          { q: 'Что вернет reverse_str("код"), если функция написана верно?', options: ['"код"', '"док"', '"кдо"', '"одк"'], answer: 1, explain: '"код" задом наперед читается как "док".' },
          { q: 'Какой срез отсекает первый символ строки?', options: ['s[0]', 's[1:]', 's[:-1]', 's[::2]'], answer: 1, explain: 's[1:] возвращает всю строку начиная со второго символа (хвост).' },
          { q: 'Является ли слово «казак» палиндромом?', options: ['Да, оно абсолютно симметрично', 'Нет', 'Только если записано латиницей', 'Зависит от версии Python'], answer: 0, explain: '«казак» читается одинаково в обоих направлениях.' },
          { q: 'Какое условие завершает рекурсивную проверку палиндрома с положительным ответом?', options: ['len(s) <= 1', 'len(s) > 10', 's[0] == "а"', 'len(s) == 2'], answer: 0, explain: 'Если остался 1 символ или 0 символов, все пары совпали — возвращается True.' },
          { q: 'Какой срез отсекает одновременно первый и последний символ строки?', options: ['s[1:]', 's[:-1]', 's[1:-1]', 's[0:-1]'], answer: 2, explain: 'Срез s[1:-1] отбрасывает крайние символы с обеих сторон.' }
        ]
      },
      {
        k: 'summary',
        eyebrow: '08 · ИТОГИ УРОКА',
        title: 'Главное и оценивание',
        lead: 'Максимум за практическую работу — 10 баллов.',
        points: [
          'Прием «голова и хвост» — стандартная схема рекурсивной обработки последовательностей.',
          'Срез s[1:] уменьшает длину строки на 1, приближая алгоритм к базовой пустой строке.',
          'Проверка палиндрома использует встречное сужение через срез s[1:-1].',
          'Те же правила применимы к спискам: первый элемент lst[0] и хвост lst[1:].'
        ],
        criteriaTitle: 'Дескриптор практики · 10 баллов',
        criteria: [
          { mark: '1 балл', text: 'Задание 1: Задано условие остановки для строки длины <= 1.' },
          { mark: '1 балл', text: 'Задание 1: Оформлен рекурсивный шаг перестановки символов через срез.' },
          { mark: '1 балл', text: 'Задание 1: Программа протестирована в IDLE и возвращает зеркальную строку.' },
          { mark: '1 балл', text: 'Задание 2: Реализована база для пустой строки.' },
          { mark: '1 балл', text: 'Задание 2: Оформлена проверка вхождения символа в набор гласных букв.' },
          { mark: '1 балл', text: 'Задание 2: Функция возвращает верное количество гласных на тестовых строках.' },
          { mark: '1 балл', text: 'Задание 3: Реализовано базовое условие симметрии для коротких подстрок.' },
          { mark: '1 балл', text: 'Задание 3: Описана проверка несовпадения крайних символов строки.' },
          { mark: '1 балл', text: 'Задание 3: Реализован рекурсивный вызов для суженного среза s[1:-1].' },
          { mark: '1 балл', text: 'Задание 3: Проверены тестовые слова (палиндромы и несимметричные слова).' }
        ],
        ticketTitle: 'Выходной билет',
        ticketLead: 'Ответь устно или в тетради:',
        ticket: [
          'Как срезы s[0] и s[1:] помогают организовать рекурсию?',
          'Почему при проверке палиндрома строка уменьшается на два символа за шаг?',
          'Какое тестовое слово ты проверил(а) в третьей задаче?'
        ]
      }
    ]
  });

  /* ==========================================================================
     УРОК 7. Рекурсия или цикл
     ========================================================================== */
  Q2.add('10emn-q2-7', {
    num: 7,
    cls: '10 ЕМН',
    title: 'Рекурсия',
    slides: [
      {
        k: 'hero',
        eyebrow: '10 ЕМН · 2 ЧЕТВЕРТЬ · УРОК 7',
        title: '<span class="accent-text">Рекурсия</span> · Рекурсия или цикл',
        lead: 'Битва подходов: итерация против рекурсии. Почему цикл экономит память O(1), а рекурсия незаменима для иерархий и алгоритма Евклида.',
        goal: 'Сравнить циклы и рекурсию по времени и памяти, научиться транслировать циклы в рекурсию и выбирать лучший инструмент.',
        goalCode: '10.2.1.1',
        chips: [
          { icon: 'fas fa-memory', text: 'Память O(1) vs O(N)' },
          { icon: 'fas fa-scale-balanced', text: 'Когда что выбрать' },
          { icon: 'fas fa-diagram-project', text: 'Алгоритм Евклида' }
        ],
        visual: 'recursionVsLoop',
        visualCaption: 'Цикл перезаписывает одну переменную, рекурсия строит стек фреймов',
        cta: 'Сравнить подходы'
      },
      {
        k: 'review',
        questions: [
          { q: 'Сколько оперативной памяти расходует обычный цикл for при миллионе итераций?', options: ['Константный объем O(1) — только для переменной счетчика', 'Один гигабайт', 'Память переполняется сразу', 'Стек вызовов заполняется до предела'], answer: 0, explain: 'Цикл не создает новых фреймов, а лишь перезаписывает значение переменной.' },
          { q: 'Что происходит с памятью при глубокой рекурсии без оптимизации?', options: ['Память освобождается', 'Каждый вызов занимает фрейм в стеке O(N)', 'Компьютер переключается на жесткий диск', 'Ничего не меняется'], answer: 1, explain: 'Каждый шаг рекурсии сохраняет параметры в отдельном фрейме стека вызовов.' },
          { q: 'Для каких структур данных рекурсия подходит лучше всего?', options: ['Только для простых чисел', 'Для иерархических структур: деревьев, вложенных папок, графов', 'Только для коротких строк', 'Для пустых файлов'], answer: 1, explain: 'Иерархические и древовидные структуры естественно обходятся рекурсивными вызовами.' },
          { q: 'Какой алгоритм находит наибольший общий делитель (НОД) двух чисел?', options: ['Алгоритм Евклида', 'Сортировка пузырьком', 'Бинарный поиск', 'Шифр Цезаря'], answer: 0, explain: 'Алгоритм Евклида — классический и один из самых быстрых методов нахождения НОД.' },
          { q: 'Что делает оператор % в алгоритме Евклида?', options: ['Вычисляет процент от числа', 'Находит остаток от деления большего числа на меньшее', 'Возводит число в степень', 'Округляет до целого'], answer: 1, explain: 'Остаток от деления a % b является основой шага алгоритма Евклида.' }
        ]
      },
      {
        k: 'concept',
        eyebrow: '03 · ПАМЯТЬ И СКОРОСТЬ',
        title: 'Архитектура: Цикл против Рекурсии',
        lead: 'Любой цикл можно переписать через рекурсию, и наоборот. Но с точки зрения ресурсов компьютера они работают принципиально по-разному.',
        blocks: [
          { t: 'svg', svg: COMPARE_SVG, caption: 'Сравнение расхода памяти: переменная O(1) vs стек фреймов O(N)' },
          {
            t: 'table',
            caption: 'Сравнительный анализ двух подходов',
            head: ['Критерий', 'Итерация (Цикл for / while)', 'Рекурсия (Функция зовет себя)'],
            rows: [
              ['Расход памяти', 'O(1) — постоянный, минимальный', 'O(N) — пропорционален глубине стека'],
              ['Скорость вызова', 'Быстрее (нет накладных расходов)', 'Медленнее (создание и удаление фреймов)'],
              ['Риск сбоя', 'Бесконечный цикл (зависание)', 'RecursionError (переполнение стека)'],
              ['Читаемость кода', 'Проще для линейных массивов', 'Лаконичнее для деревьев, разбора и фракталов']
            ],
            highlight: 0
          }
        ]
      },
      {
        k: 'concept',
        eyebrow: '04 · АЛГОРИТМ ЕВКЛИДА',
        title: 'Триумф рекурсии: НОД двух чисел',
        lead: 'Алгоритм Евклида для нахождения наибольшего общего делителя в рекурсивном виде выглядит как шедевр лаконичности.',
        blocks: [
          {
            t: 'code',
            title: 'gcd_euclid.py',
            code: 'def gcd(a, b):\n    # База: если остаток b равен 0, то a и есть НОД\n    if b == 0:\n        return a\n\n    # Рекурсивный шаг Евклида: gcd(b, остаток от a // b)\n    return gcd(b, a % b)\n\nprint("НОД(48, 18):", gcd(48, 18))  # 6\nprint("НОД(100, 25):", gcd(100, 25))  # 25',
            trace: {
              title: 'Пошаговое выполнение gcd(48, 18)',
              cmd: 'gcd(48, 18)',
              steps: [
                { line: 7, phase: 'down', call: 'gcd(48, 18)', desc: 'Остаток 48 % 18 = 12 → следующий шаг gcd(18, 12)' },
                { line: 7, phase: 'down', call: 'gcd(18, 12)', desc: 'Остаток 18 % 12 = 6 → следующий шаг gcd(12, 6)' },
                { line: 7, phase: 'down', call: 'gcd(12, 6)', desc: 'Остаток 12 % 6 = 0 → следующий шаг gcd(6, 0)' },
                { line: 4, phase: 'base', call: 'gcd(6, 0) → return 6', desc: 'b == 0 → сработала база! НОД найден и равен 6', out: 'НОД(48, 18): 6' },
                { line: 10, phase: 'out', call: 'gcd(100, 25) → return 25', desc: '100 % 25 = 0 → gcd(25, 0) сразу возвращает 25', out: 'НОД(100, 25): 25' }
              ]
            }
          },
          {
            t: 'callout',
            tone: 'good',
            icon: 'fas fa-lightbulb',
            title: 'Почему рекурсивный Евклид идеален?',
            text: 'Рекурсивная версия состоит всего из двух строк! Числа уменьшаются логарифмически быстро, поэтому глубина стека никогда не превысит пары десятков вызовов.'
          }
        ]
      },
      {
        k: 'concept',
        eyebrow: '05 · ПРАВИЛА ВЫБОРА',
        title: 'Когда выбирать цикл, а когда рекурсию?',
        lead: 'Запомни простое инженерное правило выбора подходящей парадигмы.',
        blocks: [
          {
            t: 'cards',
            cols: 2,
            items: [
              {
                badge: 'Выбирай цикл for / while',
                icon: 'fas fa-repeat',
                title: 'Линейные структуры',
                text: '• Одноуровневые списки и массивы<br>• Простые счетчики и переборы<br>• Задачи с миллионами повторений (где важна экономия памяти O(1))',
                tone: 'cyan'
              },
              {
                badge: 'Выбирай рекурсию',
                icon: 'fas fa-sitemap',
                title: 'Иерархии и ветвления',
                text: '• Вложенные списки неизвестной глубины<br>• Деревья каталогов и файлов на диске<br>• Алгоритмы «Разделяй и властвуй» (быстрая сортировка, слияние)',
                tone: 'violet'
              }
            ]
          }
        ]
      },
      {
        k: 'concept',
        eyebrow: '06 · ПРАКТИКА В PYTHON IDLE',
        title: 'Три задачи для практики',
        lead: 'Напиши и протестируй программы в среде IDLE. Каждая задача оценивается отдельно (3 + 3 + 4 = 10 баллов).',
        blocks: [
          {
            t: 'cards',
            cols: 3,
            items: [
              {
                badge: 'Задачка 1 · 3 балла',
                icon: 'fas fa-scale-balanced',
                title: 'Два факториала: loop и rec',
                text: 'Напиши две функции: <code>fact_loop(n)</code> (через цикл <code>for</code>) и <code>fact_rec(n)</code> (через рекурсию). Сравни результаты их вызова для <code>n = 6</code>.<br><br>' +
                      '<b>💡 Подсказка:</b><br>' +
                      'В цикле используй накопитель <code>res = 1</code> и умножай в диапазоне. В рекурсии — базу <code>n <= 1</code> и шаг <code>n * fact_rec(n - 1)</code>.',
                tone: 'violet'
              },
              {
                badge: 'Задачка 2 · 3 балла',
                icon: 'fas fa-calculator',
                title: 'НОД Евклида: gcd_rec(a, b)',
                text: 'Напиши рекурсивную функцию <code>gcd_rec(a, b)</code>, вычисляющую наибольший общий делитель чисел <code>a</code> и <code>b</code> по алгоритму Евклида.<br><br>' +
                      '<b>💡 Подсказка:</b><br>' +
                      'База: если <code>b == 0</code>, вернуть <code>a</code>. Шаг: вернуть результат вызова <code>gcd_rec(b, a % b)</code>.',
                tone: 'cyan'
              },
              {
                badge: 'Задачка 3 · 4 балла ★',
                icon: 'fas fa-star',
                title: 'Вложенный список: deep_sum(lst)',
                text: 'Напиши функцию <code>deep_sum(lst)</code>, находящую сумму всех чисел во вложенном списке любой глубины (например, для <code>[1, [2, [3, 4]], 5]</code> вернет 15).<br><br>' +
                      '<b>💡 Подсказка:</b><br>' +
                      'Проходи циклом по элементам: если элемент число — прибавляй его к сумме, а если элемент список — рекурсивно вызывай <code>deep_sum(x)</code>.',
                tone: 'amber'
              }
            ]
          }
        ]
      },
      {
        k: 'quiz',
        eyebrow: '07 · МИНИ-ПРОВЕРКА',
        title: 'Проверим понимание циклов и рекурсии',
        lead: 'Выбери один правильный ответ в каждом вопросе.',
        questions: [
          { q: 'Какова сложность по памяти у стандартного рекурсивного алгоритма глубиной N?', options: ['O(1)', 'O(N)', 'O(N²)', 'Память не расходуется'], answer: 1, explain: 'N одновременных кадров в стеке требуют памяти O(N).' },
          { q: 'Что возвращает алгоритм Евклида gcd(48, 18)?', options: ['3', '6', '12', '18'], answer: 1, explain: 'Наибольший общий делитель 48 и 18 равен 6.' },
          { q: 'Какое базовое условие останавливает рекурсивный алгоритм Евклида gcd(a, b)?', options: ['a == b', 'b == 0: return a', 'a == 0: return b', 'b == 1'], answer: 1, explain: 'Когда делитель b становится равен 0, предыдущий остаток a и есть НОД.' },
          { q: 'Почему для обхода вложенных списков [1, [2, [3]]] рекурсия удобнее обычного цикла?', options: ['Потому что глубина вложенности заранее неизвестна, и стек сам отслеживает возврат', 'Потому что рекурсия работает быстрее видеокарты', 'Потому что цикл for не поддерживает списки', 'Это единственный способ вывести текст'], answer: 0, explain: 'Рекурсия автоматически адаптируется к любой глубине вложенности деревьев.' },
          { q: 'Что произойдет, если в цикле while условие выхода никогда не выполнится?', options: ['RecursionError', 'Бесконечный цикл (программа зависнет, но стек не переполнится)', 'IndexError', 'Файл сотрется'], answer: 1, explain: 'Цикл зависнет на 100% процессора, но кадры стека создаваться не будут.' }
        ]
      },
      {
        k: 'summary',
        eyebrow: '08 · ИТОГИ УРОКА',
        title: 'Главное и оценивание',
        lead: 'Максимум за практическую работу — 10 баллов.',
        points: [
          'Циклы экономичнее по памяти O(1) и быстрее для плоских линейных списков.',
          'Рекурсия незаменима для иерархий, деревьев и структур с неизвестной вложенностью.',
          'Рекурсивный алгоритм Евклида решает задачу НОД за минимальное число вызовов.',
          'Выбор между циклом и рекурсией основывается на форме данных и требованиях к памяти.'
        ],
        criteriaTitle: 'Дескриптор практики · 10 баллов',
        criteria: [
          { mark: '1 балл', text: 'Задание 1: Написана и протестирована циклическая функция факториала.' },
          { mark: '1 балл', text: 'Задание 1: Написана эквивалентная рекурсивная функция факториала.' },
          { mark: '1 балл', text: 'Задание 1: Результаты обеих функций совпадают на контрольных примерах.' },
          { mark: '1 балл', text: 'Задание 2: Реализована база алгоритма Евклида при b == 0.' },
          { mark: '1 балл', text: 'Задание 2: Оформлен рекурсивный шаг с остатком от деления a % b.' },
          { mark: '1 балл', text: 'Задание 2: Функция возвращает точный наибольший общий делитель чисел.' },
          { mark: '1 балл', text: 'Задание 3: Реализована проверка типа элемента (число или вложенный список).' },
          { mark: '1 балл', text: 'Задание 3: Оформлен рекурсивный вызов для каждого вложенного списка.' },
          { mark: '1 балл', text: 'Задание 3: Функция возвращает полную сумму элементов глубокого списка.' },
          { mark: '1 балл', text: 'Задание 3: Программа успешно протестирована в среде IDLE без падений стека.' }
        ],
        ticketTitle: 'Выходной билет',
        ticketLead: 'Ответь устно или в тетради:',
        ticket: [
          'В каких задачах рекурсия выигрывает у цикла в читаемости и простоте?',
          'Какое преимущество дает алгоритм Евклида при поиске делителя больших чисел?',
          'Какой из двух подходов тебе ближе: итеративный или рекурсивный?'
        ]
      }
    ]
  });

  /* ==========================================================================
     УРОК 8. Практикум СОР
     ========================================================================== */
  Q2.add('10emn-q2-8', {
    num: 8,
    cls: '10 ЕМН',
    title: 'Рекурсия',
    slides: [
      {
        k: 'hero',
        eyebrow: '10 ЕМН · 2 ЧЕТВЕРТЬ · УРОК 8',
        title: '<span class="accent-text">Рекурсия</span> · Практикум СОР',
        lead: 'Итоговый практикум перед суммативным оцениванием: решение сложных экзаменационных рекуррентных соотношений, подсчет количества вызовов и последовательности высшего порядка.',
        goal: 'Закрепить все навыки раздела рекурсии, подготовиться к заданиям СОР и уверенно написать код для 10 из 10 баллов.',
        goalCode: '10.2.1.1',
        chips: [
          { icon: 'fas fa-graduation-cap', text: 'Подготовка к СОР' },
          { icon: 'fas fa-list-ol', text: 'Рекуррентные ряды' },
          { icon: 'fas fa-chart-line', text: 'Трассировка вызовов' }
        ],
        visual: 'recursionExam',
        visualCaption: 'Четыре шага к максимальному баллу на суммативном оценивании',
        cta: 'Начать практикум'
      },
      {
        k: 'review',
        questions: [
          { q: 'Что такое рекуррентное соотношение?', options: ['Правило, выражающее каждый член последовательности через предыдущие', 'Команда очистки экрана', 'Имя стандартного модуля Python', 'Тип ошибки в вычислениях'], answer: 0, explain: 'Рекуррентная формула определяет F(n) через F(n-1), F(n-2) и т.д.' },
          { q: 'С чего ВСЕГДА нужно начинать ручную трассировку рекуррентной функции?', options: ['С базовых значений (F(1) или F(0))', 'С самого большого числа', 'Со случайного числа', 'С деления на ноль'], answer: 0, explain: 'Трассировку всегда ведут снизу вверх — от известных базовых значений к искомому.' },
          { q: 'Чему равен НОД чисел 36 и 12?', options: ['6', '12', '3', '36'], answer: 1, explain: '36 делится на 12 без остатка, поэтому НОД равен 12.' },
          { q: 'Что делает операция len(s) в Python?', options: ['Возвращает длину строки или списка', 'Переворачивает строку', 'Удаляет первый символ', 'Очищает память'], answer: 0, explain: 'Функция len() возвращает количество элементов.' },
          { q: 'Какой предел глубины рекурсии по умолчанию установлен в Python?', options: ['100', '500', '1000', 'Бесконечный'], answer: 2, explain: 'Стандартный лимит составляет 1000 вызовов.' }
        ]
      },
      {
        k: 'concept',
        eyebrow: '03 · ПЛАН ПОДГОТОВКИ К СОР',
        title: 'Типовые экзаменационные задачи',
        lead: 'На суммативном оценивании проверяется умение переводить математические рекуррентные соотношения в код Python и анализировать дерево вызовов.',
        blocks: [
          { t: 'svg', svg: EXAM_SUMMARY_SVG, caption: '4 этапа решения задач на суммативном оценивании' },
          {
            t: 'cards',
            cols: 2,
            items: [
              {
                badge: 'Тип 1 на СОР',
                icon: 'fas fa-code-branch',
                title: 'Кусочные рекуррентные функции',
                text: 'Формула задается разными правилами для четных и нечетных значений аргумента. В коде это реализуется через <code>if n % 2 == 0: ... else: ...</code>.',
                tone: 'violet'
              },
              {
                badge: 'Тип 2 на СОР',
                icon: 'fas fa-stopwatch',
                title: 'Подсчет числа вызовов функции',
                text: 'Требуется определить, сколько всего раз функция была вызвана при вычислении <code>F(n)</code>. Решается добавлением счетчика или вспомогательной функции.',
                tone: 'cyan'
              }
            ]
          }
        ]
      },
      {
        k: 'concept',
        eyebrow: '04 · РАЗБОР ЗАДАЧИ СОР',
        title: 'Пример реального задания СОР',
        lead: 'Дано соотношение: F(1) = 1; при n > 1: если n четное, F(n) = n + F(n - 1); если n нечетное, F(n) = 2 × F(n - 2). Чему равно F(5)?',
        blocks: [
          {
            t: 'code',
            title: 'решение_сор.py',
            code: 'def F(n):\n    if n == 1:\n        return 1\n    if n % 2 == 0:\n        return n + F(n - 1)      # четное n\n    else:\n        return 2 * F(n - 2)      # нечетное n\n\n# Ручная трассировка:\n# F(1) = 1\n# F(2) = 2 + F(1) = 2 + 1 = 3\n# F(3) = 2 * F(1) = 2 * 1 = 2\n# F(4) = 4 + F(3) = 4 + 2 = 6\n# F(5) = 2 * F(3) = 2 * 2 = 4\nprint("F(5) =", F(5))  # 4',
            trace: {
              title: 'Пошаговая трассировка F(5)',
              cmd: 'print("F(5) =", F(5))',
              steps: [
                { line: 7, phase: 'down', call: 'F(5) [нечетное]', desc: 'n = 5 нечетное → вызываем 2 * F(3)' },
                { line: 7, phase: 'down', call: 'F(3) [нечетное]', desc: 'n = 3 нечетное → вызываем 2 * F(1)' },
                { line: 3, phase: 'base', call: 'F(1) = 1', desc: 'n == 1 → базовый случай возвращает 1' },
                { line: 7, phase: 'up', call: 'F(3) = 2 * 1 = 2', desc: 'Возврат в F(3): подставляем F(1)=1 → получаем 2' },
                { line: 15, phase: 'out', call: 'F(5) = 2 * 2 = 4', desc: 'Возврат в F(5): подставляем F(3)=2 → ответ 4!', out: 'F(5) = 4' }
              ]
            }
          },
          {
            t: 'callout',
            tone: 'good',
            icon: 'fas fa-graduation-cap',
            title: 'Секрет успеха на СОР',
            text: 'Сначала выполни расчет на черновике снизу вверх от F(1) до F(5), а затем запусти программу в IDLE. Если ответы совпали — решение гарантированно верное!'
          }
        ]
      },
      {
        k: 'concept',
        eyebrow: '05 · ПОДСЧЕТ ВЫЗОВОВ',
        title: 'Как посчитать число вызовов функции?',
        lead: 'В задачах СОР часто спрашивают: «Сколько раз вызовется функция F при расчете значения?».',
        blocks: [
          {
            t: 'code',
            title: 'счетчик_вызовов.py',
            code: 'calls = 0  # глобальный счетчик\n\ndef F(n):\n    global calls\n    calls += 1  # учитываем текущий вызов\n    if n <= 1:\n        return 1\n    return F(n - 1) + F(n - 2)\n\ncalls = 0\nres = F(4)\nprint(f"F(4) = {res}, всего вызовов: {calls}")  # 9 вызовов!',
            trace: {
              title: 'Пошаговый подсчет вызовов F(4)',
              cmd: 'res = F(4)',
              steps: [
                { line: 5, phase: 'down', call: 'F(4) → calls = 1', desc: 'Старт корневого вызова F(4), запускает F(3) и F(2)' },
                { line: 5, phase: 'down', call: 'Ветвь F(3) → +5 вызовов', desc: 'F(3) вызывает F(2) (3 вызова) и F(1) (1 вызов) → calls = 6' },
                { line: 5, phase: 'base', call: 'Ветвь F(2) → +3 вызова', desc: 'Правая ветвь F(2) вызывает F(1) и F(0) → calls = 9' },
                { line: 12, phase: 'out', call: 'res = 5, calls = 9', desc: 'Все 9 узлов дерева посчитаны, выводим итог', out: 'F(4) = 5, всего вызовов: 9' }
              ]
            }
          }
        ]
      },
      {
        k: 'concept',
        eyebrow: '06 · ПРАКТИКУМ СОР В IDLE',
        title: 'Три итоговые задачи для СОР',
        lead: 'Напиши и протестируй программы в среде IDLE. Каждая задача оценивается отдельно (3 + 3 + 4 = 10 баллов).',
        blocks: [
          {
            t: 'cards',
            cols: 3,
            items: [
              {
                badge: 'Задачка 1 · 3 балла',
                icon: 'fas fa-edit',
                title: 'Кусочная функция: calc_f(n)',
                text: 'Задано соотношение: <code>F(1) = 2</code>; при <code>n &gt; 1</code>: если <code>n</code> четное, <code>F(n) = 3*n + F(n - 1)</code>; если нечетное, <code>F(n) = 2*n + F(n - 2)</code>. Напиши функцию и найди <code>F(7)</code>.<br><br>' +
                      '<b>💡 Подсказка:</b><br>' +
                      'База: <code>if n == 1: return 2</code>. Далее проверка четности <code>if n % 2 == 0:</code> и возврат формул.',
                tone: 'violet'
              },
              {
                badge: 'Задачка 2 · 3 балла',
                icon: 'fas fa-stopwatch',
                title: 'Подсчет вызовов: count_f_calls(n)',
                text: 'Напиши функцию, которая возвращает количество вызовов при расчете чисел Фибоначчи для заданного <code>n</code>.<br><br>' +
                      '<b>💡 Подсказка:</b><br>' +
                      'Используй глобальную переменную <code>calls</code> или вспомогательную функцию: перед базой увеличивай счетчик на 1.',
                tone: 'cyan'
              },
              {
                badge: 'Задачка 3 · 4 балла ★',
                icon: 'fas fa-star',
                title: 'Трибоначчи: tribonacci(n)',
                text: 'Числа Трибоначчи начинаются с 0, 0, 1, а каждый следующий член равен сумме <b>трех</b> предыдущих. Напиши функцию <code>tribonacci(n)</code> и найди 7-й член.<br><br>' +
                      '<b>💡 Подсказка:</b><br>' +
                      'Три базы: <code>if n == 0: return 0</code>, <code>if n == 1: return 0</code>, <code>if n == 2: return 1</code>. Шаг: сложить три вызова (n-1, n-2, n-3).',
                tone: 'amber'
              }
            ]
          }
        ]
      },
      {
        k: 'quiz',
        eyebrow: '07 · МИНИ-ПРОВЕРКА К СОР',
        title: 'Финальная проверка готовности к СОР',
        lead: 'Выбери один правильный ответ в каждом вопросе.',
        questions: [
          { q: 'Если F(1) = 1, а F(n) = n + F(n - 1), чему равно F(4)?', options: ['7', '10', '12', '15'], answer: 1, explain: 'F(1)=1, F(2)=2+1=3, F(3)=3+3=6, F(4)=4+6=10.' },
          { q: 'Сколько базовых условий необходимо для вычисления чисел Трибоначчи?', options: ['Одно', 'Два', 'Три (для n=0, n=1, n=2)', 'Четыре'], answer: 2, explain: 'Поскольку шаг обращается к трем предыдущим элементам, требуются три начальных значения.' },
          { q: 'Чему равно значение F(3), если F(1) = 2, при четных F(n) = F(n-1) + 1, при нечетных F(n) = F(n-2) * 2?', options: ['2', '4', '6', '8'], answer: 1, explain: 'F(1)=2. Для n=3 число нечетное: F(3) = F(1) * 2 = 2 * 2 = 4.' },
          { q: 'Какой способ проверки рекуррентного соотношения самый надежный перед сдачей работы?', options: ['Трассировка на бумаге от базы вверх + проверка запуском кода в IDLE', 'Просто поверить интуиции', 'Сдать без запуска', 'Посчитать на калькуляторе только последний шаг'], answer: 0, explain: 'Совпадение ручного расчета и вывода программы дает 100% гарантию верного ответа.' },
          { q: 'Какая ошибка возникает, если перепутать знак в шаге и написать F(n + 1) вместо F(n - 1)?', options: ['RecursionError: maximum recursion depth exceeded', 'ZeroDivisionError', 'ValueError', 'SyntaxError'], answer: 0, explain: 'Аргумент начнет неограниченно расти, что вызовет переполнение стека.' }
        ]
      },
      {
        k: 'summary',
        eyebrow: '08 · ИТОГИ УРОКА',
        title: 'Главное и оценивание',
        lead: 'Максимум за практическую работу — 10 баллов.',
        points: [
          'Раздел «Рекурсия» полностью освоен: изучены база, шаг, стек вызовов и разбор структур.',
          'Рекуррентные соотношения переводятся в код через условные операторы if-else.',
          'Трассировка снизу вверх — главный инструмент проверки алгоритмов на СОР.',
          'Код написан, протестирован в Python IDLE и готов к сдаче на максимальный балл.'
        ],
        criteriaTitle: 'Дескриптор практики · 10 баллов',
        criteria: [
          { mark: '1 балл', text: 'Задание 1: Задано базовое значение F(1) для кусочной функции.' },
          { mark: '1 балл', text: 'Задание 1: Оформлено ветвление четных и нечетных аргументов через if-else.' },
          { mark: '1 балл', text: 'Задание 1: Функция возвращает точное расчетное значение на контрольном тесте.' },
          { mark: '1 балл', text: 'Задание 2: Реализован механизм учета каждого вызова рекурсивной функции.' },
          { mark: '1 балл', text: 'Задание 2: Счетчик корректно обрабатывает все базовые и ветвящиеся шаги.' },
          { mark: '1 балл', text: 'Задание 2: Программа выводит точное общее количество вызовов в консоль IDLE.' },
          { mark: '1 балл', text: 'Задание 3: Реализованы все три базовых случая для ряда Трибоначчи.' },
          { mark: '1 балл', text: 'Задание 3: Описан рекурсивный шаг сложения трех предшествующих элементов.' },
          { mark: '1 балл', text: 'Задание 3: Функция возвращает верное число последовательности Трибоначчи.' },
          { mark: '1 балл', text: 'Задание 3: Проведено комплексное тестирование и отладка всех программ в IDLE.' }
        ],
        ticketTitle: 'Выходной билет',
        ticketLead: 'Ответь устно или в тетради:',
        ticket: [
          'Какие темы раздела рекурсии оказались для тебя наиболее понятными?',
          'Как избежать ошибок при расчете рекуррентных соотношений на СОР?',
          'Чувствуешь ли ты готовность к суммативному оцениванию?'
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
        eyebrow: '10 ЕМН · 2 ЧЕТВЕРТЬ · УРОК 9',
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
        eyebrow: '10 ЕМН · 2 ЧЕТВЕРТЬ · УРОК 10',
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
        eyebrow: '10 ЕМН · 2 ЧЕТВЕРТЬ · УРОК 11',
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
        eyebrow: '10 ЕМН · 2 ЧЕТВЕРТЬ · УРОК 12',
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
        eyebrow: '10 ЕМН · 2 ЧЕТВЕРТЬ · УРОК 13',
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
        eyebrow: '10 ЕМН · 2 ЧЕТВЕРТЬ · УРОК 14',
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
        eyebrow: '10 ЕМН · 2 ЧЕТВЕРТЬ · УРОК 15',
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
        eyebrow: '10 ЕМН · 2 ЧЕТВЕРТЬ · УРОК 16',
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
