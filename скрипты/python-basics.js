/* ==========================================================================
   Python Основы — Единый движок интерактивного учебника и компилятора
   Skulpt (мгновенное выполнение + VFS) + Pyodide (умный анализатор ошибок)
   ========================================================================== */

const PY_LESSONS = [
  {
    num: 1,
    file: "1.Основа.html",
    title: "Введение в Python",
    module: "Модуль 1 · Старт",
    starter: `# Урок 1: Введение в Python\n# Нажми "Запустить" (или Ctrl+Enter)\n\nprint("Привет, Python!")\nprint("Я начинаю программировать!")\nprint(2025)\n`,
    examples: {
      default: `# Пример первой программы\nprint("Hello, World!")\nprint("Привет! Меня зовут Алекс.")\nprint("Результат 2 + 2 =", 2 + 2)\n`
    }
  },
  {
    num: 2,
    file: "2.print.html",
    title: "Функция print()",
    module: "Модуль 1 · Старт",
    starter: `# Урок 2: Функция print(), sep, end и f-строки\nprint("Яблоко", "Банан", "Вишня", sep=" | ")\n\nname = "Алиса"\nage = 15\nprint(f"Привет, {name}! Тебе {age} лет.")\n`,
    examples: {
      default: `имя = "Алиса"\nвозраст = 17\nоценка = 4.756\n\nprint(f"Привет, {имя}!")\nprint(f"Через 5 лет тебе будет {возраст + 5} лет.")\nprint(f"Средняя оценка: {оценка:.1f}")\nprint("Загрузка", end="... ")\nprint("Готово!")\n`
    }
  },
  {
    num: 3,
    file: "3.Переменные.html",
    title: "Переменные",
    module: "Модуль 1 · Старт",
    starter: `# Урок 3: Переменные\nplayer_name = "Герой"\nscore = 10\nprint("Игрок:", player_name, "| Очки:", score)\n\nscore = score + 15\nprint("Новые очки:", score)\n`,
    examples: {
      default: `score = 10\nprint("Было очков:", score)\n\nscore = 25\nprint("Стало очков:", score)\n\nscore = score + 5\nprint("После бонуса (+5):", score)\n`
    }
  },
  {
    num: 4,
    file: "4.Типы.html",
    title: "Типы данных",
    module: "Модуль 1 · Старт",
    starter: `# Урок 4: Основные типы данных\ncount = 42          # int (целое число)\nprice = 19.99       # float (дробное число)\ntitle = "Книга"     # str (строка)\nis_open = True      # bool (логический тип)\n\nprint(type(count), type(price), type(title), type(is_open))\n`,
    examples: {
      default: `print(type(42))        # <class 'int'>\nprint(type(3.14))      # <class 'float'>\nprint(type("Привет"))  # <class 'str'>\nprint(type(True))      # <class 'bool'>\n\n# Преобразование строки в число:\na = "50"\nprint(int(a) + 50)\n`
    }
  },
  {
    num: 5,
    file: "5.Input.html",
    title: "Ввод данных: input()",
    module: "Модуль 1 · Старт",
    starter: `# Урок 5: Ввод данных с клавиатуры\nname = input("Как тебя зовут? ")\nprint(f"Привет, {name}!")\n\nage = int(input("Сколько тебе лет? "))\nprint(f"Через год тебе будет {age + 1}")\n`,
    examples: {
      default: `# Мини-калькулятор с вводом данных\na = float(input("Введи первое число: "))\nb = float(input("Введи второе число: "))\n\nprint(f"Сумма: {a + b}")\nprint(f"Произведение: {a * b}")\n`
    }
  },
  {
    num: 6,
    file: "6.Математика.html",
    title: "Математические операции",
    module: "Модуль 1 · Старт",
    starter: `# Урок 6: Математика в Python\nprint("Обычное деление 17 / 5 =", 17 / 5)\nprint("Целая часть 17 // 5 =", 17 // 5)\nprint("Остаток 17 % 5 =", 17 % 5)\nprint("Степень 2 ** 10 =", 2 ** 10)\n`,
    examples: {
      default: `students = 27\nteam_size = 5\n\nfull_teams = students // team_size\nleftover = students % team_size\n\nprint(f"Полных команд: {full_teams}")\nprint(f"Осталось учеников: {leftover}")\nprint(f"2 в 8 степени = {2 ** 8}")\n`
    }
  },
  {
    num: 7,
    file: "7.Логика.html",
    title: "Логические выражения",
    module: "Модуль 2 · Логика и циклы",
    starter: `# Урок 7: Сравнения и логика (and, or, not)\nage = 16\nhas_ticket = True\n\nprint("Возраст >= 14:", age >= 14)\nprint("Можно пройти:", age >= 14 and has_ticket)\n`,
    examples: {
      default: `x = 15\nprint("x больше 10 и меньше 20:", 10 < x < 20)\nprint("x четное:", x % 2 == 0)\nprint("Инверсия not True:", not True)\n`
    }
  },
  {
    num: 8,
    file: "8.Условия.html",
    title: "Условные операторы",
    module: "Модуль 2 · Логика и циклы",
    starter: `# Урок 8: Условия if / elif / else\nscore = 85\n\nif score >= 90:\n    print("Оценка: 5 (Отлично!)")\nelif score >= 70:\n    print("Оценка: 4 (Хорошо)")\nelse:\n    print("Нужно ещё потренироваться")\n`,
    examples: {
      default: `temp = int(input("Какая температура на улице? "))\n\nif temp >= 25:\n    print("Жарко! Надень футболку")\nelif temp >= 12:\n    print("Прохладно, накинь кофту")\nelse:\n    print("Холодно! Обязательно надень куртку")\n`
    }
  },
  {
    num: 9,
    file: "9.For.html",
    title: "Цикл for",
    module: "Модуль 2 · Логика и циклы",
    starter: `# Урок 9: Цикл for и функция range()\nfor i in range(1, 6):\n    print(f"Шаг цикла №{i}")\n`,
    examples: {
      default: `# Три режима range():\nprint("1) range(5):")\nfor i in range(5):\n    print(i, end=" ")\nprint()\n\nprint("2) Четные числа от 2 до 10:")\nfor i in range(2, 11, 2):\n    print(i, end=" ")\nprint()\n\nprint("3) Обратный отсчёт:")\nfor i in range(5, 0, -1):\n    print(i, end="... ")\nprint("Пуск!")\n`
    }
  },
  {
    num: 10,
    file: "10.While.html",
    title: "Цикл while",
    module: "Модуль 2 · Логика и циклы",
    starter: `# Урок 10: Цикл while\ncount = 5\nwhile count > 0:\n    print("Обратный отсчёт:", count)\n    count -= 1\nprint("Старт!")\n`,
    examples: {
      default: `while True:\n    word = input("Введи слово (или 'стоп' для выхода): ")\n    if word.lower() == "стоп":\n        print("Цикл остановлен командой break!")\n        break\n    print("Ты ввёл:", word)\n`
    }
  },
  {
    num: 11,
    file: "11.Списки.html",
    title: "Списки (Lists)",
    module: "Модуль 3 · Коллекции и функции",
    starter: `# Урок 11: Списки и индексы\nfruits = ["яблоко", "банан", "вишня", "манго"]\nprint("Первый элемент:", fruits[0])\nprint("Последний элемент:", fruits[-1])\nprint("Срез [1:3]:", fruits[1:3])\nprint("Всего элементов:", len(fruits))\n`,
    examples: {
      default: `cars = ["BMW", "Lada", "Tesla"]\nprint("Было:", cars)\n\ncars[1] = "Audi"  # Заменяем элемент по индексу 1\nprint("Стало:", cars)\nprint("Длина списка:", len(cars))\n`
    }
  },
  {
    num: 12,
    file: "12.Работа со списками.html",
    title: "Работа со списками",
    module: "Модуль 3 · Коллекции и функции",
    starter: `# Урок 12: Методы списков\ninventory = ["меч", "щит"]\ninventory.append("зелье")\nprint("После append:", inventory)\n\nscores = [45, 99, 12, 87]\nprint("Максимум:", max(scores), "| Минимум:", min(scores))\n`,
    examples: {
      default: `tasks = ["учеба", "игры", "уборка"]\ntasks.append("спорт")\ntasks.remove("игры")\n\nfor i, task in enumerate(tasks, 1):\n    print(f"{i}. {task}")\n`
    }
  },
  {
    num: 13,
    file: "13.Строки.html",
    title: "Работа со строками",
    module: "Модуль 3 · Коллекции и функции",
    starter: `# Урок 13: Методы и срезы строк\ntext = "  Привет, Python!  "\nclean = text.strip()\nprint("Верхний регистр:", clean.upper())\nprint("Замена:", clean.replace("Python", "Мир"))\nprint("Разворот строки:", clean[::-1])\n`,
    examples: {
      default: `phrase = "яблоко банан апельсин"\nwords = phrase.split()\nprint("Список слов:", words)\nprint("Склейка через дефис:", "-".join(words))\n`
    }
  },
  {
    num: 14,
    file: "14.Функции.html",
    title: "Создание функций",
    module: "Модуль 3 · Коллекции и функции",
    starter: `# Урок 14: Функции def и return\ndef greet(name="Друг"):\n    return f"Привет, {name}! Добро пожаловать!"\n\nprint(greet("Алекс"))\nprint(greet())\n`,
    examples: {
      default: `def calc_area(width, height):\n    return width * height\n\ns1 = calc_area(5, 4)\ns2 = calc_area(10, 3)\nprint(f"Площадь 1: {s1}, Площадь 2: {s2}")\n`
    }
  },
  {
    num: 15,
    file: "15.Файлы.html",
    title: "Работа с файлами",
    module: "Модуль 3 · Коллекции и функции",
    starter: `# Урок 15: Работа с файлами (виртуальная файловая система активна!)\n# Записываем текст в файл notes.txt:\nwith open("notes.txt", "w") as f:\n    f.write("Первая строка\\n")\n    f.write("Вторая строка\\n")\n\n# Читаем созданный файл:\nwith open("notes.txt", "r") as f:\n    content = f.read()\n    print("Содержимое notes.txt:")\n    print(content)\n`,
    examples: {
      default: `# Дозапись в файл (режим "a") и чтение построчно\nwith open("notes.txt", "a") as f:\n    f.write("Новая заметка!\\n")\n\nwith open("notes.txt", "r") as f:\n    lines = f.readlines()\n    print(f"Всего строк в файле: {len(lines)}")\n    for line in lines:\n        print("->", line.strip())\n`
    }
  }
];

