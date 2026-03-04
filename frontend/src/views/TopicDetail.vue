<template>
  <div v-if="topic" class="topic-page">
    <!-- ═══ TOPIC HEADER ═══ -->
    <header class="topic-header">
      <div class="topic-header-left">
        <RouterLink to="/" class="back-btn"><ChevronLeft :size="16" /> Topics</RouterLink>
        <h1 class="topic-title">{{ topic.name }}</h1>
        <p v-if="topic.description" class="topic-desc">{{ topic.description }}</p>
        <div class="topic-stats">
          <span class="stat-pill"><FileText :size="12" /> {{ questions.length }} Questions</span>
          <span class="stat-pill"><Lightbulb :size="12" /> {{ concepts.length }} Concepts</span>
          <span v-if="revisionCount" class="stat-pill warn"><RotateCcw :size="12" /> {{ revisionCount }} to Revise</span>
        </div>
      </div>
      <div class="topic-header-actions">
        <button class="btn-ghost" @click="editingTopic = true"><Edit3 :size="14" /> Edit Topic</button>
        <button class="btn-ghost delete-item-btn" @click="confirmDelete"><Trash2 :size="14" /> Delete</button>
      </div>
    </header>

    <!-- ═══ KEY INSIGHTS BAR ═══ -->
    <div v-if="topic.keyInsights" class="key-insights-bar">
      <div class="key-insights-label"><Zap :size="13" /> Key Insights</div>
      <p class="key-insights-text">{{ topic.keyInsights }}</p>
    </div>

    <!-- ═══ SECTION TABS ═══ -->
    <div class="section-tabs">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        class="tab-btn"
        :class="{ active: activeTab === tab.id }"
        @click="activeTab = tab.id"
      >
        <component :is="tab.icon" :size="14" />
        {{ tab.label }}
        <span class="tab-count">{{ tab.count }}</span>
      </button>
    </div>

    <!-- ═══ FILTER BAR (Questions tab) ═══ -->
    <div v-if="activeTab === 'questions'" class="filter-bar">
      <div class="search-wrap">
        <Search :size="13" class="search-ico" />
        <input v-model="qSearch" placeholder="Search questions..." class="field-input search-sm" />
      </div>
      <div class="filter-chips">
        <button
          v-for="d in ['all','easy','medium','hard']"
          :key="d"
          class="chip"
          :class="{ active: diffFilter === d, [d]: d !== 'all' }"
          @click="diffFilter = d"
        >{{ d === 'all' ? 'All' : d.charAt(0).toUpperCase() + d.slice(1) }}</button>
        <button class="chip" :class="{ active: revisionOnly }" @click="revisionOnly = !revisionOnly">
          <RotateCcw :size="11" /> Revision
        </button>
        <button class="chip" :class="{ active: solvedOnly }" @click="solvedOnly = !solvedOnly">
          <CheckCircle2 :size="11" /> Solved
        </button>
      </div>
      <button class="btn-primary ml-auto" @click="showAddQuestion = true"><Plus :size="14" /> Add Question</button>
    </div>

    <!-- ═══ CONCEPTS ACTION BAR ═══ -->
    <div v-if="activeTab === 'concepts'" class="filter-bar">
      <span class="text-sm" style="color:var(--text-muted)">{{ concepts.length }} concept{{ concepts.length !== 1 ? 's' : '' }}</span>
      <button class="btn-ghost ml-auto notebook-add" @click="addNewConcept">
        <Plus :size="14" /> Type a new concept...
      </button>
    </div>

    <!-- ═══ QUESTIONS LIST ═══ -->
    <div v-if="activeTab === 'questions'" class="questions-list">
      <div v-if="!filteredQuestions.length" class="empty-section">
        <FileText :size="22" /> <span>No questions yet. Add your first one!</span>
      </div>
      <QuestionCard
        v-for="q in filteredQuestions"
        :key="q._id"
        :question="q"
        @deleted="loadData"
        @updated="loadData"
      />
    </div>

    <!-- ═══ CONCEPTS LIST (NOTION STYLE) ═══ -->
    <div v-if="activeTab === 'concepts'" class="concepts-list notion-style">
      <!-- New Concept Buffer -->
      <ConceptCard 
        v-if="isCreatingConcept"
        :concept="{ topicId: topicId, title: '', explanation: '', keyPoints: '' }"
        :isNew="true"
        @updated="onConceptCreated"
        @cancel-new="isCreatingConcept = false"
      />

      <div v-if="!concepts.length && !isCreatingConcept" class="empty-section doc-style" @click="addNewConcept">
        <div class="empty-prompt">
          <Lightbulb :size="24" />
          <span>No theory notes yet. Start writing...</span>
        </div>
      </div>
      
      <ConceptCard
        v-for="c in concepts"
        :key="c._id"
        :concept="c"
        @deleted="loadData"
        @updated="loadData"
      />

      <!-- Quick add at bottom -->
      <div v-if="concepts.length > 0 && !isCreatingConcept" class="quick-add-row" @click="addNewConcept">
        <Plus :size="14" /> Add more...
      </div>
    </div>

    <!-- ═══ PDF RESOURCES tab ═══ -->
    <div v-if="activeTab === 'resources'" class="resources-tab">
      <div v-if="!topic.pdfUrl" class="upload-zone" @click="$refs.fileInput.click()">
        <input type="file" ref="fileInput" class="hidden" accept=".pdf" @change="handleFileUpload" />
        <div v-if="uploadingPdf" class="upload-status">
          <div class="spinner"></div>
          <p>Uploading PDF...</p>
        </div>
        <div v-else class="upload-prompt">
          <div class="upload-icon-box"><Upload :size="24" /></div>
          <h3>Upload Topic PDF</h3>
          <p>Study materials, cheat sheets, or problem sets (Max 10MB)</p>
          <button class="btn-primary" style="margin-top:10px">Select PDF</button>
        </div>
      </div>

      <div v-else class="pdf-viewer-container" :class="{ 'is-fullscreen': isPdfFullscreen }">
        <div class="pdf-toolbar">
          <div class="pdf-info">
            <File :size="16" />
            <span>Document Preview</span>
          </div>
          <div class="pdf-actions">
            <button class="btn-ghost sm" @click="isPdfFullscreen = !isPdfFullscreen">
              <Maximize :size="14" /> {{ isPdfFullscreen ? 'Exit' : 'Full Screen' }}
            </button>
            <button class="btn-ghost sm" @click="openPdfExternal">
              <ExternalLink :size="14" /> Open Original
            </button>
            <button class="btn-ghost sm delete-btn" @click="removePdf">
              <Trash2 :size="14" /> Remove
            </button>
          </div>
        </div>
        <div class="pdf-frame-wrap">
          <iframe :src="pdfViewUrl" class="pdf-iframe"></iframe>
        </div>
      </div>
    </div>
  </div>

  <div v-else class="loading-wrap">
    <div class="spinner-lg"></div>
  </div>

  <!-- ═══ MODALS (Still keep for Questions & Topic Edit) ═══ -->
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="showAddQuestion" class="modal-wrap" @click.self="showAddQuestion = false">
        <div class="modal-overlay" @click="showAddQuestion = false"></div>
        <div class="modal-box" style="max-width:820px">
          <div class="modal-header">
            <div><h2 class="modal-title">Add Question</h2><p class="modal-sub">Save approach code, difficulty & notes</p></div>
            <button class="btn-ghost icon-btn" @click="showAddQuestion = false"><X :size="18" /></button>
          </div>
          <QuestionForm :topicId="topicId" @saved="showAddQuestion = false; loadData()" />
        </div>
      </div>
    </Transition>
  </Teleport>

  <Teleport to="body">
    <Transition name="modal">
      <div v-if="editingTopic" class="modal-wrap" @click.self="editingTopic = false">
        <div class="modal-overlay" @click="editingTopic = false"></div>
        <div class="modal-box" style="max-width:540px">
          <div class="modal-header">
            <div><h2 class="modal-title">Edit Topic</h2></div>
            <button class="btn-ghost icon-btn" @click="editingTopic = false"><X :size="18" /></button>
          </div>
          <form @submit.prevent="saveTopic" class="space-y-4">
            <div>
              <label class="field-label">Topic Name</label>
              <input v-model="editForm.name" class="field-input" required />
            </div>
            <div>
              <label class="field-label">Description</label>
              <input v-model="editForm.description" class="field-input" />
            </div>
            <div>
              <label class="field-label" style="color:var(--warning)">⚡ Key Insights (Most Important Notes)</label>
              <textarea v-model="editForm.keyInsights" class="field-input" rows="4" style="resize:vertical"></textarea>
            </div>
            <div class="flex justify-end gap-3 pt-2 border-t" style="border-color:var(--border)">
              <button type="button" class="btn-ghost" @click="editingTopic = false">Cancel</button>
              <button type="submit" class="btn-primary">Save Changes</button>
            </div>
          </form>
        </div>
      </div>
    </Transition>
  </Teleport>

  <ConfirmModal 
    :show="showDeleteConfirm"
    :title="topic?.name"
    :isFolder="true"
    :loading="deleting"
    @confirm="doDelete"
    @cancel="showDeleteConfirm = false"
  />

  <ConfirmModal 
    :show="showPdfConfirm"
    :title="'the PDF of ' + topic?.name"
    :isFolder="false"
    :loading="deleting"
    @confirm="doRemovePdf"
    @cancel="showPdfConfirm = false"
  />
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import {
  ChevronLeft, FileText, Lightbulb, Zap, Search, Plus, X, Edit3, Trash2,
  RotateCcw, CheckCircle2, File, Maximize, Upload, ExternalLink
} from 'lucide-vue-next'
import axios from 'axios'
import QuestionCard from '../components/QuestionCard.vue'
import ConceptCard  from '../components/ConceptCard.vue'
import QuestionForm from '../components/QuestionForm.vue'
import ConfirmModal from '../components/ConfirmModal.vue'
import { useRouter } from 'vue-router'

