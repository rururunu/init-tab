<template>
  <nav
    v-if="quickLinks.length"
    ref="quickLinksRef"
    class="quick-links"
    aria-label="快捷访问"
    @dragover.prevent="onTopContainerDragOver"
    @drop.prevent="onTopContainerDrop"
  >
    <template v-for="item in topLevelItems" :key="item.key">
      <div
        v-if="item.kind === 'link'"
        class="quick-link-item quick-link-draggable quick-top-item"
        :class="topItemClasses(item.key)"
        draggable="true"
        @dragstart="onTopDragStart(item.key, item.link, $event)"
        @dragover.prevent.stop="onTopItemDragOver(item.key, $event)"
        @drop.prevent.stop="onTopItemDrop(item.key)"
        @dragend="finishDrag"
        @contextmenu.prevent.stop="openContextMenu(item.link, $event)"
      >
        <QuickLinkChip :link="item.link" draggable="false" @click="onLinkClick" />
        <button
          type="button"
          class="quick-link-remove"
          title="移除"
          :aria-label="`移除 ${item.link.label}`"
          @pointerdown.stop
          @click.stop.prevent="removeLinkById(item.link)"
        >
          <Icon icon="fluent:dismiss-16-filled" />
        </button>
      </div>

      <div
        v-else
        :data-quick-group-id="item.group.id"
        class="quick-group-item quick-top-item"
        :class="[
          topItemClasses(item.key),
          {
            'quick-group-item--open': expandedGroupId === item.group.id,
            'quick-group-item--accept': groupDropTargetId === item.group.id,
          },
        ]"
        draggable="true"
        @dragstart="onTopDragStart(item.key, undefined, $event)"
        @dragover.prevent.stop="onTopItemDragOver(item.key, $event)"
        @drop.prevent.stop="onTopItemDrop(item.key)"
        @dragend="finishDrag"
      >
        <button
          type="button"
          class="quick-group-chip"
          draggable="false"
          :aria-expanded="expandedGroupId === item.group.id"
          @pointerdown.stop
          @click.stop="toggleGroup(item.group.id, $event)"
        >
          <span class="quick-group-chip-label">{{ item.group.label }}</span>
          <span v-if="groupDropTargetId === item.group.id" class="quick-group-drop-hint">
            <Icon icon="fluent:add-circle-16-filled" />
            放入分组
          </span>
          <span v-else class="quick-group-icons" aria-hidden="true">
            <span v-for="link in item.group.links.slice(0, 3)" :key="link.id" class="quick-group-icon">
              <FaviconImg :url="link.url" :size="18" />
            </span>
          </span>
        </button>
      </div>
    </template>

    <Transition name="quick-menu">
      <section
        v-if="expandedGroup"
        ref="groupPopoverRef"
        class="quick-group-popover"
        :style="{
          clipPath: groupPopoverClipPath,
          WebkitClipPath: groupPopoverClipPath,
        }"
        @pointerdown.stop
      >
        <div
          class="quick-group-popover-list"
          @dragover.prevent.stop
          @drop.prevent.stop="onInnerContainerDrop"
        >
          <div
            v-for="link in expandedGroup.links"
            :key="link.id"
            class="quick-group-link quick-link-draggable"
            :class="{
              'quick-group-link--dragging': draggingId === link.id,
              'quick-drag-gap-before': innerDropTarget?.id === link.id && innerDropTarget.side === 'before',
              'quick-drag-gap-after': innerDropTarget?.id === link.id && innerDropTarget.side === 'after',
            }"
            draggable="true"
            @dragstart="onInnerDragStart(link, $event)"
            @dragover.prevent.stop="onInnerDragOver(link, $event)"
            @drop.prevent.stop="onInnerDrop(link)"
            @dragend="finishDrag"
            @contextmenu.prevent.stop="openContextMenu(link, $event)"
          >
            <QuickLinkChip :link="link" draggable="false" @click="onLinkClick" />
            <button
              type="button"
              class="quick-group-link-remove"
              title="移除"
              :aria-label="`移除 ${link.label}`"
              @pointerdown.stop
              @click.stop.prevent="removeLinkById(link)"
            >
              <Icon icon="fluent:dismiss-16-filled" />
            </button>
          </div>
        </div>
      </section>
    </Transition>
  </nav>

  <Teleport to="body">
    <Transition name="quick-menu">
      <div
        v-if="contextMenu"
        class="quick-context-menu"
        :style="{ left: `${contextMenu.x}px`, top: `${contextMenu.y}px` }"
        role="menu"
        @pointerdown.stop
        @contextmenu.prevent
      >
        <div class="quick-context-title" :title="contextMenu.link.label">
          <FaviconImg :url="contextMenu.link.url" :size="16" />
          <span>{{ contextMenu.link.label }}</span>
        </div>
        <button type="button" role="menuitem" @click="visitLink">
          <Icon icon="fluent:open-20-regular" />
          <span>访问</span>
        </button>
        <button type="button" role="menuitem" @click="shareLink">
          <Icon icon="fluent:share-20-regular" />
          <span>分享</span>
        </button>
        <div class="quick-context-divider" />
        <button type="button" class="quick-context-remove" role="menuitem" @click="removeLink">
          <Icon icon="fluent:delete-20-regular" />
          <span>移除</span>
        </button>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue';
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import FaviconImg from '@/components/ui/FaviconImg.vue';
import QuickLinkChip from '@/components/ui/QuickLinkChip.vue';
import { useNotification } from '@/composables/useNotification';
import { useQuickLinks } from '@/composables/useQuickLinks';
import type { QuickLink } from '@/composables/useQuickLinks';

