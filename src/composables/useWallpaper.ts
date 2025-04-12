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

export function useWallpaper() {
    // 加载壁纸状态
    const loadState = async () => {
        try {
            // 优先从 chrome.storage.local 获取
            let storedType: BackgroundType | null = null;
            let storedUrl: string | null = null;
            let storedSourceUrl: string | null = null;

            if (chrome?.storage?.local) {
                const chromeData = await chrome.storage.local.get(['wallpaperType', 'wallpaperUrl', 'sourceUrl']);
                storedType = chromeData.wallpaperType || null;
                storedUrl = chromeData.wallpaperUrl || null;
                storedSourceUrl = chromeData.sourceUrl || null;
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

            // 更新响应式状态
            wallpaperType.value = storedType;
            wallpaperUrl.value = storedUrl;
            // 确保sourceUrl不为空，使用默认值
            sourceUrl.value = storedSourceUrl || DEFAULT_SOURCE_URL;

        } catch (error) {
            console.error('Failed to load wallpaper state:', error);
            // 如果出错，使用默认值
            wallpaperType.value = 'none';
            wallpaperUrl.value = '';
            sourceUrl.value = DEFAULT_SOURCE_URL;
        }
    };

    // 保存壁纸状态
    const saveState = async () => {
        try {
            // 确保sourceUrl不为空
            if (!sourceUrl.value) {
                sourceUrl.value = DEFAULT_SOURCE_URL;
            }
            
            // 同时保存到 chrome.storage.local 和 localStorage
            if (chrome?.storage?.local) {
                await chrome.storage.local.set({
                    wallpaperType: wallpaperType.value,
                    wallpaperUrl: wallpaperUrl.value,
                    sourceUrl: sourceUrl.value
                });
            }

            // 作为备份也保存到 localStorage
            localStorage.setItem('wallpaperType', wallpaperType.value);
            localStorage.setItem('wallpaperUrl', wallpaperUrl.value);
            localStorage.setItem('sourceUrl', sourceUrl.value);
        } catch (error) {
            console.error('Failed to save wallpaper state:', error);
        }
    };

    // 更新壁纸
    const updateWallpaper = async (type: BackgroundType, url: string = '') => {
        wallpaperType.value = type;
        if (type === 'custom' || type === 'source') {
            if (type === 'source' && !url) {
                // 如果是源类型但URL为空，使用当前的sourceUrl
                wallpaperUrl.value = sourceUrl.value || DEFAULT_SOURCE_URL;
            } else {
                wallpaperUrl.value = url;
            }
        } else {
            wallpaperUrl.value = '';
        }
        await saveState();
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

    // 组件挂载时自动加载状态
    onMounted(() => {
        loadState();
    });

    return {
        wallpaperType,
        wallpaperUrl,
        sourceUrl,
        updateWallpaper,
        updateSourceUrl,
        getWallpaperStyle,
        clearWallpaper,
        loadState,
        saveState,
    };
} 