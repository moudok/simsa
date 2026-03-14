<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/data-exchange" :text="t('common.back')"></ion-back-button>
        </ion-buttons>
        <ion-title>{{ t('exchange.importQR') }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div id="qr-reader" class="qr-reader"></div>

      <div v-if="totalChunks > 1" class="progress-area">
        <p class="chunk-label">{{ receivedCount }} / {{ totalChunks }}</p>
        <svg class="pie-chart" viewBox="0 0 40 40">
          <circle
            v-for="idx in totalChunks"
            :key="idx"
            r="15.9"
            cx="20"
            cy="20"
            fill="none"
            :class="{ 'blink': blinkIdx === (idx - 1) }"
            :stroke="received.has(idx - 1) ? 'var(--ion-color-primary, #3880ff)' : 'var(--ion-color-light-shade, #d7d8da)'"
            stroke-width="4"
            :stroke-dasharray="sliceLength + ' ' + (circumference - sliceLength)"
            :stroke-dashoffset="sliceOffset(idx - 1)"
          />
        </svg>
      </div>

      <div v-if="lastScanned" class="ion-padding">
        <ion-card color="success">
          <ion-card-content>{{ lastScanned }}</ion-card-content>
        </ion-card>
      </div>

      <!-- Hash warning modal for results import -->
      <ion-modal :is-open="!!warningMessage" @didDismiss="onWarningDismiss" class="warning-modal">
        <div class="modal-content">
          <h3>{{ t('exchange.hashWarningTitle') }}</h3>
          <div class="warning-details" v-html="warningMessage"></div>
          <div class="modal-buttons">
            <ion-button @click="acceptWarning">{{ t('exchange.importAnyway') }}</ion-button>
            <ion-button fill="outline" color="danger" @click="rejectWarning">{{ t('common.cancel') }}</ion-button>
          </div>
        </div>
      </ion-modal>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonButtons, IonBackButton, IonButton, IonModal,
  IonCard, IonCardContent,
  toastController, onIonViewDidEnter, onIonViewWillLeave,
} from '@ionic/vue'
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useConfigStore } from '@/stores/config'
import { useStudentsStore } from '@/stores/students'
import { useNotesStore } from '@/stores/notes'
import { useQRScanner } from '@/composables/useQRScanner'
import { decodeQRPayload, parseChunk, reassembleChunks } from '@/composables/useQR'
import { checkVersionCompatibility } from '@/utils/version'
import { computeDataHash } from '@/utils/hash'
import type { QRPayload, ElevePayload, StudentsPayload, ParamsPayload, ResultsPayload } from '@/types'

const { t } = useI18n()
const router = useRouter()
const configStore = useConfigStore()
const studentsStore = useStudentsStore()
const notesStore = useNotesStore()
const { start, stop } = useQRScanner()

const chunks = ref(new Map<number, string>())
const totalChunks = ref(0)
const received = ref(new Set<number>())
const receivedCount = computed(() => received.value.size)
const blinkIdx = ref<number | null>(null)
const lastScanned = ref<string | null>(null)

const warningMessage = ref('')
let pendingResultsPayload: ResultsPayload | null = null

const circumference = computed(() => 2 * Math.PI * 15.9)
const sliceLength = computed(() => totalChunks.value > 0
  ? circumference.value / totalChunks.value - 0.5
  : 0)

function sliceOffset(idx: number): number {
  const perSlice = circumference.value / totalChunks.value
  return -(perSlice * idx) + circumference.value / 4
}

async function showToast(message: string, color: string) {
  const toast = await toastController.create({ message, color, duration: 2500, position: 'top' })
  await toast.present()
}

function checkVersion(version: string): boolean {
  const vc = checkVersionCompatibility(version)
  if (!vc.compatible) {
    showToast(vc.error!, 'danger')
    return false
  }
  if (vc.warning) showToast(vc.warning, 'warning')
  return true
}

// --- Student helpers ---

function isDuplicate(e: ElevePayload): boolean {
  return studentsStore.eleves.some(s =>
    s.prenom === e.prenom && s.nom === e.nom &&
    s.grade === e.grade && s.anneeNaissance === e.anneeNaissance,
  )
}

function addStudent(e: ElevePayload): boolean {
  if (isDuplicate(e)) return false
  studentsStore.add({
    prenom: e.prenom, nom: e.nom, grade: e.grade,
    anneeNaissance: e.anneeNaissance, genre: e.genre, consentementRGPD: true,
    binomePrenom: e.binomePrenom, binomeNom: e.binomeNom,
  })
  return true
}

// --- Params (tout importer) ---

async function applyParams(data: ParamsPayload) {
  await studentsStore.clear()
  await notesStore.clear()
  configStore.epreuves = data.epreuves
  configStore.dureesChrono = data.dureesChrono
  configStore.elevesParLigne = data.elevesParLigne
  if (Array.isArray(data.eleves)) {
    for (const e of data.eleves) await addStudent(e)
  }
  showToast(t('config.importYamlSuccess'), 'success')
  router.back()
}

// --- Results ---

