// 防止 content script 被多次执行（manifest + executeScript 双重注入场景）
if (window.__gsExtInit) { /* already initialized */ } else {
window.__gsExtInit = true;

const isExtensionEnvironment = typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage;

// ─── 数据 ────────────────────────────────────────────────
const defaultJumpData = [
  { key: ['bd', 'baidu'], label: 'BaiDu百度',   jumpUrl: 'https://www.baidu.com/s?tn=22073068_8_oem_dg&ch=2&ie=utf-8&word=&<query>' },
  { key: ['gg', 'google'], label: 'Google谷歌', jumpUrl: 'https://www.google.com/search?q=&<query>' },
  { key: ['bi', 'bing'],   label: 'Bing必应',   jumpUrl: 'https://www.bing.com/search?form=QBLH&q=&<query>&mkt=zh-CN' },
];

let jumpData     = defaultJumpData;
let jumpToData   = new Map();
let defaultKey   = 'bd';

// ─── 存储 ────────────────────────────────────────────────
const storage = {
  async set(key, value) {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage?.local) {
        await chrome.storage.local.set({ [key]: value });
      } else {
        localStorage.setItem(key, JSON.stringify(value));
      }
    } catch (e) { console.error('Storage set error:', e); }
  },
  async get(key) {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage?.local) {
        const r = await chrome.storage.local.get(key);
        return r[key];
      } else {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
      }
    } catch (e) { console.error('Storage get error:', e); return null; }
  },
};

// ─── 工具 ────────────────────────────────────────────────
function getFavicon(url) {
  try { return new URL(url).origin + '/favicon.ico'; } catch { return ''; }
}

