CREATE TYPE "public"."collaborator_role" AS ENUM('editor', 'viewer');--> statement-breakpoint
CREATE TYPE "public"."collaborator_status" AS ENUM('pending', 'accepted', 'rejected');--> statement-breakpoint
CREATE TABLE "folder_collaborators" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"folder_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"invited_by" text NOT NULL,
	"role" "collaborator_role" NOT NULL,
	"status" "collaborator_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"responded_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "folder_collaborators" ADD CONSTRAINT "folder_collaborators_folder_id_folders_id_fk" FOREIGN KEY ("folder_id") REFERENCES "public"."folders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "folder_collaborators" ADD CONSTRAINT "folder_collaborators_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "folder_collaborators" ADD CONSTRAINT "folder_collaborators_invited_by_users_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "folder_collaborators_folder_user_unique" ON "folder_collaborators" USING btree ("folder_id","user_id");--> statement-breakpoint
CREATE INDEX "folder_collaborators_user_id_idx" ON "folder_collaborators" USING btree ("user_id");