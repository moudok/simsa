import { defineStore } from 'pinia'
import { ref, watch, toRaw } from 'vue'
import type { Note, JuryVerdict } from '@/types'
import { getDB } from '@/utils/db'

const DB_KEY = 'notes'

export const useNotesStore = defineStore('notes', () => {
  const notes = ref<Note[]>([])
  const juryVerdicts = ref<JuryVerdict[]>([])

  const loaded = ref(false)

  async function loadFromDB() {
    const db = await getDB()
    const saved = await db.get('session', DB_KEY) as Record<string, unknown> | undefined
    if (saved) {
      if (Array.isArray(saved)) {
        // Legacy format: just notes array
        notes.value = saved as Note[]
      } else {
        notes.value = (saved.notes as Note[]) ?? []
        juryVerdicts.value = (saved.juryVerdicts as JuryVerdict[]) ?? []
      }
    }
    loaded.value = true
  }

  async function saveToDB() {
    const db = await getDB()
    await db.put('session', JSON.parse(JSON.stringify({
      notes: toRaw(notes.value),
      juryVerdicts: toRaw(juryVerdicts.value),
    })), DB_KEY)
  }

  watch(
    [notes, juryVerdicts],
    () => { if (loaded.value) saveToDB() },
    { deep: true },
  )

  function getForEleve(eleveId: number): Note[] {
    return notes.value.filter(n => n.eleveId === eleveId)
  }

  function getForEpreuve(epreuveId: number): Note[] {
    return notes.value.filter(n => n.epreuveId === epreuveId)
  }

  function getForEleveEpreuve(eleveId: number, epreuveId: number): Note[] {
    return notes.value.filter(n => n.eleveId === eleveId && n.epreuveId === epreuveId)
  }

  // Find or create the note for a given jury/eleve/epreuve combination
  function findOrCreate(jury: string, eleveId: number, epreuveId: number): Note {
    let note = notes.value.find(
      n => n.jury === jury && n.eleveId === eleveId && n.epreuveId === epreuveId,
    )
    if (!note) {
      note = { jury, eleveId, epreuveId, plus: 0, moins: 0 }
      notes.value.push(note)
    }
    return note
  }

  function incrementPlus(jury: string, eleveId: number, epreuveId: number) {
    findOrCreate(jury, eleveId, epreuveId).plus++
  }

  function incrementMoins(jury: string, eleveId: number, epreuveId: number) {
    findOrCreate(jury, eleveId, epreuveId).moins++
  }

  function decrementPlus(jury: string, eleveId: number, epreuveId: number) {
    const note = findOrCreate(jury, eleveId, epreuveId)
    if (note.plus > 0) note.plus--
  }

  function decrementMoins(jury: string, eleveId: number, epreuveId: number) {
    const note = findOrCreate(jury, eleveId, epreuveId)
    if (note.moins > 0) note.moins--
  }

  // Merge incoming notes (from QR scan) into the store
  function mergeNotes(incoming: Note[]) {
    for (const note of incoming) {
      const existing = notes.value.find(
        n => n.jury === note.jury && n.eleveId === note.eleveId && n.epreuveId === note.epreuveId,
      )
      if (existing) {
        existing.plus = note.plus
        existing.moins = note.moins
      } else {
        notes.value.push({ ...note })
      }
    }
  }

  // Merge incoming jury verdicts
  function mergeJuryVerdicts(incoming: JuryVerdict[]) {
    for (const v of incoming) {
      const existing = juryVerdicts.value.find(
        jv => jv.jury === v.jury && jv.eleveId === v.eleveId,
      )
      if (existing) {
        existing.valide = v.valide
      } else {
        juryVerdicts.value.push({ ...v })
      }
    }
  }

  // Get jury verdicts for a specific student
  function getJuryVerdictsForEleve(eleveId: number): JuryVerdict[] {
    return juryVerdicts.value.filter(jv => jv.eleveId === eleveId)
  }

  // Get all distinct jury names that have notes or verdicts
  function getJuryNames(): string[] {
    const names = new Set<string>()
    for (const n of notes.value) names.add(n.jury)
    for (const v of juryVerdicts.value) names.add(v.jury)
    return [...names]
  }

  async function clear() {
    notes.value = []
    juryVerdicts.value = []
    const db = await getDB()
    await db.delete('session', DB_KEY)
  }

  return {
    notes,
    juryVerdicts,
    loaded,
    getForEleve,
    getForEpreuve,
    getForEleveEpreuve,
    incrementPlus,
    incrementMoins,
    decrementPlus,
    decrementMoins,
    mergeNotes,
    mergeJuryVerdicts,
    getJuryVerdictsForEleve,
    getJuryNames,
    clear,
    loadFromDB,
  }
})
