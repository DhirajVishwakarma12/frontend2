import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { SESSION_COOKIE, TOKEN_AUDIENCE, TOKEN_ISSUER } from "../config/session.js";
import User from "../models/User.js";

export async function requireSession(request, response, next) {
  let session;
  try {
    const token = request.cookies?.[SESSION_COOKIE];
    if (!token) {
      return response.status(401).json({ message: "Not signed in." });
    }

    session = jwt.verify(token, env.jwtSecret, {
      issuer: TOKEN_ISSUER,
      audience: TOKEN_AUDIENCE,
    });
  } catch (error) {
    return response.status(401).json({ message: "Not signed in." });
  }

  try {
    const user = await User.findById(session.sub).select("email role +sessionVersion");
    if (!user || session.role !== user.role || session.sessionVersion !== user.sessionVersion) {
      return response.status(401).json({ message: "Not signed in." });
    }

    request.user = { id: user.id, email: user.email, role: user.role };
    return next();
  } catch (error) {
    return next(error);
  }
}
