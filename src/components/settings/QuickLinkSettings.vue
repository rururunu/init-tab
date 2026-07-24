<template>
  <div class="settings-page quick-link-settings">
    <section class="settings-section">
      <div class="settings-section-head quick-head">
        <div>
          <h3 class="settings-section-title">快捷访问</h3>
          <p class="settings-section-desc">显示在搜索框下方，点击即可打开网站</p>
        </div>
        <span class="quick-count">{{ quickLinks.length }} 个</span>
      </div>

      <div class="quick-toolbar">
        <div v-if="isCreatingGroup" class="quick-create-group">
          <input
            ref="newGroupInput"
            v-model="newGroupName"
            class="settings-input"
            aria-label="分组名称"
            placeholder="分组名称"
            maxlength="24"
            @keydown.enter="createGroup"
            @keydown.esc="cancelCreateGroup"
          />
          <button type="button" class="quick-toolbar-icon" title="创建" aria-label="创建分组" @click="createGroup">
            <Icon icon="fluent:checkmark-20-regular" />
          </button>
          <button type="button" class="quick-toolbar-icon" title="取消" aria-label="取消创建" @click="cancelCreateGroup">
            <Icon icon="fluent:dismiss-20-regular" />
          </button>
        </div>
        <button v-else type="button" class="settings-btn settings-btn--ghost" @click="startCreateGroup">
          <Icon icon="fluent:folder-add-24-regular" />
          新建分组
        </button>
        <button type="button" class="settings-btn settings-btn--primary" @click="addLink">
          <Icon icon="fluent:add-24-regular" />
          添加网站
        </button>
      </div>

      <div class="quick-group-list">
        <section
          v-for="collection in linkCollections"
          :key="collection.key"
          class="quick-link-group"
          :class="{ 'quick-link-group--drag-over': dragOverGroupKey === collection.key }"
          @dragover.prevent="onGroupDragOver(collection.key)"
          @drop.prevent.stop="onDropOnGroup(collection.id)"
        >
          <header class="quick-link-group-head">
            <Icon :icon="collection.id ? 'fluent:folder-24-regular' : 'fluent:grid-24-regular'" />
            <input
              v-if="collection.group"
              v-model="collection.group.label"
              class="quick-group-name"
              aria-label="分组名称"
              maxlength="24"
              @blur="saveGroupName(collection.group)"
              @keydown.enter="($event.target as HTMLInputElement).blur()"
            />
            <span v-else class="quick-group-label">未分组</span>
            <span class="quick-group-count">{{ collection.links.length }}</span>
            <button
              v-if="collection.group"
              type="button"
              class="quick-toolbar-icon quick-group-delete"
              title="删除分组"
              :aria-label="`删除分组 ${collection.group.label}`"
              @click="removeGroup(collection.group.id)"
            >
              <Icon icon="fluent:delete-20-regular" />
            </button>
          </header>

          <div class="quick-editor-list">
            <article
              v-for="link in collection.links"
              :key="link.id"
              class="quick-editor-card"
              :class="{
                'quick-editor-card--open': editingId === link.id,
                'quick-editor-card--dragging': draggingId === link.id,
                'quick-editor-card--drag-over': dragOverId === link.id && draggingId !== link.id,
              }"
              :style="{ '--quick-popover-offset': `${popoverOffsets[link.id] ?? 0}px` }"
              @mouseenter="positionEditor(link.id, $event)"
              @focusin="positionEditor(link.id, $event)"
              @dragover.prevent.stop="onLinkDragOver(link)"
              @drop.prevent.stop="onDropOnLink(link)"
              @dragend="resetDrag"
            >
              <QuickLinkChip
                class="quick-editor-trigger"
                :link="link"
                :interactive="false"
                draggable="true"
                @click="toggleEdit(link.id, $event)"
                @dragstart="onDragStart(link, $event)"
              />
              <button
                type="button"
                class="quick-card-remove"
                title="移除"
                :aria-label="`移除 ${link.label}`"
                @pointerdown.stop
                @click.stop="removeLink(link.id)"
              >
                <Icon icon="fluent:dismiss-16-filled" />
              </button>
              <div class="quick-editor-popover" @click.stop>
                <div class="quick-editor-popover-head">
                  <span>编辑快捷访问</span>
                  <button type="button" class="quick-editor-close" title="收起" aria-label="收起编辑" @click="editingId = null">
                    <Icon icon="fluent:dismiss-20-regular" />
                  </button>
                </div>
                <div class="quick-editor-fields">
                  <label class="quick-editor-field">
                    <span class="quick-editor-label">名称</span>
                    <span class="quick-input-wrap">
                      <Icon icon="fluent:text-field-24-regular" class="quick-input-icon" />
                      <input
                        v-model="link.label"
                        class="settings-input quick-field-input"
                        aria-label="快捷访问名称"
                        placeholder="网站名称"
                        @blur="saveChanges"
                        @keydown.enter="finishEditing"
                      />
                    </span>
                  </label>
                  <label class="quick-editor-field">
                    <span class="quick-editor-label">网址</span>
                    <span class="quick-input-wrap">
                      <Icon icon="fluent:link-24-regular" class="quick-input-icon" />
                      <input
                        v-model="link.url"
                        class="settings-input quick-field-input quick-url-input"
                        aria-label="快捷访问网址"
                        placeholder="https://example.com"
                        spellcheck="false"
                        @blur="saveChanges"
                        @keydown.enter="finishEditing"
                      />
                    </span>
                  </label>
                </div>
                <div class="quick-editor-actions">
                  <button type="button" class="quick-icon-btn quick-icon-btn--danger" title="删除" aria-label="删除" @click="removeLink(link.id)">
                    <Icon icon="fluent:delete-24-regular" />
                  </button>
                  <button type="button" class="quick-editor-done" @click="finishEditing">
                    <Icon icon="fluent:checkmark-20-regular" />
                    完成
                  </button>
                </div>
              </div>
            </article>
            <div v-if="!collection.links.length" class="quick-group-empty">
              拖动快捷访问到这里
            </div>
          </div>
        </section>
      </div>
    </section>

    <template v-if="recommendationGroups.length">
      <hr class="settings-divider" />
      <section class="settings-section recommendation-section">
        <div class="settings-section-head">
          <h3 class="settings-section-title">推荐</h3>
        </div>

        <div v-for="group in recommendationGroups" :key="group.id" class="recommendation-group">
          <span class="recommendation-group-title">{{ group.label }}</span>
          <div class="recommendation-list">
            <QuickLinkChip
              v-for="link in group.links"
              :key="link.id"
              class="recommendation-chip"
              :class="{ 'recommendation-chip--added': isRecommendationAdded(link.url) }"
              :link="link"
              :interactive="false"
              :aria-disabled="isRecommendationAdded(link.url)"
              @click="addRecommendation(link)"
            />
          </div>
        </div>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue';
