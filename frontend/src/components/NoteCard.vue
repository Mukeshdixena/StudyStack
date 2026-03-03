<template>
  <div class="note-card" @click="showDetail = true" style="cursor:pointer;">
    <!-- Top row: topic badge + actions -->
    <div class="card-top">
      <span class="badge">{{ note.topic }}</span>
      <div class="card-actions" @click.stop>
        <a
          v-if="note.questionLink"
          :href="note.questionLink"
          target="_blank"
          class="card-action-btn"
          title="Open question"
        >
          <ExternalLink :size="13" />
        </a>
        <button class="card-action-btn danger" @click="deleteNote" title="Delete">
          <Trash2 :size="13" />
        </button>
      </div>
    </div>

    <!-- Title -->
    <h3 class="card-title">{{ note.title }}</h3>

    <!-- Body preview -->
    <p class="card-body">{{ note.detailedNotes }}</p>

    <!-- Forgettable section -->
    <div v-if="note.forgettables" class="card-forgettable">
      <div class="forgettable-header">
        <Zap :size="11" />
        <span>Key Insight</span>
      </div>
      <p class="forgettable-text">{{ note.forgettables }}</p>
    </div>

    <!-- Footer: date + tags -->
    <div class="card-footer">
      <span class="card-date">{{ formatDate(note.createdAt) }}</span>
      <div class="card-tags">
        <span v-for="tag in (note.tags || []).slice(0, 3)" :key="tag" class="tag">#{{ tag }}</span>
      </div>
    </div>
  </div>

  <!-- ─── Detail Modal ─── -->
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="showDetail" class="modal-wrap" @click.self="showDetail = false">
        <div class="modal-overlay absolute inset-0" @click="showDetail = false"></div>
        <div class="modal-box detail-box">
          <!-- Header -->
          <div class="detail-header">
            <div class="flex items-center gap-3">
              <span class="badge">{{ note.topic }}</span>
              <a v-if="note.questionLink" :href="note.questionLink" target="_blank" class="link-btn">
                <ExternalLink :size="12" /> View Problem
              </a>
            </div>
            <button class="btn-ghost icon-btn" @click="showDetail = false">
              <X :size="18" />
            </button>
          </div>

          <h2 class="detail-title">{{ note.title }}</h2>

          <!-- Detailed Notes -->
          <div class="detail-section">
            <p class="det-label">Detailed Notes</p>
            <div class="detail-content">{{ note.detailedNotes }}</div>
          </div>

          <!-- Forgettable -->
          <div v-if="note.forgettables" class="detail-forgettable">
            <div class="forgettable-header">
              <Zap :size="13" />
              <span>Important & Forgettable</span>
            </div>
            <p class="detail-forgettable-text">{{ note.forgettables }}</p>
          </div>

          <!-- Tags & Date footer -->
          <div class="detail-footer">
            <span class="card-date">{{ formatDate(note.createdAt) }}</span>
            <div class="card-tags">
              <span v-for="tag in (note.tags || [])" :key="tag" class="tag">#{{ tag }}</span>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref } from 'vue'
import { ExternalLink, Trash2, Zap, X } from 'lucide-vue-next'
import axios from 'axios'

const props = defineProps(['note'])
const emit = defineEmits(['deleted', 'updated'])
const showDetail = ref(false)

const formatDate = (d) => {
  if (!d) return ''
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

const deleteNote = async () => {
  if (!confirm('Delete this note?')) return
  try {
    await axios.delete(`/api/notes/${props.note._id}`)
    emit('deleted')
  } catch (err) {
    console.error('Delete failed', err)
  }
}
</script>

<style scoped>
/* ─── Card ─── */
.note-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  transition: box-shadow 0.2s, border-color 0.2s, transform 0.2s;
  box-shadow: var(--shadow-sm);
}
.note-card:hover {
  box-shadow: var(--shadow-md);
  border-color: var(--accent-border);
  transform: translateY(-2px);
}

