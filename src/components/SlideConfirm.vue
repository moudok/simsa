<template>
  <div
    ref="trackRef"
    class="slide-confirm"
    :class="{ confirmed: isConfirmed }"
    :style="{ '--color': color }"
  >
    <div class="track-label" :style="{ opacity: labelOpacity }">
      {{ label }}
    </div>
    <div
      ref="knobRef"
      class="knob"
      :class="{ animating: isAnimating }"
      :style="{ transform: `translateX(${knobX}px)` }"
    >
      <span class="knob-arrow">&rsaquo;&rsaquo;</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'

withDefaults(defineProps<{
  label: string
  color?: string
}>(), {
  color: '#e04055',
})

const emit = defineEmits<{
  confirm: []
}>()

const trackRef = ref<HTMLElement>()
const knobRef = ref<HTMLElement>()
const knobX = ref(0)
const isAnimating = ref(false)
const isConfirmed = ref(false)

const KNOB_SIZE = 50

function getMaxX(): number {
  if (!trackRef.value) return 200
  return trackRef.value.clientWidth - KNOB_SIZE - 4
}

const labelOpacity = computed(() => {
  const mx = getMaxX()
  if (mx <= 0) return 1
  return Math.max(0, 1 - knobX.value / mx * 1.5)
})

let startX = 0
let startKnobX = 0
let dragging = false
let currentMaxX = 200

function getClientX(e: TouchEvent | MouseEvent): number {
  if ('touches' in e) return e.touches[0].clientX
  return e.clientX
}

function onTouchStart(e: TouchEvent) {
  if (isConfirmed.value) return
  e.preventDefault()
  e.stopImmediatePropagation()
  startDrag(e.touches[0].clientX)
  document.addEventListener('touchmove', onTouchMove, { passive: false, capture: true })
  document.addEventListener('touchend', onTouchEnd, { capture: true })
  document.addEventListener('touchcancel', onTouchEnd, { capture: true })
}

function onMouseDown(e: MouseEvent) {
  if (isConfirmed.value) return
  e.preventDefault()
  e.stopImmediatePropagation()
  startDrag(e.clientX)
  document.addEventListener('mousemove', onMouseMove, { capture: true })
  document.addEventListener('mouseup', onMouseUp, { capture: true })
}

function startDrag(clientX: number) {
  dragging = true
  isAnimating.value = false
  startX = clientX
  startKnobX = knobX.value
  currentMaxX = getMaxX()
}

function onTouchMove(e: TouchEvent) {
  if (!dragging) return
  e.preventDefault()
  e.stopImmediatePropagation()
  const dx = e.touches[0].clientX - startX
  knobX.value = Math.max(0, Math.min(startKnobX + dx, currentMaxX))
}

function onMouseMove(e: MouseEvent) {
  if (!dragging) return
  e.preventDefault()
  const dx = e.clientX - startX
  knobX.value = Math.max(0, Math.min(startKnobX + dx, currentMaxX))
}

function onTouchEnd(e: TouchEvent) {
  if (!dragging) return
  e.preventDefault()
  e.stopImmediatePropagation()
  endDrag()
  document.removeEventListener('touchmove', onTouchMove, { capture: true } as EventListenerOptions)
  document.removeEventListener('touchend', onTouchEnd, { capture: true } as EventListenerOptions)
  document.removeEventListener('touchcancel', onTouchEnd, { capture: true } as EventListenerOptions)
}

function onMouseUp() {
  if (!dragging) return
  endDrag()
  document.removeEventListener('mousemove', onMouseMove, { capture: true } as EventListenerOptions)
  document.removeEventListener('mouseup', onMouseUp, { capture: true } as EventListenerOptions)
}

function endDrag() {
  dragging = false
  if (knobX.value >= currentMaxX * 0.9) {
    knobX.value = currentMaxX
    isConfirmed.value = true
    emit('confirm')
    setTimeout(() => {
      isAnimating.value = true
      knobX.value = 0
      isConfirmed.value = false
    }, 600)
  } else {
    isAnimating.value = true
    knobX.value = 0
  }
}

onMounted(() => {
  // Attach directly to the DOM element to bypass Vue/Ionic event delegation
  knobRef.value?.addEventListener('touchstart', onTouchStart, { passive: false, capture: false })
  knobRef.value?.addEventListener('mousedown', onMouseDown, { capture: false })
})

onBeforeUnmount(() => {
  knobRef.value?.removeEventListener('touchstart', onTouchStart)
  knobRef.value?.removeEventListener('mousedown', onMouseDown)
  // Clean up any lingering listeners
  document.removeEventListener('touchmove', onTouchMove, { capture: true } as EventListenerOptions)
  document.removeEventListener('touchend', onTouchEnd, { capture: true } as EventListenerOptions)
  document.removeEventListener('touchcancel', onTouchEnd, { capture: true } as EventListenerOptions)
  document.removeEventListener('mousemove', onMouseMove, { capture: true } as EventListenerOptions)
  document.removeEventListener('mouseup', onMouseUp, { capture: true } as EventListenerOptions)
})
</script>

<style scoped>
.slide-confirm {
  position: relative;
  height: 50px;
  border-radius: 25px;
  background: var(--color);
  overflow: hidden;
  user-select: none;
  touch-action: none;
}

.track-label {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 0.95rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  pointer-events: none;
  padding-left: 50px;
}

.knob {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 46px;
  height: 46px;
  border-radius: 50%;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: grab;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
  z-index: 1;
  touch-action: none;
}

.knob:active {
  cursor: grabbing;
}

.knob.animating {
  transition: transform 0.3s ease;
}

.knob-arrow {
  font-size: 1.3rem;
  font-weight: 700;
  color: var(--color);
  line-height: 1;
  letter-spacing: -3px;
}

.slide-confirm.confirmed .knob {
  background: #fff;
}
</style>
