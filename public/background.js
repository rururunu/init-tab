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
        console.log('Command received:', command);
        
        if (command === 'toggle-search') {
            try {
                const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
                if (!tab?.id || !tab?.url) {
                    console.error('Invalid tab:', tab);
                    return;
                }

                // 只在允许的URL上注入脚本
                if (tab.url.startsWith('http') || tab.url.startsWith('https')) {
                    try {
                        await chrome.scripting.executeScript({
                            target: { tabId: tab.id },
                            files: ['content-script.js']
                        });
                        console.log('Script injection successful');
                    } catch (e) {
                        // 忽略已注入的错误
                        if (!e.message.includes('Cannot access contents of url')) {
                            console.error('Script injection error:', e);
                        }
                    }

                    // 发送消息
                    await chrome.tabs.sendMessage(tab.id, { 
                        action: 'SHOW_SEARCH',
                        timestamp: Date.now()
                    });
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
}