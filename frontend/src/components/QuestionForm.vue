<template>
  <div class="qform-container">
    <!-- ── Mode Selector ── -->
    <div class="mode-selector">
      <button type="button" class="mode-tab" :class="{ active: mode === 'manual' }" @click="mode = 'manual'">
        Manual Entry
      </button>
      <button type="button" class="mode-tab ai-tab" :class="{ active: mode === 'ai' }" @click="mode = 'ai'">
        <Sparkles :size="14" /> AI Smart Mode
      </button>
    </div>

    <!-- ── AI Smart Input ── -->
    <div v-if="mode === 'ai'" class="ai-smart-panel">
      <div class="ai-banner">
        <Sparkles :size="18" />
        <span>Paste the raw question (with or without code/solution). AI will write a full study note for you.</span>
      </div>
      <textarea
        v-model="rawInput"
        class="field-input smart-ta"
        rows="9"
        placeholder="e.g. Implement pow(A, B) % C...  
Or paste a LeetCode problem. Or paste your messy notes + code.
The AI will structure everything into a complete DSA study document."
      ></textarea>
      <button
        type="button"
        class="btn-ai"
        :disabled="!rawInput.trim() || refining"
        @click="refineWithAI"
      >
        <span v-if="refining" class="spinner"></span>
        <Sparkles v-else :size="16" />
        {{ refining ? 'Generating Study Note...' : 'Generate Full Study Note' }}
      </button>
    </div>

    <!-- ── Manual Form ── -->
    <form v-if="mode === 'manual' || isPopulated" @submit.prevent="save" class="qform">
      <!-- Row 1: Title + Difficulty -->
      <div class="qform-row">
        <div class="field-group flex-3">
          <label class="field-label">Question Title <span class="req">*</span></label>
          <input v-model="form.title" class="field-input" placeholder="e.g. Implement pow(A, B) % C" required />
        </div>
        <div class="field-group">
          <label class="field-label">Difficulty</label>
          <select v-model="form.difficulty" class="field-input">
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
      </div>

      <!-- Row 2: Links + Tags -->
      <div class="qform-row">
        <div class="field-group">
          <label class="field-label">LeetCode Link</label>
          <input v-model="form.leetcodeLink" class="field-input" placeholder="https://leetcode.com/problems/..." />
        </div>
        <div class="field-group">
          <label class="field-label">GFG Link</label>
          <input v-model="form.gfgLink" class="field-input" placeholder="https://www.geeksforgeeks.org/..." />
        </div>
        <div class="field-group">
          <label class="field-label">Tags <span class="opt">(comma separated)</span></label>
          <input v-model="tagsRaw" class="field-input" placeholder="binary-search, dp, greedy..." />
        </div>
      </div>

      <!-- Main Content: Rich Text Editor -->
      <div class="field-group" style="flex:1; display:flex; flex-direction:column; min-height:300px;">
        <div class="content-header">
          <label class="field-label" style="margin:0">Study Note Content</label>
          <div v-if="editor" class="editor-toolbar">
            <button type="button" @click="editor.chain().focus().toggleHeading({ level: 1 }).run()" :class="{ 'is-active': editor.isActive('heading', { level: 1 }) }">H1</button>
            <button type="button" @click="editor.chain().focus().toggleHeading({ level: 2 }).run()" :class="{ 'is-active': editor.isActive('heading', { level: 2 }) }">H2</button>
            <button type="button" @click="editor.chain().focus().toggleBold().run()" :class="{ 'is-active': editor.isActive('bold') }"><b>B</b></button>
            <button type="button" @click="editor.chain().focus().toggleItalic().run()" :class="{ 'is-active': editor.isActive('italic') }"><i>I</i></button>
            <button type="button" @click="editor.chain().focus().toggleCode().run()" :class="{ 'is-active': editor.isActive('code') }">{}</button>
            <button type="button" @click="editor.chain().focus().toggleCodeBlock().run()" :class="{ 'is-active': editor.isActive('codeBlock') }">Code Block</button>
          </div>
        </div>
        <editor-content :editor="editor" class="field-input content-ta" style="flex:1" />
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
import { reactive, ref, watch, onBeforeUnmount } from 'vue'
import { Sparkles } from 'lucide-vue-next'
import axios from 'axios'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Heading from '@tiptap/extension-heading'
import CodeBlock from '@tiptap/extension-code-block'
import Code from '@tiptap/extension-code'
import { marked } from 'marked'

const props = defineProps(['topicId', 'initial'])
const emit = defineEmits(['saved'])
const saving = ref(false)
const refining = ref(false)
const mode = ref(props.initial ? 'manual' : 'ai')
const isPopulated = ref(!!props.initial)
const rawInput = ref('')
const tagsRaw = ref('')

const form = reactive({
  title: '',
  difficulty: 'medium',
  isSolved: false,
  needsRevision: false,
  leetcodeLink: '',
  gfgLink: '',
  content: '',
})

// Setup editor
const editor = useEditor({
  content: form.content,
  extensions: [
    StarterKit.configure({
      heading: false,
      codeBlock: false,
      code: false
    }),
    Heading.configure({ levels: [1, 2, 3] }),
    CodeBlock,
    Code,
    Placeholder.configure({ placeholder: 'Start writing your study notes here...' })
  ]
})

onBeforeUnmount(() => {
  if (editor.value) editor.value.destroy()
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
    content: init.content || '',
  })
  tagsRaw.value = (init.tags || []).join(', ')
  
  if (editor.value && init.content) {
    editor.value.commands.setContent(init.content)
  }
}, { immediate: true })

