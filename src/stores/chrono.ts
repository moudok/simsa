import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useChronoStore = defineStore('chrono', () => {
  // Session timer
  const sessionStartTime = ref<number | null>(null)
  const sessionElapsed = ref(0)
  const sessionPausedElapsed = ref(0)
  const sessionPaused = ref(false)

  // Countdown timer (based on real time)
  const countdownDuration = ref(0)
  const countdownRemaining = ref(0)
  const countdownActive = ref(false)
  const countdownPaused = ref(false)
  const countdownEndTime = ref<number | null>(null)
  const countdownPausedRemaining = ref(0)

  function startSession() {
    sessionStartTime.value = Date.now()
    sessionElapsed.value = 0
    sessionPausedElapsed.value = 0
    sessionPaused.value = false
  }

  function pauseSession() {
    if (sessionPaused.value || sessionStartTime.value === null) return
    sessionPausedElapsed.value = Math.floor((Date.now() - sessionStartTime.value) / 1000)
    sessionPaused.value = true
  }

  function resumeSession() {
    if (!sessionPaused.value) return
    sessionStartTime.value = Date.now() - sessionPausedElapsed.value * 1000
    sessionPaused.value = false
  }

  function updateSessionElapsed() {
    if (sessionPaused.value) {
      sessionElapsed.value = sessionPausedElapsed.value
      return
    }
    if (sessionStartTime.value !== null) {
      sessionElapsed.value = Math.floor((Date.now() - sessionStartTime.value) / 1000)
    }
  }

  function startCountdown(seconds: number) {
    countdownDuration.value = seconds
    countdownRemaining.value = seconds
    countdownEndTime.value = Date.now() + seconds * 1000
    countdownActive.value = true
    countdownPaused.value = false
  }

  function stopCountdown() {
    countdownActive.value = false
    countdownPaused.value = false
    countdownRemaining.value = 0
    countdownEndTime.value = null
  }

  function pauseCountdown() {
    if (!countdownActive.value || countdownPaused.value) return
    countdownPausedRemaining.value = Math.max(0, Math.ceil((countdownEndTime.value! - Date.now()) / 1000))
    countdownPaused.value = true
  }

  function resumeCountdown() {
    if (!countdownPaused.value) return
    countdownEndTime.value = Date.now() + countdownPausedRemaining.value * 1000
    countdownPaused.value = false
  }

  function tickCountdown() {
    if (!countdownActive.value) return
    if (countdownPaused.value) {
      countdownRemaining.value = countdownPausedRemaining.value
      return
    }
    const remaining = Math.ceil((countdownEndTime.value! - Date.now()) / 1000)
    countdownRemaining.value = Math.max(0, remaining)
    if (countdownRemaining.value <= 0) {
      countdownActive.value = false
      countdownPaused.value = false
      countdownEndTime.value = null
    }
  }

  function reset() {
    sessionStartTime.value = null
    sessionElapsed.value = 0
    sessionPausedElapsed.value = 0
    sessionPaused.value = false
    stopCountdown()
  }

  return {
    sessionStartTime,
    sessionElapsed,
    countdownDuration,
    countdownRemaining,
    countdownActive,
    countdownPaused,
    sessionPaused,
    startSession,
    pauseSession,
    resumeSession,
    updateSessionElapsed,
    startCountdown,
    stopCountdown,
    pauseCountdown,
    resumeCountdown,
    tickCountdown,
    reset,
  }
})
