import mongoose from "mongoose";
import app from "../src/app.js";
import { connectDatabase } from "../src/config/database.js";

let databaseInitialization;

async function ensureDatabaseInitialized() {
  if (!databaseInitialization) {
    databaseInitialization = connectDatabase().catch((error) => {
      databaseInitialization = null;
      throw error;
    });
  }
  await databaseInitialization;

  if (mongoose.connection.readyState !== 1) {
    throw new Error("MongoDB connection is not ready.");
  }
}

export default async function handler(request, response) {
  try {
    await ensureDatabaseInitialized();
    app(request, response);
  } catch (error) {
    console.error("Vercel API database initialization failed.", error);
    if (!response.headersSent) {
      response.status(503).json({ message: "Billing database is unavailable." });
    }
  }
}
