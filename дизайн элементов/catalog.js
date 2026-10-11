/* Поведение каталога изолировано от скриптов главной страницы. */
'use strict';
const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
const escapeHTML = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const search = $('#catalog-search');
const kind = $('#catalog-kind');
let toastTimer;
function toast(message) {
  const region = $('#toast-region');
  region.replaceChildren();
  const box = document.createElement('div');
  box.className = 'ui-toast';
  const icon = document.createElement('span');
  icon.setAttribute('aria-hidden','true');
  icon.textContent = '✓';
  const text = document.createElement('span');
  text.textContent = message;
  box.append(icon,text);
  region.append(box);
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => region.replaceChildren(), 4500);
}
async function copyText(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) await navigator.clipboard.writeText(text);
    else {
      const helper = document.createElement('textarea');
      helper.value = text;
      helper.style.cssText = 'position:fixed;left:-9999px;top:0';
      helper.setAttribute('readonly','');
      document.body.append(helper);
      const previous = document.activeElement;
      helper.select();
      const copied = document.execCommand('copy');
      helper.remove();
      previous?.focus({preventScroll:true});
      if (!copied) throw new Error('Copy unavailable');
    }
    toast('Скопировано. Можно вставить в следующий запрос.');
  } catch {
    const dialog = document.createElement('dialog');
    dialog.className = 'ui-dialog';
    dialog.setAttribute('aria-label','Текст для ручного копирования');
    const title = document.createElement('h2');
    title.textContent = 'Скопируйте текст';
    const hint = document.createElement('p');
    hint.textContent = 'Автоматическое копирование недоступно. Выделите текст и нажмите Ctrl+C или удерживайте поле на телефоне.';
    const input = document.createElement('textarea');
    input.className = 'ui-input';
    input.value = text;
    input.readOnly = true;
    const close = document.createElement('button');
    close.className = 'ui-btn ui-btn-soft';
    close.textContent = 'Закрыть';
    close.addEventListener('click', () => dialog.close());
    dialog.append(title,hint,input,close);
    document.body.append(dialog);
    dialog.addEventListener('close',()=>dialog.remove(),{once:true});
    dialog.showModal();
    input.select();
  }
}

$('#category-nav').innerHTML = '<a class="category-link is-active" href="#catalog" data-all-categories><span class="cat-icon">▦</span>Все элементы<span class="cat-count">'+COMPONENTS.length+'</span></a>' +
  CATEGORIES.map(cat=>'<a class="category-link" href="#'+cat.id+'"><span class="cat-icon" aria-hidden="true">'+cat.icon+'</span>'+cat.name+'<span class="cat-count">'+COMPONENTS.filter(c=>c.category===cat.id).length+'</span></a>').join('');
$('#total-count').textContent = COMPONENTS.length;
$('#catalog-sections').innerHTML = CATEGORIES.map((cat,i)=>{
  const items = COMPONENTS.filter(c=>c.category===cat.id);
  return '<section class="component-section" id="'+cat.id+'" aria-labelledby="'+cat.id+'-heading"><div class="section-heading"><span class="section-index" aria-hidden="true">0'+(i+1)+'</span><div><h2 id="'+cat.id+'-heading">'+cat.name+'</h2><p>'+cat.description+'</p></div><span class="section-total">'+String(items.length).padStart(2,'0')+' прим.</span></div><div class="component-grid">' +
    items.map(c=>'<article class="component'+(c.wide?' wide':'')+'" id="'+c.id+'" aria-labelledby="'+c.id+'-name"><div class="component-preview"><div class="preview-fill">'+c.html+'</div></div><div class="component-info"><div class="component-name-row"><div><a class="component-code" href="#'+c.id+'" aria-label="Ссылка на '+c.id+'">'+c.id+(c.interactive?'<span class="live-dot" title="Интерактивный пример"></span>':'')+'</a><h3 id="'+c.id+'-name">'+c.name+'</h3></div><button type="button" class="component-copy" data-copy-component="'+c.id+'" aria-label="Скопировать '+c.id+' · '+c.name+'" title="Скопировать название">'+UI_ICONS.copy+'</button></div><p class="component-description">'+c.description+'</p><details class="component-details"><summary>Как использовать</summary><p>В запросе: «Используй <strong>'+c.id+' · '+c.name+'</strong>».</p><p>Классы и ориентиры: <code>'+escapeHTML(c.classes)+'</code></p><p><a class="text-link" href="#'+c.id+'">Прямая ссылка ↗</a></p></details></div></article>').join('')+'</div></section>';
}).join('');

