<template>
  <div class="qcard" :class="{ revision: question.needsRevision }">
    <!-- ── Row 1: Difficulty + Title + Badges ── -->
    <div class="qcard-top">
      <div class="qcard-left">
        <div class="solved-indicator" v-if="question.isSolved"><Check :size="12" /></div>
        <span class="diff-badge" :class="question.difficulty">{{ question.difficulty }}</span>
        <h3 class="q-title">{{ question.title }}</h3>
      </div>
      <div class="qcard-actions">
        <a v-if="question.leetcodeLink" :href="question.leetcodeLink" target="_blank" class="link-pill lc">LC</a>
        <a v-if="question.gfgLink"      :href="question.gfgLink"      target="_blank" class="link-pill gfg">GFG</a>
        <button class="icon-action" @click="editing = true" title="Edit"><Pencil :size="14" /></button>
        <button class="icon-action danger" @click="deleteQ" title="Delete"><Trash2 :size="14" /></button>
      </div>
    </div>

    <!-- ── Notes ── -->
    <p v-if="question.personalNotes" class="q-notes">{{ question.personalNotes }}</p>

    <!-- ── Interaction Bar ── -->
    <div class="card-footer-actions">
      <div class="learning-state">
        <button class="state-btn solved" :class="{ active: question.isSolved }" @click="toggleSolved">
          {{ question.isSolved ? 'Solved' : 'Mark Solved' }}
        </button>
        <button class="state-btn revision" :class="{ active: question.needsRevision }" @click="toggleRevision">
          <RotateCcw :size="12" /> {{ question.needsRevision ? 'Needs Revision' : 'Solid' }}
        </button>
      </div>
      <button class="btn-reveal" @click="showSolution = !showSolution">
        {{ showSolution ? 'Hide Solution' : 'See Solution' }}
        <component :is="showSolution ? ChevronUp : ChevronDown" :size="16" />
      </button>
    </div>

    <!-- ── Collapsible Solution ── -->
    <div v-if="showSolution" class="solution-reveal">
      <div v-if="question.approaches && question.approaches.length" class="approaches-wrap-fancy">
        <div class="ap-nav">
          <button
            v-for="(ap, i) in question.approaches"
            :key="i"
            class="ap-nav-btn"
            :class="{ active: activeApproach === i }"
            @click="activeApproach = i"
          >{{ ap.title || `Approach ${i + 1}` }}</button>
        </div>

        <div v-if="question.approaches[activeApproach]" class="ap-body">
          <div class="sub-tabs">
            <button class="sub-tab" :class="{ active: activeSubTab === 'logic' }" @click="activeSubTab = 'logic'">Logic & Logic</button>
            <button class="sub-tab" :class="{ active: activeSubTab === 'code' }" @click="activeSubTab = 'code'">Clean Implementation</button>
          </div>

          <div class="sub-content">
            <div v-if="activeSubTab === 'logic'" class="logic-pane animate-fade">
              <div class="complexity-row mb-3">
                <span class="complexity-chip">⏱ {{ question.approaches[activeApproach].timeComplexity || 'N/A' }}</span>
                <span class="complexity-chip">💾 {{ question.approaches[activeApproach].spaceComplexity || 'O(1)' }}</span>
              </div>
              <p class="logic-notes">{{ question.approaches[activeApproach].notes || 'No logic explanation provided.' }}</p>
            </div>
            <div v-if="activeSubTab === 'code'" class="code-pane animate-fade">
              <div class="code-header">
                <span class="lang-tag">{{ question.approaches[activeApproach].language || 'code' }}</span>
              </div>
              <pre class="code-block-fancy"><code>{{ question.approaches[activeApproach].code }}</code></pre>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Tags ── -->
    <div v-if="question.tags && question.tags.length" class="q-tags mt-2">
      <span v-for="tag in question.tags" :key="tag" class="tag-chip">#{{ tag }}</span>
    </div>

    <!-- ── Edit Modal ── -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="editing" class="modal-wrap" @click.self="editing = false">
          <div class="modal-overlay" @click="editing = false"></div>
          <div class="modal-box" style="max-width:820px">
            <div class="modal-header">
              <h2 class="modal-title">Edit Question</h2>
              <button class="btn-ghost icon-btn" @click="editing = false"><X :size="18" /></button>
            </div>
            <div class="modal-scroll-area">
              <QuestionForm :topicId="question.topicId" :initial="question" @saved="editing = false; emit('updated')" />
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
    <ConfirmModal 
      :show="showDeleteConfirm"
      :title="question.title"
      :isFolder="false"
      :loading="deleting"
      @confirm="doDelete"
      @cancel="showDeleteConfirm = false"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Check, RotateCcw, Pencil, Trash2, X, ChevronDown, ChevronUp } from 'lucide-vue-next'
