<template>
  <div class="app-shell" :data-theme="theme">
    <!-- ═══ SIDEBAR ═══ -->
    <aside class="sidebar">
      <div class="sidebar-brand">
        <div class="brand-logo"><BookOpen :size="17" /></div>
        <div>
          <span class="brand-name">StudyStack</span>
          <span class="brand-sub">DSA Notes</span>
        </div>
      </div>

      <!-- Nav -->
      <nav class="sidebar-nav">
        <span class="nav-section-label">Views</span>
        <RouterLink to="/" class="sidebar-item nav-item" :class="{ active: route.path === '/' }">
          <LayoutGrid :size="15" /> All Topics
        </RouterLink>
      </nav>

      <!-- Topics list -->
      <nav class="sidebar-nav flex-1 overflow-y-auto">
        <div class="flex items-center justify-between mb-2">
          <span class="nav-section-label">Structure</span>
          <div class="flex gap-1">
            <button class="add-topic-btn" @click="openAddModal(true)" title="New Folder"><FolderPlus :size="13" /></button>
            <button class="add-topic-btn" @click="openAddModal(false)" title="New Topic"><Plus :size="13" /></button>
          </div>
        </div>
        <div v-if="!topics.length" class="nav-empty">No topics yet</div>
        <TopicTree 
          v-else 
          :topics="topics" 
          :active-id="route.params.id" 
          @delete="deleteItem"
          @move="moveItem"
          @create="(e) => openAddModal(e.isFolder, e.parentId)"
        />
      </nav>

      <!-- Footer -->
      <div class="sidebar-footer">
        <div class="flex gap-2">
          <button class="btn-primary flex-1 justify-center" @click="openAddModal(false)">
            <Plus :size="15" /> Topic
          </button>
          <button class="btn-ghost" style="border:1px solid var(--border)" @click="openAddModal(true)" title="New Folder">
            <FolderPlus :size="15" />
          </button>
        </div>
        <button class="theme-toggle" @click="toggleTheme">
          <Sun v-if="theme === 'dark'" :size="14" />
          <Moon v-else :size="14" />
          {{ theme === 'dark' ? 'Light Mode' : 'Dark Mode' }}
        </button>
      </div>
    </aside>

    <!-- ═══ MAIN ═══ -->
    <main class="main-content">
      <RouterView @refresh-topics="loadTopics" />
    </main>

    <!-- ═══ ADD TOPIC MODAL ═══ -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showAddTopic" class="modal-wrap" @click.self="showAddTopic = false">
          <div class="modal-overlay" @click="showAddTopic = false"></div>
          <div class="modal-box" style="max-width:480px">
            <div class="modal-header">
              <div>
                <h2 class="modal-title">{{ newTopic.isFolder ? 'New Folder' : 'New Topic' }}</h2>
                <p class="modal-sub">{{ newTopic.isFolder ? 'Create a category to group topics' : 'Create a new chapter or topic' }}</p>
              </div>
              <button class="btn-ghost icon-btn" @click="showAddTopic = false"><X :size="18" /></button>
            </div>
            <form @submit.prevent="createTopic" class="space-y-5">
              <div>
                <label class="field-label">{{ newTopic.isFolder ? 'Folder Name' : 'Topic Name' }} <span style="color:var(--danger)">*</span></label>
                <input v-model="newTopic.name" class="field-input" :placeholder="newTopic.isFolder ? 'e.g. Dynamic Programming' : 'e.g. Sliding Window'" required />
              </div>
              <div v-if="!newTopic.isFolder">
                <label class="field-label">Description</label>
                <input v-model="newTopic.description" class="field-input" placeholder="Short description..." />
              </div>
              <div>
                <label class="field-label">Key Insights / Important Notes</label>
                <textarea v-model="newTopic.keyInsights" class="field-input" rows="3" style="resize:vertical" placeholder="Things you must remember about this topic..."></textarea>
              </div>
              <div class="flex justify-end gap-3 pt-2 border-t" style="border-color:var(--border)">
                <button type="button" class="btn-ghost" @click="showAddTopic = false">Cancel</button>
                <button type="submit" class="btn-primary" :disabled="creating">
                  <span v-if="creating" class="spinner"></span>
                  {{ creating ? 'Creating...' : (newTopic.isFolder ? 'Create Folder' : 'Create Topic') }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Transition>
    </Teleport>

    <ConfirmModal 
      :show="showDeleteConfirm"
      :title="itemToDelete?.name"
      :isFolder="itemToDelete?.isFolder"
      :loading="deleting"
      @confirm="confirmDelete"
      @cancel="showDeleteConfirm = false"
    />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter, RouterLink, RouterView } from 'vue-router'
