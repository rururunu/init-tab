const isExtensionEnvironment = typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage;

// 全局变量声明
const defaultJumpData = [
  {
    key: ["bd", "baidu"],
    label: "BaiDu百度",
    jumpUrl: `https://www.baidu.com/s?tn=22073068_8_oem_dg&ch=2&ie=utf-8&word=&<query>`
  },
  {
    key: ["gg", "google"],
    label: "Google谷歌",
    jumpUrl: `https://www.google.com/search?q=&<query>`
  },
  {
    key: ["bi", "bing"],
    label: "Bing必应",
    jumpUrl: `https://www.bing.com/search?form=QBLH&q=&<query>&mkt=zh-CN`
  }
];

let jumpData = defaultJumpData;
let jumpToData = new Map();
let defaultKey = "bd";
let searchHint = null;

const storage = {
  async set(key, value) {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        await chrome.storage.local.set({ [key]: value });
      } else {
        localStorage.setItem(key, JSON.stringify(value));
      }
    } catch (e) {
      console.error('Storage set error:', e);
    }
  },

  async get(key) {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        const result = await chrome.storage.local.get(key);
        return result[key];
      } else {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
      }
    } catch (e) {
      console.error('Storage get error:', e);
      return null;
    }
  }
};

function injectStyles() {
  const style = document.createElement('style');
  style.textContent = `
#global-search-extension {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0);
  backdrop-filter: blur(0px);
  display: none;
  justify-content: center;
  align-items: center;
  z-index: 2147483647;
  transition: all 0.3s ease-out;
  cursor: pointer;
}

#global-search-extension.show {
  background-color: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(4px);
}

#global-search-box {
  position: relative;
  width: 0;
  max-width: 600px;
  background-color: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: default;
  overflow: visible;
}

#global-search-box.show {
  width: 90%;
  opacity: 1;
  transform: scale(1);
}

#global-search-input {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid rgba(0, 0, 0, 0.1);
  border-radius: 12px;
  font-size: 16px;
  background: transparent;
  outline: none;
  color: #000000;
  transition: all 0.3s ease;
}

#global-search-input:focus {
  border-color: #006BDF;
  box-shadow: 0 0 0 4px rgba(0, 107, 223, 0.1);
}

#global-search-hint {
  position: absolute;
  top: -30px;
  left: 0;
  right: 0;
  text-align: center;
  font-size: 14px;
  color: #ffffff;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  opacity: 0;
  transition: all 0.3s ease;
}

#global-search-hint.show {
  opacity: 1;
}

#search-status {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  padding: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  margin-bottom: 8px;
  font-size: 14px;
  color: #666;
}

#search-engines-list {
  position: absolute;
  top: calc(100% + 64px);
  left: 0;
  right: 0;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  padding: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  display: none;
}

#search-engines-list.show {
  display: block;
}

.engine-item {
  padding: 10px 16px;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.05);
  cursor: pointer;
  transition: all 0.2s ease;
  margin-bottom: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.engine-item:last-child {
  margin-bottom: 0;
}

.engine-item:hover {
  background: rgba(0, 107, 223, 0.1);
  color: #006BDF;
}

.engine-keys {
  color: #666;
  font-size: 0.9em;
}

#bookmark-results {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  padding: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  display: none;
  max-height: 250px;
  overflow: hidden;
  transition: all 0.3s ease;
}

/* 自定义滚动条样式 */
#bookmark-results::-webkit-scrollbar {
  width: 8px; /* 滚动条宽度 */
}

#bookmark-results::-webkit-scrollbar-thumb {
  background-color: transparent; /* 滚动条颜色 */
}

#bookmark-results::-webkit-scrollbar-track {
  background: transparent; /* 滚动条轨道颜色 */
}

.bookmark-item {
  background: white;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  padding: 12px;
  margin: 8px 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s;
  color: #333;
}

.bookmark-item:hover {
  transform: scale(1.02);
}

.bookmark-item.selected {
  background-color: rgba(0, 0, 0, 0.05);
}

.bookmark-title {
  font-weight: 500;
  margin-bottom: 4px;
}

.bookmark-url {
  font-size: 12px;
  color: #666;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
  display: block;
}

.bookmark-hint {
  font-size: 12px;
  color: #666;
  margin-top: 4px;
}

.no-results {
  padding: 12px;
  text-align: center;
  color: #666;
}

.more-results {
  padding: 8px 12px;
  text-align: center;
  color: #666;
  font-size: 12px;
}

@media (prefers-color-scheme: dark) {
  #global-search-box {
    background-color: rgba(30, 30, 30, 0.95);
  }
  
  #global-search-input {
    color: #ffffff;
    border-color: rgba(255, 255, 255, 0.1);
  }
  
  #search-status,
  #search-engines-list,
  #bookmark-results {
    background: rgba(30, 30, 30, 0.95);
    color: #fff;
  }
  
  .engine-item {
    background: rgba(255, 255, 255, 0.1);
  }
  
  .engine-keys {
    color: #999;
  }

  .bookmark-item:hover,
  .bookmark-item.selected {
    background-color: rgba(255, 255, 255, 0.1);
  }
  
  .bookmark-title {
    color: #ffffff;
  }
  
  .bookmark-url,
  .bookmark-hint,
  .no-results,
  .more-results {
    color: #999;
  }
}
`;
  document.head.appendChild(style);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', injectStyles);
} else {
  injectStyles();
}