import { Icon } from '@iconify/vue';
import QuickLinkChip from '@/components/ui/QuickLinkChip.vue';
import { useNotification } from '@/composables/useNotification';
import { useQuickLinks } from '@/composables/useQuickLinks';
import type { QuickLink, QuickLinkGroup, QuickLinkRecommendation } from '@/composables/useQuickLinks';

const { error } = useNotification();
const {
  quickLinks,
  quickLinkGroups,
  recommendations,
  loadQuickLinks,
  loadRecommendations,
  saveQuickLinks,
  saveQuickLinkGroups,
} = useQuickLinks();
const editingId = ref<string | null>(null);
const draggingId = ref<string | null>(null);
const dragOverId = ref<string | null>(null);
const dragOverGroupKey = ref<string | null>(null);
const popoverOffsets = ref<Record<string, number>>({});
const isCreatingGroup = ref(false);
const newGroupName = ref('');
const newGroupInput = ref<HTMLInputElement | null>(null);

const GROUP_LABELS: Record<QuickLinkRecommendation['group'], string> = {
  personal: '为你推荐',
  trending: '国际热门',
  popular: '常用网站',
  cn: '国内网站',
  dev: '开发者',
  ai: 'AI 工具',
  media: '内容社区',
};

const recommendationGroups = computed(() =>
  (Object.keys(GROUP_LABELS) as QuickLinkRecommendation['group'][])
    .map((id) => ({ id, label: GROUP_LABELS[id], links: recommendations.value.filter((link) => link.group === id) }))
    .filter((group) => group.links.length)
);

