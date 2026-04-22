import express, { Application } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth";
import { notFound } from "./middleware/notFound";
import { indexRoutes } from "./routes";
import qs from "qs";
import { webhookController } from "./module/payment/webhook.controller";
import { errorHandler } from "./middleware/globalErrorHandler";

const app: Application = express();

const allowedOrigins = [
  process.env.LOCAL_APP_URL || "http://localhost:3000",
  process.env.APP_URL || "https://smartlease-frontend.vercel.app",
].filter(Boolean);

app.post(
  "/api/webhooks/stripe",
  express.raw({ type: "application/json" }),
  webhookController.handleWebhook,
);

app.set("query parser", (str: string) => qs.parse(str));

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);

      // Check if origin is in allowedOrigins or matches Vercel preview pattern
      const isAllowed =
        allowedOrigins.includes(origin) ||
        /^https:\/\/next-blog-client.*\.vercel\.app$/.test(origin) ||
        /^https:\/\/.*\.vercel\.app$/.test(origin) || // Any Vercel deployment
        /^https:\/\/.*\.onrender\.com$/.test(origin); // Any Render deployment

      if (isAllowed) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
    exposedHeaders: ["Set-Cookie"],
  }),
);

app.use(express.json());

app.all("/api/auth/*splat", toNodeHandler(auth));

app.use("/api", indexRoutes);

app.use(cookieParser());

app.use(notFound);

app.use(express.urlencoded({ extended: true }));

app.use(errorHandler);

export default app;
