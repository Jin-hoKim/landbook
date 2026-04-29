<script setup>
import { ref } from 'vue'
import AdminShell from '../components/AdminShell.vue'

// 읽기 전용 설정값 (마스킹)
const sections = ref([
  {
    id: 'sms',
    title: 'Aligo SMS API',
    description: '알리고 SMS API 설정입니다. 변경은 서버의 .env 파일을 수정해주세요.',
    fields: [
      { label: 'API 키', key: 'ALIGO_API_KEY', masked: true },
      { label: '사용자 ID', key: 'ALIGO_USER_ID', masked: true },
      { label: '발신번호', key: 'ALIGO_SENDER', masked: false },
    ],
  },
  {
    id: 'email',
    title: 'Email SMTP',
    description: '이메일 SMTP 설정입니다. 변경은 서버의 .env 파일을 수정해주세요.',
    fields: [
      { label: '호스트', key: 'SMTP_HOST', masked: false },
      { label: '포트', key: 'SMTP_PORT', masked: false },
      { label: '계정', key: 'SMTP_USER', masked: true },
      { label: '비밀번호', key: 'SMTP_PASS', masked: true },
    ],
  },
  {
    id: 'kakao',
    title: 'Kakao JavaScript Key',
    description: '카카오 JavaScript 키 설정입니다. 변경은 서버의 .env 파일을 수정해주세요.',
    fields: [
      { label: 'JavaScript 키', key: 'KAKAO_JS_KEY', masked: true },
    ],
  },
])

// 비밀번호 변경 (현재는 .env 안내)
const passwordSection = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
})

function maskValue(key) {
  // 실제 환경에서는 서버에서 마스킹된 값을 받아옴
  // 현재는 플레이스홀더 표시
  const placeholders = {
    ALIGO_API_KEY: '****-****-****-****',
    ALIGO_USER_ID: 'j****s',
    ALIGO_SENDER: '02-****-****',
    SMTP_HOST: 'smtp.*****.com',
    SMTP_PORT: '587',
    SMTP_USER: 'admin@*****.com',
    SMTP_PASS: '********',
    KAKAO_JS_KEY: '****************************',
  }
  return placeholders[key] || '****'
}
</script>

