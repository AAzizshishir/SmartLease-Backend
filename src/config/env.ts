import dotenv from "dotenv";

dotenv.config();

interface envConfig {
  NODE_ENV: string;
  DATABASE_URL: string;
  PORT: string;
  APP_URL: string;
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
}

const loadEnvVariables = (): envConfig => {
  const requireEnvVariables = [
    "NODE_ENV",
    "DATABASE_URL",
    "PORT",
    "APP_URL",
    "BETTER_AUTH_SECRET",
    "BETTER_AUTH_URL",
  ];

  requireEnvVariables.forEach((variable) => {
    if (!process.env[variable]) {
      throw new Error(
        `Environment variable ${variable} is required but not set in .env file.`,
      );
    }
  });

  return {
    NODE_ENV: process.env.NODE_ENV as string,
    DATABASE_URL: process.env.DATABASE_URL as string,
    PORT: process.env.PORT as string,
    APP_URL: process.env.APP_URL as string,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET as string,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL as string,
  };
};

export const envVariables = loadEnvVariables();
