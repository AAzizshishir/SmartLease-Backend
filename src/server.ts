import app from "./app";
import { prisma } from "./lib/prisma";

const port = process.env.PORT || 5000;

async function main() {
  try {
    app.get("/", (req, res) => {
      res.send("Smart Lease Backend is running!");
    });

    await prisma.$connect();
    console.log("Connected to the database successfully.");

    app.listen(port, () => {
      console.log(`Server is running on ${port}`);
    });
  } catch (error) {
    console.error("an error occured", error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

main();
