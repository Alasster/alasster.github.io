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
    return `<div class="q2-code${block.compact ? ' is-compact' : ''}">
      <div class="q2-code-head">
        <span class="q2-code-dots"><i></i><i></i><i></i></span>
        <span class="q2-code-title">${esc(block.title || 'Python')}</span>
      </div>
      <pre><code>${lines.map((line, index) =>
        `<span class="q2-code-line" data-line="${index}"><span class="q2-ln">${index + 1}</span>${hl(line) || ' '}</span>`
      ).join('')}</code></pre>
      ${block.caption ? `<p class="q2-caption">${block.caption}</p>` : ''}
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
        return `<div class="q2-split${item.cls ? ` ${item.cls}` : ''}">
          <div class="q2-split-col q2-split-left">${blocks(item.left)}</div>
          <div class="q2-split-col q2-split-right">${blocks(item.right)}</div>
        </div>`;
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
        return `<div class="q2-svg-wrap${item.compact ? ' q2-svg-compact' : ''}${item.cls ? ` ${item.cls}` : ''}">${item.svg}${item.caption ? `<p class="q2-caption">${item.caption}</p>` : ''}</div>`;
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
  function heroSlide(slide) {
    return `<section class="slide q2-slide q2-hero-slide active">
      <div class="container q2-hero">
        <div class="q2-hero-copy">
          <span class="eyebrow">${slide.eyebrow || '01 · ВВЕДЕНИЕ'}</span>
          <h1>${slide.title}</h1>
          <p class="lead">${slide.lead || ''}</p>
          ${slide.goal ? `<div class="q2-goal"><span class="q2-goal-code">${slide.goalCode || 'Цель обучения'}</span><p>${slide.goal}</p></div>` : ''}
          ${slide.chips ? `<div class="chips">${slide.chips.map(chip => `<span class="chip">${chip.icon ? `<i class="${chip.icon}"></i>` : ''}${chip.text || chip}</span>`).join('')}</div>` : ''}
          <div class="q2-hero-actions">
            <button class="start-btn" type="button" onclick="changeSlide(1)">${slide.cta || 'Начать урок'} <i class="fas fa-arrow-right"></i></button>
            ${slide.note ? `<span class="q2-hero-note">${slide.note}</span>` : ''}
          </div>
        </div>
        <div class="q2-visual">
          ${svgScene(slide.visual || 'lamp', slide.visualConfig)}
          ${slide.visualCaption ? `<p class="q2-visual-caption">${slide.visualCaption}</p>` : ''}
        </div>
      </div>
    </section>`;
  }

  function head(slide) {
    return `${slide.eyebrow ? `<span class="eyebrow">${slide.eyebrow}</span>` : ''}
      ${slide.title ? `<h2>${slide.title}</h2>` : ''}
      ${slide.lead ? `<p class="lead">${slide.lead}</p>` : ''}`;
  }

  function renderSlide(slide, index) {
    if ((slide.k || 'concept') === 'hero') return heroSlide(slide);
    const kind = slide.k || 'concept';
    let body = '';
    if (kind === 'concept') {
      body = `${head(slide)}${blocks(slide.blocks)}`;
    } else if (kind === 'lab') {
      body = `${head(slide)}${blocks(slide.before)}${widget(slide.widget.kind, slide.widget.config || {})}${blocks(slide.after)}`;
    } else if (kind === 'practice') {
      const tasks = slide.tasks ? widget('mini', { tasks: slide.tasks }) : '';
      body = `${head(slide)}${blocks(slide.before)}${tasks}${blocks(slide.after)}
        ${slide.criteria ? block({ t: 'rubric', title: slide.criteriaTitle || 'Критерии успеха', items: slide.criteria }) : ''}`;
    } else if (kind === 'review') {
      body = `${head({ eyebrow: slide.eyebrow || '02 · ПОВТОРЕНИЕ', title: slide.title || 'Повторение предыдущей темы', lead: slide.lead || 'Ответьте на 5 вопросов — они помогут вспомнить главное перед новой темой.' })}${widget('quiz', { questions: slide.questions, variant: 'review' })}`;
    } else if (kind === 'quiz') {
      body = `${head({ eyebrow: slide.eyebrow || 'ПРОВЕРКА', title: slide.title || 'Мини-проверка', lead: slide.lead || 'Пять вопросов по теме урока. Выберите один ответ в каждом.' })}${widget('quiz', { questions: slide.questions })}`;
    } else if (kind === 'summary') {
      body = `${head({ eyebrow: slide.eyebrow || 'ИТОГИ', title: slide.title || 'Итоги урока', lead: slide.lead || '' })}
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
      body = `${head(slide)}${blocks(slide.blocks)}`;
    }
    return `<section class="slide q2-slide q2-slide-${kind}">
      <div class="container">${body}</div>
    </section>`;
  }

  /* ---------------------------- инициализация ---------------------------- */
  function initWidgets(root) {
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
    root.innerHTML = (lesson.slides || []).map(renderSlide).join('');
    initSingleLamp(root);
    initAutoSort(root);
    initWidgets(root);
    document.dispatchEvent(new CustomEvent('q2:ready', { detail: { id } }));
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
    const questions = cfg.questions || [];
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
      feedback.textContent = message;
      feedback.className = 'q2-feedback' + (state ? ` is-${state}` : '');
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
      questionNode.textContent = item.q;
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
      setFeedback(`Правильных ответов: ${score} из ${questions.length}. ${perfect ? 'Отлично: тема усвоена.' : 'Разберите ошибки по слайдам — и всё получится.'}`, perfect ? 'good' : 'bad');
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
      const fn = compileExpr(item.expr);
      const mid = item.mid ? { label: item.mid.label, fn: compileExpr(item.mid.expr) } : null;
      const head = ['A', 'B', 'C'].slice(0, vars).map(v => `<th>${v}</th>`).join('') + (mid ? `<th>${mid.label}</th>` : '') + '<th>Y</th>';
      const body = rows.map((row, rowIndex) => {
        const values = row.map(value => `<td>${value}</td>`).join('');
        const midCell = mid ? `<td><button type="button" class="q2-cell" data-row="${rowIndex}" data-col="mid" aria-label="Промежуточное значение, строка ${rowIndex + 1}">?</button></td>` : '';
        return `<tr>${values}${midCell}<td><button type="button" class="q2-cell" data-row="${rowIndex}" data-col="res" aria-label="Результат, строка ${rowIndex + 1}">?</button></td></tr>`;
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
      feedback.textContent = `Заполните столбцы для ${item.label}. Нажимайте на «?», чтобы поставить 0 или 1.`;
      feedback.className = 'q2-feedback is-hint';
    }

    function check(show) {
      const item = exprs[current];
      const fn = compileExpr(item.expr);
      const mid = item.mid ? { label: item.mid.label, fn: compileExpr(item.mid.expr) } : null;
      let filled = true;
      let allCorrect = true;
      cells.forEach(cell => {
        const row = rows[Number(cell.dataset.row)];
        const expected = cell.dataset.col === 'mid' ? mid.fn(...row) : fn(...row);
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

    el.classList.add('q2-sort-lab');
    el.innerHTML = `<div class="q2-sort-top">
        <div class="q2-truth-tabs">${['bubble', 'selection', 'insertion'].map(key => `<button type="button" class="q2-tab${key === algo ? ' is-active' : ''}" data-algo="${key}">${labels[key]}</button>`).join('')}</div>
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
        <div class="q2-sort-code">${codeBlock({ code: (codeMap[algo] || SORT_CODE[algo]).join('\n'), title: labels[algo], compact: true })}</div>
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