function verifyHash(data: ResultsPayload): string | null {
  const currentEleveIds = studentsStore.eleves.map(e => e.id).sort((a, b) => a - b)
  const currentEpreuveIds = configStore.epreuves.map(e => e.id).sort((a, b) => a - b)
  const currentHash = computeDataHash(currentEleveIds, currentEpreuveIds)
  if (currentHash === data.hash) return null

  const incomingEleveIds = new Set(data.eleveIds)
  const incomingEpreuveIds = new Set(data.epreuveIds)
  const currentEleveSet = new Set(currentEleveIds)
  const currentEpreuveSet = new Set(currentEpreuveIds)
  const lines: string[] = []

  const missingEleves = data.eleveIds.filter(id => !currentEleveSet.has(id))
  if (missingEleves.length > 0) lines.push(`<p><strong>${t('exchange.missingStudents')}</strong> ${missingEleves.join(', ')}</p>`)
  const extraEleves = currentEleveIds.filter(id => !incomingEleveIds.has(id))
  if (extraEleves.length > 0) lines.push(`<p><strong>${t('exchange.extraStudents')}</strong> ${extraEleves.join(', ')}</p>`)
  const missingEpreuves = data.epreuveIds.filter(id => !currentEpreuveSet.has(id))
  if (missingEpreuves.length > 0) lines.push(`<p><strong>${t('exchange.missingEpreuves')}</strong> ${missingEpreuves.join(', ')}</p>`)
  const extraEpreuves = currentEpreuveIds.filter(id => !incomingEpreuveIds.has(id))
  if (extraEpreuves.length > 0) lines.push(`<p><strong>${t('exchange.extraEpreuves')}</strong> ${extraEpreuves.join(', ')}</p>`)
  if (lines.length === 0) lines.push(`<p>${t('exchange.hashUnknownError')}</p>`)
  return lines.join('')
}

function applyResults(data: ResultsPayload) {
  notesStore.mergeNotes(data.notes.map(n => ({
    jury: data.jury, eleveId: n.eleveId, epreuveId: n.epreuveId, plus: n.plus, moins: n.moins,
  })))
  notesStore.mergeJuryVerdicts(data.verdicts.map(v => ({
    jury: data.jury, eleveId: v.eleveId, valide: v.valide,
  })))
  showToast(`${t('exchange.importResultsSuccess')} (${data.jury})`, 'success')
  router.back()
}

function acceptWarning() {
  if (pendingResultsPayload) {
    applyResults(pendingResultsPayload)
    pendingResultsPayload = null
  }
  warningMessage.value = ''
}

function rejectWarning() {
  pendingResultsPayload = null
  warningMessage.value = ''
}

function onWarningDismiss() {
  pendingResultsPayload = null
  warningMessage.value = ''
}

// --- Unified payload handler ---

async function processPayload(payload: QRPayload) {
  if (!checkVersion(payload.v)) return

  switch (payload.type) {
    case 'inscription': {
      const added = await addStudent(payload.data as ElevePayload)
      const e = payload.data as ElevePayload
      if (added) {
        lastScanned.value = `${e.prenom} ${e.nom}`
        showToast(`${e.prenom} ${e.nom}`, 'success')
      } else {
        showToast(t('session.duplicateStudent'), 'warning')
      }
      break
    }
    case 'students': {
      const eleves = (payload.data as StudentsPayload).eleves
      for (const e of eleves) await addStudent(e)
      showToast(t('exchange.importStudentsSuccess'), 'success')
      router.back()
      break
    }
    case 'params': {
      await applyParams(payload.data as ParamsPayload)
      break
    }
    case 'results': {
      const data = payload.data as ResultsPayload
      const warning = verifyHash(data)
      if (warning) {
        pendingResultsPayload = data
        warningMessage.value = warning
      } else {
        applyResults(data)
      }
      break
    }
    default:
      showToast(t('session.invalidQR'), 'danger')
  }
}

// --- Scan handler ---

let processing = false

async function onScan(decodedText: string) {
  if (processing) return

  // Try as chunk
  const chunk = parseChunk(decodedText)
  if (chunk) {
    if (received.value.has(chunk.i)) {
      blinkIdx.value = chunk.i
      setTimeout(() => { blinkIdx.value = null }, 400)
      return
    }
    totalChunks.value = chunk.n
    chunks.value.set(chunk.i, chunk.d)
    received.value = new Set(received.value).add(chunk.i)

    if (chunks.value.size === chunk.n) {
      processing = true
      try {
        const payload = reassembleChunks(chunks.value, chunk.n)
        await processPayload(payload)
      } catch {
        showToast(t('session.invalidQR'), 'danger')
      } finally {
        processing = false
      }
    }
    return
  }

  // Try as single QR
  processing = true
  try {
    const payload = decodeQRPayload(decodedText)
    await processPayload(payload)
  } catch {
    showToast(t('session.invalidQR'), 'danger')
  } finally {
    processing = false
  }
}

onIonViewDidEnter(async () => {
  chunks.value = new Map()
  received.value = new Set()
  totalChunks.value = 0
  lastScanned.value = null
  try {
    await start('qr-reader', onScan)
  } catch {
    showToast(t('session.cameraError'), 'danger')
  }
})

onIonViewWillLeave(() => {
  stop()
})
</script>

<style scoped>
.qr-reader {
  width: 100%;
  max-width: 500px;
  margin: 0 auto;
}

.progress-area {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 1rem;
}

.chunk-label {
  font-size: 1rem;
  font-weight: 700;
  color: var(--ion-color-medium);
  margin: 0;
}

.pie-chart {
  width: 48px;
  height: 48px;
}

.blink {
  animation: blink-anim 0.4s ease-in-out;
}

@keyframes blink-anim {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.2; }
}

.warning-modal {
  --height: auto;
  --width: 90%;
  --max-width: 420px;
  --border-radius: 16px;
}

.modal-content {
  padding: 1.5rem;
}

.modal-content h3 {
  margin: 0 0 1rem 0;
  color: var(--ion-color-warning-shade, #e0ac08);
}

.warning-details {
  font-size: 0.9rem;
  color: var(--ion-color-medium);
  margin-bottom: 1rem;
}

.warning-details p {
  margin: 0.25rem 0;
}

.modal-buttons {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
}
</style>
