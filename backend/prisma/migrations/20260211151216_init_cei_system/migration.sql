-- CreateEnum
CREATE TYPE "user_role" AS ENUM ('User', 'Admin', 'Assignee');

-- CreateEnum
CREATE TYPE "ticket_status" AS ENUM ('Draft', 'New', 'Assigned', 'Solving', 'Solved', 'Failed', 'Renew');

-- CreateEnum
CREATE TYPE "comment_visibility" AS ENUM ('Internal', 'Public');

-- CreateTable
CREATE TABLE "users" (
    "user_id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "full_name" TEXT,
    "google_id" TEXT,
    "avartar" TEXT,
    "role" "user_role" NOT NULL DEFAULT 'User',

    CONSTRAINT "users_pkey" PRIMARY KEY ("user_id","email")
);

-- CreateTable
CREATE TABLE "departments" (
    "department" TEXT NOT NULL,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("department")
);

-- CreateTable
CREATE TABLE "categories" (
    "catagory" TEXT NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("catagory")
);

-- CreateTable
CREATE TABLE "tickets" (
    "ticket_id" TEXT NOT NULL,
    "original_message" TEXT NOT NULL,
    "title" TEXT,
    "summary" TEXT,
    "suggested_solution" TEXT,
    "category" TEXT,
    "status" "ticket_status" NOT NULL DEFAULT 'Draft',
    "deadline" TIMESTAMP(3),
    "submission_time" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "creator_id" INTEGER,
    "parent_ticket_id" TEXT,

    CONSTRAINT "tickets_pkey" PRIMARY KEY ("ticket_id")
);

-- CreateTable
CREATE TABLE "user_departments" (
    "user_id" INTEGER NOT NULL,
    "department_name" TEXT NOT NULL,

    CONSTRAINT "user_departments_pkey" PRIMARY KEY ("user_id","department_name")
);

-- CreateTable
CREATE TABLE "ticket_assignments" (
    "ticket_id" TEXT NOT NULL,
    "assignee_id" INTEGER NOT NULL,
    "assigned_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ticket_assignments_pkey" PRIMARY KEY ("ticket_id","assignee_id")
);

-- CreateTable
CREATE TABLE "ticket_followers" (
    "ticket_id" TEXT NOT NULL,
    "follower_id" INTEGER NOT NULL,

    CONSTRAINT "ticket_followers_pkey" PRIMARY KEY ("ticket_id","follower_id")
);

-- CreateTable
CREATE TABLE "comments" (
    "comment_id" SERIAL NOT NULL,
    "ticket_id" TEXT,
    "author_id" INTEGER,
    "content" TEXT,
    "visibility" "comment_visibility" NOT NULL DEFAULT 'Public',
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comments_pkey" PRIMARY KEY ("comment_id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "log_id" SERIAL NOT NULL,
    "ticket_id" TEXT,
    "actor_id" INTEGER,
    "action_type" TEXT,
    "old_value" TEXT,
    "new_value" TEXT,
    "occurred_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("log_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_user_id_key" ON "users"("user_id");

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_category_fkey" FOREIGN KEY ("category") REFERENCES "categories"("catagory") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_parent_ticket_id_fkey" FOREIGN KEY ("parent_ticket_id") REFERENCES "tickets"("ticket_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_departments" ADD CONSTRAINT "user_departments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_departments" ADD CONSTRAINT "user_departments_department_name_fkey" FOREIGN KEY ("department_name") REFERENCES "departments"("department") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_assignments" ADD CONSTRAINT "ticket_assignments_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("ticket_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_assignments" ADD CONSTRAINT "ticket_assignments_assignee_id_fkey" FOREIGN KEY ("assignee_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_followers" ADD CONSTRAINT "ticket_followers_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("ticket_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_followers" ADD CONSTRAINT "ticket_followers_follower_id_fkey" FOREIGN KEY ("follower_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("ticket_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("ticket_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;
