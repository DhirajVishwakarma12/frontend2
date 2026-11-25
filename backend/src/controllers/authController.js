import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { cookieOptions, SESSION_COOKIE, SESSION_TTL_SECONDS, TOKEN_AUDIENCE, TOKEN_ISSUER } from "../config/session.js";
import User from "../models/User.js";

const PASSWORD_HASH_ROUNDS = 12;
const MIN_PASSWORD_LENGTH = 12;
const MAX_PASSWORD_BYTES = 72;

function createSessionToken(user) {
  return jwt.sign({ role: user.role, sessionVersion: user.sessionVersion }, env.jwtSecret, {
    subject: user.id,
    issuer: TOKEN_ISSUER,
    audience: TOKEN_AUDIENCE,
    expiresIn: SESSION_TTL_SECONDS,
  });
}

export async function login(request, response) {
  const { email, password } = request.body || {};
  if (typeof email !== "string" || typeof password !== "string"
    || email.length > 254 || password.length === 0
    || Buffer.byteLength(password, "utf8") > 72) {
    return response.status(400).json({ message: "Enter a valid email and password." });
  }

  const user = await User.findOne({ email: email.trim().toLowerCase() })
    .select("+passwordHash +sessionVersion");
  // Existing accounts authenticate against their database hash. The env hash
  // is only a timing-safe dummy comparison when the email is not registered.
  const passwordMatches = await bcrypt.compare(password, user?.passwordHash || env.adminPasswordHash);
  if (!user || !passwordMatches) {
    return response.status(401).json({ message: "Invalid email or password." });
  }

  response.cookie(SESSION_COOKIE, createSessionToken(user), cookieOptions);
  console.info("Session authentication diagnostic", { event: "session-cookie-issued" });
  return response.json({ user: { id: user.id, email: user.email, role: user.role } });
}

export function currentUser(request, response) {
  return response.json({ user: request.user });
}

export function logout(_request, response) {
  response.clearCookie(SESSION_COOKIE, { ...cookieOptions, maxAge: undefined });
  console.info("Session authentication diagnostic", { event: "session-cookie-cleared" });
  return response.status(204).end();
}

export async function changeOwnPassword(request, response, next) {
  if (request.user.role !== "admin") {
    return response.status(403).json({ message: "Admin access is required." });
  }

  const { currentPassword, newPassword } = request.body || {};
  if (typeof currentPassword !== "string" || currentPassword.length === 0
    || Buffer.byteLength(currentPassword, "utf8") > MAX_PASSWORD_BYTES) {
    return response.status(400).json({ message: "Enter your current password." });
  }
  if (typeof newPassword !== "string" || newPassword.length < MIN_PASSWORD_LENGTH
    || Buffer.byteLength(newPassword, "utf8") > MAX_PASSWORD_BYTES) {
    return response.status(400).json({
      message: `New password must be at least ${MIN_PASSWORD_LENGTH} characters and no more than ${MAX_PASSWORD_BYTES} bytes.`,
    });
  }

  try {
    const user = await User.findById(request.user.id).select("+passwordHash +sessionVersion");
    if (!user || user.role !== "admin") return response.status(401).json({ message: "Not signed in." });

    const currentPasswordMatches = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!currentPasswordMatches) return response.status(400).json({ message: "Current password is incorrect." });

    user.passwordHash = await bcrypt.hash(newPassword, PASSWORD_HASH_ROUNDS);
    user.sessionVersion += 1;
    await user.save();

    response.cookie(SESSION_COOKIE, createSessionToken(user), cookieOptions);
    return response.status(204).end();
  } catch (error) {
    return next(error);
  }
}

