<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/"></ion-back-button>
        </ion-buttons>
        <ion-title>{{ t('results.title') }}</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="exportPdf">
            <ion-icon slot="icon-only" :icon="downloadOutline" />
          </ion-button>
          <ion-button @click="showFilters = !showFilters">
            <ion-icon slot="icon-only" :icon="menuOutline" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>

      <!-- Grade filter chips -->
      <div v-if="showFilters" class="filter-bar">
        <button
          v-for="grade in GRADE_ORDER"
          :key="grade"
          class="filter-chip"
          :class="{ active: selectedGrades.includes(grade) }"
          @click="toggleGrade(grade)"
        >
          {{ t(`grades.${grade}`) }}
        </button>
        <button v-if="selectedGrades.length > 0" class="filter-chip clear" @click="selectedGrades = []">✕</button>
      </div>
    </ion-header>

    <ion-content :scroll-y="false">
      <div v-if="filteredStudents.length === 0" class="empty-state">
        <p>{{ t('results.noData') }}</p>
      </div>
      <div v-else class="table-wrapper">
        <table class="results-table">
          <thead>
            <tr>
              <th class="col-prenom">{{ t('eleve.prenom') }}</th>
              <th class="col-nom">{{ t('eleve.nom') }}</th>
              <th class="col-age">{{ t('eleve.anneeNaissance') }}</th>
              <th class="col-grade">{{ t('eleve.grade') }}</th>
              <th v-for="ep in configStore.epreuves" :key="ep.id" class="col-epreuve">
                {{ configStore.getEpreuveLabel(ep.id) }}
              </th>
              <th class="col-verdict">{{ t('results.verdict') }}</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="(eleve, idx) in filteredStudents" :key="eleve.id">
              <tr :class="{ alt: idx % 2 === 0 }">
                <td class="col-prenom">{{ eleve.prenom }}</td>
                <td class="col-nom">{{ eleve.nom }}</td>
                <td class="col-age">{{ eleve.anneeNaissance }}</td>
                <td class="col-grade">{{ t(`grades.${eleve.grade}`) }}</td>
                <td v-for="ep in configStore.epreuves" :key="ep.id" class="col-epreuve">
                  <span v-if="getPlus(eleve.id, ep.id) > 0" class="plus">{{ getPlus(eleve.id, ep.id) }}+</span>
                  <span v-if="getMoins(eleve.id, ep.id) > 0" class="moins">{{ getMoins(eleve.id, ep.id) }}-</span>
                </td>
                <td class="col-verdict" @click="studentsStore.cycleVerdict(eleve.id)">
                  <span
                    class="verdict-box"
                    :class="studentsStore.verdicts[eleve.id] ?? 'pending'"
                  >
                    <template v-if="studentsStore.verdicts[eleve.id] === 'passed'">✓</template>
                    <template v-else-if="studentsStore.verdicts[eleve.id] === 'failed'">✗</template>
                  </span>
                </td>
              </tr>
              <!-- Jury sub-rows -->
              <tr
                v-for="jury in getJuriesForEleve(eleve.id)"
                :key="'jury-' + jury + '-' + eleve.id"
                class="jury-row"
                :class="{ alt: idx % 2 === 0 }"
              >
                <td class="col-prenom jury-name" :colspan="4">{{ jury }}</td>
                <td v-for="ep in configStore.epreuves" :key="ep.id" class="col-epreuve jury-cell">
                  <span v-if="getJuryPlus(jury, eleve.id, ep.id) > 0" class="plus">{{ getJuryPlus(jury, eleve.id, ep.id) }}+</span>
                  <span v-if="getJuryMoins(jury, eleve.id, ep.id) > 0" class="moins">{{ getJuryMoins(jury, eleve.id, ep.id) }}-</span>
                </td>
                <td class="col-verdict jury-cell">
                  <span v-if="getJuryVerdict(jury, eleve.id) === true" class="jury-verdict passed">✓</span>
                  <span v-else-if="getJuryVerdict(jury, eleve.id) === false" class="jury-verdict failed">✗</span>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonButtons, IonBackButton, IonButton, IonIcon,
} from '@ionic/vue'
import { downloadOutline, menuOutline } from 'ionicons/icons'
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useStudentsStore } from '@/stores/students'
import { useNotesStore } from '@/stores/notes'
import { useConfigStore } from '@/stores/config'
import { exportResultsPdf } from '@/utils/exportPdf'
import type { Grade } from '@/types'
import { GRADE_ORDER } from '@/types'

const { t } = useI18n()
const studentsStore = useStudentsStore()
const notesStore = useNotesStore()
const configStore = useConfigStore()

const selectedGrades = ref<Grade[]>([])
const showFilters = ref(false)

function toggleGrade(grade: Grade) {
  const idx = selectedGrades.value.indexOf(grade)
  if (idx === -1) {
    selectedGrades.value.push(grade)
  } else {
    selectedGrades.value.splice(idx, 1)
  }
}

const sortedStudents = computed(() => {
  return [...studentsStore.eleves].sort((a, b) => {
    const ga = GRADE_ORDER.indexOf(a.grade)
    const gb = GRADE_ORDER.indexOf(b.grade)
    if (ga !== gb) return ga - gb
    const prenomCmp = a.prenom.localeCompare(b.prenom)
    if (prenomCmp !== 0) return prenomCmp
    return a.nom.localeCompare(b.nom)
  })
})

const filteredStudents = computed(() => {
  if (selectedGrades.value.length === 0) return sortedStudents.value
  return sortedStudents.value.filter(e => selectedGrades.value.includes(e.grade))
})

