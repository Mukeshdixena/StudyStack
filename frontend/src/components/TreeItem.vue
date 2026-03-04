<template>
  <div 
    class="tree-item" 
    :style="{ '--level': level }"
    :draggable="true"
    @dragstart="onDragStart"
    @dragover.prevent="onDragOver"
    @dragleave="onDragLeave"
    @drop.stop="onDrop"
  >
    <div 
      class="item-header" 
      :class="{ 
        'is-active': activeId === item.id, 
        'is-folder': item.isFolder,
        'drag-over': isDragOver 
      }"
      @click="toggle"
    >
      <div class="header-content">
        <!-- Chevron for folder -->
        <ChevronRight 
          v-if="item.isFolder" 
          :size="14" 
          class="chevron" 
          :class="{ 'is-expanded': isOpen }"
        />
        <div v-else class="indent"></div>
        
        <!-- Icon based on type -->
        <Folder v-if="item.isFolder" :size="16" class="icon folder-icon" />
        <FileText v-else :size="16" class="icon topic-icon" />
        
        <span class="name">{{ item.name }}</span>
      </div>
      
      <!-- Actions -->
      <div class="actions">
        <template v-if="item.isFolder">
          <button 
            class="action-btn" 
            @click.stop.prevent="handleCreate(true)" 
            title="New Folder"
            draggable="false"
          >
            <FolderPlus :size="13" />
          </button>
          <button 
            class="action-btn" 
            @click.stop.prevent="handleCreate(false)" 
            title="New Topic"
            draggable="false"
          >
            <Plus :size="13" />
          </button>
        </template>
        <button 
          class="action-btn delete-btn" 
          @click.stop.prevent="handleDelete" 
          @mousedown.stop
          title="Delete"
          draggable="false"
        >
          <Trash2 :size="13" />
        </button>
      </div>
    </div>

    <!-- Recursive Children -->
    <div v-if="item.isFolder && isOpen" class="item-children">
      <TreeItem 
        v-for="child in item.children" 
        :key="child.id" 
        :item="child" 
        :level="level + 1"
        :active-id="activeId"
        @select="handleChildSelect"
        @delete="handleChildDelete"
        @move="handleChildMove"
        @create="handleChildCreate"
      />
      <div v-if="item.children.length === 0" class="empty-folder" :style="{ paddingLeft: `calc(32px + ${level * 14}px)` }">
        Empty folder
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { ChevronRight, Folder, FileText, Trash2, Plus, FolderPlus } from 'lucide-vue-next';

const props = defineProps({
  item: {
    type: Object,
    required: true
  },
  level: {
    type: Number,
    default: 0
  },
  activeId: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['select', 'delete', 'move', 'create']);

const handleCreate = (isFolder) => {
  console.log('TreeItem: handleCreate', { isFolder, id: props.item.id });
  emit('create', { isFolder, parentId: props.item.id });
};

const handleDelete = () => {
  console.log('TreeItem: handleDelete', props.item.id);
  emit('delete', props.item.id);
};

const handleChildSelect = (item) => emit('select', item);
const handleChildDelete = (id) => {
  console.log('TreeItem: bubbling child delete', id);
  emit('delete', id);
};
const handleChildMove = (data) => emit('move', data);
const handleChildCreate = (data) => emit('create', data);

const isOpen = ref(true);
const isDragOver = ref(false);

const toggle = () => {
  if (props.item.isFolder) {
    isOpen.value = !isOpen.value;
  } else {
    emit('select', props.item);
  }
};

const onDragStart = (e) => {
  if (e.target.closest('.actions') || e.target.closest('button')) {
    e.preventDefault();
    return;
  }
  e.dataTransfer.setData('itemId', props.item.id);
  e.dataTransfer.effectAllowed = 'move';
};

const onDragOver = (e) => {
  if (props.item.isFolder) {
    isDragOver.value = true;
  }
};

const onDragLeave = () => {
  isDragOver.value = false;
};

const onDrop = (e) => {
  isDragOver.value = false;
  const id = e.dataTransfer.getData('itemId');
  
  // Don't drop on self or children (simple check: id != item.id)
  if (id && id !== props.item.id && props.item.isFolder) {
    emit('move', { id, parentId: props.item.id });
  }
};
</script>

<style scoped>
.tree-item {
  user-select: none;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
}

.item-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 8px;
  padding-left: calc(4px + (var(--level) * 14px));
  cursor: pointer;
  border-radius: 4px;
  margin: 0px 4px;
  transition: background 0.1s, color 0.1s;
  color: var(--text-secondary);
  position: relative;
}

.item-header:hover {
  background: var(--bg-hover, rgba(0, 0, 0, 0.04));
  color: var(--text-primary);
}

[data-theme="dark"] .item-header:hover {
  background: rgba(255, 255, 255, 0.05);
}

.item-header.is-active {
  background: var(--accent-subtle);
  color: var(--accent);
  font-weight: 600;
}

.item-header.drag-over {
  background: var(--accent-subtle) !important;
  outline: 1px dashed var(--accent);
}

.header-content {
  display: flex;
  align-items: center;
  gap: 6px;
  overflow: hidden;
  flex: 1;
}

.chevron {
  transition: transform 0.15s ease;
  color: var(--text-muted);
  opacity: 0.7;
  flex-shrink: 0;
}

.chevron.is-expanded {
  transform: rotate(90deg);
}

.indent {
  width: 14px;
  flex-shrink: 0;
}

.icon {
  flex-shrink: 0;
  color: var(--text-muted);
  opacity: 0.8;
}

.folder-icon {
  color: #ffca28;
}

[data-theme="dark"] .folder-icon {
  color: #fdd835;
}

.name {
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  letter-spacing: -0.015em;
}

.actions {
  display: none;
  align-items: center;
  gap: 4px;
}

.item-header:hover .actions {
  display: flex;
}

.action-btn {
  background: none;
  border: none;
  padding: 5px;
  border-radius: 6px;
  cursor: pointer;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.1s;
  pointer-events: auto;
}

.action-btn:hover {
  background: rgba(0, 0, 0, 0.08);
  color: var(--text-primary);
}

.delete-btn:hover {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.15);
  box-shadow: 0 0 0 1px rgba(239, 68, 68, 0.2);
}

[data-theme="dark"] .action-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.empty-folder {
  font-size: 11px;
  color: var(--text-muted);
  font-style: italic;
  padding: 4px 0;
}
</style>