// ── GLOBAL STATE ──
let currentLesson = PY_LESSONS[0];
let currentFontSize = 13;
let errorLineNumber = null;
let isRunning = false;
let stopRequested = false;
let activeInputResolve = null;
let pyodide = null;

// Virtual File System for Lesson 15 (and any open() calls in Skulpt)
const DEFAULT_VFS = {
  "notes.txt": "Купить молоко\nВыучить Python\n",
  "test.txt": "Привет, мир!\nЭто тестовый файл.",
  "story.txt": "Первая строка истории\nВторая строка истории\nТретья строка истории\n",
  "data.txt": "Python — отличный язык программирования для начинающих и профи.",
  "source.txt": "Секретные данные для копирования в другой файл.\nСтрока 2.",
  "log.txt": "[INFO] Система запущена\n"
};
let vfsFiles = { ...DEFAULT_VFS };

function loadVfsFromStorage() {
  try {
    const saved = localStorage.getItem("py_basics_vfs");
    if (saved) {
      vfsFiles = { ...DEFAULT_VFS, ...JSON.parse(saved) };
    }
  } catch (e) {}
}
function saveVfsToStorage() {
  try {
    localStorage.setItem("py_basics_vfs", JSON.stringify(vfsFiles));
  } catch (e) {}
  renderVfsBar();
}

// ── DETECT CURRENT LESSON ──
function detectLesson() {
  const path = decodeURIComponent(window.location.pathname);
  const titleText = document.title || "";
  const badgeEl = document.querySelector(".topbar-badge");
  const badgeText = badgeEl ? badgeEl.textContent : "";

  for (const item of PY_LESSONS) {
    if (path.endsWith(item.file) || path.includes(`/${item.num}.`)) {
      return item;
    }
  }
  const m = (badgeText + " " + titleText).match(/(\d+)/);
  if (m) {
    const n = parseInt(m[1], 10);
    const found = PY_LESSONS.find(l => l.num === n);
    if (found) return found;
  }
  return PY_LESSONS[0];
}