const {
  quickLinks,
  quickLinkGroups,
  loadQuickLinks,
  saveQuickLinks,
  saveQuickLinkGroups,
} = useQuickLinks();
const { success, error } = useNotification();
const draggingId = ref<string | null>(null);
const draggingTopKey = ref<string | null>(null);
const topDropTarget = ref<{ key: string; side: 'before' | 'after' } | null>(null);
const innerDropTarget = ref<{ id: string; side: 'before' | 'after' } | null>(null);
const groupHoverId = ref<string | null>(null);
const groupDropTargetId = ref<string | null>(null);
let groupHoverTimer: number | null = null;
const suppressClick = ref(false);
const expandedGroupId = ref<string | null>(null);
const quickLinksRef = ref<HTMLElement | null>(null);
const groupPopoverRef = ref<HTMLElement | null>(null);
const groupArrowX = ref(28);
const groupPopoverClipPath = ref('none');
const contextMenu = ref<{ link: QuickLink; x: number; y: number } | null>(null);

const validGroupIds = computed(() => new Set(quickLinkGroups.value.map((group) => group.id)));
const ungroupedLinks = computed(() => quickLinks.value.filter(
  (link) => !link.groupId || !validGroupIds.value.has(link.groupId)
));
const populatedGroups = computed(() => quickLinkGroups.value
  .map((group) => ({
    ...group,
    links: quickLinks.value.filter((link) => link.groupId === group.id),
  }))
  .filter((group) => group.links.length));
const topLevelItems = computed(() => [
  ...ungroupedLinks.value.map((link, index) => ({
    kind: 'link' as const,
    key: `link:${link.id}`,
    link,
    position: link.position,
    fallbackIndex: index,
  })),
  ...populatedGroups.value.map((group, index) => ({
    kind: 'group' as const,
    key: `group:${group.id}`,
    group,
    position: group.position,
    fallbackIndex: ungroupedLinks.value.length + index,
  })),
].sort((a, b) => {
  if (a.position !== undefined && b.position !== undefined) return a.position - b.position;
  if (a.position !== undefined) return -1;
  if (b.position !== undefined) return 1;
  return a.fallbackIndex - b.fallbackIndex;
}));
const expandedGroup = computed(() =>
  populatedGroups.value.find((group) => group.id === expandedGroupId.value) ?? null
);

const updateGroupArrow = (element: HTMLElement) => {
  const navRect = quickLinksRef.value?.getBoundingClientRect();
  if (!navRect) return;
  const groupRect = element.getBoundingClientRect();
  groupArrowX.value = Math.min(
    Math.max(groupRect.left + groupRect.width / 2 - navRect.left, 24),
    navRect.width - 24
  );
};

