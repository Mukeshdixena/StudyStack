<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="show" class="notion-overlay" @click.self="$emit('close')">
        <div class="notion-canvas">
          <!-- Notion Style Toolbar -->
          <nav class="notion-nav">
             <div class="nav-left">
               <div class="breadcrumb">
                 <span class="b-item"><StickyNote :size="14" /> Notes</span>
                 <span class="sep">/</span>
                 <span class="b-item current">Global Scratchpad</span>
               </div>
             </div>
             <div class="nav-right">
               <button class="nav-btn" @click="loadNotes" :class="{ 'spinning': loading }">
                 <RotateCcw :size="14" />
               </button>
               <button class="nav-btn" @click="$emit('close')"><X :size="18" /></button>
             </div>
          </nav>

          <!-- The "Piece of Paper" -->
          <div class="notion-page">
            <header class="page-header">
              <div class="page-icon">📓</div>
              <h1 class="page-title">Important Concepts & Tricks</h1>
              <p class="page-description">
                A unified scratchpad for all your DSA insights. Quick capture anything, then organize by topic.
              </p>
            </header>

            <div class="page-content">
              <!-- No Notes State -->
              <div v-if="!loading && groupedNotes.length === 0" class="empty-state">
                <p>No notes found. Click any topic toggle below to start drafting.</p>
              </div>

              <!-- Topic Blocks (The Toggle Sections) -->
              <div class="blocks-container">
                <div v-for="group in groupedNotes" :key="group.topicId" class="topic-block">
                  <div class="toggle-row" @click="toggleGroup(group.topicId)">
                    <div class="toggle-icon" :class="{ 'is-open': !collapsed[group.topicId] }">
                      <ChevronRight :size="18" />
                    </div>
                    <span class="toggle-label">{{ group.topicName }}</span>
                    <span class="count-pill">{{ group.notes.length }}</span>
                  </div>

                  <Transition name="expand">
                    <div v-show="!collapsed[group.topicId]" class="toggle-content">
                      <!-- Individual Note "Blocks" -->
                      <div v-for="note in group.notes" :key="note._id" class="note-block group">
                        <div class="note-block-handle">
                          <GripVertical :size="14" />
                        </div>
                        
                        <div class="note-block-body">
                          <h4 v-if="false" class="note-block-title" @click="startEdit(note)">
                            {{ note.title || 'Untitled Note' }}
                          </h4>

                          <textarea 
                            v-if="editingId === note._id"
                            v-model="editForm.explanation"
                            class="inline-text-input"
                            rows="1"
                            @input="autoResize"
                            ref="textInput"
                            placeholder="Start typing... (Markdown supported)"
                          ></textarea>
                          <div v-else class="note-block-markdown" @click="startEdit(note)" v-html="renderMarkdown(note.explanation || '*Empty note content...*')">
                          </div>

                          <!-- Key Insight / Forgettable bit -->
                          <div class="note-block-callout" v-if="note.keyPoints || editingId === note._id">
                             <div v-if="false" class="callout-icon"><Zap :size="12" /></div>
                             <div class="callout-content">
                                <!-- Hidden keyPoints -->
                             </div>
                          </div>
                        </div>

                        <!-- Hover Actions -->
                        <div class="note-block-actions">
                           <button class="action-btn-del" @click="deleteNote(note._id)" title="Delete block">
                             <Trash2 :size="14" />
                           </button>
                        </div>
                      </div>

                      <!-- Inline "New Block" trigger -->
                      <div class="add-block-placeholder" @click="addNewToTopic(group.topicId)">
                        <Plus :size="16" />
                        <span>Add a note in {{ group.topicName }}</span>
                      </div>
                    </div>
                  </Transition>
                </div>
              </div>
            </div>
            
            <!-- Global Floating Add at Bottom Right -->
            <button class="global-add-fab" @click="globalNewNote" title="New Quick Note">
                <Plus :size="24" />
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, reactive, computed, watch, nextTick } from 'vue'
import { 
  X, GripVertical, ChevronRight, Zap, Plus, Trash2, 
  StickyNote, RotateCcw 
} from 'lucide-vue-next'
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

const props = defineProps(['show'])
const emit = defineEmits(['close'])

const notes = ref([])
const allTopics = ref([])
const loading = ref(false)
const collapsed = ref({})
const editingId = ref(null)

const renderMarkdown = (content) => {
  if (!content) return ''
  return marked(content)
}

const titleInput = ref(null)
const textInput = ref(null)

const editForm = reactive({
  title: '',
  explanation: '',
  keyPoints: ''
})

const loadNotes = async () => {
  if (!props.show) return
  loading.value = true
  try {
    const [notesRes, topicsRes] = await Promise.all([
      axios.get('/api/concepts'),
      axios.get('/api/topics')
    ])
    notes.value = notesRes.data
    allTopics.value = topicsRes.data.filter(t => !t.isFolder)
  } catch (err) {
    console.error('Load failed', err)
  } finally {
    loading.value = false
  }
}

