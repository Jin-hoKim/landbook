<script setup>
const props = defineProps({
  label: { type: String, required: true },
  value: { type: [String, Number], required: true },
  delta: { type: Number, default: null },
  sub: { type: String, default: '' },
})
</script>

<template>
  <div
    class="rounded-lg p-6"
    style="
      background: var(--admin-surface);
      border: 1px solid var(--admin-border);
      border-radius: 8px;
      padding: 24px;
    "
  >
    <p
      class="uppercase"
      style="
        font-size: 11px;
        letter-spacing: 0.2em;
        font-family: 'Cormorant Garamond', serif;
        color: var(--admin-text-subtle);
      "
    >
      {{ label }}
    </p>
    <div class="flex items-end gap-3 mt-3">
      <span
        style="
          font-family: 'DM Sans', sans-serif;
          font-size: 32px;
          font-weight: 500;
          font-feature-settings: 'tnum';
          line-height: 1;
          color: var(--admin-text);
        "
      >
        {{ value }}
      </span>
      <span
        v-if="delta !== null"
        class="mb-1"
        :style="{
          fontSize: '12px',
          fontWeight: 500,
          color: delta >= 0 ? '#34C759' : '#FF3B30',
        }"
      >
        {{ delta >= 0 ? '\u25B2' : '\u25BC' }} {{ Math.abs(delta) }}%
      </span>
    </div>
    <p
      v-if="sub"
      class="mt-2"
      style="font-size: 12px; color: var(--admin-text-subtle);"
    >
      {{ sub }}
    </p>
  </div>
</template>
