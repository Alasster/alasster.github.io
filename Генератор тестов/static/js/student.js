// «Бағалау» — Клиентская часть ученика (Student Exam Controller)

let launchId = "";
let launchInfo = null;
let currentAttempt = null;
let currentTasks = [];
let localDrafts = {}; // taskId -> { answer, version, synced }
let timerInterval = null;
let heartbeatInterval = null;
let currentRemainingSeconds = null;

// =========================================================================
// ТИХАЯ ЗАЩИТА ОТ СПИСЫВАНИЯ (БЕЗ АЛЕРТОВ И УВЕДОМЛЕНИЙ)
// =========================================================================
document.addEventListener("keydown", (e) => {
  // F12
  if (e.key === "F12" || e.keyCode === 123) {
    e.preventDefault();
    e.stopPropagation();
    return false;
  }
  // Ctrl+Shift+I / J / C (DevTools)
  if (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "i" || e.key === "J" || e.key === "j" || e.key === "C" || e.key === "c")) {
    e.preventDefault();
    e.stopPropagation();
    return false;
  }
  // Ctrl+U (Просмотр исходного кода)
  if (e.ctrlKey && (e.key === "U" || e.key === "u")) {
    e.preventDefault();
    e.stopPropagation();
    return false;
  }
}, true);

// Запрет контекстного меню (в том числе для поиска по картинкам / Google Lens)
document.addEventListener("contextmenu", (e) => {
  e.preventDefault();
  return false;
}, true);

// Запрет перетаскивания изображений
document.addEventListener("dragstart", (e) => {
  if (e.target && e.target.nodeName === "IMG") {
    e.preventDefault();
    return false;
  }
}, true);

// =========================================================================
// ИНИЦИАЛИЗАЦИЯ
// =========================================================================
document.addEventListener("DOMContentLoaded", async () => {
  const pathParts = window.location.pathname.split("/").filter(Boolean);
  launchId = pathParts[pathParts.length - 1];

  const urlParams = new URLSearchParams(window.location.search);
  const recoveryToken = urlParams.get("recovery_token");
  if (recoveryToken) {
    sessionStorage.setItem("bagalau_student_token", recoveryToken);
    window.history.replaceState({}, document.title, window.location.pathname);
  }

  const pcParam = urlParams.get("pc") || urlParams.get("desk");
  if (pcParam) {
    const deskInput = document.getElementById("student-desk-input");
    if (deskInput) deskInput.value = pcParam;
  }

  await loadLaunchPublicInfo();
  await checkExistingAttempt();
  initDraggableCalculator();
});

// Загрузка открытых метаданных проведения
async function loadLaunchPublicInfo() {
  try {
    const res = await fetch(`/api/student/check/${launchId}`);
    if (!res.ok) {
      const err = await res.json();
      showScreen("screen-error");
      document.getElementById("error-msg").textContent = err.detail || "Работа не найдена";
      return;
    }
    launchInfo = await res.json();
    populateLaunchInfoOnScreens();
  } catch (err) {
    showScreen("screen-error");
    document.getElementById("error-msg").textContent = "Ошибка подключения к серверу";
  }
}

function populateLaunchInfoOnScreens() {
  document.querySelectorAll(".exam-title-text").forEach(el => el.textContent = launchInfo.title);
  document.querySelectorAll(".exam-subject-text").forEach(el => el.textContent = `${launchInfo.exam_type} · ${launchInfo.subject} · ${launchInfo.grade_level}`);
  document.getElementById("intro-instructions").textContent = launchInfo.instructions || "Внимательно прочитайте каждое задание перед отправкой работы.";
  document.getElementById("intro-task-count").textContent = launchInfo.task_count;
  document.getElementById("intro-max-score").textContent = launchInfo.total_max_score;
  document.getElementById("intro-duration").textContent = launchInfo.duration_minutes ? `${launchInfo.duration_minutes} мин` : "Без ограничения";

  // Цвета вариантов для карточек выбора
  const v1Color = launchInfo.bg_color_v1 || "#FCE8E6";
  const v2Color = launchInfo.bg_color_v2 || "#E6F4EA";
  const dot1 = document.getElementById("var-dot-1");
  const dot2 = document.getElementById("var-dot-2");
  if (dot1) dot1.style.background = v1Color;
  if (dot2) dot2.style.background = v2Color;

  // Настройка выбора параллели и буквы
  const gradeSelect = document.getElementById("student-grade-select");
  const letterSelect = document.getElementById("student-letter-input");
  gradeSelect.innerHTML = '<option value="">-- Выберите класс --</option>';
  letterSelect.innerHTML = '<option value="">-- Выберите букву --</option>';

  const CLASS_LETTERS = ["А", "Б", "В", "Г", "Д", "Е", "Ж", "З", "И", "К", "Л", "М", "Н", "О", "П"];
  const allowed = launchInfo.allowed_classes || [];
  const gradesSet = new Set();
  const lettersSet = new Set();
  const gradeToLetters = {}; // параллель -> Set букв

  allowed.forEach(cls => {
    const trimmed = cls.trim();
    const parts = trimmed.split(/\s+/);
    if (parts.length >= 2) {
      const last = parts[parts.length - 1].toUpperCase();
      if (CLASS_LETTERS.includes(last)) {
        const gradeName = parts.slice(0, -1).join(" ");
        gradesSet.add(gradeName);
        lettersSet.add(last);
        if (!gradeToLetters[gradeName]) gradeToLetters[gradeName] = new Set();
        gradeToLetters[gradeName].add(last);
      } else {
        gradesSet.add(trimmed);
      }
    } else {
      gradesSet.add(trimmed);
    }
  });

  if (gradesSet.size === 0) {
    gradesSet.add(launchInfo.grade_level || "9");
  }

  // Буквы, настроенные учителем в тесте
  const testLetters = (launchInfo.class_letters && launchInfo.class_letters.length > 0)
    ? launchInfo.class_letters.filter(l => CLASS_LETTERS.includes(l))
    : [];

  gradesSet.forEach(g => {
    const opt = document.createElement("option");
    opt.value = g;
    opt.textContent = `${g} класс`;
    gradeSelect.appendChild(opt);
  });

  function updateLettersForSelectedGrade() {
    const selectedGrade = gradeSelect.value.trim();
    letterSelect.innerHTML = '<option value="">-- Буква --</option>';

    let available = [];
    if (selectedGrade && gradeToLetters[selectedGrade] && gradeToLetters[selectedGrade].size > 0) {
      available = Array.from(gradeToLetters[selectedGrade]);
    } else if (lettersSet.size > 0) {
      available = Array.from(lettersSet);
    } else if (testLetters.length > 0) {
      available = testLetters;
    } else {
      available = CLASS_LETTERS;
    }

    available.sort().forEach(l => {
      const opt = document.createElement("option");
      opt.value = l;
      opt.textContent = l;
      letterSelect.appendChild(opt);
    });

    if (available.length === 1) {
      letterSelect.value = available[0];
    }
    syncCombinedClass();
  }

  gradeSelect.addEventListener("change", () => {
    updateLettersForSelectedGrade();
  });
  letterSelect.addEventListener("change", syncCombinedClass);

  if (gradesSet.size === 1) {
    gradeSelect.value = Array.from(gradesSet)[0];
    updateLettersForSelectedGrade();
  } else {
    updateLettersForSelectedGrade();
  }

  // Инициализируем предпросмотр фона для выбранного варианта
  selectVariant(document.getElementById("student-variant-input")?.value || "1");
}

