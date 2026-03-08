<template>
  <div class="snip-page">
    <header class="snip-header">
      <div class="snip-header-left">
        <div class="snip-icon"><Zap :size="18" /></div>
        <div>
          <h1 class="snip-title">Important Snippets</h1>
          <p class="snip-sub">All your key insights across every topic, in one place</p>
        </div>
      </div>
      <div class="snip-header-right">
        <button class="ctrl-btn" @click="expandAll">
          <ChevronsDown :size="14" /> Expand All
        </button>
        <button class="ctrl-btn" @click="collapseAll">
          <ChevronsUp :size="14" /> Collapse All
        </button>
      </div>
    </header>

    <div v-if="loading" class="snip-loading">
      <span class="spinner"></span>
    </div>

    <div v-else-if="!groups.length" class="snip-empty">
      <Zap :size="40" style="opacity:0.15; margin-bottom:16px" />
      <p>No snippets written yet.</p>
      <span>Open a topic, click "Edit Snippets" and start capturing your golden bits!</span>
    </div>

    <div v-else class="snip-body">
      <!-- Ungrouped (no folder) -->
      <section v-if="ungrouped.length" class="folder-section">
        <div class="folder-header" @click="toggleFolder('__root__')">
          <div class="folder-label">
            <div class="folder-icon root-icon"><BookOpen :size="14" /></div>
            <span class="folder-name">Uncategorised Topics</span>
            <span class="folder-count">{{ ungrouped.length }}</span>
          </div>
          <ChevronDown class="folder-chevron" :class="{ rotated: !collapsed['__root__'] }" :size="16" />
        </div>
        <div v-show="!collapsed['__root__']" class="folder-topics">
          <TopicSnippetCard
            v-for="t in ungrouped"
            :key="t._id"
            :topic="t"
            :open="openTopics[t._id] !== false"
            @toggle="toggleTopic(t._id)"
          />
        </div>
      </section>

      <!-- Folders -->
      <section v-for="folder in folders" :key="folder._id" class="folder-section">
        <div class="folder-header" @click="toggleFolder(folder._id)">
          <div class="folder-label">
            <div class="folder-icon"><Folder :size="14" /></div>
            <span class="folder-name">{{ folder.name }}</span>
            <span class="folder-count">{{ childrenOf(folder._id).length }}</span>
          </div>
          <ChevronDown class="folder-chevron" :class="{ rotated: !collapsed[folder._id] }" :size="16" />
        </div>
        <div v-show="!collapsed[folder._id]" class="folder-topics">
          <TopicSnippetCard
            v-for="t in childrenOf(folder._id)"
            :key="t._id"
            :topic="t"
            :open="openTopics[t._id] !== false"
            @toggle="toggleTopic(t._id)"
          />
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, defineComponent, h } from 'vue'
import { RouterLink } from 'vue-router'
import { Zap, BookOpen, Folder, ChevronDown, ChevronsDown, ChevronsUp, ChevronRight, ExternalLink } from 'lucide-vue-next'
import axios from 'axios'

// ─── Inline sub-component for one topic card ───────────────────────────────
const TopicSnippetCard = defineComponent({
  name: 'TopicSnippetCard',
  props: { topic: Object, open: Boolean },
  emits: ['toggle'],
  setup(props, { emit }) {
    return () => {
      const t = props.topic
      return h('div', { class: 'topic-card' }, [
        // Card header
        h('div', { class: 'topic-card-header', onClick: () => emit('toggle') }, [
          h('div', { class: 'topic-card-left' }, [
            h('div', { class: 'topic-dot' }),
            h('span', { class: 'topic-card-name' }, t.name),
          ]),
          h('div', { class: 'topic-card-right' }, [
            h(RouterLink, {
              to: `/topic/${t._id}`,
              class: 'go-link',
              onClick: (e) => e.stopPropagation(),
              title: 'Open topic'
            }, () => [h(ExternalLink, { size: 12 })]),
            h(ChevronRight, { size: 14, class: ['chevron-icon', props.open ? 'open' : ''] }),
          ]),
        ]),
        // Snippet content
        props.open
          ? h('div', { class: 'topic-card-body' },
              t.snippetsContent
                ? h('div', { class: 'snippet-html', innerHTML: t.snippetsContent })
                : h('p', { class: 'no-snippets' }, 'No snippets written yet for this topic.')
            )
          : null,
      ])
    }
  }
})

