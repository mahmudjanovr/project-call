import { pgTable, uuid, varchar, boolean, timestamp, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { userRoles } from "./user-roles";
import { employees } from "./employees";
import { sessions } from "./sessions";

/**
 * Users table
 * Represents authentication accounts and system credentials.
 * Role assignments are canonically managed through the user_roles join table.
 * Sensitive data (e.g., password_hash) resides strictly here.
 */
export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    passwordHash: varchar("password_hash", { length: 255 }).notNull(),
    isActive: boolean("is_active").notNull().default(true),
    emailVerified: boolean("email_verified").notNull().default(false),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true, mode: "date" }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("users_is_active_idx").on(table.isActive),
  ]
);

export const usersRelations = relations(users, ({ one, many }) => ({
  userRoles: many(userRoles),
  employee: one(employees, {
    fields: [users.id],
    references: [employees.userId],
  }),
  sessions: many(sessions),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

/**
 * Sanitized user representation safe for presentation and client components.
 * Explicitly omits passwordHash to prevent security leaks.
 */
export type SafeUser = Omit<User, "passwordHash">;

export function toSafeUser(user: User): SafeUser {
  const { passwordHash: _hash, ...safeUser } = user;
  void _hash;
  return safeUser;
}
