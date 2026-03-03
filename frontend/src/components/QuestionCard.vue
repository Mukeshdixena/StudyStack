<template>
  <div class="qcard" :class="{ revision: question.needsRevision }">
    <!-- ── Row 1: Difficulty + Title + Badges ── -->
    <div class="qcard-top">
      <div class="qcard-left">
        <span class="diff-badge" :class="question.difficulty">{{ question.difficulty }}</span>
        <h3 class="q-title">{{ question.title }}</h3>
      </div>
      <div class="qcard-actions">
        <a v-if="question.leetcodeLink" :href="question.leetcodeLink" target="_blank" class="link-pill lc" title="LeetCode">LC</a>
        <a v-if="question.gfgLink"      :href="question.gfgLink"      target="_blank" class="link-pill gfg" title="GFG">GFG</a>
        <button class="icon-action" :class="{ active: question.isSolved }" @click="toggleSolved" title="Mark Solved">
          <CheckCircle2 :size="15" />
        </button>
        <button class="icon-action warn" :class="{ active: question.needsRevision }" @click="toggleRevision" title="Needs Revision">
          <RotateCcw :size="15" />
        </button>
        <button class="icon-action" @click="editing = true" title="Edit">
          <Pencil :size="14" />
        </button>
        <button class="icon-action danger" @click="deleteQ" title="Delete">
          <Trash2 :size="14" />
        </button>
      </div>
    </div>

    <!-- ── Notes ── -->
    <p v-if="question.personalNotes" class="q-notes">{{ question.personalNotes }}</p>

    <!-- ── Approaches ── -->
    <div v-if="question.approaches && question.approaches.length" class="approaches-wrap">
      <!-- Approach tabs -->
      <div class="approach-tabs">
        <button
          v-for="(ap, i) in question.approaches"
          :key="i"
          class="ap-tab"
          :class="{ active: activeApproach === i }"
          @click="activeApproach = i"
        >{{ ap.title || `Approach ${i + 1}` }}</button>
      </div>

      <!-- Approach Content -->
      <div v-if="question.approaches[activeApproach]" class="approach-content">
        <div v-if="question.approaches[activeApproach].timeComplexity || question.approaches[activeApproach].spaceComplexity" class="complexity-row">
          <span v-if="question.approaches[activeApproach].timeComplexity" class="complexity-chip">⏱ {{ question.approaches[activeApproach].timeComplexity }}</span>
          <span v-if="question.approaches[activeApproach].spaceComplexity" class="complexity-chip">💾 {{ question.approaches[activeApproach].spaceComplexity }}</span>
          <span v-if="question.approaches[activeApproach].language" class="lang-chip">{{ question.approaches[activeApproach].language }}</span>
        </div>
        <pre v-if="question.approaches[activeApproach].code" class="code-block"><code>{{ question.approaches[activeApproach].code }}</code></pre>
        <p v-if="question.approaches[activeApproach].notes" class="ap-notes">{{ question.approaches[activeApproach].notes }}</p>
      </div>
    </div>

    <!-- ── Tags ── -->
    <div v-if="question.tags && question.tags.length" class="q-tags">
      <span v-for="tag in question.tags" :key="tag" class="tag-chip">#{{ tag }}</span>
    </div>
  </div>

  <!-- ── Edit Modal ── -->
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="editing" class="modal-wrap" @click.self="editing = false">
        <div class="modal-overlay" @click="editing = false"></div>
        <div class="modal-box" style="max-width:820px">
          <div class="modal-header">
            <div><h2 class="modal-title">Edit Question</h2></div>
            <button class="btn-ghost icon-btn" @click="editing = false"><X :size="18" /></button>
          </div>
          <QuestionForm :topicId="question.topicId" :initial="question" @saved="editing = false; emit('updated')" />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref } from 'vue'
import { CheckCircle2, RotateCcw, Pencil, Trash2, X } from 'lucide-vue-next'
import axios from 'axios'
import QuestionForm from './QuestionForm.vue'

const props = defineProps(['question'])
const emit = defineEmits(['deleted','updated'])
const editing = ref(false)
const activeApproach = ref(0)

const toggleRevision = async () => {
  await axios.put(`/api/questions/${props.question._id}`, { needsRevision: !props.question.needsRevision })
  emit('updated')
}
const toggleSolved = async () => {
  await axios.put(`/api/questions/${props.question._id}`, { isSolved: !props.question.isSolved })
  emit('updated')
}
const deleteQ = async () => {
  if (!confirm('Delete this question?')) return
  await axios.delete(`/api/questions/${props.question._id}`)
  emit('deleted')
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

.q-notes { font-size:13px; color:var(--text-secondary); line-height:1.6; background:var(--bg-subtle); border-radius:8px; padding:10px 14px; }

/* Approaches */
.approaches-wrap { border:1px solid var(--border); border-radius:10px; overflow:hidden; }
.approach-tabs { display:flex; background:var(--bg-subtle); border-bottom:1px solid var(--border); overflow-x:auto; }
.ap-tab { padding:8px 16px; font-size:12px; font-weight:600; color:var(--text-muted); background:none; border:none; cursor:pointer; white-space:nowrap; border-bottom:2px solid transparent; margin-bottom:-1px; transition:color .15s, border-color .15s; }
.ap-tab:hover { color:var(--text-primary); }
.ap-tab.active { color:var(--accent); border-bottom-color:var(--accent); background:var(--surface); }

.approach-content { padding:14px 16px; display:flex; flex-direction:column; gap:10px; }
.complexity-row { display:flex; gap:8px; flex-wrap:wrap; align-items:center; }
.complexity-chip { font-size:11.5px; font-weight:600; color:var(--text-secondary); background:var(--bg-subtle); border:1px solid var(--border); border-radius:99px; padding:2px 10px; }
.lang-chip { font-size:10.5px; font-weight:700; color:var(--accent); background:var(--accent-subtle); border:1px solid var(--accent-border); border-radius:99px; padding:2px 10px; text-transform:uppercase; letter-spacing:.04em; }

.code-block {
  background:#0d1117; color:#e6edf3;
  border-radius:8px; padding:14px 16px;
  font-size:12.5px; line-height:1.65;
  font-family:'Fira Code','Cascadia Code','Consolas',monospace;
  overflow-x:auto;
  white-space:pre;
  margin:0;
}
[data-theme="light"] .code-block { background:#1e2328; }

.ap-notes { font-size:12.5px; color:var(--text-secondary); line-height:1.6; background:var(--bg-subtle); border-radius:7px; padding:9px 12px; }

.q-tags { display:flex; gap:6px; flex-wrap:wrap; }
.tag-chip { font-size:11px; font-weight:600; color:var(--text-muted); }

/* Modal */
.modal-wrap { position:fixed; inset:0; z-index:200; display:flex; align-items:center; justify-content:center; padding:20px; }
.modal-overlay { position:absolute; inset:0; background:rgba(5,7,18,.55); backdrop-filter:blur(6px); }
.modal-box { position:relative; z-index:1; width:100%; background:var(--surface-raised); border:1px solid var(--border); border-radius:16px; padding:28px; box-shadow:var(--shadow-xl); max-height:92vh; overflow-y:auto; }
.modal-header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:22px; padding-bottom:16px; border-bottom:1px solid var(--border); }
.modal-title { font-size:18px; font-weight:700; color:var(--text-primary); }
.icon-btn { padding:6px; border-radius:8px; }
.modal-enter-active,.modal-leave-active { transition:opacity .2s; }
.modal-enter-from,.modal-leave-to { opacity:0; }
</style>
