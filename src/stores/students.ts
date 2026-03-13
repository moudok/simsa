import { defineStore } from 'pinia'
import { ref, computed, reactive, watch, toRaw } from 'vue'
import type { Eleve, Grade } from '@/types'
import { getDB } from '@/utils/db'

const DB_KEY = 'students'

export const useStudentsStore = defineStore('students', () => {
  const eleves = ref<Eleve[]>([])
  const qrMap = reactive<Record<number, string>>({})
  const verdicts = reactive<Record<number, 'pending' | 'passed' | 'failed'>>({})

  const loaded = ref(false)

  async function loadFromDB() {
    const db = await getDB()
    const saved = await db.get('session', DB_KEY) as Record<string, unknown> | undefined
    if (saved) {
      eleves.value = (saved.eleves as Eleve[]) ?? []
      const savedVerdicts = (saved.verdicts as Record<number, 'pending' | 'passed' | 'failed'>) ?? {}
      Object.keys(savedVerdicts).forEach(k => {
        verdicts[Number(k)] = savedVerdicts[Number(k)]
      })
    }
    loaded.value = true
  }

  async function saveToDB() {
    const db = await getDB()
    await db.put('session', JSON.parse(JSON.stringify({
      eleves: toRaw(eleves.value),
      verdicts: toRaw(verdicts),
    })), DB_KEY)
  }

  watch(
    [eleves, () => ({ ...verdicts })],
    () => { if (loaded.value) saveToDB() },
    { deep: true },
  )

  const nextId = computed(() => {
    if (eleves.value.length === 0) return 1
    return Math.max(...eleves.value.map(e => e.id)) + 1
  })

  function add(eleve: Omit<Eleve, 'id'>): Eleve {
    const newEleve: Eleve = { ...eleve, id: nextId.value }
    eleves.value.push(newEleve)
    return newEleve
  }

  function setQR(id: number, dataURL: string) {
    qrMap[id] = dataURL
  }

  function cycleVerdict(id: number) {
    const current = verdicts[id] ?? 'pending'
    if (current === 'pending') verdicts[id] = 'passed'
    else if (current === 'passed') verdicts[id] = 'failed'
    else delete verdicts[id]
  }

  function remove(id: number) {
    eleves.value = eleves.value.filter(e => e.id !== id)
    delete qrMap[id]
    delete verdicts[id]
  }

  function update(eleve: Eleve) {
    const index = eleves.value.findIndex(e => e.id === eleve.id)
    if (index !== -1) {
      eleves.value[index] = eleve
    }
  }

  function getById(id: number): Eleve | undefined {
    return eleves.value.find(e => e.id === id)
  }

  function byGrade(grade: Grade): Eleve[] {
    return eleves.value.filter(e => e.grade === grade)
  }

  async function clear() {
    eleves.value = []
    Object.keys(qrMap).forEach(k => delete qrMap[Number(k)])
    Object.keys(verdicts).forEach(k => delete verdicts[Number(k)])
    const db = await getDB()
    await db.delete('session', DB_KEY)
  }

  return {
    eleves,
    qrMap,
    verdicts,
    nextId,
    loaded,
    add,
    setQR,
    cycleVerdict,
    remove,
    update,
    getById,
    byGrade,
    clear,
    loadFromDB,
  }
})
