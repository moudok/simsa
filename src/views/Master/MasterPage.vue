<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/" :text="t('common.back')"></ion-back-button>
        </ion-buttons>
        <ion-title>{{ t('maitre.title') }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <div>
        <ion-list>
          <ion-item button router-link="/master/students" detail>
            <ion-icon :icon="peopleOutline" slot="start" />
            <ion-label>
              <h2>{{ t('session.students') }}</h2>
            </ion-label>
          </ion-item>

          <ion-item button router-link="/master/share" detail>
            <ion-icon :icon="shareOutline" slot="start" />
            <ion-label>
              <h2>{{ t('session.share') }}</h2>
            </ion-label>
          </ion-item>

          <ion-item button router-link="/parameters" detail>
            <ion-icon :icon="settingsOutline" slot="start" />
            <ion-label>
              <h2>{{ t('config.title') }}</h2>
            </ion-label>
          </ion-item>
        </ion-list>

        <ion-button expand="block" size="large" color="primary" router-link="/master/notation" class="start-btn">
          {{ t('session.start') }}
        </ion-button>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonButtons, IonBackButton, IonButton, IonIcon,
  IonList, IonItem, IonLabel,
} from '@ionic/vue'
import { settingsOutline, peopleOutline, shareOutline } from 'ionicons/icons'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<style scoped>
.start-btn {
  margin-top: 1.5rem;
}
</style>
