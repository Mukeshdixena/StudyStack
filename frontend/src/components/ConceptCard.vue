<template>
  <div class="snippet-card" :class="{ 'is-editing': isEditing }">
    <div class="card-tag"><Zap :size="10" /> IMPORTANT SNIPPET</div>
    
    <div class="card-controls">
      <button class="icon-btn" @click="toggleEdit" title="Edit"><Pencil :size="12" /></button>
      <button class="icon-btn danger" @click="showDeleteConfirm = true" title="Delete"><Trash2 :size="12" /></button>
    </div>

    <div class="snippet-editor-wrapper" :class="{ 'is-view-only': !isEditing }">
       <editor-content :editor="snippetEditor" />
       
       <!-- Mini Bubble Menu for Snippets -->
       <div v-if="selection.show && isEditing" class="mini-bubble" :style="{ top: selection.y + 'px', left: selection.x + 'px' }">
         <button @click="snippetEditor.chain().focus().toggleBold().run()" :class="{ 'active': snippetEditor.isActive('bold') }">B</button>
         <button @click="snippetEditor.chain().focus().toggleItalic().run()" :class="{ 'active': snippetEditor.isActive('italic') }">I</button>
         <button @click="snippetEditor.chain().focus().toggleCode().run()" :class="{ 'active': snippetEditor.isActive('code') }">{}</button>
       </div>
    </div>

    <div v-if="isEditing" class="edit-actions">
       <button class="btn-primary-sm" @click="save" :disabled="saving">Update Snippet</button>
       <button class="btn-ghost-sm" @click="toggleEdit">Cancel</button>
    </div>

    <ConfirmModal 
      :show="showDeleteConfirm"
      title="this snippet"
      :isFolder="false"
      @confirm="doDelete"
      @cancel="showDeleteConfirm = false"
    />
  </div>
</template>

<script setup>
import { ref, reactive, onBeforeUnmount, watch } from 'vue'
import { Zap, Pencil, Trash2, Check } from 'lucide-vue-next'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import axios from 'axios'
import ConfirmModal from './ConfirmModal.vue'

const props = defineProps(['concept'])
const emit = defineEmits(['deleted', 'updated'])

const isEditing = ref(false)
const saving    = ref(false)
const showDeleteConfirm = ref(false)
const localConcept = ref({ ...props.concept })
const selection = reactive({ show: false, x: 0, y: 0 })

const snippetEditor = useEditor({
  editable: false,
  content: props.concept.explanation || '',
  extensions: [
    StarterKit,
    Placeholder.configure({ placeholder: 'Explain this snippet...' })
  ],
  onSelectionUpdate: () => handleSelection(),
})

const handleSelection = () => {
  if (!snippetEditor.value || !isEditing.value) return
  const { from, to } = snippetEditor.value.state.selection
  if (from === to) {
    selection.show = false
    return
  }
  const selectionObj = window.getSelection()
  if (!selectionObj || selectionObj.isCollapsed) {
    selection.show = false
    return
  }
  const range = selectionObj.getRangeAt(0)
  const rect = range.getBoundingClientRect()
  const parentRect = document.querySelector('.important-sidebar').getBoundingClientRect()
  
  selection.show = true
  selection.x = rect.left - parentRect.left + (rect.width / 2)
  selection.y = rect.top - parentRect.top - 40
}

onBeforeUnmount(() => {
  snippetEditor.value.destroy()
})

const toggleEdit = () => {
  isEditing.value = !isEditing.value
  snippetEditor.value.setEditable(isEditing.value)
  if (!isEditing.value) {
    snippetEditor.value.commands.setContent(localConcept.value.explanation)
  }
}

const save = async () => {
  saving.value = true
  const html = snippetEditor.value.getHTML()
  try {
    const res = await axios.put(`/api/concepts/${localConcept.value._id}`, {
      explanation: html,
      title: 'Snippet',
      topicId: localConcept.value.topicId
    })
    localConcept.value = res.data
    isEditing.value = false
    snippetEditor.value.setEditable(false)
    emit('updated')
  } catch (err) { console.error(err) }
  finally { saving.value = false }
}