const updateGroupPopoverShape = async () => {
  await nextTick();
  const rect = groupPopoverRef.value?.getBoundingClientRect();
  if (!rect) return;
  const width = Math.round(rect.width);
  const height = Math.round(rect.height);
  const radius = 16;
  const bodyTop = 10;
  const arrowHalfWidth = 10;
  const arrowX = Math.round(Math.min(Math.max(groupArrowX.value, 24), width - 24));
  groupPopoverClipPath.value = `path('M ${radius} ${bodyTop} H ${arrowX - arrowHalfWidth} L ${arrowX} 0 L ${arrowX + arrowHalfWidth} ${bodyTop} H ${width - radius} Q ${width} ${bodyTop} ${width} ${bodyTop + radius} V ${height - radius} Q ${width} ${height} ${width - radius} ${height} H ${radius} Q 0 ${height} 0 ${height - radius} V ${bodyTop + radius} Q 0 ${bodyTop} ${radius} ${bodyTop} Z')`;
};

const updateGroupArrowById = async (groupId: string) => {
  await nextTick();
  const group = Array.from(
    quickLinksRef.value?.querySelectorAll<HTMLElement>('[data-quick-group-id]') ?? []
  ).find((element) => element.dataset.quickGroupId === groupId);
  if (group) updateGroupArrow(group);
  await updateGroupPopoverShape();
};

const toggleGroup = async (groupId: string, event: MouseEvent) => {
  if (suppressClick.value) return;
  closeContextMenu();
  updateGroupArrow(event.currentTarget as HTMLElement);
  const isOpening = expandedGroupId.value !== groupId;
  expandedGroupId.value = isOpening ? groupId : null;
  if (isOpening) await updateGroupPopoverShape();
};

const resetDrag = () => {
  cancelGroupHover();
  draggingId.value = null;
  draggingTopKey.value = null;
  topDropTarget.value = null;
  innerDropTarget.value = null;
};

const prepareDrag = (event: DragEvent, value: string) => {
  closeContextMenu();
  suppressClick.value = true;
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', value);
  }
};

const onTopDragStart = (key: string, link: QuickLink | undefined, event: DragEvent) => {
  expandedGroupId.value = null;
  draggingTopKey.value = key;
  draggingId.value = link?.id ?? null;
  prepareDrag(event, key);
};

const onInnerDragStart = (link: QuickLink, event: DragEvent) => {
  draggingId.value = link.id;
  draggingTopKey.value = null;
  prepareDrag(event, `link:${link.id}`);
};

const finishDrag = () => {
  resetDrag();
  window.setTimeout(() => {
    suppressClick.value = false;
  }, 0);
};

const onLinkClick = (event: MouseEvent) => {
  if (!suppressClick.value) return;
  event.preventDefault();
  event.stopPropagation();
};

const getDropSide = (event: DragEvent): 'before' | 'after' => {
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
  return event.clientX < rect.left + rect.width / 2 ? 'before' : 'after';
};

const topItemClasses = (key: string) => ({
  'quick-top-item--dragging': draggingTopKey.value === key,
  'quick-drag-gap-before': topDropTarget.value?.key === key
    && topDropTarget.value.side === 'before'
    && !isLinkHoveringGroup(key),
  'quick-drag-gap-after': topDropTarget.value?.key === key
    && topDropTarget.value.side === 'after'
    && !isLinkHoveringGroup(key),
});

function cancelGroupHover() {
  if (groupHoverTimer !== null) window.clearTimeout(groupHoverTimer);
  groupHoverTimer = null;
  groupHoverId.value = null;
  groupDropTargetId.value = null;
}

const isLinkHoveringGroup = (key: string) =>
  Boolean(draggingTopKey.value?.startsWith('link:') && key.startsWith('group:'));

const startGroupHover = (key: string) => {
  if (!isLinkHoveringGroup(key)) return cancelGroupHover();
  const groupId = key.slice('group:'.length);
  if (groupHoverId.value === groupId) return;
  cancelGroupHover();
  groupHoverId.value = groupId;
  groupHoverTimer = window.setTimeout(() => {
    if (groupHoverId.value === groupId && draggingTopKey.value?.startsWith('link:')) {
      groupDropTargetId.value = groupId;
    }
  }, 700);
};

