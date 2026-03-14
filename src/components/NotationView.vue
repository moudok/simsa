<template>
  <div
    class="notation-view"
    @touchstart="onTouchStart"
    @touchend="onTouchEnd"
  >
    <!-- Hamburger menu panel -->
    <div v-if="showMenu" class="menu-panel">
      <div class="menu-section">
        <strong>{{ t('notation.filters') }}</strong>
        <div class="filter-row">
          <button
            v-for="grade in GRADE_ORDER"
            :key="grade"
            class="filter-chip"
            :class="{ active: uiStore.selectedGrades.includes(grade) }"
            @click="uiStore.toggleGradeFilter(grade)"
          >
            {{ t(`grades.${grade}`) }}
          </button>
        </div>
        <div class="filter-row">
          <button
            v-for="genre in GENRES"
            :key="genre"
            class="filter-chip"
            :class="{ active: uiStore.selectedGenres.includes(genre) }"
            @click="uiStore.toggleGenreFilter(genre)"
          >
            {{ t(`genres.${genre}_short`, t(`genres.${genre}`)) }}
          </button>
          <button class="filter-chip clear" @click="uiStore.clearFilters()">✕</button>
        </div>
      </div>

      <div class="menu-section per-row-section">
        <label>{{ t('notation.perRow') }}</label>
        <button class="per-row-btn" @click="changePerRow(-1)">−</button>
        <span class="per-row-value">{{ perRow }}</span>
        <button class="per-row-btn" @click="changePerRow(1)">+</button>
      </div>
    </div>

    <!-- No students message -->
    <p v-if="filteredStudents.length === 0" class="no-students">
      {{ t('session.noStudents') }}
    </p>

    <!-- Student grid -->
    <div v-else class="student-grid" :style="{ gridTemplateColumns: `repeat(${perRow}, 1fr)` }">
      <div
        v-for="(eleve, index) in filteredStudents"
        :key="eleve.id"
        class="student-card"
        :class="{ hidden: !visibleIds.has(eleve.id), 'pair-start': isPairStart(eleve.id, index) }"
        :style="cardStyle(eleve.grade)"
        @click="toggleVisibility(eleve.id)"
      >
        <div class="card-header">
          <span class="card-meta meta-left">{{ genreSymbol(eleve.genre) }}</span>
          <div class="student-names">
            <span class="student-name">{{ eleve.prenom }}</span>
            <span class="student-lastname">{{ eleve.nom }}</span>
          </div>
          <span class="card-meta meta-right">'{{ String(eleve.anneeNaissance).slice(-2) }}</span>
        </div>
        <div v-if="visibleIds.has(eleve.id) && eventsStore.currentEpreuveId !== null" class="card-notes" @click.stop>
          <button
            class="note-btn plus-btn"
            @click="handleTap(`plus-${eleve.id}`, () => incPlus(eleve.id), () => decPlus(eleve.id))"
          >
            <span class="note-label">+</span>
            <span class="note-count">{{ getNote(eleve.id).plus }}</span>
          </button>
          <button
            class="note-btn moins-btn"
            @click="handleTap(`moins-${eleve.id}`, () => incMoins(eleve.id), () => decMoins(eleve.id))"
          >
            <span class="note-label">−</span>
            <span class="note-count">{{ getNote(eleve.id).moins }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useStudentsStore } from '@/stores/students'
import { useNotesStore } from '@/stores/notes'
import { useEventsStore } from '@/stores/events'
import { useConfigStore } from '@/stores/config'
import { useUiStore } from '@/stores/ui'
import { GRADE_ORDER } from '@/types'
import type { Eleve, Genre, Grade } from '@/types'

const props = defineProps<{ juryName: string }>()

const { t } = useI18n()
const studentsStore = useStudentsStore()
const notesStore = useNotesStore()
const eventsStore = useEventsStore()
const configStore = useConfigStore()
const uiStore = useUiStore()

