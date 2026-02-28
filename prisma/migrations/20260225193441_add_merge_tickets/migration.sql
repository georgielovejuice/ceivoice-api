-- AlterTable
ALTER TABLE "tickets" ADD COLUMN     "parent_ticket_id" INTEGER;

-- CreateIndex
CREATE INDEX "tickets_parent_ticket_id_idx" ON "tickets"("parent_ticket_id");

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_parent_ticket_id_fkey" FOREIGN KEY ("parent_ticket_id") REFERENCES "tickets"("ticket_id") ON DELETE SET NULL ON UPDATE CASCADE;
