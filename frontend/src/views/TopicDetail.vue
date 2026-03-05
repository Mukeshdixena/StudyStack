<template>
  <div v-if="topic" class="study-view">
    <!-- ═══ HEADER ═══ -->
    <header class="study-header">
      <div class="header-left">
        <RouterLink to="/" class="back-link"><ChevronLeft :size="16" /> Back</RouterLink>
        <h1 class="topic-title">{{ topic.name }}</h1>
      </div>
      <div class="header-actions">
        <div v-if="activeTab === 'theory'" class="status-indicator" :class="{ saving: savingStatus === 'saving' }">
          <span v-if="savingStatus === 'saving'">Saving...</span>
          <span v-else-if="savingStatus === 'saved'" class="text-success"><Check :size="12" /> Saved</span>
        </div>

        <button v-if="activeTab === 'theory'" class="btn-minimal" @click="toggleTheory">
          <Edit3 v-if="!isEditingTheory" :size="14" />
          <Check v-else :size="14" />
          {{ isEditingTheory ? 'Done Reading' : 'Edit Theory' }}
        </button>
        
        <div class="tab-switcher">
          <button v-for="t in ['theory', 'questions', 'pdf']" :key="t" 
                  :class="{ active: activeTab === t }" @click="activeTab = t">
            {{ t.charAt(0).toUpperCase() + t.slice(1) }}
          </button>
        </div>

        <div class="header-menu-wrap">
          <button class="btn-icon-ghost" :class="{ 'active-accent': showSidebar }" @click="showSidebar = !showSidebar" title="Toggle Sidebar">
            <Zap :size="16" />
          </button>
        </div>

        <div class="header-menu-wrap">
          <button class="btn-icon-ghost" @click="showMenu = !showMenu"><MoreVertical :size="16" /></button>
          <div v-if="showMenu" class="dropdown-menu">
            <button @click="openEditModal"><Edit3 :size="13" /> Edit Topic</button>
            <button class="danger" @click="confirmDeleteTopic"><Trash2 :size="13" /> Delete Topic</button>
          </div>
        </div>
      </div>
    </header>

    <div class="study-container">
      <!-- ═══ MAIN CONTENT ═══ -->
      <main class="main-note-area" :class="{ 'is-editing': isEditingTheory }">
        
        <div v-if="activeTab === 'theory'" class="theory-wrapper">
          <!-- Tiptap Editor / Reader -->
          <div class="tiptap-container" :class="{ 'is-editing': isEditingTheory }">
            <editor-content :editor="editor" />
            
            <!-- Custom Selection Bubble (Robust Alternative to Tiptap BubbleMenu) -->
            <div v-if="selection.show" class="bubble-menu-manual" :style="{ top: selection.y + 'px', left: selection.x + 'px' }">
              <button @click="editor.chain().focus().toggleBold().run()" :class="{ 'is-active': editor.isActive('bold') }">
                <span style="font-weight:900">B</span>
              </button>
              <button @click="editor.chain().focus().toggleItalic().run()" :class="{ 'is-active': editor.isActive('italic') }">
                <span style="font-style:italic">I</span>
              </button>
              <button @click="editor.chain().focus().toggleCode().run()" :class="{ 'is-active': editor.isActive('code') }">
                <code>&lt;/&gt;</code>
              </button>
              <div class="divider"></div>
              <button class="pin-btn" @click="addToHighlightsSelection">
                <Zap :size="12" /> Pin
              </button>
            </div>

            <!-- Editor Toolbar (Shown only when editing) -->
            <!-- Slash Command Menu -->
            <div v-if="slashMenu.show" class="slash-menu" :style="{ top: slashMenu.y + 'px', left: slashMenu.x + 'px' }">
              <div class="slash-label">Basic Blocks</div>
              <button class="slash-item" @click="applyCommand('h1')">
                <div class="slash-icon"><Type :size="16" /></div>
                <div class="slash-text">
                  <span>Heading 1</span>
                  <small>Big section title</small>
                </div>
              </button>
              <button class="slash-item" @click="applyCommand('h2')">
                <div class="slash-icon"><Type :size="14" /></div>
                <div class="slash-text">
                  <span>Heading 2</span>
                  <small>Medium section title</small>
                </div>
              </button>
              <button class="slash-item" @click="applyCommand('bullet')">
                <div class="slash-icon"><List :size="14" /></div>
                <div class="slash-text">
                  <span>Bullet List</span>
                  <small>Create a simple list</small>
                </div>
              </button>
              <button class="slash-item" @click="applyCommand('code')">
                <div class="slash-icon"><Code :size="14" /></div>
                <div class="slash-text">
                  <span>Code Block</span>
                  <small>Capture code snippets</small>
                </div>
              </button>
            </div>

            <!-- Editor Status & Count (Shown at bottom of 'paper') -->
            <div class="editor-footer-info">
               <span>{{ wordCount }} words</span>
               <span class="dot">·</span>
               <span>{{ charCount }} characters</span>
            </div>
          </div>

          <div v-if="!topic.theoryContent && !isEditingTheory" class="empty-state" @click="toggleTheory">
            <BookOpen :size="40" />
            <p>No theory notes here. Click to start writing.</p>
          </div>
        </div>

        <div v-if="activeTab === 'questions'" class="questions-tab">
           <div class="tab-header">
              <h2>Practice Questions</h2>
              <button class="btn-primary-sm" @click="showAddQuestion = true"><Plus :size="14" /> Add Question</button>
           </div>
           <div class="questions-grid">
              <QuestionCard v-for="q in questions" :key="q._id" :question="q" @deleted="loadData" @updated="loadData" />
           </div>
        </div>

        <div v-if="activeTab === 'pdf'" class="pdf-tab">
           <div v-if="topic.pdfUrl" class="pdf-container">
              <div class="pdf-toolbar">
                 <div class="pdf-info">
                   <BookOpen :size="14" />
                   <span>Study Material.pdf</span>
                 </div>
                 <div class="pdf-actions">
                   <button class="btn-icon-sm" @click="openPdfNewTab" title="Open in New Tab"><ExternalLink :size="14" /></button>
                   <button class="btn-icon-sm" @click="downloadPdf" title="Download"><Download :size="14" /></button>
                   <div class="divider"></div>
                   <button class="btn-ghost-sm" @click="$refs.fileInput.click()">Replace</button>
                 </div>
              </div>
              <iframe :src="topic.pdfUrl" class="pdf-viewer"></iframe>
           </div>
           <div v-else class="pdf-empty" @click="$refs.fileInput.click()">
              <Upload :size="32" />
              <p>Upload a PDF for this topic</p>
           </div>
           <input type="file" ref="fileInput" class="hidden" accept=".pdf" @change="handleFileUpload" />
        </div>
      </main>
      
      <!-- Resize Handle -->
      <div v-if="showSidebar" class="sidebar-resizer" @mousedown="startResizing"></div>

      <!-- ═══ RIGHT SIDEBAR (The Golden Bits) ═══ -->
      <aside v-if="showSidebar" class="important-sidebar" :style="{ width: sidebarWidth + 'px' }">
        <div class="sidebar-header">
          <div class="flex items-center gap-2">
            <Zap :size="14" class="text-accent" />
            <h3>Important Snippets</h3>
          </div>
          <button class="btn-icon-ghost sm" @click="isCreatingSnippet = true" title="Add Snippet Manually"><Plus :size="14" /></button>
        </div>
        <div class="sidebar-scroll">
          <div v-if="isCreatingSnippet" class="mb-4">
             <ConceptCard 
                :concept="{ topicId: topicId, explanation: '' }"
                :isNew="true"
                @updated="onSnippetCreated"
                @cancel-new="isCreatingSnippet = false"
             />
          </div>
          <div v-if="!concepts.length" class="sidebar-empty">
            Highlight text in the theory notes to pin important points here.
          </div>
          <ConceptCard 
            v-for="c in concepts" 
            :key="c._id" 
            :concept="c" 
            @deleted="loadData"
            @updated="loadData"
          />
        </div>
      </aside>
    </div>

    <!-- Modals -->
    <Teleport to="body">
       <div v-if="showAddQuestion" class="modal-overlay" @click="showAddQuestion = false">
          <div class="modal-content" @click.stop>
             <div class="modal-header-simple">
               <h2>Add Practice Question</h2>
               <button class="btn-icon-ghost" @click="showAddQuestion = false"><X :size="16" /></button>
             </div>
             <QuestionForm :topicId="topicId" @saved="showAddQuestion = false; loadData()" />
          </div>
       </div>
    </Teleport>

    <Teleport to="body">
      <div v-if="editingTopic" class="modal-overlay" @click="editingTopic = false">
        <div class="modal-content" style="max-width:500px" @click.stop>
          <div class="modal-header-simple">
            <h2>Edit Topic Metadata</h2>
            <button class="btn-icon-ghost" @click="editingTopic = false"><X :size="16" /></button>
          </div>
          <form @submit.prevent="saveMetadata" class="edit-meta-form">
            <div class="field-item">
              <label>Topic Name</label>
              <input v-model="editForm.name" required />
            </div>
            <div class="field-item">
              <label>Description (Optional)</label>
              <input v-model="editForm.description" />
            </div>
            <div class="field-item">
              <label>Key Insights (Quick Overview)</label>
              <textarea v-model="editForm.keyInsights" rows="3"></textarea>
            </div>
            <div class="form-actions">
              <button type="button" class="btn-ghost-sm" @click="editingTopic = false">Cancel</button>
              <button type="submit" class="btn-primary-sm">Save Changes</button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>

    <ConfirmModal 
      :show="showDeleteConfirm"
      :title="topic?.name"
      :isFolder="false"
      @confirm="doDeleteTopic"
      @cancel="showDeleteConfirm = false"
    />
  </div>
  <div v-else class="loading-full"><span class="spinner"></span></div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch, nextTick, onBeforeUnmount } from 'vue'
