<template>
  <form @submit.prevent="save" class="qform">
    <!-- Row 1: Title, difficulty, solved -->
    <div class="qform-row3">
      <div class="field-group flex-2">
        <label class="field-label">Question Title <span class="req">*</span></label>
        <input v-model="form.title" class="field-input" placeholder="Two Sum, Sliding Window Maximum..." required />
      </div>
      <div class="field-group">
        <label class="field-label">Difficulty</label>
        <select v-model="form.difficulty" class="field-input">
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
      </div>
      <div class="field-group center-items">
        <label class="field-label">Status</label>
        <div class="toggle-row">
          <label class="toggle-label">
            <input type="checkbox" v-model="form.isSolved" class="checkbox" /> Solved
          </label>
          <label class="toggle-label warn-txt">
            <input type="checkbox" v-model="form.needsRevision" class="checkbox" /> Needs Revision
          </label>
        </div>
      </div>
    </div>

    <!-- Row 2: Links -->
    <div class="qform-row2">
      <div class="field-group">
        <label class="field-label">LeetCode Link</label>
        <input v-model="form.leetcodeLink" class="field-input" placeholder="https://leetcode.com/problems/..." />
      </div>
      <div class="field-group">
        <label class="field-label">GFG Link</label>
        <input v-model="form.gfgLink" class="field-input" placeholder="https://www.geeksforgeeks.org/..." />
      </div>
    </div>

    <!-- Row 3: Personal Notes & Tags -->
    <div class="qform-row2">
      <div class="field-group">
        <label class="field-label">Personal Notes / Observations</label>
        <textarea v-model="form.personalNotes" class="field-input" rows="2" style="resize:vertical" placeholder="What I found hard, common mistakes..."></textarea>
      </div>
      <div class="field-group">
        <label class="field-label">Tags <span class="opt">(comma separated)</span></label>
        <input v-model="tagsRaw" class="field-input" placeholder="two-pointer, hash-map, sliding-window..." />
      </div>
    </div>

    <!-- ── Approaches ── -->
    <div class="approaches-section">
      <div class="approaches-header">
        <span class="field-label" style="margin:0">Code Approaches</span>
        <button type="button" class="btn-ghost sm-btn" @click="addApproach"><Plus :size="13" /> Add Approach</button>
      </div>

      <div v-for="(ap, i) in form.approaches" :key="i" class="approach-block">
        <div class="ap-block-header">
          <span class="ap-num">Approach {{ i + 1 }}</span>
          <button type="button" class="remove-btn" @click="removeApproach(i)" v-if="form.approaches.length > 1"><X :size="13" /></button>
        </div>
        <div class="ap-fields">
          <div class="field-group flex-2">
            <label class="field-label">Title</label>
            <input v-model="ap.title" class="field-input" :placeholder="`e.g. Brute Force, Sliding Window, DP`" />
          </div>
          <div class="field-group">
            <label class="field-label">Language</label>
            <select v-model="ap.language" class="field-input">
              <option value="java">Java</option>
              <option value="python">Python</option>
              <option value="cpp">C++</option>
              <option value="javascript">JavaScript</option>
              <option value="go">Go</option>
            </select>
          </div>
          <div class="field-group">
            <label class="field-label">Time Complexity</label>
            <input v-model="ap.timeComplexity" class="field-input" placeholder="O(n), O(n log n)..." />
          </div>
          <div class="field-group">
            <label class="field-label">Space Complexity</label>
            <input v-model="ap.spaceComplexity" class="field-input" placeholder="O(1), O(n)..." />
          </div>
        </div>
        <div class="field-group">
          <label class="field-label">Code</label>
          <textarea v-model="ap.code" class="field-input code-ta" rows="8" spellcheck="false" placeholder="Paste your code here..."></textarea>
        </div>
        <div class="field-group">
          <label class="field-label">Approach Notes</label>
          <textarea v-model="ap.notes" class="field-input" rows="2" style="resize:vertical" placeholder="Key idea, why this approach, trade-offs..."></textarea>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="form-footer">
      <button type="button" class="btn-ghost" @click="emit('saved')">Cancel</button>
      <button type="submit" class="btn-primary" :disabled="saving">
        <span v-if="saving" class="spinner"></span>
        {{ saving ? 'Saving...' : (initial ? 'Save Changes' : 'Add Question') }}
      </button>
    </div>
  </form>
</template>

<script setup>
import { reactive, ref, watch } from 'vue'
import { Plus, X } from 'lucide-vue-next'
import axios from 'axios'

const props = defineProps(['topicId', 'initial'])
const emit = defineEmits(['saved'])
const saving = ref(false)
const tagsRaw = ref('')

