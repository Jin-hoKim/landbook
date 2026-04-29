<script setup>
import { ref, onMounted } from 'vue'
import AdminShell from '../components/AdminShell.vue'
import StatCard from '../components/StatCard.vue'
import MiniChart from '../components/MiniChart.vue'
import api from '../api'

const stats = ref([
  { label: 'TOTAL REPORTS', value: '-', delta: null, sub: '' },
  { label: 'TOTAL VIEWS', value: '-', delta: null, sub: '' },
  { label: 'TOTAL DOWNLOADS', value: '-', delta: null, sub: '' },
  { label: 'ACTIVE REPORTS', value: '-', delta: null, sub: '' },
])

const chartData = ref([0, 0, 0, 0, 0, 0, 0])
const chartLabels = ref(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'])
const recentReports = ref([])
const loading = ref(true)

onMounted(async () => {
  try {
    const { data } = await api.get('/dashboard/')
    if (data.stats) {
      stats.value = [
        {
          label: 'TOTAL REPORTS',
          value: data.stats.totalReports ?? 0,
          delta: data.stats.reportsDelta ?? null,
          sub: '전체 리포트',
        },
        {
          label: 'TOTAL VIEWS',
          value: formatNumber(data.stats.totalViews ?? 0),
          delta: data.stats.viewsDelta ?? null,
          sub: '누적 조회수',
        },
        {
          label: 'TOTAL DOWNLOADS',
          value: formatNumber(data.stats.totalDownloads ?? 0),
          delta: data.stats.downloadsDelta ?? null,
          sub: '누적 다운로드',
        },
        {
          label: 'ACTIVE REPORTS',
          value: data.stats.activeReports ?? 0,
          delta: data.stats.activeDelta ?? null,
          sub: '활성 리포트',
        },
      ]
    }
    if (data.weeklyViews) {
      chartData.value = data.weeklyViews.data || chartData.value
      chartLabels.value = data.weeklyViews.labels || chartLabels.value
    }
    if (data.recentReports) {
      recentReports.value = data.recentReports
    }
  } catch {
    // API 미구현 시 기본값 유지
  } finally {
    loading.value = false
  }
})

function formatNumber(n) {
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k'
  return String(n)
}

function formatDate(d) {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}
</script>

<template>
  <AdminShell active="dashboard" section="DASHBOARD" title="대시보드">
    <!-- 통계 카드 4열 그리드 -->
    <div class="grid grid-cols-4 gap-5 mb-8">
      <StatCard
        v-for="(s, i) in stats"
        :key="i"
        :label="s.label"
        :value="s.value"
        :delta="s.delta"
        :sub="s.sub"
      />
    </div>

    <!-- 2열 그리드: 차트 + 최근 리포트 -->
    <div class="grid grid-cols-2 gap-5">
      <!-- 조회수 차트 -->
      <div>
        <h3
          class="mb-3 uppercase"
          style="
            font-size: 11px;
            letter-spacing: 0.2em;
            font-family: 'Cormorant Garamond', serif;
            color: var(--admin-text-subtle);
          "
        >
          WEEKLY VIEWS
        </h3>
        <MiniChart :data="chartData" :labels="chartLabels" />
      </div>

      <!-- 최근 리포트 -->
      <div>
        <h3
          class="mb-3 uppercase"
          style="
            font-size: 11px;
            letter-spacing: 0.2em;
            font-family: 'Cormorant Garamond', serif;
            color: var(--admin-text-subtle);
          "
        >
          RECENT REPORTS
        </h3>
        <div
          class="rounded-lg"
          style="
            background: var(--admin-surface);
            border: 1px solid var(--admin-border);
            border-radius: 8px;
          "
        >
          <div
            v-if="loading"
            class="p-6 text-center text-sm"
            style="color: var(--admin-text-subtle);"
          >
            로딩 중...
          </div>
          <div
            v-else-if="recentReports.length === 0"
            class="p-6 text-center text-sm"
            style="color: var(--admin-text-subtle);"
          >
            등록된 리포트가 없습니다.
          </div>
          <ul v-else class="divide-y" style="border-color: var(--admin-border);">
            <li
              v-for="report in recentReports"
              :key="report._id"
              class="flex items-center justify-between px-5 py-3.5"
            >
              <div>
                <router-link
                  :to="`/reports/${report._id}`"
                  class="text-sm font-medium hover:underline"
                  style="color: var(--admin-text);"
                >
                  {{ report.title || '(제목 없음)' }}
                </router-link>
                <p class="text-xs mt-0.5" style="color: var(--admin-text-subtle);">
                  {{ report.address || '-' }}
                </p>
              </div>
              <span class="text-xs" style="color: var(--admin-text-subtle);">
                {{ formatDate(report.createdAt) }}
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </AdminShell>
</template>
