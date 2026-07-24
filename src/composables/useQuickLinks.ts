import { ref } from 'vue';
import { storage } from '@/utils/storage';

export interface QuickLink {
  id: string;
  label: string;
  url: string;
  groupId?: string;
  position?: number;
}

export interface QuickLinkGroup {
  id: string;
  label: string;
  position?: number;
}

export interface QuickLinkRecommendation extends QuickLink {
  group: 'personal' | 'trending' | 'popular' | 'cn' | 'dev' | 'ai' | 'media';
}

const STORAGE_KEY = 'quickLinks';
const GROUPS_STORAGE_KEY = 'quickLinkGroups';
const RECOMMENDATION_CACHE_KEY = 'quickLinkRecommendations';
const REMOTE_RECOMMENDATION_URL =
  'https://raw.githubusercontent.com/rururunu/init-tab/master/public/quick-links.json';
const TRENDING_RECOMMENDATION_URL =
  'https://hn.algolia.com/api/v1/search?tags=front_page&hitsPerPage=40';
const DEFAULT_QUICK_LINKS: QuickLink[] = [
  { id: 'github', label: 'GitHub', url: 'https://github.com/' },
  { id: 'bilibili', label: '哔哩哔哩', url: 'https://www.bilibili.com/' },
  { id: 'youtube', label: 'YouTube', url: 'https://www.youtube.com/' },
  { id: 'zhihu', label: '知乎', url: 'https://www.zhihu.com/' },
];

const quickLinks = ref<QuickLink[]>([]);
const quickLinkGroups = ref<QuickLinkGroup[]>([]);
const recommendations = ref<QuickLinkRecommendation[]>([]);
let loaded = false;
let subscribed = false;

const parseLinks = (value: unknown): QuickLink[] | null => {
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value;
    if (!Array.isArray(parsed)) return null;
    return parsed.filter(
      (item): item is QuickLink =>
        Boolean(item && typeof item.id === 'string' && typeof item.label === 'string' && typeof item.url === 'string')
    );
  } catch {
    return null;
  }
};

const parseGroups = (value: unknown): QuickLinkGroup[] | null => {
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value;
    if (!Array.isArray(parsed)) return null;
    return parsed.filter(
      (item): item is QuickLinkGroup =>
        Boolean(item && typeof item.id === 'string' && typeof item.label === 'string')
    );
  } catch {
    return null;
  }
};

const parseRecommendations = (value: unknown): QuickLinkRecommendation[] | null => {
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value;
    if (!Array.isArray(parsed)) return null;
    const allowedGroups = new Set(['personal', 'trending', 'popular', 'cn', 'dev', 'ai', 'media']);
    return parsed.filter((item): item is QuickLinkRecommendation => {
      if (!item || typeof item.id !== 'string' || typeof item.label !== 'string') return false;
      if (typeof item.url !== 'string' || !allowedGroups.has(item.group)) return false;
      try {
        return ['http:', 'https:'].includes(new URL(item.url).protocol);
      } catch {
        return false;
      }
    });
  } catch {
    return null;
  }
};

const saveQuickLinks = async (links: QuickLink[] = quickLinks.value) => {
  quickLinks.value = links.map((link) => ({ ...link }));
  await storage.set(STORAGE_KEY, JSON.stringify(quickLinks.value));
};

const saveQuickLinkGroups = async (groups: QuickLinkGroup[] = quickLinkGroups.value) => {
  quickLinkGroups.value = groups.map((group) => ({ ...group }));
  await storage.set(GROUPS_STORAGE_KEY, JSON.stringify(quickLinkGroups.value));
};

const loadQuickLinks = async () => {
  if (loaded) return;
  const [stored, storedGroups] = await Promise.all([
    storage.get<string | QuickLink[]>(STORAGE_KEY),
    storage.get<string | QuickLinkGroup[]>(GROUPS_STORAGE_KEY),
  ]);
  const parsed = parseLinks(stored);
  const parsedGroups = parseGroups(storedGroups);
  quickLinks.value = parsed ?? DEFAULT_QUICK_LINKS.map((link) => ({ ...link }));
  quickLinkGroups.value = parsedGroups ?? [];
  loaded = true;

  if (stored === null) await saveQuickLinks();
  if (storedGroups === null) await saveQuickLinkGroups();

  if (!subscribed) {
    subscribed = true;
    storage.onChange([STORAGE_KEY, GROUPS_STORAGE_KEY], (changes) => {
      const next = parseLinks(changes[STORAGE_KEY]?.newValue);
      const nextGroups = parseGroups(changes[GROUPS_STORAGE_KEY]?.newValue);
      if (next) quickLinks.value = next;
      if (nextGroups) quickLinkGroups.value = nextGroups;
    });
  }
};

