<template>
  <div class="ccard" :class="{ 'is-editing': isEditing }">
    <div class="ccard-inner">
      <div v-if="!isEditing" class="ccard-actions-float">
        <button class="icon-action" @click="startEditing" title="Edit"><Pencil :size="14" /></button>
        <button class="icon-action danger" @click="deleteC" title="Delete"><Trash2 :size="14" /></button>
      </div>

      <!-- Explanation Section -->
      <div class="ccard-body">
        <textarea 
          v-if="isEditing" 
          v-model="editForm.explanation" 
          class="inline-textarea explanation-input" 
          placeholder="Write your thoughts here... (Markdown supported)"
          rows="1"
          @input="autoResize"
          ref="explanationInput"
        ></textarea>
        <div v-else class="explanation-markdown" @click="startEditing" v-html="renderMarkdown(localConcept.explanation || 'Click to add explanation...')">
        </div>
      </div>

      <!-- Save/Cancel Actions -->
      <div v-if="isEditing" class="edit-controls">
        <button class="btn-save" @click="save" :disabled="saving">
          <Check v-if="!saving" :size="14" />
          <span v-else class="spinner-sm"></span>
          Done
        </button>
        <button class="btn-cancel" @click="cancelEdit">Cancel</button>
      </div>
    </div>
  </div>

  <ConfirmModal 
    :show="showDeleteConfirm"
    :title="localConcept.title"
    :isFolder="false"
    :loading="deleting"
    @confirm="doDelete"
    @cancel="showDeleteConfirm = false"
  />
</template>

<script setup>
import { ref, reactive, nextTick, onMounted } from 'vue'
import { Pencil, Trash2, Zap, Check } from 'lucide-vue-next'
import ConfirmModal from './ConfirmModal.vue'
import axios from 'axios'
import { marked } from 'marked'
import hljs from 'highlight.js'
import 'highlight.js/styles/github-dark.css'

marked.setOptions({
  highlight: function(code, lang) {
    if (lang && hljs.getLanguage(lang)) {
      return hljs.highlight(code, { language: lang }).value
    }
    return hljs.highlightAuto(code).value
  },
  breaks: true
})

const props = defineProps(['concept', 'isNew'])
const emit = defineEmits(['deleted', 'updated', 'cancel-new'])

const isEditing = ref(props.isNew || false)
const saving = ref(false)
const showDeleteConfirm = ref(false)
const deleting = ref(false)
const localConcept = ref({ ...props.concept })
const editForm = reactive({
  title: props.concept.title || '',
  explanation: props.concept.explanation || '',
  keyPoints: props.concept.keyPoints || ''
})

const titleInput = ref(null)
const explanationInput = ref(null)

const renderMarkdown = (content) => {
  if (!content) return ''
  return marked(content)
}

const startEditing = () => {
  isEditing.value = true
  nextTick(() => {
    autoResizeAll()
    if (titleInput.value) titleInput.value.focus()
  })
}

const cancelEdit = () => {
  if (props.isNew) {
    emit('cancel-new')
  } else {
    isEditing.value = false
    Object.assign(editForm, {
      title: localConcept.value.title,
      explanation: localConcept.value.explanation,
      keyPoints: localConcept.value.keyPoints
    })
  }
}

const autoResize = (e) => {
  const el = e?.target || e
  if (!el || !el.style) return
  el.style.height = 'auto'
  el.style.height = el.scrollHeight + 'px'
}

const autoResizeAll = () => {
  const textareas = document.querySelectorAll('.ccard.is-editing textarea')
  textareas.forEach(el => {
    el.style.height = 'auto'
    el.style.height = el.scrollHeight + 'px'
  })
}

const save = async () => {
  if (!editForm.explanation.trim()) return
  saving.value = true
  try {
    let res
    const payload = {
      explanation: editForm.explanation,
      title: 'Note',
      keyPoints: '',
      topicId: props.concept.topicId
    }
    if (props.isNew || !localConcept.value._id) {
      res = await axios.post('/api/concepts', payload)
    } else {
      res = await axios.put(`/api/concepts/${localConcept.value._id}`, payload)
    }
    localConcept.value = res.data
    isEditing.value = false
    emit('updated')
  } catch (err) {
    console.error('Save failed', err)
  } finally {
    saving.value = false
  }
}