// ── BUILD TOPBAR, SUBTOPIC NAV & FOOTER ──
function initNavigation() {
  currentLesson = detectLesson();
  const idx = PY_LESSONS.findIndex(l => l.num === currentLesson.num);
  const prevLesson = idx > 0 ? PY_LESSONS[idx - 1] : null;
  const nextLesson = idx < PY_LESSONS.length - 1 ? PY_LESSONS[idx + 1] : null;

  // 1. Upgrade Topbar
  const topbar = document.querySelector(".topbar");
  if (topbar) {
    const dropdownItems = PY_LESSONS.map(l => `
      <a class="lesson-dropdown-item ${l.num === currentLesson.num ? 'current' : ''}" href="${l.file}">
        <span class="lesson-dropdown-num">${l.num}</span>
        <span>${l.title}</span>
      </a>
    `).join("");

    topbar.innerHTML = `
      <div class="topbar-logo">🐍 Py<span>thon</span></div>
      <div class="lesson-select-wrap" id="lessonSelectWrap">
        <button class="topbar-badge" id="lessonSelectBtn" onclick="toggleLessonDropdown()" title="Выбрать урок">
          Урок ${currentLesson.num} из ${PY_LESSONS.length}: ${currentLesson.title} ▾
        </button>
        <div class="lesson-dropdown" id="lessonDropdown">
          ${dropdownItems}
        </div>
      </div>
      <div class="topbar-nav-btns">
        <a class="topbar-nav-btn ${prevLesson ? '' : 'disabled'}" href="${prevLesson ? prevLesson.file : '#'}" title="${prevLesson ? 'Предыдущий: ' + prevLesson.title : ''}">← Назад</a>
        <a class="topbar-nav-btn ${nextLesson ? '' : 'disabled'}" href="${nextLesson ? nextLesson.file : '#'}" title="${nextLesson ? 'Следующий: ' + nextLesson.title : ''}">Вперёд →</a>
      </div>
      <div class="topbar-progress" id="topbarProgress">
        <span class="progress-label" id="progressLabel">Прогресс</span>
        <div class="progress-dots" id="progressDots"></div>
      </div>
    `;
  }

  // Update module label in hero
  const modEl = document.querySelector(".lesson-num");
  if (modEl) modEl.textContent = `${currentLesson.module} · Урок ${currentLesson.num}`;

  // 2. Build Subtopic Navigation & Progress Dots from .section elements
  const sections = Array.from(document.querySelectorAll(".lesson-content .section"));
  sections.forEach((sec, i) => {
    if (!sec.id) sec.id = `s${i + 1}`;
  });

  // Remove any existing broken subtopic-nav and create a clean one after .lesson-hero
  document.querySelectorAll(".subtopic-nav").forEach(el => el.remove());
  const hero = document.querySelector(".lesson-hero");
  if (hero && sections.length > 0) {
    const nav = document.createElement("div");
    nav.className = "subtopic-nav";
    sections.forEach((sec, i) => {
      const titleEl = sec.querySelector(".section-title");
      const rawTitle = titleEl ? titleEl.textContent.trim() : `Тема ${i + 1}`;
      const shortTitle = rawTitle.length > 26 ? rawTitle.slice(0, 24) + "…" : rawTitle;
      const btn = document.createElement("button");
      btn.className = "subtopic-btn" + (i === 0 ? " active" : "");
      btn.dataset.target = sec.id;
      btn.textContent = shortTitle;
      btn.onclick = () => scrollToSection(sec.id);
      nav.appendChild(btn);
    });
    hero.insertAdjacentElement("afterend", nav);
  }

  // Build progress dots
  const dotsWrap = document.getElementById("progressDots");
  if (dotsWrap && sections.length > 0) {
    dotsWrap.innerHTML = sections.map((sec, i) => {
      const titleEl = sec.querySelector(".section-title");
      const t = titleEl ? titleEl.textContent.trim() : `Раздел ${i + 1}`;
      return `<button class="dot ${i === 0 ? 'active' : ''}" data-target="${sec.id}" title="${t}" onclick="scrollToSection('${sec.id}')"></button>`;
    }).join("");
  }

  // Scroll spy on .left-panel
  const leftPanel = document.getElementById("leftPanel");
  if (leftPanel && sections.length > 0) {
    leftPanel.addEventListener("scroll", () => {
      const scrollPos = leftPanel.scrollTop + 140;
      let activeIdx = 0;
      sections.forEach((sec, i) => {
        if (sec.offsetTop <= scrollPos) activeIdx = i;
      });
      document.querySelectorAll(".subtopic-btn").forEach((b, i) => b.classList.toggle("active", i === activeIdx));
      document.querySelectorAll("#progressDots .dot").forEach((d, i) => {
        d.classList.toggle("active", i === activeIdx);
        if (i < activeIdx) d.classList.add("done");
      });
    });
  }

  // 3. Add Footer Lesson Navigation at bottom of .lesson-content
  const lessonContent = document.querySelector(".lesson-content");
  if (lessonContent && !lessonContent.querySelector(".lesson-footer-nav")) {
    const footer = document.createElement("div");
    footer.className = "lesson-footer-nav";
    footer.innerHTML = `
      ${prevLesson ? `<a class="lesson-footer-btn prev" href="${prevLesson.file}">← Урок ${prevLesson.num}: ${prevLesson.title}</a>` : `<span></span>`}
      ${nextLesson ? `<a class="lesson-footer-btn next" href="${nextLesson.file}">Урок ${nextLesson.num}: ${nextLesson.title} →</a>` : `<span style="font-weight:700;color:var(--accent3)"><i class="pb-icon" data-flaticon="trophy"></i> Все 15 уроков курса пройдены!</span>`}
    `;
    lessonContent.appendChild(footer);
  }
}

function toggleLessonDropdown() {
  const dd = document.getElementById("lessonDropdown");
  const btn = document.getElementById("lessonSelectBtn");
  if (!dd) return;
  dd.classList.toggle("open");
  if (btn) btn.classList.toggle("open", dd.classList.contains("open"));
}

