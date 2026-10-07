let lastModalTrigger = null;

document.querySelector('.mobile-burger-btn').addEventListener('click', toggleNavMenu);
document.querySelectorAll('[data-class-id]').forEach(button => {
  button.addEventListener('click', () => showClassModal(button.dataset.classId));
});
document.querySelector('.btn-close-modal').addEventListener('click', hideClassModal);
document.getElementById('modal-backdrop-el').addEventListener('click', event => {
  if (event.target === event.currentTarget) hideClassModal();
});
/* Complete Curriculum Data */
const LESSONS_DATABASE = {
  c11: {
    title: "11 класс • Нейронные сети и ИИ",
    lessons: [
      { num: 1, title: "Искусственные нейронные сети", path: "11 класс/1 четверть/1 урок.html" },
      { num: 2, title: "Задачи нейронных сетей", path: "11 класс/1 четверть/2 урок.html" },
      { num: 3, title: "Классификация задач ИИ", path: "11 класс/1 четверть/3 урок.html" },
      { num: 4, title: "Классификация задач ИИ — практика", path: "11 класс/1 четверть/4 урок.html" },
      { num: 5, title: "Управление приложением жестами", path: "11 класс/1 четверть/5 урок.html" },
      { num: 6, title: "Основы моделирования нейронных сетей", path: "11 класс/1 четверть/6 урок.html" }
    ]
  },
  c10emn: {
    title: "10 класс ЕМН • Машинное обучение",
    lessons: [
      { num: "1-2", title: "История развития искусственного интеллекта", path: "10 ЕМН/1 четверть/1 -2 урок.html" },
      { num: 3, title: "Основные понятия машинного обучения", path: "10 ЕМН/1 четверть/3 урок.html" },
      { num: 4, title: "Практика: понятия машинного обучения", path: "10 ЕМН/1 четверть/4 урок.html" },
      { num: 5, title: "Перцептрон и его назначение", path: "10 ЕМН/1 четверть/5 урок.html" },
      { num: 6, title: "Практика: перцептрон в Excel", path: "10 ЕМН/1 четверть/6 урок.html" },
      { num: 7, title: "Практика: однослойный перцептрон в Excel", path: "10 ЕМН/1 четверть/7 урок.html" },
      { num: 8, title: "Модели машинного обучения", path: "10 ЕМН/1 четверть/8 урок.html" },
      { num: 9, title: "Управление приложением жестами", path: "10 ЕМН/1 четверть/9 урок.html" },
      { num: 10, title: "Алгоритмы МО: k-NN (Ближайшие соседи)", path: "10 ЕМН/1 четверть/10 урок.html" }
    ]
  },
  c10ogn: {
    title: "10 класс ОГН • Информационные технологии",
    lessons: [
      { num: 1, title: "История развития искусственного интеллекта", path: "10 ОГН/1 четверть/1 урок.html" },
      { num: 2, title: "Основные понятия машинного обучения", path: "10 ОГН/1 четверть/2 урок.html" },
      { num: 3, title: "Модели машинного обучения", path: "10 ОГН/1 четверть/3 урок.html" },
      { num: 4, title: "Проектная мастерская: презентация о МО", path: "10 ОГН/1 четверть/4 урок.html" },
      { num: 5, title: "Перцептрон и его назначение", path: "10 ОГН/1 четверть/5 урок.html" },
      { num: 6, title: "Практика: перцептрон в Excel", path: "10 ОГН/1 четверть/6 урок.html" }
    ]
  },
  c9: {
    title: "9 класс • Компьютерные сети",
    lessons: [
      { num: 1, title: "Социальные и этические аспекты ИИ", path: "9 класс/1 четверть/1 урок.html" },
      { num: 2, title: "IP-адрес компьютера", path: "9 класс/1 четверть/2 урок.html" },
      { num: 3, title: "IP-адрес и сетевые протоколы", path: "9 класс/1 четверть/3 урок.html" },
      { num: 4, title: "IP-адрес. Маска подсети", path: "9 класс/1 четверть/4 урок.html" },
      { num: 5, title: "Доменная система имён (DNS)", path: "9 класс/1 четверть/5 урок.html" },
      { num: 6, title: "Определение пропускной способности сети", path: "9 класс/1 четверть/6 урок.html" }
    ]
  },
  c8: {
    title: "8 класс • Архитектура и безопасность",
    lessons: [
      { num: 2, title: "Алфавитный подход к измерению информации", path: "8 класс/1 четверть/2 урок.html" },
      { num: 3, title: "Процессор — мозг компьютера", path: "8 класс/1 четверть/3 урок.html" },
      { num: 4, title: "Компьютерные сети: Пропускная способность", path: "8 класс/1 четверть/4 урок.html" },
      { num: 5, title: "Практические задания по компьютерным сетям", path: "8 класс/1 четверть/5 Урок.html" },
      { num: 6, title: "Негативные аспекты работы на компьютере", path: "8 класс/1 четверть/6 урок.html" },
      { num: 7, title: "Безопасность в интернете", path: "8 класс/1 четверть/7 урок.html" },
      { num: 8, title: "Мошенничество в интернете", path: "8 класс/1 четверть/8 урок.html" }
    ]
  },
  cextra: {
    title: "Дополнительно • Python Практикум",
    lessons: [
      { num: 1, title: "Python: Введение и Основы", path: "Python основы/1.Основа.html" },
      { num: 2, title: "Python: Вывод данных (print)", path: "Python основы/2.print.html" },
      { num: 3, title: "Python: Переменные и память", path: "Python основы/3.Переменные.html" },
      { num: 4, title: "Python: Типы данных", path: "Python основы/4.Типы.html" },
      { num: 5, title: "Python: Ввод данных (input)", path: "Python основы/5.Input.html" },
      { num: 6, title: "Python: Математические операции", path: "Python основы/6.Математика.html" },
      { num: 7, title: "Python: Логические выражения", path: "Python основы/7.Логика.html" },
      { num: 8, title: "Python: Условные конструкции", path: "Python основы/8.Условия.html" },
      { num: 9, title: "Python: Цикл for", path: "Python основы/9.For.html" },
      { num: 10, title: "Python: Цикл while", path: "Python основы/10.While.html" },
      { num: 11, title: "Python: Списки (List)", path: "Python основы/11.Списки.html" },
      { num: 12, title: "Python: Работа со списками", path: "Python основы/12.Работа со списками.html" },
      { num: 13, title: "Python: Строки (Strings)", path: "Python основы/13.Строки.html" },
      { num: 14, title: "Python: Функции (def)", path: "Python основы/14.Функции.html" },
      { num: 15, title: "Python: Работа с файлами", path: "Python основы/15.Файлы.html" },
      { num: "IDE", title: "Онлайн компилятор Python (Web IDE)", path: "свалка/python online.html" }
    ]
  }
};

