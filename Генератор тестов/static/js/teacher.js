// «Бағалау» — Кабинет Учителя (JavaScript контроллер)

let currentTeacher = null;
let currentTests = [];
let isArchiveView = false;
let activeTest = null;
let activeTask = null;
let currentEditorVariant = "1";
let currentLaunches = [];
let activeLaunch = null;
let activeLaunchStudents = [];
let liveEventSource = null;
let pollInterval = null;
let pendingDeleteAction = null;

// Алфавит букв классов от А до П (без Ё и Й per Казахстанскому школьному стандарту)
const CLASS_LETTERS = ["А", "Б", "В", "Г", "Д", "Е", "Ж", "З", "И", "К", "Л", "М", "Н", "О", "П"];

// Инициализация
document.addEventListener("DOMContentLoaded", async () => {
  await checkAuth();
  setupEventListeners();
  setupHistoryProtection();
  renderLettersGrid();
  loadTests();
});

// Защита от случайного нажатия кнопки "Назад" в браузере
function setupHistoryProtection() {
  window.history.pushState({ page: "teacher" }, "", window.location.href);
  window.addEventListener("popstate", (e) => {
    window.history.pushState({ page: "teacher" }, "", window.location.href);
    confirmLogout();
  });

  window.addEventListener("beforeunload", (e) => {
    if (activeTest && activeTask) {
      e.preventDefault();
      e.returnValue = "";
    }
  });
}

// Проверка сессии учителя
async function checkAuth() {
  try {
    const res = await fetch("/api/teacher/me");
    if (!res.ok) {
      window.location.href = "/teacher/login";
      return;
    }
    currentTeacher = await res.json();
    document.getElementById("teacher-fullname").textContent = currentTeacher.full_name;
  } catch (err) {
    window.location.href = "/teacher/login";
  }
}

// =========================================================================
// ПОДТВЕРЖДЕНИЕ ВЫХОДА
// =========================================================================
function confirmLogout() {
  document.getElementById("logout-confirm-modal").classList.add("open");
}

function closeLogoutModal() {
  document.getElementById("logout-confirm-modal").classList.remove("open");
}

async function performLogout() {
  try {
    await Promise.race([
      fetch("/api/teacher/logout", { method: "POST" }),
      new Promise(resolve => setTimeout(resolve, 2000))
    ]);
  } catch (e) {}
  window.location.href = "/teacher/login";
}

// =========================================================================
// НАСТРОЙКА ОБРАБОТЧИКОВ И НАВИГАЦИИ
// =========================================================================
function setupEventListeners() {
  // Навигация по главным вкладкам
  document.querySelectorAll(".nav-tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".nav-tab-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const target = btn.getAttribute("data-tab");
      switchMainView(target);
    });
  });

  // Фильтры и поиск
  const searchInput = document.getElementById("tests-search");
  if (searchInput) searchInput.addEventListener("input", filterAndRenderTests);
  const typeFilter = document.getElementById("filter-type");
  if (typeFilter) typeFilter.addEventListener("change", filterAndRenderTests);
  const gradeFilter = document.getElementById("filter-grade");
  if (gradeFilter) gradeFilter.addEventListener("change", filterAndRenderTests);
  const quarterFilter = document.getElementById("filter-quarter");
  if (quarterFilter) quarterFilter.addEventListener("change", filterAndRenderTests);

  // Модальное окно создания теста
  document.getElementById("btn-open-create-test").addEventListener("click", () => {
    renderLettersGrid();
    document.getElementById("create-test-modal").classList.add("open");
  });
  document.getElementById("close-create-test-modal").addEventListener("click", () => {
    document.getElementById("create-test-modal").classList.remove("open");
  });
  document.getElementById("create-test-form").addEventListener("submit", handleCreateTest);

  // Модальное окно запуска
  document.getElementById("close-create-launch-modal").addEventListener("click", () => {
    document.getElementById("create-launch-modal").classList.remove("open");
  });
  document.getElementById("create-launch-form").addEventListener("submit", handleCreateLaunch);

  // Модальное окно проверки
  document.getElementById("close-grade-modal").addEventListener("click", () => {
    document.getElementById("student-grading-modal").classList.remove("open");
  });
}

function switchMainView(viewName) {
  document.getElementById("view-tests").style.display = viewName === "tests" ? "block" : "none";
  document.getElementById("view-editor").style.display = viewName === "editor" ? "block" : "none";
  document.getElementById("view-launches").style.display = viewName === "launches" ? "block" : "none";
  document.getElementById("view-live").style.display = viewName === "live" ? "block" : "none";
  document.getElementById("view-backups").style.display = viewName === "backups" ? "block" : "none";

  if (viewName === "tests") {
    loadTests();
    stopLiveMonitoring();
  } else if (viewName === "launches") {
    loadLaunches();
    stopLiveMonitoring();
  } else if (viewName === "backups") {
    loadBackups();
    stopLiveMonitoring();
  }
}

// Отрисовка чекбоксов букв классов от А до П
function renderLettersGrid() {
  const grid = document.getElementById("new-test-letters-grid");
  if (!grid) return;
  grid.innerHTML = "";

  CLASS_LETTERS.forEach(letter => {
    const box = document.createElement("div");
    box.className = "letter-box";
    box.textContent = letter;
    box.dataset.letter = letter;
    box.addEventListener("click", () => {
      box.classList.toggle("active");
    });
    grid.appendChild(box);
  });
}

function selectAllLetters(selectBool) {
  document.querySelectorAll("#new-test-letters-grid .letter-box").forEach(box => {
    if (selectBool) box.classList.add("active");
    else box.classList.remove("active");
  });
}

function getSelectedLetters() {
  const selected = [];
  document.querySelectorAll("#new-test-letters-grid .letter-box.active").forEach(b => {
    selected.push(b.dataset.letter);
  });
  return selected;
}

// Отрисовка чекбоксов букв классов в правой панели редактора заданий
function renderEditorLettersGrid(selectedLetters = []) {
  const grid = document.getElementById("editor-letters-grid");
  if (!grid) return;
  grid.innerHTML = "";

  const selectedSet = new Set((selectedLetters || []).map(String));

  CLASS_LETTERS.forEach(letter => {
    const box = document.createElement("div");
    box.className = "letter-box" + (selectedSet.has(letter) ? " active" : "");
    box.textContent = letter;
    box.dataset.letter = letter;
    box.title = `Класс «${letter}»`;
    box.addEventListener("click", () => {
      box.classList.toggle("active");
      updateActiveTestLettersFromUI();
    });
    grid.appendChild(box);
  });
}

function selectAllEditorLetters(selectBool) {
  document.querySelectorAll("#editor-letters-grid .letter-box").forEach(box => {
    if (selectBool) box.classList.add("active");
    else box.classList.remove("active");
  });
  updateActiveTestLettersFromUI();
}

function updateActiveTestLettersFromUI() {
  if (!activeTest) return;
  const boxes = document.querySelectorAll("#editor-letters-grid .letter-box.active");
  activeTest.class_letters = Array.from(boxes).map(b => b.dataset.letter);
  const lettersStr = activeTest.class_letters.length > 0 ? ` (${activeTest.class_letters.join(", ")})` : "";
  const badge = document.getElementById("editor-test-badge");
  if (badge) {
    badge.textContent = `${activeTest.exam_type} · ${activeTest.grade_level} класс${lettersStr}`;
  }
}

// Сворачивание и разворачивание правой колонки редактора
function toggleEditorSidebar(forceState) {
  const container = document.getElementById("editor-layout-grid") || document.querySelector(".editor-layout");
  const sidebar = document.getElementById("editor-right-sidebar");
  const btn = document.getElementById("btn-toggle-editor-sidebar");
  if (!container) return;

  const isCurrentlyCollapsed = container.classList.contains("sidebar-collapsed") || 
                               (sidebar && (sidebar.style.display === "none" || (window.getComputedStyle && window.getComputedStyle(sidebar).display === "none")));

  const shouldCollapse = (typeof forceState === "boolean") ? forceState : !isCurrentlyCollapsed;

  if (shouldCollapse) {
    // Скрываем настройки: центральный блок заданий расширяется (2 колонки)
    container.classList.add("sidebar-collapsed");
    container.style.gridTemplateColumns = "260px minmax(0, 1fr)";
    if (sidebar) sidebar.style.display = "none";
    if (btn) {
      btn.classList.remove("active");
      btn.setAttribute("aria-expanded", "false");
      btn.title = "Показать настройки (время, классы, цвета)";
    }
    try { localStorage.setItem("bagalau_editor_sidebar_collapsed", "1"); } catch(e){}
  } else {
    // Показываем настройки: стандартный 3-колоночный вид
    container.classList.remove("sidebar-collapsed");
    container.style.gridTemplateColumns = "";
    if (sidebar) sidebar.style.display = "";
    if (btn) {
      btn.classList.add("active");
      btn.setAttribute("aria-expanded", "true");
      btn.title = "Скрыть панель настроек";
    }
    try { localStorage.removeItem("bagalau_editor_sidebar_collapsed"); } catch(e){}
  }
}
window.toggleEditorSidebar = toggleEditorSidebar;

function initEditorSidebarState() {
  const isCollapsed = localStorage.getItem("bagalau_editor_sidebar_collapsed") === "1";
  toggleEditorSidebar(isCollapsed);
}
window.initEditorSidebarState = initEditorSidebarState;

function updateVariantBgColor(varNum, color) {
  if (varNum === "1") {
    const c1 = document.getElementById("editor-bg-v1");
    const t1 = document.getElementById("editor-bg-v1-text");
    if (c1) c1.value = color;
    if (t1) t1.value = color;
    if (activeTest) {
      activeTest.bg_color_v1 = color;
      activeTest.bg_color = color;
    }
  } else if (varNum === "2") {
    const c2 = document.getElementById("editor-bg-v2");
    const t2 = document.getElementById("editor-bg-v2-text");
    if (c2) c2.value = color;
    if (t2) t2.value = color;
    if (activeTest) {
      activeTest.bg_color_v2 = color;
    }
  }
}

function setModalBgColor(color) {
  document.getElementById("new-test-bg-color").value = color;
}

function selectBgColor(color) {
  updateVariantBgColor("1", color);
}

// =========================================================================
// 1. УПРАВЛЕНИЕ РАБОТАМИ И АРХИВОМ
// =========================================================================
function setArchiveFilter(isArchived) {
  isArchiveView = isArchived;
  const btnActive = document.getElementById("tab-active-tests");
  const btnArchive = document.getElementById("tab-archive-tests");

  if (isArchived) {
    btnActive.className = "btn btn-sm btn-secondary";
    btnArchive.className = "btn btn-sm btn-primary";
  } else {
    btnActive.className = "btn btn-sm btn-primary";
    btnArchive.className = "btn btn-sm btn-secondary";
  }
  loadTests();
}

async function loadTests() {
  try {
    const res = await fetch(`/api/tests?archived=${isArchiveView}`);
    if (!res.ok) throw new Error("Не удалось загрузить список работ");
    currentTests = await res.json();
    filterAndRenderTests();
  } catch (err) {
    console.error(err);
  }
}

function filterAndRenderTests() {
  const search = (document.getElementById("tests-search")?.value || "").toLowerCase().trim();
  const type = document.getElementById("filter-type")?.value || "";
  const grade = document.getElementById("filter-grade")?.value || "";
  const quarter = document.getElementById("filter-quarter")?.value || "";

  const filtered = currentTests.filter(t => {
    if (type && t.exam_type !== type) return false;
    if (grade && t.grade_level !== grade) return false;
    if (quarter && String(t.quarter) !== String(quarter)) return false;
    if (search) {
      const matchTitle = (t.title || "").toLowerCase().includes(search);
      const matchSec = (t.section || "").toLowerCase().includes(search);
      if (!matchTitle && !matchSec) return false;
    }
    return true;
  });

  const grid = document.getElementById("tests-grid");
  grid.innerHTML = "";

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 3rem 1rem; color: var(--text-muted);">
        <p style="font-size: 1.1rem; font-weight: 600;">${isArchiveView ? 'В архиве нет работ' : 'Работы не найдены'}</p>
        <p style="font-size: 0.9rem;">${isArchiveView ? 'Архивированные работы будут отображаться здесь' : 'Создайте первую суммативную работу, нажав кнопку выше'}</p>
      </div>
    `;
    return;
  }

  filtered.forEach(t => {
    const card = document.createElement("div");
    card.className = "card";
    card.style.display = "flex";
    card.style.flexDirection = "column";
    card.style.justifyContent = "space-between";
    card.style.height = "100%";

    const lettersStr = (t.class_letters || []).length > 0 ? ` (${t.class_letters.join(", ")})` : "";
    const variantStr = t.variant ? ` · Вар. ${t.variant}` : "";

    let buttonsHtml = "";
    if (isArchiveView) {
      buttonsHtml = `
        <button type="button" class="btn btn-secondary btn-sm" onclick="restoreTest('${t.id}')">Восстановить</button>
        <button type="button" class="btn btn-danger btn-sm" onclick="promptPermanentDelete('${t.id}', '${escapeHtml(t.title)}')">Удалить навсегда</button>
      `;
    } else {
      buttonsHtml = `
        <button type="button" class="btn btn-primary btn-sm" onclick="openTestEditor('${t.id}')">Редактировать</button>
        <button type="button" class="btn btn-secondary btn-sm" onclick="openCreateLaunchModal('${t.id}')">Провести</button>
        <button type="button" class="btn btn-secondary btn-sm" onclick="duplicateTest('${t.id}')" title="Создать копию">📋</button>
        <button type="button" class="btn btn-secondary btn-sm" onclick="archiveTest('${t.id}')" title="Переместить в архив">📦</button>
      `;
    }

    card.innerHTML = `
      <div>
        <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 0.5rem; margin-bottom: 0.75rem;">
          <span class="badge ${t.exam_type === 'СОР' ? 'badge-primary' : 'badge-indigo'}">${t.exam_type} · ${t.grade_level}${lettersStr}${variantStr}</span>
          <span class="badge" style="background: #F1F5F9; color: var(--text-muted); font-size: 0.75rem;">${t.quarter} четверть</span>
        </div>
        <h3 style="font-size: 1.15rem; margin-bottom: 0.4rem; line-height: 1.35;">${escapeHtml(t.title)}</h3>
        <p style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 1rem;">
          ${escapeHtml(t.section || t.subject)}
        </p>
      </div>

      <div style="border-top: 1px solid var(--border); padding-top: 0.85rem; margin-top: 0.85rem;">
        <div style="display: flex; justify-content: space-between; font-size: 0.82rem; color: var(--text-muted); margin-bottom: 0.85rem;">
          <span>Заданий: <strong>${t.task_count || 0}</strong></span>
          <span>Макс. балл: <strong>${t.total_score || 0}</strong></span>
        </div>
        <div style="display: flex; gap: 0.4rem; flex-wrap: wrap;">
          ${buttonsHtml}
        </div>
      </div>
    `;

    grid.appendChild(card);
  });
}

// Создание работы
async function handleCreateTest(e) {
  e.preventDefault();
  const title = document.getElementById("new-test-title").value.trim();
  const examType = document.getElementById("new-test-type").value;
  const subject = document.getElementById("new-test-subject") ? document.getElementById("new-test-subject").value.trim() : "Информатика";
  const gradeLevel = document.getElementById("new-test-grade").value;
  const quarter = parseInt(document.getElementById("new-test-quarter").value);
  const section = document.getElementById("new-test-section").value.trim();
  const classLetters = getSelectedLetters();
  const bgV1 = document.getElementById("new-test-bg-v1")?.value || "#FCE8E6";
  const bgV2 = document.getElementById("new-test-bg-v2")?.value || "#E6F4EA";

  try {
    const res = await fetch("/api/tests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        exam_type: examType,
        subject,
        grade_level: gradeLevel,
        quarter,
        section,
        variant: "1",
        has_variants: true,
        bg_color: bgV1,
        bg_color_v1: bgV1,
        bg_color_v2: bgV2,
        class_letters: classLetters
      })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Не удалось создать работу");

    document.getElementById("create-test-modal").classList.remove("open");
    document.getElementById("create-test-form").reset();
    openTestEditor(data.id);
  } catch (err) {
    alert("Ошибка: " + err.message);
  }
}

async function archiveTest(testId) {
  if (confirm("Переместить эту работу в архив?")) {
    try {
      const res = await fetch(`/api/tests/${testId}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || "Не удалось архивировать работу");
      loadTests();
    } catch (err) {
      alert("Ошибка архивации: " + err.message);
    }
  }
}