// ─── Data & state ──────────────────────────────────────────────────────────
const allTopics = ref([])
const loading = ref(true)
const collapsed = ref({}) // folder._id → boolean (true = collapsed)
const openTopics = ref({})     // topic._id → boolean (true = open)

const folders = computed(() => allTopics.value.filter(t => t.isFolder))
const topicsWithSnippets = computed(() =>
  allTopics.value.filter(t => !t.isFolder)
)

const childrenOf = (folderId) =>
  topicsWithSnippets.value.filter(t => t.parentId === folderId)

const ungrouped = computed(() =>
  topicsWithSnippets.value.filter(t => !t.parentId || !allTopics.value.find(f => f._id === t.parentId && f.isFolder))
)

// groups = folders that have at least one topic
const groups = computed(() => {
  const hasFolders = folders.value.some(f => childrenOf(f._id).length > 0)
  const hasUngrouped = ungrouped.value.length > 0
  return [...(hasUngrouped ? [{ _id: '__root__' }] : []), ...(hasFolders ? folders.value.filter(f => childrenOf(f._id).length > 0) : [])]
})

const toggleFolder = (id) => { collapsed.value[id] = !collapsed.value[id] }
const toggleTopic = (id) => { openTopics.value[id] = !openTopics.value[id] }

const expandAll = () => {
  folders.value.forEach(f => { collapsed.value[f._id] = false })
  collapsed.value['__root__'] = false
  topicsWithSnippets.value.forEach(t => { openTopics.value[t._id] = true })
}

const collapseAll = () => {
  folders.value.forEach(f => { collapsed.value[f._id] = true })
  collapsed.value['__root__'] = true
  topicsWithSnippets.value.forEach(t => { openTopics.value[t._id] = false })
}

onMounted(async () => {
  try {
    allTopics.value = (await axios.get('/api/topics')).data
    // Default: folders open, first topic in each group open
    folders.value.forEach(f => { collapsed.value[f._id] = false })
    collapsed.value['__root__'] = false
    topicsWithSnippets.value.forEach((t, i) => { openTopics.value[t._id] = true })
  } catch (e) { console.error(e) }
  finally { loading.value = false }
})
</script>

<style scoped>
.snip-page {
  min-height: 100vh;
  background: var(--bg);
  color: var(--text-primary);
}

/* ─── Header ─── */
.snip-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 28px 36px 20px;
  border-bottom: 1px solid var(--border);
  background: var(--surface);
  position: sticky;
  top: 0;
  z-index: 50;
}

.snip-header-left { display: flex; align-items: center; gap: 16px; }
.snip-icon {
  width: 40px; height: 40px; border-radius: 10px;
  background: var(--accent); color: #fff;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.snip-title { font-size: 20px; font-weight: 800; margin: 0; }
.snip-sub { font-size: 12.5px; color: var(--text-muted); margin-top: 2px; }

.snip-header-right { display: flex; gap: 8px; }
.ctrl-btn {
  display: flex; align-items: center; gap: 6px; padding: 6px 14px;
  border: 1px solid var(--border); border-radius: 8px;
  background: var(--surface); color: var(--text-secondary);
  font-size: 12.5px; font-weight: 600; cursor: pointer;
  transition: all 0.15s; font-family: 'Inter', sans-serif;
}
.ctrl-btn:hover { background: var(--bg-subtle); color: var(--accent); border-color: var(--accent-border); }

/* ─── Loading / Empty ─── */
.snip-loading { display: flex; justify-content: center; padding: 100px; }
.spinner { width: 36px; height: 36px; border: 3px solid var(--bg-subtle); border-top-color: var(--accent); border-radius: 50%; animation: spin 0.8s linear infinite; display: block; }
@keyframes spin { to { transform: rotate(360deg); } }

.snip-empty {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 100px 20px; text-align: center; color: var(--text-muted);
}
.snip-empty p { font-size: 18px; font-weight: 700; margin-bottom: 8px; color: var(--text-primary); }
.snip-empty span { font-size: 13.5px; max-width: 400px; line-height: 1.7; }

/* ─── Body ─── */
.snip-body { padding: 28px 36px; display: flex; flex-direction: column; gap: 20px; max-width: 1100px; }

/* ─── Folder Section ─── */
.folder-section {
  border: 1px solid var(--border);
  border-radius: 14px;
  overflow: hidden;
  background: var(--surface);
  box-shadow: var(--shadow-sm);
}

.folder-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 20px;
  cursor: pointer;
  background: var(--bg-subtle);
  border-bottom: 1px solid var(--border);
  user-select: none;
  transition: background 0.15s;
}
.folder-header:hover { background: var(--bg); }

