import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import User from "../models/User.js";

const PASSWORD_HASH_ROUNDS = 12;
const MAX_PASSWORD_BYTES = 72;
const MIN_PASSWORD_LENGTH = 12;

function isValidEmail(email) {
  return typeof email === "string" && email.length <= 254
    && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function isValidPassword(password) {
  return typeof password === "string"
    && password.length >= MIN_PASSWORD_LENGTH
    && Buffer.byteLength(password, "utf8") <= MAX_PASSWORD_BYTES;
}

export async function createUser(request, response) {
  const { email, password } = request.body || {};
  if (!isValidEmail(email) || !isValidPassword(password)) {
    return response.status(400).json({
      message: `Enter a valid email and a password between ${MIN_PASSWORD_LENGTH} and ${MAX_PASSWORD_BYTES} bytes.`,
    });
  }

  try {
    const user = await User.create({
      email: email.trim().toLowerCase(),
      passwordHash: await bcrypt.hash(password, PASSWORD_HASH_ROUNDS),
      role: "user",
    });
    return response.status(201).json({ user: { id: user.id, email: user.email, role: user.role } });
  } catch (error) {
    if (error.code === 11000) return response.status(409).json({ message: "A user with that email already exists." });
    throw error;
  }
}

export async function listUsers(_request, response) {
  const users = await User.find({ role: "user" }).select("email role createdAt").sort({ createdAt: -1 }).lean();
  return response.json({ users: users.map((user) => ({
    id: String(user._id),
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
  })) });
}

export async function changeUserEmail(request, response) {
  const { userId } = request.params;
  const { email } = request.body || {};
  if (!mongoose.isValidObjectId(userId)) return response.status(400).json({ message: "Invalid user ID." });
  if (!isValidEmail(email)) return response.status(400).json({ message: "Enter a valid email address." });

  try {
    const user = await User.findOneAndUpdate(
      { _id: userId, role: "user" },
      { $set: { email: email.trim().toLowerCase() } },
      { new: true, runValidators: true },
    ).select("email role");
    if (!user) return response.status(404).json({ message: "User not found." });
    return response.json({ user: { id: user.id, email: user.email, role: user.role } });
  } catch (error) {
    if (error.code === 11000) return response.status(409).json({ message: "A user with that email already exists." });
    throw error;
  }
}

export async function changeUserPassword(request, response) {
  const { userId } = request.params;
  const { password } = request.body || {};
  if (!mongoose.isValidObjectId(userId)) {
    return response.status(400).json({ message: "Invalid user ID." });
  }
  if (!isValidPassword(password)) {
    return response.status(400).json({
      message: `Password must be between ${MIN_PASSWORD_LENGTH} and ${MAX_PASSWORD_BYTES} bytes.`,
    });
  }

  const result = await User.updateOne(
    { _id: userId, role: "user" },
    {
      $set: { passwordHash: await bcrypt.hash(password, PASSWORD_HASH_ROUNDS) },
      $inc: { sessionVersion: 1 },
    },
  );
  if (result.matchedCount === 0) return response.status(404).json({ message: "User not found." });
  return response.status(204).end();
}