const emptyApproach = () => ({ title: '', code: '', language: 'java', timeComplexity: '', spaceComplexity: '', notes: '' })

const form = reactive({
  title: '',
  difficulty: 'medium',
  isSolved: false,
  needsRevision: false,
  leetcodeLink: '',
  gfgLink: '',
  personalNotes: '',
  approaches: [emptyApproach()],
  tags: [],
})

// Populate if editing
watch(() => props.initial, (init) => {
  if (!init) return
  Object.assign(form, {
    title: init.title || '',
    difficulty: init.difficulty || 'medium',
    isSolved: init.isSolved || false,
    needsRevision: init.needsRevision || false,
    leetcodeLink: init.leetcodeLink || '',
    gfgLink: init.gfgLink || '',
    personalNotes: init.personalNotes || '',
    approaches: init.approaches?.length ? init.approaches.map(a => ({ ...a })) : [emptyApproach()],
  })
  tagsRaw.value = (init.tags || []).join(', ')
}, { immediate: true })

const addApproach = () => form.approaches.push(emptyApproach())
const removeApproach = (i) => form.approaches.splice(i, 1)

const save = async () => {
  saving.value = true
  try {
    const payload = {
      ...form,
      topicId: props.topicId,
      tags: tagsRaw.value.split(',').map(t => t.trim()).filter(Boolean),
    }
    if (props.initial?._id) {
      await axios.put(`/api/questions/${props.initial._id}`, payload)
    } else {
      await axios.post('/api/questions', payload)
      // Update topic question count
      try {
        const tRes = await axios.get(`/api/topics/${props.topicId}`)
        const qRes = await axios.get(`/api/questions/by-topic/${props.topicId}`)
        await axios.put(`/api/topics/${props.topicId}`, { totalQuestions: qRes.data.length, name: tRes.data.name })
      } catch (_) {}
    }
    emit('saved')
  } finally { saving.value = false }
}
</script>

<style scoped>
.qform { display:flex; flex-direction:column; gap:18px; }
.qform-row3 { display:grid; grid-template-columns:2fr 1fr 1fr; gap:14px; }
.qform-row2 { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
.field-group { display:flex; flex-direction:column; gap:6px; }
.flex-2 { grid-column:span 2; }
.req { color:var(--danger); }
.opt { font-weight:400; text-transform:none; letter-spacing:0; color:var(--text-muted); font-size:10px; }
.center-items { justify-content:flex-end; }
.toggle-row { display:flex; gap:16px; align-items:center; flex-wrap:wrap; }
.toggle-label { display:flex; align-items:center; gap:6px; font-size:13px; font-weight:500; color:var(--text-secondary); cursor:pointer; }
.toggle-label.warn-txt { color:var(--warning); }
.checkbox { width:14px; height:14px; cursor:pointer; accent-color:var(--accent); }

/* Approaches section */
.approaches-section { border:1px solid var(--border); border-radius:10px; overflow:hidden; }
.approaches-header { display:flex; align-items:center; justify-content:space-between; padding:12px 16px; background:var(--bg-subtle); border-bottom:1px solid var(--border); }
.sm-btn { padding:4px 10px; font-size:12px; }
.approach-block { padding:16px; border-bottom:1px solid var(--border); display:flex; flex-direction:column; gap:12px; }
.approach-block:last-child { border-bottom:none; }
.ap-block-header { display:flex; align-items:center; justify-content:space-between; }
.ap-num { font-size:12px; font-weight:700; color:var(--accent); text-transform:uppercase; letter-spacing:.08em; }
.remove-btn { padding:4px 6px; border-radius:6px; background:none; border:none; color:var(--text-muted); cursor:pointer; display:flex; align-items:center; transition:all .15s; }
.remove-btn:hover { background:#fee2e2; color:#dc2626; }
.ap-fields { display:grid; grid-template-columns:2fr 1fr 1fr 1fr; gap:12px; }
.code-ta {
  font-family:'Fira Code','Cascadia Code','Consolas',monospace;
  font-size:12.5px; line-height:1.7;
  background:#0d1117; color:#e6edf3;
  border-color:#30363d;
  resize:vertical;
}
.code-ta:focus { border-color:#388bfd; }
[data-theme="light"] .code-ta { background:#1e2328; color:#e6edf3; }

.form-footer { display:flex; justify-content:flex-end; gap:10px; padding-top:16px; border-top:1px solid var(--border); margin-top:4px; }
.spinner { width:13px; height:13px; border:2px solid rgba(255,255,255,.3); border-top-color:#fff; border-radius:50%; animation:spin .7s linear infinite; display:inline-block; }
@keyframes spin { to { transform:rotate(360deg); } }
</style>