defineEmits(['refresh-topics'])

const route = useRoute()
const topicId = computed(() => route.params.id)

const topic     = ref(null)
const questions = ref([])
const concepts  = ref([])
const activeTab = ref('questions')

// In-place concept state
const isCreatingConcept = ref(false)

const qSearch     = ref('')
const diffFilter   = ref('all')
const revisionOnly = ref(false)
const solvedOnly   = ref(false)

const showAddQuestion = ref(false)
const editingTopic    = ref(false)
const showDeleteConfirm = ref(false)
const showPdfConfirm = ref(false)
const deleting        = ref(false)
const uploadingPdf    = ref(false)
const isPdfFullscreen = ref(false)
const router          = useRouter()
const editForm = reactive({ name: '', description: '', keyInsights: '' })

const revisionCount = computed(() => questions.value.filter(q => q.needsRevision).length)

const tabs = computed(() => [
  { id: 'questions', label: 'Questions', icon: FileText, count: questions.value.length },
  { id: 'concepts',  label: 'Concepts',  icon: Lightbulb, count: concepts.value.length },
  { id: 'resources', label: 'PDF',       icon: File,      count: topic.value?.pdfUrl ? 1 : 0 },
])

const pdfViewUrl = computed(() => {
  if (!topic.value?.pdfUrl) return ''
  // Use Google Docs viewer or native iframe depending on your preference
  // Native iframe is usually better for direct S3 URLs if they allow it
  return topic.value.pdfUrl
})

