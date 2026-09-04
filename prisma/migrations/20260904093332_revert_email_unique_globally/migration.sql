/*
  Warnings:

  - A unique constraint covering the columns `[email]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "users_email_idx";

-- DropIndex
DROP INDEX "users_organizationId_email_key";

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
