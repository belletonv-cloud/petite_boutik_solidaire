import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import AdminPanel from './components/AdminPanel.vue'

// Routage simple sans vue-router : /admin → AdminPanel, reste → App
const isAdmin = window.location.pathname.startsWith('/admin')

createApp(isAdmin ? AdminPanel : App).mount('#app')