async function restoreTest(testId) {
  try {
    const res = await fetch(`/api/tests/${testId}/restore`, { method: "POST" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.detail || "Не удалось восстановить работу");
    alert("Работа успешно восстановлена из архива!");
    loadTests();
  } catch (err) {
    alert("Ошибка восстановления: " + err.message);
  }
}

function promptPermanentDelete(testId, title) {
  pendingDeleteAction = async () => {
    try {
      const res = await fetch(`/api/tests/${testId}/permanent`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || "Не удалось удалить работу");
      closeDeleteModal();
      loadTests();
    } catch (err) {
      alert("Ошибка удаления: " + err.message);
    }
  };
  document.getElementById("delete-modal-title").textContent = "Удалить работу навсегда?";
  document.getElementById("delete-modal-desc").textContent = `Работа «${title}» и все её задания будут удалены безвозвратно.`;
  document.getElementById("delete-confirm-btn").onclick = pendingDeleteAction;
  document.getElementById("delete-confirm-modal").classList.add("open");
}

function closeDeleteModal() {
  document.getElementById("delete-confirm-modal").classList.remove("open");
  pendingDeleteAction = null;
}

async function duplicateTest(testId) {
  await fetch(`/api/tests/${testId}/duplicate`, { method: "POST" });
  loadTests();
}

// =========================================================================
// 2. ТРЁХКОЛОНОЧНЫЙ РЕДАКТОР РАБОТЫ (10 ТИПОВ ЗАДАНИЙ, КАРТИНКИ, ПРЕДПРОСМОТР)
// =========================================================================

async function openTestEditor(testId) {
  if (activeTest && !(await saveEditorTasks())) return;
  activeTask = null;
  try {
    const res = await fetch(`/api/tests/${testId}`);
    if (!res.ok) throw new Error("Не удалось загрузить данные работы");
    activeTest = await res.json();

    document.getElementById("editor-test-title").textContent = activeTest.title;
    const lettersStr = (activeTest.class_letters || []).length > 0 ? ` (${activeTest.class_letters.join(", ")})` : "";
    document.getElementById("editor-test-badge").textContent = `${activeTest.exam_type} · ${activeTest.grade_level} класс${lettersStr}`;

    const bg1 = activeTest.bg_color_v1 || "#FCE8E6";
    const bg2 = activeTest.bg_color_v2 || "#E6F4EA";
    const bg1El = document.getElementById("editor-bg-v1");
    const bg1Txt = document.getElementById("editor-bg-v1-text");
    const bg2El = document.getElementById("editor-bg-v2");
    const bg2Txt = document.getElementById("editor-bg-v2-text");
    if (bg1El) bg1El.value = bg1;
    if (bg1Txt) bg1Txt.value = bg1;
    if (bg2El) bg2El.value = bg2;
    if (bg2Txt) bg2Txt.value = bg2;

    document.getElementById("editor-inst-text").value = activeTest.instructions || "";
    document.getElementById("editor-shuffle-options").checked = !!activeTest.shuffle_options;

    // Продолжительность (минут)
    const durInput = document.getElementById("editor-test-duration");
    if (durInput) {
      durInput.value = (activeTest.duration_minutes !== undefined && activeTest.duration_minutes !== null) ? activeTest.duration_minutes : 45;
    }

    // Буквы классов в правой панели
    renderEditorLettersGrid(activeTest.class_letters || []);

    // Восстанавливаем состояние свернутости боковой панели
    initEditorSidebarState();

    switchMainView("editor");
    await switchEditorVariant("1");

    const visible = getVisibleEditorTasks();
    if (visible && visible.length > 0) {
      selectTaskForEditing(visible[0].id);
    } else if (activeTest.tasks && activeTest.tasks.length > 0) {
      selectTaskForEditing(activeTest.tasks[0].id);
    } else {
      addNewTask();
    }
  } catch (err) {
    alert(err.message);
  }
}

async function switchEditorVariant(variant) {
  if (activeTask && !(await saveCurrentTask(true))) return;
  currentEditorVariant = variant;
  const v1Btn = document.getElementById("tab-editor-v1");
  const v2Btn = document.getElementById("tab-editor-v2");
  const allBtn = document.getElementById("tab-editor-all");

  if (v1Btn) v1Btn.className = (variant === "1" ? "btn btn-sm btn-primary" : "btn btn-sm btn-secondary");
  if (v2Btn) v2Btn.className = (variant === "2" ? "btn btn-sm btn-primary" : "btn btn-sm btn-secondary");
  if (allBtn) allBtn.className = (variant === "all" ? "btn btn-sm btn-primary" : "btn btn-sm btn-secondary");

  const lbl = document.getElementById("editor-active-variant-label");
  if (lbl) {
    if (variant === "1") {
      lbl.textContent = "Вар. 1";
      lbl.style.background = "#FCE8E6";
      lbl.style.color = "#991B1B";
    } else if (variant === "2") {
      lbl.textContent = "Вар. 2";
      lbl.style.background = "#E6F4EA";
      lbl.style.color = "#166534";
    } else {
      lbl.textContent = "Все задания";
      lbl.style.background = "#E0E7FF";
      lbl.style.color = "#3730A3";
    }
  }

  renderEditorTasksNav();
  const visible = getVisibleEditorTasks();
  if (visible.length > 0) {
    if (!activeTask || !visible.find(t => t.id === activeTask.id)) {
      selectTaskForEditing(visible[0].id);
    }
  } else {
    activeTask = null;
    renderTaskEditorForm();
  }
}

function getVisibleEditorTasks() {
  if (!activeTest || !activeTest.tasks) return [];
  const filtered = activeTest.tasks.filter(t => {
    if (currentEditorVariant === "all") return true;
    const v = String(t.variant || "1");
    return v === "all" || v === "1,2" || v === currentEditorVariant;
  });
  return filtered.sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
}

function renderEditorTasksNav() {
  const nav = document.getElementById("editor-tasks-nav");
  if (!nav) return;
  nav.innerHTML = "";
  let totalScore = 0;

  const visibleTasks = getVisibleEditorTasks();

  visibleTasks.forEach((t, idx) => {
    totalScore += parseFloat(t.max_score || 0);
    const item = document.createElement("div");
    item.className = `task-nav-item ${activeTask && activeTask.id === t.id ? 'active' : ''}`;

    const vStr = String(t.variant || '1');
    const varLabel = vStr === '2' ? 'Вар. 2' : ((vStr === 'all' || vStr === '1,2') ? 'Оба вар.' : 'Вар. 1');
    const varBg = vStr === '2' ? '#E6F4EA' : ((vStr === 'all' || vStr === '1,2') ? '#E0E7FF' : '#FCE8E6');
    const varColor = vStr === '2' ? '#166534' : ((vStr === 'all' || vStr === '1,2') ? '#3730A3' : '#991B1B');

    // Номер задания внутри текущего варианта строго начинается с 1!
    const displayNum = idx + 1;

    item.innerHTML = `
      <div style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1;">
        <strong>№${displayNum}.</strong> ${escapeHtml(t.question_text || 'Новое задание')}
      </div>
      <div style="display: flex; gap: 0.35rem; align-items: center;">
        <span class="badge" style="background: ${varBg}; color: ${varColor}; font-size: 0.68rem; padding: 2px 5px;">${varLabel}</span>
        <span class="badge" style="background: #F1F5F9; color: var(--text-muted); font-size: 0.72rem;">${t.max_score} б.</span>
      </div>
    `;
    item.addEventListener("click", () => selectTaskForEditing(t.id));
    nav.appendChild(item);
  });

  const totalElem = document.getElementById("editor-total-score");
  if (totalElem) totalElem.textContent = Math.round(totalScore * 100) / 100;
}

async function moveTaskWithinVariant(taskId, direction) {
  const visible = getVisibleEditorTasks();
  const curIdx = visible.findIndex(t => t.id === taskId);
  const targetIdx = curIdx + direction;
  if (curIdx < 0 || targetIdx < 0 || targetIdx >= visible.length) return;

  const curTask = visible[curIdx];
  const targetTask = visible[targetIdx];

  const tmp = curTask.order_index;
  curTask.order_index = targetTask.order_index;
  targetTask.order_index = tmp;

  activeTest.tasks.sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
  activeTest.tasks.forEach((t, i) => { t.order_index = i + 1; });

  renderEditorTasksNav();
  renderTaskEditorForm();

  try {
    const taskIds = activeTest.tasks.map(t => t.id);
    await fetch(`/api/tests/${activeTest.id}/tasks/reorder`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(taskIds)
    });
  } catch (e) {
    console.error("Failed to reorder tasks", e);
  }
}

async function addNewTask() {
  if (activeTask) {
    await saveCurrentTask(true);
  }
  const taskVariant = currentEditorVariant === "all" ? "1" : currentEditorVariant;
  const newTaskPayload = {
    question_text: "Текст нового задания",
    question_type: "single_choice",
    options: ["Вариант 1", "Вариант 2", "Вариант 3", "Вариант 4"],
    max_score: 1.0,
    check_method: "exact",
    answer_key: "Вариант 1",
    variant: taskVariant,
    image_url: "",
    image_size: "100%",
    image_align: "center"
  };

  try {
    const res = await fetch(`/api/tests/${activeTest.id}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newTaskPayload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error("Не удалось добавить задание");

    newTaskPayload.id = data.id;
    newTaskPayload.order_index = data.order_index;
    activeTest.tasks.push(newTaskPayload);
    renderEditorTasksNav();
    selectTaskForEditing(data.id);
  } catch (err) {
    alert(err.message);
  }
}

async function selectTaskForEditing(taskId) {
  if (activeTask && activeTask.id !== taskId) {
    if (!(await saveCurrentTask(true))) return;
  }
  activeTask = activeTest.tasks.find(t => t.id === taskId);
  if (!activeTask) return;
  renderEditorTasksNav();
  renderTaskEditorForm();
}

async function setTaskVariant(taskId, v) {
  if (activeTask && activeTask.id === taskId) {
    activeTask.variant = v;
    renderEditorTasksNav();
    renderTaskEditorForm();
    await saveCurrentTask(true);
  }
}

async function cloneTaskToOtherVariant(taskId, sameVariant = false) {
  if (activeTask) {
    await saveCurrentTask(true);
  }
  const sourceTask = (activeTest.tasks || []).find(t => t.id === taskId);
  if (!sourceTask) return;
  const targetVar = sameVariant ? sourceTask.variant : ((sourceTask.variant === "2") ? "1" : "2");

  const cloned = {
    question_text: sameVariant ? sourceTask.question_text : sourceTask.question_text + ` (Вариант ${targetVar})`,
    question_type: sourceTask.question_type,
    options: sourceTask.options ? [...sourceTask.options] : [],
    max_score: sourceTask.max_score,
    descriptor: sourceTask.descriptor || "",
    check_method: sourceTask.check_method || "exact",
    tolerance: sourceTask.tolerance || 0,
    answer_key: sourceTask.answer_key == null ? null : JSON.parse(JSON.stringify(sourceTask.answer_key)),
    comment_explanation: sourceTask.comment_explanation || "",
    image_url: sourceTask.image_url || "",
    image_size: sourceTask.image_size || "100%",
    image_align: sourceTask.image_align || "center",
    categories: sourceTask.categories ? [...sourceTask.categories] : [],
    variant: targetVar
  };

  try {
    const res = await fetch(`/api/tests/${activeTest.id}/tasks${sameVariant ? `?after_task_id=${encodeURIComponent(taskId)}` : ""}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cloned)
    });
    const data = await res.json();
    if (!res.ok) throw new Error("Не удалось скопировать задание");
    cloned.id = data.id;
    cloned.order_index = data.order_index;
    if (sameVariant) {
      for (const task of activeTest.tasks) {
        if (task.order_index >= data.order_index) task.order_index++;
      }
    }
    activeTest.tasks.push(cloned);
    activeTest.tasks.sort((a, b) => a.order_index - b.order_index);
    if (!sameVariant) await switchEditorVariant(targetVar);
    await selectTaskForEditing(data.id);
  } catch (err) {
    alert(err.message);
  }
}

// 10 типов заданий в редакторе учителя
const TASK_TYPES = {
  single_choice: "1. Один правильный выбор",
  multi_choice: "2. Множественный выбор",
  number: "3. Числовой ответ (с погрешностью)",
  short_text: "4. Краткий текст (синонимы)",
  fill_blank: "5. Заполни пропуск / вставка слова",
  true_false: "6. Верно / Неверно",
  ordering: "7. Восстановление последовательности",
  matching: "8. Сопоставление пар (термин — определение)",
  dropdown: "9. Выпадающий список в предложении",
  group_classification: "10. Распределение по двум категориям"
};

