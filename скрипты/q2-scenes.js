/* ==========================================================================
   Q2 SCENES — анимированные SVG-иллюстрации титульных слайдов
   ========================================================================== */
(function () {
  'use strict';
  const S = (window.Q2_SCENES = window.Q2_SCENES || {});

  const wire = (x1, y1, x2, y2, cls) => `<line class="q2-scene-wire ${cls || ''}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"></line>`;
  const flow = (x1, y1, x2, y2, delay) => `<line class="q2-scene-flow" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" style="animation-delay:${delay || 0}s"></line>`;
  const label = (x, y, text, cls) => `<text class="q2-scene-label ${cls || ''}" x="${x}" y="${y}">${text}</text>`;

  S.lamp = function () {
    return `<svg viewBox="0 0 440 360" role="img" aria-label="Два выключателя, логический элемент и лампа">
      <defs>
        <radialGradient id="q2s-glow"><stop offset="0" stop-color="#fde68a" stop-opacity=".95"/><stop offset=".6" stop-color="#fbbf24" stop-opacity=".35"/><stop offset="1" stop-color="#fbbf24" stop-opacity="0"/></radialGradient>
        <linearGradient id="q2s-bulb" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fffbeb"/><stop offset="1" stop-color="#fcd34d"/></linearGradient>
      </defs>
      <g class="q2-scene-switch" transform="translate(28 78)">
        <rect width="104" height="44" rx="22"/><circle class="q2-scene-knob" cx="82" cy="22" r="16"/><text x="82" y="27">1</text><text class="q2-scene-name" x="52" y="66">A</text>
      </g>
      <g class="q2-scene-switch is-off" transform="translate(28 218)">
        <rect width="104" height="44" rx="22"/><circle class="q2-scene-knob" cx="22" cy="22" r="16"/><text x="22" y="27">0</text><text class="q2-scene-name" x="52" y="66">B</text>
      </g>
      ${wire(132, 100, 208, 148)}
      ${wire(132, 240, 208, 192)}
      ${flow(132, 100, 208, 148, 0)}
      ${flow(132, 240, 208, 192, 0.5)}
      <rect class="q2-scene-gate" x="208" y="112" width="92" height="116" rx="20"/>
      ${label(254, 180, '∧', 'q2-scene-gate-symbol')}
      ${wire(300, 170, 348, 170)}
      ${flow(300, 170, 348, 170, 1)}
      <g class="q2-scene-bulb is-on">
        <circle class="q2-scene-glow" cx="372" cy="170" r="58" fill="url(#q2s-glow)"/>
        <circle class="q2-scene-bulb-body" cx="372" cy="170" r="30" fill="url(#q2s-bulb)"/>
        <path d="M362 180l6-13 5 9 5-9 5 13" fill="none" stroke="#b45309" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
        <rect x="359" y="198" width="26" height="12" rx="5" fill="#b45309"/>
      </g>
      ${label(372, 262, 'лампа', 'q2-scene-caption')}
      <circle class="q2-scene-spark" cx="254" cy="72" r="4"/>
      <circle class="q2-scene-spark" cx="330" cy="286" r="3"/>
    </svg>`;
  };

  S.singleLamp = function () {
    return `<svg viewBox="0 0 640 380" role="img" aria-label="Домашний выключатель управляет лампочкой. Нажмите на выключатель, чтобы изменить состояние">
      <defs>
        <radialGradient id="q2-single-glow"><stop offset="0" stop-color="#fff9b0" stop-opacity="1"/><stop offset=".48" stop-color="#facc15" stop-opacity=".58"/><stop offset="1" stop-color="#fbbf24" stop-opacity="0"/></radialGradient>
        <linearGradient id="q2-single-wall" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6796a1"/><stop offset=".52" stop-color="#477783"/><stop offset="1" stop-color="#315d68"/></linearGradient>
        <radialGradient id="q2-single-bulb" cx=".35" cy=".24" r=".82"><stop offset="0" stop-color="#fffde8"/><stop offset=".52" stop-color="#fde047"/><stop offset="1" stop-color="#f59e0b"/></radialGradient>
        <linearGradient id="q2-single-metal" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#414c58"/><stop offset=".45" stop-color="#9aa5ae"/><stop offset="1" stop-color="#3d4854"/></linearGradient>
        <filter id="q2-single-shadow" x="-30%" y="-30%" width="160%" height="170%"><feDropShadow dx="9" dy="12" stdDeviation="8" flood-color="#173d45" flood-opacity=".5"/></filter>
        <filter id="q2-single-glass" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="3"/></filter>
      </defs>
      <rect x="12" y="12" width="616" height="356" rx="28" fill="url(#q2-single-wall)"/>
      <path d="M28 331 H 612" stroke="rgba(255,255,255,.07)" stroke-width="1"/>
      <path class="q2-home-wire" d="M116 247 H 146 M298 247 H 326 V 78 H 490 V 112 M490 238 H 610 V 350 H 116 V 265"/>
      <path class="q2-single-wire" data-q2-single-wire d="M116 247 H 146"/>
      <path class="q2-single-wire" data-q2-single-wire d="M298 247 H 326 V 78 H 490 V 112 M490 238 H 610 V 350 H 116 V 265"/>
      <g class="q2-home-source">
        <circle cx="98" cy="247" r="18"/>
        <path d="M91 247h14m-7-7v14" />
        <text x="98" y="283">СЕТЬ</text>
      </g>
      <g class="q2-single-switch" data-q2-single-switch role="button" tabindex="0" aria-pressed="false" aria-label="Домашний выключатель: 0, выключен. Нажмите, чтобы включить">
        <rect class="q2-home-plate" x="146" y="118" width="152" height="206" rx="22" filter="url(#q2-single-shadow)"/>
        <rect class="q2-home-plate-highlight" x="153" y="125" width="138" height="192" rx="17"/>
        <circle class="q2-home-screw" cx="164" cy="137" r="4"/><circle class="q2-home-screw" cx="280" cy="137" r="4"/>
        <circle class="q2-home-screw" cx="164" cy="305" r="4"/><circle class="q2-home-screw" cx="280" cy="305" r="4"/>
        <text class="q2-switch-label q2-switch-label-on" x="222" y="164">1 · ВКЛ</text>
        <text class="q2-switch-label q2-switch-label-off" x="222" y="286">0 · ВЫКЛ</text>
        <rect class="q2-rocker-track" x="185" y="175" width="74" height="100" rx="14"/>
        <path class="q2-rocker-groove" d="M194 184h56m-56 82h56"/>
        <g class="q2-rocker-thumb" data-q2-single-rocker>
          <rect x="191" y="222" width="62" height="46" rx="10"/>
          <path d="M204 244h36"/>
        </g>
      </g>
      <g class="q2-single-bulb" data-q2-single-bulb>
        <path class="q2-bulb-cord" d="M490 30v82"/>
        <circle class="q2-single-bulb-glow" cx="490" cy="166" r="88" fill="url(#q2-single-glow)" filter="url(#q2-single-glass)"/>
        <path class="q2-single-bulb-body" d="M458 145a32 32 0 1 1 64 0c0 20-13 30-18 49h-28c-5-19-18-29-18-49z" fill="url(#q2-single-bulb)"/>
        <path class="q2-bulb-highlight" d="M468 134c5-14 17-20 27-19" />
        <path class="q2-bulb-filament" d="m473 157 6 13q4 8 8 0t8 0q4 8 8 0l6-13"/>
        <path class="q2-single-bulb-base" d="M474 194h32v27h-32z" fill="url(#q2-single-metal)"/>
        <path class="q2-bulb-thread" d="M475 201h30m-30 7h30m-28 7h26"/>
        <path class="q2-bulb-terminal" d="M490 221v17"/>
        <g class="q2-bulb-rays">
          <path d="M490 91V79m-50 38-9-8m109 8 9-8m-126 43h-12m146 0h12m-135 35-10 7m112-7 10 7"/>
        </g>
        <text x="490" y="250" text-anchor="middle" class="q2-bulb-caption" data-q2-single-status>ЛАМПА ВЫКЛЮЧЕНА</text>
      </g>
      <rect class="q2-state-badge" data-q2-single-state-badge x="388" y="294" width="204" height="48" rx="16"/>
      <text class="q2-state-number" x="414" y="326" data-q2-single-value>0</text>
      <text class="q2-state-label" x="490" y="324" data-q2-single-state>СВЕТ ВЫКЛЮЧЕН</text>
    </svg>`;
  };

  S.truth = function () {
    const rows = [[0, 0, 0], [0, 1, 0], [1, 0, 0], [1, 1, 1]];
    return `<svg viewBox="0 0 420 360" role="img" aria-label="Таблица истинности с подсветкой строк">
      <rect class="q2-scene-panel" x="46" y="46" width="328" height="268" rx="24"/>
      ${label(210, 82, 'A   B   A ∧ B', 'q2-scene-table-head')}
      ${rows.map((row, i) => `<g class="q2-scene-row${row[2] ? ' is-true' : ''}" style="animation-delay:${i * 0.45}s">
        <rect x="66" y="${100 + i * 48}" width="288" height="38" rx="12"/>
        ${label(112, 125 + i * 48, String(row[0]), 'q2-scene-cell')}
        ${label(210, 125 + i * 48, String(row[1]), 'q2-scene-cell')}
        ${label(306, 125 + i * 48, String(row[2]), 'q2-scene-cell q2-scene-result')}
      </g>`).join('')}
      ${label(210, 336, 'истина только при A = 1 и B = 1', 'q2-scene-caption')}
    </svg>`;
  };

  S.gate = function () {
    return `<svg viewBox="0 0 440 360" role="img" aria-label="Логические элементы И, ИЛИ, НЕ">
      <g class="q2-scene-chip" transform="translate(36 46)">
        <rect width="168" height="112" rx="22"/>
        ${label(84, 40, 'И', 'q2-scene-chip-title')}
        <path d="M48 66 H 68 A 22 22 0 0 1 68 110 H 48 Z" class="q2-scene-gate-shape"/>
        ${label(84, 96, 'A ∧ B', 'q2-scene-chip-sub')}
      </g>
      <g class="q2-scene-chip" transform="translate(236 46)">
        <rect width="168" height="112" rx="22"/>
        ${label(84, 40, 'ИЛИ', 'q2-scene-chip-title')}
        <path d="M48 66 Q 94 88 48 110 Q 70 88 48 66 Z" class="q2-scene-gate-shape"/>
        ${label(84, 96, 'A ∨ B', 'q2-scene-chip-sub')}
      </g>
      <g class="q2-scene-chip" transform="translate(36 186)">
        <rect width="168" height="112" rx="22"/>
        ${label(84, 40, 'НЕ', 'q2-scene-chip-title')}
        <path d="M52 66 L 92 88 L 52 110 Z" class="q2-scene-gate-shape"/><circle cx="101" cy="88" r="7" class="q2-scene-gate-shape"/>
        ${label(84, 96, '¬A', 'q2-scene-chip-sub')}
      </g>
      <g class="q2-scene-chip is-accent" transform="translate(236 186)">
        <rect width="168" height="112" rx="22"/>
        ${label(84, 40, 'XOR', 'q2-scene-chip-title')}
        <path d="M48 66 Q 94 88 48 110 Q 70 88 48 66 Z" class="q2-scene-gate-shape"/>
        <path d="M40 66 Q 86 88 40 110" class="q2-scene-gate-shape" fill="none"/>
        ${label(84, 96, 'A ⊕ B', 'q2-scene-chip-sub')}
      </g>
      <circle class="q2-scene-spark" cx="220" cy="172" r="4"/>
    </svg>`;
  };

  S.circuit = function () {
    return `<svg viewBox="0 0 460 340" role="img" aria-label="Схема из двух логических элементов">
      ${label(26, 92, 'A', 'q2-scene-signal')}
      ${label(26, 250, 'B', 'q2-scene-signal')}
      <circle class="q2-scene-dot" cx="62" cy="86" r="5"/><circle class="q2-scene-dot" cx="62" cy="244" r="5"/>
      ${wire(62, 86, 150, 140)}${wire(62, 244, 150, 186)}
      ${flow(62, 86, 150, 140, 0)}${flow(62, 244, 150, 186, 0.4)}
      <rect class="q2-scene-gate" x="150" y="112" width="88" height="100" rx="18"/>
      ${label(194, 170, '∨', 'q2-scene-gate-symbol')}
      ${wire(238, 162, 322, 162)}${flow(238, 162, 322, 162, 0.8)}
      ${label(280, 148, 'S1', 'q2-scene-signal')}
      <rect class="q2-scene-gate" x="322" y="112" width="88" height="100" rx="18"/>
      ${label(366, 170, '¬', 'q2-scene-gate-symbol')}
      ${wire(410, 162, 438, 162)}${flow(410, 162, 438, 162, 1.2)}
      ${label(430, 140, 'Y', 'q2-scene-signal')}
      ${label(230, 300, 'сначала ИЛИ, затем НЕ', 'q2-scene-caption')}
      <circle class="q2-scene-spark" cx="282" cy="60" r="4"/>
      <circle class="q2-scene-spark" cx="120" cy="286" r="3"/>
    </svg>`;
  };

  S.ai = function () {
    return `<svg viewBox="0 0 440 360" role="img" aria-label="Вероятностный ответ модели ИИ">
      <defs><linearGradient id="q2s-ai-core" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8b5cf6"/><stop offset="1" stop-color="#06b6d4"/></linearGradient></defs>
      <circle class="q2-scene-orbit" cx="220" cy="150" r="112"/>
      <circle class="q2-scene-orbit is-inner" cx="220" cy="150" r="78"/>
      ${[0, 60, 120, 180, 240, 300].map((angle, i) => {
        const rad = angle * Math.PI / 180;
        const x = 220 + Math.cos(rad) * 112;
        const y = 150 + Math.sin(rad) * 112;
        return `<circle class="q2-scene-ai-node" cx="${x}" cy="${y}" r="11" style="animation-delay:${i * 0.2}s"/>`;
      }).join('')}
      <circle class="q2-scene-ai-core" cx="220" cy="150" r="48" fill="url(#q2s-ai-core)"/>
      ${label(220, 158, '?', 'q2-scene-ai-mark')}
      <g class="q2-scene-probs">
        <rect x="64" y="292" width="312" height="14" rx="7"/>
        <rect class="q2-scene-prob-a" x="64" y="292" width="230" height="14" rx="7"/>
        <rect class="q2-scene-prob-b" x="294" y="292" width="82" height="14" rx="7"/>
        ${label(64, 326, 'класс A · 74%', 'q2-scene-caption')}
        ${label(376, 326, '26%', 'q2-scene-caption')}
      </g>
      <circle class="q2-scene-spark" cx="350" cy="54" r="4"/>
      <circle class="q2-scene-spark" cx="70" cy="224" r="3"/>
    </svg>`;
  };

  S.recursion = function () {
    const boxes = [0, 1, 2, 3];
    return `<svg viewBox="0 0 420 370" role="img" aria-label="Стек рекурсивных вызовов">
      ${boxes.map(i => `<g class="q2-scene-stack${i === 3 ? ' is-base' : ''}" style="animation-delay:${i * 0.35}s">
        <rect x="${96 + i * 8}" y="${58 + i * 64}" width="${228 - i * 16}" height="50" rx="14"/>
        ${label(210, 89 + i * 64, i === 3 ? 'countdown(0) → стоп' : `countdown(${3 - i}) → ждёт`, 'q2-scene-stack-label')}
      </g>`).join('')}
      ${label(30, 84, 'вызов', 'q2-scene-side')}
      ${label(30, 276, 'возврат', 'q2-scene-side')}
      <path class="q2-scene-arrow" d="M62 96 V 268" marker-end="url(#q2s-arrow)"/>
      <defs><marker id="q2s-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 L10 5 L0 10z" fill="#7c8aa5"/></marker></defs>
      ${label(210, 344, 'база останавливает рекурсию', 'q2-scene-caption')}
    </svg>`;
  };

  S.recursionIntro = function () {
    const levels = [0, 1, 2, 3, 4];
    return `<svg viewBox="0 0 440 370" role="img" aria-label="Окно Python IDLE последовательно показывает вложенные шаги рекурсии">
      <style>
        @keyframes q2-rec-win-0 {
          0%, 4% { opacity: 0; transform: scale(0.84) translateY(8px); }
          11%, 84% { opacity: 1; transform: scale(1) translateY(0); }
          92%, 100% { opacity: 0; transform: scale(0.92) translateY(-4px); }
        }
        @keyframes q2-rec-win-1 {
          0%, 14% { opacity: 0; transform: scale(0.84) translateY(8px); }
          21%, 78% { opacity: 1; transform: scale(1) translateY(0); }
          86%, 100% { opacity: 0; transform: scale(0.92) translateY(-4px); }
        }
        @keyframes q2-rec-win-2 {
          0%, 24% { opacity: 0; transform: scale(0.84) translateY(8px); }
          31%, 72% { opacity: 1; transform: scale(1) translateY(0); }
          80%, 100% { opacity: 0; transform: scale(0.92) translateY(-4px); }
        }
        @keyframes q2-rec-win-3 {
          0%, 34% { opacity: 0; transform: scale(0.84) translateY(8px); }
          41%, 66% { opacity: 1; transform: scale(1) translateY(0); }
          74%, 100% { opacity: 0; transform: scale(0.92) translateY(-4px); }
        }
        @keyframes q2-rec-win-4 {
          0%, 44% { opacity: 0; transform: scale(0.84) translateY(8px); }
          51%, 60% { opacity: 1; transform: scale(1) translateY(0); }
          68%, 100% { opacity: 0; transform: scale(0.92) translateY(-4px); }
        }
        .q2-rec-window-frame {
          opacity: 0;
          transform-box: fill-box;
          transform-origin: center;
        }
        .q2-rec-w0 { animation: q2-rec-win-0 8.5s cubic-bezier(0.22, 1, 0.36, 1) infinite; }
        .q2-rec-w1 { animation: q2-rec-win-1 8.5s cubic-bezier(0.22, 1, 0.36, 1) infinite; }
        .q2-rec-w2 { animation: q2-rec-win-2 8.5s cubic-bezier(0.22, 1, 0.36, 1) infinite; }
        .q2-rec-w3 { animation: q2-rec-win-3 8.5s cubic-bezier(0.22, 1, 0.36, 1) infinite; }
        .q2-rec-w4 { animation: q2-rec-win-4 8.5s cubic-bezier(0.22, 1, 0.36, 1) infinite; }
      </style>
      <rect x="12" y="12" width="416" height="346" rx="20" fill="#dce8f1" stroke="#b8cbd8" stroke-width="2"/>
      <path d="M32 12h376a20 20 0 0 1 20 20v24H12V32a20 20 0 0 1 20-20z" fill="#f4f8fb"/>
      <circle cx="34" cy="34" r="6" fill="#f87171"/><circle cx="54" cy="34" r="6" fill="#fbbf24"/><circle cx="74" cy="34" r="6" fill="#34d399"/>
      <rect x="104" y="23" width="196" height="22" rx="8" fill="#e5edf3"/>
      <text x="202" y="39" text-anchor="middle" fill="#486174" font-family="sans-serif" font-size="13" font-weight="700">Python IDLE · recursion.py</text>
      <rect x="26" y="66" width="388" height="274" rx="14" fill="#eef6ff" stroke="#cbd5e1" stroke-width="1.5"/>
      ${levels.map((level) => {
        const x = 38 + level * 32;
        const y = 76 + level * 25;
        const width = 364 - level * 64;
        const height = 252 - level * 50;
        const fontSize = 18 - level * 2;
        const fills = ['#dbeafe', '#c7d2fe', '#bae6fd', '#a7f3d0', '#fef08a'];
        const strokes = ['#3b82f6', '#6366f1', '#0284c7', '#059669', '#d97706'];
        const textColors = ['#1e40af', '#3730a3', '#0369a1', '#065f46', '#92400e'];
        const titles = ['countdown(3)', 'countdown(2)', 'countdown(1)', 'countdown(0) → стоп', 'возврат ↑'];
        return `<g class="q2-rec-window-frame q2-rec-w${level}">
          <rect x="${x}" y="${y}" width="${width}" height="${height}" rx="12" fill="${fills[level]}" fill-opacity="0.92" stroke="${strokes[level]}" stroke-width="2"/>
          <rect x="${x}" y="${y}" width="${width}" height="22" rx="10" fill="rgba(255,255,255,0.68)"/>
          <circle cx="${x + 12}" cy="${y + 11}" r="3.5" fill="${strokes[level]}"/>
          <text x="${x + 24}" y="${y + 15}" fill="${textColors[level]}" font-family="monospace" font-size="11" font-weight="700">${titles[level]}</text>
          <text x="220" y="${y + height - 11}" text-anchor="middle" fill="${textColors[level]}" font-family="sans-serif" font-size="${fontSize}" font-weight="800" letter-spacing="0.02em">${level === 4 ? 'БАЗА ДОСТИГНУТА' : 'РЕКУРСИЯ'}</text>
        </g>`;
      }).join('')}
      <text x="220" y="353" text-anchor="middle" fill="#527083" font-family="sans-serif" font-size="12" font-weight="700">вызовы углубляются до базы, затем плавно возвращаются</text>
    </svg>`;
  };

  S.sort = function () {
    const items = [
      { id: 0, val: 7, h: 122 },
      { id: 1, val: 3, h: 66 },
      { id: 2, val: 9, h: 152 },
      { id: 3, val: 1, h: 38 },
      { id: 4, val: 5, h: 94 },
      { id: 5, val: 8, h: 138 }
    ];
    return `<svg viewBox="0 0 440 340" role="img" aria-label="Анимированная сортировка блоков по возрастанию" data-q2-auto-sort>
      <defs>
        <linearGradient id="q2s-bar-def" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#818cf8"/>
          <stop offset="1" stop-color="#4f46e5"/>
        </linearGradient>
        <linearGradient id="q2s-bar-cmp" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#fbbf24"/>
          <stop offset="1" stop-color="#d97706"/>
        </linearGradient>
        <linearGradient id="q2s-bar-ok" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#34d399"/>
          <stop offset="1" stop-color="#059669"/>
        </linearGradient>
      </defs>
      <rect class="q2-scene-panel" x="28" y="30" width="384" height="252" rx="24"/>
      <line x1="52" y1="234" x2="388" y2="234" stroke="rgba(148,163,184,0.35)" stroke-width="2" stroke-linecap="round"/>
      <g class="q2-autosort-bars">
        ${items.map((item, slot) => {
          const x = 58 + slot * 56;
          const y = 232 - item.h;
          return `<g class="q2-autosort-item" data-item-id="${item.id}" data-val="${item.val}" data-h="${item.h}" transform="translate(${x} 0)">
            <rect class="q2-autosort-rect" x="0" y="${y}" width="42" height="${item.h}" rx="12"/>
            <rect class="q2-autosort-badge" x="5" y="242" width="32" height="26" rx="8"/>
            <text class="q2-autosort-val" x="21" y="260" text-anchor="middle">${item.val}</text>
          </g>`;
        }).join('')}
      </g>
      <text class="q2-scene-caption" data-sort-status x="220" y="314" text-anchor="middle">блоки плавно меняются местами до полного порядка</text>
    </svg>`;
  };

  S.graph = function () {
    const nodes = [['A', 76, 92], ['B', 214, 62], ['C', 214, 172], ['D', 352, 112], ['E', 352, 242]];
    const edges = [['A', 'B'], ['A', 'C'], ['B', 'D'], ['C', 'D'], ['D', 'E']];
    const pos = Object.fromEntries(nodes.map(([id, x, y]) => [id, [x, y]]));
    return `<svg viewBox="0 0 440 330" role="img" aria-label="Граф из пяти вершин">
      ${edges.map(([u, v], i) => `<line class="q2-scene-edge" x1="${pos[u][0]}" y1="${pos[u][1]}" x2="${pos[v][0]}" y2="${pos[v][1]}" style="animation-delay:${i * 0.18}s"></line>
        <line class="q2-scene-edge-flow" x1="${pos[u][0]}" y1="${pos[u][1]}" x2="${pos[v][0]}" y2="${pos[v][1]}" style="animation-delay:${i * 0.18 + 0.4}s"></line>`).join('')}
      ${nodes.map(([id, x, y], i) => `<g class="q2-scene-node${i === 0 ? ' is-start' : ''}" style="animation-delay:${i * 0.2}s">
        <circle cx="${x}" cy="${y}" r="24"/><text x="${x}" y="${y + 5}">${id}</text></g>`).join('')}
      ${label(220, 308, 'вершины · рёбра · пути', 'q2-scene-caption')}
    </svg>`;
  };

  S.bfs = function () {
    return `<svg viewBox="0 0 440 340" role="img" aria-label="Поиск в ширину по уровням">
      <circle class="q2-scene-ring" cx="220" cy="156" r="118"/>
      <circle class="q2-scene-ring is-mid" cx="220" cy="156" r="76"/>
      <circle class="q2-scene-ring is-in" cx="220" cy="156" r="36"/>
      <g class="q2-scene-node is-start"><circle cx="220" cy="156" r="24"/><text x="220" y="161">A</text></g>
      ${[['B', 138, 92], ['C', 300, 92]].map(([id, x, y], i) => `<g class="q2-scene-node is-level" style="animation-delay:${0.4 + i * 0.2}s"><circle cx="${x}" cy="${y}" r="22"/><text x="${x}" y="${y + 5}">${id}</text></g>
        <line class="q2-scene-edge-flow" x1="220" y1="156" x2="${x}" y2="${y}" style="animation-delay:${0.3 + i * 0.2}s"></line>`).join('')}
      ${[['D', 96, 226], ['E', 220, 256], ['F', 344, 226]].map(([id, x, y], i) => `<g class="q2-scene-node is-level-2" style="animation-delay:${0.9 + i * 0.2}s"><circle cx="${x}" cy="${y}" r="20"/><text x="${x}" y="${y + 5}">${id}</text></g>`).join('')}
      ${label(220, 320, 'сначала все соседи, потом следующий уровень', 'q2-scene-caption')}
    </svg>`;
  };

  S.dfs = function () {
    return `<svg viewBox="0 0 440 340" role="img" aria-label="Поиск в глубину по одной ветви">
      <path class="q2-scene-deep" d="M76 92 L 160 92 L 244 132 L 328 132 L 372 208" fill="none"/>
      ${[['A', 76, 92], ['B', 160, 92], ['C', 244, 132], ['D', 328, 132], ['E', 372, 208]].map(([id, x, y], i) => `<g class="q2-scene-node is-deep" style="animation-delay:${i * 0.28}s"><circle cx="${x}" cy="${y}" r="22"/><text x="${x}" y="${y + 5}">${id}</text></g>`).join('')}
      <g class="q2-scene-stack-mini" transform="translate(52 206)">
        <rect width="120" height="82" rx="14"/>
        ${['A', 'B', 'C'].map((id, i) => `<text x="16" y="${26 + i * 20}">${id}</text>`).join('')}
      </g>
      ${label(300, 276, 'стек', 'q2-scene-side')}
      ${label(220, 320, 'идём вглубь, пока есть непосещённый сосед', 'q2-scene-caption')}
    </svg>`;
  };

  S.weighted = function () {
    return `<svg viewBox="0 0 460 340" role="img" aria-label="Взвешенный граф с двумя маршрутами" data-q2-float-graph="weighted">
      <!-- Edges -->
      <g class="q2-float-edge" data-from="A" data-to="B">
        <line class="q2-scene-edge" x1="90" y1="157" x2="190" y2="97"></line>
        <line class="q2-scene-edge-flow" x1="90" y1="157" x2="190" y2="97"></line>
      </g>
      <g class="q2-float-edge" data-from="B" data-to="D">
        <line class="q2-scene-edge" x1="231" y1="95" x2="351" y2="159"></line>
        <line class="q2-scene-edge-flow" x1="231" y1="95" x2="351" y2="159"></line>
      </g>
      <g class="q2-float-edge" data-from="A" data-to="C">
        <line class="q2-scene-edge is-short" x1="90" y1="183" x2="190" y2="243"></line>
        <line class="q2-scene-edge-flow" x1="90" y1="183" x2="190" y2="243"></line>
      </g>
      <g class="q2-float-edge" data-from="C" data-to="D">
        <line class="q2-scene-edge is-short" x1="231" y1="245" x2="351" y2="181"></line>
        <line class="q2-scene-edge-flow" x1="231" y1="245" x2="351" y2="181"></line>
      </g>

      <!-- Weights -->
      <g class="q2-scene-weight" data-edge="A-B">
        <rect x="126" y="115" width="28" height="22" rx="8"></rect>
        <text x="140" y="131">7</text>
      </g>
      <g class="q2-scene-weight" data-edge="B-D">
        <rect x="277" y="115" width="28" height="22" rx="8"></rect>
        <text x="291" y="131">8</text>
      </g>
      <g class="q2-scene-weight" data-edge="A-C">
        <rect x="126" y="201" width="28" height="22" rx="8"></rect>
        <text x="140" y="217">7</text>
      </g>
      <g class="q2-scene-weight" data-edge="C-D">
        <rect x="277" y="201" width="28" height="22" rx="8"></rect>
        <text x="291" y="217">8</text>
      </g>

      <!-- Nodes -->
      <g class="q2-scene-node is-start" data-node="A">
        <circle cx="70" cy="170" r="24"></circle>
        <text x="70" y="175">A</text>
      </g>
      <g class="q2-scene-node is-level" data-node="B">
        <circle cx="210" cy="84" r="24"></circle>
        <text x="210" y="89">B</text>
      </g>
      <g class="q2-scene-node is-level-2" data-node="C">
        <circle cx="210" cy="256" r="24"></circle>
        <text x="210" y="261">C</text>
      </g>
      <g class="q2-scene-node is-deep" data-node="D">
        <circle cx="372" cy="170" r="24"></circle>
        <text x="372" y="175">D</text>
      </g>
    </svg>`;
  };

  S.project = function () {
    return `<svg viewBox="0 0 440 340" role="img" aria-label="Обработка набора данных">
      <rect class="q2-scene-panel" x="42" y="52" width="356" height="228" rx="24"/>
      ${[0, 1, 2, 3, 4].map(i => `<g class="q2-scene-row" style="animation-delay:${i * 0.2}s">
        <rect x="66" y="${78 + i * 36}" width="308" height="26" rx="8"/>
        <circle cx="86" cy="${91 + i * 36}" r="6"/>
        ${label(112, 96 + i * 36, ['700', '350', '500', '200', '450'][i], 'q2-scene-cell')}
        ${label(300, 96 + i * 36, '·', 'q2-scene-cell')}
      </g>`).join('')}
      <rect class="q2-scene-progress" x="66" y="262" width="308" height="8" rx="4"/>
      <rect class="q2-scene-progress-fill" x="66" y="262" width="214" height="8" rx="4"/>
      ${label(220, 316, 'отсортировать → найти → объяснить', 'q2-scene-caption')}
    </svg>`;
  };
})();