function selectVariant(v) {
  const input = document.getElementById("student-variant-input");
  if (input) input.value = v;

  document.querySelectorAll(".variant-pick-card").forEach(c => c.classList.remove("active"));
  const activeCard = document.getElementById(`var-card-${v}`);
  if (activeCard) activeCard.classList.add("active");

  const color = v === "2" ? (launchInfo?.bg_color_v2 || "#E6F4EA") : (launchInfo?.bg_color_v1 || "#FCE8E6");
  applyCustomBgColor(color);

  if (launchInfo) {
    const taskCnt = v === "2" ? (launchInfo.task_count_v2 ?? launchInfo.task_count) : (launchInfo.task_count_v1 ?? launchInfo.task_count);
    const maxSc = v === "2" ? (launchInfo.max_score_v2 ?? launchInfo.total_max_score) : (launchInfo.max_score_v1 ?? launchInfo.total_max_score);
    const taskCntEl = document.getElementById("intro-task-count");
    const maxScEl = document.getElementById("intro-max-score");
    if (taskCntEl && taskCnt !== undefined) taskCntEl.textContent = taskCnt;
    if (maxScEl && maxSc !== undefined) maxScEl.textContent = maxSc;
  }
}


function syncCombinedClass() {
  const g = document.getElementById("student-grade-select").value.trim();
  const l = document.getElementById("student-letter-input").value.trim();
  const hiddenInput = document.getElementById("student-class-select");
  if (g && l) {
    hiddenInput.value = `${g} ${l}`;
  } else if (g) {
    hiddenInput.value = g;
  } else {
    hiddenInput.value = "";
  }
}

function onGradeSelectChange() {
  syncCombinedClass();
}

// Завершить и закрыть
function logoutStudentAndReset() {
  sessionStorage.clear();
  localStorage.removeItem("bagalau_student_token");
  if (launchId) {
    localStorage.removeItem(`draft_answers_${launchId}`);
  }
  document.cookie = "bagalau_student_token=; path=/; max-age=0;";
  window.close();
  setTimeout(() => {
    window.location.reload();
  }, 150);
}

// Проверка наличия активной попытки
async function checkExistingAttempt() {
  const token = sessionStorage.getItem("bagalau_student_token");
  if (!token) {
    showScreen("screen-join");
    return;
  }

  try {
    const res = await fetch("/api/student/attempt", {
      headers: { "X-Attempt-Token": token }
    });
    if (!res.ok) {
      sessionStorage.removeItem("bagalau_student_token");
      showScreen("screen-join");
      return;
    }
    currentAttempt = await res.json();
    applyCustomBgColor(currentAttempt.bg_color);

    // Обновляем бейджи варианта на всех экранах
    const varNum = currentAttempt.variant || "1";
    const varText = `Вариант ${varNum}`;
    const varBg = varNum === "2" ? (currentAttempt.bg_color_v2 || "#E6F4EA") : (currentAttempt.bg_color_v1 || "#FCE8E6");
    const varColor = varNum === "2" ? "#166534" : "#991B1B";

    const introVarBadge = document.getElementById("intro-variant-badge");
    if (introVarBadge) {
      introVarBadge.textContent = varText;
      introVarBadge.style.background = varBg;
      introVarBadge.style.color = varColor;
    }
    const stuVarBadge = document.getElementById("student-variant-badge");
    if (stuVarBadge) {
      stuVarBadge.textContent = `Вар. ${varNum}`;
      stuVarBadge.style.background = varBg;
      stuVarBadge.style.color = varColor;
    }

    handleAttemptState();
  } catch (err) {
    restoreFromOfflineDraft();
  }
}

