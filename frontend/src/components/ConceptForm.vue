<template>
  <form @submit.prevent="save" class="flex-col gap-4">
    <div>
      <label class="field-label">Concept Title <span style="color:var(--danger)">*</span></label>
      <input v-model="form.title" class="field-input" placeholder="Sliding Window Technique, Prefix Sum..." required />
    </div>
    <div>
      <label class="field-label">Explanation <span style="color:var(--danger)">*</span></label>
      <textarea v-model="form.explanation" class="field-input" rows="5" style="resize:vertical" placeholder="Explain the concept, when to use it, how it works..." required></textarea>
    </div>
    <div>
      <label class="field-label" style="color:var(--warning)">⚡ Key Points to Remember</label>
      <textarea v-model="form.keyPoints" class="field-input" rows="3" style="resize:vertical" placeholder="The most important things you always forget about this concept..."></textarea>
    </div>
    <div class="form-footer">
      <button type="button" class="btn-ghost" @click="emit('saved')">Cancel</button>
      <button type="submit" class="btn-primary" :disabled="saving">
        <span v-if="saving" class="spinner"></span>
        {{ saving ? 'Saving...' : (initial ? 'Save Changes' : 'Add Concept') }}
      </button>
    </div>
  </form>
</template>

<script setup>
import { reactive, ref, watch } from 'vue'
import axios from 'axios'

const props = defineProps(['topicId', 'initial'])
const emit = defineEmits(['saved'])
const saving = ref(false)

const form = reactive({ title: '', explanation: '', keyPoints: '' })

watch(() => props.initial, (init) => {
  if (!init) return
  Object.assign(form, { title: init.title || '', explanation: init.explanation || '', keyPoints: init.keyPoints || '' })
}, { immediate: true })

const save = async () => {
  saving.value = true
  try {
    const payload = { ...form, topicId: props.topicId }
    if (props.initial?._id) {
      await axios.put(`/api/concepts/${props.initial._id}`, payload)
    } else {
      await axios.post('/api/concepts', payload)
      // Update concept count on topic
      try {
        const [tRes, cRes] = await Promise.all([
          axios.get(`/api/topics/${props.topicId}`),
          axios.get(`/api/concepts/by-topic/${props.topicId}`),
        ])
        await axios.put(`/api/topics/${props.topicId}`, { totalConcepts: cRes.data.length, name: tRes.data.name })
      } catch (_) {}
    }
    emit('saved')
  } finally { saving.value = false }
}
</script>

<style scoped>
.flex-col { display:flex; flex-direction:column; }
.gap-4 > * + * { margin-top:16px; }
.form-footer { display:flex; justify-content:flex-end; gap:10px; padding-top:16px; border-top:1px solid var(--border); margin-top:8px; }
.spinner { width:13px; height:13px; border:2px solid rgba(255,255,255,.3); border-top-color:#fff; border-radius:50%; animation:spin .7s linear infinite; display:inline-block; }
@keyframes spin { to { transform:rotate(360deg); } }
</style>