.card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.card-actions {
  display: flex; align-items: center; gap: 4px;
  opacity: 0; transition: opacity 0.15s;
}
.note-card:hover .card-actions { opacity: 1; }

.card-action-btn {
  padding: 5px;
  border-radius: 6px;
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: background 0.15s, color 0.15s;
}
.card-action-btn:hover { background: var(--bg-subtle); color: var(--text-primary); }
.card-action-btn.danger:hover { background: #fee2e2; color: #dc2626; }

.card-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.35;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-body {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.65;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  flex: 1;
}

/* ─── Forgettable ─── */
.card-forgettable {
  border-top: 1px solid var(--warning-border);
  padding-top: 12px;
  background: var(--warning-subtle);
  border-radius: 0 0 10px 10px;
  margin: 0 -20px -20px;
  padding: 12px 20px;
}
.forgettable-header {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--warning);
  margin-bottom: 6px;
}
.forgettable-text {
  font-size: 12.5px;
  color: var(--warning);
  font-style: italic;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* ─── Footer ─── */
.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 4px;
}
.card-date { font-size: 11px; color: var(--text-muted); font-weight: 500; }
.card-tags { display: flex; gap: 4px; flex-wrap: wrap; }
.tag {
  font-size: 10px;
  font-weight: 600;
  color: var(--text-muted);
  letter-spacing: 0.02em;
}

/* ─── Detail Modal ─── */
.modal-wrap {
  position: fixed; inset: 0; z-index: 100;
  display: flex; align-items: center; justify-content: center;
  padding: 20px;
}
.modal-overlay { position: absolute; inset: 0; background: rgba(5,7,18,0.5); backdrop-filter: blur(6px); }

.detail-box {
  position: relative; z-index: 1;
  width: 100%; max-width: 680px;
  background: var(--surface-raised);
  border: 1px solid var(--border);
  border-radius: 18px;
  padding: 32px;
  box-shadow: var(--shadow-xl);
  max-height: 90vh;
  overflow-y: auto;
}

.detail-header {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 18px;
}
.link-btn {
  display: inline-flex; align-items: center; gap: 5px;
  font-size: 12px; font-weight: 600;
  color: var(--accent);
  text-decoration: none;
  padding: 4px 10px;
  border-radius: 99px;
  background: var(--accent-subtle);
  border: 1px solid var(--accent-border);
  transition: background 0.15s;
}
.link-btn:hover { background: var(--accent); color: white; }

.detail-title {
  font-size: 22px; font-weight: 800;
  color: var(--text-primary);
  line-height: 1.3;
  margin-bottom: 24px;
}

.detail-section { margin-bottom: 24px; }
.det-label {
  font-size: 10px; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.1em;
  color: var(--text-muted);
  margin-bottom: 10px;
}
.detail-content {
  font-size: 14px; color: var(--text-secondary);
  line-height: 1.75;
  white-space: pre-wrap;
  background: var(--bg-subtle);
  border-radius: 10px;
  padding: 16px;
  border: 1px solid var(--border);
}

.detail-forgettable {
  background: var(--warning-subtle);
  border: 1px solid var(--warning-border);
  border-radius: 10px;
  padding: 16px;
  margin-bottom: 24px;
}
.detail-forgettable-text {
  font-size: 14px;
  color: var(--warning);
  font-style: italic;
  line-height: 1.65;
  margin-top: 8px;
  white-space: pre-wrap;
}

.detail-footer {
  display: flex; align-items: center; justify-content: space-between;
  padding-top: 16px;
  border-top: 1px solid var(--border);
}

.icon-btn { padding: 6px; border-radius: 8px; }

.modal-enter-active, .modal-leave-active { transition: opacity 0.2s ease; }
.modal-enter-active .detail-box, .modal-leave-active .detail-box { transition: transform 0.25s cubic-bezier(0.34,1.56,0.64,1), opacity 0.2s; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-from .detail-box { transform: scale(0.96) translateY(10px); opacity: 0; }
.modal-leave-to .detail-box { transform: scale(0.97); opacity: 0; }
</style>