const deleteC = () => {
  showDeleteConfirm.value = true
}

const doDelete = async () => {
  deleting.value = true
  try {
    await axios.delete(`/api/concepts/${localConcept.value._id}`)
    emit('deleted')
  } catch (e) {
    console.error('Delete failed:', e)
    alert('Failed to delete concept.')
  } finally {
    deleting.value = false
    showDeleteConfirm.value = false
  }
}

onMounted(() => {
  if (props.isNew) {
    nextTick(autoResizeAll)
  }
})
</script>

<style scoped>
.ccard {
  background: transparent;
  padding: 8px 12px;
  margin-bottom: 2px;
  border-left: 3px solid transparent;
  transition: all 0.1s;
  border-radius: 4px;
}

.ccard:hover:not(.is-editing) {
  background: var(--bg-subtle);
  border-left-color: var(--border);
}

.ccard.is-editing {
  background: var(--surface);
  border: 1px solid var(--accent-border);
  border-radius: 8px;
  padding: 20px;
  box-shadow: var(--shadow-md);
  margin: 12px 0;
}

.ccard-inner {
  display: flex;
  flex-direction: column;
}

.ccard-actions-float {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.1s;
  position: absolute;
  top: 8px;
  right: 8px;
}

.ccard:hover .ccard-actions-float {
  opacity: 1;
}

.icon-action {
  padding: 4px;
  border-radius: 4px;
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
}

.icon-action:hover {
  background: var(--bg-subtle);
  color: var(--text-primary);
}

.icon-action.danger:hover {
  color: var(--danger);
  background: #fee2e2;
}

/* Inputs */
.inline-input, .inline-textarea {
  width: 100%;
  border: none;
  background: transparent;
  outline: none;
  color: var(--text-primary);
  font-family: inherit;
}

/* Title unused */

.explanation-input {
  font-size: 15px;
  line-height: 1.6;
  color: var(--text-secondary);
  resize: none;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  min-height: 100px;
}

.explanation-markdown :deep(p) { margin: 0 0 8px; font-size: 15px; line-height: 1.6; color: var(--text-secondary); }
.explanation-markdown :deep(ul), .explanation-markdown :deep(ol) { margin: 8px 0; padding-left: 20px; color: var(--text-secondary); }
.explanation-markdown :deep(li) { margin-bottom: 4px; font-size: 14.5px; }
.explanation-markdown :deep(strong) { color: var(--text-primary); font-weight: 700; }
.explanation-markdown :deep(code) { 
  background: var(--bg-subtle); 
  padding: 2px 5px; 
  border-radius: 4px; 
  font-size: 13px; 
  font-family: inherit;
  color: var(--accent);
}
.explanation-markdown :deep(pre) {
  background: #1e1e1e;
  padding: 16px;
  border-radius: 8px;
  overflow-x: auto;
  margin: 12px 0;
}
.explanation-markdown :deep(pre code) {
  background: transparent;
  padding: 0;
  color: #d4d4d4;
  font-size: 13px;
  line-height: 1.5;
}
.explanation-markdown :deep(h1), .explanation-markdown :deep(h2), .explanation-markdown :deep(h3) {
  color: var(--text-primary);
  margin-top: 16px;
  margin-bottom: 8px;
}

/* Footer Note (Callout) - unused but kept for schema compatibility */
.ccard-footer-note {
  display: none;
}

/* Controls */
.edit-controls {
  display: flex;
  gap: 12px;
  margin-top: 12px;
}

.btn-save {
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--accent);
  color: white;
  border: none;
  padding: 6px 16px;
  border-radius: 6px;
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
}

.btn-cancel {
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
}

.btn-cancel:hover {
  text-decoration: underline;
}

.spinner-sm {
  width: 12px;
  height: 12px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }
</style>
