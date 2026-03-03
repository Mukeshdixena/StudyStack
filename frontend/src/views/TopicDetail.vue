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

    <div v-if="activeTab === 'concepts'" class="filter-bar">
      <span class="text-sm" style="color:var(--text-muted)">{{ concepts.length }} concept{{ concepts.length !== 1 ? 's' : '' }}</span>
      <button class="btn-primary ml-auto" @click="showAddConcept = true"><Plus :size="14" /> Add Concept</button>
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

    <!-- ═══ CONCEPTS LIST ═══ -->
    <div v-if="activeTab === 'concepts'" class="concepts-list">
      <div v-if="!concepts.length" class="empty-section">
        <Lightbulb :size="22" /> <span>No concepts yet. Add the first one!</span>
      </div>
      <ConceptCard
        v-for="c in concepts"
        :key="c._id"
        :concept="c"
        @deleted="loadData"
        @updated="loadData"
      />
    </div>
  </div>

  <div v-else class="loading-wrap">
    <div class="spinner-lg"></div>
  </div>

  <!-- ═══ ADD QUESTION MODAL ═══ -->
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

  <!-- ═══ ADD CONCEPT MODAL ═══ -->
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="showAddConcept" class="modal-wrap" @click.self="showAddConcept = false">
        <div class="modal-overlay" @click="showAddConcept = false"></div>
        <div class="modal-box" style="max-width:640px">
          <div class="modal-header">
            <div><h2 class="modal-title">Add Concept</h2><p class="modal-sub">Capture a technique or theory</p></div>
            <button class="btn-ghost icon-btn" @click="showAddConcept = false"><X :size="18" /></button>
          </div>
          <ConceptForm :topicId="topicId" @saved="showAddConcept = false; loadData()" />
        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- ═══ EDIT TOPIC MODAL ═══ -->
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
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import {
  ChevronLeft, FileText, Lightbulb, Zap, Search, Plus, X, Edit3,
  RotateCcw, CheckCircle2, RotateCw
} from 'lucide-vue-next'
import axios from 'axios'
import QuestionCard from '../components/QuestionCard.vue'
import ConceptCard  from '../components/ConceptCard.vue'
import QuestionForm from '../components/QuestionForm.vue'
import ConceptForm  from '../components/ConceptForm.vue'

const route = useRoute()
const topicId = computed(() => route.params.id)

const topic     = ref(null)
const questions = ref([])
const concepts  = ref([])
const activeTab = ref('questions')
const qSearch   = ref('')
const diffFilter   = ref('all')
const revisionOnly = ref(false)
const solvedOnly   = ref(false)
const showAddQuestion = ref(false)
const showAddConcept  = ref(false)
const editingTopic    = ref(false)
const editForm = reactive({ name: '', description: '', keyInsights: '' })

const revisionCount = computed(() => questions.value.filter(q => q.needsRevision).length)

const tabs = computed(() => [
  { id: 'questions', label: 'Questions', icon: FileText, count: questions.value.length },
  { id: 'concepts',  label: 'Concepts',  icon: Lightbulb, count: concepts.value.length },
])

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
    // sync counts
    Object.assign(editForm, { name: t.data.name, description: t.data.description || '', keyInsights: t.data.keyInsights || '' })
  } catch (e) { console.error(e) }
}

const saveTopic = async () => {
  // also update counts
  await axios.put(`/api/topics/${topicId.value}`, {
    ...editForm,
    totalQuestions: questions.value.length,
    totalConcepts: concepts.value.length,
  })
  editingTopic.value = false
  await loadData()
}

watch(topicId, loadData, { immediate: true })
</script>

<style scoped>
.topic-page { padding:28px 32px; max-width:1100px; }

/* Header */
.topic-header { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:18px; gap:20px; }
.topic-header-left { flex:1; min-width:0; }
.back-btn { display:inline-flex; align-items:center; gap:4px; font-size:12.5px; font-weight:600; color:var(--text-muted); text-decoration:none; margin-bottom:10px; transition:color .15s; }
.back-btn:hover { color:var(--accent); }
.topic-title { font-size:24px; font-weight:800; color:var(--text-primary); line-height:1.25; margin-bottom:6px; }
.topic-desc { font-size:13px; color:var(--text-secondary); margin-bottom:10px; line-height:1.6; }
.topic-stats { display:flex; gap:8px; flex-wrap:wrap; }
.stat-pill { display:inline-flex; align-items:center; gap:4px; font-size:11.5px; font-weight:600; color:var(--text-muted); background:var(--bg-subtle); border:1px solid var(--border); border-radius:99px; padding:3px 10px; }
.stat-pill.warn { color:var(--warning); background:var(--warning-subtle); border-color:var(--warning-border); }
.topic-header-actions { flex-shrink:0; }