function renderTaskEditorForm() {
  const container = document.getElementById("task-editor-form-container");
  if (!activeTask) {
    container.innerHTML = '<p style="color: var(--text-muted); text-align: center;">Выберите задание</p>';
    return;
  }

  const t = activeTask;
  let typeSpecificHtml = "";

  // 1 & 2. Single & Multi Choice
  if (t.question_type === "single_choice" || t.question_type === "multi_choice") {
    const isMulti = t.question_type === "multi_choice";
    const options = t.options || ["Вариант 1", "Вариант 2", "Вариант 3", "Вариант 4"];
    const key = t.answer_key;

    let rows = options.map((opt, oIdx) => {
      let isChecked = false;
      if (isMulti && Array.isArray(key)) isChecked = key.includes(opt);
      else if (!isMulti) isChecked = (key === opt);

      return `
        <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
          <input type="${isMulti ? 'checkbox' : 'radio'}" name="opt_correct_key" ${isChecked ? 'checked' : ''} onchange="updateChoiceOptionKey(${oIdx}, this.checked)">
          <input type="text" class="form-control" value="${escapeHtml(opt)}" oninput="updateChoiceOptionText(${oIdx}, this.value)" onblur="saveCurrentTask(true)" placeholder="Вариант ответа...">
          <button type="button" class="btn btn-secondary btn-sm" onclick="removeChoiceOption(${oIdx})">✕</button>
        </div>
      `;
    }).join("");

    typeSpecificHtml = `
      <div class="form-group" style="margin-top: 1rem;">
        <label class="form-label">Варианты ответов и закрытый правильный ключ:</label>
        <div>${rows}</div>
        <button type="button" class="btn btn-secondary btn-sm" style="margin-top: 0.4rem;" onclick="addChoiceOption()">+ Добавить вариант</button>
      </div>
    `;
  }
  // 3. Числовой ответ
  else if (t.question_type === "number") {
    typeSpecificHtml = `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 1rem;">
        <div class="form-group">
          <label class="form-label">Правильное число:</label>
          <input type="text" class="form-control" value="${t.answer_key !== null ? t.answer_key : ''}" oninput="activeTask.answer_key = this.value; scheduleAutoSaveTask();" onblur="saveCurrentTask(true)" placeholder="Например: 42 или 3.14">
        </div>
        <div class="form-group">
          <label class="form-label">Погрешность (±):</label>
          <input type="number" step="any" class="form-control" value="${t.tolerance || 0}" oninput="activeTask.tolerance = parseFloat(this.value) || 0; scheduleAutoSaveTask();" onblur="saveCurrentTask(true)" placeholder="0">
        </div>
      </div>
    `;
  }
  // 4. Короткий текст
  else if (t.question_type === "short_text") {
    const rawKeys = Array.isArray(t.answer_key) ? t.answer_key.join("; ") : (t.answer_key || "");
    typeSpecificHtml = `
      <div class="form-group" style="margin-top: 1rem;">
        <label class="form-label">Допустимые варианты ответа (синонимы через точку с запятой):</label>
        <input type="text" class="form-control" value="${escapeHtml(rawKeys)}" oninput="updateShortTextKeys(this.value)" onblur="saveCurrentTask(true)" placeholder="Например: алгоритм; algoritm; алгоритмы">
        <p class="form-hint">Проверка нечувствительна к регистру (прописные и строчные буквы равны).</p>
      </div>
    `;
  }
  // 5. Заполни пропуск
  else if (t.question_type === "fill_blank") {
    typeSpecificHtml = `
      <div class="form-group" style="margin-top: 1rem;">
        <label class="form-label">Правильное пропущенное слово (или синонимы через точку с запятой):</label>
        <input type="text" class="form-control" value="${escapeHtml(t.answer_key || '')}" oninput="activeTask.answer_key = this.value; scheduleAutoSaveTask();" onblur="saveCurrentTask(true)" placeholder="Например: процессор; cpu">
      </div>
    `;
  }
  // 6. Верно / Неверно
  else if (t.question_type === "true_false") {
    const isTrue = t.answer_key === "Верно" || t.answer_key === true;
    typeSpecificHtml = `
      <div class="form-group" style="margin-top: 1rem;">
        <label class="form-label">Правильный ответ:</label>
        <div style="display: flex; gap: 1rem;">
          <label style="display: flex; align-items: center; gap: 0.4rem; cursor: pointer;">
            <input type="radio" name="tf_key" value="Верно" ${isTrue ? 'checked' : ''} onchange="activeTask.answer_key = 'Верно'; scheduleAutoSaveTask(50);">
            <strong>Верно</strong>
          </label>
          <label style="display: flex; align-items: center; gap: 0.4rem; cursor: pointer;">
            <input type="radio" name="tf_key" value="Неверно" ${!isTrue ? 'checked' : ''} onchange="activeTask.answer_key = 'Неверно'; scheduleAutoSaveTask(50);">
            <strong>Неверно</strong>
          </label>
        </div>
      </div>
    `;
  }
  // 7. Восстановление последовательности
  else if (t.question_type === "ordering") {
    const steps = Array.isArray(t.answer_key) ? t.answer_key : (t.options || ["Шаг 1", "Шаг 2", "Шаг 3"]);
    let rows = steps.map((s, idx) => `
      <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
        <span style="font-weight: 700; width: 25px;">${idx + 1}.</span>
        <input type="text" class="form-control" value="${escapeHtml(s)}" oninput="updateOrderingStep(${idx}, this.value)" onblur="saveCurrentTask(true)">
        <button type="button" class="btn btn-secondary btn-sm" onclick="removeOrderingStep(${idx})">✕</button>
      </div>
    `).join("");

    typeSpecificHtml = `
      <div class="form-group" style="margin-top: 1rem;">
        <label class="form-label">Шаги в ПРАВИЛЬНОМ порядке (система автоматически перемешает их для ученика):</label>
        <div>${rows}</div>
        <button type="button" class="btn btn-secondary btn-sm" style="margin-top: 0.4rem;" onclick="addOrderingStep()">+ Добавить шаг</button>
      </div>
    `;
  }
  // 8. Сопоставление пар
  else if (t.question_type === "matching") {
    const pairs = (t.answer_key && typeof t.answer_key === "object") ? t.answer_key : { "Термин 1": "Определение 1", "Термин 2": "Определение 2" };
    let rows = Object.entries(pairs).map(([left, right], idx) => `
      <div style="display: grid; grid-template-columns: 1fr 1fr auto; gap: 0.5rem; margin-bottom: 0.5rem; align-items: center;">
        <input type="text" class="form-control" value="${escapeHtml(left)}" oninput="updateMatchingPairKey('${idx}', this.value, true)" onblur="saveCurrentTask(true)" placeholder="Левая часть (термин)...">
        <input type="text" class="form-control" value="${escapeHtml(right)}" oninput="updateMatchingPairKey('${idx}', this.value, false)" onblur="saveCurrentTask(true)" placeholder="Правая часть (соответствие)...">
        <button type="button" class="btn btn-secondary btn-sm" onclick="removeMatchingPair(${idx})">✕</button>
      </div>
    `).join("");

    typeSpecificHtml = `
      <div class="form-group" style="margin-top: 1rem;">
        <label class="form-label">Правильные пары соответствий:</label>
        <div id="matching-editor-rows">${rows}</div>
        <button type="button" class="btn btn-secondary btn-sm" style="margin-top: 0.4rem;" onclick="addMatchingPair()">+ Добавить пару</button>
      </div>
    `;
  }
  // 9. Выпадающий список в тексте
  else if (t.question_type === "dropdown") {
    const opts = t.options || ["Вариант 1", "Вариант 2", "Вариант 3"];
    let rows = opts.map((opt, idx) => `
      <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
        <input type="radio" name="dd_key" ${t.answer_key === opt ? 'checked' : ''} onchange="activeTask.answer_key = activeTask.options[${idx}]; scheduleAutoSaveTask(50);">
        <input type="text" class="form-control" value="${escapeHtml(opt)}" oninput="updateDropdownOption(${idx}, this.value)" onblur="saveCurrentTask(true)">
        <button type="button" class="btn btn-secondary btn-sm" onclick="removeDropdownOption(${idx})">✕</button>
      </div>
    `).join("");

    typeSpecificHtml = `
      <div class="form-group" style="margin-top: 1rem;">
        <label class="form-label">Варианты выпадающего списка (отметьте верный):</label>
        <div>${rows}</div>
        <button type="button" class="btn btn-secondary btn-sm" style="margin-top: 0.4rem;" onclick="addDropdownOption()">+ Добавить вариант</button>
      </div>
    `;
  }
  // 10. Распределение по 2 категориям
  else if (t.question_type === "group_classification") {
    const cats = t.categories && t.categories.length >= 2 ? t.categories : ["Категория 1", "Категория 2"];
    const pairs = (t.answer_key && typeof t.answer_key === "object") ? t.answer_key : {};

    let rows = Object.entries(pairs).map(([item, cat], idx) => `
      <div style="display: grid; grid-template-columns: 2fr 1fr auto; gap: 0.5rem; margin-bottom: 0.5rem; align-items: center;">
        <input type="text" class="form-control" value="${escapeHtml(item)}" oninput="updateClassItemText(${idx}, this.value)" onblur="saveCurrentTask(true)" placeholder="Элемент...">
        <select class="form-control class-item-cat-select" onchange="updateClassItemCatByIdx(${idx}, this.value); saveCurrentTask(true);">
          <option value="${escapeHtml(cats[0])}" ${cat === cats[0] ? 'selected' : ''}>${escapeHtml(cats[0])}</option>
          <option value="${escapeHtml(cats[1])}" ${cat === cats[1] ? 'selected' : ''}>${escapeHtml(cats[1])}</option>
        </select>
        <button type="button" class="btn btn-secondary btn-sm" onclick="removeClassItemByIdx(${idx})">✕</button>
      </div>
    `).join("");


    typeSpecificHtml = `
      <div class="form-group" style="margin-top: 1rem;">
        <label class="form-label">Названия двух категорий (корзин):</label>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-bottom: 0.75rem;">
          <input type="text" class="form-control" value="${escapeHtml(cats[0])}" oninput="updateCatName(0, this.value)" onblur="saveCurrentTask(true)" placeholder="Категория 1">
          <input type="text" class="form-control" value="${escapeHtml(cats[1])}" oninput="updateCatName(1, this.value)" onblur="saveCurrentTask(true)" placeholder="Категория 2">
        </div>
        <label class="form-label">Элементы для распределения:</label>
        <div>${rows}</div>
        <button type="button" class="btn btn-secondary btn-sm" style="margin-top: 0.4rem;" onclick="addClassItem()">+ Добавить элемент</button>
      </div>
    `;
  }

  // Блок управления картинкой (скрыт по умолчанию, пока не нажата кнопка)
  const hasImage = Boolean((t.image_url && t.image_url.trim()) || t._showImageSection);
  const imgBoxHtml = hasImage ? `
    <div id="task-image-section" style="background: #F8FAFC; border: 1.5px solid var(--border); border-radius: var(--radius-md); padding: 1rem; margin-top: 1.25rem;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; flex-wrap: wrap; gap: 0.5rem;">
        <label class="form-label" style="display: flex; align-items: center; gap: 0.5rem; margin: 0; font-weight: 700;">
          <span>🖼 Изображение к заданию:</span>
        </label>
        <button type="button" class="btn btn-secondary btn-sm" onclick="removeTaskImage()" style="color: var(--danger); font-size: 0.8rem; padding: 4px 10px;">✕ Убрать изображение</button>
      </div>

      <div style="display: flex; gap: 0.75rem; align-items: center; flex-wrap: wrap; margin-bottom: 0.75rem;">
        <label class="btn btn-primary btn-sm" style="cursor: pointer; display: inline-flex; align-items: center; gap: 0.45rem; font-weight: 600; padding: 6px 14px; margin: 0;">
          <span>📁 Выбрать файл с компьютера</span>
          <input type="file" id="task-image-file-input" accept="image/*" style="display: none;" onchange="handleTaskImageFileUpload(this)">
        </label>
        <span style="font-size: 0.82rem; color: var(--text-muted); font-weight: 600;">или вставьте ссылку / скриншот (Ctrl+V):</span>
      </div>

      <div style="margin-bottom: 0.75rem;">
        <input type="text" id="task-image-url-input" class="form-control" value="${escapeHtml(t.image_url || '')}" oninput="updateTaskImage(this.value)" onblur="saveCurrentTask(true)" placeholder="https://... или путь к файлу">
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 0.75rem;">
        <div>
          <label style="font-size: 0.82rem; font-weight: 600; margin-bottom: 0.25rem; display: block;">Размер изображения:</label>
          <select class="form-control" onchange="activeTask.image_size = this.value; renderImagePreview(); scheduleAutoSaveTask(50);">
            <option value="200px" ${t.image_size === '200px' ? 'selected' : ''}>Маленький (200px)</option>
            <option value="450px" ${t.image_size === '450px' || t.image_size === '400px' ? 'selected' : ''}>Средний (450px)</option>
            <option value="100%" ${t.image_size === '100%' || !t.image_size ? 'selected' : ''}>На всю ширину (100%)</option>
          </select>
        </div>
        <div>
          <label style="font-size: 0.82rem; font-weight: 600; margin-bottom: 0.25rem; display: block;">Положение:</label>
          <select class="form-control" onchange="activeTask.image_align = this.value; renderImagePreview(); scheduleAutoSaveTask(50);">
            <option value="left" ${t.image_align === 'left' ? 'selected' : ''}>По левому краю</option>
            <option value="center" ${t.image_align === 'center' || !t.image_align ? 'selected' : ''}>По центру</option>
            <option value="right" ${t.image_align === 'right' ? 'selected' : ''}>По правому краю</option>
          </select>
        </div>
      </div>

      <div id="image-preview-container" style="margin-top: 0.75rem;"></div>
    </div>
  ` : `
    <div id="task-image-section" style="margin-top: 0.85rem;">
      <button type="button" class="btn btn-secondary btn-sm" onclick="showTaskImageInput()" style="display: inline-flex; align-items: center; gap: 0.4rem; padding: 6px 14px; font-weight: 600;">
        <span>🖼</span> <span>Добавить изображение к заданию</span>
      </button>
    </div>
  `;

  const visibleTasks = getVisibleEditorTasks();
  const currentIdx = visibleTasks.findIndex(x => x.id === t.id);
  const displayNum = currentIdx >= 0 ? (currentIdx + 1) : t.order_index;

  container.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; flex-wrap: wrap; gap: 0.5rem;">
      <div style="display: flex; align-items: center; gap: 0.6rem; flex-wrap: wrap;">
        <h3 style="font-size: 1.15rem; margin: 0;">Задание №${displayNum}</h3>
        <div class="btn-group" style="display: inline-flex; gap: 4px;">
          <button type="button" class="btn btn-secondary btn-sm" onclick="moveTaskWithinVariant('${t.id}', -1)" title="Поднять выше в списке" style="padding: 3px 8px;" ${currentIdx <= 0 ? 'disabled' : ''}>▲ Вверх</button>
          <button type="button" class="btn btn-secondary btn-sm" onclick="moveTaskWithinVariant('${t.id}', 1)" title="Опустить ниже в списке" style="padding: 3px 8px;" ${currentIdx >= visibleTasks.length - 1 ? 'disabled' : ''}>▼ Вниз</button>
        </div>
      </div>
      <div style="display: flex; gap: 0.4rem; flex-wrap: wrap;">
        <button type="button" class="btn btn-secondary btn-sm" onclick="cloneTaskToOtherVariant('${t.id}', true)">Дублировать</button>
        <button type="button" class="btn btn-danger btn-sm" onclick="deleteCurrentTask()">Удалить</button>
      </div>
    </div>

    <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 1rem;">
      <div class="form-group">
        <label class="form-label">Тип задания (с автопроверкой):</label>
        <select class="form-control" onchange="changeTaskType(this.value)">
          ${Object.entries(TASK_TYPES).map(([k, v]) => `<option value="${k}" ${t.question_type === k ? 'selected' : ''}>${v}</option>`).join('')}
        </select>
      </div>

      <div class="form-group">
        <label class="form-label">Макс. балл:</label>
        <input type="number" step="0.5" min="0.5" class="form-control" value="${t.max_score || 1}" oninput="activeTask.max_score = parseFloat(this.value) || 1; scheduleAutoSaveTask();" onblur="saveCurrentTask(true)">
      </div>
    </div>

    <div class="form-group">
      <label class="form-label">Условие задания (поддерживает формулы KaTeX $...$):</label>
      <textarea class="form-control" rows="3" oninput="activeTask.question_text = this.value; scheduleAutoSaveTask();" onblur="saveCurrentTask(true)">${escapeHtml(t.question_text || '')}</textarea>
    </div>

    ${imgBoxHtml}
    ${typeSpecificHtml}
  `;

  renderImagePreview();
}

function showTaskImageInput() {
  if (!activeTask) return;
  activeTask._showImageSection = true;
  renderTaskEditorForm();
  const input = document.getElementById("task-image-url-input");
  if (input) input.focus();
}
window.showTaskImageInput = showTaskImageInput;

function removeTaskImage() {
  if (!activeTask) return;
  activeTask.image_url = "";
  activeTask._showImageSection = false;
  renderTaskEditorForm();
  scheduleAutoSaveTask(50);
}
window.removeTaskImage = removeTaskImage;

async function handleTaskImageFileUpload(input) {
  if (!input.files || input.files.length === 0 || !activeTask) return;
  const file = input.files[0];
  
  const preview = document.getElementById("image-preview-container");
  if (preview) {
    preview.innerHTML = '<div style="padding: 0.6rem; color: var(--primary); font-weight: 600; font-size: 0.88rem;">⏳ Загрузка изображения на сервер...</div>';
  }

  try {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/upload/image", {
      method: "POST",
      body: formData
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Не удалось загрузить файл");
    }

    const data = await res.json();
    activeTask.image_url = data.url;
    activeTask._showImageSection = true;

    const urlInput = document.getElementById("task-image-url-input");
    if (urlInput) urlInput.value = data.url;

    renderImagePreview();
    await saveCurrentTask(true);
  } catch (err) {
    console.warn("Server upload failed, converting to DataURL:", err);
    const reader = new FileReader();
    reader.onload = async (e) => {
      activeTask.image_url = e.target.result;
      activeTask._showImageSection = true;
      const urlInput = document.getElementById("task-image-url-input");
      if (urlInput) urlInput.value = "data:image/...;base64";
      renderImagePreview();
      await saveCurrentTask(true);
    };
    reader.readAsDataURL(file);
  }
}
window.handleTaskImageFileUpload = handleTaskImageFileUpload;

function renderImagePreview() {
  const container = document.getElementById("image-preview-container");
  if (!container || !activeTask) return;
  const url = (activeTask.image_url || "").trim();
  if (!url) {
    container.innerHTML = `<div style="font-size: 0.82rem; color: var(--text-muted); font-style: italic; margin-top: 0.5rem;">Изображение не прикреплено. Выберите файл с компьютера или вставьте ссылку.</div>`;
    return;
  }
  const align = activeTask.image_align || "center";
  const size = activeTask.image_size || "100%";
  container.innerHTML = `
    <div style="text-align: ${align}; margin-top: 0.75rem;">
      <div style="font-size: 0.78rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; margin-bottom: 0.35rem;">Предпросмотр:</div>
      <img src="${escapeHtml(url)}" style="max-width: ${size}; max-height: 380px; border: 1.5px solid var(--border); border-radius: var(--radius-sm); object-fit: contain; box-shadow: 0 2px 6px rgba(0,0,0,0.06);" onerror="this.onerror=null; this.parentElement.innerHTML='<div style=\\'color: var(--danger); font-size: 0.85rem; padding: 0.5rem;\\'>⚠️ Не удалось загрузить изображение по указанному адресу. Проверьте правильность ссылки или загрузите файл с компьютера.</div>';">
    </div>
  `;
}
window.renderImagePreview = renderImagePreview;

function updateTaskImage(url) {
  if (activeTask) {
    let clean = (url || "").trim();
    if (clean.startsWith("http://localhost:8000/")) {
      clean = clean.replace("http://localhost:8000", "");
    } else if (clean.startsWith("http://127.0.0.1:8000/")) {
      clean = clean.replace("http://127.0.0.1:8000", "");
    }
    activeTask.image_url = clean;
    if (clean) activeTask._showImageSection = true;
    renderImagePreview();
    scheduleAutoSaveTask();
  }
}
window.updateTaskImage = updateTaskImage;

// Глобальная поддержка вставки картинок из буфера обмена (Ctrl+V)
document.addEventListener("paste", async (e) => {
  const container = document.getElementById("task-editor-form-container");
  if (!container || !activeTask) return;
  if (container.contains(e.target) || e.target === document.body) {
    const items = (e.clipboardData || e.originalEvent?.clipboardData)?.items;
    if (items) {
      for (const item of items) {
        if (item.type && item.type.indexOf("image") === 0) {
          const blob = item.getAsFile();
          if (blob) {
            e.preventDefault();
            activeTask._showImageSection = true;
            renderTaskEditorForm();
            await handleTaskImageFileUpload({ files: [blob] });
            break;
          }
        }
      }
    }
  }
});

function changeTaskType(newType) {
  if (!activeTask) return;
  activeTask.question_type = newType;

  if (newType === "true_false") {
    activeTask.options = ["Верно", "Неверно"];
    activeTask.answer_key = "Верно";
  } else if (newType === "ordering") {
    activeTask.options = ["Шаг 1", "Шаг 2", "Шаг 3"];
    activeTask.answer_key = ["Шаг 1", "Шаг 2", "Шаг 3"];
  } else if (newType === "matching") {
    activeTask.answer_key = { "Элемент А": "Значение 1", "Элемент Б": "Значение 2" };
  } else if (newType === "group_classification") {
    activeTask.categories = ["Категория 1", "Категория 2"];
    activeTask.answer_key = { "Элемент 1": "Категория 1", "Элемент 2": "Категория 2" };
    activeTask.options = ["Элемент 1", "Элемент 2"];
  }
  renderTaskEditorForm();
  scheduleAutoSaveTask(50);
}

// Помощники настройки вариантов
function updateChoiceOptionText(idx, val) {
  if (!activeTask.options) activeTask.options = [];
  const oldVal = activeTask.options[idx];
  activeTask.options[idx] = val;
  if (activeTask.question_type === "single_choice" && activeTask.answer_key === oldVal) {
    activeTask.answer_key = val;
  } else if (activeTask.question_type === "multi_choice" && Array.isArray(activeTask.answer_key)) {
    activeTask.answer_key = activeTask.answer_key.map(key => key === oldVal ? val : key);
  }
  scheduleAutoSaveTask();
}

function updateChoiceOptionKey(idx, isChecked) {
  const opt = activeTask.options[idx];
  if (activeTask.question_type === "single_choice") {
    activeTask.answer_key = opt;
  } else {
    let keyList = Array.isArray(activeTask.answer_key) ? [...activeTask.answer_key] : [];
    if (isChecked && !keyList.includes(opt)) keyList.push(opt);
    else if (!isChecked) keyList = keyList.filter(x => x !== opt);
    activeTask.answer_key = keyList;
  }
  scheduleAutoSaveTask(50);
}

function addChoiceOption() {
  if (!activeTask.options) activeTask.options = [];
  activeTask.options.push(`Вариант ${activeTask.options.length + 1}`);
  renderTaskEditorForm();
  scheduleAutoSaveTask(50);
}

function removeChoiceOption(idx) {
  if (!activeTask.options || activeTask.options.length <= 1) return;
  activeTask.options.splice(idx, 1);
  renderTaskEditorForm();
  scheduleAutoSaveTask(50);
}

function updateDropdownOption(idx, val) {
  if (!activeTask.options) activeTask.options = [];
  const oldVal = activeTask.options[idx];
  activeTask.options[idx] = val;
  if (activeTask.answer_key === oldVal) {
    activeTask.answer_key = val;
  }
  scheduleAutoSaveTask();
}

function addDropdownOption() {
  if (!activeTask.options) activeTask.options = [];
  activeTask.options.push(`Вариант ${activeTask.options.length + 1}`);
  renderTaskEditorForm();
  scheduleAutoSaveTask(50);
}

function removeDropdownOption(idx) {
  if (!activeTask.options || activeTask.options.length <= 1) return;
  activeTask.options.splice(idx, 1);
  renderTaskEditorForm();
  scheduleAutoSaveTask(50);
}

function updateShortTextKeys(raw) {
  activeTask.answer_key = raw.split(";").map(s => s.trim()).filter(Boolean);
  scheduleAutoSaveTask();
}

function updateOrderingStep(idx, val) {
  if (!Array.isArray(activeTask.answer_key)) activeTask.answer_key = [];
  activeTask.answer_key[idx] = val;
  activeTask.options = [...activeTask.answer_key];
  scheduleAutoSaveTask();
}

function addOrderingStep() {
  if (!Array.isArray(activeTask.answer_key)) activeTask.answer_key = [];
  activeTask.answer_key.push(`Шаг ${activeTask.answer_key.length + 1}`);
  activeTask.options = [...activeTask.answer_key];
  renderTaskEditorForm();
  scheduleAutoSaveTask(50);
}

function removeOrderingStep(idx) {
  if (!Array.isArray(activeTask.answer_key) || activeTask.answer_key.length <= 1) return;
  activeTask.answer_key.splice(idx, 1);
  activeTask.options = [...activeTask.answer_key];
  renderTaskEditorForm();
  scheduleAutoSaveTask(50);
}

function updateMatchingPairKey(idxStr, val, isLeft) {
  const pairs = activeTask.answer_key || {};
  const entries = Object.entries(pairs);
  const idx = parseInt(idxStr);
  if (entries[idx]) {
    if (isLeft) entries[idx][0] = val;
    else entries[idx][1] = val;
  }
  activeTask.answer_key = Object.fromEntries(entries);
  scheduleAutoSaveTask();
}

function addMatchingPair() {
  const pairs = activeTask.answer_key || {};
  const num = Object.keys(pairs).length + 1;
  pairs[`Термин ${num}`] = `Определение ${num}`;
  activeTask.answer_key = pairs;
  renderTaskEditorForm();
  scheduleAutoSaveTask(50);
}

function removeMatchingPair(idx) {
  const pairs = activeTask.answer_key || {};
  const entries = Object.entries(pairs);
  entries.splice(idx, 1);
  activeTask.answer_key = Object.fromEntries(entries);
  renderTaskEditorForm();
  scheduleAutoSaveTask(50);
}

function updateCatName(catIdx, val) {
  if (!activeTask.categories) activeTask.categories = ["Категория 1", "Категория 2"];
  const old = activeTask.categories[catIdx];
  activeTask.categories[catIdx] = val;

  // Обновляем ключи
  if (activeTask.answer_key) {
    for (const [k, v] of Object.entries(activeTask.answer_key)) {
      if (v === old) activeTask.answer_key[k] = val;
    }
  }
  const container = document.getElementById("task-editor-form-container");
  if (container) {
    container.querySelectorAll("select.class-item-cat-select").forEach(sel => {
      if (sel.options[catIdx]) {
        sel.options[catIdx].value = val;
        sel.options[catIdx].textContent = val;
      }
    });
  }
  scheduleAutoSaveTask();
}

function updateClassItemText(idx, val) {
  if (!activeTask.answer_key || typeof activeTask.answer_key !== "object") activeTask.answer_key = {};
  const entries = Object.entries(activeTask.answer_key);
  if (entries[idx]) {
    const oldCat = entries[idx][1];
    entries[idx] = [val, oldCat];
    activeTask.answer_key = Object.fromEntries(entries);
    activeTask.options = entries.map(e => e[0]);
    scheduleAutoSaveTask();
  }
}

function updateClassItemCatByIdx(idx, val) {
  if (!activeTask.answer_key || typeof activeTask.answer_key !== "object") activeTask.answer_key = {};
  const entries = Object.entries(activeTask.answer_key);
  if (entries[idx]) {
    entries[idx][1] = val;
    activeTask.answer_key = Object.fromEntries(entries);
    scheduleAutoSaveTask(50);
  }
}

function updateClassItemCat(item, cat) {
  if (!activeTask.answer_key) activeTask.answer_key = {};
  activeTask.answer_key[item] = cat;
  scheduleAutoSaveTask(50);
}

function addClassItem() {
  if (!activeTask.answer_key) activeTask.answer_key = {};
  const cats = activeTask.categories || ["Категория 1", "Категория 2"];
  const num = Object.keys(activeTask.answer_key).length + 1;
  activeTask.answer_key[`Элемент ${num}`] = cats[0];
  activeTask.options = Object.keys(activeTask.answer_key);
  renderTaskEditorForm();
  scheduleAutoSaveTask(50);
}

function removeClassItemByIdx(idx) {
  if (!activeTask.answer_key || typeof activeTask.answer_key !== "object") return;
  const entries = Object.entries(activeTask.answer_key);
  entries.splice(idx, 1);
  activeTask.answer_key = Object.fromEntries(entries);
  activeTask.options = entries.map(e => e[0]);
  renderTaskEditorForm();
  scheduleAutoSaveTask(50);
}

function removeClassItem(item) {
  if (activeTask.answer_key) delete activeTask.answer_key[item];
  activeTask.options = Object.keys(activeTask.answer_key || {});
  renderTaskEditorForm();
  scheduleAutoSaveTask(50);
}

// Serialize writes so an earlier blur save cannot overwrite a newer edit.
let taskSaveQueue = Promise.resolve();
let autoSaveTaskTimer = null;

function persistTask(task) {
  const payload = JSON.stringify(task);
  const request = taskSaveQueue.then(async () => {
    const res = await fetch(`/api/tasks/${task.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: payload
    });
    if (!res.ok) throw new Error("Не удалось сохранить задание. Повторите сохранение перед запуском.");
  });
  taskSaveQueue = request.catch(() => {});
  return request;
}