function segmentationContent(medium, content) {
  const [first, ...rest] = content.split(medium);
  return [first, rest.join(' ')];
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// 从输入值中解析搜索引擎和查询词
function parseInputQuery(value) {
  if (value.startsWith('/')) return { engineKey: defaultKey, query: value.slice(1) };
  for (const [key] of jumpToData) {
    if (value.startsWith(key + ' ') && value.length > key.length + 1) {
      return { engineKey: key, query: value.slice(key.length + 1).trim() };
    }
  }
  return { engineKey: defaultKey, query: value };
}

// ─── 样式注入 ─────────────────────────────────────────────
function injectStyles() {
  const style = document.createElement('style');
  style.textContent = `
/* ── 覆盖层 ── */
#gs-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0);
  backdrop-filter: blur(0px);
  -webkit-backdrop-filter: blur(0px);
  display: none;
  justify-content: center;
  align-items: flex-start;
  padding-top: 14vh;
  z-index: 2147483647;
  transition: background 0.22s ease, backdrop-filter 0.22s ease;
  cursor: pointer;
}
#gs-overlay.show {
  background: rgba(0,0,0,0.28);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
}

/* ── 卡片 ── */
#gs-box {
  position: relative;
  width: 90%;
  max-width: 580px;
  background: rgba(255,255,255,0.98);
  border-radius: 18px;
  box-shadow: 0 24px 64px rgba(0,0,0,0.14), 0 4px 16px rgba(0,0,0,0.08);
  border: 1px solid rgba(0,0,0,0.06);
  overflow: hidden;
  opacity: 0;
  transform: scale(0.95) translateY(-10px);
  transition: opacity 0.22s cubic-bezier(.4,0,.2,1), transform 0.22s cubic-bezier(.4,0,.2,1);
  cursor: default;
}
#gs-box.show {
  opacity: 1;
  transform: scale(1) translateY(0);
}

/* ── 输入行 ── */
#gs-input-row {
  display: flex;
  align-items: center;
  padding: 10px 14px;
  gap: 8px;
  min-height: 56px;
}

/* ── 引擎图标按钮 ── */
#gs-engine-btn {
  flex-shrink: 0;
  width: 30px;
  height: 30px;
  border-radius: 8px;
  border: none;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 3px;
  transition: background 0.12s;
  opacity: 0.82;
}
#gs-engine-btn:hover { background: rgba(0,0,0,0.06); opacity: 1; }
#gs-engine-btn img { width: 22px; height: 22px; border-radius: 4px; object-fit: contain; display: block; }
#gs-engine-btn .gs-fallback {
  font-size: 10px; font-weight: 700; color: #6b7280;
  width: 22px; height: 22px; display: flex; align-items: center; justify-content: center;
  background: rgba(0,0,0,0.06); border-radius: 4px;
}

/* ── 搜索输入框 ── */
#gs-input {
  flex: 1;
  border: none;
  background: transparent;
  outline: none;
  font-size: 16px;
  color: #111827;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  padding: 4px 0;
  caret-color: #3b82f6;
}
#gs-input::placeholder { color: #9ca3af; }

/* ── Esc 提示 ── */
#gs-esc-hint {
  flex-shrink: 0;
  font-size: 10px;
  color: #9ca3af;
  background: rgba(0,0,0,0.05);
  padding: 3px 7px;
  border-radius: 5px;
  font-family: monospace;
  letter-spacing: 0.04em;
  user-select: none;
}

/* ── 分隔线 ── */
.gs-divider {
  height: 1px;
  background: rgba(0,0,0,0.07);
}

/* ── 下拉区域 ── */
#gs-dropdown {
  max-height: 300px;
  overflow-y: auto;
  padding: 6px;
  scrollbar-width: thin;
  scrollbar-color: rgba(0,0,0,0.12) transparent;
}
#gs-dropdown::-webkit-scrollbar { width: 4px; }
#gs-dropdown::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.12); border-radius: 2px; }

/* ── 引擎列表项 ── */
.gs-engine-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.1s;
}
.gs-engine-item:hover, .gs-engine-item.active { background: rgba(59,130,246,0.08); }
.gs-engine-item img { width: 16px; height: 16px; border-radius: 3px; object-fit: contain; flex-shrink: 0; }
.gs-engine-name { flex: 1; font-size: 13px; font-weight: 500; color: #1f2937; }
.gs-engine-key {
  font-size: 11px; color: #9ca3af; font-family: monospace;
  background: rgba(0,0,0,0.05); padding: 2px 8px; border-radius: 5px;
}
.gs-engine-check { font-size: 13px; color: #3b82f6; flex-shrink: 0; }

/* ── 收藏夹列表项 ── */
.gs-bm-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.1s;
}
.gs-bm-item:hover, .gs-bm-item.selected { background: rgba(59,130,246,0.08); }
.gs-bm-item img { width: 16px; height: 16px; border-radius: 3px; object-fit: contain; flex-shrink: 0; }
.gs-bm-info { flex: 1; min-width: 0; }
.gs-bm-title { font-size: 13px; font-weight: 500; color: #1f2937; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.gs-bm-url   { font-size: 11px; color: #9ca3af; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-top: 1px; }
.gs-bm-enter { font-size: 11px; color: #3b82f6; font-weight: 500; flex-shrink: 0; }

/* ── 空/更多 ── */
.gs-empty { text-align: center; color: #9ca3af; font-size: 13px; padding: 16px 0; }
.gs-more  { text-align: center; color: #9ca3af; font-size: 11px; padding: 6px 0;
            border-top: 1px solid rgba(0,0,0,0.06); margin-top: 4px; }

/* ── 搜索建议 ── */
.gs-sug-item {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 12px; border-radius: 10px; cursor: pointer; transition: background 0.1s;
}
.gs-sug-item:hover, .gs-sug-item.selected { background: rgba(59,130,246,0.08); }
.gs-sug-text {
  flex: 1; font-size: 13px; color: #1f2937;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.gs-sug-hl { color: #9ca3af; font-weight: 400; }
.gs-sug-enter { font-size: 11px; color: #3b82f6; font-weight: 500; flex-shrink: 0; }

/* ── 暗色模式 ── */
@media (prefers-color-scheme: dark) {
  .gs-sug-item:hover, .gs-sug-item.selected { background: rgba(59,130,246,0.14); }
  .gs-sug-text { color: #f4f4f5; }
  .gs-sug-hl  { color: #71717a; }
  #gs-box {
    background: rgba(26,26,28,0.98);
    border-color: rgba(255,255,255,0.08);
    box-shadow: 0 24px 64px rgba(0,0,0,0.4), 0 4px 16px rgba(0,0,0,0.2);
  }
  #gs-input { color: #f4f4f5; }
  #gs-input::placeholder { color: #52525b; }
  #gs-esc-hint { background: rgba(255,255,255,0.07); }
  #gs-engine-btn:hover { background: rgba(255,255,255,0.08); }
  #gs-engine-btn .gs-fallback { background: rgba(255,255,255,0.08); color: #a1a1aa; }
  .gs-divider { background: rgba(255,255,255,0.08); }
  .gs-engine-item:hover, .gs-engine-item.active,
  .gs-bm-item:hover, .gs-bm-item.selected { background: rgba(59,130,246,0.14); }
  .gs-engine-name, .gs-bm-title { color: #f4f4f5; }
  .gs-engine-key { background: rgba(255,255,255,0.08); color: #71717a; }
  .gs-overlay { background: rgba(0,0,0,0.4); }
}
`;
  document.head.appendChild(style);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', injectStyles);
} else {
  injectStyles();
}

// ─── 状态 ────────────────────────────────────────────────
let dropdownMode           = null; // 'engines' | 'bookmarks' | 'suggestions' | null
let selectedBookmarkIndex  = -1;
let currentBookmarkResults = [];

let currentSuggestions      = [];
let selectedSuggestionIndex = -1;
let currentSearchQuery      = '';   // 上次实际输入的查询词（导航时保留）
let suggestAbortCtrl        = null;
let suggestTimer            = null;

// ─── 下拉渲染 ─────────────────────────────────────────────
function renderEngines(container) {
  jumpData.forEach(engine => {
    const item = document.createElement('div');
    item.className = 'gs-engine-item' + (engine.key.includes(defaultKey) ? ' active' : '');

    const img = document.createElement('img');
    img.src = getFavicon(engine.jumpUrl);
    img.onerror = () => { img.style.display = 'none'; };

    const name = document.createElement('span');
    name.className = 'gs-engine-name';
    name.textContent = engine.label;

    const key = document.createElement('span');
    key.className = 'gs-engine-key';
    key.textContent = engine.key[0].toUpperCase();

    item.appendChild(img);
    item.appendChild(name);
    item.appendChild(key);

    if (engine.key.includes(defaultKey)) {
      const check = document.createElement('span');
      check.className = 'gs-engine-check';
      check.textContent = '✓';
      item.appendChild(check);
    }

    item.addEventListener('click', async () => {
      defaultKey = engine.key[0];
      await storage.set('defaultKey', engine.key[0]);
      updateEngineBtn();
      hideDropdown();
    });

    container.appendChild(item);
  });
}

function renderBookmarks(container, results, selectedIndex) {
  if (results.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'gs-empty';
    empty.textContent = '未找到匹配的收藏夹';
    container.appendChild(empty);
    return;
  }

  results.slice(0, 5).forEach((bm, i) => {
    const item = document.createElement('div');
    item.className = 'gs-bm-item' + (i === selectedIndex ? ' selected' : '');

    const img = document.createElement('img');
    img.src = getFavicon(bm.url);
    img.onerror = () => { img.style.display = 'none'; };

    const info = document.createElement('div');
    info.className = 'gs-bm-info';

    const title = document.createElement('div');
    title.className = 'gs-bm-title';
    title.textContent = bm.title;

    const url = document.createElement('div');
    url.className = 'gs-bm-url';
    url.textContent = bm.url;

    info.appendChild(title);
    info.appendChild(url);
    item.appendChild(img);
    item.appendChild(info);

    if (i === selectedIndex) {
      const enter = document.createElement('span');
      enter.className = 'gs-bm-enter';
      enter.textContent = 'Enter';
      item.appendChild(enter);
    }

    item.addEventListener('click', () => {
      if (bm.url) {
        window.open(bm.url, '_blank', 'noopener,noreferrer');
        hideDropdown();
        if (animateHide) animateHide();
      }
    });

    container.appendChild(item);
  });

  if (results.length > 5) {
    const more = document.createElement('div');
    more.className = 'gs-more';
    more.textContent = `另有 ${results.length - 5} 条结果`;
    container.appendChild(more);
  }
}

// ─── 搜索建议 ─────────────────────────────────────────────
async function fetchSuggestions(query, engineKey) {
  if (!query || query.length < 1) { if (dropdownMode === 'suggestions') hideDropdown(); return; }
  if (!isExtensionEnvironment) return;

  // 标记旧请求为取消（替代 AbortController，因为现在走 sendMessage）
  if (suggestAbortCtrl) suggestAbortCtrl._cancelled = true;
  const ctrl = { _cancelled: false };
  suggestAbortCtrl = ctrl;

  let url = '';
  if      (['bd','baidu'].includes(engineKey))  url = `https://www.baidu.com/sugrec?prod=pc&wd=${encodeURIComponent(query)}`;
  else if (['gg','google'].includes(engineKey)) url = `https://www.google.com/complete/search?client=chrome&q=${encodeURIComponent(query)}`;
  else if (['bi','bing'].includes(engineKey))   url = `https://api.bing.com/qsonhs.aspx?type=cb&q=${encodeURIComponent(query)}`;
  else { hideDropdown(); return; }

  try {
    // 由 background service worker 代理 fetch（绕过 content script 的 CORS 限制）
    const resp = await chrome.runtime.sendMessage({ action: 'FETCH_SUGGESTIONS', url });
    if (ctrl._cancelled) return;
    if (!resp?.success) throw new Error(resp?.error || 'fetch failed');

    const data = resp.data;
    let results = [];
    if      (['bd','baidu'].includes(engineKey))  results = (data.g || []).map(i => i.q).filter(Boolean);
    else if (['gg','google'].includes(engineKey)) results = data[1] || [];
    else if (['bi','bing'].includes(engineKey))   results = data.AS?.Results?.[0]?.Suggests?.map(s => s.Txt) || [];

    currentSuggestions      = results.slice(0, 8);
    selectedSuggestionIndex = -1;
    if (currentSuggestions.length > 0) showDropdown('suggestions');
    else if (dropdownMode === 'suggestions') hideDropdown();
  } catch (e) {
    if (!ctrl._cancelled) console.error('Suggestion fetch error:', e);
  }
}

function renderSuggestions(container) {
  currentSuggestions.forEach((sug, i) => {
    const item = document.createElement('div');
    item.className = 'gs-sug-item' + (i === selectedSuggestionIndex ? ' selected' : '');

    const text = document.createElement('span');
    text.className = 'gs-sug-text';
    if (currentSearchQuery) {
      const rx = new RegExp(`(${escapeRegex(currentSearchQuery)})`, 'gi');
      // 已输入部分变灰，未输入部分正常色，突出补全内容
      text.innerHTML = sug.replace(rx, '<span class="gs-sug-hl">$1</span>');
    } else {
      text.textContent = sug;
    }
    item.appendChild(text);

    if (i === selectedSuggestionIndex) {
      const hint = document.createElement('span');
      hint.className = 'gs-sug-enter';
      hint.textContent = '↵';
      item.appendChild(hint);
    }

    item.addEventListener('mouseenter', () => {
      selectedSuggestionIndex = i;
      container.querySelectorAll('.gs-sug-item').forEach((el, idx) => {
        el.classList.toggle('selected', idx === i);
      });
    });

    item.addEventListener('click', () => {
      const input = document.getElementById('gs-input');
      jumpTo(parseInputQuery(input?.value || '').engineKey, sug);
      if (input) input.value = '';
      hideDropdown();
      selectedSuggestionIndex = -1;
      if (animateHide) animateHide();
    });

    container.appendChild(item);
  });
}

const scrollToSelectedSuggestion = () => {
  const dropdown = document.getElementById('gs-dropdown');
  const sel = dropdown?.querySelector('.gs-sug-item.selected');
  if (!dropdown || !sel) return;
  const dr = dropdown.getBoundingClientRect(), sr = sel.getBoundingClientRect();
  if (sr.top < dr.top) dropdown.scrollTop -= dr.top - sr.top;
  else if (sr.bottom > dr.bottom) dropdown.scrollTop += sr.bottom - dr.bottom;
};

// ─── 下拉显示/隐藏 ───────────────────────────────────────
function showDropdown(mode, results, selectedIndex) {
  dropdownMode = mode;
  let divider  = document.getElementById('gs-divider');
  let dropdown = document.getElementById('gs-dropdown');
  if (!divider || !dropdown) return;

  divider.style.display  = 'block';
  dropdown.style.display = 'block';
  dropdown.innerHTML     = '';

  if (mode === 'engines')     renderEngines(dropdown);
  if (mode === 'bookmarks')   renderBookmarks(dropdown, results ?? currentBookmarkResults, selectedIndex ?? selectedBookmarkIndex);
  if (mode === 'suggestions') renderSuggestions(dropdown);
}

function hideDropdown() {
  dropdownMode = null;
  const divider  = document.getElementById('gs-divider');
  const dropdown = document.getElementById('gs-dropdown');
  if (divider)  divider.style.display  = 'none';
  if (dropdown) dropdown.style.display = 'none';
}

// ─── 更新引擎按钮图标 ─────────────────────────────────────
function updateEngineBtn() {
  const btn    = document.getElementById('gs-engine-btn');
  if (!btn) return;
  const engine = jumpToData.get(defaultKey);
  if (!engine) return;

  btn.innerHTML = '';
  const img = document.createElement('img');
  img.src     = getFavicon(engine.jumpUrl);
  img.onerror = () => {
    img.remove();
    const fb = document.createElement('div');
    fb.className   = 'gs-fallback';
    fb.textContent = defaultKey.toUpperCase();
    btn.appendChild(fb);
  };
  btn.appendChild(img);
}

// ─── 收藏夹搜索 ──────────────────────────────────────────
async function searchBookmarks(query) {
  try {
    const cached = await storage.get('cachedBookmarks');
    if (!cached) return [];
    const bookmarks  = JSON.parse(cached);
    const lowerQuery = query.toLowerCase();
    return bookmarks.filter(b =>
      b.title?.toLowerCase().includes(lowerQuery) ||
      b.url?.toLowerCase().includes(lowerQuery)
    ).slice(0, 5);
  } catch (e) {
    console.error('搜索失败:', e);
    return [];
  }
}

// ─── 键盘导航（收藏夹） ──────────────────────────────────
const handleKeyNavigation = (e) => {
  if (dropdownMode !== 'bookmarks') return;
  const max = Math.min(currentBookmarkResults.length - 1, 4);

  if (e.key === 'ArrowUp') {
    e.preventDefault();
    selectedBookmarkIndex = selectedBookmarkIndex <= 0 ? max : selectedBookmarkIndex - 1;
    showDropdown('bookmarks');
    scrollToSelected();
  } else if (e.key === 'ArrowDown') {
    e.preventDefault();
    selectedBookmarkIndex = selectedBookmarkIndex >= max ? 0 : selectedBookmarkIndex + 1;
    showDropdown('bookmarks');
    scrollToSelected();
  } else if (e.key === 'Enter') {
    e.preventDefault();
    if (selectedBookmarkIndex >= 0 && currentBookmarkResults[selectedBookmarkIndex]?.url) {
      window.open(currentBookmarkResults[selectedBookmarkIndex].url, '_blank', 'noopener,noreferrer');
      hideDropdown();
      if (animateHide) animateHide();
    }
  }
};

const scrollToSelected = () => {
  const dropdown = document.getElementById('gs-dropdown');
  const selected = dropdown?.querySelector('.gs-bm-item.selected');
  if (!dropdown || !selected) return;
  const dr = dropdown.getBoundingClientRect();
  const sr = selected.getBoundingClientRect();
  if (sr.top < dr.top)       dropdown.scrollTop -= dr.top - sr.top;
  else if (sr.bottom > dr.bottom) dropdown.scrollTop += sr.bottom - dr.bottom;
};

// ─── 创建搜索容器 ─────────────────────────────────────────
let animateHide;

const createSearchContainer = () => {
  if (document.getElementById('gs-overlay')) return null;

  // 覆盖层
  const overlay = document.createElement('div');
  overlay.id = 'gs-overlay';

  // 卡片
  const box = document.createElement('div');
  box.id = 'gs-box';

  // 输入行
  const inputRow = document.createElement('div');
  inputRow.id = 'gs-input-row';

  // 引擎图标按钮
  const engineBtn = document.createElement('button');
  engineBtn.id   = 'gs-engine-btn';
  engineBtn.type = 'button';
  engineBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (dropdownMode === 'engines') hideDropdown();
    else showDropdown('engines');
  });

  // 搜索输入
  const input = document.createElement('input');
  input.id          = 'gs-input';
  input.type        = 'text';
  input.placeholder = '输入搜索内容...';
  input.autocomplete = 'off';

  // Esc 提示
  const escHint = document.createElement('span');
  escHint.id          = 'gs-esc-hint';
  escHint.textContent = 'esc';

  inputRow.appendChild(engineBtn);
  inputRow.appendChild(input);
  inputRow.appendChild(escHint);

  // 分隔线（默认隐藏）
  const divider = document.createElement('div');
  divider.id             = 'gs-divider';
  divider.className      = 'gs-divider';
  divider.style.display  = 'none';

  // 下拉区域（默认隐藏）
  const dropdown = document.createElement('div');
  dropdown.id           = 'gs-dropdown';
  dropdown.style.display = 'none';

  box.appendChild(inputRow);
  box.appendChild(divider);
  box.appendChild(dropdown);
  overlay.appendChild(box);

  // 点击覆盖层背景关闭
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) _hide();
  });

  // 输入事件
  input.addEventListener('input', async (e) => {
    const value = e.target.value.trim();

    selectedBookmarkIndex   = -1;
    currentBookmarkResults  = [];
    selectedSuggestionIndex = -1;

    if (!value) { hideDropdown(); return; }

    // 收藏夹搜索 (* 前缀)
    if (value.startsWith('*')) {
      if (suggestTimer) clearTimeout(suggestTimer);
      const q = value.slice(1).trim();
      if (q) { currentBookmarkResults = await searchBookmarks(q); showDropdown('bookmarks'); }
      else hideDropdown();
      return;
    }

    // 引擎切换 (cd / cd <key>)
    if (value === 'cd' || value.startsWith('cd ')) {
      if (suggestTimer) clearTimeout(suggestTimer);
      showDropdown('engines');
      return;
    }

    // 普通搜索：防抖获取建议
    const { engineKey, query } = parseInputQuery(value);
    currentSearchQuery = query;
    if (suggestTimer) clearTimeout(suggestTimer);
    if (query.length >= 1) {
      suggestTimer = setTimeout(() => fetchSuggestions(query, engineKey), 220);
    } else {
      hideDropdown();
    }
  });

  // 键盘事件
  input.addEventListener('keydown', (e) => {
    // 收藏夹导航
    if (input.value.trim().startsWith('*')) {
      handleKeyNavigation(e);
      if (e.key === 'Enter' && !currentBookmarkResults.length) e.preventDefault();
      return;
    }

    // 搜索建议导航
    if (dropdownMode === 'suggestions' && currentSuggestions.length > 0) {
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        const len = currentSuggestions.length;
        if (e.key === 'ArrowUp') {
          selectedSuggestionIndex = selectedSuggestionIndex <= 0 ? len - 1 : selectedSuggestionIndex - 1;
        } else {
          selectedSuggestionIndex = selectedSuggestionIndex >= len - 1 ? 0 : selectedSuggestionIndex + 1;
        }
        // 填充输入框（不触发 input 事件）
        input.value = currentSuggestions[selectedSuggestionIndex];
        // 仅更新选中样式，不重新请求
        document.querySelectorAll('#gs-dropdown .gs-sug-item').forEach((el, i) => {
          el.classList.toggle('selected', i === selectedSuggestionIndex);
          if (i === selectedSuggestionIndex) {
            let hint = el.querySelector('.gs-sug-enter');
            if (!hint) { hint = document.createElement('span'); hint.className = 'gs-sug-enter'; hint.textContent = '↵'; el.appendChild(hint); }
          } else {
            el.querySelector('.gs-sug-enter')?.remove();
          }
        });
        scrollToSelectedSuggestion();
        return;
      }
    }

    if (e.key === 'Enter' && input.value.trim()) {
      const content = input.value.trim();
      // cd 切换引擎：执行后保持弹窗打开，方便继续搜索
      const parts = content.split(' ');
      const isCd  = parts[0] === 'cd' && parts.length <= 2;

      if (dropdownMode === 'suggestions' && selectedSuggestionIndex >= 0 && currentSuggestions[selectedSuggestionIndex]) {
        jumpTo(parseInputQuery(input.value).engineKey, currentSuggestions[selectedSuggestionIndex]);
      } else {
        if (content.startsWith('/')) jumpTo(defaultKey, content.slice(1));
        else if (content.includes(' ')) { const [a, b] = segmentationContent(' ', content); jumpTo(a, b); }
        else jumpTo(defaultKey, content);
      }
      input.value = '';
      hideDropdown();
      selectedSuggestionIndex = -1;
      // cd 时不关闭弹窗，其余搜索执行后关闭
      if (!isCd) _hide();
    } else if (e.key === 'Escape') {
      _hide();
    }
  });

  // 阻止卡片内部点击冒泡到覆盖层
  box.addEventListener('click', (e) => e.stopPropagation());

  const _show = () => {
    overlay.style.display = 'flex';
    overlay.offsetHeight; // force reflow
    overlay.classList.add('show');
    box.classList.add('show');
    updateEngineBtn();
    setTimeout(() => { input.focus(); input.select(); }, 40);
  };

  animateHide = _hide;
  function _hide() {
    overlay.classList.remove('show');
    box.classList.remove('show');
    setTimeout(() => {
      overlay.style.display = 'none';
      input.value = '';
      hideDropdown();
    }, 220);
  }

  return { overlay, show: _show, hide: _hide };
};