const validGroupIds = computed(() => new Set(quickLinkGroups.value.map((group) => group.id)));
const linkCollections = computed(() => {
  const ungrouped = quickLinks.value.filter(
    (link) => !link.groupId || !validGroupIds.value.has(link.groupId)
  );
  return [
    { key: '__ungrouped__', id: undefined, group: undefined, links: ungrouped },
    ...quickLinkGroups.value.map((group) => ({
      key: group.id,
      id: group.id,
      group,
      links: quickLinks.value.filter((link) => link.groupId === group.id),
    })),
  ];
});

const startCreateGroup = async () => {
  isCreatingGroup.value = true;
  newGroupName.value = '';
  await nextTick();
  newGroupInput.value?.focus();
};

const cancelCreateGroup = () => {
  isCreatingGroup.value = false;
  newGroupName.value = '';
};

const createGroup = async () => {
  const label = newGroupName.value.trim();
  if (!label) {
    newGroupInput.value?.focus();
    return;
  }
  const id = globalThis.crypto?.randomUUID?.() ?? `group-${Date.now()}`;
  await saveQuickLinkGroups([...quickLinkGroups.value, { id, label }]);
  cancelCreateGroup();
};

const saveGroupName = async (group: QuickLinkGroup) => {
  group.label = group.label.trim() || '未命名分组';
  await saveQuickLinkGroups(quickLinkGroups.value);
};

const removeGroup = async (groupId: string) => {
  const nextLinks = quickLinks.value.map((link) => {
    if (link.groupId !== groupId) return { ...link };
    const ungroupedLink = { ...link };
    delete ungroupedLink.groupId;
    delete ungroupedLink.position;
    return ungroupedLink;
  });
  await Promise.all([
    saveQuickLinks(nextLinks),
    saveQuickLinkGroups(quickLinkGroups.value.filter((group) => group.id !== groupId)),
  ]);
};

const positionEditor = (id: string, event: Event) => {
  const eventElement = event.currentTarget as HTMLElement | null;
  const card = eventElement?.closest<HTMLElement>('.quick-editor-card');
  const popover = card?.querySelector<HTMLElement>('.quick-editor-popover');
  const settingsPage = card?.closest<HTMLElement>('.quick-link-settings');
  if (!card || !popover || !settingsPage) return;

  const cardRect = card.getBoundingClientRect();
  const pageRect = settingsPage.getBoundingClientRect();
  const popoverWidth = popover.getBoundingClientRect().width;
  const safeLeft = Math.max(pageRect.left + 12, 12);
  const safeRight = Math.min(pageRect.right - 12, window.innerWidth - 12);
  const left = Math.min(Math.max(cardRect.left, safeLeft), Math.max(safeLeft, safeRight - popoverWidth));
  popoverOffsets.value = { ...popoverOffsets.value, [id]: left - cardRect.left };
};

const toggleEdit = (id: string, event: Event) => {
  positionEditor(id, event);
  editingId.value = editingId.value === id ? null : id;
};

const normalizeUrl = (value: string) => {
  const candidate = /^https?:\/\//i.test(value.trim()) ? value.trim() : `https://${value.trim()}`;
  const parsed = new URL(candidate);
  if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('仅支持 http 或 https 地址');
  return parsed.href;
};

const saveChanges = async () => {
  try {
    const normalized = quickLinks.value.map((link) => ({
      ...link,
      label: link.label.trim(),
      url: normalizeUrl(link.url),
    }));
    if (normalized.some((link) => !link.label)) throw new Error('网站名称不能为空');
    await saveQuickLinks(normalized);
    return true;
  } catch (e) {
    error('无法保存快捷访问', e instanceof Error ? e.message : String(e));
    return false;
  }
};

