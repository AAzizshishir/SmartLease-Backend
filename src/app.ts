import express, { Application } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app: Application = express();

app.use(
  cors({
    origin: process.env.APP_URL || "http://localhose:3000",
    credentials: true,
  }),
);

app.use(express.json());

app.use(cookieParser());

export default app;