function scrollToSection(id) {
  const el = document.getElementById(id);
  const leftPanel = document.getElementById("leftPanel");
  if (!el) return;
  if (leftPanel && window.innerWidth > 820) {
    leftPanel.scrollTo({ top: Math.max(0, el.offsetTop - 24), behavior: "smooth" });
  } else {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}
// Keep compatibility with onclick="scrollTo('s1')" in Lesson 4
window.scrollToSection = scrollToSection;

// ── ENHANCE CODE BLOCKS, TRY CARDS & PRACTICE TASKS ──
function initContentWidgets() {
  // 1. Upgrade all .code-block elements with Copy + Run in Compiler buttons
  const codeBlocks = document.querySelectorAll(".code-block");
  codeBlocks.forEach((block, idx) => {
    const pre = block.querySelector("pre");
    if (!pre) return;
    if (!pre.id) pre.id = `auto_code_${idx + 1}`;

    let header = block.querySelector(".code-block-header");
    const langText = header?.querySelector(".code-block-lang")?.textContent || "Python";
    if (!header) {
      header = document.createElement("div");
      header.className = "code-block-header";
      block.insertBefore(header, pre);
    }
    const isErrorExample = langText.toLowerCase().includes("ошибк");
    header.innerHTML = `
      <span class="code-block-lang">${langText}</span>
      <div class="code-block-actions">
        <button class="run-inline-btn" onclick="runCodeFromBlock('${pre.id}', ${!isErrorExample})" title="Отправить этот код в компилятор справа"><i class="pb-icon" data-flaticon="play"></i> В редактор</button>
        <button class="copy-btn" onclick="copyCode(this, '${pre.id}')">Копировать</button>
      </div>
    `;
  });

  // 2. Fix all .try-card buttons so they load the lesson's interactive example
  document.querySelectorAll(".try-card").forEach(btn => {
    btn.onclick = () => loadLessonExample();
  });

  // 3. Enhance Practice Tasks (ul.steps li inside practice sections)
  const practiceSections = Array.from(document.querySelectorAll(".section")).filter(sec => {
    const id = (sec.id || "").toLowerCase();
    const tag = (sec.querySelector(".section-tag")?.textContent || "").toLowerCase();
    const title = (sec.querySelector(".section-title")?.textContent || "").toLowerCase();
    return id.includes("practice") || id.includes("extra") || id.includes("advanced") ||
           tag.includes("практик") || title.includes("задани") || title.includes("задач");
  });

  const savedDone = JSON.parse(localStorage.getItem(`py_done_L${currentLesson.num}`) || "[]");

  practiceSections.forEach(sec => {
    const items = sec.querySelectorAll("ul.steps > li");
    items.forEach((li, idx) => {
      const taskNum = idx + 1;
      const contentDiv = li.querySelector("div") || li;
      const rawText = contentDiv.textContent.replace(/\s+/g, " ").trim();

      if (savedDone.includes(taskNum)) {
        li.classList.add("task-done");
      }

      if (!li.querySelector(".task-actions")) {
        const actions = document.createElement("div");
        actions.className = "task-actions";
        actions.innerHTML = `
          <button class="task-solve-btn" type="button"><i class="pb-icon" data-flaticon="computer"></i> Решать в редакторе</button>
          <button class="task-check-btn" type="button">${savedDone.includes(taskNum) ? '<i class="pb-icon" data-flaticon="check"></i> Выполнено' : '○ Отметить выполненным'}</button>
        `;
        const solveBtn = actions.querySelector(".task-solve-btn");
        solveBtn.onclick = () => startTaskInEditor(taskNum, rawText);

        const checkBtn = actions.querySelector(".task-check-btn");
        checkBtn.onclick = () => toggleTaskDone(li, checkBtn, taskNum);

        contentDiv.appendChild(actions);
      }
    });
  });
}

function toggleTaskDone(li, btn, taskNum) {
  const key = `py_done_L${currentLesson.num}`;
  let list = [];
  try { list = JSON.parse(localStorage.getItem(key) || "[]"); } catch (e) {}
  if (list.includes(taskNum)) {
    list = list.filter(n => n !== taskNum);
    li.classList.remove("task-done");
    btn.innerHTML = "○ Отметить выполненным";
  } else {
    list.push(taskNum);
    li.classList.add("task-done");
    btn.innerHTML = '<i class="pb-icon" data-flaticon="check"></i> Выполнено';
  }
  try { localStorage.setItem(key, JSON.stringify(list)); } catch (e) {}
}

function startTaskInEditor(taskNum, taskText) {
  const ta = document.getElementById("codeEditor");
  if (!ta) return;
  // Wrap long task description into neat Python comments
  const words = taskText.split(" ");
  const lines = [];
  let cur = `# Задача ${taskNum}:`;
  for (const w of words) {
    if ((cur + " " + w).length > 68) {
      lines.push(cur);
      cur = "# " + w;
    } else {
      cur += " " + w;
    }
  }
  if (cur) lines.push(cur);

  ta.value = lines.join("\n") + "\n\n# Напиши своё решение ниже:\n\n";
  clearErrorHighlight();
  onEditorInput();
  ta.focus();
  ta.setSelectionRange(ta.value.length, ta.value.length);
}

function copyCode(btn, preId) {
  const pre = document.getElementById(preId);
  if (!pre) return;
  const text = pre.innerText || pre.textContent;
  navigator.clipboard.writeText(text).then(() => {
    const old = btn.textContent;
    btn.textContent = "✓ Скопировано";
    btn.classList.add("copied");
    setTimeout(() => {
      btn.textContent = old;
      btn.classList.remove("copied");
    }, 1500);
  });
}

function runCodeFromBlock(preId, autoRun = true) {
  const pre = document.getElementById(preId);
  const ta = document.getElementById("codeEditor");
  if (!pre || !ta) return;
  const text = (pre.innerText || pre.textContent).replace(/\u00a0/g, " ");
  ta.value = text + "\n";
  clearErrorHighlight();
  onEditorInput();
  if (autoRun) {
    runCode();
  } else {
    ta.focus();
  }
}

function loadLessonExample() {
  const ta = document.getElementById("codeEditor");
  if (!ta) return;
  const code = currentLesson.examples?.default || currentLesson.starter;
  ta.value = code;
  clearErrorHighlight();
  onEditorInput();
  runCode();
}

// Legacy global aliases so any inline onclicks work seamlessly
window.copyCode = copyCode;
window.loadFstrExample = loadLessonExample;
window.loadVariableExample = loadLessonExample;
window.loadTypeExample = loadLessonExample;
window.loadInputExample = loadLessonExample;
window.loadMathExample = loadLessonExample;
window.loadLogicExample = loadLessonExample;

// ── COMPILER TOOLBAR & VFS BAR ──
function initCompilerPanel() {
  loadVfsFromStorage();

  // Add Reset & Clear buttons to .rh-actions if not already present
  const actions = document.querySelector(".rh-actions");
  const runBtn = document.getElementById("runStopBtn");
  if (actions && runBtn && !document.getElementById("resetCodeBtn")) {
    const resetBtn = document.createElement("button");
    resetBtn.className = "rh-btn";
    resetBtn.id = "resetCodeBtn";
    resetBtn.title = "Вернуть стартовый код урока";
    resetBtn.innerHTML = '<i class="pb-icon" data-flaticon="refresh"></i> Шаблон';
    resetBtn.onclick = resetStarterCode;

    const clearBtn = document.createElement("button");
    clearBtn.className = "rh-btn";
    clearBtn.id = "clearCodeBtn";
    clearBtn.title = "Очистить редактор";
    clearBtn.innerHTML = '<i class="pb-icon" data-flaticon="cross"></i>';
    clearBtn.onclick = clearEditorCode;

    actions.insertBefore(resetBtn, runBtn);
    actions.insertBefore(clearBtn, runBtn);
  }

  // Add Clear Output button to .output-header
  const outHeader = document.querySelector(".output-header");
  const outStatus = document.getElementById("outputStatus");
  if (outHeader && outStatus && !outHeader.querySelector(".clear-out-btn")) {
    const rightWrap = document.createElement("div");
    rightWrap.className = "output-header-right";
    outStatus.parentNode.insertBefore(rightWrap, outStatus);
    rightWrap.appendChild(outStatus);

    const clearOutBtn = document.createElement("button");
    clearOutBtn.className = "clear-out-btn";
    clearOutBtn.textContent = "Очистить вывод";
    clearOutBtn.onclick = () => {
      const outEl = document.getElementById("output");
      if (outEl) outEl.innerHTML = '<span class="out-hint">Нажми <i class="pb-icon" data-flaticon="play"></i> Запустить (или Ctrl+Enter), чтобы увидеть результат</span>';
      outStatus.textContent = "";
      outStatus.className = "output-status";
    };
    rightWrap.appendChild(clearOutBtn);
  }

  // Insert VFS bar inside .compiler-wrap before .editor-area
  const compilerWrap = document.querySelector(".compiler-wrap");
  const editorArea = document.querySelector(".editor-area");
  if (compilerWrap && editorArea && !document.getElementById("vfsBar")) {
    const vfsBar = document.createElement("div");
    vfsBar.id = "vfsBar";
    vfsBar.className = "vfs-bar" + (currentLesson.num === 15 ? " visible" : "");
    compilerWrap.insertBefore(vfsBar, editorArea);
    renderVfsBar();
  }

  // Load saved code for this lesson or lesson starter code
  const ta = document.getElementById("codeEditor");
  if (ta) {
    const savedCode = localStorage.getItem(`py_code_L${currentLesson.num}`);
    if (savedCode && savedCode.trim().length > 0) {
      ta.value = savedCode;
    } else {
      ta.value = currentLesson.starter;
    }
  }
}

function renderVfsBar() {
  const bar = document.getElementById("vfsBar");
  if (!bar) return;
  const names = Object.keys(vfsFiles);
  bar.innerHTML = `
    <span class="vfs-label"><i class="pb-icon" data-flaticon="folder"></i> Виртуальные файлы (нажми, чтобы посмотреть):</span>
    ${names.map(fn => `<button type="button" class="vfs-file-pill" onclick="previewVfsFile('${fn}')"><i class="pb-icon" data-flaticon="book-alt"></i> ${fn}</button>`).join("")}
    <button type="button" class="vfs-file-pill" style="color:var(--text3)" onclick="resetVfsFiles()" title="Восстановить исходные файлы"><i class="pb-icon" data-flaticon="refresh"></i> сброс файлов</button>
  `;
}

function previewVfsFile(filename) {
  const outEl = document.getElementById("output");
  const status = document.getElementById("outputStatus");
  if (!outEl) return;
  const content = vfsFiles[filename] ?? "(файл пуст)";
  outEl.innerHTML = "";
  const headerLine = document.createElement("span");
  headerLine.className = "out-line";
  headerLine.style.color = "var(--accent)";
  headerLine.style.fontWeight = "700";
  headerLine.innerHTML = `<i class="pb-icon" data-flaticon="book-alt"></i> Содержимое файла "${escHtml(filename)}":\n────────────────────────────`;
  outEl.appendChild(headerLine);

  const bodyLine = document.createElement("span");
  bodyLine.className = "out-line";
  bodyLine.textContent = content || "(пустой файл)";
  outEl.appendChild(bodyLine);

  if (status) {
    status.innerHTML = `<i class="pb-icon" data-flaticon="book-alt"></i> ${escHtml(filename)}`;
    status.className = "output-status ok";
  }
}
window.previewVfsFile = previewVfsFile;

function resetVfsFiles() {
  vfsFiles = { ...DEFAULT_VFS };
  saveVfsToStorage();
  previewVfsFile("notes.txt");
}
window.resetVfsFiles = resetVfsFiles;

function resetStarterCode() {
  const ta = document.getElementById("codeEditor");
  if (!ta) return;
  ta.value = currentLesson.starter;
  clearErrorHighlight();
  onEditorInput();
}

function clearEditorCode() {
  const ta = document.getElementById("codeEditor");
  if (!ta) return;
  ta.value = "";
  clearErrorHighlight();
  onEditorInput();
  ta.focus();
}

// ── DIVIDER (RESIZE) ──
function initDivider() {
  const layout = document.getElementById("layout");
  const leftPanel = document.getElementById("leftPanel");
  const divider = document.getElementById("divider");
  if (!layout || !leftPanel || !divider) return;

  let isDragging = false, rafId = null, pendingX = 0;
  function applyResize() {
    const lw = layout.getBoundingClientRect().width;
    const newW = Math.min(Math.max(pendingX, 320), lw - 300);
    leftPanel.style.flexBasis = newW + "px";
    rafId = null;
  }
  function onMove(clientX) {
    if (!isDragging) return;
    pendingX = clientX;
    if (!rafId) rafId = requestAnimationFrame(applyResize);
  }
  divider.addEventListener("mousedown", e => {
    isDragging = true;
    divider.classList.add("dragging");
    document.body.style.userSelect = "none";
    document.body.style.cursor = "col-resize";
    e.preventDefault();
  });
  window.addEventListener("mousemove", e => { if (isDragging) onMove(e.clientX); });
  window.addEventListener("mouseup", () => {
    if (!isDragging) return;
    isDragging = false;
    divider.classList.remove("dragging");
    document.body.style.userSelect = "";
    document.body.style.cursor = "";
  });
}

// ── FONT SIZE ──
function setFontSize(size) {
  currentFontSize = size;
  document.documentElement.style.setProperty("--editor-font-size", size + "px");
  document.documentElement.style.setProperty("--editor-line-height", (size * 1.65) + "px");
  const elements = ["codeEditor", "editorHighlight", "output"];
  elements.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.fontSize = size + "px";
  });
  const label = document.getElementById("fontSizeLabel");
  if (label) label.textContent = `Аа ${size}px ▾`;
  document.querySelectorAll(".font-size-opt").forEach(o => o.classList.toggle("active", o.textContent.includes(size + "px")));
  closeFontMenu();
  updateGutter();
  highlight();
  syncScroll();
}
function toggleFontMenu() {
  const menu = document.getElementById("fontSizeMenu");
  if (menu) menu.classList.toggle("open");
}
function closeFontMenu() {
  const menu = document.getElementById("fontSizeMenu");
  if (menu) menu.classList.remove("open");
}
window.setFontSize = setFontSize;
window.toggleFontMenu = toggleFontMenu;