const finishEditing = async () => {
  if (await saveChanges()) editingId.value = null;
};

const addLink = async () => {
  const id = globalThis.crypto?.randomUUID?.() ?? `quick-${Date.now()}`;
  await saveQuickLinks([
    ...quickLinks.value,
    {
      id,
      label: '新网站',
      url: 'https://example.com/',
    },
  ]);
  editingId.value = id;
};

const removeLink = async (id: string) => {
  if (editingId.value === id) editingId.value = null;
  await saveQuickLinks(quickLinks.value.filter((link) => link.id !== id));
};

const onDragStart = (link: QuickLink, event: DragEvent) => {
  editingId.value = null;
  draggingId.value = link.id;
  dragOverId.value = link.id;
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', link.id);
  }
};

const onLinkDragOver = (link: QuickLink) => {
  if (!draggingId.value) return;
  dragOverId.value = link.id;
  dragOverGroupKey.value = link.groupId && validGroupIds.value.has(link.groupId)
    ? link.groupId
    : '__ungrouped__';
};

const onGroupDragOver = (groupKey: string) => {
  if (!draggingId.value) return;
  dragOverGroupKey.value = groupKey;
  dragOverId.value = null;
};

const resetDrag = () => {
  draggingId.value = null;
  dragOverId.value = null;
  dragOverGroupKey.value = null;
};

const moveLinkToGroup = (link: QuickLink, groupId?: string): QuickLink => {
  const next = { ...link };
  delete next.position;
  if (groupId) next.groupId = groupId;
  else delete next.groupId;
  return next;
};

const onDropOnLink = async (target: QuickLink) => {
  const sourceId = draggingId.value;
  if (!sourceId || sourceId === target.id) {
    resetDrag();
    return;
  }
  const next = quickLinks.value.map((link) => ({ ...link }));
  const sourceIndex = next.findIndex((link) => link.id === sourceId);
  const targetIndex = next.findIndex((link) => link.id === target.id);
  if (sourceIndex < 0 || targetIndex < 0) return resetDrag();
  const [source] = next.splice(sourceIndex, 1);
  const targetGroupId = target.groupId && validGroupIds.value.has(target.groupId)
    ? target.groupId
    : undefined;
  next.splice(targetIndex, 0, moveLinkToGroup(source, targetGroupId));
  resetDrag();
  await saveQuickLinks(next);
};

const onDropOnGroup = async (groupId?: string) => {
  const sourceId = draggingId.value;
  if (!sourceId) return;
  const source = quickLinks.value.find((link) => link.id === sourceId);
  if (!source) return resetDrag();
  const next = quickLinks.value.filter((link) => link.id !== sourceId).map((link) => ({ ...link }));
  next.push(moveLinkToGroup(source, groupId));
  resetDrag();
  await saveQuickLinks(next);
};

const isRecommendationAdded = (url: string) => quickLinks.value.some((link) => link.url === url);

const addRecommendation = async (recommendation: QuickLinkRecommendation) => {
  if (isRecommendationAdded(recommendation.url)) return;
  await saveQuickLinks([
    ...quickLinks.value,
    {
      id: globalThis.crypto?.randomUUID?.() ?? `quick-${Date.now()}`,
      label: recommendation.label,
      url: recommendation.url,
    },
  ]);
};

onMounted(() => Promise.all([loadQuickLinks(), loadRecommendations()]));
</script>

<style scoped>
.quick-link-settings {
  min-width: 0;
  overflow-x: hidden;
}