function applyCustomBgColor(color) {
  if (color) {
    document.body.style.backgroundColor = color;
  }
}

function handleAttemptState() {
  const status = currentAttempt.status;
  const launchStatus = currentAttempt.launch_status;

  if (status === "submitted" || status === "time_expired") {
    showSubmissionSuccessScreen();
    return;
  }

  if (status === "blocked") {
    showScreen("screen-blocked");
    return;
  }

  if (status === "waiting_approval") {
    showScreen("screen-waiting-approval");
    startHeartbeatAndPoll();
    return;
  }

  if (launchStatus !== "active") {
    showScreen("screen-waiting-room");
    startHeartbeatAndPoll();
    return;
  }

  if (status === "in_waiting" || status === "approved") {
    showScreen("screen-intro");
    return;
  }

  if (status === "in_progress") {
    startExamSession();
    return;
  }

  showScreen("screen-join");
}

// Отправка формы входа ученика
document.getElementById("join-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  syncCombinedClass();

  const name = document.getElementById("student-name-input").value.trim();
  const sClass = document.getElementById("student-class-select").value.trim();
  const variant = document.getElementById("student-variant-input")?.value || "1";
  const deskInput = document.getElementById("student-desk-input");
  const deskNumber = deskInput ? deskInput.value.trim() : "";

  if (!name || !sClass) {
    alert("Пожалуйста, введите фамилию, имя и выберите класс и букву");
    return;
  }

  const joinBtn = document.getElementById("join-btn");
  joinBtn.disabled = true;
  joinBtn.textContent = "Вход...";

  try {
    const res = await fetch(`/api/student/join/${launchId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        student_name: name,
        student_class: sClass,
        variant: variant,
        desk_number: deskNumber
      })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Ошибка подключения");

    sessionStorage.setItem("bagalau_student_token", data.attempt_token);
    await checkExistingAttempt();
  } catch (err) {
    alert(err.message);
    joinBtn.disabled = false;
    joinBtn.textContent = "Подтвердить и продолжить";
  }
});

// Нажатие кнопки "Начать выполнение работы"
document.getElementById("btn-start-exam").addEventListener("click", async () => {
  const token = sessionStorage.getItem("bagalau_student_token");
  const btn = document.getElementById("btn-start-exam");
  btn.disabled = true;
  btn.textContent = "Загрузка заданий...";

  try {
    const res = await fetch("/api/student/start", {
      method: "POST",
      headers: { "X-Attempt-Token": token }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Не удалось начать работу");

    // Загружаем полные актуальные данные попытки с заданиями с сервера
    await checkExistingAttempt();
  } catch (err) {
    alert(err.message);
    btn.disabled = false;
    btn.textContent = "Начать выполнение работы";
  }
});

// Запуск сессии выполнения заданий
async function startExamSession() {
  const token = sessionStorage.getItem("bagalau_student_token");
  
  // Если задания ещё не загружены в память (например, были в режиме ожидания), запрашиваем с сервера
  if (!currentAttempt || !currentAttempt.tasks || currentAttempt.tasks.length === 0) {
    if (token) {
      try {
        const res = await fetch("/api/student/attempt", {
          headers: { "X-Attempt-Token": token }
        });
        if (res.ok) {
          currentAttempt = await res.json();
        }
      } catch (e) {
        console.error("Не удалось подгрузить задания попытки", e);
      }
    }
  }

  showScreen("screen-testing");
  if (currentAttempt) {
    document.getElementById("student-info-badge").textContent = `${currentAttempt.student_name} (${currentAttempt.student_class})`;

    if (currentAttempt.bg_color) {
      applyCustomBgColor(currentAttempt.bg_color);
    }

    // Обновляем бейдж варианта на экране выполнения
    const varNum = currentAttempt.variant || "1";
    const varBg = varNum === "2" ? (currentAttempt.bg_color_v2 || "#E6F4EA") : (currentAttempt.bg_color_v1 || "#FCE8E6");
    const varColor = varNum === "2" ? "#166534" : "#991B1B";
    const stuVarBadge = document.getElementById("student-variant-badge");
    if (stuVarBadge) {
      stuVarBadge.textContent = `Вар. ${varNum}`;
      stuVarBadge.style.background = varBg;
      stuVarBadge.style.color = varColor;
    }

    // Загружаем сохраненные ответы
    localDrafts = {};
    if (currentAttempt.answers) {
      for (const [taskId, data] of Object.entries(currentAttempt.answers)) {
        localDrafts[taskId] = { answer: data.answer, version: data.version, synced: true };
      }
    }
  }

  currentTasks = (currentAttempt && currentAttempt.tasks) ? currentAttempt.tasks : [];
  renderTasks();
  updateProgressIndicator();
  if (currentAttempt && currentAttempt.server_deadline) {
    startTimer(currentAttempt.server_deadline);
  }
  startHeartbeatAndPoll();

  if (window.renderMathInElement) {
    renderMathInElement(document.getElementById("tasks-container"), {
      delimiters: [
        {left: '$$', right: '$$', display: true},
        {left: '$', right: '$', display: false}
      ],
      throwOnError: false
    });
  }
}

// Рендеринг всех 10 типов заданий
function renderTasks() {
  const container = document.getElementById("tasks-container");
  container.innerHTML = "";

  currentTasks.forEach((t, idx) => {
    const card = document.createElement("div");
    card.className = "card";
    card.id = `task-card-${t.id}`;
    card.style.marginBottom = "1.5rem";

    const saved = localDrafts[t.id] ? localDrafts[t.id].answer : null;
    let inputHtml = "";

    // 1. Один выбор
    if (t.question_type === "single_choice") {
      inputHtml = `<div class="options-list">`;
      (t.options || []).forEach((opt, optIdx) => {
        const isSelected = saved !== null && String(saved) === String(opt);
        inputHtml += `
          <label class="option-label ${isSelected ? 'selected' : ''}" id="opt-label-${t.id}-${optIdx}">
            <input type="radio" name="task_${t.id}" value="${escapeHtml(opt)}" ${isSelected ? 'checked' : ''} onchange="handleAnswerChange('${t.id}', this.value, 'single', ${optIdx})">
            <span>${escapeHtml(opt)}</span>
          </label>
        `;
      });
      inputHtml += `</div>`;
    }
    // 2. Множественный выбор
    else if (t.question_type === "multi_choice") {
      const selectedList = Array.isArray(saved) ? saved.map(String) : [];
      inputHtml = `<div class="options-list">`;
      (t.options || []).forEach((opt, optIdx) => {
        const isSelected = selectedList.includes(String(opt));
        inputHtml += `
          <label class="option-label ${isSelected ? 'selected' : ''}" id="opt-label-${t.id}-${optIdx}">
            <input type="checkbox" name="task_${t.id}" value="${escapeHtml(opt)}" ${isSelected ? 'checked' : ''} onchange="handleMultiChoiceChange('${t.id}', this.value, this.checked, ${optIdx})">
            <span>${escapeHtml(opt)}</span>
          </label>
        `;
      });
      inputHtml += `</div>`;
    }
    // 3. Числовой ответ
    else if (t.question_type === "number") {
      inputHtml = `
        <div style="max-width: 280px;">
          <input type="text" class="form-control" style="font-family: 'JetBrains Mono', monospace; font-size: 1.1rem; font-weight: 700;" placeholder="Введите число..." value="${saved !== null ? escapeHtml(saved) : ''}" oninput="handleAnswerChange('${t.id}', this.value, 'number')">
        </div>
      `;
    }
    // 4. Короткий текст
    else if (t.question_type === "short_text") {
      inputHtml = `
        <div>
          <input type="text" class="form-control" placeholder="Введите ваш краткий ответ..." value="${saved !== null ? escapeHtml(saved) : ''}" oninput="handleAnswerChange('${t.id}', this.value, 'text')">
        </div>
      `;
    }
    // 5. Заполни пропуск (Fill blank)
    else if (t.question_type === "fill_blank") {
      inputHtml = `
        <div>
          <input type="text" class="form-control" style="font-weight: 600;" placeholder="Впишите пропущенное слово..." value="${saved !== null ? escapeHtml(saved) : ''}" oninput="handleAnswerChange('${t.id}', this.value, 'fill_blank')">
        </div>
      `;
    }
    // 6. Верно / Неверно (True / False)
    else if (t.question_type === "true_false") {
      const isTrue = saved === "Верно" || saved === true || saved === "true";
      const isFalse = saved === "Неверно" || saved === false || saved === "false";
      inputHtml = '<div class="tf-group">' + (t.options?.length ? t.options : ["Верно", "Неверно"]).map(opt => {
        const truth = opt === "Верно";
        const selected = truth ? isTrue : isFalse;
        return `<div class="tf-option ${selected ? (truth ? 'selected-true' : 'selected-false') : ''}" onclick="handleTrueFalseChoice('${t.id}', '${truth ? 'Верно' : 'Неверно'}')">
          ${truth ? '✓ Верно' : '✕ Неверно'}
        </div>`;
      }).join('') + '</div>';
    }
    // 7. Восстановление последовательности (Ordering)
    else if (t.question_type === "ordering") {
      let currentOrder = Array.isArray(saved) && saved.length > 0 ? saved : (t.options || []);
      inputHtml = `<div class="ordering-container" id="ordering-list-${t.id}">`;
      currentOrder.forEach((item, itemIdx) => {
        inputHtml += `
          <div class="ordering-item">
            <span class="ordering-index">${itemIdx + 1}.</span>
            <span class="ordering-text">${escapeHtml(item)}</span>
            <div class="ordering-btns">
              <button type="button" class="ordering-btn" ${itemIdx === 0 ? 'disabled' : ''} onclick="moveOrderItem('${t.id}', ${itemIdx}, -1)">▲</button>
              <button type="button" class="ordering-btn" ${itemIdx === currentOrder.length - 1 ? 'disabled' : ''} onclick="moveOrderItem('${t.id}', ${itemIdx}, 1)">▼</button>
            </div>
          </div>
        `;
      });
      inputHtml += `</div>`;
    }
    // 8. Сопоставление пар (Matching)
    else if (t.question_type === "matching") {
      const currentPairs = (saved && typeof saved === "object") ? saved : {};
      const leftItems = t.match_items_left || [];
      const rightItems = t.match_items_right || [];

      inputHtml = `<table class="matching-table"><tbody>`;
      leftItems.forEach(left => {
        const curRight = currentPairs[left] || "";
        inputHtml += `
          <tr class="matching-row">
            <td class="matching-left">${escapeHtml(left)}</td>
            <td>
              <select class="form-control" onchange="handleMatchingChange('${t.id}', '${escapeHtml(left)}', this.value)">
                <option value="">-- Выберите соответствие --</option>
                ${rightItems.map(r => `<option value="${escapeHtml(r)}" ${curRight === r ? 'selected' : ''}>${escapeHtml(r)}</option>`).join('')}
              </select>
            </td>
          </tr>
        `;
      });
      inputHtml += `</tbody></table>`;
    }
    // 9. Выпадающий список в тексте (Dropdown)
    else if (t.question_type === "dropdown") {
      inputHtml = `
        <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
          <span>Выберите верный вариант:</span>
          <select class="inline-select" onchange="handleAnswerChange('${t.id}', this.value, 'dropdown')">
            <option value="">-- Выберите вариант --</option>
            ${(t.options || []).map(opt => `<option value="${escapeHtml(opt)}" ${saved === opt ? 'selected' : ''}>${escapeHtml(opt)}</option>`).join('')}
          </select>
        </div>
      `;
    }
    // 10. Распределение по 2 категориям (Group classification)
    else if (t.question_type === "group_classification") {
      const curClasses = (saved && typeof saved === "object") ? saved : {};
      const cats = t.categories && t.categories.length >= 2 ? t.categories : ["Категория А", "Категория Б"];
      const items = t.options || [];

      inputHtml = `<div class="classification-container">`;
      items.forEach(item => {
        const assigned = curClasses[item] || "";
        inputHtml += `
          <div class="classification-item">
            <div class="classification-text">${escapeHtml(item)}</div>
            <div class="classification-buttons">
              <button type="button" class="class-btn ${assigned === cats[0] ? 'active' : ''}" onclick="handleGroupAssign('${t.id}', '${escapeHtml(item)}', '${escapeHtml(cats[0])}')">${escapeHtml(cats[0])}</button>
              <button type="button" class="class-btn ${assigned === cats[1] ? 'active' : ''}" onclick="handleGroupAssign('${t.id}', '${escapeHtml(item)}', '${escapeHtml(cats[1])}')">${escapeHtml(cats[1])}</button>
            </div>
          </div>
        `;
      });
      inputHtml += `</div>`;
    }
    // Ручной ввод развернутого ответа (резервный)
    else {
      inputHtml = `
        <div>
          <textarea class="form-control" rows="4" placeholder="Введите развернутый ответ..." oninput="handleAnswerChange('${t.id}', this.value, 'manual')">${saved !== null ? escapeHtml(saved) : ''}</textarea>
        </div>
      `;
    }

    // Изображение к заданию с защитой
    let imageHtml = "";
    if (t.image_url) {
      const alignClass = `align-${t.image_align || 'center'}`;
      let sizeClass = "size-100";
      if (t.image_size === "200px") sizeClass = "size-200";
      else if (t.image_size === "400px" || t.image_size === "450px") sizeClass = "size-450";

      imageHtml = `
        <div class="task-image-box ${alignClass} ${sizeClass}">
          <div class="img-shield-wrapper">
            <div class="img-shield-overlay"></div>
            <img src="${escapeHtml(t.image_url)}" class="task-img-protected" alt="Иллюстрация к заданию">
          </div>
        </div>
      `;
    }

    card.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.85rem; border-bottom: 1px solid var(--border); padding-bottom: 0.5rem;">
        <span class="badge badge-indigo">Задание ${idx + 1}</span>
        <span style="font-size: 0.85rem; font-weight: 700; color: var(--text-muted);">${t.max_score} б.</span>
      </div>

      <div class="task-condition">${escapeHtml(t.question_text)}</div>
      ${imageHtml}
      <div style="margin-top: 1rem;">${inputHtml}</div>
    `;

    container.appendChild(card);
  });
}