function showClassModal(id) {
  const data = LESSONS_DATABASE[id];
  if (!data) return;

  lastModalTrigger = document.activeElement;
  closeNavMenu();
  const [className, topic] = data.title.split(' • ');
  document.getElementById('modal-heading-el').textContent = className;
  document.getElementById('modal-subtitle-el').textContent = topic;
  const list = document.getElementById('modal-lessons-list');
  list.innerHTML = '';
  list.scrollTop = 0;

  data.lessons.forEach(l => {
    const row = document.createElement('div');
    row.className = 'lesson-row-card';
    row.innerHTML = `
      <div class="lesson-badge-id">${l.num}</div>
      <div class="lesson-title-label">${l.title}</div>
      <a href="${encodeURI(l.path)}" class="btn-launch-lesson">
        <span>Открыть</span> <i class="fa-solid fa-arrow-right"></i>
      </a>
    `;
    list.appendChild(row);
  });

  const backdrop = document.getElementById('modal-backdrop-el');
  backdrop.inert = false;
  backdrop.classList.add('active');
  document.body.classList.add('modal-open');
  requestAnimationFrame(() => {
    if (backdrop.classList.contains('active')) {
      document.querySelector('.btn-close-modal').focus({ preventScroll: true });
    }
  });
  [...document.body.children].forEach(element => {
    if (element !== backdrop && element.tagName !== 'SCRIPT') element.inert = true;
  });
}

