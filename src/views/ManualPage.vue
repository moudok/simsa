<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/" :text="t('common.back')"></ion-back-button>
        </ion-buttons>
        <ion-title>{{ t('manual.title') }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <div class="manual-content" v-html="htmlContent"></div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonButtons, IonBackButton,
} from '@ionic/vue'
import { ref, watchEffect } from 'vue'
import { useI18n } from 'vue-i18n'
import { marked } from 'marked'
import { useConfigStore } from '@/stores/config'


const { t } = useI18n()
const configStore = useConfigStore()
const htmlContent = ref('')

watchEffect(async () => {
  const lang = configStore.langueActive
  try {
    const res = await fetch(`${import.meta.env.BASE_URL}manual.${lang}.md`)
    if (!res.ok) {
      // Fallback to French if the language file doesn't exist
      const fallback = await fetch(`${import.meta.env.BASE_URL}manual.fr.md`)
      const text = await fallback.text()
      htmlContent.value = await marked(text)
    } else {
      const text = await res.text()
      htmlContent.value = await marked(text)
    }
  } catch {
    htmlContent.value = '<p>Manual not available.</p>'
  }
})
</script>

<style scoped>
.manual-content {
  max-width: 700px;
  margin: 0 auto;
  line-height: 1.6;
}

.manual-content :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 1rem 0;
  font-size: 0.9rem;
}

.manual-content :deep(th),
.manual-content :deep(td) {
  border: 1px solid var(--ion-color-medium, #999);
  padding: 0.4rem 0.6rem;
  text-align: left;
}

.manual-content :deep(th) {
  background: var(--ion-color-light, #f4f4f4);
  font-weight: 600;
}

.manual-content :deep(h1) {
  font-size: 1.4rem;
}

.manual-content :deep(h2) {
  font-size: 1.2rem;
  margin-top: 1.5rem;
}

.manual-content :deep(h3) {
  font-size: 1.05rem;
  margin-top: 1rem;
}

.manual-content :deep(hr) {
  border: none;
  border-top: 1px solid var(--ion-color-light, #ddd);
  margin: 1.5rem 0;
}
</style>
