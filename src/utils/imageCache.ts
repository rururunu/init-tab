// 图片缓存工具
import { storage } from './storage';

// 图片缓存键前缀
const IMAGE_CACHE_PREFIX = 'img_cache_';
// 图片大小限制 (5MB)
const SIZE_LIMIT = 5 * 1024 * 1024;

/**
 * 将图片URL转换为缓存键
 * @param url 图片URL
 * @returns 缓存键
 */
const getCacheKey = (url: string): string => {
  return IMAGE_CACHE_PREFIX + btoa(url).replace(/[+/=]/g, '');
};

/**
 * 压缩图片
 * @param imageData 图片数据
 * @param quality 质量 (0-1)
 * @returns Promise<string> 压缩后的图片数据URL
 */
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

      // 设置canvas尺寸与图片相同
      canvas.width = img.width;
      canvas.height = img.height;
      
      // 绘制图片到canvas
      ctx.drawImage(img, 0, 0);
      
      // 转换为dataURL并压缩
      const compressedData = canvas.toDataURL('image/jpeg', quality);
      resolve(compressedData);
    };
    
    img.onerror = () => {
      reject(new Error('图片加载失败'));
    };
    
    img.src = imageData;
  });
};

/**
 * 计算数据URL的大小（字节）
 * @param dataUrl 数据URL
 * @returns 大小（字节）
 */
const getDataUrlSize = (dataUrl: string): number => {
  // 移除 "data:image/jpeg;base64," 部分
  const base64 = dataUrl.split(',')[1];
  // base64 编码后的大小约为原始大小的 4/3
  return Math.ceil((base64.length * 3) / 4);
};

/**
 * 获取缓存的图片
 * @param url 图片URL
 * @returns Promise<string | null> 缓存的图片数据URL或null
 */
export const getCachedImage = async (url: string): Promise<string | null> => {
  try {
    const cacheKey = getCacheKey(url);
    return await storage.get<string>(cacheKey);
  } catch (error) {
    console.error('获取缓存图片失败:', error);
    return null;
  }
};

/**
 * 缓存图片
 * @param url 图片URL
 * @returns Promise<string> 图片数据URL
 */
export const cacheImage = async (url: string): Promise<string> => {
  try {
    // 检查缓存
    const cachedImage = await getCachedImage(url);
    if (cachedImage) {
      return cachedImage;
    }

    // 获取图片数据
    const response = await fetch(url);
    const blob = await response.blob();
    
    // 转换为 Data URL
    const dataUrl = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
    
    // 检查大小并在需要时压缩
    let finalDataUrl = dataUrl;
    let size = getDataUrlSize(dataUrl);
    
    if (size > SIZE_LIMIT) {
      console.log(`图片大小超过限制 (${(size / 1024 / 1024).toFixed(2)}MB)，进行压缩`);
      
      // 初始压缩质量
      let quality = 0.7;
      finalDataUrl = await compressImage(dataUrl, quality);
      size = getDataUrlSize(finalDataUrl);
      
      // 如果仍然超过限制，继续压缩
      while (size > SIZE_LIMIT && quality > 0.1) {
        quality -= 0.1;
        finalDataUrl = await compressImage(dataUrl, quality);
        size = getDataUrlSize(finalDataUrl);
      }
      
      console.log(`压缩后图片大小: ${(size / 1024 / 1024).toFixed(2)}MB，压缩质量: ${quality.toFixed(1)}`);
    }
    
    // 保存到缓存
    const cacheKey = getCacheKey(url);
    await storage.set(cacheKey, finalDataUrl);
    
    return finalDataUrl;
  } catch (error) {
    console.error('缓存图片失败:', error);
    // 如果缓存失败，返回原始URL
    return url;
  }
};

/**
 * 加载图片，优先从缓存获取，如果缓存不存在则下载并缓存
 * @param url 图片URL
 * @returns Promise<string> 图片URL或数据URL
 */
export const loadImage = async (url: string): Promise<string> => {
  if (!url) return '';
  
  try {
    // 如果是本地数据URL，直接返回
    if (url.startsWith('data:')) {
      return url;
    }
    
    // 尝试从缓存获取
    const cachedImage = await getCachedImage(url);
    if (cachedImage) {
      return cachedImage;
    }
    
    // 缓存并返回
    return await cacheImage(url);
  } catch (error) {
    console.error('加载图片失败:', error);
    // 出错时返回原始URL
    return url;
  }
};

/**
 * 清除指定URL的图片缓存
 * @param url 图片URL
 */
export const clearImageCache = async (url: string): Promise<void> => {
  try {
    const cacheKey = getCacheKey(url);
    await storage.remove(cacheKey);
  } catch (error) {
    console.error('清除图片缓存失败:', error);
  }
};

/**
 * 清除所有图片缓存
 */
export const clearAllImageCache = async (): Promise<void> => {
  try {
    // 获取所有存储键
    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
      const items = await chrome.storage.local.get(null);
      const keys = Object.keys(items).filter(key => key.startsWith(IMAGE_CACHE_PREFIX));
      
      // 逐个删除
      for (const key of keys) {
        await chrome.storage.local.remove(key);
      }
    } else {
      // 如果不是在Chrome扩展环境，使用localStorage
      const keys = Object.keys(localStorage).filter(key => key.startsWith(IMAGE_CACHE_PREFIX));
      for (const key of keys) {
        localStorage.removeItem(key);
      }
    }
  } catch (error) {
    console.error('清除所有图片缓存失败:', error);
  }
};
