<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/" :text="t('common.back')"></ion-back-button>
        </ion-buttons>
        <ion-title>{{ t('exchange.exportResults') }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <!-- Step 1: Jury name -->
      <div v-if="!juryConfirmed" class="jury-form">
        <ion-item>
          <ion-input
            v-model="juryName"
            :label="t('exchange.juryName')"
            label-placement="stacked"
            :placeholder="t('exchange.juryNamePlaceholder')"
            @keydown.enter="confirmJury"
          />
        </ion-item>
        <ion-button expand="block" :disabled="!juryName.trim()" @click="confirmJury" class="confirm-btn">
          {{ t('exchange.generateQR') }}
        </ion-button>
        <p v-if="noDataMessage" class="no-data">{{ noDataMessage }}</p>
      </div>

      <!-- Step 2: QR display (same layout as ExportQRPage) -->
      <div v-else class="qr-container">
        <p class="jury-label">{{ juryName }}</p>
        <p v-if="qrImages.length > 1" class="chunk-label">{{ currentIndex + 1 }} / {{ qrImages.length }}</p>
        <img v-if="qrImages.length > 0" :src="qrImages[currentIndex]" alt="QR Code" class="qr-image" />
        <p v-else>...</p>
        <div v-if="qrImages.length > 1" class="controls-row">
          <input
            type="range"
            min="0.5"
            max="5"
            step="0.5"
            :value="speed"
            class="speed-slider"
            @input="onSpeedChange"
          />
          <span class="speed-label">{{ speed }}s</span>
          <svg class="pie-chart" viewBox="0 0 40 40">
            <circle
              v-for="(_, idx) in qrImages"
              :key="idx"
              r="15.9"
              cx="20"
              cy="20"
              fill="none"
              :stroke="idx === currentIndex ? 'var(--ion-color-primary, #3880ff)' : 'var(--ion-color-light-shade, #d7d8da)'"
              stroke-width="4"
              :stroke-dasharray="sliceLength + ' ' + (circumference - sliceLength)"
              :stroke-dashoffset="sliceOffset(idx)"
            />
          </svg>
        </div>
        <ion-button expand="block" fill="outline" @click="reset" class="back-btn">
          {{ t('common.back') }}
        </ion-button>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonButtons, IonBackButton, IonButton, IonItem, IonInput,
} from '@ionic/vue'
import { ref, computed, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useNotesStore } from '@/stores/notes'
import { useStudentsStore } from '@/stores/students'
import { useConfigStore } from '@/stores/config'
import { generateChunkedQRs } from '@/composables/useQR'
import { computeDataHash } from '@/utils/hash'
import { APP_VERSION } from '@/utils/version'
import type { QRPayload, ResultsPayload } from '@/types'

const { t } = useI18n()
const router = useRouter()
const notesStore = useNotesStore()
const studentsStore = useStudentsStore()
const configStore = useConfigStore()

const juryName = ref(localStorage.getItem('simsa_jury_name') ?? '')
const juryConfirmed = ref(false)
const noDataMessage = ref('')
const qrImages = ref<string[]>([])
const currentIndex = ref(0)
const speed = ref(1)
let timer: ReturnType<typeof setInterval> | null = null

const circumference = computed(() => 2 * Math.PI * 15.9)
const sliceLength = computed(() => qrImages.value.length > 0
  ? circumference.value / qrImages.value.length - 0.5
  : 0)

function sliceOffset(idx: number): number {
  const perSlice = circumference.value / qrImages.value.length
  return -(perSlice * idx) + circumference.value / 4
}

function startTimer() {
  if (timer) clearInterval(timer)
  if (qrImages.value.length <= 1) return
  timer = setInterval(() => {
    currentIndex.value = (currentIndex.value + 1) % qrImages.value.length
  }, speed.value * 1000)
}

function onSpeedChange(e: Event) {
  speed.value = parseFloat((e.target as HTMLInputElement).value)
  startTimer()
}

function reset() {
  if (timer) clearInterval(timer)
  router.push('/')
}

async function confirmJury() {
  const name = juryName.value.trim()
  if (!name) return

  localStorage.setItem('simsa_jury_name', name)

  const filteredNotes = notesStore.notes
    .filter(n => n.plus > 0 || n.moins > 0)
    .map(n => ({ eleveId: n.eleveId, epreuveId: n.epreuveId, plus: n.plus, moins: n.moins }))

  const verdicts: { eleveId: number, valide: boolean }[] = []
  for (const eleve of studentsStore.eleves) {
    const v = studentsStore.verdicts[eleve.id]
    if (v === 'passed') verdicts.push({ eleveId: eleve.id, valide: true })
    else if (v === 'failed') verdicts.push({ eleveId: eleve.id, valide: false })
  }

  if (filteredNotes.length === 0 && verdicts.length === 0) {
    noDataMessage.value = t('exchange.noResults')
    return
  }

  const eleveIds = studentsStore.eleves.map(e => e.id).sort((a, b) => a - b)
  const epreuveIds = configStore.epreuves.map(e => e.id).sort((a, b) => a - b)
  const hash = computeDataHash(eleveIds, epreuveIds)

  const resultsPayload: ResultsPayload = {
    jury: name,
    notes: filteredNotes,
    verdicts,
    hash,
    eleveIds,
    epreuveIds,
  }

  const payload: QRPayload = {
    v: APP_VERSION,
    type: 'results',
    data: resultsPayload,
  }

  qrImages.value = await generateChunkedQRs(payload)
  currentIndex.value = 0
  juryConfirmed.value = true
  noDataMessage.value = ''
  startTimer()
}

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<style scoped>
.jury-form {
  max-width: 400px;
  margin: 2rem auto;
}

.confirm-btn {
  margin-top: 1rem;
}

.no-data {
  text-align: center;
  color: var(--ion-color-danger);
  margin-top: 1rem;
}

.qr-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem 0;
  gap: 0.5rem;
}

.jury-label {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0;
}

.chunk-label {
  font-size: 1rem;
  font-weight: 700;
  color: var(--ion-color-medium);
  margin: 0;
}

.qr-image {
  width: 300px;
  height: 300px;
}

.controls-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 0.5rem;
}

.speed-slider {
  width: 150px;
  accent-color: var(--ion-color-primary, #3880ff);
}

.speed-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--ion-color-medium);
  min-width: 2.5em;
}

.pie-chart {
  width: 40px;
  height: 40px;
  flex-shrink: 0;
}

.back-btn {
  margin-top: 1rem;
  max-width: 300px;
  width: 100%;
}
</style>
