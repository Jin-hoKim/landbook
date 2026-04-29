<template>
  <span
    :style="{
      display: 'inline-block',
      width: vertical ? `${height}px` : `${width}px`,
      height: vertical ? `${width}px` : `${height}px`,
      background: 'var(--accent-copper)',
    }"
  />
</template>

<script setup>
defineProps({
  width: { type: Number, default: 60 },
  height: { type: Number, default: 1 },
  vertical: { type: Boolean, default: false },
});
</script>
