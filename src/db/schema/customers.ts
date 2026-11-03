import { pgTable, uuid, varchar, text, timestamp, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { employees } from "./employees";

/**
 * Customers table
 * Represents company clients / customer accounts.
 */
export const customers = pgTable(
  "customers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    phone: varchar("phone", { length: 50 }).notNull(),
    email: varchar("email", { length: 255 }),
    company: varchar("company", { length: 255 }),
    status: varchar("status", { length: 50 }).notNull().default("active"), // active, lead, inactive
    notes: text("notes"),
    assignedEmployeeId: uuid("assigned_employee_id").references(() => employees.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("customers_phone_idx").on(table.phone),
    index("customers_status_idx").on(table.status),
    index("customers_created_at_idx").on(table.createdAt),
    index("customers_assigned_employee_id_idx").on(table.assignedEmployeeId),
  ]
);

export const customersRelations = relations(customers, ({ one, many }) => ({
  assignedEmployee: one(employees, {
    fields: [customers.assignedEmployeeId],
    references: [employees.id],
  }),
}));

export type Customer = typeof customers.$inferSelect;
export type NewCustomer = typeof customers.$inferInsert;
