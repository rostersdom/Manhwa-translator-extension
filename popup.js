document.addEventListener('DOMContentLoaded', () => {
  // ==================== Elements ====================
  const tabs = document.querySelectorAll('.tab');
  const tabContents = document.querySelectorAll('.tab-content');
  const statusDot = document.getElementById('statusDot');
  const statusText = document.getElementById('statusText');
  const targetLanguage = document.getElementById('targetLanguage');
  const cacheSizeEl = document.getElementById('cacheSize');

  // Toggles
  const toggleHighlight = document.getElementById('toggleHighlight');
  const togglePin = document.getElementById('togglePin');
  const toggleOriginal = document.getElementById('toggleOriginal');
  const togglePinyin = document.getElementById('togglePinyin');
  const toggleRomanization = document.getElementById('toggleRomanization');
  const toggleCache = document.getElementById('toggleCache');

  // Buttons
  const btnToggle = document.getElementById('btnToggle');
  const btnRegion = document.getElementById('btnRegion');
  const btnExport = document.getElementById('btnExport');
  const btnExportHistory = document.getElementById('btnExportHistory');
  const btnClearHistory = document.getElementById('btnClearHistory');

  // History
  const statTotal = document.getElementById('statTotal');
  const statToday = document.getElementById('statToday');
  const statLangs = document.getElementById('statLangs');
  const historyList = document.getElementById('historyList');

  // ==================== Tab Navigation ====================
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tabContents.forEach(tc => tc.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById('tab-' + tab.dataset.tab).classList.add('active');
    });
  });

  // ==================== Load Settings ====================
  chrome.storage.sync.get({
    translationEnabled: true,
    targetLang: 'ru',
    showOriginal: true,
    showRomanization: true,
    showPinyin: true,
    highlightOnHover: true,
    pinOnDoubleClick: true,
    cacheEnabled: true
  }, (s) => {
    updateStatus(s.translationEnabled);
    targetLanguage.value = s.targetLang;
    toggleHighlight.checked = s.highlightOnHover;
    togglePin.checked = s.pinOnDoubleClick;
    toggleOriginal.checked = s.showOriginal;
    togglePinyin.checked = s.showPinyin;
    toggleRomanization.checked = s.showRomanization;
    toggleCache.checked = s.cacheEnabled;
  });

  // ==================== Load History ====================
  loadHistory();

  // ==================== Update Status ====================
  function updateStatus(enabled) {
    if (enabled) {
      statusDot.classList.remove('off');
      statusText.textContent = 'Активен';
      document.getElementById('qaToggleIcon').textContent = '🟢';
    } else {
      statusDot.classList.add('off');
      statusText.textContent = 'Выключен';
      document.getElementById('qaToggleIcon').textContent = '🔴';
    }
  }

  // ==================== Save Settings ====================
  function saveSettings() {
    const s = {
      translationEnabled: !statusDot.classList.contains('off'),
      targetLang: targetLanguage.value,
      highlightOnHover: toggleHighlight.checked,
      pinOnDoubleClick: togglePin.checked,
      showOriginal: toggleOriginal.checked,
      showPinyin: togglePinyin.checked,
      showRomanization: toggleRomanization.checked,
      cacheEnabled: toggleCache.checked
    };
    chrome.storage.sync.set(s, () => {
      notifyContent({ action: 'updateSettings', settings: s });
    });
  }

  function notifyContent(msg) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) chrome.tabs.sendMessage(tabs[0].id, msg).catch(() => {});
    });
  }

  // ==================== Event Listeners ====================
  // Toggles
  [toggleHighlight, togglePin, toggleOriginal, togglePinyin, toggleRomanization, toggleCache].forEach(el => {
    el.addEventListener('change', saveSettings);
  });
  targetLanguage.addEventListener('change', saveSettings);

  // Quick Actions
  btnToggle.addEventListener('click', () => {
    const enabled = statusDot.classList.contains('off');
    updateStatus(enabled);
    saveSettings();
  });

  btnRegion.addEventListener('click', () => {
    notifyContent({ action: 'startRegionSelect' });
    window.close();
  });

  btnExport.addEventListener('click', () => {
    notifyContent({ action: 'exportCurrent' });
  });

  // Action Buttons
  btnExportHistory.addEventListener('click', () => {
    notifyContent({ action: 'exportHistory' });
  });

  btnClearHistory.addEventListener('click', () => {
    if (confirm('Очистить всю историю переводов?')) {
      localStorage.removeItem('mt_h');
      notifyContent({ action: 'clearHistory' });
      loadHistory();
    }
  });

  // ==================== History ====================
  function loadHistory() {
    let history = [];
    try {
      const s = localStorage.getItem('mt_h');
      if (s) history = JSON.parse(s);
    } catch(e) {}

    // Stats
    statTotal.textContent = history.length;

    const today = new Date().toDateString();
    const todayCount = history.filter(h => new Date(h.ts).toDateString() === today).length;
    statToday.textContent = todayCount;

    const langs = new Set(history.map(h => h.l));
    statLangs.textContent = langs.size;

    // Cache size
    try {
      const cache = JSON.parse(localStorage.getItem('mt_c') || '{}');
      cacheSizeEl.textContent = 'Кэш: ' + Object.keys(cache).length;
    } catch(e) {
      cacheSizeEl.textContent = 'Кэш: 0';
    }

    // History list
    if (history.length === 0) {
      historyList.innerHTML = `
        <div class="empty-state">
          <span class="empty-icon">📜</span>
          <span class="empty-text">История пуста</span>
          <span class="empty-hint">Наведите на текст или картинку</span>
        </div>`;
      return;
    }

    const langNames = {ko:'한국어',ja:'日本語',zh:'中文',ru:'Русский',en:'English'};
    historyList.innerHTML = history.slice(0, 50).map(h => `
      <div class="history-item" data-text="${escapeAttr(h.o)}" data-trans="${escapeAttr(h.t)}">
        <div class="history-original">${escapeHtml(h.o)}</div>
        <div class="history-translated">${escapeHtml(h.t)}</div>
        <div class="history-meta">
          <span>${langNames[h.l] || h.l}</span>
          <span>${formatTime(h.ts)}</span>
        </div>
      </div>
    `).join('');

    // Click to copy
    historyList.querySelectorAll('.history-item').forEach(item => {
      item.addEventListener('click', () => {
        const text = item.dataset.text + '\n' + item.dataset.trans;
        navigator.clipboard.writeText(text).catch(() => {});
        item.style.borderColor = 'var(--green)';
        setTimeout(() => { item.style.borderColor = ''; }, 500);
      });
    });
  }

  function formatTime(ts) {
    const d = new Date(ts);
    const now = new Date();
    const diff = now - d;
    if (diff < 60000) return 'только что';
    if (diff < 3600000) return Math.floor(diff/60000) + ' мин назад';
    if (diff < 86400000) return Math.floor(diff/3600000) + ' ч назад';
    return d.toLocaleDateString('ru');
  }

  function escapeHtml(t) {
    const d = document.createElement('div');
    d.textContent = t;
    return d.innerHTML;
  }

  function escapeAttr(t) {
    return t.replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
});
