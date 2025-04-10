// 注入样式
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
  margin: 0;
  padding: 0;
  border: none;
  outline: none;
  box-sizing: border-box;
  transition: all 0.3s ease-out;
  cursor: pointer;
}

#global-search-extension.show {
  background-color: rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(4px);
}

#global-search-box {
  position: relative;
  width: 0;
  max-width: 600px;
  background-color: rgba(255, 255, 255, 0.7);
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  margin: 0;
  box-sizing: border-box;
  overflow: hidden;
  opacity: 0;
  transform: scale(0.8);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: default;
}

#global-search-box.show {
  width: 90%;
  opacity: 1;
  transform: scale(1);
}

#global-search-input {
  width: 100%;
  padding: 10px;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  background: transparent;
  outline: none;
  color: #000000;
  margin: 0;
  box-sizing: border-box;
  font-family: system-ui, -apple-system, sans-serif;
  opacity: 0;
  transform: translateY(10px);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

#global-search-input.show {
  opacity: 1;
  transform: translateY(0);
}

#global-search-hint {
  position: absolute;
  top: -25px;
  left: 0;
  font-size: 12px;
  color: #666;
  opacity: 0;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

#global-search-hint.show {
  opacity: 1;
}

@media (prefers-color-scheme: dark) {
  #global-search-box {
    background-color: rgba(30, 30, 30, 0.7);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  #global-search-input {
    color: #ffffff;
  }
  
  #global-search-hint {
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
    }, 150);
  };

  const animateHide = () => {
    container.classList.remove('show');
    searchBox.classList.remove('show');
    input.classList.remove('show');
    searchHint.classList.remove('show');
    
    setTimeout(() => {
      container.style.display = 'none';
    }, 300);
  };

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
      updateSearchHint();
    }
  });

  return { container, input, animateShow, animateHide };
};

const showSearchBox = () => {
  let container = document.getElementById('global-search-extension');
  if (!container) {
    const elements = createSearchContainer();
    if (document.body) {
      document.body.appendChild(elements.container);
      container = elements.container;
      updateSearchHint();
      elements.animateShow();
    } else {
      document.addEventListener('DOMContentLoaded', () => {
        document.body.appendChild(elements.container);
        container = elements.container;
        updateSearchHint();
        elements.animateShow();
      });
    }
  } else {
    container.style.display = 'flex';
    container.offsetHeight;
    container.classList.add('show');
    const searchBox = document.getElementById('global-search-box');
    const input = document.getElementById('global-search-input');
    const hint = document.getElementById('global-search-hint');
    if (searchBox) searchBox.classList.add('show');
    if (input) {
      input.classList.add('show');
      input.focus();
    }
    if (hint) hint.classList.add('show');
    updateSearchHint();
  }
};

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
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

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'SHOW_SEARCH') {
    showSearchBox();
  }
});

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    createSearchContainer();
  });
} else {
  createSearchContainer();
}

const defaultJumpData = [
  {
    key: ["baidu", "bd"],
    label: "BaiDu百度",
    jumpUrl: `https://www.baidu.com/s?tn=22073068_8_oem_dg&ch=2&ie=utf-8&word=&<query>`
  },
  {
    key: ["google", "gg"],
    label: "Google谷歌",
    jumpUrl: `https://www.google.com/search?q=&<query>`
  },
  {
    key: ["bi", "bing"],
    label: "Bing必应",
    jumpUrl: `https://www.bing.com/search?form=QBLH&q=&<query>&mkt=zh-CN`
  }
];

let jumpData = JSON.parse(localStorage.getItem("jumpData") || JSON.stringify(defaultJumpData));
let jumpToData = new Map(JSON.parse(localStorage.getItem("jumpToData") || "[]"));
let defaultKey = localStorage.getItem("defaultKey") || "bd";
let searchHint = null;

function initJumpData() {
  const newJumpToData = new Map();
  jumpData.forEach(data => {
    data.key.forEach(key => {
      newJumpToData.set(key, data);
    });
  });
  jumpToData = newJumpToData;
  localStorage.setItem("jumpToData", JSON.stringify(Array.from(newJumpToData.entries())));
}

window.addEventListener('storage', (e) => {
  if (e.key === 'jumpData') {
    jumpData = JSON.parse(e.newValue || JSON.stringify(defaultJumpData));
    initJumpData();
  } else if (e.key === 'jumpToData') {
    jumpToData = new Map(JSON.parse(e.newValue || "[]"));
  } else if (e.key === 'defaultKey') {
    defaultKey = e.newValue || "bd";
    updateSearchHint();
  }
});

if (!localStorage.getItem("jumpToData")) {
  initJumpData();
}
updateSearchHint();

function segmentationContent(medium, content) {
  const [firstPart, ...restParts] = content.split(medium);
  const remaining = restParts.join(' ');
  return [firstPart, remaining];
}

function jumpTo(jumpType, toData) {
  if (jumpType == null || jumpType == "") {
    jumpType = defaultKey;
  }
  if (jumpType == "cd") {
    const jumpData = jumpToData.get(toData);
    if (jumpData != null) {
      defaultKey = toData;
      localStorage.setItem("defaultKey", defaultKey);
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
    window.open(
      toUrl,
      "_blank",
      "noopener,noreferrer"
    );
  }
}

function updateSearchHint() {
  if (searchHint) {
    const currentEngine = jumpToData.get(defaultKey);
    if (currentEngine) {
      searchHint.textContent = `当前使用 ${currentEngine.label} 搜索`;
    }
  }
}