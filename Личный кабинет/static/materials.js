/**
 * Materials Manager (ImgBB-style Media Hosting & Google Drive Cloud Storage)
 * 100% Neumorphic Theme matching Cabinet & Generator
 */

(function () {
  let materialsState = {
    folder: "",
    mediaType: "all",
    search: "",
    items: [],
    folders: [],
    stats: {},
    activeItem: null,
    isInitialized: false,
    pollTimer: null,
  };

  // Helper: Format bytes to human readable string
  function formatBytes(bytes) {
    if (!bytes || bytes === 0) return "0 Б";
    const k = 1024;
    const sizes = ["Б", "КБ", "МБ", "ГБ"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  }

  // Helper: Escape HTML
  function escapeHtml(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  // Copy text to clipboard with button feedback
  window.copyMaterialCode = function (text, btn) {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      const origText = btn.innerHTML;
      btn.classList.add("copied");
      btn.innerHTML = "✓ Скопировано!";
      setTimeout(() => {
        btn.classList.remove("copied");
        btn.innerHTML = origText;
      }, 1800);
    }).catch(err => {
      console.error("Ошибка копирования в буфер:", err);
      window.prompt("Скопируйте ссылку вручную (Ctrl+C):", text);
    });
  };

  // Init Materials Manager
  window.initMaterialsManager = async function () {
    if (materialsState.isInitialized) {
      await loadMaterials();
      return;
    }
    materialsState.isInitialized = true;
    setupGlobalPasteListener();
    setupDropzoneListeners();
    await loadMaterials();
  };

  // Dropzone drag and drop listeners
  function setupDropzoneListeners() {
    const dz = document.getElementById("materials-dropzone");
    if (!dz) return;
    ['dragenter', 'dragover'].forEach(eventName => {
      dz.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dz.classList.add('drag-active');
      }, false);
    });
    ['dragleave', 'drop'].forEach(eventName => {
      dz.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dz.classList.remove('drag-active');
      }, false);
    });
    dz.addEventListener('drop', (e) => {
      const dt = e.dataTransfer;
      const files = dt.files;
      if (files && files.length > 0) {
        window.handleFilesChosen(files);
      }
    }, false);
  }

  // Load materials from API
  async function loadMaterials() {
    const grid = document.getElementById("materials-grid");
    if (!grid) return;

    try {
      const params = new URLSearchParams();
      if (materialsState.folder) params.set("folder", materialsState.folder);
      if (materialsState.mediaType && materialsState.mediaType !== "all") params.set("media_type", materialsState.mediaType);
      if (materialsState.search) params.set("search", materialsState.search);

      const res = await fetch(`/api/materials?${params.toString()}`);
      if (!res.ok) {
        if (res.status === 401) {
          window.location.replace("/login");
          return;
        }
        throw new Error("Не удалось загрузить материалы");
      }

      const data = await res.json();
      materialsState.items = data.items || [];
      materialsState.folders = data.folders || [];
      materialsState.stats = data.stats || {};

      renderMaterialsUI();

      // Check if any image is still syncing to Google Drive
      const hasUnsynced = materialsState.items.some(it => it.media_type === "image" && !it.google_drive_id);
      if (hasUnsynced) {
        scheduleSyncPoll();
      } else {
        clearSyncPoll();
      }
    } catch (e) {
      console.error("Error loading materials:", e);
      grid.innerHTML = `
        <div class="materials-empty-container">
          <div class="materials-empty-icon">⚠️</div>
          <div class="materials-empty-title">Ошибка загрузки материалов</div>
          <p>${escapeHtml(e.message)}</p>
          <button class="btn btn-primary" onclick="window.initMaterialsManager()" style="margin-top: 14px;">Повторить попытку</button>
        </div>
      `;
    }
  }

  function scheduleSyncPoll() {
    if (materialsState.pollTimer) return;
    materialsState.pollTimer = setTimeout(async () => {
      materialsState.pollTimer = null;
      // Only poll if materials section is visible
      if (window.location.hash === "#materials") {
        await loadMaterials();
      }
    }, 4000);
  }

  function clearSyncPoll() {
    if (materialsState.pollTimer) {
      clearTimeout(materialsState.pollTimer);
      materialsState.pollTimer = null;
    }
  }

  // Render Full UI
  function renderMaterialsUI() {
    renderStats();
    renderAlbumDropdown();
    renderCards();
  }

  // 1. Render Stats Ribbon
  function renderStats() {
    const statsContainer = document.getElementById("materials-stats");
    if (!statsContainer) return;

    const s = materialsState.stats;
    statsContainer.innerHTML = `
      <span>Всего файлов: <strong>${s.total_count || 0}</strong></span>
      <span>•</span>
      <span>Изображений: <strong>${s.images_count || 0}</strong></span>
      <span>•</span>
      <span>Видео: <strong>${s.videos_count || 0}</strong></span>
      <span>•</span>
      <span>Альбомов: <strong>${s.folders_count || 1}</strong></span>
      <span>•</span>
      <span>Объём: <strong style="color: var(--teal);">${formatBytes(s.total_size || 0)}</strong></span>
    `;
  }

  // 2. Render Album Dropdown Filter
  function renderAlbumDropdown() {
    const sel = document.getElementById("materials-album-select-filter");
    if (!sel) return;

    const current = materialsState.folder;
    let html = `<option value="" ${current === "" ? "selected" : ""}>📁 Все альбомы (${materialsState.stats.total_count || 0})</option>`;

    materialsState.folders.forEach(f => {
      const count = materialsState.items.filter(it => it.folder_name === f.name).length;
      html += `<option value="${escapeHtml(f.name)}" ${current === f.name ? "selected" : ""}>📁 ${escapeHtml(f.name)} (${count})</option>`;
    });

    sel.innerHTML = html;
  }

  // 3. Render Cards Grid (ImgBB style)
  function renderCards() {
    const grid = document.getElementById("materials-grid");
    if (!grid) return;

    if (materialsState.items.length === 0) {
      grid.innerHTML = `
        <div class="materials-empty-container">
          <div class="materials-empty-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
          </div>
          <div class="materials-empty-title">В этом разделе пока нет файлов</div>
          <p style="margin: 0 0 18px 0; font-size: 0.86rem;">Загрузите изображения со своего устройства, вставьте ссылку на картинку или добавьте YouTube видео.</p>
          <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
            <button class="btn btn-primary" onclick="window.openUploadModal()">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              <span>Загрузить файл</span>
            </button>
            <button class="btn btn-secondary" onclick="window.openAddUrlModal()">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
              <span>По ссылке</span>
            </button>
          </div>
        </div>
      `;
      return;
    }

    grid.innerHTML = materialsState.items.map(it => {
      const links = it.links || {};
      const isVideo = it.media_type === "video";
      const sizeStr = isVideo ? "YouTube HD" : formatBytes(it.file_size);
      
      const gdriveBadge = isVideo
        ? `<span class="materials-gdrive-status" style="color: #ef4444;">▶ YouTube видео</span>`
        : (it.google_drive_id && !it.google_drive_id.startsWith("local-"))
          ? `<span class="materials-gdrive-status gdrive-synced"><span style="font-size:1rem;">✓</span> Google Диск</span>`
          : `<span class="materials-gdrive-status gdrive-syncing">⏳ Синхронизация с Google Диске...</span>`;

      const directUrl = links.google_drive_direct || links.local_direct_link || links.watch_link || "";

      return `
        <div class="materials-card" data-item-id="${it.id}">
          <div class="materials-thumb-wrap" onclick="window.openMaterialViewer('${it.id}')">
            <span class="materials-card-badge ${isVideo ? 'badge-video' : 'badge-image'}">
              ${isVideo ? 'ВИДЕО' : 'ФОТО'}
            </span>
            <img src="${escapeHtml(links.preview_url)}" class="materials-thumb-img" alt="${escapeHtml(it.title)}" loading="lazy">
            ${isVideo ? `
              <div class="materials-video-play-btn">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              </div>
            ` : ''}
          </div>

          <div class="materials-card-body">
            <div class="materials-card-title" title="${escapeHtml(it.title)}" onclick="window.openMaterialViewer('${it.id}')">
              ${escapeHtml(it.title)}
            </div>

            <div class="materials-card-meta">
              <span class="materials-folder-badge">📁 ${escapeHtml(it.folder_name || 'Общие')}</span>
              <span>${sizeStr}</span>
            </div>

            ${gdriveBadge}

            <div class="materials-card-actions">
              <button type="button" class="btn btn-primary materials-btn-links" onclick="window.openImgbbLinksModal('${it.id}')">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                <span>Ссылки (ImgBB)</span>
              </button>

              <button type="button" class="btn btn-secondary materials-btn-icon" title="Скопировать прямую ссылку" onclick="window.copyMaterialCode('${escapeHtml(directUrl)}', this)">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
              </button>

              <button type="button" class="btn btn-ghost materials-btn-icon" style="color: #ef4444;" title="Удалить файл" onclick="window.deleteMaterialItem('${it.id}')">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              </button>
            </div>
          </div>
        </div>
      `;
    }).join("");
  }

  // Switch folder
  window.selectMaterialFolder = function (folderName) {
    materialsState.folder = folderName;
    loadMaterials();
  };

  // Filter by Type
  window.filterMaterialsByType = function (type) {
    materialsState.mediaType = type;
    document.querySelectorAll(".materials-type-btn").forEach(b => {
      b.classList.toggle("is-active", b.dataset.type === type);
      b.classList.toggle("active", b.dataset.type === type);
    });
    loadMaterials();
  };

  // Search input handler
  window.handleMaterialsSearch = function (val) {
    materialsState.search = val.trim();
    loadMaterials();
  };

  // =========================================================================
  // ImgBB Links Modal
  // =========================================================================
  window.openImgbbLinksModal = function (itemId) {
    const item = materialsState.items.find(x => x.id === itemId);
    if (!item) return;

    materialsState.activeItem = item;
    const modal = document.getElementById("imgbb-links-modal");
    if (!modal) return;

    const links = item.links || {};
    const isVideo = item.media_type === "video";
    const hasGdrive = item.google_drive_id && !item.google_drive_id.startsWith("local-");

    const titleEl = document.getElementById("imgbb-modal-title");
    if (titleEl) {
      titleEl.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2.5"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
        <span>Коды и ссылки: ${escapeHtml(item.title)}</span>
      `;
    }

    const previewEl = document.getElementById("imgbb-modal-preview");
    if (previewEl) {
      previewEl.innerHTML = `
        <div class="imgbb-preview-card">
          <img src="${escapeHtml(links.preview_url)}" class="imgbb-preview-thumb" alt="${escapeHtml(item.title)}">
          <div class="imgbb-preview-meta">
            <h4>${escapeHtml(item.title)}</h4>
            <p>Альбом: <strong>${escapeHtml(item.folder_name || 'Общие')}</strong> | Размер: <strong>${isVideo ? 'HD' : formatBytes(item.file_size)}</strong></p>
            ${isVideo ? `<p style="color: #ef4444; font-weight: 800;">YouTube видео</p>` : (hasGdrive ? `<p style="color: var(--teal); font-weight: 800;">✓ Синхронизировано на Google Диске</p>` : `<p style="color: var(--amber); font-weight: 800;">⏳ Ожидает облачной синхронизации Google Диска...</p>`)}
          </div>
        </div>
      `;
    }

    const rowsEl = document.getElementById("imgbb-modal-rows");
    if (rowsEl) {
      rowsEl.innerHTML = `
        ${!isVideo ? `
          <!-- 1. Google Drive Share Link -->
          <div class="imgbb-copy-row">
            <div class="imgbb-copy-header">
              <span class="imgbb-copy-title">Ссылка на Google Диск (Просмотр)</span>
              <span class="imgbb-copy-desc">${hasGdrive ? 'Открывается на Google Диске' : 'Будет доступна после синхронизации'}</span>
            </div>
            <div class="imgbb-input-group">
              <input type="text" readonly class="form-control" value="${escapeHtml(links.google_drive_link || '')}" placeholder="Синхронизируется..." id="inp-gdrive">
              <button type="button" class="btn btn-primary imgbb-copy-action-btn" ${!hasGdrive ? 'disabled' : ''} onclick="window.copyMaterialCode(document.getElementById('inp-gdrive').value, this)">Скопировать</button>
            </div>
          </div>

          <!-- 2. Google Direct URL -->
          <div class="imgbb-copy-row">
            <div class="imgbb-copy-header">
              <span class="imgbb-copy-title">Прямая ссылка Google Диск (CDN)</span>
              <span class="imgbb-copy-desc">Для сайтов и вставки в документы</span>
            </div>
            <div class="imgbb-input-group">
              <input type="text" readonly class="form-control" value="${escapeHtml(links.google_drive_direct || '')}" placeholder="Синхронизируется..." id="inp-gdrive-direct">
              <button type="button" class="btn btn-primary imgbb-copy-action-btn" ${!hasGdrive ? 'disabled' : ''} onclick="window.copyMaterialCode(document.getElementById('inp-gdrive-direct').value, this)">Скопировать</button>
            </div>
          </div>
        ` : `
          <!-- YouTube Watch Link -->
          <div class="imgbb-copy-row">
            <div class="imgbb-copy-header">
              <span class="imgbb-copy-title">Ссылка на YouTube видео</span>
              <span class="imgbb-copy-desc">Для просмотра в браузере</span>
            </div>
            <div class="imgbb-input-group">
              <input type="text" readonly class="form-control" value="${escapeHtml(links.watch_link || '')}" id="inp-yt">
              <button type="button" class="btn btn-primary imgbb-copy-action-btn" onclick="window.copyMaterialCode(document.getElementById('inp-yt').value, this)">Скопировать</button>
            </div>
          </div>
        `}

        <!-- 3. Local direct URL -->
        <div class="imgbb-copy-row">
          <div class="imgbb-copy-header">
            <span class="imgbb-copy-title">Прямая ссылка сервера (Локальная)</span>
            <span class="imgbb-copy-desc">Для тестов и учеников в школьной сети</span>
          </div>
          <div class="imgbb-input-group">
            <input type="text" readonly class="form-control" value="${escapeHtml(links.local_direct_link || '')}" id="inp-local">
            <button type="button" class="btn btn-secondary imgbb-copy-action-btn" onclick="window.copyMaterialCode(document.getElementById('inp-local').value, this)">Скопировать</button>
          </div>
        </div>

        <!-- 4. HTML Code -->
        <div class="imgbb-copy-row">
          <div class="imgbb-copy-header">
            <span class="imgbb-copy-title">HTML код для вставки</span>
            <span class="imgbb-copy-desc">&lt;img&gt; или &lt;iframe&gt;</span>
          </div>
          <div class="imgbb-input-group">
            <input type="text" readonly class="form-control" value="${escapeHtml(links.html_code || '')}" id="inp-html">
            <button type="button" class="btn btn-secondary imgbb-copy-action-btn" onclick="window.copyMaterialCode(document.getElementById('inp-html').value, this)">Скопировать</button>
          </div>
        </div>

        <!-- 5. Markdown Code -->
        <div class="imgbb-copy-row">
          <div class="imgbb-copy-header">
            <span class="imgbb-copy-title">Markdown код</span>
            <span class="imgbb-copy-desc">Для генератора тестов и заметок</span>
          </div>
          <div class="imgbb-input-group">
            <input type="text" readonly class="form-control" value="${escapeHtml(links.markdown_code || '')}" id="inp-md">
            <button type="button" class="btn btn-secondary imgbb-copy-action-btn" onclick="window.copyMaterialCode(document.getElementById('inp-md').value, this)">Скопировать</button>
          </div>
        </div>

        <!-- 6. BBCode -->
        <div class="imgbb-copy-row">
          <div class="imgbb-copy-header">
            <span class="imgbb-copy-title">BBCode</span>
            <span class="imgbb-copy-desc">[img] или [video]</span>
          </div>
          <div class="imgbb-input-group">
            <input type="text" readonly class="form-control" value="${escapeHtml(links.bbcode || '')}" id="inp-bb">
            <button type="button" class="btn btn-secondary imgbb-copy-action-btn" onclick="window.copyMaterialCode(document.getElementById('inp-bb').value, this)">Скопировать</button>
          </div>
        </div>
      `;
    }

    modal.classList.add("open");
  };

  window.closeImgbbLinksModal = function () {
    const modal = document.getElementById("imgbb-links-modal");
    if (modal) modal.classList.remove("open");
  };

  // =========================================================================
  // Upload Modal (Drag and Drop, Multiple Files)
  // =========================================================================
  let selectedFilesQueue = [];

  window.openUploadModal = function () {
    const modal = document.getElementById("materials-upload-modal");
    if (!modal) return;

    // populate album selector
    const sel = document.getElementById("upload-album-select");
    if (sel) {
      sel.innerHTML = materialsState.folders.map(f => `
        <option value="${escapeHtml(f.name)}" ${materialsState.folder === f.name ? 'selected' : ''}>
          📁 ${escapeHtml(f.name)}
        </option>
      `).join("");
    }

    selectedFilesQueue = [];
    renderUploadQueue();
    modal.classList.add("open");
  };

  window.closeUploadModal = function () {
    const modal = document.getElementById("materials-upload-modal");
    if (modal) modal.classList.remove("open");
  };

  window.handleFilesChosen = function (files) {
    if (!files || files.length === 0) return;
    for (let i = 0; i < files.length; i++) {
      selectedFilesQueue.push(files[i]);
    }
    renderUploadQueue();
  };

  function renderUploadQueue() {
    const queueEl = document.getElementById("upload-files-queue");
    const submitBtn = document.getElementById("upload-submit-btn");
    if (!queueEl) return;

    if (selectedFilesQueue.length === 0) {
      queueEl.innerHTML = "";
      if (submitBtn) submitBtn.disabled = true;
      return;
    }

    if (submitBtn) submitBtn.disabled = false;

    queueEl.innerHTML = `
      <div style="font-size: 0.82rem; font-weight: 800; color: var(--text); margin-bottom: 8px;">
        Выбрано файлов: ${selectedFilesQueue.length}
      </div>
      <div style="display: flex; flex-direction: column; gap: 6px; max-height: 160px; overflow-y: auto;">
        ${selectedFilesQueue.map((f, idx) => `
          <div style="display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; background: var(--surface); box-shadow: var(--shadow-in); border-radius: 12px; font-size: 0.82rem;">
            <span style="font-weight: 700; color: var(--text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 75%;">${escapeHtml(f.name)}</span>
            <div style="display: flex; align-items: center; gap: 10px;">
              <span style="color: var(--muted); font-weight: 700;">${formatBytes(f.size)}</span>
              <button type="button" style="border:none; background:transparent; color:#ef4444; font-weight:800; cursor:pointer;" onclick="window.removeQueuedFile(${idx})">✕</button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  window.removeQueuedFile = function (idx) {
    selectedFilesQueue.splice(idx, 1);
    renderUploadQueue();
  };

  window.submitUploadQueue = async function () {
    if (selectedFilesQueue.length === 0) return;

    const sel = document.getElementById("upload-album-select");
    const folder = sel ? sel.value : "Общие";
    const submitBtn = document.getElementById("upload-submit-btn");
    const progressEl = document.getElementById("upload-progress-status");

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Сохранение на Google Диск...";
    }
    if (progressEl) {
      progressEl.textContent = `Загружаем ${selectedFilesQueue.length} файлов...`;
    }

    try {
      const formData = new FormData();
      formData.append("folder", folder);
      selectedFilesQueue.forEach(f => {
        formData.append("files", f);
      });

      const res = await fetch("/api/materials/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Ошибка загрузки файлов");
      }

      const data = await res.json();
      window.closeUploadModal();
      await loadMaterials();

      // If one file uploaded, open links modal immediately!
      if (data.created && data.created.length === 1) {
        window.openImgbbLinksModal(data.created[0].id);
      }
    } catch (e) {
      alert("Ошибка загрузки: " + e.message);
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = "Загрузить на Google Диск";
      }
      if (progressEl) progressEl.textContent = "";
    }
  };

  // =========================================================================
  // Add by URL / YouTube Modal
  // =========================================================================
  window.openAddUrlModal = function () {
    const modal = document.getElementById("materials-add-url-modal");
    if (!modal) return;

    // populate album selector
    const sel = document.getElementById("add-url-album-select");
    if (sel) {
      sel.innerHTML = materialsState.folders.map(f => `
        <option value="${escapeHtml(f.name)}" ${materialsState.folder === f.name ? 'selected' : ''}>
          📁 ${escapeHtml(f.name)}
        </option>
      `).join("");
    }

    document.getElementById("add-url-input").value = "";
    document.getElementById("add-url-title-input").value = "";
    document.getElementById("add-url-preview-box").style.display = "none";
    modal.classList.add("open");
  };

  window.closeAddUrlModal = function () {
    const modal = document.getElementById("materials-add-url-modal");
    if (modal) modal.classList.remove("open");
  };

  window.handleUrlInputPreview = function (val) {
    const pBox = document.getElementById("add-url-preview-box");
    const pImg = document.getElementById("add-url-preview-img");
    const pTitle = document.getElementById("add-url-preview-type");
    if (!pBox || !pImg) return;

    val = val.trim();
    if (!val) {
      pBox.style.display = "none";
      return;
    }

    // Check YouTube
    const ytMatch = val.match(/(?:v=|\/v\/|youtu\.be\/|\/embed\/|\/shorts\/)([a-zA-Z0-9_-]{11})/);
    if (ytMatch) {
      const yid = ytMatch[1];
      pImg.src = `https://img.youtube.com/vi/${yid}/hqdefault.jpg`;
      pTitle.textContent = "YouTube Видео";
      pBox.style.display = "flex";
      return;
    }

    // Check Image URL
    if (val.startsWith("http://") || val.startsWith("https://")) {
      pImg.src = val;
      pTitle.textContent = "Изображение (скачивается на Google Диск)";
      pBox.style.display = "flex";
      return;
    }

    pBox.style.display = "none";
  };

  window.submitAddUrl = async function () {
    const url = document.getElementById("add-url-input").value.trim();
    const title = document.getElementById("add-url-title-input").value.trim();
    const folder = document.getElementById("add-url-album-select").value || "Общие";
    const btn = document.getElementById("add-url-submit-btn");

    if (!url) {
      alert("Введите ссылку на изображение или YouTube видео");
      return;
    }

    btn.disabled = true;
    btn.textContent = "Сохранение на Google Диск...";

    try {
      const isYoutube = url.includes("youtu.be") || url.includes("youtube.com");
      const endpoint = isYoutube ? "/api/materials/add-video" : "/api/materials/add-image-url";

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, title, folder }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Ошибка добавления материала");
      }

      const data = await res.json();
      window.closeAddUrlModal();
      await loadMaterials();

      if (data.created) {
        window.openImgbbLinksModal(data.created.id);
      }
    } catch (e) {
      alert("Ошибка: " + e.message);
    } finally {
      btn.disabled = false;
      btn.textContent = "Добавить материал";
    }
  };

  // =========================================================================
  // Albums Management
  // =========================================================================
  window.openCreateAlbumModal = function () {
    const name = window.prompt("Введите название нового альбома (папки):", "Информатика");
    if (!name || !name.trim()) return;

    fetch("/api/materials/folders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() })
    }).then(async res => {
      if (!res.ok) {
        const err = await res.json();
        alert(err.detail || "Не удалось создать альбом");
        return;
      }
      const data = await res.json();
      materialsState.folder = data.folder;
      await loadMaterials();
    }).catch(e => alert("Ошибка: " + e.message));
  };

  window.deleteMaterialFolder = function (folderName) {
    if (!confirm(`Удалить альбом "${folderName}"? Файлы из него будут перемещены в альбом "Общие".`)) return;

    fetch(`/api/materials/folders/${encodeURIComponent(folderName)}`, {
      method: "DELETE"
    }).then(async res => {
      if (!res.ok) {
        const err = await res.json();
        alert(err.detail || "Не удалось удалить альбом");
        return;
      }
      materialsState.folder = "";
      await loadMaterials();
    }).catch(e => alert("Ошибка: " + e.message));
  };

  // Delete item
  window.deleteMaterialItem = function (itemId) {
    if (!confirm("Удалить этот файл с Google Диска и из материалов?")) return;

    fetch(`/api/materials/${itemId}`, {
      method: "DELETE"
    }).then(async res => {
      if (!res.ok) throw new Error("Не удалось удалить элемент");
      await loadMaterials();
    }).catch(e => alert("Ошибка удаления: " + e.message));
  };

  // Sync Google Drive IDs
  window.syncGoogleDriveLinks = function () {
    const btn = document.getElementById("materials-sync-btn");
    const origHtml = btn ? btn.innerHTML : "";
    if (btn) btn.innerHTML = "<span>⏳ Проверка...</span>";

    fetch("/api/materials/sync-drive", {
      method: "POST"
    }).then(async res => {
      const data = await res.json();
      alert(`Синхронизация Google Диска завершена. Обновлено ссылок: ${data.updated_count || 0}`);
      await loadMaterials();
    }).catch(e => alert("Ошибка синхронизации: " + e.message))
    .finally(() => {
      if (btn) btn.innerHTML = origHtml;
    });
  };

  // Lightbox / Video Viewer
  window.openMaterialViewer = function (itemId) {
    const item = materialsState.items.find(x => x.id === itemId);
    if (!item) return;

    const modal = document.getElementById("materials-viewer-modal");
    const content = document.getElementById("materials-viewer-content");
    const title = document.getElementById("materials-viewer-title");
    if (!modal || !content) return;

    if (title) title.textContent = item.title;

    if (item.media_type === "video" && item.youtube_id) {
      content.innerHTML = `
        <div style="position: relative; width: 100%; padding-bottom: 56.25%; height: 0; border-radius: 16px; overflow: hidden; box-shadow: var(--shadow-soft);">
          <iframe style="position: absolute; top:0; left:0; width:100%; height:100%; border:0;"
                  src="https://www.youtube.com/embed/${item.youtube_id}?autoplay=1"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowfullscreen>
          </iframe>
        </div>
      `;
    } else {
      const url = item.links ? (item.links.google_drive_direct || item.links.local_direct_link || item.links.preview_url) : "";
      content.innerHTML = `
        <div style="text-align: center; width: 100%;">
          <img src="${escapeHtml(url)}" style="max-width: 100%; max-height: 72vh; border-radius: 16px; box-shadow: var(--shadow-soft);" alt="${escapeHtml(item.title)}">
        </div>
      `;
    }

    modal.classList.add("open");
  };

  window.closeMaterialViewer = function () {
    const modal = document.getElementById("materials-viewer-modal");
    const content = document.getElementById("materials-viewer-content");
    if (modal) modal.classList.remove("open");
    if (content) content.innerHTML = "";
  };

  // Clipboard Paste (Ctrl+V) handler for instant upload
  function setupGlobalPasteListener() {
    window.addEventListener("paste", (e) => {
      // Only active if on #materials section
      if (window.location.hash !== "#materials") return;
      // Do not trigger if typing in an input
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;

      const items = e.clipboardData?.items;
      if (!items) return;

      const files = [];
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          const blob = items[i].getAsFile();
          if (blob) files.push(blob);
        }
      }

      if (files.length > 0) {
        window.openUploadModal();
        window.handleFilesChosen(files);
      }
    });
  }

  // Escape key to close modals
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      window.closeImgbbLinksModal();
      window.closeUploadModal();
      window.closeAddUrlModal();
      window.closeMaterialViewer();
    }
  });

})();
