<template>
  <div class="min-h-screen" style="background: var(--bg-dark);">
    <!-- 헤더 -->
    <header
      class="flex flex-col items-center justify-center relative"
      style="height: 30vh; background: var(--bg-dark);"
    >
      <div
        :style="{
          fontFamily: '\'Cormorant Garamond\', serif',
          fontSize: '14px',
          letterSpacing: '0.3em',
          color: 'var(--accent-copper)',
          fontWeight: 600,
        }"
      >
        ── L A N D B O O K ──
      </div>
      <div
        class="mt-3"
        :style="{
          fontFamily: '\'Pretendard Variable\', sans-serif',
          fontSize: '16px',
          color: 'var(--text-on-dark-secondary)',
        }"
      >
        부동산 투자 분석 리포트
      </div>
      <!-- 스크롤 유도 화살표 -->
      <div class="absolute bottom-6 animate-bounce">
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--accent-copper)"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </div>
    </header>

    <!-- 로딩 -->
    <div
      v-if="loading"
      class="flex items-center justify-center"
      style="height: 50vh;"
    >
      <div
        :style="{
          fontFamily: '\'Cormorant Garamond\', serif',
          fontSize: '14px',
          letterSpacing: '0.2em',
          color: 'var(--text-on-dark-secondary)',
        }"
      >
        LOADING...
      </div>
    </div>

    <!-- 빈 상태 (에러 또는 리포트 0개) -->
    <div
      v-else-if="error || reports.length === 0"
      class="flex flex-col items-center justify-center"
      style="height: 60vh;"
    >
      <div
        :style="{
          fontFamily: '\'Playfair Display\', serif',
          fontSize: 'clamp(80px, 14vw, 160px)',
          fontWeight: 300,
          lineHeight: 1,
          color: 'rgba(255,255,255,0.04)',
          marginBottom: '32px',
        }"
      >
        LANDBOOK
      </div>
      <div
        :style="{
          width: '60px',
          height: '1px',
          background: 'var(--accent-copper)',
          marginBottom: '24px',
        }"
      />
      <div
        :style="{
          fontFamily: '\'Cormorant Garamond\', serif',
          fontSize: '14px',
          letterSpacing: '0.25em',
          color: 'var(--text-on-dark-secondary)',
          fontWeight: 600,
          textAlign: 'center',
        }"
      >
        {{ reports.length === 0 && !error ? '등록된 리포트가 없습니다' : '리포트를 불러올 수 없습니다' }}
      </div>
      <div
        class="mt-3"
        :style="{
          fontSize: '13px',
          color: 'rgba(255,255,255,0.15)',
        }"
      >
        JWORKS 부동산 컨설팅
      </div>
    </div>

    <!-- 리포트 목록 -->
    <template v-else>
      <section
        v-for="(report, idx) in reports"
        :key="report.token || idx"
        :ref="(el) => setSectionRef(el, idx)"
        class="report-section relative overflow-hidden cursor-pointer"
        :class="{ 'is-visible': visibleSections[idx] }"
        :style="{
          minHeight: '70vh',
          background: idx % 2 === 0 ? 'var(--bg-dark)' : 'var(--bg-light)',
          transition: 'background 0.4s ease, color 0.4s ease',
        }"
        @mouseenter="hoveredIdx = idx"
        @mouseleave="hoveredIdx = -1"
        @click="goToReport(report.token)"
      >
        <!-- 호버 오버레이 -->
        <div
          class="absolute inset-0 pointer-events-none"
          :style="{
            background: hoveredIdx === idx ? '#FFFFFF' : 'transparent',
            transition: 'background 0.4s ease',
            zIndex: 1,
          }"
        />

        <!-- 워터마크 -->
        <Watermark
          :text="getWatermarkText(report)"
          :color="idx % 2 === 0 ? 'var(--watermark-on-dark)' : 'var(--watermark-on-light)'"
        />

        <!-- 컨텐츠 -->
        <div
          class="relative flex items-center gap-12 mx-auto"
          :class="[
            idx % 2 === 0 ? 'flex-row' : 'flex-row-reverse',
            'section-content',
          ]"
          :style="{
            maxWidth: 'var(--content-max-width)',
            padding: 'var(--section-padding-y) var(--section-padding-x)',
            zIndex: 2,
          }"
        >
          <!-- 섹션 넘버 -->
          <SectionNumber
            :num="String(idx + 1).padStart(2, '0')"
            label="REPORT"
            :style="{
              color: getSectionTextColor(idx),
              transition: 'color 0.4s ease',
            }"
          />

          <!-- 썸네일 -->
          <div
            class="shrink-0 overflow-hidden"
            style="border-radius: 4px;"
          >
            <div
              class="thumbnail-wrapper"
              :style="{
                width: 'clamp(240px, 30vw, 400px)',
                aspectRatio: '4 / 3',
                background: idx % 2 === 0 ? 'var(--bg-dark-elevated)' : '#EEEEEE',
                transition: 'transform 0.4s ease, filter 0.4s ease',
                transform: hoveredIdx === idx ? 'scale(1.02)' : 'scale(1)',
                filter: hoveredIdx === idx ? 'grayscale(0%)' : 'grayscale(20%)',
              }"
            >
              <img
                v-if="report.thumbnail"
                :src="report.thumbnail"
                :alt="report.address"
                class="w-full h-full object-cover"
              />
              <div
                v-else
                class="w-full h-full flex items-center justify-center"
                :style="{
                  fontFamily: '\'Cormorant Garamond\', serif',
                  fontSize: '11px',
                  letterSpacing: '0.2em',
                  color: idx % 2 === 0 ? 'var(--text-on-dark-secondary)' : 'var(--text-on-light-secondary)',
                }"
              >
                NO IMAGE
              </div>
            </div>
          </div>

          <!-- 텍스트 영역 -->
          <div class="flex-1 min-w-0">
            <!-- 매물 주소 -->
            <div
              :style="{
                fontFamily: '\'Cormorant Garamond\', serif',
                fontSize: 'clamp(28px, 3.5vw, 42px)',
                fontWeight: 500,
                lineHeight: 1.2,
                color: getSectionTextColor(idx),
                transition: 'color 0.4s ease',
              }"
            >
              {{ report.address || '주소 미입력' }}
            </div>

            <CopperLine class="my-5" />

            <!-- 타이틀 -->
            <div
              :style="{
                fontFamily: '\'Pretendard Variable\', sans-serif',
                fontSize: '15px',
                lineHeight: 1.7,
                color: getSectionSubTextColor(idx),
                transition: 'color 0.4s ease',
              }"
            >
              {{ report.title || '' }}
            </div>

            <!-- 날짜 -->
            <div
              class="mt-3"
              :style="{
                fontFamily: '\'DM Sans\', sans-serif',
                fontSize: '12px',
                letterSpacing: '0.05em',
                color: getSectionSubTextColor(idx),
                transition: 'color 0.4s ease',
                opacity: 0.7,
              }"
            >
              {{ formatDate(report.createdAt) }}
            </div>
          </div>
        </div>
      </section>
    </template>

    <!-- 푸터 -->
    <footer
      class="flex items-center justify-center"
      style="height: 20vh; background: var(--bg-dark);"
    >
      <div
        :style="{
          fontFamily: '\'Cormorant Garamond\', serif',
          fontSize: '12px',
          letterSpacing: '0.3em',
          color: 'var(--text-on-dark-secondary)',
          fontWeight: 600,
          opacity: 0.5,
        }"
      >
        ── LANDBOOK by JWORKS ──
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useReport } from '../composables/useReport.js';
import CopperLine from '../components/CopperLine.vue';
import SectionNumber from '../components/SectionNumber.vue';
import Watermark from '../components/Watermark.vue';