const groupedNotes = computed(() => {
  const groups = {}
  notes.value.forEach(note => {
    const tid = note.topicId?._id || 'other'
    const tname = note.topicId?.name || 'Uncategorized'
    if (!groups[tid]) {
      groups[tid] = { topicId: tid, topicName: tname, notes: [] }
    }
    groups[tid].notes.push(note)
  })
  return Object.values(groups)
})

const toggleGroup = (id) => {
  collapsed.value[id] = !collapsed.value[id]
}

const startEdit = (note) => {
  editingId.value = note._id
  Object.assign(editForm, {
    title: note.title,
    explanation: note.explanation,
    keyPoints: note.keyPoints || ''
  })
  nextTick(() => {
    if (textInput.value) autoResize({ target: textInput.value })
  })
}

const saveEdit = async (id) => {
  if (!editForm.explanation.trim()) {
      editingId.value = null
      return
  }
  try {
    await axios.put(`/api/concepts/${id}`, { 
      explanation: editForm.explanation,
      title: 'Note', // Default title for internal tracking if needed
      keyPoints: '' 
    })
    editingId.value = null
    await loadNotes()
  } catch (err) {
    console.error('Update failed', err)
  }
}

const deleteNote = async (id) => {
  if (!confirm('Permanently delete this block?')) return
  try {
    await axios.delete(`/api/concepts/${id}`)
    await loadNotes()
  } catch (err) {
    console.error('Delete failed', err)
  }
}

const addNewToTopic = async (topicId) => {
  try {
    const res = await axios.post('/api/concepts', {
      title: '',
      explanation: '',
      topicId: topicId
    })
    await loadNotes()
    startEdit(res.data)
  } catch (e) { console.error(e) }
}

const globalNewNote = async () => {
  if (allTopics.value.length === 0) return
  const tid = allTopics.value[0]._id
  await addNewToTopic(tid)
}

const autoResize = (e) => {
  const el = e.target
  el.style.height = 'auto'
  el.style.height = el.scrollHeight + 'px'
}

watch(() => props.show, (val) => {
  if (val) loadNotes()
})
</script>

<style scoped>
.notion-overlay {
  position: fixed;
  inset: 0;
  z-index: 2000;
  background: var(--bg); /* Use theme bg but fully opaque */
  display: flex;
  flex-direction: column;
}

.notion-canvas {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* Nav Bar */
.notion-nav {
  height: 45px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: var(--text-muted);
}

.breadcrumb .current { color: var(--text-primary); font-weight: 600; }
.breadcrumb .sep { opacity: 0.3; }

.nav-right { display: flex; gap: 8px; }
.nav-btn {
  padding: 6px; border-radius: 6px; border: none; background: transparent;
  color: var(--text-secondary); cursor: pointer; transition: all 0.15s;
}
.nav-btn:hover { background: var(--bg-subtle); color: var(--text-primary); }

/* The Page Layout */
.notion-page {
  flex: 1;
  overflow-y: auto;
  background: var(--bg);
  padding: 60px 0 120px;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}

.page-header {
  width: 100%;
  max-width: 720px;
  margin-bottom: 40px;
  padding: 0 24px;
}

.page-icon { font-size: 64px; margin-bottom: 12px; }
.page-title { font-size: 42px; font-weight: 800; color: var(--text-primary); margin-bottom: 8px; }
.page-description { font-size: 16px; color: var(--text-muted); line-height: 1.6; }

.page-content {
  width: 100%;
  max-width: 720px;
  padding: 0 24px;
}

/* Toggle Blocks */
.topic-block { margin-bottom: 2px; }

.toggle-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  margin-left: -8px;
  transition: background 0.1s;
  user-select: none;
}

.toggle-row:hover { background: var(--bg-subtle); }

.toggle-icon {
  display: flex; align-items: center; justify-content: center;
  color: var(--text-muted); transition: transform 0.2s;
}

.toggle-icon.is-open { transform: rotate(90deg); }

.toggle-label { font-size: 15px; font-weight: 700; color: var(--text-primary); }
.count-pill {
  font-size: 11px; padding: 1px 6px; border-radius: 99px;
  background: var(--bg-subtle); color: var(--text-muted); font-weight: 600;
}

.toggle-content {
  padding-left: 24px;
  margin-top: 4px;
  display: flex;
  flex-direction: column;
}

/* Note Block Item */
.note-block {
  display: flex;
  padding: 8px 12px;
  margin-bottom: 2px;
  border-radius: 6px;
  position: relative;
  transition: background 0.1s;
}

.note-block:hover { background: var(--bg-subtle); }