document.addEventListener("click", e => {
  const fw = document.getElementById("fontSizeWrap");
  if (fw && !fw.contains(e.target)) closeFontMenu();
  const lw = document.getElementById("lessonSelectWrap");
  if (lw && !lw.contains(e.target)) {
    const dd = document.getElementById("lessonDropdown");
    const btn = document.getElementById("lessonSelectBtn");
    if (dd) dd.classList.remove("open");
    if (btn) btn.classList.remove("open");
  }
});

// ── GUTTER & HIGHLIGHT ──
function clearErrorHighlight() {
  if (errorLineNumber !== null) {
    errorLineNumber = null;
    updateGutter();
    highlight();
  }
}

function updateGutter() {
  const ta = document.getElementById("codeEditor");
  const g = document.getElementById("gutter");
  if (!ta || !g) return;
  const lines = ta.value.split("\n").length;
  g.innerHTML = Array.from({ length: lines }, (_, i) => {
    const lineNum = i + 1;
    const isErr = errorLineNumber === lineNum;
    return `<div class="${isErr ? 'err-line' : ''}">${lineNum}</div>`;
  }).join("");
}

function syncScroll() {
  const ta = document.getElementById("codeEditor");
  const hl = document.getElementById("editorHighlight");
  const g = document.getElementById("gutter");
  if (!ta) return;
  if (hl) { hl.scrollTop = ta.scrollTop; hl.scrollLeft = ta.scrollLeft; }
  if (g) g.scrollTop = ta.scrollTop;
}