// ─── 显示搜索框 ──────────────────────────────────────────
let searchElements = null;

const showSearchBox = () => {
  if (!searchElements) {
    searchElements = createSearchContainer();
    if (searchElements && document.body) {
      document.body.appendChild(searchElements.overlay);
    }
  }
  if (searchElements) searchElements.show();
};

// ─── 全局 Escape 和 Alt+S ───────────────────────────────
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const overlay = document.getElementById('gs-overlay');
    if (overlay && overlay.style.display === 'flex') {
      e.preventDefault();
      if (animateHide) animateHide();
    }
  } else if (e.altKey && (e.key === 's' || e.key === 'S')) {
    e.preventDefault();
    const overlay = document.getElementById('gs-overlay');
    if (overlay && overlay.style.display === 'flex') {
      if (animateHide) animateHide();
    } else {
      showSearchBox();
    }
  }
});

// ─── 消息监听 ────────────────────────────────────────────
if (isExtensionEnvironment) {
  chrome.runtime.onMessage.addListener((request) => {
    if (request.action === 'SHOW_SEARCH') {
      showSearchBox();
    } else if (request.action === 'UPDATE_JUMP_DATA') {
      jumpData   = request.data;
      jumpToData = new Map();
      jumpData.forEach(d => d.key.forEach(k => jumpToData.set(k, d)));
      updateEngineBtn();
    }
  });
}

