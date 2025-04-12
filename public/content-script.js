// 在文件开头添加环境检查
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

@media (prefers-color-scheme: dark) {
  #global-search-box {
    background-color: rgba(30, 30, 30, 0.95);
  }
  
  #global-search-input {
    color: #ffffff;
    border-color: rgba(255, 255, 255, 0.1);
  }
  
  #search-status,
  #search-engines-list {
    background: rgba(30, 30, 30, 0.95);
    color: #fff;
  }
  
  .engine-item {
    background: rgba(255, 255, 255, 0.1);
  }
  
  .engine-keys {
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

  searchBox.appendChild(searchHint);
  searchBox.appendChild(input);
  container.appendChild(searchBox);

  container.addEventListener('click', (e) => {
    if (e.target === container) {
      animateHide();
    }
  });

  const animateShow = () => {
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
  };

  const animateHide = () => {
    container.classList.remove('show');
    searchBox.classList.remove('show');
    input.classList.remove('show');
    searchHint.classList.remove('show');

    setTimeout(() => {
      container.style.display = 'none';
      input.value = '';
    }, 300);
  };

  input.addEventListener('input', (e) => {
    init();
    const value = e.target.value.trim();

    // 当输入为空时，显示默认搜索引擎信息
    if (!value) {
      hideEnginesList();
      const defaultEngine = jumpToData.get(defaultKey);
      updateSearchStatus(`当前使用 ${defaultEngine.label} (${defaultEngine.key.join('/')}) | 输入 cd 切换搜索引擎`);
      return;
    }

    if (value === 'cd') {
      showEnginesList();
      updateSearchStatus('选择要切换的搜索引擎');
    } else if (value.startsWith('cd ')) {
      const engineKey = value.split(' ')[1];
      const engine = jumpToData.get(engineKey);
      if (engine) {
        updateSearchStatus(`将切换到 ${engine.label} (${engine.key.join('/')})`);
      } else {
        updateSearchStatus('未找到匹配的搜索引擎');
      }
      showEnginesList();
    } else {
      // 检查输入是否匹配任何搜索引擎的 key
      const inputParts = value.split(' ');
      const searchKey = inputParts[0];

      // 查找匹配的搜索引擎
      let matchedEngine = null;
      for (const [_, engine] of jumpToData) {
        if (engine.key.includes(searchKey)) {
          matchedEngine = engine;
          break;
        }
      }

      if (matchedEngine) {
        // 如果找到匹配的搜索引擎
        if (inputParts.length === 1) {
          // 只输入了 key，还没有输入搜索内容
          updateSearchStatus(`使用 ${matchedEngine.label} (${matchedEngine.key.join('/')}) | 输入搜索内容`);
        } else {
          // 已输入搜索内容
          updateSearchStatus(`使用 ${matchedEngine.label} (${matchedEngine.key.join('/')}) 搜索`);
        }
      } else {
        // 如果没有找到匹配的搜索引擎，使用默认搜索引擎
        const defaultEngine = jumpToData.get(defaultKey);
        updateSearchStatus(`使用默认引擎 ${defaultEngine.label} (${defaultEngine.key.join('/')}) 搜索`);
      }
      hideEnginesList();
    }
  });

  input.addEventListener('keydown', (e) => {
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

  // 创建状态显示区域
  const searchStatus = document.createElement('div');
  searchStatus.id = 'search-status';
  searchBox.appendChild(searchStatus);

  // 创建搜索引擎列表
  const enginesList = document.createElement('div');
  enginesList.id = 'search-engines-list';
  searchBox.appendChild(enginesList);

  return { container, input, animateShow, animateHide };
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
      updateSearchStatus(`当前使用 ${defaultEngine.label} (${defaultEngine.key.join('/')}) | 输入 cd 切换搜索引擎`);
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
      console.log('request.data', request.data);
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

    console.log('Content script initialized with defaultKey:', defaultKey);
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
  enginesList.classList.add('show');

  // 按搜索引擎分组显示，而不是按键显示
  jumpData.forEach(engine => {
    const item = document.createElement('div');
    item.className = 'engine-item';

    const engineInfo = document.createElement('div');
    engineInfo.textContent = engine.label;

    const engineKeys = document.createElement('div');
    engineKeys.className = 'engine-keys';
    engineKeys.textContent = engine.key.join(' / '); // 用 / 分隔多个 key

    item.appendChild(engineInfo);
    item.appendChild(engineKeys);

    item.addEventListener('click', () => {
      const input = document.getElementById('global-search-input');
      if (input) {
        input.value = `cd ${engine.key[0]}`; // 使用第一个 key
        input.focus();
        updateSearchStatus(`将切换到 ${engine.label} (${engine.key.join('/')})`);
      }
    });

    enginesList.appendChild(item);
  });
}

// 添加隐藏搜索引擎列表函数
function hideEnginesList() {
  const enginesList = document.getElementById('search-engines-list');
  if (enginesList) {
    enginesList.classList.remove('show');
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