import { useRoute, RouterLink, useRouter } from 'vue-router'
import { ChevronLeft, Zap, Edit3, Check, BookOpen, Plus, Upload, X, MoreVertical, Trash2, Type, List, Code, ExternalLink, Download } from 'lucide-vue-next'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import axios from 'axios'
import ConceptCard  from '../components/ConceptCard.vue'
import QuestionCard from '../components/QuestionCard.vue'
import QuestionForm from '../components/QuestionForm.vue'
import ConfirmModal  from '../components/ConfirmModal.vue'

const route = useRoute()
const router = useRouter()
const topicId = computed(() => route.params.id)
const emit = defineEmits(['refresh-topics'])

const topic = ref(null)
const questions = ref([])
const concepts = ref([])
const activeTab = ref('theory')
const isEditingTheory = ref(false)
const showAddQuestion = ref(false)
const isCreatingSnippet = ref(false)
const showSidebar = ref(true)
const sidebarWidth = ref(360)
const isResizing = ref(false)

const showMenu = ref(false)
const editingTopic = ref(false)
const showDeleteConfirm = ref(false)

const savingStatus = ref('idle') // idle, saving, saved
let saveTimeout = null

const editForm = reactive({ name: '', description: '', keyInsights: '' })
const selection = reactive({ show: false, x: 0, y: 0, text: '' })
const slashMenu = reactive({ show: false, x: 0, y: 0, query: '' })

