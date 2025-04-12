// 检查 chrome.storage.local 是否可用
export const isChromeStorageAvailable = (): boolean => {
  return (
    typeof chrome !== "undefined" &&
    chrome.storage &&
    typeof chrome.storage.local !== "undefined"
  );
};

// 通用存储接口
export const storage = {
  async set(key: string, value: any): Promise<void> {
    try {
      if (isChromeStorageAvailable()) {
        await chrome.storage.local.set({ [key]: value });
      } else {
        localStorage.setItem(key, value);
      }
    } catch (e) {
      console.error("Storage set error:", e);
      // 如果 chrome.storage 失败，尝试使用 localStorage
      try {
        localStorage.setItem(key, value);
      } catch (localError) {
        console.error("LocalStorage set error:", localError);
        throw localError;
      }
    }
  },

  async get<T>(key: string): Promise<T | null> {
    try {
      if (isChromeStorageAvailable()) {
        const result = await chrome.storage.local.get(key);
        return result[key] || null;
      } else {
        const item = localStorage.getItem(key);
        return item ? (item as any) : null;
      }
    } catch (e) {
      console.error("Storage get error:", e);
      // 如果 chrome.storage 失败，尝试使用 localStorage
      try {
        const item = localStorage.getItem(key);
        return item ? (item as any) : null;
      } catch (localError) {
        console.error("LocalStorage get error:", localError);
        return null;
      }
    }
  },

  async remove(key: string): Promise<void> {
    try {
      if (isChromeStorageAvailable()) {
        await chrome.storage.local.remove(key);
      } else {
        localStorage.removeItem(key);
      }
    } catch (e) {
      console.error("Storage remove error:", e);
      // 如果 chrome.storage 失败，尝试使用 localStorage
      try {
        localStorage.removeItem(key);
      } catch (localError) {
        console.error("LocalStorage remove error:", localError);
        throw localError;
      }
    }
  },
};