function escHtml(s) {
  if (!s) return "";
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function highlight() {
  const ta = document.getElementById("codeEditor");
  const hl = document.getElementById("editorHighlight");
  if (!ta || !hl) return;
  hl.innerHTML = ta.value
    .split("\n")
    .map((line, idx) => {
      const isErr = errorLineNumber === (idx + 1);
      return `<span class="code-line ${isErr ? 'err-line' : ''}">${tokenizeLine(line)}</span>`;
    })
    .join("");
}

function tokenizeLine(line) {
  let out = "";
  let i = 0;
  const len = line.length;
  const keywords = ["False","None","True","and","as","assert","async","await","break","class","continue","def","del","elif","else","except","finally","for","from","global","if","import","in","is","lambda","nonlocal","not","or","pass","raise","return","try","while","with","yield"];
  const builtins = ["abs","all","any","bin","bool","bytearray","bytes","callable","chr","classmethod","compile","complex","delattr","dict","dir","divmod","enumerate","eval","exec","filter","float","format","frozenset","getattr","globals","hasattr","hash","help","hex","id","input","int","isinstance","issubclass","iter","len","list","locals","map","max","memoryview","min","next","object","oct","open","ord","pow","print","property","range","repr","reversed","round","set","setattr","slice","sorted","staticmethod","str","sum","super","tuple","type","vars","zip"];

  while (i < len) {
    if (line[i] === "#") {
      out += `<span class="tk-cm">${escHtml(line.slice(i))}</span>`;
      break;
    }
    if (line[i] === '"' || line[i] === "'") {
      const q = line[i];
      let j = i + 1;
      while (j < len && line[j] !== q) {
        if (line[j] === "\\") j++;
        j++;
      }
      j = Math.min(j + 1, len);
      out += `<span class="tk-str">${escHtml(line.slice(i, j))}</span>`;
      i = j;
      continue;
    }
    if (/[0-9]/.test(line[i])) {
      let j = i;
      while (j < len && /[0-9.]/.test(line[j])) j++;
      out += `<span class="tk-num">${escHtml(line.slice(i, j))}</span>`;
      i = j;
      continue;
    }
    if (/[a-zA-Zа-яА-ЯёЁ_]/.test(line[i])) {
      let j = i;
      while (j < len && /[a-zA-Zа-яА-ЯёЁ0-9_]/.test(line[j])) j++;
      const word = line.slice(i, j);
      let cls = ["True","False","None"].includes(word) ? "tk-bool"
        : keywords.includes(word) ? "tk-kw"
        : builtins.includes(word) ? "tk-bi"
        : word === "self" ? "tk-self" : null;
      out += cls ? `<span class="${cls}">${escHtml(word)}</span>` : escHtml(word);
      i = j;
      continue;
    }
    if ("()[]{}".includes(line[i])) {
      out += `<span class="tk-paren">${escHtml(line[i])}</span>`;
      i++;
      continue;
    }
    if ("=+-*/<>!&|^~%@".includes(line[i])) {
      out += `<span class="tk-op">${escHtml(line[i])}</span>`;
      i++;
      continue;
    }
    out += escHtml(line[i]);
    i++;
  }
  return out || "&nbsp;";
}

function onEditorInput() {
  if (errorLineNumber !== null) errorLineNumber = null;
  updateGutter();
  highlight();
  syncScroll();
  const ta = document.getElementById("codeEditor");
  if (ta && currentLesson) {
    try { localStorage.setItem(`py_code_L${currentLesson.num}`, ta.value); } catch (e) {}
  }
}

function handleKeyDown(e) {
  const ta = e.target;
  if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
    e.preventDefault();
    toggleRunStop();
    return;
  }
  if (e.key === "Tab") {
    e.preventDefault();
    const s = ta.selectionStart, end = ta.selectionEnd;
    ta.value = ta.value.substring(0, s) + "    " + ta.value.substring(end);
    ta.selectionStart = ta.selectionEnd = s + 4;
    onEditorInput();
    return;
  }
  if (e.key === "Enter") {
    e.preventDefault();
    const pos = ta.selectionStart;
    const before = ta.value.substring(0, pos);
    const after = ta.value.substring(ta.selectionEnd);
    const lines = before.split("\n");
    const currentLine = lines[lines.length - 1];
    let indent = (currentLine.match(/^(\s*)/) || [""])[0];
    if (currentLine.trimEnd().endsWith(":")) indent += "    ";
    const insertion = "\n" + indent;
    ta.value = before + insertion + after;
    ta.selectionStart = ta.selectionEnd = pos + insertion.length;
    onEditorInput();
    return;
  }
}
window.onEditorInput = onEditorInput;
window.handleKeyDown = handleKeyDown;
window.syncScroll = syncScroll;

// ── PYODIDE ERROR ANALYZER ──
async function initPyodide() {
  const statusEl = document.getElementById("pyStatus");
  if (typeof loadPyodide !== "function") {
    if (statusEl) {
      statusEl.textContent = "Готов к работе";
      statusEl.className = "py-status ready";
    }
    return;
  }
  try {
    pyodide = await loadPyodide();
    if (statusEl) {
      statusEl.textContent = "Анализатор: активен";
      statusEl.className = "py-status ready";
    }
  } catch (e) {
    if (statusEl) {
      statusEl.textContent = "Skulpt-режим";
      statusEl.className = "py-status ready";
    }
  }
}

function getFinalHint(errStr, code) {
  const full = errStr.toLowerCase();

  // Check if beginner accidentally used capital Print / Input
  if (/name '(Print|Input|Int|Float|Str|Len|Range)' is not defined/.test(errStr)) {
    const fn = errStr.match(/name '(.*?)' is not defined/)[1];
    return `В Python все команды пишутся с маленькой буквы: напиши <b>${fn.toLowerCase()}()</b> вместо <b>${fn}()</b>.`;
  }

  // Check if beginner mixed Russian and Latin letters in an identifier
  const nameMatch = errStr.match(/name '(.*?)' is not defined/);
  if (nameMatch) {
    const varName = nameMatch[1];
    if (/[а-яА-ЯёЁ]/.test(varName) && /[a-zA-Z]/.test(varName)) {
      return `В имени <b>${escHtml(varName)}</b> смешаны русские и английские буквы (например, русская «с» или «а»). Перепиши имя полностью на одном языке!`;
    }
    return `Переменная или команда <b>${escHtml(varName)}</b> не создана или написана с опечаткой. Проверь, создал ли ты её выше через знак <b>=</b>.`;
  }

  if (full.includes("eol while scanning string literal") || full.includes("unterminated string literal"))
    return "Строка не закрыта кавычкой (<b>\"</b> или <b>'</b>). Проверь, что у каждого текста кавычки открыты и закрыты.";
  if (full.includes("unexpected eof while parsing") || full.includes("incomplete input"))
    return "Программа оборвалась раньше времени: скорее всего, ты забыл закрыть скобку <b>)</b> или дописать тело блока после <b>:</b>.";
  if (full.includes("unmatched ')'") || full.includes("unmatched ']'") || full.includes("unmatched '}'"))
    return "Лишняя закрывающая скобка — проверь, чтобы количество открывающих и закрывающих скобок совпадало.";
  if (full.includes("expected ':'"))
    return "В конце строки с условием (<b>if</b>, <b>elif</b>, <b>else</b>), циклом (<b>for</b>, <b>while</b>) или функцией (<b>def</b>) обязательно нужно поставить двоеточие <b>:</b>.";
  if (full.includes("cannot assign to") || (full.includes("invalid syntax") && /if\s+[^=\n]+=\s*[^=\n]+:/.test(code)))
    return "Внутри условия <b>if / while</b> для сравнения нужно писать ДВА знака равно <b>==</b>, а не один <b>=</b>.";
  if (full.includes("was never closed"))
    return "Открытая скобка <b>(</b> или <b>[</b> не была закрыта. Добавь закрывающую скобку в конце выражения.";
  if (full.includes("expected an indented block"))
    return "После строки с двоеточием (<b>if</b>, <b>for</b>, <b>while</b>, <b>def</b>, <b>with</b>) следующая строка обязательно должна начинаться с отступа (4 пробела или клавиша Tab).";
  if (full.includes("unexpected indent"))
    return "Лишний отступ (пробелы) в начале строки. Убери лишние пробелы слева.";
  if (full.includes("unindent does not match any outer indentation level"))
    return "Неровные отступы: используй ровно по 4 пробела (клавиша Tab) для каждого уровня вложенности.";
  if (full.includes("unsupported operand type(s)") || (full.includes("typeerror") && full.includes("str") && full.includes("int")) || full.includes("can only concatenate str"))
    return "Нельзя напрямую складывать текст (<b>str</b>) и число (<b>int</b>). Используй f-строку <b>f\"{переменная}\"</b>, запятую в <b>print(a, b)</b> или преврати строку в число через <b>int()</b>.";
  if (full.includes("invalid literal for int()") || full.includes("could not convert string to float"))
    return "Функция <b>int()</b> или <b>float()</b> получила текст, который не является числом (например, буквы или пустую строку). Вводи только цифры!";
  if (full.includes("division by zero"))
    return "Деление на ноль (<b>/ 0</b> или <b>// 0</b>) запрещено в математике и в Python.";
  if (full.includes("index out of range"))
    return "Попытка обратиться к индексу, которого нет в списке или строке. Помни: счёт индексов начинается с <b>0</b>, поэтому последний индекс равен <b>len() - 1</b>.";
  if (full.includes("object has no attribute")) {
    const m = errStr.match(/'(.*?)' object has no attribute '(.*?)'/);
    if (m) return `У типа данных <b>${escHtml(m[1])}</b> нет метода <b>.${escHtml(m[2])}()</b>. Проверь название метода и тип переменной.`;
  }
  if (full.includes("'int' object is not iterable"))
    return "По числу нельзя пройтись циклом <b>for</b> напрямую. Если хочешь повторить цикл N раз, напиши <b>for i in range(N):</b>.";
  if (full.includes("no such file or directory") || full.includes("filenotfounderror"))
    return "Файл с таким именем ещё не создан! Сначала создай его в режиме записи <b>open(\"имя.txt\", \"w\")</b> или проверь имя файла.";
  if (full.includes("timelimiterror") || full.includes("program exceeded run time limit"))
    return "Программа выполнялась слишком долго (возможно, получился бесконечный цикл <b>while</b>, в котором не меняется счётчик и нет <b>break</b>).";
  if (full.includes("invalid syntax"))
    return "Ошибка синтаксиса: проверь закрыты ли скобки и кавычки, стоят ли двоеточия после <b>if/for/while/def</b> и нет ли русских букв в командах.";

  return "Проверь строку с ошибкой: возможно, пропущена скобка, кавычка, двоеточие или допущена опечатка в названии команды.";
}