const getDraggingGroupedLink = () => {
  const link = quickLinks.value.find((item) => item.id === draggingId.value);
  return link?.groupId ? link : null;
};

const onTopItemDragOver = (key: string, event: DragEvent) => {
  if (!draggingTopKey.value && !getDraggingGroupedLink()) return;
  if (draggingTopKey.value === key) return;
  topDropTarget.value = { key, side: getDropSide(event) };
  if (draggingTopKey.value && key.startsWith('group:')) startGroupHover(key);
  else cancelGroupHover();
};

const saveTopLevelOrder = async (keys: string[]) => {
  const positions = new Map(keys.map((key, index) => [key, index]));
  const nextLinks = quickLinks.value.map((link) => ({
    ...link,
    ...(positions.has(`link:${link.id}`) ? { position: positions.get(`link:${link.id}`) } : {}),
  }));
  const nextGroups = quickLinkGroups.value.map((group) => ({
    ...group,
    ...(positions.has(`group:${group.id}`) ? { position: positions.get(`group:${group.id}`) } : {}),
  }));
  await Promise.all([saveQuickLinks(nextLinks), saveQuickLinkGroups(nextGroups)]);
};

const moveTopItem = async (targetKey: string, side: 'before' | 'after') => {
  const sourceKey = draggingTopKey.value;
  if (!sourceKey) return;
  const keys = topLevelItems.value.map((item) => item.key);
  const sourceIndex = keys.indexOf(sourceKey);
  if (sourceIndex < 0) return resetDrag();
  keys.splice(sourceIndex, 1);
  const targetIndex = keys.indexOf(targetKey);
  if (targetIndex < 0) return resetDrag();
  keys.splice(targetIndex + (side === 'after' ? 1 : 0), 0, sourceKey);
  resetDrag();
  try {
    await saveTopLevelOrder(keys);
  } catch {
    error('排序保存失败', '请稍后重试');
  }
};

const onTopItemDrop = async (key: string) => {
  if (key === `group:${groupDropTargetId.value}` && draggingId.value) {
    await moveLinkIntoGroup(groupDropTargetId.value);
    return;
  }
  const target = topDropTarget.value;
  if (getDraggingGroupedLink()) {
    await moveGroupedLinkOut(key, target?.key === key ? target.side : 'before');
    return;
  }
  await moveTopItem(key, target?.key === key ? target.side : 'before');
};

const onTopContainerDragOver = (event: DragEvent) => {
  // Keep the last item-level target while the pointer is over the visual insertion gap.
  if (event.target === event.currentTarget && groupHoverId.value) cancelGroupHover();
  if (getDraggingGroupedLink() && !topDropTarget.value) {
    topDropTarget.value = { key: '__end__', side: 'after' };
  }
};

const onTopContainerDrop = async () => {
  const target = topDropTarget.value;
  if (!target) return;
  if (getDraggingGroupedLink()) {
    await moveGroupedLinkOut(target.key, target.side);
  } else if (draggingTopKey.value) {
    await moveTopItem(target.key, target.side);
  }
};

const moveGroupedLinkOut = async (targetKey: string, side: 'before' | 'after') => {
  const source = getDraggingGroupedLink();
  if (!source) return resetDrag();

  const sourceKey = `link:${source.id}`;
  const keys = topLevelItems.value.map((item) => item.key);
  if (targetKey === '__end__') {
    keys.push(sourceKey);
  } else {
    const targetIndex = keys.indexOf(targetKey);
    if (targetIndex < 0) return resetDrag();
    keys.splice(targetIndex + (side === 'after' ? 1 : 0), 0, sourceKey);
  }

  const positions = new Map(keys.map((key, index) => [key, index]));
  const nextLinks = quickLinks.value.map((link) => {
    const next = { ...link };
    if (next.id === source.id) delete next.groupId;
    const position = positions.get(`link:${next.id}`);
    if (position !== undefined) next.position = position;
    return next;
  });
  const nextGroups = quickLinkGroups.value.map((group) => ({
    ...group,
    position: positions.get(`group:${group.id}`) ?? group.position,
  }));

  resetDrag();
  try {
    await Promise.all([saveQuickLinks(nextLinks), saveQuickLinkGroups(nextGroups)]);
  } catch {
    error('无法移出分组', '请稍后重试');
  }
};