function hideClassModal() {
  const backdrop = document.getElementById('modal-backdrop-el');
  if (!backdrop.classList.contains('active')) return;
  backdrop.classList.remove('active');
  document.body.classList.remove('modal-open');
  [...document.body.children].forEach(element => {
    if (element !== backdrop) element.inert = false;
  });
  const trigger = lastModalTrigger?.closest('.nav-links-menu') && mobileNav.matches
    ? document.querySelector('.mobile-burger-btn')
    : lastModalTrigger;
  trigger?.focus({ preventScroll: true });
  backdrop.inert = true;
}

const mobileNav = window.matchMedia('(max-width: 860px)');

function closeNavMenu() {
  document.querySelector('.nav-links-menu').classList.remove('is-open');
  document.querySelector('.mobile-burger-btn').setAttribute('aria-expanded', 'false');
}

function toggleNavMenu() {
  const menu = document.querySelector('.nav-links-menu');
  const isOpen = menu.classList.toggle('is-open');
  document.querySelector('.mobile-burger-btn').setAttribute('aria-expanded', String(isOpen));
}

mobileNav.addEventListener('change', closeNavMenu);
document.addEventListener('click', event => {
  if (!event.target.closest('.navbar')) closeNavMenu();
});

document.addEventListener('keydown', event => {
  const backdrop = document.getElementById('modal-backdrop-el');
  if (event.key === 'Escape') {
    hideClassModal();
    if (document.querySelector('.nav-links-menu.is-open')) {
      closeNavMenu();
      document.querySelector('.mobile-burger-btn').focus();
    }
  }
  if (event.key === 'Tab' && backdrop.classList.contains('active')) {
    const focusable = [...backdrop.querySelectorAll('button, a[href]')];
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
});

/* ==========================================================================
   THREE.JS 3D MOTION OBJECTS (LIGHT-TONE 3D LAPTOP & FLOATING NODES)
   ========================================================================== */
(function initThreeScene() {
  const container = document.getElementById('stage-3d-container');
  const canvas = document.getElementById('three-canvas');
  if (!container || !canvas || typeof THREE === 'undefined') return;

  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 100);
  camera.position.set(0, 1.2, 6.4);
  camera.lookAt(0, 0.2, 0);

  const renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // Lighting: crisp bright studio lighting for light metallic materials
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.95);
  scene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
  dirLight.position.set(4, 7, 5);
  scene.add(dirLight);

  const light1 = new THREE.PointLight(0x6366F1, 2.2, 40);
  light1.position.set(4, 3, 3);
  scene.add(light1);

  const light2 = new THREE.PointLight(0x06B6D4, 2.0, 40);
  light2.position.set(-4, -1, 3);
  scene.add(light2);

  const light3 = new THREE.PointLight(0xF59E0B, 1.2, 30);
  light3.position.set(0, 4, -3);
  scene.add(light3);

  // Group that holds the laptop and gets mouse parallax
  const group = new THREE.Group();
  scene.add(group);

  // Helper: Texture for Screen (Informatics IDE)
  function createScreenTexture() {
    const cvs = document.createElement('canvas');
    cvs.width = 512;
    cvs.height = 320;
    const ctx = cvs.getContext('2d');

    // IDE editor background
    const grad = ctx.createLinearGradient(0, 0, 512, 320);
    grad.addColorStop(0, '#0F172A');
    grad.addColorStop(1, '#1E1B4B');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 320);

    // Title bar
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.fillRect(0, 0, 512, 36);

    // Traffic light dots
    ctx.fillStyle = '#EF4444';
    ctx.beginPath(); ctx.arc(22, 18, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#F59E0B';
    ctx.beginPath(); ctx.arc(38, 18, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#10B981';
    ctx.beginPath(); ctx.arc(54, 18, 5, 0, Math.PI * 2); ctx.fill();

    // Tab title
    ctx.fillStyle = '#94A3B8';
    ctx.font = 'bold 12px "JetBrains Mono", monospace';
    ctx.fillText('main.py — Информатика & ИИ', 76, 22);

    // Code lines
    ctx.font = '13px "JetBrains Mono", monospace';
    const lines = [
      { text: 'import ai, neural_network, python', color: '#A78BFA' },
      { text: '', color: '#CBD5E1' },
      { text: 'class Course:', color: '#38BDF8' },
      { text: '    def __init__(self):', color: '#F472B6' },
      { text: '        self.goal = "Учиться легко!"', color: '#34D399' },
      { text: '        self.grades = [9, 10, 11]', color: '#FDE047' },
      { text: '', color: '#CBD5E1' },
      { text: '    def start(self):', color: '#F472B6' },
      { text: '        return "Добро пожаловать!"', color: '#FCD34D' },
      { text: '', color: '#CBD5E1' },
      { text: '# ALASSTER.SITE', color: '#64748B' }
    ];

    let y = 64;
    lines.forEach((l, idx) => {
      ctx.fillStyle = '#475569';
      ctx.fillText(String(idx + 1).padStart(2, ' '), 16, y);
      ctx.fillStyle = l.color;
      ctx.fillText(l.text, 44, y);
      y += 22;
    });

    const tex = new THREE.CanvasTexture(cvs);
    return tex;
  }

  // Helper: Texture for Keyboard
  function createKeyboardTexture() {
    const cvs = document.createElement('canvas');
    cvs.width = 512;
    cvs.height = 220;
    const ctx = cvs.getContext('2d');

    // Base surface
    ctx.fillStyle = '#E2E8F0';
    ctx.fillRect(0, 0, 512, 220);

    const rows = 5;
    const cols = 14;
    const keyW = 31;
    const keyH = 34;
    const padX = 5;
    const padY = 6;

    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#CBD5E1';
    ctx.lineWidth = 1;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (r === 4 && c >= 4 && c <= 9) continue;
        const x = 10 + c * (keyW + padX);
        const y = 8 + r * (keyH + padY);
        ctx.fillRect(x, y, keyW, keyH);
        ctx.strokeRect(x, y, keyW, keyH);
      }
    }
    // Spacebar
    const sbX = 10 + 4 * (keyW + padX);
    const sbY = 8 + 4 * (keyH + padY);
    const sbW = (keyW + padX) * 6 - padX;
    ctx.fillRect(sbX, sbY, sbW, keyH);
    ctx.strokeRect(sbX, sbY, sbW, keyH);

    return new THREE.CanvasTexture(cvs);
  }

  // ==================== 3D LAPTOP IN LIGHT TONES ====================
  const laptop = new THREE.Group();

  // Material: Light Aluminum / Frosted Silver White
  const metalLightMat = new THREE.MeshStandardMaterial({
    color: 0xF1F5F9,
    roughness: 0.22,
    metalness: 0.35
  });

  // 1. BASE (Bottom Chassis)
  const baseChassis = new THREE.Mesh(
    new THREE.BoxGeometry(3.5, 0.1, 2.3),
    metalLightMat
  );
  baseChassis.position.set(0, -0.05, 0);
  laptop.add(baseChassis);

  // Keyboard Well & Keys
  const kbMat = new THREE.MeshBasicMaterial({ map: createKeyboardTexture() });
  const kbMesh = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 1.25), kbMat);
  kbMesh.rotation.x = -Math.PI / 2;
  kbMesh.position.set(0, 0.005, -0.36);
  laptop.add(kbMesh);

  // Trackpad
  const trackpad = new THREE.Mesh(
    new THREE.BoxGeometry(1.15, 0.005, 0.65),
    new THREE.MeshStandardMaterial({ color: 0xE2E8F0, roughness: 0.2, metalness: 0.3 })
  );
  trackpad.position.set(0, 0.004, 0.62);
  laptop.add(trackpad);

  // Hinge
  const hinge = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.05, 2.8, 16),
    new THREE.MeshStandardMaterial({ color: 0xCBD5E1, roughness: 0.3, metalness: 0.5 })
  );
  hinge.rotation.z = Math.PI / 2;
  hinge.position.set(0, 0.02, -1.14);
  laptop.add(hinge);

  // 2. LID / SCREEN (Upper Chassis)
  const lidGroup = new THREE.Group();
  lidGroup.position.set(0, 0.02, -1.14);

  // Lid back
  const lidBack = new THREE.Mesh(
    new THREE.BoxGeometry(3.5, 2.25, 0.06),
    metalLightMat
  );
  lidBack.position.set(0, 1.125, -0.03);
  lidGroup.add(lidBack);

  // Screen Bezel
  const bezel = new THREE.Mesh(
    new THREE.PlaneGeometry(3.46, 2.21),
    new THREE.MeshStandardMaterial({ color: 0x0F172A, roughness: 0.5 })
  );
  bezel.position.set(0, 1.125, 0.002);
  lidGroup.add(bezel);

  // Screen Display Canvas
  const screenMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(3.28, 2.02),
    new THREE.MeshBasicMaterial({ map: createScreenTexture() })
  );
  screenMesh.position.set(0, 1.125, 0.004);
  lidGroup.add(screenMesh);

  // Camera dot
  const camDot = new THREE.Mesh(
    new THREE.CircleGeometry(0.02, 16),
    new THREE.MeshBasicMaterial({ color: 0x06B6D4 })
  );
  camDot.position.set(0, 2.18, 0.006);
  lidGroup.add(camDot);

  // Open angle: ~110 degrees open
  lidGroup.rotation.x = -Math.PI * 0.16;
  laptop.add(lidGroup);

  // Initial tilt for perspective view
  laptop.rotation.x = 0.32;
  laptop.rotation.y = -0.52;
  group.add(laptop);

  // 3. Floating Glass Neural Nodes
  const icoGeo = new THREE.IcosahedronGeometry(0.5, 0);
  const icoMat = new THREE.MeshPhysicalMaterial({
    color: 0x06B6D4,
    emissive: 0x06B6D4,
    emissiveIntensity: 0.3,
    roughness: 0.2,
    metalness: 0.1,
    transparent: true,
    opacity: 0.75
  });
  const ico = new THREE.Mesh(icoGeo, icoMat);
  ico.position.set(-2.5, 1.4, 0.5);
  group.add(ico);

  const octGeo = new THREE.OctahedronGeometry(0.42, 0);
  const octMat = new THREE.MeshPhysicalMaterial({
    color: 0xA855F7,
    emissive: 0xA855F7,
    emissiveIntensity: 0.25,
    roughness: 0.2,
    transparent: true,
    opacity: 0.8
  });
  const oct = new THREE.Mesh(octGeo, octMat);
  oct.position.set(2.4, -1.1, 0.4);
  group.add(oct);

  // Mouse Parallax
  let mouseX = 0, mouseY = 0;
  let targetX = 0, targetY = 0;

  window.addEventListener('mousemove', (e) => {
    const rect = container.getBoundingClientRect();
    mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouseY = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
  });

  // Window Resize
  function onWindowResize() {
    if (!container) return;
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  }
  window.addEventListener('resize', onWindowResize);

  // Render Loop
  let clock = new THREE.Clock();
  function animate() {
    requestAnimationFrame(animate);
    const elapsedTime = clock.getElapsedTime();

    // Floating laptop levitation & gentle rotation
    laptop.position.y = 0.15 + Math.sin(elapsedTime * 1.4) * 0.08;
    laptop.rotation.y = -0.52 + Math.sin(elapsedTime * 0.7) * 0.12;

    ico.rotation.x = elapsedTime * 0.6;
    ico.rotation.y = elapsedTime * 0.8;
    ico.position.y = 1.4 + Math.sin(elapsedTime * 1.5) * 0.15;

    oct.rotation.x = -elapsedTime * 0.5;
    oct.rotation.y = elapsedTime * 0.7;
    oct.position.y = -1.1 + Math.cos(elapsedTime * 1.8) * 0.12;

    // Subtle mouse parallax
    targetX += (mouseX - targetX) * 0.05;
    targetY += (mouseY - targetY) * 0.05;
    group.rotation.y = targetX * 0.35;
    group.rotation.x = -targetY * 0.35;

    renderer.render(scene, camera);
  }
  animate();
})();