// 修改搜索收藏夹函数
async function searchBookmarks(query) {
  try {
    const cached = await storage.get('cachedBookmarks');
    if (!cached) return [];

    const bookmarks = JSON.parse(cached);
    const lowerQuery = query.toLowerCase();

    return bookmarks.filter(b => {
      return b.title?.toLowerCase().includes(lowerQuery) ||
        b.url?.toLowerCase().includes(lowerQuery);
    }).slice(0, 5);
  } catch (e) {
    console.error('搜索失败:', e);
    return [];
  }
}

// 创建搜索结果容器
const createBookmarkResults = () => {
  const container = document.createElement('div');
  container.id = 'bookmark-results';
  container.className = 'bookmark-results';
  container.style.cssText = `
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    max-height: 300px;
    overflow-y: auto;
    background: rgba(255, 255, 255, 0.95);
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    margin-top: 8px;
    z-index: 1000;
  `;
  return container;
};

// 更新搜索结果
const updateBookmarkResults = (results, selectedIndex = -1) => {
  const container = document.getElementById('bookmark-results');
  if (!container) return;

  container.innerHTML = '';

  if (results.length === 0) {
    const noResults = document.createElement('div');
    noResults.className = 'no-results';
    noResults.textContent = '未找到匹配的收藏夹';
    container.appendChild(noResults);
    return;
  }

  results.slice(0, 5).forEach((bookmark, index) => {
    const item = document.createElement('div');
    item.className = 'bookmark-item' + (index === selectedIndex ? ' selected' : '');
    item.style.cssText = `
      padding: 8px 12px;
      cursor: pointer;
      transition: box-shadow 0.2s, background-color 0.2s, border 0.2s;
      border: 2px solid transparent; // 默认边框透明
    `;

    // 选中时的样式
    if (index === selectedIndex) {
      item.style.boxShadow = '0 0 10px rgba(4, 109, 223, 1)'; // 蓝色发光边框
      item.style.border = '2px solid #046DDF'; // 选中时的边框颜色
      item.style.backgroundColor = 'rgba(4, 109, 223, 0.1)'; // 选中时的背景色

      // 添加提示
      const hint = document.createElement('div');
      hint.className = 'bookmark-hint';
      hint.textContent = '按Enter打开';
      hint.style.cssText = `
        font-size: 12px;
        color: #046DDF; // 使用边框颜色
        margin-top: 4px;
        font-weight: bold; // 加粗提示
      `;
      item.appendChild(hint);
    }

    const content = document.createElement('div');
    content.className = 'bookmark-content';

    const title = document.createElement('div');
    title.className = 'bookmark-title';
    title.textContent = bookmark.title;
    title.style.cssText = `
      font-weight: 500;
      margin-bottom: 4px;
    `;

    const url = document.createElement('div');
    url.className = 'bookmark-url';
    url.textContent = bookmark.url;
    url.style.cssText = `
      font-size: 12px;
      color: #666;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 100%;
      display: block;
    `;

    content.appendChild(title);
    content.appendChild(url);
    item.appendChild(content);

    item.addEventListener('click', () => {
      if (bookmark.url) {
        window.open(bookmark.url, '_blank', 'noopener,noreferrer');
      }
    });

    // 添加悬浮效果
    item.addEventListener('mouseenter', () => {
      item.style.boxShadow = '0 0 10px rgba(4, 109, 223, 1)'; // 悬浮时的发光边框
      item.style.border = '2px solid #046DDF'; // 悬浮时的边框颜色
    });

    item.addEventListener('mouseleave', () => {
      if (index !== selectedIndex) {
        item.style.boxShadow = ''; // 恢复边框
        item.style.border = '2px solid transparent'; // 恢复边框透明
      }
    });

    container.appendChild(item);
  });

  if (results.length > 5) {
    const more = document.createElement('div');
    more.className = 'more-results';
    more.textContent = `还有 ${results.length - 5} 个结果未显示`;
    more.style.cssText = `
      padding: 8px 12px;
      text-align: center;
      color: #666;
      font-size: 12px;
    `;
    container.appendChild(more);
  }
};

