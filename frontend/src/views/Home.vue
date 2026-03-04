<template>
  <div class="home-wrap">
    <header class="home-header">
      <div>
        <h1 class="home-title">Your DSA Topics</h1>
        <p class="home-sub">Click a topic to view questions and concepts</p>
      </div>
    </header>

    <div v-if="topics.some(t => !t.isFolder)" class="topics-grid">
      <template v-for="t in topics" :key="t._id">
        <RouterLink
          v-if="!t.isFolder"
          :to="`/topic/${t._id}`"
          class="topic-card"
        >
        <div class="tc-top">
          <span class="tc-name">{{ t.name }}</span>
          <ChevronRight :size="16" class="tc-arrow" />
        </div>
        <p v-if="t.description" class="tc-desc">{{ t.description }}</p>
        <div class="tc-stats">
          <span class="tc-stat"><FileText :size="12" /> {{ t.totalQuestions }} Questions</span>
          <span class="tc-stat"><Lightbulb :size="12" /> {{ t.totalConcepts }} Concepts</span>
        </div>
        <div v-if="t.keyInsights" class="tc-insight">
          <Zap :size="11" /> {{ t.keyInsights.slice(0, 100) }}{{ t.keyInsights.length > 100 ? '...' : '' }}
        </div>
        </RouterLink>
      </template>
    </div>

    <div v-else class="empty-state">
      <div class="empty-icon"><BookOpen :size="26" /></div>
      <h3 class="empty-title">No topics yet</h3>
      <p class="empty-desc">Click "New Topic" in the sidebar to create your first chapter.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { ChevronRight, FileText, Lightbulb, Zap, BookOpen } from 'lucide-vue-next'
import axios from 'axios'

defineEmits(['refresh-topics'])

const topics = ref([])
const load = async () => {
  try { topics.value = (await axios.get('/api/topics')).data }
  catch (e) { console.error(e) }
}
onMounted(load)
</script>

<style scoped>
.home-wrap { padding:28px 32px; max-width:1200px; }
.home-header { margin-bottom:28px; }
.home-title { font-size:22px; font-weight:700; color:var(--text-primary); }
.home-sub { font-size:13px; color:var(--text-muted); margin-top:3px; }

.topics-grid {
  display:grid;
  grid-template-columns:repeat(auto-fill,minmax(300px,1fr));
  gap:16px;
}
.topic-card {
  background:var(--surface);
  border:1px solid var(--border);
  border-radius:12px;
  padding:20px;
  text-decoration:none;
  display:flex;
  flex-direction:column;
  gap:10px;
  transition:box-shadow .2s, border-color .2s, transform .2s;
  box-shadow:var(--shadow-sm);
}
.topic-card:hover { box-shadow:var(--shadow-md); border-color:var(--accent-border); transform:translateY(-2px); }
.tc-top { display:flex; align-items:center; justify-content:space-between; gap:10px; }
.tc-name { font-size:15px; font-weight:700; color:var(--text-primary); line-height:1.3; }
.tc-arrow { color:var(--text-muted); flex-shrink:0; transition:transform .15s; }
.topic-card:hover .tc-arrow { transform:translateX(3px); color:var(--accent); }
.tc-desc { font-size:12.5px; color:var(--text-secondary); line-height:1.6; }
.tc-stats { display:flex; gap:14px; }
.tc-stat { display:flex; align-items:center; gap:4px; font-size:11.5px; color:var(--text-muted); font-weight:600; }
.tc-insight {
  display:flex; align-items:flex-start; gap:5px;
  font-size:11.5px; color:var(--warning); font-style:italic;
  background:var(--warning-subtle); border:1px solid var(--warning-border);
  border-radius:7px; padding:8px 10px; line-height:1.5;
}
.empty-state { display:flex; flex-direction:column; align-items:center; justify-content:center; padding:100px 20px; text-align:center; }
.empty-icon { width:56px; height:56px; border-radius:14px; background:var(--accent-subtle); color:var(--accent); display:flex; align-items:center; justify-content:center; margin-bottom:16px; }
.empty-title { font-size:16px; font-weight:700; color:var(--text-primary); margin-bottom:6px; }
.empty-desc { font-size:13px; color:var(--text-muted); max-width:300px; line-height:1.6; }
</style>