/* 3D Perspective Card Tilt on Mousemove */
if (window.matchMedia('(min-width: 1024px)').matches) {
  document.querySelectorAll('.tilt-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = ((y - centerY) / centerY) * -6;
      const rotateY = ((x - centerX) / centerX) * 6;
      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-6px)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0)';
    });
  });
}

/* ==========================================================================
   ACADEMIC YEAR DYNAMIC QUOTES SYSTEM (ADAL AZAMAT)
   Automatically updates quote on specified date at 00:00 local time
   ========================================================================== */
const ADAL_AZAMAT_QUOTES = [
  { date: "2026-08-31", card: 1, kz: "«Оқу - білім бұлағы, білім - өмір шырағы.»", ru: "«Учение - источник знаний, знание - свет жизни.»" },
  { date: "2026-09-07", card: 2, kz: "«Білекті бірді жығар, білімді мыңды жығар.»", ru: "«Сильный одолеет одного, знающий - тысячу.»" },
  { date: "2026-09-14", card: 3, kz: "«Тіл - достықтың алтын көпірі.»", ru: "«Язык - золотой мост дружбы.»" },
  { date: "2026-09-21", card: 4, kz: "«Еңбек түбі - береке.»", ru: "«Плод труда - благополучие.»" },
  { date: "2026-09-28", card: 5, kz: "«Отан - оттан да ыстық.»", ru: "«Родина жарче огня.»" },
  { date: "2026-10-05", card: 6, kz: "«Туған жердей жер болмас, туған елдей ел болмас.»", ru: "«Нет земли лучше родной, нет народа лучше родного.»" },
  { date: "2026-10-12", card: 7, kz: "«Ел іші - алтын бесік.»", ru: "«Родная страна - золотая колыбель.»" },
  { date: "2026-10-19", card: 8, kz: "«Отанды сүю - отбасынан басталады.»", ru: "«Любовь к Родине начинается с семьи.»" },
  { date: "2026-11-02", card: 9, kz: "«Тура биде туған жоқ, туғанды биде иман жоқ.»", ru: "«Для справедливого судьи нет родни; у судьи, потакающего родне, нет совести.»" },
  { date: "2026-11-09", card: 10, kz: "«Адалдық - ардың ісі.»", ru: "«Честность - дело чести.»" },
  { date: "2026-11-16", card: 11, kz: "«Әділдік бар жерде, шындық бар.»", ru: "«Где есть справедливость, там есть и правда.»" },
  { date: "2026-11-23", card: 12, kz: "«Жауапкершілік - адамгершілік қасиеттің көрінісі.»", ru: "«Ответственность - проявление нравственности.»" },
  { date: "2026-11-30", card: 13, kz: "«Бірлігі күшті ел озады.»", ru: "«Страна, сильная единством, идёт вперёд.»" },
  { date: "2026-12-07", card: 14, kz: "«Ырыс алды - ынтымақ.»", ru: "«Основа благополучия - согласие.»" },
  { date: "2026-12-14", card: 15, kz: "«Бірлік болмай, тірлік болмас.»", ru: "«Без единства нет жизни.»" },
  { date: "2026-12-21", card: 16, kz: "«Ынтымақ жүрген жерде ырыс бірге жүреді.»", ru: "«Где есть согласие, там вместе с ним приходит благополучие.»" },
  { date: "2027-01-04", card: 17, kz: "«Тәртіпке бас иген құл болмайды, тәртіпсіз ел болмайды.»", ru: "«Тот, кто уважает дисциплину, не становится рабом; без дисциплины не бывает страны.»" },
  { date: "2027-01-11", card: 18, kz: "«Талап бар жерде тәртіп бар.»", ru: "«Где есть требовательность, там есть порядок.»" },
  { date: "2027-01-18", card: 19, kz: "«Ұрлық түбі - қорлық.»", ru: "«Воровство ведёт к позору.»" },
  { date: "2027-01-25", card: 20, kz: "«Өзіңе тілемегенді өзгеге тілеме.»", ru: "«Не желай другому того, чего не желаешь себе.»" },
  { date: "2027-02-01", card: 21, kz: "«Өнерлі өрге жүзер.»", ru: "«Умелый и творческий человек идёт к вершинам.»" },
  { date: "2027-02-08", card: 22, kz: "«Ізденген жетер мұратқа.»", ru: "«Ищущий достигает цели.»" },
  { date: "2027-02-15", card: 23, kz: "«Ғылым таппай мақтанба.»", ru: "«Не хвались, не овладев знанием.»" },
  { date: "2027-02-22", card: 24, kz: "«Жаңашылдық - заман талабы.»", ru: "«Новаторство - требование времени.»" },
  { date: "2027-03-01", card: 25, kz: "«Тәуелсіздік бәрінен қымбат!»", ru: "«Независимость превыше всего!»" },
  { date: "2027-03-08", card: 26, kz: "«Отан үшін отқа түс - күймейсің.»", ru: "«За Родину войдёшь в огонь - не сгоришь.»" },
  { date: "2027-03-15", card: 27, kz: "«Елінен безген ер болмас, көлінен безген қаз болмас.»", ru: "«Не станет героем тот, кто отрёкся от народа, как не бывает гуся, отрёкшегося от своего озера.»" },
  { date: "2027-03-22", card: 28, kz: "«Туған жерге туың тік.»", ru: "«Подними своё знамя на родной земле.»" },
  { date: "2027-03-29", card: 29, kz: "«Еңбек етсең ерінбей, тояды қарның тіленбей.»", ru: "«Трудись не ленясь - и не придётся просить на хлеб.»" },
  { date: "2027-04-05", card: 30, kz: "«Еңбек түбі - зейнет.»", ru: "«Труд в конце приносит заслуженное благо.»" },
  { date: "2027-04-12", card: 31, kz: "«Шебердің қолы ортақ.»", ru: "«Мастерство служит людям.»" },
  { date: "2027-04-19", card: 32, kz: "«Еңбек бәрін жеңбек.»", ru: "«Труд всё побеждает.»" },
  { date: "2027-04-26", card: 33, kz: "«Бірлік бар жерде тірлік бар.»", ru: "«Где есть единство, там есть жизнь.»" },
  { date: "2027-05-03", card: 34, kz: "«Ер есімі - ел есінде.»", ru: "«Имя героя живёт в памяти народа.»" },
  { date: "2027-05-10", card: 35, kz: "«Отан - отбасынан басталады.»", ru: "«Родина начинается с семьи.»" },
  { date: "2027-05-17", card: 36, kz: "«Ата көрген оқ жонар, ана көрген тон пішер.»", ru: "«Дети перенимают мастерство и жизненный опыт у родителей.»" }
];

