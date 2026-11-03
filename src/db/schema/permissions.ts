import { pgTable, uuid, varchar, text, timestamp, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { rolePermissions } from "./role-permissions";

/**
 * Permissions table
 * Granular permissions for RBAC authorization across business modules.
 * Primary permission identifier: key (e.g., users.read, employees.create, orders.submit).
 */
export const permissions = pgTable(
  "permissions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    key: varchar("key", { length: 100 }).notNull().unique(),
    code: varchar("code", { length: 100 }),
    name: varchar("name", { length: 100 }),
    module: varchar("module", { length: 50 }),
    description: text("description"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("permissions_module_idx").on(table.module),
  ]
);

export const permissionsRelations = relations(permissions, ({ many }) => ({
  rolePermissions: many(rolePermissions),
}));

export type Permission = typeof permissions.$inferSelect;
export type NewPermission = typeof permissions.$inferInsert;
