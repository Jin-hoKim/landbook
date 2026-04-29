<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 flex items-center justify-center z-[100]"
      style="background: rgba(0,0,0,0.7); backdrop-filter: blur(10px);"
      @click="$emit('close')"
    >
      <div
        class="relative"
        style="background: var(--bg-dark); border: 1px solid rgba(196,125,74,0.18); border-radius: 12px; padding: 48px; width: min(480px, 90%);"
        @click.stop
      >
        <!-- 헤딩 -->
        <div class="text-center">
          <div style="font-family: 'Cormorant Garamond', serif; font-size: 13px; letter-spacing: 0.4em; color: var(--accent-copper); font-weight: 600;">
            S H A R E
          </div>
          <div class="mt-2" style="font-size: 14px; color: var(--text-on-dark-secondary);">
            이 리포트를 공유하기
          </div>
          <CopperLine class="mx-auto my-6" />
        </div>

        <!-- 공유 버튼 3개 -->
        <div class="flex justify-between gap-3 my-6">
          <ShareButton label="KAKAO" @click="shareKakao">
            <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
          </ShareButton>
          <ShareButton label="LINK" @click="copyLink">
            <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
          </ShareButton>
          <ShareButton label="PDF" @click="$emit('pdf')">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8" />
          </ShareButton>
        </div>

        <CopperLine class="mx-auto my-6" />

        <!-- URL 표시 -->
        <div
          class="mb-4 overflow-hidden text-ellipsis whitespace-nowrap"
          style="background: rgba(255,255,255,0.05); border-radius: 8px; padding: 12px 16px; font-family: 'DM Sans', monospace; font-size: 12px; color: var(--text-on-dark-secondary);"
        >
          {{ shareUrl }}
        </div>
        <button
          @click="copyLink"
          class="w-full cursor-pointer"
          style="background: var(--accent-copper); color: white; border: none; border-radius: 8px; padding: 14px; font-family: 'Cormorant Garamond', serif; font-size: 12px; letter-spacing: 0.3em; font-weight: 600;"
        >
          {{ copied ? '복사 완료!' : '전체 URL 복사' }}
        </button>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed } from 'vue';
import CopperLine from './CopperLine.vue';

const props = defineProps({
  open: Boolean,
  token: String,
});
const emit = defineEmits(['close', 'pdf']);

const copied = ref(false);
const shareUrl = computed(() => `https://landbook.jworks.world/r/${props.token}`);

async function copyLink() {
  await navigator.clipboard.writeText(shareUrl.value);
  copied.value = true;
  setTimeout(() => (copied.value = false), 2000);
  // 공유 카운트 기록
  fetch(`/api/viewer/${props.token}/share`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'link' }),
  }).catch(() => {});
}

function shareKakao() {
  if (window.Kakao?.Share) {
    window.Kakao.Share.sendDefault({
      objectType: 'feed',
      content: {
        title: document.title,
        description: 'JWORKS 부동산 컨설팅 리포트',
        imageUrl: `https://landbook.jworks.world/api/viewer/${props.token}/og`,
        link: { webUrl: shareUrl.value, mobileWebUrl: shareUrl.value },
      },
      buttons: [
        {
          title: '리포트 보기',
          link: { webUrl: shareUrl.value, mobileWebUrl: shareUrl.value },
        },
      ],
    });
  }
  // 공유 카운트 기록
  fetch(`/api/viewer/${props.token}/share`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'kakao' }),
  }).catch(() => {});
}

// ShareButton 인라인 컴포넌트
const ShareButton = {
  props: ['label'],
  emits: ['click'],
  template: `
    <button
      @click="$emit('click')"
      class="flex flex-col items-center justify-center gap-2.5 cursor-pointer transition-all duration-300 hover:border-[var(--accent-copper)] hover:bg-[rgba(196,125,74,0.05)]"
      style="width: 100px; height: 100px; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; background: transparent; color: var(--accent-copper);"
    >
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <slot />
      </svg>
      <span style="font-family: 'Cormorant Garamond', serif; font-size: 11px; letter-spacing: 0.2em; font-weight: 600; color: var(--text-on-dark-primary);">
        {{ label }}
      </span>
    </button>
  `,
};
</script>
