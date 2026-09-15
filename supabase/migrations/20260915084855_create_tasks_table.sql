CREATE TABLE "tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"completed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "tasks" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "Users can view their own tasks" ON "tasks" FOR SELECT USING (auth.uid() = user_id);
--> statement-breakpoint
CREATE POLICY "Users can insert their own tasks" ON "tasks" FOR INSERT WITH CHECK (auth.uid() = user_id);
--> statement-breakpoint
CREATE POLICY "Users can update their own tasks" ON "tasks" FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
--> statement-breakpoint
CREATE POLICY "Users can delete their own tasks" ON "tasks" FOR DELETE USING (auth.uid() = user_id);
