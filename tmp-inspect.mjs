import { PrismaClient } from "./app/generated/prisma/client";
const prisma = new PrismaClient();
console.log(Object.keys(prisma));
await prisma.$disconnect();
