<template>
  <div class="langue-switcher">
    <ion-button
      v-for="langue in configStore.langues"
      :key="langue.code"
      :fill="langue.code === configStore.langueActive ? 'solid' : 'outline'"
      color="medium"
      size="small"
      @click="switchLangue(langue.code)"
    >
      {{ langue.label }}
    </ion-button>
  </div>
</template>

<script setup lang="ts">
import { IonButton } from '@ionic/vue'
import { useI18n } from 'vue-i18n'
import { useConfigStore } from '@/stores/config'
import type { CodeLangue } from '@/types'

const { locale } = useI18n()
const configStore = useConfigStore()

function switchLangue(code: CodeLangue) {
  configStore.setLangueActive(code)
  locale.value = code
  document.documentElement.lang = code
}
</script>

<style scoped>
.langue-switcher {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
}
</style>