const wordCount = computed(() => {
  if (!editor.value) return 0
  const text = editor.value.getText().trim()
  return text ? text.split(/\s+/).length : 0
})

const charCount = computed(() => {
  return editor.value ? editor.value.getText().length : 0
})

const editor = useEditor({
  editable: false,
  content: '',
  extensions: [
    StarterKit,
    Placeholder.configure({
      placeholder: 'Type / for commands, or just start writing your theory...',
    }),
  ],
  onUpdate: ({ editor }) => {
    if (isEditingTheory.value) {
      debouncedSave()
      handleSlashCommand(editor)
    }
  },
  onSelectionUpdate: () => {
    handleSelection()
  },
})

const debouncedSave = () => {
  savingStatus.value = 'saving'
  if (saveTimeout) clearTimeout(saveTimeout)
  saveTimeout = setTimeout(saveTheoryContent, 1500)
}

const saveTheoryContent = async () => {
  if (!editor.value) return
  const html = editor.value.getHTML()
  try {
    await axios.put(`/api/topics/${topicId.value}`, {
      theoryContent: html,
      name: topic.value.name
    })
    topic.value.theoryContent = html
    savingStatus.value = 'saved'
    setTimeout(() => { if (savingStatus.value === 'saved') savingStatus.value = 'idle' }, 3000)
  } catch (e) { 
    console.error(e)
    savingStatus.value = 'idle'
  }
}

