/**
 * Create ADMIN User Script
 * Run this to create a test admin user in the database
 * Usage: npx ts-node scripts/create-admin-user.ts
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function createAdminUser() {
  try {
    // Admin credentials
    const adminEmail = "admin@ceivoice.com";
    const adminPassword = "Admin123!"; // Change this password!
    const adminName = "Admin User";

    // Check if admin already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail },
    });

    if (existingAdmin) {
      console.log(`✓ Admin user already exists with email: ${adminEmail}`);
      console.log(`  user_id: ${existingAdmin.user_id}`);
      process.exit(0);
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminPassword, salt);

    // Create admin user
    const adminUser = await prisma.user.create({
      data: {
        email: adminEmail,
        name: adminName,
        password: hashedPassword,
        role: "ADMIN",
      },
    });

    console.log("✓ Admin user created successfully!");
    console.log(`
  Email: ${adminEmail}
  Password: ${adminPassword}
  Role: ADMIN
  User ID: ${adminUser.user_id}
  
  Use these credentials to login in Postman.
    `);

    process.exit(0);
  } catch (error) {
    console.error("Error creating admin user:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser();