// Обработчики изменений ответов
function handleAnswerChange(taskId, value, type, optIdx = null) {
  if (type === "single") {
    document.querySelectorAll(`[id^="opt-label-${taskId}-"]`).forEach(l => l.classList.remove("selected"));
    if (optIdx !== null) {
      const lbl = document.getElementById(`opt-label-${taskId}-${optIdx}`);
      if (lbl) lbl.classList.add("selected");
    }
  }
  saveAnswer(taskId, value);
}

function handleMultiChoiceChange(taskId, optionVal, isChecked, optIdx) {
  const lbl = document.getElementById(`opt-label-${taskId}-${optIdx}`);
  if (lbl) {
    if (isChecked) lbl.classList.add("selected");
    else lbl.classList.remove("selected");
  }

  let curVal = localDrafts[taskId] && Array.isArray(localDrafts[taskId].answer) ? [...localDrafts[taskId].answer] : [];
  if (isChecked) {
    if (!curVal.includes(optionVal)) curVal.push(optionVal);
  } else {
    curVal = curVal.filter(v => v !== optionVal);
  }
  saveAnswer(taskId, curVal);
}

function handleTrueFalseChoice(taskId, val) {
  saveAnswer(taskId, val);
  renderTasks();
}

function moveOrderItem(taskId, itemIdx, direction) {
  const t = currentTasks.find(x => x.id === taskId);
  if (!t) return;
  let cur = localDrafts[taskId] && Array.isArray(localDrafts[taskId].answer) ? [...localDrafts[taskId].answer] : (t.options || []);
  const targetIdx = itemIdx + direction;
  if (targetIdx < 0 || targetIdx >= cur.length) return;

  const temp = cur[itemIdx];
  cur[itemIdx] = cur[targetIdx];
  cur[targetIdx] = temp;

  saveAnswer(taskId, cur);
  renderTasks();
}

