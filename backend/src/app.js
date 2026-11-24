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

app.disable("x-powered-by");
if (env.trustProxy) app.set("trust proxy", 1);

app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    if (!origin || env.frontendOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("Origin not allowed."));
  },
  credentials: true,
  methods: ["GET", "POST", "PATCH", "PUT"],
}));
app.use(express.json({ limit: "1mb", strict: true }));
app.use(cookieParser());

app.get("/api/health", (_request, response) => {
  response.json({ status: "ok" });
});
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/workspace-data", workspaceDataRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use(notFound);
app.use(errorHandler);

export default app;