const normalize = value => value.toLocaleLowerCase('ru').replace(/ё/g,'е').replace(/[–—]/g,'-').trim();
function filterCatalog() {
  const terms = normalize(search.value).split(/\s+/).filter(Boolean);
  let total = 0;
  COMPONENTS.forEach(c=>{
    const category = CATEGORIES.find(cat=>cat.id===c.category);
    const haystack = normalize([c.id,c.name,c.description,c.classes,category.name].join(' '));
    const show = terms.every(term=>haystack.includes(term)) && (kind.value==='all' || c.interactive===(kind.value==='interactive'));
    document.getElementById(c.id).hidden = !show;
    if (show) total++;
  });
  CATEGORIES.forEach(cat=>{
    const section = document.getElementById(cat.id);
    const visible = $$('.component:not([hidden])',section).length;
    section.hidden = visible===0;
    $('.section-total',section).textContent = visible+' прим.';
  });
  $('#result-count').textContent = total===COMPONENTS.length ? 'Все '+total+' примеров · нажимайте, переключайте, пробуйте' : 'Показано '+total+' из '+COMPONENTS.length+' примеров';
  $('#empty-results').hidden = total>0;
  $('#reset-filters').hidden = !search.value && kind.value==='all';
  if ($('#SLD-01').hidden) stopAutoplay();
}
function resetFilters() { search.value=''; kind.value='all'; filterCatalog(); }
search.addEventListener('input',filterCatalog);
kind.addEventListener('change',filterCatalog);
$('#reset-filters').addEventListener('click',resetFilters);

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const slides = [
  {tag:'01 / Основы',title:'Начните с алгоритма',description:'Любую большую задачу можно разбить на маленькие понятные шаги.'},
  {tag:'02 / Практика',title:'Превратите идею в код',description:'Попробуйте, проверьте результат и сделайте следующий шаг.'},
  {tag:'03 / Результат',title:'Создайте свой проект',description:'Соедините новые навыки и покажите, чему вы научились.'}
];
let slideIndex=0;
let autoplayTimer=null;
function renderSlide(announce=true) {
  const slide=slides[slideIndex];
  $$('[data-slide-tag]').forEach(el=>el.textContent=slide.tag);
  $$('[data-slide-title]').forEach(el=>el.textContent=slide.title);
  $$('[data-slide-description]').forEach(el=>el.textContent=slide.description);
  $$('[data-slide-count]').forEach(el=>el.innerHTML='<b>0'+(slideIndex+1)+'</b> / 03');
  $$('[data-slide-to]').forEach(el=>el.setAttribute('aria-current',String(Number(el.dataset.slideTo)===slideIndex)));
  $('#main-slide').setAttribute('aria-label',(slideIndex+1)+' из 3');
  if (announce) $('#slider-announcement').textContent='Слайд '+(slideIndex+1)+' из 3. '+slide.title;
}
function updateAutoplayButtons() {
  $$('[data-autoplay]').forEach(el=>{
    el.setAttribute('aria-pressed',String(Boolean(autoplayTimer)));
    el.textContent=autoplayTimer?'Ⅱ Пауза':'▶ Автопрокрутка';
  });
}
function stopAutoplay() { if (autoplayTimer) clearInterval(autoplayTimer); autoplayTimer=null; updateAutoplayButtons(); }
function toggleAutoplay() {
  if (autoplayTimer) return stopAutoplay();
  if ($('#SLD-01').hidden) {
    resetFilters();
    $('#SLD-01').scrollIntoView({behavior:reducedMotion.matches?'instant':'smooth',block:'center'});
  }
  autoplayTimer=setInterval(()=>{slideIndex=(slideIndex+1)%slides.length;renderSlide(false);},5000);
  updateAutoplayButtons();
}
$('.ui-slider').addEventListener('pointerenter',stopAutoplay);
$('.ui-slider').addEventListener('focusin',stopAutoplay);
document.addEventListener('visibilitychange',()=>{if(document.hidden)stopAutoplay();});
reducedMotion.addEventListener('change',stopAutoplay);
filterCatalog();

