-- CreateTable
CREATE TABLE "ticket_statuses" (
    "status_id" SERIAL NOT NULL,
    "name" VARCHAR(20) NOT NULL,
    "step_order" INTEGER NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ticket_statuses_pkey" PRIMARY KEY ("status_id")
);

-- CreateTable
CREATE TABLE "categories" (
    "category_id" SERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "sla_hours" INTEGER NOT NULL DEFAULT 24,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("category_id")
);

-- CreateTable
CREATE TABLE "users" (
    "user_id" SERIAL NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "name" VARCHAR(100),
    "password" TEXT,
    "role" VARCHAR(20) NOT NULL,
    "google_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "oauth_tokens" (
    "token_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "google_token" TEXT NOT NULL,
    "refresh_token" TEXT,
    "expires_at" TIMESTAMP(3),

    CONSTRAINT "oauth_tokens_pkey" PRIMARY KEY ("token_id")
);

-- CreateTable
CREATE TABLE "requests" (
    "request_id" SERIAL NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "message" TEXT NOT NULL,
    "tracking_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "requests_pkey" PRIMARY KEY ("request_id")
);

-- CreateTable
CREATE TABLE "tickets" (
    "ticket_id" SERIAL NOT NULL,
    "title" VARCHAR(150) NOT NULL,
    "summary" TEXT NOT NULL,
    "suggested_solution" TEXT,
    "status_id" INTEGER,
    "category_id" INTEGER,
    "creator_user_id" INTEGER,
    "assignee_user_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "activated_at" TIMESTAMP(3),
    "activated_by_id" INTEGER,
    "deadline" TIMESTAMP(3),
    "resolved_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3) NOT NULL,
    "resolution_comment_id" INTEGER,
    "priority" VARCHAR(10) NOT NULL DEFAULT 'Medium',

    CONSTRAINT "tickets_pkey" PRIMARY KEY ("ticket_id")
);

-- CreateTable
CREATE TABLE "status_histories" (
    "history_id" SERIAL NOT NULL,
    "ticket_id" INTEGER NOT NULL,
    "old_status_id" INTEGER,
    "new_status_id" INTEGER,
    "changed_by_id" INTEGER,
    "change_reason" TEXT,
    "changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "status_histories_pkey" PRIMARY KEY ("history_id")
);

-- CreateTable
CREATE TABLE "assignment_histories" (
    "assignment_id" SERIAL NOT NULL,
    "ticket_id" INTEGER NOT NULL,
    "old_assignee_id" INTEGER,
    "new_assignee_id" INTEGER,
    "changed_by_id" INTEGER NOT NULL,
    "change_reason" TEXT,
    "changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assignment_histories_pkey" PRIMARY KEY ("assignment_id")
);

-- CreateTable
CREATE TABLE "comments" (
    "comment_id" SERIAL NOT NULL,
    "ticket_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "visibility" VARCHAR(10) NOT NULL DEFAULT 'PUBLIC',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comments_pkey" PRIMARY KEY ("comment_id")
);

-- CreateTable
CREATE TABLE "followers" (
    "follower_id" SERIAL NOT NULL,
    "ticket_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "followed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "followers_pkey" PRIMARY KEY ("follower_id")
);

-- CreateTable
CREATE TABLE "ticket_requests" (
    "ticket_id" INTEGER NOT NULL,
    "request_id" INTEGER NOT NULL,

    CONSTRAINT "ticket_requests_pkey" PRIMARY KEY ("ticket_id","request_id")
);

