import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const connectionString = `${process.env.DATABASE_URL}`;

const adapter = new PrismaPg({ connectionString });
const prismaClient = new PrismaClient({ adapter });

const softDeleteFilter = (args: any) => {
  if (!args.where?.__includeDeleted) {
    args.where = {
      ...args.where,
      is_deleted: false,
    };
  } else {
    delete args.where.__includeDeleted;
  }
  return args;
};

export const prisma = prismaClient.$extends({
  query: {
    property: {
      async findFirst({ args, query }) {
        return query(softDeleteFilter(args));
      },
      async findMany({ args, query }) {
        return query(softDeleteFilter(args));
      },
    },
    unit: {
      async findFirst({ args, query }) {
        return query(softDeleteFilter(args));
      },
      async findMany({ args, query }) {
        return query(softDeleteFilter(args));
      },
    },
  },
});

// export { prisma };
