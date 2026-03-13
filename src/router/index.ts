import { createRouter, createWebHistory } from '@ionic/vue-router'
import type { RouteRecordRaw } from 'vue-router'
import HomePage from '@/views/HomePage.vue'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: HomePage,
  },
  {
    path: '/student',
    component: () => import('@/views/Student/StudentPage.vue'),
  },
  {
    path: '/student/register',
    component: () => import('@/views/Student/RegisterPage.vue'),
  },
  {
    path: '/master',
    component: () => import('@/views/Master/MasterPage.vue'),
  },
  {
    path: '/master/students',
    component: () => import('@/views/Master/StudentsPage.vue'),
  },
  {
    path: '/master/share',
    component: () => import('@/views/Master/SharePage.vue'),
  },
  {
    path: '/master/notation',
    component: () => import('@/views/Master/NotationPage.vue'),
  },
  {
    path: '/master/results',
    component: () => import('@/views/Master/ResultsPage.vue'),
  },
  {
    path: '/parameters',
    component: () => import('@/views/Master/ParametersPage.vue'),
  },
  {
    path: '/data-exchange',
    component: () => import('@/views/DataExchangePage.vue'),
  },
  {
    path: '/data-exchange/scan',
    component: () => import('@/views/DataExchange/ScanQRPage.vue'),
  },
  {
    path: '/data-exchange/qr',
    component: () => import('@/views/Parameters/ExportQRPage.vue'),
  },
  {
    path: '/data-exchange/students-qr',
    component: () => import('@/views/DataExchange/ExportStudentsQRPage.vue'),
  },
  {
    path: '/data-exchange/results-qr',
    component: () => import('@/views/DataExchange/ExportResultsQRPage.vue'),
  },
  {
    path: '/manual',
    component: () => import('@/views/ManualPage.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

export default router
