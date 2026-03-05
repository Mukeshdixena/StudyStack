<template>
  <div class="qcard" :class="{ revision: question.needsRevision, solved: question.isSolved }">
    <!-- ── Header Row ── -->
    <div class="qcard-top">
      <div class="qcard-left">
        <span v-if="question.isSolved" class="solved-dot" title="Solved">✓</span>
        <span class="diff-badge" :class="question.difficulty">{{ question.difficulty }}</span>
        <h3 class="q-title">{{ question.title }}</h3>
      </div>
      <div class="qcard-actions">
        <a v-if="question.leetcodeLink" :href="question.leetcodeLink" target="_blank" class="link-pill lc">LC</a>
        <a v-if="question.gfgLink" :href="question.gfgLink" target="_blank" class="link-pill gfg">GFG</a>
        <button class="icon-action" @click="editing = true" title="Edit"><Pencil :size="14" /></button>
        <button class="icon-action danger" @click="deleteQ" title="Delete"><Trash2 :size="14" /></button>
      </div>
    </div>

    <!-- ── Tags ── -->
    <div v-if="question.tags?.length" class="q-tags">
      <span v-for="tag in question.tags" :key="tag" class="tag-chip">#{{ tag }}</span>
    </div>

    <!-- ── Footer bar: status toggles + reveal button ── -->
    <div class="card-footer-bar">
      <div class="status-row">
        <button class="status-btn" :class="{ active: question.isSolved, solved: true }" @click="toggleSolved">
          <CheckCircle2 :size="13" />
          {{ question.isSolved ? 'Solved' : 'Mark Solved' }}
        </button>
        <button class="status-btn" :class="{ active: question.needsRevision, revision: true }" @click="toggleRevision">
          <RotateCcw :size="12" />
          {{ question.needsRevision ? 'Needs Revision' : 'Mark Revision' }}
        </button>
      </div>
      <button v-if="question.content" class="reveal-btn" @click="showNotes = !showNotes">
        {{ showNotes ? 'Hide Notes' : 'Study Notes' }}
        <component :is="showNotes ? ChevronUp : ChevronDown" :size="15" />
      </button>
      <span v-else class="no-notes-hint">No notes yet — click Edit to add</span>
    </div>

    <!-- ── Collapsible Markdown Notes ── -->
    <Transition name="slide">
      <div v-if="showNotes && question.content" class="notes-reveal">
        <div class="markdown-body" v-html="renderedContent"></div>
      </div>
    </Transition>

    <!-- ── Edit Modal ── -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="editing" class="modal-wrap" @click.self="editing = false">
          <div class="modal-overlay" @click="editing = false"></div>
          <div class="modal-box">
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
import { ref, computed } from 'vue'
import { CheckCircle2, RotateCcw, Pencil, Trash2, X, ChevronDown, ChevronUp } from 'lucide-vue-next'
import axios from 'axios'
import { marked } from 'marked'
import hljs from 'highlight.js'
import QuestionForm from './QuestionForm.vue'
import ConfirmModal from './ConfirmModal.vue'

// Configure marked with syntax highlighting
marked.setOptions({
  breaks: true,
  gfm: true,
})

// Custom renderer for code blocks
const renderer = new marked.Renderer()
renderer.code = ({ text, lang }) => {
  const language = lang && hljs.getLanguage(lang) ? lang : 'plaintext'
  const highlighted = hljs.highlight(text, { language }).value
  return `<div class="code-wrapper"><div class="code-lang-tag">${language}</div><pre class="hljs-block"><code class="hljs language-${language}">${highlighted}</code></pre></div>`
}
marked.use({ renderer })

const props = defineProps(['question'])
const emit = defineEmits(['deleted', 'updated'])
const editing = ref(false)
const showDeleteConfirm = ref(false)
const deleting = ref(false)
const showNotes = ref(false)

const renderedContent = computed(() => {
  if (!props.question.content) return ''
  try {
    return marked.parse(props.question.content)
  } catch (e) {
    return `<pre>${props.question.content}</pre>`
  }
})

const toggleRevision = async () => {
  await axios.put(`/api/questions/${props.question._id}`, { needsRevision: !props.question.needsRevision })
  emit('updated')
}
const toggleSolved = async () => {
  await axios.put(`/api/questions/${props.question._id}`, { isSolved: !props.question.isSolved })
  emit('updated')
}
const deleteQ = () => { showDeleteConfirm.value = true }

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
/* ── Card Base ── */
.qcard {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  transition: box-shadow .2s, border-color .2s;
  box-shadow: var(--shadow-sm);
}
.qcard.revision { border-left: 3px solid var(--warning); }
.qcard.solved { border-left: 3px solid var(--success); }

/* ── Header ── */
.qcard-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
.qcard-left { display: flex; align-items: flex-start; gap: 8px; flex: 1; min-width: 0; }
.q-title { font-size: 14.5px; font-weight: 700; color: var(--text-primary); line-height: 1.4; }

.solved-dot { background: var(--success); color: white; font-size: 9px; font-weight: 900; width: 18px; height: 18px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 2px; }