function scheduleAutoSaveTask(delayMs = 250) {
  if (!activeTask) return;
  renderEditorTasksNav();
  if (autoSaveTaskTimer) clearTimeout(autoSaveTaskTimer);
  const taskSnapshot = activeTask;
  autoSaveTaskTimer = setTimeout(() => {
    autoSaveTaskTimer = null;
    persistTask(taskSnapshot).catch(err => console.error("Auto-save failed:", err));
  }, delayMs);
}

async function saveEditorTasks() {
  if (autoSaveTaskTimer) {
    clearTimeout(autoSaveTaskTimer);
    autoSaveTaskTimer = null;
  }
  try {
    for (const task of activeTest?.tasks || []) await persistTask(task);
    return true;
  } catch (err) {
    alert(err.message);
    return false;
  }
}

async function saveCurrentTask(silent = false) {
  if (autoSaveTaskTimer) {
    clearTimeout(autoSaveTaskTimer);
    autoSaveTaskTimer = null;
  }
  if (!activeTask) return true;
  try {
    await persistTask(activeTask);
    renderEditorTasksNav();
    if (!silent) alert("Задание сохранено");
    return true;
  } catch (err) {
    if (!silent) alert(err.message);
    return false;
  }
}

async function deleteCurrentTask() {
  if (!activeTask || !confirm("Удалить это задание?")) return;
  if (autoSaveTaskTimer) {
    clearTimeout(autoSaveTaskTimer);
    autoSaveTaskTimer = null;
  }
  try {
    const res = await fetch(`/api/tasks/${activeTask.id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Не удалось удалить задание");
    activeTest.tasks = activeTest.tasks.filter(t => t.id !== activeTask.id);
    const visible = getVisibleEditorTasks();
    activeTask = visible[0] || null;
    renderEditorTasksNav();
    renderTaskEditorForm();
  } catch (err) {
    alert(err.message);
  }
}

async function saveTestGeneralSettings() {
  if (!activeTest) return;
  if (!(await saveEditorTasks())) return;
  activeTest.instructions = document.getElementById("editor-inst-text").value.trim();
  const bg1 = document.getElementById("editor-bg-v1")?.value || activeTest.bg_color_v1 || "#FCE8E6";
  const bg2 = document.getElementById("editor-bg-v2")?.value || activeTest.bg_color_v2 || "#E6F4EA";
  activeTest.bg_color_v1 = bg1;
  activeTest.bg_color_v2 = bg2;
  activeTest.bg_color = bg1;

  // Duration
  const durVal = parseInt(document.getElementById("editor-test-duration")?.value, 10);
  activeTest.duration_minutes = isNaN(durVal) ? 45 : durVal;

  // Selected letters
  const activeBoxes = document.querySelectorAll("#editor-letters-grid .letter-box.active");
  activeTest.class_letters = Array.from(activeBoxes).map(b => b.dataset.letter);

  try {
    const res = await fetch(`/api/tests/${activeTest.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: activeTest.title,
        subject: activeTest.subject,
        grade_level: activeTest.grade_level,
        exam_type: activeTest.exam_type,
        quarter: activeTest.quarter,
        section: activeTest.section,
        instructions: activeTest.instructions,
        shuffle_options: document.getElementById("editor-shuffle-options").checked,
        bg_color: activeTest.bg_color,
        bg_color_v1: activeTest.bg_color_v1,
        bg_color_v2: activeTest.bg_color_v2,
        class_letters: activeTest.class_letters,
        duration_minutes: activeTest.duration_minutes,
        has_variants: true
      })
    });
    if (!res.ok) throw new Error("Не удалось сохранить параметры");
    activeTest.shuffle_options = document.getElementById("editor-shuffle-options").checked;

    // Обновляем бейдж класса и букв в шапке редактора
    const lettersStr = activeTest.class_letters.length > 0 ? ` (${activeTest.class_letters.join(", ")})` : "";
    const badge = document.getElementById("editor-test-badge");
    if (badge) {
      badge.textContent = `${activeTest.exam_type} · ${activeTest.grade_level} класс${lettersStr}`;
    }

    alert("Настройки работы сохранены");
  } catch (err) {
    alert(err.message);
  }
}

// =========================================================================
// 3. ПРЕДПРОСМОТР ТЕСТА ГЛАЗАМИ УЧЕНИКА (ПОЛНОСТЬЮ АКТИВНЫЙ И ИНТЕРАКТИВНЫЙ)
// =========================================================================
let previewVariant = "1";
let previewShuffle = false;
let previewStudentAnswers = {};
let previewEvaluationResult = null;

function togglePreviewShuffle() {
  previewShuffle = !previewShuffle;
  renderStudentPreviewContent();
}

async function openStudentPreview(variant = "1") {
  if (!activeTest) return;
  if (activeTask) {
    await saveCurrentTask(true);
  }
  previewVariant = variant;
  previewStudentAnswers = {};
  previewEvaluationResult = null;
  renderStudentPreviewContent();
  document.getElementById("student-preview-modal").classList.add("open");
}

function setPreviewAnswer(taskId, val) {
  previewStudentAnswers[taskId] = val;
}

function setPreviewMultiChoice(taskId, optVal, isChecked) {
  let list = Array.isArray(previewStudentAnswers[taskId]) ? [...previewStudentAnswers[taskId]] : [];
  if (isChecked) {
    if (!list.includes(optVal)) list.push(optVal);
  } else {
    list = list.filter(x => x !== optVal);
  }
  previewStudentAnswers[taskId] = list;
}

function movePreviewOrderItem(taskId, idx, dir) {
  const t = (activeTest.tasks || []).find(x => x.id === taskId);
  if (!t) return;
  let cur = Array.isArray(previewStudentAnswers[taskId]) ? [...previewStudentAnswers[taskId]] : (Array.isArray(t.answer_key) ? [...t.answer_key] : [...(t.options || [])]);
  const target = idx + dir;
  if (target < 0 || target >= cur.length) return;
  const tmp = cur[idx];
  cur[idx] = cur[target];
  cur[target] = tmp;
  previewStudentAnswers[taskId] = cur;
  renderStudentPreviewContent();
}

function setPreviewMatching(taskId, left, right) {
  if (!previewStudentAnswers[taskId] || typeof previewStudentAnswers[taskId] !== "object") {
    previewStudentAnswers[taskId] = {};
  }
  previewStudentAnswers[taskId][left] = right;
}

function setPreviewGroupClass(taskId, item, cat) {
  if (!previewStudentAnswers[taskId] || typeof previewStudentAnswers[taskId] !== "object") {
    previewStudentAnswers[taskId] = {};
  }
  previewStudentAnswers[taskId][item] = cat;
  renderStudentPreviewContent();
}

function evaluatePreviewAnswers() {
  previewEvaluationResult = {};
  const tasks = (activeTest.tasks || []).filter(t => {
    const v = String(t.variant || "1");
    return v === "all" || v === "1,2" || v === previewVariant;
  });

  tasks.forEach(t => {
    const ans = previewStudentAnswers[t.id];
    const maxSc = parseFloat(t.max_score || 1.0);
    const key = t.answer_key;
    let earned = 0.0;

    if (t.question_type === "single_choice" || t.question_type === "dropdown") {
      if (ans && String(ans).trim() === String(key).trim()) earned = maxSc;
    } else if (t.question_type === "true_false") {
      const isKeyTrue = key === "Верно" || key === true;
      const isAnsTrue = ans === "Верно" || ans === true;
      if (ans && isKeyTrue === isAnsTrue) earned = maxSc;
    } else if (t.question_type === "multi_choice") {
      const selected = Array.isArray(ans) ? ans.map(String) : [];
      const correct = Array.isArray(key) ? key.map(String) : [String(key)];
      const correctCount = selected.filter(x => correct.includes(x)).length;
      const wrongCount = selected.filter(x => !correct.includes(x)).length;
      const net = Math.max(0, correctCount - wrongCount);
      earned = correct.length > 0 ? (net / correct.length) * maxSc : 0;
    } else if (t.question_type === "number") {
      const numAns = parseFloat(String(ans || "").replace(",", "."));
      const numKey = parseFloat(String(key || "").replace(",", "."));
      const tol = parseFloat(t.tolerance || 0);
      if (!isNaN(numAns) && !isNaN(numKey) && Math.abs(numAns - numKey) <= tol) earned = maxSc;
    } else if (t.question_type === "short_text" || t.question_type === "fill_blank") {
      const synonyms = (Array.isArray(key) ? key : String(key || "").split(";")).map(s => s.trim().toLowerCase());
      const studentNorm = String(ans || "").trim().toLowerCase();
      if (studentNorm && synonyms.includes(studentNorm)) earned = maxSc;
    } else if (t.question_type === "ordering") {
      const orderKey = Array.isArray(key) ? key.map(String) : (t.options || []).map(String);
      const studentOrder = Array.isArray(ans) ? ans.map(String) : [];
      if (JSON.stringify(orderKey) === JSON.stringify(studentOrder)) earned = maxSc;
    } else if (t.question_type === "matching") {
      const pairs = (typeof key === "object" && key) ? key : {};
      const studentPairs = (typeof ans === "object" && ans) ? ans : {};
      let matched = 0;
      const totalPairs = Object.keys(pairs).length;
      for (const [k, v] of Object.entries(pairs)) {
        if (String(studentPairs[k] || "").trim() === String(v).trim()) matched++;
      }
      earned = totalPairs > 0 ? (matched / totalPairs) * maxSc : 0;
    } else if (t.question_type === "group_classification") {
      const itemMap = (typeof key === "object" && key) ? key : {};
      const studentMap = (typeof ans === "object" && ans) ? ans : {};
      let matched = 0;
      const totalItems = Object.keys(itemMap).length;
      for (const [item, cat] of Object.entries(itemMap)) {
        if (studentMap[item] === cat) matched++;
      }
      earned = totalItems > 0 ? (matched / totalItems) * maxSc : 0;
    }

    earned = Math.round(earned * 100) / 100;
    previewEvaluationResult[t.id] = {
      score: earned,
      max: maxSc,
      isCorrect: earned >= maxSc,
      isPartial: earned > 0 && earned < maxSc
    };
  });

  renderStudentPreviewContent();
}

