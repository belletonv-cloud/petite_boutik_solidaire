import { createApp } from 'vue'
import './style.css'
import App from './App.vue'

// Routage simple sans vue-router : /admin → AdminPanel (lazy), reste → App
const isAdmin = window.location.pathname.startsWith('/admin')

if (isAdmin) {
  import('./components/AdminPanel.vue').then(m => {
    createApp(m.default).mount('#app')
  })
} else {
  createApp(App).mount('#app')
}
