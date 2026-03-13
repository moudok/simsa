<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/data-exchange" :text="t('common.back')"></ion-back-button>
        </ion-buttons>
        <ion-title>{{ t('config.exportQR') }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <div class="qr-container">
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
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonButtons, IonBackButton,
} from '@ionic/vue'
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useConfigStore } from '@/stores/config'
import { useStudentsStore } from '@/stores/students'
import { generateChunkedQRs } from '@/composables/useQR'
import { APP_VERSION } from '@/utils/version'
import type { QRPayload, ParamsPayload } from '@/types'

const { t } = useI18n()
const configStore = useConfigStore()
const studentsStore = useStudentsStore()

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

onMounted(async () => {
  const data: ParamsPayload = {
    epreuves: configStore.epreuves,
    dureesChrono: configStore.dureesChrono,
    elevesParLigne: configStore.elevesParLigne,
    ...(studentsStore.eleves.length > 0 ? { eleves: studentsStore.eleves } : {}),
  }
  const payload: QRPayload = {
    v: APP_VERSION,
    type: 'params',
    data,
  }
  qrImages.value = await generateChunkedQRs(payload)
  startTimer()
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<style scoped>
.qr-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem 0;
  gap: 0.5rem;
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
</style>