const moveLinkIntoGroup = async (groupId: string) => {
  const sourceId = draggingId.value;
  if (!sourceId) return resetDrag();
  const source = quickLinks.value.find((link) => link.id === sourceId);
  if (!source || source.groupId) return resetDrag();
  const moved = { ...source, groupId };
  delete moved.position;
  const next = quickLinks.value.filter((link) => link.id !== sourceId).map((link) => ({ ...link }));
  next.push(moved);
  resetDrag();
  try {
    await saveQuickLinks(next);
    expandedGroupId.value = groupId;
    await updateGroupArrowById(groupId);
  } catch {
    error('无法加入分组', '请稍后重试');
  }
};

const onInnerDragOver = (target: QuickLink, event: DragEvent) => {
  const source = quickLinks.value.find((link) => link.id === draggingId.value);
  if (!source?.groupId || source.groupId !== target.groupId || source.id === target.id) return;
  innerDropTarget.value = { id: target.id, side: getDropSide(event) };
};

const onInnerDrop = async (target: QuickLink) => {
  const source = quickLinks.value.find((link) => link.id === draggingId.value);
  const drop = innerDropTarget.value;
  if (!source?.groupId || source.groupId !== target.groupId || !drop) return resetDrag();

  const groupLinks = quickLinks.value.filter((link) => link.groupId === source.groupId);
  const sourceIndex = groupLinks.findIndex((link) => link.id === source.id);
  if (sourceIndex < 0) return resetDrag();
  const [moved] = groupLinks.splice(sourceIndex, 1);
  const targetIndex = groupLinks.findIndex((link) => link.id === target.id);
  groupLinks.splice(targetIndex + (drop.side === 'after' ? 1 : 0), 0, moved);

  const queue = [...groupLinks];
  const next = quickLinks.value.map((link) =>
    link.groupId === source.groupId ? { ...queue.shift()! } : { ...link }
  );
  resetDrag();
  try {
    await saveQuickLinks(next);
  } catch {
    error('排序保存失败', '请稍后重试');
  }
};

const onInnerContainerDrop = async () => {
  const targetId = innerDropTarget.value?.id;
  if (!targetId) return resetDrag();
  const target = quickLinks.value.find((link) => link.id === targetId);
  if (!target) return resetDrag();
  await onInnerDrop(target);
};

const openContextMenu = (link: QuickLink, event: MouseEvent) => {
  const menuWidth = 188;
  const menuHeight = 178;
  expandedGroupId.value = null;
  contextMenu.value = {
    link,
    x: Math.max(8, Math.min(event.clientX, window.innerWidth - menuWidth - 8)),
    y: Math.max(8, Math.min(event.clientY, window.innerHeight - menuHeight - 8)),
  };
};

const closeContextMenu = () => {
  contextMenu.value = null;
};

const closeOverlays = () => {
  closeContextMenu();
  expandedGroupId.value = null;
};

const visitLink = () => {
  if (!contextMenu.value) return;
  window.open(contextMenu.value.link.url, '_blank', 'noopener,noreferrer');
  closeContextMenu();
};

const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const copied = document.execCommand('copy');
    textarea.remove();
    if (!copied) throw new Error('复制失败');
  }
};

const shareLink = async () => {
  if (!contextMenu.value) return;
  const link = contextMenu.value.link;
  try {
    await copyToClipboard(link.url);
    success('链接已复制', link.label);
  } catch {
    error('复制失败', '无法访问剪贴板');
  }
  closeContextMenu();
};

const removeLink = async () => {
  if (!contextMenu.value) return;
  const link = contextMenu.value.link;
  await removeLinkById(link);
  closeContextMenu();
};

const removeLinkById = async (link: QuickLink) => {
  try {
    await saveQuickLinks(quickLinks.value.filter((item) => item.id !== link.id));
    if (link.groupId && !quickLinks.value.some((item) => item.groupId === link.groupId)) {
      expandedGroupId.value = null;
    }
    success('已移除快捷访问', link.label);
  } catch {
    error('移除失败', '请稍后重试');
  }
};

const onKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') closeOverlays();
};

