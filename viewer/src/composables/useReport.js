import { ref } from 'vue';

/**
 * 리포트 데이터 fetch composable
 * - 단일 리포트: fetchReport(token)
 * - 리포트 목록: fetchReports()
 */
export function useReport() {
  const report = ref(null);
  const reports = ref([]);
  const loading = ref(false);
  const error = ref(null);

  /**
   * 단일 리포트 조회
   * @param {string} token - 리포트 토큰
   */
  async function fetchReport(token) {
    loading.value = true;
    error.value = null;
    try {
      const res = await fetch(`/api/viewer/${token}`);
      if (!res.ok) throw new Error('report_not_found');
      report.value = await res.json();
    } catch (err) {
      error.value = err.message;
    } finally {
      loading.value = false;
    }
  }

  /**
   * 공개 리포트 목록 조회
   */
  async function fetchReports() {
    loading.value = true;
    error.value = null;
    try {
      const res = await fetch('/api/viewer/public');
      if (!res.ok) throw new Error('loading_failed');
      reports.value = await res.json();
    } catch (err) {
      error.value = err.message;
    } finally {
      loading.value = false;
    }
  }

  return { report, reports, loading, error, fetchReport, fetchReports };
}
