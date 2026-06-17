import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // For migrations: set DATABASE_URL to the DIRECT connection (not pooled).
    // For app runtime: use the pooled connection string.
    // Supabase users: set DATABASE_URL=direct connection for `prisma migrate`,
    // then switch to the pooled URL in production.
    url: process.env["DATABASE_URL"],
  },
});
