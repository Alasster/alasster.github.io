/* Интерактивный моушн-каталог ALASSTER: выбор из 3 уникальных сценариев для всех 78 элементов. */
(() => {
  'use strict';
  const root = document.querySelector('.design-library');
  if (!root || !root.querySelector('.component')) return;
  const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const running = new Map();
  const seen = new WeakSet();
  const profiles = new Map();
  const add = (ids, selector, effect, label) => ids.split(' ').forEach(id => profiles.set(id, {selector, effect, label}));

  add('SYS-01', '.token-colors > div', 'pop', 'Цвета появляются по очереди; образцы слегка приподнимаются при наведении.');
  add('SYS-02 TXT-02 BLK-05', '.preview-fill > .ui-stack > *, .preview-fill > div > *', 'rise', 'Строки появляются снизу по очереди, сохраняя ритм текста.');
  add('SYS-03', '.token-radius', 'pop', 'Скруглённые плашки мягко увеличиваются до своего размера.');
  add('SYS-04 BLK-07', '.ui-card', 'rise', 'Карточки поднимаются по очереди; наведение добавляет мягкую тень.');
  add('BLK-01 BLK-02 BLK-03 BLK-08', '.preview-fill > *', 'slide', 'Блок плавно входит сбоку, ссылки откликаются на наведение.');
  add('BLK-04', '.ui-mini-hero > *', 'rise', 'Текст и иллюстрация появляются с небольшим интервалом.');
  add('BLK-06 MED-01 MED-02', '.preview-fill > *', 'pop', 'Медиа мягко проявляется; элементы управления остаются доступными.');
  add('CRD-01 CRD-02 CRD-03 INF-05 INF-07 INF-08', '.preview-fill > *', 'rise', 'Карточка поднимается при появлении и откликается тенью на наведение.');
  add('BTN-01 BTN-02 BTN-03 BTN-04 BTN-05', '.ui-btn', 'pop', 'Кнопка мягко появляется, приподнимается при наведении и сжимается при нажатии.');
  add('CTL-01 SLD-02 EXT-01 EXT-02 POP-05', '.ui-icon-btn, .ui-btn', 'pop', 'Кнопки появляются по очереди и дают короткий отклик на нажатие.');
  add('CTL-02', '.ui-switch', 'slide', 'Переключатель появляется сбоку; бегунок плавно скользит между состояниями.');
  add('CTL-03', '.ui-dropdown', 'rise', 'Меню мягко раскрывается под кнопкой.');
  add('CTL-04 CTL-05 EXT-03 EXT-15', '.ui-field', 'rise', 'Поля появляются по очереди, фокус подсвечивает границу; результат плавно обновляется.');
  add('CTL-06 CTL-08 EXT-04', '.ui-chip, .ui-page', 'pop', 'Варианты появляются каскадом; выбор плавно меняет цвет и обновляет подпись.');
  add('CTL-07', '.ui-tab', 'rise', 'Вкладки появляются по очереди; содержимое мягко сменяется при выборе.');
  add('CTL-09', '.preview-fill > *', 'fade', 'Индикатор сохраняет вращение; результат загрузки мягко проявляется.');
  add('SLD-01', '.slide-visual > *', 'slide', 'Содержимое входит сбоку и плавно сменяется; активная точка вытягивается.');
  add('SLD-03', '.ui-dot', 'pop', 'Точки появляются по очереди и плавно меняют ширину.');
  add('SLD-04', '.slide-count', 'rise', 'Номер мягко поднимается при появлении и смене слайда.');
  add('SLD-05', '.ui-stack > *', 'slide', 'Метка, заголовок и подпись входят по очереди и анимируются при смене.');
  add('SLD-06', '.ui-btn', 'pop', 'Кнопка мягко появляется и откликается на запуск или паузу.');
  add('TXT-01 TXT-03 TXT-06', '.preview-fill > *', 'fade', 'Текст спокойно проявляется без изменения размера и переносов.');
  add('TXT-04', '.ui-quote > *', 'slide', 'Цитата и подпись появляются со стороны акцентной линии.');
  add('TXT-05 MED-03 TXT-09', '.ui-avatar, .ui-icon-tile, .ui-badge', 'pop', 'Небольшие детали появляются каскадом с мягким увеличением.');
  add('TXT-07', '.ui-list li', 'slide', 'Пункты входят по очереди; наведение подчёркивает текущую строку цветом.');
  add('TBL-01 TBL-02 TBL-03', 'tbody tr', 'fade', 'Строки последовательно проявляются; сортировка повторяет переход.');
  add('TXT-08 EXT-06', '.text-link, [aria-current="page"]', 'rise', 'Ссылки появляются по очереди и откликаются на наведение.');
  add('INF-01', '.ui-alert', 'slide', 'Сообщения последовательно входят сбоку.');
  add('INF-02', '.ui-banner > *', 'rise', 'Анонс и действие появляются с небольшим интервалом.');
  add('INF-03', '.ui-stat', 'pop', 'Значения появляются каскадом, сохраняя точные числа.');
  add('INF-04', '.ui-schedule-row', 'slide', 'События входят по очереди, наведение слегка сдвигает строку.');
  add('INF-06', '.ui-faq details', 'rise', 'Вопросы появляются каскадом; открытый ответ плавно проявляется.');
  add('POP-01', '.ui-btn', 'pop', 'Окно появляется с лёгким увеличением и плавным затемнением фона.');
  add('POP-02', '.ui-tooltip-wrap', 'fade', 'Подсказка проявляется с небольшим подъёмом при наведении или фокусе.');
  add('POP-03', '.ui-btn', 'pop', 'Уведомление плавно поднимается снизу экрана.');
  add('POP-04', '.ui-stack > *', 'slide', 'Боковая панель выезжает справа при открытии.');
  add('EXT-05', '.ui-theme-sample', 'fade', 'Фон, текст и границы плавно переходят между светлой и тёмной темой.');
  add('EXT-07', '.ui-divider', 'line', 'Разделитель разворачивается от центра к краям.');
  add('EXT-08', '.ui-pattern', 'fade', 'Фоны проявляются по очереди, при наведении свет и сетка слегка смещаются.');
  add('EXT-09', '.ui-progress', 'wipe', 'Полоса открывается слева направо, точное значение прогресса сохраняется.');
  add('EXT-10', '.ui-steps li', 'slide', 'Шаги появляются слева направо в порядке выполнения.');
  add('EXT-11', '.ui-code, .ui-btn', 'rise', 'Код и кнопка последовательно появляются без изменения текста.');
  add('EXT-12', '.ui-stack > *', 'rise', 'Иконка, объяснение и действие последовательно поднимаются.');
  add('EXT-13', '.preview-fill > *', 'fade', 'Скелетон мягко проявляется и сохраняет пульсацию; вне экрана она приостанавливается.');
  add('EXT-14', '.ui-check', 'rise', 'Пункты появляются по очереди, выбор сопровождается коротким акцентом.');

  const effectNames = {
    rise:'Каскад',slide:'Инерция',pop:'Пружина',fade:'Проявление',line:'Линия света',wipe:'Заполнение',
    fold:'Объём',text:'Раскрытие',orbit:'Вращение',focus:'Фокус',wave:'Волна',glide:'Планирование',
    fan:'Веер',breath:'Дыхание',curtain:'Шторка',curtainY:'Вертикальная шторка',typing:'Печатный шаг',
    radius:'Пластика углов',ink:'Проявление чернил',hinge:'Наклон петли',surface:'Кристаллизация',
    diagonal:'Диагональ',fromLeft:'Вход слева',fromRight:'Вход справа',aperture:'Диафрагма',
    turn:'Разворот 3D',door:'Дверь 3D',photo:'Вспышка',shutter:'Затвор',launch:'Взлёт',
    bubble:'Пузырь',lean:'Наклон',alternate:'Перекличка',press:'Нажатие',odometer:'Счётчик',
    signal:'Импульс',column:'Колонка',stepped:'Дискретный шаг',outward:'Радиальный разлёт',
    page:'Перелистывание',arrow:'Стрела',aurora:'Северное сияние',draw:'Прорисовка',
    drawer:'Выдвижение',eclipse:'Затмение',iris:'Диафрагма-ирис',lineGrow:'Рост линии',seal:'Печать'
  };

  const frames = {
    rise: [{opacity:0,translate:'0 32px',scale:'.94'},{opacity:1,translate:'0 -4px',scale:'1.015',offset:.72},{opacity:1,translate:'0 0',scale:'1'}],
    slide: [{opacity:0,translate:'-42px 0'},{opacity:1,translate:'5px 0',offset:.75},{opacity:1,translate:'0 0'}],
    pop: [{opacity:0,scale:'.62'},{opacity:1,scale:'1.12',offset:.5},{opacity:1,scale:'.97',offset:.76},{opacity:1,scale:'1'}],
    fade: [{opacity:0},{opacity:1}],
    line: [{opacity:0,clipPath:'inset(0 0 100% 0)',translate:'0 20px'},{opacity:1,clipPath:'inset(0 0 0% 0)',translate:'0 0'}],
    wipe: [{clipPath:'inset(0 100% 0 0 round 8px)'},{clipPath:'inset(0 0 0 0 round 8px)'}],
    fold: [{opacity:0,translate:'0 38px',rotate:'x 24deg',scale:'.9'},{opacity:1,translate:'0 -5px',rotate:'x -3deg',scale:'1.015',offset:.75},{opacity:1,translate:'0 0',rotate:'x 0deg',scale:'1'}],
    text: [{opacity:0,clipPath:'inset(0 0 100% 0)',translate:'0 22px'},{opacity:1,clipPath:'inset(0 0 0% 0)',translate:'0 0'}],
    orbit: [{opacity:0,rotate:'-36deg',scale:'.55',translate:'-16px 24px'},{opacity:1,rotate:'6deg',scale:'1.08',translate:'0 -6px',offset:.68},{opacity:1,rotate:'0deg',scale:'1',translate:'0 0'}],
    focus: [{opacity:0,filter:'blur(10px)',scale:'1.12'},{opacity:1,filter:'blur(0px)',scale:'1'}],
    wave: [{opacity:0,translate:'22px 18px'},{opacity:1,translate:'-3px -2px',offset:.72},{opacity:1,translate:'0 0'}],
    glide: [{opacity:0,translate:'-36px 12px',rotate:'-2deg'},{opacity:1,translate:'4px -2px',rotate:'.3deg',offset:.8},{opacity:1,translate:'0 0',rotate:'0deg'}],
    fan: [{opacity:0,rotate:'-24deg',translate:'-15px 22px',scale:'.65'},{opacity:1,rotate:'5deg',translate:'0 -5px',scale:'1.06',offset:.68},{opacity:1,rotate:'0deg',translate:'0 0',scale:'1'}],
    breath: [{opacity:0,scale:'.8'},{opacity:1,scale:'1.08',offset:.55},{opacity:1,scale:'.98',offset:.8},{opacity:1,scale:'1'}],
    curtain: [{opacity:0,clipPath:'inset(0 100% 0 0 round 8px)',translate:'-16px 0'},{opacity:1,clipPath:'inset(0 0% 0 0 round 0px)',translate:'0 0'}],
    curtainY: [{opacity:0,clipPath:'inset(0 0 100% 0 round 8px)',translate:'0 -16px'},{opacity:1,clipPath:'inset(0 0 0% 0 round 0px)',translate:'0 0'}],
    typing: [{opacity:0,clipPath:'inset(0 100% 0 0)'},{opacity:1,clipPath:'inset(0 0% 0 0)'}],
    radius: [{opacity:0,borderRadius:'50%',scale:'.7'},{opacity:1,borderRadius:'inherit',scale:'1'}],
    ink: [{opacity:0,filter:'blur(5px)',scale:'.96'},{opacity:1,filter:'blur(0px)',scale:'1'}],
    hinge: [{opacity:0,transform:'perspective(800px) rotateX(-35deg)',transformOrigin:'top center'},{opacity:1,transform:'perspective(800px) rotateX(4deg)',offset:.75},{opacity:1,transform:'perspective(800px) rotateX(0deg)'}],
    surface: [{opacity:0,scale:'.91',filter:'blur(7px)'},{opacity:1,scale:'1',filter:'blur(0px)'}],
    diagonal: [{opacity:0,translate:'-28px 24px',scale:'.92',rotate:'-1.5deg'},{opacity:1,translate:'3px -3px',scale:'1.015',rotate:'.2deg',offset:.75},{opacity:1,translate:'0 0',scale:'1',rotate:'0deg'}],
    fromLeft: [{opacity:0,translate:'-38px 0'},{opacity:1,translate:'4px 0',offset:.75},{opacity:1,translate:'0 0'}],
    fromRight: [{opacity:0,translate:'38px 0'},{opacity:1,translate:'-4px 0',offset:.75},{opacity:1,translate:'0 0'}],
    aperture: [{opacity:0,clipPath:'circle(0% at 50% 50%)',scale:'.85'},{opacity:1,clipPath:'circle(120% at 50% 50%)',scale:'1'}],
    turn: [{opacity:0,transform:'perspective(700px) rotateY(90deg)'},{opacity:1,transform:'perspective(700px) rotateY(0deg)'}],
    door: [{opacity:0,transform:'perspective(700px) rotateY(-40deg)',transformOrigin:'left center'},{opacity:1,transform:'perspective(700px) rotateY(4deg)',offset:.72},{opacity:1,transform:'perspective(700px) rotateY(0deg)'}],
    photo: [{opacity:0,filter:'brightness(2.2) contrast(1.15)',scale:'1.06'},{opacity:1,filter:'brightness(1) contrast(1)',scale:'1'}],
    shutter: [{opacity:0,clipPath:'inset(0 0 100% 0)',translate:'0 -8px'},{opacity:1,clipPath:'inset(0 0 0% 0)',translate:'0 0'}],
    launch: [{opacity:0,translate:'0 45px',scale:'.86'},{opacity:1,translate:'0 -6px',scale:'1.03',offset:.7},{opacity:1,translate:'0 0',scale:'1'}],
    bubble: [{opacity:0,scale:'.4',translate:'0 18px'},{opacity:1,scale:'1.14',translate:'0 -5px',offset:.55},{opacity:1,scale:'.96',translate:'0 2px',offset:.78},{opacity:1,scale:'1',translate:'0 0'}],
    lean: [{opacity:0,transform:'perspective(600px) rotateX(18deg) translateY(24px)'},{opacity:1,transform:'perspective(600px) rotateX(-2deg) translateY(-2px)',offset:.75},{opacity:1,transform:'perspective(600px) rotateX(0deg) translateY(0)'}],
    alternate: [{opacity:0,translate:'-20px 0',rotate:'-3deg'},{opacity:1,translate:'3px 0',rotate:'.5deg',offset:.72},{opacity:1,translate:'0 0',rotate:'0deg'}],
    press: [{scale:'1'},{scale:'.88',offset:.28},{scale:'1.08',offset:.68},{scale:'1'}],
    odometer: [{opacity:0,translate:'0 -24px',filter:'blur(4px)'},{opacity:1,translate:'0 3px',filter:'blur(0px)',offset:.7},{opacity:1,translate:'0 0'}],
    signal: [{opacity:0,scale:'.65',filter:'drop-shadow(0 0 14px #4f46e5)'},{opacity:1,scale:'1.06',filter:'drop-shadow(0 0 4px #4f46e5)',offset:.7},{opacity:1,scale:'1',filter:'none'}],
    column: [{opacity:0,translate:'0 -32px',scale:'.96 .88'},{opacity:1,translate:'0 4px',scale:'1 1.02',offset:.75},{opacity:1,translate:'0 0',scale:'1 1'}],
    stepped: [{opacity:0,translate:'-20px 0'},{opacity:.5,translate:'-10px 0',offset:.35},{opacity:1,translate:'0 0'}],
    outward: [{opacity:0,scale:'.4'},{opacity:1,scale:'1.08',offset:.65},{opacity:1,scale:'1'}],
    page: [{opacity:0,transform:'perspective(900px) rotateY(-50deg)',transformOrigin:'left center'},{opacity:1,transform:'perspective(900px) rotateY(4deg)',offset:.75},{opacity:1,transform:'perspective(900px) rotateY(0deg)'}],
    arrow: [{opacity:0,translate:'-30px 0',scale:'.9'},{opacity:1,translate:'5px 0',scale:'1.03',offset:.7},{opacity:1,translate:'0 0',scale:'1'}],
    aurora: [{opacity:0,filter:'brightness(1.6) blur(8px)',translate:'0 14px'},{opacity:1,filter:'brightness(1) blur(0px)',translate:'0 0'}],
    draw: [{opacity:0,clipPath:'inset(0 50% 0 50%)',scale:'.92 1'},{opacity:1,clipPath:'inset(0 0% 0 0%)',scale:'1 1'}],
    drawer: [{opacity:0,translate:'42px 0'},{opacity:1,translate:'-4px 0',offset:.75},{opacity:1,translate:'0 0'}],
    eclipse: [{opacity:0,clipPath:'circle(0% at 100% 0%)',filter:'brightness(1.8)'},{opacity:1,clipPath:'circle(150% at 100% 0%)',filter:'brightness(1)'}],
    iris: [{opacity:0,clipPath:'polygon(50% 50%, 50% 50%, 50% 50%, 50% 50%)'},{opacity:1,clipPath:'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)'}],
    lineGrow: [{opacity:0,transform:'scaleX(0)',transformOrigin:'left center'},{opacity:1,transform:'scaleX(1)'}],
    seal: [{opacity:0,scale:1.6,rotate:'-12deg'},{opacity:1,scale:.94,rotate:'2deg',offset:.65},{opacity:1,scale:1,rotate:'0deg'}]
  };

  const presetData = window.ALASSTER_MOTION;
  const entryMap = presetData?.entries ? new Map(presetData.entries.map(e => [e.id, e])) : new Map();
  const recipes = presetData?.recipes || {};

  function getPresetTag(index, cardIndex = 0) {
    if (index === 0) return '#Моушн-анимация';
    if (index === 1) return '#Круто';
    if (index === 2) return (cardIndex % 2 === 0 ? '#Шикаррно' : '#Чтоя');
    return '#Чтоя';
  }

  let mode = 'system';
  try { const saved = localStorage.getItem('alasster-motion'); if (['system','full','off'].includes(saved)) mode = saved; } catch {}
  const isFull = () => mode === 'full' || (mode === 'system' && !preference.matches);

  const stage = document.createElement('aside');
  stage.className = 'motion-studio';
  stage.setAttribute('aria-label','Настройки моушн-анимации');
  stage.innerHTML = `
    <div class="motion-studio-mark" aria-hidden="true"><i></i><i></i><i></i><span>✦</span></div>
    <div class="motion-studio-copy">
      <span class="motion-eyebrow">MOTION COLLECTION / 78 ELEMENTS · 234 UNIQUE PRESETS</span>
      <h2>Детали в движении.</h2>
      <p>У каждого из 78 элементов есть 3 авторских сценария анимации с многослойным каскадом, физикой и световыми эффектами.</p>
      <div class="motion-hero-tags">
        <span class="motion-hero-tag">#Моушн-анимация</span>
        <span class="motion-hero-tag">#Круто</span>
        <span class="motion-hero-tag">#Шикаррно</span>
        <span class="motion-hero-tag">#Чтоя</span>
      </div>
      <p class="motion-mode-hint" role="status"></p>
    </div>
    <label class="motion-mode-label">Движение
      <select class="motion-mode">
        <option value="system">По настройкам устройства</option>
        <option value="full">Полная анимация</option>
        <option value="off">Без анимации</option>
      </select>
    </label>
  `;
  root.querySelector('.usage-strip').after(stage);
  const modeSelect = stage.querySelector('select');
  modeSelect.value = mode;

  function visible(element) {
    if (!element || element.closest('[hidden]') || !element.getClientRects().length) return false;
    const bounds = element.getBoundingClientRect();
    return bounds.bottom > 0 && bounds.top < window.innerHeight;
  }

  function animate(element, effect = 'rise', delay = 0, manual = false) {
    if (mode === 'off' || (!isFull() && !manual) || document.hidden || !element?.animate || !visible(element)) return;
    running.get(element)?.cancel();
    const frameList = frames[effect] || frames.rise;
    const animation = element.animate(frameList, {
      duration: manual ? 1150 : 850,
      delay,
      fill: 'backwards',
      easing: 'cubic-bezier(.2,.65,.3,1)'
    });
    running.set(element, animation);
    const clean = () => { if (running.get(element) === animation) running.delete(element); };
    animation.onfinish = clean;
    animation.oncancel = clean;
  }

  function applyDecoration(anchor, type, manual) {
    if (!anchor || mode === 'off' || (!isFull() && !manual) || document.hidden) return;
    const layer = document.createElement('span');
    layer.className = 'motion-deco-layer';
    layer.setAttribute('aria-hidden', 'true');

    if (type === 'trace') {
      const trace = document.createElement('span');
      trace.className = 'motion-trace-overlay';
      layer.append(trace);
      anchor.append(layer);
      decorate(trace, [
        {opacity: 0, clipPath: 'inset(0 100% 0 0 round inherit)'},
        {opacity: 1, clipPath: 'inset(0 0% 0 0 round inherit)', offset: .5},
        {opacity: 0, clipPath: 'inset(0 0% 0 0 round inherit)', offset: 1}
      ], {duration: 1100, easing: 'cubic-bezier(.2,.65,.3,1)'}, () => layer.remove());
    } else if (type === 'scan') {
      const scan = document.createElement('span');
      scan.className = 'motion-scan-line';
      layer.append(scan);
      anchor.append(layer);
      decorate(scan, [
        {top: '0%', opacity: 0},
        {top: '20%', opacity: 1, offset: .25},
        {top: '80%', opacity: 1, offset: .75},
        {top: '100%', opacity: 0}
      ], {duration: 1200, easing: 'ease-in-out'}, () => layer.remove());
    } else if (type === 'ring') {
      const ring = document.createElement('span');
      ring.className = 'motion-ring-burst';
      layer.append(ring);
      anchor.append(layer);
      decorate(ring, [
        {scale: .2, opacity: .9, borderColor: '#6366f1'},
        {scale: 1.8, opacity: .6, borderColor: '#14b8a6', offset: .6},
        {scale: 2.6, opacity: 0, borderColor: '#38bdf8'}
      ], {duration: 1000, easing: 'cubic-bezier(.16,1,.3,1)'}, () => layer.remove());
    } else if (type === 'rays') {
      const rays = document.createElement('span');
      rays.className = 'motion-rays-beam';
      layer.append(rays);
      anchor.append(layer);
      decorate(rays, [
        {opacity: 0, rotate: '0deg'},
        {opacity: .8, rotate: '180deg', offset: .5},
        {opacity: 0, rotate: '360deg'}
      ], {duration: 1300, easing: 'ease-in-out'}, () => layer.remove());
    } else if (type === 'underline') {
      const line = document.createElement('span');
      line.className = 'motion-laser-line';
      layer.append(line);
      anchor.append(layer);
      decorate(line, [
        {transform: 'scaleX(0)', opacity: 0, transformOrigin: 'left'},
        {transform: 'scaleX(1)', opacity: 1, offset: .5, transformOrigin: 'left'},
        {transform: 'scaleX(1)', opacity: 0, transformOrigin: 'right'}
      ], {duration: 900, easing: 'cubic-bezier(.2,.65,.3,1)'}, () => layer.remove());
    } else {
      layer.remove();
    }
  }

  function reveal(card, manual = false, presetIdx = null) {
    if (mode === 'off' || (!isFull() && !manual) || document.hidden) return;
    const preview = card.querySelector('.component-preview');
    if (!preview) return;

    if (presetIdx === null) {
      presetIdx = parseInt(card.dataset.motionPreset || '0', 10);
    }

    const entry = entryMap.get(card.id);
    const recipeList = entry ? recipes[entry.family] : null;
    const recipe = recipeList ? recipeList[presetIdx] : null;

    running.forEach((anim, el) => {
      if (preview.contains(el)) {
        anim.cancel();
        running.delete(el);
      }
    });
    preview.querySelectorAll('.motion-deco-layer, .motion-sweep').forEach(el => el.remove());

    if (manual || isFull()) {
      illuminate(card);
    }

    if (recipe && recipe.tracks && recipe.tracks.length) {
      recipe.tracks.forEach(track => {
        let targets = [];
        if (track.selector === ':scope > *') {
          const fill = preview.querySelector('.preview-fill');
          targets = fill ? [...fill.children] : [...preview.children];
        } else {
          targets = [...preview.querySelectorAll(track.selector)];
        }
        if (!targets.length) {
          targets = [preview.querySelector('.preview-fill') || preview];
        }

        let ordered = [...targets];
        if (track.order === 'reverse') {
          ordered.reverse();
        } else if (track.order === 'center') {
          const mid = (ordered.length - 1) / 2;
          ordered.sort((a, b) => Math.abs(targets.indexOf(a) - mid) - Math.abs(targets.indexOf(b) - mid));
        }

        ordered.forEach((el, i) => {
          const delay = (track.delay || 0) + i * (track.stagger || 75);
          animate(el, track.effect, delay, manual);
        });
      });

      if (recipe.decoration && (isFull() || manual)) {
        let anchor = preview.querySelector('.preview-fill') || preview;
        if (recipe.anchor && recipe.anchor !== '@') {
          anchor = preview.querySelector(recipe.anchor) || anchor;
        }
        applyDecoration(anchor, recipe.decoration, manual);
      }
    } else {
      const profile = profiles.get(card.id);
      const targets = profile ? [...preview.querySelectorAll(profile.selector.split(', ').join(', .component-preview '))] : [];
      (targets.length ? targets : [preview.querySelector('.preview-fill')]).forEach((element, index) => {
        animate(element, profile?.effect || 'rise', Math.min(index, 6) * 105, manual);
      });
    }
  }

  const cards = [...root.querySelectorAll('.component')];
  cards.forEach((card, cardIdx) => {
    const entry = entryMap.get(card.id);
    const familyRecipes = entry ? recipes[entry.family] : null;
    const names = entry?.names || ['Основной сценарий', 'Динамический вход', 'Акцентная линия'];
    let activeIndex = 0;
    card.dataset.motionPreset = '0';

    const controls = document.createElement('div');
    controls.className = 'motion-controls';

    const presetsBar = document.createElement('div');
    presetsBar.className = 'motion-presets-bar';
    presetsBar.setAttribute('role', 'group');
    presetsBar.setAttribute('aria-label', 'Выбор сценария анимации');

    const pillButtons = names.map((name, idx) => {
      const pill = document.createElement('button');
      pill.type = 'button';
      pill.className = 'motion-preset-pill' + (idx === 0 ? ' is-active' : '');
      pill.setAttribute('data-preset-index', String(idx));
      pill.setAttribute('aria-pressed', idx === 0 ? 'true' : 'false');
      pill.title = `${getPresetTag(idx, cardIdx)} · ${name}`;
      pill.innerHTML = `<span class="motion-preset-num">0${idx + 1}</span><span class="motion-preset-name">${name}</span>`;
      return pill;
    });
    presetsBar.append(...pillButtons);

    const actionsBar = document.createElement('div');
    actionsBar.className = 'motion-actions-bar';

    const tagBadge = document.createElement('span');
    tagBadge.className = 'motion-tag-badge';
    tagBadge.textContent = getPresetTag(0, cardIdx);

    const replay = document.createElement('button');
    replay.type = 'button';
    replay.className = 'motion-replay';
    replay.innerHTML = '<span aria-hidden="true">↻</span> Смотреть моушн';
    replay.setAttribute('aria-label', 'Повторить анимацию ' + card.id);

    actionsBar.append(tagBadge, replay);
    controls.append(presetsBar, actionsBar);
    card.querySelector('.component-preview').after(controls);

    const details = card.querySelector('.component-details');
    const specs = document.createElement('div');
    specs.className = 'motion-specs';
    specs.innerHTML = `
      <div class="motion-tags-pill-row">
        <span class="motion-tag-badge">#Моушн-анимация</span>
        <span class="motion-tag-badge">#Круто</span>
        <span class="motion-tag-badge">#Шикаррно</span>
        <span class="motion-tag-badge">#Чтоя</span>
      </div>
      <p class="motion-spec-active"><strong>Активный моушн:</strong> <span class="motion-active-label">${names[0]} (${getPresetTag(0, cardIdx)})</span> — <span class="motion-active-desc">${familyRecipes?.[0]?.description || 'Мягкое появление содержимого.'}</span></p>
      <div class="motion-spec-options">
        <div><strong>01 · #Моушн-анимация:</strong> «${names[0]}» — ${familyRecipes?.[0]?.description || 'Базовый моушн'}</div>
        <div><strong>02 · #Круто:</strong> «${names[1]}» — ${familyRecipes?.[1]?.description || 'Динамический моушн'}</div>
        <div><strong>03 · ${getPresetTag(2, cardIdx)}:</strong> «${names[2]}» — ${familyRecipes?.[2]?.description || 'Выразительный моушн'}</div>
      </div>
    `;
    details.append(specs);

    function setPreset(idx, autoPlay = true) {
      activeIndex = idx;
      card.dataset.motionPreset = String(idx);
      pillButtons.forEach((btn, i) => {
        btn.classList.toggle('is-active', i === idx);
        btn.setAttribute('aria-pressed', i === idx ? 'true' : 'false');
      });
      tagBadge.textContent = getPresetTag(idx, cardIdx);
      const activeLabel = specs.querySelector('.motion-active-label');
      const activeDesc = specs.querySelector('.motion-active-desc');
      if (activeLabel) activeLabel.textContent = `${names[idx]} (${getPresetTag(idx, cardIdx)})`;
      if (activeDesc) activeDesc.textContent = familyRecipes?.[idx]?.description || '';
      if (autoPlay) {
        seen.add(card);
        reveal(card, true, idx);
      }
    }

    pillButtons.forEach((btn, idx) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        setPreset(idx, true);
      });
    });

    replay.addEventListener('click', (e) => {
      e.stopPropagation();
      card.querySelector('.component-preview').scrollIntoView({block: 'center', behavior: 'instant'});
      seen.add(card);
      requestAnimationFrame(() => requestAnimationFrame(() => reveal(card, true, activeIndex)));
    });

    card.dataset.motionEffect = familyRecipes?.[0]?.tracks?.[0]?.effect || 'rise';
  });

  function syncPreference() {
    root.dataset.motion = mode === 'off' ? 'off' : isFull() ? 'full' : 'reduced';
    root.querySelectorAll('.motion-replay, .motion-preset-pill').forEach(button => {
      button.disabled = mode === 'off' || !Element.prototype.animate;
      button.title = mode === 'off' ? 'Выберите режим движения выше каталога' : button.title || 'Запустить анимацию';
    });
    stage.querySelector('.motion-mode-hint').textContent = mode === 'off' ? 'Анимации выключены. Выберите другой режим, чтобы включить просмотр.' : isFull() ? 'Эффекты включены. Выбирайте из 3 вариантов каждого элемента, наводите курсор или запускайте повтор.' : 'Устройство ограничивает движение. Полный эффект доступен по кнопкам вариантов или в режиме «Полная анимация».';
    if (!isFull()) stop();
  }

  function stop() {
    running.forEach(animation => animation.cancel());
    running.clear();
    root.querySelectorAll('.motion-sweep, .motion-ripple, .motion-deco-layer').forEach(element => element.remove());
    root.querySelectorAll('[data-pointer-active]').forEach(element => {
      element.removeAttribute('data-pointer-active');
      element.style.removeProperty('--tilt-x');
      element.style.removeProperty('--tilt-y');
    });
  }

  preference.addEventListener('change', syncPreference);
  modeSelect.addEventListener('change', () => {
    stop();
    mode = modeSelect.value;
    try { localStorage.setItem('alasster-motion', mode); } catch {}
    syncPreference();
    if (isFull()) {
      cards.filter(visible).forEach(card => reveal(card));
      animate(stage.querySelector('.motion-studio-mark'), 'orbit');
    }
  });
  syncPreference();

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(({target, isIntersecting}) => {
        target.dataset.motionVisible = String(isIntersecting);
        if (isIntersecting && !seen.has(target)) {
          seen.add(target);
          reveal(target);
        }
        if (!isIntersecting) {
          running.forEach((animation, element) => {
            if (target.contains(element)) animation.cancel();
          });
        }
      });
    }, {threshold: 0});
    cards.forEach(card => observer.observe(card));

    const ambient = new IntersectionObserver(entries => {
      entries.forEach(({target, isIntersecting}) => {
        target.dataset.ambientVisible = String(isIntersecting);
      });
    });
    [stage, root.querySelector('.hero-showcase')].filter(Boolean).forEach(element => ambient.observe(element));
  } else {
    cards.forEach(card => reveal(card));
  }

  const updates = '[data-slide-tag], [data-slide-title], [data-slide-description], [data-slide-count], [data-step-label], [data-switch-state], [data-dropdown-label], [data-filter-result], [data-page-result], [data-load-state], [data-greeting], [data-drawer-summary], [data-lesson-results], [data-attachment-status], [data-video-status], #feedback-result, [data-sort-table] tbody';
  const results = new MutationObserver(records => {
    const changed = new Set();
    records.forEach(record => {
      const element = record.target.nodeType === Node.ELEMENT_NODE ? record.target : record.target.parentElement;
      const result = element.closest(updates);
      if (result) changed.add(result);
    });
    changed.forEach(element => {
      if (element.matches('tbody')) [...element.rows].forEach((row, index) => animate(row, 'wave', index * 75));
      else animate(element, element.matches('[data-slide-title], [data-slide-description]') ? 'text' : 'rise');
    });
  });
  root.querySelectorAll(updates).forEach(element => results.observe(element, {childList: true, characterData: true, subtree: true}));

  ['.library-header', '.hero-copy > *', '.hero-showcase', '.usage-strip'].forEach(selector => {
    root.querySelectorAll(selector).forEach((element, index) => animate(element, 'rise', Math.min(index, 4) * 65));
  });

  function decorate(element, keyframes, options, cleanup) {
    if (!element.animate) { cleanup(); return; }
    const animation = element.animate(keyframes, options);
    running.set(element, animation);
    const finish = () => { running.delete(element); cleanup(); };
    animation.onfinish = finish;
    animation.oncancel = finish;
  }

  function illuminate(card) {
    const preview = card.querySelector('.component-preview');
    const old = preview.querySelector('.motion-sweep');
    if (old) { running.get(old.firstElementChild)?.cancel(); old.remove(); }
    const sweep = document.createElement('span');
    sweep.className = 'motion-sweep';
    sweep.setAttribute('aria-hidden', 'true');
    const light = document.createElement('i');
    sweep.append(light);
    preview.append(sweep);
    decorate(light, [
      {translate: '-140% 0', opacity: 0},
      {translate: '0% 0', opacity: .8, offset: .5},
      {translate: '140% 0', opacity: 0}
    ], {duration: 1350, easing: 'cubic-bezier(.2,.65,.3,1)'}, () => sweep.remove());
  }

  root.addEventListener('click', event => {
    const button = event.target.closest('.ui-btn, .ui-icon-btn, .ui-chip, .ui-page, .motion-replay');
    if (!isFull() || !button || button.disabled || !button.animate) return;
    button.querySelectorAll('.motion-ripple').forEach(el => { running.get(el)?.cancel(); el.remove(); });
    const box = button.getBoundingClientRect();
    const ripple = document.createElement('span');
    ripple.className = 'motion-ripple';
    ripple.setAttribute('aria-hidden', 'true');
    const size = Math.max(box.width, box.height) * 2;
    const x = event.detail ? event.clientX - box.left : box.width / 2;
    const y = event.detail ? event.clientY - box.top : box.height / 2;
    Object.assign(ripple.style, {width: size + 'px', height: size + 'px', left: (x - size / 2) + 'px', top: (y - size / 2) + 'px'});
    button.append(ripple);
    decorate(ripple, [{scale: 0, opacity: .65}, {scale: 1, opacity: 0}], {duration: 650, easing: 'ease-out'}, () => ripple.remove());
  });

  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  let tiltTarget = null;
  let pointerFrame = 0;
  let pointerX = 0;
  let pointerY = 0;
  function clearTilt() {
    if (tiltTarget) {
      tiltTarget.removeAttribute('data-pointer-active');
      tiltTarget.style.removeProperty('--tilt-x');
      tiltTarget.style.removeProperty('--tilt-y');
      tiltTarget.style.removeProperty('--light-x');
      tiltTarget.style.removeProperty('--light-y');
    }
    tiltTarget = null;
  }
  root.addEventListener('pointermove', event => {
    if (!isFull() || !finePointer.matches || event.pointerType === 'touch') return;
    const target = event.target.closest('.ui-card, .ui-art, .ui-pattern, .hero-showcase');
    if (target !== tiltTarget) { clearTilt(); tiltTarget = target; }
    if (!target) return;
    pointerX = event.clientX;
    pointerY = event.clientY;
    if (!pointerFrame) pointerFrame = requestAnimationFrame(() => {
      pointerFrame = 0;
      if (!tiltTarget || !isFull() || document.hidden) return;
      const bounds = tiltTarget.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (pointerX - bounds.left) / bounds.width));
      const y = Math.max(0, Math.min(1, (pointerY - bounds.top) / bounds.height));
      tiltTarget.dataset.pointerActive = '';
      tiltTarget.style.setProperty('--tilt-x', ((.5 - y) * 7) + 'deg');
      tiltTarget.style.setProperty('--tilt-y', ((x - .5) * 9) + 'deg');
      tiltTarget.style.setProperty('--light-x', (x * 100) + '%');
      tiltTarget.style.setProperty('--light-y', (y * 100) + '%');
    });
  }, {passive: true});
  root.addEventListener('pointerleave', clearTilt);
  window.addEventListener('blur', clearTilt);

  document.addEventListener('visibilitychange', () => {
    root.toggleAttribute('data-motion-paused', document.hidden);
    if (document.hidden) stop();
  });
  window.addEventListener('beforeprint', stop);
  window.addEventListener('pagehide', stop);
})();
