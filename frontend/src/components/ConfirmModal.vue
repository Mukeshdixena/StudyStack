<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="show" class="modal-wrap" @click.self="$emit('cancel')">
        <div class="modal-overlay" @click="$emit('cancel')"></div>
        <div class="modal-box" style="max-width:400px; padding:32px">
          <div class="flex flex-col items-center text-center">
            <div class="delete-icon-box">
              <Trash2 :size="24" />
            </div>
            <h2 class="modal-title" style="margin-top:20px">Confirm Deletion</h2>
            <p class="modal-sub" style="margin-top:10px; font-size:14px; line-height:1.5">
              Are you sure you want to delete <strong>"{{ title }}"</strong>? 
              This action cannot be undone.
            </p>
            <div v-if="isFolder" class="folder-warning">
              <AlertTriangle :size="14" />
              <span>All sub-topics and content will be lost permanently.</span>
            </div>
          </div>
          
          <div class="flex gap-3 mt-8">
            <button class="btn-ghost flex-1 justify-center" @click="$emit('cancel')">Cancel</button>
            <button class="btn-danger flex-1 justify-center" @click="$emit('confirm')" :disabled="loading">
              <span v-if="loading" class="spinner" style="border-top-color:white; border-left-color:white"></span>
              {{ loading ? 'Deleting...' : 'Delete Forever' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { Trash2, AlertTriangle } from 'lucide-vue-next'

defineProps({
  show: Boolean,
  title: String,
  isFolder: Boolean,
  loading: Boolean
})

defineEmits(['confirm', 'cancel'])
</script>

<style scoped>
.modal-wrap { position:fixed; inset:0; z-index:999; display:flex; align-items:center; justify-content:center; padding:20px; font-family: 'Inter', sans-serif; }
.modal-overlay { position:absolute; inset:0; background:rgba(5,7,18,.55); backdrop-filter:blur(6px); }
[data-theme="dark"] .modal-overlay { background:rgba(0,0,0,.72); }

.modal-box { position:relative; z-index:1; width:100%; background:var(--surface-raised); border:1px solid var(--border); border-radius:16px; box-shadow:var(--shadow-xl); }

.modal-title { font-size:18px; font-weight:700; color:var(--text-primary); margin: 0; }
.modal-sub { font-size:12px; color:var(--text-muted); margin: 0; }

.btn-danger {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: var(--danger);
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  border-radius: var(--radius);
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(220, 38, 38, 0.2);
}

.btn-danger:hover:not(:disabled) {
  background: #b91c1c;
  box-shadow: 0 6px 20px rgba(220, 38, 38, 0.3);
  transform: translateY(-1px);
}

.btn-danger:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.delete-icon-box {
  width: 54px;
  height: 54px;
  background: #fff1f2;
  color: #ef4444;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
}

[data-theme="dark"] .delete-icon-box {
  background: rgba(239, 68, 68, 0.1);
  color: #f87171;
}

.folder-warning {
  margin-top: 16px;
  padding: 10px 14px;
  background: #fff7ed;
  border: 1px solid #ffedd5;
  border-radius: 10px;
  color: #c2410c;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
}

[data-theme="dark"] .folder-warning {
  background: rgba(245, 158, 11, 0.05);
  border-color: rgba(245, 158, 11, 0.15);
  color: #fbbf24;
}

.spinner { width:13px; height:13px; border:2px solid rgba(255,255,255,.3); border-top-color:#fff; border-radius:50%; animation:spin .7s linear infinite; display:inline-block; }
@keyframes spin { to { transform:rotate(360deg); } }

.modal-enter-active,.modal-leave-active { transition:opacity .2s; }
.modal-enter-from,.modal-leave-to { opacity:0; }

.flex { display: flex; }
.flex-col { flex-direction: column; }
.items-center { align-items: center; }
.text-center { text-align: center; }
.justify-center { justify-content: center; }
.gap-3 { gap: 12px; }
.mt-8 { margin-top: 32px; }
.flex-1 { flex: 1; }
</style>
