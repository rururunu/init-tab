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

    const FAVICON_CACHE_PREFIX = 'favicon_';
    const FAVICON_TTL_MS = 7 * 24 * 60 * 60 * 1000;

    function getDomain(url) {
        try { return new URL(url).hostname; } catch { return ''; }
    }

    function blobToDataUrl(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }

    function parseFaviconEntry(stored) {
        if (typeof stored === 'string' && stored.startsWith('data:')) {
            return { dataUrl: stored, fetchedAt: 0 };
        }
        if (stored && typeof stored === 'object' && typeof stored.dataUrl === 'string' && stored.dataUrl.startsWith('data:')) {
            return {
                dataUrl: stored.dataUrl,
                fetchedAt: typeof stored.fetchedAt === 'number' ? stored.fetchedAt : 0,
            };
        }
        return null;
    }

    function isFaviconStale(fetchedAt) {
        return !fetchedAt || (Date.now() - fetchedAt > FAVICON_TTL_MS);
    }

    async function fetchAsDataUrl(url) {
        const res = await fetch(url, { credentials: 'omit' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const blob = await res.blob();
        if (!blob || !blob.type.startsWith('image/') || blob.size < 16) throw new Error('invalid favicon');
        return blobToDataUrl(blob);
    }

    /**
     * 按域名缓存 favicon（与 newtab iconCache 共用键与 TTL）
     * @param force 强制重新拉取并更新时间戳
     */
    async function getFaviconDataUrl(pageUrl, size = 32, force = false) {
        const domain = getDomain(pageUrl);
        if (!domain) throw new Error('Invalid URL');

        const cacheKey = FAVICON_CACHE_PREFIX + domain;
        const cached = await chrome.storage.local.get(cacheKey);
        const entry = parseFaviconEntry(cached[cacheKey]);

        // 未强制且缓存未过期 → 直接命中
        if (!force && entry && !isFaviconStale(entry.fetchedAt)) {
            return entry.dataUrl;
        }

        // 未强制但已过期：仍返回旧图（调用方可用 force 后台刷新）
        // 仅在 force 或完全缺失时联网
        const shouldFetch = force || !entry?.dataUrl;
        if (!shouldFetch) {
            return entry.dataUrl;
        }

        let dataUrl = '';
        try {
            dataUrl = await fetchAsDataUrl(
                `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=${size}`
            );
        } catch {
            // 避免直接请求 github.com 等易限流站点的 /favicon.ico
            const skipOriginFallback = /(^|\.)github\.com$/i.test(domain);
            if (!skipOriginFallback) {
                try {
                    dataUrl = await fetchAsDataUrl(new URL(pageUrl).origin + '/favicon.ico');
                } catch {
                    dataUrl = '';
                }
            }
        }

        // 拉取失败时，尽量回退旧缓存
        if ((!dataUrl || !dataUrl.startsWith('data:')) && entry?.dataUrl) {
            return entry.dataUrl;
        }

        if (dataUrl && dataUrl.startsWith('data:')) {
            try {
                await chrome.storage.local.set({
                    [cacheKey]: { dataUrl, fetchedAt: Date.now() },
                });
            } catch {
                // 配额不足时忽略持久化
            }
        }

        return dataUrl;
    }

    // 代理搜索建议 / favicon（content script 受 CORS 限制，由 background 代为 fetch）
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === 'FETCH_SUGGESTIONS') {
            fetch(request.url)
                .then(res => res.json())
                .then(data => sendResponse({ success: true, data }))
                .catch(err => sendResponse({ success: false, error: err.message }));
            return true;
        }

        if (request.action === 'FETCH_FAVICON') {
            getFaviconDataUrl(request.url, request.size || 32, !!request.force)
                .then(dataUrl => {
                    if (dataUrl) sendResponse({ success: true, dataUrl });
                    else sendResponse({ success: false, error: 'favicon unavailable' });
                })
                .catch(err => sendResponse({ success: false, error: err.message }));
            return true;
        }

        if (request.action === 'SEARCH_BOOKMARKS') {
            const q = String(request.query || '').trim();
            if (!q) {
                sendResponse({ success: true, results: [] });
                return true;
            }
            chrome.bookmarks.search(q)
                .then((results) => {
                    sendResponse({
                        success: true,
                        results: (results || []).filter((b) => b.url),
                    });
                })
                .catch((err) => sendResponse({ success: false, error: err?.message || String(err) }));
            return true;
        }

        // ChatGPT：在页面主世界填词并点击发送（隔离世界点 disabled 按钮无效）
        if (request.action === 'CHATGPT_FILL_SEND') {
            const tabId = sender.tab?.id;
            if (!tabId) {
                sendResponse({ success: false, error: 'no tab' });
                return true;
            }
            chrome.scripting.executeScript({
                target: { tabId },
                world: 'MAIN',
                args: [String(request.prompt || ''), request.autoSend !== false],
                func: async (text, shouldSend) => {
                    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

                    const findEditor = () =>
                        document.querySelector('div#prompt-textarea[contenteditable="true"]') ||
                        document.querySelector('#prompt-textarea') ||
                        document.querySelector('div.ProseMirror[contenteditable="true"]') ||
                        document.querySelector('textarea[data-testid="prompt-textarea"]') ||
                        document.querySelector('textarea#prompt-textarea');

                    const findSend = () =>
                        document.querySelector('button[data-testid="send-button"]') ||
                        document.querySelector('button[data-testid="fruitjuice-send-button"]') ||
                        document.querySelector('button[aria-label="Send prompt"]') ||
                        document.querySelector('button[aria-label*="Send prompt"]');

                    const isEnabled = (btn) =>
                        !!btn &&
                        !btn.disabled &&
                        btn.getAttribute('aria-disabled') !== 'true' &&
                        !btn.hasAttribute('disabled');

                    let editor = null;
                    for (let i = 0; i < 80; i++) {
                        editor = findEditor();
                        if (editor) break;
                        await sleep(200);
                    }
                    if (!editor) return { ok: false, reason: 'no-editor' };

                    editor.focus();
                    await sleep(50);

                    // 选中全部后 insertText，让 ProseMirror 真正更新内部状态
                    try {
                        const sel = window.getSelection();
                        const range = document.createRange();
                        range.selectNodeContents(editor);
                        sel.removeAllRanges();
                        sel.addRange(range);
                    } catch (_) {}

                    let inserted = false;
                    try {
                        inserted = document.execCommand('insertText', false, text);
                    } catch (_) {
                        inserted = false;
                    }

                    // insertText 失败时用 paste 事件（ProseMirror 可识别）
                    if (!inserted) {
                        try {
                            const dt = new DataTransfer();
                            dt.setData('text/plain', text);
                            editor.dispatchEvent(
                                new ClipboardEvent('paste', {
                                    bubbles: true,
                                    cancelable: true,
                                    clipboardData: dt,
                                })
                            );
                        } catch (_) {}
                    }

                    // 同步可能存在的 fallback textarea
                    try {
                        const form = editor.closest('form');
                        const ta = form && form.querySelector('textarea');
                        if (ta) {
                            const desc = Object.getOwnPropertyDescriptor(
                                HTMLTextAreaElement.prototype,
                                'value'
                            );
                            if (desc && desc.set) desc.set.call(ta, text);
                            else ta.value = text;
                            ta.dispatchEvent(new Event('input', { bubbles: true }));
                        }
                    } catch (_) {}

                    if (!shouldSend) return { ok: true, sent: false };

                    // 等发送按钮真正启用再点（不要点 disabled）
                    for (let i = 0; i < 80; i++) {
                        const btn = findSend();
                        if (isEnabled(btn)) {
                            btn.focus();
                            btn.click();
                            await sleep(300);
                            const stopped = document.querySelector(
                                'button[data-testid="stop-button"], button[aria-label*="Stop"]'
                            );
                            return { ok: true, sent: true, confirmed: !!stopped };
                        }
                        await sleep(150);
                    }

                    // 仍未启用：再尝试一次 insertText 后点
                    try {
                        editor.focus();
                        document.execCommand('selectAll', false);
                        document.execCommand('insertText', false, text);
                        await sleep(400);
                        const btn = findSend();
                        if (btn) {
                            btn.removeAttribute('disabled');
                            btn.setAttribute('aria-disabled', 'false');
                            btn.click();
                        }
                    } catch (_) {}

                    return { ok: true, sent: true, confirmed: false };
                },
            })
                .then((results) => {
                    sendResponse({ success: true, result: results?.[0]?.result });
                })
                .catch((err) => {
                    sendResponse({ success: false, error: err?.message || String(err) });
                });
            return true;
        }

        // Gemini：主世界填词并发送（Angular contenteditable 需真实 input 事件）
        if (request.action === 'GEMINI_FILL_SEND') {
            const tabId = sender.tab?.id;
            if (!tabId) {
                sendResponse({ success: false, error: 'no tab' });
                return true;
            }
            chrome.scripting.executeScript({
                target: { tabId },
                world: 'MAIN',
                args: [String(request.prompt || ''), request.autoSend !== false],
                func: async (text, shouldSend) => {
                    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

                    const findEditor = () =>
                        document.querySelector('rich-textarea [contenteditable="true"]') ||
                        document.querySelector('div.ql-editor[contenteditable="true"]') ||
                        document.querySelector('div[contenteditable="true"][role="textbox"]') ||
                        document.querySelector('[contenteditable="true"]');

                    const findSend = () => {
                        const sels = [
                            'button[aria-label*="Send"]',
                            'button[aria-label*="发送"]',
                            'button[aria-label*="提交"]',
                            'button[mattooltip*="Send"]',
                            'button[mattooltip*="发送"]',
                            'button[data-testid*="send"]',
                        ];
                        for (const sel of sels) {
                            const btn = document.querySelector(sel);
                            if (btn) return btn;
                        }
                        return null;
                    };

                    const isEnabled = (btn) =>
                        !!btn &&
                        !btn.disabled &&
                        btn.getAttribute('aria-disabled') !== 'true' &&
                        !btn.hasAttribute('disabled');

                    let editor = null;
                    for (let i = 0; i < 80; i++) {
                        editor = findEditor();
                        if (editor) break;
                        await sleep(200);
                    }
                    if (!editor) return { ok: false, reason: 'no-editor' };

                    editor.focus();
                    await sleep(50);

                    try {
                        const sel = window.getSelection();
                        const range = document.createRange();
                        range.selectNodeContents(editor);
                        sel.removeAllRanges();
                        sel.addRange(range);
                    } catch (_) {}

                    let inserted = false;
                    try {
                        inserted = document.execCommand('insertText', false, text);
                    } catch (_) {
                        inserted = false;
                    }

                    if (!inserted) {
                        editor.textContent = text;
                        editor.dispatchEvent(
                            new InputEvent('input', {
                                bubbles: true,
                                cancelable: true,
                                inputType: 'insertText',
                                data: text,
                            })
                        );
                    }

                    editor.dispatchEvent(new Event('input', { bubbles: true }));
                    editor.dispatchEvent(new Event('change', { bubbles: true }));

                    if (!shouldSend) return { ok: true, sent: false };

                    for (let i = 0; i < 80; i++) {
                        const btn = findSend();
                        if (isEnabled(btn)) {
                            btn.focus();
                            btn.click();
                            return { ok: true, sent: true };
                        }
                        await sleep(150);
                    }

                    // 兜底：Enter
                    try {
                        editor.focus();
                        editor.dispatchEvent(
                            new KeyboardEvent('keydown', {
                                key: 'Enter',
                                code: 'Enter',
                                keyCode: 13,
                                which: 13,
                                bubbles: true,
                            })
                        );
                    } catch (_) {}

                    return { ok: true, sent: true, fallback: 'enter' };
                },
            })
                .then((results) => {
                    sendResponse({ success: true, result: results?.[0]?.result });
                })
                .catch((err) => {
                    sendResponse({ success: false, error: err?.message || String(err) });
                });
            return true;
        }
    });
}