function renderStudentPreviewContent() {
  if (!activeTest) return;
  const body = document.getElementById("preview-modal-body");
  const bg = previewVariant === "2" ? (activeTest.bg_color_v2 || "#E6F4EA") : (activeTest.bg_color_v1 || "#FCE8E6");

  body.style.backgroundColor = bg;

  let tasks = (activeTest.tasks || []).filter(t => {
    const v = String(t.variant || "1");
    return v === "all" || v === "1,2" || v === previewVariant;
  });

  tasks.sort((a, b) => (a.order_index || 0) - (b.order_index || 0));

  if (previewShuffle) {
    tasks = [...tasks].sort(() => Math.random() - 0.5);
  }

  let evalBannerHtml = "";
  if (previewEvaluationResult) {
    let earnedSum = 0;
    let maxSum = 0;
    tasks.forEach(t => {
      const r = previewEvaluationResult[t.id];
      if (r) {
        earnedSum += r.score;
        maxSum += r.max;
      }
    });
    const pct = maxSum > 0 ? Math.round((earnedSum / maxSum) * 100) : 0;
    const bannerColor = pct >= 80 ? "#10B981" : (pct >= 50 ? "#F59E0B" : "#EF4444");

    evalBannerHtml = `
      <div style="background: #FFFFFF; border: 2px solid ${bannerColor}; border-radius: 12px; padding: 1.25rem; margin-bottom: 1.5rem; text-align: center; box-shadow: 0 4px 12px rgba(0,0,0,0.06);">
        <h3 style="color: ${bannerColor}; margin-bottom: 0.35rem; font-size: 1.3rem;">Итог самопроверки: ${earnedSum} из ${maxSum} баллов (${pct}%)</h3>
        <p style="font-size: 0.88rem; color: var(--text-muted); margin: 0;">Зелёная рамка — верный ответ, оранжевая — частичный, красная — неверный ответ.</p>
      </div>
    `;
  }

  body.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; background: #fff; padding: 0.75rem 1rem; border-radius: 8px; border: 1px solid var(--border); flex-wrap: wrap; gap: 0.5rem;">
      <div style="display: flex; align-items: center; gap: 0.5rem;">
        <span style="font-weight: 700; font-size: 0.9rem;">Предпросмотр:</span>
        <div class="btn-group" style="display: inline-flex; border: 1.5px solid var(--border); border-radius: 6px; overflow: hidden;">
          <button type="button" class="btn btn-sm ${previewVariant === '1' ? 'btn-primary' : 'btn-secondary'}" onclick="openStudentPreview('1')" style="padding: 4px 10px;">Вариант 1</button>
          <button type="button" class="btn btn-sm ${previewVariant === '2' ? 'btn-primary' : 'btn-secondary'}" onclick="openStudentPreview('2')" style="padding: 4px 10px;">Вариант 2</button>
        </div>
      </div>
      <div>
        <button type="button" class="btn btn-sm ${previewShuffle ? 'btn-primary' : 'btn-secondary'}" onclick="togglePreviewShuffle()" title="Перемешать вопросы в случайном порядке">
          🔀 ${previewShuffle ? 'Случайный порядок: ВКЛ' : 'В случайном порядке: ВЫКЛ'}
        </button>
      </div>
    </div>

    ${evalBannerHtml}

    <div style="background: #fff; border: 1px solid var(--border); border-radius: var(--radius-md); padding: 1.5rem; margin-bottom: 1.5rem;">
      <h2 style="font-size: 1.4rem; margin-bottom: 0.35rem;">${escapeHtml(activeTest.title)}</h2>
      <p style="color: var(--text-muted); font-size: 0.88rem;">${activeTest.exam_type} · ${activeTest.grade_level} класс · Вариант ${previewVariant} (${tasks.length} заданий)</p>
      ${activeTest.instructions ? `<p style="margin-top: 0.75rem; padding: 0.75rem; background: #F8FAFC; border-radius: 8px; font-size: 0.9rem;">${escapeHtml(activeTest.instructions)}</p>` : ''}
    </div>
  `;

  if (tasks.length === 0) {
    body.innerHTML += `
      <div class="card" style="text-align: center; padding: 2.5rem; color: var(--text-muted); background: #fff;">
        В Варианте ${previewVariant} пока нет заданий. Добавьте их в редакторе или скопируйте кнопкой «📋 В другой вариант».
      </div>
    `;
    return;
  }

  tasks.forEach((t, idx) => {
    const saved = previewStudentAnswers[t.id];
    let inputHtml = "";

    // 1. Single Choice
    if (t.question_type === "single_choice") {
      inputHtml = `<div class="options-list">`;
      (t.options || []).forEach((opt, optIdx) => {
        const isSelected = saved !== undefined && String(saved) === String(opt);
        inputHtml += `
          <label class="option-label ${isSelected ? 'selected' : ''}" style="cursor: pointer;">
            <input type="radio" name="preview_${t.id}" value="${escapeHtml(opt)}" ${isSelected ? 'checked' : ''} onchange="setPreviewAnswer('${t.id}', this.value); renderStudentPreviewContent();">
            <span>${escapeHtml(opt)}</span>
          </label>
        `;
      });
      inputHtml += `</div>`;
    }
    // 2. Multi Choice
    else if (t.question_type === "multi_choice") {
      const selList = Array.isArray(saved) ? saved.map(String) : [];
      inputHtml = `<div class="options-list">`;
      (t.options || []).forEach((opt, optIdx) => {
        const isSelected = selList.includes(String(opt));
        inputHtml += `
          <label class="option-label ${isSelected ? 'selected' : ''}" style="cursor: pointer;">
            <input type="checkbox" name="preview_${t.id}" value="${escapeHtml(opt)}" ${isSelected ? 'checked' : ''} onchange="setPreviewMultiChoice('${t.id}', this.value, this.checked); renderStudentPreviewContent();">
            <span>${escapeHtml(opt)}</span>
          </label>
        `;
      });
      inputHtml += `</div>`;
    }
    // 3. Number
    else if (t.question_type === "number") {
      inputHtml = `
        <div style="max-width: 260px;">
          <input type="text" class="form-control" style="font-family: 'JetBrains Mono', monospace; font-size: 1.1rem; font-weight: 700;" placeholder="Введите число..." value="${saved !== undefined ? escapeHtml(saved) : ''}" oninput="setPreviewAnswer('${t.id}', this.value)">
        </div>
      `;
    }
    // 4 & 5. Short text & Fill blank
    else if (t.question_type === "short_text" || t.question_type === "fill_blank") {
      inputHtml = `
        <div>
          <input type="text" class="form-control" placeholder="Введите ваш ответ..." value="${saved !== undefined ? escapeHtml(saved) : ''}" oninput="setPreviewAnswer('${t.id}', this.value)">
        </div>
      `;
    }
    // 6. True / False
    else if (t.question_type === "true_false") {
      const isTrue = saved === "Верно";
      const isFalse = saved === "Неверно";
      inputHtml = `
        <div class="tf-group">
          <div class="tf-option ${isTrue ? 'selected-true' : ''}" onclick="setPreviewAnswer('${t.id}', 'Верно'); renderStudentPreviewContent();" style="cursor: pointer;">
            ✓ Верно
          </div>
          <div class="tf-option ${isFalse ? 'selected-false' : ''}" onclick="setPreviewAnswer('${t.id}', 'Неверно'); renderStudentPreviewContent();" style="cursor: pointer;">
            ✕ Неверно
          </div>
        </div>
      `;
    }
    // 7. Ordering
    else if (t.question_type === "ordering") {
      let currentOrder = Array.isArray(saved) && saved.length > 0 ? saved : (Array.isArray(t.answer_key) ? t.answer_key : (t.options || []));
      inputHtml = `<div class="ordering-container">`;
      currentOrder.forEach((item, itemIdx) => {
        inputHtml += `
          <div class="ordering-item">
            <span class="ordering-index">${itemIdx + 1}.</span>
            <span class="ordering-text">${escapeHtml(item)}</span>
            <div class="ordering-btns">
              <button type="button" class="ordering-btn" ${itemIdx === 0 ? 'disabled' : ''} onclick="movePreviewOrderItem('${t.id}', ${itemIdx}, -1)">▲</button>
              <button type="button" class="ordering-btn" ${itemIdx === currentOrder.length - 1 ? 'disabled' : ''} onclick="movePreviewOrderItem('${t.id}', ${itemIdx}, 1)">▼</button>
            </div>
          </div>
        `;
      });
      inputHtml += `</div>`;
    }
    // 8. Matching
    else if (t.question_type === "matching") {
      const pairs = (t.answer_key && typeof t.answer_key === "object") ? t.answer_key : {};
      const leftItems = Object.keys(pairs);
      const rightItems = Object.values(pairs);
      const currentPairs = (saved && typeof saved === "object") ? saved : {};

      inputHtml = `<table class="matching-table"><tbody>`;
      leftItems.forEach(left => {
        const curRight = currentPairs[left] || "";
        inputHtml += `
          <tr class="matching-row">
            <td class="matching-left">${escapeHtml(left)}</td>
            <td>
              <select class="form-control" onchange="setPreviewMatching('${t.id}', '${escapeHtml(left)}', this.value)">
                <option value="">-- Выберите соответствие --</option>
                ${rightItems.map(r => `<option value="${escapeHtml(r)}" ${curRight === r ? 'selected' : ''}>${escapeHtml(r)}</option>`).join('')}
              </select>
            </td>
          </tr>
        `;
      });
      inputHtml += `</tbody></table>`;
    }
    // 9. Dropdown
    else if (t.question_type === "dropdown") {
      inputHtml = `
        <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
          <span>Выберите верный вариант:</span>
          <select class="inline-select" onchange="setPreviewAnswer('${t.id}', this.value)">
            <option value="">-- Выберите вариант --</option>
            ${(t.options || []).map(opt => `<option value="${escapeHtml(opt)}" ${saved === opt ? 'selected' : ''}>${escapeHtml(opt)}</option>`).join('')}
          </select>
        </div>
      `;
    }
    // 10. Classification
    else if (t.question_type === "group_classification") {
      const curClasses = (saved && typeof saved === "object") ? saved : {};
      const cats = t.categories && t.categories.length >= 2 ? t.categories : ["Категория 1", "Категория 2"];
      const items = (t.answer_key && typeof t.answer_key === "object") ? Object.keys(t.answer_key) : (t.options || []);

      inputHtml = `<div class="classification-container">`;
      items.forEach(item => {
        const assigned = curClasses[item] || "";
        inputHtml += `
          <div class="classification-item">
            <div class="classification-text">${escapeHtml(item)}</div>
            <div class="classification-buttons">
              <button type="button" class="class-btn ${assigned === cats[0] ? 'active' : ''}" onclick="setPreviewGroupClass('${t.id}', '${escapeHtml(item)}', '${escapeHtml(cats[0])}')">${escapeHtml(cats[0])}</button>
              <button type="button" class="class-btn ${assigned === cats[1] ? 'active' : ''}" onclick="setPreviewGroupClass('${t.id}', '${escapeHtml(item)}', '${escapeHtml(cats[1])}')">${escapeHtml(cats[1])}</button>
            </div>
          </div>
        `;
      });
      inputHtml += `</div>`;
    }

    let imgPreview = "";
    if (t.image_url && t.image_url.trim()) {
      imgPreview = `
        <div class="task-image-box align-${t.image_align || 'center'}" style="margin: 0.75rem 0;">
          <img src="${escapeHtml(t.image_url.trim())}" style="max-width: ${t.image_size || '100%'};" class="task-img-protected">
        </div>
      `;
    }

    let cardBorder = "border: 1px solid var(--border);";
    let statusBadge = "";
    if (previewEvaluationResult && previewEvaluationResult[t.id]) {
      const r = previewEvaluationResult[t.id];
      if (r.isCorrect) {
        cardBorder = "border: 2px solid #10B981; background: #F0FDF4;";
        statusBadge = `<span class="badge" style="background: #10B981; color: #fff;">✓ Верно (${r.score} / ${r.max} б.)</span>`;
      } else if (r.isPartial) {
        cardBorder = "border: 2px solid #F59E0B; background: #FFFBEB;";
        statusBadge = `<span class="badge" style="background: #F59E0B; color: #fff;">⚠ Частично (${r.score} / ${r.max} б.)</span>`;
      } else {
        cardBorder = "border: 2px solid #EF4444; background: #FEF2F2;";
        statusBadge = `<span class="badge" style="background: #EF4444; color: #fff;">✕ Неверно (0 / ${r.max} б.)</span>`;
      }
    }

    body.innerHTML += `
      <div class="card" style="margin-bottom: 1.25rem; ${cardBorder}">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; border-bottom: 1px solid rgba(0,0,0,0.06); padding-bottom: 0.5rem;">
          <span class="badge badge-indigo" style="font-size: 0.82rem;">Задание ${idx + 1}</span>
          <div style="display: flex; gap: 0.5rem; align-items: center;">
            ${statusBadge}
            <span style="color: var(--text-muted); font-weight: 700;">${t.max_score} б.</span>
          </div>
        </div>
        <div style="margin-bottom: 0.85rem; font-size: 1rem; line-height: 1.5;">${escapeHtml(t.question_text)}</div>
        ${imgPreview}
        <div>${inputHtml}</div>
      </div>
    `;
  });

  body.innerHTML += `
    <div style="margin-top: 1.5rem; text-align: center;">
      <button type="button" class="btn btn-primary" onclick="evaluatePreviewAnswers()" style="padding: 0.85rem 2rem; font-size: 1.05rem; font-weight: 700;">
        ✓ Проверить ответы как ученик (проверка автооценки)
      </button>
      <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.5rem;">
        Позволяет протестировать автопроверку заданий прямо в окне предпросмотра
      </p>
    </div>
  `;

  if (window.renderMathInElement) {
    renderMathInElement(body, {
      delimiters: [
        {left: '$$', right: '$$', display: true},
        {left: '$', right: '$', display: false}
      ],
      throwOnError: false
    });
  }
}

function closeStudentPreview() {
  document.getElementById("student-preview-modal").classList.remove("open");
}

// =========================================================================
// 4. СОЗДАНИЕ СТРАНИЦЫ УРОКА НА САЙТЕ ALASSTER.SITE
// =========================================================================
let sitePageLaunchId = "";

function openCreateSitePageModal(lId = null) {
  sitePageLaunchId = lId || (activeLaunch ? activeLaunch.id : "");
  if (!sitePageLaunchId) {
    alert("Откройте нужное проведение, затем создайте страницу урока.");
    return;
  }
  document.getElementById("create-site-page-modal").classList.add("open");
}

function closeSitePageModal() {
  document.getElementById("create-site-page-modal").classList.remove("open");
}

async function handleCreateSitePage(e) {
  e.preventDefault();
  const gradeFolder = document.getElementById("site-grade-folder").value;
  const quarterFolder = document.getElementById("site-quarter-folder").value;
  const lessonNumber = document.getElementById("site-lesson-number").value.trim();
  const lessonTitle = document.getElementById("site-lesson-title").value.trim();

  try {
    const res = await fetch("/api/site/create_lesson", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grade_folder: gradeFolder,
        quarter_folder: quarterFolder,
        lesson_number: lessonNumber,
        lesson_title: lessonTitle,
        launch_id: sitePageLaunchId
      })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Не удалось создать страницу");

    closeSitePageModal();
    alert(`УСПЕШНО!\nСтраница добавлена на ваш сайт в папку:\n${data.relative_path}\n\nУченики могут выполнять задания прямо внутри урока!`);
  } catch (err) {
    alert("Ошибка: " + err.message);
  }
}

async function handleDeleteSitePage() {
  const gradeFolder = document.getElementById("site-grade-folder").value;
  const quarterFolder = document.getElementById("site-quarter-folder").value;
  const lessonNumber = document.getElementById("site-lesson-number").value.trim();
  if (!lessonNumber) {
    alert("Укажите номер или название урока для удаления");
    return;
  }
  if (!confirm(`Удалить страницу '${lessonNumber}' из папки '${gradeFolder}/${quarterFolder}' и убрать её из меню сайта?`)) {
    return;
  }

  try {
    const res = await fetch("/api/site/delete_lesson", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grade_folder: gradeFolder,
        quarter_folder: quarterFolder,
        lesson_number: lessonNumber
      })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Не удалось удалить страницу");
    closeSitePageModal();
    alert("Страница успешно удалена с сайта и убрана из меню уроков!");
  } catch (err) {
    alert("Ошибка удаления: " + err.message);
  }
}


// =========================================================================
// 5. ПРОВЕДЕНИЕ (LAUNCHES) И УДАЛЕНИЕ СЕССИЙ
// =========================================================================

async function loadLaunches() {
  try {
    const res = await fetch("/api/launches");
    if (!res.ok) throw new Error("Не удалось загрузить проведения");
    currentLaunches = await res.json();
    renderLaunchesTable();
  } catch (err) {
    console.error(err);
  }
}

function renderLaunchesTable() {
  const tbody = document.getElementById("launches-table-body");
  tbody.innerHTML = "";

  if (currentLaunches.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 2rem; color: var(--text-muted);">Пока нет ни одной сессии проведения.</td></tr>`;
    return;
  }

  currentLaunches.forEach(l => {
    const tr = document.createElement("tr");
    const st = l.stats || {};
    const classes = (l.allowed_classes || []).join(", ");

    tr.innerHTML = `
      <td><strong>${escapeHtml(l.title)}</strong></td>
      <td><span class="badge badge-${l.status}">${getStatusLabel(l.status)}</span></td>
      <td>${escapeHtml(classes)}</td>
      <td>${l.duration_minutes ? `${l.duration_minutes} мин` : 'Без ограничений'}</td>
      <td>${st.total_attempts || 0} (сдано: ${st.submitted_count || 0})</td>
      <td>${new Date(l.created_at).toLocaleDateString()}</td>
      <td>
        <div style="display: flex; gap: 0.35rem;">
          <button type="button" class="btn btn-primary btn-sm" onclick="openLiveMonitoring('${l.id}')">Мониторинг</button>
          <button type="button" class="btn btn-secondary btn-sm" onclick="openCreateSitePageModal('${l.id}')" title="Добавить на сайт">🌐</button>
          <button type="button" class="btn btn-danger btn-sm" onclick="deleteLaunch('${l.id}', '${escapeHtml(l.title)}')" title="Удалить проведение">🗑</button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

async function deleteLaunch(launchId, title) {
  if (confirm(`Вы уверены, что хотите удалить проведение «${title}»?\nВсе попытки и ответы учеников этой сессии будут удалены.`)) {
    try {
      const res = await fetch(`/api/launches/${launchId}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || "Не удалось удалить сессию");
      loadLaunches();
    } catch (e) {
      alert("Ошибка удаления: " + e.message);
    }
  }
}

async function openCreateLaunchModal(testId) {
  if (activeTest?.id === testId && !(await saveEditorTasks())) return;
  const t = currentTests.find(x => x.id === testId) || activeTest;
  document.getElementById("launch-target-test-id").value = testId;
  document.getElementById("launch-title-input").value = t ? `${t.title} (${t.grade_level})` : "Проведение работы";

  const defaultClasses = (t && t.class_letters && t.class_letters.length > 0)
    ? t.class_letters.map(l => `${t.grade_level} ${l}`).join(", ")
    : (t ? `${t.grade_level}` : "9 А, 9 Б");

  document.getElementById("launch-classes-input").value = defaultClasses;
  const defaultDuration = (t && t.duration_minutes !== undefined && t.duration_minutes !== null) ? t.duration_minutes : 45;
  const durEl = document.getElementById("launch-duration-input");
  if (durEl) durEl.value = defaultDuration;

  document.getElementById("create-launch-modal").classList.add("open");
}

async function handleCreateLaunch(e) {
  e.preventDefault();
  const testId = document.getElementById("launch-target-test-id").value;
  if (activeTest?.id === testId && !(await saveEditorTasks())) return;
  const title = document.getElementById("launch-title-input").value.trim();
  const classesRaw = document.getElementById("launch-classes-input").value;
  const classes = classesRaw.split(",").map(c => c.trim()).filter(Boolean);
  const duration = parseInt(document.getElementById("launch-duration-input").value) || 0;
  const approval = document.getElementById("launch-approval-input").checked;

  try {
    const res = await fetch("/api/launches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        test_id: testId,
        title,
        allowed_classes: classes,
        duration_minutes: duration,
        manual_approval: approval
      })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Не удалось создать запуск");

    document.getElementById("create-launch-modal").classList.remove("open");
    openLiveMonitoring(data.launch_id);
  } catch (err) {
    alert("Ошибка: " + err.message);
  }
}

// =========================================================================
// 6. ЖИВОЙ МОНИТОРИНГ, РЕЗУЛЬТАТЫ И ПЕЧАТЬ В PDF
// =========================================================================

async function openLiveMonitoring(launchId) {
  try {
    const res = await fetch(`/api/launches/${launchId}`);
    if (!res.ok) throw new Error("Не удалось загрузить данные сессии");
    activeLaunch = await res.json();

    const netUrls = activeLaunch.server_urls || [];
    let studentOrigin = netUrls.find(u => u.startsWith("https://")) || window.location.origin;
    if (studentOrigin.includes("127.0.0.1") || studentOrigin.includes("localhost")) {
      const lanUrl = netUrls.find(u => !u.includes("127.0.0.1") && !u.includes("localhost"));
      if (lanUrl) studentOrigin = lanUrl;
      else if (netUrls[0]) studentOrigin = netUrls[0];
    }
    document.getElementById("live-public-url").value = `${studentOrigin}/exam/${activeLaunch.id}`;
    updateLiveStatusBadge(activeLaunch.status);
    updatePublishResultsButton();

    document.getElementById("set-manual-approval").checked = !!activeLaunch.manual_approval;
    document.getElementById("set-duration").value = activeLaunch.duration_minutes || 0;
    document.getElementById("set-pub-scores").checked = !!activeLaunch.publish_scores;
    document.getElementById("set-pub-answers").checked = !!activeLaunch.publish_answers;
    document.getElementById("set-pub-comments").checked = !!activeLaunch.publish_comments;

    switchMainView("live");
    switchLaunchTab("tab-live-monitoring");
    await refreshStudentsList();
    startLiveMonitoring(activeLaunch.id);
  } catch (err) {
    alert(err.message);
  }
}

