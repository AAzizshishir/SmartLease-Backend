import express, { Application } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth";
import { notFound } from "./middleware/notFound";
import { indexRoutes } from "./routes";
import { envVariables } from "./config/env";
import qs from "qs";

const app: Application = express();

app.set("query parser", (str: string) => qs.parse(str));

app.use(
  cors({
    origin: envVariables.APP_URL || "http://localhost:3000",
    credentials: true,
  }),
);

app.use(express.json());

app.all("/api/auth/*splat", toNodeHandler(auth));

app.use("/api/v1", indexRoutes);

app.use(cookieParser());

app.use(notFound);

app.use(express.urlencoded({ extended: true }));

export default app;
