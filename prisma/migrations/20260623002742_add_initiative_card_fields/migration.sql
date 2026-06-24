-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- AlterTable
ALTER TABLE "Initiative" ADD COLUMN     "nextAction" TEXT,
ADD COLUMN     "nextActionDueDate" TIMESTAMP(3),
ADD COLUMN     "nextActionOwnerId" TEXT,
ADD COLUMN     "priority" "Priority";

-- AddForeignKey
ALTER TABLE "Initiative" ADD CONSTRAINT "Initiative_nextActionOwnerId_fkey" FOREIGN KEY ("nextActionOwnerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
