/**
 * Materials Manager (ImgBB-style Media Hosting & Google Drive Cloud Storage)
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
      // Fallback prompt
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
    } catch (e) {
      console.error("Error loading materials:", e);
      grid.innerHTML = `
        <div class="materials-empty-state">
          <div class="materials-empty-icon">⚠️</div>
          <div class="materials-empty-title">Ошибка загрузки материалов</div>
          <p>${escapeHtml(e.message)}</p>
          <button class="button button-primary" onclick="window.initMaterialsManager()">Повторить попытку</button>
        </div>
      `;
    }
  }

  // Render Full UI
  function renderMaterialsUI() {
    renderStats();
    renderAlbums();
    renderCards();
  }

  // 1. Render Stats Ribbon
  function renderStats() {
    const statsContainer = document.getElementById("materials-stats");
    if (!statsContainer) return;

    const s = materialsState.stats;
    statsContainer.innerHTML = `
      <div class="materials-stat-card">
        <span class="materials-stat-label">Всего файлов</span>
        <span class="materials-stat-val">${s.total_count || 0}</span>
      </div>
      <div class="materials-stat-card">
        <span class="materials-stat-label">Изображения</span>
        <span class="materials-stat-val">${s.images_count || 0}</span>
      </div>
      <div class="materials-stat-card">
        <span class="materials-stat-label">YouTube видео</span>
        <span class="materials-stat-val">${s.videos_count || 0}</span>
      </div>
      <div class="materials-stat-card">
        <span class="materials-stat-label">Альбомы</span>
        <span class="materials-stat-val">${s.folders_count || 1}</span>
      </div>
      <div class="materials-stat-card">
        <span class="materials-stat-label">Google Диск</span>
        <span class="materials-stat-val" style="font-size: 1.1rem; color: #10b981;">${formatBytes(s.total_size || 0)}</span>
      </div>
    `;
  }

  // 2. Render Album Navigation Pills
  function renderAlbums() {
    const container = document.getElementById("materials-albums");
    if (!container) return;

    const allActive = materialsState.folder === "";
    const totalCount = materialsState.stats.total_count || 0;

    let html = `
      <div class="materials-album-pill ${allActive ? 'active' : ''}" onclick="window.selectMaterialFolder('')">
        <span>📁 Все материалы</span>
        <span class="materials-album-count">${totalCount}</span>
      </div>
    `;

    materialsState.folders.forEach(f => {
      const isActive = materialsState.folder === f.name;
      // count items in this folder
      const count = materialsState.items.filter(it => it.folder_name === f.name).length;
      html += `
        <div class="materials-album-pill ${isActive ? 'active' : ''}" onclick="window.selectMaterialFolder('${escapeHtml(f.name)}')">
          <span>📁 ${escapeHtml(f.name)}</span>
          <span class="materials-album-count">${count}</span>
          ${f.name !== 'Общие' ? `
            <span class="materials-album-delete-btn" title="Удалить альбом" onclick="event.stopPropagation(); window.deleteMaterialFolder('${escapeHtml(f.name)}')">✕</span>
          ` : ''}
        </div>
      `;
    });

    html += `
      <button type="button" class="materials-album-add-btn" onclick="window.openCreateAlbumModal()">
        + Новый альбом
      </button>
    `;

    container.innerHTML = html;
  }

  // 3. Render Cards Grid (ImgBB style)
  function renderCards() {
    const grid = document.getElementById("materials-grid");
    if (!grid) return;

    if (materialsState.items.length === 0) {
      grid.innerHTML = `
        <div class="materials-empty-state">
          <div class="materials-empty-icon">📁</div>
          <div class="materials-empty-title">Здесь пока нет файлов</div>
          <p>Загрузите изображения со своего устройства, вставьте ссылку на картинку или добавьте YouTube видео.</p>
          <div style="display: flex; gap: 0.75rem; justify-content: center; margin-top: 1.25rem;">
            <button class="button button-primary" onclick="window.openUploadModal()">+ Загрузить файл</button>
            <button class="button button-ghost" onclick="window.openAddUrlModal()">+ Добавить по ссылке</button>
          </div>
        </div>
      `;
      return;
    }

    grid.innerHTML = materialsState.items.map(it => {
      const links = it.links || {};
      const isVideo = it.media_type === "video";
      const sizeStr = isVideo ? "YouTube HD" : formatBytes(it.file_size);
      const gidBadge = it.google_drive_id ? `<span title="Синхронизировано с Google Диском" style="color: #10b981; font-weight: 800;">✓ Google Диск</span>` : `<span title="Синхронизируется..." style="color: #f59e0b;">⏳ Google Диск</span>`;

      return `
        <div class="materials-card" data-item-id="${it.id}">
          <div class="materials-thumb-wrap" onclick="window.openMaterialViewer('${it.id}')">
            <span class="materials-card-badge-type ${isVideo ? 'badge-video' : 'badge-image'}">
              ${isVideo ? '▶ ВИДЕО' : '🖼 ФОТО'}
            </span>
            <img src="${escapeHtml(links.preview_url)}" class="materials-thumb-img" alt="${escapeHtml(it.title)}" loading="lazy">
            ${isVideo ? '<div class="materials-video-overlay">▶</div>' : ''}
          </div>

          <div class="materials-card-content">
            <div class="materials-card-title" title="${escapeHtml(it.title)}" onclick="window.openMaterialViewer('${it.id}')">
              ${escapeHtml(it.title)}
            </div>

            <div class="materials-card-meta">
              <span class="materials-card-folder">📁 ${escapeHtml(it.folder_name || 'Общие')}</span>
              <span>${sizeStr}</span>
            </div>

            <div style="font-size: 0.74rem; margin-bottom: 0.5rem; display: flex; align-items: center; justify-content: space-between;">
              ${gidBadge}
              <span style="color: var(--text-muted);">${(it.created_at || '').slice(0, 10)}</span>
            </div>

            <div class="materials-card-actions">
              <button type="button" class="materials-btn-links" onclick="window.openImgbbLinksModal('${it.id}')">
                <span>🔗</span> <span>Ссылки (ImgBB)</span>
              </button>

              <button type="button" class="materials-btn-icon" title="Скопировать прямую ссылку" onclick="window.copyMaterialCode('${escapeHtml(links.site_direct_link || links.google_drive_link || '')}', this)">
                📋
              </button>

              <button type="button" class="materials-btn-icon materials-btn-danger" title="Удалить файл" onclick="window.deleteMaterialItem('${it.id}')">
                🗑
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
    document.querySelectorAll(".materials-filter-btn").forEach(b => {
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

    const titleEl = document.getElementById("imgbb-modal-title");
    if (titleEl) titleEl.textContent = `Коды и ссылки: ${item.title}`;

    const previewEl = document.getElementById("imgbb-modal-preview");
    if (previewEl) {
      previewEl.innerHTML = `
        <div class="imgbb-preview-row">
          <img src="${escapeHtml(links.preview_url)}" class="imgbb-preview-thumb" alt="${escapeHtml(item.title)}">
          <div class="imgbb-preview-info">
            <h4>${escapeHtml(item.title)}</h4>
            <p><strong>Альбом:</strong> ${escapeHtml(item.folder_name || 'Общие')}</p>
            <p><strong>Тип:</strong> ${isVideo ? 'YouTube Видео' : 'Изображение'} | <strong>Размер:</strong> ${isVideo ? 'HD' : formatBytes(item.file_size)}</p>
            ${item.google_drive_id ? `<p style="color: #10b981; font-weight: 700;">✓ Синхронизировано на вашем Google Диске</p>` : `<p style="color: #f59e0b;">⏳ Google Диск (файл в локальной папке, ожидает синхронизации)</p>`}
          </div>
        </div>
      `;
    }

    const rowsEl = document.getElementById("imgbb-modal-rows");
    if (rowsEl) {
      rowsEl.innerHTML = `
        <!-- 1. Ссылка на Google Диск -->
        <div class="imgbb-copy-group">
          <div class="imgbb-copy-label">
            <span>🔹 Ссылка на Google Диск (Share Link):</span>
            <span style="font-size: 0.74rem; color: #10b981; font-weight: 600;">Открывается на Google Диске</span>
          </div>
          <div class="imgbb-copy-input-wrap">
            <input type="text" readonly class="imgbb-copy-input" value="${escapeHtml(links.google_drive_link || links.site_direct_link)}" id="copy-inp-gdrive">
            <button type="button" class="imgbb-copy-btn" onclick="window.copyMaterialCode(document.getElementById('copy-inp-gdrive').value, this)">Скопировать</button>
          </div>
        </div>

        <!-- 2. Прямая ссылка на сайт / CDN -->
        <div class="imgbb-copy-group">
          <div class="imgbb-copy-label">
            <span>🌐 Прямая ссылка (Direct URL):</span>
            <span style="font-size: 0.74rem; color: var(--text-muted);">Для сайтов и браузера</span>
          </div>
          <div class="imgbb-copy-input-wrap">
            <input type="text" readonly class="imgbb-copy-input" value="${escapeHtml(links.site_direct_link || links.preview_url)}" id="copy-inp-direct">
            <button type="button" class="imgbb-copy-btn" onclick="window.copyMaterialCode(document.getElementById('copy-inp-direct').value, this)">Скопировать</button>
          </div>
        </div>

        <!-- 3. HTML код для вставки -->
        <div class="imgbb-copy-group">
          <div class="imgbb-copy-label">
            <span>💻 HTML код (Встраивание &lt;img&gt; / &lt;iframe&gt;):</span>
            <span style="font-size: 0.74rem; color: var(--text-muted);">Для уроков и страниц сайта</span>
          </div>
          <div class="imgbb-copy-input-wrap">
            <input type="text" readonly class="imgbb-copy-input" value="${escapeHtml(links.html_code)}" id="copy-inp-html">
            <button type="button" class="imgbb-copy-btn" onclick="window.copyMaterialCode(document.getElementById('copy-inp-html').value, this)">Скопировать</button>
          </div>
        </div>

        <!-- 4. Markdown код -->
        <div class="imgbb-copy-group">
          <div class="imgbb-copy-label">
            <span>📝 Markdown (для тестов, конспектов и GitHub):</span>
          </div>
          <div class="imgbb-copy-input-wrap">
            <input type="text" readonly class="imgbb-copy-input" value="${escapeHtml(links.markdown_code)}" id="copy-inp-md">
            <button type="button" class="imgbb-copy-btn" onclick="window.copyMaterialCode(document.getElementById('copy-inp-md').value, this)">Скопировать</button>
          </div>
        </div>

        <!-- 5. BBCode -->
        <div class="imgbb-copy-group">
          <div class="imgbb-copy-label">
            <span>💬 BBCode (для форумов):</span>
          </div>
          <div class="imgbb-copy-input-wrap">
            <input type="text" readonly class="imgbb-copy-input" value="${escapeHtml(links.bbcode)}" id="copy-inp-bb">
            <button type="button" class="imgbb-copy-btn" onclick="window.copyMaterialCode(document.getElementById('copy-inp-bb').value, this)">Скопировать</button>
          </div>
        </div>
      `;
    }

    modal.classList.add("is-open");
  };

  window.closeImgbbLinksModal = function () {
    const modal = document.getElementById("imgbb-links-modal");
    if (modal) modal.classList.remove("is-open");
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
    modal.classList.add("is-open");
  };

  window.closeUploadModal = function () {
    const modal = document.getElementById("materials-upload-modal");
    if (modal) modal.classList.remove("is-open");
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
      <div style="font-size: 0.84rem; font-weight: 700; color: var(--text-muted); margin-bottom: 0.5rem;">
        Выбрано файлов: ${selectedFilesQueue.length}
      </div>
      <div style="display: flex; flex-direction: column; gap: 0.35rem; max-height: 180px; overflow-y: auto;">
        ${selectedFilesQueue.map((f, idx) => `
          <div style="display: flex; align-items: center; justify-content: space-between; padding: 6px 12px; background: var(--bg-muted, #f8fafc); border-radius: 8px; font-size: 0.82rem;">
            <span style="font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 75%;">${escapeHtml(f.name)}</span>
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <span style="color: var(--text-muted);">${formatBytes(f.size)}</span>
              <button type="button" style="border:none; background:transparent; color:#ef4444; cursor:pointer;" onclick="window.removeQueuedFile(${idx})">✕</button>
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
      submitBtn.textContent = "Загрузка в Google Диск...";
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
        submitBtn.textContent = "Загрузить";
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
    modal.classList.add("is-open");
  };

  window.closeAddUrlModal = function () {
    const modal = document.getElementById("materials-add-url-modal");
    if (modal) modal.classList.remove("is-open");
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
      pTitle.textContent = "Изображение по ссылке (будет скачано на Google Диск)";
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
    btn.textContent = "Сохранение...";

    try {
      const isYoutube = url.includes("youtu.be") || url.includes("youtube.com");
      const endpoint = isYoutube ? "/api/materials/add-video" : "/api/materials/add-image-url";

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: json_stringify({ url, title, folder }),
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

  function json_stringify(obj) {
    return JSON.stringify(obj);
  }

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
    if (btn) btn.innerHTML = "⏳ Синхронизация...";

    fetch("/api/materials/sync-drive", {
      method: "POST"
    }).then(async res => {
      const data = await res.json();
      alert(`Синхронизация Google Диска завершена. Обновлено ссылок: ${data.updated_count || 0}`);
      await loadMaterials();
    }).catch(e => alert("Ошибка синхронизации: " + e.message))
    .finally(() => {
      if (btn) btn.innerHTML = "🔄 Обновить Google ссылки";
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
        <div style="position: relative; width: 100%; padding-bottom: 56.25%; height: 0; border-radius: 14px; overflow: hidden;">
          <iframe style="position: absolute; top:0; left:0; width:100%; height:100%; border:0;"
                  src="https://www.youtube.com/embed/${item.youtube_id}?autoplay=1"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowfullscreen>
          </iframe>
        </div>
      `;
    } else {
      const url = item.links ? (item.links.local_direct_link || item.links.preview_url) : "";
      content.innerHTML = `
        <div style="text-align: center;">
          <img src="${escapeHtml(url)}" style="max-width: 100%; max-height: 72vh; border-radius: 12px; box-shadow: 0 8px 30px rgba(0,0,0,0.25);" alt="${escapeHtml(item.title)}">
        </div>
      `;
    }

    modal.classList.add("is-open");
  };

  window.closeMaterialViewer = function () {
    const modal = document.getElementById("materials-viewer-modal");
    const content = document.getElementById("materials-viewer-content");
    if (modal) modal.classList.remove("is-open");
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
