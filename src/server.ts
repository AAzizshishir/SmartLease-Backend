import app from "./app";
import { envVariables } from "./config/env";
import { prisma } from "./lib/prisma";

async function main() {
  try {
    await prisma.$connect();
    console.log("Connected to database");

    app.listen(envVariables.PORT, () => {
      console.log(`Server running on port ${envVariables.PORT}`);
    });
  } catch (error) {
    console.error("Error:", error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

main();