.note-block-handle {
  width: 16px; display: flex; align-items: center; color: var(--border);
  opacity: 0; transition: opacity 0.1s; cursor: grab;
}

.note-block:hover .note-block-handle { opacity: 1; }

.note-block-body { flex: 1; min-width: 0; padding-left: 8px; }

.note-block-title {
  font-size: 16px; font-weight: 700; color: var(--text-primary);
  margin-bottom: 4px; cursor: text;
}

.note-block-text {
  font-size: 15px; color: var(--text-secondary); line-height: 1.6;
  white-space: pre-wrap; cursor: text;
}

/* Inline Editing */
.inline-title-input {
  width: 100%; border: none; background: transparent; outline: none;
  font-size: 16px; font-weight: 700; color: var(--text-primary);
  margin-bottom: 4px; font-family: inherit;
}

.inline-text-input {
  width: 100%; border: none; background: transparent; outline: none;
  font-size: 15px; color: var(--text-secondary); line-height: 1.6;
  resize: none; font-family: 'JetBrains Mono', 'Fira Code', monospace;
  min-height: 100px;
}

/* Markdown Rendering Styles */
.note-block-markdown :deep(p) { margin: 0 0 8px; font-size: 15px; line-height: 1.6; color: var(--text-secondary); }
.note-block-markdown :deep(ul), .note-block-markdown :deep(ol) { margin: 8px 0; padding-left: 20px; color: var(--text-secondary); }
.note-block-markdown :deep(li) { margin-bottom: 4px; font-size: 14.5px; }
.note-block-markdown :deep(strong) { color: var(--text-primary); font-weight: 700; }
.note-block-markdown :deep(code) { 
  background: var(--bg-subtle); 
  padding: 2px 5px; 
  border-radius: 4px; 
  font-size: 13px; 
  font-family: inherit;
  color: var(--accent);
}
.note-block-markdown :deep(pre) {
  background: #1e1e1e;
  padding: 16px;
  border-radius: 8px;
  overflow-x: auto;
  margin: 12px 0;
}
.note-block-markdown :deep(pre code) {
  background: transparent;
  padding: 0;
  color: #d4d4d4;
  font-size: 13px;
  line-height: 1.5;
}
.note-block-markdown :deep(h1), .note-block-markdown :deep(h2), .note-block-markdown :deep(h3) {
  color: var(--text-primary);
  margin-top: 16px;
  margin-bottom: 8px;
}

/* Callout */
.note-block-callout {
  margin-top: 12px;
  background: var(--warning-subtle);
  border-left: 3px solid var(--warning);
  padding: 10px 14px;
  border-radius: 4px;
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.callout-icon { color: var(--warning); padding-top: 2px; }
.callout-content { font-size: 14px; color: var(--warning); font-style: italic; flex: 1; }

.inline-callout-input {
  width: 100%; border: none; background: transparent; outline: none;
  font-size: inherit; font-style: inherit; color: inherit; font-family: inherit;
}

/* Actions */
.note-block-actions {
  opacity: 0; transition: opacity 0.1s;
  position: absolute; right: 8px; top: 8px;
}

.note-block:hover .note-block-actions { opacity: 1; }

.action-btn-del {
  padding: 4px; border: none; background: transparent; color: var(--text-muted);
  cursor: pointer; border-radius: 4px;
}
.action-btn-del:hover { background: #fee2e2; color: #ef4444; }

/* Add Block Row */
.add-block-placeholder {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 12px; color: var(--text-muted);
  font-size: 14px; cursor: pointer; border-radius: 6px;
  margin-top: 4px; transition: all 0.1s;
}

.add-block-placeholder:hover { background: var(--bg-subtle); color: var(--text-secondary); }

/* Global FAB */
.global-add-fab {
  position: fixed; bottom: 32px; right: 32px;
  width: 56px; height: 56px; border-radius: 16px;
  background: var(--accent); color: #fff;
  border: none; cursor: pointer;
  box-shadow: 0 8px 16px rgba(0,0,0,0.2);
  display: flex; align-items: center; justify-content: center;
  transition: transform 0.2s, box-shadow 0.2s;
  z-index: 2100;
}

.global-add-fab:hover { transform: translateY(-4px); box-shadow: 0 12px 24px rgba(0,0,0,0.3); }

/* Animations */
.fade-enter-active, .fade-leave-active { transition: opacity 0.25s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.expand-enter-active, .expand-leave-active { transition: all 0.2s ease; overflow: hidden; }
.expand-enter-from, .expand-leave-to { opacity: 0; max-height: 0; }

.spinning { animation: rotate 1s linear infinite; }
@keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

.empty-state { padding: 40px 0; text-align: center; color: var(--text-muted); font-size: 14px; border: 1px dashed var(--border); border-radius: 12px; }
</style>