watch(
  () => expandedGroup.value?.links.length,
  () => {
    if (expandedGroup.value) void updateGroupPopoverShape();
  }
);

onMounted(() => {
  loadQuickLinks();
  window.addEventListener('pointerdown', closeOverlays);
  window.addEventListener('keydown', onKeydown);
  window.addEventListener('resize', closeOverlays);
  window.addEventListener('scroll', closeOverlays, true);
});

onBeforeUnmount(() => {
  cancelGroupHover();
  window.removeEventListener('pointerdown', closeOverlays);
  window.removeEventListener('keydown', onKeydown);
  window.removeEventListener('resize', closeOverlays);
  window.removeEventListener('scroll', closeOverlays, true);
});
</script>

<style scoped>
.quick-links {
  width: min(560px, calc(100vw - 32px));
  margin: 14px auto 0;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 8px;
  border-radius: 8px;
  transition: box-shadow 0.15s ease;
}

.quick-group-item {
  position: relative;
  max-width: 220px;
}

.quick-top-item,
.quick-group-link {
  transition: margin 0.14s ease, opacity 0.14s ease;
}

.quick-top-item--dragging,
.quick-group-link--dragging {
  opacity: 0.42;
}

.quick-drag-gap-before {
  margin-left: 32px;
}

.quick-drag-gap-after {
  margin-right: 32px;
}

.quick-group-chip {
  height: 38px;
  max-width: 220px;
  padding: 0 8px 0 14px;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  border: 1px solid rgba(15, 23, 42, 0.18);
  border-radius: 999px;
  color: #374151;
  background: rgba(255, 255, 255, 0.76);
  box-shadow: 0 1px 5px rgba(15, 23, 42, 0.06);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  cursor: pointer;
  font-size: 13px;
  font-weight: 550;
  transition: transform 0.15s, background 0.15s, border-color 0.15s, box-shadow 0.15s;
}

.quick-group-chip:hover,
.quick-group-item--open .quick-group-chip {
  border-color: rgba(15, 23, 42, 0.34);
  background: rgba(255, 255, 255, 0.94);
  transform: translateY(-1px);
}

.quick-group-item--drag-over .quick-group-chip {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.18);
}

.quick-group-item--accept .quick-group-chip {
  border-color: #2563eb;
  background: rgba(239, 246, 255, 0.9);
  box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.2);
}

.quick-group-chip-label {
  min-width: 0;
  max-width: 110px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.quick-group-icons {
  height: 26px;
  display: flex;
  align-items: center;
  padding-left: 6px;
  flex-shrink: 0;
}

.quick-group-drop-hint {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  flex-shrink: 0;
  color: #2563eb;
  font-size: 10px;
  font-weight: 650;
  white-space: nowrap;
}

.quick-group-drop-hint svg {
  font-size: 14px;
}

.quick-group-icon {
  width: 24px;
  height: 24px;
  margin-left: -7px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border: 2px solid rgba(255, 255, 255, 0.96);
  border-radius: 50%;
  background: #fff;
  box-sizing: border-box;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.18);
}

.quick-group-popover {
  position: relative;
  width: 100%;
  margin-top: 4px;
  padding: 22px 12px 12px;
  flex-basis: 100%;
  box-sizing: border-box;
  border: 0;
  border-radius: 0;
  color: #374151;
  background: rgba(255, 255, 255, 0.58);
  filter: drop-shadow(0 1px 1px rgba(15, 23, 42, 0.12)) drop-shadow(0 12px 24px rgba(15, 23, 42, 0.14));
  backdrop-filter: blur(20px) saturate(1.28);
  -webkit-backdrop-filter: blur(20px) saturate(1.28);
}

