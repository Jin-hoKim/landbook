import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const routes = [
  {
    path: '/login',
    name: 'login',
    component: () => import('../views/LoginView.vue'),
    meta: { requiresAuth: false },
  },
  {
    path: '/',
    name: 'dashboard',
    component: () => import('../views/DashboardView.vue'),
  },
  {
    path: '/reports',
    name: 'reports',
    component: () => import('../views/ReportsView.vue'),
  },
  {
    path: '/reports/new',
    name: 'report-new',
    component: () => import('../views/ReportNewView.vue'),
  },
  {
    path: '/reports/:id',
    name: 'report-detail',
    component: () => import('../views/ReportDetailView.vue'),
  },
  {
    path: '/settings',
    name: 'settings',
    component: () => import('../views/SettingsView.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// 네비게이션 가드: 토큰 없으면 /login으로 리다이렉트
router.beforeEach((to) => {
  const auth = useAuthStore()

  if (to.meta.requiresAuth === false) {
    // 이미 로그인 상태면 대시보드로
    if (to.name === 'login' && auth.isLoggedIn) {
      return { name: 'dashboard' }
    }
    return true
  }

  if (!auth.isLoggedIn) {
    return { name: 'login' }
  }

  return true
})

export default router
