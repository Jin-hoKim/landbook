<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AdminShell from '../components/AdminShell.vue'
import SharePanel from '../components/SharePanel.vue'
import api from '../api'

const route = useRoute()
const router = useRouter()

const report = ref(null)
const loading = ref(true)
const saving = ref(false)
const error = ref('')
const successMsg = ref('')

// 편집 상태
const editing = ref(false)
const editForm = ref({ title: '', description: '', address: '' })

// 통계
const stats = ref({ views: 0, pdfDownloads: 0, shares: 0 })

const viewerUrl = computed(() => {
  if (!report.value) return ''
  return `https://landbook.jworks.world/r/${report.value.token}`
})

async function fetchReport() {
  loading.value = true
  error.value = ''
  try {
    const { data } = await api.get(`/reports/${route.params.id}`)
    report.value = data
    stats.value = data.stats || { views: 0, pdfDownloads: 0, shares: 0 }
  } catch (err) {
    error.value = '리포트를 불러올 수 없습니다.'
  } finally {
    loading.value = false
  }
}

function startEdit() {
  editForm.value = {
    title: report.value.title,
    description: report.value.description || '',
    address: report.value.address,
  }
  editing.value = true
}

function cancelEdit() {
  editing.value = false
}

async function saveEdit() {
  saving.value = true
  try {
    const { data } = await api.put(`/reports/${route.params.id}`, editForm.value)
    report.value = data
    editing.value = false
    showSuccess('저장되었습니다.')
  } catch (err) {
    error.value = '저장에 실패했습니다.'
  } finally {
    saving.value = false
  }
}

async function toggleActive() {
  saving.value = true
  try {
    const { data } = await api.put(`/reports/${route.params.id}`, {
      isActive: !report.value.isActive,
    })
    report.value = data
    showSuccess(data.isActive ? '활성화되었습니다.' : '비활성화되었습니다.')
  } catch (err) {
    error.value = '상태 변경에 실패했습니다.'
  } finally {
    saving.value = false
  }
}

function openViewer() {
  window.open(viewerUrl.value, '_blank')
}

function showSuccess(msg) {
  successMsg.value = msg
  setTimeout(() => { successMsg.value = '' }, 3000)
}

