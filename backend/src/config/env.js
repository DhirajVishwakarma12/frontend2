import "dotenv/config";

const port = Number(process.env.PORT || 4000);
const adminEmail = String(process.env.ADMIN_EMAIL || "").trim().toLowerCase();
const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH || "";
const mongoUri = String(process.env.MONGODB_URI || "").trim();
const jwtSecret = process.env.JWT_SECRET || "";
const frontendOrigins = String(process.env.FRONTEND_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("PORT must be a valid TCP port.");
}
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminEmail)) {
  throw new Error("ADMIN_EMAIL must be a valid email address.");
}
if (!/^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(adminPasswordHash)) {
  throw new Error("ADMIN_PASSWORD_HASH must be a valid bcrypt hash.");
}
if (!/^mongodb(?:\+srv)?:\/\//.test(mongoUri)) {
  throw new Error("MONGODB_URI must be a valid MongoDB connection string.");
}
if (jwtSecret.length < 32) {
  throw new Error("JWT_SECRET must contain at least 32 characters.");
}
for (const origin of frontendOrigins) {
  try {
    new URL(origin);
  } catch {
    throw new Error(`FRONTEND_ORIGIN contains an invalid origin: ${origin}`);
  }
}

export const env = Object.freeze({
  port,
  adminEmail,
  adminPasswordHash,
  mongoUri,
  jwtSecret,
  frontendOrigins,
  isProduction: process.env.NODE_ENV === "production",
  trustProxy: process.env.TRUST_PROXY === "true",
});
