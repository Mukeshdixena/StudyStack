<template>
  <div class="qform-container">
    <!-- ── Mode Selector ── -->
    <div class="mode-selector">
      <button type="button" class="mode-tab" :class="{ active: mode === 'manual' }" @click="mode = 'manual'">Manual Entry</button>
      <button type="button" class="mode-tab" :class="{ active: mode === 'ai' }" @click="mode = 'ai'">
        <Sparkles :size="14" class="text-accent" /> AI Smart Mode
      </button>
    </div>

    <!-- ── AI Smart Input ── -->
    <div v-if="mode === 'ai'" class="ai-smart-input">
      <p class="ai-tip">Paste the raw question, your code, or a GFG/LeetCode snippet below. AI will structure it for you.</p>
      <textarea 
        v-model="rawInput" 
        class="field-input smart-ta" 
        rows="10" 
        placeholder="e.g. Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target..."
      ></textarea>
      <button 
        type="button" 
        class="btn-primary w-full mt-4" 
        :disabled="!rawInput || refining"
        @click="refineWithAI"
      >
        <Sparkles v-if="!refining" :size="16" />
        <span v-else class="spinner"></span>
        {{ refining ? 'Analyzing & Structuring...' : 'AI Magic Refine' }}
      </button>
    </div>

    <!-- ── Manual Form (Always shown if in manual mode or after AI refine) ── -->
    <form v-if="mode === 'manual' || isPopulated" @submit.prevent="save" class="qform mt-6">
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
            <textarea v-model="ap.code" class="field-input code-ta" rows="6" spellcheck="false" placeholder="Paste your code here..."></textarea>
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
  </div>
</template>

<script setup>
import { reactive, ref, watch } from 'vue'
import { Plus, X, Sparkles } from 'lucide-vue-next'
import axios from 'axios'

const props = defineProps(['topicId', 'initial'])
const emit = defineEmits(['saved'])
const saving = ref(false)
const refining = ref(false)
const mode = ref(props.initial ? 'manual' : 'ai')
const isPopulated = ref(!!props.initial)
const rawInput = ref('')
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

const refineWithAI = async () => {
  if (!rawInput.value) return
  refining.value = true
  try {
    const res = await axios.post('/api/ai/refine-question', { rawInput: rawInput.value })
    const data = res.data
    if (data) {
      Object.assign(form, {
        title: data.title || '',
        difficulty: data.difficulty || 'medium',
        personalNotes: data.personalNotes || '',
        approaches: data.approaches?.length ? data.approaches : [emptyApproach()]
      })
      tagsRaw.value = (data.tags || []).join(', ')
      isPopulated.value = true
      mode.value = 'manual'
    }
  } catch (e) {
    console.error('AI Refine failed:', e)
  } finally {
    refining.value = false
  }
}

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
    }
    emit('saved')
  } finally { saving.value = false }
}
</script>

<style scoped>
.qform-container { width:100%; }
.mode-selector { display:flex; gap:8px; margin-bottom:20px; border-bottom:1px solid var(--border); padding-bottom:12px; }
.mode-tab { padding:8px 16px; font-size:13px; font-weight:600; color:var(--text-muted); background:none; border:none; border-radius:8px; cursor:pointer; display:flex; align-items:center; gap:8px; transition:all .2s; }
.mode-tab:hover { color:var(--text-primary); background:var(--bg-subtle); }
.mode-tab.active { background:var(--accent-subtle); color:var(--accent); }

.ai-tip { font-size:12px; color:var(--text-muted); margin-bottom:12px; }
.smart-ta { background:var(--bg-subtle); border-style:dashed; border-width:2px; }

.qform { display:flex; flex-direction:column; gap:12px; }
.qform-row3 { display:grid; grid-template-columns:2fr 1fr 1fr; gap:14px; }
.qform-row2 { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
.field-group { display:flex; flex-direction:column; gap:4px; }
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
.approach-block { padding:12px; border-bottom:1px solid var(--border); display:flex; flex-direction:column; gap:8px; }
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
