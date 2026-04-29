import { ref, onMounted, onUnmounted } from 'vue';

/**
 * Intersection Observer 기반 스크롤 진입 애니메이션 composable
 * @param {Object} options - IntersectionObserver 옵션
 * @param {number} options.threshold - 가시 비율 임계값 (기본 0.2)
 * @returns {{ target: Ref, visible: Ref<boolean> }}
 */
export function useScrollReveal(options = {}) {
  const target = ref(null);
  const visible = ref(false);
  let observer = null;

  onMounted(() => {
    if (!target.value) return;
    observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) visible.value = true;
      },
      { threshold: options.threshold || 0.2 }
    );
    observer.observe(target.value);
  });

  onUnmounted(() => observer?.disconnect());

  return { target, visible };
}