const loadRecommendations = async () => {
  const cached = await storage.get<string>(RECOMMENDATION_CACHE_KEY);
  try {
    const parsedCache = cached ? JSON.parse(cached) : null;
    const parsedLinks = parseRecommendations(parsedCache?.links);
    if (parsedLinks) {
      recommendations.value = parsedLinks;
    }
  } catch {
    // Fall through to bundled recommendations.
  }

  const loadJson = async (url: string) => {
    const response = await fetch(url, { cache: 'no-store', credentials: 'omit' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const parsed = parseRecommendations(await response.json());
    if (!parsed?.length) throw new Error('推荐数据格式无效');
    return parsed;
  };

  const mergeRecommendations = (
    primary: QuickLinkRecommendation[],
    fallback: QuickLinkRecommendation[]
  ) => {
    const primaryIds = new Set(primary.map((link) => link.id));
    return [...primary, ...fallback.filter((link) => !primaryIds.has(link.id))];
  };

  const loadTrendingRecommendations = async (): Promise<QuickLinkRecommendation[]> => {
    const response = await fetch(TRENDING_RECOMMENDATION_URL, {
      cache: 'no-store',
      credentials: 'omit',
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json() as { hits?: Array<{ url?: unknown }> };
    const sites = new Map<string, QuickLinkRecommendation>();
    for (const hit of data.hits ?? []) {
      if (typeof hit.url !== 'string') continue;
      try {
        const url = new URL(hit.url);
        if (!['http:', 'https:'].includes(url.protocol)) continue;
        const hostname = url.hostname.replace(/^www\./, '').toLowerCase();
        if (!hostname || sites.has(hostname)) continue;
        sites.set(hostname, {
          id: `trending-${hostname}`,
          label: hostname,
          url: `${url.protocol}//${url.host}/`,
          group: 'trending',
        });
      } catch {
        // Ignore malformed links returned by the external feed.
      }
      if (sites.size >= 12) break;
    }
    return [...sites.values()];
  };

  const loadPersonalRecommendations = async (): Promise<QuickLinkRecommendation[]> => {
    if (!globalThis.chrome?.topSites) return [];
    const sites = await globalThis.chrome.topSites.get();
    const recommendationsByHost = new Map<string, QuickLinkRecommendation>();
    for (const site of sites) {
      try {
        const url = new URL(site.url);
        if (!['http:', 'https:'].includes(url.protocol)) continue;
        const hostname = url.hostname.replace(/^www\./, '').toLowerCase();
        if (!hostname || recommendationsByHost.has(hostname)) continue;
        recommendationsByHost.set(hostname, {
          id: `personal-${hostname}`,
          label: site.title.trim() || hostname,
          url: `${url.protocol}//${url.host}/`,
          group: 'personal',
        });
      } catch {
        // Ignore browser-internal and malformed entries.
      }
      if (recommendationsByHost.size >= 12) break;
    }
    return [...recommendationsByHost.values()];
  };

  let bundled: QuickLinkRecommendation[] = [];
  try {
    bundled = await loadJson('/quick-links.json');
  } catch {
    // The cached or remote list can still keep recommendations available.
  }

  const [remoteResult, trendingResult, personalResult] = await Promise.allSettled([
    loadJson(REMOTE_RECOMMENDATION_URL),
    loadTrendingRecommendations(),
    loadPersonalRecommendations(),
  ]);

  if (remoteResult.status === 'fulfilled') {
    recommendations.value = mergeRecommendations(remoteResult.value, bundled);
  } else {
    recommendations.value = mergeRecommendations(bundled, recommendations.value);
  }

  if (trendingResult.status === 'fulfilled' && trendingResult.value.length) {
    recommendations.value = mergeRecommendations(trendingResult.value, recommendations.value);
  }

  if (personalResult.status === 'fulfilled' && personalResult.value.length) {
    recommendations.value = mergeRecommendations(personalResult.value, recommendations.value);
  }

  if (recommendations.value.length) {
    await storage.set(
      RECOMMENDATION_CACHE_KEY,
      JSON.stringify({ updatedAt: Date.now(), links: recommendations.value })
    );
  }
};

export function useQuickLinks() {
  return {
    quickLinks,
    quickLinkGroups,
    recommendations,
    loadQuickLinks,
    loadRecommendations,
    saveQuickLinks,
    saveQuickLinkGroups,
  };
}
