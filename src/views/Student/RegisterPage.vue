<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/student" :text="t('common.back')"></ion-back-button>
        </ion-buttons>
        <ion-title>{{ editingId !== null ? t('eleve.editTitle') : t('eleve.title') }} ({{ studentsStore.eleves.length }})</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="activeTab = 'form'">
            <ion-icon slot="icon-only" :icon="addOutline" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>

      <!-- Tabs: + form, then one tab per student -->
      <div v-if="studentsStore.eleves.length > 0" class="tabs-bar">
        <button
          class="tab-btn"
          :class="{ active: activeTab === 'form' }"
          @click="activeTab = 'form'"
        >
          +
        </button>
        <button
          v-for="eleve in studentsStore.eleves"
          :key="eleve.id"
          class="tab-btn"
          :class="{ active: activeTab === eleve.id }"
          @click="activeTab = eleve.id"
        >
          {{ eleve.prenom }}
        </button>
      </div>
    </ion-header>

    <ion-content class="ion-padding">

      <!-- Registration form -->
      <div v-if="activeTab === 'form'">
        <ion-list>
          <ion-item>
            <ion-input
              v-model="form.prenom"
              :label="t('eleve.prenom')"
              label-placement="stacked"
              autocapitalize="words"
            />
          </ion-item>
          <ion-item>
            <ion-input
              v-model="form.nom"
              :label="t('eleve.nom')"
              label-placement="stacked"
              autocapitalize="words"
            />
          </ion-item>
          <ion-item>
            <ion-select
              v-model="form.grade"
              :label="t('eleve.grade')"
              label-placement="stacked"
              interface="action-sheet"
            >
              <ion-select-option v-for="grade in GRADE_ORDER" :key="grade" :value="grade">
                {{ t(`grades.${grade}`) }}
              </ion-select-option>
            </ion-select>
          </ion-item>
          <ion-item>
            <ion-input
              v-model.number="form.anneeNaissance"
              :label="t('eleve.anneeNaissance')"
              label-placement="stacked"
              type="number"
              inputmode="numeric"
              min="1900"
              step="1"
            />
          </ion-item>
          <ion-item>
            <ion-select
              v-model="form.genre"
              :label="t('eleve.genre')"
              label-placement="stacked"
              interface="action-sheet"
            >
              <ion-select-option value="homme">{{ t('genres.homme') }}</ion-select-option>
              <ion-select-option value="femme">{{ t('genres.femme') }}</ion-select-option>
              <ion-select-option value="autre">{{ t('genres.autre') }}</ion-select-option>
              <ion-select-option value="non_renseigne">{{ t('genres.non_renseigne') }}</ion-select-option>
            </ion-select>
          </ion-item>
          <ion-item>
            <ion-input
              v-model="form.binomePrenom"
              :label="t('eleve.binomePrenom')"
              label-placement="stacked"
              autocapitalize="words"
            />
          </ion-item>
          <ion-item v-if="form.binomePrenom">
            <ion-input
              v-model="form.binomeNom"
              :label="t('eleve.binomeNom')"
              label-placement="stacked"
              autocapitalize="words"
            />
          </ion-item>
        </ion-list>

        <div class="rgpd-section">
          <p class="rgpd-text">{{ t('eleve.rgpdText') }}</p>
        </div>

        <ion-button expand="block" @click="submit" :disabled="!isValid" class="submit-btn">
          {{ editingId !== null ? t('common.save') : t('eleve.submit') }}
        </ion-button>
        <ion-button v-if="editingId !== null" expand="block" fill="outline" @click="cancelEdit" class="submit-btn">
          {{ t('common.cancel') }}
        </ion-button>
      </div>

      <!-- Student detail view -->
      <div v-else-if="activeEleve" class="student-detail">
        <div
          class="detail-swipe"
          @touchstart="onTouchStart"
          @touchend="onTouchEnd"
        >
          <!-- QR code -->
          <div v-if="activeQR" class="qr-display">
            <h2>{{ t('eleve.qrTitle') }}</h2>
            <img :src="activeQR" alt="QR Code" class="qr-image" />
          </div>

          <p class="student-summary">
            <strong>{{ activeEleve.prenom }} {{ activeEleve.nom }}</strong><br />
            {{ t(`grades.${activeEleve.grade}`) }} · {{ activeEleve.anneeNaissance }} · {{ t(`genres.${activeEleve.genre}`) }}
          </p>
          <p v-if="activeEleve.binomePrenom" class="student-summary">
            {{ t('eleve.binome') }} : {{ activeEleve.binomePrenom }} {{ activeEleve.binomeNom }}
          </p>
          <p class="student-counter">{{ activeIndex + 1 }} / {{ studentsStore.eleves.length }}</p>
        </div>

        <div class="detail-actions">
          <ion-button expand="block" fill="outline" @click="editCurrentStudent">
            {{ t('eleve.edit') }}
          </ion-button>
          <ion-button expand="block" fill="outline" color="danger" @click="deleteCurrentStudent">
            {{ t('eleve.deleteQR') }}
          </ion-button>
        </div>
      </div>

    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonButtons, IonBackButton, IonButton, IonIcon,
  IonList, IonItem, IonInput, IonSelect, IonSelectOption,
  alertController, toastController,
} from '@ionic/vue'
import { addOutline } from 'ionicons/icons'
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import type { Grade, Genre, ElevePayload } from '@/types'
import { GRADE_ORDER } from '@/types'
import { generateQRDataURL, buildInscriptionPayload } from '@/composables/useQR'
import { useStudentsStore } from '@/stores/students'

