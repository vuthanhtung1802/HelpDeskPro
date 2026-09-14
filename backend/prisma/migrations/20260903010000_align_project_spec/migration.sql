ALTER TYPE "TicketStatus" ADD VALUE 'REOPENED';

ALTER TABLE "User" ADD COLUMN "avatarUrl" TEXT;
ALTER TABLE "Ticket" ADD COLUMN "dueAt" TIMESTAMP(3);
ALTER TABLE "TicketHistory" ADD COLUMN "action" TEXT NOT NULL DEFAULT 'UPDATED';
ALTER TABLE "TicketHistory" ALTER COLUMN "action" DROP DEFAULT;
ALTER TABLE "TicketHistory" ALTER COLUMN "field" DROP NOT NULL;

CREATE INDEX "Ticket_dueAt_status_idx" ON "Ticket"("dueAt", "status");
