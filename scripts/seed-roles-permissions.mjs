import * as dotenv from "dotenv";
import pg from "pg";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const { Pool } = pg;

export const INITIAL_ROLES = [
  {
    name: "admin",
    displayName: "Administrator",
    description: "Tizim administratori: to'liq tizim boshqaruvi, xodimlar, foydalanuvchilar, rollar va sozlamalar.",
  },
  {
    name: "manager",
    displayName: "Menejer",
    description: "Operatsiyalar va sotuv menejeri: operatorlar va xodimlarni boshqarish, buyurtmalarni ko'rib chiqish va tasdiqlash.",
  },
  {
    name: "operator",
    displayName: "Operator",
    description: "Sotuv va mijozlar operatori: biriktirilgan mijozlar, yangi buyurtmalar yaratish va operatsion vazifalar.",
  },
];

export const INITIAL_PERMISSIONS = [
  // User Management Permissions
  {
    key: "users.read",
    description: "Tizim foydalanuvchilari ro'yxatini va profillarini ko'rish",
  },
  {
    key: "users.create",
    description: "Yangi tizim foydalanuvchi hisoblarini yaratish",
  },
  {
    key: "users.update",
    description: "Foydalanuvchi hisoblari, rollari va holatini yangilash",
  },
  {
    key: "users.delete",
    description: "Foydalanuvchi hisoblarini o'chirish yoki faolsizlantirish",
  },

  // Employee Profile Management Permissions
  {
    key: "employees.read",
    description: "Xodimlar ro'yxatini va ma'lumotlarini ko'rish",
  },
  {
    key: "employees.create",
    description: "Yangi xodim profillarini yaratish",
  },
  {
    key: "employees.update",
    description: "Xodim profillarini tahrirlash va lavozimlarini yangilash",
  },
  {
    key: "employees.delete",
    description: "Xodim profillarini faolsizlantirish yoki o'chirish",
  },

  // Customer Management Permissions
  {
    key: "customers.read",
    description: "Mijozlar ro'yxatini va profillarini ko'rish",
  },
  {
    key: "customers.create",
    description: "Yangi mijozlarni ro'yxatdan o'tkazish",
  },
  {
    key: "customers.update",
    description: "Mijozlar ma'lumotlarini yangilash",
  },

  // Order Lifecycle Permissions
  {
    key: "orders.read",
    description: "Buyurtmalar ro'yxati va holatlarini ko'rish",
  },
  {
    key: "orders.create",
    description: "Yangi buyurtmalarni rasmiylashtirish",
  },
  {
    key: "orders.update",
    description: "Mavjud buyurtma parametrlarini yangilash",
  },
  {
    key: "orders.submit",
    description: "Buyurtmani menejer ko'rib chiqishiga yuborish",
  },
  {
    key: "orders.review",
    description: "Yuborilgan buyurtmalarni tekshirish va ko'rib chiqish",
  },
  {
    key: "orders.approve",
    description: "Buyurtmalarni tasdiqlash",
  },
  {
    key: "orders.reject",
    description: "Buyurtmalarni rad etish",
  },

  // Reporting & Analytics Permissions
  {
    key: "reports.read",
    description: "Operatsion va moliyaviy hisobotlarni ko'rish",
  },

  // Settings & System Permissions
  {
    key: "settings.read",
    description: "Tizim konfiguratsiyasini ko'rish",
  },
  {
    key: "settings.manage",
    description: "Tizim sozlamalari va parametrlarini boshqarish",
  },
  {
    key: "audit.read",
    description: "Xavfsizlik va audit jurnallarini ko'rish",
  },

  // Role Management Permissions
  {
    key: "roles.read",
    description: "Tizim rollari va ruxsatlarini ko'rish",
  },
  {
    key: "roles.manage",
    description: "Tizim rollari va huquqlarini boshqarish",
  },
];

