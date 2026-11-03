"use server";

import { revalidatePath } from "next/cache";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { customers, orders } from "@/db/schema";
import { requirePermission, getCurrentAuth } from "@/lib/auth/rbac";
import type { ActionResponse } from "@/lib/auth/actions";

export interface CreateCustomerInput {
  name: string;
  phone: string;
  email?: string;
  company?: string;
  notes?: string;
}

export interface CreateOrderInput {
  customerId: string;
  amount: number;
  status?: "pending" | "processing" | "completed" | "cancelled";
  notes?: string;
}

/**
 * Server action: Creates a customer record.
 * RBAC Guard: requires 'customers.create' permission.
 */
export async function createCustomerAction(
  input: CreateCustomerInput
): Promise<ActionResponse<{ id: string; name: string }>> {
  const auth = await requirePermission("customers.create");

  const name = input.name?.trim();
  const phone = input.phone?.trim();
  const email = input.email?.trim() || null;
  const company = input.company?.trim() || null;
  const notes = input.notes?.trim() || null;

  if (!name || !phone) {
    return { success: false, error: "Mijoz ismi va telefon raqami kiritilishi shart." };
  }

  try {
    const [newCustomer] = await db
      .insert(customers)
      .values({
        name,
        phone,
        email,
        company,
        notes,
        assignedEmployeeId: auth.employee.id,
      })
      .returning({ id: customers.id, name: customers.name });

    revalidatePath("/");
    revalidatePath("/customers");

    return { success: true, data: newCustomer };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Mijozni saqlashda xatolik yuz berdi.";
    return { success: false, error: message };
  }
}

/**
 * Server action: Creates a new sales order.
 * RBAC Guard: requires 'orders.create' permission.
 */
export async function createOrderAction(
  input: CreateOrderInput
): Promise<ActionResponse<{ id: string; orderNumber: string }>> {
  const auth = await requirePermission("orders.create");

  const customerId = input.customerId?.trim();
  const amount = Number(input.amount);
  const status = input.status || "pending";
  const notes = input.notes?.trim() || null;

  if (!customerId) {
    return { success: false, error: "Iltimos, mijozni tanlang." };
  }

  if (isNaN(amount) || amount <= 0) {
    return { success: false, error: "Buyurtma summasi 0 dan katta bo'lishi kerak." };
  }

  try {
    // Generate human-readable order number: ORD-YYYYMM-XXXX
    const now = new Date();
    const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `ORD-${yearMonth}-${randomSuffix}`;

    const [newOrder] = await db
      .insert(orders)
      .values({
        orderNumber,
        customerId,
        employeeId: auth.employee.id,
        amount: amount.toString(),
        status,
        notes,
      })
      .returning({ id: orders.id, orderNumber: orders.orderNumber });

    revalidatePath("/");
    revalidatePath("/orders");

    return { success: true, data: newOrder };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Buyurtmani saqlashda xatolik yuz berdi.";
    return { success: false, error: message };
  }
}

/**
 * Server action: Retrieve active customers for order creation modal.
 * RBAC Guard: requires 'customers.read' or 'orders.create'.
 */
export async function getCustomerOptionsAction(): Promise<
  ActionResponse<Array<{ id: string; name: string; phone: string }>>
> {
  const auth = await getCurrentAuth();
  if (!auth) {
    return { success: false, error: "Avtorizatsiya talab qilinadi." };
  }

  try {
    const rows = await db.execute<{ id: string; name: string; phone: string }>(sql`
      SELECT id, name, phone 
      FROM customers 
      WHERE status = 'active'
      ORDER BY name ASC 
      LIMIT 100;
    `);

    return { success: true, data: rows.rows };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Mijozlar ro'yxatini yuklashda xatolik.";
    return { success: false, error: message };
  }
}