function switchLaunchTab(tabId) {
  document.querySelectorAll(".launch-subnav-btn").forEach(b => {
    b.classList.toggle("active", b.getAttribute("data-subtab") === tabId);
  });
  document.querySelectorAll(".launch-sub-tab").forEach(t => {
    t.style.display = t.id === tabId ? "block" : "none";
  });

  if (tabId === "tab-live-results") {
    loadGradingData();
  } else if (tabId === "tab-live-settings" && activeLaunch) {
    const elManual = document.getElementById("set-manual-approval");
    const elDuration = document.getElementById("set-duration");
    const elScores = document.getElementById("set-pub-scores");
    const elAnswers = document.getElementById("set-pub-answers");
    const elComments = document.getElementById("set-pub-comments");
    if (elManual) elManual.checked = !!activeLaunch.manual_approval;
    if (elDuration) elDuration.value = activeLaunch.duration_minutes !== undefined ? activeLaunch.duration_minutes : 40;
    if (elScores) elScores.checked = !!activeLaunch.publish_scores;
    if (elAnswers) elAnswers.checked = !!activeLaunch.publish_answers;
    if (elComments) elComments.checked = !!activeLaunch.publish_comments;
    updatePublishResultsButton();
  }
}

function updatePublishResultsButton() {
  const btn = document.getElementById("btn-toggle-publish-results");
  const input = document.getElementById("publish-results-toggle-input");
  const label = document.getElementById("publish-results-toggle-label");
  if (!btn || !input) return;
  const published = !!(activeLaunch && (activeLaunch.publish_scores || activeLaunch.publish_answers || activeLaunch.publish_comments));
  input.checked = published;
  btn.title = published ? "Скрыть результаты от учеников" : "Выдать результаты ученикам";
  if (label) label.textContent = published ? "Результаты выданы" : "Выдать результаты";
}

async function togglePublishResults(enabled = null) {
  if (!activeLaunch) return;
  const published = !!(activeLaunch.publish_scores || activeLaunch.publish_answers || activeLaunch.publish_comments);
  const nextState = enabled === null ? !published : !!enabled;
  ["set-pub-scores", "set-pub-answers", "set-pub-comments"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.checked = nextState;
  });
  await saveLaunchSettings();
}
window.togglePublishResults = togglePublishResults;

async function saveLaunchSettings() {
  if (!activeLaunch) {
    alert("Сессия проведения не выбрана");
    return;
  }

  const manualApproval = document.getElementById("set-manual-approval") ? document.getElementById("set-manual-approval").checked : false;
  const durationInput = document.getElementById("set-duration");
  const durationMinutes = durationInput ? (parseInt(durationInput.value, 10) || 0) : 0;
  const pubScores = document.getElementById("set-pub-scores") ? document.getElementById("set-pub-scores").checked : false;
  const pubAnswers = document.getElementById("set-pub-answers") ? document.getElementById("set-pub-answers").checked : false;
  const pubComments = document.getElementById("set-pub-comments") ? document.getElementById("set-pub-comments").checked : false;

  const btn = document.querySelector("#tab-live-settings button.btn-primary");
  const originalText = btn ? btn.textContent : "Сохранить настройки проведения";
  if (btn) {
    btn.disabled = true;
    btn.textContent = "Сохранение...";
  }

  try {
    const res = await fetch(`/api/launches/${activeLaunch.id}/settings`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        manual_approval: manualApproval,
        duration_minutes: durationMinutes,
        publish_scores: pubScores,
        publish_answers: pubAnswers,
        publish_comments: pubComments
      })
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.detail || "Не удалось сохранить настройки");

    activeLaunch.manual_approval = manualApproval;
    activeLaunch.duration_minutes = durationMinutes;
    activeLaunch.publish_scores = pubScores;
    activeLaunch.publish_answers = pubAnswers;
    activeLaunch.publish_comments = pubComments;
    updatePublishResultsButton();

    if (durationInput) durationInput.value = durationMinutes;

    alert("✓ Настройки проведения успешно сохранены!");
  } catch (err) {
    alert("Ошибка сохранения: " + err.message);
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = originalText;
    }
  }
}

async function refreshStudentsList() {
  if (!activeLaunch) return;
  try {
    const res = await fetch(`/api/launches/${activeLaunch.id}/students`);
    if (res.status === 401) {
      stopLiveMonitoring();
      return;
    }
    if (!res.ok) return;
    activeLaunchStudents = await res.json();
    renderLiveStudentsTable();
  } catch (err) {}
}

function renderLiveStudentsTable() {
  const tbody = document.getElementById("live-students-tbody");
  if (!tbody) return;
  tbody.innerHTML = "";

  let total = activeLaunchStudents.length;
  let waiting = 0;
  let inProgress = 0;
  let submitted = 0;

  activeLaunchStudents.forEach(s => {
    if (s.status === "in_waiting" || s.status === "waiting_approval") waiting++;
    else if (s.status === "in_progress") inProgress++;
    else if (s.status === "submitted" || s.status === "time_expired") submitted++;

    const tr = document.createElement("tr");
    const isOnline = s.is_online;
    const connHtml = isOnline 
      ? '<span style="color: var(--success); font-weight: 700;">● В сети</span>'
      : '<span style="color: var(--text-muted);">○ Офлайн</span>';

    const vStr = String(s.variant || "1");
    const varBadge = vStr === "2"
      ? '<span class="badge" style="background: #E6F4EA; color: #166534; font-weight: 700; white-space: nowrap; display: inline-block;">Вар. 2</span>'
      : '<span class="badge" style="background: #FCE8E6; color: #991B1B; font-weight: 700; white-space: nowrap; display: inline-block;">Вар. 1</span>';

    tr.innerHTML = `
      <td><strong>${escapeHtml(s.student_name)}</strong></td>
      <td>${escapeHtml(s.student_class)}</td>
      <td>${varBadge}</td>
      <td><span style="font-family: 'JetBrains Mono', monospace; font-size: 0.82rem;">${escapeHtml(s.device_label || 'Сеть')}</span></td>
      <td><span class="badge badge-${s.status}">${getStatusLabel(s.status)}</span>${s.is_duplicate_flag ? '<br><small>Повторный IP: проверьте ученика</small>' : ''}</td>
      <td>${connHtml}</td>
      <td>${s.answered_count || 0} / ${s.task_count || 0} (${s.progress_pct || 0}%)</td>
      <td>${s.started_at ? new Date(s.started_at).toLocaleTimeString() : '—'}</td>
      <td>${s.submitted_at ? new Date(s.submitted_at).toLocaleTimeString() : '—'}</td>
      <td>
        ${['submitted', 'time_expired'].includes(s.status) ? `
          <label class="publish-results-toggle student-results-toggle" title="Показать ответы этому ученику">
            <input type="checkbox" ${s.results_published ? 'checked' : ''} onchange="toggleStudentResults('${s.id}', this.checked)">
            <span class="publish-results-toggle-slider" aria-hidden="true"></span>
          </label>` : '<span style="color: var(--text-muted);">—</span>'}
      </td>
      <td>
        <div style="display: flex; gap: 0.35rem; align-items: center;">
          ${s.status === 'waiting_approval' ? `<button type="button" class="btn btn-success btn-sm" onclick="studentAction('${s.id}', 'admit')">Допустить</button>` : ''}
          ${s.status === 'in_progress' ? `<button type="button" class="btn btn-warning btn-sm" onclick="studentAction('${s.id}', 'add_time')">+5 мин</button>` : ''}
          ${s.status === 'in_progress' ? `<button type="button" class="btn btn-danger btn-sm" onclick="studentAction('${s.id}', 'block')">Блок</button>` : ''}
          ${s.status === 'blocked' ? `<button type="button" class="btn btn-primary btn-sm" onclick="studentAction('${s.id}', 'unblock')">Разблок</button>` : ''}
          <button type="button" class="btn btn-danger btn-sm" onclick="deleteStudentAttempt('${s.id}', '${escapeHtml(s.student_name)}')" title="Удалить попытку и разрешить пересдачу">🗑</button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });

  document.getElementById("cnt-total").textContent = total;
  document.getElementById("cnt-waiting").textContent = waiting;
  document.getElementById("cnt-progress").textContent = inProgress;
  document.getElementById("cnt-submitted").textContent = submitted;
}

async function toggleStudentResults(attemptId, enabled) {
  if (!activeLaunch) return;
  try {
    const res = await fetch(`/api/launches/${activeLaunch.id}/students/${attemptId}/results-visibility`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled })
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail || "Не удалось изменить доступ");
    const student = activeLaunchStudents.find(s => s.id === attemptId);
    if (student) student.results_published = enabled;
  } catch (e) {
    alert("Ошибка: " + e.message);
    await refreshStudentsList();
  }
}
window.toggleStudentResults = toggleStudentResults;

async function deleteStudentAttempt(attemptId, studentName, permanent = false) {
  if (!activeLaunch) return;
  const message = permanent
    ? `Удалить результат ученика «${studentName}» навсегда?\nЭта операция удалит ответы из результатов и Excel.`
    : `Убрать ученика «${studentName}» из live-проведения?\nЕго попытка и ответы останутся в результатах, а ученик сможет войти заново.`;
  if (!confirm(message)) return;
  try {
    const suffix = permanent ? "?permanent=true" : "";
    const res = await fetch(`/api/launches/${activeLaunch.id}/students/${attemptId}${suffix}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Не удалось удалить попытку");
    await refreshStudentsList();
    await loadGradingData();
  } catch (e) {
    alert("Ошибка: " + e.message);
  }
}

async function studentAction(attemptId, action) {
  try {
    const res = await fetch(`/api/launches/${activeLaunch.id}/students/${attemptId}/action`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, extra_minutes: 5 })
    });
    if (res.ok) refreshStudentsList();
  } catch (e) {}
}