const filteredQuestions = computed(() => {
  let r = questions.value
  if (qSearch.value) {
    const q = qSearch.value.toLowerCase()
    r = r.filter(x => x.title.toLowerCase().includes(q))
  }
  if (diffFilter.value !== 'all') r = r.filter(x => x.difficulty === diffFilter.value)
  if (revisionOnly.value) r = r.filter(x => x.needsRevision)
  if (solvedOnly.value) r = r.filter(x => x.isSolved)
  return r
})

const loadData = async () => {
  try {
    const [t, q, c] = await Promise.all([
      axios.get(`/api/topics/${topicId.value}`),
      axios.get(`/api/questions/by-topic/${topicId.value}`),
      axios.get(`/api/concepts/by-topic/${topicId.value}`),
    ])
    topic.value = t.data
    questions.value = q.data
    concepts.value = c.data
    Object.assign(editForm, { name: t.data.name, description: t.data.description || '', keyInsights: t.data.keyInsights || '' })
  } catch (e) { console.error(e) }
}

const addNewConcept = () => {
  activeTab.value = 'concepts'
  isCreatingConcept.value = true
}

const onConceptCreated = () => {
  isCreatingConcept.value = false
  loadData()
}

const saveTopic = async () => {
  await axios.put(`/api/topics/${topicId.value}`, {
    ...editForm,
    totalQuestions: questions.value.length,
    totalConcepts: concepts.value.length,
  })
  editingTopic.value = false
  await loadData()
}

