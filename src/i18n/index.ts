import { createI18n } from 'vue-i18n'
import fr from './fr.json'
import ko from './ko.json'

const i18n = createI18n({
  legacy: false,
  locale: 'fr',
  fallbackLocale: 'fr',
  messages: { fr, ko },
})

export default i18n
