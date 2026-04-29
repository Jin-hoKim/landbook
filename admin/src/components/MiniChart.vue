<script setup>
import { computed } from 'vue'

const props = defineProps({
  data: { type: Array, default: () => [] },
  labels: { type: Array, default: () => ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] },
})

const maxVal = computed(() => Math.max(...props.data, 1))

function barHeight(val) {
  return `${(val / maxVal.value) * 100}%`
}
</script>

<template>
  <div
    class="rounded-lg p-6"
    style="
      background: var(--admin-surface);
      border: 1px solid var(--admin-border);
      border-radius: 8px;
    "
  >
    <!-- 바 영역 -->
    <div class="flex items-end gap-2" style="height: 120px;">
      <div
        v-for="(val, idx) in data"
        :key="idx"
        class="flex-1 flex flex-col justify-end h-full"
      >
        <div
          :style="{
            height: barHeight(val),
            background: 'var(--accent-copper)',
            borderRadius: '4px 4px 0 0',
            minHeight: '4px',
            transition: 'height 0.3s ease',
          }"
        />
      </div>
    </div>
    <!-- 요일 라벨 -->
    <div class="flex gap-2 mt-2">
      <div
        v-for="(label, idx) in labels"
        :key="idx"
        class="flex-1 text-center"
        style="font-size: 10px; color: var(--admin-text-subtle);"
      >
        {{ label }}
      </div>
    </div>
  </div>
</template>
