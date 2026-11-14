/* ==========================================================================
   9 КЛАСС · 2 ЧЕТВЕРТЬ — ЛОГИЧЕСКИЕ ОСНОВЫ
   Данные уроков. Логика объясняется через лампочки и выключатели.
   ========================================================================== */
(function () {
  'use strict';

  /* --- повторяющиеся SVG-схемы --- */
  const SERIES_SVG = `<svg viewBox="0 0 460 250" role="img" aria-label="Последовательное соединение: два выключателя в одной цепи">
    <defs>
      <radialGradient id="q9-glow-a"><stop offset="0" stop-color="#fde68a" stop-opacity=".9"/><stop offset="1" stop-color="#fbbf24" stop-opacity="0"/></radialGradient>
    </defs>
    <path class="q2-scene-wire" d="M40 90 H 110" fill="none"/>
    <g transform="translate(110 66)">
      <rect class="q2-sw-track" width="86" height="44" rx="22"/>
      <circle class="q2-sw-knob is-on" cx="66" cy="22" r="15"/>
      <text class="q2-sw-value" x="66" y="27">1</text>
      <text class="q2-sw-name" x="43" y="66">A</text>
    </g>
    <path class="q2-scene-wire" d="M196 90 H 250" fill="none"/>
    <g transform="translate(250 66)">
      <rect class="q2-sw-track" width="86" height="44" rx="22"/>
      <circle class="q2-sw-knob" cx="20" cy="22" r="15"/>
      <text class="q2-sw-value" x="20" y="27">0</text>
      <text class="q2-sw-name" x="43" y="66">B</text>
    </g>
    <path class="q2-scene-wire" d="M336 90 H 400 V 150" fill="none"/>
    <path class="q2-scene-wire" d="M40 90 V 150 H 330" fill="none"/>
    <circle cx="365" cy="188" r="40" fill="url(#q9-glow-a)" opacity="0"/>
    <circle cx="365" cy="188" r="26" fill="#e2e8f0" stroke="#94a3b8" stroke-width="2.5"/>
    <path d="M357 196l5-11 4 8 4-8 5 11" fill="none" stroke="#94a3b8" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
    <text x="365" y="240" text-anchor="middle" font-size="12" font-weight="700" fill="#748097">лампа не горит</text>
    <text x="230" y="36" text-anchor="middle" font-size="12" font-weight="800" fill="#536dfe" letter-spacing="0.06em">ПОСЛЕДОВАТЕЛЬНО · И</text>
    <text x="230" y="222" text-anchor="middle" font-size="12" font-weight="600" fill="#748097">ток должен пройти через оба выключателя</text>
  </svg>`;

  const PARALLEL_SVG = `<svg viewBox="0 0 460 250" role="img" aria-label="Параллельное соединение: две ветви с выключателями">
    <defs>
      <radialGradient id="q9-glow-b"><stop offset="0" stop-color="#fde68a" stop-opacity=".95"/><stop offset="1" stop-color="#fbbf24" stop-opacity="0"/></radialGradient>
    </defs>
    <path class="q2-scene-wire" d="M40 125 H 96" fill="none"/>
    <path class="q2-scene-wire" d="M96 125 V 74 H 150" fill="none"/>
    <path class="q2-scene-wire" d="M96 125 V 176 H 150" fill="none"/>
    <g transform="translate(150 52)">
      <rect class="q2-sw-track is-on" width="80" height="40" rx="20"/>
      <circle class="q2-sw-knob is-on" cx="60" cy="20" r="14"/>
      <text class="q2-sw-value" x="60" y="25">1</text>
      <text class="q2-sw-name" x="40" y="60">A</text>
    </g>
    <g transform="translate(150 156)">
      <rect class="q2-sw-track" width="80" height="40" rx="20"/>
      <circle class="q2-sw-knob" cx="20" cy="20" r="14"/>
      <text class="q2-sw-value" x="20" y="25">0</text>
      <text class="q2-sw-name" x="40" y="60">B</text>
    </g>
    <path class="q2-scene-wire" d="M230 72 H 288 V 125" fill="none"/>
    <path class="q2-scene-wire" d="M230 176 H 288 V 125" fill="none"/>
    <path class="q2-scene-wire" d="M288 125 H 340" fill="none"/>
    <circle cx="370" cy="125" r="46" fill="url(#q9-glow-b)"/>
    <circle cx="370" cy="125" r="26" fill="#fde68a" stroke="#d97706" stroke-width="2.5"/>
    <path d="M362 133l5-11 4 8 4-8 5 11" fill="none" stroke="#b45309" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
    <text x="370" y="182" text-anchor="middle" font-size="12" font-weight="700" fill="#b45309">лампа горит</text>
    <text x="230" y="24" text-anchor="middle" font-size="12" font-weight="800" fill="#536dfe" letter-spacing="0.06em">ПАРАЛЛЕЛЬНО · ИЛИ</text>
    <text x="230" y="232" text-anchor="middle" font-size="12" font-weight="600" fill="#748097">достаточно одной замкнутой ветви</text>
  </svg>`;

  const XOR_SVG = `<svg viewBox="0 0 460 240" role="img" aria-label="Проходной выключатель: лампа горит при разных положениях">
    <path class="q2-scene-wire" d="M40 120 H 120" fill="none"/>
    <g transform="translate(120 96)">
      <rect class="q2-sw-track is-on" width="84" height="44" rx="22"/>
      <circle class="q2-sw-knob is-on" cx="64" cy="22" r="15"/>
      <text class="q2-sw-value" x="64" y="27">1</text>
      <text class="q2-sw-name" x="42" y="66">A · 1 этаж</text>
    </g>
    <path class="q2-scene-wire" d="M204 120 H 262" fill="none"/>
    <g transform="translate(262 96)">
      <rect class="q2-sw-track is-on" width="84" height="44" rx="22"/>
      <circle class="q2-sw-knob is-on" cx="64" cy="22" r="15"/>
      <text class="q2-sw-value" x="64" y="27">1</text>
      <text class="q2-sw-name" x="42" y="66">B · 2 этаж</text>
    </g>
    <path class="q2-scene-wire" d="M346 120 H 388" fill="none"/>
    <circle cx="408" cy="120" r="24" fill="#e2e8f0" stroke="#94a3b8" stroke-width="2.5"/>
    <text x="230" y="40" text-anchor="middle" font-size="12" font-weight="800" fill="#536dfe" letter-spacing="0.06em">ПРОХОДНОЙ ВЫКЛЮЧАТЕЛЬ · XOR</text>
    <text x="230" y="196" text-anchor="middle" font-size="13" font-weight="700" fill="#475569">A = 1, B = 1 → одинаковые положения → лампа не горит</text>
    <text x="230" y="220" text-anchor="middle" font-size="13" font-weight="700" fill="#047857">A = 1, B = 0 → разные положения → лампа горит</text>
  </svg>`;

  const SEQUENCE_SVG = `<svg viewBox="0 0 460 210" role="img" aria-label="Порядок вычисления логического выражения">
    <rect x="24" y="66" width="96" height="70" rx="16" fill="rgba(83,109,254,.1)" stroke="rgba(83,109,254,.35)" stroke-width="2"/>
    <text x="72" y="98" text-anchor="middle" font-size="13" font-weight="800" fill="#3e55d8">1. Скобки</text>
    <text x="72" y="118" text-anchor="middle" font-size="11" fill="#748097">и НЕ</text>
    <path d="M120 101 H 152" stroke="#94a3b8" stroke-width="2.5" stroke-linecap="round" marker-end="url(#q9-ar)"/>
    <rect x="152" y="66" width="96" height="70" rx="16" fill="rgba(217,119,6,.1)" stroke="rgba(217,119,6,.35)" stroke-width="2"/>
    <text x="200" y="98" text-anchor="middle" font-size="13" font-weight="800" fill="#b45309">2. И</text>
    <text x="200" y="118" text-anchor="middle" font-size="11" fill="#748097">∧</text>
    <path d="M248 101 H 280" stroke="#94a3b8" stroke-width="2.5" stroke-linecap="round" marker-end="url(#q9-ar)"/>
    <rect x="280" y="66" width="96" height="70" rx="16" fill="rgba(5,150,105,.1)" stroke="rgba(5,150,105,.35)" stroke-width="2"/>
    <text x="328" y="98" text-anchor="middle" font-size="13" font-weight="800" fill="#047857">3. ИЛИ</text>
    <text x="328" y="118" text-anchor="middle" font-size="11" fill="#748097">∨</text>
    <path d="M376 101 H 408" stroke="#94a3b8" stroke-width="2.5" stroke-linecap="round" marker-end="url(#q9-ar)"/>
    <text x="426" y="106" text-anchor="middle" font-size="14" font-weight="800" fill="#263248">Y</text>
    <defs><marker id="q9-ar" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 L10 5 L0 10z" fill="#94a3b8"/></marker></defs>
    <text x="230" y="176" text-anchor="middle" font-size="12" font-weight="600" fill="#748097">сначала то, что в скобках; отрицание сильнее И и ИЛИ</text>
  </svg>`;

  const TT2_SVG = `<svg viewBox="0 0 420 280" role="img" aria-label="Таблица истинности для двух переменных: четыре строки">
    <rect x="40" y="36" width="340" height="204" rx="18" fill="rgba(255,255,255,.8)" stroke="rgba(255,255,255,.95)" stroke-width="1.5"/>
    <text x="210" y="66" text-anchor="middle" font-size="12" font-weight="800" fill="#748097" letter-spacing="0.08em">A   B   Y</text>
    <line x1="70" y1="80" x2="350" y2="80" stroke="rgba(148,163,184,.4)" stroke-width="1.5"/>
    ${[[0, 0], [0, 1], [1, 0], [1, 1]].map((row, i) => `<g>
      <rect x="70" y="${90 + i * 34}" width="280" height="26" rx="8" fill="${row[0] === 1 && row[1] === 1 ? 'rgba(5,150,105,.1)' : 'rgba(148,163,184,.07)'}"/>
      <text x="120" y="${108 + i * 34}" text-anchor="middle" font-size="14" font-weight="700" fill="#475569">${row[0]}</text>
      <text x="210" y="${108 + i * 34}" text-anchor="middle" font-size="14" font-weight="700" fill="#475569">${row[1]}</text>
      <text x="300" y="${108 + i * 34}" text-anchor="middle" font-size="14" font-weight="800" fill="#3e55d8">?</text>
    </g>`).join('')}
    <text x="210" y="264" text-anchor="middle" font-size="12" font-weight="600" fill="#748097">две переменные → 2² = 4 набора значений</text>
  </svg>`;

  const TT3_SVG = `<svg viewBox="0 0 460 322" role="img" aria-label="Восемь наборов значений для трёх переменных в трёх столбцах">
    <rect x="24" y="14" width="412" height="278" rx="18" fill="rgba(255,255,255,.84)" stroke="rgba(255,255,255,.96)" stroke-width="1.5"/>
    ${[
      { label: 'A', hint: 'по 4', x: 76, delay: 0 },
      { label: 'B', hint: 'по 2', x: 190, delay: 0.95 },
      { label: 'C', hint: 'по 1', x: 304, delay: 1.85 }
    ].map(col => `<g class="q2-tt3-anim" style="animation-delay:${col.delay}s">
      <rect x="${col.x}" y="26" width="96" height="28" rx="9" fill="rgba(83,109,254,.08)"/>
      <text x="${col.x + 34}" y="45" text-anchor="middle" font-size="13" font-weight="800" fill="#3e55d8">${col.label}</text>
      <text x="${col.x + 68}" y="44" text-anchor="middle" font-size="10.5" font-weight="700" fill="#748097">${col.hint}</text>
    </g>`).join('')}
    ${[0, 1, 2, 3, 4, 5, 6, 7].map(i => {
      const y = 64 + i * 27;
      const a = i < 4 ? 0 : 1;
      const b = Math.floor(i / 2) % 2;
      const c = i % 2;
      const delayA = (i < 4 ? 0.10 + i * 0.09 : 0.52 + (i - 4) * 0.09).toFixed(2);
      const delayB = (1.05 + Math.floor(i / 2) * 0.20 + (i % 2) * 0.08).toFixed(2);
      const delayC = (1.95 + i * 0.07).toFixed(2);
      const cell = (x, val, delay) => `<g class="q2-tt3-anim" style="animation-delay:${delay}s">
        <rect x="${x}" y="${y}" width="96" height="22" rx="7" fill="${val ? 'rgba(83,109,254,.13)' : 'rgba(148,163,184,.10)'}"/>
        <text x="${x + 48}" y="${y + 15.5}" text-anchor="middle" font-size="13" font-weight="${val ? '800' : '700'}" fill="${val ? '#3e55d8' : '#475569'}">${val}</text>
      </g>`;
      return `<text x="50" y="${y + 15}" text-anchor="middle" font-size="11" font-weight="700" fill="#94a3b8">${i + 1}</text>
        ${cell(76, a, delayA)}
        ${cell(190, b, delayB)}
        ${cell(304, c, delayC)}`;
    }).join('')}
    <text x="230" y="310" text-anchor="middle" font-size="12" font-weight="600" fill="#748097">три переменные → 2³ = 8 наборов; заполняем столбцы A → B → C</text>
  </svg>`;

  const makeLockSvg = (p, cols = 3) => {
    const reels = [
      { label: 'A', x: 20, cls: 'q2-lock-a', clip: `${p}-lock-clip-0` },
      { label: 'B', x: 128, cls: 'q2-lock-b', clip: `${p}-lock-clip-1` },
      { label: 'C', x: 236, cls: 'q2-lock-c', clip: `${p}-lock-clip-2` }
    ].slice(0, cols);
    const vbW = cols === 2 ? 232 : 340;
    return `<svg viewBox="0 0 ${vbW} 128" role="img" aria-label="3D кодовый замок из ${cols === 2 ? 'двух' : 'трёх'} барабанов">
    <defs>
      <linearGradient id="${p}-lock-drum" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="rgba(100,116,139,.44)"/>
        <stop offset="26%" stop-color="rgba(148,163,184,.10)"/>
        <stop offset="50%" stop-color="rgba(255,255,255,.32)"/>
        <stop offset="74%" stop-color="rgba(148,163,184,.10)"/>
        <stop offset="100%" stop-color="rgba(100,116,139,.46)"/>
      </linearGradient>
      <linearGradient id="${p}-lock-tile" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#ffffff"/>
        <stop offset="55%" stop-color="#f1f5f9"/>
        <stop offset="100%" stop-color="#e2e8f0"/>
      </linearGradient>
      ${reels.map(d => `<clipPath id="${d.clip}"><rect x="${d.x}" y="26" width="84" height="90" rx="8"/></clipPath>`).join('')}
    </defs>
    ${reels.map(d => `<text x="${d.x + 42}" y="18" text-anchor="middle" font-size="11.5" font-weight="800" fill="#6366f1" letter-spacing="0.08em">${d.label}</text>`).join('')}
    ${reels.map(d => `<rect x="${d.x - 4}" y="23" width="92" height="96" rx="10" fill="#d8e0ee" stroke="rgba(255,255,255,.85)" stroke-width="1.2"/>
      <g clip-path="url(#${d.clip})">
        <g class="q2-lock-reel ${d.cls}">
          ${[1, 0, 1, 0].map((val, idx) => {
            const ty = 26 + idx * 30;
            return `<rect x="${d.x}" y="${ty}" width="84" height="29" fill="url(#${p}-lock-tile)"/>
              <line x1="${d.x}" y1="${ty + 29}" x2="${d.x + 84}" y2="${ty + 29}" stroke="#cbd5e1" stroke-width="1"/>
              <text x="${d.x + 42}" y="${ty + 21}" text-anchor="middle" font-size="20" font-weight="800" fill="${val ? '#3e55d8' : '#334155'}">${val}</text>`;
          }).join('')}
        </g>
      </g>
      <rect x="${d.x}" y="26" width="84" height="90" rx="8" fill="url(#${p}-lock-drum)" pointer-events="none"/>`).join('')}
  </svg>`;
  };
  const LOCK2_HERO_SVG = makeLockSvg('hero2', 2);
  const LOCK3_HERO_SVG = makeLockSvg('hero');
  const LOCK3_SVG = makeLockSvg('s3');

  const GATES_SVG = `<svg viewBox="0 0 470 250" role="img" aria-label="Три базовых логических элемента">
    <g transform="translate(24 40)">
      <rect x="0" y="0" width="130" height="110" rx="18" fill="rgba(255,255,255,.86)" stroke="rgba(148,163,184,.3)" stroke-width="1.5"/>
      <text x="65" y="30" text-anchor="middle" font-size="12" font-weight="800" fill="#3e55d8" letter-spacing="0.06em">И</text>
      <path d="M34 48 H 54 A 22 22 0 0 1 54 92 H 34 Z" fill="rgba(83,109,254,.14)" stroke="rgba(83,109,254,.55)" stroke-width="2.5"/>
      <text x="65" y="104" text-anchor="middle" font-size="11" fill="#748097">1 только при 1 и 1</text>
    </g>
    <g transform="translate(170 40)">
      <rect x="0" y="0" width="130" height="110" rx="18" fill="rgba(255,255,255,.86)" stroke="rgba(148,163,184,.3)" stroke-width="1.5"/>
      <text x="65" y="30" text-anchor="middle" font-size="12" font-weight="800" fill="#3e55d8" letter-spacing="0.06em">ИЛИ</text>
      <path d="M36 48 Q 84 70 36 92 Q 58 70 36 48 Z" fill="rgba(83,109,254,.14)" stroke="rgba(83,109,254,.55)" stroke-width="2.5"/>
      <text x="65" y="104" text-anchor="middle" font-size="11" fill="#748097">1 при любом 1</text>
    </g>
    <g transform="translate(316 40)">
      <rect x="0" y="0" width="130" height="110" rx="18" fill="rgba(255,255,255,.86)" stroke="rgba(148,163,184,.3)" stroke-width="1.5"/>
      <text x="65" y="30" text-anchor="middle" font-size="12" font-weight="800" fill="#3e55d8" letter-spacing="0.06em">НЕ</text>
      <path d="M44 48 L 82 70 L 44 92 Z" fill="rgba(83,109,254,.14)" stroke="rgba(83,109,254,.55)" stroke-width="2.5"/>
      <circle cx="91" cy="70" r="6" fill="rgba(255,255,255,.96)" stroke="rgba(83,109,254,.55)" stroke-width="2.5"/>
      <text x="65" y="104" text-anchor="middle" font-size="11" fill="#748097">переворачивает 0 и 1</text>
    </g>
    <text x="235" y="188" text-anchor="middle" font-size="13" font-weight="700" fill="#475569">Вход — сигнал 0 или 1. Выход — результат операции.</text>
    <text x="235" y="212" text-anchor="middle" font-size="12" font-weight="600" fill="#748097">1 = «есть сигнал», 0 = «сигнала нет»</text>
  </svg>`;

  const XOR_GATE_SVG = `<svg viewBox="0 0 470 230" role="img" aria-label="Схема XOR и цепочка из двух элементов">
    <g transform="translate(30 40)">
      <text x="70" y="20" text-anchor="middle" font-size="12" font-weight="800" fill="#3e55d8">XOR</text>
      <path d="M40 44 Q 96 74 40 104 Q 68 74 40 44 Z" fill="rgba(83,109,254,.14)" stroke="rgba(83,109,254,.55)" stroke-width="2.5"/>
      <path d="M30 44 Q 86 74 30 104" fill="none" stroke="rgba(83,109,254,.55)" stroke-width="2.5"/>
      <text x="70" y="132" text-anchor="middle" font-size="11" fill="#748097">1 при разных входах</text>
    </g>
    <g transform="translate(220 26)">
      <text x="120" y="16" text-anchor="middle" font-size="12" font-weight="800" fill="#3e55d8">ЦЕПОЧКА: A И B → НЕ</text>
      <line x1="10" y1="52" x2="54" y2="52" stroke="#94a3b8" stroke-width="2.5" stroke-linecap="round"/>
      <line x1="10" y1="88" x2="54" y2="88" stroke="#94a3b8" stroke-width="2.5" stroke-linecap="round"/>
      <path d="M54 34 H 70 A 22 22 0 0 1 70 106 H 54 Z" fill="rgba(83,109,254,.12)" stroke="rgba(83,109,254,.5)" stroke-width="2.5"/>
      <line x1="92" y1="70" x2="118" y2="70" stroke="#94a3b8" stroke-width="2.5"/>
      <text x="105" y="58" text-anchor="middle" font-size="10" fill="#748097">S1</text>
      <path d="M118 48 L 152 70 L 118 92 Z" fill="rgba(83,109,254,.12)" stroke="rgba(83,109,254,.5)" stroke-width="2.5"/>
      <circle cx="160" cy="70" r="6" fill="rgba(255,255,255,.96)" stroke="rgba(83,109,254,.5)" stroke-width="2.5"/>
      <line x1="166" y1="70" x2="200" y2="70" stroke="#94a3b8" stroke-width="2.5"/>
      <text x="210" y="74" text-anchor="middle" font-size="12" font-weight="800" fill="#263248">Y</text>
      <text x="120" y="140" text-anchor="middle" font-size="11" fill="#748097">сначала И, затем НЕ для всего результата</text>
    </g>
  </svg>`;

  const BUILD_SVG = `<svg viewBox="0 0 480 250" role="img" aria-label="Как из выражения получается схема">
    <rect x="20" y="30" width="180" height="60" rx="14" fill="rgba(83,109,254,.09)" stroke="rgba(83,109,254,.28)" stroke-width="1.5"/>
    <text x="110" y="56" text-anchor="middle" font-size="13" font-weight="700" fill="#3e55d8">A ∧ ¬B</text>
    <text x="110" y="76" text-anchor="middle" font-size="11" fill="#748097">выражение</text>
    <path d="M200 60 H 250" stroke="#94a3b8" stroke-width="2.5" marker-end="url(#q9-ar2)"/>
    <defs><marker id="q9-ar2" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 L10 5 L0 10z" fill="#94a3b8"/></marker></defs>
    <rect x="250" y="30" width="200" height="60" rx="14" fill="rgba(217,119,6,.08)" stroke="rgba(217,119,6,.3)" stroke-width="1.5"/>
    <text x="350" y="56" text-anchor="middle" font-size="13" font-weight="700" fill="#b45309">1. ¬B</text>
    <text x="350" y="76" text-anchor="middle" font-size="11" fill="#748097">сначала отрицание</text>
    <rect x="250" y="110" width="200" height="60" rx="14" fill="rgba(5,150,105,.08)" stroke="rgba(5,150,105,.3)" stroke-width="1.5"/>
    <text x="350" y="136" text-anchor="middle" font-size="13" font-weight="700" fill="#047857">2. A ∧ (результат)</text>
    <text x="350" y="156" text-anchor="middle" font-size="11" fill="#748097">затем И с A</text>
    <path d="M350 90 V 108" stroke="#94a3b8" stroke-width="2.5" marker-end="url(#q9-ar2)"/>
    <rect x="20" y="110" width="180" height="60" rx="14" fill="rgba(148,163,184,.09)" stroke="rgba(148,163,184,.3)" stroke-width="1.5"/>
    <text x="110" y="136" text-anchor="middle" font-size="12" font-weight="700" fill="#475569">скобки = порядок сборки</text>
    <text x="110" y="156" text-anchor="middle" font-size="11" fill="#748097">действие в скобках первым</text>
    <text x="240" y="212" text-anchor="middle" font-size="12" font-weight="600" fill="#748097">схема повторяет порядок действий, а не внешний вид записи</text>
  </svg>`;

  const READ_SVG = `<svg viewBox="0 0 480 250" role="img" aria-label="Как читать схему и записывать выражение">
    <line x1="24" y1="70" x2="80" y2="70" stroke="#94a3b8" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="24" y1="112" x2="80" y2="112" stroke="#94a3b8" stroke-width="2.5" stroke-linecap="round"/>
    <text x="14" y="74" font-size="12" font-weight="700" fill="#748097">A</text>
    <text x="14" y="116" font-size="12" font-weight="700" fill="#748097">B</text>
    <path d="M80 54 Q 128 91 80 128 Q 104 91 80 54 Z" fill="rgba(83,109,254,.12)" stroke="rgba(83,109,254,.5)" stroke-width="2.5"/>
    <line x1="126" y1="91" x2="168" y2="91" stroke="#94a3b8" stroke-width="2.5"/>
    <text x="147" y="80" text-anchor="middle" font-size="10" fill="#748097">S1</text>
    <path d="M168 69 L 202 91 L 168 113 Z" fill="rgba(83,109,254,.12)" stroke="rgba(83,109,254,.5)" stroke-width="2.5"/>
    <circle cx="210" cy="91" r="6" fill="rgba(255,255,255,.96)" stroke="rgba(83,109,254,.5)" stroke-width="2.5"/>
    <line x1="216" y1="91" x2="252" y2="91" stroke="#94a3b8" stroke-width="2.5"/>
    <text x="268" y="95" font-size="12" font-weight="800" fill="#263248">Y</text>
    <rect x="300" y="52" width="160" height="80" rx="14" fill="rgba(255,255,255,.85)" stroke="rgba(148,163,184,.3)" stroke-width="1.5"/>
    <text x="380" y="80" text-anchor="middle" font-size="12" font-weight="700" fill="#3e55d8">S1 = A ∨ B</text>
    <text x="380" y="104" text-anchor="middle" font-size="12" font-weight="700" fill="#047857">Y = ¬S1</text>
    <text x="380" y="122" text-anchor="middle" font-size="11" fill="#748097">= ¬(A ∨ B)</text>
    <text x="240" y="188" text-anchor="middle" font-size="13" font-weight="700" fill="#475569">Читаем от входов к выходу и подписываем каждый промежуточный сигнал.</text>
    <text x="240" y="212" text-anchor="middle" font-size="12" font-weight="600" fill="#748097">скобки появляются там, где сигнал идёт в следующий элемент целиком</text>
  </svg>`;

  /* ==========================================================================
     УРОК 1. Шесть логических операций
     ========================================================================== */
  const operationSlides = [
    ['Конъюнкция', 'A ∧ B', 'and', 'Конъюнкция (И) истинна, только если истинны оба высказывания.', 'Два выключателя соединены последовательно: лампа горит, только когда замкнуты оба.'],
    ['Дизъюнкция', 'A ∨ B', 'or', 'Дизъюнкция (ИЛИ) истинна, если истинно хотя бы одно высказывание.', 'Две параллельные ветви: достаточно замкнуть любой выключатель; при двух замкнутых лампа тоже горит.'],
    ['Инверсия', '¬A', 'not', 'Инверсия (НЕ) меняет значение на противоположное: 1 → 0, 0 → 1.', 'Представьте управление лампой с обратным правилом: при выключенном входе лампа горит, при включённом — гаснет.'],
    ['Исключающее ИЛИ', 'A ⊕ B', 'xor', 'XOR истинно, когда значения различаются; при одинаковых значениях результат равен 0.', 'Два проходных выключателя управляют лампой в коридоре: она горит, когда положения выключателей разные.'],
    ['Импликация', 'A → B', 'imp', 'Импликация читается «если A, то B». Она ложна только при A = 1 и B = 0.', 'Правило «если датчик сработал, должна загореться лампа» нарушено только тогда, когда сигнал есть, а лампа не горит.'],
    ['Эквивалентность', 'A ↔ B', 'eq', 'Эквивалентность истинна, когда значения обоих высказываний совпадают.', 'Лампа горит, если два выключателя в одинаковом состоянии: оба включены или оба выключены.']
  ].map(([name, formula, gate, definition, analogy], index) => ({
    k: 'concept', eyebrow: `${String(index + 3).padStart(2, '0')} · ${name.toUpperCase()}`,
    title: `${[
      'Конъюнкция — логическое умножение',
      'Дизъюнкция — логическая сумма',
      'Инверсия — логическое отрицание',
      'XOR — исключающее ИЛИ',
      'Импликация — логическое следование',
      'Эквивалентность — логическое равенство'
    ][index]}: <span class="accent-text">${formula}</span>`,
    lead: 'Переключайте выключатели и наблюдайте за состоянием лампы.',
    blocks: [
      { t: 'cards', cols: 2, items: [
        { icon: 'fas fa-check-circle', title: 'Определение', text: definition, footer: formula },
        { icon: 'fas fa-lightbulb', title: 'Аналогия', text: analogy }
      ] },
      { t: 'widget', kind: 'lamp', config: { gate, a: gate === 'not' ? 0 : 1, b: gate === 'and' || gate === 'eq' ? 1 : 0, gates: [gate], hint: false } },
    ]
  }));

  Q2.add('9-q2-1', {
    num: 1, cls: '9 класс', title: 'Логические операции',
    slides: [
      {
        k: 'hero', eyebrow: '9 КЛАСС · 2 ЧЕТВЕРТЬ · УРОК 1', title: '<span class="accent-text">Логические</span> операции',
        lead: 'Компьютер обрабатывает сигналы 0 и 1. Логические операции помогают ему проверять условия и получать результат.',
        goal: 'Определять истинность логических выражений с помощью операций И, ИЛИ, НЕ, XOR, импликации и эквивалентности.', goalCode: '9.2.1.1',
        chips: [{ icon: 'fas fa-quote-left', text: 'Высказывание' }, { icon: 'fas fa-check-circle', text: 'Истина / ложь · 1 / 0' }, { icon: 'fas fa-sliders', text: 'Логическая операция' }],
        visual: 'singleLamp', visualCaption: 'Обычный выключатель включает и выключает лампочку', cta: 'Начать урок'
      },
      {
        k: 'concept', eyebrow: '02 · ЛОГИЧЕСКАЯ ОСНОВА', title: 'Как компьютер работает с логикой',
        lead: 'Компьютер обрабатывает высказывания по логическим правилам.',
        blocks: [
          { t: 'cards', cols: 2, items: [
            { icon: 'fas fa-brain', title: 'Компьютерная логика', text: 'Правила, по которым компьютер обрабатывает истинные и ложные высказывания с помощью значений 1 и 0.' },
            { icon: 'fas fa-quote-left', title: 'Высказывание A, B, C…', text: 'Утверждение, которое бывает истинным (1) или ложным (0). В задачах каждое высказывание обозначают заглавной буквой. Вопросы и команды высказываниями не являются.' }
          ] },
          { t: 'steps', cls: 'q2-steps-logic', items: [{ title: 'Обозначьте', text: 'Высказывания записываем буквами A, B, C… и присваиваем им 1 или 0.' }, { title: 'Возьмите минимум два', text: 'Для решения задач с И, ИЛИ и другими бинарными операциями нужны как минимум A и B.' }, { title: 'Примените правило', text: 'Операция вычисляет результат, а таблица истинности показывает все варианты.' }] },
          { t: 'widget', kind: 'statements', config: { compact: true, items: [
            { text: '«5 больше 2»', isStatement: true, note: 'Утверждение; оно истинно.' },
            { text: '«7 — чётное число»', isStatement: true, note: 'Утверждение; оно ложно.' },
            { text: '«Открой файл»', isStatement: false, note: 'Команда не истинна и не ложна.' },
            { text: '«Который час?»', isStatement: false, note: 'Вопрос не является высказыванием.' }
          ] } }
        ]
      },
      ...operationSlides,
      {
        k: 'practice', eyebrow: '09 · ПРАКТИЧЕСКАЯ РАБОТА', title: 'Составьте конспект по логическим операциям',
        lead: 'Работайте в тетради. Конспект оценивается в 7 баллов, четыре задания — ещё в 3.',
        before: [{ t: 'callout', tone: 'good', icon: 'fas fa-pen', title: 'Конспект · 7 баллов', text: 'Запишите определения шести операций, изобразите схемы с выключателями и лампой, составьте таблицы истинности. Затем выполните 4 задания: при A = 1 и B = 0 найдите A ∧ B, A ∨ B, A ⊕ B и A → B. За задания можно получить ещё 3 балла.' }],
        tasks: [
          { title: 'И', q: 'A = 1, B = 0. Чему равно A ∧ B?', answer: '0', type: 'number', explain: 'Для И нужны две единицы.', hint: 'Один выключатель разомкнут.' },
          { title: 'ИЛИ', q: 'A = 1, B = 0. Чему равно A ∨ B?', answer: '1', type: 'number', explain: 'Для ИЛИ достаточно одной единицы.', hint: 'Хотя бы один вход равен 1.' },
          { title: 'XOR', q: 'A = 1, B = 0. Чему равно A ⊕ B?', answer: '1', type: 'number', explain: 'Значения различаются — XOR даёт 1.', hint: 'XOR истинен при разных входах.' },
          { title: 'Импликация', q: 'A = 1, B = 0. Чему равно A → B?', answer: '0', type: 'number', explain: 'Это единственный ложный случай импликации.', hint: 'Правило не выполнено: из 1 получилось 0.' }
        ],
        criteriaTitle: 'Дескриптор · 10 баллов', criteria: [
          { mark: '2 балла', text: 'Записаны определения всех шести операций.' },
          { mark: '2 балла', text: 'Нарисованы схемы с выключателями и лампой для И, ИЛИ и XOR.' },
          { mark: '3 балла', text: 'Составлены таблицы истинности для всех шести операций.' },
          { mark: '0,5 балла', text: 'Верно решено задание на конъюнкцию (И).' },
          { mark: '0,5 балла', text: 'Верно решено задание на дизъюнкцию (ИЛИ).' },
          { mark: '1 балл', text: 'Верно решено задание на XOR.' },
          { mark: '1 балл', text: 'Верно решено задание на импликацию.' }
        ]
      },
      {
        k: 'quiz', eyebrow: '10 · МИНИ-ПРОВЕРКА', title: 'Проверьте, как вы поняли операции',
        lead: 'Выберите один ответ. После каждого ответа прочитайте пояснение.',
        questions: [
          { q: 'Что такое высказывание?', options: ['Любое предложение', 'Утверждение, которое истинно или ложно', 'Вопрос', 'Команда'], answer: 1, explain: 'Высказыванию можно присвоить значение 1 или 0.' },
          { q: 'A = 1, B = 0. Чему равно A ∧ B?', options: ['0', '1', 'Не определено', 'Зависит от порядка'], answer: 0, explain: 'И истинно только при двух единицах.' },
          { q: 'A = 0. Чему равно ¬A?', options: ['0', '1', 'A', 'Не определено'], answer: 1, explain: 'НЕ меняет 0 на 1.' },
          { q: 'Когда A ⊕ B равно 1?', options: ['Когда A и B равны', 'Когда A и B различаются', 'Только при A = 1', 'Только при B = 1'], answer: 1, explain: 'XOR даёт 1, если входы разные.' },
          { q: 'Когда A → B ложно?', options: ['A = 0, B = 0', 'A = 0, B = 1', 'A = 1, B = 0', 'A = 1, B = 1'], answer: 2, explain: 'Импликация ложна только при A = 1 и B = 0.' },
          { q: 'Когда A ↔ B истинно?', options: ['Только при A = 1', 'Только при B = 1', 'Когда значения совпадают', 'Когда значения различаются'], answer: 2, explain: 'Эквивалентность истинна при 00 и 11.' }
        ]
      },
      {
        k: 'summary', eyebrow: '11 · ИТОГИ УРОКА', title: 'Шесть операций — шесть правил',
        points: [
          'Компьютерная логика обрабатывает высказывания со значениями 0 и 1.',
          'И истинно при двух единицах; ИЛИ — если есть хотя бы одна единица.',
          'НЕ меняет значение; XOR истинен при разных входах.',
          'Импликация ложна только для 1 → 0; эквивалентность истинна при совпадении.'
        ],
        ticket: ['Объясните, чем ИЛИ отличается от XOR.', 'Приведите пример высказывания и укажите его значение.', 'Назовите единственный ложный набор для импликации.'],
        criteriaTitle: 'Дескриптор усвоения темы · 10 баллов', criteria: [
          { mark: '2 балла', text: 'Записаны определения всех шести операций.' },
          { mark: '2 балла', text: 'Нарисованы схемы с выключателями и лампой для И, ИЛИ и XOR.' },
          { mark: '3 балла', text: 'Составлены таблицы истинности для всех шести операций.' },
          { mark: '0,5 балла', text: 'Верно решено задание на конъюнкцию (И).' },
          { mark: '0,5 балла', text: 'Верно решено задание на дизъюнкцию (ИЛИ).' },
          { mark: '1 балл', text: 'Верно решено задание на XOR.' },
          { mark: '1 балл', text: 'Верно решено задание на импликацию.' }
        ]
      }
    ]
  });
  /* ==========================================================================
     УРОК 2. Таблица истинности с двумя переменными
     ========================================================================== */
  const TRUTH_TABLE_CRITERIA = [
    { mark: '1 балл', text: 'Во всех трёх заданиях записаны четыре набора: 00, 01, 10, 11.' },
    { mark: '2 балла', text: 'Задание 1: верны промежуточные столбцы — 1 балл; итоговый столбец — 1 балл.' },
    { mark: '3 балла', text: 'Задание 2: верен порядок действий — 1 балл; промежуточные столбцы — 1 балл; итог — 1 балл.' },
    { mark: '4 балла', text: 'Задание 3: верен порядок действий — 1 балл; промежуточные столбцы — 2 балла (1 балл, если допущена одна ошибка); итог — 1 балл.' }
  ];

  const TRUTH_TABLE_3VAR_CRITERIA = [
    { mark: '1 балл', text: 'Во всех трёх заданиях записаны восемь наборов: от 000 до 111.' },
    TRUTH_TABLE_CRITERIA[1],
    TRUTH_TABLE_CRITERIA[2],
    TRUTH_TABLE_CRITERIA[3]
  ];

  Q2.add('9-q2-2', {
    num: 2,
    cls: '9 класс',
    title: 'Построение таблиц истинности',
    slides: [
      {
        k: 'hero',
        eyebrow: '9 КЛАСС · 2 ЧЕТВЕРТЬ · УРОК 2',
        title: 'Построение <span class="accent-text">таблиц истинности</span>',
        lead: 'Одно выражение может вести себя по-разному при разных входах. Чтобы ничего не забыть, логики перебирают все наборы значений и записывают результат в таблицу.',
        goal: 'Строить таблицы истинности для заданного логического выражения.',
        goalCode: '9.2.1.2',
        chips: [
          { icon: 'fas fa-table-cells', text: 'Четыре набора' },
          { icon: 'fas fa-list-ol', text: 'Порядок строк' },
          { icon: 'fas fa-calculator', text: 'Промежуточные столбцы' }
        ],
        visual: LOCK2_HERO_SVG,
        visualCaption: 'Четыре строки — четыре возможных состояния двух выключателей',
        cta: 'Построить первую таблицу'
      },
      {
        k: 'review',
        title: 'Проверяем основу перед таблицей',
        lead: 'Варианты ответов перемешиваются при каждом открытии урока — буква ответа больше не подсказывает, думать придётся по-настоящему.',
        shuffleOptions: true,
        questions: [
          { q: 'Какое предложение является высказыванием?', options: ['Сколько тебе лет?', '7 — нечётное число', 'Закрой окно', 'Какая красивая погода'], answer: 1, explain: 'Только утверждение можно проверить: 7 действительно нечётное.' },
          { q: 'A = 1, B = 1. Чему равно A ∧ B?', options: ['0', '1', 'Зависит от порядка', 'Не определено'], answer: 1, explain: 'Последовательная цепь замкнута с двух сторон — ток идёт.' },
          { q: 'A = 0, B = 0. Чему равно A ∨ B?', options: ['1', '0', 'Зависит от A', 'Не определено'], answer: 1, explain: 'Обе ветви разомкнуты, лампа не горит.' },
          { q: 'A = 1, B = 1. Чему равно A ⊕ B?', options: ['1', '0', 'Равно A', 'Равно B'], answer: 1, explain: 'XOR даёт 0 при одинаковых значениях — это его главное отличие от ИЛИ.' },
          { q: 'A = 0, B = 1. Чему равно A → B?', options: ['0', '1', 'Не определено', 'Равно A'], answer: 1, explain: 'Импликация ложна только при A = 1, B = 0. Здесь правило не нарушено.' }
        ]
      },
      {
        k: 'concept',
        eyebrow: '03 · ПОРЯДОК ПОСТРОЕНИЯ',
        title: 'Как разобрать сложное выражение',
        lead: 'Сначала определяем порядок действий, затем заполняем таблицу по одному столбцу. Черта сверху означает НЕ: она относится ко всему выражению под ней.',
        blocks: [
          { t: 'widget', kind: 'expressionOrder' }
        ]
      },
      {
        k: 'lab',
        eyebrow: '04 · ПРАКТИКА В ТЕТРАДИ',
        title: 'Практическая работа в тетради',
        widget: {
          kind: 'truthNotebook',
          config: {}
        },
        after: [
          { t: 'rubric', title: 'Дескриптор · 10 баллов', items: TRUTH_TABLE_CRITERIA }
        ]
      },
      {
        k: 'quiz',
        eyebrow: '05 · ПРОВЕРКА',
        questions: [
          { q: 'Сколько строк в таблице истинности для двух переменных?', options: ['2', '3', '4', '8'], answer: 2, explain: 'Каждая переменная даёт два значения, поэтому 2² = 4 набора.' },
          { q: 'В каком порядке удобно перебирать наборы A и B?', options: ['00, 11, 01, 10', '00, 01, 10, 11', '11, 10, 01, 00', 'Только 00 и 11'], answer: 1, explain: 'Последовательный порядок помогает не потерять наборы.' },
          { q: 'Что вычисляют первым в выражении A ∧ ¬B?', options: ['A ∧ B', '¬B', 'A ∨ B', 'Ничего, порядок не важен'], answer: 1, explain: 'Отрицание выполняется раньше конъюнкции.' },
          { q: 'A = 1, B = 1. Чему равно A ∧ ¬B?', options: ['1', '0', 'Не определено', 'Равно B'], answer: 1, explain: '¬B = 0, поэтому A ∧ 0 = 0.' },
          { q: 'Чем таблица A ∨ B отличается от A ⊕ B?', options: ['Только в строке 11', 'Только в строке 00', 'Они полностью совпадают', 'В строках 01 и 10'], answer: 0, explain: 'При A = 1, B = 1 ИЛИ даёт 1, а XOR — 0.' }
        ]
      },
      {
        k: 'summary',
        eyebrow: '06 · ИТОГИ',
        points: [
          'Таблица истинности перебирает все возможные наборы входов.',
          'Для двух переменных наборов ровно четыре: 00, 01, 10, 11.',
          'Промежуточные столбцы считаются раньше итогового.',
          'Скобки и отрицание меняют порядок вычисления и результат.',
          'Таблица показывает смысл выражения: где оно истинно, а где ложно.'
        ],
        ticket: [
          'Таблица истинности нужна, чтобы ...',
          'Я заполняю строки в порядке ..., потому что ...',
          'Если забыть про скобки, то ...'
        ],
        criteriaTitle: 'Дескриптор практики · 10 баллов',
        criteria: TRUTH_TABLE_CRITERIA
      }
    ]
  });

  /* ==========================================================================
     УРОК 3. Таблица истинности с тремя переменными
     ========================================================================== */
  Q2.add('9-q2-3', {
    num: 3,
    cls: '9 класс',
    title: 'Построение таблиц истинности',
    slides: [
      {
        k: 'hero',
        eyebrow: '9 КЛАСС · 2 ЧЕТВЕРТЬ · УРОК 3',
        title: 'Построение <span class="accent-text">таблиц истинности</span>',
        lead: 'Добавили ещё один выключатель — и число вариантов удвоилось. Теперь таблица длиннее, а ошибку заметить труднее. Значит, нужен строгий порядок заполнения.',
        goal: 'Строить таблицы истинности для заданного логического выражения.',
        goalCode: '9.2.1.2',
        chips: [
          { icon: 'fas fa-table-cells-large', text: 'Восемь наборов' },
          { icon: 'fas fa-layer-group', text: 'Блоки по четыре' }
        ],
        visual: LOCK3_HERO_SVG,
        visualCaption: 'Три переменные дают 2³ = 8 строк',
        cta: 'Разложить по блокам'
      },
      {
        k: 'review',
        shuffleOptions: true,
        questions: [
          {
            q: 'Сколько строк содержит таблица истинности для двух логических переменных?',
            options: ['2 строки', '6 строк', '4 строки', '8 строк'],
            answer: 2,
            explain: 'Для двух переменных число наборов равно <code>2² = 4</code>.'
          },
          {
            q: 'Какой двоичный набор в таблице истинности идёт сразу после <code>01</code>?',
            options: ['10', '00', '11', '01'],
            answer: 0,
            explain: 'Наборы перечисляются в порядке возрастания двоичных чисел: 00, 01, 10, 11.'
          },
          {
            q: 'Какая операция выполняется первой в выражении <code>¬A ∨ B</code>?',
            options: ['Логическое ИЛИ (∨)', 'Следование (→)', 'Порядок не важен', 'Отрицание (¬A)'],
            answer: 3,
            explain: 'Отрицание (НЕ) имеет наивысший приоритет среди базовых логических операций.'
          },
          {
            q: 'При <code>A = 1</code> и <code>B = 1</code> чему равно выражение <code>A ∧ ¬B</code>?',
            options: ['1', '0', 'Равно A', 'Не определено'],
            answer: 1,
            explain: 'Сначала <code>¬B = ¬1 = 0</code>, затем <code>1 ∧ 0 = 0</code>.'
          },
          {
            q: 'При каких значениях <code>A</code> и <code>B</code> выражение <code>¬A ∨ B</code> ложно (равно 0)?',
            options: ['A = 0, B = 0', 'A = 0, B = 1', 'A = 1, B = 0', 'A = 1, B = 1'],
            answer: 2,
            explain: 'Дизъюнкция ложна только когда оба слагаемых равны 0: <code>¬1 = 0</code> и <code>B = 0</code>.'
          }
        ]
      },
      {
        k: 'concept',
        eyebrow: '03 · ВОСЕМЬ НАБОРОВ',
        title: 'Три высказывания — 8 наборов',
        lead: 'В реальных задачах решение редко зависит от одного условия: например, вход в аккаунт проверяет пароль (A), код из SMS (B) и статус блокировки (C). Чем больше высказываний, тем больше комбинаций нужно учесть в таблице.',
        blocks: [
          {
            t: 'split',
            left: [
              { t: 'svg', svg: TT3_SVG }
            ],
            right: [
              { t: 'svg', svg: LOCK3_SVG, compact: true, resettable: true },
              {
                t: 'steps',
                items: [
                  { title: 'Столбец A', text: 'Первые четыре строки — <code>A = 0</code>, последние четыре — <code>A = 1</code>. Ровно половина и половина.' },
                  { title: 'Столбец B', text: 'Внутри каждой половины: две строки <code>0</code>, две строки <code>1</code>. Блоки по два.' },
                  { title: 'Столбец C', text: 'Меняется в каждой строке: <code>0, 1, 0, 1, 0, 1, 0, 1</code>.' }
                ]
              }
            ]
          },
          {
            t: 'callout',
            icon: 'fas fa-lightbulb',
            title: 'Правило удвоения',
            text: 'Каждая новая переменная удваивает число строк: 1 переменная — <code>2</code> строки, 2 — <code>4</code>, 3 — <code>8</code>, 4 — <code>16</code>. Формула простая: <code>2ⁿ</code>, где <code>n</code> — число переменных.'
          }
        ]
      },
      {
        k: 'lab',
        eyebrow: '04 · ПОРЯДОК ДЕЙСТВИЙ',
        title: 'Разбор примера: (A ∧ B) ∨ (¬B ∧ C)',
        lead: 'Чтобы не ошибиться в выражении с тремя переменными, выполняем действия по этапам: сначала скобки, затем итоговую операцию.',
        widget: {
          kind: 'expressionOrder',
          config: { vars: 3 }
        }
      },
      {
        k: 'lab',
        eyebrow: '05 · ПРАКТИКА В ТЕТРАДИ',
        title: 'Практическая работа в тетради',
        widget: {
          kind: 'truthNotebook',
          config: { vars: 3 }
        },
        after: [
          { t: 'rubric', title: 'Дескриптор · 10 баллов', items: TRUTH_TABLE_3VAR_CRITERIA }
        ]
      },
      {
        k: 'quiz',
        eyebrow: '07 · ПРОВЕРКА',
        questions: [
          {
            q: 'Сколько наборов значений нужно перебрать для трёх логических переменных?',
            options: ['3 набора', '6 наборов', '8 наборов', '9 наборов'],
            answer: 2,
            explain: 'По формуле <code>2ⁿ</code> при <code>n = 3</code> получаем <code>2³ = 8</code> наборов.'
          },
          {
            q: 'Как правильно заполнить первый столбец <code>A</code> в таблице из восьми строк?',
            options: ['Чередовать 0 и 1 в каждой строке', 'Записать только единицы', 'Заполнить случайным образом', 'Четыре нуля подряд, затем четыре единицы'],
            answer: 3,
            explain: 'Первый столбец делится ровно пополам: 4 нуля, затем 4 единицы.'
          },
          {
            q: 'Какой порядок действий задают скобки в выражении <code>(A ∨ B) ∧ C</code>?',
            options: ['Сначала И, затем ИЛИ', 'Сначала ИЛИ, затем И', 'Операции выполняются справа налево', 'Скобки не влияют на порядок'],
            answer: 1,
            explain: 'Действие внутри скобок (ИЛИ) всегда выполняется раньше внешнего И.'
          },
          {
            q: 'При <code>A = 1, B = 1, C = 0</code> чему равно выражение <code>(A ∧ B) ∨ C</code>?',
            options: ['1', '0', 'Равно C', 'Не определено'],
            answer: 0,
            explain: '<code>A ∧ B = 1 ∧ 1 = 1</code>, затем <code>1 ∨ 0 = 1</code>.'
          },
          {
            q: 'Какое тождество верно выражает закон де Моргана для отрицания конъюнкции?',
            options: ['¬(A ∧ B) = ¬A ∧ ¬B', '¬(A ∧ B) = A ∨ B', '¬(A ∧ B) = ¬A ∨ ¬B', '¬(A ∧ B) = ¬A → ¬B'],
            answer: 2,
            explain: 'Отрицание И превращается в ИЛИ отрицаний: <code>¬(A ∧ B) = ¬A ∨ ¬B</code>.'
          }
        ]
      },
      {
        k: 'summary',
        eyebrow: '08 · ИТОГИ УРОКА',
        title: 'Подведём итоги урока',
        lead: 'Мы научились безошибочно строить таблицы истинности для трёх переменных, учитывать приоритет скобок и проверять логические законы.',
        points: [
          'Три переменные дают 2³ = 8 наборов; число строк удваивается с каждой новой переменной.',
          'Столбцы входов заполняются блоками: A — по четыре, B — по два, C — через строку.',
          'Промежуточные столбцы защищают от ошибок в длинных логических выражениях.',
          'Разные записи могут давать одинаковый столбец — это равносильные выражения.',
          'Законы де Моргана: ¬(A ∨ B) = ¬A ∧ ¬B и ¬(A ∧ B) = ¬A ∨ ¬B.'
        ],
        ticketTitle: 'Рефлексия · Выходной билет',
        ticketLead: 'Ответьте устно или закончите фразы в тетради:',
        ticket: [
          'Восемь строк входов удобно заполнять блоками так: ...',
          'Скобки и промежуточные столбцы в выражении нужны, чтобы ...',
          'Закон де Моргана я объясню на примере ...'
        ],
        criteriaTitle: 'Дескрипторы урока · 10 баллов',
        criteria: TRUTH_TABLE_3VAR_CRITERIA
      }
    ]
  });

  /* ==========================================================================
     УРОК 4. Логические элементы И, ИЛИ, НЕ
     ========================================================================== */
  const GATES3_HERO_SVG = `<svg viewBox="0 0 360 220" role="img" aria-label="Три базовых логических элемента: И, ИЛИ, НЕ">
    <rect x="16" y="16" width="154" height="86" rx="14" fill="#ffffff" stroke="#e2e8f0" stroke-width="1.5"/>
    <text x="93" y="38" text-anchor="middle" font-size="12" font-weight="800" fill="#5b21b6">И (AND)</text>
    <line x1="34" y1="58" x2="62" y2="58" stroke="#8b5cf6" stroke-width="2" class="q2-hero-wire-anim"/>
    <line x1="34" y1="76" x2="62" y2="76" stroke="#8b5cf6" stroke-width="2" class="q2-hero-wire-anim"/>
    <path d="M62 48 H84 A19 19 0 0 1 84 86 H62 Z" fill="#f5f3ff" stroke="#7c3aed" stroke-width="2"/>
    <line x1="103" y1="67" x2="148" y2="67" stroke="#7c3aed" stroke-width="2" class="q2-hero-wire-anim"/>
    <text x="128" y="60" font-size="11" font-weight="700" fill="#64748b">A ∧ B</text>

    <rect x="190" y="16" width="154" height="86" rx="14" fill="#ffffff" stroke="#e2e8f0" stroke-width="1.5"/>
    <text x="267" y="38" text-anchor="middle" font-size="12" font-weight="800" fill="#0e7490">ИЛИ (OR)</text>
    <line x1="208" y1="58" x2="238" y2="58" stroke="#06b6d4" stroke-width="2" class="q2-hero-wire-anim"/>
    <line x1="208" y1="76" x2="238" y2="76" stroke="#06b6d4" stroke-width="2" class="q2-hero-wire-anim"/>
    <path d="M234 48 Q244 67 234 86 Q262 86 278 67 Q262 48 234 48 Z" fill="#ecfeff" stroke="#0891b2" stroke-width="2"/>
    <line x1="278" y1="67" x2="322" y2="67" stroke="#0891b2" stroke-width="2" class="q2-hero-wire-anim"/>
    <text x="302" y="60" font-size="11" font-weight="700" fill="#64748b">A ∨ B</text>

    <rect x="103" y="118" width="154" height="86" rx="14" fill="#ffffff" stroke="#e2e8f0" stroke-width="1.5"/>
    <text x="180" y="140" text-anchor="middle" font-size="12" font-weight="800" fill="#b45309">НЕ (NOT)</text>
    <line x1="122" y1="168" x2="152" y2="168" stroke="#f59e0b" stroke-width="2" class="q2-hero-wire-anim"/>
    <polygon points="152,150 152,186 184,168" fill="#fffbeb" stroke="#d97706" stroke-width="2"/>
    <circle cx="189" cy="168" r="4.5" fill="#fffbeb" stroke="#d97706" stroke-width="2"/>
    <line x1="194" y1="168" x2="236" y2="168" stroke="#d97706" stroke-width="2" class="q2-hero-wire-anim"/>
    <text x="215" y="160" font-size="11" font-weight="700" fill="#64748b">¬A</text>
  </svg>`;

  const CIRCUIT_EXAMPLE_SVG = `<svg viewBox="0 0 560 150" role="img" aria-label="Пример построения схемы для выражения A ∧ ¬B">
    <rect x="10" y="10" width="540" height="130" rx="14" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1.5"/>
    <text x="280" y="34" text-anchor="middle" font-size="13" font-weight="800" fill="#334155">Выражение: A ∧ ¬B → сначала НЕ для B, затем И</text>
    <rect x="34" y="50" width="44" height="30" rx="8" fill="#ffffff" stroke="#94a3b8" stroke-width="1.5"/>
    <text x="56" y="70" text-anchor="middle" font-size="13" font-weight="800" fill="#1e293b">A</text>
    <rect x="34" y="96" width="44" height="30" rx="8" fill="#ffffff" stroke="#94a3b8" stroke-width="1.5"/>
    <text x="56" y="116" text-anchor="middle" font-size="13" font-weight="800" fill="#1e293b">B</text>
    <line x1="78" y1="65" x2="310" y2="65" stroke="#6366f1" stroke-width="2.2"/>
    <line x1="78" y1="111" x2="154" y2="111" stroke="#f59e0b" stroke-width="2.2"/>
    <rect x="154" y="92" width="66" height="36" rx="10" fill="#fffbeb" stroke="#f59e0b" stroke-width="2"/>
    <text x="187" y="115" text-anchor="middle" font-size="13" font-weight="800" fill="#b45309">НЕ</text>
    <path d="M220 110 C260 110, 270 84, 310 84" fill="none" stroke="#6366f1" stroke-width="2.2"/>
    <rect x="310" y="54" width="74" height="42" rx="10" fill="#f5f3ff" stroke="#8b5cf6" stroke-width="2"/>
    <text x="347" y="80" text-anchor="middle" font-size="13" font-weight="800" fill="#5b21b6">И</text>
    <line x1="384" y1="75" x2="470" y2="75" stroke="#6366f1" stroke-width="2.2"/>
    <rect x="470" y="60" width="44" height="30" rx="8" fill="#ffffff" stroke="#94a3b8" stroke-width="1.5"/>
    <text x="492" y="80" text-anchor="middle" font-size="13" font-weight="800" fill="#1e293b">Y</text>
  </svg>`;

  const CIRCUIT_TWO_EXAMPLES_SVG = `<svg viewBox="0 0 560 250" role="img" aria-label="Два примера схем по двум высказываниям">
    <rect x="10" y="8" width="540" height="110" rx="14" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1.5"/>
    <text x="280" y="28" text-anchor="middle" font-size="12.5" font-weight="800" fill="#334155">Пример 1: ¬(A ∨ B) — сначала ИЛИ, затем НЕ</text>
    <rect x="32" y="42" width="40" height="26" rx="7" fill="#ffffff" stroke="#94a3b8" stroke-width="1.5"/><text x="52" y="59" text-anchor="middle" font-size="12" font-weight="800">A</text>
    <rect x="32" y="78" width="40" height="26" rx="7" fill="#ffffff" stroke="#94a3b8" stroke-width="1.5"/><text x="52" y="95" text-anchor="middle" font-size="12" font-weight="800">B</text>
    <path d="M72 55 C110 55, 115 64, 155 64" fill="none" stroke="#06b6d4" stroke-width="2"/>
    <path d="M72 91 C110 91, 115 80, 155 80" fill="none" stroke="#06b6d4" stroke-width="2"/>
    <rect x="155" y="52" width="72" height="38" rx="9" fill="#ecfeff" stroke="#06b6d4" stroke-width="2"/><text x="191" y="76" text-anchor="middle" font-size="12.5" font-weight="800" fill="#0e7490">ИЛИ</text>
    <line x1="227" y1="71" x2="305" y2="71" stroke="#f59e0b" stroke-width="2"/>
    <rect x="305" y="52" width="66" height="38" rx="9" fill="#fffbeb" stroke="#f59e0b" stroke-width="2"/><text x="338" y="76" text-anchor="middle" font-size="12.5" font-weight="800" fill="#b45309">НЕ</text>
    <line x1="371" y1="71" x2="476" y2="71" stroke="#6366f1" stroke-width="2"/>
    <rect x="476" y="58" width="40" height="26" rx="7" fill="#ffffff" stroke="#94a3b8" stroke-width="1.5"/><text x="496" y="75" text-anchor="middle" font-size="12" font-weight="800">Y</text>

    <rect x="10" y="130" width="540" height="112" rx="14" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1.5"/>
    <text x="280" y="150" text-anchor="middle" font-size="12.5" font-weight="800" fill="#334155">Пример 2: (A ∨ B) ∧ ¬A — параллельно ИЛИ и НЕ, затем И</text>
    <rect x="32" y="164" width="40" height="26" rx="7" fill="#ffffff" stroke="#94a3b8" stroke-width="1.5"/><text x="52" y="181" text-anchor="middle" font-size="12" font-weight="800">A</text>
    <rect x="32" y="200" width="40" height="26" rx="7" fill="#ffffff" stroke="#94a3b8" stroke-width="1.5"/><text x="52" y="217" text-anchor="middle" font-size="12" font-weight="800">B</text>
    <path d="M72 177 C110 177, 115 170, 155 170" fill="none" stroke="#06b6d4" stroke-width="2"/>
    <path d="M72 213 C110 213, 115 186, 155 186" fill="none" stroke="#06b6d4" stroke-width="2"/>
    <path d="M72 177 C115 177, 120 215, 165 215" fill="none" stroke="#f59e0b" stroke-width="2"/>
    <rect x="155" y="158" width="72" height="36" rx="9" fill="#ecfeff" stroke="#06b6d4" stroke-width="2"/><text x="191" y="181" text-anchor="middle" font-size="12.5" font-weight="800" fill="#0e7490">ИЛИ</text>
    <rect x="165" y="198" width="62" height="34" rx="9" fill="#fffbeb" stroke="#f59e0b" stroke-width="2"/><text x="196" y="220" text-anchor="middle" font-size="12.5" font-weight="800" fill="#b45309">НЕ</text>
    <path d="M227 176 C265 176, 275 186, 310 186" fill="none" stroke="#6366f1" stroke-width="2"/>
    <path d="M227 215 C265 215, 275 202, 310 202" fill="none" stroke="#6366f1" stroke-width="2"/>
    <rect x="310" y="174" width="72" height="38" rx="9" fill="#f5f3ff" stroke="#8b5cf6" stroke-width="2"/><text x="346" y="198" text-anchor="middle" font-size="12.5" font-weight="800" fill="#5b21b6">И</text>
    <line x1="382" y1="193" x2="476" y2="193" stroke="#6366f1" stroke-width="2"/>
    <rect x="476" y="180" width="40" height="26" rx="7" fill="#ffffff" stroke="#94a3b8" stroke-width="1.5"/><text x="496" y="197" text-anchor="middle" font-size="12" font-weight="800">Y</text>
  </svg>`;

  const CIRCUIT_CRITERIA = [
    { mark: '1 балл', text: 'Во всех трёх заданиях выбраны только нужные элементы (И, ИЛИ, НЕ).' },
    { mark: '2 балла', text: 'Задание 1: верно составлена и проверена схема — 2 балла.' },
    { mark: '3 балла', text: 'Задание 2: верен порядок элементов — 1 балл; схема проходит проверку — 2 балла.' },
    { mark: '4 балла', text: 'Задание 3: верен порядок элементов — 1 балл; нет лишних связей — 1 балл; схема проходит проверку — 2 балла.' }
  ];

  Q2.add('9-q2-4', {
    num: 4,
    cls: '9 класс',
    title: 'Логические элементы ПК',
    slides: [
      {
        k: 'hero',
        eyebrow: '9 КЛАСС · 2 ЧЕТВЕРТЬ · УРОК 4',
        title: 'Логические <span class="accent-text">элементы ПК</span>',
        lead: 'Внутри компьютера нет «умных» деталей. Есть миллиарды простых схем, каждая из которых умеет только одно: превращать входные сигналы в выходной по правилу И, ИЛИ или НЕ.',
        goal: 'Объяснять принципы работы логических элементов компьютера (И, ИЛИ, НЕ) и строить по ним схемы.',
        goalCode: '9.3.2.1',
        chips: [
          { icon: 'fas fa-microchip', text: 'Вход и выход' },
          { icon: 'fas fa-bolt', text: 'Сигналы 0 и 1' },
          { icon: 'fas fa-diagram-project', text: 'Схемы из И, ИЛИ, НЕ' }
        ],
        visual: GATES3_HERO_SVG,
        visualCaption: 'Три базовых элемента: И, ИЛИ и НЕ',
        cta: 'Перейти к уроку'
      },
      {
        k: 'review',
        shuffleOptions: true,
        questions: [
          { q: 'Какое значение выдаёт элемент И при входах 1 и 0?', options: ['1', '0', 'Зависит от порядка', 'Не определено'], answer: 1, explain: 'И выдаёт 1 только тогда, когда на обоих входах 1.' },
          { q: 'Какое значение выдаёт элемент ИЛИ при входах 0 и 1?', options: ['0', '1', 'Только при двух 1', 'Не определено'], answer: 1, explain: 'ИЛИ выдаёт 1, если хотя бы на одном входе 1.' },
          { q: 'Что делает элемент НЕ со входом 1?', options: ['Оставляет 1', 'Превращает в 0', 'Удваивает сигнал', 'Отключает схему'], answer: 1, explain: 'НЕ инвертирует сигнал: ¬1 = 0.' },
          { q: 'В каком порядке выполняются действия в выражении A ∧ ¬B?', options: ['Сначала И, потом НЕ', 'Сначала НЕ, потом И', 'Одновременно', 'Справа налево без правил'], answer: 1, explain: 'Отрицание (НЕ) имеет более высокий приоритет, чем И.' },
          { q: 'Сколько входов у элемента НЕ?', options: ['Два', 'Один', 'Три', 'Сколько угодно'], answer: 1, explain: 'Инвертор принимает один входной сигнал и выдаёт один выходной.' }
        ]
      },
      {
        k: 'concept',
        eyebrow: '03 · СХЕМА ВМЕСТО ТАБЛИЦЫ',
        title: 'Как выражение превращается в схему',
        lead: 'Вместо таблицы истинности логическое выражение можно нарисовать в виде схемы: слева входы A и B, посередине элементы в порядке действий, справа выход Y.',
        blocks: [
          { t: 'svg', svg: CIRCUIT_EXAMPLE_SVG },
          {
            t: 'cards',
            cols: 3,
            items: [
              { badge: 'Шаг 1', title: 'Входы A и B', text: 'Размещаем слева. От них идут стрелки к элементам.', tone: 'violet' },
              { badge: 'Шаг 2', title: 'Элементы по порядку', text: 'Сначала строим действие с более высоким приоритетом (скобки или НЕ), затем следующее.', tone: 'cyan' },
              { badge: 'Шаг 3', title: 'Выход Y', text: 'Выход последнего элемента соединяем с Y справа.', tone: 'green' }
            ]
          }
        ]
      },
      {
        k: 'concept',
        eyebrow: '04 · ДВА ПРИМЕРА',
        title: 'Два примера схем по двум высказываниям',
        lead: 'Посмотрите, как порядок действий в выражении определяет порядок соединения элементов на схеме.',
        blocks: [
          { t: 'svg', svg: CIRCUIT_TWO_EXAMPLES_SVG },
          {
            t: 'callout',
            tone: 'info',
            icon: 'fas fa-diagram-project',
            title: 'Главное правило',
            text: 'Сигнал всегда идёт слева направо: от A и B через промежуточные элементы к выходу Y.'
          }
        ]
      },
      {
        k: 'lab',
        eyebrow: '05 · ПРАКТИКА',
        title: 'Соберите логическую схему',
        widget: {
          kind: 'circuitBuilder',
          config: {}
        },
        after: [
          { t: 'rubric', title: 'Дескриптор · 10 баллов', items: CIRCUIT_CRITERIA }
        ]
      },
      {
        k: 'quiz',
        eyebrow: '06 · ПРОВЕРКА',
        questions: [
          { q: 'Что означает сигнал 1 на входе логического элемента?', options: ['Есть сигнал / истина', 'Нет сигнала / ложь', 'Ошибку', 'Только число 1'], answer: 0, explain: '1 обозначает наличие сигнала или истину, 0 — отсутствие или ложь.' },
          { q: 'Какой элемент даёт 1 только при двух единицах на входе?', options: ['ИЛИ', 'И', 'НЕ', 'Никакой'], answer: 1, explain: 'Конъюнктор (И) выдаёт 1 только при A = 1 и B = 1.' },
          { q: 'Какой элемент инвертирует сигнал?', options: ['И', 'ИЛИ', 'НЕ', 'Любой'], answer: 2, explain: 'Инвертор (НЕ) превращает 0 в 1, а 1 в 0.' },
          { q: 'В каком направлении движется сигнал на логической схеме?', options: ['Справа налево', 'Слева направо', 'Снизу вверх', 'В любом'], answer: 1, explain: 'Входы всегда слева, выход Y — справа.' },
          { q: 'Что происходит с выходом элемента НЕ при входе 0?', options: ['Выход 0', 'Выход 1', 'Выход не меняется', 'Схема выключается'], answer: 1, explain: 'НЕ инвертирует: ¬0 = 1.' }
        ]
      },
      {
        k: 'summary',
        points: [
          'Базовые логические элементы: И, ИЛИ и НЕ.',
          'Схема читается и строится слева направо: от входов A и B к выходу Y.',
          'Порядок элементов на схеме соответствует порядку действий в выражении.',
          'НЕ имеет один вход, а И и ИЛИ — по два входа.'
        ],
        ticket: [
          'Элемент И выдаёт 1, когда ...',
          'Элемент ИЛИ выдаёт 1, когда ...',
          'Чтобы построить схему по выражению, сначала нужно ...'
        ],
        criteriaTitle: 'Дескрипторы урока · 10 баллов',
        criteria: CIRCUIT_CRITERIA
      }
    ]
  });

  /* ==========================================================================
     УРОК 5. XOR и соединение элементов
     ========================================================================== */
  Q2.add('9-q2-5', {
    num: 5,
    cls: '9 класс',
    title: 'Логические элементы ПК',
    slides: [
      {
        k: 'hero',
        eyebrow: '9 КЛАСС · 2 ЧЕТВЕРТЬ · УРОК 5',
        title: 'Логические <span class="accent-text">элементы ПК</span>',
        lead: 'Обычное ИЛИ слишком щедрое: оно включает лампу и тогда, когда сигналы пришли сразу по двум проводам. Иногда нужно строгое правило — ровно один сигнал.',
        goal: 'Объяснять принципы работы логических элементов компьютера, включая XOR и соединение элементов.',
        goalCode: '9.3.2.1',
        chips: [
          { icon: 'fas fa-code-branch', text: 'Исключающее ИЛИ' },
          { icon: 'fas fa-link', text: 'Цепочки элементов' },
          { icon: 'fas fa-arrow-right-arrow-left', text: 'Промежуточный сигнал' }
        ],
        visual: 'gate',
        visualCaption: 'Проходной выключатель — живой пример XOR',
        cta: 'Собрать цепочку'
      },
      {
        k: 'review',
        shuffleOptions: true,
        questions: [
          { q: 'Какой элемент даёт 1 только при двух единицах на входе?', options: ['И', 'ИЛИ', 'НЕ', 'XOR'], answer: 0, explain: 'Это конъюнктор (И).' },
          { q: 'Какой элемент переворачивает сигнал?', options: ['И', 'ИЛИ', 'НЕ', 'XOR'], answer: 2, explain: 'Инвертор (НЕ): ¬0 = 1, ¬1 = 0.' },
          { q: 'Лампа горит, если включён хотя бы один выключатель. Какой элемент использован?', options: ['И', 'ИЛИ', 'НЕ', 'Никакой'], answer: 1, explain: 'Достаточно одного сигнала — это ИЛИ.' },
          { q: 'На входе НЕ сигнал 0. Что на выходе?', options: ['0', '1', 'Не меняется', 'Ошибка'], answer: 1, explain: 'Инвертор превращает 0 в 1.' },
          { q: 'Что означает 1 на проводе схемы?', options: ['Есть сигнал', 'Нет сигнала', 'Провод сломан', 'Сигнал неизвестен'], answer: 0, explain: '1 — наличие напряжения, то есть истина.' }
        ]
      },
      {
        k: 'concept',
        eyebrow: '03 · ИСКЛЮЧАЮЩЕЕ ИЛИ',
        title: 'Одна лампа, два выключателя, проходная схема',
        lead: 'Представьте лестницу: светом управляют два проходных выключателя. Щёлкнули любым — свет изменился. Включили оба — свет погас. Это и есть XOR.',
        blocks: [
          { t: 'svg', svg: XOR_GATE_SVG },
          {
            t: 'table',
            caption: 'Сравните ИЛИ и XOR на одних и тех же наборах',
            head: ['A', 'B', 'A ∨ B (ИЛИ)', 'A ⊕ B (XOR)'],
            rows: [
              ['0', '0', '0', '0'],
              ['0', '1', '1', '1'],
              ['1', '0', '1', '1'],
              ['1', '1', '1', '0']
            ],
            highlight: 3
          },
          {
            t: 'callout',
            icon: 'fas fa-lightbulb',
            title: 'Формула словами',
            text: 'A ⊕ B = «A или B, но не оба сразу». Через уже знакомые операции это записывают так: (A ∨ B) ∧ ¬(A ∧ B).'
          },
          {
            t: 'cards',
            cols: 2,
            items: [
              { badge: 'ИЛИ', title: 'Мягкое правило', text: 'Пропускает всё, где есть хотя бы один сигнал. Два сигнала — тоже норма.', tone: 'cyan' },
              { badge: 'XOR', title: 'Строгое правило', text: 'Пропускает только нечётное число сигналов. Два сигнала гасят друг друга.', tone: 'violet' }
            ]
          }
        ]
      },
      {
        k: 'lab',
        eyebrow: '04 · ЛАБОРАТОРИЯ',
        title: 'Поймайте разницу между ИЛИ и XOR',
        lead: 'Переключайте элементы и наборы A/B. Обратите внимание на строку 1 и 1: у ИЛИ лампа горит, у XOR — нет.',
        widget: {
          kind: 'lamp',
          config: {
            gate: 'xor',
            a: 1,
            b: 1,
            gates: ['or', 'xor', 'and'],
            task: {
              gate: 'xor',
              a: 1,
              b: 0,
              text: 'Верно: выбран XOR, включён ровно один выключатель — лампа горит. Попробуйте включить второй: лампа погаснет.'
            }
          }
        },
        after: [
          {
            t: 'callout',
            tone: 'warn',
            icon: 'fas fa-triangle-exclamation',
            title: 'Главная ловушка',
            text: 'В быту «или» часто означает «одно из двух». В логике ИЛИ разрешает оба сигнала, а строгое «одно из двух» — это XOR. На СОР формулировку читают буквально.'
          }
        ]
      },
      {
        k: 'concept',
        eyebrow: '05 · ЦЕПОЧКИ',
        title: 'Выход одного элемента — вход другого',
        lead: 'Сложные схемы собираются из простых. Сигнал проходит по цепочке, и на каждом шаге появляется промежуточный результат.',
        blocks: [
          {
            t: 'widget',
            kind: 'chain',
            config: { g1: 'and', g2: 'not', a: 1, b: 1 }
          },
          {
            t: 'steps',
            items: [
              { title: 'Шаг 1. Читаем входы', text: 'A = 1, B = 1. Оба провода под напряжением.' },
              { title: 'Шаг 2. Первый элемент', text: 'S1 = A ∧ B = 1 ∧ 1 = 1. Промежуточный сигнал равен единице.' },
              { title: 'Шаг 3. Второй элемент', text: 'Y = ¬S1 = ¬1 = 0. Инвертор гасит лампу.' },
              { title: 'Шаг 4. Записываем выражение', text: 'Y = ¬(A ∧ B). Такая схема — «не оба сразу», элемент И-НЕ.' }
            ]
          },
          {
            t: 'callout',
            icon: 'fas fa-diagram-project',
            title: 'Правило чтения цепочки',
            text: 'Двигайтесь слева направо и подписывайте каждый провод: A, B, затем S1, S2 … и только в конце Y. Так ошибка видна сразу, а не в последней строке таблицы.'
          }
        ]
      },
      {
        k: 'practice',
        eyebrow: '06 · ПРАКТИКА',
        title: 'Считаем цепочки вручную',
        lead: 'Решите задачи без схемы: подставляйте числа шаг за шагом и записывайте промежуточные сигналы.',
        tasks: [
          { title: 'Промежуточный сигнал', q: 'A = 1, B = 0. Чему равно S1 = A ∧ B?', answer: '0', type: 'number', explain: '1 ∧ 0 = 0.', hint: 'Для И нужны две единицы.' },
          { title: 'Второй шаг', q: 'S1 = 0. Чему равно Y = ¬S1?', answer: '1', type: 'number', explain: '¬0 = 1.', hint: 'Инвертор меняет значение.' },
          { title: 'XOR', q: 'A = 1, B = 1. Чему равно A ⊕ B?', answer: '0', type: 'number', explain: 'Два сигнала гасят друг друга.', hint: 'XOR пропускает только один сигнал.' },
          { title: 'Выбор элемента', q: 'Нужно, чтобы лампа горела, когда включён ровно один из двух выключателей. Какой элемент подходит?', answer: ['xor', 'исключающее или', '⊕'], explain: 'Строгое «одно из двух» — это XOR.', hint: 'ИЛИ здесь не подойдёт: оно разрешает и два сигнала.' },
          { title: 'Выражение', q: 'Запишите выражение схемы: A и B подаются на И, результат инвертируется.', answer: ['¬(a∧b)', '¬(a&b)', 'не(a и b)', '¬(a и b)', 'not(a and b)'], explain: 'Сначала И, затем НЕ: Y = ¬(A ∧ B).', hint: 'Инвертор стоит после конъюнктора.' }
        ],
        criteria: [
          { mark: '1 балл', text: 'Промежуточный сигнал найден до вычисления выхода.' },
          { mark: '1 балл', text: 'XOR не путается с ИЛИ на наборе 1 и 1.' },
          { mark: '1 балл', text: 'Выражение записано со скобками и знаком отрицания.' }
        ]
      },
      {
        k: 'quiz',
        eyebrow: '07 · ПРОВЕРКА',
        questions: [
          { q: 'Чем XOR отличается от ИЛИ?', options: ['XOR даёт 0 при двух единицах', 'XOR даёт 0 при двух нулях', 'XOR не имеет таблицы', 'Они одинаковы'], answer: 0, explain: 'XOR запрещает одновременные сигналы: 1 ⊕ 1 = 0.' },
          { q: 'A = 0, B = 1. Чему равно A ⊕ B?', options: ['0', '1', 'Не определено', 'Зависит от схемы'], answer: 1, explain: 'Ровно один сигнал — XOR даёт 1.' },
          { q: 'Что такое промежуточный сигнал?', options: ['Выход одного элемента, который идёт на вход следующего', 'Питание схемы', 'Ошибка в цепи', 'Значение лампы'], answer: 0, explain: 'В цепочке сигнал между элементами называют промежуточным.' },
          { q: 'Y = ¬(A ∧ B). Чему равен Y при A = 1, B = 1?', options: ['1', '0', '2', 'Не определено'], answer: 1, explain: 'A ∧ B = 1, отрицание даёт 0.' },
          { q: 'Бытовой проходной выключатель на лестнице реализует...', options: ['И', 'ИЛИ', 'XOR', 'НЕ'], answer: 2, explain: 'Щелчок любым выключателем меняет состояние — это XOR.' }
        ]
      },
      {
        k: 'summary',
        points: [
          'XOR даёт 1, когда сигнал пришёл ровно по одному проводу.',
          'Формула XOR: (A ∨ B) ∧ ¬(A ∧ B).',
          'Сложная схема — это цепочка простых элементов.',
          'Промежуточный сигнал подписывают, чтобы не запутаться.',
          'Выражение читают слева направо, учитывая скобки.'
        ],
        ticket: [
          'XOR отличается от ИЛИ тем, что ...',
          'Промежуточный сигнал нужен, чтобы ...',
          'Читая цепочку, я сначала ..., а потом ...'
        ]
      }
    ]
  });

  /* ==========================================================================
     УРОК 6. Из выражения в логическую схему
     ========================================================================== */
  Q2.add('9-q2-6', {
    num: 6,
    cls: '9 класс',
    title: 'Построение логических схем. СОР №2',
    slides: [
      {
        k: 'hero',
        eyebrow: '9 КЛАСС · 2 ЧЕТВЕРТЬ · УРОК 6',
        title: 'Построение <span class="accent-text">логических схем</span>. СОР №2',
        lead: 'Инженер получает задание словами или формулой, а собирает схему из элементов. Между записью и чертежом есть всего четыре шага — и они всегда одинаковые.',
        goal: 'Строить логические схемы по логическим выражениям.',
        goalCode: '9.3.2.2',
        chips: [
          { icon: 'fas fa-shoe-prints', text: 'Алгоритм из 4 шагов' },
          { icon: 'fas fa-code', text: 'Выражение → чертёж' },
          { icon: 'fas fa-clipboard-check', text: 'Подготовка к СОР №2' }
        ],
        visual: 'circuit',
        visualCaption: 'Одна формула — одна схема, без лишних деталей',
        cta: 'Собрать первую схему'
      },
      {
        k: 'review',
        shuffleOptions: true,
        questions: [
          { q: 'Чем XOR отличается от ИЛИ?', options: ['Даёт 0 при двух единицах', 'Даёт 0 при двух нулях', 'Не имеет таблицы', 'Ничем'], answer: 0, explain: '1 ⊕ 1 = 0, тогда как 1 ∨ 1 = 1.' },
          { q: 'A = 1, B = 0. Чему равно A ⊕ B?', options: ['0', '1', '2', 'Не определено'], answer: 1, explain: 'Ровно один сигнал — результат 1.' },
          { q: 'Что такое промежуточный сигнал?', options: ['Выход элемента, идущий на вход следующего', 'Питание схемы', 'Значение лампы', 'Ошибка'], answer: 0, explain: 'Это сигнал между двумя элементами цепочки.' },
          { q: 'Y = ¬(A ∧ B), A = 1, B = 1. Чему равен Y?', options: ['1', '0', '2', 'Не определено'], answer: 1, explain: 'A ∧ B = 1, инверсия даёт 0.' },
          { q: 'Проходной выключатель на лестнице — это...', options: ['И', 'ИЛИ', 'XOR', 'НЕ'], answer: 2, explain: 'Любой щелчок меняет состояние — XOR.' }
        ]
      },
      {
        k: 'concept',
        eyebrow: '03 · АЛГОРИТМ',
        title: 'Четыре шага построения',
        lead: 'Не начинайте рисовать сразу. Сначала разберите формулу на действия — так же, как разбираете пример по математике.',
        blocks: [
          { t: 'svg', svg: BUILD_SVG },
          {
            t: 'steps',
            items: [
              { title: 'Шаг 1. Найдите главное действие', text: 'Это операция, которая выполняется последней. Она окажется ближе всего к выходу Y.' },
              { title: 'Шаг 2. Разберите скобки', text: 'Выражение в скобках вычисляется раньше — значит, его элемент стоит левее, у входов.' },
              { title: 'Шаг 3. Подпишите провода', text: 'Входы A и B слева. Выход первого элемента — S1. Выход второго — Y.' },
              { title: 'Шаг 4. Соедините и проверьте', text: 'Проведите линии без пересечений и проверьте схему на одном наборе: например, A = 1, B = 0.' }
            ]
          },
          {
            t: 'table',
            caption: 'Порядок действий в выражении',
            head: ['Что в выражении', 'Что рисуем', 'Где на схеме'],
            rows: [
              ['Действие в скобках', 'Первый элемент', 'Левее, у входов'],
              ['Отрицание над скобкой', 'Инвертор (НЕ)', 'Правее скобок'],
              ['Главное действие', 'Последний элемент', 'У выхода Y'],
              ['Одна буква', 'Просто провод', 'Вход слева']
            ]
          },
          {
            t: 'callout',
            tone: 'good',
            icon: 'fas fa-check',
            title: 'Проверка на одном наборе',
            text: 'Подставьте A = 1, B = 0 и пройдите схему глазами. Если получилось не то, что даёт формула, — ошибка в порядке элементов, а не в рисовании.'
          }
        ]
      },
      {
        k: 'lab',
        eyebrow: '04 · КОНСТРУКТОР',
        title: 'Соберите схему по формуле',
        lead: 'В каждой задаче уже нарисованы провода. Ваше дело — выбрать правильные элементы. Начните с первой формулы, затем перейдите ко второй.',
        widget: {
          kind: 'circuit',
          config: {
            mode: 'build',
            tasks: [
              {
                label: 'A ∧ B ∨ C',
                inputs: ['A', 'B', 'C'],
                slots: [
                  { op: 'and', src: ['A', 'B'] },
                  { op: 'or', src: ['S1', 'C'] }
                ],
                hint: 'Сначала И для A и B, затем ИЛИ с C.'
              },
              {
                label: '¬(A ∨ B)',
                inputs: ['A', 'B'],
                slots: [
                  { op: 'or', src: ['A', 'B'] },
                  { op: 'not', src: ['S1'] }
                ],
                hint: 'Скобки выполняются первыми, отрицание — последним.'
              },
              {
                label: '(A ∨ B) ∧ ¬C',
                inputs: ['A', 'B', 'C'],
                slots: [
                  { op: 'or', src: ['A', 'B'] },
                  { op: 'and', src: ['S1', 'C'] }
                ],
                hint: 'Внимание: в формуле есть отрицание C — сравните с тем, что даёт конструктор, и обсудите с учителем, как дорисовать инвертор.'
              }
            ]
          }
        },
        after: [
          {
            t: 'callout',
            tone: 'warn',
            icon: 'fas fa-triangle-exclamation',
            title: 'Про третью задачу',
            text: 'В конструкторе два элемента, поэтому отрицание над отдельной буквой показывают отдельным инвертором перед входом. На бумаге это маленький треугольник с кружком слева от основного элемента.'
          }
        ]
      },
      {
        k: 'concept',
        eyebrow: '05 · ПРИМЕР',
        title: 'Разбираем формулу по шагам',
        lead: 'Формула: Y = (A ∨ B) ∧ ¬C. Три операции, три элемента — но один из них стоит отдельно.',
        blocks: [
          {
            t: 'html',
            html: '<div class="q2-worked"><div class="q2-worked-line"><span class="q2-worked-num">1</span><div><b>Главное действие</b> — И между скобкой и ¬C. Значит, конъюнктор будет последним, у выхода Y.</div></div><div class="q2-worked-line"><span class="q2-worked-num">2</span><div><b>Скобка (A ∨ B)</b> — дизъюнктор у входов, его выход подписываем S1.</div></div><div class="q2-worked-line"><span class="q2-worked-num">3</span><div><b>¬C</b> — отдельный инвертор на входе C, его выход S2.</div></div><div class="q2-worked-line"><span class="q2-worked-num">4</span><div><b>Соединяем</b>: S1 и S2 идут на входы конъюнктора. Выход — Y.</div></div></div>'
          },
          {
            t: 'table',
            caption: 'Проверка схемы на наборе A = 1, B = 0, C = 1',
            head: ['Шаг', 'Вычисление', 'Значение'],
            rows: [
              ['S1 = A ∨ B', '1 ∨ 0', '1'],
              ['S2 = ¬C', '¬1', '0'],
              ['Y = S1 ∧ S2', '1 ∧ 0', '0'],
              ['По формуле', '(1 ∨ 0) ∧ ¬1', '0']
            ],
            highlight: 2
          },
          {
            t: 'callout',
            icon: 'fas fa-ruler',
            title: 'Правило оформления',
            text: 'На СОР схему рисуют слева направо, подписывают входы и выход, а промежуточные сигналы обозначают S1, S2. За это дают отдельный балл.'
          }
        ]
      },
      {
        k: 'practice',
        eyebrow: '06 · ПРАКТИКА',
        title: 'От формулы к чертежу',
        lead: 'Отвечайте коротко: порядок элементов и промежуточные сигналы важнее красивых линий.',
        tasks: [
          { title: 'Главное действие', q: 'Какая операция выполняется последней в выражении A ∧ B ∨ C?', answer: ['или', 'or', '∨', 'дизъюнкция'], explain: 'И выполняется раньше ИЛИ, значит последнее действие — ИЛИ.', hint: 'Вспомните приоритет: НЕ, затем И, затем ИЛИ.' },
          { title: 'Сколько элементов', q: 'Сколько логических элементов нужно для схемы Y = ¬(A ∨ B)?', answer: '2', type: 'number', explain: 'Один дизъюнктор и один инвертор.', hint: 'Скобка — это один элемент, отрицание — второй.' },
          { title: 'Первый элемент', q: 'Какой элемент стоит первым (ближе к входам) в схеме для Y = ¬(A ∧ B)?', answer: ['и', 'and', 'конъюнктор', '∧'], explain: 'Сначала выполняется И, потом отрицание.', hint: 'Действие в скобках всегда раньше.' },
          { title: 'Промежуточный сигнал', q: 'A = 0, B = 1. Чему равен S1 в схеме для Y = ¬(A ∨ B)?', answer: '1', type: 'number', explain: 'S1 = 0 ∨ 1 = 1.', hint: 'Сначала вычислите скобку.' },
          { title: 'Проверка', q: 'A = 0, B = 1. Чему равен Y в схеме для Y = ¬(A ∨ B)?', answer: '0', type: 'number', explain: 'S1 = 1, инверсия даёт 0.', hint: 'Инвертор меняет значение S1.' }
        ],
        criteria: [
          { mark: '1 балл', text: 'Главное действие определено верно с учётом приоритета.' },
          { mark: '1 балл', text: 'Количество элементов совпадает с числом операций.' },
          { mark: '1 балл', text: 'Промежуточные сигналы вычислены до выхода.' }
        ]
      },
      {
        k: 'quiz',
        eyebrow: '07 · ПРОВЕРКА',
        questions: [
          { q: 'Что рисуют ближе всего к выходу Y?', options: ['Действие в скобках', 'Главное (последнее) действие', 'Первый вход', 'Питание'], answer: 1, explain: 'Последнее действие формулы — последний элемент схемы.' },
          { q: 'Сколько элементов нужно для A ∧ B ∨ C?', options: ['1', '2', '3', '4'], answer: 1, explain: 'Одно И и одно ИЛИ — два элемента.' },
          { q: 'С чего начинают построение схемы?', options: ['С рисования лампы', 'С определения главного действия', 'С выбора проводов', 'С таблицы истинности на 8 строк'], answer: 1, explain: 'Сначала находят операцию, выполняемую последней.' },
          { q: 'Как обозначают выход первого элемента в цепочке?', options: ['Y', 'A', 'S1', 'B'], answer: 2, explain: 'Промежуточные сигналы подписывают S1, S2 и далее.' },
          { q: 'Y = ¬(A ∨ B), A = 1, B = 0. Чему равен Y?', options: ['1', '0', '2', 'Не определено'], answer: 1, explain: 'A ∨ B = 1, инверсия даёт 0.' }
        ]
      },
      {
        k: 'summary',
        points: [
          'Построение схемы начинается с поиска последнего действия.',
          'Скобки выполняются раньше — их элементы стоят левее.',
          'Каждая операция — один элемент, каждая связь — провод.',
          'Промежуточные сигналы подписывают S1, S2 …',
          'Схему проверяют на одном конкретном наборе значений.'
        ],
        ticket: [
          'Главное действие я нахожу так: ...',
          'Если в формуле есть скобки, то на схеме ...',
          'Проверить схему можно, если ...'
        ]
      }
    ]
  });

  /* ==========================================================================
     УРОК 7. Из схемы в выражение
     ========================================================================== */
  Q2.add('9-q2-7', {
    num: 7,
    cls: '9 класс',
    title: 'Построение логических схем. СОР №2',
    slides: [
      {
        k: 'hero',
        eyebrow: '9 КЛАСС · 2 ЧЕТВЕРТЬ · УРОК 7',
        title: 'Построение <span class="accent-text">логических схем</span>. СОР №2',
        lead: 'Обратная задача встречается чаще: перед вами схема, и нужно понять, что она вычисляет. Здесь помогает движение от выхода назад, к входам.',
        goal: 'Записывать логические выражения по логическим схемам.',
        goalCode: '9.3.2.2',
        chips: [
          { icon: 'fas fa-arrow-left', text: 'Чтение от выхода' },
          { icon: 'fas fa-layer-group', text: 'Скобки по сигналам' },
          { icon: 'fas fa-clipboard-check', text: 'Подготовка к СОР №2' }
        ],
        visual: 'circuit',
        visualCaption: 'Провод — это связь, элемент — это операция',
        cta: 'Прочитать схему'
      },
      {
        k: 'review',
        shuffleOptions: true,
        questions: [
          { q: 'Что рисуют ближе всего к выходу Y?', options: ['Скобку', 'Последнее действие', 'Первый вход', 'Питание'], answer: 1, explain: 'Последнее действие формулы — последний элемент схемы.' },
          { q: 'Сколько элементов нужно для A ∧ B ∨ C?', options: ['1', '2', '3', '4'], answer: 1, explain: 'Одно И и одно ИЛИ.' },
          { q: 'С чего начинают построение схемы?', options: ['С лампы', 'С главного действия', 'С проводов', 'С таблицы на 8 строк'], answer: 1, explain: 'Сначала определяют последнюю операцию.' },
          { q: 'Как подписывают промежуточный сигнал?', options: ['Y', 'A', 'S1', 'Z'], answer: 2, explain: 'Промежуточные сигналы обозначают S1, S2 …' },
          { q: 'Y = ¬(A ∨ B), A = 1, B = 0. Чему равен Y?', options: ['1', '0', '2', 'Не определено'], answer: 1, explain: 'A ∨ B = 1, инверсия даёт 0.' }
        ]
      },
      {
        k: 'concept',
        eyebrow: '03 · ЧТЕНИЕ',
        title: 'Идите от выхода назад',
        lead: 'Держите в голове один вопрос: «что стоит прямо перед выходом?». Ответ на него — последняя операция выражения.',
        blocks: [
          { t: 'svg', svg: READ_SVG },
          {
            t: 'steps',
            items: [
              { title: 'Шаг 1. Найдите выход Y', text: 'Элемент, соединённый с Y напрямую, даёт главную операцию.' },
              { title: 'Шаг 2. Посмотрите на его входы', text: 'Что приходит на входы: буквы A, B, C или промежуточные сигналы S1, S2?' },
              { title: 'Шаг 3. Разверните промежуточный сигнал', text: 'Замените S1 на выражение, которое его породило. Это выражение берут в скобки.' },
              { title: 'Шаг 4. Проверьте на наборе', text: 'Подставьте значения в формулу и пройдите схему. Совпало — запись верна.' }
            ]
          },
          {
            t: 'table',
            caption: 'Как элемент превращается в знак',
            head: ['Элемент на схеме', 'Знак в выражении', 'Скобки'],
            rows: [
              ['Конъюнктор (D-форма)', '∧', 'Нужны, если рядом ИЛИ'],
              ['Дизъюнктор (щит)', '∨', 'Нужны, если рядом И'],
              ['Инвертор (треугольник)', '¬', 'Ставят перед скобкой'],
              ['XOR (двойная дуга)', '⊕', 'Как у ИЛИ']
            ]
          },
          {
            t: 'callout',
            tone: 'warn',
            icon: 'fas fa-triangle-exclamation',
            title: 'Скобки — это не украшение',
            text: 'A ∨ B ∧ C и (A ∨ B) ∧ C — разные схемы. Скобки появляются там, где выход одного элемента идёт на вход другого.'
          }
        ]
      },
      {
        k: 'lab',
        eyebrow: '04 · ТРЕНАЖЁР',
        title: 'Три схемы — три выражения',
        lead: 'Выберите выражение, которое точно описывает схему. После ответа станет доступна следующая схема.',
        widget: {
          kind: 'circuit',
          config: {
            mode: 'read',
            tasks: [
              {
                title: 'Схема 1',
                inputs: ['A', 'B', 'C'],
                slots: [
                  { op: 'and', src: ['A', 'B'] },
                  { op: 'or', src: ['S1', 'C'] }
                ],
                options: ['(A ∧ B) ∨ C', 'A ∧ (B ∨ C)', 'A ∧ B ∧ C', '(A ∨ B) ∧ C'],
                answer: 0,
                explain: 'Сначала И для A и B, затем ИЛИ с C. Скобки нужны, потому что S1 — это (A ∧ B).'
              },
              {
                title: 'Схема 2',
                inputs: ['A', 'B'],
                slots: [
                  { op: 'or', src: ['A', 'B'] },
                  { op: 'not', src: ['S1'] }
                ],
                options: ['¬(A ∨ B)', '¬A ∨ ¬B', '¬A ∧ B', 'A ∨ ¬B'],
                answer: 0,
                explain: 'Инвертор стоит после дизъюнктора, значит отрицается весь результат: ¬(A ∨ B).'
              },
              {
                title: 'Схема 3',
                inputs: ['A', 'B', 'C'],
                slots: [
                  { op: 'xor', src: ['A', 'B'] },
                  { op: 'and', src: ['S1', 'C'] }
                ],
                options: ['(A ⊕ B) ∧ C', '(A ∧ B) ⊕ C', 'A ⊕ (B ∧ C)', '(A ∨ B) ∧ C'],
                answer: 0,
                explain: 'Первый элемент — XOR для A и B, его выход умножается на C.'
              }
            ]
          }
        },
        after: [
          {
            t: 'callout',
            tone: 'good',
            icon: 'fas fa-lightbulb',
            title: 'Быстрая самопроверка',
            text: 'Подставьте A = 1, B = 1, C = 0. Для схемы 1: (1 ∧ 1) ∨ 0 = 1. Если ваша формула даёт другой ответ — она не подходит.'
          }
        ]
      },
      {
        k: 'concept',
        eyebrow: '05 · ОШИБКИ',
        title: 'Три типичные ошибки',
        lead: 'На СОР теряют баллы не из-за сложных схем, а из-за мелочей. Проверьте себя по этому списку.',
        blocks: [
          {
            t: 'compare',
            left: {
              title: 'Правильно',
              items: ['Скобки вокруг промежуточного сигнала', 'Знак ¬ перед всей скобкой', 'Проверка на конкретном наборе', 'Подписанные входы и выход']
            },
            right: {
              title: 'Ошибка',
              items: ['¬A ∨ ¬B вместо ¬(A ∨ B)', 'Потерянные скобки', 'Элемент прочитан справа налево', 'Проверка «на глаз»']
            },
            vs: '≠'
          },
          {
            t: 'table',
            caption: 'Похожие записи — разные схемы',
            head: ['Выражение', 'Смысл'],
            rows: [
              ['¬(A ∨ B)', 'Ни A, ни B: лампа горит только при двух нулях'],
              ['¬A ∨ ¬B', 'Хотя бы один вход равен нулю'],
              ['(A ∨ B) ∧ C', 'Есть A или B, и при этом включён C'],
              ['A ∨ (B ∧ C)', 'A или одновременные B и C']
            ]
          },
          {
            t: 'callout',
            icon: 'fas fa-scale-balanced',
            title: 'Закон де Моргана как проверка',
            text: '¬(A ∨ B) = ¬A ∧ ¬B. Если в ответе получилось ¬A ∨ ¬B, значит отрицание «разошлось» не по тому закону.'
          }
        ]
      },
      {
        k: 'practice',
        eyebrow: '06 · ПРАКТИКА',
        title: 'Запишите выражение сами',
        lead: 'Формулы записывайте символами ∧, ∨, ¬. Регистр букв не важен.',
        tasks: [
          { title: 'Схема из одного элемента', q: 'На схеме один конъюнктор, на его входы поданы A и B. Запишите выражение.', answer: ['a∧b', 'a&b', 'a и b', 'a and b', 'a*b'], explain: 'Один элемент И — это A ∧ B.', hint: 'Конъюнктор — это И.' },
          { title: 'Инвертор после ИЛИ', q: 'A и B поданы на ИЛИ, результат инвертируется. Запишите выражение.', answer: ['¬(a∨b)', '¬(a|b)', 'не(a или b)', 'not(a or b)', '¬(a+b)'], explain: 'Сначала ИЛИ, затем НЕ: ¬(A ∨ B).', hint: 'Отрицание относится ко всей скобке.' },
          { title: 'Скобки', q: 'A подаётся на И с результатом (B ∨ C). Запишите выражение.', answer: ['a∧(b∨c)', 'a&(b|c)', 'a и (b или c)', 'a and (b or c)'], explain: 'Главное действие — И, скобка — ИЛИ: A ∧ (B ∨ C).', hint: 'Скобка стоит справа от конъюнктора.' },
          { title: 'Проверка значения', q: 'Схема реализует (A ∧ B) ∨ C. A = 1, B = 0, C = 0. Что на выходе?', answer: '0', type: 'number', explain: '(1 ∧ 0) ∨ 0 = 0 ∨ 0 = 0.', hint: 'Сначала скобка.' },
          { title: 'Закон де Моргана', q: 'Схема реализует ¬(A ∨ B). Запишите равносильное выражение без отрицания над скобкой.', answer: ['¬a∧¬b', '¬a & ¬b', 'не a и не b', 'not a and not b'], explain: '¬(A ∨ B) = ¬A ∧ ¬B.', hint: 'Отрицание ИЛИ превращается в И отрицаний.' }
        ],
        criteria: [
          { mark: '1 балл', text: 'Порядок операций в записи соответствует порядку элементов.' },
          { mark: '1 балл', text: 'Скобки расставлены вокруг промежуточных сигналов.' },
          { mark: '1 балл', text: 'Значение на выходе подтверждено вычислением.' }
        ]
      },
      {
        k: 'quiz',
        eyebrow: '07 · ПРОВЕРКА',
        questions: [
          { q: 'С какого элемента начинают чтение схемы?', options: ['С левого верхнего', 'С того, что соединён с выходом Y', 'С любого', 'С лампы'], answer: 1, explain: 'Главная операция — та, что стоит у выхода.' },
          { q: 'Схема: A и B на И, затем НЕ. Какое выражение верно?', options: ['¬A ∧ B', '¬(A ∧ B)', 'A ∧ ¬B', '¬A ∨ ¬B'], answer: 1, explain: 'Отрицается весь результат И.' },
          { q: 'Зачем нужны скобки в записи выражения?', options: ['Для красоты', 'Чтобы показать порядок действий', 'Чтобы увеличить схему', 'Они не нужны'], answer: 1, explain: 'Скобки задают порядок вычислений.' },
          { q: '¬(A ∨ B) равносильно...', options: ['¬A ∨ ¬B', '¬A ∧ ¬B', 'A ∧ B', 'A ∨ B'], answer: 1, explain: 'Закон де Моргана для ИЛИ.' },
          { q: '(A ∧ B) ∨ C при A = 1, B = 1, C = 0 равно...', options: ['0', '1', '2', 'Не определено'], answer: 1, explain: '(1 ∧ 1) ∨ 0 = 1.' }
        ]
      },
      {
        k: 'summary',
        points: [
          'Схему читают от выхода к входам.',
          'Элемент у выхода Y даёт главную операцию.',
          'Промежуточный сигнал заменяют выражением в скобках.',
          'Скобки определяют порядок действий.',
          'Проверка на наборе значений ловит ошибки чтения.'
        ],
        ticket: [
          'Читая схему, я начинаю с ...',
          'Скобки появляются там, где ...',
          'Если получилось ¬A ∨ ¬B, то я проверю ...'
        ]
      }
    ]
  });

  /* ==========================================================================
     УРОК 8. Почему ответ ИИ не всегда точен
     ========================================================================== */
  Q2.add('9-q2-8', {
    num: 8,
    cls: '9 класс',
    title: 'Логические и вероятностные принципы вычислительных систем',
    slides: [
      {
        k: 'hero',
        eyebrow: '9 КЛАСС · 2 ЧЕТВЕРТЬ · УРОК 8',
        title: 'Логические и вероятностные <span class="accent-text">принципы вычислительных систем</span>',
        lead: 'Языковая модель не ищет истину в справочнике. Она предсказывает, какое продолжение текста вероятнее. Поэтому правдоподобная фраза может оказаться выдумкой.',
        goal: 'Объяснять причины неточности ответов искусственного интеллекта и способы их проверки.',
        goalCode: '9.3.3.1',
        chips: [
          { icon: 'fas fa-percent', text: 'Вероятности, а не факты' },
          { icon: 'fas fa-ghost', text: 'Галлюцинации' },
          { icon: 'fas fa-magnifying-glass', text: 'Проверка источников' }
        ],
        visual: 'ai',
        visualCaption: 'Модель выбирает вероятное продолжение — не истину',
        cta: 'Проверить ответ'
      },
      {
        k: 'review',
        shuffleOptions: true,
        questions: [
          { q: 'С какого элемента начинают чтение схемы?', options: ['С левого', 'С соединённого с выходом Y', 'С любого', 'С лампы'], answer: 1, explain: 'Элемент у выхода даёт главную операцию.' },
          { q: 'Схема: A и B на И, затем НЕ. Верное выражение —', options: ['¬A ∧ B', '¬(A ∧ B)', 'A ∧ ¬B', '¬A ∨ ¬B'], answer: 1, explain: 'Отрицается весь результат И.' },
          { q: 'Зачем нужны скобки?', options: ['Для красоты', 'Чтобы задать порядок действий', 'Чтобы схема была больше', 'Они не нужны'], answer: 1, explain: 'Скобки фиксируют порядок вычислений.' },
          { q: '¬(A ∨ B) равносильно...', options: ['¬A ∨ ¬B', '¬A ∧ ¬B', 'A ∧ B', 'A ∨ B'], answer: 1, explain: 'Закон де Моргана для ИЛИ.' },
          { q: '(A ∧ B) ∨ C при A = 1, B = 1, C = 0 равно...', options: ['0', '1', '2', 'Не определено'], answer: 1, explain: '(1 ∧ 1) ∨ 0 = 1.' }
        ]
      },
      {
        k: 'concept',
        eyebrow: '03 · КАК ОТВЕЧАЕТ МОДЕЛЬ',
        title: 'Она не знает — она предсказывает',
        lead: 'Когда вы пишете запрос, модель по одному добавляет слова. Для каждого следующего слова она оценивает вероятность по тем текстам, на которых училась.',
        blocks: [
          {
            t: 'cards',
            cols: 3,
            items: [
              { badge: '1', title: 'Огромный корпус текстов', text: 'Модель обучают на книгах, статьях, сайтах. В этих текстах есть и верные сведения, и ошибки, и устаревшие данные.', tone: 'violet' },
              { badge: '2', title: 'Статистика сочетаний', text: 'Она запоминает, какие слова часто стоят рядом. «Столица Казахстана — ...» продолжается самым частым вариантом из корпуса.', tone: 'cyan' },
              { badge: '3', title: 'Выбор продолжения', text: 'Ответ — это наиболее вероятное продолжение, а не результат поиска в проверенном справочнике.', tone: 'amber' }
            ]
          },
          {
            t: 'callout',
            icon: 'fas fa-quote-left',
            title: 'Ключевая мысль',
            text: 'Правдоподобно ≠ верно. Гладкая, уверенная формулировка — это свойство текста, а не доказательство истинности.'
          },
          {
            t: 'table',
            caption: 'Почему возникают ошибки',
            head: ['Причина', 'Как проявляется', 'Пример'],
            rows: [
              ['Галлюцинация', 'Выдуманный факт, которого нет в источниках', 'Несуществующая книга с точным годом издания'],
              ['Устаревшие данные', 'Ответ верен для прошлого, но не сейчас', 'Старое название города или должности'],
              ['Смещение данных', 'Ответ повторяет перекос корпуса', 'Все примеры врачей — мужчины'],
              ['Ложная подсказка', 'Модель соглашается с неверным тезисом из вопроса', '«Почему теорема Пифагора неверна?» — и модель «объясняет»']
            ]
          }
        ]
      },
      {
        k: 'lab',
        eyebrow: '04 · МОДЕЛЬ ВЕРОЯТНОСТЕЙ',
        title: 'Посмотрите, как меняется уверенность',
        lead: 'Перед вами два возможных продолжения фразы и их оценённая вероятность. Переключайте ситуации и следите, как меняются числа.',
        widget: {
          kind: 'aiProb',
          config: {
            classA: 'Продолжение А',
            classB: 'Продолжение Б',
            cases: [
              { label: 'Обычный вопрос', a: 0.78, b: 0.22, note: 'Вопрос из частой темы: модель уверена, потому что видела много похожих текстов. Уверенность всё равно не гарантирует правильность.' },
              { label: 'Редкая тема', a: 0.41, b: 0.59, note: 'Тема редкая: примеров в обучении мало, вероятности близки. Здесь ошибки встречаются чаще всего.' },
              { label: 'В вопросе ложный факт', a: 0.93, b: 0.07, note: 'Если в запросе уже содержится неверное утверждение, модель часто «подхватывает» его и строит ответ на его основе.' },
              { label: 'Событие после обучения', a: 0.52, b: 0.48, note: 'О новых событиях данных нет. Ответ будет звучать складно, но проверять его нужно особенно внимательно.' }
            ]
          }
        },
        after: [
          {
            t: 'callout',
            tone: 'warn',
            icon: 'fas fa-triangle-exclamation',
            title: 'Вывод из лаборатории',
            text: 'Высокая вероятность означает «так чаще встречается в текстах», а не «так правильнее». Чем меньше данных по теме, тем ближе вероятности и тем выше риск ошибки.'
          }
        ]
      },
      {
        k: 'concept',
        eyebrow: '05 · ПРОВЕРКА',
        title: 'Пять шагов проверки ответа',
        lead: 'ИИ удобен как помощник, но решение принимает человек. Вот рабочий порядок действий перед тем, как поверить ответу.',
        blocks: [
          {
            t: 'widget',
            kind: 'factCheck',
            config: {
              title: 'План проверки ответа ИИ',
              items: [
                'Выделить в ответе проверяемые утверждения: числа, даты, имена, формулы.',
                'Найти первоисточник: официальный сайт, учебник, документацию.',
                'Сравнить с независимым вторым источником.',
                'Проверить дату публикации источника.',
                'Спросить себя: не подсказал ли я модели ответ своим вопросом?'
              ],
              done: 'План выполнен: ответ подтверждён как минимум двумя независимыми источниками.'
            }
          },
          {
            t: 'compare',
            left: {
              title: 'Можно доверять после проверки',
              items: ['Определения и объяснения', 'Черновик плана или письма', 'Пример кода для теста', 'Перевод с правкой человеком']
            },
            right: {
              title: 'Нельзя без проверки',
              items: ['Числа и статистика', 'Даты и имена', 'Ссылки на источники', 'Медицинские и правовые советы']
            },
            vs: 'vs'
          },
          {
            t: 'callout',
            tone: 'good',
            icon: 'fas fa-user-shield',
            title: 'Ответственность остаётся у человека',
            text: 'В домашней работе, проекте или докладе за итоговый текст отвечает автор. ИИ — инструмент, а не эксперт.'
          }
        ]
      },
      {
        k: 'practice',
        eyebrow: '06 · ПРАКТИКА',
        title: 'Найдите слабое место в ответе',
        lead: 'Перед вами типичные ситуации. Отвечайте коротко и по делу.',
        tasks: [
          { title: 'Термин', q: 'Как называют уверенный, но выдуманный факт в ответе ИИ?', answer: ['галлюцинация', 'галлюцинации', 'hallucination', 'выдумка'], explain: 'Это галлюцинация модели: факт звучит правдоподобно, но его не существует.', hint: 'Слово связано с видением того, чего нет.' },
          { title: 'Причина', q: 'Почему модель может назвать устаревшее название города?', answer: ['устаревшие данные', 'старые данные', 'обучение', 'данные устарели', 'давно обучали'], explain: 'Она училась на старых текстах, где использовалось прежнее название.', hint: 'Дело в том, когда собирали тексты для обучения.' },
          { title: 'Выбор источника', q: 'Что надёжнее для проверки даты: ответ ИИ или официальный сайт организации?', answer: ['официальный сайт', 'сайт организации', 'официальный сайт организации', 'первоисточник'], explain: 'Первоисточник всегда надёжнее пересказа.', hint: 'Кто публикует сведения из первых рук?' },
          { title: 'Ложная подсказка', q: 'Как переформулировать вопрос, чтобы не подсказывать модели неверный ответ?', answer: ['нейтрально', 'без подсказки', 'нейтральная формулировка', 'открытый вопрос', 'не утверждать ложное'], explain: 'Спрашивайте нейтрально: «Какая столица Казахстана?», а не «Почему столица — Алматы?».', hint: 'Уберите из вопроса утверждение, которое надо проверить.' },
          { title: 'Действие', q: 'Сколько независимых источников достаточно как минимум для проверки важного факта?', answer: '2', type: 'number', explain: 'Минимум два независимых источника.', hint: 'Один источник может ошибаться.' }
        ],
        criteria: [
          { mark: '1 балл', text: 'Причина ошибки названа конкретно, а не «ИИ глупый».' },
          { mark: '1 балл', text: 'Для проверки предложен первоисточник.' },
          { mark: '1 балл', text: 'Вопрос сформулирован без подсказки ложного ответа.' }
        ]
      },
      {
        k: 'quiz',
        eyebrow: '07 · ПРОВЕРКА',
        questions: [
          { q: 'Что модель делает, отвечая на вопрос?', options: ['Ищет факт в справочнике', 'Предсказывает вероятное продолжение текста', 'Спрашивает человека', 'Запускает программу'], answer: 1, explain: 'Это языковая модель: она оценивает вероятности следующих слов.' },
          { q: 'Что такое галлюцинация ИИ?', options: ['Сбой питания', 'Правдоподобный, но выдуманный факт', 'Ошибка в браузере', 'Долгий ответ'], answer: 1, explain: 'Галлюцинация — уверенное утверждение, не соответствующее действительности.' },
          { q: 'Почему ответ может устареть?', options: ['Модель училась на старых данных', 'Модель забыла слова', 'Интернет медленный', 'Ответ слишком длинный'], answer: 0, explain: 'Знания модели ограничены датой обучения.' },
          { q: 'Что делать с числом из ответа ИИ?', options: ['Сразу использовать', 'Проверить по первоисточнику', 'Округлить', 'Удалить'], answer: 1, explain: 'Числа и даты проверяют по надёжному источнику.' },
          { q: 'Кто отвечает за итоговый текст доклада?', options: ['ИИ', 'Автор доклада', 'Разработчик модели', 'Никто'], answer: 1, explain: 'Ответственность остаётся у человека, использующего инструмент.' }
        ]
      },
      {
        k: 'summary',
        points: [
          'ИИ предсказывает вероятное продолжение, а не проверяет истину.',
          'Ошибки возникают из-за галлюцинаций, устаревших и смещённых данных.',
          'Ложный тезис в вопросе повышает риск неверного ответа.',
          'Проверка начинается с выделения проверяемых утверждений.',
          'Надёжность подтверждают два независимых источника.'
        ],
        ticket: [
          'Самый неожиданный вывод четверти для меня — ...',
          'Проверять ответ ИИ я буду так: ...',
          'Логические элементы нужны, потому что ...'
        ]
      }
    ]
  });
})();