import axios from 'axios'
import QuestionForm from './QuestionForm.vue'
import ConfirmModal from './ConfirmModal.vue'

const props = defineProps(['question'])
const emit = defineEmits(['deleted','updated'])
const editing = ref(false)
const showDeleteConfirm = ref(false)
const deleting = ref(false)
const showSolution = ref(false)
const activeApproach = ref(0)
const activeSubTab = ref('logic') // logic, code

const toggleRevision = async () => {
  await axios.put(`/api/questions/${props.question._id}`, { needsRevision: !props.question.needsRevision })
  emit('updated')
}
const toggleSolved = async () => {
  await axios.put(`/api/questions/${props.question._id}`, { isSolved: !props.question.isSolved })
  emit('updated')
}
const deleteQ = () => {
  showDeleteConfirm.value = true
}

const doDelete = async () => {
  deleting.value = true
  try {
    await axios.delete(`/api/questions/${props.question._id}`)
    emit('deleted')
  } catch (e) {
    console.error('Delete failed:', e)
    alert('Failed to delete question.')
  } finally {
    deleting.value = false
    showDeleteConfirm.value = false
  }
}
</script>

<style scoped>
.qcard {
  background:var(--surface); border:1px solid var(--border);
  border-radius:12px; padding:18px 20px;
  display:flex; flex-direction:column; gap:12px;
  transition:box-shadow .2s, border-color .2s;
  box-shadow:var(--shadow-sm);
}
.qcard.revision { border-left:3px solid var(--warning); }

.qcard-top { display:flex; align-items:flex-start; justify-content:space-between; gap:12px; }
.qcard-left { display:flex; align-items:flex-start; gap:10px; flex:1; min-width:0; }
.q-title { font-size:15px; font-weight:700; color:var(--text-primary); line-height:1.35; }