function formatDate(dateStr) {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function shareTypeLabel(type) {
  const labels = { sms: 'SMS', email: '이메일', kakao: '카카오', link: '링크' }
  return labels[type] || type
}

function shareTypeColor(type) {
  const colors = {
    sms: '#34C759',
    email: '#007AFF',
    kakao: '#FEE500',
    link: '#C47D4A',
  }
  return colors[type] || '#9A9A9E'
}

onMounted(fetchReport)
</script>

<template>
  <AdminShell active="reports" section="Management" title="리포트 상세">
    <template #actions>
      <button
        v-if="report"
        class="px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer"
        style="border: 1px solid var(--admin-border-strong); color: var(--admin-text-muted);"
        @mouseenter="$event.target.style.borderColor = 'var(--accent-copper)'; $event.target.style.color = 'var(--accent-copper)'"
        @mouseleave="$event.target.style.borderColor = 'var(--admin-border-strong)'; $event.target.style.color = 'var(--admin-text-muted)'"
        @click="router.push('/reports')"
      >
        목록으로
      </button>
    </template>

    <!-- 로딩 -->
    <div v-if="loading" class="flex items-center justify-center py-20">
      <div
        class="w-6 h-6 rounded-full border-2 animate-spin"
        style="border-color: var(--admin-border); border-top-color: var(--accent-copper);"
      />
    </div>

    <!-- 에러 -->
    <div v-else-if="error && !report" class="text-center py-20">
      <p class="text-sm" style="color: #FF3B30;">{{ error }}</p>
    </div>

    <!-- 콘텐츠 -->
    <div v-else-if="report" class="space-y-6">
      <!-- 알림 메시지 -->
      <div
        v-if="successMsg"
        class="px-4 py-3 rounded-lg text-sm font-medium"
        style="background: rgba(52,199,89,0.1); color: #34C759; border: 1px solid rgba(52,199,89,0.2);"
      >
        {{ successMsg }}
      </div>
      <div
        v-if="error && report"
        class="px-4 py-3 rounded-lg text-sm font-medium"
        style="background: rgba(255,59,48,0.1); color: #FF3B30; border: 1px solid rgba(255,59,48,0.2);"
      >
        {{ error }}
      </div>

      <!-- 메타 정보 패널 -->
      <div
        class="rounded-lg"
        style="background: var(--admin-surface); border: 1px solid var(--admin-border);"
      >
        <div class="flex items-center justify-between px-6 py-4 border-b" style="border-color: var(--admin-border);">
          <h3
            class="uppercase"
            style="font-size: 11px; letter-spacing: 0.2em; font-family: 'Cormorant Garamond', serif; color: var(--admin-text-subtle);"
          >
            Meta Information
          </h3>
          <div class="flex items-center gap-2">
            <!-- 활성/비활성 토글 -->
            <button
              class="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer"
              :style="{
                background: report.isActive ? 'rgba(52,199,89,0.1)' : 'rgba(255,59,48,0.1)',
                color: report.isActive ? '#34C759' : '#FF3B30',
                border: `1px solid ${report.isActive ? 'rgba(52,199,89,0.2)' : 'rgba(255,59,48,0.2)'}`,
              }"
              :disabled="saving"
              @click="toggleActive"
            >
              <span
                class="w-2 h-2 rounded-full"
                :style="{ background: report.isActive ? '#34C759' : '#FF3B30' }"
              />
              {{ report.isActive ? '활성' : '비활성' }}
            </button>
            <!-- 뷰어 미리보기 -->
            <button
              class="px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer"
              style="background: var(--accent-copper-soft); color: var(--accent-copper); border: 1px solid rgba(196,125,74,0.2);"
              @click="openViewer"
            >
              <span class="flex items-center gap-1.5">
                <svg class="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M1 8s3-5.5 7-5.5S15 8 15 8s-3 5.5-7 5.5S1 8 1 8z" />
                  <circle cx="8" cy="8" r="2" />
                </svg>
                미리보기
              </span>
            </button>
            <!-- 편집 버튼 -->
            <button
              v-if="!editing"
              class="px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer"
              style="border: 1px solid var(--admin-border-strong); color: var(--admin-text-muted);"
              @mouseenter="$event.target.style.borderColor = 'var(--accent-copper)'; $event.target.style.color = 'var(--accent-copper)'"
              @mouseleave="$event.target.style.borderColor = 'var(--admin-border-strong)'; $event.target.style.color = 'var(--admin-text-muted)'"
              @click="startEdit"
            >
              편집
            </button>
          </div>
        </div>

        <!-- 읽기 모드 -->
        <div v-if="!editing" class="px-6 py-5 space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p class="text-xs mb-1" style="color: var(--admin-text-subtle);">제목</p>
              <p class="text-sm font-medium" style="color: var(--admin-text);">{{ report.title }}</p>
            </div>
            <div>
              <p class="text-xs mb-1" style="color: var(--admin-text-subtle);">주소</p>
              <p class="text-sm font-medium" style="color: var(--admin-text);">{{ report.address }}</p>
            </div>
            <div>
              <p class="text-xs mb-1" style="color: var(--admin-text-subtle);">등록일</p>
              <p class="text-sm font-medium" style="color: var(--admin-text);">{{ formatDate(report.createdAt) }}</p>
            </div>
          </div>
          <div>
            <p class="text-xs mb-1" style="color: var(--admin-text-subtle);">설명</p>
            <p class="text-sm" style="color: var(--admin-text-muted);">{{ report.description || '(설명 없음)' }}</p>
          </div>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
            <div>
              <p class="text-xs mb-1" style="color: var(--admin-text-subtle);">토큰</p>
              <p class="text-xs font-mono" style="color: var(--admin-text-muted);">{{ report.token }}</p>
            </div>
            <div>
              <p class="text-xs mb-1" style="color: var(--admin-text-subtle);">페이지 수</p>
              <p class="text-sm font-medium" style="color: var(--admin-text);">{{ report.pageCount }}</p>
            </div>
            <div>
              <p class="text-xs mb-1" style="color: var(--admin-text-subtle);">PDF</p>
              <p class="text-sm font-medium" :style="{ color: report.pdfPath ? '#34C759' : 'var(--admin-text-subtle)' }">
                {{ report.pdfPath ? '생성 완료' : '미생성' }}
              </p>
            </div>
            <div>
              <p class="text-xs mb-1" style="color: var(--admin-text-subtle);">공유 횟수</p>
              <p class="text-sm font-medium" style="color: var(--admin-text);">{{ (report.sharedVia || []).length }}건</p>
            </div>
          </div>
        </div>

        <!-- 편집 모드 -->
        <div v-else class="px-6 py-5 space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs mb-1.5" style="color: var(--admin-text-subtle);">제목</label>
              <input
                v-model="editForm.title"
                type="text"
                class="w-full px-3 py-2 rounded-md text-sm outline-none transition-colors"
                style="background: var(--admin-surface-muted); border: 1px solid var(--admin-border); color: var(--admin-text);"
                @focus="$event.target.style.borderColor = 'var(--accent-copper)'"
                @blur="$event.target.style.borderColor = 'var(--admin-border)'"
              />
            </div>
            <div>
              <label class="block text-xs mb-1.5" style="color: var(--admin-text-subtle);">주소</label>
              <input
                v-model="editForm.address"
                type="text"
                class="w-full px-3 py-2 rounded-md text-sm outline-none transition-colors"
                style="background: var(--admin-surface-muted); border: 1px solid var(--admin-border); color: var(--admin-text);"
                @focus="$event.target.style.borderColor = 'var(--accent-copper)'"
                @blur="$event.target.style.borderColor = 'var(--admin-border)'"
              />
            </div>
          </div>
          <div>
            <label class="block text-xs mb-1.5" style="color: var(--admin-text-subtle);">설명</label>
            <textarea
              v-model="editForm.description"
              rows="3"
              class="w-full px-3 py-2 rounded-md text-sm outline-none resize-none transition-colors"
              style="background: var(--admin-surface-muted); border: 1px solid var(--admin-border); color: var(--admin-text);"
              @focus="$event.target.style.borderColor = 'var(--accent-copper)'"
              @blur="$event.target.style.borderColor = 'var(--admin-border)'"
            />
          </div>
          <div class="flex items-center gap-2 pt-2">
            <button
              class="px-4 py-2 rounded-md text-sm font-medium transition-opacity cursor-pointer"
              style="background: var(--accent-copper); color: white;"
              :disabled="saving"
              :style="{ opacity: saving ? 0.6 : 1 }"
              @click="saveEdit"
            >
              {{ saving ? '저장 중...' : '저장' }}
            </button>
            <button
              class="px-4 py-2 rounded-md text-sm font-medium cursor-pointer"
              style="border: 1px solid var(--admin-border-strong); color: var(--admin-text-muted);"
              @click="cancelEdit"
            >
              취소
            </button>
          </div>
        </div>
      </div>

      <!-- 통계 패널 -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          class="rounded-lg p-6"
          style="background: var(--admin-surface); border: 1px solid var(--admin-border);"
        >
          <p
            class="uppercase"
            style="font-size: 11px; letter-spacing: 0.2em; font-family: 'Cormorant Garamond', serif; color: var(--admin-text-subtle);"
          >
            Views
          </p>
          <span
            class="block mt-3"
            style="font-family: 'DM Sans', sans-serif; font-size: 32px; font-weight: 500; font-feature-settings: 'tnum'; line-height: 1; color: var(--admin-text);"
          >
            {{ stats.views.toLocaleString() }}
          </span>
          <p class="mt-2" style="font-size: 12px; color: var(--admin-text-subtle);">총 조회수</p>
        </div>
        <div
          class="rounded-lg p-6"
          style="background: var(--admin-surface); border: 1px solid var(--admin-border);"
        >
          <p
            class="uppercase"
            style="font-size: 11px; letter-spacing: 0.2em; font-family: 'Cormorant Garamond', serif; color: var(--admin-text-subtle);"
          >
            PDF Downloads
          </p>
          <span
            class="block mt-3"
            style="font-family: 'DM Sans', sans-serif; font-size: 32px; font-weight: 500; font-feature-settings: 'tnum'; line-height: 1; color: var(--admin-text);"
          >
            {{ stats.pdfDownloads.toLocaleString() }}
          </span>
          <p class="mt-2" style="font-size: 12px; color: var(--admin-text-subtle);">PDF 다운로드</p>
        </div>
        <div
          class="rounded-lg p-6"
          style="background: var(--admin-surface); border: 1px solid var(--admin-border);"
        >
          <p
            class="uppercase"
            style="font-size: 11px; letter-spacing: 0.2em; font-family: 'Cormorant Garamond', serif; color: var(--admin-text-subtle);"
          >
            Shares
          </p>
          <span
            class="block mt-3"
            style="font-family: 'DM Sans', sans-serif; font-size: 32px; font-weight: 500; font-feature-settings: 'tnum'; line-height: 1; color: var(--admin-text);"
          >
            {{ (report.sharedVia || []).length }}
          </span>
          <p class="mt-2" style="font-size: 12px; color: var(--admin-text-subtle);">총 공유 횟수</p>
        </div>
      </div>

      <!-- 공유 패널 -->
      <SharePanel :report-id="route.params.id" :token="report.token" @shared="fetchReport" />

      <!-- 공유 이력 -->
      <div
        class="rounded-lg"
        style="background: var(--admin-surface); border: 1px solid var(--admin-border);"
      >
        <div class="px-6 py-4 border-b" style="border-color: var(--admin-border);">
          <h3
            class="uppercase"
            style="font-size: 11px; letter-spacing: 0.2em; font-family: 'Cormorant Garamond', serif; color: var(--admin-text-subtle);"
          >
            Share History
          </h3>
        </div>
        <div class="px-6 py-4">
          <div v-if="!report.sharedVia || report.sharedVia.length === 0" class="py-6 text-center">
            <p class="text-sm" style="color: var(--admin-text-subtle);">공유 이력이 없습니다.</p>
          </div>
          <div v-else class="space-y-0">
            <div
              v-for="(entry, idx) in [...(report.sharedVia || [])].reverse()"
              :key="idx"
              class="flex items-start gap-3 py-3"
              :style="idx < report.sharedVia.length - 1 ? 'border-bottom: 1px solid var(--admin-border);' : ''"
            >
              <!-- 타입 표시 점 -->
              <div class="flex-shrink-0 mt-1">
                <span
                  class="inline-block w-2 h-2 rounded-full"
                  :style="{ background: shareTypeColor(entry.type) }"
                />
              </div>
              <!-- 내용 -->
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <span
                    class="inline-block px-1.5 py-0.5 rounded text-xs font-medium"
                    :style="{
                      background: shareTypeColor(entry.type) + '18',
                      color: shareTypeColor(entry.type),
                    }"
                  >
                    {{ shareTypeLabel(entry.type) }}
                  </span>
                  <span class="text-sm truncate" style="color: var(--admin-text);">{{ entry.target }}</span>
                </div>
                <p class="text-xs mt-0.5" style="color: var(--admin-text-subtle);">
                  {{ formatDate(entry.sentAt) }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </AdminShell>
</template>
