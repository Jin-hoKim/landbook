<template>
  <div class="flex flex-col gap-4 w-20 shrink-0">
    <div
      class="leading-none"
      :style="{
        fontFamily: '\'Playfair Display\', serif',
        fontSize: 'clamp(56px, 6vw, 84px)',
        fontWeight: 300,
        color: 'inherit',
      }"
    >
      {{ num }}
    </div>
    <CopperLine :width="40" vertical />
    <div
      :style="{
        fontFamily: '\'Cormorant Garamond\', serif',
        fontSize: '10px',
        letterSpacing: '0.25em',
        fontWeight: 600,
        color: 'inherit',
        opacity: 0.6,
      }"
    >
      {{ label }}
    </div>
  </div>
</template>

<script setup>
import CopperLine from './CopperLine.vue';

defineProps({
  num: { type: String, required: true },
  label: { type: String, default: 'REPORT' },
});
</script>
