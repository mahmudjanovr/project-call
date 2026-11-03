INSERT INTO "user_roles" ("user_id", "role_id", "assigned_at")
SELECT "id", "role_id", COALESCE("created_at", now())
FROM "users"
WHERE "role_id" IS NOT NULL
ON CONFLICT ("user_id", "role_id") DO NOTHING;
--> statement-breakpoint
ALTER TABLE "users" DROP CONSTRAINT "users_role_id_roles_id_fk";
--> statement-breakpoint
DROP INDEX "users_role_id_idx";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "role_id";