const { t } = useI18n()
const route = useRoute()
const studentsStore = useStudentsStore()

const activeTab = ref<'form' | number>('form')
const editingId = ref<number | null>(null)

const activeEleve = computed(() => {
  if (activeTab.value === 'form') return null
  return studentsStore.getById(activeTab.value as number) ?? null
})

const activeIndex = computed(() => {
  if (!activeEleve.value) return -1
  return studentsStore.eleves.findIndex(e => e.id === activeEleve.value!.id)
})

// Generate QR on the fly when active student changes
const activeQR = ref<string | null>(null)

watch(activeEleve, async (eleve) => {
  if (!eleve) { activeQR.value = null; return }
  const { id: _, ...data } = eleve
  activeQR.value = await generateQRDataURL(buildInscriptionPayload(data))
}, { immediate: true })

const form = reactive({
  prenom: '',
  nom: '',
  grade: '' as Grade | '',
  anneeNaissance: null as number | null,
  genre: '' as Genre | '',
  binomePrenom: '',
  binomeNom: '',
})

const isValid = computed(() => {
  if (!form.prenom.trim()) return false
  if (!form.nom.trim()) return false
  if (!form.grade) return false
  if (!form.anneeNaissance || form.anneeNaissance < 1900 || form.anneeNaissance > new Date().getFullYear()) return false
  if (!form.genre) return false
  if (form.binomePrenom.trim() && !form.binomeNom.trim()) return false
  return true
})

async function submit() {
  if (!isValid.value) return

  const data: ElevePayload = {
    prenom: form.prenom.trim(),
    nom: form.nom.trim(),
    grade: form.grade as Grade,
    anneeNaissance: Math.floor(form.anneeNaissance!),
    genre: form.genre as Genre,
    consentementRGPD: true,
  }

  if (form.binomePrenom.trim()) {
    data.binomePrenom = form.binomePrenom.trim()
    data.binomeNom = form.binomeNom.trim()
  }

  if (editingId.value !== null) {
    // Update existing student
    studentsStore.update({ ...data, id: editingId.value })
    activeTab.value = editingId.value
    editingId.value = null
    const toast = await toastController.create({
      message: t('eleve.editSuccess'),
      duration: 2000, position: 'bottom', color: 'success',
    })
    await toast.present()
  } else {
    // Create new student
    const newEleve = studentsStore.add(data)
    activeTab.value = newEleve.id
  }

  form.prenom = ''
  form.nom = ''
  form.grade = ''
  form.anneeNaissance = null
  form.genre = ''
  form.binomePrenom = ''
  form.binomeNom = ''
}

