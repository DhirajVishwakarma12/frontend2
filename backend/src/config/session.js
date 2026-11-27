import { env } from "./env.js";

export const SESSION_COOKIE = "ws_session";
export const SESSION_TTL_SECONDS = 60 * 60 * 8;
export const TOKEN_ISSUER = "billing-system-api";
export const TOKEN_AUDIENCE = "billing-system-frontend";
const isCrossSiteProduction = env.isProduction && !env.isDesktop;

export const cookieOptions = Object.freeze({
  httpOnly: true,
  secure: isCrossSiteProduction,
  // The frontend and API are deployed on different hostnames. A cross-site
  // fetch needs SameSite=None; Secure is required by browsers for this mode.
  sameSite: isCrossSiteProduction ? "none" : "lax",
  // Chromium partitions this cookie by the Vercel top-level site when users
  // block ordinary third-party cookies. Browsers without CHIPS support ignore
  // the attribute and retain the SameSite=None behavior above.
  partitioned: isCrossSiteProduction,
  path: "/",
  maxAge: SESSION_TTL_SECONDS * 1000,
});
