import express, { Application } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth";
import { propertyRoutes } from "./module/property/property.route";
import { notFound } from "./middleware/notFound";
import { indexRoutes } from "./routes";

const app: Application = express();

app.use(
  cors({
    origin: process.env.APP_URL || "http://localhost:3000",
    credentials: true,
  }),
);

app.use(express.json());

app.all("/api/auth/*splat", toNodeHandler(auth));

app.use("/api", indexRoutes);

app.use(cookieParser());

app.use(notFound);

app.use(express.urlencoded({ extended: true }));

export default app;