.quick-group-popover-list {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.quick-group-link {
  position: relative;
  max-width: 180px;
}

.quick-group-link-remove {
  position: absolute;
  top: -6px;
  right: -6px;
  z-index: 2;
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

.quick-group-link:hover .quick-group-link-remove,
.quick-group-link-remove:focus-visible {
  opacity: 1;
  pointer-events: auto;
  transform: scale(1);
}

.quick-group-link-remove:hover,
.quick-group-link-remove:focus-visible {
  background: #b91c1c;
}

.quick-link-draggable {
  cursor: grab;
}

.quick-link-item {
  position: relative;
  max-width: 180px;
}

.quick-link-remove {
  position: absolute;
  top: -6px;
  right: -6px;
  z-index: 2;
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

.quick-link-item:hover .quick-link-remove,
.quick-link-remove:focus-visible {
  opacity: 1;
  pointer-events: auto;
  transform: scale(1);
}

.quick-link-remove:hover,
.quick-link-remove:focus-visible {
  background: #b91c1c;
}

.quick-link-draggable:active {
  cursor: grabbing;
}

.quick-link-draggable--dragging {
  opacity: 0.42;
}

.quick-link-draggable--drag-over {
  transform: translateY(-2px);
}

.quick-link-draggable--drag-over :deep(.quick-link-chip) {
  border-color: #2563eb;
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.16);
}

.quick-context-menu {
  position: fixed;
  z-index: 1200;
  width: 188px;
  padding: 6px;
  border: 1px solid rgba(15, 23, 42, 0.12);
  border-radius: 8px;
  color: #374151;
  background: rgba(255, 255, 255, 0.98);
  box-shadow: 0 14px 36px rgba(15, 23, 42, 0.2);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
}

.quick-context-title {
  height: 34px;
  padding: 0 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  color: #6b7280;
  font-size: 12px;
  font-weight: 600;
}

.quick-context-title span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.quick-context-menu button {
  width: 100%;
  height: 34px;
  padding: 0 9px;
  display: flex;
  align-items: center;
  gap: 9px;
  border: 0;
  border-radius: 6px;
  color: inherit;
  background: transparent;
  cursor: pointer;
  font-size: 13px;
  text-align: left;
}

.quick-context-menu button:hover {
  background: rgba(15, 23, 42, 0.06);
}

.quick-context-menu button svg {
  flex-shrink: 0;
  font-size: 17px;
}

.quick-context-divider {
  height: 1px;
  margin: 5px 4px;
  background: rgba(15, 23, 42, 0.08);
}

.quick-context-menu .quick-context-remove {
  color: #dc2626;
}

.quick-context-menu .quick-context-remove:hover {
  background: rgba(220, 38, 38, 0.08);
}

.quick-menu-enter-active,
.quick-menu-leave-active {
  transition: opacity 0.12s ease, transform 0.12s ease;
}

.quick-menu-enter-from,
.quick-menu-leave-to {
  opacity: 0;
  transform: translateY(-3px) scale(0.98);
}

@media (max-width: 480px) {
  .quick-links {
    justify-content: flex-start;
  }

  :deep(.quick-link-chip) {
    flex-shrink: 0;
    max-width: min(180px, calc(100vw - 92px));
  }
}

@media (prefers-color-scheme: dark) {
  .quick-group-chip {
    color: #e5e7eb;
    border-color: rgba(255, 255, 255, 0.2);
    background: rgba(24, 24, 27, 0.68);
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.18);
  }

  .quick-group-chip:hover,
  .quick-group-item--open .quick-group-chip {
    border-color: rgba(255, 255, 255, 0.38);
    background: rgba(39, 39, 42, 0.86);
  }

  .quick-group-item--accept .quick-group-chip {
    border-color: #60a5fa;
    background: rgba(30, 58, 138, 0.48);
  }

  .quick-group-drop-hint {
    color: #93c5fd;
  }

  .quick-group-icon {
    border-color: rgba(63, 63, 70, 0.96);
    background: #27272a;
  }

  .quick-group-popover {
    color: #e5e7eb;
    background: rgba(24, 24, 27, 0.62);
    filter: drop-shadow(0 1px 1px rgba(255, 255, 255, 0.08)) drop-shadow(0 14px 28px rgba(0, 0, 0, 0.36));
  }

  .quick-context-menu {
    color: #e5e7eb;
    border-color: rgba(255, 255, 255, 0.12);
    background: rgba(39, 39, 42, 0.98);
    box-shadow: 0 14px 36px rgba(0, 0, 0, 0.42);
  }

  .quick-context-title {
    color: #a1a1aa;
  }

  .quick-context-menu button:hover {
    background: rgba(255, 255, 255, 0.07);
  }

  .quick-context-divider {
    background: rgba(255, 255, 255, 0.08);
  }
}
</style>
