import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useConfigStore } from './config'

export const useEventsStore = defineStore('events', () => {
  const configStore = useConfigStore()

  // Currently selected epreuve for notation navigation
  const currentEpreuveId = ref<number | null>(null)

  // Epreuves list sourced from config
  const epreuves = computed(() => configStore.epreuves)

  const currentEpreuve = computed(() => {
    if (currentEpreuveId.value === null) return null
    return epreuves.value.find(e => e.id === currentEpreuveId.value) ?? null
  })

  function selectEpreuve(id: number) {
    currentEpreuveId.value = id
  }

  function nextEpreuve() {
    const list = epreuves.value
    if (list.length === 0) return
    if (currentEpreuveId.value === null) {
      currentEpreuveId.value = list[0].id
      return
    }
    const idx = list.findIndex(e => e.id === currentEpreuveId.value)
    if (idx < list.length - 1) {
      currentEpreuveId.value = list[idx + 1].id
    }
  }

  function previousEpreuve() {
    const list = epreuves.value
    if (list.length === 0) return
    if (currentEpreuveId.value === null) {
      currentEpreuveId.value = list[list.length - 1].id
      return
    }
    const idx = list.findIndex(e => e.id === currentEpreuveId.value)
    if (idx > 0) {
      currentEpreuveId.value = list[idx - 1].id
    }
  }

  function reset() {
    currentEpreuveId.value = null
  }

  return {
    epreuves,
    currentEpreuveId,
    currentEpreuve,
    selectEpreuve,
    nextEpreuve,
    previousEpreuve,
    reset,
  }
})
