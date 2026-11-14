/* ==========================================================================
   ALASSTER.SITE — Q2 LESSON ENGINE
   Общий слой уроков 2 четверти (9, 10 ЕМН, 10 ОГН, 11 классы).
   Данные уроков лежат в q2-9.js, q2-10emn.js, q2-10ogn.js, q2-11.js.
   Движок не меняет поведение уроков 1 четверти.
   ========================================================================== */
(function () {
  'use strict';

  const Q2 = (window.Q2 = window.Q2 || { lessons: {} });
  Q2.add = function (id, data) {
    Q2.lessons[id] = data;
  };

  const widgetStore = new Map();
  let widgetSeq = 0;

  /* ------------------------------- утилиты ------------------------------- */
  const esc = value => String(value == null ? '' : value)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const attr = value => esc(value).replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/\n/g, ' ');
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  function shuffledCopy(items) {
    const result = Array.from(items || []);
    for (let i = result.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  function hl(line) {
    const tokens = /("[^"]*"|'[^']*'|#[^\n]*|\b(?:def|return|if|elif|else|for|while|in|not|and|or|True|False|None|print|input|int|str|float|len|range|append|sorted|sort|split|map|reverse|end|list|sum|abs)\b|\b\d+(?:\.\d+)?\b)/g;
    return esc(line).replace(tokens, match => {
      if (match[0] === '#') return `<span class="q2-tok-c">${match}</span>`;
      if (match[0] === '"' || match[0] === "'") return `<span class="q2-tok-s">${match}</span>`;
      if (/^\d/.test(match)) return `<span class="q2-tok-n">${match}</span>`;
      return `<span class="q2-tok-k">${match}</span>`;
    });
  }

  function codeBlock(block) {
    const source = String(block.code || '').replace(/\s+$/, '');
    const lines = source.split('\n');
    const codeHtml = `<div class="q2-code${block.compact ? ' is-compact' : ''}">
      <div class="q2-code-head">
        <span class="q2-code-dots"><i></i><i></i><i></i></span>
        <span class="q2-code-title">${esc(block.title || 'Python')}</span>
        ${block.trace ? `<span class="q2-code-live-badge" data-runner-pill><i class="fas fa-circle-play"></i> Трассировка</span>` : ''}
      </div>
      <pre><code>${lines.map((line, index) =>
        `<span class="q2-code-line" data-line="${index + 1}"><span class="q2-ln">${index + 1}</span>${hl(line) || ' '}</span>`
      ).join('')}</code></pre>
      ${block.caption ? `<p class="q2-caption">${block.caption}</p>` : ''}
    </div>`;

    if (!block.trace || !Array.isArray(block.trace.steps)) {
      return codeHtml;
    }

    const steps = block.trace.steps;

    return `<div class="q2-code-runner" data-q2-code-runner>
      ${codeHtml}
      <div class="q2-exec-console">
        <div class="q2-exec-console-head">
          <span><i class="fas fa-terminal"></i> Результат в консоли (Python Shell)</span>
          <span class="q2-exec-counter" data-runner-counter>Шаг 1 / ${steps.length}</span>
        </div>
        <div class="q2-exec-console-body">
          ${block.trace.cmd ? `<div class="q2-exec-cmd">&gt;&gt;&gt; ${esc(block.trace.cmd)}</div>` : ''}
          ${steps.map((st, idx) => {
            const text = st.out != null ? st.out : `${st.call || ''}  →  ${st.desc || ''}`;
            const isResult = st.out != null;
            return `<div class="q2-exec-out-line${isResult ? ' is-result-line' : ' is-trace-line'}" data-out-step="${idx}" data-target-line="${st.line || 1}">${esc(text)}</div>`;
          }).join('')}
        </div>
      </div>
    </div>`;
  }

  /* ------------------------------- блоки -------------------------------- */
  function block(item) {
    if (!item) return '';
    if (item.t === 'widget') return widget(item.kind, item.config || {});
    switch (item.t) {
      case 'lead':
        return `<p class="lead">${item.text}</p>`;
      case 'p':
        return `<p class="${item.cls || ''}">${item.text}</p>`;
      case 'html':
        return item.html;
      case 'definition':
        return `<div class="definition q2-definition">
          <h3>${item.icon ? `<i class="${item.icon}"></i> ` : ''}${item.title || ''}</h3>
          <p>${item.text}</p>
        </div>`;
      case 'callout':
        return `<div class="callout q2-callout${item.tone ? ` q2-tone-${item.tone}` : ''}">
          ${item.title ? `<h3>${item.icon ? `<i class="${item.icon}"></i> ` : ''}${item.title}</h3>` : ''}
          <p>${item.text}</p>
        </div>`;
      case 'quote':
        return `<div class="quote q2-quote"><div class="quote-badge"><i class="fa-solid fa-quote-left" aria-hidden="true"></i></div>
          <div class="quote-content"><p class="quote-text">${item.text}</p>
          ${item.author ? `<p class="q2-quote-author">${item.author}</p>` : ''}</div></div>`;
      case 'cards': {
        const cols = item.cols || 3;
        return `<div class="q2-grid q2-grid-${cols}">${(item.items || []).map(card => `
          <article class="q2-card${card.tone ? ` q2-card-${card.tone}` : ''}">
            ${card.badge ? `<span class="q2-card-badge">${card.badge}</span>` : ''}
            <div class="q2-card-heading">
              ${card.icon ? `<span class="q2-card-icon"><i class="${card.icon}"></i></span>` : ''}
              <h3>${card.title}</h3>
            </div>
            <p>${card.text}</p>
            ${card.code ? codeBlock({ code: Array.isArray(card.code) ? card.code.join('\n') : card.code, title: card.codeTitle || 'Python', compact: true }) : ''}
            ${card.footer ? `<div class="q2-card-footer">${card.footer}</div>` : ''}
          </article>`).join('')}</div>`;
      }
      case 'list':
        return `<div class="q2-panel q2-list-panel">
          ${item.title ? `<h3>${item.icon ? `<i class="${item.icon}"></i> ` : ''}${item.title}</h3>` : ''}
          <ul class="clean-list q2-list">${(item.items || []).map(row =>
            `<li class="check-line">${row.icon ? `<i class="${row.icon}"></i>` : '<i class="fas fa-circle-check"></i>'}<span>${typeof row === 'string' ? row : row.text}</span></li>`
          ).join('')}</ul>
        </div>`;
      case 'steps':
        return `<div class="q2-steps${item.cls ? ` ${item.cls}` : ''}">${(item.items || []).map((step, index) => `
          <div class="q2-step">
            ${step.icon ? `<span class="q2-step-icon"><i class="${step.icon}"></i></span>` : `<span class="q2-step-num">${step.badge || (index + 1)}</span>`}
            <div><h4>${step.title}</h4><p>${step.text}</p></div>
          </div>`).join('')}</div>`;
      case 'split':
        return `<div class="q2-split${item.cls ? ` ${item.cls}` : ''}"${item.style ? ` style="${item.style}"` : ''}>
          <div class="q2-split-col q2-split-left">${blocks(item.left)}</div>
          <div class="q2-split-col q2-split-right">${blocks(item.right)}</div>
        </div>`;
      case 'tabs': {
        const tabs = item.items || [];
        return `<div class="q2-tabs-widget${item.cls ? ` ${item.cls}` : ''}">
          <div class="q2-tabs-nav" role="tablist">
            ${tabs.map((tab, idx) => `
              <button type="button" class="q2-tab-btn${idx === 0 ? ' is-active' : ''}" data-tab="${idx}" role="tab" aria-selected="${idx === 0}">
                ${tab.icon ? `<i class="${tab.icon}"></i>` : ''}
                <span class="q2-tab-title">${tab.label || tab.title}</span>
                ${tab.badge ? `<span class="q2-tab-badge">${tab.badge}</span>` : ''}
              </button>
            `).join('')}
          </div>
          <div class="q2-tabs-content">
            ${tabs.map((tab, idx) => `
              <div class="q2-tab-pane${idx === 0 ? ' is-active' : ''}" data-pane="${idx}" role="tabpanel">
                ${tab.blocks ? blocks(tab.blocks) : (tab.html || (tab.text ? `<p>${tab.text}</p>` : ''))}
              </div>
            `).join('')}
          </div>
        </div>`;
      }
      case 'table':
        return `<div class="q2-table-wrap"><table class="q2-table">
          ${item.caption ? `<caption>${item.caption}</caption>` : ''}
          <thead><tr>${(item.head || []).map(cell => `<th>${cell}</th>`).join('')}</tr></thead>
          <tbody>${(item.rows || []).map((row, rowIndex) => `<tr class="${item.highlight === rowIndex ? 'is-highlight' : ''}">
            ${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('')}</tbody>
        </table></div>`;
      case 'compare':
        return `<div class="q2-compare">
          <div class="q2-compare-col q2-compare-left"><h4>${item.left.title}</h4><ul>${(item.left.items || []).map(x => `<li>${x}</li>`).join('')}</ul></div>
          <div class="q2-compare-vs">${item.vs || 'и'}</div>
          <div class="q2-compare-col q2-compare-right"><h4>${item.right.title}</h4><ul>${(item.right.items || []).map(x => `<li>${x}</li>`).join('')}</ul></div>
        </div>`;
      case 'code':
        return codeBlock(item);
      case 'note':
        return `<details class="q2-ref"${item.open ? ' open' : ''}>
          <summary><i class="fas fa-book-open"></i> ${item.title || 'Напоминание Python'}</summary>
          <div class="q2-ref-body">${item.html || ''}</div>
        </details>`;
      case 'svg':
        return `<div class="q2-svg-wrap${item.compact ? ' q2-svg-compact' : ''}${item.cls ? ` ${item.cls}` : ''}">${item.resettable ? '<button type="button" class="q2-svg-reset" title="Сбросить на 0 0 0" aria-label="Сбросить на 0 0 0"><i class="fas fa-rotate-left"></i></button>' : ''}${item.svg}${item.caption ? `<p class="q2-caption">${item.caption}</p>` : ''}</div>`;
      case 'rubric':
        return `<div class="q2-panel q2-rubric-panel"><h3><i class="fas fa-list-check"></i> ${item.title || 'Критерии успеха'}</h3>
          <div class="rubric">${(item.items || []).map(row => `<div class="rubric-row"><strong>${row.mark || '✓'}</strong><span>${row.text}</span></div>`).join('')}</div></div>`;
      default:
        return '';
    }
  }

  function blocks(list) {
    return (list || []).map(block).join('');
  }

  /* ------------------------------- виджеты ------------------------------- */
  function widget(kind, config) {
    const id = 'q2w' + (++widgetSeq);
    widgetStore.set(id, { kind, config });
    return `<div class="q2-widget" data-q2-w="${id}"></div>`;
  }

  const WIDGETS = {};

  /* ------------------------------ визуалы -------------------------------- */
  function svgScene(kind, config) {
    const scenes = window.Q2_SCENES || {};
    return scenes[kind] ? scenes[kind](config || {}) : '';
  }

  /* ------------------------------- слайды -------------------------------- */
  function heroEyebrow(slide, lesson) {
    const raw = (slide && slide.eyebrow ? String(slide.eyebrow).trim() : '');
    if (raw && !/^0?1\s*·\s*введение$/i.test(raw)) {
      return raw;
    }
    if (lesson && lesson.cls && lesson.num != null) {
      return `${String(lesson.cls).toUpperCase()} · 2 ЧЕТВЕРТЬ · УРОК ${lesson.num}`;
    }
    return raw || '01 · ВВЕДЕНИЕ';
  }

  function formatEyebrow(rawEyebrow, index) {
    const raw = (rawEyebrow ? String(rawEyebrow).trim() : '');
    if (!raw) return '';
    if (typeof index === 'number' && index > 0 && !/четверть/i.test(raw)) {
      const clean = raw.replace(/^\d+\s*·\s*/, '').trim();
      return `${String(index + 1).padStart(2, '0')} · ${clean}`;
    }
    return raw;
  }

  function heroSlide(slide, lesson) {
    return `<section class="slide q2-slide q2-hero-slide active">
      <div class="container q2-hero">
        <div class="q2-hero-copy">
          <span class="eyebrow">${heroEyebrow(slide, lesson)}</span>
          <h1>${slide.title}</h1>
          <p class="lead">${slide.lead || ''}</p>
          ${slide.goal ? `<div class="q2-goal"><div class="q2-goal-header"><span class="q2-goal-code"><i class="fa-solid fa-crosshairs"></i> ${slide.goalCode || 'Цель'}</span><span class="q2-goal-title">ЦЕЛЬ ОБУЧЕНИЯ</span></div><p>${slide.goal}</p></div>` : ''}
          ${slide.chips ? `<div class="chips">${slide.chips.map(chip => `<span class="chip">${chip.icon ? `<i class="${chip.icon}"></i>` : ''}${chip.text || chip}</span>`).join('')}</div>` : ''}
          <div class="q2-hero-actions">
            <button class="start-btn" type="button" onclick="changeSlide(1)">${slide.cta || 'Начать урок'} <i class="fas fa-arrow-right"></i></button>
            ${slide.note ? `<span class="q2-hero-note">${slide.note}</span>` : ''}
          </div>
        </div>
        <div class="q2-visual">
          ${slide.visual && slide.visual.trim().startsWith('<svg') ? slide.visual : svgScene(slide.visual || 'lamp', slide.visualConfig)}
          ${slide.visualCaption ? `<p class="q2-visual-caption">${slide.visualCaption}</p>` : ''}
        </div>
      </div>
    </section>`;
  }

  function head(slide, index) {
    const eb = formatEyebrow(slide.eyebrow, index);
    const main = `${eb ? `<span class="eyebrow">${eb}</span>` : ''}
      ${slide.title ? `<h2>${slide.title}</h2>` : ''}
      ${slide.lead ? `<p class="lead">${slide.lead}</p>` : ''}`;
    if (slide.headAside) {
      return `<div class="q2-head-split"><div class="q2-head-main">${main}</div><div class="q2-head-aside">${slide.headAside}</div></div>`;
    }
    return main;
  }

  function renderSlide(slide, index, lesson) {
    if ((slide.k || 'concept') === 'hero') return heroSlide(slide, lesson);
    const kind = slide.k || 'concept';
    let body = '';
    if (kind === 'concept') {
      body = `${head(slide, index)}${blocks(slide.blocks)}`;
    } else if (kind === 'lab') {
      body = `${head(slide, index)}${blocks(slide.before)}${widget(slide.widget.kind, slide.widget.config || {})}${blocks(slide.after)}`;
    } else if (kind === 'practice') {
      const tasks = slide.tasks ? widget('mini', { tasks: slide.tasks }) : '';
      body = `${head(slide, index)}${blocks(slide.before)}${tasks}${blocks(slide.after)}
        ${slide.criteria ? block({ t: 'rubric', title: slide.criteriaTitle || 'Дескриптор', items: slide.criteria }) : ''}`;
    } else if (kind === 'review') {
      body = `${head({ eyebrow: slide.eyebrow || '02 · ПОВТОРЕНИЕ', title: slide.title || 'Повторение предыдущей темы', lead: slide.lead || 'Ответьте на 5 вопросов — они помогут вспомнить главное перед новой темой.' }, index)}${widget('quiz', { questions: slide.questions, variant: 'review', shuffleOptions: slide.shuffleOptions })}`;
    } else if (kind === 'quiz') {
      body = `${head({ eyebrow: slide.eyebrow || 'ПРОВЕРКА', title: slide.title || 'Мини-проверка', lead: slide.lead || 'Пять вопросов по теме урока. Выберите один ответ в каждом.' }, index)}${widget('quiz', { questions: slide.questions })}`;
    } else if (kind === 'summary') {
      body = `${head({ eyebrow: slide.eyebrow || 'ИТОГИ УРОКА', title: slide.title || 'Итоги урока', lead: slide.lead || '' }, index)}
        <div class="q2-summary-grid">
          <div class="q2-panel q2-summary-points"><h3><i class="fas fa-check-double"></i> Главное</h3>
            <ul class="clean-list">${(slide.points || []).map(point => `<li class="check-line"><i class="fas fa-check"></i><span>${point}</span></li>`).join('')}</ul>
          </div>
          <div class="q2-panel q2-ticket"><h3><i class="fas fa-ticket"></i> ${slide.ticketTitle || 'Выходной билет'}</h3>
            <p>${slide.ticketLead || 'Закончите предложения в тетради:'}</p>
            <ul>${(slide.ticket || []).map(line => `<li><i class="fas fa-pen"></i><span>${line}</span></li>`).join('')}</ul>
            <button class="start-btn" type="button" onclick="goToSlide(0)">Вернуться в начало <i class="fas fa-rotate-left"></i></button>
          </div>
        </div>
        ${slide.criteria ? block({ t: 'rubric', title: slide.criteriaTitle || 'Дескриптор', items: slide.criteria }) : ''}`;
    } else {
      body = `${head(slide, index)}${blocks(slide.blocks)}`;
    }
    return `<section class="slide q2-slide q2-slide-${kind}">
      <div class="container">${body}</div>
    </section>`;
  }

  /* ---------------------------- инициализация ---------------------------- */
  function initWidgets(root) {
    root.querySelectorAll('.q2-svg-reset').forEach(btn => {
      btn.addEventListener('click', () => {
        const wrap = btn.closest('.q2-svg-wrap');
        if (!wrap) return;
        wrap.querySelectorAll('.q2-lock-reel, .q2-tt3-anim').forEach(el => {
          el.style.animation = 'none';
          void el.getBoundingClientRect();
          el.style.animation = '';
        });
      });
    });
    root.querySelectorAll('[data-q2-w]').forEach(node => {
      const record = widgetStore.get(node.dataset.q2W);
      if (!record) return;
      const impl = WIDGETS[record.kind];
      if (!impl) {
        node.innerHTML = '<p class="q2-muted">Интерактив недоступен.</p>';
        return;
      }
      try {
        impl(node, record.config || {});
      } catch (error) {
        console.error('Q2 widget error:', record.kind, error);
        node.innerHTML = '<p class="q2-muted">Не удалось запустить интерактив. Обновите страницу.</p>';
      }
    });
  }

  function initSingleLamp(root) {
    root.querySelectorAll('[data-q2-single-switch]').forEach(control => {
      const svg = control.closest('svg');
      const bulb = svg && svg.querySelector('[data-q2-single-bulb]');
      const rocker = control.querySelector('[data-q2-single-rocker]');
      const wires = svg && svg.querySelectorAll('[data-q2-single-wire]');
      const status = svg && svg.querySelector('[data-q2-single-status]');
      const value = svg && svg.querySelector('[data-q2-single-value]');
      const state = svg && svg.querySelector('[data-q2-single-state]');
      const stateBadge = svg && svg.querySelector('[data-q2-single-state-badge]');
      if (!svg || !bulb || !rocker || !wires) return;

      const toggle = () => {
        const isOn = control.getAttribute('aria-pressed') !== 'true';
        control.setAttribute('aria-pressed', String(isOn));
        control.setAttribute('aria-label', `Домашний выключатель: ${isOn ? '1, включён' : '0, выключен'}. Нажмите, чтобы ${isOn ? 'выключить' : 'включить'}`);
        rocker.classList.toggle('is-on', isOn);
        rocker.setAttribute('transform', isOn ? 'translate(0 -46)' : 'translate(0 0)');
        bulb.classList.toggle('is-on', isOn);
        wires.forEach(wire => wire.classList.toggle('is-on', isOn));
        if (stateBadge) stateBadge.classList.toggle('is-on', isOn);
        if (status) status.textContent = `ЛАМПА ${isOn ? 'ГОРИТ' : 'ВЫКЛЮЧЕНА'}`;
        if (value) {
          value.textContent = isOn ? '1' : '0';
          value.classList.toggle('is-on', isOn);
        }
        if (state) state.textContent = isOn ? 'СВЕТ ВКЛЮЧЕН' : 'СВЕТ ВЫКЛЮЧЕН';
      };

      control.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();
        toggle();
      });
      control.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ' || event.code === 'Space') {
          event.preventDefault();
          toggle();
        }
      });
    });
  }

  function initAutoSort(root) {
    root.querySelectorAll('[data-q2-auto-sort]').forEach(svg => {
      if (svg.dataset.autoSortBound === '1') return;
      svg.dataset.autoSortBound = '1';
      const nodes = Array.from(svg.querySelectorAll('.q2-autosort-item'));
      const statusNode = svg.querySelector('[data-sort-status]');
      if (!nodes.length) return;

      const baseX = 58;
      const stepX = 56;
      const items = nodes.map((node, index) => ({
        node,
        val: Number(node.dataset.val),
        slot: index
      }));

      const presets = [
        [7, 3, 9, 1, 5, 8],
        [9, 5, 1, 8, 3, 7],
        [5, 9, 3, 8, 1, 7],
        [8, 1, 7, 3, 9, 5]
      ];
      let presetIdx = 0;

      const applyPositions = (compareSlots = [], sortedFromSlot = items.length, allSorted = false) => {
        items.forEach(item => {
          const x = baseX + item.slot * stepX;
          const isCmp = compareSlots.includes(item.slot);
          const liftY = isCmp ? -8 : 0;
          item.node.setAttribute('transform', `translate(${x} ${liftY})`);
          item.node.style.transform = `translate(${x}px, ${liftY}px)`;
          item.node.classList.toggle('is-compare', isCmp);
          item.node.classList.toggle('is-sorted', allSorted || item.slot >= sortedFromSlot);
        });
      };

      const buildSteps = () => {
        const sim = items.slice().sort((a, b) => a.slot - b.slot).map(it => it.val);
        const n = sim.length;
        const steps = [];
        for (let pass = 0; pass < n - 1; pass++) {
          let swapped = false;
          for (let j = 0; j < n - 1 - pass; j++) {
            if (sim[j] > sim[j + 1]) {
              steps.push({ type: 'swap', a: j, b: j + 1, sortedFrom: n - pass, aVal: sim[j], bVal: sim[j + 1] });
              const t = sim[j];
              sim[j] = sim[j + 1];
              sim[j + 1] = t;
              swapped = true;
            }
          }
          if (!swapped) break;
        }
        return steps;
      };

      let timer = null;
      const wait = ms => new Promise(resolve => { timer = setTimeout(resolve, ms); });

      const runLoop = async () => {
        while (document.body.contains(svg)) {
          const steps = buildSteps();
          for (const st of steps) {
            if (!document.body.contains(svg)) return;
            if (statusNode) statusNode.textContent = `сравниваем ${st.aVal} и ${st.bVal} → меняем местами`;
            applyPositions([st.a, st.b], st.sortedFrom, false);
            await wait(240);
            const leftItem = items.find(it => it.slot === st.a);
            const rightItem = items.find(it => it.slot === st.b);
            if (leftItem && rightItem) {
              leftItem.slot = st.b;
              rightItem.slot = st.a;
            }
            applyPositions([st.a, st.b], st.sortedFrom, false);
            await wait(520);
          }

          if (statusNode) statusNode.textContent = 'готово: 1, 3, 5, 7, 8, 9 — по возрастанию!';
          applyPositions([], 0, true);
          await wait(1150);

          presetIdx = (presetIdx + 1) % presets.length;
          const nextOrder = presets[presetIdx];
          if (statusNode) statusNode.textContent = 'перемешиваем элементы и сортируем заново…';
          items.forEach(it => {
            const newSlot = nextOrder.indexOf(it.val);
            if (newSlot !== -1) it.slot = newSlot;
          });
          applyPositions([], items.length, false);
          await wait(780);
        }
      };

      applyPositions([], items.length, false);
      runLoop();
    });
  }

  /* ------------------- динамический парящий граф со связанными весами ------------------ */
  function initFloatGraphs(root) {
    root.querySelectorAll('[data-q2-float-graph]').forEach(svg => {
      if (svg.dataset.floatBound === '1') return;
      svg.dataset.floatBound = '1';

      const vb = (svg.getAttribute('viewBox') || '0 0 460 340').split(' ').map(Number);
      const vbW = vb[2] || 460;
      const vbH = vb[3] || 340;
      const padding = 34;
      const minX = padding;
      const maxX = vbW - padding;
      const minY = padding;
      const maxY = vbH - (padding + 22);

      const nodeElements = Array.from(svg.querySelectorAll('.q2-scene-node'));
      if (!nodeElements.length) return;

      const nodes = nodeElements.map((el, i) => {
        const circle = el.querySelector('circle');
        const text = el.querySelector('text');
        const id = el.dataset.node || (text ? text.textContent.trim() : String.fromCharCode(65 + i));
        const initX = circle ? Number(circle.getAttribute('cx')) || (70 + i * 90) : 70;
        const initY = circle ? Number(circle.getAttribute('cy')) || 170 : 170;
        const r = circle ? Number(circle.getAttribute('r')) || 24 : 24;

        const angle = Math.random() * Math.PI * 2;
        const speed = 0.4 + Math.random() * 0.45;
        return {
          id,
          el,
          circle,
          text,
          x: initX,
          y: initY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          r,
          isDragging: false
        };
      });

      const nodeMap = new Map();
      nodes.forEach(n => nodeMap.set(n.id, n));

      const edgeElements = Array.from(svg.querySelectorAll('.q2-float-edge'));
      const edges = edgeElements.map(el => {
        const fromId = el.dataset.from;
        const toId = el.dataset.to;
        const lines = Array.from(el.querySelectorAll('line'));
        return {
          from: nodeMap.get(fromId),
          to: nodeMap.get(toId),
          lines
        };
      }).filter(e => e.from && e.to);

      const weightElements = Array.from(svg.querySelectorAll('.q2-scene-weight'));
      const weights = weightElements.map(el => {
        const edgeKey = el.dataset.edge;
        const [uId, vId] = (edgeKey || '').split('-');
        const rect = el.querySelector('rect');
        const text = el.querySelector('text');
        return {
          key: edgeKey,
          from: nodeMap.get(uId),
          to: nodeMap.get(vId),
          el,
          rect,
          text,
          val: 0
        };
      }).filter(w => w.from && w.to);

      const captionEl = svg.querySelector('[data-q2-caption]') || (svg.parentElement ? svg.parentElement.querySelector('.q2-svg-caption') : null);
      const kind = svg.dataset.q2FloatGraph;

      const getSvgPoint = (evt) => {
        const rect = svg.getBoundingClientRect();
        const scaleX = vbW / (rect.width || 1);
        const scaleY = vbH / (rect.height || 1);
        return {
          x: (evt.clientX - rect.left) * scaleX,
          y: (evt.clientY - rect.top) * scaleY
        };
      };

      let activeDragNode = null;
      nodes.forEach(n => {
        n.el.style.cursor = 'grab';
        n.el.addEventListener('pointerdown', evt => {
          evt.preventDefault();
          evt.stopPropagation();
          activeDragNode = n;
          n.isDragging = true;
          n.el.style.cursor = 'grabbing';
          try { n.el.setPointerCapture(evt.pointerId); } catch (_) {}
        });

        n.el.addEventListener('pointermove', evt => {
          if (!activeDragNode || activeDragNode !== n) return;
          const pt = getSvgPoint(evt);
          n.x = Math.max(minX, Math.min(maxX, pt.x));
          n.y = Math.max(minY, Math.min(maxY, pt.y));
        });

        const release = (evt) => {
          if (activeDragNode === n) {
            n.isDragging = false;
            n.el.style.cursor = 'grab';
            n.vx = (Math.random() - 0.5) * 0.8;
            n.vy = (Math.random() - 0.5) * 0.8;
            activeDragNode = null;
            try { n.el.releasePointerCapture(evt.pointerId); } catch (_) {}
          }
        };

        n.el.addEventListener('pointerup', release);
        n.el.addEventListener('pointercancel', release);
      });

      let animId = null;
      const updateFrame = () => {
        if (!svg.isConnected) {
          if (animId) cancelAnimationFrame(animId);
          return;
        }

        const slide = svg.closest('.slide');
        if (slide && !slide.classList.contains('active')) {
          animId = requestAnimationFrame(updateFrame);
          return;
        }

        // Обновление позиций вершин (хаотичное органическое парение)
        for (let i = 0; i < nodes.length; i++) {
          const n = nodes[i];
          if (!n.isDragging) {
            n.vx += (Math.random() - 0.5) * 0.05;
            n.vy += (Math.random() - 0.5) * 0.05;

            const spd = Math.hypot(n.vx, n.vy);
            if (spd > 0.95) {
              n.vx = (n.vx / spd) * 0.95;
              n.vy = (n.vy / spd) * 0.95;
            } else if (spd < 0.25) {
              n.vx *= 1.1;
              n.vy *= 1.1;
            }

            for (let j = i + 1; j < nodes.length; j++) {
              const other = nodes[j];
              const dx = other.x - n.x;
              const dy = other.y - n.y;
              const dist = Math.hypot(dx, dy) || 1;
              const minDist = (n.r + other.r) * 1.5;
              if (dist < minDist) {
                const force = (minDist - dist) * 0.003;
                const fx = (dx / dist) * force;
                const fy = (dy / dist) * force;
                n.vx -= fx;
                n.vy -= fy;
                other.vx += fx;
                other.vy += fy;
              }
            }

            n.x += n.vx;
            n.y += n.vy;

            if (n.x <= minX) { n.x = minX; n.vx = Math.abs(n.vx); }
            else if (n.x >= maxX) { n.x = maxX; n.vx = -Math.abs(n.vx); }
            if (n.y <= minY) { n.y = minY; n.vy = Math.abs(n.vy); }
            else if (n.y >= maxY) { n.y = maxY; n.vy = -Math.abs(n.vy); }
          }

          if (n.circle) {
            n.circle.setAttribute('cx', n.x.toFixed(1));
            n.circle.setAttribute('cy', n.y.toFixed(1));
          }
          if (n.text) {
            n.text.setAttribute('x', n.x.toFixed(1));
            n.text.setAttribute('y', (n.y + 5).toFixed(1));
          }
        }

        // Обновление линий (привязаны к вершинам, не заходят внутрь кружков)
        edges.forEach(e => {
          const dx = e.to.x - e.from.x;
          const dy = e.to.y - e.from.y;
          const dist = Math.hypot(dx, dy) || 1;
          const ux = dx / dist;
          const uy = dy / dist;
          const rFrom = (e.from.r || 24);
          const rTo = (e.to.r || 24);
          const x1 = (e.from.x + ux * rFrom).toFixed(1);
          const y1 = (e.from.y + uy * rFrom).toFixed(1);
          const x2 = (e.to.x - ux * rTo).toFixed(1);
          const y2 = (e.to.y - uy * rTo).toFixed(1);

          e.lines.forEach(line => {
            line.setAttribute('x1', x1);
            line.setAttribute('y1', y1);
            line.setAttribute('x2', x2);
            line.setAttribute('y2', y2);
          });
        });

        // Обновление чисел на линиях в зависимости от расстояния
        const weightMap = {};
        weights.forEach(w => {
          const mx = (w.from.x + w.to.x) / 2;
          const my = (w.from.y + w.to.y) / 2;
          const dist = Math.hypot(w.to.x - w.from.x, w.to.y - w.from.y);
          const val = Math.max(1, Math.round(dist / 22));
          w.val = val;
          weightMap[w.key] = val;

          const rectW = val >= 10 ? 32 : 28;
          if (w.rect) {
            w.rect.setAttribute('x', (mx - rectW / 2).toFixed(1));
            w.rect.setAttribute('y', (my - 11).toFixed(1));
            w.rect.setAttribute('width', String(rectW));
          }
          if (w.text) {
            w.text.setAttribute('x', mx.toFixed(1));
            w.text.setAttribute('y', (my + 4).toFixed(1));
            w.text.textContent = String(val);
          }
        });

        // Динамический пересчёт путей в подписи
        if (captionEl) {
          if (kind === 'weighted') {
            const wAB = weightMap['A-B'] || 7;
            const wBD = weightMap['B-D'] || 8;
            const wAC = weightMap['A-C'] || 7;
            const wCD = weightMap['C-D'] || 8;
            captionEl.textContent = `A→B→D: ${wAB} + ${wBD} = ${wAB + wBD}   ·   A→C→D: ${wAC} + ${wCD} = ${wAC + wCD}`;
          } else if (kind === 'weighted-concept') {
            const wAC = weightMap['A-C'] || 7;
            const wCD = weightMap['C-D'] || 10;
            const wAB = weightMap['A-B'] || 8;
            const wBC = weightMap['B-C'] || 8;
            captionEl.textContent = `A→C→D: ${wAC} + ${wCD} = ${wAC + wCD}   ·   A→B→C→D: ${wAB} + ${wBC} + ${wCD} = ${wAB + wBC + wCD}`;
          }
        }

        animId = requestAnimationFrame(updateFrame);
      };

      animId = requestAnimationFrame(updateFrame);
    });
  }

  function boot() {
    const id = document.body.dataset.lessonId;
    const lesson = Q2.lessons[id];
    const root = document.getElementById('q2-root');
    if (!root) return;
    if (!lesson) {
      root.innerHTML = '<section class="slide active"><div class="container"><h2>Урок не найден</h2><p>Проверьте, что файл данных подключён.</p></div></section>';
      return;
    }
    document.title = `${lesson.cls || ''} · урок ${lesson.num} · ${lesson.title}`;
    const badge = document.querySelector('.nav-badge-topic');
    if (badge) badge.textContent = lesson.title;
    const badgeNum = document.querySelector('.nav-badge-num');
    if (badgeNum) badgeNum.textContent = `Урок ${lesson.num}`;
    const globalSvgDefs = `<svg style="position:absolute;width:0;height:0;pointer-events:none;overflow:hidden" aria-hidden="true">
      <defs>
        <filter id="q2-node-inset" x="-40%" y="-40%" width="180%" height="180%">
          <feOffset dx="2" dy="2.5" in="SourceAlpha" result="offsetDark"/>
          <feGaussianBlur stdDeviation="2.2" in="offsetDark" result="blurDark"/>
          <feComposite operator="out" in="SourceAlpha" in2="blurDark" result="inverseDark"/>
          <feFlood flood-color="#B28774" flood-opacity="0.55" result="colorDark"/>
          <feComposite operator="in" in="colorDark" in2="inverseDark" result="shadowDark"/>

          <feOffset dx="-2" dy="-2" in="SourceAlpha" result="offsetLight"/>
          <feGaussianBlur stdDeviation="1.8" in="offsetLight" result="blurLight"/>
          <feComposite operator="out" in="SourceAlpha" in2="blurLight" result="inverseLight"/>
          <feFlood flood-color="#ffffff" flood-opacity="0.95" result="colorLight"/>
          <feComposite operator="in" in="colorLight" in2="inverseLight" result="shadowLight"/>

          <feMerge>
            <feMergeNode in="SourceGraphic"/>
            <feMergeNode in="shadowDark"/>
            <feMergeNode in="shadowLight"/>
          </feMerge>
        </filter>
      </defs>
    </svg>`;
    root.innerHTML = globalSvgDefs + (lesson.slides || []).map((slide, idx) => renderSlide(slide, idx, lesson)).join('');
    initSingleLamp(root);
    initAutoSort(root);
    initFloatGraphs(root);
    initCodeRunners(root);
    initWidgets(root);
    document.dispatchEvent(new CustomEvent('q2:ready', { detail: { id } }));
  }

  function initCodeRunners(root) {
    root.querySelectorAll('[data-q2-code-runner]').forEach(runner => {
      if (runner.dataset.runnerBound === '1') return;
      runner.dataset.runnerBound = '1';

      const lineEls = Array.from(runner.querySelectorAll('.q2-code-line'));
      const outEls = Array.from(runner.querySelectorAll('.q2-exec-out-line'));
      const counterEl = runner.querySelector('[data-runner-counter]');
      if (!outEls.length) return;

      let current = 0;
      const total = outEls.length;

      const applyStep = (idx) => {
        current = idx;
        if (counterEl) counterEl.textContent = `Шаг ${idx + 1} / ${total}`;
        const activeOut = outEls[idx];
        const targetLine = activeOut ? String(activeOut.dataset.targetLine || '1') : '1';

        lineEls.forEach(lineEl => {
          lineEl.classList.toggle('is-active', lineEl.dataset.line === targetLine);
        });

        outEls.forEach((outEl, i) => {
          outEl.classList.toggle('is-visible', i <= idx);
          outEl.classList.toggle('is-current-line', i === idx);
        });
      };

      outEls.forEach((el, i) => {
        el.addEventListener('click', () => {
          applyStep(i);
        });
      });

      applyStep(0);

      setInterval(() => {
        if (!document.body.contains(runner)) return;
        const slide = runner.closest('.slide');
        if (slide && !slide.classList.contains('active')) return;
        const next = (current + 1) % total;
        applyStep(next);
      }, 1350);
    });
  }

  /* ---------------------- запрет копирования и мелкие действия ------------------- */
  ['copy', 'cut', 'selectstart', 'dragstart', 'contextmenu'].forEach(evtName => {
    document.addEventListener(evtName, event => {
      const target = event.target instanceof Element ? event.target : (event.target && event.target.parentElement);
      if (target && target.closest('.q2-code, pre, code')) {
        event.preventDefault();
      }
    }, true);
  });

  document.addEventListener('click', event => {
    const tabBtn = event.target.closest('.q2-tab-btn');
    if (tabBtn) {
      const widget = tabBtn.closest('.q2-tabs-widget');
      if (widget) {
        const targetIdx = tabBtn.dataset.tab;
        widget.querySelectorAll('.q2-tab-btn').forEach(b => {
          const active = b.dataset.tab === targetIdx;
          b.classList.toggle('is-active', active);
          b.setAttribute('aria-selected', String(active));
        });
        widget.querySelectorAll('.q2-tab-pane').forEach(p => {
          p.classList.toggle('is-active', p.dataset.pane === targetIdx);
        });
      }
    }

    const reveal = event.target.closest('[data-q2-reveal]');
    if (reveal) {
      const target = document.getElementById(reveal.dataset.q2Reveal);
      if (target) target.hidden = !target.hidden;
      reveal.textContent = target && !target.hidden ? 'Скрыть ответ' : 'Показать ответ';
    }
  });

  /* ============================ БАЗОВЫЕ ВИДЖЕТЫ ========================== */

  /* ------------------------------- quiz ---------------------------------- */
  WIDGETS.quiz = function (el, cfg) {
    const sourceQuestions = cfg.questions || [];
    const questions = sourceQuestions.map(item => {
      if (!cfg.shuffleOptions) return item;
      const choices = (item.options || []).map((text, index) => ({ text, correct: index === item.answer }));
      const options = shuffledCopy(choices);
      return { ...item, options: options.map(option => option.text), answer: options.findIndex(option => option.correct) };
    });
    const isReview = cfg.variant === 'review';
    let index = 0;
    let score = 0;
    let answered = false;

    el.classList.add('q2-quiz');
    if (isReview) el.classList.add('q2-quiz-review');
    el.innerHTML = `<div class="q2-quiz-top">
        <span class="q2-quiz-counter"></span>
        <span class="q2-quiz-score"></span>
      </div>
      ${isReview ? '<div class="q2-review-dots"></div>' : ''}
      <h3 class="q2-quiz-question"></h3>
      <div class="q2-options"></div>
      <div class="q2-feedback" aria-live="polite"></div>
      <div class="q2-quiz-actions">
        <button type="button" class="q2-btn q2-btn-ghost" data-restart>Начать заново</button>
        <button type="button" class="q2-btn" data-next disabled>Следующий вопрос</button>
      </div>`;

    const counter = el.querySelector('.q2-quiz-counter');
    const scoreNode = el.querySelector('.q2-quiz-score');
    const questionNode = el.querySelector('.q2-quiz-question');
    const optionsNode = el.querySelector('.q2-options');
    const feedback = el.querySelector('.q2-feedback');
    const nextButton = el.querySelector('[data-next]');
    const restartButton = el.querySelector('[data-restart]');
    const dots = el.querySelector('.q2-review-dots');

    if (dots) {
      questions.forEach(() => {
        const dot = document.createElement('span');
        dots.appendChild(dot);
      });
    }

    function setFeedback(message, state) {
      feedback.innerHTML = message;
      feedback.className = 'q2-feedback' + (state ? ' ' + state.split(/\s+/).map(s => `is-${s}`).join(' ') : '');
    }

    function renderDots() {
      if (!dots) return;
      Array.from(dots.children).forEach((dot, i) => {
        dot.className = i < index ? 'is-done' : i === index ? 'is-current' : '';
      });
    }

    function render() {
      const item = questions[index];
      if (!item) return;
      answered = false;
      counter.textContent = `Вопрос ${index + 1} / ${questions.length}`;
      scoreNode.textContent = `Верно: ${score}`;
      questionNode.innerHTML = (item.q || '').replace(/\n/g, '<br>');
      setFeedback(isReview ? 'Вспомните прошлый урок и выберите ответ.' : 'Выберите один вариант.', '');
      nextButton.disabled = true;
      nextButton.textContent = index === questions.length - 1 ? 'Показать результат' : 'Следующий вопрос';
      restartButton.hidden = index === 0 && score === 0;
      optionsNode.innerHTML = '';
      renderDots();

      (item.options || []).forEach((option, optionIndex) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'q2-option';
        button.innerHTML = `<span class="q2-option-letter">${String.fromCharCode(65 + optionIndex)}</span><span>${option}</span>`;
        button.addEventListener('click', () => {
          if (answered) return;
          answered = true;
          const correct = optionIndex === item.answer;
          if (correct) score += 1;
          optionsNode.querySelectorAll('.q2-option').forEach((node, i) => {
            node.disabled = true;
            if (i === item.answer) node.classList.add('is-correct');
            else if (i === optionIndex) node.classList.add('is-wrong');
          });
          scoreNode.textContent = `Верно: ${score}`;
          setFeedback(correct ? `Верно. ${item.explain || ''}` : `Не совсем. ${item.explain || ''}`, correct ? 'good' : 'bad');
          nextButton.disabled = false;
        });
        optionsNode.appendChild(button);
      });
    }

    nextButton.addEventListener('click', () => {
      if (index < questions.length - 1) {
        index += 1;
        render();
        return;
      }
      optionsNode.innerHTML = '';
      questionNode.textContent = isReview ? 'Повторение завершено' : 'Проверка завершена';
      counter.textContent = `${questions.length} из ${questions.length}`;
      const perfect = score === questions.length;
      setFeedback(`Правильных ответов: <span class="q2-feedback-score">${score} из ${questions.length}</span>. ${perfect ? 'Отлично: тема усвоена.' : 'Разберите ошибки по слайдам — и всё получится.'}`, `result ${perfect ? 'good' : 'bad'}`);
      nextButton.disabled = true;
      restartButton.hidden = false;
      if (dots) Array.from(dots.children).forEach(dot => { dot.className = 'is-done'; });
    });

    restartButton.addEventListener('click', () => {
      index = 0;
      score = 0;
      render();
    });

    if (questions.length) render();
  };

  /* ----------------------------- statements ------------------------------ */
  WIDGETS.statements = function (el, cfg) {
    const items = cfg.items || [];
    let score = 0;
    el.classList.add('q2-statements');
    if (cfg.compact) el.classList.add('q2-statements-compact');
    el.innerHTML = `<div class="q2-statements-head">
        <span class="q2-chip-note">Отметьте: это высказывание или нет?</span>
        <span class="q2-statements-score">Верно: 0 / ${items.length}</span>
      </div>
      <div class="q2-statements-list"></div>`;
    const list = el.querySelector('.q2-statements-list');
    const scoreNode = el.querySelector('.q2-statements-score');

    items.forEach(item => {
      const card = document.createElement('div');
      card.className = 'q2-statement-card';
      card.innerHTML = `<p>${item.text}</p>
        <div class="q2-statement-actions">
          <button type="button" class="q2-btn q2-btn-sm" data-answer="yes">Высказывание</button>
          <button type="button" class="q2-btn q2-btn-sm q2-btn-ghost" data-answer="no">Не высказывание</button>
        </div>
        <div class="q2-statement-note"></div>`;
      const note = card.querySelector('.q2-statement-note');
      card.querySelectorAll('[data-answer]').forEach(button => {
        button.addEventListener('click', () => {
          if (card.dataset.done) return;
          card.dataset.done = '1';
          const choseStatement = button.dataset.answer === 'yes';
          const correct = choseStatement === Boolean(item.isStatement);
          if (correct) score += 1;
          card.querySelectorAll('[data-answer]').forEach(node => {
            node.disabled = true;
            const isYes = node.dataset.answer === 'yes';
            if (isYes === Boolean(item.isStatement)) node.classList.add('is-correct');
            else if (node === button) node.classList.add('is-wrong');
          });
          note.textContent = item.note || (item.isStatement ? 'Это высказывание: у него есть значение истинно/ложно.' : 'Это не высказывание: команда или вопрос не имеет значения истинности.');
          scoreNode.textContent = `Верно: ${score} / ${items.length}`;
        });
      });
      list.appendChild(card);
    });
  };

  /* -------------------------------- mini --------------------------------- */
  WIDGETS.mini = function (el, cfg) {
    const tasks = cfg.tasks || [];
    el.classList.add('q2-mini');
    el.innerHTML = `<div class="q2-mini-list"></div>`;
    const list = el.querySelector('.q2-mini-list');

    tasks.forEach((task, index) => {
      const card = document.createElement('div');
      card.className = 'q2-mini-card';
      const isNumber = task.type === 'number';
      card.innerHTML = `<div class="q2-mini-head"><span class="q2-mini-num">${index + 1}</span><div>
          <h4>${task.title || `Задание ${index + 1}`}</h4>
          <p>${task.q}</p>
        </div></div>
        <div class="q2-mini-actions">
          <input class="q2-input" type="${isNumber ? 'number' : 'text'}" placeholder="${attr(task.placeholder || (isNumber ? 'Введите число' : 'Введите ответ'))}" aria-label="${attr(task.title || `Ответ ${index + 1}`)}">
          <button type="button" class="q2-btn q2-btn-sm" data-check>Проверить</button>
          ${task.hint ? `<button type="button" class="q2-btn q2-btn-sm q2-btn-ghost" data-hint>Подсказка</button>` : ''}
        </div>
        <div class="q2-feedback" aria-live="polite"></div>`;
      const input = card.querySelector('.q2-input');
      const feedback = card.querySelector('.q2-feedback');
      const check = card.querySelector('[data-check]');
      const hint = card.querySelector('[data-hint]');
      const accepted = Array.isArray(task.answer) ? task.answer : [task.answer];

      function normalize(value) {
        return String(value).trim().toLowerCase().replace(/\s+/g, ' ').replace(',', '.');
      }

      check.addEventListener('click', () => {
        const value = normalize(input.value);
        if (!value) {
          feedback.textContent = 'Сначала введите ответ.';
          feedback.className = 'q2-feedback is-bad';
          return;
        }
        const correct = accepted.some(answer => normalize(answer) === value);
        feedback.textContent = correct
          ? (task.explain || 'Верно.')
          : `Пока неверно. ${task.explain || 'Проверьте вычисления и попробуйте ещё раз.'}`;
        feedback.className = 'q2-feedback ' + (correct ? 'is-good' : 'is-bad');
        card.classList.toggle('is-solved', correct);
        input.disabled = correct;
        check.disabled = correct;
      });
      input.addEventListener('keydown', event => {
        if (event.key === 'Enter') check.click();
      });
      if (hint) {
        hint.addEventListener('click', () => {
          feedback.textContent = task.hint;
          feedback.className = 'q2-feedback is-hint';
        });
      }
      list.appendChild(card);
    });
  };

  /* ----------------------------- codePredict ----------------------------- */
  WIDGETS.codePredict = function (el, cfg) {
    el.classList.add('q2-predict');
    el.innerHTML = `${codeBlock({ code: cfg.code, title: cfg.title || 'Что выведет программа?', compact: true })}
      <div class="q2-predict-options"></div>
      <div class="q2-feedback" aria-live="polite"></div>`;
    const optionsNode = el.querySelector('.q2-predict-options');
    const feedback = el.querySelector('.q2-feedback');
    let answered = false;

    (cfg.options || []).forEach((option, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'q2-option q2-option-code';
      button.innerHTML = `<span class="q2-option-letter">${String.fromCharCode(65 + index)}</span><code>${option}</code>`;
      button.addEventListener('click', () => {
        if (answered) return;
        answered = true;
        const correct = index === cfg.answer;
        optionsNode.querySelectorAll('.q2-option').forEach((node, i) => {
          node.disabled = true;
          if (i === cfg.answer) node.classList.add('is-correct');
          else if (i === index) node.classList.add('is-wrong');
        });
        feedback.textContent = correct ? `Верно. ${cfg.explain || ''}` : `Неверно. ${cfg.explain || ''}`;
        feedback.className = 'q2-feedback ' + (correct ? 'is-good' : 'is-bad');
      });
      optionsNode.appendChild(button);
    });
  };

  /* -------------------------------- match -------------------------------- */
  WIDGETS.match = function (el, cfg) {
    const pairs = cfg.pairs || [];
    let selectedLeft = null;
    let solved = 0;
    const shuffle = list => list.map((item, i) => ({ item, key: Math.random() + i })).sort((a, b) => a.key - b.key).map(x => x.item);

    el.classList.add('q2-match');
    el.innerHTML = `<p class="q2-match-prompt">${cfg.prompt || 'Соедините понятие и его значение: нажмите слева, затем справа.'}</p>
      <div class="q2-match-grid">
        <div class="q2-match-col" data-left></div>
        <div class="q2-match-col" data-right></div>
      </div>
      <div class="q2-feedback" aria-live="polite"></div>`;
    const left = el.querySelector('[data-left]');
    const right = el.querySelector('[data-right]');
    const feedback = el.querySelector('.q2-feedback');

    pairs.forEach((pair, index) => {
      const leftButton = document.createElement('button');
      leftButton.type = 'button';
      leftButton.className = 'q2-match-item';
      leftButton.dataset.key = String(index);
      leftButton.textContent = pair.left;
      leftButton.addEventListener('click', () => {
        if (leftButton.classList.contains('is-solved')) return;
        left.querySelectorAll('.q2-match-item').forEach(node => node.classList.remove('is-active'));
        leftButton.classList.add('is-active');
        selectedLeft = leftButton;
        feedback.textContent = 'Теперь выберите подходящее значение справа.';
        feedback.className = 'q2-feedback';
      });
      left.appendChild(leftButton);
    });

    shuffle(pairs).forEach(pair => {
      const rightButton = document.createElement('button');
      rightButton.type = 'button';
      rightButton.className = 'q2-match-item';
      rightButton.dataset.key = String(pairs.indexOf(pair));
      rightButton.textContent = pair.right;
      rightButton.addEventListener('click', () => {
        if (!selectedLeft || rightButton.classList.contains('is-solved')) {
          feedback.textContent = 'Сначала выберите понятие слева.';
          feedback.className = 'q2-feedback is-bad';
          return;
        }
        if (selectedLeft.dataset.key === rightButton.dataset.key) {
          selectedLeft.classList.add('is-solved');
          rightButton.classList.add('is-solved');
          selectedLeft.classList.remove('is-active');
          selectedLeft = null;
          solved += 1;
          feedback.textContent = solved === pairs.length ? 'Все пары соединены верно.' : 'Верно! Продолжайте.';
          feedback.className = 'q2-feedback is-good';
        } else {
          rightButton.classList.add('is-wrong');
          setTimeout(() => rightButton.classList.remove('is-wrong'), 700);
          feedback.textContent = 'Это не подходит. Попробуйте другое значение.';
          feedback.className = 'q2-feedback is-bad';
        }
      });
      right.appendChild(rightButton);
    });
  };

  /* -------------------------------- order -------------------------------- */
  WIDGETS.order = function (el, cfg) {
    const items = cfg.items || [];
    const correct = cfg.correct || items;
    let pool = items.map((item, i) => ({ item, key: i }));
    let chosen = [];
    const shuffle = list => list.map(x => ({ x, r: Math.random() })).sort((a, b) => a.r - b.r).map(v => v.x);

    el.classList.add('q2-order');
    el.innerHTML = `<p class="q2-order-prompt">${cfg.prompt || 'Нажимайте на шаги в правильном порядке.'}</p>
      <div class="q2-order-pool" data-pool></div>
      <div class="q2-order-answer" data-answer><span class="q2-muted">Здесь появится ваша последовательность</span></div>
      <div class="q2-order-actions"><button type="button" class="q2-btn q2-btn-sm" data-check>Проверить</button><button type="button" class="q2-btn q2-btn-sm q2-btn-ghost" data-reset>Сбросить</button></div>
      <div class="q2-feedback" aria-live="polite"></div>`;
    const poolNode = el.querySelector('[data-pool]');
    const answerNode = el.querySelector('[data-answer]');
    const feedback = el.querySelector('.q2-feedback');

    function render() {
      poolNode.innerHTML = '';
      shuffle(pool).forEach(entry => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'q2-order-item';
        button.textContent = entry.item;
        button.addEventListener('click', () => {
          pool = pool.filter(x => x.key !== entry.key);
          chosen.push(entry);
          render();
        });
        poolNode.appendChild(button);
      });
      answerNode.innerHTML = chosen.length
        ? chosen.map((entry, i) => `<button type="button" class="q2-order-item is-chosen" data-back="${i}"><span>${i + 1}</span>${entry.item}</button>`).join('')
        : '<span class="q2-muted">Здесь появится ваша последовательность</span>';
      answerNode.querySelectorAll('[data-back]').forEach(button => {
        button.addEventListener('click', () => {
          const index = Number(button.dataset.back);
          const [entry] = chosen.splice(index, 1);
          pool.push(entry);
          render();
        });
      });
    }

    el.querySelector('[data-check]').addEventListener('click', () => {
      if (chosen.length !== correct.length) {
        feedback.textContent = 'Сначала используйте все шаги.';
        feedback.className = 'q2-feedback is-bad';
        return;
      }
      const ok = chosen.every((entry, i) => entry.item === correct[i]);
      feedback.textContent = ok ? 'Верно: порядок восстановлен.' : 'Порядок пока неверный. Проверьте, что происходит раньше.';
      feedback.className = 'q2-feedback ' + (ok ? 'is-good' : 'is-bad');
      answerNode.querySelectorAll('.q2-order-item').forEach((node, i) => {
        node.classList.toggle('is-correct', chosen[i].item === correct[i]);
        node.classList.toggle('is-wrong', chosen[i].item !== correct[i]);
      });
    });

    el.querySelector('[data-reset]').addEventListener('click', () => {
      pool = items.map((item, i) => ({ item, key: i }));
      chosen = [];
      feedback.textContent = '';
      feedback.className = 'q2-feedback';
      render();
    });

    render();
  };

  /* ------------------------------ factCheck ------------------------------ */
  WIDGETS.factCheck = function (el, cfg) {
    const items = cfg.items || [];
    el.classList.add('q2-factcheck');
    el.innerHTML = `<h4>${cfg.title || 'План проверки факта'}</h4>
      <div class="q2-check-list">${items.map((item, i) => `<label class="q2-check-item"><input type="checkbox" data-i="${i}"><span>${item}</span></label>`).join('')}</div>
      <div class="q2-factcheck-progress"><div class="q2-progress"><span></span></div><p></p></div>`;
    const bar = el.querySelector('.q2-progress span');
    const note = el.querySelector('.q2-factcheck-progress p');
    const update = () => {
      const boxes = Array.from(el.querySelectorAll('input[type="checkbox"]'));
      const checked = boxes.filter(box => box.checked).length;
      bar.style.width = `${Math.round(checked / boxes.length * 100)}%`;
      note.textContent = checked === boxes.length
        ? (cfg.done || 'План выполнен: факт проверен по независимым источникам.')
        : `Отмечено ${checked} из ${boxes.length} шагов.`;
      boxes.forEach(box => box.closest('.q2-check-item').classList.toggle('is-checked', box.checked));
    };
    el.querySelectorAll('input[type="checkbox"]').forEach(box => box.addEventListener('change', update));
    update();
  };

  /* ------------------------------- aiProb -------------------------------- */
  WIDGETS.aiProb = function (el, cfg) {
    const cases = cfg.cases || [];
    el.classList.add('q2-aiprob');
    el.innerHTML = `<div class="q2-aiprob-tabs">${cases.map((item, i) => `<button type="button" class="q2-tab${i === 0 ? ' is-active' : ''}" data-case="${i}">${item.label}</button>`).join('')}</div>
      <div class="q2-aiprob-body">
        <div class="q2-aiprob-bars">
          <div class="q2-aiprob-row"><span>${cfg.classA || 'Класс A'}</span><div class="q2-prob"><span data-bar="a"></span></div><b data-val="a"></b></div>
          <div class="q2-aiprob-row"><span>${cfg.classB || 'Класс B'}</span><div class="q2-prob"><span data-bar="b"></span></div><b data-val="b"></b></div>
        </div>
        <p class="q2-aiprob-note"></p>
      </div>`;
    const note = el.querySelector('.q2-aiprob-note');
    const update = index => {
      const item = cases[index] || cases[0];
      if (!item) return;
      el.querySelectorAll('[data-case]').forEach((tab, i) => tab.classList.toggle('is-active', i === index));
      el.querySelector('[data-bar="a"]').style.width = `${Math.round(item.a * 100)}%`;
      el.querySelector('[data-bar="b"]').style.width = `${Math.round(item.b * 100)}%`;
      el.querySelector('[data-val="a"]').textContent = `${Math.round(item.a * 100)}%`;
      el.querySelector('[data-val="b"]').textContent = `${Math.round(item.b * 100)}%`;
      note.textContent = item.note || '';
    };
    el.querySelectorAll('[data-case]').forEach(tab => tab.addEventListener('click', () => update(Number(tab.dataset.case))));
    update(0);
  };

  /* ------------------------------ pythonRef ------------------------------ */
  WIDGETS.pythonRef = function (el, cfg) {
    const groups = cfg.groups || [];
    el.classList.add('q2-pythonref');
    el.innerHTML = `<details class="q2-ref" open>
      <summary><i class="fas fa-book-open"></i> ${cfg.title || 'Напоминание Python'}</summary>
      <div class="q2-ref-body">
        ${groups.map(group => `<div class="q2-ref-group"><h5>${group.title}</h5>
          <div class="q2-ref-rows">${(group.items || []).map(item => `<div class="q2-ref-row"><code>${item.cmd}</code><span>${item.text}</span></div>`).join('')}</div>
        </div>`).join('')}
      </div>
    </details>`;
  };

  /* =========================== ЛОГИЧЕСКИЕ ЛАБЫ ========================== */

  const OPS = {
    and: (a, b) => (a && b ? 1 : 0),
    or: (a, b) => (a || b ? 1 : 0),
    not: a => (a ? 0 : 1),
    xor: (a, b) => (Boolean(a) !== Boolean(b) ? 1 : 0),
    imp: (a, b) => (!a || b ? 1 : 0),
    eq: (a, b) => (Boolean(a) === Boolean(b) ? 1 : 0)
  };
  const OP_SIGN = { and: '∧', or: '∨', not: '¬', xor: '⊕', imp: '→', eq: '↔' };
  const OP_NAME = { and: 'И', or: 'ИЛИ', not: 'НЕ', xor: 'XOR', imp: 'Импликация', eq: 'Эквивалентность' };
  const OP_HINT = {
    and: 'И: лампа горит только тогда, когда включены оба выключателя — они соединены последовательно.',
    or: 'ИЛИ: лампе достаточно одного включённого выключателя — ветви соединены параллельно.',
    not: 'НЕ: инвертор меняет сигнал на противоположный. Лампа горит, когда на входе 0.',
    xor: 'XOR: лампа горит, когда состояния выключателей различаются. Это как проходной выключатель в коридоре.',
    imp: 'Импликация A → B ложна только в одном случае: A = 1, B = 0. «Датчик сработал, а свет не включился».',
    eq: 'Эквивалентность: лампа горит, когда оба выключателя в одинаковом положении — оба 0 или оба 1.'
  };

  function gateLabel(gate) {
    return gate === 'not' ? '¬' : OP_SIGN[gate];
  }

  WIDGETS.lamp = function (el, cfg) {
    let gate = cfg.gate || 'and';
    let a = cfg.a == null ? 1 : cfg.a;
    let b = cfg.b == null ? 0 : cfg.b;
    const gates = cfg.gates || ['and', 'or', 'not', 'xor', 'imp', 'eq'];
    const gradientId = `${el.dataset.q2W}-bulb-glow`;
    const switchMarkup = (name, y, value) => `<g class="q2-switch${value ? ' is-on' : ''}" data-sw="${name}" transform="translate(48 ${y})" role="button" tabindex="0" aria-pressed="${value === 1}" aria-label="Выключатель ${name}: ${value}, ${value ? 'включён' : 'выключен'}. Нажмите, чтобы переключить">
        <rect class="q2-home-switch-plate" width="154" height="150" rx="20"/>
        <rect class="q2-home-switch-highlight" x="6" y="6" width="142" height="138" rx="16"/>
        <circle class="q2-home-switch-screw" cx="16" cy="16" r="3.5"/><circle class="q2-home-switch-screw" cx="138" cy="16" r="3.5"/>
        <circle class="q2-home-switch-screw" cx="16" cy="134" r="3.5"/><circle class="q2-home-switch-screw" cx="138" cy="134" r="3.5"/>
        <text class="q2-home-switch-label q2-home-switch-label-on" x="77" y="28">1 · ВКЛ</text>
        <text class="q2-home-switch-label q2-home-switch-label-off" x="77" y="137">0 · ВЫКЛ</text>
        <rect class="q2-home-switch-recess" x="48" y="37" width="58" height="78" rx="12"/>
        <path class="q2-home-switch-groove" d="M55 44h44m-44 64h44"/>
        <g class="q2-home-switch-rocker${value ? ' is-on' : ''}">
          <rect x="55" y="73" width="44" height="34" rx="8"/>
          <text class="q2-home-switch-value" x="77" y="95">${value}</text>
        </g>
        <text class="q2-home-switch-name" x="77" y="171">${name}</text>
      </g>`;
    const switches = `${switchMarkup('A', 42, a)}${switchMarkup('B', 240, b)}`;
    const wires = `<g class="q2-home-logic-wire-group" data-wire="A">
          <path class="q2-home-logic-wire" d="M202 117 L 350 185"/>
          <path class="q2-home-logic-flow" d="M202 117 L 350 185"/>
        </g>
        <g class="q2-home-logic-wire-group" data-wire="B">
          <path class="q2-home-logic-wire" d="M202 315 L 350 235"/>
          <path class="q2-home-logic-flow" d="M202 315 L 350 235"/>
        </g>`;

    el.classList.add('q2-lamp-lab');
    el.innerHTML = `<div class="q2-lab-stage q2-home-logic-stage">
        <svg viewBox="0 0 900 440" role="img" aria-label="Домашние выключатели, логический элемент и лампа">
          <defs>
            <linearGradient id="${gradientId}-wall" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6796a1"/><stop offset="1" stop-color="#315d68"/></linearGradient>
            <radialGradient id="${gradientId}"><stop offset="0" stop-color="#fff9b0" stop-opacity="1"/><stop offset=".48" stop-color="#facc15" stop-opacity=".58"/><stop offset="1" stop-color="#fbbf24" stop-opacity="0"/></radialGradient>
          </defs>
          <rect class="q2-home-logic-wall" x="10" y="10" width="880" height="420" rx="26" fill="url(#${gradientId}-wall)"/>
          <path class="q2-home-logic-wall-line" d="M30 405 H 870"/>
          ${wires}
          ${switches}
          <rect class="q2-home-logic-gate" x="350" y="160" width="112" height="100" rx="20"/>
          <text class="q2-home-logic-gate-symbol" x="406" y="220" data-gate-label>∧</text>
          <path class="q2-home-logic-wire" d="M462 210 H 702"/>
          <path class="q2-home-logic-flow" data-wire="Y" d="M462 210 H 702"/>
          <path class="q2-home-logic-wire" d="M760 30 V 168"/>
          <g class="q2-bulb" data-bulb transform="translate(0 60) rotate(180 760 158)">
            <circle class="q2-bulb-glow" cx="760" cy="158" r="82" fill="url(#${gradientId})"/>
            <path class="q2-bulb-body" d="M760 108c-28 0-48 21-48 47 0 23 14 35 23 54h50c9-19 23-31 23-54 0-26-20-47-48-47z"/>
            <path class="q2-bulb-filament" d="m741 157 7 15q4 8 8 0t8 0q4 8 8 0l7-15"/>
            <path class="q2-bulb-base" d="M738 209h44v30h-44z"/>
            <path class="q2-home-logic-bulb-thread" d="M740 217h40m-40 8h40m-36 8h32"/>
            <g class="q2-bulb-rays">
              <path d="M760 89V75m-52 37-10-10m114 10 10-10m-128 55h-14m156 0h14m-146 36-11 8m120-8 11 8"/>
            </g>
          </g>
          <text class="q2-home-logic-caption" x="760" y="336" data-q2-lamp-status>ЛАМПА ${compute() ? 'ГОРИТ' : 'ВЫКЛЮЧЕНА'}</text>
        </svg>
      </div>
      <div class="q2-lab-side">
        ${gates.length > 1 ? `<div class="q2-gate-tabs">${gates.map(item => `<button type="button" class="q2-tab${item === gate ? ' is-active' : ''}" data-gate="${item}">${OP_NAME[item]}</button>`).join('')}</div>` : ''}
        <div class="q2-formula" data-formula></div>
        <div class="q2-mini-table" data-table></div>
        <div class="q2-feedback" data-feedback aria-live="polite"></div>
        ${cfg.task ? '<button type="button" class="q2-btn q2-btn-sm" data-check>Проверить задание</button>' : ''}
      </div>`;

    const formula = el.querySelector('[data-formula]');
    const table = el.querySelector('[data-table]');
    const feedback = el.querySelector('[data-feedback]');
    const gateLabelNode = el.querySelector('[data-gate-label]');
    const bulb = el.querySelector('[data-bulb]');
    const lampStatus = el.querySelector('[data-q2-lamp-status]');
    const check = el.querySelector('[data-check]');

    function compute() {
      return gate === 'not' ? OPS.not(a) : OPS[gate](a, b);
    }

    function switchNode(name, value) {
      const group = el.querySelector(`[data-sw="${name}"]`);
      if (!group) return;
      group.classList.toggle('is-on', value === 1);
      const rocker = group.querySelector('.q2-home-switch-rocker');
      rocker.classList.toggle('is-on', value === 1);
      rocker.setAttribute('transform', value === 1 ? 'translate(0 -38)' : 'translate(0 0)');
      group.querySelector('.q2-home-switch-value').textContent = String(value);
      group.setAttribute('aria-label', `Выключатель ${name}: ${value === 1 ? '1, включён' : '0, выключен'}. Нажмите, чтобы переключить`);
      group.setAttribute('aria-pressed', String(value === 1));
    }

    function render() {
      const y = compute();
      switchNode('A', a);
      switchNode('B', b);
      const unary = gate === 'not';
      const aGroup = el.querySelector('[data-sw="A"]');
      aGroup.setAttribute('transform', unary ? 'translate(48 135)' : 'translate(48 42)');
      const bGroup = el.querySelector('[data-sw="B"]');
      if (bGroup) {
        bGroup.classList.toggle('is-hidden', unary);
        bGroup.setAttribute('aria-hidden', String(unary));
      }
      const aWire = el.querySelector('[data-wire="A"]');
      const aWirePath = unary ? 'M202 210 H 350' : 'M202 117 L 350 185';
      aWire.querySelectorAll('path').forEach(path => path.setAttribute('d', aWirePath));
      const bWire = el.querySelector('[data-wire="B"]');
      if (bWire) bWire.classList.toggle('is-hidden', unary);
      gateLabelNode.textContent = gateLabel(gate);
      el.querySelector('[data-wire="A"]')?.classList.toggle('is-on', a === 1);
      el.querySelector('[data-wire="B"]')?.classList.toggle('is-on', b === 1 && gate !== 'not');
      el.querySelector('[data-wire="Y"]')?.classList.toggle('is-on', y === 1);
      bulb.classList.toggle('is-on', y === 1);
      if (lampStatus) lampStatus.textContent = `ЛАМПА ${y ? 'ГОРИТ' : 'ВЫКЛЮЧЕНА'}`;
      formula.innerHTML = gate === 'not'
        ? `<span class="q2-formula-main">Y = ¬A = ¬${a} = <b>${y}</b></span>`
        : `<span class="q2-formula-main">Y = A ${OP_SIGN[gate]} B = ${a} ${OP_SIGN[gate]} ${b} = <b>${y}</b></span>`;

      const rows = gate === 'not' ? [[0], [1]] : [[0, 0], [0, 1], [1, 0], [1, 1]];
      table.innerHTML = `<table aria-label="Таблица истинности: ${OP_NAME[gate]}"><caption>${OP_NAME[gate]} · таблица истинности</caption><thead><tr><th>A</th>${gate === 'not' ? '' : '<th>B</th>'}<th>Y</th></tr></thead><tbody>
        ${rows.map(row => {
          const rowA = row[0];
          const rowB = row.length > 1 ? row[1] : null;
          const result = gate === 'not' ? OPS.not(rowA) : OPS[gate](rowA, rowB);
          const current = rowA === a && (gate === 'not' || rowB === b);
          return `<tr class="${current ? 'is-current' : ''}"><td>${rowA}</td>${gate === 'not' ? '' : `<td>${rowB}</td>`}<td class="${result ? 'is-one' : 'is-zero'}">${result}</td></tr>`;
        }).join('')}
      </tbody></table>`;

      if (cfg.hint === false) {
        feedback.hidden = true;
      } else if (!cfg.task) {
        feedback.textContent = OP_HINT[gate];
        feedback.className = 'q2-feedback is-hint';
      }
    }

    el.querySelectorAll('[data-gate]').forEach(button => {
      button.addEventListener('click', () => {
        gate = button.dataset.gate;
        el.querySelectorAll('[data-gate]').forEach(node => node.classList.toggle('is-active', node === button));
        feedback.textContent = OP_HINT[gate];
        feedback.className = 'q2-feedback is-hint';
        render();
      });
    });

    el.querySelectorAll('.q2-switch').forEach(group => {
      const toggle = () => {
        if (group.getAttribute('aria-disabled') === 'true') return;
        if (group.dataset.sw === 'A') a = a ? 0 : 1;
        else b = b ? 0 : 1;
        render();
      };
      group.addEventListener('click', toggle);
      group.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ' || event.code === 'Space') {
          event.preventDefault();
          toggle();
        }
      });
    });

    if (check) {
      check.addEventListener('click', () => {
        const task = cfg.task;
        const ok = gate === task.gate && a === task.a && (task.gate === 'not' || b === task.b);
        feedback.textContent = ok
          ? (task.text || 'Верно: схема настроена правильно.')
          : 'Пока не то. Проверьте выбранный элемент и положения выключателей.';
        feedback.className = 'q2-feedback ' + (ok ? 'is-good' : 'is-bad');
      });
    }

    render();
  };

  /* ------------------------------- цепочка ------------------------------- */
  WIDGETS.chain = function (el, cfg) {
    let a = cfg.a == null ? 1 : cfg.a;
    let b = cfg.b == null ? 0 : cfg.b;
    let g1 = cfg.g1 || 'and';
    let g2 = cfg.g2 || 'not';
    const gates1 = ['and', 'or', 'xor', 'imp', 'eq'];
    const gates2 = ['not', 'and', 'or', 'xor'];

    el.classList.add('q2-chain-lab');
    el.innerHTML = `<div class="q2-lab-stage">
        <svg viewBox="0 0 760 300" role="img" aria-label="Цепочка из двух логических элементов">
          <g class="q2-switch" data-sw="A" transform="translate(28 62)">
            <rect class="q2-sw-track" width="112" height="48" rx="24"/><circle class="q2-sw-knob" cx="24" cy="24" r="17"/><text class="q2-sw-value" x="24" y="29">0</text><text class="q2-sw-name" x="56" y="72">A</text>
          </g>
          <g class="q2-switch" data-sw="B" transform="translate(28 192)">
            <rect class="q2-sw-track" width="112" height="48" rx="24"/><circle class="q2-sw-knob" cx="24" cy="24" r="17"/><text class="q2-sw-value" x="24" y="29">0</text><text class="q2-sw-name" x="56" y="72">B</text>
          </g>
          <g class="q2-wire-group" data-wire="A"><line class="q2-wire" x1="140" y1="86" x2="250" y2="132"/><line class="q2-flow" x1="140" y1="86" x2="250" y2="132"/></g>
          <g class="q2-wire-group" data-wire="B"><line class="q2-wire" x1="140" y1="216" x2="250" y2="168"/><line class="q2-flow" x1="140" y1="216" x2="250" y2="168"/></g>
          <rect class="q2-gate-box" x="250" y="105" width="104" height="90" rx="18"/>
          <text class="q2-gate-symbol q2-gate-symbol-sm" x="302" y="160" data-g1-label>∧</text>
          <g class="q2-wire-group" data-wire="S1"><line class="q2-wire" x1="354" y1="150" x2="470" y2="150"/><line class="q2-flow" x1="354" y1="150" x2="470" y2="150"/></g>
          <text class="q2-signal-label" x="412" y="138">S1</text>
          <g class="q2-wire-group" data-wire="B2"><line class="q2-wire" x1="140" y1="216" x2="470" y2="190"/><line class="q2-flow" x1="140" y1="216" x2="470" y2="190"/></g>
          <rect class="q2-gate-box" x="470" y="105" width="104" height="90" rx="18"/>
          <text class="q2-gate-symbol q2-gate-symbol-sm" x="522" y="160" data-g2-label>¬</text>
          <g class="q2-wire-group" data-wire="Y"><line class="q2-wire" x1="574" y1="150" x2="646" y2="150"/><line class="q2-flow" x1="574" y1="150" x2="646" y2="150"/></g>
          <g class="q2-bulb" data-bulb transform="translate(44 0) scale(.8) translate(110 38)">
            <circle class="q2-bulb-glow" cx="628" cy="170" r="62" fill="url(#q2-bulb-glow)"/>
            <circle class="q2-bulb-body" cx="628" cy="170" r="34"/>
            <path class="q2-bulb-filament" d="M616 180l7-14 6 10 6-10 6 14"/>
            <rect class="q2-bulb-base" x="614" y="201" width="28" height="14" rx="5"/>
          </g>
        </svg>
      </div>
      <div class="q2-lab-side">
        <label class="q2-select-row">Первый элемент
          <select class="q2-select" data-g1>${gates1.map(item => `<option value="${item}"${item === g1 ? ' selected' : ''}>${OP_NAME[item]}</option>`).join('')}</select>
        </label>
        <label class="q2-select-row">Второй элемент
          <select class="q2-select" data-g2>${gates2.map(item => `<option value="${item}"${item === g2 ? ' selected' : ''}>${OP_NAME[item]}</option>`).join('')}</select>
        </label>
        <div class="q2-formula" data-formula></div>
        <div class="q2-mini-table" data-table></div>
        <div class="q2-feedback" data-feedback></div>
      </div>`;

    const formula = el.querySelector('[data-formula]');
    const table = el.querySelector('[data-table]');
    const feedback = el.querySelector('[data-feedback]');

    function compute() {
      const s1 = OPS[g1](a, b);
      const y = g2 === 'not' ? OPS.not(s1) : OPS[g2](s1, b);
      return { s1, y };
    }

    function render() {
      const { s1, y } = compute();
      el.querySelector('[data-g1-label]').textContent = gateLabel(g1);
      el.querySelector('[data-g2-label]').textContent = gateLabel(g2);
      ['A', 'B'].forEach(name => {
        const value = name === 'A' ? a : b;
        const group = el.querySelector(`[data-sw="${name}"]`);
        group.querySelector('.q2-sw-track').classList.toggle('is-on', value === 1);
        const knob = group.querySelector('.q2-sw-knob');
        knob.setAttribute('cx', value ? 89 : 24);
        knob.classList.toggle('is-on', value === 1);
        group.querySelector('.q2-sw-value').textContent = String(value);
        group.querySelector('.q2-sw-value').setAttribute('x', value ? 89 : 24);
      });
      [['A', a === 1], ['B', b === 1], ['S1', s1 === 1], ['B2', b === 1], ['Y', y === 1]].forEach(([name, active]) => {
        const group = el.querySelector(`[data-wire="${name}"]`);
        if (group) group.classList.toggle('is-on', active);
      });
      el.querySelector('[data-bulb]').classList.toggle('is-on', y === 1);
      formula.innerHTML = `<span class="q2-formula-main">S1 = ${a} ${OP_SIGN[g1]} ${b} = <b>${s1}</b></span>
        <span class="q2-formula-main">Y = ${g2 === 'not' ? `¬S1 = ¬${s1}` : `S1 ${OP_SIGN[g2]} B = ${s1} ${OP_SIGN[g2]} ${b}`} = <b>${y}</b></span>`;

      const rows = [[0, 0], [0, 1], [1, 0], [1, 1]];
      table.innerHTML = `<table><thead><tr><th>A</th><th>B</th><th>S1</th><th>Y</th></tr></thead><tbody>
        ${rows.map(([rowA, rowB]) => {
          const first = OPS[g1](rowA, rowB);
          const result = g2 === 'not' ? OPS.not(first) : OPS[g2](first, rowB);
          const current = rowA === a && rowB === b;
          return `<tr class="${current ? 'is-current' : ''}"><td>${rowA}</td><td>${rowB}</td><td>${first}</td><td class="${result ? 'is-one' : 'is-zero'}">${result}</td></tr>`;
        }).join('')}
      </tbody></table>`;
      feedback.textContent = 'S1 — промежуточный сигнал: выход первого элемента становится входом второго.';
      feedback.className = 'q2-feedback is-hint';
    }

    el.querySelectorAll('.q2-switch').forEach(group => {
      group.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();
        if (group.dataset.sw === 'A') a = a ? 0 : 1;
        else b = b ? 0 : 1;
        render();
      });
    });
    el.querySelector('[data-g1]').addEventListener('change', event => { g1 = event.target.value; render(); });
    el.querySelector('[data-g2]').addEventListener('change', event => { g2 = event.target.value; render(); });
    render();
  };

  /* --------------------------- таблица истинности ------------------------ */
  function compileExpr(expr) {
    const safe = String(expr || '0').replace(/[^A-C0-9&|!^<>=() ]/g, '');
    try {
      return new Function('A', 'B', 'C', `return (${safe}) ? 1 : 0;`);
    } catch (e) {
      return () => 0;
    }
  }

  WIDGETS.truth = function (el, cfg) {
    const vars = cfg.vars === 3 ? 3 : 2;
    const exprs = cfg.exprs || [{ label: 'A ∧ B', expr: 'A & B' }];
    let current = 0;
    const rows = vars === 3
      ? [[0, 0, 0], [0, 0, 1], [0, 1, 0], [0, 1, 1], [1, 0, 0], [1, 0, 1], [1, 1, 0], [1, 1, 1]]
      : [[0, 0], [0, 1], [1, 0], [1, 1]];

    el.classList.add('q2-truth-lab');
    el.innerHTML = `<div class="q2-truth-tabs">${exprs.map((item, i) => `<button type="button" class="q2-tab${i === 0 ? ' is-active' : ''}" data-expr="${i}">${item.label}</button>`).join('')}</div>
      <div class="q2-truth-body">
        <div class="q2-truth-table" data-table></div>
        <div class="q2-truth-side">
          <div class="q2-feedback" data-feedback aria-live="polite"></div>
          <div class="q2-truth-actions">
            <button type="button" class="q2-btn q2-btn-sm" data-check>Проверить</button>
            <button type="button" class="q2-btn q2-btn-sm q2-btn-ghost" data-reset>Очистить</button>
            <button type="button" class="q2-btn q2-btn-sm q2-btn-ghost" data-show>Показать ответ</button>
          </div>
        </div>
      </div>`;

    const tableNode = el.querySelector('[data-table]');
    const feedback = el.querySelector('[data-feedback]');
    let cells = [];

    function render() {
      const item = exprs[current];
      const columns = item.columns || (item.mid ? [item.mid] : []);
      const head = ['A', 'B', 'C'].slice(0, vars).map(v => `<th>${v}</th>`).join('')
        + columns.map(column => `<th>${column.label}</th>`).join('')
        + `<th>${item.resultLabel || 'Y'}</th>`;
      const body = rows.map((row, rowIndex) => {
        const values = row.map(value => `<td>${value}</td>`).join('');
        const intermediateCells = columns.map((column, columnIndex) => `<td><button type="button" class="q2-cell" data-row="${rowIndex}" data-col="${columnIndex}" aria-label="${attr(column.label)}, строка ${rowIndex + 1}">?</button></td>`).join('');
        return `<tr>${values}${intermediateCells}<td><button type="button" class="q2-cell" data-row="${rowIndex}" data-col="res" aria-label="Результат, строка ${rowIndex + 1}">?</button></td></tr>`;
      }).join('');
      tableNode.innerHTML = `<div class="q2-table-wrap"><table class="q2-table q2-table-truth"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>`;
      cells = Array.from(tableNode.querySelectorAll('.q2-cell'));
      cells.forEach(cell => {
        cell.addEventListener('click', () => {
          if (cell.disabled) return;
          const value = cell.textContent === '?' ? 0 : cell.textContent === '0' ? 1 : 0;
          cell.textContent = String(value);
          cell.classList.remove('is-correct', 'is-wrong');
        });
      });
      feedback.textContent = `Заполняйте столбцы слева направо для ${item.label}. Нажимайте на «?», чтобы поставить 0 или 1.`;
      feedback.className = 'q2-feedback is-hint';
    }

    function check(show) {
      const item = exprs[current];
      const fn = compileExpr(item.expr);
      const columns = item.columns || (item.mid ? [item.mid] : []);
      const columnFns = columns.map(column => compileExpr(column.expr));
      let filled = true;
      let allCorrect = true;
      cells.forEach(cell => {
        const row = rows[Number(cell.dataset.row)];
        const expected = cell.dataset.col === 'res' ? fn(...row) : columnFns[Number(cell.dataset.col)](...row);
        if (cell.textContent === '?') filled = false;
        const correct = Number(cell.textContent) === expected;
        if (show) {
          cell.textContent = String(expected);
          cell.classList.add('is-correct');
          cell.classList.remove('is-wrong');
          return;
        }
        cell.classList.toggle('is-correct', correct && cell.textContent !== '?');
        cell.classList.toggle('is-wrong', !correct && cell.textContent !== '?');
        if (!correct) allCorrect = false;
      });
      if (show) {
        feedback.textContent = 'Ответ показан. Сравните его со своей таблицей и найдите, где разошлись.';
        feedback.className = 'q2-feedback is-hint';
        return;
      }
      if (!filled) {
        feedback.textContent = 'Заполните все ячейки: нажимайте на «?», чтобы поставить 0 или 1.';
        feedback.className = 'q2-feedback is-bad';
        return;
      }
      feedback.textContent = allCorrect
        ? `Верно. Таблица для ${item.label} построена без ошибок.`
        : 'Есть ошибки. Проверьте порядок действий: сначала выражение в скобках и отрицание, затем И/ИЛИ.';
      feedback.className = 'q2-feedback ' + (allCorrect ? 'is-good' : 'is-bad');
    }

    el.querySelectorAll('[data-expr]').forEach(tab => {
      tab.addEventListener('click', () => {
        current = Number(tab.dataset.expr);
        el.querySelectorAll('[data-expr]').forEach(node => node.classList.toggle('is-active', node === tab));
        render();
      });
    });
    el.querySelector('[data-check]').addEventListener('click', () => check(false));
    el.querySelector('[data-reset]').addEventListener('click', render);
    el.querySelector('[data-show]').addEventListener('click', () => check(true));
    render();
  };

  /* --------------------- порядок логических действий ------------------- */
  const logicNot = child => ({ op: 'not', child });
  const logicBinary = (op, left, right) => ({ op, left, right });
  const logicSign = { and: '∧', or: '∨' };
  function logicHTML(node, algebraic = false) {
    if (typeof node === 'string') return node;
    if (node.op === 'not') return `<span class="q2-overline">${logicHTML(node.child, algebraic)}</span>`;
    const operand = child => typeof child !== 'string' && child.op !== 'not'
      ? `(${logicHTML(child, algebraic)})` : logicHTML(child, algebraic);
    if (algebraic && node.op === 'and') return `${operand(node.left)}${operand(node.right)}`;
    const sign = algebraic && node.op === 'or' ? '+' : logicSign[node.op];
    return `${operand(node.left)} <span class="q2-logic-sign">${sign}</span> ${operand(node.right)}`;
  }
  function logicText(node, algebraic = false) {
    if (typeof node === 'string') return node;
    if (node.op === 'not') return `НЕ (${logicText(node.child, algebraic)})`;
    if (algebraic && node.op === 'and') return `(${logicText(node.left, algebraic)}${logicText(node.right, algebraic)})`;
    const sign = algebraic && node.op === 'or' ? '+' : logicSign[node.op];
    return `(${logicText(node.left, algebraic)} ${sign} ${logicText(node.right, algebraic)})`;
  }
  function logicValue(node, A, B, C) {
    if (node === 'A') return A;
    if (node === 'B') return B;
    if (node === 'C') return C;
    if (node.op === 'not') return 1 - logicValue(node.child, A, B, C);
    const left = logicValue(node.left, A, B, C);
    const right = logicValue(node.right, A, B, C);
    return node.op === 'and' ? left & right : left | right;
  }
  function logicColumns(node, result = []) {
    if (typeof node === 'string') return result;
    if (node.op === 'not') logicColumns(node.child, result);
    else { logicColumns(node.left, result); logicColumns(node.right, result); }
    if (!result.some(item => logicText(item) === logicText(node))) result.push(node);
    return result;
  }

  WIDGETS.truthNotebook = function (el, cfg) {
    const varsCount = cfg && cfg.vars === 3 ? 3 : 2;
    const storageKey = varsCount === 3 ? 'q2-9-3-notebook' : 'q2-9-2-notebook';
    const random = max => {
      const values = new Uint32Array(1);
      window.crypto.getRandomValues(values);
      return values[0] % max;
    };
    const makeTree = count => {
      if (count === 0) return varsCount === 3 ? ['A', 'B', 'C'][random(3)] : (random(2) ? 'A' : 'B');
      if (random(4) === 0) return logicNot(makeTree(count - 1));
      const leftCount = random(count);
      return logicBinary(random(2) ? 'and' : 'or', makeTree(leftCount), makeTree(count - 1 - leftCount));
    };
    const suitable = (node, depth = 0) => {
      if (typeof node === 'string') return true;
      if (depth > 4) return false;
      if (node.op === 'not') return node.child.op !== 'not' && suitable(node.child, depth + 1);
      const left = logicText(node.left);
      const right = logicText(node.right);
      if (left === right || (node.left.op === 'not' && logicText(node.left.child) === right)
        || (node.right.op === 'not' && logicText(node.right.child) === left)) return false;
      return suitable(node.left, depth + 1) && suitable(node.right, depth + 1);
    };
    let previous = [];
    try { previous = JSON.parse(localStorage.getItem(storageKey) || '[]'); } catch (_) { /* storage is optional */ }
    const operationCounts = [3, 4, 4];
    const inputRows = varsCount === 3
      ? [[0,0,0],[0,0,1],[0,1,0],[0,1,1],[1,0,0],[1,0,1],[1,1,0],[1,1,1]]
      : [[0,0],[0,1],[1,0],[1,1]];
    const tasks = operationCounts.map((operations, index) => {
      let node;
      while (true) {
        node = makeTree(operations);
        const signature = logicText(node);
        const values = inputRows.map(row => logicValue(node, ...row));
        const usesAll = /A/.test(signature) && /B/.test(signature) && (varsCount === 2 || /C/.test(signature));
        const dependsAll = varsCount === 3
          ? ([0,1,2,3].some(i => values[i] !== values[i + 4])
            && [0,1,4,5].some(i => values[i] !== values[i + 2])
            && [0,2,4,6].some(i => values[i] !== values[i + 1]))
          : ((values[0] !== values[2] || values[1] !== values[3])
            && (values[0] !== values[1] || values[2] !== values[3]));
        const mixedOperations = signature.includes('НЕ') && (operations === 2 || (signature.includes('∧') && signature.includes('∨')));
        if (usesAll && dependsAll && mixedOperations && suitable(node) && signature !== previous[index] && logicColumns(node).length === operations) break;
      }
      return node;
    });
    try { localStorage.setItem(storageKey, JSON.stringify(tasks.map(logicText))); } catch (_) { /* storage is optional */ }
    const taskColumns = tasks.map(node => (varsCount === 3 ? ['A', 'B', 'C', ...logicColumns(node)] : ['A', 'B', ...logicColumns(node)]));
    const answers = taskColumns.map(columns => Array.from({ length: inputRows.length }, () => columns.map(() => '?')));
    const orderPool = taskColumns[2].slice(varsCount, -1);
    const orderChoices = shuffledCopy(orderPool.map((_, index) => index));
    const selectedOrder = orderPool.map(() => '');
    el.classList.add('q2-notebook');
    el.innerHTML = `<div class="q2-notebook-tabs" role="tablist" aria-label="Задания практической работы">${tasks.map((_, index) => `<button type="button" role="tab" class="q2-notebook-tab${index === 0 ? ' is-active' : ''}" id="q2-notebook-tab-${index}" aria-controls="q2-notebook-panel" aria-selected="${index === 0}" tabindex="${index === 0 ? '0' : '-1'}" data-notebook-task="${index}"><span>0${index + 1}</span>Задание ${index + 1}<small>${[2,3,4][index]} балла</small></button>`).join('')}</div>
      <div role="tabpanel" id="q2-notebook-panel" data-notebook-panel></div>`;
    const tabs = Array.from(el.querySelectorAll('[data-notebook-task]'));
    const render = index => {
      tabs.forEach((tab, i) => { tab.classList.toggle('is-active', i === index); tab.setAttribute('aria-selected', String(i === index)); tab.tabIndex = i === index ? 0 : -1; });
      const panel = el.querySelector('[data-notebook-panel]');
      panel.setAttribute('aria-labelledby', tabs[index].id);
      const columns = taskColumns[index];
      const columnNode = col => index === 2 && col >= varsCount && col < columns.length - 1
        ? (selectedOrder[col - varsCount] === '' ? null : orderPool[Number(selectedOrder[col - varsCount])])
        : columns[col];
      const columnLabel = col => col === columns.length - 1 ? 'Y' : columnNode(col) ? logicText(columnNode(col)) : `Промежуточное выражение ${col - varsCount + 1}`;
      const header = (node, col) => {
        if (col === columns.length - 1) return '<th>Y</th>';
        if (index !== 2 || col < varsCount) return `<th>${logicHTML(node, varsCount === 3)}</th>`;
        const position = col - varsCount;
        return `<th class="q2-order-column"><span class="q2-order-column-title" id="q2-order-title-${position}">Действие ${position + 1}</span><button type="button" class="q2-order-picker" data-notebook-order="${position}" value="${selectedOrder[position]}" aria-label="Выражение для действия ${position + 1}" aria-haspopup="listbox" aria-expanded="false" aria-controls="q2-order-menu-${position}"><span data-order-preview="${position}">${columnNode(col) ? logicHTML(columnNode(col), varsCount === 3) : 'Выберите выражение'}</span><i aria-hidden="true"></i></button><div class="q2-order-menu" id="q2-order-menu-${position}" popover="auto" role="listbox" aria-labelledby="q2-order-title-${position}">${orderChoices.map(choice => `<button type="button" role="option" class="q2-order-choice" data-order-choice="${choice}" aria-label="${attr(logicText(orderPool[choice], varsCount === 3))}" aria-selected="${selectedOrder[position] === String(choice)}">${logicHTML(orderPool[choice], varsCount === 3)}</button>`).join('')}</div></th>`;
      };
      panel.innerHTML = `<div class="q2-notebook-formula"><div class="q2-math-display" role="math" aria-label="${attr(logicText(tasks[index], varsCount === 3))}">${logicHTML(tasks[index], varsCount === 3)}</div></div>
        <p class="q2-notebook-instruction">Выполните работу в тетради. Таблицу на экране тоже можно заполнить: нажимайте на ячейки — ? → 0 → 1. ${index === 2 ? `Самостоятельно выберите порядок промежуточных выражений в заголовках столбцов. Затем заполните ${varsCount === 3 ? 'A, B, C' : 'A, B'}, промежуточные значения и Y.` : `Сначала заполните ${varsCount === 3 ? 'A, B и C' : 'A и B'}, затем промежуточные столбцы и Y.`}</p>
        <div class="q2-table-wrap"><table class="q2-table q2-notebook-template"><caption>Заполните все ячейки самостоятельно</caption><thead><tr>${columns.map(header).join('')}</tr></thead><tbody>${answers[index].map((row, rowIndex) => `<tr>${row.map((value, col) => `<td><button type="button" class="q2-cell" data-notebook-row="${rowIndex}" data-notebook-col="${col}" aria-label="${attr(columnLabel(col))}, строка ${rowIndex + 1}">${value}</button></td>`).join('')}</tr>`).join('')}</tbody></table></div>
        <div class="q2-notebook-check"><p class="q2-feedback" data-notebook-feedback role="status" aria-live="polite">Заполните таблицу и нажмите «Проверить».</p><button type="button" class="q2-btn" data-notebook-check>Проверить</button></div>`;
      const feedback = panel.querySelector('[data-notebook-feedback]');
      panel.querySelectorAll('[data-notebook-order]').forEach(select => {
        const position = Number(select.dataset.notebookOrder);
        const menu = panel.querySelector(`#q2-order-menu-${position}`);
        const options = Array.from(menu.querySelectorAll('[data-order-choice]'));
        const positionMenu = () => {
          const rect = select.getBoundingClientRect();
          const width = Math.min(Math.max(rect.width, 240), window.innerWidth - 24);
          menu.style.width = `${width}px`;
          menu.style.left = `${Math.max(12, Math.min(rect.left, window.innerWidth - width - 12))}px`;
          menu.style.top = `${rect.bottom + 8}px`;
          const height = menu.getBoundingClientRect().height;
          if (rect.bottom + 8 + height > window.innerHeight - 12) menu.style.top = `${Math.max(12, rect.top - height - 8)}px`;
        };
        const openMenu = () => {
          if (menu.matches(':popover-open')) { menu.hidePopover(); return; }
          positionMenu();
          menu.showPopover();
          positionMenu();
          (options.find(option => option.getAttribute('aria-selected') === 'true') || options[0]).focus({ preventScroll: true });
        };
        panel.querySelector('.q2-table-wrap').addEventListener('scroll', () => {
          if (menu.matches(':popover-open')) positionMenu();
        });
        select.addEventListener('click', openMenu);
        select.addEventListener('keydown', event => {
          if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
          event.preventDefault();
          if (!menu.matches(':popover-open')) openMenu();
        });
        menu.addEventListener('toggle', () => select.setAttribute('aria-expanded', String(menu.matches(':popover-open'))));
        options.forEach((option, optionIndex) => {
          option.addEventListener('click', () => {
            select.value = option.dataset.orderChoice;
            options.forEach(item => item.setAttribute('aria-selected', String(item === option)));
            select.dispatchEvent(new Event('change'));
            menu.hidePopover();
            select.focus({ preventScroll: true });
          });
          option.addEventListener('keydown', event => {
            if (event.key === 'Escape') { event.preventDefault(); menu.hidePopover(); select.focus(); return; }
            if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
            event.preventDefault();
            const next = event.key === 'Home' ? 0 : event.key === 'End' ? options.length - 1 : (optionIndex + (event.key === 'ArrowDown' ? 1 : options.length - 1)) % options.length;
            options[next].focus();
          });
        });
        select.addEventListener('change', () => {
          const position = Number(select.dataset.notebookOrder);
          selectedOrder[position] = select.value;
          panel.querySelector(`[data-order-preview="${position}"]`).innerHTML = columnNode(position + varsCount) ? logicHTML(columnNode(position + varsCount), varsCount === 3) : 'Выберите выражение';
          panel.querySelectorAll('[data-notebook-row]').forEach(cell => {
            cell.classList.remove('is-correct', 'is-wrong');
            cell.removeAttribute('aria-invalid');
            cell.setAttribute('aria-label', `${columnLabel(Number(cell.dataset.notebookCol))}, строка ${Number(cell.dataset.notebookRow) + 1}`);
          });
          panel.querySelectorAll('[data-notebook-order]').forEach(control => control.removeAttribute('aria-invalid'));
          feedback.className = 'q2-feedback';
          feedback.textContent = 'Порядок изменён. Проверьте значения в соответствующих столбцах и нажмите «Проверить».';
        });
      });
      panel.querySelectorAll('[data-notebook-row]').forEach(cell => {
        cell.addEventListener('click', () => {
          const row = Number(cell.dataset.notebookRow);
          const col = Number(cell.dataset.notebookCol);
          const value = answers[index][row][col] === '0' ? '1' : '0';
          answers[index][row][col] = value;
          cell.textContent = value;
          cell.classList.remove('is-correct', 'is-wrong');
          cell.removeAttribute('aria-invalid');
          feedback.className = 'q2-feedback';
          feedback.textContent = 'Значение изменено. Нажмите «Проверить» ещё раз.';
        });
      });
      panel.querySelector('[data-notebook-check]').addEventListener('click', () => {
        if (index === 2) {
          const available = new Set();
          let validOrder = true;
          panel.querySelectorAll('[data-notebook-order]').forEach(select => {
            const choice = select.value === '' ? null : orderPool[Number(select.value)];
            const signature = choice ? logicText(choice) : '';
            const valid = choice && !available.has(signature)
              && logicColumns(choice).slice(0, -1).every(child => available.has(logicText(child)));
            select.setAttribute('aria-invalid', String(!valid));
            if (valid) available.add(signature);
            else validOrder = false;
          });
          if (!validOrder) {
            feedback.className = 'q2-feedback is-bad';
            feedback.textContent = 'Проверьте порядок: выберите каждое выражение один раз. Результат предыдущего действия должен быть готов до его использования в следующем.';
            return;
          }
        }
        let missing = 0;
        let wrong = 0;
        const cells = Array.from(panel.querySelectorAll('[data-notebook-row]'));
        const results = cells.map(cell => {
          const row = Number(cell.dataset.notebookRow);
          const col = Number(cell.dataset.notebookCol);
          const value = answers[index][row][col];
          const [A, B, C] = inputRows[row];
          const correct = value !== '?' && Number(value) === logicValue(columnNode(col), A, B, C);
          if (value === '?') missing += 1;
          else if (!correct) wrong += 1;
          return { cell, col, correct };
        });
        const allValid = missing === 0 && wrong === 0;
        const lastCol = columns.length - 1;
        results.forEach(({ cell, col, correct }) => {
          if (varsCount === 3) {
            if (allValid) {
              cell.classList.add('is-correct');
              cell.classList.remove('is-wrong');
              cell.setAttribute('aria-invalid', 'false');
            } else {
              cell.classList.remove('is-correct');
              const showWrong = col === lastCol && !correct;
              cell.classList.toggle('is-wrong', showWrong);
              cell.setAttribute('aria-invalid', String(showWrong));
            }
          } else {
            cell.classList.toggle('is-correct', correct);
            cell.classList.toggle('is-wrong', !correct);
            cell.setAttribute('aria-invalid', String(!correct));
          }
        });
        feedback.className = 'q2-feedback ' + (allValid ? 'is-good' : 'is-bad');
        feedback.textContent = missing
          ? `Не заполнено ячеек: ${missing}.${wrong ? ` Ошибок: ${wrong}.` : ''} Заполните все столбцы и проверьте таблицу ещё раз.`
          : wrong ? `Есть ошибки (${wrong}). Проверьте входы, промежуточные столбцы и итоговый столбец Y.`
            : 'Верно! Все значения таблицы заполнены правильно.';
      });
    };
    tabs.forEach((tab, index) => {
      tab.addEventListener('click', () => render(index));
      tab.addEventListener('keydown', event => {
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
        event.preventDefault();
        const next = event.key === 'Home' ? 0 : event.key === 'End' ? 2 : (index + (event.key === 'ArrowRight' ? 1 : 2)) % 3;
        render(next); tabs[next].focus();
      });
    });
    render(0);
  };

  WIDGETS.circuitBuilder = function (el) {
    el.classList.add('q2-circuit-builder');
    const pick = arr => arr[Math.floor(Math.random() * arr.length)];
    const tier1 = [
      logicBinary('and', logicNot('A'), 'B'),
      logicBinary('or', 'A', logicNot('B')),
      logicNot(logicBinary('and', 'A', 'B')),
      logicNot(logicBinary('or', 'A', 'B'))
    ];
    const tier2 = [
      logicBinary('and', logicBinary('or', 'A', 'B'), logicNot('A')),
      logicBinary('or', logicBinary('and', 'A', 'B'), logicNot('B')),
      logicBinary('and', logicNot('A'), logicNot('B')),
      logicBinary('or', logicNot(logicBinary('or', 'A', 'B')), 'A')
    ];
    const tier3 = [
      logicBinary('and', logicBinary('or', 'A', logicNot('B')), logicBinary('or', logicNot('A'), 'B')),
      logicBinary('or', logicNot(logicBinary('and', 'A', 'B')), logicBinary('and', logicNot('A'), 'B')),
      logicBinary('and', logicBinary('or', logicNot('A'), 'B'), logicNot(logicBinary('and', 'A', 'B'))),
      logicBinary('or', logicNot(logicBinary('or', 'A', 'B')), logicBinary('and', 'A', 'B'))
    ];
    const tasks = [pick(tier1), pick(tier2), pick(tier3)];
    const states = tasks.map(() => ({ gates: [], wires: [], nextId: 1, a: 0, b: 0, zoom: 1 }));
    const solved = tasks.map(() => false);
    let current = 0;
    let pendingFrom = null;

    const tabMarks = ['2 балла', '3 балла', '4 балла'];
    el.innerHTML = `
      <div class="q2-notebook-tabs" role="tablist" aria-label="Задания по схемам">
        ${tasks.map((_, i) => `<button type="button" role="tab" class="q2-notebook-tab" data-cb-tab="${i}" aria-selected="${i === 0}">Задание ${i + 1} · ${tabMarks[i]}</button>`).join('')}
      </div>
      <div data-cb-panel></div>
    `;

    const tabs = [...el.querySelectorAll('[data-cb-tab]')];
    const panel = el.querySelector('[data-cb-panel]');

    const portPos = (canvasRect, portEl) => {
      const r = portEl.getBoundingClientRect();
      return { x: r.left - canvasRect.left + r.width / 2, y: r.top - canvasRect.top + r.height / 2 };
    };

    const render = idx => {
      current = idx;
      pendingFrom = null;
      tabs.forEach((t, i) => {
        t.classList.toggle('is-active', i === idx);
        t.classList.toggle('is-done', solved[i]);
        t.setAttribute('aria-selected', String(i === idx));
      });
      const st = states[idx];
      const evalSource = (src, A, B, visiting) => {
        if (src === 'A') return A;
        if (src === 'B') return B;
        if (visiting.has(src)) return null;
        const gate = st.gates.find(g => g.id === src);
        if (!gate) return null;
        visiting.add(src);
        const w0 = st.wires.find(w => w.to === `${src}:0`);
        if (!w0) return null;
        const v0 = evalSource(w0.from, A, B, new Set(visiting));
        if (v0 === null) return null;
        if (gate.op === 'not') return 1 - v0;
        const w1 = st.wires.find(w => w.to === `${src}:1`);
        if (!w1) return null;
        const v1 = evalSource(w1.from, A, B, new Set(visiting));
        if (v1 === null) return null;
        return gate.op === 'and' ? (v0 & v1) : (v0 | v1);
      };
      const yWireNow = st.wires.find(w => w.to === 'Y:0');
      const liveY = yWireNow ? evalSource(yWireNow.from, st.a, st.b, new Set()) : null;
      const ttRows = [[0, 0], [0, 1], [1, 0], [1, 1]];
      const ttCols = logicColumns(tasks[idx]);
      const gateShape = op => {
        if (op === 'and') return '<svg width="108" height="74" viewBox="0 0 108 74" aria-hidden="true"><path d="M10 6 H56 A31 31 0 0 1 56 68 H10 Z" fill="#f5f3ff" stroke="#7c3aed" stroke-width="2.5"/><text x="45" y="42" text-anchor="middle" font-size="16" font-weight="800" fill="#5b21b6">И</text></svg>';
        if (op === 'or') return '<svg width="108" height="74" viewBox="0 0 108 74" aria-hidden="true"><path d="M10 6 Q28 37 10 68 Q62 68 96 37 Q62 6 10 6 Z" fill="#ecfeff" stroke="#0891b2" stroke-width="2.5"/><text x="50" y="42" text-anchor="middle" font-size="15" font-weight="800" fill="#0e7490">ИЛИ</text></svg>';
        return '<svg width="108" height="74" viewBox="0 0 108 74" aria-hidden="true"><polygon points="10,6 10,68 78,37" fill="#fffbeb" stroke="#d97706" stroke-width="2.5"/><circle cx="86" cy="37" r="6" fill="#fffbeb" stroke="#d97706" stroke-width="2.5"/><text x="34" y="42" text-anchor="middle" font-size="14" font-weight="800" fill="#b45309">НЕ</text></svg>';
      };
      panel.innerHTML = `
        <div class="q2-cb-formula">
          <div class="q2-math-display" role="math" aria-label="${attr(logicText(tasks[idx], true))}">${logicHTML(tasks[idx], true)}</div>
        </div>
        <div class="q2-cb-toolbar">
          <button type="button" class="q2-btn q2-btn-sm" data-cb-add="and">+ И</button>
          <button type="button" class="q2-btn q2-btn-sm" data-cb-add="or">+ ИЛИ</button>
          <button type="button" class="q2-btn q2-btn-sm" data-cb-add="not">+ НЕ</button>
          <button type="button" class="q2-btn q2-btn-sm q2-btn-ghost" data-cb-clear>Очистить</button>
          <span style="margin-left:auto;display:inline-flex;gap:6px;">
            <button type="button" class="q2-btn q2-btn-sm q2-btn-ghost" data-cb-size="-0.15" aria-label="Уменьшить масштаб">−</button>
            <button type="button" class="q2-btn q2-btn-sm q2-btn-ghost" data-cb-size="0.15" aria-label="Увеличить масштаб">+</button>
          </span>
        </div>
        <div class="q2-cb-layout">
          <div class="q2-cb-canvas" data-cb-canvas>
            <div data-cb-stage style="position:absolute;inset:0;">
            <svg class="q2-cb-wires" data-cb-wires>
              <defs><marker id="q2-cb-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 1 L 10 5 L 0 9 z" fill="#6366f1"/></marker></defs>
            </svg>
            <div class="q2-cb-node is-fixed" data-cb-toggle="a" style="left:16px;top:68px;cursor:pointer;" title="Нажмите, чтобы переключить A">A = ${st.a}<button type="button" class="q2-cb-port q2-cb-port-out" data-port-out="A" aria-label="Выход A"></button></div>
            <div class="q2-cb-node is-fixed" data-cb-toggle="b" style="left:16px;top:210px;cursor:pointer;" title="Нажмите, чтобы переключить B">B = ${st.b}<button type="button" class="q2-cb-port q2-cb-port-out" data-port-out="B" aria-label="Выход B"></button></div>
            <div class="q2-cb-node is-fixed" data-cb-node="Y" style="right:16px;top:139px;">Y = ${liveY === null ? '?' : liveY}<button type="button" class="q2-cb-port q2-cb-port-in0" data-port-in="Y:0" aria-label="Вход Y"></button></div>
            ${st.gates.map(g => {
              const label = g.op === 'and' ? 'И' : g.op === 'or' ? 'ИЛИ' : 'НЕ';
              const inPorts = g.op === 'not'
                ? `<button type="button" class="q2-cb-port q2-cb-port-in0" data-port-in="${g.id}:0" aria-label="Вход ${label}"></button>`
                : `<button type="button" class="q2-cb-port q2-cb-port-in1" data-port-in="${g.id}:0" aria-label="Вход 1 ${label}"></button><button type="button" class="q2-cb-port q2-cb-port-in2" data-port-in="${g.id}:1" aria-label="Вход 2 ${label}"></button>`;
              return `<div class="q2-cb-node is-gate-${g.op}" data-cb-gate="${g.id}" style="left:${g.x}px;top:${g.y}px;transform:scale(${st.zoom});">${inPorts}${gateShape(g.op)}<button type="button" class="q2-cb-port q2-cb-port-out" data-port-out="${g.id}" aria-label="Выход ${label}"></button><button type="button" class="q2-cb-del" data-cb-del="${g.id}" aria-label="Удалить ${label}">×</button></div>`;
            }).join('')}
            </div>
          </div>
          <div class="q2-cb-table-box">
            <h4>Таблица истинности</h4>
            <table class="q2-cb-tt">
              <thead><tr><th>A</th><th>B</th>${ttCols.map((c, ci) => `<th>${ci === ttCols.length - 1 ? 'Y' : logicHTML(c, true)}</th>`).join('')}</tr></thead>
              <tbody>
                ${ttRows.map(([A, B]) => {
                  const exp = logicValue(tasks[idx], A, B, 0);
                  const isCur = A === st.a && B === st.b;
                  const cls = isCur && liveY !== null ? (liveY === exp ? 'is-match' : 'is-mismatch') : '';
                  return `<tr class="${cls}"><td>${A}</td><td>${B}</td>${ttCols.map(c => `<td>${logicValue(c, A, B, 0)}</td>`).join('')}</tr>`;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
        <div class="q2-cb-actions">
          <p class="q2-feedback" data-cb-feedback role="status" aria-live="polite">Добавьте элементы и соедините их стрелками от A и B к Y. Нажимайте на A и B, чтобы проверить наборы.</p>
          <button type="button" class="q2-btn" data-cb-check>Проверить</button>
        </div>
      `;

      const canvas = panel.querySelector('[data-cb-canvas]');
      const svg = panel.querySelector('[data-cb-wires]');
      const feedback = panel.querySelector('[data-cb-feedback]');

      const drawWires = () => {
        const rect = canvas.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        svg.setAttribute('viewBox', `0 0 ${rect.width} ${rect.height}`);
        svg.querySelectorAll('path[data-wire]').forEach(p => p.remove());
        panel.querySelectorAll('.q2-cb-port').forEach(p => p.classList.remove('is-connected'));
        st.wires.forEach(wire => {
          const fromEl = canvas.querySelector(`[data-port-out="${wire.from}"]`);
          const toEl = canvas.querySelector(`[data-port-in="${wire.to}"]`);
          if (!fromEl || !toEl) return;
          fromEl.classList.add('is-connected');
          toEl.classList.add('is-connected');
          const a = portPos(rect, fromEl);
          const b = portPos(rect, toEl);
          const dx = Math.max(36, Math.abs(b.x - a.x) * 0.45);
          const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          path.setAttribute('data-wire', '1');
          path.setAttribute('class', 'q2-cb-wire');
          path.setAttribute('marker-end', 'url(#q2-cb-arrow)');
          path.setAttribute('d', `M ${a.x} ${a.y} C ${a.x + dx} ${a.y}, ${b.x - dx} ${b.y}, ${b.x} ${b.y}`);
          svg.appendChild(path);
        });
      };

      requestAnimationFrame(drawWires);

      panel.querySelector('[data-cb-toggle="a"]').addEventListener('click', e => {
        if (e.target.closest('button')) return;
        st.a = 1 - st.a;
        render(idx);
      });
      panel.querySelector('[data-cb-toggle="b"]').addEventListener('click', e => {
        if (e.target.closest('button')) return;
        st.b = 1 - st.b;
        render(idx);
      });

      panel.querySelectorAll('[data-cb-add]').forEach(btn => {
        btn.addEventListener('click', () => {
          const op = btn.dataset.cbAdd;
          const offset = (st.gates.length % 4) * 26;
          st.gates.push({ id: `g${st.nextId++}`, op, x: 160 + offset, y: 80 + offset });
          render(idx);
        });
      });

      panel.querySelector('[data-cb-clear]').addEventListener('click', () => {
        st.gates = [];
        st.wires = [];
        solved[idx] = false;
        render(idx);
      });

      panel.querySelectorAll('[data-cb-size]').forEach(btn => {
        btn.addEventListener('click', () => {
          st.zoom = Math.max(0.6, Math.min(1.5, Number((st.zoom + Number(btn.dataset.cbSize)).toFixed(2))));
          render(idx);
        });
      });

      panel.querySelectorAll('[data-cb-del]').forEach(btn => {
        btn.addEventListener('click', e => {
          e.stopPropagation();
          const gid = btn.dataset.cbDel;
          st.gates = st.gates.filter(g => g.id !== gid);
          st.wires = st.wires.filter(w => w.from !== gid && !w.to.startsWith(`${gid}:`));
          render(idx);
        });
      });

      panel.querySelectorAll('[data-port-out]').forEach(port => {
        port.addEventListener('pointerdown', e => {
          e.stopPropagation();
          const fromId = port.dataset.portOut;
          const rect = canvas.getBoundingClientRect();
          const start = portPos(rect, port);
          let moved = false;
          const preview = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          preview.setAttribute('class', 'q2-cb-wire');
          preview.setAttribute('stroke-dasharray', '5 4');
          svg.appendChild(preview);
          const onMove = ev => {
            moved = true;
            const mx = ev.clientX - rect.left;
            const my = ev.clientY - rect.top;
            const dx = Math.max(30, Math.abs(mx - start.x) * 0.45);
            preview.setAttribute('d', `M ${start.x} ${start.y} C ${start.x + dx} ${start.y}, ${mx - dx} ${my}, ${mx} ${my}`);
          };
          const onUp = ev => {
            window.removeEventListener('pointermove', onMove);
            window.removeEventListener('pointerup', onUp);
            preview.remove();
            if (!moved) return;
            const targetEl = document.elementFromPoint(ev.clientX, ev.clientY);
            const inPort = targetEl && targetEl.closest('[data-port-in]');
            if (inPort) {
              const target = inPort.dataset.portIn;
              if (fromId !== target.split(':')[0]) {
                st.wires = st.wires.filter(w => w.to !== target);
                st.wires.push({ from: fromId, to: target });
                pendingFrom = null;
                render(idx);
              }
            }
          };
          window.addEventListener('pointermove', onMove);
          window.addEventListener('pointerup', onUp);
        });
        port.addEventListener('click', e => {
          e.stopPropagation();
          const id = port.dataset.portOut;
          panel.querySelectorAll('[data-port-out]').forEach(p => p.classList.remove('is-active'));
          if (pendingFrom === id) { pendingFrom = null; return; }
          pendingFrom = id;
          port.classList.add('is-active');
          feedback.className = 'q2-feedback';
          feedback.textContent = 'Теперь нажмите на вход элемента или Y, чтобы провести стрелку.';
        });
      });

      panel.querySelectorAll('[data-port-in]').forEach(port => {
        port.addEventListener('click', e => {
          e.stopPropagation();
          const target = port.dataset.portIn;
          if (!pendingFrom) {
            const had = st.wires.some(w => w.to === target);
            if (had) {
              st.wires = st.wires.filter(w => w.to !== target);
              drawWires();
              feedback.className = 'q2-feedback';
              feedback.textContent = 'Связь удалена.';
            }
            return;
          }
          if (pendingFrom === target.split(':')[0]) return;
          st.wires = st.wires.filter(w => w.to !== target);
          st.wires.push({ from: pendingFrom, to: target });
          pendingFrom = null;
          panel.querySelectorAll('[data-port-out]').forEach(p => p.classList.remove('is-active'));
          drawWires();
          feedback.className = 'q2-feedback';
          feedback.textContent = 'Стрелка добавлена. Когда схема готова, нажмите «Проверить».';
        });
      });

      panel.querySelectorAll('[data-cb-gate]').forEach(node => {
        node.addEventListener('pointerdown', e => {
          if (e.target.closest('button')) return;
          const gid = node.dataset.cbGate;
          const gate = st.gates.find(g => g.id === gid);
          if (!gate) return;
          const startX = e.clientX - gate.x;
          const startY = e.clientY - gate.y;
          node.setPointerCapture(e.pointerId);
          const onMove = ev => {
            const rect = canvas.getBoundingClientRect();
            gate.x = Math.max(76, Math.min(rect.width - 150, ev.clientX - startX));
            gate.y = Math.max(12, Math.min(rect.height - 60, ev.clientY - startY));
            node.style.left = `${gate.x}px`;
            node.style.top = `${gate.y}px`;
            drawWires();
          };
          const onUp = () => {
            node.removeEventListener('pointermove', onMove);
            node.removeEventListener('pointerup', onUp);
          };
          node.addEventListener('pointermove', onMove);
          node.addEventListener('pointerup', onUp);
        });
      });

      panel.querySelector('[data-cb-check]').addEventListener('click', () => {
        const yWire = st.wires.find(w => w.to === 'Y:0');
        if (!yWire) {
          feedback.className = 'q2-feedback is-bad';
          feedback.textContent = 'Выход Y ещё не подключён. Проведите стрелку к Y.';
          return;
        }
        const evalSource = (src, A, B, visiting) => {
          if (src === 'A') return A;
          if (src === 'B') return B;
          if (visiting.has(src)) return null;
          const gate = st.gates.find(g => g.id === src);
          if (!gate) return null;
          visiting.add(src);
          const w0 = st.wires.find(w => w.to === `${src}:0`);
          if (!w0) return null;
          const v0 = evalSource(w0.from, A, B, new Set(visiting));
          if (v0 === null) return null;
          if (gate.op === 'not') return 1 - v0;
          const w1 = st.wires.find(w => w.to === `${src}:1`);
          if (!w1) return null;
          const v1 = evalSource(w1.from, A, B, new Set(visiting));
          if (v1 === null) return null;
          return gate.op === 'and' ? (v0 & v1) : (v0 | v1);
        };
        const rows = [[0, 0], [0, 1], [1, 0], [1, 1]];
        for (const [A, B] of rows) {
          const got = evalSource(yWire.from, A, B, new Set());
          if (got === null) {
            feedback.className = 'q2-feedback is-bad';
            feedback.textContent = 'Не все входы элементов подключены или в схеме есть петля.';
            return;
          }
          const expected = logicValue(tasks[idx], A, B, 0);
          if (got !== expected) {
            feedback.className = 'q2-feedback is-bad';
            feedback.textContent = `На наборе A=${A}, B=${B} схема даёт ${got}, а должно быть ${expected}.`;
            return;
          }
        }
        solved[idx] = true;
        tabs[idx].classList.add('is-done');
        feedback.className = 'q2-feedback is-good';
        feedback.textContent = 'Верно! Схема работает правильно на всех четырёх наборах.';
      });
    };

    tabs.forEach((tab, i) => tab.addEventListener('click', () => render(i)));
    render(0);
  };

  WIDGETS.circuitDemo = function (el, cfg) {
    if (cfg && cfg.mode === 'twoExamples') {
      let a1 = 0, b1 = 0, a2 = 0, b2 = 1;
      const renderTwo = () => {
        const or1 = a1 | b1, y1 = 1 - or1;
        const or2 = a2 | b2, notA2 = 1 - a2, y2 = or2 & notA2;
        const wc = act => act ? 'q2-hero-wire-anim' : '';
        const col = (act, c) => act ? c : '#cbd5e1';
        const box = 'user-select:none;-webkit-user-select:none;border-radius:16px;padding:12px 14px;background:var(--bg,#f4f5fc);box-shadow:inset 2px 3px 8px rgba(148,163,184,.35),inset -2px -2px 6px rgba(255,255,255,.85);';
        el.innerHTML = `<div style="display:grid;gap:14px;">
          <div style="${box}">
            <svg viewBox="0 0 560 124" role="img" aria-label="Пример 1" style="width:100%;height:auto;display:block;">
              <text x="280" y="18" text-anchor="middle" font-size="12.5" font-weight="800" fill="#334155">Пример 1: <tspan style="text-decoration:overline">A + B</tspan> — сначала ИЛИ, затем НЕ</text>
              <text x="52" y="34" text-anchor="middle" font-size="11" font-weight="800" fill="#475569">A</text>
              <g data-ex="a1" style="cursor:pointer;"><rect x="32" y="38" width="40" height="26" rx="7" fill="${a1 ? '#eef2ff' : '#fff'}" stroke="${a1 ? '#6366f1' : '#94a3b8'}" stroke-width="1.6"/><text x="52" y="55" text-anchor="middle" font-size="13" font-weight="800" fill="${a1 ? '#4338ca' : '#1e293b'}">${a1}</text></g>
              <text x="52" y="80" text-anchor="middle" font-size="11" font-weight="800" fill="#475569">B</text>
              <g data-ex="b1" style="cursor:pointer;"><rect x="32" y="84" width="40" height="26" rx="7" fill="${b1 ? '#eef2ff' : '#fff'}" stroke="${b1 ? '#6366f1' : '#94a3b8'}" stroke-width="1.6"/><text x="52" y="101" text-anchor="middle" font-size="13" font-weight="800" fill="${b1 ? '#4338ca' : '#1e293b'}">${b1}</text></g>
              <path d="M72 51 C110 51, 120 63, 162 63" fill="none" stroke="${col(a1, '#06b6d4')}" stroke-width="2.2" class="${wc(a1)}"/>
              <path d="M72 97 C110 97, 120 79, 162 79" fill="none" stroke="${col(b1, '#06b6d4')}" stroke-width="2.2" class="${wc(b1)}"/>
              <path d="M158 52 Q168 71 158 90 Q186 90 202 71 Q186 52 158 52 Z" fill="#ecfeff" stroke="#0891b2" stroke-width="2"/>
              <line x1="202" y1="71" x2="305" y2="71" stroke="${col(or1, '#f59e0b')}" stroke-width="2.2" class="${wc(or1)}"/>
              <polygon points="305,53 305,89 337,71" fill="#fffbeb" stroke="#d97706" stroke-width="2"/>
              <circle cx="342" cy="71" r="4.5" fill="#fffbeb" stroke="#d97706" stroke-width="2"/>
              <line x1="347" y1="71" x2="476" y2="71" stroke="${col(y1, '#10b981')}" stroke-width="2.4" class="${wc(y1)}"/>
              <text x="496" y="52" text-anchor="middle" font-size="11" font-weight="800" fill="#475569">Y</text>
              <rect x="476" y="58" width="40" height="26" rx="7" fill="${y1 ? '#ecfdf5' : '#fff'}" stroke="${y1 ? '#10b981' : '#94a3b8'}" stroke-width="1.6"/><text x="496" y="75" text-anchor="middle" font-size="13" font-weight="800" fill="${y1 ? '#047857' : '#1e293b'}">${y1}</text>
            </svg>
          </div>
          <div style="${box}">
            <svg viewBox="0 0 560 128" role="img" aria-label="Пример 2" style="width:100%;height:auto;display:block;">
              <text x="280" y="18" text-anchor="middle" font-size="12.5" font-weight="800" fill="#334155">Пример 2: (A + B)<tspan style="text-decoration:overline">A</tspan> — параллельно ИЛИ и НЕ, затем И</text>
              <text x="52" y="34" text-anchor="middle" font-size="11" font-weight="800" fill="#475569">A</text>
              <g data-ex="a2" style="cursor:pointer;"><rect x="32" y="38" width="40" height="26" rx="7" fill="${a2 ? '#eef2ff' : '#fff'}" stroke="${a2 ? '#6366f1' : '#94a3b8'}" stroke-width="1.6"/><text x="52" y="55" text-anchor="middle" font-size="13" font-weight="800" fill="${a2 ? '#4338ca' : '#1e293b'}">${a2}</text></g>
              <text x="52" y="82" text-anchor="middle" font-size="11" font-weight="800" fill="#475569">B</text>
              <g data-ex="b2" style="cursor:pointer;"><rect x="32" y="86" width="40" height="26" rx="7" fill="${b2 ? '#eef2ff' : '#fff'}" stroke="${b2 ? '#6366f1' : '#94a3b8'}" stroke-width="1.6"/><text x="52" y="103" text-anchor="middle" font-size="13" font-weight="800" fill="${b2 ? '#4338ca' : '#1e293b'}">${b2}</text></g>
              <path d="M72 51 C110 51, 120 45, 162 45" fill="none" stroke="${col(a2, '#06b6d4')}" stroke-width="2.2" class="${wc(a2)}"/>
              <path d="M72 99 C110 99, 120 61, 162 61" fill="none" stroke="${col(b2, '#06b6d4')}" stroke-width="2.2" class="${wc(b2)}"/>
              <path d="M72 51 C115 51, 120 96, 166 96" fill="none" stroke="${col(a2, '#f59e0b')}" stroke-width="2.2" class="${wc(a2)}"/>
              <path d="M158 34 Q168 53 158 72 Q186 72 202 53 Q186 34 158 34 Z" fill="#ecfeff" stroke="#0891b2" stroke-width="2"/>
              <polygon points="166,80 166,112 194,96" fill="#fffbeb" stroke="#d97706" stroke-width="2"/>
              <circle cx="199" cy="96" r="4.2" fill="#fffbeb" stroke="#d97706" stroke-width="2"/>
              <path d="M202 53 C260 53, 275 63, 314 63" fill="none" stroke="${col(or2, '#6366f1')}" stroke-width="2.2" class="${wc(or2)}"/>
              <path d="M204 96 C260 96, 275 79, 314 79" fill="none" stroke="${col(notA2, '#6366f1')}" stroke-width="2.2" class="${wc(notA2)}"/>
              <path d="M314 51 H338 A20 20 0 0 1 338 91 H314 Z" fill="#f5f3ff" stroke="#7c3aed" stroke-width="2"/>
              <line x1="358" y1="71" x2="476" y2="71" stroke="${col(y2, '#10b981')}" stroke-width="2.4" class="${wc(y2)}"/>
              <text x="496" y="52" text-anchor="middle" font-size="11" font-weight="800" fill="#475569">Y</text>
              <rect x="476" y="58" width="40" height="26" rx="7" fill="${y2 ? '#ecfdf5' : '#fff'}" stroke="${y2 ? '#10b981' : '#94a3b8'}" stroke-width="1.6"/><text x="496" y="75" text-anchor="middle" font-size="13" font-weight="800" fill="${y2 ? '#047857' : '#1e293b'}">${y2}</text>
            </svg>
          </div>
        </div>`;
        el.querySelector('[data-ex="a1"]').addEventListener('click', () => { a1 = 1 - a1; renderTwo(); });
        el.querySelector('[data-ex="b1"]').addEventListener('click', () => { b1 = 1 - b1; renderTwo(); });
        el.querySelector('[data-ex="a2"]').addEventListener('click', () => { a2 = 1 - a2; renderTwo(); });
        el.querySelector('[data-ex="b2"]').addEventListener('click', () => { b2 = 1 - b2; renderTwo(); });
      };
      renderTwo();
      return;
    }
    let a = 1;
    let b = 0;
    const render = () => {
      const notB = 1 - b;
      const y = a & notB;
      const wireCls = active => active ? 'q2-hero-wire-anim' : '';
      const wireCol = (active, onColor) => active ? onColor : '#cbd5e1';
      el.innerHTML = `<div style="user-select:none;-webkit-user-select:none;border-radius:16px;padding:12px 14px;background:var(--bg,#f4f5fc);box-shadow:inset 2px 3px 8px rgba(148,163,184,.35),inset -2px -2px 6px rgba(255,255,255,.85);">
        <svg viewBox="0 0 560 156" role="img" aria-label="Интерактивный пример схемы A и не B" style="width:100%;height:auto;display:block;">
          <text x="280" y="22" text-anchor="middle" font-size="13" font-weight="800" fill="#334155">Выражение: A<tspan style="text-decoration:overline">B</tspan> → сначала НЕ для B, затем И</text>
          <text x="56" y="44" text-anchor="middle" font-size="12" font-weight="800" fill="#475569">A</text>
          <g data-demo-toggle="a" style="cursor:pointer;">
            <rect x="34" y="50" width="44" height="30" rx="8" fill="${a ? '#eef2ff' : '#ffffff'}" stroke="${a ? '#6366f1' : '#94a3b8'}" stroke-width="1.8"/>
            <text x="56" y="70" text-anchor="middle" font-size="14" font-weight="800" fill="${a ? '#4338ca' : '#1e293b'}">${a}</text>
          </g>
          <text x="56" y="96" text-anchor="middle" font-size="12" font-weight="800" fill="#475569">B</text>
          <g data-demo-toggle="b" style="cursor:pointer;">
            <rect x="34" y="102" width="44" height="30" rx="8" fill="${b ? '#fffbeb' : '#ffffff'}" stroke="${b ? '#d97706' : '#94a3b8'}" stroke-width="1.8"/>
            <text x="56" y="122" text-anchor="middle" font-size="14" font-weight="800" fill="${b ? '#b45309' : '#1e293b'}">${b}</text>
          </g>
          <line x1="78" y1="65" x2="314" y2="65" stroke="${wireCol(a, '#6366f1')}" stroke-width="2.4" class="${wireCls(a)}"/>
          <line x1="78" y1="117" x2="162" y2="117" stroke="${wireCol(b, '#f59e0b')}" stroke-width="2.4" class="${wireCls(b)}"/>
          <polygon points="162,99 162,135 194,117" fill="#fffbeb" stroke="#d97706" stroke-width="2"/>
          <circle cx="199" cy="117" r="4.5" fill="#fffbeb" stroke="#d97706" stroke-width="2"/>
          <path d="M204 117 C250 117, 270 84, 314 84" fill="none" stroke="${wireCol(notB, '#6366f1')}" stroke-width="2.4" class="${wireCls(notB)}"/>
          <path d="M314 54 H338 A20 20 0 0 1 338 94 H314 Z" fill="#f5f3ff" stroke="#7c3aed" stroke-width="2"/>
          <line x1="358" y1="74" x2="470" y2="74" stroke="${wireCol(y, '#10b981')}" stroke-width="2.6" class="${wireCls(y)}"/>
          <text x="492" y="52" text-anchor="middle" font-size="12" font-weight="800" fill="#475569">Y</text>
          <rect x="470" y="59" width="44" height="30" rx="8" fill="${y ? '#ecfdf5' : '#ffffff'}" stroke="${y ? '#10b981' : '#94a3b8'}" stroke-width="1.8"/>
          <text x="492" y="79" text-anchor="middle" font-size="14" font-weight="800" fill="${y ? '#047857' : '#1e293b'}">${y}</text>
        </svg>
      </div>`;
      el.querySelector('[data-demo-toggle="a"]').addEventListener('click', () => { a = 1 - a; render(); });
      el.querySelector('[data-demo-toggle="b"]').addEventListener('click', () => { b = 1 - b; render(); });
    };
    render();
  };

  WIDGETS.expressionOrder = function (el, cfg) {
    const is3 = cfg && cfg.vars === 3;
    el.classList.add('q2-expression-order');
    el.innerHTML = `<div class="q2-expression-map">
        <span class="q2-formula-kicker">ЛОГИЧЕСКОЕ ВЫРАЖЕНИЕ</span>
        <div class="q2-expression-main">${is3 ? '(A ∧ B) <em>∨</em> (<span class="q2-overline">B</span> ∧ C)' : '<span class="q2-overline">A ∧ B</span> <em>∨</em> (A ∧ <span class="q2-overline">B</span>)'}</div>
      </div>
      ${is3 ? '' : `<div class="q2-order-card">
        <span class="q2-formula-kicker">ПОРЯДОК ДЕЙСТВИЙ</span>
        <div class="q2-order-scheme" aria-label="Схема порядка действий: скобки, НЕ, И, ИЛИ">
          <span>Скобки</span><i class="fas fa-arrow-right"></i><span>НЕ</span><i class="fas fa-arrow-right"></i><span>И</span><i class="fas fa-arrow-right"></i><span>ИЛИ</span>
        </div>
        <div class="q2-order-notes">
          <p><b>Скобки</b>Сначала вычислите выражение внутри.</p>
          <p><b>НЕ</b>Замените значение на противоположное: 0 ↔ 1.</p>
          <p><b>И</b>Получится 1, только если обе части равны 1.</p>
          <p><b>ИЛИ</b>Получится 1, если хотя бы одна часть равна 1.</p>
        </div>
      </div>`}
      <div class="q2-teaching-table" data-teaching-table></div>`;
    const leftAnd = logicBinary('and', 'A', 'B');
    const leftNot = logicNot(leftAnd);
    const rightNot = logicNot('B');
    const rightAnd = is3 ? logicBinary('and', rightNot, 'C') : logicBinary('and', 'A', rightNot);
    const result = is3 ? logicBinary('or', leftAnd, rightAnd) : logicBinary('or', leftNot, rightAnd);
    const columns = is3 ? [leftAnd, rightNot, rightAnd, result] : [leftAnd, leftNot, rightNot, rightAnd, result];
    const descriptions = is3
      ? ['Записываем все 8 наборов для A, B и C.', '1. И (A ∧ B): единица только при A = 1 и B = 1.', '2. НЕ (¬B): меняем значения столбца B на противоположные.', '3. И (¬B ∧ C): соединяем ¬B и C через И.', '4. ИЛИ: соединяем (A ∧ B) и (¬B ∧ C). Единица, если хотя бы одна часть равна 1.']
      : ['Записываем все наборы: 00, 01, 10, 11.', 'И: единица только при A = 1 и B = 1.', 'НЕ: меняем каждое значение предыдущего столбца на противоположное.', 'Отрицаем только B: 0 → 1, 1 → 0.', 'И: соединяем A и отрицание B.', 'ИЛИ: соединяем обе ветви. Единица, если хотя бы одна из них равна 1.'];
    const inputRows = is3
      ? [[0,0,0],[0,0,1],[0,1,0],[0,1,1],[1,0,0],[1,0,1],[1,1,0],[1,1,1]]
      : [[0,0],[0,1],[1,0],[1,1]];
    let step = 0;
    const table = el.querySelector('[data-teaching-table]');
    table.innerHTML = `<div class="q2-teaching-head"><h3>Как заполняется таблица</h3><span data-teaching-count></span></div><div class="q2-table-wrap"><table class="q2-table q2-teaching-grid"><thead><tr><th>A</th><th>B</th>${is3 ? '<th>C</th>' : ''}${columns.map((node, index) => `<th data-teaching-col="${index}"><small>${index + 1}</small><span role="math" aria-label="${attr(logicText(node))}">${index === columns.length - 1 ? 'Y' : logicHTML(node)}</span></th>`).join('')}</tr></thead><tbody>${inputRows.map(([A,B,C]) => `<tr><td>${A}</td><td>${B}</td>${is3 ? `<td>${C}</td>` : ''}${columns.map((node, index) => `<td data-teaching-col="${index}"><span data-teaching-value="${logicValue(node,A,B,C)}">—</span></td>`).join('')}</tr>`).join('')}</tbody></table></div><div class="q2-teaching-controls"><p data-teaching-explanation aria-live="polite"></p><div class="q2-truth-actions"><button type="button" class="q2-btn q2-btn-sm q2-btn-ghost" data-teaching-back>Назад</button><button type="button" class="q2-btn q2-btn-sm" data-teaching-next>Первое действие</button></div></div>`;
    const render = () => {
      table.querySelectorAll('[data-teaching-col]').forEach(cell => {
        const index = Number(cell.dataset.teachingCol);
        cell.classList.toggle('is-current', index === step - 1);
        const value = cell.querySelector('[data-teaching-value]');
        if (value) value.textContent = index < step ? value.dataset.teachingValue : '—';
      });
      table.querySelector('[data-teaching-count]').textContent = `${step} / 5 действий`;
      table.querySelector('[data-teaching-explanation]').textContent = descriptions[step];
      table.querySelector('[data-teaching-back]').disabled = step === 0;
      table.querySelector('[data-teaching-next]').textContent = step === 5 ? 'Повторить' : step === 0 ? 'Первое действие' : 'Следующее действие';
    };
    table.querySelector('[data-teaching-back]').addEventListener('click', () => { step = Math.max(0, step - 1); render(); });
    table.querySelector('[data-teaching-next]').addEventListener('click', () => { step = (step + 1) % 6; render(); });
    render();
  };

  /* ------------------------------- схемы --------------------------------- */
  function gateShape(op, x, y, id) {
    if (op === 'not') {
      return `<path class="q2-gate-shape" d="M ${x} ${y - 24} L ${x + 38} ${y} L ${x} ${y + 24} Z"></path>
        <circle class="q2-gate-bubble" cx="${x + 45}" cy="${y}" r="7"></circle>
        <text class="q2-gate-text" x="${x + 13}" y="${y + 4}">¬</text>`;
    }
    if (op === 'and') {
      return `<path class="q2-gate-shape" d="M ${x} ${y - 26} H ${x + 18} A 26 26 0 0 1 ${x + 18} ${y + 26} H ${x} Z"></path>
        <text class="q2-gate-text" x="${x + 12}" y="${y + 4}">∧</text>`;
    }
    if (op === 'or') {
      return `<path class="q2-gate-shape" d="M ${x} ${y - 26} Q ${x + 44} ${y} ${x} ${y + 26} Q ${x + 20} ${y} ${x} ${y - 26} Z"></path>
        <text class="q2-gate-text" x="${x + 15}" y="${y + 4}">∨</text>`;
    }
    if (op === 'xor') {
      return `<path class="q2-gate-shape" d="M ${x} ${y - 26} Q ${x + 44} ${y} ${x} ${y + 26} Q ${x + 20} ${y} ${x} ${y - 26} Z"></path>
        <path class="q2-gate-shape q2-gate-extra" d="M ${x - 8} ${y - 26} Q ${x + 34} ${y} ${x - 8} ${y + 26}" fill="none"></path>
        <text class="q2-gate-text" x="${x + 13}" y="${y + 4}">⊕</text>`;
    }
    return '';
  }

  function renderCircuit(container, spec) {
    if (!container) return;
    const inputs = spec.inputs || ['A', 'B'];
    const slots = spec.slots || [];
    const inputY = inputs.length === 3 ? [72, 150, 228] : [100, 200];
    const gateX = [214, 402];
    const gateY = 150;
    const width = 560;
    const height = 300;
    const lines = [];
    const labels = [];

    inputs.forEach((name, index) => {
      const y = inputY[index];
      labels.push(`<circle class="q2-node-dot" cx="64" cy="${y}" r="5"></circle>`);
      labels.push(`<text class="q2-signal-label" x="28" y="${y + 5}">${name}</text>`);
    });

    slots.forEach((slot, index) => {
      const x = gateX[index] || 214 + index * 188;
      const y = gateY;
      (slot.src || []).forEach((source, sourceIndex) => {
        const targetY = slot.op === 'not' ? y : (sourceIndex === 0 ? y - 12 : y + 12);
        if (inputs.includes(source)) {
          const sourceY = inputY[inputs.indexOf(source)];
          if (index === 0) {
            lines.push(`<line class="q2-circuit-wire" x1="64" y1="${sourceY}" x2="${x}" y2="${targetY}"></line>`);
          } else {
            lines.push(`<polyline class="q2-circuit-wire" points="64,${sourceY} ${x - 26},${sourceY} ${x - 26},${targetY} ${x},${targetY}"></polyline>`);
          }
        } else {
          const previous = Number(String(source).replace('S', '')) - 1;
          const sourceX = (gateX[previous] || 214) + 56;
          const sourceY = gateY;
          lines.push(`<polyline class="q2-circuit-wire" points="${sourceX},${sourceY} ${sourceX + 22},${sourceY} ${sourceX + 22},${targetY} ${x},${targetY}"></polyline>`);
          labels.push(`<text class="q2-signal-label" x="${sourceX + 8}" y="${sourceY - 10}">${source}</text>`);
        }
      });
      labels.push(gateShape(slot.op, x, y));
      if (index < slots.length - 1) labels.push(`<text class="q2-signal-label" x="${x + 64}" y="${y - 10}">S${index + 1}</text>`);
    });

    const lastX = (gateX[slots.length - 1] || 214) + (slots[slots.length - 1] && slots[slots.length - 1].op === 'not' ? 54 : 56);
    lines.push(`<line class="q2-circuit-wire" x1="${lastX}" y1="${gateY}" x2="${width - 34}" y2="${gateY}"></line>`);
    labels.push(`<text class="q2-signal-label" x="${width - 24}" y="${gateY + 5}">Y</text>`);
    container.innerHTML = `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Логическая схема">${lines.join('')}${labels.join('')}</svg>`;
  }

  WIDGETS.circuit = function (el, cfg) {
    const mode = cfg.mode || 'build';
    const tasks = cfg.tasks || [];
    let current = 0;

    el.classList.add('q2-circuit-lab');
    if (mode === 'build') {
      el.innerHTML = `<div class="q2-truth-tabs">${tasks.map((task, i) => `<button type="button" class="q2-tab${i === 0 ? ' is-active' : ''}" data-task="${i}">${task.label}</button>`).join('')}</div>
        <div class="q2-circuit-body">
          <div class="q2-circuit-stage" data-stage></div>
          <div class="q2-circuit-side">
            <div class="q2-circuit-controls" data-controls></div>
            <div class="q2-feedback" data-feedback aria-live="polite"></div>
            <div class="q2-truth-actions">
              <button type="button" class="q2-btn q2-btn-sm" data-check>Проверить схему</button>
              <button type="button" class="q2-btn q2-btn-sm q2-btn-ghost" data-reset>Сбросить</button>
            </div>
          </div>
        </div>`;
      const stage = el.querySelector('[data-stage]');
      const controls = el.querySelector('[data-controls]');
      const feedback = el.querySelector('[data-feedback]');

      function task() { return tasks[current]; }

      function renderControls() {
        const item = task();
        if (!item) return;
        controls.innerHTML = item.slots.map((slot, index) => `<label class="q2-select-row">Элемент ${index + 1}
          <select class="q2-select" data-slot="${index}">
            <option value="and">И</option><option value="or">ИЛИ</option><option value="not">НЕ</option><option value="xor">XOR</option>
          </select></label>`).join('');
        controls.querySelectorAll('[data-slot]').forEach(select => {
          select.value = item.slots[Number(select.dataset.slot)].op;
          select.addEventListener('change', renderPreview);
        });
        renderPreview();
        feedback.textContent = item.hint || 'Выберите элементы так, чтобы схема соответствовала выражению.';
        feedback.className = 'q2-feedback is-hint';
      }

      function renderPreview() {
        const item = task();
        if (!item) return;
        const selected = Array.from(controls.querySelectorAll('[data-slot]')).map(select => select.value);
        renderCircuit(stage, {
          inputs: item.inputs,
          slots: item.slots.map((slot, index) => ({ op: selected[index] || slot.op, src: slot.src }))
        });
      }

      el.querySelectorAll('[data-task]').forEach(tab => {
        tab.addEventListener('click', () => {
          current = Number(tab.dataset.task);
          el.querySelectorAll('[data-task]').forEach(node => node.classList.toggle('is-active', node === tab));
          renderControls();
        });
      });

      el.querySelector('[data-check]').addEventListener('click', () => {
        const item = task();
        const selected = Array.from(controls.querySelectorAll('[data-slot]')).map(select => select.value);
        const ok = item.slots.every((slot, index) => selected[index] === slot.op);
        controls.querySelectorAll('[data-slot]').forEach((select, index) => {
          select.classList.toggle('is-correct', select.value === item.slots[index].op);
          select.classList.toggle('is-wrong', select.value !== item.slots[index].op);
        });
        feedback.textContent = ok ? `Верно: схема для ${item.label} собрана. Проверьте её по входам.` : `Пока неверно. ${item.hint || 'Начните с действия в скобках.'}`;
        feedback.className = 'q2-feedback ' + (ok ? 'is-good' : 'is-bad');
      });
      el.querySelector('[data-reset]').addEventListener('click', renderControls);
      renderControls();
    } else {
      el.innerHTML = `<div class="q2-circuit-body">
          <div class="q2-circuit-stage" data-stage></div>
          <div class="q2-circuit-side">
            <h4 data-title></h4>
            <div class="q2-predict-options" data-options></div>
            <div class="q2-feedback" data-feedback aria-live="polite"></div>
            <div class="q2-truth-actions"><button type="button" class="q2-btn q2-btn-sm" data-next disabled>Следующая схема</button></div>
          </div>
        </div>`;
      const stage = el.querySelector('[data-stage]');
      const optionsNode = el.querySelector('[data-options]');
      const feedback = el.querySelector('[data-feedback]');
      const title = el.querySelector('[data-title]');
      const next = el.querySelector('[data-next]');

      function render() {
        const item = tasks[current];
        if (!item) return;
        title.textContent = `${item.title || 'Схема'} — выберите выражение`;
        renderCircuit(stage, item);
        feedback.textContent = 'Читайте слева направо: входы → первый элемент → второй элемент → выход.';
        feedback.className = 'q2-feedback is-hint';
        next.disabled = true;
        next.textContent = current === tasks.length - 1 ? 'Начать сначала' : 'Следующая схема';
        optionsNode.innerHTML = '';
        (item.options || []).forEach((option, index) => {
          const button = document.createElement('button');
          button.type = 'button';
          button.className = 'q2-option q2-option-code';
          button.innerHTML = `<span class="q2-option-letter">${String.fromCharCode(65 + index)}</span><span>${option}</span>`;
          button.addEventListener('click', () => {
            const correct = index === item.answer;
            optionsNode.querySelectorAll('.q2-option').forEach((node, i) => {
              node.disabled = true;
              if (i === item.answer) node.classList.add('is-correct');
              else if (i === index) node.classList.add('is-wrong');
            });
            feedback.textContent = correct ? `Верно. ${item.explain || ''}` : `Неверно. ${item.explain || ''}`;
            feedback.className = 'q2-feedback ' + (correct ? 'is-good' : 'is-bad');
            next.disabled = false;
          });
          optionsNode.appendChild(button);
        });
      }

      next.addEventListener('click', () => {
        current = (current + 1) % tasks.length;
        render();
      });
      render();
    }
  };

  /* ============================== РЕКУРСИЯ =============================== */

  const RECIPES = {
    countdown: {
      title: 'Обратный отсчёт',
      code: ['def countdown(n):', '    if n == 0:', '        print("Старт!")', '        return', '    print(n)', '    countdown(n - 1)'],
      build(n) {
        const frames = [];
        const stack = [];
        const rec = k => {
          stack.push({ label: `countdown(${k})`, state: 'wait' });
          frames.push({ stack: stack.map(x => ({ ...x })), note: `Вызов countdown(${k})`, line: 0, phase: 'call' });
          if (k === 0) {
            frames.push({ stack: stack.map(x => ({ ...x })), note: 'База: n == 0, печатаем «Старт!» и выходим.', line: 2, phase: 'base' });
            stack.pop();
            frames.push({ stack: stack.map(x => ({ ...x })), note: 'Возврат из countdown(0).', line: 3, phase: 'return' });
            return;
          }
          frames.push({ stack: stack.map(x => ({ ...x })), note: `Печатаем ${k}, затем вызываем countdown(${k - 1}).`, line: 4, phase: 'step' });
          rec(k - 1);
          stack.pop();
          frames.push({ stack: stack.map(x => ({ ...x })), note: `Возврат из countdown(${k}).`, line: 5, phase: 'return' });
        };
        rec(n);
        return frames;
      }
    },
    sum: {
      title: 'Сумма 1…n',
      code: ['def S(n):', '    if n == 0:', '        return 0', '    return n + S(n - 1)'],
      build(n) {
        const frames = [];
        const stack = [];
        const rec = k => {
          stack.push({ label: `S(${k})`, state: 'wait' });
          frames.push({ stack: stack.map(x => ({ ...x })), note: `Вызов S(${k})`, line: 0, phase: 'call' });
          if (k === 0) {
            frames.push({ stack: stack.map(x => ({ ...x })), note: 'База: S(0) = 0.', line: 2, phase: 'base' });
            stack.pop();
            frames.push({ stack: stack.map(x => ({ ...x })), done: { label: 'S(0)', value: 0 }, note: 'Возвращаем 0.', line: 2, phase: 'return' });
            return 0;
          }
          const sub = rec(k - 1);
          const value = k + sub;
          stack.pop();
          frames.push({ stack: stack.map(x => ({ ...x })), done: { label: `S(${k})`, value }, note: `Возврат: S(${k}) = ${k} + ${sub} = ${value}.`, line: 3, phase: 'return' });
          return value;
        };
        rec(n);
        return frames;
      }
    },
    fact: {
      title: 'Факториал n!',
      code: ['def factorial(n):', '    if n == 0:', '        return 1', '    return n * factorial(n - 1)'],
      build(n) {
        const frames = [];
        const stack = [];
        const rec = k => {
          stack.push({ label: `factorial(${k})`, state: 'wait' });
          frames.push({ stack: stack.map(x => ({ ...x })), note: `Вызов factorial(${k})`, line: 0, phase: 'call' });
          if (k === 0) {
            frames.push({ stack: stack.map(x => ({ ...x })), note: 'База: 0! = 1.', line: 2, phase: 'base' });
            stack.pop();
            frames.push({ stack: stack.map(x => ({ ...x })), done: { label: 'factorial(0)', value: 1 }, note: 'Возвращаем 1.', line: 2, phase: 'return' });
            return 1;
          }
          const sub = rec(k - 1);
          const value = k * sub;
          stack.pop();
          frames.push({ stack: stack.map(x => ({ ...x })), done: { label: `factorial(${k})`, value }, note: `Возврат: ${k}! = ${k} × ${sub} = ${value}.`, line: 3, phase: 'return' });
          return value;
        };
        rec(n);
        return frames;
      }
    },
    digits: {
      title: 'Сумма цифр',
      code: ['def digit_sum(n):', '    if n == 0:', '        return 0', '    return n % 10 + digit_sum(n // 10)'],
      build(n) {
        const frames = [];
        const stack = [];
        const rec = k => {
          stack.push({ label: `digit_sum(${k})`, state: 'wait' });
          frames.push({ stack: stack.map(x => ({ ...x })), note: `Вызов digit_sum(${k})`, line: 0, phase: 'call' });
          if (k === 0) {
            frames.push({ stack: stack.map(x => ({ ...x })), note: 'База: в числе не осталось цифр, возвращаем 0.', line: 2, phase: 'base' });
            stack.pop();
            frames.push({ stack: stack.map(x => ({ ...x })), done: { label: 'digit_sum(0)', value: 0 }, note: 'Возвращаем 0.', line: 2, phase: 'return' });
            return 0;
          }
          const digit = k % 10;
          const rest = Math.floor(k / 10);
          frames.push({ stack: stack.map(x => ({ ...x })), note: `Последняя цифра: ${k} % 10 = ${digit}; остаток: ${k} // 10 = ${rest}.`, line: 3, phase: 'step' });
          const sub = rec(rest);
          const value = digit + sub;
          stack.pop();
          frames.push({ stack: stack.map(x => ({ ...x })), done: { label: `digit_sum(${k})`, value }, note: `Возврат: ${digit} + ${sub} = ${value}.`, line: 3, phase: 'return' });
          return value;
        };
        rec(n);
        return frames;
      }
    },
    reverse: {
      title: 'Разворот строки',
      code: ["def reverse(s):", "    if s == '':", "        return ''", "    return reverse(s[1:]) + s[0]"],
      build(text) {
        const frames = [];
        const stack = [];
        const rec = s => {
          stack.push({ label: `reverse("${s}")`, state: 'wait' });
          frames.push({ stack: stack.map(x => ({ ...x })), note: `Вызов reverse("${s}")`, line: 0, phase: 'call' });
          if (s === '') {
            frames.push({ stack: stack.map(x => ({ ...x })), note: 'База: пустая строка. Возвращаем пустую строку.', line: 2, phase: 'base' });
            stack.pop();
            frames.push({ stack: stack.map(x => ({ ...x })), done: { label: 'reverse("")', value: '""' }, note: 'Возвращаем "".', line: 2, phase: 'return' });
            return '';
          }
          frames.push({ stack: stack.map(x => ({ ...x })), note: `Первый символ "${s[0]}", остаток "${s.slice(1)}".`, line: 3, phase: 'step' });
          const sub = rec(s.slice(1));
          const value = sub + s[0];
          stack.pop();
          frames.push({ stack: stack.map(x => ({ ...x })), done: { label: `reverse("${s}")`, value: `"${value}"` }, note: `Возврат: "${sub}" + "${s[0]}" = "${value}".`, line: 3, phase: 'return' });
          return value;
        };
        rec(text);
        return frames;
      }
    },
    count: {
      title: 'Количество цифр',
      code: ['def count(n):', '    if n < 10:', '        return 1', '    return 1 + count(n // 10)'],
      build(n) {
        const frames = [];
        const stack = [];
        const rec = k => {
          stack.push({ label: `count(${k})`, state: 'wait' });
          frames.push({ stack: stack.map(x => ({ ...x })), note: `Вызов count(${k})`, line: 0, phase: 'call' });
          if (k < 10) {
            frames.push({ stack: stack.map(x => ({ ...x })), note: 'База: число меньше 10 — в нём одна цифра.', line: 2, phase: 'base' });
            stack.pop();
            frames.push({ stack: stack.map(x => ({ ...x })), done: { label: `count(${k})`, value: 1 }, note: 'Возвращаем 1.', line: 2, phase: 'return' });
            return 1;
          }
          frames.push({ stack: stack.map(x => ({ ...x })), note: `Отбрасываем последнюю цифру: ${k} // 10 = ${Math.floor(k / 10)}.`, line: 3, phase: 'step' });
          const sub = rec(Math.floor(k / 10));
          const value = 1 + sub;
          stack.pop();
          frames.push({ stack: stack.map(x => ({ ...x })), done: { label: `count(${k})`, value }, note: `Возврат: 1 + ${sub} = ${value}.`, line: 3, phase: 'return' });
          return value;
        };
        rec(n);
        return frames;
      }
    }
  };

  WIDGETS.recursion = function (el, cfg) {
    const fn = cfg.fn || 'sum';
    const recipe = RECIPES[fn] || RECIPES.sum;
    const isString = fn === 'reverse';
    const bigNumber = fn === 'digits' || fn === 'count';
    const maxValue = bigNumber ? 999999 : 7;
    let inputValue = isString ? (cfg.text || 'кот') : (cfg.n == null ? 3 : cfg.n);
    let frames = [];
    let index = 0;
    let timer = null;

    el.classList.add('q2-rec-lab');
    el.innerHTML = `<div class="q2-rec-controls">
        <label class="q2-select-row">${isString ? 'Строка' : 'Значение n'}
          <input class="q2-input q2-input-sm" type="${isString ? 'text' : 'number'}" value="${attr(inputValue)}" ${isString ? '' : `min="0" max="${maxValue}"`}>
        </label>
        <button type="button" class="q2-btn q2-btn-sm" data-apply>Построить</button>
        <div class="q2-rec-nav">
          <button type="button" class="q2-btn q2-btn-sm q2-btn-ghost" data-prev>Назад</button>
          <button type="button" class="q2-btn q2-btn-sm" data-next>Шаг</button>
          <button type="button" class="q2-btn q2-btn-sm q2-btn-ghost" data-play>Авто</button>
          <button type="button" class="q2-btn q2-btn-sm q2-btn-ghost" data-reset>Сброс</button>
        </div>
        <span class="q2-rec-counter"></span>
      </div>
      <div class="q2-rec-grid">
        <div class="q2-stack-panel">
          <div class="q2-stack-title">Стек вызовов <span>верх сверху</span></div>
          <div class="q2-stack" data-stack></div>
          <div class="q2-stack-floor">дно стека</div>
        </div>
        <div class="q2-rec-side">
          <div class="q2-rec-note" data-note></div>
          <div class="q2-rec-result" data-result></div>
          ${codeBlock({ code: recipe.code.join('\n'), title: recipe.title, compact: true })}
        </div>
      </div>`;

    const input = el.querySelector('.q2-input');
    const stackNode = el.querySelector('[data-stack]');
    const note = el.querySelector('[data-note]');
    const result = el.querySelector('[data-result]');
    const counter = el.querySelector('.q2-rec-counter');
    const prev = el.querySelector('[data-prev]');
    const next = el.querySelector('[data-next]');
    const play = el.querySelector('[data-play]');

    function stop() {
      if (timer) { clearInterval(timer); timer = null; }
      play.textContent = 'Авто';
      play.classList.remove('is-active');
    }

    function build() {
      stop();
      if (isString) {
        const text = String(input.value || '').slice(0, 7);
        inputValue = text;
        frames = recipe.build(text);
      } else {
        const value = clamp(Number(input.value) || 0, 0, maxValue);
        inputValue = value;
        input.value = String(value);
        frames = recipe.build(value);
      }
      index = 0;
      render();
    }

    function render() {
      const frame = frames[index];
      if (!frame) return;
      counter.textContent = `Шаг ${index + 1} / ${frames.length}`;
      stackNode.innerHTML = frame.stack.length
        ? frame.stack.slice().reverse().map((item, i) => `<div class="q2-stack-item${i === 0 ? ' is-top' : ''}${item.state === 'done' ? ' is-done' : ''}"><span>${item.label}</span><small>${i === 0 ? 'выполняется' : 'ждёт возврата'}</small></div>`).join('')
        : '<div class="q2-stack-empty">Стек пуст — все вызовы завершены.</div>';
      note.textContent = frame.note;
      note.className = 'q2-rec-note is-' + (frame.phase || 'call');
      if (frame.done) {
        result.innerHTML = `<span class="q2-rec-result-label">${frame.done.label}</span><b>${frame.done.value}</b>`;
        result.classList.add('is-visible');
      } else {
        result.innerHTML = '';
        result.classList.remove('is-visible');
      }
      el.querySelectorAll('.q2-code-line').forEach(line => {
        line.classList.toggle('is-active', Number(line.dataset.line) === frame.line);
      });
      prev.disabled = index === 0;
      next.disabled = index === frames.length - 1;
    }

    el.querySelector('[data-apply]').addEventListener('click', build);
    input.addEventListener('keydown', event => { if (event.key === 'Enter') build(); });
    prev.addEventListener('click', () => { stop(); index = Math.max(0, index - 1); render(); });
    next.addEventListener('click', () => { stop(); index = Math.min(frames.length - 1, index + 1); render(); });
    el.querySelector('[data-reset]').addEventListener('click', () => { stop(); index = 0; render(); });
    play.addEventListener('click', () => {
      if (timer) { stop(); return; }
      play.textContent = 'Пауза';
      play.classList.add('is-active');
      timer = setInterval(() => {
        if (index >= frames.length - 1) { stop(); return; }
        index += 1;
        render();
      }, 1000);
    });
    build();
  };

  /* ============================== СОРТИРОВКИ ============================= */

  const SORT_CODE = {
    bubble: ['for i in range(n - 1):', '    for j in range(n - 1 - i):', '        # сравниваем соседей', '        if a[j] > a[j + 1]:', '            a[j], a[j + 1] = a[j + 1], a[j]', '# список упорядочен'],
    selection: ['for i in range(n - 1):', '    min_i = i', '    for j in range(i + 1, n):', '        if a[j] < a[min_i]:', '            min_i = j', '    a[i], a[min_i] = a[min_i], a[i]'],
    insertion: ['for i in range(1, n):', '    key = a[i]', '    j = i - 1', '    while j >= 0 and a[j] > key:', '        a[j + 1] = a[j]', '        j -= 1', '    a[j + 1] = key']
  };

  function sortFrames(algo, source) {
    const a = source.slice();
    const n = a.length;
    const frames = [{ arr: a.slice(), note: 'Исходный список', line: 0, comparisons: 0, moves: 0, sorted: [] }];
    let comparisons = 0;
    let moves = 0;
    const sortedRange = (from, to) => Array.from({ length: Math.max(0, to - from) }, (_, i) => from + i);

    if (algo === 'bubble') {
      for (let i = 0; i < n - 1; i += 1) {
        for (let j = 0; j < n - 1 - i; j += 1) {
          comparisons += 1;
          frames.push({ arr: a.slice(), compare: [j, j + 1], note: `Сравниваем ${a[j]} и ${a[j + 1]}`, line: 3, comparisons, moves, sorted: sortedRange(n - i, n) });
          if (a[j] > a[j + 1]) {
            [a[j], a[j + 1]] = [a[j + 1], a[j]];
            moves += 1;
            frames.push({ arr: a.slice(), swap: [j, j + 1], note: `${a[j + 1]} > ${a[j]}? Меняем местами.`, line: 4, comparisons, moves, sorted: sortedRange(n - i, n) });
          }
        }
        frames.push({ arr: a.slice(), note: `Проход ${i + 1}: справа закреплён максимум.`, line: 1, comparisons, moves, sorted: sortedRange(n - i - 1, n) });
      }
    } else if (algo === 'selection') {
      for (let i = 0; i < n - 1; i += 1) {
        let min = i;
        frames.push({ arr: a.slice(), compare: [i, min], note: `Ищем минимум в необработанной части, начиная с ${a[i]}.`, line: 2, comparisons, moves, sorted: sortedRange(0, i) });
        for (let j = i + 1; j < n; j += 1) {
          comparisons += 1;
          frames.push({ arr: a.slice(), compare: [min, j], note: `Сравниваем минимум ${a[min]} и ${a[j]}`, line: 3, comparisons, moves, sorted: sortedRange(0, i) });
          if (a[j] < a[min]) {
            min = j;
            frames.push({ arr: a.slice(), compare: [i, min], note: `Новый минимум: ${a[min]}`, line: 4, comparisons, moves, sorted: sortedRange(0, i) });
          }
        }
        if (min !== i) {
          [a[i], a[min]] = [a[min], a[i]];
          moves += 1;
          frames.push({ arr: a.slice(), swap: [i, min], note: `Ставим минимум ${a[i]} на позицию ${i}.`, line: 5, comparisons, moves, sorted: sortedRange(0, i + 1) });
        } else {
          frames.push({ arr: a.slice(), note: `${a[i]} уже на своём месте.`, line: 5, comparisons, moves, sorted: sortedRange(0, i + 1) });
        }
      }
    } else {
      for (let i = 1; i < n; i += 1) {
        const key = a[i];
        let j = i - 1;
        frames.push({ arr: a.slice(), compare: [i, i], note: `Берём ${key} и ищем для него место в левой части.`, line: 1, comparisons, moves, sorted: sortedRange(0, i) });
        while (j >= 0 && a[j] > key) {
          comparisons += 1;
          frames.push({ arr: a.slice(), compare: [j, j + 1], note: `${a[j]} > ${key}: сдвигаем ${a[j]} вправо.`, line: 4, comparisons, moves, sorted: sortedRange(0, i) });
          a[j + 1] = a[j];
          moves += 1;
          j -= 1;
          frames.push({ arr: a.slice(), swap: [j + 1, j + 2 <= n - 1 ? j + 2 : j + 1], note: 'Сдвиг выполнен.', line: 5, comparisons, moves, sorted: sortedRange(0, i) });
        }
        if (j >= 0) comparisons += 1;
        a[j + 1] = key;
        frames.push({ arr: a.slice(), swap: [j + 1, j + 1], note: `Вставляем ${key} на позицию ${j + 1}.`, line: 6, comparisons, moves, sorted: sortedRange(0, i + 1) });
      }
    }
    frames.push({ arr: a.slice(), note: 'Готово: список упорядочен по возрастанию.', line: (SORT_CODE[algo] || []).length - 1, comparisons, moves, sorted: sortedRange(0, n), done: true });
    return frames;
  }

  WIDGETS.sort = function (el, cfg) {
    let algo = cfg.algo || 'bubble';
    let source = (cfg.array || [5, 1, 4, 2]).slice();
    let frames = [];
    let index = 0;
    let timer = null;
    const codeMap = cfg.code || SORT_CODE;
    const labels = cfg.labels || { bubble: 'Пузырьковая', selection: 'Выбором', insertion: 'Вставками' };
    const algos = cfg.algos || (cfg.algo ? [cfg.algo] : ['bubble']);

    el.classList.add('q2-sort-lab');
    el.innerHTML = `<div class="q2-sort-top">
        ${algos.length > 1 ? `<div class="q2-truth-tabs">${algos.map(key => `<button type="button" class="q2-tab${key === algo ? ' is-active' : ''}" data-algo="${key}">${labels[key] || key}</button>`).join('')}</div>` : ''}
        <div class="q2-sort-input">
          <input class="q2-input q2-input-sm" type="text" value="${attr(source.join(', '))}" aria-label="Список чисел">
          <button type="button" class="q2-btn q2-btn-sm" data-apply>Применить</button>
          <button type="button" class="q2-btn q2-btn-sm q2-btn-ghost" data-shuffle>Перемешать</button>
        </div>
      </div>
      <div class="q2-sort-grid">
        <div class="q2-sort-stage">
          <div class="q2-bars" data-bars></div>
          <div class="q2-sort-note" data-note></div>
          <div class="q2-sort-stats">
            <span>Сравнений: <b data-comparisons>0</b></span>
            <span>${algo === 'insertion' ? 'Сдвигов' : 'Обменов'}: <b data-moves>0</b></span>
            <span>Шаг: <b data-step>1</b> / <b data-total>1</b></span>
          </div>
          <div class="q2-sort-nav">
            <button type="button" class="q2-btn q2-btn-sm q2-btn-ghost" data-prev>Назад</button>
            <button type="button" class="q2-btn q2-btn-sm" data-next>Шаг</button>
            <button type="button" class="q2-btn q2-btn-sm q2-btn-ghost" data-play>Авто</button>
            <button type="button" class="q2-btn q2-btn-sm q2-btn-ghost" data-reset>Сброс</button>
          </div>
        </div>
        <div class="q2-sort-code">${codeBlock({ code: (codeMap[algo] || SORT_CODE[algo]).join('\n'), title: labels[algo], compact: false })}</div>
      </div>`;

    const bars = el.querySelector('[data-bars]');
    const note = el.querySelector('[data-note]');
    const comparisonsNode = el.querySelector('[data-comparisons]');
    const movesNode = el.querySelector('[data-moves]');
    const stepNode = el.querySelector('[data-step]');
    const totalNode = el.querySelector('[data-total]');
    const prev = el.querySelector('[data-prev]');
    const next = el.querySelector('[data-next]');
    const play = el.querySelector('[data-play]');
    const input = el.querySelector('.q2-input');

    function stop() {
      if (timer) { clearInterval(timer); timer = null; }
      play.textContent = 'Авто';
      play.classList.remove('is-active');
    }

    function build() {
      stop();
      frames = sortFrames(algo, source);
      index = 0;
      render();
    }

    function render() {
      const frame = frames[index];
      if (!frame) return;
      const max = Math.max(...frame.arr, 1);
      bars.innerHTML = frame.arr.map((value, i) => {
        const classes = ['q2-bar'];
        if (frame.compare && frame.compare.includes(i)) classes.push('is-compare');
        if (frame.swap && frame.swap.includes(i)) classes.push('is-swap');
        if ((frame.sorted || []).includes(i)) classes.push('is-sorted');
        return `<div class="${classes.join(' ')}" style="height:${Math.max(18, Math.round(value / max * 100))}%"><span>${value}</span></div>`;
      }).join('');
      note.textContent = frame.note;
      comparisonsNode.textContent = String(frame.comparisons);
      movesNode.textContent = String(frame.moves);
      stepNode.textContent = String(index + 1);
      totalNode.textContent = String(frames.length);
      el.querySelectorAll('.q2-code-line').forEach(line => {
        line.classList.toggle('is-active', Number(line.dataset.line) === frame.line);
      });
      prev.disabled = index === 0;
      next.disabled = index === frames.length - 1;
    }

    el.querySelectorAll('[data-algo]').forEach(tab => {
      tab.addEventListener('click', () => {
        algo = tab.dataset.algo;
        el.querySelectorAll('[data-algo]').forEach(node => node.classList.toggle('is-active', node === tab));
        el.querySelector('.q2-sort-code').innerHTML = codeBlock({ code: (codeMap[algo] || SORT_CODE[algo]).join('\n'), title: labels[algo], compact: true });
        build();
      });
    });

    el.querySelector('[data-apply]').addEventListener('click', () => {
      const parsed = input.value.split(/[,\s;]+/).map(Number).filter(value => Number.isFinite(value) && value >= 0 && value <= 99).slice(0, 9);
      if (parsed.length >= 2) {
        source = parsed;
        build();
      } else {
        note.textContent = 'Введите хотя бы два числа от 0 до 99, разделяя их запятой или пробелом.';
      }
    });
    el.querySelector('[data-shuffle]').addEventListener('click', () => {
      source = source.map(value => ({ value, r: Math.random() })).sort((a, b) => a.r - b.r).map(item => item.value);
      input.value = source.join(', ');
      build();
    });
    prev.addEventListener('click', () => { stop(); index = Math.max(0, index - 1); render(); });
    next.addEventListener('click', () => { stop(); index = Math.min(frames.length - 1, index + 1); render(); });
    el.querySelector('[data-reset]').addEventListener('click', () => { stop(); index = 0; render(); });
    play.addEventListener('click', () => {
      if (timer) { stop(); return; }
      play.textContent = 'Пауза';
      play.classList.add('is-active');
      timer = setInterval(() => {
        if (index >= frames.length - 1) { stop(); return; }
        index += 1;
        render();
      }, 900);
    });
    build();
  };

  /* ================================ ГРАФЫ ================================ */

  function graphData(cfg) {
    const nodes = cfg.nodes || [];
    const edges = cfg.edges || [];
    const directed = Boolean(cfg.directed);
    const weighted = Boolean(cfg.weighted);
    const adj = {};
    nodes.forEach(node => { adj[node.id] = []; });
    edges.forEach(([u, v, w]) => {
      if (!adj[u] || !adj[v]) return;
      adj[u].push({ v, w: w == null ? 1 : w });
      if (!directed) adj[v].push({ v: u, w: w == null ? 1 : w });
    });
    Object.keys(adj).forEach(key => adj[key].sort((a, b) => String(a.v).localeCompare(String(b.v))));
    return { nodes, edges, directed, weighted, adj };
  }

  function bfsFrames(cfg) {
    const { nodes, adj, directed } = graphData(cfg);
    const start = cfg.start || (nodes[0] && nodes[0].id);
    const goal = cfg.goal;
    const frames = [];
    const seen = { [start]: true };
    const dist = { [start]: 0 };
    const parent = {};
    const queue = [start];
    const visited = [];
    frames.push({ queue: [...queue], visited: [], current: null, dist: { ...dist }, parent: { ...parent }, note: `Кладём стартовую вершину ${start} в очередь.`, line: 1 });
    while (queue.length) {
      const u = queue.shift();
      visited.push(u);
      frames.push({ queue: [...queue], visited: [...visited], current: u, dist: { ...dist }, parent: { ...parent }, note: `Достаём ${u} из очереди и отмечаем посещённой.`, line: 2 });
      adj[u].forEach(({ v }) => {
        if (!seen[v]) {
          seen[v] = true;
          dist[v] = dist[u] + 1;
          parent[v] = u;
          queue.push(v);
          frames.push({ queue: [...queue], visited: [...visited], current: u, edge: [u, v], dist: { ...dist }, parent: { ...parent }, note: `Нашли ${v}: расстояние ${dist[v]}, родитель ${u}.`, line: 4 });
        }
      });
    }
    const path = [];
    if (goal && seen[goal]) {
      let node = goal;
      while (node != null) {
        path.unshift(node);
        node = parent[node];
      }
    }
    frames.push({ queue: [], visited: [...visited], current: null, dist: { ...dist }, parent: { ...parent }, path, done: true, note: path.length ? `Кратчайший путь ${path.join(' → ')}: ${dist[goal]} рёбер.` : 'Обход завершён: все достижимые вершины посещены.', line: 5 });
    return frames;
  }

  function dfsFrames(cfg) {
    const { nodes, adj } = graphData(cfg);
    const start = cfg.start || (nodes[0] && nodes[0].id);
    const goal = cfg.goal;
    const frames = [];
    const seen = { [start]: true };
    const visited = [];
    const parent = {};
    const stack = [];
    frames.push({ stack: [], visited: [], current: null, parent: { ...parent }, note: `Начинаем DFS со стартовой вершины ${start}.`, line: 1 });
    const dfs = u => {
      seen[u] = true;
      visited.push(u);
      stack.push(u);
      frames.push({ stack: [...stack], visited: [...visited], current: u, parent: { ...parent }, note: `Заходим в ${u} и идём вглубь по первой ветви.`, line: 2 });
      adj[u].forEach(({ v }) => {
        if (!seen[v]) {
          parent[v] = u;
          dfs(v);
        }
      });
      stack.pop();
      frames.push({ stack: [...stack], visited: [...visited], current: u, parent: { ...parent }, note: `Возвращаемся из ${u} к развилке.`, line: 3 });
    };
    dfs(start);
    const path = [];
    if (goal && seen[goal]) {
      let node = goal;
      while (node != null) {
        path.unshift(node);
        node = parent[node];
      }
    }
    frames.push({ stack: [], visited: [...visited], current: null, parent: { ...parent }, path, done: true, note: path.length ? `DFS нашёл путь ${path.join(' → ')}, но он не обязательно кратчайший.` : 'DFS завершён: все достижимые вершины посещены.', line: 4 });
    return frames;
  }

  function renderGraph(container, cfg, frame, mode) {
    const { nodes, edges, directed, weighted } = graphData(cfg);
    const visited = new Set(frame.visited || []);
    const frontier = new Set(mode === 'bfs' ? (frame.queue || []) : (frame.stack || []));
    const active = new Set();
    if (frame.edge) {
      active.add(`${frame.edge[0]}-${frame.edge[1]}`);
      if (!directed) active.add(`${frame.edge[1]}-${frame.edge[0]}`);
    }
    if (frame.path && frame.path.length > 1) {
      for (let i = 0; i < frame.path.length - 1; i += 1) {
        active.add(`${frame.path[i]}-${frame.path[i + 1]}`);
        if (!directed) active.add(`${frame.path[i + 1]}-${frame.path[i]}`);
      }
    }
    const nodeMap = {};
    nodes.forEach(node => { nodeMap[node.id] = node; });
    const edgeSvg = edges.map(([u, v, w]) => {
      const from = nodeMap[u];
      const to = nodeMap[v];
      if (!from || !to) return '';
      const key = `${u}-${v}`;
      const reverse = `${v}-${u}`;
      const isActive = active.has(key) || (!directed && active.has(reverse));
      const mx = (from.x + to.x) / 2;
      const my = (from.y + to.y) / 2;
      return `<g class="q2-graph-edge${isActive ? ' is-active' : ''}">
        <line x1="${from.x}" y1="${from.y}" x2="${to.x}" y2="${to.y}" ${directed ? 'marker-end="url(#q2-arrow)"' : ''}></line>
        ${weighted ? `<rect class="q2-weight-bg" x="${mx - 13}" y="${my - 12}" width="26" height="20" rx="8"></rect><text class="q2-weight" x="${mx}" y="${my + 3}">${w == null ? 1 : w}</text>` : ''}
      </g>`;
    }).join('');
    const nodeSvg = nodes.map(node => {
      const classes = ['q2-graph-node'];
      if (node.id === frame.current) classes.push('is-current');
      if (visited.has(node.id)) classes.push('is-visited');
      if (frontier.has(node.id)) classes.push('is-frontier');
      if (node.id === cfg.start) classes.push('is-start');
      if (node.id === cfg.goal) classes.push('is-goal');
      return `<g class="${classes.join(' ')}" data-node="${node.id}">
        <circle cx="${node.x}" cy="${node.y}" r="23"></circle>
        <text x="${node.x}" y="${node.y + 5}">${node.id}</text>
      </g>`;
    }).join('');
    container.innerHTML = `<svg viewBox="0 0 560 340" role="img" aria-label="Граф с вершинами и рёбрами">
      <defs><marker id="q2-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#7c8aa5"></path></marker></defs>
      ${edgeSvg}${nodeSvg}
    </svg>`;
  }

  WIDGETS.graph = function (el, cfg) {
    let mode = cfg.mode || 'bfs';
    let start = cfg.start || (cfg.nodes && cfg.nodes[0] && cfg.nodes[0].id);
    let frames = [];
    let index = 0;
    let timer = null;

    el.classList.add('q2-graph-lab');
    el.innerHTML = `<div class="q2-graph-top">
        <div class="q2-truth-tabs">
          <button type="button" class="q2-tab${mode === 'bfs' ? ' is-active' : ''}" data-mode="bfs">BFS · в ширину</button>
          <button type="button" class="q2-tab${mode === 'dfs' ? ' is-active' : ''}" data-mode="dfs">DFS · в глубину</button>
        </div>
        <label class="q2-select-row">Старт
          <select class="q2-select" data-start>${(cfg.nodes || []).map(node => `<option value="${node.id}"${node.id === start ? ' selected' : ''}>${node.id}</option>`).join('')}</select>
        </label>
      </div>
      <div class="q2-graph-grid">
        <div class="q2-graph-stage" data-stage></div>
        <div class="q2-graph-side">
          <div class="q2-frontier"><span data-frontier-label>Очередь</span><div data-frontier></div></div>
          <div class="q2-visited"><span>Порядок посещения</span><div data-visited></div></div>
          <div class="q2-graph-table" data-table></div>
          <div class="q2-graph-note" data-note></div>
          <div class="q2-sort-nav">
            <button type="button" class="q2-btn q2-btn-sm q2-btn-ghost" data-prev>Назад</button>
            <button type="button" class="q2-btn q2-btn-sm" data-next>Шаг</button>
            <button type="button" class="q2-btn q2-btn-sm q2-btn-ghost" data-play>Авто</button>
            <button type="button" class="q2-btn q2-btn-sm q2-btn-ghost" data-reset>Сброс</button>
          </div>
          <div class="q2-graph-counter"></div>
        </div>
      </div>`;

    const stage = el.querySelector('[data-stage]');
    const frontierLabel = el.querySelector('[data-frontier-label]');
    const frontierNode = el.querySelector('[data-frontier]');
    const visitedNode = el.querySelector('[data-visited]');
    const tableNode = el.querySelector('[data-table]');
    const note = el.querySelector('[data-note]');
    const counter = el.querySelector('.q2-graph-counter');
    const prev = el.querySelector('[data-prev]');
    const next = el.querySelector('[data-next]');
    const play = el.querySelector('[data-play]');

    function stop() {
      if (timer) { clearInterval(timer); timer = null; }
      play.textContent = 'Авто';
      play.classList.remove('is-active');
    }

    function build() {
      stop();
      frames = mode === 'bfs' ? bfsFrames({ ...cfg, start }) : dfsFrames({ ...cfg, start });
      index = 0;
      render();
    }

    function render() {
      const frame = frames[index];
      if (!frame) return;
      renderGraph(stage, { ...cfg, start }, frame, mode);
      frontierLabel.textContent = mode === 'bfs' ? 'Очередь' : 'Стек вызовов';
      const frontier = mode === 'bfs' ? frame.queue : frame.stack;
      frontierNode.innerHTML = (frontier && frontier.length)
        ? frontier.map((id, i) => `<span class="q2-frontier-chip${i === 0 ? ' is-head' : ''}">${id}</span>`).join('')
        : '<span class="q2-muted">пусто</span>';
      visitedNode.innerHTML = (frame.visited || []).length
        ? frame.visited.map(id => `<span class="q2-visited-chip">${id}</span>`).join('')
        : '<span class="q2-muted">пока никого</span>';
      if (mode === 'bfs') {
        const order = frame.visited || [];
        tableNode.innerHTML = order.length
          ? `<table class="q2-table q2-table-compact"><thead><tr><th>Вершина</th><th>Расстояние</th><th>Родитель</th></tr></thead><tbody>${order.map(id => `<tr class="${id === frame.current ? 'is-highlight' : ''}"><td>${id}</td><td>${frame.dist[id] == null ? '—' : frame.dist[id]}</td><td>${frame.parent[id] || '—'}</td></tr>`).join('')}</tbody></table>`
          : '<p class="q2-muted">Таблица расстояний заполнится по ходу обхода.</p>';
      } else {
        tableNode.innerHTML = (frame.visited || []).length
          ? `<p class="q2-muted">DFS не считает расстояния: он просто идёт вглубь. Порядок посещения: <b>${frame.visited.join(' → ')}</b>.</p>`
          : '';
      }
      note.textContent = frame.note;
      note.className = 'q2-graph-note' + (frame.done ? ' is-done' : '');
      counter.textContent = `Шаг ${index + 1} / ${frames.length}`;
      prev.disabled = index === 0;
      next.disabled = index === frames.length - 1;
    }

    el.querySelectorAll('[data-mode]').forEach(tab => {
      tab.addEventListener('click', () => {
        mode = tab.dataset.mode;
        el.querySelectorAll('[data-mode]').forEach(node => node.classList.toggle('is-active', node === tab));
        build();
      });
    });
    el.querySelector('[data-start]').addEventListener('change', event => { start = event.target.value; build(); });
    prev.addEventListener('click', () => { stop(); index = Math.max(0, index - 1); render(); });
    next.addEventListener('click', () => { stop(); index = Math.min(frames.length - 1, index + 1); render(); });
    el.querySelector('[data-reset]').addEventListener('click', () => { stop(); index = 0; render(); });
    play.addEventListener('click', () => {
      if (timer) { stop(); return; }
      play.textContent = 'Пауза';
      play.classList.add('is-active');
      timer = setInterval(() => {
        if (index >= frames.length - 1) { stop(); return; }
        index += 1;
        render();
      }, 1100);
    });
    build();
  };

  /* ----------------------------- виды графов ----------------------------- */
  WIDGETS.graphTypes = function (el, cfg) {
    let directed = Boolean(cfg.directed);
    let weighted = Boolean(cfg.weighted);
    const start = cfg.start || (cfg.nodes && cfg.nodes[0] && cfg.nodes[0].id);

    el.classList.add('q2-graphtypes');
    el.innerHTML = `<div class="q2-graphtypes-top">
        <button type="button" class="q2-tab${directed ? ' is-active' : ''}" data-toggle="directed">Ориентированный</button>
        <button type="button" class="q2-tab${weighted ? ' is-active' : ''}" data-toggle="weighted">Взвешенный</button>
      </div>
      <div class="q2-graphtypes-grid">
        <div class="q2-graph-stage" data-stage></div>
        <div class="q2-graphtypes-side">
          <div class="q2-adjacency" data-adjacency></div>
          <div class="q2-reach" data-reach></div>
        </div>
      </div>`;

    const stage = el.querySelector('[data-stage]');
    const adjacency = el.querySelector('[data-adjacency]');
    const reach = el.querySelector('[data-reach]');

    function render() {
      const config = { ...cfg, directed, weighted };
      const { adj } = graphData(config);
      renderGraph(stage, config, { visited: [] }, 'bfs');
      adjacency.innerHTML = `<h4>Список соседей</h4><pre>${Object.keys(adj).map(key => `${key}: ${adj[key].map(link => `${link.v}${weighted ? ` (${link.w})` : ''}`).join(', ') || '—'}`).join('\n')}</pre>`;
      const seen = { [start]: true };
      const queue = [start];
      while (queue.length) {
        const u = queue.shift();
        adj[u].forEach(({ v }) => { if (!seen[v]) { seen[v] = true; queue.push(v); } });
      }
      const unreachable = (cfg.nodes || []).map(node => node.id).filter(id => !seen[id]);
      reach.innerHTML = `<h4>Достижимость из ${start}</h4><p>${unreachable.length ? `Недостижимые вершины: <b>${unreachable.join(', ')}</b>. Граф несвязный.` : 'Все вершины достижимы: граф связный.'}</p>`;
      el.querySelectorAll('[data-toggle]').forEach(button => {
        const key = button.dataset.toggle;
        button.classList.toggle('is-active', key === 'directed' ? directed : weighted);
      });
    }

    el.querySelectorAll('[data-toggle]').forEach(button => {
      button.addEventListener('click', () => {
        if (button.dataset.toggle === 'directed') directed = !directed;
        else weighted = !weighted;
        render();
      });
    });
    render();
  };

  /* ------------------------------- степени ------------------------------- */
  WIDGETS.degree = function (el, cfg) {
    const nodes = cfg.nodes || [];
    const edges = cfg.edges || [];
    const directed = Boolean(cfg.directed);
    const weighted = Boolean(cfg.weighted);
    let current = cfg.start || (nodes[0] && nodes[0].id);
    const nodeMap = {};
    nodes.forEach(node => { nodeMap[node.id] = node; });

    function neighbours(id) {
      const out = [];
      const incoming = [];
      edges.forEach(([u, v, w]) => {
        if (u === id) out.push({ id: v, w });
        if (v === id) incoming.push({ id: u, w });
        if (!directed && v === id) out.push({ id: u, w });
      });
      return { out, incoming };
    }

    el.classList.add('q2-degree-lab');
    el.innerHTML = `<div class="q2-graph-grid">
        <div class="q2-graph-stage" data-stage></div>
        <div class="q2-graph-side">
          <div class="q2-degree-head" data-head></div>
          <div class="q2-visited" data-neighbours></div>
          <div class="q2-graph-note" data-note></div>
          <p class="q2-muted q2-degree-hint">Нажмите на вершину графа, чтобы посчитать её степень.</p>
        </div>
      </div>`;

    const stage = el.querySelector('[data-stage]');
    const head = el.querySelector('[data-head]');
    const neighboursNode = el.querySelector('[data-neighbours]');
    const note = el.querySelector('[data-note]');

    function render() {
      const { out, incoming } = neighbours(current);
      const neighbourIds = new Set(out.map(item => item.id));
      const edgeSvg = edges.map(([u, v, w]) => {
        const from = nodeMap[u];
        const to = nodeMap[v];
        if (!from || !to) return '';
        const isActive = u === current || v === current;
        const mx = (from.x + to.x) / 2;
        const my = (from.y + to.y) / 2;
        return `<g class="q2-graph-edge${isActive ? ' is-active' : ''}">
          <line x1="${from.x}" y1="${from.y}" x2="${to.x}" y2="${to.y}" ${directed ? 'marker-end="url(#q2-arrow-degree)"' : ''}></line>
          ${weighted ? `<rect class="q2-weight-bg" x="${mx - 13}" y="${my - 12}" width="26" height="20" rx="8"></rect><text class="q2-weight" x="${mx}" y="${my + 3}">${w == null ? 1 : w}</text>` : ''}
        </g>`;
      }).join('');
      const nodeSvg = nodes.map(node => {
        const classes = ['q2-graph-node'];
        if (node.id === current) classes.push('is-current');
        else if (neighbourIds.has(node.id)) classes.push('is-visited');
        return `<g class="${classes.join(' ')}" data-node="${node.id}" role="button" tabindex="0" aria-label="Вершина ${node.id}">
          <circle cx="${node.x}" cy="${node.y}" r="23"></circle>
          <text x="${node.x}" y="${node.y + 5}">${node.id}</text>
        </g>`;
      }).join('');
      stage.innerHTML = `<svg viewBox="0 0 560 340" role="img" aria-label="Граф для подсчёта степеней вершин">
        <defs><marker id="q2-arrow-degree" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#7c8aa5"></path></marker></defs>
        ${edgeSvg}${nodeSvg}
      </svg>`;

      stage.querySelectorAll('[data-node]').forEach(group => {
        const pick = () => { current = group.dataset.node; render(); };
        group.addEventListener('click', pick);
        group.addEventListener('keydown', event => {
          if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); pick(); }
        });
      });

      if (directed) {
        head.innerHTML = `<h4>Вершина ${current}</h4><p>Исходящая степень: <b>${out.length}</b> · Входящая степень: <b>${incoming.length}</b></p>`;
      } else {
        head.innerHTML = `<h4>Вершина ${current}</h4><p>Степень вершины: <b>${out.length}</b></p>`;
      }
      neighboursNode.innerHTML = out.length
        ? `<span>Соседи</span><div>${out.map(item => `<span class="q2-visited-chip">${item.id}</span>`).join('')}</div>`
        : '<span>Соседи</span><div><span class="q2-muted">нет — вершина изолирована</span></div>';
      note.textContent = directed
        ? 'В ориентированном графе степень считают отдельно: сколько рёбер выходит и сколько входит.'
        : 'Степень вершины — число рёбер, которые к ней подходят. Петля считается дважды.';
    }

    render();
  };

  /* ---------------------------- матрица смежности ------------------------- */
  WIDGETS.matrix = function (el, cfg) {
    const nodes = cfg.nodes || [];
    const edges = cfg.edges || [];
    const directed = Boolean(cfg.directed);
    const ids = nodes.map(node => node.id);
    const size = ids.length;
    const expected = {};
    const state = {};
    ids.forEach(a => ids.forEach(b => { expected[`${a}-${b}`] = 0; state[`${a}-${b}`] = 0; }));
    edges.forEach(([u, v]) => {
      if (expected[`${u}-${v}`] == null) return;
      expected[`${u}-${v}`] = 1;
      if (!directed) expected[`${v}-${u}`] = 1;
    });

    el.classList.add('q2-matrix-lab');
    el.innerHTML = `<div class="q2-matrix-wrap">
        <table class="q2-table q2-matrix">
          <thead><tr><th>${directed ? 'из \ в' : ''}</th>${ids.map(id => `<th>${id}</th>`).join('')}</tr></thead>
          <tbody>${ids.map(a => `<tr><th>${a}</th>${ids.map(b => `<td><button type="button" class="q2-matrix-cell" data-a="${a}" data-b="${b}" aria-label="Строка ${a}, столбец ${b}">0</button></td>`).join('')}</tr>`).join('')}</tbody>
        </table>
      </div>
      <div class="q2-matrix-side">
        <div class="q2-graph-stage q2-matrix-graph" data-stage></div>
        <div class="q2-truth-actions">
          <button type="button" class="q2-btn q2-btn-sm" data-check>Проверить матрицу</button>
          <button type="button" class="q2-btn q2-btn-sm q2-btn-ghost" data-show>Показать ответ</button>
          <button type="button" class="q2-btn q2-btn-sm q2-btn-ghost" data-reset>Сброс</button>
        </div>
        <div class="q2-feedback" data-feedback aria-live="polite"></div>
      </div>`;

    const stage = el.querySelector('[data-stage]');
    const feedback = el.querySelector('[data-feedback]');

    function render() {
      el.querySelectorAll('.q2-matrix-cell').forEach(cell => {
        const key = `${cell.dataset.a}-${cell.dataset.b}`;
        cell.textContent = String(state[key]);
        cell.classList.toggle('is-one', state[key] === 1);
      });
    }

    function drawGraph() {
      renderGraph(stage, { nodes, edges, directed, weighted: false }, { visited: [] }, 'bfs');
    }

    el.querySelectorAll('.q2-matrix-cell').forEach(cell => {
      cell.addEventListener('click', () => {
        const key = `${cell.dataset.a}-${cell.dataset.b}`;
        state[key] = state[key] ? 0 : 1;
        cell.classList.remove('is-correct', 'is-wrong');
        render();
      });
    });

    el.querySelector('[data-check]').addEventListener('click', () => {
      let wrong = 0;
      el.querySelectorAll('.q2-matrix-cell').forEach(cell => {
        const key = `${cell.dataset.a}-${cell.dataset.b}`;
        const ok = state[key] === expected[key];
        if (!ok) wrong += 1;
        cell.classList.toggle('is-correct', ok && state[key] === 1);
        cell.classList.toggle('is-wrong', !ok);
      });
      feedback.textContent = wrong
        ? `Пока есть ${wrong} неверных клеток. Проверьте: 1 ставится там, где между вершинами есть ребро.`
        : (directed
          ? 'Верно: единицы стоят на пересечениях «из вершины-строки в вершину-столбец».'
          : 'Верно: матрица симметрична относительно главной диагонали.');
      feedback.className = 'q2-feedback ' + (wrong ? 'is-bad' : 'is-good');
    });

    el.querySelector('[data-show]').addEventListener('click', () => {
      Object.keys(state).forEach(key => { state[key] = expected[key]; });
      el.querySelectorAll('.q2-matrix-cell').forEach(cell => cell.classList.remove('is-wrong', 'is-correct'));
      render();
      feedback.textContent = 'Это правильная матрица смежности. Сравните её со своей и найдите, где разошлись.';
      feedback.className = 'q2-feedback is-hint';
    });

    el.querySelector('[data-reset]').addEventListener('click', () => {
      Object.keys(state).forEach(key => { state[key] = 0; });
      el.querySelectorAll('.q2-matrix-cell').forEach(cell => cell.classList.remove('is-wrong', 'is-correct'));
      render();
      feedback.textContent = '';
      feedback.className = 'q2-feedback';
    });

    render();
    drawGraph();
  };

  /* ----------------------------- сравнение путей ------------------------- */
  WIDGETS.paths = function (el, cfg) {
    const paths = cfg.paths || [];
    const sums = paths.map(path => (path.weights || []).reduce((total, value) => total + value, 0));
    const best = sums.indexOf(Math.min(...sums));
    el.classList.add('q2-paths');
    el.innerHTML = `<p class="q2-paths-question">${cfg.question || 'Какой путь короче?'}</p>
      <div class="q2-path-grid">${paths.map((path, index) => `
        <button type="button" class="q2-path-card" data-path="${index}">
          <span class="q2-path-route">${(path.nodes || []).join(' → ')}</span>
          <span class="q2-path-weights">${(path.weights || []).map((value, i) => `${i ? '+' : ''}${value}`).join(' ')} = <b>${sums[index]}</b> ${cfg.unit || ''}</span>
          <span class="q2-path-note">${path.note || ''}</span>
        </button>`).join('')}</div>
      <div class="q2-feedback" aria-live="polite"></div>`;
    const feedback = el.querySelector('.q2-feedback');
    el.querySelectorAll('[data-path]').forEach(card => {
      card.addEventListener('click', () => {
        const index = Number(card.dataset.path);
        const ok = index === best;
        el.querySelectorAll('[data-path]').forEach((node, i) => {
          node.disabled = true;
          node.classList.toggle('is-best', i === best);
          if (i === index) node.classList.add(ok ? 'is-correct' : 'is-wrong');
        });
        feedback.textContent = ok
          ? `Верно: путь ${paths[best].nodes.join(' → ')} даёт минимальную стоимость ${sums[best]} ${cfg.unit || ''}.`
          : `Не совсем. Минимальная стоимость у пути ${paths[best].nodes.join(' → ')}: ${sums[best]} ${cfg.unit || ''}.`;
        feedback.className = 'q2-feedback ' + (ok ? 'is-good' : 'is-bad');
      });
    });
  };

  /* ------------------------------- кейсы --------------------------------- */
  WIDGETS.caseTabs = function (el, cfg) {
    const cases = cfg.cases || [];
    let current = 0;
    el.classList.add('q2-cases');
    el.innerHTML = `<div class="q2-case-tabs">${cases.map((item, i) => `<button type="button" class="q2-tab${i === 0 ? ' is-active' : ''}" data-case="${i}">${item.label}</button>`).join('')}</div>
      <div class="q2-case-body">
        <div class="q2-case-text" data-text></div>
        <div class="q2-case-question">
          <h4 data-question></h4>
          <div class="q2-predict-options" data-options></div>
          <div class="q2-feedback" data-feedback aria-live="polite"></div>
        </div>
      </div>`;
    const text = el.querySelector('[data-text]');
    const question = el.querySelector('[data-question]');
    const options = el.querySelector('[data-options]');
    const feedback = el.querySelector('[data-feedback]');

    function render() {
      const item = cases[current];
      if (!item) return;
      el.querySelectorAll('[data-case]').forEach((tab, i) => tab.classList.toggle('is-active', i === current));
      text.innerHTML = item.html;
      question.textContent = item.question || 'Выберите верное объяснение';
      feedback.textContent = '';
      feedback.className = 'q2-feedback';
      options.innerHTML = '';
      (item.options || []).forEach((option, index) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'q2-option';
        button.innerHTML = `<span class="q2-option-letter">${String.fromCharCode(65 + index)}</span><span>${option}</span>`;
        button.addEventListener('click', () => {
          const correct = index === item.answer;
          options.querySelectorAll('.q2-option').forEach((node, i) => {
            node.disabled = true;
            if (i === item.answer) node.classList.add('is-correct');
            else if (i === index) node.classList.add('is-wrong');
          });
          feedback.textContent = correct ? `Верно. ${item.explain || ''}` : `Не совсем. ${item.explain || ''}`;
          feedback.className = 'q2-feedback ' + (correct ? 'is-good' : 'is-bad');
        });
        options.appendChild(button);
      });
    }

    el.querySelectorAll('[data-case]').forEach(tab => {
      tab.addEventListener('click', () => { current = Number(tab.dataset.case); render(); });
    });
    render();
  };

  Q2.WIDGETS = WIDGETS;
  Q2.widget = widget;
  Q2.block = block;
  Q2.svgScene = svgScene;
  Q2.esc = esc;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