let selectedBookmarkIndex = -1;
let currentBookmarkResults = [];

const handleKeyNavigation = (e) => {
  if (!document.getElementById('bookmark-results')?.style.display === 'block') return;

  const maxIndex = Math.min(currentBookmarkResults.length - 1, 4);

  switch (e.key) {
    case 'ArrowUp':
      e.preventDefault();
      if (selectedBookmarkIndex <= 0) {
        selectedBookmarkIndex = maxIndex;
      } else {
        selectedBookmarkIndex--;
      }
      updateBookmarkResults(currentBookmarkResults, selectedBookmarkIndex);
      scrollToSelected();
      break;
    case 'ArrowDown':
      e.preventDefault();
      if (selectedBookmarkIndex >= maxIndex) {
        selectedBookmarkIndex = 0;
      } else {
        selectedBookmarkIndex++;
      }
      updateBookmarkResults(currentBookmarkResults, selectedBookmarkIndex);
      scrollToSelected();
      break;
    case 'Enter':
      e.preventDefault();
      if (selectedBookmarkIndex >= 0 && currentBookmarkResults[selectedBookmarkIndex]?.url) {
        window.open(currentBookmarkResults[selectedBookmarkIndex].url, '_blank', 'noopener,noreferrer');
      }
      break;
  }
};

const scrollToSelected = () => {
  const container = document.getElementById('bookmark-results');
  const selectedItem = container?.querySelector('.bookmark-item.selected');

  if (container && selectedItem) {
    const containerRect = container.getBoundingClientRect();
    const itemRect = selectedItem.getBoundingClientRect();

    if (itemRect.top < containerRect.top) {
      container.scrollTop -= (containerRect.top - itemRect.top);
    } else if (itemRect.bottom > containerRect.bottom) {
      container.scrollTop += (itemRect.bottom - containerRect.bottom);
    }
  }
};

