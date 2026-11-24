import { env } from "./env.js";

export const SESSION_COOKIE = "ws_session";
export const SESSION_TTL_SECONDS = 60 * 60 * 8;
export const TOKEN_ISSUER = "billing-system-api";
export const TOKEN_AUDIENCE = "billing-system-frontend";

export const cookieOptions = Object.freeze({
  httpOnly: true,
  secure: env.isProduction,
  sameSite: "strict",
  path: "/api",
  maxAge: SESSION_TTL_SECONDS * 1000,
});
