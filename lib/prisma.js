// import "dotenv/config";
// import { PrismaPg } from "@prisma/adapter-pg";
// // import { PrismaClient } from "../generated/prisma/client.js";
// import { PrismaClient } from "@prisma/client";

require("dotenv").config();

// const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("@prisma/client");

// const connectionString = process.env.DATABASE_URL;
// const adapter = new PrismaPg({ connectionString });

// I only need one Prisma Client instance, and lib/prisma.js already fills this role.
const prisma = new PrismaClient({
  // adapter,
});

module.exports = prisma;