// 修改搜索框创建函数
const createSearchContainer = () => {
  if (document.getElementById('global-search-extension')) {
    return document.getElementById('global-search-extension');
  }

  const container = document.createElement('div');
  container.id = 'global-search-extension';

  const searchBox = document.createElement('div');
  searchBox.id = 'global-search-box';

  const input = document.createElement('input');
  input.type = 'text';
  input.id = 'global-search-input';
  input.placeholder = '输入搜索内容...';
  input.autofocus = true;

  searchHint = document.createElement('div');
  searchHint.id = 'global-search-hint';

  const bookmarkResults = createBookmarkResults();
  const searchStatus = document.createElement('div');
  searchStatus.id = 'search-status';
  const enginesList = document.createElement('div');
  enginesList.id = 'search-engines-list';

  searchBox.appendChild(searchHint);
  searchBox.appendChild(input);
  searchBox.appendChild(bookmarkResults);
  searchBox.appendChild(searchStatus);
  searchBox.appendChild(enginesList);
  container.appendChild(searchBox);

  container.addEventListener('click', (e) => {
    if (e.target === container) {
      animateHide();
    }
  });

  // 修改输入事件监听
  input.addEventListener('input', async (e) => {
    const value = e.target.value.trim();

    // 重置搜索状态
    selectedBookmarkIndex = -1;
    currentBookmarkResults = [];

    // 处理收藏夹搜索
    if (value.startsWith('*')) {
      const searchQuery = value.slice(1).trim();

      if (searchQuery) {
        try {
          currentBookmarkResults = await searchBookmarks(searchQuery);
          updateBookmarkResults(currentBookmarkResults);
          updateSearchHint(`搜索收藏夹: ${searchQuery}`);

          const bookmarkResults = document.getElementById('bookmark-results');
          if (bookmarkResults) {
            bookmarkResults.style.display = 'block';
          }
        } catch (e) {
          console.error('Error searching bookmarks:', e);
          updateSearchHint('搜索收藏夹失败');
        }
      } else {
        updateSearchHint('请输入要搜索的收藏夹内容');
        const bookmarkResults = document.getElementById('bookmark-results');
        if (bookmarkResults) {
          bookmarkResults.style.display = 'none';
        }
      }
      return;
    }

    // 处理搜索引擎切换
    if (value === 'cd') {
      showEnginesList();
      updateSearchHint('请选择要切换的搜索引擎');
      return;
    }

    // 隐藏收藏夹搜索结果和搜索引擎列表
    const bookmarkResults = document.getElementById('bookmark-results');
    const enginesList = document.getElementById('search-engines-list');
    if (bookmarkResults) bookmarkResults.style.display = 'none';
    if (enginesList) enginesList.style.display = 'none';

    // 原有的搜索逻辑
    init();
    updateSearchHint(`使用默认引擎 ${jumpToData.get(defaultKey).label} 搜索 | 输入 cd 查看可用搜索引擎`);
  });

  // 添加键盘事件监听
  input.addEventListener('keydown', (e) => {
    if (e.target.value.trim().startsWith('*')) {
      handleKeyNavigation(e);
      if (e.key === 'Enter' && !currentBookmarkResults.length) {
        e.preventDefault();
      }
      return;
    }

    if (e.key === 'Enter' && input.value.trim()) {
      const content = input.value.trim();
      if (content.startsWith("/")) {
        jumpTo(defaultKey, content.slice(1));
      } else if (content.includes(" ")) {
        let contentFAndR = segmentationContent(" ", content);
        jumpTo(contentFAndR[0], contentFAndR[1]);
      } else {
        jumpTo(defaultKey, content);
      }
      input.value = '';
      updateSearchStatus(`使用默认引擎 ${jumpToData.get(defaultKey).label} 搜索 | 输入 cd 查看可用搜索引擎`);
      hideEnginesList();
    } else if (e.key === 'Escape') {
      hideEnginesList();
      if (document.getElementById('global-search-extension').style.display === 'flex') {
        animateHide();
      }
    }
  });

  return {
    container,
    input,
    searchBox,
    animateShow: () => {
      container.style.display = 'flex';
      container.offsetHeight;
      container.classList.add('show');
      searchBox.classList.add('show');
      input.classList.add('show');
      searchHint.classList.add('show');
      setTimeout(() => {
        input.focus();
        input.select();
      }, 50);
    },
    animateHide: () => {
      container.classList.remove('show');
      searchBox.classList.remove('show');
      input.classList.remove('show');
      searchHint.classList.remove('show');
      setTimeout(() => {
        container.style.display = 'none';
        input.value = '';
        const bookmarkResults = document.getElementById('bookmark-results');
        const enginesList = document.getElementById('search-engines-list');
        if (bookmarkResults) bookmarkResults.style.display = 'none';
        if (enginesList) enginesList.style.display = 'none';
      }, 300);
    }
  };
};

