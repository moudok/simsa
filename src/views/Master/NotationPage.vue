<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/"></ion-back-button>
        </ion-buttons>
        <template v-if="hasStudents">
          <div class="epreuve-nav">
            <button class="nav-btn" :disabled="!notationRef?.canGoPrev" @click="eventsStore.previousEpreuve()">←</button>
            <span class="epreuve-label">{{ notationRef?.currentEpreuveLabel }}</span>
            <button class="nav-btn" :disabled="!notationRef?.canGoNext" @click="eventsStore.nextEpreuve()">→</button>
          </div>
          <ion-buttons slot="end">
            <ion-button @click="notationRef?.toggleMenu()">
              <ion-icon slot="icon-only" :icon="menuOutline" />
            </ion-button>
          </ion-buttons>
        </template>
        <ion-title v-else>{{ t('notation.title') }}</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <template v-if="hasStudents">
        <NotationView ref="notationRef" jury-name="Maître" />
      </template>
      <div v-else class="empty-state">
        <p>{{ t('notation.noStudents') }}</p>
        <ion-list>
          <ion-item button router-link="/student/register" detail>
            <ion-icon :icon="personAddOutline" slot="start" />
            <ion-label>{{ t('eleve.register') }}</ion-label>
          </ion-item>
          <ion-item button router-link="/data-exchange/scan" detail>
            <ion-icon :icon="cameraOutline" slot="start" />
            <ion-label>{{ t('eleve.scanQR') }}</ion-label>
          </ion-item>
          <ion-item button detail @click="confirmLoadDemo">
            <ion-icon :icon="diceOutline" slot="start" />
            <ion-label>{{ t('home.demo') }}</ion-label>
          </ion-item>
          <ion-item button router-link="/parameters" detail>
            <ion-icon :icon="settingsOutline" slot="start" />
            <ion-label>{{ t('config.title') }}</ion-label>
          </ion-item>
        </ion-list>
      </div>
    </ion-content>
    <ion-footer v-if="hasStudents">
      <PermanentBar />
    </ion-footer>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  IonPage, IonHeader, IonFooter, IonToolbar, IonTitle, IonContent,
  IonButtons, IonBackButton, IonButton, IonIcon,
  IonList, IonItem, IonLabel,
  alertController, toastController,
} from '@ionic/vue'
import { menuOutline, diceOutline, personAddOutline, cameraOutline, settingsOutline } from 'ionicons/icons'
import { useI18n } from 'vue-i18n'
import { useEventsStore } from '@/stores/events'
import { useStudentsStore } from '@/stores/students'
import { generateDemoStudents } from '@/utils/demo'
import { generateQRDataURL, buildInscriptionPayload } from '@/composables/useQR'

import PermanentBar from '@/components/PermanentBar.vue'
import NotationView from '@/components/NotationView.vue'

const { t } = useI18n()
const eventsStore = useEventsStore()
const studentsStore = useStudentsStore()
const notationRef = ref<InstanceType<typeof NotationView>>()

const hasStudents = computed(() => studentsStore.eleves.length > 0)

async function confirmLoadDemo() {
  const alert = await alertController.create({
    header: t('home.demo'),
    message: t('home.demoConfirm'),
    buttons: [
      { text: t('common.cancel'), role: 'cancel' },
      { text: t('common.confirm'), handler: () => loadDemo() },
    ],
  })
  await alert.present()
}

async function loadDemo() {
  const students = generateDemoStudents()
  for (const student of students) {
    const newEleve = studentsStore.add(student)
    const { id: _, ...payloadData } = newEleve
    const payload = buildInscriptionPayload(payloadData)
    const qr = await generateQRDataURL(payload)
    studentsStore.setQR(newEleve.id, qr)
  }
  const toast = await toastController.create({
    message: `${students.length} ${t('home.demoLoaded')}`,
    duration: 2000, position: 'bottom', color: 'success',
  })
  await toast.present()
}
</script>

<style scoped>
.epreuve-nav {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  flex: 1;
}

.nav-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid var(--ion-color-primary, #3880ff);
  background: transparent;
  color: var(--ion-color-primary, #3880ff);
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
}

.nav-btn:disabled {
  opacity: 0.3;
}

.epreuve-label {
  font-size: 1rem;
  font-weight: 700;
  text-align: center;
}

.empty-state {
  max-width: 400px;
  margin: 2rem auto;
  text-align: center;
}

.empty-state p {
  font-size: 1.1rem;
  color: var(--ion-color-medium);
  margin-bottom: 1.5rem;
}
</style>