.quick-head {
  flex-direction: row;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.quick-count {
  color: var(--ui-text-muted);
  font-size: 11px;
  font-variant-numeric: tabular-nums;
}

.quick-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.quick-create-group {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 4px;
}

.quick-create-group .settings-input {
  width: min(190px, calc(100vw - 210px));
}

.quick-toolbar-icon {
  width: 30px;
  height: 30px;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border: 0;
  border-radius: 6px;
  color: var(--ui-text-muted);
  background: transparent;
  cursor: pointer;
  font-size: 16px;
}

.quick-toolbar-icon:hover,
.quick-toolbar-icon:focus-visible {
  color: var(--ui-text);
  background: var(--ui-surface-soft);
}

.quick-group-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.quick-link-group {
  min-width: 0;
  padding: 10px;
  border: 1px solid var(--ui-border);
  border-radius: 8px;
  background: var(--ui-surface-soft);
  transition: border-color 0.15s ease, background 0.15s ease, box-shadow 0.15s ease;
}

.quick-link-group--drag-over {
  border-color: var(--ui-accent);
  background: var(--ui-accent-soft);
  box-shadow: inset 0 0 0 1px var(--ui-accent);
}

.quick-link-group-head {
  min-height: 28px;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 7px;
  color: var(--ui-text-muted);
}

.quick-link-group-head > svg {
  flex-shrink: 0;
  font-size: 16px;
}

.quick-group-name {
  min-width: 0;
  height: 28px;
  padding: 0 4px;
  flex: 1;
  border: 1px solid transparent;
  border-radius: 5px;
  outline: none;
  color: var(--ui-text-secondary);
  background: transparent;
  font-size: 12px;
  font-weight: 600;
}

.quick-group-name:hover {
  border-color: var(--ui-border-strong);
}

.quick-group-name:focus {
  border-color: var(--ui-accent);
  background: var(--ui-surface);
}

.quick-group-label {
  min-width: 0;
  flex: 1;
  color: var(--ui-text-secondary);
  font-size: 12px;
  font-weight: 600;
}

.quick-group-count {
  font-size: 11px;
  font-variant-numeric: tabular-nums;
}

.quick-group-delete:hover,
.quick-group-delete:focus-visible {
  color: #dc2626;
  background: rgba(220, 38, 38, 0.08);
}

.quick-editor-list {
  width: 100%;
  min-width: 0;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  overflow: visible;
}

.quick-group-empty {
  width: 100%;
  min-height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px dashed var(--ui-border-strong);
  border-radius: 7px;
  color: var(--ui-text-muted);
  font-size: 11px;
}

.quick-editor-card {
  position: relative;
  max-width: 100%;
  flex-shrink: 0;
}

.quick-editor-card:hover,
.quick-editor-card:focus-within,
.quick-editor-card--open {
  z-index: 10;
}

.quick-editor-trigger {
  max-width: min(180px, 100%);
  cursor: grab;
}

.quick-editor-trigger:active {
  cursor: grabbing;
}

.quick-card-remove {
  position: absolute;
  top: -6px;
  right: -6px;
  z-index: 12;
  width: 20px;
  height: 20px;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255, 255, 255, 0.9);
  border-radius: 50%;
  color: #fff;
  background: #dc2626;
  box-shadow: 0 2px 6px rgba(15, 23, 42, 0.24);
  cursor: pointer;
  font-size: 12px;
  opacity: 0;
  pointer-events: none;
  transform: scale(0.8);
  transition: opacity 0.12s ease, transform 0.12s ease, background 0.12s ease;
}

.quick-editor-card:hover .quick-card-remove,
.quick-card-remove:focus-visible {
  opacity: 1;
  pointer-events: auto;
  transform: scale(1);
}

.quick-card-remove:hover,
.quick-card-remove:focus-visible {
  background: #b91c1c;
}

.quick-editor-card--dragging {
  opacity: 0.42;
}

.quick-editor-card--dragging .quick-editor-popover {
  display: none;
}

.quick-editor-card--drag-over :deep(.quick-link-chip) {
  border-color: var(--ui-accent);
  box-shadow: 0 0 0 2px var(--ui-accent-soft);
  transform: translateY(-2px);
}

.quick-editor-popover {
  position: absolute;
  top: calc(100% + 8px);
  left: var(--quick-popover-offset, 0px);
  width: min(340px, calc(100vw - 48px));
  max-width: calc(100% + 300px);
  box-sizing: border-box;
  padding: 0;
  border: 1px solid var(--ui-border-strong);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.98);
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.16);
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transform: translateY(-5px);
  transition: opacity 0.15s ease, transform 0.15s ease, visibility 0.15s;
}

