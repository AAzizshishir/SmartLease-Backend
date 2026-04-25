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
  "http://localhost:3000",
  "https://smartlease-frontend.onrender.com",
  "https://smartlease-frontend.vercel.app",
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      const isAllowed =
        allowedOrigins.includes(origin) ||
        /^https:\/\/.*\.vercel\.app$/.test(origin) || // any vercel preview/prod
        /^https:\/\/.*\.onrender\.com$/.test(origin); // any render preview/prod

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

app.post(
  "/api/webhooks/stripe",
  express.raw({ type: "application/json" }),
  webhookController.handleWebhook,
);

app.set("query parser", (str: string) => qs.parse(str));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.json({ message: "SmartLease Backend is running!" });
});

app.all("/api/auth/*splat", toNodeHandler(auth));
app.use("/api", indexRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