const GENRES: Genre[] = ['homme', 'femme', 'autre', 'non_renseigne']

function genreSymbol(genre: Genre): string {
  if (genre === 'homme') return '♂'
  if (genre === 'femme') return '♀'
  return ''
}

const showMenu = ref(false)
const perRow = ref(configStore.elevesParLigne)

function changePerRow(delta: number) {
  const next = perRow.value + delta
  if (next >= 1) perRow.value = next
}

// Initialize to first epreuve if none selected
if (eventsStore.currentEpreuveId === null && eventsStore.epreuves.length > 0) {
  eventsStore.selectEpreuve(eventsStore.epreuves[0].id)
}

const currentEpreuveLabel = computed(() => {
  if (!eventsStore.currentEpreuve) return ''
  return configStore.getEpreuveLabel(eventsStore.currentEpreuve.id)
})

const canGoPrev = computed(() => {
  if (eventsStore.currentEpreuveId === null) return false
  const idx = eventsStore.epreuves.findIndex(e => e.id === eventsStore.currentEpreuveId)
  return idx > 0
})

const canGoNext = computed(() => {
  if (eventsStore.currentEpreuveId === null) return false
  const idx = eventsStore.epreuves.findIndex(e => e.id === eventsStore.currentEpreuveId)
  return idx < eventsStore.epreuves.length - 1
})

// Detect explicit (reciprocal) pairs across all students
const pairMap = computed(() => {
  const map = new Map<number, number>()
  const all = studentsStore.eleves
  for (const a of all) {
    if (map.has(a.id) || !a.binomePrenom) continue
    const b = all.find(s =>
      s.id !== a.id && !map.has(s.id) &&
      a.binomePrenom!.trim().toLowerCase() === s.prenom.trim().toLowerCase() &&
      a.binomeNom?.trim().toLowerCase() === s.nom.trim().toLowerCase() &&
      s.binomePrenom?.trim().toLowerCase() === a.prenom.trim().toLowerCase() &&
      s.binomeNom?.trim().toLowerCase() === a.nom.trim().toLowerCase(),
    )
    if (b) {
      map.set(a.id, b.id)
      map.set(b.id, a.id)
    }
  }
  return map
})

// Sort students by grade, pairs at even positions within each grade
const filteredStudents = computed(() => {
  const byGrade = [...studentsStore.eleves].sort((a, b) => {
    return GRADE_ORDER.indexOf(b.grade) - GRADE_ORDER.indexOf(a.grade)
  })

  // Group by grade
  const groups = new Map<Grade, Eleve[]>()
  for (const s of byGrade) {
    const arr = groups.get(s.grade) ?? []
    arr.push(s)
    groups.set(s.grade, arr)
  }

  const result: Eleve[] = []

  for (const grade of [...GRADE_ORDER].reverse()) {
    const students = groups.get(grade)
    if (!students || students.length === 0) continue

    // Apply filters
    let filtered = students
    if (uiStore.selectedGrades.length > 0 && !uiStore.selectedGrades.includes(grade)) continue
    if (uiStore.selectedGenres.length > 0) {
      filtered = filtered.filter(e => uiStore.selectedGenres.includes(e.genre))
    }
    if (filtered.length === 0) continue

    // 1. Explicit pairs (reciprocal requests)
    const placed = new Set<number>()
    const explicitPairs: [Eleve, Eleve][] = []

    for (const s of filtered) {
      if (placed.has(s.id)) continue
      const partnerId = pairMap.value.get(s.id)
      if (partnerId != null && !placed.has(partnerId)) {
        const partner = filtered.find(e => e.id === partnerId)
        if (partner) {
          explicitPairs.push(s.anneeNaissance <= partner.anneeNaissance ? [s, partner] : [partner, s])
          placed.add(s.id)
          placed.add(partnerId)
        }
      }
    }

    // 2. Implicit pairs by same genre from remaining students
    const remaining = filtered.filter(e => !placed.has(e.id)).sort((a, b) => a.anneeNaissance - b.anneeNaissance)
    const implicitPairs: [Eleve, Eleve][] = []
    const implicitPlaced = new Set<number>()

    for (const s of remaining) {
      if (implicitPlaced.has(s.id)) continue
      const partner = remaining.find(
        r => r.id !== s.id && !implicitPlaced.has(r.id) && r.genre === s.genre,
      )
      if (partner) {
        implicitPairs.push(s.anneeNaissance <= partner.anneeNaissance ? [s, partner] : [partner, s])
        implicitPlaced.add(s.id)
        implicitPlaced.add(partner.id)
      }
    }

    // 3. Remaining solos
    const solos = remaining.filter(e => !implicitPlaced.has(e.id))

    // Sort all pair groups by max age descending
    const pairSortKey = (p: [Eleve, Eleve]) => Math.min(p[0].anneeNaissance, p[1].anneeNaissance)
    explicitPairs.sort((a, b) => pairSortKey(a) - pairSortKey(b))
    implicitPairs.sort((a, b) => pairSortKey(a) - pairSortKey(b))

    for (const [a, b] of explicitPairs) result.push(a, b)
    for (const [a, b] of implicitPairs) result.push(a, b)
    for (const s of solos) result.push(s)
  }

  return result
})

