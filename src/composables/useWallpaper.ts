import { ref, onMounted } from 'vue';
import { storage } from '@/utils/storage';
import { loadImage, clearImageCache } from '@/utils/imageCache';
import {
    DEFAULT_WALLPAPER_SOURCE_ID,
    resolveWallpaperUrl,
    type WallpaperSourceId,
} from '@/utils/wallpaperSources';

export type BackgroundType = 'none' | 'source' | 'custom' | 'color';

export interface WallpaperState {
    type: BackgroundType;
    url: string;
    sourceUrl?: string;
    color?: string;
}

/** @deprecated 兼容旧配置；新逻辑以 wallpaperSourceId 为准 */
const DEFAULT_SOURCE_URL = 'https://picsum.photos/1920/1080';

// 使用 ref 存储壁纸状态
const wallpaperType = ref<BackgroundType>('none');
const wallpaperUrl = ref<string>(''); // 存储当前壁纸URL（可能是缓存后的数据URL）
const originalWallpaperUrl = ref<string>(''); // 存储原始壁纸URL（未缓存的URL）
const sourceUrl = ref<string>(DEFAULT_SOURCE_URL);
const wallpaperSourceId = ref<WallpaperSourceId>(DEFAULT_WALLPAPER_SOURCE_ID);
const wallhavenQuery = ref<string>('');
const wallhavenApiKey = ref<string>('');
const backgroundColor = ref<string>('#3498db'); // 默认背景颜色
const themeColor = ref<string>('#495057'); // 默认主色调（时间和图标的颜色）
const showMask = ref<boolean>(true); // 添加蒙版显示状态
const showTime = ref<boolean>(true); // 是否显示时间
const showSeconds = ref<boolean>(false);
const showDate = ref<boolean>(true);
const use24Hour = ref<boolean>(true); // 是否使用24小时制
const clockFont = ref<string>('Inter'); // 时钟字体
const clockFontSize = ref<number>(96);   // 时钟字体大小 (px)
const clockFontWeight = ref<number>(700); // 时钟字体粗细
const useCustomColor = ref<boolean>(false); // 是否使用自定义颜色

function migrateSourceId(config: { sourceUrl?: string; wallpaperSourceId?: string }): WallpaperSourceId {
    if (config.wallpaperSourceId) {
        return config.wallpaperSourceId as WallpaperSourceId;
    }
    const url = config.sourceUrl || '';
    if (!url || url.includes('picsum.photos')) return 'picsum';
    if (url.includes('bing.com')) return 'bing';
    if (url.includes('wallhaven')) return 'wallhaven-random';
    return 'custom';
}