let lastDialogTrigger=null;
function openDialog(id,trigger) {
  lastDialogTrigger=trigger;
  $('#'+id).showModal();
  document.body.style.overflow='hidden';
}
$$('dialog').forEach(dialog=>{
  dialog.addEventListener('click',event=>{
    if(event.target!==dialog)return;
    const box=dialog.getBoundingClientRect();
    if(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom)dialog.close();
  });
  dialog.addEventListener('close',()=>{
    document.body.style.overflow='';
    lastDialogTrigger?.focus({preventScroll:true});
  });
});
function ensureHashVisible() {
  let id;
  try { id=decodeURIComponent(location.hash.slice(1)); } catch { return; }
  const target=document.getElementById(id);
  if(!target)return;
  if(target.hidden || target.closest('[hidden]')) resetFilters();
  if (id!=='catalog') target.scrollIntoView({block:'start'});
}
window.addEventListener('hashchange',ensureHashVisible);
if(location.hash) requestAnimationFrame(ensureHashVisible);

document.addEventListener('click',async event=>{
  const target=event.target.closest('button,a,[data-close-dialog]');
  if(!target)return;
  if(target.hasAttribute('data-copy-component')) {
    const item=COMPONENTS.find(c=>c.id===target.dataset.copyComponent);
    await copyText(item.id+' · '+item.name);
  }
  if(target.hasAttribute('data-copy-text')) await copyText(target.dataset.copyText);
  if(target.hasAttribute('data-demo')) toast('Демо: «'+target.dataset.demo+'». Здесь будет действие вашей страницы.');
  if(target.hasAttribute('data-reset') || target.hasAttribute('data-all-categories')) {
    resetFilters();
    if(target.hasAttribute('data-reset')) { $('#catalog').scrollIntoView(); search.focus({preventScroll:true}); }
  }
  if(target.closest('#category-nav')) {
    const targetId=target.getAttribute('href')?.slice(1);
    if(targetId && document.getElementById(targetId)?.hidden) resetFilters();
  }
  if(target.hasAttribute('data-open-dialog')) openDialog(target.dataset.openDialog,target);
  if(target.hasAttribute('data-close-dialog')) target.closest('dialog').close();
  if(target.hasAttribute('data-confirm-modal')) { $('#demo-modal').close(); toast('Пример завершён. Можно продолжить просмотр.'); }
  if(target.hasAttribute('data-save-drawer')) {
    const drawer=$('#demo-drawer');
    const name=$('input',drawer).value.trim();
    if(!name) { $('input',drawer).focus(); $('input',drawer).setCustomValidity('Введите название урока'); $('input',drawer).reportValidity(); return; }
    $('[data-drawer-summary]').textContent=name+' · '+$('select',drawer).value;
    drawer.close();
    toast('Параметры применены к примеру боковой панели.');
  }
  if(target.hasAttribute('data-toast-demo')) toast('Изменения сохранены — пример уведомления.');
  if(target.hasAttribute('data-go-top') || target.classList.contains('back-to-top')) window.scrollTo({top:0,behavior:reducedMotion.matches?'instant':'smooth'});
  if(target.hasAttribute('data-step')) {
    const box=target.closest('[data-step-demo]');
    const next=Number(box.dataset.current||1)+Number(target.dataset.step);
    box.dataset.current=next;
    $('[data-step-label]',box).textContent='Шаг '+next+' из 3';
    $('[data-step="-1"]',box).disabled=next===1;
    $('[data-step="1"]',box).disabled=next===3;
  }
  if(target.hasAttribute('data-dropdown-option')) {
    const dropdown=target.closest('details');
    $('[data-dropdown-label]',dropdown).textContent=target.dataset.dropdownOption;
    dropdown.open=false;
    $('summary',dropdown).focus();
  }
  if(target.hasAttribute('data-demo-filter')) {
    const value=target.dataset.demoFilter;
    $$('[data-demo-filter]').forEach(el=>el.setAttribute('aria-pressed',String(el===target)));
    $('[data-filter-result]').textContent={Все:'3 материала: алгоритмы, переменные, первый код.',Теория:'2 материала: алгоритмы, переменные.',Практика:'1 материал: первый код.'}[value];
  }
  if(target.matches('[role="tab"]')) selectTab(target);
  if(target.hasAttribute('data-page')) {
    $$('[data-page]').forEach(el=>el.removeAttribute('aria-current'));
    target.setAttribute('aria-current','page');
    const page=Number(target.dataset.page);
    $('[data-page-result]').textContent='Материалы '+((page-1)*3+1)+'–'+(page*3)+' из 12';
  }
  if(target.hasAttribute('data-load-demo')) {
    target.disabled=true;
    $('[data-load-state]').innerHTML='<span class="ui-spinner" aria-hidden="true"></span><span class="ui-muted">Загружаем пример…</span>';
    setTimeout(()=>{ $('[data-load-state]').innerHTML='<span class="ui-badge teal">✓ Пример загружен</span>';target.disabled=false;},1200);
  }
  if(target.hasAttribute('data-slide-prev')||target.hasAttribute('data-slide-next')||target.hasAttribute('data-slide-to')) {
    stopAutoplay();
    slideIndex=target.hasAttribute('data-slide-to')?Number(target.dataset.slideTo):(slideIndex+(target.hasAttribute('data-slide-next')?1:-1)+slides.length)%slides.length;
    renderSlide();
  }
  if(target.hasAttribute('data-autoplay')) toggleAutoplay();
  if(target.hasAttribute('data-language')) {
    const lang=target.dataset.language;
    $$('[data-language]').forEach(el=>el.setAttribute('aria-pressed',String(el===target)));
    const greeting=$('[data-greeting]');
    greeting.lang=lang;
    greeting.textContent={ru:'Добро пожаловать!',kk:'Қош келдіңіз!',en:'Welcome!'}[lang];
  }
  if(target.hasAttribute('data-theme-toggle')) {
    const dark=target.closest('.ui-theme-sample').classList.toggle('is-dark');
    target.setAttribute('aria-pressed',String(dark));
    target.textContent=dark?'☀':'☾';
  }
  if(target.hasAttribute('data-sort-column')) {
    const table=target.closest('table');
    const th=target.closest('th');
    const ascending=th.getAttribute('aria-sort')!=='ascending';
    const rows=$$('tbody tr',table).sort((a,b)=>a.cells[1].textContent.localeCompare(b.cells[1].textContent,'ru')*(ascending?1:-1));
    $('tbody',table).append(...rows);
    th.setAttribute('aria-sort',ascending?'ascending':'descending');
    target.textContent='Тема '+(ascending?'↑':'↓');
  }
  if(target.hasAttribute('data-copy-code')) await copyText('name = "Мир"\nprint(f"Привет, {name}!")');
  if(target.hasAttribute('data-copy-url')) await copyText(new URL('index.html',location.href).href);
  if(target.hasAttribute('data-share')) {
    const url=new URL('index.html',location.href).href;
    if(navigator.share && /^https?:$/.test(location.protocol)) {
      try { await navigator.share({title:'Дизайн элементов · ALASSTER',url}); }
      catch(error) { if(error.name!=='AbortError') await copyText(url); }
    } else await copyText(url);
  }
});
$('#demo-drawer input').addEventListener('input',event=>event.target.setCustomValidity(''));
$('[data-switch-demo]').addEventListener('change',event=>$('[data-switch-state]').textContent=event.target.checked?'включены':'выключены');