// Track where each grade starts in filteredStudents for pair alignment
const gradeStartIndex = computed(() => {
  const map = new Map<number, number>()
  const list = filteredStudents.value
  let lastGrade: Grade | null = null
  for (let i = 0; i < list.length; i++) {
    if (list[i].grade !== lastGrade) {
      lastGrade = list[i].grade
      map.set(i, i)
    }
    map.set(i, map.get(i) ?? i)
  }
  // Build: for each index, store the start index of its grade group
  const result = new Map<number, number>()
  lastGrade = null
  let start = 0
  for (let i = 0; i < list.length; i++) {
    if (list[i].grade !== lastGrade) {
      lastGrade = list[i].grade
      start = i
    }
    result.set(i, start)
  }
  return result
})

// Check if a card should show a pair-link line to the right
function isPairStart(eleveId: number, index: number): boolean {
  const partnerId = pairMap.value.get(eleveId)
  if (partnerId == null) return false
  const next = filteredStudents.value[index + 1]
  if (!next || next.id !== partnerId) return false
  // Position within the grade group must be even (0, 2, 4...)
  const gradeStart = gradeStartIndex.value.get(index) ?? 0
  const posInGrade = index - gradeStart
  if (posInGrade % 2 !== 0) return false
  // Must be on the same grid row
  return (index % perRow.value) !== (perRow.value - 1)
}

// Visibility (half-group checkboxes)
const visibleIds = ref(new Set<number>())

// Initialize all visible
watch(filteredStudents, (students) => {
  visibleIds.value = new Set(students.map(e => e.id))
}, { immediate: true })

function toggleVisibility(id: number) {
  if (visibleIds.value.has(id)) {
    visibleIds.value.delete(id)
  } else {
    visibleIds.value.add(id)
  }
}

// Single/double tap detection
const tapTimers: Record<string, ReturnType<typeof setTimeout>> = {}
const tapCounts: Record<string, number> = {}
const TAP_DELAY = 250

function handleTap(key: string, onSingle: () => void, onDouble: () => void) {
  tapCounts[key] = (tapCounts[key] ?? 0) + 1
  if (tapCounts[key] === 1) {
    tapTimers[key] = setTimeout(() => {
      if (tapCounts[key] === 1) onSingle()
      tapCounts[key] = 0
    }, TAP_DELAY)
  } else if (tapCounts[key] >= 2) {
    clearTimeout(tapTimers[key])
    tapCounts[key] = 0
    onDouble()
  }
}