.diff-badge { display:inline-block; font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:.05em; border-radius:4px; padding:2px 8px; flex-shrink:0; margin-top:2px; }
.diff-badge.easy   { background:#dcfce7; color:#16a34a; }
.diff-badge.medium { background:#fef9c3; color:#b45309; }
.diff-badge.hard   { background:#fee2e2; color:#dc2626; }

.qcard-actions { display:flex; align-items:center; gap:4px; flex-shrink:0; }
.icon-action { padding:5px; border-radius:6px; background:none; border:none; color:var(--text-muted); cursor:pointer; display:flex; align-items:center; transition:all .15s; }
.icon-action:hover { background:var(--bg-subtle); color:var(--text-primary); }
.icon-action.active { color:var(--accent); }
.icon-action.warn.active { color:var(--warning); }
.icon-action.danger:hover { color:#dc2626; background:#fee2e2; }

.link-pill { font-size:10px; font-weight:800; padding:3px 8px; border-radius:5px; text-decoration:none; letter-spacing:.03em; }
.link-pill.lc  { background:#fff7e0; color:#f59e0b; border:1px solid #fde68a; }
.link-pill.gfg { background:#f0fdf4; color:#16a34a; border:1px solid #bbf7d0; }

.solved-indicator { background:var(--success); color:white; padding:3px; border-radius:50%; display:flex; margin-top:3px; }

.card-footer-actions { display:flex; align-items:center; justify-content:space-between; padding-top:12px; border-top:1px dotted var(--border); }
.learning-state { display:flex; gap:8px; }
.state-btn { font-size:11px; font-weight:700; border:1px solid var(--border); background:var(--bg-subtle); color:var(--text-muted); padding:4px 10px; border-radius:6px; cursor:pointer; transition:all .2s; display:flex; align-items:center; gap:5px; }
.state-btn:hover { border-color:var(--text-muted); }
.state-btn.solved.active { background:var(--success-subtle); color:var(--success); border-color:var(--success); }
.state-btn.revision.active { background:var(--warning-subtle); color:var(--warning); border-color:var(--warning); }

.btn-reveal { display:flex; align-items:center; gap:6px; font-size:12px; font-weight:700; color:var(--accent); background:none; border:none; cursor:pointer; text-transform:uppercase; letter-spacing:0.05em; }

.solution-reveal { margin-top:10px; border-top:1px solid var(--border); background:rgba(0,0,0,0.02); margin-left:-20px; margin-right:-20px; padding:20px; }

.approaches-wrap-fancy { display:flex; flex-direction:column; gap:16px; }
.ap-nav { display:flex; gap:4px; overflow-x:auto; padding-bottom:4px; }
.ap-nav-btn { padding:6px 12px; font-size:11px; font-weight:700; color:var(--text-muted); background:var(--bg-subtle); border:1px solid var(--border); border-radius:6px; cursor:pointer; white-space:nowrap; }
.ap-nav-btn.active { background:var(--accent); color:white; border-color:var(--accent); }

.sub-tabs { display:flex; gap:12px; margin-bottom:12px; padding:4px; background:var(--surface); border-radius:8px; border:1px solid var(--border); }
.sub-tab { flex:1; padding:6px; font-size:11.5px; font-weight:700; color:var(--text-muted); background:none; border:none; border-radius:5px; cursor:pointer; transition:all .2s; }
.sub-tab.active { background:var(--bg-subtle); color:var(--text-primary); box-shadow:var(--shadow-sm); }

.logic-notes { font-size:13px; line-height:1.7; color:var(--text-secondary); white-space:pre-line; }

.code-header { display:flex; justify-content:flex-end; margin-bottom:6px; }
.lang-tag { font-size:9px; font-weight:800; text-transform:uppercase; color:var(--text-muted); background:var(--bg-subtle); padding:2px 6px; border-radius:4px; border:1px solid var(--border); }

.code-block-fancy {
  background:#0d1117; color:#e6edf3;
  border-radius:10px; padding:18px;
  font-size:12px; line-height:1.7;
  font-family:'Fira Code', monospace;
  overflow-x:auto;
  border:1px solid rgba(255,255,255,0.05);
  box-shadow:inset 0 0 20px rgba(0,0,0,0.3);
}

.animate-fade { animation: fadeIn 0.3s ease-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }

.q-tags { display:flex; gap:8px; flex-wrap:wrap; }
.tag-chip { font-size:10px; font-weight:700; color:var(--text-muted); opacity:0.6; }

/* Modal */
.modal-wrap { position:fixed; inset:0; z-index:200; display:flex; align-items:center; justify-content:center; padding:20px; }
.modal-overlay { position:absolute; inset:0; background:rgba(5,7,18,.55); backdrop-filter:blur(6px); }
.modal-box { position:relative; z-index:1; width:100%; background:var(--surface-raised); border:1px solid var(--border); border-radius:16px; box-shadow:var(--shadow-xl); max-height:90vh; display:flex; flex-direction:column; overflow:hidden; }
.modal-header { display:flex; justify-content:space-between; align-items:center; padding:20px 24px; border-bottom:1px solid var(--border); background:var(--surface-raised); z-index:2; flex-shrink:0; }
.modal-title { font-size:18px; font-weight:700; color:var(--text-primary); margin:0; }
.modal-scroll-area { overflow-y:auto; padding:24px; flex:1; }
.icon-btn { padding:6px; border-radius:8px; }
.modal-enter-active,.modal-leave-active { transition:opacity .2s; }
.modal-enter-from,.modal-leave-to { opacity:0; }
</style>
