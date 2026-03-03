<template>
  <div class="ccard">
    <div class="ccard-header">
      <h3 class="c-title">{{ concept.title }}</h3>
      <div class="ccard-actions">
        <button class="icon-action" @click="editing = true" title="Edit"><Pencil :size="14" /></button>
        <button class="icon-action danger" @click="deleteC" title="Delete"><Trash2 :size="14" /></button>
      </div>
    </div>
    <p class="c-explanation">{{ concept.explanation }}</p>
    <div v-if="concept.keyPoints" class="c-keypoints">
      <div class="kp-label"><Zap :size="12" /> Key Points to Remember</div>
      <p class="kp-text">{{ concept.keyPoints }}</p>
    </div>
  </div>

  <!-- Edit Modal -->
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="editing" class="modal-wrap" @click.self="editing = false">
        <div class="modal-overlay" @click="editing = false"></div>
        <div class="modal-box" style="max-width:600px">
          <div class="modal-header">
            <div><h2 class="modal-title">Edit Concept</h2></div>
            <button class="btn-ghost icon-btn" @click="editing = false"><X :size="18" /></button>
          </div>
          <ConceptForm :topicId="concept.topicId" :initial="concept" @saved="editing = false; emit('updated')" />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref } from 'vue'
import { Pencil, Trash2, Zap, X } from 'lucide-vue-next'
import axios from 'axios'
import ConceptForm from './ConceptForm.vue'

const props = defineProps(['concept'])
const emit = defineEmits(['deleted','updated'])
const editing = ref(false)

const deleteC = async () => {
  if (!confirm('Delete this concept?')) return
  await axios.delete(`/api/concepts/${props.concept._id}`)
  emit('deleted')
}
</script>

<style scoped>
.ccard { background:var(--surface); border:1px solid var(--border); border-radius:12px; padding:18px 20px; display:flex; flex-direction:column; gap:12px; box-shadow:var(--shadow-sm); }
.ccard-header { display:flex; align-items:flex-start; justify-content:space-between; gap:10px; }
.c-title { font-size:15px; font-weight:700; color:var(--text-primary); }
.ccard-actions { display:flex; gap:4px; flex-shrink:0; }
.icon-action { padding:5px; border-radius:6px; background:none; border:none; color:var(--text-muted); cursor:pointer; display:flex; align-items:center; transition:all .15s; }
.icon-action:hover { background:var(--bg-subtle); color:var(--text-primary); }
.icon-action.danger:hover { color:#dc2626; background:#fee2e2; }
.c-explanation { font-size:13.5px; color:var(--text-secondary); line-height:1.7; white-space:pre-wrap; }
.c-keypoints { background:var(--warning-subtle); border:1px solid var(--warning-border); border-radius:8px; padding:12px 14px; }
.kp-label { display:flex; align-items:center; gap:5px; font-size:10.5px; font-weight:700; text-transform:uppercase; letter-spacing:.08em; color:var(--warning); margin-bottom:6px; }
.kp-text { font-size:13px; color:var(--warning); line-height:1.6; font-style:italic; white-space:pre-wrap; }
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