function handleMatchingChange(taskId, leftItem, rightValue) {
  let pairs = localDrafts[taskId] && typeof localDrafts[taskId].answer === "object" ? { ...localDrafts[taskId].answer } : {};
  pairs[leftItem] = rightValue;
  saveAnswer(taskId, pairs);
}

function handleGroupAssign(taskId, item, category) {
  let classes = localDrafts[taskId] && typeof localDrafts[taskId].answer === "object" ? { ...localDrafts[taskId].answer } : {};
  classes[item] = category;
  saveAnswer(taskId, classes);
  renderTasks();
}

// Автосохранение ответов на сервер с надежной защитой
let saveDebounceTimers = {};

function saveAnswer(taskId, answer) {
  const curVersion = (localDrafts[taskId] ? localDrafts[taskId].version : 0) + 1;
  localDrafts[taskId] = { answer, version: curVersion, synced: false };

  try {
    localStorage.setItem(`bagalau_draft_${launchId}`, JSON.stringify(localDrafts));
  } catch (e) {}

  updateProgressIndicator();
  setSaveStatus("saving");

  if (saveDebounceTimers[taskId]) {
    clearTimeout(saveDebounceTimers[taskId]);
  }

  saveDebounceTimers[taskId] = setTimeout(async () => {
    const token = sessionStorage.getItem("bagalau_student_token");
    try {
      const res = await fetch("/api/student/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Attempt-Token": token
        },
        body: JSON.stringify({ task_id: taskId, answer: answer, version: curVersion })
      });
      const data = await res.json();

      if (!res.ok) {
        setSaveStatus("offline");
        return;
      }

      if (data.ok) {
        if (localDrafts[taskId]) {
          localDrafts[taskId].version = data.version;
          localDrafts[taskId].synced = true;
        }
        setSaveStatus("saved");
      }
    } catch (err) {
      setSaveStatus("offline");
    }
  }, 350);
}

