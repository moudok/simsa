import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Role, Grade, Genre } from '@/types'

export const useUiStore = defineStore('ui', () => {
  const role = ref<Role | null>(null)
  const selectedGrades = ref<Grade[]>([])
  const selectedGenres = ref<Genre[]>([])

  function setRole(r: Role) {
    role.value = r
  }

  function toggleGradeFilter(grade: Grade) {
    const idx = selectedGrades.value.indexOf(grade)
    if (idx === -1) {
      selectedGrades.value.push(grade)
    } else {
      selectedGrades.value.splice(idx, 1)
    }
  }

  function toggleGenreFilter(genre: Genre) {
    const idx = selectedGenres.value.indexOf(genre)
    if (idx === -1) {
      selectedGenres.value.push(genre)
    } else {
      selectedGenres.value.splice(idx, 1)
    }
  }

  function clearFilters() {
    selectedGrades.value = []
    selectedGenres.value = []
  }

  function reset() {
    role.value = null
    clearFilters()
  }

  return {
    role,
    selectedGrades,
    selectedGenres,
    setRole,
    toggleGradeFilter,
    toggleGenreFilter,
    clearFilters,
    reset,
  }
})
