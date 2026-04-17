// 1. 更严格的环境检查
const isExtensionEnvironment = typeof chrome !== 'undefined' && 
    chrome.runtime && 
    chrome.runtime.onMessage && 
    chrome.commands && 
    chrome.tabs;

// 2. 存储工具
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
            try {
                localStorage.setItem(key, JSON.stringify(value));
            } catch (localError) {
                console.error('LocalStorage set error:', localError);
            }
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
            try {
                const item = localStorage.getItem(key);
                return item ? JSON.parse(item) : null;
            } catch (localError) {
                console.error('LocalStorage get error:', localError);
                return null;
            }
        }
    }
};

// 3. 将所有扩展API调用包装在环境检查中
if (isExtensionEnvironment) {
    // 监听快捷键命令
    chrome.commands.onCommand.addListener(async (command) => {
        
        if (command === 'toggle-search') {
            try {
                const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
                if (!tab?.id || !tab?.url) {
                    console.error('Invalid tab:', tab);
                    return;
                }

                // content-script.js 已通过 manifest content_scripts 自动注入，直接发消息即可
                if (tab.url.startsWith('http') || tab.url.startsWith('https')) {
                    try {
                        await chrome.tabs.sendMessage(tab.id, {
                            action: 'SHOW_SEARCH',
                            timestamp: Date.now()
                        });
                    } catch (e) {
                        console.error('SendMessage error:', e);
                    }
                }
            } catch (error) {
                console.error('Command handling error:', error);
            }
        }
    });

    // 只在安装时执行的代码
    chrome.runtime.onInstalled.addListener((details) => {
        console.log('Extension installed/updated:', details.reason);
    });

    // 代理搜索建议请求（content script 受 CORS 限制，由 background 代为 fetch）
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === 'FETCH_SUGGESTIONS') {
            fetch(request.url)
                .then(res => res.json())
                .then(data => sendResponse({ success: true, data }))
                .catch(err => sendResponse({ success: false, error: err.message }));
            return true; // 保持消息通道开放以支持异步响应
        }
    });
}