import { BookOpen, LayoutGrid, AlertCircle, Plus, X, Sun, Moon, FolderPlus, Trash2, AlertTriangle } from 'lucide-vue-next'
import TopicTree from './components/TopicTree.vue'
import ConfirmModal from './components/ConfirmModal.vue'
import axios from 'axios'

const route = useRoute()
const router = useRouter()
const theme = ref(localStorage.getItem('ss-theme') || 'light')
const topics = ref([])
const showAddTopic = ref(false)
const showDeleteConfirm = ref(false)
const creating = ref(false)
const deleting = ref(false)
const revisionCount = ref(0)

const itemToDelete = ref(null)
const newTopic = reactive({ name: '', description: '', keyInsights: '', isFolder: false, parentId: null })

const toggleTheme = () => {
  theme.value = theme.value === 'dark' ? 'light' : 'dark'
  localStorage.setItem('ss-theme', theme.value)
}

const loadTopics = async () => {
  try {
    const [topicsRes, revRes] = await Promise.all([
      axios.get('/api/topics'),
      axios.get('/api/questions/needs-revision'),
    ])
    topics.value = topicsRes.data
    revisionCount.value = revRes.data.length
  } catch (e) { console.error(e) }
}

const createTopic = async () => {
  creating.value = true
  try {
    await axios.post('/api/topics', newTopic)
    Object.assign(newTopic, { name: '', description: '', keyInsights: '', isFolder: false, parentId: null })
    showAddTopic.value = false
    await loadTopics()
  } finally { creating.value = false }
}

const openAddModal = (isFolder = false, parentId = null) => {
  newTopic.isFolder = isFolder
  newTopic.parentId = parentId
  newTopic.name = ''
  newTopic.description = ''
  newTopic.keyInsights = ''
  showAddTopic.value = true
}

const deleteItem = (id) => {
  console.log('App.vue: deleteItem triggered with id:', id);
  if (!id) return;
  
  const item = topics.value.find(t => t._id === id);
  itemToDelete.value = { 
    id, 
    name: item?.name || 'this item', 
    isFolder: item?.isFolder 
  };
  showDeleteConfirm.value = true;
}

const confirmDelete = async () => {
  if (!itemToDelete.value) return;
  
  deleting.value = true;
  try {
    console.log('App.vue: Deleting item:', itemToDelete.value.id);
    await axios.delete(`/api/topics/${itemToDelete.value.id}`)
    await loadTopics()
    if (route.params.id === itemToDelete.value.id) router.push('/')
    showDeleteConfirm.value = false;
  } catch (e) { 
    console.error('Delete failed:', e);
    alert('Failed to delete item. Please check console for details.');
  } finally {
    deleting.value = false;
  }
}

const moveItem = async ({ id, parentId }) => {
  try {
    await axios.put(`/api/topics/${id}`, { parentId })
    await loadTopics()
  } catch (e) { console.error(e) }
}

onMounted(loadTopics)
</script>

<style>
.app-shell { display:flex; height:100vh; overflow:hidden; background:var(--bg); color:var(--text-primary); transition:background .25s,color .25s; }

