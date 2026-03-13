<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/" :text="t('common.back')"></ion-back-button>
        </ion-buttons>
        <ion-title>{{ t('config.title') }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">

      <!-- Epreuves (spreadsheet) -->
      <ion-list-header class="section-header">
        <ion-label>{{ t('config.epreuves') }}</ion-label>
      </ion-list-header>

      <div class="epreuve-table-wrapper">
        <table class="epreuve-table">
          <thead>
            <tr>
              <th class="col-drag"></th>
              <th v-for="langue in configStore.langues" :key="langue.code">{{ langue.label }}</th>
              <th class="col-actions"></th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(epreuve, idx) in configStore.epreuves"
              :key="epreuve.id"
              :class="{ 'drag-over': dragOverIdx === idx }"
              @dragover.prevent="onDragOver(idx)"
            >
              <td
                class="col-drag"
                draggable="true"
                @dragstart="onDragStart(idx, $event)"
                @dragover.prevent="onDragOver(idx)"
                @dragend="onDragEnd"
              >⣿</td>
              <td v-for="langue in configStore.langues" :key="langue.code" class="cell-autocomplete">
                <input
                  type="text"
                  class="epreuve-input"
                  :value="epreuve.labels[langue.code] ?? ''"
                  @input="onEpreuveNativeInput(epreuve.id, langue.code, $event)"
                  @focus="onInputFocus(epreuve.id, langue.code, epreuve.labels[langue.code] ?? '')"
                  @blur="onInputBlur"
                  :placeholder="langue.label"
                  autocomplete="off"
                />
                <ul
                  v-if="acEpreuveId === epreuve.id && acLangue === langue.code && acSuggestions.length > 0"
                  class="autocomplete-list"
                >
                  <li
                    v-for="(s, si) in acSuggestions"
                    :key="si"
                    @mousedown.prevent="selectSuggestion(epreuve.id, s)"
                  >
                    <span class="ac-latin">{{ s.latin }}</span>
                    <span class="ac-hangul">{{ s.hangul }}</span>
                  </li>
                </ul>
              </td>
              <td class="col-actions">
                <button class="icon-btn" @click="duplicateEpreuve(epreuve.id)">
                  <ion-icon :icon="copyOutline" />
                </button>
                <button class="icon-btn" @click="configStore.removeEpreuve(epreuve.id)">
                  <ion-icon :icon="trashOutline" color="danger" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <ion-button expand="block" fill="outline" size="small" @click="addEpreuve">
        {{ t('config.addEpreuve') }}
      </ion-button>

      <!-- Countdown durations -->
      <ion-list-header class="section-header">
        <ion-label>{{ t('config.dureesChrono') }}</ion-label>
      </ion-list-header>
      <ion-list inset>
        <ion-item v-for="(duree, index) in configStore.dureesChrono" :key="index">
          <ion-label>{{ formatDuree(duree) }}</ion-label>
          <ion-button slot="end" fill="clear" color="danger" @click="configStore.removeDuree(index)">
            <ion-icon :icon="trashOutline" slot="icon-only" />
          </ion-button>
        </ion-item>
      </ion-list>

      <ion-button expand="block" fill="outline" size="small" @click="showAddDuree = true" v-if="!showAddDuree">
        {{ t('config.addDuree') }}
      </ion-button>
      <ion-card v-if="showAddDuree">
        <ion-card-content>
          <ion-item>
            <ion-input
              v-model.number="newDureeSeconds"
              :label="t('config.seconds')"
              label-placement="stacked"
              type="number"
              min="1"
              step="1"
              inputmode="numeric"
              placeholder="90"
            />
          </ion-item>
          <div class="form-buttons">
            <ion-button size="small" @click="addDuree" :disabled="!newDureeSeconds || newDureeSeconds <= 0">
              {{ t('common.confirm') }}
            </ion-button>
            <ion-button size="small" fill="outline" @click="showAddDuree = false">
              {{ t('common.cancel') }}
            </ion-button>
          </div>
        </ion-card-content>
      </ion-card>

      <!-- Students per row -->
      <ion-list-header class="section-header">
        <ion-label>{{ t('config.elevesParLigne') }}</ion-label>
      </ion-list-header>
      <ion-list inset>
        <ion-item>
          <ion-input
            type="number"
            min="1"
            step="1"
            inputmode="numeric"
            :value="configStore.elevesParLigne"
            @ionInput="onElevesParLigneInput($event)"
          />
        </ion-item>
      </ion-list>


      <!-- Delete all data -->
      <ion-list inset>
        <ion-item button detail @click="showDeleteAllModal = true">
          <ion-icon :icon="trashOutline" slot="start" />
          <ion-label>{{ t('config.deleteAll') }}</ion-label>
        </ion-item>
      </ion-list>

      <ion-modal :is-open="showDeleteAllModal" @didDismiss="showDeleteAllModal = false" class="slide-modal">
        <div class="modal-content">
          <p>{{ t('config.deleteAllHelp') }}</p>
          <SlideConfirm :label="t('common.confirmDelete')" @confirm="deleteAllData" />
        </div>
      </ion-modal>

      <div class="bottom-spacer"></div>

    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonButtons, IonBackButton, IonButton, IonIcon,
  IonList, IonListHeader, IonItem, IonLabel, IonInput, IonModal,
  toastController,
} from '@ionic/vue'
import { trashOutline, copyOutline } from 'ionicons/icons'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useConfigStore } from '@/stores/config'
import { useStudentsStore } from '@/stores/students'
import { useNotesStore } from '@/stores/notes'
import { useSessionStore } from '@/stores/session'
import type { Epreuve } from '@/types'
import SlideConfirm from '@/components/SlideConfirm.vue'
import { searchGlossary, type GlossaryEntry } from '@/utils/glossary'