function getCurrentAcademicQuote() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const todayKey = `${year}-${month}-${day}`;

  let selected = ADAL_AZAMAT_QUOTES[0];
  for (let i = 0; i < ADAL_AZAMAT_QUOTES.length; i++) {
    if (ADAL_AZAMAT_QUOTES[i].date <= todayKey) {
      selected = ADAL_AZAMAT_QUOTES[i];
    } else {
      break;
    }
  }
  return selected;
}

function updateMottoQuote() {
  const quote = getCurrentAcademicQuote();
  const kzEl = document.getElementById('motto-kz-el') || document.querySelector('.motto-kz');
  const ruEl = document.getElementById('motto-ru-el') || document.querySelector('.motto-ru');

  if (kzEl && kzEl.textContent !== quote.kz) {
    kzEl.textContent = quote.kz;
  }
  if (ruEl && ruEl.textContent !== quote.ru) {
    ruEl.textContent = quote.ru;
  }
}

function initDailyQuoteScheduler() {
  updateMottoQuote();

  const now = new Date();
  const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 1);
  const msUntilMidnight = Math.max(1000, nextMidnight.getTime() - now.getTime());

  setTimeout(() => {
    updateMottoQuote();
    initDailyQuoteScheduler();
  }, msUntilMidnight);
}

// Initialize on page load
initDailyQuoteScheduler();

// Safety periodic check every 60s (handles sleep / tab restoration)
setInterval(updateMottoQuote, 60000);