.folder-label { display: flex; align-items: center; gap: 10px; }
.folder-icon {
  width: 28px; height: 28px; border-radius: 7px;
  background: var(--accent-subtle); color: var(--accent);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.root-icon { background: var(--warning-subtle); color: var(--warning); }
.folder-name { font-size: 14px; font-weight: 700; color: var(--text-primary); }
.folder-count {
  font-size: 10.5px; font-weight: 700; padding: 2px 8px;
  border-radius: 99px; background: var(--accent-subtle); color: var(--accent);
}
.folder-chevron { color: var(--text-muted); transition: transform 0.2s; }
.folder-chevron.rotated { transform: rotate(-90deg); }

.folder-topics { display: flex; flex-direction: column; }

/* ─── Topic Card ─── */
:deep(.topic-card) {
  border-bottom: 1px solid var(--border-subtle);
  background: var(--surface);
  transition: background 0.15s;
}
:deep(.topic-card:last-child) { border-bottom: none; }

:deep(.topic-card-header) {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 20px; cursor: pointer;
  transition: background 0.15s;
}
:deep(.topic-card-header:hover) { background: var(--bg-subtle); }

:deep(.topic-card-left) { display: flex; align-items: center; gap: 10px; }
:deep(.topic-dot) {
  width: 7px; height: 7px; border-radius: 50%;
  background: var(--accent); flex-shrink: 0;
}
:deep(.topic-card-name) { font-size: 13.5px; font-weight: 700; color: var(--text-primary); }

:deep(.topic-card-right) { display: flex; align-items: center; gap: 10px; }
:deep(.go-link) {
  display: flex; align-items: center; justify-content: center;
  width: 22px; height: 22px; border-radius: 6px;
  color: var(--text-muted); background: var(--bg-subtle);
  text-decoration: none; transition: all 0.15s;
}
:deep(.go-link:hover) { color: var(--accent); background: var(--accent-subtle); }
:deep(.chevron-icon) {
  color: var(--text-muted); transition: transform 0.2s;
  transform: rotate(90deg);
}
:deep(.chevron-icon.open) { transform: rotate(-90deg); }

:deep(.topic-card-body) {
  padding: 16px 24px 20px 36px;
  background: var(--bg);
  border-top: 1px solid var(--border-subtle);
}

:deep(.no-snippets) {
  font-size: 12.5px; color: var(--text-muted); font-style: italic;
}

/* ─── Rendered Snippet HTML ─── */
:deep(.snippet-html) {
  font-size: 13.5px; line-height: 1.7; color: var(--text-secondary);
}
:deep(.snippet-html h1) { font-size: 18px; font-weight: 700; margin: 16px 0 8px; color: var(--text-primary); border-bottom: 1px solid var(--border); padding-bottom: 4px; }
:deep(.snippet-html h2) { font-size: 15px; font-weight: 700; margin: 14px 0 6px; color: var(--text-primary); }
:deep(.snippet-html p) { margin-bottom: 10px; }
:deep(.snippet-html ul) { padding-left: 20px; margin-bottom: 10px; list-style-type: disc; }
:deep(.snippet-html ol) { padding-left: 20px; margin-bottom: 10px; list-style-type: decimal; }
:deep(.snippet-html li) { margin-bottom: 4px; display: list-item; }
:deep(.snippet-html strong) { font-weight: 700; color: var(--text-primary); }
:deep(.snippet-html em) { font-style: italic; }
:deep(.snippet-html code) {
  background: var(--accent-subtle); color: var(--accent);
  border-radius: 3px; padding: 0.1em 0.4em; font-size: 88%;
}
:deep(.snippet-html pre) {
  background: var(--bg-subtle); border: 1px solid var(--border);
  border-radius: 8px; padding: 12px 16px; margin: 12px 0;
  overflow-x: auto; font-size: 12.5px; line-height: 1.6;
}
:deep(.snippet-html pre code) {
  background: none; color: var(--text-primary);
  padding: 0; font-size: inherit;
}
</style>