// Grade border colors and styles
const GRADE_COLORS: Record<Grade, string | null> = {
  'blanc': null,
  'jaune': '#ffcc00', 'jaune+': '#ffcc00',
  'vert': '#44aa00', 'vert+': '#44aa00',
  'bleu': '#0044aa', 'bleu+': '#0044aa',
  'rouge': '#d40000', 'rouge+': '#d40000', 'rouge++': '#d40000',
  'noir': '#000000',
}

function gradeBorderStyle(grade: Grade): Record<string, string> {
  const color = GRADE_COLORS[grade]
  if (!color) return {}

  const noBorder = { borderColor: 'transparent' }

  const bg = 'var(--ion-background-color, #fff)'
  const bw = 1.5 // border width
  const gw = 1   // gap width
  let level = 1
  if (grade.endsWith('++')) level = 3
  else if (grade.endsWith('+')) level = 2

  const shadows: string[] = []
  let offset = 0
  for (let i = 0; i < level; i++) {
    if (i > 0) {
      offset += gw
      shadows.push(`inset 0 0 0 ${offset}px ${bg}`)
    }
    offset += bw
    shadows.push(`inset 0 0 0 ${offset}px ${color}`)
  }

  return {
    ...noBorder,
    boxShadow: shadows.join(', '),
    padding: `${offset + 2}px`,
    '--pair-color': color,
  }
}

function cardStyle(grade: Grade): Record<string, string> {
  const base = gradeBorderStyle(grade)
  if (!base['--pair-color']) {
    base['--pair-color'] = 'var(--ion-color-light-shade, #d7d8da)'
  }
  return base
}

// Note helpers
function getNote(eleveId: number) {
  const epreuveId = eventsStore.currentEpreuveId
  if (epreuveId === null) return { plus: 0, moins: 0 }
  const found = notesStore.notes.find(
    n => n.jury === props.juryName && n.eleveId === eleveId && n.epreuveId === epreuveId,
  )
  return found ?? { plus: 0, moins: 0 }
}

function incPlus(eleveId: number) {
  if (eventsStore.currentEpreuveId !== null)
    notesStore.incrementPlus(props.juryName, eleveId, eventsStore.currentEpreuveId)
}
function decPlus(eleveId: number) {
  if (eventsStore.currentEpreuveId !== null)
    notesStore.decrementPlus(props.juryName, eleveId, eventsStore.currentEpreuveId)
}
function incMoins(eleveId: number) {
  if (eventsStore.currentEpreuveId !== null)
    notesStore.incrementMoins(props.juryName, eleveId, eventsStore.currentEpreuveId)
}
function decMoins(eleveId: number) {
  if (eventsStore.currentEpreuveId !== null)
    notesStore.decrementMoins(props.juryName, eleveId, eventsStore.currentEpreuveId)
}

// Swipe between epreuves
let touchStartX = 0
let touchStartY = 0

function onTouchStart(e: TouchEvent) {
  touchStartX = e.touches[0].clientX
  touchStartY = e.touches[0].clientY
}

function onTouchEnd(e: TouchEvent) {
  const dx = e.changedTouches[0].clientX - touchStartX
  const dy = e.changedTouches[0].clientY - touchStartY
  if (Math.abs(dx) < 60 || Math.abs(dy) > Math.abs(dx)) return
  if (dx < 0 && canGoNext.value) eventsStore.nextEpreuve()
  else if (dx > 0 && canGoPrev.value) eventsStore.previousEpreuve()
}

function toggleMenu() {
  showMenu.value = !showMenu.value
}

defineExpose({ currentEpreuveLabel, canGoPrev, canGoNext, toggleMenu })
</script>

