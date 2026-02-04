-- AlterTable
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'USER';

-- AddForeignKey
ALTER TABLE "AssignmentHistory" ADD CONSTRAINT "AssignmentHistory_old_assignee_id_fkey" FOREIGN KEY ("old_assignee_id") REFERENCES "User"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssignmentHistory" ADD CONSTRAINT "AssignmentHistory_new_assignee_id_fkey" FOREIGN KEY ("new_assignee_id") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