const refineWithAI = async () => {
  if (!rawInput.value.trim()) return
  refining.value = true
  try {
    const res = await axios.post('/api/ai/refine-question', { rawInput: rawInput.value })
    const data = res.data
    if (data) {
      const htmlContent = data.content ? marked.parse(data.content) : ''
      Object.assign(form, {
        title: data.title || '',
        difficulty: data.difficulty || 'medium',
        content: htmlContent,
      })
      tagsRaw.value = (data.tags || []).join(', ')
      if (editor.value) {
        editor.value.commands.setContent(htmlContent)
      }
      isPopulated.value = true
      mode.value = 'manual'
    }
  } catch (e) {
    console.error('AI Refine failed:', e)
    alert('AI generation failed. Please try again.')
  } finally {
    refining.value = false
  }
}

const save = async () => {
  saving.value = true
  if (editor.value) {
    form.content = editor.value.getHTML()
  }
  
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
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.qform-container { width: 100%; }

/* Mode Tabs */
.mode-selector { display: flex; gap: 6px; margin-bottom: 18px; border-bottom: 1px solid var(--border); padding-bottom: 14px; }
.mode-tab { padding: 7px 16px; font-size: 13px; font-weight: 600; color: var(--text-muted); background: none; border: 1px solid transparent; border-radius: 8px; cursor: pointer; display: flex; align-items: center; gap: 7px; transition: all .2s; }
.mode-tab:hover { color: var(--text-primary); background: var(--bg-subtle); }
.mode-tab.active { background: var(--accent-subtle); color: var(--accent); border-color: var(--accent-border); }

/* AI Panel */
.ai-smart-panel { display: flex; flex-direction: column; gap: 14px; }
.ai-banner { display: flex; align-items: center; gap: 10px; background: var(--accent-subtle); border: 1px solid var(--accent-border); border-radius: 10px; padding: 12px 16px; font-size: 13px; color: var(--accent); font-weight: 500; }
.smart-ta { background: var(--bg-subtle) !important; border-style: dashed !important; border-width: 2px !important; font-family: inherit; line-height: 1.6; resize: vertical; min-height: 180px; }
.btn-ai { display: flex; align-items: center; justify-content: center; gap: 10px; width: 100%; padding: 13px; font-size: 14px; font-weight: 700; color: white; background: linear-gradient(135deg, var(--accent), #7c3aed); border: none; border-radius: 10px; cursor: pointer; transition: all .25s; }
.btn-ai:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(var(--accent-rgb, 79 70 229), 0.35); }
.btn-ai:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

/* Manual Form */
.qform { display: flex; flex-direction: column; gap: 14px; }
.qform-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
.flex-3 { grid-column: span 2; }
.field-group { display: flex; flex-direction: column; gap: 5px; }

.content-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; }
.editor-toolbar { display: flex; gap: 4px; flex-wrap: wrap; }
.editor-toolbar button { padding: 4px 8px; font-size: 11px; font-weight: 600; font-family: 'Inter', sans-serif; background: var(--bg-subtle); color: var(--text-muted); border: 1px solid var(--border); border-radius: 4px; cursor: pointer; transition: all .2s; }
.editor-toolbar button:hover { color: var(--text-primary); border-color: var(--text-muted); }
.editor-toolbar button.is-active { background: var(--accent); color: white; border-color: var(--accent); }

.content-ta {
  background: #0d1117 !important;
  color: #e6edf3 !important;
  border-color: #30363d !important;
  resize: vertical;
  min-height: 240px;
  overflow-y: auto;
  padding: 0 !important;
}
.content-ta:focus-within { border-color: #388bfd !important; }

/* Tiptap content styling overrides */
.content-ta :deep(.ProseMirror) {
  min-height: 240px;
  padding: 14px;
  outline: none;
  font-family: inherit;
  line-height: 1.6;
  font-size: 13.5px;
}
.content-ta :deep(.ProseMirror p.is-editor-empty:first-child::before) {
  content: attr(data-placeholder);
  float: left;
  color: #4b5268;
  pointer-events: none;
  height: 0;
}
.content-ta :deep(.ProseMirror pre) {
  background: #161b22;
  color: #c9d1d9;
  font-family: 'Fira Code', monospace;
  padding: 12px;
  border-radius: 6px;
  margin: 10px 0;
  border: 1px solid #30363d;
}
.content-ta :deep(.ProseMirror code) {
  font-family: 'Fira Code', monospace;
  background: rgba(255,255,255,0.1);
  padding: 2px 4px;
  border-radius: 4px;
  font-size: 12px;
}
.content-ta :deep(.ProseMirror h1) { font-size: 16px; font-weight: 800; margin: 16px 0 8px; border-bottom: 1px solid #30363d; padding-bottom: 4px; }
.content-ta :deep(.ProseMirror h2) { font-size: 14px; font-weight: 700; margin: 12px 0 6px; }
.content-ta :deep(.ProseMirror blockquote) { border-left: 3px solid #388bfd; margin-left: 0; padding-left: 14px; color: #8b949e; }
.content-ta :deep(.ProseMirror ul), .content-ta :deep(.ProseMirror ol) { padding-left: 20px; }

.field-label { font-size: 11.5px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: .06em; }
.req { color: var(--danger); }
.opt { font-weight: 400; text-transform: none; letter-spacing: 0; color: var(--text-muted); font-size: 10px; }

.form-footer { display: flex; justify-content: flex-end; gap: 10px; padding-top: 14px; border-top: 1px solid var(--border); margin-top: 4px; }
.spinner { width: 13px; height: 13px; border: 2px solid rgba(255,255,255,.3); border-top-color: #fff; border-radius: 50%; animation: spin .7s linear infinite; display: inline-block; flex-shrink: 0; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