async function setLaunchStatus(status) {
  if (!activeLaunch) return;
  try {
    const res = await fetch(`/api/launches/${activeLaunch.id}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });
    if (res.ok) {
      activeLaunch.status = status;
      updateLiveStatusBadge(status);
      refreshStudentsList();
    }
  } catch (e) {}
}

function updateLiveStatusBadge(status) {
  const badge = document.getElementById("live-status-badge");
  badge.className = `badge badge-${status}`;
  badge.textContent = getStatusLabel(status);
}

function copyStudentLink() {
  const input = document.getElementById("live-public-url");
  input.select();
  navigator.clipboard.writeText(input.value);
  alert("Ссылка скопирована в буфер обмена!");
}

// Загрузка результатов с раздельной сортировкой, фильтрацией и печатью
let gradingRawData = null;
let currentGradingAttemptId = null;

function parseClassAndLetter(rawClass) {
  if (!rawClass) return { grade: "", letter: "" };
  const str = String(rawClass).trim();
  const match = str.match(/^(.*?)\s*([А-Яа-яA-Za-z])$/);
  if (match) {
    return {
      grade: match[1].trim() || str,
      letter: match[2].toUpperCase().trim()
    };
  }
  return {
    grade: str,
    letter: ""
  };
}

function isAnswerGiven(val) {
  if (val === null || val === undefined || val === "") return false;
  if (Array.isArray(val)) return val.length > 0;
  if (typeof val === "object") return Object.keys(val).length > 0;
  return true;
}

function formatDuration(startedAt, submittedAt) {
  if (!startedAt || !submittedAt) return "—";
  try {
    const start = new Date(startedAt).getTime();
    const end = new Date(submittedAt).getTime();
    const diffSec = Math.max(0, Math.round((end - start) / 1000));
    const mins = Math.floor(diffSec / 60);
    const secs = diffSec % 60;
    if (mins > 0 && secs > 0) return `${mins} мин ${secs} сек`;
    if (mins > 0) return `${mins} мин`;
    return `${secs} сек`;
  } catch (e) {
    return "—";
  }
}

function formatQuestionReviewHtml(t, ans, isPrint = false) {
  const qType = t.question_type;
  const studentAns = ans?.answer_parsed;
  const correctKey = t.answer_key;

  if (qType === "single_choice" || qType === "dropdown" || qType === "true_false") {
    let options = Array.isArray(t.options) && t.options.length ? [...t.options] : [];
    if (qType === "true_false" && options.length === 0) {
      options = ["Истина", "Ложь"];
    }
    if (studentAns !== null && studentAns !== undefined && studentAns !== "" && !options.some(o => String(o) === String(studentAns))) {
      options.push(String(studentAns));
    }

    const keyList = Array.isArray(correctKey) ? correctKey.map(String) : (correctKey !== null && correctKey !== undefined ? [String(correctKey)] : []);

    let rowsHtml = options.map(opt => {
      const optStr = String(opt);
      const isChosen = studentAns !== null && studentAns !== undefined && String(studentAns) === optStr;
      const isKey = keyList.includes(optStr);

      if (isChosen && isKey) {
        return `
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px 10px; background: #ECFDF5; border: 1.5px solid #10B981; border-radius: 6px; margin-bottom: 5px; color: #065F46; font-weight: 600;">
            <span>● ${escapeHtml(optStr)}</span>
            <span style="font-size: 0.8rem; background: #10B981; color: #fff; padding: 2px 7px; border-radius: 4px; font-weight: 700;">✔ Выбор ученика — Верно</span>
          </div>
        `;
      } else if (isChosen && !isKey) {
        return `
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px 10px; background: #FEF2F2; border: 1.5px solid #EF4444; border-radius: 6px; margin-bottom: 5px; color: #991B1B; font-weight: 600;">
            <span>● ${escapeHtml(optStr)}</span>
            <span style="font-size: 0.8rem; background: #EF4444; color: #fff; padding: 2px 7px; border-radius: 4px; font-weight: 700;">✖ Выбор ученика — Неверно</span>
          </div>
        `;
      } else if (isKey) {
        return `
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px 10px; background: #F0FDF4; border: 1.5px dashed #10B981; border-radius: 6px; margin-bottom: 5px; color: #047857; font-weight: 600;">
            <span>○ ${escapeHtml(optStr)}</span>
            <span style="font-size: 0.8rem; border: 1px solid #10B981; color: #047857; padding: 2px 7px; border-radius: 4px; font-weight: 700;">✔ Правильный вариант</span>
          </div>
        `;
      } else {
        return `
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px 10px; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 6px; margin-bottom: 5px; color: #475569;">
            <span>○ ${escapeHtml(optStr)}</span>
          </div>
        `;
      }
    }).join("");

    if (!studentAns && studentAns !== 0) {
      rowsHtml += `<div style="font-size: 0.82rem; color: #EF4444; margin-top: 4px; font-style: italic;">Ученик не дал ответа на это задание.</div>`;
    }

    return `<div style="margin-top: 6px;">${rowsHtml}</div>`;
  }

  if (qType === "multi_choice") {
    let options = Array.isArray(t.options) && t.options.length ? [...t.options] : [];
    const studentList = Array.isArray(studentAns) ? studentAns.map(String) : (studentAns !== null && studentAns !== undefined && studentAns !== "" ? [String(studentAns)] : []);
    const keyList = Array.isArray(correctKey) ? correctKey.map(String) : (correctKey !== null && correctKey !== undefined && correctKey !== "" ? [String(correctKey)] : []);

    studentList.forEach(s => {
      if (!options.some(o => String(o) === s)) options.push(s);
    });

    let rowsHtml = options.map(opt => {
      const optStr = String(opt);
      const isChosen = studentList.includes(optStr);
      const isKey = keyList.includes(optStr);

      if (isChosen && isKey) {
        return `
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px 10px; background: #ECFDF5; border: 1.5px solid #10B981; border-radius: 6px; margin-bottom: 5px; color: #065F46; font-weight: 600;">
            <span>☑ ${escapeHtml(optStr)}</span>
            <span style="font-size: 0.8rem; background: #10B981; color: #fff; padding: 2px 7px; border-radius: 4px; font-weight: 700;">✔ Выбор ученика — Верно</span>
          </div>
        `;
      } else if (isChosen && !isKey) {
        return `
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px 10px; background: #FEF2F2; border: 1.5px solid #EF4444; border-radius: 6px; margin-bottom: 5px; color: #991B1B; font-weight: 600;">
            <span>☑ ${escapeHtml(optStr)}</span>
            <span style="font-size: 0.8rem; background: #EF4444; color: #fff; padding: 2px 7px; border-radius: 4px; font-weight: 700;">✖ Выбор ученика — Неверно</span>
          </div>
        `;
      } else if (isKey) {
        return `
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px 10px; background: #F0FDF4; border: 1.5px dashed #10B981; border-radius: 6px; margin-bottom: 5px; color: #047857; font-weight: 600;">
            <span>☐ ${escapeHtml(optStr)}</span>
            <span style="font-size: 0.8rem; border: 1px solid #10B981; color: #047857; padding: 2px 7px; border-radius: 4px; font-weight: 700;">✔ Должен быть выбран</span>
          </div>
        `;
      } else {
        return `
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px 10px; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 6px; margin-bottom: 5px; color: #475569;">
            <span>☐ ${escapeHtml(optStr)}</span>
          </div>
        `;
      }
    }).join("");

    if (studentList.length === 0) {
      rowsHtml += `<div style="font-size: 0.82rem; color: #EF4444; margin-top: 4px; font-style: italic;">Ученик не выбрал вариантов.</div>`;
    }

    return `<div style="margin-top: 6px;">${rowsHtml}</div>`;
  }

  if (qType === "group_classification") {
    const keyObj = (typeof correctKey === "object" && correctKey !== null) ? correctKey : {};
    const stuObj = (typeof studentAns === "object" && studentAns !== null) ? studentAns : {};
    const items = Array.from(new Set([...Object.keys(keyObj), ...(t.options || []), ...Object.keys(stuObj)]));

    let rowsHtml = items.map(item => {
      const studentCat = stuObj[item] || "—";
      const correctCat = keyObj[item] || "—";
      const isMatch = studentCat !== "—" && studentCat === correctCat;
      const rowBg = isMatch ? "#F0FDF4" : (studentCat !== "—" ? "#FEF2F2" : "#F8FAFC");
      const statusBadge = isMatch
        ? '<span style="color: #059669; font-weight: 700;">✔ Верно</span>'
        : '<span style="color: #DC2626; font-weight: 700;">✖ Неверно</span>';

      return `
        <tr style="background: ${rowBg}; border-bottom: 1px solid #CBD5E1;">
          <td style="padding: 7px 10px; font-weight: 600; border: 1px solid #CBD5E1;">${escapeHtml(item)}</td>
          <td style="padding: 7px 10px; color: ${studentCat === '—' ? '#94A3B8' : '#0F172A'}; border: 1px solid #CBD5E1;">${escapeHtml(studentCat)}</td>
          <td style="padding: 7px 10px; color: #047857; font-weight: 600; border: 1px solid #CBD5E1;">${escapeHtml(correctCat)}</td>
          <td style="padding: 7px 10px; text-align: center; border: 1px solid #CBD5E1;">${statusBadge}</td>
        </tr>
      `;
    }).join("");

    return `
      <div style="overflow-x: auto; margin-top: 6px; border: 1px solid #CBD5E1; border-radius: 6px;">
        <table style="width: 100%; border-collapse: collapse; font-size: 0.88rem;">
          <thead>
            <tr style="background: #F1F5F9; border-bottom: 1.5px solid #CBD5E1;">
              <th style="padding: 7px 10px; text-align: left; border: 1px solid #CBD5E1;">Элемент</th>
              <th style="padding: 7px 10px; text-align: left; border: 1px solid #CBD5E1;">Ответ ученика</th>
              <th style="padding: 7px 10px; text-align: left; border: 1px solid #CBD5E1;">Правильная категория</th>
              <th style="padding: 7px 10px; text-align: center; border: 1px solid #CBD5E1; width: 95px;">Результат</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml || '<tr><td colspan="4" style="padding: 8px; text-align: center; color: #94A3B8;">Нет данных</td></tr>'}
          </tbody>
        </table>
      </div>
    `;
  }

  if (qType === "matching") {
    const keyObj = (typeof correctKey === "object" && correctKey !== null) ? correctKey : {};
    const stuObj = (typeof studentAns === "object" && studentAns !== null) ? studentAns : {};
    const items = Array.from(new Set([...Object.keys(keyObj), ...Object.keys(stuObj)]));

    let rowsHtml = items.map(item => {
      const studentMatch = stuObj[item] || "—";
      const correctMatch = keyObj[item] || "—";
      const isMatch = studentMatch !== "—" && studentMatch === correctMatch;
      const rowBg = isMatch ? "#F0FDF4" : (studentMatch !== "—" ? "#FEF2F2" : "#F8FAFC");
      const statusBadge = isMatch
        ? '<span style="color: #059669; font-weight: 700;">✔ Верно</span>'
        : '<span style="color: #DC2626; font-weight: 700;">✖ Неверно</span>';

      return `
        <tr style="background: ${rowBg}; border-bottom: 1px solid #CBD5E1;">
          <td style="padding: 7px 10px; font-weight: 600; border: 1px solid #CBD5E1;">${escapeHtml(item)}</td>
          <td style="padding: 7px 10px; color: ${studentMatch === '—' ? '#94A3B8' : '#0F172A'}; border: 1px solid #CBD5E1;">${escapeHtml(studentMatch)}</td>
          <td style="padding: 7px 10px; color: #047857; font-weight: 600; border: 1px solid #CBD5E1;">${escapeHtml(correctMatch)}</td>
          <td style="padding: 7px 10px; text-align: center; border: 1px solid #CBD5E1;">${statusBadge}</td>
        </tr>
      `;
    }).join("");

    return `
      <div style="overflow-x: auto; margin-top: 6px; border: 1px solid #CBD5E1; border-radius: 6px;">
        <table style="width: 100%; border-collapse: collapse; font-size: 0.88rem;">
          <thead>
            <tr style="background: #F1F5F9; border-bottom: 1.5px solid #CBD5E1;">
              <th style="padding: 7px 10px; text-align: left; border: 1px solid #CBD5E1;">Элемент / Термин</th>
              <th style="padding: 7px 10px; text-align: left; border: 1px solid #CBD5E1;">Ответ ученика</th>
              <th style="padding: 7px 10px; text-align: left; border: 1px solid #CBD5E1;">Правильное соответствие</th>
              <th style="padding: 7px 10px; text-align: center; border: 1px solid #CBD5E1; width: 95px;">Результат</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml || '<tr><td colspan="4" style="padding: 8px; text-align: center; color: #94A3B8;">Нет данных</td></tr>'}
          </tbody>
        </table>
      </div>
    `;
  }

  if (qType === "ordering") {
    const keyList = Array.isArray(correctKey) ? correctKey : [];
    const stuList = Array.isArray(studentAns) ? studentAns : [];
    const maxLen = Math.max(keyList.length, stuList.length);

    let rowsHtml = "";
    for (let i = 0; i < maxLen; i++) {
      const studentStep = stuList[i] || "—";
      const correctStep = keyList[i] || "—";
      const isMatch = studentStep !== "—" && studentStep === correctStep;
      const rowBg = isMatch ? "#F0FDF4" : (studentStep !== "—" ? "#FEF2F2" : "#F8FAFC");
      const statusBadge = isMatch
        ? '<span style="color: #059669; font-weight: 700;">✔ Верно</span>'
        : '<span style="color: #DC2626; font-weight: 700;">✖ Неверно</span>';

      rowsHtml += `
        <tr style="background: ${rowBg}; border-bottom: 1px solid #CBD5E1;">
          <td style="padding: 7px 10px; text-align: center; font-weight: 700; border: 1px solid #CBD5E1;">Шаг ${i + 1}</td>
          <td style="padding: 7px 10px; border: 1px solid #CBD5E1;">${escapeHtml(studentStep)}</td>
          <td style="padding: 7px 10px; color: #047857; font-weight: 600; border: 1px solid #CBD5E1;">${escapeHtml(correctStep)}</td>
          <td style="padding: 7px 10px; text-align: center; border: 1px solid #CBD5E1;">${statusBadge}</td>
        </tr>
      `;
    }

    return `
      <div style="overflow-x: auto; margin-top: 6px; border: 1px solid #CBD5E1; border-radius: 6px;">
        <table style="width: 100%; border-collapse: collapse; font-size: 0.88rem;">
          <thead>
            <tr style="background: #F1F5F9; border-bottom: 1.5px solid #CBD5E1;">
              <th style="padding: 7px 10px; text-align: center; border: 1px solid #CBD5E1; width: 80px;">Позиция</th>
              <th style="padding: 7px 10px; text-align: left; border: 1px solid #CBD5E1;">Ответ ученика</th>
              <th style="padding: 7px 10px; text-align: left; border: 1px solid #CBD5E1;">Правильный порядок</th>
              <th style="padding: 7px 10px; text-align: center; border: 1px solid #CBD5E1; width: 95px;">Результат</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml || '<tr><td colspan="4" style="padding: 8px; text-align: center; color: #94A3B8;">Нет данных</td></tr>'}
          </tbody>
        </table>
      </div>
    `;
  }

  // Default: short_text, fill_blank, number, text_manual
  const score = ans?.final_score !== null && ans?.final_score !== undefined ? parseFloat(ans.final_score) : 0;
  const tMax = parseFloat(t.max_score || 1);
  const isCorrect = score >= tMax;
  const isPartial = score > 0 && score < tMax;

  let stuValStr = studentAns !== null && studentAns !== undefined ? (typeof studentAns === "object" ? JSON.stringify(studentAns) : String(studentAns)) : "";
  let keyValStr = correctKey !== null && correctKey !== undefined ? (Array.isArray(correctKey) ? correctKey.join("; ") : (typeof correctKey === "object" ? JSON.stringify(correctKey) : String(correctKey))) : "—";

  return `
    <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 10px 14px; margin-top: 6px; font-size: 0.9rem;">
      <div style="display: flex; align-items: baseline; gap: 8px; margin-bottom: 6px;">
        <strong style="min-width: 130px; color: #475569;">Ответ ученика:</strong>
        <span style="font-weight: 600; color: ${isCorrect ? '#059669' : (stuValStr ? '#DC2626' : '#94A3B8')};">
          ${stuValStr ? escapeHtml(stuValStr) : '— (нет ответа)'}
        </span>
        ${stuValStr ? (isCorrect ? '<span style="color: #059669; font-weight: 700; font-size: 0.82rem;">(✔ Верно)</span>' : (isPartial ? '<span style="color: #D97706; font-weight: 700; font-size: 0.82rem;">(⚠ Частично)</span>' : '<span style="color: #DC2626; font-weight: 700; font-size: 0.82rem;">(✖ Неверно)</span>')) : ''}
      </div>
      <div style="display: flex; align-items: baseline; gap: 8px;">
        <strong style="min-width: 130px; color: #475569;">Правильный ключ:</strong>
        <span style="font-weight: 600; color: #047857;">${escapeHtml(keyValStr)}</span>
      </div>
    </div>
  `;
}

async function loadGradingData() {
  if (!activeLaunch) return;
  try {
    const res = await fetch(`/api/launches/${activeLaunch.id}/grading`);
    if (!res.ok) return;
    gradingRawData = await res.json();

    const attempts = gradingRawData.attempts || [];

    // Заполняем фильтр по классам
    const classSelect = document.getElementById("filter-results-class");
    if (classSelect) {
      const prevVal = classSelect.value;
      const uniqueGrades = Array.from(new Set(attempts.map(a => parseClassAndLetter(a.student_class).grade).filter(Boolean))).sort();
      classSelect.innerHTML = '<option value="">Все классы</option>' + uniqueGrades.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');
      if (uniqueGrades.includes(prevVal)) classSelect.value = prevVal;
    }

    // Заполняем фильтр по буквам
    const letterSelect = document.getElementById("filter-results-letter");
    if (letterSelect) {
      const prevVal = letterSelect.value;
      const uniqueLetters = Array.from(new Set(attempts.map(a => parseClassAndLetter(a.student_class).letter).filter(l => l && l !== "—"))).sort((a, b) => a.localeCompare(b, "ru"));
      letterSelect.innerHTML = '<option value="">Все буквы</option>' + uniqueLetters.map(l => `<option value="${escapeHtml(l)}">${escapeHtml(l)}</option>`).join('');
      if (uniqueLetters.includes(prevVal)) letterSelect.value = prevVal;
    }

    renderGradingView();
  } catch (e) {}
}

function resetResultsFilters() {
  const cSel = document.getElementById("filter-results-class");
  const lSel = document.getElementById("filter-results-letter");
  const qSel = document.getElementById("filter-results-quarter");
  const vSel = document.getElementById("filter-results-variant");
  const sInput = document.getElementById("filter-results-search");
  if (cSel) cSel.value = "";
  if (lSel) lSel.value = "";
  if (qSel) qSel.value = "";
  if (vSel) vSel.value = "";
  if (sInput) sInput.value = "";
  renderGradingView();
}
window.resetResultsFilters = resetResultsFilters;

function getGradingAttemptScore(att) {
  if (att && att.total_score !== undefined && att.total_score !== null) {
    return Math.round(parseFloat(att.total_score) * 10) / 10;
  }
  const attAnswers = (gradingRawData?.answers_by_attempt || {})[att?.id] || {};
  let sum = 0;
  Object.values(attAnswers).forEach(ans => {
    if (ans && ans.final_score !== null && ans.final_score !== undefined) {
      sum += parseFloat(ans.final_score);
    }
  });
  return Math.round(sum * 10) / 10;
}
window.getGradingAttemptScore = getGradingAttemptScore;

function renderGradingView() {
  if (!gradingRawData) return;
  const container = document.getElementById("grading-table-container");
  if (!container) return;

  const classFilter = document.getElementById("filter-results-class")?.value || "";
  const letterFilter = document.getElementById("filter-results-letter")?.value || "";
  const quarterFilter = document.getElementById("filter-results-quarter")?.value || "";
  const variantFilter = document.getElementById("filter-results-variant")?.value || "";
  const searchFilter = (document.getElementById("filter-results-search")?.value || "").toLowerCase().trim();

  let attempts = [...(gradingRawData.attempts || [])];

  // Фильтрация
  attempts = attempts.filter(att => {
    const classInfo = parseClassAndLetter(att.student_class);
    if (classFilter && classInfo.grade !== classFilter) return false;
    if (letterFilter && classInfo.letter !== letterFilter) return false;
    if (variantFilter && String(att.variant || "1") !== variantFilter) return false;
    if (searchFilter && !(att.student_name || "").toLowerCase().includes(searchFilter)) return false;

    if (quarterFilter) {
      const lQ = String(gradingRawData.launch?.quarter || "").replace(/\D/g, "");
      const fQ = String(quarterFilter).replace(/\D/g, "");
      if (lQ && fQ && lQ !== fQ) return false;
    }
    return true;
  });

  // Автоматическая сортировка по алфавиту (ФИО А-Я)
  attempts.sort((a, b) => (a.student_name || "").localeCompare(b.student_name || "", "ru"));

  const tasks = gradingRawData.tasks || [];

  if (attempts.length === 0) {
    container.innerHTML = `<div style="text-align: center; padding: 2rem; color: var(--text-muted);">По выбранным фильтрам ученики не найдены.</div>`;
    return;
  }

  let tableHtml = `
    <div class="table-responsive">
      <table class="table">
        <thead>
          <tr>
            <th>ФИО Ученика</th>
            <th>Класс</th>
            <th>Вариант</th>
            <th>Статус</th>
            <th>Итоговый балл</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
  `;

  attempts.forEach(att => {
    const vStr = String(att.variant || "1");
    const varBadge = vStr === "2"
      ? '<span class="badge" style="background: #E6F4EA; color: #166534; font-weight: 700; white-space: nowrap; display: inline-block;">Вар. 2</span>'
      : '<span class="badge" style="background: #FCE8E6; color: #991B1B; font-weight: 700; white-space: nowrap; display: inline-block;">Вар. 1</span>';

    const studentTasks = tasks.filter(t => {
      const tv = String(t.variant || "1");
      return tv === "all" || tv === "1,2" || tv === vStr;
    });
    const maxScore = studentTasks.reduce((sum, t) => sum + parseFloat(t.max_score || 1), 0);
    const studentTotal = getGradingAttemptScore(att);
    const pct = maxScore > 0 ? Math.round((studentTotal / maxScore) * 100) : 0;

    tableHtml += `
      <tr>
        <td><strong>${escapeHtml(att.student_name)}</strong></td>
        <td>${escapeHtml(att.student_class)}</td>
        <td>${varBadge}</td>
        <td><span class="badge badge-${att.status}">${getStatusLabel(att.status)}</span></td>
        <td>
          <strong style="color: var(--primary); font-size: 1.05rem;">${studentTotal} / ${maxScore} б.</strong>
          <span style="font-size: 0.8rem; color: var(--text-muted); margin-left: 0.35rem;">(${pct}%)</span>
        </td>
        <td>
          <div style="display: flex; gap: 0.4rem; align-items: center;">
            <button type="button" class="btn btn-secondary btn-sm" onclick="openStudentGradingModal('${att.id}')">
              📄 Просмотр
            </button>
            <button type="button" class="btn btn-primary btn-sm" onclick="printStudentSheet('${att.id}')" title="Печать бланка в PDF">
              🖨 Печать в PDF
            </button>
            <button type="button" class="btn btn-danger btn-sm" onclick="deleteStudentAttempt('${att.id}', '${escapeHtml(att.student_name)}', true)" title="Удалить результат навсегда">
              🗑
            </button>
          </div>
        </td>
      </tr>
    `;
  });

  tableHtml += `</tbody></table></div>`;
  container.innerHTML = tableHtml;
}

// Печать общей сводной ведомости
function printAllResultsSummary() {
  const launch = activeLaunch || gradingRawData?.launch;
  if (!gradingRawData || !launch) {
    alert("Данные для печати ещё загружаются. Пожалуйста, попробуйте через пару секунд.");
    return;
  }

  const classFilter = document.getElementById("filter-results-class")?.value || "";
  const letterFilter = document.getElementById("filter-results-letter")?.value || "";
  const quarterFilter = document.getElementById("filter-results-quarter")?.value || "";
  const variantFilter = document.getElementById("filter-results-variant")?.value || "";
  const searchFilter = (document.getElementById("filter-results-search")?.value || "").toLowerCase().trim();

  let attempts = [...(gradingRawData.attempts || [])];
  attempts = attempts.filter(att => {
    const classInfo = parseClassAndLetter(att.student_class);
    if (classFilter && classInfo.grade !== classFilter) return false;
    if (letterFilter && classInfo.letter !== letterFilter) return false;
    if (variantFilter && String(att.variant || "1") !== variantFilter) return false;
    if (searchFilter && !(att.student_name || "").toLowerCase().includes(searchFilter)) return false;
    if (quarterFilter) {
      const lQ = String(gradingRawData.launch?.quarter || "").replace(/\D/g, "");
      const fQ = String(quarterFilter).replace(/\D/g, "");
      if (lQ && fQ && lQ !== fQ) return false;
    }
    return true;
  });

  // Автоматическая сортировка по алфавиту
  attempts.sort((a, b) => (a.student_name || "").localeCompare(b.student_name || "", "ru"));

  const tasks = gradingRawData.tasks || [];

  let rowsHtml = attempts.map((att, idx) => {
    const vStr = String(att.variant || "1");
    const studentTasks = tasks.filter(t => {
      const tv = String(t.variant || "1");
      return tv === "all" || tv === "1,2" || tv === vStr;
    });
    const maxScore = studentTasks.reduce((sum, t) => sum + parseFloat(t.max_score || 1), 0);
    const score = getGradingAttemptScore(att);
    const pct = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;

    return `
      <tr>
        <td style="text-align: center;">${idx + 1}</td>
        <td><strong>${escapeHtml(att.student_name)}</strong></td>
        <td style="text-align: center;">${escapeHtml(att.student_class)}</td>
        <td style="text-align: center;">Вариант ${vStr}</td>
        <td style="text-align: center;"><strong>${score}</strong> / ${maxScore}</td>
        <td style="text-align: center;">${pct}%</td>
        <td style="text-align: center;">${att.submitted_at ? new Date(att.submitted_at).toLocaleTimeString() : '—'}</td>
      </tr>
    `;
  }).join("");

  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Браузер заблокировал всплывающее окно. Пожалуйста, разрешите всплывающие окна.");
    return;
  }

  const launchTitle = escapeHtml(launch.title || "Результаты работы");

  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="ru">
    <head>
      <meta charset="UTF-8">
      <title>Ведомость — ${launchTitle}</title>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; padding: 25px; color: #111; }
        h1 { font-size: 20px; margin-bottom: 5px; }
        p { margin: 4px 0 15px 0; color: #555; font-size: 14px; }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 13px; }
        th, td { border: 1px solid #333; padding: 7px 10px; }
        th { background: #f0f0f0; font-weight: bold; }
        @media print {
          body { padding: 0; }
          button { display: none; }
        }
      </style>
    </head>
    <body>
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
        <div>
          <h1>Сводная ведомость результатов оценивания</h1>
          <p><strong>Работа:</strong> ${launchTitle} | <strong>Дата:</strong> ${new Date().toLocaleDateString()}</p>
        </div>
        <button onclick="window.print()" style="padding: 8px 16px; cursor: pointer; font-size: 14px; background: #4F46E5; color: #fff; border: none; border-radius: 6px; font-weight: 700;">🖨 Печать</button>
      </div>
      <table>
        <thead>
          <tr>
            <th style="width: 35px;">№</th>
            <th>ФИО Ученика</th>
            <th style="width: 80px;">Класс</th>
            <th style="width: 90px;">Вариант</th>
            <th style="width: 100px;">Балл</th>
            <th style="width: 70px;">%</th>
            <th style="width: 90px;">Время сдачи</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml || '<tr><td colspan="7" style="text-align: center;">Нет данных</td></tr>'}
        </tbody>
      </table>
    </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
}
window.printAllResultsSummary = printAllResultsSummary;

// Открытие бланка проверки работы ученика
function openStudentGradingModal(attemptId) {
  if (!gradingRawData) return;
  const att = (gradingRawData.attempts || []).find(a => a.id === attemptId);
  if (!att) return;

  currentGradingAttemptId = attemptId;
  const vStr = String(att.variant || "1");
  const allTasks = gradingRawData.tasks || [];
  const tasks = allTasks.filter(t => {
    const tv = String(t.variant || "1");
    return tv === "all" || tv === "1,2" || tv === vStr;
  });

  const answers = (gradingRawData.answers_by_attempt || {})[attemptId] || {};
  const durationText = formatDuration(att.started_at, att.submitted_at);
  const classInfo = parseClassAndLetter(att.student_class);

  document.getElementById("grade-modal-student").textContent = `${att.student_name} (${att.student_class}) · Вариант ${vStr} · Сдано: ${att.submitted_at ? new Date(att.submitted_at).toLocaleTimeString() : '—'}`;

  const container = document.getElementById("grade-modal-tasks");
  container.innerHTML = "";

  let totalScore = 0;
  let maxScore = 0;
  let answeredCount = 0;

  tasks.forEach((t, idx) => {
    const tMax = parseFloat(t.max_score || 1);
    maxScore += tMax;
    const ans = answers[t.id] || {};
    const score = ans.final_score !== null && ans.final_score !== undefined ? parseFloat(ans.final_score) : 0;
    totalScore += score;
    if (isAnswerGiven(ans.answer_parsed)) answeredCount++;

    const isCorrect = score >= tMax;
    const isPartial = score > 0 && score < tMax;
    const badgeColor = isCorrect ? "#10B981" : (isPartial ? "#F59E0B" : "#EF4444");
    const badgeLabel = isCorrect ? "Верно" : (isPartial ? "Частично" : "Неверно");

    const card = document.createElement("div");
    card.className = "print-task-card";
    card.style.background = "#FFFFFF";
    card.style.border = "1px solid var(--border)";
    card.style.borderRadius = "8px";
    card.style.padding = "1rem";
    card.style.marginBottom = "1rem";

    card.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; font-weight: 700; margin-bottom: 0.5rem; padding-bottom: 0.4rem; border-bottom: 1px solid var(--border);">
        <span style="font-size: 1rem; color: var(--text-main);">Задание ${t.order_index || (idx + 1)} <span style="font-size: 0.82rem; color: var(--text-muted); font-weight: 500;">(${escapeHtml(TASK_TYPES[t.question_type] || t.question_type)})</span></span>
        <span style="color: ${badgeColor}; font-weight: 800; font-size: 0.95rem;">${score} / ${tMax} б. · ${badgeLabel}</span>
      </div>
      <p style="margin-bottom: 0.65rem; font-size: 0.95rem; font-weight: 500;">${escapeHtml(t.question_text)}</p>
      ${t.image_url ? `<img src="${escapeHtml(t.image_url)}" style="max-width: 100%; max-height: 250px; border-radius: 6px; margin-bottom: 0.75rem; display: block;" />` : ''}
      ${formatQuestionReviewHtml(t, ans, false)}
      ${t.descriptor ? `<div style="font-size: 0.82rem; color: var(--text-muted); margin-top: 0.5rem;"><em>Дескриптор: ${escapeHtml(t.descriptor)}</em></div>` : ''}
      ${t.comment_explanation ? `<div style="font-size: 0.82rem; color: #4338CA; margin-top: 0.35rem;"><strong>Пояснение:</strong> ${escapeHtml(t.comment_explanation)}</div>` : ''}
      ${ans.teacher_comment ? `<div style="font-size: 0.82rem; color: #B45309; margin-top: 0.35rem;"><strong>Комментарий учителя:</strong> ${escapeHtml(ans.teacher_comment)}</div>` : ''}
    `;
    container.appendChild(card);
  });

  totalScore = Math.round(totalScore * 10) / 10;
  maxScore = Math.round(maxScore * 10) / 10;
  const pct = maxScore > 0 ? Math.round(totalScore / maxScore * 100) : 0;

  const summary = document.createElement("div");
  summary.style.background = "var(--primary-light)";
  summary.style.border = "1.5px solid var(--border-focus)";
  summary.style.borderRadius = "8px";
  summary.style.padding = "1rem 1.25rem";
  summary.style.marginBottom = "1.25rem";
  summary.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem;">
      <div>
        <h3 style="font-size: 1.25rem; color: var(--primary); margin: 0 0 0.25rem 0;">ИТОГОВЫЙ БАЛЛ: ${totalScore} из ${maxScore} (${pct}%)</h3>
        <div style="font-size: 0.88rem; color: var(--text-main);">
          <span>Класс: <strong>${escapeHtml(classInfo.grade || att.student_class)}</strong></span>
          ${classInfo.letter && classInfo.letter !== '—' ? `<span style="margin-left: 0.75rem;">Буква: <strong>${escapeHtml(classInfo.letter)}</strong></span>` : ''}
          <span style="margin-left: 0.75rem;">Вариант: <strong>${escapeHtml(vStr)}</strong></span>
        </div>
      </div>
      <div style="display: flex; gap: 1rem; font-size: 0.88rem; color: var(--text-main);">
        <div>Выполнено: <strong>${answeredCount} из ${tasks.length}</strong></div>
        <div>Время: <strong>${escapeHtml(durationText)}</strong></div>
      </div>
    </div>
  `;
  container.prepend(summary);

  try {
    if (window.renderMathInElement) {
      window.renderMathInElement(container, {
        delimiters: [
          { left: "$$", right: "$$", display: true },
          { left: "$", right: "$", display: false }
        ],
        throwOnError: false
      });
    }
  } catch (e) {}

  document.getElementById("student-grading-modal").classList.add("open");
}

// Выделенная печать бланка ответов конкретного ученика в PDF
function printStudentSheet(attemptId) {
  if (!gradingRawData) return;
  const targetId = attemptId || currentGradingAttemptId;
  const att = (gradingRawData.attempts || []).find(a => a.id === targetId);
  if (!att) return;

  const vStr = String(att.variant || "1");
  const allTasks = gradingRawData.tasks || [];
  const tasks = allTasks.filter(t => {
    const tv = String(t.variant || "1");
    return tv === "all" || tv === "1,2" || tv === vStr;
  });

  const answers = (gradingRawData.answers_by_attempt || {})[att.id] || {};

  let totalScore = 0;
  let maxScore = 0;
  let answeredCount = 0;

  tasks.forEach(t => {
    const tMax = parseFloat(t.max_score || 1);
    maxScore += tMax;
    const ans = answers[t.id] || {};
    const score = ans.final_score !== null && ans.final_score !== undefined ? parseFloat(ans.final_score) : 0;
    totalScore += score;
    if (isAnswerGiven(ans.answer_parsed)) answeredCount++;
  });

  totalScore = Math.round(totalScore * 10) / 10;
  maxScore = Math.round(maxScore * 10) / 10;
  const pct = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
  const durationText = formatDuration(att.started_at, att.submitted_at);
  const classInfo = parseClassAndLetter(att.student_class);

  const tasksHtml = tasks.map((t, idx) => {
    const ans = answers[t.id] || {};
    const score = ans.final_score !== null && ans.final_score !== undefined ? parseFloat(ans.final_score) : 0;
    const tMax = parseFloat(t.max_score || 1);
    const isCorrect = score >= tMax;
    const isPartial = score > 0 && score < tMax;
    const badgeColor = isCorrect ? "#059669" : (isPartial ? "#D97706" : "#DC2626");
    const badgeLabel = isCorrect ? "Верно" : (isPartial ? "Частично" : "Неверно");

    return `
      <div class="task-card">
        <div class="task-header">
          <div class="task-num">Задание ${t.order_index || (idx + 1)}. <span style="font-weight: 500; font-size: 12px; color: #64748b;">(${escapeHtml(TASK_TYPES[t.question_type] || t.question_type)})</span></div>
          <div class="task-score" style="color: ${badgeColor};">${score} / ${tMax} б. · ${badgeLabel}</div>
        </div>
        <div class="task-question">${escapeHtml(t.question_text)}</div>
        ${t.image_url ? `<img src="${escapeHtml(t.image_url)}" style="max-width: 100%; max-height: 220px; border-radius: 6px; margin-bottom: 8px; display: block;" />` : ''}
        ${formatQuestionReviewHtml(t, ans, true)}
        ${t.descriptor ? `<div style="font-size: 11.5px; color: #64748b; margin-top: 6px;"><em>Дескриптор: ${escapeHtml(t.descriptor)}</em></div>` : ''}
      </div>
    `;
  }).join("");

  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Браузер заблокировал всплывающее окно печати. Пожалуйста, разрешите всплывающие окна.");
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="ru">
    <head>
      <meta charset="UTF-8">
      <title>Бланк ответов — ${escapeHtml(att.student_name)}</title>
      <style>
        @page {
          size: A4;
          margin: 12mm 15mm 15mm 15mm;
        }
        * { box-sizing: border-box; }
        body {
          font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Arial, sans-serif;
          color: #1e293b;
          margin: 0;
          padding: 20px;
          font-size: 13px;
          line-height: 1.45;
          background: #ffffff;
        }
        .no-print {
          margin-bottom: 20px;
          padding: 12px 18px;
          background: #f8fafc;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        @media print {
          body { padding: 0; }
          .no-print { display: none !important; }
          .task-card { page-break-inside: avoid; }
        }
        .header-box {
          border: 2px solid #3b82f6;
          border-radius: 8px;
          padding: 14px 18px;
          margin-bottom: 18px;
          background: #f8fafc;
        }
        .header-title {
          font-size: 17px;
          font-weight: 800;
          color: #1e3a8a;
          margin: 0 0 10px 0;
        }
        .info-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
          font-size: 12.5px;
        }
        .info-item {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          padding: 7px 10px;
        }
        .info-label {
          font-size: 10.5px;
          color: #64748b;
          font-weight: 700;
          text-transform: uppercase;
          margin-bottom: 2px;
        }
        .info-val {
          font-size: 13.5px;
          font-weight: 700;
          color: #0f172a;
        }
        .task-card {
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          padding: 12px 16px;
          margin-bottom: 12px;
          background: #ffffff;
        }
        .task-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
          padding-bottom: 6px;
          border-bottom: 1px solid #f1f5f9;
        }
        .task-num {
          font-size: 13.5px;
          font-weight: 800;
          color: #1e293b;
        }
        .task-score {
          font-size: 12.5px;
          font-weight: 800;
        }
        .task-question {
          font-size: 13px;
          font-weight: 600;
          margin: 0 0 10px 0;
          color: #0f172a;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12px;
          margin-top: 6px;
        }
        th, td {
          border: 1px solid #cbd5e1;
          padding: 6px 8px;
          text-align: left;
        }
        th {
          background: #f1f5f9;
          font-weight: 700;
        }
      </style>
    </head>
    <body>
      <div class="no-print">
        <div>
          <strong style="color: #0f172a;">📄 Бланк результатов проверки ученика</strong>
          <span style="color: #64748b; margin-left: 8px;">(для сохранения в PDF выберите «Сохранить как PDF» в окне печати)</span>
        </div>
        <div style="display: flex; gap: 8px;">
          <button onclick="window.print()" style="padding: 7px 16px; background: #2563eb; color: #fff; border: none; border-radius: 6px; font-weight: 700; cursor: pointer; font-size: 13px;">🖨 Печать / PDF</button>
          <button onclick="window.close()" style="padding: 7px 14px; background: #e2e8f0; color: #334155; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 13px;">Закрыть</button>
        </div>
      </div>

      <div class="header-box">
        <div class="header-title">${escapeHtml(activeLaunch?.title || gradingRawData.launch?.title || "Результаты работы")}</div>
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">Фамилия и имя</div>
            <div class="info-val">${escapeHtml(att.student_name)}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Класс</div>
            <div class="info-val">${escapeHtml(classInfo.grade || att.student_class)}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Буква</div>
            <div class="info-val">${escapeHtml(classInfo.letter || "—")}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Вариант</div>
            <div class="info-val">Вариант ${escapeHtml(vStr)}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Выполнено заданий</div>
            <div class="info-val">${answeredCount} из ${tasks.length}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Набранные баллы</div>
            <div class="info-val" style="color: #2563eb;">${totalScore} из ${maxScore}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Процент</div>
            <div class="info-val" style="color: #059669;">${pct}%</div>
          </div>
          <div class="info-item">
            <div class="info-label">Потраченное время</div>
            <div class="info-val">${escapeHtml(durationText)}</div>
          </div>
        </div>
      </div>

      <div>
        ${tasksHtml}
      </div>
    </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
}
window.printStudentSheet = printStudentSheet;

function downloadExport(type) {
  if (!activeLaunch) return;
  window.open(`/api/launches/${activeLaunch.id}/export.${type}`, "_blank");
}

function startLiveMonitoring(launchId) {
  stopLiveMonitoring();
  pollInterval = setInterval(refreshStudentsList, 5000);
}

function stopLiveMonitoring() {
  if (pollInterval) clearInterval(pollInterval);
}

// Резервные копии
async function loadBackups() {
  try {
    const res = await fetch("/api/backup/list");
    if (!res.ok) return;
    const backups = await res.json();
    const container = document.getElementById("backups-list");
    if (!container) return;
    container.innerHTML = "";

    if (backups.length === 0) {
      container.innerHTML = `<p style="padding: 1.5rem; text-align: center; color: var(--text-muted);">Резервных копий пока нет.</p>`;
      return;
    }

    backups.forEach(b => {
      const row = document.createElement("div");
      row.style.padding = "1rem 1.5rem";
      row.style.borderBottom = "1px solid var(--border)";
      row.style.display = "flex";
      row.style.alignItems = "center";
      row.style.justifyContent = "space-between";
      row.style.flexWrap = "wrap";
      row.style.gap = "0.75rem";

      const fn = typeof b === "string" ? b : (b.filename || "backup.sqlite3");
      const sizeText = (typeof b === "object" && b.size_kb !== undefined && b.size_kb !== null) ? `${b.size_kb} КБ` : "";
      const dateText = (typeof b === "object" && b.created_at) ? new Date(b.created_at).toLocaleString() : "";
      const metaText = [sizeText, dateText].filter(Boolean).join(" · ") || "Резервная копия базы данных";

      row.innerHTML = `
        <div>
          <strong>${escapeHtml(fn)}</strong>
          <div style="font-size: 0.82rem; color: var(--text-muted);">${escapeHtml(metaText)}</div>
        </div>
        <div style="display: flex; gap: 0.5rem;">
          <button type="button" class="btn btn-secondary btn-sm" onclick="restoreBackup('${escapeHtml(fn)}')">Восстановить эту копию</button>
          <button type="button" class="btn btn-danger btn-sm" onclick="deleteBackup('${escapeHtml(fn)}')">🗑 Удалить</button>
        </div>
      `;
      container.appendChild(row);
    });
  } catch (e) {}
}

async function createNewBackup() {
  const input = document.getElementById("backup-custom-name");
  const customName = input ? input.value.trim() : "";

  try {
    const res = await fetch("/api/backup/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: customName || undefined })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Не удалось создать резервную копию");
    if (input) input.value = "";
    loadBackups();
  } catch (err) {
    alert("Ошибка бэкапа: " + err.message);
  }
}

async function deleteBackup(filename) {
  if (!confirm(`Вы действительно хотите удалить резервную копию «${filename}»?`)) return;
  try {
    const res = await fetch(`/api/backup/${encodeURIComponent(filename)}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Не удалось удалить копию");
    loadBackups();
  } catch (err) {
    alert("Ошибка удаления: " + err.message);
  }
}

async function restoreBackup(name) {
  if (confirm(`Восстановить базу данных из копии ${name}?`)) {
    await fetch(`/api/backup/restore?backup_name=${encodeURIComponent(name)}`, { method: "POST" });
    alert("База данных успешно восстановлена");
    loadBackups();
  }
}

function getStatusLabel(s) {
  const map = {
    draft: "Подготовка",
    waiting: "Комната ожидания",
    active: "Выполняется",
    closed_entry: "Вход закрыт",
    finished: "Завершено",
    in_waiting: "В ожидании",
    waiting_approval: "Ожидает допуска",
    approved: "Допущен",
    in_progress: "Пишет работу",
    submitted: "Сдал работу",
    time_expired: "Время истекло",
    blocked: "Заблокирован"
  };
  return map[s] || s;
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
