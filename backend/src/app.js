
import cors from "cors";
import cookieParser from "cookie-parser";
import express from "express";
import helmet from "helmet";
import mongoose from "mongoose";
import path from "node:path";

import { env } from "./config/env.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";

import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import workspaceDataRoutes from "./routes/workspaceDataRoutes.js";
import invoiceRoutes from "./routes/invoiceRoutes.js";

const app = express();

// Security configuration
app.disable("x-powered-by");

if (env.trustProxy) {
  app.set("trust proxy", 1);
}

app.use(helmet());

// CORS configuration
app.use(cors({
  origin(origin, callback) {
    if (!origin || env.frontendOrigins.includes(origin)) {
      return callback(null, true);
    }
    const error = new Error("Origin not allowed.");
    error.status = 403;
    return callback(error);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// Parse JSON requests
app.use(
  express.json({
    limit: "1mb",
    strict: true,
  })
);

// Parse cookies
app.use(cookieParser());

// Health check
app.get("/api/health", (_request, response) => {
  const databaseConnected = mongoose.connection.readyState === 1;
  response.status(databaseConnected ? 200 : 503).json({
    status: databaseConnected ? "ok" : "unavailable",
    message: databaseConnected ? "Billing API is running" : "Billing database is unavailable",
  });
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/workspace-data", workspaceDataRoutes);
app.use("/api/invoices", invoiceRoutes);

app.use("/api", notFound);

if (env.frontendDistDir) {
  app.use(express.static(env.frontendDistDir));
  app.get(/.*/, (_request, response, next) => {
    response.sendFile(path.join(env.frontendDistDir, "index.html"), (error) => {
      if (error) next(error);
    });
  });
}

// Handle unknown routes
app.use(notFound);

// Global error handler
app.use(errorHandler);

export default app;