const confirmDelete = () => {
  showDeleteConfirm.value = true
}

const doDelete = async () => {
  deleting.value = true
  try {
    await axios.delete(`/api/topics/${topicId.value}`)
    emit('refresh-topics')
    router.push('/')
  } catch (e) {
    console.error('Failed to delete topic:', e)
    alert('Failed to delete topic.')
  } finally {
    deleting.value = false
    showDeleteConfirm.value = false
  }
}

const handleFileUpload = async (e) => {
  const file = e.target.files[0]
  if (!file) return
  if (file.type !== 'application/pdf') {
    alert('Please upload a PDF file')
    return
  }

  const formData = new FormData()
  formData.append('file', file)

  uploadingPdf.value = true
  try {
    await axios.post(`/api/topics/${topicId.value}/upload-pdf`, formData)
    await loadData()
  } catch (err) {
    console.error('Upload failed', err)
    alert('Upload failed. Please try again.')
  } finally {
    uploadingPdf.value = false
  }
}

const removePdf = () => {
  showPdfConfirm.value = true
}

const doRemovePdf = async () => {
  deleting.value = true
  try {
    await axios.put(`/api/topics/${topicId.value}`, { pdfUrl: null, pdfKey: null })
    await loadData()
  } catch (err) {
    console.error('Remove failed', err)
  } finally {
    deleting.value = false
    showPdfConfirm.value = false
  }
}

const openPdfExternal = () => {
  if (topic.value?.pdfUrl) window.open(topic.value.pdfUrl, '_blank')
}

watch(topicId, loadData, { immediate: true })
</script>

<style scoped>
.topic-page { padding:28px 32px; max-width:1000px; margin: 0 auto; }

/* Header */
.topic-header { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:18px; gap:20px; }
.topic-header-left { flex:1; min-width:0; }
.back-btn { display:inline-flex; align-items:center; gap:4px; font-size:12.5px; font-weight:600; color:var(--text-muted); text-decoration:none; margin-bottom:10px; transition:color .15s; }
.back-btn:hover { color:var(--accent); }
.topic-title { font-size:32px; font-weight:800; color:var(--text-primary); line-height:1.25; margin-bottom:8px; }
.topic-desc { font-size:15px; color:var(--text-secondary); margin-bottom:14px; line-height:1.6; }
.topic-stats { display:flex; gap:8px; flex-wrap:wrap; }
.stat-pill { display:inline-flex; align-items:center; gap:4px; font-size:11.5px; font-weight:600; color:var(--text-muted); background:var(--bg-subtle); border:1px solid var(--border); border-radius:99px; padding:3px 10px; }
.stat-pill.warn { color:var(--warning); background:var(--warning-subtle); border-color:var(--warning-border); }

