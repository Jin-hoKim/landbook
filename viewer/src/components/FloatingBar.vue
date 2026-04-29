<template>
  <div
    class="fixed bottom-6 left-1/2 -translate-x-1/2 flex gap-7 z-50"
    :style="{
      background: 'rgba(28, 28, 30, 0.9)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      border: '1px solid rgba(196, 125, 74, 0.25)',
      borderRadius: '16px',
      padding: '12px 28px',
      boxShadow: '0 12px 40px rgba(0,0,0,0.4)',
    }"
  >
    <BarButton
      icon="M12 10v6m0 0l-3-3m3 3l3-3M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
      label="PDF"
      @click="$emit('pdf')"
    />
    <BarButton
      icon="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
      label="SHARE"
      @click="$emit('share')"
    />
    <BarButton
      :icon="view === 'scroll'
        ? 'M4 6h16M4 12h16M4 18h16'
        : 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10'"
      :label="view === 'scroll' ? 'BOOK' : 'SCROLL'"
      @click="$emit('switch')"
    />
    <BarButton
      icon="M10 19l-7-7m0 0l7-7m-7 7h18"
      label="LIST"
      @click="$emit('back')"
    />
  </div>
</template>

<script setup>
defineProps({ view: { type: String, default: 'scroll' } });
defineEmits(['pdf', 'share', 'switch', 'back']);

const BarButton = {
  props: ['icon', 'label'],
  emits: ['click'],
  template: `
    <button
      @click="$emit('click')"
      class="flex flex-col items-center gap-1.5 bg-transparent border-none cursor-pointer transition-colors duration-300 group"
      style="padding: 4px 8px;"
    >
      <svg
        class="text-[var(--accent-copper)] group-hover:scale-110 transition-transform"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path :d="icon" />
      </svg>
      <span
        style="font-family: 'Cormorant Garamond', serif; font-size: 9px; letter-spacing: 0.2em; font-weight: 600;"
        class="text-[var(--text-on-dark-primary)] group-hover:text-[var(--accent-copper)] transition-colors"
      >{{ label }}</span>
    </button>
  `,
};
</script>