function editCurrentStudent() {
  if (!activeEleve.value) return
  const e = activeEleve.value
  editingId.value = e.id
  form.prenom = e.prenom
  form.nom = e.nom
  form.grade = e.grade
  form.anneeNaissance = e.anneeNaissance
  form.genre = e.genre
  form.binomePrenom = e.binomePrenom ?? ''
  form.binomeNom = e.binomeNom ?? ''
  activeTab.value = 'form'
}

function cancelEdit() {
  editingId.value = null
  form.prenom = ''
  form.nom = ''
  form.grade = ''
  form.anneeNaissance = null
  form.genre = ''
  form.binomePrenom = ''
  form.binomeNom = ''
}

async function deleteCurrentStudent() {
  if (!activeEleve.value) return
  const eleve = activeEleve.value
  const alert = await alertController.create({
    header: t('eleve.deleteQR'),
    message: `${eleve.prenom} ${eleve.nom}`,
    buttons: [
      { text: t('common.cancel'), role: 'cancel' },
      {
        text: t('common.confirm'),
        role: 'destructive',
        handler: () => {
          const idx = activeIndex.value
          studentsStore.remove(eleve.id)
          if (studentsStore.eleves.length === 0) {
            activeTab.value = 'form'
          } else if (idx >= studentsStore.eleves.length) {
            activeTab.value = studentsStore.eleves[studentsStore.eleves.length - 1].id
          } else {
            activeTab.value = studentsStore.eleves[idx].id
          }
        },
      },
    ],
  })
  await alert.present()
}

// Open edit mode if navigated with ?edit=id
onMounted(() => {
  const editId = route.query.edit
  if (editId) {
    const eleve = studentsStore.getById(Number(editId))
    if (eleve) {
      editingId.value = eleve.id
      form.prenom = eleve.prenom
      form.nom = eleve.nom
      form.grade = eleve.grade
      form.anneeNaissance = eleve.anneeNaissance
      form.genre = eleve.genre
      form.binomePrenom = eleve.binomePrenom ?? ''
      form.binomeNom = eleve.binomeNom ?? ''
      activeTab.value = 'form'
    }
  }
})

// Swipe between students
let touchStartX = 0

function onTouchStart(e: TouchEvent) {
  touchStartX = e.changedTouches[0].clientX
}

function onTouchEnd(e: TouchEvent) {
  const idx = activeIndex.value
  if (idx < 0) return
  const dx = e.changedTouches[0].clientX - touchStartX
  if (Math.abs(dx) < 50) return
  if (dx < 0 && idx < studentsStore.eleves.length - 1) {
    activeTab.value = studentsStore.eleves[idx + 1].id
  } else if (dx > 0 && idx > 0) {
    activeTab.value = studentsStore.eleves[idx - 1].id
  }
}
</script>

<style scoped>
.tabs-bar {
  display: flex;
  gap: 0;
  overflow-x: auto;
  background: var(--ion-color-light, #f4f4f4);
  border-bottom: 1px solid var(--ion-color-medium, #ccc);
}

.tab-btn {
  flex-shrink: 0;
  padding: 8px 16px;
  border: none;
  background: transparent;
  font-size: 0.9rem;
  color: var(--ion-color-medium);
  cursor: pointer;
  border-bottom: 2px solid transparent;
}

.tab-btn.active {
  color: var(--ion-color-primary);
  border-bottom-color: var(--ion-color-primary);
  font-weight: 600;
}

.rgpd-section {
  margin: 1rem 0;
}

.rgpd-text {
  font-size: 0.8rem;
  color: var(--ion-color-medium);
  line-height: 1.4;
  padding: 0 1rem;
}

.submit-btn {
  margin-top: 1rem;
}

.student-detail {
  height: 100%;
}

.detail-swipe {
  touch-action: pan-y;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 0.4rem;
  padding: 0.5rem 0;
}

.qr-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
}

.qr-display h2 {
  margin: 0;
  font-size: 1.1rem;
}

.qr-image {
  width: 280px;
  height: 280px;
}

.student-summary {
  font-size: 1.1rem;
  line-height: 1.4;
  margin: 0;
}

.student-counter {
  font-size: 0.85rem;
  color: var(--ion-color-medium);
  margin: 0;
}

.detail-actions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
</style>
