<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/" :text="t('common.back')"></ion-back-button>
        </ion-buttons>
        <ion-title>{{ t('exchange.title') }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <ion-list-header class="section-header-first">
        <ion-label>{{ t('exchange.importSection') }}</ion-label>
      </ion-list-header>
      <ion-list inset>
        <ion-item button detail router-link="/data-exchange/scan">
          <ion-icon :icon="scanOutline" slot="start" />
          <ion-label>{{ t('exchange.importQR') }}</ion-label>
        </ion-item>
        <ion-item button detail @click="triggerImportYaml">
          <ion-icon :icon="pushOutline" slot="start" />
          <ion-label>{{ t('config.importYaml') }}</ion-label>
        </ion-item>
      </ion-list>

      <ion-list-header class="section-header">
        <ion-label>{{ t('exchange.exportSection') }}</ion-label>
      </ion-list-header>
      <ion-list inset>
        <ion-item button detail @click="exportYaml">
          <ion-icon :icon="downloadOutline" slot="start" />
          <ion-label>{{ t('config.exportYaml') }}</ion-label>
        </ion-item>
        <ion-item button detail router-link="/data-exchange/qr">
          <ion-icon :icon="qrCodeOutline" slot="start" />
          <ion-label>{{ t('config.exportQR') }}</ion-label>
        </ion-item>
        <ion-item button detail router-link="/data-exchange/students-qr">
          <ion-icon :icon="qrCodeOutline" slot="start" />
          <ion-label>{{ t('exchange.exportStudents') }}</ion-label>
        </ion-item>
        <ion-item button detail router-link="/data-exchange/results-qr">
          <ion-icon :icon="qrCodeOutline" slot="start" />
          <ion-label>{{ t('exchange.exportResults') }}</ion-label>
        </ion-item>
      </ion-list>
      <input ref="fileInput" type="file" accept=".yaml,.yml" class="hidden-input" @change="onFileImport" />
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonButtons, IonBackButton, IonIcon,
  IonList, IonListHeader, IonItem, IonLabel,
  toastController,
} from '@ionic/vue'
import { downloadOutline, pushOutline, qrCodeOutline, scanOutline } from 'ionicons/icons'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import yaml from 'js-yaml'
import { useConfigStore } from '@/stores/config'
import { useStudentsStore } from '@/stores/students'
import { useNotesStore } from '@/stores/notes'
import { APP_VERSION } from '@/utils/version'
import { buildInscriptionPayload, generateQRDataURL } from '@/composables/useQR'
import type { Epreuve, Eleve } from '@/types'

const { t } = useI18n()
const configStore = useConfigStore()
const studentsStore = useStudentsStore()
const notesStore = useNotesStore()
const fileInput = ref<HTMLInputElement>()

// Export YAML
function exportYaml() {
  const data: Record<string, unknown> = {
    simsa_version: APP_VERSION,
    epreuves: configStore.epreuves.map(e => ({ id: e.id, labels: { ...e.labels } })),
    dureesChrono: [...configStore.dureesChrono],
    elevesParLigne: configStore.elevesParLigne,
  }
  if (studentsStore.eleves.length > 0) {
    data.eleves = studentsStore.eleves.map(e => ({
      id: e.id, prenom: e.prenom, nom: e.nom, grade: e.grade,
      anneeNaissance: e.anneeNaissance, genre: e.genre,
      ...(e.binomePrenom ? { binomePrenom: e.binomePrenom, binomeNom: e.binomeNom } : {}),
    }))
  }
  const yamlStr = yaml.dump(data, { lineWidth: -1 })
  const blob = new Blob([yamlStr], { type: 'text/yaml' })
  const url = URL.createObjectURL(blob)
  const now = new Date()
  const dateStr = now.getFullYear().toString()
    + (now.getMonth() + 1).toString().padStart(2, '0')
    + now.getDate().toString().padStart(2, '0')
  const a = document.createElement('a')
  a.href = url
  a.download = `simsa-export-${dateStr}.yaml`
  a.click()
  URL.revokeObjectURL(url)
}

// Import YAML
function triggerImportYaml() {
  fileInput.value?.click()
}

async function onFileImport(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  try {
    const text = await file.text()
    const data = yaml.load(text) as Record<string, unknown>
    if (!data || !Array.isArray(data.epreuves)) throw new Error('invalid')
    // Clear existing data before import
    await studentsStore.clear()
    await notesStore.clear()
    configStore.epreuves = data.epreuves as Epreuve[]
    if (Array.isArray(data.dureesChrono)) {
      configStore.dureesChrono = data.dureesChrono as number[]
    }
    if (typeof data.elevesParLigne === 'number') {
      configStore.elevesParLigne = data.elevesParLigne as number
    }
    if (Array.isArray(data.eleves)) {
      for (const e of data.eleves as Eleve[]) {
        const student = studentsStore.add({ prenom: e.prenom, nom: e.nom, grade: e.grade, anneeNaissance: e.anneeNaissance, genre: e.genre, consentementRGPD: true, binomePrenom: e.binomePrenom, binomeNom: e.binomeNom })
        const { id: _, ...payloadData } = student
        const qr = await generateQRDataURL(buildInscriptionPayload(payloadData))
        studentsStore.setQR(student.id, qr)
      }
    }
    const toast = await toastController.create({
      message: t('config.importYamlSuccess'),
      duration: 2000,
      position: 'bottom',
      color: 'success',
    })
    await toast.present()
  } catch {
    const toast = await toastController.create({
      message: t('config.importYamlError'),
      duration: 2500,
      position: 'bottom',
      color: 'danger',
    })
    await toast.present()
  }
  input.value = ''
}
</script>

<style scoped>
.hidden-input {
  display: none;
}

.section-header-first {
  margin-top: 0;
}

.section-header {
  margin-top: 1.5rem;
}
</style>