function setSaveStatus(state) {
  const ind = document.getElementById("save-indicator");
  if (!ind) return;

  ind.className = `save-indicator ${state}`;
  if (state === "saving") ind.textContent = "Сохранение...";
  else if (state === "saved") ind.textContent = "✓ Сохранено";
  else if (state === "offline") ind.textContent = "⚠ Локально сохранено";
}

function updateProgressIndicator() {
  const total = currentTasks.length;
  let answered = 0;
  currentTasks.forEach(t => {
    const d = localDrafts[t.id];
    if (d && d.answer !== null && d.answer !== "" && (!Array.isArray(d.answer) || d.answer.length > 0)) {
      answered++;
    }
  });

  const pct = total > 0 ? Math.round(answered / total * 100) : 0;
  const bar = document.getElementById("progress-fill");
  if (bar) bar.style.width = `${pct}%`;
  const text = document.getElementById("progress-text");
  if (text) text.textContent = `${answered} из ${total} отвечено`;
}

// Серверный таймер
function startTimer(serverDeadlineIso) {
  if (timerInterval) clearInterval(timerInterval);
  if (!serverDeadlineIso) {
    document.getElementById("timer-box").style.display = "none";
    return;
  }

  const deadline = new Date(serverDeadlineIso).getTime();

  const update = () => {
    const now = Date.now();
    const diffSec = Math.floor((deadline - now) / 1000);
    currentRemainingSeconds = diffSec;

    if (diffSec <= 0) {
      clearInterval(timerInterval);
      document.getElementById("timer-text").textContent = "00:00";
      submitWork(true);
      return;
    }

    const m = Math.floor(diffSec / 60);
    const s = diffSec % 60;
    const str = `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
    document.getElementById("timer-text").textContent = str;

    const pill = document.getElementById("timer-pill");
    if (diffSec <= 300) {
      pill.classList.add("danger");
    }
  };

  update();
  timerInterval = setInterval(update, 1000);
}

// Фоновый Heartbeat
function startHeartbeatAndPoll() {
  if (heartbeatInterval) clearInterval(heartbeatInterval);
  const token = sessionStorage.getItem("bagalau_student_token");

  heartbeatInterval = setInterval(async () => {
    try {
      const res = await fetch("/api/student/heartbeat", {
        method: "POST",
        headers: { "X-Attempt-Token": token }
      });
      if (!res.ok) return;
      const data = await res.json();

      if (data.status !== currentAttempt.status || data.launch_status !== currentAttempt.launch_status) {
        await checkExistingAttempt();
      }

      if (data.remaining_seconds !== null && currentRemainingSeconds !== null) {
        const drift = Math.abs(data.remaining_seconds - currentRemainingSeconds);
        if (drift > 5) {
          currentRemainingSeconds = data.remaining_seconds;
        }
      }
    } catch (e) {}
  }, 10000);
}

// =========================================================================
// ПЕРЕМЕЩАЕМЫЙ КАЛЬКУЛЯТОР (DRAGGABLE FLOATING CALCULATOR)
// =========================================================================
let calcExpression = "0";
let calcPosInitialized = false;

function toggleCalculator() {
  const p = document.getElementById("calc-popup");
  if (!p) return;
  const isHidden = (p.style.display === "none" || !p.style.display);
  if (isHidden) {
    p.style.display = "block";
    if (!calcPosInitialized) {
      // Начальное положение: справа вверху, не перекрывая верхнюю строку
      const top = 72;
      const right = 20;
      const targetLeft = Math.max(10, window.innerWidth - (p.offsetWidth || 280) - right);
      p.style.left = targetLeft + "px";
      p.style.top = top + "px";
      p.style.right = "auto";
      calcPosInitialized = true;
    }
  } else {
    p.style.display = "none";
  }
}

function initDraggableCalculator() {
  const popup = document.getElementById("calc-popup");
  const handle = document.getElementById("calc-drag-handle") || popup?.querySelector(".calc-popup-header");
  if (!popup || !handle) return;

  let isDragging = false;
  let startX = 0;
  let startY = 0;
  let startLeft = 0;
  let startTop = 0;

  function onDragStart(e) {
    if (e.target.closest(".calc-close-btn")) return;

    isDragging = true;
    const clientX = e.type.startsWith("touch") ? e.touches[0].clientX : e.clientX;
    const clientY = e.type.startsWith("touch") ? e.touches[0].clientY : e.clientY;

    startX = clientX;
    startY = clientY;

    const rect = popup.getBoundingClientRect();
    startLeft = rect.left;
    startTop = rect.top;

    popup.style.left = startLeft + "px";
    popup.style.top = startTop + "px";
    popup.style.right = "auto";
    popup.style.bottom = "auto";

    handle.style.cursor = "grabbing";
    document.body.style.userSelect = "none";
    document.body.style.webkitUserSelect = "none";

    window.addEventListener("mousemove", onDragMove, { passive: false });
    window.addEventListener("mouseup", onDragEnd);
    window.addEventListener("touchmove", onDragMove, { passive: false });
    window.addEventListener("touchend", onDragEnd);

    if (e.cancelable) e.preventDefault();
  }

  function onDragMove(e) {
    if (!isDragging) return;
    const clientX = e.type.startsWith("touch") ? e.touches[0].clientX : e.clientX;
    const clientY = e.type.startsWith("touch") ? e.touches[0].clientY : e.clientY;

    const deltaX = clientX - startX;
    const deltaY = clientY - startY;

    let newLeft = startLeft + deltaX;
    let newTop = startTop + deltaY;

    const minX = 8;
    const maxX = Math.max(8, window.innerWidth - popup.offsetWidth - 8);
    const minY = 8;
    const maxY = Math.max(8, window.innerHeight - popup.offsetHeight - 8);

    newLeft = Math.min(Math.max(minX, newLeft), maxX);
    newTop = Math.min(Math.max(minY, newTop), maxY);

    popup.style.left = newLeft + "px";
    popup.style.top = newTop + "px";

    if (e.cancelable) e.preventDefault();
  }

  function onDragEnd() {
    isDragging = false;
    handle.style.cursor = "grab";
    document.body.style.userSelect = "";
    document.body.style.webkitUserSelect = "";

    window.removeEventListener("mousemove", onDragMove);
    window.removeEventListener("mouseup", onDragEnd);
    window.removeEventListener("touchmove", onDragMove);
    window.removeEventListener("touchend", onDragEnd);
  }

  handle.addEventListener("mousedown", onDragStart);
  handle.addEventListener("touchstart", onDragStart, { passive: false });
}

function calcInput(char) {
  if (calcExpression === "0" && !isNaN(char)) {
    calcExpression = char;
  } else if (calcExpression === "Ошибка") {
    calcExpression = char;
  } else {
    calcExpression += char;
  }
  updateCalcDisplay();
}

function calcClear() {
  calcExpression = "0";
  updateCalcDisplay();
}

function calcBackspace() {
  if (calcExpression.length <= 1 || calcExpression === "Ошибка") {
    calcExpression = "0";
  } else {
    calcExpression = calcExpression.slice(0, -1);
  }
  updateCalcDisplay();
}

function calcEqual() {
  try {
    const sanitized = calcExpression.replace(/[^0-9+\-*/().]/g, '');
    const res = Function(`'use strict'; return (${sanitized})`)();
    calcExpression = String(Math.round(res * 10000) / 10000);
  } catch (e) {
    calcExpression = "Ошибка";
  }
  updateCalcDisplay();
}

function updateCalcDisplay() {
  const d = document.getElementById("calc-display");
  if (d) d.value = calcExpression;
}

// =========================================================================
// ОТПРАВКА РАБОТЫ И МГНОВЕННЫЙ ПОКАЗ РЕЗУЛЬТАТОВ
// =========================================================================
document.getElementById("btn-submit-exam").addEventListener("click", () => {
  const total = currentTasks.length;
  let unanswered = 0;
  currentTasks.forEach(t => {
    const d = localDrafts[t.id];
    if (!d || d.answer === null || d.answer === "" || (Array.isArray(d.answer) && d.answer.length === 0)) {
      unanswered++;
    }
  });

  let msg = "Вы уверены, что хотите завершить и отправить работу?";
  if (unanswered > 0) {
    msg = `ВНИМАНИЕ: У вас осталось ${unanswered} неотвеченных заданий.\n\nВы уверены, что хотите отправить работу?`;
  }

  if (confirm(msg)) {
    submitWork(false);
  }
});

async function submitWork(isAutoExpired = false) {
  const token = sessionStorage.getItem("bagalau_student_token");
  const submitBtn = document.getElementById("btn-submit-exam");
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = "Отправка...";
  }

  try {
    const res = await fetch("/api/student/submit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Attempt-Token": token
      },
      body: JSON.stringify({ final_confirmation: true })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Не удалось отправить работу");

    if (timerInterval) clearInterval(timerInterval);
    if (heartbeatInterval) clearInterval(heartbeatInterval);

    try {
      localStorage.removeItem(`bagalau_draft_${launchId}`);
    } catch (e) {}

    currentAttempt.status = data.status;
    currentAttempt.confirmation_code = data.confirmation_code;
    currentAttempt.submitted_at = data.submitted_at;
    currentAttempt.completed_count = data.completed_count;
    currentAttempt.total_tasks = data.total_tasks;
    currentAttempt.time_spent_seconds = data.time_spent_seconds;
    currentAttempt.total_score = data.total_score;
    currentAttempt.max_score = data.max_score;

    showSubmissionSuccessScreen(data);
  } catch (err) {
    alert("Ошибка отправки: " + err.message);
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = "Отправить работу";
    }
  }
}

// Экран успешной сдачи с мгновенными баллами и статистикой
function showSubmissionSuccessScreen(data = null) {
  showScreen("screen-submitted");
  const confBadge = document.getElementById("conf-code-badge");
  if (confBadge) confBadge.textContent = currentAttempt.confirmation_code || "";
  const confTime = document.getElementById("conf-time-text");
  if (confTime) {
    confTime.textContent = currentAttempt.submitted_at 
      ? new Date(currentAttempt.submitted_at).toLocaleTimeString() 
      : "Только что";
  }

  const completed = (data && data.completed_count !== undefined) ? data.completed_count : (currentAttempt.completed_count || 0);
  const totalTasks = (data && data.total_tasks !== undefined) ? data.total_tasks : (currentAttempt.total_tasks || currentTasks.length);
  const totalScore = (data && data.total_score !== undefined) ? data.total_score : (currentAttempt.total_score || 0);
  const maxScore = (data && data.max_score !== undefined) ? data.max_score : (currentAttempt.max_score || 0);
  const timeSpentSec = (data && data.time_spent_seconds !== undefined) ? data.time_spent_seconds : (currentAttempt.time_spent_seconds || 0);

  const min = Math.floor(timeSpentSec / 60);
  const sec = timeSpentSec % 60;
  const timeStr = `${min} мин ${sec < 10 ? '0' : ''}${sec} сек`;

  document.getElementById("res-completed-count").textContent = `${completed} из ${totalTasks}`;
  document.getElementById("res-time-spent").textContent = timeStr;
  const pct = maxScore > 0 ? Math.round(totalScore / maxScore * 100) : 0;
  document.getElementById("res-score-badge").textContent = `${totalScore} из ${maxScore} (${pct}%)`;

  loadStudentResults();
}

async function loadStudentResults() {
  const token = sessionStorage.getItem("bagalau_student_token");
  try {
    const res = await fetch("/api/student/results", {
      headers: { "X-Attempt-Token": token }
    });
    if (!res.ok) return;
    const data = await res.json();

    const box = document.getElementById("results-box");
    if (!data.published) {
      box.style.display = "none";
      return;
    }

    if (data.publish_answers || data.publish_comments) {
      box.style.display = "block";
      let html = `<div style="margin-top: 1.5rem; text-align: left;"><h4 style="margin-bottom: 1rem;">Разбор заданий:</h4>`;
      data.tasks.forEach(t => {
        html += `
          <div style="background: #fff; border: 1px solid var(--border); border-radius: 8px; padding: 1rem; margin-bottom: 1rem;">
            <div style="display: flex; justify-content: space-between; font-weight: 700; margin-bottom: 0.5rem;">
              <span>Задание ${t.order_index}</span>
              ${t.score !== undefined ? `<span style="color: var(--primary);">${t.score} / ${t.max_score} б.</span>` : ''}
            </div>
            <p style="margin-bottom: 0.5rem;">${escapeHtml(t.question_text)}</p>
            <div style="font-size: 0.9rem; color: var(--text-muted);">
              <strong>Ваш ответ:</strong> ${t.student_answer ? escapeHtml(JSON.stringify(t.student_answer)) : 'Нет ответа'}<br>
              ${t.correct_answer ? `<strong>Правильный ответ:</strong> <span style="color: var(--success); font-weight: 600;">${escapeHtml(JSON.stringify(t.correct_answer))}</span><br>` : ''}
              ${t.explanation ? `<strong>Пояснение:</strong> ${escapeHtml(t.explanation)}<br>` : ''}
              ${t.teacher_comment ? `<strong>Комментарий учителя:</strong> <em>${escapeHtml(t.teacher_comment)}</em>` : ''}
            </div>
          </div>
        `;
      });
      html += `</div>`;
      box.innerHTML = html;
    }
  } catch (e) {}
}

function clearStudentSession() {
  sessionStorage.removeItem("bagalau_student_token");
  window.location.reload();
}

function showScreen(screenId) {
  document.querySelectorAll(".student-screen").forEach(s => s.style.display = "none");
  const el = document.getElementById(screenId);
  if (el) el.style.display = "block";
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