const showSearchBox = () => {
  let container = document.getElementById('global-search-extension');
  if (!container) {
    const elements = createSearchContainer();
    if (document.body) {
      document.body.appendChild(elements.container);
      container = elements.container;
      // 显示默认搜索引擎信息
      const defaultEngine = jumpToData.get(defaultKey);
      updateSearchStatus(`当前使用 ${defaultEngine.label} (${defaultEngine.key.join('/')}) | 输入 cd 切换搜索引擎`);
      hideEnginesList();
      elements.animateShow();
      const input = document.getElementById('global-search-input');
      if (input) {
        setTimeout(() => {
          input.focus();
        }, 50);
      }
    }
  } else {
    container.style.display = 'flex';
    container.offsetHeight;
    container.classList.add('show');
    const searchBox = document.getElementById('global-search-box');
    const input = document.getElementById('global-search-input');
    if (searchBox) searchBox.classList.add('show');
    if (input) {
      input.classList.add('show');
      input.focus();
      // 清空输入框并显示默认搜索引擎信息
      input.value = '';
      const defaultEngine = jumpToData.get(defaultKey);
      updateSearchStatus(`当前使用 ${defaultEngine.label} (${defaultEngine.key.join('/')}) | 输入 cd 查看可用搜索引擎`);
      hideEnginesList();
    }
  }
};

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    init();
    const container = document.getElementById('global-search-extension');
    const searchBox = document.getElementById('global-search-box');
    const input = document.getElementById('global-search-input');
    const hint = document.getElementById('global-search-hint');

    if (container && container.style.display === 'flex') {
      e.preventDefault();
      container.classList.remove('show');
      if (searchBox) searchBox.classList.remove('show');
      if (input) input.classList.remove('show');
      if (hint) hint.classList.remove('show');

      setTimeout(() => {
        container.style.display = 'none';
      }, 300);
    }
  }
});

// 修改消息监听部分
if (isExtensionEnvironment) {
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'SHOW_SEARCH') {
      showSearchBox();
    } else if (request.action === 'UPDATE_JUMP_DATA') {
      // 更新搜索引擎数据
      jumpData = request.data;
      // 重新初始化 jumpToData Map
      jumpToData = new Map();
      jumpData.forEach(data => {
        data.key.forEach(key => {
          jumpToData.set(key, data);
        });
      });
      // 更新搜索提示
      updateSearchHint(`使用默认引擎 ${jumpToData.get(defaultKey).label} 搜索 | 输入 cd 查看可用搜索引擎`);
      // 更新状态显示
      const input = document.getElementById('global-search-input');
      if (input) {
        const defaultEngine = jumpToData.get(defaultKey);
        updateSearchStatus(`当前使用 ${defaultEngine.label} (${defaultEngine.key.join('/')}) | 输入 cd 切换搜索引擎`);
      }
    }
  });
}

// 初始化代码
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    if (isExtensionEnvironment) {
      createSearchContainer();
    }
  });
} else {
  if (isExtensionEnvironment) {
    createSearchContainer();
  }
}

function updateSearchHint(message) {
  try {
    const hint = document.getElementById('global-search-hint');
    if (hint) {
      hint.textContent = message;
      hint.classList.add('show');
    }
  } catch (e) {
    console.error('Update search hint error:', e);
  }
}

