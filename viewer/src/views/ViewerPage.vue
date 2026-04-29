<template>
  <div style="background: var(--bg-dark); min-height: 100vh;">
    <!-- 로딩 -->
    <div
      v-if="loading"
      class="flex items-center justify-center"
      style="height: 100vh;"
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

    <!-- 에러 -->
    <div
      v-else-if="error"
      class="flex items-center justify-center"
      style="height: 100vh;"
    >
      <div style="color: var(--text-on-dark-secondary); font-size: 14px;">
        {{ error }}
      </div>
    </div>

    <!-- 리포트 로드 완료 -->
    <template v-else-if="report">
      <!-- 표지 모드 -->
      <div
        v-if="mode === 'cover'"
        class="flex flex-col items-center justify-center relative"
        style="height: 100vh; overflow: hidden;"
      >
        <!-- 다크 그라데이션 배경 -->
        <div
          class="absolute inset-0"
          style="background: linear-gradient(180deg, #0C0C0E 0%, #1C1C1E 50%, #0C0C0E 100%);"
        />

        <!-- 배경 워터마크 -->
        <div
          class="absolute inset-0 flex items-center justify-center pointer-events-none"
        >
          <div
            :style="{
              fontFamily: '\'Playfair Display\', serif',
              fontSize: 'clamp(100px, 20vw, 280px)',
              fontWeight: 700,
              color: 'rgba(255,255,255,0.02)',
              letterSpacing: '-0.02em',
              lineHeight: 1,
              whiteSpace: 'nowrap',
            }"
          >
            {{ report.addressEn || 'LANDBOOK' }}
          </div>
        </div>

        <!-- 콘텐츠 -->
        <div class="relative z-10 flex flex-col items-center text-center px-6">
          <!-- LANDBOOK 브랜딩 -->
          <div
            :style="{
              fontFamily: '\'Cormorant Garamond\', serif',
              fontSize: '12px',
              letterSpacing: '0.4em',
              color: 'var(--accent-copper)',
              fontWeight: 600,
            }"
          >
            ── L A N D B O O K ──
          </div>

          <!-- 매물 주소 -->
          <div
            class="mt-8"
            :style="{
              fontFamily: '\'Cormorant Garamond\', serif',
              fontSize: 'clamp(28px, 5vw, 42px)',
              fontWeight: 500,
              color: 'var(--text-on-dark-primary)',
              lineHeight: 1.3,
              maxWidth: '600px',
            }"
          >
            {{ report.address }}
          </div>

          <!-- 코퍼 라인 -->
          <CopperLine class="my-6" :width="80" />

          <!-- 리포트 타이틀 -->
          <div
            :style="{
              fontFamily: '\'Pretendard Variable\', sans-serif',
              fontSize: '15px',
              color: 'var(--text-on-dark-secondary)',
              lineHeight: 1.7,
              maxWidth: '500px',
            }"
          >
            {{ report.title }}
          </div>

          <!-- 열람 버튼 -->
          <button
            class="mt-10 cursor-pointer"
            :style="{
              fontFamily: '\'Cormorant Garamond\', serif',
              fontSize: '13px',
              letterSpacing: '0.2em',
              fontWeight: 600,
              color: 'var(--accent-copper)',
              background: 'transparent',
              border: '1px solid var(--accent-copper)',
              borderRadius: '4px',
              padding: '14px 36px',
              transition: 'all 0.3s ease',
            }"
            @mouseenter="(e) => { e.target.style.background = 'var(--accent-copper)'; e.target.style.color = '#FFFFFF'; }"
            @mouseleave="(e) => { e.target.style.background = 'transparent'; e.target.style.color = 'var(--accent-copper)'; }"
            @click="enterViewer"
          >
            리포트 열람하기 →
          </button>

          <!-- 푸터 -->
          <div
            class="mt-16"
            :style="{
              fontFamily: '\'Cormorant Garamond\', serif',
              fontSize: '10px',
              letterSpacing: '0.3em',
              color: 'var(--text-on-dark-secondary)',
              opacity: 0.5,
            }"
          >
            JWORKS 부동산 컨설팅
          </div>
        </div>
      </div>

      <!-- 스크롤 뷰 모드 -->
      <div v-else-if="mode === 'scroll'">
        <PageSection
          v-for="(page, idx) in report.pages"
          :key="page.num"
          :page="page"
          :idx="idx"
          :token="report.token"
        />

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

      <!-- 북 뷰 모드 -->
      <BookViewer
        v-else-if="mode === 'book'"
        :report="report"
        @back="goBack"
        @share="showShareModal = true"
        @switch-to-scroll="mode = 'scroll'"
      />

      <!-- 플로팅 바 (표지 제외) -->
      <FloatingBar
        v-if="mode !== 'cover'"
        :view="mode"
        @pdf="downloadPdf"
        @share="showShareModal = true"
        @switch="toggleViewMode"
        @back="goBack"
      />

      <!-- 공유 모달 -->
      <ShareModal
        :open="showShareModal"
        :token="report.token"
        @close="showShareModal = false"
        @pdf="downloadPdf"
      />
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useReport } from '../composables/useReport.js';
import CopperLine from '../components/CopperLine.vue';
import FloatingBar from '../components/FloatingBar.vue';
import ShareModal from '../components/ShareModal.vue';
import PageSection from '../components/PageSection.vue';
import BookViewer from '../components/BookViewer.vue';

const route = useRoute();
const router = useRouter();
const { report, loading, error, fetchReport } = useReport();

const mode = ref('cover'); // 'cover' | 'scroll' | 'book'
const showShareModal = ref(false);
const isDesktop = ref(window.innerWidth >= 1200);

function handleResize() {
  isDesktop.value = window.innerWidth >= 1200;
}

onMounted(async () => {
  window.addEventListener('resize', handleResize);
  await fetchReport(route.params.token);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
});

function enterViewer() {
  mode.value = isDesktop.value ? 'book' : 'scroll';
}

function toggleViewMode() {
  mode.value = mode.value === 'scroll' ? 'book' : 'scroll';
}

function goBack() {
  router.push('/');
}

function downloadPdf() {
  if (report.value?.token) {
    window.open(`/api/viewer/${report.value.token}/pdf`, '_blank');
  }
}
</script>
