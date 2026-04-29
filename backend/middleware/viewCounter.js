// 같은 IP에서 같은 리포트를 10분 내 재조회 시 카운트 제외
const recentViews = new Map(); // key: `${ip}:${token}`, value: timestamp
const COOLDOWN = 10 * 60 * 1000; // 10분

// 1시간마다 오래된 항목 정리
setInterval(() => {
  const now = Date.now();
  for (const [key, time] of recentViews) {
    if (now - time > COOLDOWN) recentViews.delete(key);
  }
}, 60 * 60 * 1000);

function shouldCount(ip, token) {
  const key = `${ip}:${token}`;
  const last = recentViews.get(key);
  if (last && Date.now() - last < COOLDOWN) return false;
  recentViews.set(key, Date.now());
  return true;
}

module.exports = { shouldCount };