watch(() => props.concept.explanation, (newVal) => {
  if (!isEditing.value) {
    snippetEditor.value.commands.setContent(newVal)
    localConcept.value.explanation = newVal
  }
})

const doDelete = async () => {
  try {
    await axios.delete(`/api/concepts/${localConcept.value._id}`)
    emit('deleted')
  } catch (e) { console.error(e) }
}
</script>

<style scoped>
.snippet-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 14px;
  margin-bottom: 12px;
  position: relative;
  transition: transform 0.15s, border-color 0.15s;
}

.snippet-card:hover {
  border-color: var(--accent-border);
  transform: translateY(-2px);
  box-shadow: var(--shadow-sm);
}

.card-tag {
  font-size: 8.5px;
  font-weight: 800;
  text-transform: uppercase;
  color: var(--accent);
  letter-spacing: 0.05em;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 4px;
  opacity: 0.7;
}

.card-controls {
  position: absolute;
  top: 10px;
  right: 10px;
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.1s;
}

.snippet-card:hover .card-controls { opacity: 1; }

.icon-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  color: var(--text-muted);
  border-radius: 4px;
}
.icon-btn:hover { background: var(--bg-subtle); color: var(--text-primary); }
.icon-btn.danger:hover { color: #ef4444; background: #fee2e2; }

.snippet-editor-wrapper {
  margin: 0; 
  font-size: 13px; 
  line-height: 1.6; 
  color: var(--text-secondary);
  position: relative;
}

.snippet-editor-wrapper :deep(.ProseMirror) {
  outline: none;
  min-height: 20px;
}

.snippet-editor-wrapper :deep(.ProseMirror p) { margin-bottom: 8px; }
.snippet-editor-wrapper :deep(.ProseMirror h1) { font-size: 18px; margin: 12px 0 6px; }
.snippet-editor-wrapper :deep(.ProseMirror h2) { font-size: 15px; margin: 10px 0 4px; }
.snippet-editor-wrapper :deep(.ProseMirror ul) { padding-left: 16px; margin-bottom: 8px; }

.snippet-editor-wrapper :deep(.ProseMirror code) {
  background: rgba(135,131,120,0.15); color: #eb5757; border-radius: 3px; padding: 0.1em 0.3em; font-size: 90%;
}

.snippet-editor-wrapper :deep(.ProseMirror p.is-editor-empty:first-child::before) {
  content: attr(data-placeholder); float: left; color: #adb5bd; pointer-events: none; height: 0;
}

.mini-bubble {
  position: absolute; z-index: 100; display: flex; background: #1e1e1e;
  padding: 3px; border-radius: 6px; gap: 2px; transform: translate(-50%, -100%);
}
.mini-bubble button {
  background: none; border: none; color: white; font-size: 10px; font-weight: 700;
  cursor: pointer; padding: 4px 8px; border-radius: 4px;
}
.mini-bubble button:hover { background: rgba(255,255,255,0.1); }
.mini-bubble button.active { color: var(--accent); }

.is-view-only :deep(.ProseMirror) {
  cursor: default;
}

.is-editing {
  border-color: var(--accent);
  box-shadow: 0 10px 30px -10px rgba(0,0,0,0.1);
  background: #fff;
}

/* Edit Mode */
.minimal-textarea {
  width: 100%;
  border: none;
  background: var(--bg-subtle);
  border-radius: 4px;
  padding: 8px;
  font-size: 13.5px;
  color: var(--text-primary);
  outline: none;
  resize: none;
  font-family: inherit;
}

.edit-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 8px;
}

.btn-primary-sm {
  background: var(--accent);
  color: white;
  border: none;
  padding: 2px 10px;
  font-size: 11.5px;
  font-weight: 600;
  border-radius: 4px;
  cursor: pointer;
}

.btn-ghost-sm {
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 11.5px;
  cursor: pointer;
}
</style>
