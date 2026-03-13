<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/master" :text="t('common.back')"></ion-back-button>
        </ion-buttons>
        <ion-title>{{ t('session.students') }} ({{ studentsStore.eleves.length }})</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div v-if="studentsStore.eleves.length === 0" class="empty ion-padding">
        <p>{{ t('session.noStudents') }}</p>
      </div>

      <div v-for="group in sortedGroups" :key="group.grade">
        <ion-list-header>
          <ion-label>
            {{ t(`grades.${group.grade}`) }}
            ({{ group.entries.reduce((n, e) => n + e.students.length, 0) }})
          </ion-label>
        </ion-list-header>

        <ion-list inset>
          <template v-for="(entry, idx) in group.entries" :key="idx">
            <ion-item-group>
              <ion-item v-for="student in entry.students" :key="student.id">
                <ion-label>
                  <h2>
                    <strong>#{{ student.id }}</strong>
                    {{ student.prenom }} {{ student.nom }}
                  </h2>
                  <p>{{ student.anneeNaissance }} · {{ t(`genres.${student.genre}`) }}</p>
                </ion-label>
                <ion-badge
                  slot="end"
                  :color="entry.students.length === 2 ? 'primary' : 'medium'"
                >
                  {{ entry.students.length === 2 ? t('session.pair') : t('session.solo') }}
                </ion-badge>
                <ion-button slot="end" fill="clear" @click="editStudent(student.id)">
                  <ion-icon :icon="createOutline" slot="icon-only" />
                </ion-button>
                <ion-button slot="end" fill="clear" color="danger" @click="removeStudent(student.id)">
                  <ion-icon :icon="trashOutline" slot="icon-only" />
                </ion-button>
              </ion-item>
            </ion-item-group>
          </template>
        </ion-list>
      </div>

      <!-- Unmatched partner requests -->
      <div v-if="unmatched.length > 0" class="ion-padding">
        <ion-card color="warning">
          <ion-card-header>
            <ion-card-title>{{ t('session.unmatchedTitle') }}</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <p v-for="s in unmatched" :key="s.id">
              {{ s.prenom }} {{ s.nom }} → {{ s.binomePrenom }} {{ s.binomeNom }}
            </p>
          </ion-card-content>
        </ion-card>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonButtons, IonBackButton, IonButton, IonIcon,
  IonList, IonListHeader, IonItem, IonItemGroup, IonLabel, IonBadge,
  IonCard, IonCardHeader, IonCardTitle, IonCardContent,
} from '@ionic/vue'
import { createOutline, trashOutline } from 'ionicons/icons'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useStudentsStore } from '@/stores/students'

import { sortStudents, findUnmatchedRequests } from '@/utils/sort'

const { t } = useI18n()
const router = useRouter()
const studentsStore = useStudentsStore()

const sortedGroups = computed(() => sortStudents(studentsStore.eleves))
const unmatched = computed(() => findUnmatchedRequests(studentsStore.eleves))

function editStudent(id: number) {
  router.push({ path: '/student/register', query: { edit: String(id) } })
}

function removeStudent(id: number) {
  studentsStore.remove(id)
}
</script>

<style scoped>
.empty {
  text-align: center;
  color: var(--ion-color-medium);
  margin-top: 2rem;
}
</style>