// ─── 跳转 ────────────────────────────────────────────────
async function jumpTo(jumpType, toData) {
  if (!jumpType) jumpType = defaultKey;
  if (jumpType === 'cd') {
    if (jumpToData.has(toData)) {
      defaultKey = toData;
      await storage.set('defaultKey', toData);
      updateEngineBtn();
    }
    return;
  }
  const engine = jumpToData.get(jumpType);
  if (engine) {
    window.open(engine.jumpUrl.replace('&<query>', toData), '_blank', 'noopener,noreferrer');
  } else {
    const def = jumpToData.get(defaultKey);
    if (def) window.open(def.jumpUrl.replace('&<query>', jumpType + toData), '_blank', 'noopener,noreferrer');
  }
}

// ─── 初始化 ──────────────────────────────────────────────
async function init() {
  const buildMap = () => {
    jumpToData = new Map();
    jumpData.forEach(d => d.key.forEach(k => jumpToData.set(k, d)));
  };
  try {
    const savedKey  = await storage.get('defaultKey');
    const savedData = await storage.get('jumpData');

    defaultKey = savedKey || 'bd';

    // chrome.storage 直接存原生对象（数组），localStorage 存 JSON 字符串，需兼容两种格式
    if (Array.isArray(savedData)) {
      jumpData = savedData;
    } else if (typeof savedData === 'string') {
      try { jumpData = JSON.parse(savedData); } catch { jumpData = defaultJumpData; }
    } else {
      jumpData = defaultJumpData;
    }

    if (!savedKey)  await storage.set('defaultKey', 'bd');
    if (!savedData) await storage.set('jumpData', defaultJumpData);

    buildMap();
  } catch (e) {
    // 兜底：保证 jumpToData 始终可用
    jumpData = defaultJumpData;
    buildMap();
    console.error('Content script init error:', e);
  }
}

init();

} // end of window.__gsExtInit guard