function extractLineNumber(errStr) {
  const m = errStr.match(/line\s+(\d+)/i);
  return m ? parseInt(m[1], 10) : null;
}

function cleanErr(err) {
  let s = err;
  if (s.includes('File "<stdin>"')) s = s.split('File "<stdin>", ').pop();
  if (s.includes('File "<exec>"')) s = s.split('File "<exec>"').pop();
  return s.trim();
}

function showErrorBox(msg, hint, lineNum) {
  const outEl = document.getElementById("output");
  const status = document.getElementById("outputStatus");
  if (!outEl) return;

  if (lineNum) {
    errorLineNumber = lineNum;
    updateGutter();
    highlight();
  }

  const box = document.createElement("div");
  box.className = "out-error-block";
  box.innerHTML = `
    <div class="out-error-type"><i class="pb-icon" data-flaticon="triangle-warning"></i> Ошибка в программе${lineNum ? ` (строка ${lineNum})` : ""}</div>
    <div class="out-error-msg">${escHtml(cleanErr(msg))}</div>
    <div class="out-error-tip">
      <span class="out-error-tip-label"><i class="pb-icon" data-flaticon="bulb"></i> Как исправить:</span>
      ${hint}
    </div>
  `;
  outEl.appendChild(box);
  if (status) {
    status.innerHTML = '<i class="pb-icon" data-flaticon="cross"></i> Ошибка';
    status.className = "output-status err";
  }
}

