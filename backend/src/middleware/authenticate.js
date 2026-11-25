import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { SESSION_COOKIE, TOKEN_AUDIENCE, TOKEN_ISSUER } from "../config/session.js";
import User from "../models/User.js";

function logAuthentication(request, event, details = {}) {
  console.info("Session authentication diagnostic", {
    event,
    method: request.method,
    path: request.originalUrl,
    ...details,
  });
}

export async function requireSession(request, response, next) {
  const hasSessionCookie = Boolean(request.cookies?.[SESSION_COOKIE]);
  logAuthentication(request, "cookie-check", { hasSessionCookie });

  let session;
  try {
    const token = request.cookies?.[SESSION_COOKIE];
    if (!token) {
      logAuthentication(request, "authentication-failed", { reason: "missing-session-cookie" });
      return response.status(401).json({ message: "Not signed in." });
    }

    session = jwt.verify(token, env.jwtSecret, {
      issuer: TOKEN_ISSUER,
      audience: TOKEN_AUDIENCE,
    });
    logAuthentication(request, "jwt-verified", { hasSubject: Boolean(session.sub) });
  } catch (error) {
    logAuthentication(request, "authentication-failed", {
      reason: "jwt-verification-failed",
      jwtError: error.name,
    });
    return response.status(401).json({ message: "Not signed in." });
  }

  try {
    const user = await User.findById(session.sub).select("email role +sessionVersion");
    logAuthentication(request, "user-lookup", { userFound: Boolean(user) });
    if (!user || session.role !== user.role || session.sessionVersion !== user.sessionVersion) {
      logAuthentication(request, "authentication-failed", {
        reason: !user ? "user-not-found" : "session-or-role-mismatch",
      });
      return response.status(401).json({ message: "Not signed in." });
    }

    request.user = { id: user.id, email: user.email, role: user.role };
    logAuthentication(request, "authentication-succeeded");
    return next();
  } catch (error) {
    logAuthentication(request, "authentication-error", { error: error.name });
    return next(error);
  }
}