.delete-item-btn { color: var(--text-muted); }
.delete-item-btn:hover { color: #ef4444; background: rgba(239, 68, 68, 0.1); }

/* Key Insights */
.key-insights-bar { background:var(--warning-subtle); border:1px solid var(--warning-border); border-radius:10px; padding:16px 20px; margin-bottom:32px; display:flex; gap:12px; align-items:flex-start; }
.key-insights-label { display:flex; align-items:center; gap:5px; font-size:11px; font-weight:800; text-transform:uppercase; letter-spacing:.08em; color:var(--warning); white-space:nowrap; margin-top:2px; }
.key-insights-text { font-size:14px; color:var(--warning); line-height:1.7; white-space:pre-wrap; }

/* Tabs */
.section-tabs { display:flex; gap:8px; margin-bottom:24px; border-bottom:1px solid var(--border); }
.tab-btn { display:inline-flex; align-items:center; gap:8px; padding:12px 16px; font-size:14px; font-weight:600; color:var(--text-muted); background:none; border:none; cursor:pointer; border-bottom:2px solid transparent; margin-bottom:-1px; transition:all .2s; }
.tab-btn:hover { color:var(--text-primary); }
.tab-btn.active { color:var(--accent); border-bottom-color:var(--accent); }
.tab-count { font-size:10px; font-weight:700; background:var(--bg-subtle); border-radius:99px; padding:1px 8px; color:var(--text-muted); }

/* Filter bar */
.filter-bar { display:flex; align-items:center; gap:12px; margin-bottom:24px; flex-wrap:wrap; }
.search-wrap { position:relative; display:flex; align-items:center; }
.search-ico { position:absolute; left:12px; color:var(--text-muted); pointer-events:none; }
.search-sm { padding:8px 12px 8px 34px; min-width:240px; font-size:13px; }

.filter-chips { display:flex; align-items:center; gap:6px; flex-wrap:wrap; }
.chip {
  display:inline-flex; align-items:center; gap:5px;
  padding:6px 14px; font-size:12.5px; font-weight:600;
  color:var(--text-secondary); background:var(--bg-subtle);
  border:1px solid var(--border); border-radius:99px;
  cursor:pointer; transition:all .2s; white-space:nowrap;
}
.chip:hover { background:var(--border-subtle); border-color:var(--text-muted); }
.chip.active { background:var(--accent); color:#fff; border-color:var(--accent); }

/* Difficulty Specific */
.chip.easy.active { background:#10b981; border-color:#10b981; }
.chip.medium.active { background:#f59e0b; border-color:#f59e0b; }
.chip.hard.active { background:#ef4444; border-color:#ef4444; }

.notebook-add { font-weight:600; opacity:0.7; }
.notebook-add:hover { opacity:1; }

/* Notion Style Concepts */
.concepts-list.notion-style {
  display: flex;
  flex-direction: column;
  border-top: 1px solid var(--border-subtle);
  padding-top: 10px;
}

.quick-add-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 0;
  color: var(--text-muted);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: color 0.2s;
}

.quick-add-row:hover {
  color: var(--text-primary);
}

.empty-section.doc-style {
  padding: 60px 0;
  cursor: text;
}

.empty-prompt {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  color: var(--text-muted);
}

.empty-prompt span {
  font-size: 15px;
  font-weight: 500;
}

.empty-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  color: var(--text-muted);
  gap: 12px;
  text-align: center;
  border: 2px dashed var(--border);
  border-radius: 16px;
  margin-top: 20px;
}

.empty-section span {
  font-size: 15px;
  font-weight: 500;
}

/* Modal styles for Qs */
.modal-box { border-radius: 12px; }
.ml-auto { margin-left: auto; }

/* Resources / PDF Tab */
.resources-tab { padding-top: 10px; }
.upload-zone {
  border: 2px dashed var(--border);
  border-radius: 16px;
  padding: 60px 20px;
  text-align: center;
  cursor: pointer;
  background: var(--bg-subtle);
  transition: all 0.2s;
}
.upload-zone:hover {
  background: var(--surface);
  border-color: var(--accent);
}
.upload-icon-box {
  width: 60px;
  height: 60px;
  background: var(--accent-subtle);
  color: var(--accent);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
}
.upload-prompt h3 { font-size: 18px; font-weight: 700; margin-bottom: 6px; }
.upload-prompt p { color: var(--text-muted); font-size: 13.5px; }

.pdf-viewer-container {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  overflow: hidden;
  height: 700px;
  display: flex;
  flex-direction: column;
}
.pdf-viewer-container.is-fullscreen {
  position: fixed;
  inset: 0;
  z-index: 999;
  height: 100vh;
  border-radius: 0;
}
.pdf-toolbar {
  padding: 10px 16px;
  border-bottom: 1px solid var(--border);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--surface-raised);
}
.pdf-info { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 600; color: var(--text-secondary); }
.pdf-actions { display: flex; gap: 8px; }
.btn-ghost.sm { padding: 4px 10px; font-size: 12px; }
.btn-ghost.delete-btn:hover { color: var(--danger); background: rgba(220, 38, 38, 0.1); }

.pdf-frame-wrap { flex: 1; background: #525659; }
.pdf-iframe { width: 100%; height: 100%; border: none; }

.hidden { display: none; }
.upload-status { display: flex; flex-direction: column; align-items: center; gap: 12px; }
</style>
