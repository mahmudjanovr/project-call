CREATE TABLE "user_roles" (
	"user_id" uuid NOT NULL,
	"role_id" uuid NOT NULL,
	"assigned_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_roles_user_id_role_id_pk" PRIMARY KEY("user_id","role_id")
);
--> statement-breakpoint
ALTER TABLE "permissions" DROP CONSTRAINT "permissions_code_unique";--> statement-breakpoint
ALTER TABLE "permissions" ALTER COLUMN "code" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "permissions" ALTER COLUMN "name" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "permissions" ALTER COLUMN "module" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "permissions" ADD COLUMN "key" varchar(100);--> statement-breakpoint
UPDATE "permissions"
SET "key" = "code"
WHERE "key" IS NULL AND "code" IS NOT NULL AND "code" != '';--> statement-breakpoint
UPDATE "permissions"
SET "key" = 'perm.' || "id"::text
WHERE "key" IS NULL;--> statement-breakpoint
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "permissions" WHERE "key" IS NULL) THEN
    RAISE EXCEPTION 'Migration 0002 hardening failed: permissions.key contains NULL values';
  END IF;
  IF EXISTS (SELECT "key" FROM "permissions" GROUP BY "key" HAVING count(*) > 1) THEN
    RAISE EXCEPTION 'Migration 0002 hardening failed: duplicate keys detected in permissions table';
  END IF;
END $$;--> statement-breakpoint
ALTER TABLE "permissions" ALTER COLUMN "key" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "permissions" ADD CONSTRAINT "permissions_key_unique" UNIQUE("key");--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "email_verified" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "user_roles_user_id_idx" ON "user_roles" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_roles_role_id_idx" ON "user_roles" USING btree ("role_id");--> statement-breakpoint
CREATE INDEX "permissions_key_idx" ON "permissions" USING btree ("key");