onBeforeUnmount(() => {
  editor.value.destroy()
})

const loadData = async () => {
  try {
    const [tRes, qRes, cRes] = await Promise.all([
      axios.get(`/api/topics/${topicId.value}`),
      axios.get(`/api/questions/by-topic/${topicId.value}`),
      axios.get(`/api/concepts/by-topic/${topicId.value}`)
    ])
    topic.value = tRes.data
    questions.value = qRes.data
    concepts.value = cRes.data
    
    if (editor.value) {
      editor.value.commands.setContent(topic.value.theoryContent || '')
    }

    Object.assign(editForm, {
      name: topic.value.name,
      description: topic.value.description || '',
      keyInsights: topic.value.keyInsights || ''
    })
  } catch (e) { console.error(e) }
}

const openEditModal = () => {
  editingTopic.value = true
  showMenu.value = false
}

const saveMetadata = async () => {
  try {
    await axios.put(`/api/topics/${topicId.value}`, { ...editForm })
    editingTopic.value = false
    await loadData()
    emit('refresh-topics')
  } catch (e) { console.error(e) }
}

const confirmDeleteTopic = () => {
  showDeleteConfirm.value = true
  showMenu.value = false
}

const doDeleteTopic = async () => {
  try {
    await axios.delete(`/api/topics/${topicId.value}`)
    emit('refresh-topics')
    router.push('/')
  } catch (e) { console.error(e) }
}

const toggleTheory = async () => {
  if (isEditingTheory.value) {
    if (saveTimeout) {
      clearTimeout(saveTimeout)
      await saveTheoryContent()
    }
  }
  isEditingTheory.value = !isEditingTheory.value
  editor.value.setEditable(isEditingTheory.value)
}

const onSnippetCreated = async () => {
  isCreatingSnippet.value = false
  await loadData()
}

const downloadPdf = () => {
  if (!topic.value.pdfUrl) return
  const link = document.createElement('a')
  link.href = topic.value.pdfUrl
  link.download = `${topic.value.name}.pdf`
  link.click()
}

// Sidebar Resize Logic
const startResizing = (e) => {
  isResizing.value = true
  document.addEventListener('mousemove', handleResizing)
  document.addEventListener('mouseup', stopResizing)
  document.body.style.cursor = 'col-resize'
  document.body.style.userSelect = 'none'
}

const handleResizing = (e) => {
  if (!isResizing.value) return
  const newWidth = window.innerWidth - e.clientX
  if (newWidth > 280 && newWidth < 600) {
    sidebarWidth.value = newWidth
  }
}

const stopResizing = () => {
  isResizing.value = false
  document.removeEventListener('mousemove', handleResizing)
  document.removeEventListener('mouseup', stopResizing)
  document.body.style.cursor = ''
  document.body.style.userSelect = ''
}

const openPdfNewTab = () => {
  if (topic.value.pdfUrl) window.open(topic.value.pdfUrl, '_blank')
}

const handleSlashCommand = (ed) => {
  const { from } = ed.state.selection
  const text = ed.state.doc.textBetween(Math.max(0, from - 1), from)
  
  if (text === '/') {
    const { from } = ed.state.selection
    const coords = ed.view.coordsAtPos(from)
    const container = document.querySelector('.main-note-area')
    slashMenu.show = true
    slashMenu.x = coords.left - container.getBoundingClientRect().left + 40
    slashMenu.y = coords.top - container.getBoundingClientRect().top + container.scrollTop + 30
  } else {
    slashMenu.show = false
  }
}

const applyCommand = (cmd) => {
  const ed = editor.value
  const { from } = ed.state.selection
  ed.chain().focus().deleteRange({ from: from - 1, to: from }).run()
  
  if (cmd === 'h1') ed.chain().focus().toggleHeading({ level: 1 }).run()
  if (cmd === 'h2') ed.chain().focus().toggleHeading({ level: 2 }).run()
  if (cmd === 'bullet') ed.chain().focus().toggleBulletList().run()
  if (cmd === 'code') ed.chain().focus().toggleCodeBlock().run()
  
  slashMenu.show = false
}

