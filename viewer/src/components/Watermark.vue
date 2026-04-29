<template>
  <div
    :style="{
      position: 'absolute',
      right: '-3%',
      top: '50%',
      transform: 'translateY(-50%)',
      fontFamily: '\'Playfair Display\', serif',
      fontSize: 'clamp(120px, 18vw, 220px)',
      fontWeight: 700,
      color: color,
      letterSpacing: '-0.02em',
      lineHeight: 1,
      pointerEvents: 'none',
      zIndex: 0,
      whiteSpace: 'nowrap',
    }"
  >
    {{ text }}
  </div>
</template>

<script setup>
defineProps({
  text: { type: String, required: true },
  color: { type: String, default: 'var(--watermark-on-dark)' },
});
</script>
