-- CreateEnum
CREATE TYPE "ReviewDecisionType" AS ENUM ('approved', 'changes_requested');

-- AlterTable
ALTER TABLE "tasks" ADD COLUMN     "archivedAt" TIMESTAMP(3),
ADD COLUMN     "assignedAt" TIMESTAMP(3),
ADD COLUMN     "reviewedAt" TIMESTAMP(3),
ADD COLUMN     "submittedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "work_updates" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "progress" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "work_updates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_attachments" (
    "id" TEXT NOT NULL,
    "workUpdateId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "work_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review_decisions" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "workUpdateId" TEXT,
    "decision" "ReviewDecisionType" NOT NULL,
    "comment" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "review_decisions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "work_updates_taskId_idx" ON "work_updates"("taskId");

-- CreateIndex
CREATE INDEX "work_updates_userId_idx" ON "work_updates"("userId");

-- CreateIndex
CREATE INDEX "work_attachments_workUpdateId_idx" ON "work_attachments"("workUpdateId");

-- CreateIndex
CREATE INDEX "review_decisions_taskId_idx" ON "review_decisions"("taskId");

-- CreateIndex
CREATE INDEX "review_decisions_reviewerId_idx" ON "review_decisions"("reviewerId");

-- AddForeignKey
ALTER TABLE "work_updates" ADD CONSTRAINT "work_updates_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_updates" ADD CONSTRAINT "work_updates_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_attachments" ADD CONSTRAINT "work_attachments_workUpdateId_fkey" FOREIGN KEY ("workUpdateId") REFERENCES "work_updates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_decisions" ADD CONSTRAINT "review_decisions_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_decisions" ADD CONSTRAINT "review_decisions_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_decisions" ADD CONSTRAINT "review_decisions_workUpdateId_fkey" FOREIGN KEY ("workUpdateId") REFERENCES "work_updates"("id") ON DELETE SET NULL ON UPDATE CASCADE;