const { t } = useI18n()
const configStore = useConfigStore()
const studentsStore = useStudentsStore()
const notesStore = useNotesStore()
const sessionStore = useSessionStore()
const showDeleteAllModal = ref(false)

// Drag & drop reordering
const dragIdx = ref<number | null>(null)
const dragOverIdx = ref<number | null>(null)

function onDragStart(idx: number, event: DragEvent) {
  dragIdx.value = idx
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
  }
}

function onDragOver(idx: number) {
  dragOverIdx.value = idx
}

function onDragEnd() {
  if (dragIdx.value !== null && dragOverIdx.value !== null && dragIdx.value !== dragOverIdx.value) {
    const arr = [...configStore.epreuves]
    const [moved] = arr.splice(dragIdx.value, 1)
    arr.splice(dragOverIdx.value, 0, moved)
    configStore.epreuves = arr
  }
  dragIdx.value = null
  dragOverIdx.value = null
}

// Autocomplete state
const acEpreuveId = ref<number | null>(null)
const acLangue = ref<string | null>(null)
const acSuggestions = ref<GlossaryEntry[]>([])
let blurTimeout: ReturnType<typeof setTimeout> | null = null

function onInputFocus(epreuveId: number, langueCode: string, currentValue: string) {
  if (blurTimeout) { clearTimeout(blurTimeout); blurTimeout = null }
  acEpreuveId.value = epreuveId
  acLangue.value = langueCode
  acSuggestions.value = searchGlossary(currentValue)
}

function onInputBlur() {
  blurTimeout = setTimeout(() => {
    acEpreuveId.value = null
    acLangue.value = null
    acSuggestions.value = []
  }, 200)
}

function selectSuggestion(epreuveId: number, entry: GlossaryEntry) {
  if (blurTimeout) { clearTimeout(blurTimeout); blurTimeout = null }
  // Fill all language columns for this epreuve
  for (const langue of configStore.langues) {
    if (langue.code === 'ko') {
      configStore.updateEpreuveLabel(epreuveId, langue.code, entry.hangul)
    } else {
      configStore.updateEpreuveLabel(epreuveId, langue.code, entry.latin)
    }
  }
  acSuggestions.value = []
}

// Epreuve label editing (native input for spreadsheet mode)
function onEpreuveNativeInput(epreuveId: number, langueCode: string, event: Event) {
  const val = (event.target as HTMLInputElement).value
  configStore.updateEpreuveLabel(epreuveId, langueCode, val)
  // Update suggestions while typing
  if (acEpreuveId.value === epreuveId && acLangue.value === langueCode) {
    acSuggestions.value = searchGlossary(val)
  }
}

function duplicateEpreuve(id: number) {
  const idx = configStore.epreuves.findIndex(e => e.id === id)
  if (idx === -1) return
  const source = configStore.epreuves[idx]
  const maxId = configStore.epreuves.reduce((max, e) => Math.max(max, e.id), 0)
  configStore.insertEpreuveAfter(idx, { id: maxId + 1, labels: { ...source.labels } })
}

