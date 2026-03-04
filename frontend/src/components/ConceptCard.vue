<template>
  <div class="ccard" :class="{ 'is-editing': isEditing }">
    <div class="ccard-inner">
      <!-- Title Section -->
      <div class="ccard-header">
        <div v-if="!isEditing" class="title-view group">
          <h3 class="c-title" @click="startEditing">{{ localConcept.title || 'Untitled Concept' }}</h3>
          <div class="ccard-actions">
            <button class="icon-action" @click="startEditing" title="Edit"><Pencil :size="14" /></button>
            <button class="icon-action danger" @click="deleteC" title="Delete"><Trash2 :size="14" /></button>
          </div>
        </div>
        <input 
          v-else 
          ref="titleInput"
          v-model="editForm.title" 
          class="inline-input title-input" 
          placeholder="Concept Title..."
          @keydown.enter="save"
        />
      </div>

      <!-- Explanation Section -->
      <div class="ccard-body">
        <div v-if="!isEditing" class="explanation-view" @click="startEditing">
          {{ localConcept.explanation || 'Click to add explanation...' }}
        </div>
        <textarea 
          v-else 
          v-model="editForm.explanation" 
          class="inline-textarea explanation-input" 
          placeholder="Write your thoughts here... (supports notebook feel)"
          rows="1"
          @input="autoResize"
          ref="explanationInput"
        ></textarea>
      </div>

      <!-- Key Points Section -->
      <div class="ccard-footer-note" :class="{ 'has-content': localConcept.keyPoints || isEditing }">
        <div v-if="!isEditing && localConcept.keyPoints" class="kp-view" @click="startEditing">
          <div class="kp-label"><Zap :size="12" /> Key Insight</div>
          <p class="kp-text">{{ localConcept.keyPoints }}</p>
        </div>
        <div v-else-if="isEditing" class="kp-edit">
          <div class="kp-label"><Zap :size="12" /> Important Note</div>
          <textarea 
            v-model="editForm.keyPoints" 
            class="inline-textarea kp-input" 
            placeholder="A quick summary or trick to remember..."
            rows="1"
            @input="autoResize"
          ></textarea>
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
</template>

<script setup>
import { ref, reactive, nextTick, onMounted } from 'vue'
import { Pencil, Trash2, Zap, Check } from 'lucide-vue-next'
import axios from 'axios'

const props = defineProps(['concept', 'isNew'])
const emit = defineEmits(['deleted', 'updated', 'cancel-new'])

const isEditing = ref(props.isNew || false)
const saving = ref(false)
const localConcept = ref({ ...props.concept })
const editForm = reactive({
  title: props.concept.title || '',
  explanation: props.concept.explanation || '',
  keyPoints: props.concept.keyPoints || ''
})

const titleInput = ref(null)
const explanationInput = ref(null)

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
  const el = e.target
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
  if (!editForm.title.trim()) return
  saving.value = true
  try {
    let res
    if (props.isNew || !localConcept.value._id) {
      res = await axios.post('/api/concepts', {
        ...editForm,
        topicId: props.concept.topicId
      })
      // Update topic count hack (simulating backend logic or triggering reload)
    } else {
      res = await axios.put(`/api/concepts/${localConcept.value._id}`, editForm)
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

const deleteC = async () => {
  if (!confirm('Discard this note?')) return
  await axios.delete(`/api/concepts/${localConcept.value._id}`)
  emit('deleted')
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
  border-left: 2px solid transparent;
  padding: 12px 0;
  margin-bottom: 8px;
  transition: all 0.2s;
}

.ccard:hover:not(.is-editing) {
  border-left-color: var(--border);
  padding-left: 16px;
  background: var(--bg-subtle);
  border-radius: 0 8px 8px 0;
}

.ccard.is-editing {
  background: var(--surface);
  border: 1px solid var(--accent-border);
  border-radius: 12px;
  padding: 24px;
  box-shadow: var(--shadow-md);
  margin-bottom: 24px;
}

.ccard-inner {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* Header */
.ccard-header {
  display: flex;
  align-items: center;
}

.title-view {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.c-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
  cursor: text;
}

.ccard-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s;
}

.ccard:hover .ccard-actions {
  opacity: 1;
}

.icon-action {
  padding: 6px;
  border-radius: 6px;
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
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
  padding: 0;
}

.title-input {
  font-size: 20px;
  font-weight: 800;
  color: var(--text-primary);
}

.explanation-input {
  font-size: 15px;
  line-height: 1.6;
  color: var(--text-secondary);
  resize: none;
}

.explanation-view {
  font-size: 15px;
  line-height: 1.6;
  color: var(--text-secondary);
  white-space: pre-wrap;
  cursor: text;
  min-height: 1.6em;
}

/* Footer Note (Zap) */
.ccard-footer-note {
  margin-top: 4px;
}

.kp-view {
  background: var(--warning-subtle);
  border-radius: 8px;
  padding: 10px 14px;
  cursor: text;
}

.kp-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--warning);
  margin-bottom: 4px;
}

.kp-text {
  font-size: 13.5px;
  color: var(--warning);
  font-style: italic;
}

.kp-edit {
  background: var(--warning-subtle);
  border: 1px dashed var(--warning-border);
  border-radius: 8px;
  padding: 12px;
}

.kp-input {
  font-size: 13.5px;
  color: var(--warning);
  font-style: italic;
  resize: none;
}

/* Controls */
.edit-controls {
  display: flex;
  gap: 12px;
  margin-top: 8px;
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