.sidebar { width:var(--sidebar-w); min-width:var(--sidebar-w); background:var(--surface); border-right:1px solid var(--border); display:flex; flex-direction:column; padding:18px 12px; gap:18px; overflow:hidden; }
.sidebar-brand { display:flex; align-items:center; gap:10px; padding:2px 4px; }
.brand-logo { width:32px; height:32px; background:var(--accent); border-radius:8px; display:flex; align-items:center; justify-content:center; color:#fff; flex-shrink:0; }
.brand-name { display:block; font-size:14px; font-weight:700; color:var(--text-primary); line-height:1.2; }
.brand-sub  { display:block; font-size:10px; color:var(--text-muted); }

.sidebar-nav { display:flex; flex-direction:column; gap:2px; }
.nav-section-label { font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:.1em; color:var(--text-muted); padding:0 8px; margin-bottom:4px; display:block; }
.nav-item { display:flex; align-items:center; gap:8px; padding:7px 10px; font-size:13px; font-weight:500; color:var(--text-secondary); background:none; border:none; cursor:pointer; text-align:left; width:100%; text-decoration:none; border-radius:8px; transition:background .15s,color .15s; }
.nav-item:hover { background:var(--bg-subtle); color:var(--text-primary); }
.nav-item.active { background:var(--accent-subtle); color:var(--accent); font-weight:600; }
.topic-dot { width:5px; height:5px; border-radius:50%; background:var(--border); flex-shrink:0; transition:background .15s; }
.dot-active { background:var(--accent); }
.topic-count { font-size:10px; font-weight:700; color:var(--text-muted); background:var(--bg-subtle); border-radius:99px; padding:1px 7px; }
.rev-badge { margin-left:auto; font-size:10px; font-weight:700; background:#ef4444; color:#fff; border-radius:99px; padding:1px 8px; }
.add-topic-btn { width:20px; height:20px; border-radius:5px; background:none; border:1px solid var(--border); color:var(--text-muted); cursor:pointer; display:flex; align-items:center; justify-content:center; transition:all .15s; }
.add-topic-btn:hover { background:var(--accent-subtle); border-color:var(--accent-border); color:var(--accent); }
.nav-empty { font-size:12px; color:var(--text-muted); padding:4px 10px; }

.sidebar-footer { display:flex; flex-direction:column; gap:8px; }
.theme-toggle { display:flex; align-items:center; gap:8px; padding:8px 12px; border-radius:8px; background:none; border:1px solid var(--border); color:var(--text-secondary); font-size:12px; font-weight:500; cursor:pointer; transition:all .15s; width:100%; font-family:'Inter',sans-serif; }
.theme-toggle:hover { background:var(--bg-subtle); color:var(--text-primary); }

.main-content { flex:1; overflow-y:auto; background:var(--bg); }

/* Modal */
.modal-wrap { position:fixed; inset:0; z-index:100; display:flex; align-items:center; justify-content:center; padding:20px; }
.modal-overlay { position:absolute; inset:0; background:rgba(5,7,18,.5); backdrop-filter:blur(6px); }
[data-theme="dark"] .modal-overlay { background:rgba(0,0,0,.72); }
.modal-box { position:relative; z-index:1; width:100%; background:var(--surface-raised); border:1px solid var(--border); border-radius:16px; padding:28px; box-shadow:var(--shadow-xl); max-height:92vh; overflow-y:auto; }
.modal-header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:22px; padding-bottom:18px; border-bottom:1px solid var(--border); }
.modal-title { font-size:18px; font-weight:700; color:var(--text-primary); }
.modal-sub { font-size:12px; color:var(--text-muted); margin-top:2px; }
.icon-btn { padding:6px; border-radius:8px; }

/* Spinner */
.spinner { width:13px; height:13px; border:2px solid rgba(255,255,255,.3); border-top-color:#fff; border-radius:50%; animation:spin .7s linear infinite; display:inline-block; }
@keyframes spin { to { transform:rotate(360deg); } }

/* Transitions */
.modal-enter-active,.modal-leave-active { transition:opacity .2s; }
.modal-enter-from,.modal-leave-to { opacity:0; }

/* Space utilities used in template */
.space-y-5 > * + * { margin-top:20px; }
.flex { display:flex; }
.justify-end { justify-content:flex-end; }
.gap-3 { gap:12px; }
.pt-2 { padding-top:8px; }
.border-t { border-top:1px solid; }
.flex-1 { flex:1; }
.truncate { overflow:hidden; white-space:nowrap; text-overflow:ellipsis; }
.overflow-y-auto { overflow-y:auto; }
.w-full { width:100%; }
.justify-center { justify-content:center; }
.items-center { align-items:center; }
.mb-2 { margin-bottom:8px; }
</style>