.diff-badge { font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: .05em; border-radius: 4px; padding: 2px 7px; flex-shrink: 0; margin-top: 2px; }
.diff-badge.easy   { background: #dcfce7; color: #16a34a; }
.diff-badge.medium { background: #fef9c3; color: #b45309; }
.diff-badge.hard   { background: #fee2e2; color: #dc2626; }

.qcard-actions { display: flex; align-items: center; gap: 3px; flex-shrink: 0; }
.icon-action { padding: 5px; border-radius: 6px; background: none; border: none; color: var(--text-muted); cursor: pointer; display: flex; align-items: center; transition: all .15s; }
.icon-action:hover { background: var(--bg-subtle); color: var(--text-primary); }
.icon-action.danger:hover { color: #dc2626; background: #fee2e2; }

.link-pill { font-size: 9.5px; font-weight: 800; padding: 2px 7px; border-radius: 4px; text-decoration: none; letter-spacing: .03em; }
.link-pill.lc  { background: #fff7e0; color: #f59e0b; border: 1px solid #fde68a; }
.link-pill.gfg { background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; }

/* ── Tags ── */
.q-tags { display: flex; gap: 6px; flex-wrap: wrap; }
.tag-chip { font-size: 10px; font-weight: 600; color: var(--text-muted); opacity: 0.7; }

/* ── Footer Bar ── */
.card-footer-bar { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding-top: 10px; border-top: 1px dashed var(--border); }
.status-row { display: flex; gap: 6px; }
.status-btn { font-size: 11px; font-weight: 600; border: 1px solid var(--border); background: var(--bg-subtle); color: var(--text-muted); padding: 4px 10px; border-radius: 20px; cursor: pointer; transition: all .2s; display: flex; align-items: center; gap: 5px; }
.status-btn:hover { border-color: var(--text-muted); color: var(--text-primary); }
.status-btn.solved.active  { background: #dcfce7; color: #16a34a; border-color: #86efac; }
.status-btn.revision.active { background: #fef9c3; color: #b45309; border-color: #fde68a; }

.reveal-btn { display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 700; color: var(--accent); background: none; border: none; cursor: pointer; padding: 4px 0; white-space: nowrap; }
.no-notes-hint { font-size: 11px; color: var(--text-muted); font-style: italic; }

/* ── Collapsible Notes Panel ── */
.notes-reveal {
  border-top: 1px solid var(--border);
  margin: 0 -18px;
  padding: 20px 24px;
  background: var(--bg-subtle);
  overflow: hidden;
}

/* Slide animation */
.slide-enter-active, .slide-leave-active { transition: all .3s ease; max-height: 800px; }
.slide-enter-from, .slide-leave-to { max-height: 0; opacity: 0; padding-top: 0; padding-bottom: 0; }

/* ── Markdown Rendering ── */
.markdown-body {
  font-size: 13.5px;
  line-height: 1.75;
  color: var(--text-secondary);
  max-width: 100%;
}
.markdown-body :deep(h1) { font-size: 15px; font-weight: 800; color: var(--text-primary); margin: 20px 0 8px; border-bottom: 1px solid var(--border); padding-bottom: 4px; }
.markdown-body :deep(h1:first-child) { margin-top: 0; }
.markdown-body :deep(h2) { font-size: 13px; font-weight: 700; color: var(--text-primary); margin: 16px 0 6px; }
.markdown-body :deep(h3) { font-size: 12.5px; font-weight: 700; color: var(--accent); margin: 12px 0 5px; }
.markdown-body :deep(p) { margin: 6px 0; }
.markdown-body :deep(ul), .markdown-body :deep(ol) { margin: 6px 0; padding-left: 18px; }
.markdown-body :deep(li) { margin: 3px 0; }
.markdown-body :deep(strong) { color: var(--text-primary); font-weight: 700; }
.markdown-body :deep(em) { color: var(--text-secondary); }
.markdown-body :deep(hr) { border: none; border-top: 1px solid var(--border); margin: 16px 0; }
.markdown-body :deep(blockquote) { border-left: 3px solid var(--accent); margin: 8px 0; padding: 6px 12px; background: var(--surface); border-radius: 0 6px 6px 0; color: var(--text-secondary); }
.markdown-body :deep(code:not(.hljs)) { background: var(--bg-subtle); border: 1px solid var(--border); border-radius: 4px; padding: 1px 5px; font-family: 'Fira Code', monospace; font-size: 12px; color: var(--accent); }
.markdown-body :deep(.code-wrapper) { margin: 10px 0; border-radius: 10px; overflow: hidden; border: 1px solid #30363d; }
.markdown-body :deep(.code-lang-tag) { background: #161b22; color: #8b949e; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .04em; padding: 5px 14px; border-bottom: 1px solid #21262d; font-family: 'Fira Code', monospace; }
.markdown-body :deep(.hljs-block) { margin: 0; background: #0d1117 !important; padding: 14px 16px; overflow-x: auto; font-size: 12.5px; line-height: 1.65; font-family: 'Fira Code', 'Cascadia Code', monospace; }
.markdown-body :deep(.hljs-block code) { background: none !important; border: none !important; padding: 0 !important; color: inherit !important; font-size: inherit !important; }

/* ── Modal ── */
.modal-wrap { position: fixed; inset: 0; z-index: 200; display: flex; align-items: center; justify-content: center; padding: 20px; }
.modal-overlay { position: absolute; inset: 0; background: rgba(5,7,18,.6); backdrop-filter: blur(6px); }
.modal-box { position: relative; z-index: 1; width: 100%; max-width: 860px; background: var(--surface-raised); border: 1px solid var(--border); border-radius: 16px; box-shadow: 0 24px 64px rgba(0,0,0,.4); max-height: 90vh; display: flex; flex-direction: column; overflow: hidden; }
.modal-header { display: flex; justify-content: space-between; align-items: center; padding: 18px 24px; border-bottom: 1px solid var(--border); background: var(--surface-raised); flex-shrink: 0; }
.modal-title { font-size: 17px; font-weight: 700; color: var(--text-primary); margin: 0; }
.modal-scroll-area { overflow-y: auto; padding: 24px; flex: 1; }
.icon-btn { padding: 6px; border-radius: 8px; }
.modal-enter-active,.modal-leave-active { transition: opacity .2s; }
.modal-enter-from,.modal-leave-to { opacity: 0; }
</style>
