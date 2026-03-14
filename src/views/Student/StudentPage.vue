<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/" :text="t('common.back')"></ion-back-button>
        </ion-buttons>
        <ion-title>{{ t('roles.eleve') }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <ion-list>
        <ion-item button router-link="/student/register" detail>
          <ion-icon :icon="personAddOutline" slot="start" />
          <ion-label>
            <h2>{{ t('eleve.register') }}</h2>
            <p>{{ studentsStore.eleves.length }} {{ t('session.studentsCount') }}</p>
          </ion-label>
        </ion-item>

        <ion-item button detail @click="confirmLoadDemo">
          <ion-icon :icon="diceOutline" slot="start" />
          <ion-label>
            <h2>{{ t('home.demo') }}</h2>
          </ion-label>
        </ion-item>

        <ion-item button detail @click="showDeleteModal = true">
          <ion-icon :icon="trashOutline" slot="start" />
          <ion-label>
            <h2>{{ t('config.deleteStudents') }}</h2>
          </ion-label>
        </ion-item>
      </ion-list>

      <ion-modal :is-open="showDeleteModal" @didDismiss="showDeleteModal = false" class="slide-modal">
        <div class="modal-content">
          <p>{{ t('config.deleteStudentsHelp') }}</p>
          <SlideConfirm :label="t('common.confirmDelete')" @confirm="deleteStudents" />
        </div>
      </ion-modal>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonButtons, IonBackButton, IonIcon,
  IonList, IonItem, IonLabel, IonModal,
  toastController, alertController,
} from '@ionic/vue'
import { personAddOutline, diceOutline, trashOutline } from 'ionicons/icons'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useStudentsStore } from '@/stores/students'
import { generateDemoStudents } from '@/utils/demo'
import SlideConfirm from '@/components/SlideConfirm.vue'

const { t } = useI18n()
const studentsStore = useStudentsStore()
const showDeleteModal = ref(false)

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

async function deleteStudents() {
  await studentsStore.clear()
  showDeleteModal.value = false
  const toast = await toastController.create({
    message: t('config.deleteStudentsDone'),
    duration: 2000,
    position: 'bottom',
    color: 'warning',
  })
  await toast.present()
}

async function loadDemo() {
  const students = generateDemoStudents()
  for (const student of students) {
    studentsStore.add(student)
  }
  const toast = await toastController.create({
    message: `${students.length} ${t('home.demoLoaded')}`,
    duration: 2000,
    position: 'bottom',
    color: 'success',
  })
  await toast.present()
}
</script>

<style scoped>
.slide-modal {
  --height: auto;
  --width: 90%;
  --max-width: 400px;
  --border-radius: 16px;
}

.modal-content {
  padding: 1.5rem;
  text-align: center;
}

.modal-content p {
  margin-bottom: 1.5rem;
  color: var(--ion-color-medium);
  font-size: 0.95rem;
}
</style>
