export const isChromeStorageAvailable = (): boolean => {
  return (
    typeof chrome !== "undefined" &&
    chrome.storage &&
    typeof chrome.storage.local !== "undefined"
  );
};

const STORAGE_EVENT = "gs-storage-change";

type StorageChangeMap = Record<string, { oldValue?: unknown; newValue?: unknown }>;

const notifyLocalChange = (changes: StorageChangeMap) => {
  try {
    window.dispatchEvent(new CustomEvent(STORAGE_EVENT, { detail: changes }));
  } catch {
  }
};

const setLocalValue = (key: string, value: any) => {
  const oldValue = localStorage.getItem(key);
  localStorage.setItem(key, value);
  notifyLocalChange({ [key]: { oldValue, newValue: value } });
};

const getLocalValue = <T>(key: string): T | null => {
  const item = localStorage.getItem(key);
  return item ? (item as T) : null;
};

const removeLocalValue = (key: string) => {
  const oldValue = localStorage.getItem(key);
  localStorage.removeItem(key);
  notifyLocalChange({ [key]: { oldValue, newValue: undefined } });
};

export const storage = {
  async set(key: string, value: any): Promise<void> {
    try {
      if (isChromeStorageAvailable()) {
        await chrome.storage.local.set({ [key]: value });
      } else {
        setLocalValue(key, value);
      }
    } catch (e) {
      console.error("Storage set error:", e);
      try {
        setLocalValue(key, value);
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
        return Object.prototype.hasOwnProperty.call(result, key) ? (result[key] as T) : null;
      } else {
        return getLocalValue<T>(key);
      }
    } catch (e) {
      console.error("Storage get error:", e);
      try {
        return getLocalValue<T>(key);
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
        removeLocalValue(key);
      }
    } catch (e) {
      console.error("Storage remove error:", e);
      try {
        removeLocalValue(key);
      } catch (localError) {
        console.error("LocalStorage remove error:", localError);
        throw localError;
      }
    }
  },

  onChange(
    keys: string | string[],
    callback: (changes: StorageChangeMap) => void
  ): () => void {
    const watchKeys = new Set(Array.isArray(keys) ? keys : [keys]);

    const filterAndEmit = (changes: StorageChangeMap) => {
      const picked: StorageChangeMap = {};
      for (const key of watchKeys) {
        if (key in changes) picked[key] = changes[key];
      }
      if (Object.keys(picked).length) callback(picked);
    };

    const onChrome =
      typeof chrome !== "undefined" && chrome.storage?.onChanged
        ? (changes: Record<string, chrome.storage.StorageChange>, area: string) => {
            if (area !== "local") return;
            const mapped: StorageChangeMap = {};
            for (const [k, v] of Object.entries(changes)) {
              mapped[k] = { oldValue: v.oldValue, newValue: v.newValue };
            }
            filterAndEmit(mapped);
          }
        : null;

    if (onChrome) chrome.storage.onChanged.addListener(onChrome);

    const onWindow = (e: Event) => {
      const detail = (e as CustomEvent<StorageChangeMap>).detail;
      if (detail) filterAndEmit(detail);
    };
    window.addEventListener(STORAGE_EVENT, onWindow);

    return () => {
      if (onChrome) chrome.storage.onChanged.removeListener(onChrome);
      window.removeEventListener(STORAGE_EVENT, onWindow);
    };
  },
};
