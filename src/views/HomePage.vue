<template>
  <ion-page>
    <ion-content class="ion-padding">
      <div class="home-container">
        <div class="home-header">
          <img src="/simsa.svg" alt="Simsa" class="home-logo" />
          <div class="home-header-text">
            <h1>{{ t('app.name') }}</h1>
            <p>{{ t('app.subtitle') }}</p>
          </div>
        </div>

        <div class="role-buttons">
          <ion-button expand="block" size="large" class="btn-eleve" @click="selectRole('eleve')">
            <div class="btn-row">
              <ion-icon :icon="peopleOutline" class="btn-icon" />
              <div class="btn-text">
                <strong>{{ t('roles.eleve') }}</strong>
                <span>{{ t('roles.eleveDesc') }}</span>
              </div>
            </div>
          </ion-button>

          <ion-button expand="block" size="large" class="btn-maitre" @click="selectRole('maitre')">
            <div class="btn-row">
              <ion-icon :icon="clipboardOutline" class="btn-icon" />
              <div class="btn-text">
                <strong>{{ t('roles.maitre') }}</strong>
                <span>{{ t('roles.maitreDesc') }}</span>
              </div>
            </div>
          </ion-button>

          <ion-button expand="block" size="large" class="btn-results" router-link="/master/results">
            <div class="btn-row">
              <ion-icon :icon="podiumOutline" class="btn-icon" />
              <div class="btn-text">
                <strong>{{ t('results.title') }}</strong>
                <span>{{ t('results.desc') }}</span>
              </div>
            </div>
          </ion-button>

          <ion-button expand="block" size="large" class="btn-exchange" router-link="/data-exchange">
            <div class="btn-row">
              <ion-icon :icon="swapHorizontalOutline" class="btn-icon" />
              <div class="btn-text">
                <strong>{{ t('exchange.title') }}</strong>
                <span>{{ t('exchange.desc') }}</span>
              </div>
            </div>
          </ion-button>

          <ion-button expand="block" size="large" class="btn-params" router-link="/parameters">
            <div class="btn-row">
              <ion-icon :icon="settingsOutline" class="btn-icon" />
              <div class="btn-text">
                <strong>{{ t('config.title') }}</strong>
              </div>
            </div>
          </ion-button>
        </div>

        <LanguageSwitcher />

        <router-link to="/manual" class="manual-link">{{ t('manual.link') }}</router-link>

        <p class="version">v{{ APP_VERSION }}</p>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonPage, IonContent, IonButton, IonIcon } from '@ionic/vue'
import { settingsOutline, peopleOutline, clipboardOutline, podiumOutline, swapHorizontalOutline } from 'ionicons/icons'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useUiStore } from '@/stores/ui'
import type { Role } from '@/types'
import LanguageSwitcher from '@/components/LanguageSwitcher.vue'
import { APP_VERSION } from '@/utils/version'

const { t } = useI18n()
const router = useRouter()
const uiStore = useUiStore()

const roleRoutes: Record<Role, string> = {
  eleve: '/student',
  maitre: '/master/notation',
}

function selectRole(role: Role) {
  uiStore.setRole(role)
  router.push(roleRoutes[role])
}
</script>

<style scoped>
.home-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100%;
  gap: 0.5rem;
  text-align: center;
  max-width: 400px;
  margin: 0 auto;
}

.home-header {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 1rem;
  color: #222;
  padding: 0.25rem 1.5rem;
  width: 100%;
}

.home-header-text {
  text-align: left;
}

.home-header-text h1 {
  margin: 0;
}

.home-header-text p {
  margin: 0;
  font-size: 0.8rem;
  white-space: nowrap;
}

.home-logo {
  width: 64px;
  height: 64px;
}

.role-buttons {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.role-buttons ion-button {
  --border-radius: 1rem;
}

.btn-eleve,
.btn-maitre,
.btn-results,
.btn-exchange {
  --background: #6f6f91;
  --color: #fff;
}

.btn-params {
  --background: #dbdbe3;
  --color: #444;
}

.btn-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.25rem 0;
}

.btn-icon {
  font-size: 1.6rem;
  flex-shrink: 0;
}

.btn-text {
  display: flex;
  flex-direction: column;
  text-align: left;
}

.btn-text strong {
  font-size: 1.2rem;
}

.btn-text span {
  font-size: 0.85rem;
  opacity: 0.8;
}

.manual-link {
  font-size: 0.9rem;
  color: var(--ion-color-primary, #3880ff);
  text-decoration: none;
}

.manual-link:hover {
  text-decoration: underline;
}

.version {
  font-size: 0.75rem;
  opacity: 0.5;
  margin: -0.25rem 0 0;
}
</style>
