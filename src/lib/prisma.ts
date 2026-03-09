import { PrismaClient } from "@prisma/client";

// Single shared PrismaClient instance for the entire application.
// Instantiating multiple clients exhausts the connection pool.
const prisma = new PrismaClient();

export default prisma;
