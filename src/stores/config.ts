import { defineStore } from 'pinia'
import { ref, watch, toRaw } from 'vue'
import type { ConfigLangue, Epreuve, CodeLangue } from '@/types'
import { CONFIG_DEFAUT } from '@/types'
import { getDB } from '@/utils/db'

const DB_KEY = 'config'

export const useConfigStore = defineStore('config', () => {
  const langues = ref<ConfigLangue[]>([...CONFIG_DEFAUT.langues])
  const langueActive = ref<CodeLangue>(CONFIG_DEFAUT.langueActive)
  const epreuves = ref<Epreuve[]>([...CONFIG_DEFAUT.epreuves])
  const dureesChrono = ref<number[]>([...CONFIG_DEFAUT.dureesChrono])
  const elevesParLigne = ref(CONFIG_DEFAUT.elevesParLigne)

  // Prevent auto-save before initial load completes
  const loaded = ref(false)

  async function loadFromDB() {
    const db = await getDB()
    const saved = await db.get('config', DB_KEY) as Record<string, unknown> | undefined
    if (saved) {
      langues.value = (saved.langues as ConfigLangue[]) ?? [...CONFIG_DEFAUT.langues]
      langueActive.value = (saved.langueActive as CodeLangue) ?? CONFIG_DEFAUT.langueActive
      epreuves.value = (saved.epreuves as Epreuve[]) ?? [...CONFIG_DEFAUT.epreuves]
      dureesChrono.value = (saved.dureesChrono as number[]) ?? [...CONFIG_DEFAUT.dureesChrono]
      elevesParLigne.value = (saved.elevesParLigne as number) ?? CONFIG_DEFAUT.elevesParLigne
    }
    loaded.value = true
  }

  async function saveToDB() {
    const db = await getDB()
    await db.put('config', JSON.parse(JSON.stringify({
      langues: toRaw(langues.value),
      langueActive: langueActive.value,
      epreuves: toRaw(epreuves.value),
      dureesChrono: toRaw(dureesChrono.value),
      elevesParLigne: elevesParLigne.value,
    })), DB_KEY)
  }

  // Auto-save on any state change
  watch(
    [langues, langueActive, epreuves, dureesChrono, elevesParLigne],
    () => { if (loaded.value) saveToDB() },
    { deep: true },
  )

  function setLangueActive(code: CodeLangue) {
    langueActive.value = code
  }

  function addEpreuve(epreuve: Epreuve) {
    epreuves.value.push(epreuve)
  }

  function insertEpreuveAfter(index: number, epreuve: Epreuve) {
    epreuves.value.splice(index + 1, 0, epreuve)
  }

  function moveEpreuve(index: number, direction: -1 | 1) {
    const target = index + direction
    if (target < 0 || target >= epreuves.value.length) return
    const tmp = epreuves.value[index]
    epreuves.value[index] = epreuves.value[target]
    epreuves.value[target] = tmp
    epreuves.value = [...epreuves.value] // trigger reactivity
  }

  function updateEpreuve(epreuve: Epreuve) {
    const index = epreuves.value.findIndex(e => e.id === epreuve.id)
    if (index !== -1) {
      epreuves.value[index] = epreuve
    }
  }

  function updateEpreuveLabel(id: number, langueCode: CodeLangue, label: string) {
    const epreuve = epreuves.value.find(e => e.id === id)
    if (epreuve) {
      epreuve.labels[langueCode] = label
    }
  }

  function removeEpreuve(id: number) {
    epreuves.value = epreuves.value.filter(e => e.id !== id)
  }

  function setDureesChrono(durees: number[]) {
    dureesChrono.value = durees
  }

  function addDuree(seconds: number) {
    const s = Math.floor(seconds)
    if (s > 0 && !dureesChrono.value.includes(s)) {
      dureesChrono.value.push(s)
      dureesChrono.value.sort((a, b) => a - b)
    }
  }

  function removeDuree(index: number) {
    dureesChrono.value.splice(index, 1)
  }

  // Get the label of an epreuve in a given language (falls back to fr)
  function getEpreuveLabel(id: number, langue?: CodeLangue): string {
    const epreuve = epreuves.value.find(e => e.id === id)
    if (!epreuve) return ''
    const lang = langue ?? langueActive.value
    return epreuve.labels[lang] ?? epreuve.labels['fr'] ?? ''
  }

  function resetToDefaults() {
    langues.value = [...CONFIG_DEFAUT.langues]
    langueActive.value = CONFIG_DEFAUT.langueActive
    epreuves.value = CONFIG_DEFAUT.epreuves.map(e => ({ ...e, labels: { ...e.labels } }))
    dureesChrono.value = [...CONFIG_DEFAUT.dureesChrono]
    elevesParLigne.value = CONFIG_DEFAUT.elevesParLigne
  }

  return {
    langues,
    langueActive,
    epreuves,
    dureesChrono,
    elevesParLigne,
    loaded,
    loadFromDB,
    setLangueActive,
    addEpreuve,
    insertEpreuveAfter,
    moveEpreuve,
    updateEpreuve,
    updateEpreuveLabel,
    removeEpreuve,
    setDureesChrono,
    addDuree,
    removeDuree,
    getEpreuveLabel,
    resetToDefaults,
  }
})