<style scoped>
.notation-view {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

/* Menu panel */
.menu-panel {
  background: var(--ion-color-light, #f4f4f4);
  border-radius: 8px;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.menu-section {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.per-row-section {
  flex-direction: row;
  align-items: center;
  gap: 8px;
}

.per-row-btn {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: 1px solid var(--ion-color-medium, #999);
  background: transparent;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  color: var(--ion-text-color);
}

.per-row-value {
  font-weight: 700;
  font-size: 1rem;
  min-width: 20px;
  text-align: center;
}

.filter-row {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.filter-chip {
  padding: 2px 8px;
  border-radius: 12px;
  border: 1px solid var(--ion-color-medium, #999);
  background: transparent;
  color: var(--ion-color-medium, #999);
  font-size: 0.75rem;
  cursor: pointer;
}

.filter-chip.active {
  background: var(--ion-color-primary, #3880ff);
  color: #fff;
  border-color: var(--ion-color-primary, #3880ff);
}

.filter-chip.clear {
  border-color: var(--ion-color-danger, #eb445a);
  color: var(--ion-color-danger, #eb445a);
}

.no-students {
  text-align: center;
  color: var(--ion-color-medium);
  margin-top: 2rem;
}

/* Student grid */
.student-grid {
  display: grid;
  gap: 4px;
}

.student-card {
  position: relative;
  border: 1px solid var(--ion-color-light-shade, #ddd);
  border-radius: 6px;
  padding: 4px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  cursor: pointer;
  user-select: none;
  -webkit-user-select: none;
}

.student-card.pair-start::after {
  content: '';
  position: absolute;
  right: -5px;
  top: 30%;
  bottom: 30%;
  width: 4px;
  background: var(--pair-color, var(--ion-color-light-shade, #d7d8da));
  border-radius: 0;
  z-index: -1;
}

.student-card.hidden {
  opacity: 0.3;
}

.card-header {
  position: relative;
  display: flex;
  align-items: center;
  gap: 4px;
  width: 100%;
  justify-content: center;
}

.card-meta {
  position: absolute;
  top: -2px;
  font-size: 0.6rem;
  color: var(--ion-color-medium, #999);
  z-index: 1;
}

.meta-left {
  left: 0;
}

.meta-right {
  right: 0;
}

.student-names {
  display: flex;
  align-items: baseline;
  gap: 3px;
  min-width: 0;
  overflow: hidden;
}

.student-name {
  font-weight: 600;
  font-size: 0.8rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.student-lastname {
  font-weight: 400;
  font-size: 0.65rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--ion-color-medium);
}

/* Notation controls */
.card-notes {
  display: flex;
  gap: 20px;
  margin-top: 2px;
}

.note-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 36px;
  min-height: 36px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
  padding: 2px 6px;
  gap: 0;
}

.plus-btn {
  background: var(--ion-color-success, #2dd36f);
  color: #fff;
}

.moins-btn {
  background: var(--ion-color-danger, #eb445a);
  color: #fff;
}

.note-label {
  font-size: 0.7rem;
  font-weight: 700;
  line-height: 1;
}

.note-count {
  font-size: 1rem;
  font-weight: 700;
  line-height: 1;
}

/* Portrait: compact cards, names on two lines */
@media (orientation: portrait) {
  .student-grid {
    gap: 2px;
  }

  .student-card {
    gap: 0;
    min-width: 0;
  }

  .student-card.pair-start::after {
    right: -3px;
    width: 2px;
  }

  .card-header {
    flex-direction: column;
    gap: 0;
  }

  .student-names {
    flex-direction: column;
    align-items: center;
    gap: 0;
  }

  .card-meta {
    font-size: 0.5rem;
  }

  .student-name {
    font-size: 0.6rem;
  }

  .student-lastname {
    font-size: 0.5rem;
  }

  .note-btn {
    min-width: 24px;
    min-height: 24px;
    padding: 1px 3px;
    border-radius: 4px;
  }

  .note-label {
    font-size: 0.55rem;
  }

  .note-count {
    font-size: 0.7rem;
  }

  .card-notes {
    gap: 10px;
    margin-top: 1px;
  }
}
</style>
