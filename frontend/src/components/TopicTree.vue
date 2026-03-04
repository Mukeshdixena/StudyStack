<template>
  <div class="topic-tree" @dragover.prevent @drop="onDropRoot">
    <TreeItem 
      v-for="item in treeData" 
      :key="item.id" 
      :item="item" 
      :active-id="activeId"
      @select="onSelect"
      @delete="$emit('delete', $event)"
      @move="$emit('move', $event)"
      @create="$emit('create', $event)"
    />
    <div v-if="!treeData.length" class="tree-empty">
      Drag items here or create a new folder.
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import TreeItem from './TreeItem.vue';

const props = defineProps({
  topics: {
    type: Array,
    default: () => []
  },
  activeId: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['select', 'delete', 'move', 'create']);
const router = useRouter();

// Build tree based on parentId
const treeData = computed(() => {
  const map = {};
  const root = [];

  // First pass: create nodes
  props.topics.forEach(t => {
    map[t._id] = {
      id: t._id,
      name: t.name,
      isFolder: t.isFolder,
      parentId: t.parentId,
      children: t.isFolder ? [] : null
    };
  });

  // Second pass: build hierarchy
  props.topics.forEach(t => {
    const node = map[t._id];
    if (t.parentId && map[t.parentId] && map[t.parentId].isFolder) {
      if (!map[t.parentId].children) map[t.parentId].children = [];
      map[t.parentId].children.push(node);
    } else {
      // If no parent, or parent doesn't exist/isn't folder, it's a root item
      root.push(node);
    }
  });

  return root;
});

const onSelect = (item) => {
  if (item.id && !item.isFolder) {
    router.push(`/topic/${item.id}`);
  }
};

const onDropRoot = (e) => {
  const id = e.dataTransfer.getData('itemId');
  if (id) {
    emit('move', { id, parentId: null });
  }
};
</script>

<style scoped>
.topic-tree {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-height: 50px;
}
.tree-empty {
  font-size: 11px;
  color: var(--text-muted);
  padding: 20px 10px;
  text-align: center;
  border: 1px dashed var(--border);
  margin: 10px;
  border-radius: 8px;
}
</style>
