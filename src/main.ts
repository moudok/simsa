import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { IonicVue } from '@ionic/vue'
import App from './App.vue'
import router from './router'
import i18n from './i18n'
import { useConfigStore } from './stores/config'
import { useStudentsStore } from './stores/students'
import { useNotesStore } from './stores/notes'
import { useSessionStore } from './stores/session'

// Ionic core CSS
import '@ionic/vue/css/core.css'

// Ionic base CSS
import '@ionic/vue/css/normalize.css'
import '@ionic/vue/css/structure.css'
import '@ionic/vue/css/typography.css'

// Ionic optional CSS utilities
import '@ionic/vue/css/padding.css'
import '@ionic/vue/css/float-elements.css'
import '@ionic/vue/css/text-alignment.css'
import '@ionic/vue/css/text-transformation.css'
import '@ionic/vue/css/flex-utils.css'
import '@ionic/vue/css/display.css'

// Dark mode support
import '@ionic/vue/css/palettes/dark.system.css'

// Noto Sans KR for offline Korean support
import '@fontsource/noto-sans-kr/400.css'
import '@fontsource/noto-sans-kr/700.css'

// PWA: force reload when a new version is available
import { registerSW } from 'virtual:pwa-register'

registerSW({
  onNeedRefresh() {
    window.location.reload()
  },
})

async function initApp() {
  const app = createApp(App)
  const pinia = createPinia()

  app.use(pinia)
  app.use(IonicVue)
  app.use(router)
  app.use(i18n)

  // Load persisted data from IndexedDB
  const configStore = useConfigStore()
  const studentsStore = useStudentsStore()
  const notesStore = useNotesStore()
  const sessionStore = useSessionStore()
  await Promise.all([
    configStore.loadFromDB(),
    studentsStore.loadFromDB(),
    notesStore.loadFromDB(),
    sessionStore.loadFromDB(),
  ])
  ;(i18n.global.locale as unknown as { value: string }).value = configStore.langueActive
  document.documentElement.lang = configStore.langueActive

  router.isReady().then(() => {
    app.mount('#app')
  })
}

initApp()