const router = useRouter();
const { reports, loading, error, fetchReports } = useReport();

const hoveredIdx = ref(-1);
const visibleSections = ref({});
const sectionRefs = ref({});
let observer = null;

function setSectionRef(el, idx) {
  if (el) sectionRefs.value[idx] = el;
}

onMounted(async () => {
  await fetchReports();

  // 스크롤 진입 애니메이션 옵저버
  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const idx = Object.keys(sectionRefs.value).find(
            (k) => sectionRefs.value[k] === entry.target
          );
          if (idx !== undefined) {
            // stagger 효과: 인덱스 * 100ms 딜레이
            setTimeout(() => {
              visibleSections.value[idx] = true;
            }, 100);
          }
        }
      });
    },
    { threshold: 0.15 }
  );

  // refs 등록은 다음 tick에서
  setTimeout(() => {
    Object.values(sectionRefs.value).forEach((el) => {
      if (el) observer.observe(el);
    });
  }, 100);
});

onUnmounted(() => {
  observer?.disconnect();
});

function goToReport(token) {
  if (token) router.push(`/r/${token}`);
}

function getWatermarkText(report) {
  if (!report.address) return '';
  // 주소에서 핵심 단어 추출 (마지막 2단어 정도)
  const parts = report.address.split(' ');
  return parts.length > 2 ? parts.slice(-2).join(' ') : report.address;
}

function getSectionTextColor(idx) {
  if (hoveredIdx.value === idx) return '#1C1C1E';
  return idx % 2 === 0
    ? 'var(--text-on-dark-primary)'
    : 'var(--text-on-light-primary)';
}

function getSectionSubTextColor(idx) {
  if (hoveredIdx.value === idx) return '#6B6B6F';
  return idx % 2 === 0
    ? 'var(--text-on-dark-secondary)'
    : 'var(--text-on-light-secondary)';
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
</script>

<style scoped>
.report-section {
  opacity: 0;
  transform: translateY(30px);
  transition: opacity 0.6s ease, transform 0.6s ease, background 0.4s ease;
}

.report-section.is-visible {
  opacity: 1;
  transform: translateY(0);
}

/* 반응형: 모바일 */
@media (max-width: 768px) {
  .section-content {
    flex-direction: column !important;
    gap: 2rem;
    text-align: center;
  }

  .section-content .thumbnail-wrapper {
    width: 100% !important;
  }
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(6px); }
}

.animate-bounce {
  animation: bounce 2s ease-in-out infinite;
}
</style>