const handleSelection = () => {
  if (!editor.value) return
  const { from, to } = editor.value.state.selection
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
  
  selection.show = true
  selection.x = rect.left + (rect.width / 2)
  selection.y = rect.top - 10
}

const addToHighlightsSelection = async () => {
  const { from, to } = editor.value.state.selection
  const text = editor.value.state.doc.textBetween(from, to, ' ')
  if (!text.trim()) return

  try {
    await axios.post('/api/concepts', {
      explanation: text.trim(),
      title: 'Pinned Highlight',
      topicId: topicId.value
    })
    editor.value.commands.setTextSelection({ from: to, to: to }) // Clear selection
    await loadData()
  } catch (e) { console.error(e) }
}

const handleFileUpload = async (e) => {
  const file = e.target.files[0]
  if (!file) return
  const fData = new FormData()
  fData.append('file', file)
  try {
    await axios.post(`/api/topics/${topicId.value}/upload-pdf`, fData)
    loadData()
  } catch (e) { alert('Upload failed') }
}

const autoResizeTheory = (e) => {
  const el = e.target
  el.style.height = 'auto'
  el.style.height = el.scrollHeight + 'px'
}

watch(topicId, loadData, { immediate: true })
</script>

<style scoped>
.study-view {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--bg-main);
  color: var(--text-primary);
}

/* Header */
.study-header {
  height: 60px;
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  background: var(--surface);
  z-index: 100;
}

.header-left { display: flex; align-items: center; gap: 16px; }
.back-link { 
  display: flex; align-items: center; gap: 4px; 
  font-size: 13px; font-weight: 600; color: var(--text-muted); text-decoration: none; 
}
.back-link:hover { color: var(--accent); }
.topic-title { font-size: 18px; font-weight: 700; margin: 0; }

.header-actions { display: flex; align-items: center; gap: 20px; }
.tab-switcher { 
  display: flex; background: var(--bg-subtle); border-radius: 8px; padding: 3px; 
}
.tab-switcher button {
  background: none; border: none; padding: 6px 16px; font-size: 12.5px; font-weight: 600;
  color: var(--text-muted); cursor: pointer; border-radius: 6px; transition: all 0.2s;
}
.tab-switcher button.active {
  background: var(--surface); color: var(--accent); box-shadow: var(--shadow-sm);
}
.btn-minimal {
  background: none; border: none; font-size: 13px; font-weight: 600; color: var(--accent);
  cursor: pointer; display: flex; align-items: center; gap: 6px;
}

