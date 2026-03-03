import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import './style.css'
import App from './App.vue'

import Home from './views/Home.vue'
import TopicDetail from './views/TopicDetail.vue'

const routes = [
    { path: '/', component: Home },
    { path: '/topic/:id', component: TopicDetail },
]

const router = createRouter({
    history: createWebHistory(),
    routes,
})

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.mount('#app')