function selectTab(tab) {
  const tabs=$$('[role="tab"]',tab.closest('[role="tablist"]'));
  tabs.forEach(el=>{
    const selected=el===tab;
    el.setAttribute('aria-selected',String(selected));
    el.tabIndex=selected?0:-1;
    document.getElementById(el.getAttribute('aria-controls')).hidden=!selected;
  });
}
document.addEventListener('keydown',event=>{
  const inputLike=event.target.closest('input,textarea,select,[contenteditable="true"]');
  if(event.key==='/'&&!inputLike&&!$('dialog[open]')) { event.preventDefault(); search.focus(); }
  if(event.key==='Escape') {
    $$('.ui-dropdown[open]').forEach(el=>{el.open=false;$('summary',el).focus();});
    $$('.ui-tooltip-wrap').forEach(el=>el.classList.add('dismissed'));
  }
  if(event.target.matches('[role="tab"]') && ['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) {
    event.preventDefault();
    const tabs=$$('[role="tab"]',event.target.closest('[role="tablist"]'));
    const current=tabs.indexOf(event.target);
    const index=event.key==='Home'?0:event.key==='End'?tabs.length-1:(current+(event.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;
    selectTab(tabs[index]);tabs[index].focus();
  }
});
$$('.ui-tooltip-wrap').forEach(el=>{
  el.addEventListener('pointerleave',()=>el.classList.remove('dismissed'));
  el.addEventListener('focusout',()=>el.classList.remove('dismissed'));
});
document.addEventListener('pointerdown',event=>{
  $$('.ui-dropdown[open]').forEach(el=>{if(!el.contains(event.target))el.open=false;});
});
$('[data-lesson-search]').addEventListener('input',event=>{
  const lessons=['Введение в Python','Компьютерные сети','Алгоритмы'];
  const found=lessons.filter(s=>normalize(s).includes(normalize(event.target.value)));
  $('[data-lesson-results]').replaceChildren(...(found.length?found:['Ничего не найдено. Попробуйте другую тему.']).map(text=>{
    const el=document.createElement('span');el.className='ui-muted';el.textContent=text;return el;
  }));
});

$('#feedback-demo').addEventListener('submit',event=>{
  event.preventDefault();
  const checks=[
    {id:'feedback-name',error:'name-error',valid:el=>el.value.trim().length>=2,message:'Укажите имя: не менее 2 символов.'},
    {id:'feedback-email',error:'email-error',valid:el=>el.value.trim()!==''&&el.validity.valid,message:'Введите электронную почту в формате name@example.com.'},
    {id:'feedback-message',error:'message-error',valid:el=>el.value.trim().length>=10,message:'Добавьте сообщение: не менее 10 символов.'}
  ];
  let firstInvalid=null;
  checks.forEach(check=>{
    const el=document.getElementById(check.id);
    const error=document.getElementById(check.error);
    const valid=check.valid(el);
    el.setAttribute('aria-invalid',String(!valid));
    error.hidden=valid;
    error.textContent=valid?'':check.message;
    if(!valid&&!firstInvalid)firstInvalid=el;
  });
  $('#feedback-result').textContent=firstInvalid?'Проверьте выделенные поля.':'Форма заполнена верно. Это демонстрация: сообщение не отправлено.';
  if(firstInvalid) firstInvalid.focus(); else toast('Поля проверены. Данные никуда не отправлены.');
});
$('#feedback-demo').addEventListener('input',event=>{
  if(event.target.hasAttribute('aria-invalid')) {
    event.target.removeAttribute('aria-invalid');
    const error=document.getElementById(event.target.getAttribute('aria-describedby'));
    if(error)error.hidden=true;
    $('#feedback-result').textContent='';
  }
});

let videoURL;
$('[data-video-file]').addEventListener('change',event=>{
  const file=event.target.files[0];
  if(videoURL)URL.revokeObjectURL(videoURL);
  const video=$('.ui-video');
  video.pause();
  video.removeAttribute('src');
  video.load();
  if(!file) { $('[data-video-status]').textContent='Файл не выбран.'; return; }
  if(file.type && !file.type.startsWith('video/')) { $('[data-video-status]').textContent='Выберите видеофайл.';return; }
  videoURL=URL.createObjectURL(file);
  video.src=videoURL;
  $('[data-video-status]').textContent=file.name+' · нажмите ▶ для просмотра';
});
$('.ui-video').addEventListener('error',()=>{$('[data-video-status]').textContent='Браузер не смог воспроизвести этот формат. Попробуйте MP4 или WebM.';});
window.addEventListener('pagehide',()=>{if(videoURL)URL.revokeObjectURL(videoURL);stopAutoplay();});
$('[data-attachment]').addEventListener('change',event=>{
  const file=event.target.files[0];
  $('[data-attachment-status]').textContent=file?file.name+' · '+(file.size/1024).toFixed(1)+' КБ · выбран локально':'Файл пока не выбран.';
});

let scrollScheduled=false;
function updateScrollUI() {
  $('.back-to-top').hidden=window.scrollY<600;
  const sections=$$('.component-section:not([hidden])');
  let current='catalog';
  for(const section of sections) if(section.getBoundingClientRect().top<200)current=section.id;
  $$('#category-nav a').forEach(link=>{
    const active=link.getAttribute('href')==='#'+current;
    link.classList.toggle('is-active',active);
    if(active)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');
  });
  scrollScheduled=false;
}
window.addEventListener('scroll',()=>{if(!scrollScheduled){requestAnimationFrame(updateScrollUI);scrollScheduled=true;}},{passive:true});
updateScrollUI();
