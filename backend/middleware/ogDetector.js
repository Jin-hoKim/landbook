const BOT_PATTERNS = [
  'facebookexternalhit', 'Facebot', 'Twitterbot', 'LinkedInBot',
  'Slackbot', 'kakaotalk-scrap', 'yeti', 'Daum', 'Baiduspider',
  'Googlebot', 'WhatsApp', 'TelegramBot', 'Discordbot',
];

function isBot(userAgent) {
  if (!userAgent) return false;
  return BOT_PATTERNS.some(p => userAgent.includes(p));
}

module.exports = { isBot };
