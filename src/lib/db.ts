import { PrismaClient } from '@prisma/client';

declare global {
  // allow global prisma in dev to avoid multiple instances
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export const prisma = global.prisma || new PrismaClient();

if (process.env.NODE_ENV === 'development') global.prisma = prisma;
module.exports = {
  datasource: {
    provider: "mysql",
    url: process.env.DATABASE_URL
  }
};