function addEpreuve() {
  const maxId = configStore.epreuves.reduce((max, e) => Math.max(max, e.id), 0)
  const labels: Record<string, string> = {}
  for (const langue of configStore.langues) {
    labels[langue.code] = ''
  }
  configStore.addEpreuve({ id: maxId + 1, labels })
}

// Countdown durations
const showAddDuree = ref(false)
const newDureeSeconds = ref<number | null>(null)

function addDuree() {
  if (newDureeSeconds.value && newDureeSeconds.value > 0) {
    configStore.addDuree(newDureeSeconds.value)
    newDureeSeconds.value = null
    showAddDuree.value = false
  }
}

function formatDuree(seconds: number): string {
  const min = Math.floor(seconds / 60)
  const sec = seconds % 60
  if (min === 0) return `${sec}s`
  if (sec === 0) return `${min}min`
  return `${min}min${sec.toString().padStart(2, '0')}`
}

// Students per row
function onElevesParLigneInput(event: CustomEvent) {
  const val = parseInt(event.detail.value as string, 10)
  if (val > 0) configStore.elevesParLigne = val
}

async function deleteAllData() {
  await studentsStore.clear()
  await notesStore.clear()
  await sessionStore.clear()
  configStore.resetToDefaults()
  showDeleteAllModal.value = false
  const toast = await toastController.create({
    message: t('config.deleteAllDone'),
    duration: 2000,
    position: 'bottom',
    color: 'warning',
  })
  await toast.present()
}
</script>

<style scoped>
.section-header {
  margin-top: 1.5rem;
}

.epreuve-table-wrapper {
  overflow: visible;
  margin: 0.5rem 0;
}

.epreuve-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}

.epreuve-table th {
  text-align: left;
  padding: 4px 6px;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--ion-color-medium);
  border-bottom: 1px solid var(--ion-color-light, #ddd);
}

.epreuve-table td {
  padding: 2px 4px;
  border-bottom: 1px solid var(--ion-color-light, #eee);
}

.epreuve-input {
  width: 100%;
  border: 1px solid var(--ion-color-light, #ddd);
  border-radius: 4px;
  padding: 6px 8px;
  font-size: 0.85rem;
  background: var(--ion-background-color, #fff);
  color: var(--ion-text-color);
  outline: none;
  box-sizing: border-box;
}

.epreuve-input:focus {
  border-color: var(--ion-color-primary, #3880ff);
}

.col-drag {
  width: 24px;
  text-align: center;
  vertical-align: middle;
  cursor: grab;
  color: var(--ion-color-medium);
  font-size: 1rem;
  user-select: none;
}

.col-drag:active {
  cursor: grabbing;
}

.drag-over td {
  border-top: 2px solid var(--ion-color-primary, #3880ff);
}

.col-actions {
  width: 64px;
  text-align: center;
  white-space: nowrap;
}

.icon-btn {
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
  font-size: 1.1rem;
}

.cell-autocomplete {
  position: relative;
}

.autocomplete-list {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  z-index: 100;
  background: var(--ion-background-color, #fff);
  border: 1px solid var(--ion-color-medium, #999);
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  list-style: none;
  margin: 0;
  padding: 0;
  max-height: 180px;
  overflow-y: auto;
}

.autocomplete-list li {
  display: flex;
  justify-content: space-between;
  padding: 6px 8px;
  cursor: pointer;
  font-size: 0.8rem;
  gap: 8px;
}

.autocomplete-list li:hover {
  background: var(--ion-color-light, #f0f0f0);
}

.ac-latin {
  color: var(--ion-text-color);
}

.ac-hangul {
  color: var(--ion-color-medium);
  font-size: 0.75rem;
}

.form-buttons {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.75rem;
}

.hidden-input {
  display: none;
}

.slide-modal {
  --height: auto;
  --width: 90%;
  --max-width: 400px;
  --border-radius: 16px;
}

.modal-content {
  padding: 1.5rem;
  text-align: center;
}

.modal-content p {
  margin-bottom: 1.5rem;
  color: var(--ion-color-medium);
  font-size: 0.95rem;
}

.bottom-spacer {
  height: 2rem;
}
</style>
