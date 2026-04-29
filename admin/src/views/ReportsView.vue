<script setup>
import { ref, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AdminShell from '../components/AdminShell.vue'
import api from '../api'

const router = useRouter()

const search = ref('')
const statusFilter = ref('')
const sortBy = ref('newest')
const reports = ref([])
const loading = ref(true)

async function fetchReports() {
  loading.value = true
  try {
    const params = {}
    if (search.value) params.search = search.value
    if (statusFilter.value) params.status = statusFilter.value
    if (sortBy.value) params.sort = sortBy.value
    const { data } = await api.get('/reports', { params })
    reports.value = data.reports || data || []
  } catch {
    reports.value = []
  } finally {
    loading.value = false
  }
}

onMounted(fetchReports)

// 필터 변경 시 다시 조회 (디바운스)
let searchTimer = null
watch(search, () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(fetchReports, 300)
})
watch([statusFilter, sortBy], fetchReports)

async function toggleStatus(report) {
  try {
    await api.put(`/reports/${report._id}`, { isActive: !report.isActive })
    report.isActive = !report.isActive
  } catch {
    // 실패 시 무시
  }
}

async function deleteReport(report) {
  if (!confirm(`"${report.title || '(제목 없음)'}" 리포트를 삭제하시겠습니까?`)) return
  try {
    await api.delete(`/reports/${report._id}`)
    reports.value = reports.value.filter((r) => r._id !== report._id)
  } catch {
    // 실패 시 무시
  }
}

function formatDate(d) {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

function formatNumber(n) {
  if (n == null) return '0'
  return Number(n).toLocaleString()
}
</script>

<template>
  <AdminShell active="reports" section="REPORTS" title="리포트 관리">
    <template #actions>
      <router-link
        to="/reports/new"
        class="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90"
        style="background: var(--accent-copper);"
      >
        <svg class="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
          <line x1="8" y1="3" x2="8" y2="13" />
          <line x1="3" y1="8" x2="13" y2="8" />
        </svg>
        리포트 등록
      </router-link>
    </template>

    <!-- 필터 바 -->
    <div class="flex items-center gap-3 mb-6">
      <input
        v-model="search"
        type="text"
        placeholder="제목, 주소 검색..."
        class="flex-1 px-4 py-2.5 rounded-lg text-sm outline-none transition-colors"
        style="
          background: var(--admin-surface);
          border: 1px solid var(--admin-border);
          color: var(--admin-text);
        "
        @focus="$event.target.style.borderColor = 'var(--accent-copper)'"
        @blur="$event.target.style.borderColor = 'var(--admin-border)'"
      />
      <select
        v-model="statusFilter"
        class="px-4 py-2.5 rounded-lg text-sm outline-none cursor-pointer"
        style="
          background: var(--admin-surface);
          border: 1px solid var(--admin-border);
          color: var(--admin-text);
        "
      >
        <option value="">전체</option>
        <option value="active">활성</option>
        <option value="inactive">비활성</option>
      </select>
      <select
        v-model="sortBy"
        class="px-4 py-2.5 rounded-lg text-sm outline-none cursor-pointer"
        style="
          background: var(--admin-surface);
          border: 1px solid var(--admin-border);
          color: var(--admin-text);
        "
      >
        <option value="newest">최신순</option>
        <option value="views">조회수순</option>
      </select>
    </div>

    <!-- 테이블 -->
    <div
      class="rounded-lg overflow-hidden"
      style="background: var(--admin-surface); border: 1px solid var(--admin-border);"
    >
      <table class="w-full text-sm">
        <thead>
          <tr style="border-bottom: 1px solid var(--admin-border);">
            <th class="text-left px-5 py-3 font-medium" style="color: var(--admin-text-subtle); font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase;">제목</th>
            <th class="text-left px-5 py-3 font-medium" style="color: var(--admin-text-subtle); font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase;">주소</th>
            <th class="text-center px-5 py-3 font-medium" style="color: var(--admin-text-subtle); font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase;">페이지</th>
            <th class="text-center px-5 py-3 font-medium" style="color: var(--admin-text-subtle); font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase;">조회</th>
            <th class="text-center px-5 py-3 font-medium" style="color: var(--admin-text-subtle); font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase;">다운로드</th>
            <th class="text-center px-5 py-3 font-medium" style="color: var(--admin-text-subtle); font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase;">생성일</th>
            <th class="text-center px-5 py-3 font-medium" style="color: var(--admin-text-subtle); font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase;">상태</th>
            <th class="text-center px-5 py-3 font-medium" style="color: var(--admin-text-subtle); font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase;">액션</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td colspan="8" class="text-center py-12" style="color: var(--admin-text-subtle);">
              로딩 중...
            </td>
          </tr>
          <tr v-else-if="reports.length === 0">
            <td colspan="8" class="text-center py-12" style="color: var(--admin-text-subtle);">
              리포트가 없습니다.
            </td>
          </tr>
          <tr
            v-else
            v-for="report in reports"
            :key="report._id"
            class="transition-colors hover:bg-black/[0.02]"
            style="border-bottom: 1px solid var(--admin-border);"
          >
            <td class="px-5 py-3.5 font-medium" style="color: var(--admin-text);">
              {{ report.title || '(제목 없음)' }}
            </td>
            <td class="px-5 py-3.5" style="color: var(--admin-text-muted);">
              {{ report.address || '-' }}
            </td>
            <td class="text-center px-5 py-3.5" style="color: var(--admin-text-muted);">
              {{ report.pageCount ?? '-' }}
            </td>
            <td class="text-center px-5 py-3.5" style="color: var(--admin-text-muted);">
              {{ formatNumber(report.views) }}
            </td>
            <td class="text-center px-5 py-3.5" style="color: var(--admin-text-muted);">
              {{ formatNumber(report.downloads) }}
            </td>
            <td class="text-center px-5 py-3.5" style="color: var(--admin-text-muted);">
              {{ formatDate(report.createdAt) }}
            </td>
            <td class="text-center px-5 py-3.5">
              <div class="flex items-center justify-center gap-2">
                <span
                  class="inline-block px-2 py-0.5 rounded-full text-xs font-medium"
                  :style="{
                    background: report.isActive ? 'rgba(52,199,89,0.12)' : 'rgba(142,142,147,0.12)',
                    color: report.isActive ? '#34C759' : '#8E8E93',
                  }"
                >
                  {{ report.isActive ? '활성' : '비활성' }}
                </span>
                <button
                  class="text-xs cursor-pointer underline"
                  :style="{ color: report.isActive ? '#8E8E93' : 'var(--accent-copper)' }"
                  @click="toggleStatus(report)"
                >
                  {{ report.isActive ? '비활성화' : '활성화' }}
                </button>
              </div>
            </td>
            <td class="text-center px-5 py-3.5">
              <div class="flex items-center justify-center gap-2">
                <router-link
                  :to="`/reports/${report._id}`"
                  class="text-xs font-medium underline"
                  style="color: var(--accent-copper);"
                >
                  상세
                </router-link>
                <button
                  class="text-xs font-medium underline cursor-pointer"
                  style="color: #FF3B30;"
                  @click="deleteReport(report)"
                >
                  삭제
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </AdminShell>
</template>
