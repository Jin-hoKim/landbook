const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "..", ".env") });

// 알려진 약한 기본값 (운영에서 사용 금지)
const DEFAULT_JWT_SECRET = "landbook-dev-secret";
const DEFAULT_ADMIN_PASSWORD = "admin1234";

const isProduction = process.env.NODE_ENV === "production";

// 실제 적용될 값 (미설정 시 기본값으로 폴백)
const jwtSecret = process.env.JWT_SECRET || DEFAULT_JWT_SECRET;
const adminPassword = process.env.ADMIN_PASSWORD || DEFAULT_ADMIN_PASSWORD;

// 약한 기본값(미설정 또는 알려진 기본값) 사용 여부 검사
const usingDefaultJwtSecret =
  !process.env.JWT_SECRET || jwtSecret === DEFAULT_JWT_SECRET;
const usingDefaultAdminPassword =
  !process.env.ADMIN_PASSWORD || adminPassword === DEFAULT_ADMIN_PASSWORD;

if (usingDefaultJwtSecret || usingDefaultAdminPassword) {
  const weakItems = [];
  if (usingDefaultAdminPassword) weakItems.push("ADMIN_PASSWORD");
  if (usingDefaultJwtSecret) weakItems.push("JWT_SECRET");

  if (isProduction) {
    // 운영 환경: 약한 기본값이면 서버 시작을 거부
    console.error("\n[보안 오류] 운영 환경에서 약한 기본값이 감지되었습니다.");
    console.error(`  - 변경 필요 항목: ${weakItems.join(", ")}`);
    console.error(
      "  - .env 파일에 강력하고 고유한 값을 설정한 뒤 서버를 다시 시작하세요.",
    );
    console.error(
      "  - 기본값(admin1234 / landbook-dev-secret)은 운영에서 사용할 수 없습니다.\n",
    );
    throw new Error(
      `운영 환경에서 약한 기본값 사용으로 서버 시작이 거부되었습니다: ${weakItems.join(", ")}`,
    );
  } else {
    // 개발 환경: 경고만 출력하고 동작은 유지
    console.warn("\n[보안 경고] 약한 기본값을 사용 중입니다 (개발 환경).");
    console.warn(`  - 해당 항목: ${weakItems.join(", ")}`);
    console.warn("  - 운영 배포 전 .env에 강력한 값을 반드시 설정하세요.\n");
  }
}

module.exports = {
  port: process.env.PORT || 8020,
  mongoUri: process.env.MONGODB_URI || "mongodb://localhost:27017/landbook",
  jwtSecret,
  adminPassword,
  uploadDir: process.env.UPLOAD_DIR || path.join(__dirname, "..", "uploads"),
  maxZipSize: parseInt(process.env.MAX_ZIP_SIZE) || 100 * 1024 * 1024,
  solapi: {
    apiKey: process.env.SOLAPI_API_KEY,
    apiSecret: process.env.SOLAPI_API_SECRET,
    sender: process.env.SOLAPI_SENDER,
  },
  smtp: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  kakaoJsKey: process.env.KAKAO_JS_KEY,
};