/* Key Insights */
.key-insights-bar { background:var(--warning-subtle); border:1px solid var(--warning-border); border-radius:10px; padding:14px 18px; margin-bottom:20px; display:flex; gap:12px; align-items:flex-start; }
.key-insights-label { display:flex; align-items:center; gap:5px; font-size:11px; font-weight:800; text-transform:uppercase; letter-spacing:.08em; color:var(--warning); white-space:nowrap; margin-top:1px; }
.key-insights-text { font-size:13.5px; color:var(--warning); line-height:1.65; white-space:pre-wrap; }

/* Tabs */
.section-tabs { display:flex; gap:3px; margin-bottom:18px; border-bottom:1px solid var(--border); }
.tab-btn { display:inline-flex; align-items:center; gap:6px; padding:10px 16px; font-size:13px; font-weight:600; color:var(--text-muted); background:none; border:none; cursor:pointer; border-bottom:2px solid transparent; margin-bottom:-1px; transition:color .15s, border-color .15s; }
.tab-btn:hover { color:var(--text-primary); }
.tab-btn.active { color:var(--accent); border-bottom-color:var(--accent); }
.tab-count { font-size:10px; font-weight:700; background:var(--bg-subtle); border-radius:99px; padding:1px 7px; color:var(--text-muted); }
.tab-btn.active .tab-count { background:var(--accent-subtle); color:var(--accent); }

/* Filter bar */
.filter-bar { display:flex; align-items:center; gap:10px; margin-bottom:18px; flex-wrap:wrap; }
.search-wrap { position:relative; }
.search-ico { position:absolute; left:9px; top:50%; transform:translateY(-50%); color:var(--text-muted); pointer-events:none; }
.search-sm { padding:7px 10px 7px 28px; min-width:180px; font-size:12.5px; }
.filter-chips { display:flex; gap:5px; flex-wrap:wrap; }
.chip { display:inline-flex; align-items:center; gap:4px; padding:4px 12px; border-radius:99px; font-size:12px; font-weight:600; border:1px solid var(--border); background:var(--surface); color:var(--text-secondary); cursor:pointer; transition:all .15s; }
.chip:hover { border-color:var(--accent-border); color:var(--accent); }
.chip.active { background:var(--accent-subtle); border-color:var(--accent-border); color:var(--accent); }
.chip.easy   { color:#16a34a; border-color:#bbf7d0; }
.chip.easy.active { background:#f0fdf4; }
.chip.medium { color:#d97706; border-color:#fde68a; }
.chip.medium.active { background:#fffbeb; }
.chip.hard   { color:#dc2626; border-color:#fecaca; }
.chip.hard.active { background:#fef2f2; }
.ml-auto { margin-left:auto; }
.text-sm { font-size:13px; }

/* Lists */
.questions-list { display:flex; flex-direction:column; gap:12px; }
.concepts-list  { display:flex; flex-direction:column; gap:12px; }

/* Empty */
.empty-section { display:flex; align-items:center; gap:10px; padding:40px 20px; color:var(--text-muted); font-size:14px; font-weight:500; justify-content:center; }

/* Loading */
.loading-wrap { display:flex; align-items:center; justify-content:center; min-height:60vh; }
.spinner-lg { width:36px; height:36px; border:3px solid var(--border); border-top-color:var(--accent); border-radius:50%; animation:spin .8s linear infinite; }
@keyframes spin { to { transform:rotate(360deg); } }

/* Shared modal utilities */
.space-y-4 > * + * { margin-top:16px; }
.flex { display:flex; }
.justify-end { justify-content:flex-end; }
.gap-3 { gap:12px; }
.pt-2 { padding-top:8px; }
.border-t { border-top:1px solid; }
</style>
