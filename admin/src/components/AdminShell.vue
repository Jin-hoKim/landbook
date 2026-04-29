<script setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const props = defineProps({
  active: { type: String, default: 'dashboard' },
  section: { type: String, default: '' },
  title: { type: String, default: '' },
})

const router = useRouter()
const auth = useAuthStore()

const navItems = [
  {
    id: 'dashboard',
    label: '대시보드',
    route: '/',
    icon: 'dashboard',
  },
  {
    id: 'reports',
    label: '리포트',
    route: '/reports',
    icon: 'reports',
  },
  {
    id: 'report-new',
    label: '리포트 등록',
    route: '/reports/new',
    icon: 'add',
  },
  {
    id: 'settings',
    label: '설정',
    route: '/settings',
    icon: 'settings',
  },
]

function handleLogout() {
  auth.logout()
  router.push('/login')
}
</script>

<template>
  <div class="flex h-screen overflow-hidden">
    <!-- 사이드바 -->
    <aside class="w-60 flex-shrink-0 flex flex-col" style="background: #1C1C1E;">
      <!-- 브랜딩 -->
      <div class="px-6 pt-8 pb-6">
        <h1
          class="text-lg font-semibold tracking-[0.4em]"
          style="font-family: 'Cormorant Garamond', serif; color: var(--accent-copper);"
        >
          LANDBOOK
        </h1>
        <p class="text-xs mt-1" style="color: rgba(255,255,255,0.4);">관리자 콘솔</p>
      </div>

      <!-- 네비게이션 -->
      <nav class="flex-1 px-3">
        <ul class="space-y-1">
          <li v-for="item in navItems" :key="item.id">
            <router-link
              :to="item.route"
              class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors"
              :class="active === item.id
                ? 'border-l-2 font-medium'
                : 'border-l-2 border-transparent hover:bg-white/5'"
              :style="active === item.id
                ? 'border-color: var(--accent-copper); background: var(--accent-copper-soft); color: var(--accent-copper);'
                : 'color: rgba(255,255,255,0.55);'"
            >
              <!-- 아이콘 (SVG) -->
              <svg
                v-if="item.icon === 'dashboard'"
                class="w-4 h-4 flex-shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"
              >
                <rect x="1" y="1" width="6" height="6" rx="1" />
                <rect x="9" y="1" width="6" height="6" rx="1" />
                <rect x="1" y="9" width="6" height="6" rx="1" />
                <rect x="9" y="9" width="6" height="6" rx="1" />
              </svg>
              <svg
                v-else-if="item.icon === 'reports'"
                class="w-4 h-4 flex-shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"
              >
                <rect x="2" y="1" width="12" height="14" rx="1.5" />
                <line x1="5" y1="5" x2="11" y2="5" />
                <line x1="5" y1="8" x2="11" y2="8" />
                <line x1="5" y1="11" x2="8" y2="11" />
              </svg>
              <svg
                v-else-if="item.icon === 'add'"
                class="w-4 h-4 flex-shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"
              >
                <rect x="2" y="1" width="12" height="14" rx="1.5" />
                <line x1="8" y1="5" x2="8" y2="11" />
                <line x1="5" y1="8" x2="11" y2="8" />
              </svg>
              <svg
                v-else-if="item.icon === 'settings'"
                class="w-4 h-4 flex-shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"
              >
                <circle cx="8" cy="8" r="2.5" />
                <path d="M8 1v2M8 13v2M1 8h2M13 8h2M2.93 2.93l1.41 1.41M11.66 11.66l1.41 1.41M13.07 2.93l-1.41 1.41M4.34 11.66l-1.41 1.41" />
              </svg>
              <span>{{ item.label }}</span>
            </router-link>
          </li>
        </ul>
      </nav>

      <!-- 하단 정보 -->
      <div class="px-6 py-5 border-t" style="border-color: rgba(255,255,255,0.08);">
        <p class="text-xs" style="color: rgba(255,255,255,0.35);">JWORKS · 진호님</p>
        <button
          class="text-xs mt-2 transition-colors cursor-pointer"
          style="color: rgba(255,255,255,0.4);"
          @mouseenter="$event.target.style.color = 'var(--accent-copper)'"
          @mouseleave="$event.target.style.color = 'rgba(255,255,255,0.4)'"
          @click="handleLogout"
        >
          로그아웃 →
        </button>
      </div>
    </aside>

    <!-- 메인 영역 -->
    <div class="flex-1 flex flex-col overflow-hidden">
      <!-- 탑바 -->
      <header
        class="h-16 flex items-center justify-between px-8 flex-shrink-0 border-b"
        style="background: var(--admin-surface); border-color: var(--admin-border);"
      >
        <div>
          <p
            v-if="section"
            class="text-xs font-medium uppercase tracking-wider"
            style="color: var(--admin-text-subtle);"
          >
            {{ section }}
          </p>
          <h2 class="text-lg font-semibold" style="color: var(--admin-text);">
            {{ title }}
          </h2>
        </div>
        <div class="flex items-center gap-3">
          <slot name="actions" />
        </div>
      </header>

      <!-- 콘텐츠 -->
      <main class="flex-1 overflow-auto p-8">
        <slot />
      </main>
    </div>
  </div>
</template>
