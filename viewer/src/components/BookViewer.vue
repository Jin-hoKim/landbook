<template>
  <div class="h-screen flex flex-col" style="background: var(--bg-dark);">
    <!-- 상단 바 -->
    <header
      class="flex items-center justify-between px-8 shrink-0"
      :style="{
        height: '56px',
        background: 'rgba(12, 12, 14, 0.9)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        zIndex: 10,
      }"
    >
      <!-- 좌측: 브랜딩 -->
      <div
        :style="{
          fontFamily: '\'Cormorant Garamond\', serif',
          fontSize: '13px',
          letterSpacing: '0.25em',
          color: 'var(--accent-copper)',
          fontWeight: 600,
        }"
      >
        LANDBOOK
      </div>

      <!-- 중앙: 주소 -->
      <div
        class="absolute left-1/2 -translate-x-1/2"
        :style="{
          fontFamily: '\'Pretendard Variable\', sans-serif',
          fontSize: '13px',
          color: 'var(--text-on-dark-secondary)',
        }"
      >
        {{ report?.address || '' }}
      </div>

      <!-- 우측: 페이지 번호 -->
      <div
        :style="{
          fontFamily: '\'DM Sans\', sans-serif',
          fontSize: '12px',
          fontVariantNumeric: 'tabular-nums',
          color: 'var(--text-on-dark-secondary)',
          letterSpacing: '0.05em',
        }"
      >
        {{ currentPage + 1 }} / {{ totalPages }}
      </div>
    </header>

    <!-- 책 컨테이너 -->
    <div class="flex-1 flex items-center justify-center relative overflow-hidden">
      <div
        ref="bookContainer"
        class="book-container"
      >
        <!-- page-flip이 이 컨테이너 안에 렌더링 -->
        <div
          v-for="(page, idx) in pages"
          :key="idx"
          class="page-item"
          :style="{
            background: '#FEFCF9',
            boxShadow: 'inset 0 0 30px rgba(0,0,0,0.05)',
          }"
        >
          <img
            v-if="page.imageUrl"
            :src="page.imageUrl"
            :alt="`Page ${page.num}`"
            class="w-full h-full object-contain"
          />
          <div
            v-else
            class="w-full h-full flex items-center justify-center"
            :style="{
              fontFamily: '\'Cormorant Garamond\', serif',
              fontSize: '14px',
              letterSpacing: '0.2em',
              color: '#9A9A9E',
            }"
          >
            PAGE {{ page.num }}
          </div>
        </div>
      </div>
    </div>

    <!-- 하단: 페이지 인디케이터 + 네비게이션 -->
    <div
      class="flex items-center justify-center gap-6 shrink-0"
      style="height: 64px; background: rgba(12, 12, 14, 0.9);"
    >
      <!-- 이전 버튼 -->
      <button
        class="nav-btn"
        :disabled="currentPage <= 0"
        @click="prevPage"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>

      <!-- 페이지 인디케이터 -->
      <div class="flex gap-2 items-center">
        <div
          v-for="idx in totalPages"
          :key="idx"
          class="rounded-full transition-all duration-300"
          :style="{
            width: currentPage === idx - 1 ? '20px' : '6px',
            height: '6px',
            background: currentPage === idx - 1 ? 'var(--accent-copper)' : 'rgba(255,255,255,0.2)',
          }"
        />
      </div>

      <!-- 다음 버튼 -->
      <button
        class="nav-btn"
        :disabled="currentPage >= totalPages - 1"
        @click="nextPage"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';
import { PageFlip } from 'page-flip';

const props = defineProps({
  report: { type: Object, required: true },
});

const emit = defineEmits(['back', 'share', 'switchToScroll']);

const bookContainer = ref(null);
const currentPage = ref(0);
let pageFlip = null;

const pages = computed(() => {
  if (!props.report?.pages) return [];
  return props.report.pages.map((page) => ({
    ...page,
    imageUrl: page.imageUrl || `/uploads/${props.report.token}/page-images/page-${page.num}.png`,
  }));
});

const totalPages = computed(() => pages.value.length || 0);

onMounted(async () => {
  await nextTick();
  initPageFlip();
});

onUnmounted(() => {
  if (pageFlip) {
    pageFlip.destroy();
    pageFlip = null;
  }
});

function initPageFlip() {
  if (!bookContainer.value || !pages.value.length) return;

  const container = bookContainer.value;
  // 페이지 크기 계산: 컨테이너 기준
  const containerRect = container.parentElement.getBoundingClientRect();
  const maxH = containerRect.height - 40;
  const maxW = containerRect.width - 80;
  // A4 비율 (약 1:1.414)
  const pageW = Math.min(maxW / 2, maxH / 1.414);
  const pageH = pageW * 1.414;

  pageFlip = new PageFlip(container, {
    width: Math.round(pageW),
    height: Math.round(pageH),
    size: 'fixed',
    minWidth: 300,
    maxWidth: 600,
    minHeight: 424,
    maxHeight: 848,
    showCover: true,
    maxShadowOpacity: 0.3,
    mobileScrollSupport: false,
    drawShadow: true,
    flippingTime: 800,
    usePortrait: false,
    startZIndex: 0,
    autoSize: true,
    startPage: 0,
    clickEventForward: true,
    useMouseEvents: true,
    swipeDistance: 30,
    showPageCorners: true,
  });

  // page-flip 이벤트
  pageFlip.on('flip', (e) => {
    currentPage.value = e.data;
  });

  // HTML 엘리먼트 기반 렌더링
  const pageElements = container.querySelectorAll('.page-item');
  if (pageElements.length > 0) {
    pageFlip.loadFromHTML(pageElements);
  }
}

function prevPage() {
  if (pageFlip) pageFlip.flipPrev();
}

function nextPage() {
  if (pageFlip) pageFlip.flipNext();
}
</script>

<style scoped>
.book-container {
  position: relative;
}

.page-item {
  padding: 20px;
}

.nav-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: transparent;
  color: var(--text-on-dark-primary);
  cursor: pointer;
  transition: all 0.3s ease;
}

.nav-btn:hover:not(:disabled) {
  border-color: var(--accent-copper);
  color: var(--accent-copper);
}

.nav-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}
</style>