export function useWallpaper() {
    // 定义配置对象类型
    interface AppConfig {
        wallpaperType: BackgroundType;
        wallpaperUrl: string;
        originalWallpaperUrl?: string; // 原始URL（未缓存的URL）
        sourceUrl: string;
        wallpaperSourceId?: WallpaperSourceId;
        wallhavenQuery?: string;
        wallhavenApiKey?: string;
        backgroundColor: string;
        themeColor: string;
        showMask: boolean;
        showTime: boolean;
        showSeconds: boolean;
        showDate: boolean;
        use24Hour: boolean;
        clockFont: string;
        clockFontSize: number;
        clockFontWeight: number;
        useCustomColor: boolean;
    }

    // 默认配置
    const defaultConfig: AppConfig = {
        wallpaperType: 'none',
        wallpaperUrl: '',
        originalWallpaperUrl: '', // 添加原始URL字段
        sourceUrl: DEFAULT_SOURCE_URL,
        wallpaperSourceId: DEFAULT_WALLPAPER_SOURCE_ID,
        wallhavenQuery: '',
        wallhavenApiKey: '',
        backgroundColor: '#3498db',
        themeColor: '#495057',
        showMask: true,
        showTime: true,
        showSeconds: false,
        showDate: true,
        use24Hour: true,
        clockFont: 'Inter',
        clockFontSize: 96,
        clockFontWeight: 700,
        useCustomColor: false
    };

    // 加载壁纸状态
    const loadState = async () => {
        try {
            let config: AppConfig = { ...defaultConfig };

            // 优先从 chrome.storage.local 获取
            if (chrome?.storage?.local) {
                const chromeData = await chrome.storage.local.get('appConfig');
                
                if (chromeData.appConfig) {
                    try {
                        // 如果存储的是字符串，尝试解析
                        const parsedConfig = typeof chromeData.appConfig === 'string' 
                            ? JSON.parse(chromeData.appConfig) 
                            : chromeData.appConfig;
                            
                        // 合并配置，确保所有必要的字段都存在
                        config = { ...defaultConfig, ...parsedConfig };
                    } catch (e) {
                        console.error('解析配置失败:', e);
                        // 使用默认配置
                    }
                } else {
                    // 兼容旧版存储方式，将单独存储的值合并到配置对象
                    const oldData = await chrome.storage.local.get([
                        'wallpaperType', 'wallpaperUrl', 'sourceUrl', 'backgroundColor', 
                        'themeColor', 'showMask', 'wallpaperHistory', 'showTime', 
                        'showSeconds', 'showDate', 'use24Hour'
                    ]);
                    
                    // 合并旧数据到配置对象
                    if (oldData) {
                        const oldConfig: Partial<AppConfig> = {};
                        
                        if (oldData.wallpaperType) oldConfig.wallpaperType = oldData.wallpaperType;
                        if (oldData.wallpaperUrl) oldConfig.wallpaperUrl = oldData.wallpaperUrl;
                        if (oldData.sourceUrl) oldConfig.sourceUrl = oldData.sourceUrl;
                        if (oldData.backgroundColor !== undefined) oldConfig.backgroundColor = oldData.backgroundColor;
                        if (oldData.themeColor !== undefined) oldConfig.themeColor = oldData.themeColor;
                        if (oldData.showMask !== undefined) oldConfig.showMask = oldData.showMask;
                        if (oldData.showTime !== undefined) oldConfig.showTime = oldData.showTime;
                        if (oldData.showSeconds !== undefined) oldConfig.showSeconds = oldData.showSeconds;
                        if (oldData.showDate !== undefined) oldConfig.showDate = oldData.showDate;
                        if (oldData.use24Hour !== undefined) oldConfig.use24Hour = oldData.use24Hour;
                        
                        // 历史记录功能已移除
                        
                        // 合并到配置
                        config = { ...defaultConfig, ...oldConfig };
                    }
                }
            } else {
                // 如果没有chrome.storage.local，从 localStorage 获取
                const localStorageConfig = localStorage.getItem('appConfig');
                
                if (localStorageConfig) {
                    try {
                        const parsedConfig = JSON.parse(localStorageConfig);
                        config = { ...defaultConfig, ...parsedConfig };
                    } catch (e) {
                        console.error('解析localStorage配置失败:', e);
                        // 使用默认配置
                    }
                } else {
                    // 兼容旧版存储方式，从单独的localStorage项中获取
                    const oldConfig: Partial<AppConfig> = {};
                    
                    const storedType = localStorage.getItem('wallpaperType') as BackgroundType;
                    const storedUrl = localStorage.getItem('wallpaperUrl');
                    const storedSourceUrl = localStorage.getItem('sourceUrl');
                    const storedThemeColor = localStorage.getItem('themeColor');
                    const storedBackgroundColor = localStorage.getItem('backgroundColor');
                    const storedShowMask = localStorage.getItem('showMask');
                    const storedShowTime = localStorage.getItem('showTime');
                    const storedShowSeconds = localStorage.getItem('showSeconds');
                    const storedShowDate = localStorage.getItem('showDate');
                    const storedUse24Hour = localStorage.getItem('use24Hour');
                    
                    if (storedType) oldConfig.wallpaperType = storedType;
                    if (storedUrl) oldConfig.wallpaperUrl = storedUrl;
                    if (storedSourceUrl) oldConfig.sourceUrl = storedSourceUrl;
                    if (storedThemeColor) oldConfig.themeColor = storedThemeColor;
                    if (storedBackgroundColor) oldConfig.backgroundColor = storedBackgroundColor;
                    if (storedShowMask) oldConfig.showMask = storedShowMask === 'true';
                    if (storedShowTime) oldConfig.showTime = storedShowTime === 'true';
                    if (storedShowSeconds) oldConfig.showSeconds = storedShowSeconds === 'true';
                    if (storedShowDate) oldConfig.showDate = storedShowDate === 'true';
                    if (storedUse24Hour) oldConfig.use24Hour = storedUse24Hour === 'true';
                    
                    // 合并到配置
                    config = { ...defaultConfig, ...oldConfig };
                }
            }

            // 更新响应式状态
            wallpaperType.value = config.wallpaperType;
            wallpaperUrl.value = config.wallpaperUrl || '';
            // 加载原始URL，如果没有则使用当前URL
            originalWallpaperUrl.value = config.originalWallpaperUrl || config.wallpaperUrl || '';
            sourceUrl.value = config.sourceUrl || DEFAULT_SOURCE_URL;
            wallpaperSourceId.value = migrateSourceId(config);
            wallhavenQuery.value = config.wallhavenQuery || '';
            wallhavenApiKey.value = config.wallhavenApiKey || '';
            backgroundColor.value = config.backgroundColor || '#3498db';
            themeColor.value = config.themeColor || '#495057';
            showMask.value = config.showMask;
            
            // 历史记录功能已移除
            
            showTime.value = config.showTime;
            showSeconds.value = config.showSeconds;
            showDate.value = config.showDate;
            use24Hour.value = config.use24Hour;
            clockFont.value = config.clockFont || 'Inter';
            clockFontSize.value = config.clockFontSize ?? 96;
            clockFontWeight.value = config.clockFontWeight ?? 700;
            useCustomColor.value = config.useCustomColor ?? false;
            
            // 如果是壁纸类型且没有从存储中获取到主色调，则设置为白色
            if ((config.wallpaperType === 'custom' || config.wallpaperType === 'source') && themeColor.value === '#495057') {
                themeColor.value = '#ffffff';
            }

            // 如果有壁纸URL，使用图片缓存功能加载
            if (config.wallpaperUrl && config.wallpaperType !== 'none') {
                try {
                    // 加载并缓存图片
                    const cachedUrl = await loadImage(config.wallpaperUrl);
                    wallpaperUrl.value = cachedUrl;
                } catch (error) {
                    console.error('加载缓存壁纸失败:', error);
                    wallpaperUrl.value = config.wallpaperUrl; // 如果缓存失败，使用原始URL
                }
            }

        } catch (error) {
            console.error('Failed to load wallpaper state:', error);
            wallpaperType.value = 'none';
            wallpaperUrl.value = '';
            originalWallpaperUrl.value = '';
            sourceUrl.value = DEFAULT_SOURCE_URL;
            wallpaperSourceId.value = DEFAULT_WALLPAPER_SOURCE_ID;
            wallhavenQuery.value = '';
            wallhavenApiKey.value = '';
            showMask.value = true;
            showTime.value = true;
            showSeconds.value = false;
            showDate.value = true;
            use24Hour.value = true;
        }
    };

    // 保存壁纸状态
    const saveState = async () => {
        try {
            // 创建配置对象
            const appConfig = {
                wallpaperType: wallpaperType.value,
                wallpaperUrl: wallpaperUrl.value,
                originalWallpaperUrl: originalWallpaperUrl.value, // 添加原始URL字段
                sourceUrl: sourceUrl.value,
                wallpaperSourceId: wallpaperSourceId.value,
                wallhavenQuery: wallhavenQuery.value,
                wallhavenApiKey: wallhavenApiKey.value,
                backgroundColor: backgroundColor.value,
                themeColor: themeColor.value,
                showMask: showMask.value,
                showTime: showTime.value,
                showSeconds: showSeconds.value,
                showDate: showDate.value,
                use24Hour: use24Hour.value,
                clockFont: clockFont.value,
                clockFontSize: clockFontSize.value,
                clockFontWeight: clockFontWeight.value,
                useCustomColor: useCustomColor.value
            };
            
            // 优先保存到 chrome.storage.local
            if (chrome?.storage?.local) {
                await chrome.storage.local.set({
                    appConfig: appConfig
                });
                
                // 删除旧的单独存储项，以减少存储空间使用
                await chrome.storage.local.remove([
                    'wallpaperType', 'wallpaperUrl', 'sourceUrl', 'backgroundColor', 
                    'themeColor', 'showMask', 'wallpaperHistory', 'showTime', 
                    'showSeconds', 'showDate', 'use24Hour'
                ]);
            }

            // 同时保存到 localStorage作为备份
            localStorage.setItem('appConfig', JSON.stringify(appConfig));
            
            // 删除旧的单独存储项
            localStorage.removeItem('wallpaperType');
            localStorage.removeItem('wallpaperUrl');
            localStorage.removeItem('sourceUrl');
            localStorage.removeItem('backgroundColor');
            localStorage.removeItem('themeColor');
            localStorage.removeItem('showMask');
            localStorage.removeItem('wallpaperHistory');
            localStorage.removeItem('showTime');
            localStorage.removeItem('showSeconds');
            localStorage.removeItem('showDate');
            localStorage.removeItem('use24Hour');
        } catch (error) {
            console.error('Failed to save wallpaper state:', error);
        }
    };

    // 从当前壁纸源拉取一张新图并应用
    const refreshSourceWallpaper = async () => {
        const imageUrl = await resolveWallpaperUrl(wallpaperSourceId.value, {
            customUrl: sourceUrl.value,
            wallhavenQuery: wallhavenQuery.value,
            wallhavenApiKey: wallhavenApiKey.value,
        });
        originalWallpaperUrl.value = imageUrl;
        try {
            wallpaperUrl.value = await loadImage(imageUrl);
        } catch (e) {
            console.error('壁纸源加载失败:', e);
            wallpaperUrl.value = imageUrl;
        }
        await saveState();
        return imageUrl;
    };

    // 切换壁纸源预设
    const updateWallpaperSource = async (id: WallpaperSourceId) => {
        wallpaperSourceId.value = id;
        if (wallpaperType.value === 'source') {
            await refreshSourceWallpaper();
        } else {
            await saveState();
        }
    };

    const updateWallhavenQuery = async (q: string) => {
        wallhavenQuery.value = q;
        await saveState();
    };

    const updateWallhavenApiKey = async (key: string) => {
        wallhavenApiKey.value = key;
        await saveState();
    };

    // 更新壁纸
    const updateWallpaper = async (type: BackgroundType, url: string = '') => {
        wallpaperType.value = type;

        // 如果是图片背景类型（自定义或壁纸源），将主色调设置为白色
        if ((type === 'custom' || type === 'source') && themeColor.value === '#495057') {
            themeColor.value = '#ffffff';
        }

        // 如果是颜色类型，不需要处理URL
        if (type === 'color') {
            wallpaperUrl.value = '';
            originalWallpaperUrl.value = '';
            await saveState();
            return;
        }

        // 壁纸源：走多源解析
        if (type === 'source') {
            await refreshSourceWallpaper();
            return;
        }

        // 自定义图片
        if (type === 'custom') {
            if (url) {
                originalWallpaperUrl.value = url;
                try {
                    wallpaperUrl.value = await loadImage(url);
                } catch (error) {
                    console.error('Failed to load and cache image:', error);
                    wallpaperUrl.value = url;
                }
            }
            await saveState();
            return;
        }

        // 无背景
        wallpaperUrl.value = '';
        originalWallpaperUrl.value = '';
        await saveState();
    };

    // 历史记录相关函数已移除

    // 更新壁纸源自定义 URL（custom 源）
    const updateSourceUrl = async (url: string) => {
        sourceUrl.value = url || DEFAULT_SOURCE_URL;
        wallpaperSourceId.value = 'custom';

        if (wallpaperType.value === 'source') {
            await refreshSourceWallpaper();
        } else {
            await saveState();
        }
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
        if (wallpaperType.value === 'color') {
            return {
                backgroundColor: backgroundColor.value,
                backgroundImage: 'none'
            };
        }
        return {};
    };

    // 清除指定壁纸的缓存
    const clearWallpaperCache = async (url: string) => {
        if (url) {
            await clearImageCache(url);
        }
    };
    
    // 更新背景颜色
    const updateBackgroundColor = async (color: string) => {
        backgroundColor.value = color;
        await saveState();
    };
    
    // 更新主色调（时间和图标的颜色）
    const updateThemeColor = async (color: string) => {
        themeColor.value = color;
        await saveState();
    };

    // 添加切换蒙版显示的方法
    const toggleMask = async (show: boolean) => {
        showMask.value = show;
        await saveState();
    };

    // 更新时间显示设置 - 显示秒
    const updateShowSeconds = async (show: boolean) => {
        showSeconds.value = show;
        await saveState();
    };

    // 更新时间显示设置 - 显示日期
    const updateShowDate = async (show: boolean) => {
        showDate.value = show;
        await saveState();
    };

    // 更新时间显示设置 - 是否显示时间
    const updateShowTime = async (show: boolean) => {
        showTime.value = show;
        await saveState();
    };

    // 更新时间显示设置 - 使用24小时制
    const updateUse24Hour = async (use24: boolean) => {
        use24Hour.value = use24;
        await saveState();
    };

    // 更新时钟字体
    const updateClockFont = async (font: string) => {
        clockFont.value = font;
        await saveState();
    };

    // 更新时钟字体大小
    const updateClockFontSize = async (size: number) => {
        clockFontSize.value = size;
        await saveState();
    };

    // 更新时钟字体粗细
    const updateClockFontWeight = async (weight: number) => {
        clockFontWeight.value = weight;
        await saveState();
    };

    // 更新是否使用自定义颜色
    const updateUseCustomColor = async (use: boolean) => {
        useCustomColor.value = use;
        await saveState();
    };

    // 组件挂载时自动加载状态
    onMounted(() => {
        loadState();
    });

    return {
        wallpaperType,
        wallpaperUrl,
        originalWallpaperUrl, // 添加原始URL
        sourceUrl,
        wallpaperSourceId,
        wallhavenQuery,
        wallhavenApiKey,
        backgroundColor,
        themeColor,
        showMask,
        showTime,
        showSeconds,
        showDate,
        use24Hour,
        clockFont,
        clockFontSize,
        clockFontWeight,
        useCustomColor,
        loadState,
        updateWallpaper,
        updateSourceUrl,
        updateWallpaperSource,
        refreshSourceWallpaper,
        updateWallhavenQuery,
        updateWallhavenApiKey,
        updateBackgroundColor,
        updateThemeColor,
        updateShowTime,
        updateShowSeconds,
        updateShowDate,
        updateUse24Hour,
        updateClockFont,
        updateClockFontSize,
        updateClockFontWeight,
        updateUseCustomColor,
        getWallpaperStyle,
        toggleMask,
        clearWallpaperCache
    };
}