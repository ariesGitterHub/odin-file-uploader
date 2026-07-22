// import "dotenv/config";
// import bcrypt from "bcryptjs";
// import { PrismaClient } from "@prisma/client";

require("dotenv/config");
const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function seed() {
    // await prisma.user.deleteMany() // Clear existing data first // TODO - Keep????

  // Temp password hashes for dev
    if (!process.env.MMM_FAST_PASSWORD) {
      throw new Error("MMM_FAST_PASSWORD is not defined");
    }
    
  const hash = await bcrypt.hash(process.env.MMM_FAST_PASSWORD, 12);
  console.log(hash); // TODO - remove before committing

  // Create admin user
  const admin = await prisma.user.create({
    data: {
      firstName: "Admin",
      lastName: "User",
      email: "admin@fua.com",
      passwordHash: hash,
      role: "ADMIN",
      emailVerified: true,
    },
  });

  const user = await prisma.user.create({
    data: {
      firstName: "Joe",
      lastName: "User",
      email: "joe@fua.com",
      passwordHash: hash,
      role: "USER",
      emailVerified: true,
    },
  });

  console.log("Created admin:", admin.email);
  console.log("Created user:", user.email);
}

seed()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });


