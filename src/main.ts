import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './style.css'

const app = createApp(App)

app.config.errorHandler = (err, _instance, info) => {
  console.error('[Global Error]', err)
  if (info) console.error('[Global Error] Component info:', info)
}

app.use(createPinia())
app.use(router)
app.mount('#app')

// Agentation — dev-only visual feedback toolbar (Vue project: mounted as React island)
if (import.meta.env.DEV) {
  Promise.all([import('react'), import('react-dom/client'), import('agentation')])
    .then(([React, { createRoot }, { Agentation }]) => {
      const el = document.createElement('div')
      el.id = 'agentation-root'
      document.body.appendChild(el)
      createRoot(el).render(React.createElement(Agentation))
    })
    .catch(() => {
      // Agentation mount is best-effort in dev only
    })
}
