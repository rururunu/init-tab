import { storage } from './storage';

const IMAGE_CACHE_PREFIX = 'img_cache_';
const IMAGE_CACHE_META_KEY = 'img_cache_meta';
const SIZE_LIMIT = 5 * 1024 * 1024;
const TOTAL_SIZE_LIMIT = 40 * 1024 * 1024;

type ImageCacheMeta = Record<string, { size: number; lastUsed: number }>;
const pendingTouches = new Map<string, number | undefined>();
let touchTimer: ReturnType<typeof setTimeout> | undefined;

const getCacheKey = (url: string): string => {
  return IMAGE_CACHE_PREFIX + btoa(url).replace(/[+/=]/g, '');
};

const readCacheMeta = async (): Promise<ImageCacheMeta> => {
  const stored = await storage.get<string | ImageCacheMeta>(IMAGE_CACHE_META_KEY);
  if (!stored) return {};
  try {
    const parsed = typeof stored === 'string' ? JSON.parse(stored) : stored;
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed as ImageCacheMeta : {};
  } catch {
    return {};
  }
};

const writeCacheMeta = async (meta: ImageCacheMeta): Promise<void> => {
  await storage.set(IMAGE_CACHE_META_KEY, JSON.stringify(meta));
};

const pruneImageCache = async (meta: ImageCacheMeta, protectedKey?: string): Promise<ImageCacheMeta> => {
  let total = Object.values(meta).reduce((sum, item) => sum + (Number(item.size) || 0), 0);
  if (total <= TOTAL_SIZE_LIMIT) return meta;

  const entries = Object.entries(meta)
    .filter(([key]) => key !== protectedKey)
    .sort(([, a], [, b]) => (a.lastUsed || 0) - (b.lastUsed || 0));

  for (const [key, item] of entries) {
    if (total <= TOTAL_SIZE_LIMIT) break;
    await storage.remove(key);
    total -= Number(item.size) || 0;
    delete meta[key];
  }

  return meta;
};

const touchCacheEntry = async (cacheKey: string, size?: number): Promise<void> => {
  try {
    const meta = await readCacheMeta();
    const previousSize = meta[cacheKey]?.size ?? size ?? 0;
    meta[cacheKey] = {
      size: size ?? previousSize,
      lastUsed: Date.now(),
    };
    await writeCacheMeta(await pruneImageCache(meta, cacheKey));
  } catch {
  }
};

const flushPendingTouches = async (): Promise<void> => {
  touchTimer = undefined;
  if (pendingTouches.size === 0) return;

  const touches = [...pendingTouches.entries()];
  pendingTouches.clear();

  try {
    const meta = await readCacheMeta();
    const now = Date.now();
    for (const [cacheKey, size] of touches) {
      meta[cacheKey] = {
        size: size ?? meta[cacheKey]?.size ?? 0,
        lastUsed: now,
      };
    }
    await writeCacheMeta(await pruneImageCache(meta));
  } catch {
  }
};

const scheduleCacheTouch = (cacheKey: string, size?: number): void => {
  pendingTouches.set(cacheKey, size ?? pendingTouches.get(cacheKey));
  if (!touchTimer) {
    touchTimer = setTimeout(() => {
      void flushPendingTouches();
    }, 1000);
  }
};

const compressImage = (imageData: string, quality: number = 0.7): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('无法创建canvas上下文'));
        return;
      }

      canvas.width = img.width;
      canvas.height = img.height;
      
      ctx.drawImage(img, 0, 0);
      
      const compressedData = canvas.toDataURL('image/jpeg', quality);
      resolve(compressedData);
    };
    
    img.onerror = () => {
      reject(new Error('图片加载失败'));
    };
    
    img.src = imageData;
  });
};

const getDataUrlSize = (dataUrl: string): number => {
  const base64 = dataUrl.split(',')[1];
  if (!base64) return new Blob([dataUrl]).size;
  return Math.ceil((base64.length * 3) / 4);
};

export const getCachedImage = async (url: string): Promise<string | null> => {
  try {
    const cacheKey = getCacheKey(url);
    const cached = await storage.get<string>(cacheKey);
    if (cached) scheduleCacheTouch(cacheKey);
    return cached;
  } catch (error) {
    console.error('获取缓存图片失败:', error);
    return null;
  }
};

export const cacheImage = async (url: string): Promise<string> => {
  try {
    const cachedImage = await getCachedImage(url);
    if (cachedImage) {
      return cachedImage;
    }

    const response = await fetch(url);
    const blob = await response.blob();
    
    const dataUrl = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
    
    let finalDataUrl = dataUrl;
    let size = getDataUrlSize(dataUrl);
    
    if (size > SIZE_LIMIT) {
      console.log(`图片大小超过限制 (${(size / 1024 / 1024).toFixed(2)}MB)，进行压缩`);
      
      let quality = 0.7;
      finalDataUrl = await compressImage(dataUrl, quality);
      size = getDataUrlSize(finalDataUrl);
      
      while (size > SIZE_LIMIT && quality > 0.1) {
        quality -= 0.1;
        finalDataUrl = await compressImage(dataUrl, quality);
        size = getDataUrlSize(finalDataUrl);
      }
      
      console.log(`压缩后图片大小: ${(size / 1024 / 1024).toFixed(2)}MB，压缩质量: ${quality.toFixed(1)}`);
    }
    
    const cacheKey = getCacheKey(url);
    await storage.set(cacheKey, finalDataUrl);
    await touchCacheEntry(cacheKey, getDataUrlSize(finalDataUrl));
    
    return finalDataUrl;
  } catch (error) {
    console.error('缓存图片失败:', error);
    return url;
  }
};

export const loadImage = async (url: string): Promise<string> => {
  if (!url) return '';
  
  try {
    if (url.startsWith('data:')) {
      return url;
    }
    
    const cachedImage = await getCachedImage(url);
    if (cachedImage) {
      return cachedImage;
    }
    
    return await cacheImage(url);
  } catch (error) {
    console.error('加载图片失败:', error);
    return url;
  }
};

export const clearImageCache = async (url: string): Promise<void> => {
  try {
    const cacheKey = getCacheKey(url);
    await storage.remove(cacheKey);
    const meta = await readCacheMeta();
    delete meta[cacheKey];
    await writeCacheMeta(meta);
  } catch (error) {
    console.error('清除图片缓存失败:', error);
  }
};

export const clearAllImageCache = async (): Promise<void> => {
  try {
    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
      const items = await chrome.storage.local.get(null);
      const keys = Object.keys(items).filter(key => key.startsWith(IMAGE_CACHE_PREFIX));
      
      for (const key of keys) {
        await chrome.storage.local.remove(key);
      }
      await chrome.storage.local.remove(IMAGE_CACHE_META_KEY);
    } else {
      const keys = Object.keys(localStorage).filter(key => key.startsWith(IMAGE_CACHE_PREFIX));
      for (const key of keys) {
        localStorage.removeItem(key);
      }
      localStorage.removeItem(IMAGE_CACHE_META_KEY);
    }
  } catch (error) {
    console.error('清除所有图片缓存失败:', error);
  }
};
