<template>
  <div class="permanent-bar">
    <span class="bar-item clock">{{ currentTime }}</span>

    <div class="countdown-area">
      <template v-if="!chronoStore.countdownActive">
        <button
          v-for="d in configStore.dureesChrono"
          :key="d"
          class="countdown-btn"
          @click="startCountdown(d)"
        >
          {{ formatCountdownLabel(d) }}
        </button>
      </template>
      <template v-if="chronoStore.countdownActive">
        <button class="countdown-btn pause" @click="chronoStore.countdownPaused ? chronoStore.resumeCountdown() : chronoStore.pauseCountdown()">
          {{ chronoStore.countdownPaused ? '▶' : '⏸' }}
        </button>
        <span class="countdown-gap"></span>
        <span class="bar-item countdown" :class="{ urgent: chronoStore.countdownRemaining <= 5, paused: chronoStore.countdownPaused }">
          {{ formatDuration(chronoStore.countdownRemaining) }}
        </span>
        <span class="countdown-gap"></span>
        <button class="countdown-btn stop" @click="chronoStore.stopCountdown()">
          {{ t('chrono.stop') }}
        </button>
      </template>
    </div>

    <span class="bar-item session-timer">
      {{ t('chrono.session') }} {{ formatDuration(chronoStore.sessionElapsed) }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useChronoStore } from '@/stores/chrono'
import { useConfigStore } from '@/stores/config'
import { playEndMelody } from '@/utils/beep'

const { t } = useI18n()
const chronoStore = useChronoStore()
const configStore = useConfigStore()

const currentTime = ref(formatTime())
let intervalId: ReturnType<typeof setInterval> | null = null

function formatTime(): string {
  const now = new Date()
  return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
}

function formatDuration(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  if (h > 0) return `${h}h${String(m).padStart(2, '0')}'${String(s).padStart(2, '0')}s`
  if (m > 0) return `${m}'${String(s).padStart(2, '0')}s`
  return `${s}s`
}

function formatCountdownLabel(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  if (m > 0 && s > 0) return `${m}'${String(s).padStart(2, '0')}`
  if (m > 0) return `${m}'`
  return `${s}s`
}

function startCountdown(seconds: number) {
  chronoStore.startCountdown(seconds)
}

// Beep and vibrate when countdown reaches 0
watch(() => chronoStore.countdownRemaining, (val, oldVal) => {
  if (oldVal === 1 && val === 0) {
    playEndMelody()
    if (navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 200])
  }
})

onMounted(() => {
  if (!chronoStore.sessionStartTime) {
    chronoStore.startSession()
  } else {
    chronoStore.resumeSession()
  }
  intervalId = setInterval(() => {
    currentTime.value = formatTime()
    chronoStore.updateSessionElapsed()
    chronoStore.tickCountdown()
  }, 1000)
})

onUnmounted(() => {
  if (intervalId) clearInterval(intervalId)
  chronoStore.pauseSession()
})
</script>

<style scoped>
.permanent-bar {
  background: var(--ion-color-dark, #222);
  color: #fff;
  padding: 3px 8px;
  font-size: 0.75rem;
  font-variant-numeric: tabular-nums;
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.bar-item {
  white-space: nowrap;
}

.clock {
  font-weight: 700;
}

.session-timer {
  color: #fff;
}

.countdown-area {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  flex-wrap: nowrap;
  overflow-x: auto;
  min-width: 0;
  flex: 1;
}

.countdown-btn {
  background: var(--ion-color-medium, #666);
  color: #fff;
  border: none;
  border-radius: 4px;
  padding: 1px 4px;
  font-size: 0.65rem;
  cursor: pointer;
  min-height: 20px;
  white-space: nowrap;
  flex-shrink: 0;
}

.countdown-btn.active {
  background: var(--ion-color-primary, #3880ff);
}

.countdown-btn.pause {
  background: var(--ion-color-warning, #ffc409);
  color: #000;
}

.countdown-btn.stop {
  background: var(--ion-color-danger, #eb445a);
}

.countdown-gap {
  width: 4px;
}

.countdown {
  font-weight: 700;
  font-size: 0.8rem;
}

.countdown.paused {
  opacity: 0.6;
}

.countdown.urgent {
  color: var(--ion-color-danger, #eb445a);
  animation: blink 0.5s infinite alternate;
}

@keyframes blink {
  from { opacity: 1; }
  to { opacity: 0.3; }
}

</style>
