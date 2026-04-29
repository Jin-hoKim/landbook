<template>
  <section
    :ref="(el) => { target = el }"
    class="relative overflow-hidden"
    :style="{
      minHeight: '70vh',
      background: isDark ? 'var(--bg-dark)' : 'var(--bg-light)',
      transition: 'opacity 0.6s ease, transform 0.6s ease',
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(30px)',
    }"
  >
    <!-- 워터마크 -->
    <Watermark
      :text="page.label || `PAGE ${page.num}`"
      :color="isDark ? 'var(--watermark-on-dark)' : 'var(--watermark-on-light)'"
    />

    <!-- 컨텐츠 -->
    <div
      class="relative flex items-start gap-10 mx-auto"
      :style="{
        maxWidth: 'var(--content-max-width)',
        padding: 'var(--section-padding-y) var(--section-padding-x)',
        zIndex: 2,
      }"
    >
      <!-- 섹션 넘버 -->
      <SectionNumber
        :num="String(page.num).padStart(2, '0')"
        :label="page.label || 'PAGE'"
        :style="{ color: isDark ? 'var(--text-on-dark-primary)' : 'var(--text-on-light-primary)' }"
      />

      <!-- 본문 -->
      <div class="flex-1 min-w-0">
        <!-- 페이지 라벨 -->
        <div
          v-if="page.label"
          :style="{
            fontFamily: '\'Cormorant Garamond\', serif',
            fontSize: 'clamp(24px, 3vw, 36px)',
            fontWeight: 500,
            lineHeight: 1.3,
            color: isDark ? 'var(--text-on-dark-primary)' : 'var(--text-on-light-primary)',
            marginBottom: '16px',
          }"
        >
          {{ page.label }}
        </div>

        <CopperLine class="mb-6" />

        <!-- 통계 데이터 -->
        <div
          v-if="page.stats && page.stats.length"
          class="flex flex-wrap gap-8 mb-8"
        >
          <div
            v-for="(stat, sIdx) in page.stats"
            :key="sIdx"
          >
            <div
              :style="{
                fontFamily: '\'DM Sans\', sans-serif',
                fontSize: '28px',
                fontWeight: 600,
                fontVariantNumeric: 'tabular-nums',
                color: 'var(--accent-copper)',
                lineHeight: 1.2,
              }"
            >
              {{ stat.value }}
            </div>
            <div
              class="mt-1"
              :style="{
                fontFamily: '\'Pretendard Variable\', sans-serif',
                fontSize: '12px',
                color: isDark ? 'var(--text-on-dark-secondary)' : 'var(--text-on-light-secondary)',
              }"
            >
              {{ stat.label }}
            </div>
          </div>
        </div>

        <!-- 페이지 콘텐츠 iframe -->
        <div
          class="w-full overflow-hidden"
          style="border-radius: 8px; border: 1px solid rgba(255,255,255,0.06);"
        >
          <iframe
            :src="`/api/viewer/${token}/pages/${page.num}`"
            class="w-full border-none"
            style="min-height: 500px; background: #FFFFFF;"
            :title="`Page ${page.num}`"
            @load="onIframeLoad"
            ref="iframeRef"
          />
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useScrollReveal } from '../composables/useScrollReveal.js';
import CopperLine from './CopperLine.vue';
import SectionNumber from './SectionNumber.vue';
import Watermark from './Watermark.vue';

const props = defineProps({
  page: { type: Object, required: true },
  idx: { type: Number, required: true },
  token: { type: String, required: true },
});

const isDark = computed(() => props.idx % 2 === 0);
const { target, visible } = useScrollReveal({ threshold: 0.1 });
const iframeRef = ref(null);

/**
 * iframe 로드 후 높이 자동 조절
 */
function onIframeLoad(e) {
  try {
    const doc = e.target.contentDocument || e.target.contentWindow?.document;
    if (doc?.body) {
      e.target.style.height = doc.body.scrollHeight + 'px';
    }
  } catch {
    // cross-origin 제한 시 기본 높이 유지
  }
}
</script>

<style scoped>
@media (max-width: 768px) {
  .flex.items-start {
    flex-direction: column;
    gap: 1.5rem;
  }
}
</style>