// ── PREPROCESS PYTHON CODE FOR SKULPT (f-string format specs + VFS support) ──
function preprocessForSkulpt(code) {
  // 1. Convert f-string format specifiers like {expr:.2f} -> {format(expr, '.2f')} if needed
  let processed = code.replace(/f(["'])((?:\\.|(?!\1)[^\\])*)\1/g, (fullMatch, quote, inner) => {
    const fixedInner = inner.replace(/\{([^{}:]+):([^{}]+)\}/g, "{format($1, '$2')}");
    return `f${quote}${fixedInner}${quote}`;
  });
  return processed;
}

// Build a Python preamble that provides full read/write/append + "with open(...)" VFS inside Skulpt
function buildVfsPreamble() {
  const jsonFiles = JSON.stringify(vfsFiles);
  return `
__vfs_data__ = ${jsonFiles}

class __VFSFile__:
    def __init__(self, name, mode="r", encoding=None):
        self.name = str(name)
        self.mode = str(mode)
        self.closed = False
        if "r" in self.mode and self.name not in __vfs_data__:
            raise IOError("No such file or directory: '" + self.name + "'")
        if "w" in self.mode:
            __vfs_data__[self.name] = ""
        elif "a" in self.mode and self.name not in __vfs_data__:
            __vfs_data__[self.name] = ""
        self._content = __vfs_data__.get(self.name, "")
        self._pos = len(self._content) if "a" in self.mode else 0

    def write(self, s):
        if self.closed:
            raise ValueError("I/O operation on closed file.")
        if "r" in self.mode and "+" not in self.mode:
            raise IOError("File not open for writing")
        s = str(s)
        __vfs_data__[self.name] = __vfs_data__.get(self.name, "") + s
        self._content = __vfs_data__[self.name]
        return len(s)

    def writelines(self, lines):
        for line in lines:
            self.write(line)

    def read(self, size=-1):
        if self.closed:
            raise ValueError("I/O operation on closed file.")
        data = __vfs_data__.get(self.name, "")
        if size is None or size < 0:
            res = data[self._pos:]
            self._pos = len(data)
            return res
        res = data[self._pos:self._pos + size]
        self._pos += len(res)
        return res

    def readline(self):
        data = __vfs_data__.get(self.name, "")
        if self._pos >= len(data):
            return ""
        idx = data.find("\\n", self._pos)
        if idx == -1:
            res = data[self._pos:]
            self._pos = len(data)
            return res
        res = data[self._pos:idx + 1]
        self._pos = idx + 1
        return res

    def readlines(self):
        data = self.read()
        if not data:
            return []
        lines = data.split("\\n")
        res = []
        for i in range(len(lines)):
            if i < len(lines) - 1:
                res.append(lines[i] + "\\n")
            elif lines[i] != "":
                res.append(lines[i])
        return res

    def close(self):
        self.closed = True

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()
        return False

    def __iter__(self):
        return iter(self.readlines())

def open(name, mode="r", encoding=None):
    return __VFSFile__(name, mode, encoding)
`;
}

function setRunningUI(running) {
  isRunning = running;
  const btn = document.getElementById("runStopBtn");
  if (!btn) return;
  if (running) {
    btn.innerHTML = '<i class="pb-icon" data-flaticon="cross"></i> Остановить';
    btn.className = "rh-btn stop-btn";
  } else {
    btn.innerHTML = '<i class="pb-icon" data-flaticon="play"></i> Запустить';
    btn.className = "rh-btn run-btn";
  }
}

function stopCodeExecution() {
  stopRequested = true;
  if (activeInputResolve) {
    const r = activeInputResolve;
    activeInputResolve = null;
    r("__STOPPED__");
  }
}

async function runCode() {
  const ta = document.getElementById("codeEditor");
  const outEl = document.getElementById("output");
  const status = document.getElementById("outputStatus");
  if (!ta || !outEl || !status) return;

  const rawCode = ta.value;
  clearErrorHighlight();
  stopRequested = false;
  setRunningUI(true);

  outEl.innerHTML = "";
  status.innerHTML = '<i class="pb-icon" data-flaticon="time-fast"></i> выполняется…';
  status.className = "output-status running";

  const usesFiles = /\bopen\s*\(/.test(rawCode);
  const preamble = usesFiles ? buildVfsPreamble() : "";
  const preambleLines = preamble ? preamble.split("\n").length - 1 : 0;
  const execCode = preamble + (preamble ? "\n" : "") + preprocessForSkulpt(rawCode);

  Sk.configure({
    __future__: Sk.python3,
    output: (t) => {
      if (stopRequested) throw new Error("KeyboardInterrupt: Остановлено пользователем");
      let lastLine = outEl.lastElementChild;
      if (lastLine && lastLine.classList.contains("out-line") && !lastLine.textContent.endsWith("\n")) {
        lastLine.textContent += t;
      } else {
        const s = document.createElement("span");
        s.className = "out-line";
        s.textContent = t;
        outEl.appendChild(s);
      }
      outEl.scrollTop = outEl.scrollHeight;
    },
    read: (x) => {
      if (vfsFiles[x] !== undefined) return vfsFiles[x];
      if (!Sk.builtinFiles || !Sk.builtinFiles["files"][x]) throw "File not found: '" + x + "'";
      return Sk.builtinFiles["files"][x];
    },
    inputfun: (promptText) => new Promise((resolve) => {
      if (stopRequested) {
        resolve("");
        return;
      }
      const div = document.createElement("div");
      div.className = "out-input-line";
      div.innerHTML = `
        <span class="out-input-prompt">${escHtml(promptText || "")}</span>
        <input type="text" class="out-input-field" placeholder="Введи значение и нажми Enter…">
        <button type="button" class="out-input-submit">Ввод ↵</button>
      `;
      outEl.appendChild(div);
      outEl.scrollTop = outEl.scrollHeight;

      const inp = div.querySelector("input");
      const submitBtn = div.querySelector(".out-input-submit");
      inp.focus();

      const finishInput = () => {
        if (!activeInputResolve) return;
        activeInputResolve = null;
        const val = inp.value;
        div.innerHTML = `<span class="out-input-prompt">${escHtml(promptText || "")}</span><span class="out-input-done">${escHtml(val)}</span>`;
        resolve(val);
      };

      activeInputResolve = (forcedVal) => {
        if (forcedVal === "__STOPPED__") {
          div.innerHTML = `<span class="out-input-prompt">${escHtml(promptText || "")}</span><span class="out-input-done" style="color:#ef4444">[ввод отменён]</span>`;
          resolve("");
          return;
        }
        finishInput();
      };

      inp.onkeydown = (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          finishInput();
        }
      };
      submitBtn.onclick = finishInput;
    }),
    inputfunTakesPrompt: true,
    execLimit: 8000,
    yieldLimit: 80,
    killableWhile: true,
    killableFor: true
  });

  try {
    const mod = await Sk.misceval.asyncToPromise(
      () => Sk.importMainWithBody("<stdin>", false, execCode, true),
      {
        "*": () => {
          if (stopRequested) {
            throw new Error("KeyboardInterrupt: Остановлено пользователем");
          }
        }
      }
    );

    // Sync back any modified VFS files from Skulpt globals
    if (usesFiles && mod && mod.$d && mod.$d.__vfs_data__) {
      const pyDict = mod.$d.__vfs_data__;
      const jsObj = Sk.ffi.remapToJs(pyDict);
      if (jsObj && typeof jsObj === "object") {
        vfsFiles = { ...vfsFiles, ...jsObj };
        saveVfsToStorage();
        const vfsBar = document.getElementById("vfsBar");
        if (vfsBar) vfsBar.classList.add("visible");
      }
    }

    if (outEl.children.length === 0) {
      const emptyHint = document.createElement("span");
      emptyHint.className = "out-hint";
      emptyHint.innerHTML = '<i class="pb-icon" data-flaticon="check"></i> Программа успешно выполнилась (нет вывода на экран). Добавь print(), чтобы увидеть результат.';
      outEl.appendChild(emptyHint);
    }
    status.innerHTML = '<i class="pb-icon" data-flaticon="check"></i> выполнено';
    status.className = "output-status ok";
  } catch (e) {
    let finalErr = e.toString();

    if (stopRequested || finalErr.includes("KeyboardInterrupt")) {
      const stopLine = document.createElement("span");
      stopLine.className = "out-hint";
      stopLine.style.color = "#ef4444";
      stopLine.innerHTML = '<i class="pb-icon" data-flaticon="cross"></i> Выполнение программы остановлено пользователем.';
      outEl.appendChild(stopLine);
      status.innerHTML = '<i class="pb-icon" data-flaticon="cross"></i> остановлено';
      status.className = "output-status err";
    } else {
      // Adjust line number if VFS preamble was prepended
      if (preambleLines > 0) {
        finalErr = finalErr.replace(/line\s+(\d+)/gi, (_, n) => {
          const realLine = Math.max(1, parseInt(n, 10) - preambleLines);
          return `line ${realLine}`;
        });
      }

      if (pyodide) {
        try {
          pyodide.runPython(`compile(${JSON.stringify(rawCode)}, '<stdin>', 'exec')`);
        } catch (pyErr) {
          finalErr = pyErr.toString();
        }
      }

      const lineNum = extractLineNumber(finalErr);
      const hint = getFinalHint(finalErr, rawCode);
      showErrorBox(finalErr, hint, lineNum);
    }
  } finally {
    setRunningUI(false);
    outEl.scrollTop = outEl.scrollHeight;
  }
}

function toggleRunStop() {
  if (isRunning) {
    stopCodeExecution();
  } else {
    runCode();
  }
}
window.toggleRunStop = toggleRunStop;
window.runCode = runCode;

// ── QUIZ HANDLER (WITH RETRY SUPPORT) ──
function quiz(btn, type, qid) {
  const q = btn.closest(".quiz-card");
  if (!q) return;
  q.querySelectorAll(".quiz-opt").forEach(b => {
    b.classList.remove("correct", "wrong");
  });
  btn.classList.add(type);
  const fb = document.getElementById(qid + "-feedback") || q.querySelector(".quiz-feedback");
  if (fb) {
    if (type === "correct") {
      fb.innerHTML = '<i class="pb-icon" data-flaticon="check"></i> Верно! Отличная работа.';
      fb.className = "quiz-feedback show ok";
      q.querySelectorAll(".quiz-opt").forEach(b => b.disabled = true);
    } else {
      fb.innerHTML = '<i class="pb-icon" data-flaticon="cross"></i> Пока не так. Подумай ещё раз и выбери другой вариант!';
      fb.className = "quiz-feedback show no";
    }
  }
}
window.quiz = quiz;

// ── INITIALIZATION ──
function initPythonBasicsApp() {
  initNavigation();
  initContentWidgets();
  initCompilerPanel();
  initDivider();
  updateGutter();
  highlight();
  initPyodide();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initPythonBasicsApp);
} else {
  initPythonBasicsApp();
}

