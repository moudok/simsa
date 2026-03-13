import { defineStore } from 'pinia'
import { ref, watch, toRaw } from 'vue'
import { getDB } from '@/utils/db'

const DB_KEY = 'membres'

export const useSessionStore = defineStore('session', () => {
  const membres = ref<string[]>([])

  const loaded = ref(false)

  async function loadFromDB() {
    const db = await getDB()
    const saved = await db.get('session', DB_KEY) as string[] | undefined
    if (saved) {
      membres.value = saved
    }
    loaded.value = true
  }

  async function saveToDB() {
    const db = await getDB()
    await db.put('session', JSON.parse(JSON.stringify(toRaw(membres.value))), DB_KEY)
  }

  watch(
    membres,
    () => { if (loaded.value) saveToDB() },
    { deep: true },
  )

  function addMembre(membre: string) {
    if (!membres.value.includes(membre)) {
      membres.value.push(membre)
    }
  }

  async function clear() {
    membres.value = []
    const db = await getDB()
    await db.delete('session', DB_KEY)
  }

  return {
    membres,
    loaded,
    addMembre,
    clear,
    loadFromDB,
  }
})
