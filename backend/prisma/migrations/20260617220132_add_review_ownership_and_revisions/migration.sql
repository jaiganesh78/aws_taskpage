-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ActivityAction" ADD VALUE 'work_submitted';
ALTER TYPE "ActivityAction" ADD VALUE 'review_approved';
ALTER TYPE "ActivityAction" ADD VALUE 'review_changes_requested';
ALTER TYPE "ActivityAction" ADD VALUE 'archived';
ALTER TYPE "ActivityAction" ADD VALUE 'permanently_deleted';
ALTER TYPE "ActivityAction" ADD VALUE 'attachment_added';

-- AlterTable
ALTER TABLE "tasks" ADD COLUMN     "reviewAssignedAt" TIMESTAMP(3),
ADD COLUMN     "reviewAssignedToId" TEXT;

-- AlterTable
ALTER TABLE "work_updates" ADD COLUMN     "revisionNumber" INTEGER NOT NULL DEFAULT 1;

-- CreateIndex
CREATE INDEX "review_decisions_taskId_createdAt_idx" ON "review_decisions"("taskId", "createdAt");

-- CreateIndex
CREATE INDEX "tasks_reviewAssignedToId_idx" ON "tasks"("reviewAssignedToId");

-- CreateIndex
CREATE INDEX "tasks_isDeleted_archivedAt_status_idx" ON "tasks"("isDeleted", "archivedAt", "status");

-- CreateIndex
CREATE INDEX "tasks_isDeleted_submittedAt_idx" ON "tasks"("isDeleted", "submittedAt");

-- CreateIndex
CREATE INDEX "work_updates_taskId_createdAt_idx" ON "work_updates"("taskId", "createdAt");

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_reviewAssignedToId_fkey" FOREIGN KEY ("reviewAssignedToId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
