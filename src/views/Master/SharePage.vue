<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/master" :text="t('common.back')"></ion-back-button>
        </ion-buttons>
        <ion-title>{{ t('session.share') }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <div v-if="studentsStore.eleves.length === 0" class="empty">
        <p>{{ t('session.noStudents') }}</p>
      </div>

      <div v-else class="share-container">
        <h2>{{ t('session.shareTitle') }}</h2>
        <img v-if="qrDataURL" :src="qrDataURL" alt="QR Config" class="qr-image" />
        <p>{{ studentsStore.eleves.length }} {{ t('session.studentsCount') }} · {{ configStore.epreuves.length }} {{ t('config.epreuves').toLowerCase() }}</p>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonButtons, IonBackButton,
} from '@ionic/vue'
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useConfigStore } from '@/stores/config'

import { useStudentsStore } from '@/stores/students'
import { generateQRDataURL } from '@/composables/useQR'
import { APP_VERSION } from '@/utils/version'
import type { QRPayload } from '@/types'

const { t } = useI18n()
const configStore = useConfigStore()
const studentsStore = useStudentsStore()

const qrDataURL = ref('')

onMounted(async () => {
  if (studentsStore.eleves.length === 0) return

  const payload: QRPayload = {
    v: APP_VERSION,
    type: 'config',
    data: {
      epreuves: configStore.epreuves,
      eleves: studentsStore.eleves,
    },
  }

  qrDataURL.value = await generateQRDataURL(payload)
})
</script>

<style scoped>
.share-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 1rem;
  padding: 2rem 0;
}

.qr-image {
  width: 280px;
  height: 280px;
}

.empty {
  text-align: center;
  color: var(--ion-color-medium);
  margin-top: 2rem;
}
</style>
