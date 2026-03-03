<template>
  <form @submit.prevent="saveNote" class="editor-form">
    <!-- Left Column -->
    <div class="editor-col">
      <div class="field-group">
        <label class="field-label">Problem / Note Title <span class="required">*</span></label>
        <input v-model="form.title" placeholder="e.g. Two Sum, Binary Search..." class="field-input" required />
      </div>

      <div class="field-group">
        <label class="field-label">DSA Topic <span class="required">*</span></label>
        <input v-model="form.topic" placeholder="Arrays, Trees, DP, Graphs..." class="field-input" required />
      </div>

      <div class="field-group">
        <label class="field-label">Tags <span class="optional">(comma separated)</span></label>
        <input v-model="tagsInput" placeholder="two-pointer, hash-map, medium..." class="field-input" />
      </div>

      <div class="field-group">
        <label class="field-label">Question Link</label>
        <div class="link-input-wrap">
          <Link2 :size="14" class="link-icon" />
          <input v-model="form.questionLink" placeholder="LeetCode / GFG URL..." class="field-input link-field" />
        </div>
      </div>
    </div>

    <!-- Right Column -->
    <div class="editor-col">
      <div class="field-group flex-1">
        <label class="field-label">Detailed Notes <span class="required">*</span></label>
        <textarea
          v-model="form.detailedNotes"
          rows="7"
          placeholder="Approach, time/space complexity, edge cases, code logic..."
          class="field-input textarea-field"
          required
        ></textarea>
      </div>

      <div class="field-group forgettable-group">
        <div class="forgettable-label-row">
          <label class="field-label forgettable-lbl">⚡ Important & Forgettable</label>
          <button
            type="button"
            @click="generateAIInsight"
            :disabled="aiLoading || !form.detailedNotes"
            class="ai-btn"
            :class="{ loading: aiLoading }"
          >
            <Sparkles :size="12" />
            {{ aiLoading ? 'Thinking...' : 'AI Suggest' }}
          </button>
        </div>
        <textarea
          v-model="form.forgettables"
          rows="3"
          placeholder="The trick you always forget..."
          class="field-input textarea-field forgettable-field"
        ></textarea>
      </div>
    </div>

    <!-- Footer -->
    <div class="editor-footer">
      <span class="footer-hint">
        <kbd>Ctrl</kbd> + <kbd>Enter</kbd> to save quickly
      </span>
      <div class="footer-actions">
        <button type="button" class="btn-ghost" @click="emit('close')">Cancel</button>
        <button type="submit" class="btn-primary" :disabled="loading">
          <component :is="loading ? 'span' : 'BookCheck'" v-if="!loading" />
          <span v-if="loading" class="spinner"></span>
          {{ loading ? 'Saving...' : 'Save Note' }}
        </button>
      </div>
    </div>
  </form>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { Link2, Sparkles, BookCheck } from 'lucide-vue-next'
import axios from 'axios'

const emit = defineEmits(['close'])
const loading   = ref(false)
const aiLoading = ref(false)
const tagsInput = ref('')

const form = reactive({
  title: '',
  topic: '',
  questionLink: '',
  detailedNotes: '',
  forgettables: '',
  tags: []
})

const generateAIInsight = async () => {
  if (!form.detailedNotes) return
  aiLoading.value = true
  try {
    const res = await axios.post('/api/ai/extract', {
      title: form.title,
      content: form.detailedNotes
    })
    form.forgettables = res.data.insight
  } catch (err) {
    console.error('AI Insight failed', err)
  } finally {
    aiLoading.value = false
  }
}

const saveNote = async () => {
  loading.value = true
  try {
    form.tags = tagsInput.value.split(',').map(t => t.trim()).filter(Boolean)
    await axios.post('/api/notes', form)
    emit('close')
  } catch (err) {
    console.error('Save failed', err)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.editor-form {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 28px;
}

.editor-col {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.field-group {
  display: flex;
  flex-direction: column;
  gap: 7px;
}
.flex-1 { flex: 1; }

.required { color: var(--danger); }
.optional { font-weight: 400; text-transform: none; letter-spacing: 0; color: var(--text-muted); font-size: 10px; }

/* Link field */
.link-input-wrap { position: relative; }
.link-icon {
  position: absolute; left: 11px; top: 50%; transform: translateY(-50%);
  color: var(--text-muted); pointer-events: none;
}
.link-field { padding-left: 32px; }

/* Textarea */
.textarea-field { resize: vertical; font-family: 'Inter', sans-serif; min-height: 90px; }

/* Forgettable */
.forgettable-group {
  background: var(--warning-subtle);
  border: 1px solid var(--warning-border);
  border-radius: 10px;
  padding: 14px;
}
.forgettable-label-row {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 4px;
}
.forgettable-lbl { color: var(--warning) !important; margin-bottom: 0; }

.forgettable-field {
  background: transparent !important;
  border-color: var(--warning-border) !important;
  color: var(--warning) !important;
  font-style: italic;
}
.forgettable-field::placeholder { color: var(--warning); opacity: 0.4; }
.forgettable-field:focus { box-shadow: 0 0 0 3px var(--warning-border) !important; border-color: var(--warning) !important; }

/* AI button */
.ai-btn {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 5px 12px;
  font-size: 11px; font-weight: 600;
  border-radius: 99px;
  background: var(--accent-subtle);
  border: 1px solid var(--accent-border);
  color: var(--accent);
  cursor: pointer;
  transition: all 0.18s;
  font-family: 'Inter', sans-serif;
}
.ai-btn:not(:disabled):hover { background: var(--accent); color: white; border-color: transparent; }
.ai-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.ai-btn.loading { animation: pulse 1.2s ease-in-out infinite; }

@keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.6; } }

/* Footer */
.editor-footer {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 20px;
  border-top: 1px solid var(--border);
}
.footer-hint { font-size: 11.5px; color: var(--text-muted); }
.footer-hint kbd {
  font-size: 10px; font-family: 'Inter', monospace;
  background: var(--bg-subtle);
  border: 1px solid var(--border);
  border-radius: 4px;
  padding: 2px 6px;
  color: var(--text-secondary);
}
.footer-actions { display: flex; gap: 10px; align-items: center; }

.spinner {
  width: 14px; height: 14px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: white;
  border-radius: 50%;
  display: inline-block;
  animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>
