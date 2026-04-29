<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const auth = useAuthStore()

const password = ref('')
const error = ref('')
const loading = ref(false)

async function handleLogin() {
  if (!password.value.trim()) {
    error.value = '비밀번호를 입력해주세요.'
    return
  }

  loading.value = true
  error.value = ''

  try {
    await auth.login(password.value)
    router.push('/')
  } catch (err) {
    error.value = err.response?.data?.message || '로그인에 실패했습니다.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center" style="background: var(--admin-bg);">
    <div
      class="w-full max-w-sm rounded-2xl p-10 shadow-sm border"
      style="background: var(--admin-surface); border-color: var(--admin-border);"
    >
      <!-- 브랜딩 -->
      <div class="text-center mb-10">
        <h1
          class="text-2xl font-semibold tracking-[0.4em]"
          style="font-family: 'Cormorant Garamond', serif; color: var(--accent-copper);"
        >
          LANDBOOK
        </h1>
        <p class="text-xs mt-2" style="color: var(--admin-text-subtle);">관리자 로그인</p>
      </div>

      <!-- 로그인 폼 -->
      <form @submit.prevent="handleLogin">
        <div class="mb-6">
          <label
            for="password"
            class="block text-xs font-medium mb-2"
            style="color: var(--admin-text-muted);"
          >
            비밀번호
          </label>
          <input
            id="password"
            v-model="password"
            type="password"
            placeholder="관리자 비밀번호 입력"
            class="w-full px-4 py-3 rounded-lg text-sm border outline-none transition-colors"
            style="
              background: var(--admin-surface-muted);
              border-color: var(--admin-border-strong);
              color: var(--admin-text);
            "
            @focus="$event.target.style.borderColor = 'var(--accent-copper)'"
            @blur="$event.target.style.borderColor = 'var(--admin-border-strong)'"
          />
        </div>

        <!-- 에러 메시지 -->
        <p
          v-if="error"
          class="text-xs mb-4 text-red-500"
        >
          {{ error }}
        </p>

        <button
          type="submit"
          :disabled="loading"
          class="w-full py-3 rounded-lg text-sm font-medium text-white transition-opacity cursor-pointer disabled:opacity-50"
          style="background: var(--accent-copper);"
        >
          {{ loading ? '로그인 중...' : '로그인' }}
        </button>
      </form>
    </div>
  </div>
</template>
