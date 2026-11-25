
import cors from "cors";
import cookieParser from "cookie-parser";
import express from "express";
import helmet from "helmet";

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

// Allowed frontend origins
const allowedOrigins = env.frontendOrigins;

// CORS configuration
app.use(
  cors({
    origin(origin, callback) {
      // Allow requests without an Origin header
      if (!origin) {
        return callback(null, true);
      }

      // Validate frontend origin
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.error("CORS blocked origin:", origin);

      return callback(
        new Error(`CORS blocked: ${origin}`)
      );
    },

    credentials: true,

    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS",
    ],

    allowedHeaders: [
      "Content-Type",
      "Authorization",
    ],

    optionsSuccessStatus: 204,
  })
);

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
  response.status(200).json({
    status: "ok",
    message: "Billing API is running",
  });
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/workspace-data", workspaceDataRoutes);
app.use("/api/invoices", invoiceRoutes);

// Handle unknown routes
app.use(notFound);

// Global error handler
app.use(errorHandler);

export default app;