-- CreateTable
CREATE TABLE "assignee_scopes" (
    "scope_id" SERIAL NOT NULL,
    "assignee_id" INTEGER NOT NULL,
    "scope_name" VARCHAR(50) NOT NULL,

    CONSTRAINT "assignee_scopes_pkey" PRIMARY KEY ("scope_id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "notification_id" SERIAL NOT NULL,
    "ticket_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "type" VARCHAR(30) NOT NULL,
    "message" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("notification_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ticket_statuses_name_key" ON "ticket_statuses"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ticket_statuses_step_order_key" ON "ticket_statuses"("step_order");

-- CreateIndex
CREATE INDEX "ticket_statuses_step_order_idx" ON "ticket_statuses"("step_order");

-- CreateIndex
CREATE UNIQUE INDEX "categories_name_key" ON "categories"("name");

-- CreateIndex
CREATE INDEX "categories_name_idx" ON "categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_google_id_key" ON "users"("google_id");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "users_is_active_idx" ON "users"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "oauth_tokens_user_id_key" ON "oauth_tokens"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "requests_tracking_id_key" ON "requests"("tracking_id");

-- CreateIndex
CREATE INDEX "requests_email_idx" ON "requests"("email");

-- CreateIndex
CREATE INDEX "requests_tracking_id_idx" ON "requests"("tracking_id");

-- CreateIndex
CREATE INDEX "requests_created_at_idx" ON "requests"("created_at");

-- CreateIndex
CREATE INDEX "tickets_status_id_idx" ON "tickets"("status_id");

-- CreateIndex
CREATE INDEX "tickets_category_id_idx" ON "tickets"("category_id");

-- CreateIndex
CREATE INDEX "tickets_assignee_user_id_idx" ON "tickets"("assignee_user_id");

-- CreateIndex
CREATE INDEX "tickets_creator_user_id_idx" ON "tickets"("creator_user_id");

-- CreateIndex
CREATE INDEX "tickets_activated_at_idx" ON "tickets"("activated_at");

-- CreateIndex
CREATE INDEX "tickets_deadline_idx" ON "tickets"("deadline");

-- CreateIndex
CREATE INDEX "tickets_created_at_idx" ON "tickets"("created_at");

-- CreateIndex
CREATE INDEX "tickets_priority_idx" ON "tickets"("priority");

-- CreateIndex
CREATE INDEX "status_histories_ticket_id_idx" ON "status_histories"("ticket_id");

-- CreateIndex
CREATE INDEX "status_histories_new_status_id_idx" ON "status_histories"("new_status_id");

-- CreateIndex
CREATE INDEX "status_histories_changed_at_idx" ON "status_histories"("changed_at");

-- CreateIndex
CREATE INDEX "status_histories_changed_by_id_idx" ON "status_histories"("changed_by_id");

-- CreateIndex
CREATE INDEX "assignment_histories_ticket_id_idx" ON "assignment_histories"("ticket_id");

-- CreateIndex
CREATE INDEX "assignment_histories_new_assignee_id_idx" ON "assignment_histories"("new_assignee_id");

-- CreateIndex
CREATE INDEX "assignment_histories_changed_at_idx" ON "assignment_histories"("changed_at");

-- CreateIndex
CREATE INDEX "comments_ticket_id_idx" ON "comments"("ticket_id");

-- CreateIndex
CREATE INDEX "comments_user_id_idx" ON "comments"("user_id");

-- CreateIndex
CREATE INDEX "comments_created_at_idx" ON "comments"("created_at");

-- CreateIndex
CREATE INDEX "comments_visibility_idx" ON "comments"("visibility");

-- CreateIndex
CREATE INDEX "followers_ticket_id_idx" ON "followers"("ticket_id");

-- CreateIndex
CREATE INDEX "followers_user_id_idx" ON "followers"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "followers_ticket_id_user_id_key" ON "followers"("ticket_id", "user_id");

-- CreateIndex
CREATE INDEX "ticket_requests_ticket_id_idx" ON "ticket_requests"("ticket_id");

-- CreateIndex
CREATE INDEX "ticket_requests_request_id_idx" ON "ticket_requests"("request_id");

-- CreateIndex
CREATE INDEX "assignee_scopes_assignee_id_idx" ON "assignee_scopes"("assignee_id");

-- CreateIndex
CREATE INDEX "assignee_scopes_scope_name_idx" ON "assignee_scopes"("scope_name");

-- CreateIndex
CREATE UNIQUE INDEX "assignee_scopes_assignee_id_scope_name_key" ON "assignee_scopes"("assignee_id", "scope_name");

-- CreateIndex
CREATE INDEX "notifications_ticket_id_idx" ON "notifications"("ticket_id");

-- CreateIndex
CREATE INDEX "notifications_user_id_idx" ON "notifications"("user_id");

-- CreateIndex
CREATE INDEX "notifications_is_read_idx" ON "notifications"("is_read");

-- CreateIndex
CREATE INDEX "notifications_created_at_idx" ON "notifications"("created_at");

-- AddForeignKey
ALTER TABLE "oauth_tokens" ADD CONSTRAINT "oauth_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_status_id_fkey" FOREIGN KEY ("status_id") REFERENCES "ticket_statuses"("status_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("category_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_creator_user_id_fkey" FOREIGN KEY ("creator_user_id") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_assignee_user_id_fkey" FOREIGN KEY ("assignee_user_id") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_activated_by_id_fkey" FOREIGN KEY ("activated_by_id") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_resolution_comment_id_fkey" FOREIGN KEY ("resolution_comment_id") REFERENCES "comments"("comment_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "status_histories" ADD CONSTRAINT "status_histories_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("ticket_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "status_histories" ADD CONSTRAINT "status_histories_old_status_id_fkey" FOREIGN KEY ("old_status_id") REFERENCES "ticket_statuses"("status_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "status_histories" ADD CONSTRAINT "status_histories_new_status_id_fkey" FOREIGN KEY ("new_status_id") REFERENCES "ticket_statuses"("status_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "status_histories" ADD CONSTRAINT "status_histories_changed_by_id_fkey" FOREIGN KEY ("changed_by_id") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignment_histories" ADD CONSTRAINT "assignment_histories_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("ticket_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignment_histories" ADD CONSTRAINT "assignment_histories_old_assignee_id_fkey" FOREIGN KEY ("old_assignee_id") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignment_histories" ADD CONSTRAINT "assignment_histories_new_assignee_id_fkey" FOREIGN KEY ("new_assignee_id") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignment_histories" ADD CONSTRAINT "assignment_histories_changed_by_id_fkey" FOREIGN KEY ("changed_by_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("ticket_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "followers" ADD CONSTRAINT "followers_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("ticket_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "followers" ADD CONSTRAINT "followers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_requests" ADD CONSTRAINT "ticket_requests_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("ticket_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_requests" ADD CONSTRAINT "ticket_requests_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "requests"("request_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignee_scopes" ADD CONSTRAINT "assignee_scopes_assignee_id_fkey" FOREIGN KEY ("assignee_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("ticket_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
