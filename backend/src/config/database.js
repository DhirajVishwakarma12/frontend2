import mongoose from "mongoose";
import { env } from "./env.js";
import User from "../models/User.js";
import WorkspaceData from "../models/WorkspaceData.js";
import Invoice from "../models/Invoice.js";

export async function connectDatabase() {
  await mongoose.connect(env.mongoUri, { serverSelectionTimeoutMS: 10_000 });
  await User.createIndexes();
  await WorkspaceData.createIndexes();
  await Invoice.createIndexes();
  await User.updateOne(
    { email: env.adminEmail },
    { $setOnInsert: { email: env.adminEmail, passwordHash: env.adminPasswordHash, role: "admin" } },
    { upsert: true },
  );
  await User.updateOne({ email: env.adminEmail }, { $set: { role: "admin" } });
}

export async function closeDatabase() {
  await mongoose.disconnect();
}