export const ROLE_PERMISSION_MAPPING = {
  admin: [
    // Full system administration
    "users.read",
    "users.create",
    "users.update",
    "users.delete",
    "employees.read",
    "employees.create",
    "employees.update",
    "employees.delete",
    "customers.read",
    "customers.create",
    "customers.update",
    "orders.read",
    "orders.create",
    "orders.update",
    "orders.submit",
    "orders.review",
    "orders.approve",
    "orders.reject",
    "reports.read",
    "settings.read",
    "settings.manage",
    "audit.read",
    "roles.read",
    "roles.manage",
  ],
  manager: [
    // Staff viewing, customer oversight, order lifecycle approval, operational reports
    "employees.read",
    "customers.read",
    "customers.create",
    "customers.update",
    "orders.read",
    "orders.create",
    "orders.update",
    "orders.review",
    "orders.approve",
    "orders.reject",
    "reports.read",
  ],
  operator: [
    // Frontline operations: customer interaction, order creation and submission
    "customers.read",
    "customers.create",
    "customers.update",
    "orders.read",
    "orders.create",
    "orders.submit",
  ],
};

export async function seedRolesAndPermissions(poolInstance = null) {
  const databaseUrl = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
  const pool = poolInstance || new Pool({ connectionString: databaseUrl });
  const shouldClosePool = !poolInstance;

  console.log("==================================================================");
  console.log("  ProjectCall — Idempotent Roles & Permissions Seeding");
  console.log("==================================================================");

  const client = await pool.connect();

  try {
    await client.query("BEGIN;");

    // 1. Seed Roles idempotently without overwriting customized metadata
    console.log("1. Seeding Roles...");
    const roleMap = new Map();
    for (const r of INITIAL_ROLES) {
      const res = await client.query(
        `INSERT INTO roles (name, display_name, description, updated_at)
         VALUES ($1, $2, $3, NOW())
         ON CONFLICT (name) DO UPDATE 
         SET updated_at = roles.updated_at
         RETURNING id, name;`,
        [r.name, r.displayName, r.description]
      );
      roleMap.set(res.rows[0].name, res.rows[0].id);
      console.log(`   ✓ Role '${r.name}' synced (ID: ${res.rows[0].id})`);
    }

    // 2. Seed Permissions idempotently without overwriting customized descriptions
    console.log("\n2. Seeding Permissions...");
    const permMap = new Map();
    for (const p of INITIAL_PERMISSIONS) {
      const res = await client.query(
        `INSERT INTO permissions (key, description, updated_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (key) DO UPDATE
         SET updated_at = permissions.updated_at
         RETURNING id, key;`,
        [p.key, p.description]
      );
      permMap.set(res.rows[0].key, res.rows[0].id);
      console.log(`   ✓ Permission '${p.key}' synced (ID: ${res.rows[0].id})`);
    }

    // 3. Seed Role-Permission Associations idempotently
    console.log("\n3. Seeding Role-Permission Mappings...");
    let mappingCount = 0;
    for (const [roleName, permKeys] of Object.entries(ROLE_PERMISSION_MAPPING)) {
      const roleId = roleMap.get(roleName);
      if (!roleId) throw new Error(`Role not found: ${roleName}`);

      for (const permKey of permKeys) {
        const permId = permMap.get(permKey);
        if (!permId) throw new Error(`Permission not found: ${permKey}`);

        await client.query(
          `INSERT INTO role_permissions (role_id, permission_id)
           VALUES ($1, $2)
           ON CONFLICT (role_id, permission_id) DO NOTHING;`,
          [roleId, permId]
        );
        mappingCount++;
      }
      console.log(`   ✓ Linked ${permKeys.length} permissions to '${roleName}'`);
    }

    await client.query("COMMIT;");
    console.log(`\n✓ Seeding committed successfully: ${roleMap.size} roles, ${permMap.size} permissions, ${mappingCount} mappings.`);
    console.log("==================================================================");
    return { roles: roleMap.size, permissions: permMap.size, mappings: mappingCount };
  } catch (err) {
    await client.query("ROLLBACK;");
    console.error("Seeding failed, rolled back:", err.message);
    throw err;
  } finally {
    client.release();
    if (shouldClosePool) {
      await pool.end();
    }
  }
}

// Direct execution guard
if (process.argv[1]?.endsWith("seed-roles-permissions.mjs")) {
  seedRolesAndPermissions().catch(() => process.exit(1));
}
