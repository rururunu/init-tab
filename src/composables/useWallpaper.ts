import { ref, onMounted } from 'vue';
import { storage } from '@/utils/storage';

export type BackgroundType = 'none' | 'source' | 'custom';

export interface WallpaperState {
    type: BackgroundType;
    url: string;
    sourceUrl?: string;
}

// 默认壁纸源URL
const DEFAULT_SOURCE_URL = 'https://picsum.photos/1920/1080';

// 使用 ref 存储壁纸状态
const wallpaperType = ref<BackgroundType>('none');
const wallpaperUrl = ref<string>('');
const sourceUrl = ref<string>(DEFAULT_SOURCE_URL);
const showMask = ref<boolean>(true); // 添加蒙版显示状态
const historyList = ref<Array<{ url: string; timestamp: number }>>([]);

export function useWallpaper() {
    // 加载壁纸状态
    const loadState = async () => {
        try {
            // 优先从 chrome.storage.local 获取
            let storedType: BackgroundType | null = null;
            let storedUrl: string | null = null;
            let storedSourceUrl: string | null = null;
            let storedShowMask: boolean | null = null;
            let storedHistory: Array<{ url: string; timestamp: number }> | null = null;

            if (chrome?.storage?.local) {
                const chromeData = await chrome.storage.local.get(['wallpaperType', 'wallpaperUrl', 'sourceUrl', 'showMask', 'wallpaperHistory']);
                storedType = chromeData.wallpaperType || null;
                storedUrl = chromeData.wallpaperUrl || null;
                storedSourceUrl = chromeData.sourceUrl || null;
                storedShowMask = chromeData.showMask ?? true;
                storedHistory = JSON.parse(chromeData.wallpaperHistory) || null;
            }

            // 如果 chrome.storage.local 没有值，从 localStorage 获取
            if (!storedType) {
                storedType = localStorage.getItem('wallpaperType') as BackgroundType || 'none';
            }
            if (!storedUrl) {
                storedUrl = localStorage.getItem('wallpaperUrl') || '';
            }
            if (!storedSourceUrl) {
                storedSourceUrl = localStorage.getItem('sourceUrl') || '';
            }
            if (storedShowMask === null) {
                storedShowMask = localStorage.getItem('showMask') === 'false' ? false : true;
            }
            if (storedHistory === null) {
                storedHistory = JSON.parse(localStorage.getItem('wallpaperHistory') || '[]');
            }

            // 更新响应式状态
            wallpaperType.value = storedType;
            wallpaperUrl.value = storedUrl;
            sourceUrl.value = storedSourceUrl || DEFAULT_SOURCE_URL;
            showMask.value = storedShowMask;
            historyList.value = storedHistory;

        } catch (error) {
            console.error('Failed to load wallpaper state:', error);
            wallpaperType.value = 'none';
            wallpaperUrl.value = '';
            sourceUrl.value = DEFAULT_SOURCE_URL;
            showMask.value = true;
            historyList.value = [];
        }
    };

    // 保存壁纸状态
    const saveState = async () => {
        try {
            if (!sourceUrl.value) {
                sourceUrl.value = DEFAULT_SOURCE_URL;
            }
            
            if (chrome?.storage?.local) {
                await chrome.storage.local.set({
                    wallpaperType: wallpaperType.value,
                    wallpaperUrl: wallpaperUrl.value,
                    sourceUrl: sourceUrl.value,
                    showMask: showMask.value,
                    wallpaperHistory: JSON.stringify(historyList.value)
                });
            }

            localStorage.setItem('wallpaperType', wallpaperType.value);
            localStorage.setItem('wallpaperUrl', wallpaperUrl.value);
            localStorage.setItem('sourceUrl', sourceUrl.value);
            localStorage.setItem('showMask', showMask.value.toString());
            localStorage.setItem('wallpaperHistory', JSON.stringify(historyList.value));
        } catch (error) {
            console.error('Failed to save wallpaper state:', error);
        }
    };

    // 更新壁纸
    const updateWallpaper = async (type: BackgroundType, url: string = '') => {
        wallpaperType.value = type;
        wallpaperUrl.value = url; // 直接使用传入的URL
        
        // 保存到存储
        if (chrome?.storage?.local) {
            await chrome.storage.local.set({
                wallpaperType: type,
                wallpaperUrl: url
            });
        }
        
        localStorage.setItem('wallpaperType', type);
        localStorage.setItem('wallpaperUrl', url);
        
        // 添加到历史记录
        if (type === 'custom') {
            addToHistory(url);
        }
        
        await saveState();
    };

    // 添加到历史记录
    const addToHistory = (url: string) => {
        // 检查是否已存在
        const existingIndex = historyList.value.findIndex(item => item.url === url);
        if (existingIndex !== -1) {
            // 如果存在，更新时间戳
            historyList.value[existingIndex].timestamp = Date.now();
        } else {
            // 如果不存在，添加到开头
            historyList.value.unshift({
                url,
                timestamp: Date.now()
            });
        }
        // 限制历史记录数量为10条
        if (historyList.value.length > 10) {
            historyList.value = historyList.value.slice(0, 10);
        }
        saveState();
    };

    // 从历史记录中删除
    const removeFromHistory = (url: string) => {
        historyList.value = historyList.value.filter(item => item.url !== url);
        saveState();
    };

    // 从历史记录切换壁纸
    const switchFromHistory = async (url: string) => {
        try {
            // 更新壁纸类型和URL
            wallpaperType.value = 'custom';
            wallpaperUrl.value = url;
            
            // 保存到存储
            if (chrome?.storage?.local) {
                await chrome.storage.local.set({
                    wallpaperType: 'custom',
                    wallpaperUrl: url
                });
            }
            
            localStorage.setItem('wallpaperType', 'custom');
            localStorage.setItem('wallpaperUrl', url);
            
            // 保存状态
            await saveState();
        } catch (e) {
            console.error('切换历史壁纸失败:', e);
        }
    };

    // 更新壁纸源
    const updateSourceUrl = async (url: string) => {
        // 确保URL不为空
        sourceUrl.value = url || DEFAULT_SOURCE_URL;
        
        // 如果当前使用的是源壁纸，同时更新壁纸URL
        if (wallpaperType.value === 'source') {
            wallpaperUrl.value = sourceUrl.value;
        }
        
        await saveState();
    };

    // 获取当前壁纸样式
    const getWallpaperStyle = () => {
        if (wallpaperType.value === 'none') {
            return {}; // 返回空对象，使用默认样式
        }
        if (wallpaperType.value === 'source' || (wallpaperType.value === 'custom' && wallpaperUrl.value)) {
            return {
                backgroundImage: `url("${wallpaperUrl.value}")`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat'
            };
        }
        return {};
    };

    const clearWallpaper = async () => {
        wallpaperType.value = 'none';
        wallpaperUrl.value = '';
        await storage.remove('wallpaperState');
    };

    // 添加切换蒙版显示的方法
    const toggleMask = async (show: boolean) => {
        showMask.value = show;
        await saveState();
    };

    // 组件挂载时自动加载状态
    onMounted(() => {
        loadState();
    });

    return {
        wallpaperType,
        wallpaperUrl,
        sourceUrl,
        showMask,
        historyList,
        updateWallpaper,
        updateSourceUrl,
        getWallpaperStyle,
        clearWallpaper,
        loadState,
        saveState,
        toggleMask,
        removeFromHistory,
        switchFromHistory
    };
} 