async function init() {
  try {
    // 使用统一的存储接口获取数据
    const savedDefaultKey = await storage.get('defaultKey');
    const savedJumpData = await storage.get('jumpData');

    // 只有在没有数据时才使用默认值
    defaultKey = savedDefaultKey || 'bd';
    jumpData = JSON.parse(savedJumpData || JSON.stringify(defaultJumpData));

    if (!savedDefaultKey) {
      await storage.set('defaultKey', 'bd');
    }

    if (!savedJumpData) {
      await storage.set('jumpData', JSON.stringify(defaultJumpData));
    }

    // 初始化 jumpToData Map
    jumpToData = new Map();
    jumpData.forEach(data => {
      data.key.forEach(key => {
        jumpToData.set(key, data);
      });
    });

    // 更新搜索提示
    updateSearchHint(`使用默认引擎 ${jumpToData.get(defaultKey).label} 搜索 | 输入 cd 查看可用搜索引擎`);
  } catch (e) {
    console.error('Content script init error:', e);
  }
}

function segmentationContent(medium, content) {
  const [firstPart, ...restParts] = content.split(medium);
  const remaining = restParts.join(' ');
  return [firstPart, remaining];
}

async function jumpTo(jumpType, toData) {
  if (jumpType == null || jumpType == "") {
    jumpType = defaultKey;
  }
  if (jumpType == "cd") {
    const jumpData = jumpToData.get(toData);
    if (jumpData != null) {
      defaultKey = toData;
      await storage.set('defaultKey', toData);
    }
    return;
  }
  const jumpData = jumpToData.get(jumpType);
  if (jumpData != null) {
    const toUrl = jumpData.jumpUrl.replace("&<query>", toData);
    window.open(toUrl, "_blank", "noopener,noreferrer")
  } else {
    const data = jumpType + toData;
    const toUrl = jumpToData.get(defaultKey).jumpUrl.replace("&<query>", data);
    window.open(toUrl, "_blank", "noopener,noreferrer");
  }
}

// 修改搜索引擎列表显示函数
function showEnginesList() {
  const enginesList = document.getElementById('search-engines-list');
  if (!enginesList) return;

  enginesList.innerHTML = '';
  enginesList.style.display = 'block';

  // 按搜索引擎分组显示
  jumpData.forEach(engine => {
    const item = document.createElement('div');
    item.className = 'engine-item';
    item.style.cssText = `
      padding: 10px 16px;
      border-radius: 8px;
      background: rgba(0, 0, 0, 0.05);
      cursor: pointer;
      transition: all 0.2s ease;
      margin-bottom: 8px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      color: #000000 !important;
    `;

    const engineInfo = document.createElement('div');
    engineInfo.textContent = engine.label;

    const engineKeys = document.createElement('div');
    engineKeys.className = 'engine-keys';
    engineKeys.textContent = engine.key.join(' / ');

    item.appendChild(engineInfo);
    item.appendChild(engineKeys);

    item.addEventListener('click', () => {
      const input = document.getElementById('global-search-input');
      if (input) {
        input.value = `cd ${engine.key[0]}`;
        input.focus();
        updateSearchStatus(`将切换到 ${engine.label} (${engine.key.join('/')})`);
      }
    });

    enginesList.appendChild(item);
  });
}

// 修改隐藏搜索引擎列表函数
function hideEnginesList() {
  const enginesList = document.getElementById('search-engines-list');
  if (enginesList) {
    enginesList.style.display = 'none';
  }
}

// 在初始化时设置默认提示
function initSearchHint() {
  const defaultEngine = jumpToData.get(defaultKey);
  if (defaultEngine) {
    updateSearchHint(`使用默认引擎 ${defaultEngine.label} 搜索 | 输入 cd 查看可用搜索引擎`);
  }
}

// 添加隐藏状态显示的函数
function hideSearchStatus() {
  const status = document.getElementById('search-status');
  if (status) {
    status.style.display = 'none';
  }
}

// 修改更新状态显示的函数
function updateSearchStatus(message) {
  const status = document.getElementById('search-status');
  if (status) {
    status.style.display = 'block';
    status.textContent = message;
  }
}

init();