<template>
  <AdminShell active="settings" section="System" title="설정">
    <div class="space-y-6 max-w-3xl">
      <!-- API 설정 섹션들 -->
      <div
        v-for="section in sections"
        :key="section.id"
        class="rounded-lg"
        style="background: var(--admin-surface); border: 1px solid var(--admin-border);"
      >
        <!-- 섹션 헤더 -->
        <div class="px-6 py-4 border-b" style="border-color: var(--admin-border);">
          <h3
            class="uppercase"
            style="font-size: 11px; letter-spacing: 0.2em; font-family: 'Cormorant Garamond', serif; color: var(--admin-text-subtle);"
          >
            {{ section.title }}
          </h3>
        </div>

        <!-- 섹션 내용 -->
        <div class="px-6 py-5 space-y-4">
          <!-- 안내 문구 -->
          <div
            class="flex items-start gap-2 px-3 py-2.5 rounded-md"
            style="background: var(--accent-copper-soft); border: 1px solid rgba(196,125,74,0.15);"
          >
            <svg
              class="w-4 h-4 flex-shrink-0 mt-0.5"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              style="color: var(--accent-copper);"
            >
              <circle cx="8" cy="8" r="6.5" />
              <line x1="8" y1="5" x2="8" y2="8.5" />
              <circle cx="8" cy="11" r="0.5" fill="currentColor" />
            </svg>
            <p class="text-xs" style="color: var(--accent-copper);">
              {{ section.description }}
            </p>
          </div>

          <!-- 필드 목록 -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div v-for="field in section.fields" :key="field.key">
              <label
                class="block text-xs mb-1.5"
                style="color: var(--admin-text-subtle);"
              >
                {{ field.label }}
              </label>
              <div class="relative">
                <input
                  :value="maskValue(field.key)"
                  readonly
                  class="w-full px-3 py-2 rounded-md text-sm cursor-default"
                  :style="{
                    background: 'var(--admin-surface-muted)',
                    border: '1px solid var(--admin-border)',
                    color: field.masked ? 'var(--admin-text-subtle)' : 'var(--admin-text-muted)',
                    fontFamily: field.masked ? 'monospace' : 'inherit',
                  }"
                />
                <span
                  v-if="field.masked"
                  class="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <svg
                    class="w-3.5 h-3.5"
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.5"
                    style="color: var(--admin-text-subtle);"
                  >
                    <path d="M2 2l12 12" />
                    <path d="M1 8s3-5.5 7-5.5c1.2 0 2.3.4 3.2 1M15 8s-3 5.5-7 5.5c-1.2 0-2.3-.4-3.2-1" />
                  </svg>
                </span>
              </div>
            </div>
          </div>

          <!-- .env 파일 경로 안내 -->
          <p class="text-xs font-mono" style="color: var(--admin-text-subtle);">
            설정 파일: <span style="color: var(--admin-text-muted);">backend/.env</span>
          </p>
        </div>
      </div>

      <!-- 비밀번호 변경 섹션 -->
      <div
        class="rounded-lg"
        style="background: var(--admin-surface); border: 1px solid var(--admin-border);"
      >
        <div class="px-6 py-4 border-b" style="border-color: var(--admin-border);">
          <h3
            class="uppercase"
            style="font-size: 11px; letter-spacing: 0.2em; font-family: 'Cormorant Garamond', serif; color: var(--admin-text-subtle);"
          >
            Password
          </h3>
        </div>

        <div class="px-6 py-5 space-y-4">
          <!-- 안내 문구 -->
          <div
            class="flex items-start gap-2 px-3 py-2.5 rounded-md"
            style="background: var(--accent-copper-soft); border: 1px solid rgba(196,125,74,0.15);"
          >
            <svg
              class="w-4 h-4 flex-shrink-0 mt-0.5"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              style="color: var(--accent-copper);"
            >
              <circle cx="8" cy="8" r="6.5" />
              <line x1="8" y1="5" x2="8" y2="8.5" />
              <circle cx="8" cy="11" r="0.5" fill="currentColor" />
            </svg>
            <p class="text-xs" style="color: var(--accent-copper);">
              관리자 비밀번호 변경은 서버의 .env 파일에서 ADMIN_PASSWORD 값을 수정해주세요.
            </p>
          </div>

          <!-- 필드 (읽기 전용 스타일) -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs mb-1.5" style="color: var(--admin-text-subtle);">현재 비밀번호</label>
              <input
                v-model="passwordSection.currentPassword"
                type="password"
                placeholder="현재 비밀번호"
                disabled
                class="w-full px-3 py-2 rounded-md text-sm cursor-not-allowed"
                style="background: var(--admin-surface-muted); border: 1px solid var(--admin-border); color: var(--admin-text-subtle); opacity: 0.6;"
              />
            </div>
            <div>
              <label class="block text-xs mb-1.5" style="color: var(--admin-text-subtle);">새 비밀번호</label>
              <input
                v-model="passwordSection.newPassword"
                type="password"
                placeholder="새 비밀번호"
                disabled
                class="w-full px-3 py-2 rounded-md text-sm cursor-not-allowed"
                style="background: var(--admin-surface-muted); border: 1px solid var(--admin-border); color: var(--admin-text-subtle); opacity: 0.6;"
              />
            </div>
          </div>

          <p class="text-xs font-mono" style="color: var(--admin-text-subtle);">
            설정 파일: <span style="color: var(--admin-text-muted);">backend/.env</span> &rarr; <span style="color: var(--admin-text-muted);">ADMIN_PASSWORD</span>
          </p>
        </div>
      </div>
    </div>
  </AdminShell>
</template>
