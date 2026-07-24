import { onBeforeUnmount, ref } from 'vue';

const query = typeof window === 'undefined'
  ? undefined
  : window.matchMedia?.('(prefers-color-scheme: dark)');
const isDark = ref(query?.matches ?? false);
let subscribers = 0;

const update = (event: MediaQueryListEvent) => {
  isDark.value = event.matches;
};

export function usePreferredColorScheme() {
  subscribers += 1;
  if (subscribers === 1) {
    query?.addEventListener('change', update);
  }

  onBeforeUnmount(() => {
    subscribers -= 1;
    if (subscribers === 0) {
      query?.removeEventListener('change', update);
    }
  });

  return { isDark };
}