function getPlus(eleveId: number, epreuveId: number): number {
  const notes = notesStore.getForEleveEpreuve(eleveId, epreuveId)
  return notes.reduce((sum, n) => sum + n.plus, 0)
}

function getMoins(eleveId: number, epreuveId: number): number {
  const notes = notesStore.getForEleveEpreuve(eleveId, epreuveId)
  return notes.reduce((sum, n) => sum + n.moins, 0)
}

// Get distinct jury names that have notes or verdicts for a given student
function getJuriesForEleve(eleveId: number): string[] {
  const names = new Set<string>()
  for (const n of notesStore.notes) {
    if (n.eleveId === eleveId && (n.plus > 0 || n.moins > 0)) names.add(n.jury)
  }
  for (const v of notesStore.juryVerdicts) {
    if (v.eleveId === eleveId) names.add(v.jury)
  }
  return [...names]
}

function getJuryPlus(jury: string, eleveId: number, epreuveId: number): number {
  const note = notesStore.notes.find(
    n => n.jury === jury && n.eleveId === eleveId && n.epreuveId === epreuveId,
  )
  return note ? note.plus : 0
}

function getJuryMoins(jury: string, eleveId: number, epreuveId: number): number {
  const note = notesStore.notes.find(
    n => n.jury === jury && n.eleveId === eleveId && n.epreuveId === epreuveId,
  )
  return note ? note.moins : 0
}

function getJuryVerdict(jury: string, eleveId: number): boolean | null {
  const v = notesStore.juryVerdicts.find(
    jv => jv.jury === jury && jv.eleveId === eleveId,
  )
  return v ? v.valide : null
}

function exportPdf() {
  exportResultsPdf({
    eleves: filteredStudents.value,
    epreuves: configStore.epreuves,
    notes: notesStore.notes,
    verdicts: studentsStore.verdicts,
    juryVerdicts: notesStore.juryVerdicts,
    getEpreuveLabel: (id: number) => configStore.getEpreuveLabel(id, 'fr'),
    getGradeLabel: (grade: string) => t(`grades.${grade}`, {}, { locale: 'fr' }),
    verdictLabel: 'Validé',
  })
}
</script>

<style scoped>
.filter-bar {
  display: flex;
  gap: 4px;
  padding: 6px 12px;
  overflow-x: auto;
  background: var(--ion-color-light, #f4f4f4);
  border-bottom: 1px solid var(--ion-color-medium, #ccc);
}

.filter-chip {
  flex-shrink: 0;
  padding: 4px 10px;
  border-radius: 12px;
  border: 1px solid var(--ion-color-medium, #999);
  background: transparent;
  font-size: 0.75rem;
  color: var(--ion-text-color);
  cursor: pointer;
}

.filter-chip.active {
  background: var(--ion-color-primary, #3880ff);
  color: #fff;
  border-color: var(--ion-color-primary, #3880ff);
}

.filter-chip.clear {
  border-color: var(--ion-color-danger, #e04055);
  color: var(--ion-color-danger, #e04055);
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: var(--ion-color-medium);
}

.table-wrapper {
  overflow: auto;
  height: 100%;
  padding: 0;
}

.results-table {
  border-collapse: separate;
  border-spacing: 0;
  font-size: 0.8rem;
  white-space: nowrap;
  min-width: 100%;
}

.results-table thead {
  background: #3c3c3c;
  color: #fff;
}

.results-table th {
  padding: 6px 8px;
  text-align: center;
  font-size: 0.7rem;
  font-weight: 600;
  white-space: nowrap;
  position: sticky;
  top: 0;
  z-index: 2;
  background: #3c3c3c;
}

.results-table td {
  padding: 5px 8px;
  white-space: nowrap;
}

.results-table tbody tr.alt td {
  background: #f0f0f0;
}

.results-table tbody tr:not(.alt) td {
  background: #fff;
}

.col-prenom {
  text-align: left;
  position: sticky;
  left: 0;
  z-index: 1;
}

thead .col-prenom {
  z-index: 3;
  background: #3c3c3c;
}

.col-nom {
  text-align: left;
}

.col-age {
  text-align: center;
}

.col-grade {
  text-align: left;
  border-left: 1px solid #ccc;
  border-right: 1px solid #ccc;
}

.col-epreuve {
  text-align: center;
  border-right: 1px solid #ccc;
}

.plus {
  font-weight: 700;
  margin-right: 6px;
}

.moins {
  font-weight: 400;
  color: var(--ion-color-medium);
}

.col-verdict {
  text-align: center;
  cursor: pointer;
  user-select: none;
  position: sticky;
  right: 0;
  z-index: 1;
  border-left: 1px solid #ccc;
}

thead .col-verdict {
  z-index: 3;
  background: #3c3c3c;
}

.verdict-box {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 4px;
  border: 2px solid #ccc;
  background: #fff;
  font-size: 1.1rem;
  font-weight: 700;
  line-height: 1;
  vertical-align: middle;
  box-sizing: border-box;
}

.verdict-box.passed {
  background: #4caf50;
  border-color: #388e3c;
  color: #fff;
}

.verdict-box.failed {
  background: #e04055;
  border-color: #c62828;
  color: #fff;
}

/* Jury sub-rows */
.jury-row td {
  font-size: 0.7rem;
  padding: 2px 8px;
  color: var(--ion-color-medium);
}

.jury-name {
  padding-left: 16px;
  font-style: italic;
}

.jury-cell .plus {
  font-weight: 600;
  font-size: 0.65rem;
}

.jury-cell .moins {
  font-size: 0.65rem;
}

.jury-verdict {
  font-size: 0.85rem;
  font-weight: 700;
}

.jury-verdict.passed {
  color: #4caf50;
}

.jury-verdict.failed {
  color: #e04055;
}
</style>