.status-indicator {
  font-size: 12px; font-weight: 600; color: var(--text-muted);
  display: flex; align-items: center; gap: 4px;
}
.status-indicator.saving { color: var(--accent); animation: pulse 1.5s infinite; }
.text-success { color: #10b981; }
@keyframes pulse { 0% { opacity: 0.6; } 50% { opacity: 1; } 100% { opacity: 0.6; } }

/* Layout Container */
.study-container {
  display: flex;
  flex: 1;
  overflow: hidden;
}

/* Main Note Area */
.main-note-area {
  flex: 1;
  overflow-y: auto;
  padding: 40px 60px;
  display: flex;
  justify-content: center;
  background: #fff;
}

.theory-wrapper { width: 100%; max-width: 800px; position: relative; }

/* Tiptap Styles */
.tiptap-container :deep(.ProseMirror) {
  outline: none;
  min-height: 80vh;
  line-height: 1.8;
  color: #37352f;
  font-size: 16px;
}

.tiptap-container :deep(.ProseMirror p.is-editor-empty:first-child::before) {
  content: attr(data-placeholder);
  float: left;
  color: #adb5bd;
  pointer-events: none;
  height: 0;
}

.tiptap-container :deep(.ProseMirror h1) { font-size: 34px; font-weight: 700; margin: 32px 0 16px; color: #000; }
.tiptap-container :deep(.ProseMirror h2) { font-size: 26px; font-weight: 700; margin: 24px 0 12px; border-bottom: 1px solid #eee; padding-bottom: 8px; }
.tiptap-container :deep(.ProseMirror h3) { font-size: 20px; font-weight: 700; margin: 20px 0 10px; }
.tiptap-container :deep(.ProseMirror p) { margin-bottom: 14px; }
.tiptap-container :deep(.ProseMirror ul), .tiptap-container :deep(.ProseMirror ol) { padding-left: 24px; margin-bottom: 14px; }
.tiptap-container :deep(.ProseMirror li) { margin-bottom: 4px; }
.tiptap-container :deep(.ProseMirror pre) { 
  background: #f7f6f3; padding: 16px; border-radius: 8px; margin: 20px 0; overflow-x: auto; 
  font-family: inherit; font-size: 14px;
}
.tiptap-container :deep(.ProseMirror code) {
  background: rgba(135,131,120,0.15); color: #eb5757; border-radius: 3px; padding: 0.2em 0.4em; font-size: 85%;
}

.editor-footer-info {
  display: flex; align-items: center; gap: 8px; margin-top: 40px; 
  padding-top: 20px; border-top: 1px solid #f0f0f0;
  font-size: 12px; color: var(--text-muted); opacity: 0.6;
}
.dot { font-size: 8px; }

.save-floating {
  position: fixed; bottom: 30px; left: 50%; transform: translateX(-50%);
  background: #000; color: white; border: none; padding: 12px 32px;
  border-radius: 99px; font-weight: 700; cursor: pointer; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.3);
  transition: transform 0.2s, background 0.2s;
}
.save-floating:hover { transform: translateX(-50%) translateY(-2px); background: var(--accent); }


/* Custom Bubble Menu Styles */
.bubble-menu-manual {
  position: fixed;
  z-index: 9999;
  display: flex;
  background: #1e1e1e;
  padding: 4px;
  border-radius: 8px;
  box-shadow: 0 10px 25px -5px rgba(0,0,0,0.4);
  align-items: center;
  gap: 2px;
  transform: translate(-50%, -100%);
  pointer-events: auto;
}

.bubble-menu-manual button {
  background: none;
  border: none;
  color: #fff;
  padding: 6px 10px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  border-radius: 6px;
  transition: background 0.1s;
  display: flex;
  align-items: center;
}

.bubble-menu-manual button:hover {
  background: rgba(255,255,255,0.1);
}

.bubble-menu-manual button.is-active {
  color: var(--accent);
  background: rgba(255,255,255,0.15);
}

.bubble-menu-manual .divider {
  width: 1px;
  height: 16px;
  background: rgba(255,255,255,0.2);
  margin: 0 4px;
}

.bubble-menu-manual .pin-btn {
  color: var(--accent);
  gap: 6px;
  padding-right: 12px;
}
.bubble-menu-manual .pin-btn:hover {
  background: var(--accent-subtle);
}

.bubble-menu-manual .pin-btn:hover {
  background: var(--accent-subtle);
}

/* Slash Menu Styles */
.slash-menu {
  position: absolute;
  z-index: 1000;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  box-shadow: 0 15px 35px -5px rgba(0,0,0,0.2);
  width: 240px;
  padding: 6px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.slash-label {
  padding: 8px 12px;
  font-size: 10px;
  font-weight: 800;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.slash-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  background: none;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  text-align: left;
  transition: background 0.15s;
}

.slash-item:hover {
  background: var(--bg-subtle);
}

.slash-icon {
  width: 32px;
  height: 32px;
  background: var(--bg-subtle);
  border: 1px solid var(--border);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
}

.slash-text {
  display: flex;
  flex-direction: column;
}

.slash-text span {
  font-size: 13.5px;
  font-weight: 600;
  color: var(--text-primary);
}

.slash-text small {
  font-size: 11px;
  color: var(--text-muted);
}

.important-sidebar {
  border-left: 1px solid var(--border);
  background: var(--bg-subtle);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  transition: width 0.05s linear;
}

.sidebar-resizer {
  width: 4px;
  cursor: col-resize;
  background: transparent;
  transition: background 0.2s;
  z-index: 100;
  margin-left: -2px;
}
.sidebar-resizer:hover, .sidebar-resizer:active {
  background: var(--accent);
}

.sidebar-header {
  padding: 20px; border-bottom: 1px solid var(--border); display: flex; align-items: center; gap: 8px;
}
.sidebar-header h3 { font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; margin: 0; color: var(--text-muted); }
.sidebar-scroll { flex: 1; overflow-y: auto; padding: 16px; }
.sidebar-empty { font-size: 12.5px; color: var(--text-muted); text-align: center; padding: 40px 20px; line-height: 1.6; }

/* Tabs others */
.questions-tab { width: 100%; max-width: 900px; }
.tab-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }

.pdf-tab { width: 100%; max-width: 1000px; }
.pdf-container { 
  display: flex; flex-direction: column; gap: 12px; height: 85vh;
}
.pdf-toolbar {
  display: flex; align-items: center; justify-content: space-between;
  padding: 8px 16px; background: var(--bg-subtle); border-radius: 8px;
  border: 1px solid var(--border);
}
.pdf-info { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 600; color: var(--text-secondary); }
.pdf-actions { display: flex; align-items: center; gap: 8px; }
.pdf-actions .divider { width: 1px; height: 16px; background: var(--border); margin: 0 4px; }

.pdf-viewer { 
  flex: 1; width: 100%; border: 1px solid var(--border); border-radius: 12px; background: #fff;
}

.pdf-empty {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  height: 400px; border: 2px dashed var(--border); border-radius: 16px; color: var(--text-muted); cursor: pointer;
}

.btn-icon-sm {
  background: none; border: none; padding: 6px; border-radius: 6px; cursor: pointer;
  color: var(--text-muted); display: flex; align-items: center;
}
.btn-icon-sm:hover { background: var(--border); color: var(--text-primary); }

.modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000;
}
.modal-content { background: var(--surface); border-radius: 16px; padding: 24px; width: 100%; max-width: 800px; }

.empty-state {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 100px 0; color: var(--text-muted); cursor: pointer;
}
.empty-state p { margin-top: 16px; font-weight: 500; }

.loading-full { display: flex; align-items: center; justify-content: center; height: 100vh; }
.spinner { width: 40px; height: 40px; border: 3px solid var(--bg-subtle); border-top-color: var(--accent); border-radius: 50%; animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* Dropdown & Settings */
.header-menu-wrap { position: relative; }
.dropdown-menu {
  position: absolute; top: 100%; right: 0; margin-top: 8px;
  background: var(--surface-raised); border: 1px solid var(--border);
  border-radius: 8px; box-shadow: var(--shadow-lg); min-width: 160px;
  display: flex; flex-direction: column; padding: 4px; z-index: 200;
}
.dropdown-menu button {
  padding: 8px 12px; font-size: 13px; font-weight: 600; text-align: left;
  background: none; border: none; border-radius: 6px; cursor: pointer;
  display: flex; align-items: center; gap: 8px; color: var(--text-secondary);
}
.dropdown-menu button:hover { background: var(--bg-subtle); color: var(--text-primary); }
.dropdown-menu button.danger { color: #ef4444; }
.dropdown-menu button.danger:hover { background: #fee2e2; }

.btn-icon-ghost {
  background: none; border: none; padding: 8px; border-radius: 8px;
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  color: var(--text-muted); transition: all 0.2s;
}
.btn-icon-ghost.sm { padding: 4px; border-radius: 6px; }
.btn-icon-ghost:hover { background: var(--bg-subtle); color: var(--text-primary); }
.btn-icon-ghost.active-accent { color: var(--accent); background: var(--accent-subtle); }

.mb-4 { margin-bottom: 16px; }

/* Edit Meta Form */
.modal-header-simple {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 24px; padding-bottom: 12px; border-bottom: 1px solid var(--border);
}
.modal-header-simple h2 { font-size: 18px; font-weight: 700; margin: 0; }

.edit-meta-form { display: flex; flex-direction: column; gap: 20px; }
.field-item { display: flex; flex-direction: column; gap: 6px; }
.field-item label { font-size: 12px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; }
.field-item input, .field-item textarea {
  width: 100%; padding: 10px 14px; border: 1px solid var(--border); border-radius: 8px;
  background: var(--bg-subtle); font-size: 14px; outline: none; transition: border-color 0.2s;
}
.field-item input:focus, .field-item textarea:focus { border-color: var(--accent); }

.form-actions { display: flex; justify-content: flex-end; gap: 12px; border-top: 1px solid var(--border); padding-top: 16px; }

@media (max-width: 1000px) {
  .important-sidebar { display: none; }
}
</style>