.quick-editor-popover::before {
  content: '';
  position: absolute;
  right: 0;
  bottom: 100%;
  left: 0;
  height: 8px;
}

.quick-editor-card:hover .quick-editor-popover,
.quick-editor-card:focus-within .quick-editor-popover,
.quick-editor-card--open .quick-editor-popover {
  opacity: 1;
  visibility: visible;
  pointer-events: auto;
  transform: translateY(0);
}

.quick-editor-popover-head {
  height: 42px;
  padding: 0 10px 0 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--ui-border);
  color: var(--ui-text);
  font-size: 12px;
  font-weight: 600;
}

.quick-editor-close {
  width: 28px;
  height: 28px;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 6px;
  color: var(--ui-text-muted);
  background: transparent;
  cursor: pointer;
  font-size: 15px;
}

.quick-editor-close:hover {
  color: var(--ui-text);
  background: var(--ui-surface-soft);
}

.quick-editor-fields {
  min-width: 0;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.quick-editor-field {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.quick-editor-label {
  color: var(--ui-text-muted);
  font-size: 11px;
  font-weight: 600;
}

.quick-input-wrap {
  position: relative;
  display: block;
}

.quick-input-icon {
  position: absolute;
  top: 50%;
  left: 10px;
  z-index: 1;
  color: var(--ui-text-muted);
  font-size: 15px;
  pointer-events: none;
  transform: translateY(-50%);
}

.quick-field-input {
  padding-left: 34px;
}

.quick-url-input {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 11px;
}

.quick-editor-actions {
  display: flex;
  align-items: center;
  gap: 2px;
  flex-shrink: 0;
  justify-content: space-between;
  min-height: 46px;
  margin-top: 0;
  padding: 7px 10px;
  border-top: 1px solid var(--ui-border);
  background: var(--ui-surface-soft);
}

.quick-icon-btn {
  width: 30px;
  height: 30px;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 7px;
  color: var(--ui-text-muted);
  background: transparent;
  cursor: pointer;
  font-size: 15px;
}

.quick-icon-btn:hover:not(:disabled) {
  color: var(--ui-accent);
  background: var(--ui-accent-soft);
}

.quick-icon-btn--danger:hover:not(:disabled) {
  color: #dc2626;
  background: rgba(220, 38, 38, 0.08);
}

.quick-icon-btn:disabled {
  opacity: 0.3;
  cursor: default;
}

.quick-editor-done {
  height: 32px;
  padding: 0 11px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  border: 0;
  border-radius: 7px;
  color: #fff;
  background: var(--ui-accent);
  box-shadow: 0 1px 4px rgba(37, 99, 235, 0.24);
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
}

.quick-editor-done:hover {
  background: var(--ui-accent-hover);
}

.recommendation-section {
  gap: 16px;
}

.recommendation-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.recommendation-group-title {
  color: var(--ui-text-muted);
  font-size: 11px;
  font-weight: 600;
}

.recommendation-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.recommendation-chip {
  cursor: pointer;
}

.recommendation-chip--added,
.recommendation-chip:disabled {
  opacity: 0.45;
  cursor: default;
}

.quick-empty {
  min-height: 76px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px dashed var(--ui-border-strong);
  border-radius: 8px;
  color: var(--ui-text-muted);
  font-size: 12px;
}

@media (max-width: 520px) {
  .quick-toolbar {
    align-items: stretch;
    flex-direction: column;
  }

  .quick-toolbar > .settings-btn {
    align-self: flex-start;
  }

  .quick-create-group .settings-input {
    width: 100%;
  }

  .quick-editor-list {
    gap: 8px;
  }

  .quick-editor-popover {
    width: min(300px, calc(100vw - 32px));
  }

  .quick-editor-trigger {
    max-width: 140px;
  }
}

@media (prefers-color-scheme: dark) {
  .quick-editor-popover {
    background: rgba(39, 39, 42, 0.98);
    box-shadow: 0 12px 30px rgba(0, 0, 0, 0.4);
  }
}
</style>
