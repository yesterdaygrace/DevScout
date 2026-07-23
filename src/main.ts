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
