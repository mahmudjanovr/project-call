import * as dotenv from "dotenv";
import pg from "pg";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const { Pool } = pg;

export const INITIAL_ROLES = [
  {
    name: "admin",
    displayName: "Administrator",
    description: "Tizim administratori: xodimlar, foydalanuvchilar, mahsulotlar, rollar, tizim sozlamalari va audit ma'lumotlarini boshqarish huquqiga ega.",
  },
  {
    name: "operator",
    displayName: "Operator",
    description: "Sotuv va mijozlar operatori: mijozlar ma'lumotlarini qidirish va ko'rish, yangi mijozlar va buyurtmalar yaratish, menejer ko'rib chiqishiga yuborish huquqiga ega.",
  },
  {
    name: "manager",
    displayName: "Menejer",
    description: "Buyurtmalar va operatsiyalar menejeri: buyurtmalarni ko'rib chiqish, tasdiqlash yoki rad etish hamda operatsion ma'lumotlarni kuzatish huquqiga ega.",
  },
];

export const INITIAL_PERMISSIONS = [
  // Admin permissions
  {
    code: "users:manage",
    name: "Foydalanuvchilarni boshqarish",
    module: "users",
    description: "Tizim foydalanuvchi hisoblarini yaratish, yangilash va holatini o'zgartirish",
  },
  {
    code: "employees:manage",
    name: "Xodimlarni boshqarish",
    module: "employees",
    description: "Xodim profillari, lavozim va bo'lim ma'lumotlarini boshqarish",
  },
  {
    code: "products:manage",
    name: "Mahsulotlarni boshqarish",
    module: "products",
    description: "Mahsulotlar katalogini boshqarish va narxlarni sozlash",
  },
  {
    code: "roles:manage",
    name: "Rollar va huquqlarni boshqarish",
    module: "roles",
    description: "Rollar va ularga tegishli ruxsatlarni boshqarish",
  },
  {
    code: "system:settings:read",
    name: "Tizim sozlamalarini ko'rish",
    module: "system",
    description: "Tizim konfiguratsiyasi va parametrlarini o'qish",
  },
  {
    code: "system:settings:manage",
    name: "Tizim sozlamalarini boshqarish",
    module: "system",
    description: "Tizim sozlamalari va parametrlarini o'zgartirish",
  },
  {
    code: "audit:read",
    name: "Audit ma'lumotlarini ko'rish",
    module: "audit",
    description: "Tizim xavfsizligi va harakatlar audit jurnallarini ko'rish",
  },

  // Operator permissions
  {
    code: "customers:read",
    name: "Mijozlarni ko'rish",
    module: "customers",
    description: "Umumiy mijozlar bazasida qidirish va profillarni ko'rish",
  },
  {
    code: "customers:create",
    name: "Mijoz yaratish",
    module: "customers",
    description: "Yangi mijoz yozuvlarini tizimga kiritish",
  },
  {
    code: "orders:create",
    name: "Buyurtma yaratish",
    module: "orders",
    description: "Yangi buyurtmalarni shakllantirish",
  },
  {
    code: "orders:submit",
    name: "Buyurtmani yuborish",
    module: "orders",
    description: "Buyurtmalarni menejer tasdiqlashiga yuborish",
  },

  // Manager permissions
  {
    code: "orders:review",
    name: "Buyurtmalarni ko'rib chiqish",
    module: "orders",
    description: "Taqdim etilgan buyurtmalarni tekshirish va ko'rib chiqish",
  },
  {
    code: "orders:approve",
    name: "Buyurtmani tasdiqlash",
    module: "orders",
    description: "Menejer tekshiruvidan o'tgan buyurtmalarni tasdiqlash",
  },
  {
    code: "orders:reject",
    name: "Buyurtmani rad etish",
    module: "orders",
    description: "Buyurtmalarni asoslangan sabab bilan rad etish",
  },
  {
    code: "operations:read",
    name: "Operatsion ma'lumotlarni ko'rish",
    module: "operations",
    description: "Tegishli operatsion ko'rsatkichlar va hisobotlarni ko'rish",
  },
];

export const ROLE_PERMISSION_MAPPING = {
  admin: [
    "users:manage",
    "employees:manage",
    "products:manage",
    "roles:manage",
    "system:settings:read",
    "system:settings:manage",
    "audit:read",
  ],
  operator: [
    "customers:read",
    "customers:create",
    "orders:create",
    "orders:submit",
  ],
  manager: [
    "orders:review",
    "orders:approve",
    "orders:reject",
    "operations:read",
  ],
};

export async function seedRolesAndPermissions(poolInstance = null) {
  const pool = poolInstance || new Pool({ connectionString: process.env.DATABASE_URL });
  const shouldClosePool = !poolInstance;

  console.log("==================================================================");
  console.log("  ProjectCall — Idempotent Roles & Permissions Seeding");
  console.log("==================================================================");

  const client = await pool.connect();

  try {
    await client.query("BEGIN;");

    // 1. Seed Roles idempotently
    console.log("1. Seeding Roles...");
    const roleMap = new Map();
    for (const r of INITIAL_ROLES) {
      const res = await client.query(
        `INSERT INTO roles (name, display_name, description, updated_at)
         VALUES ($1, $2, $3, NOW())
         ON CONFLICT (name) DO UPDATE 
         SET display_name = EXCLUDED.display_name,
             description = EXCLUDED.description,
             updated_at = NOW()
         RETURNING id, name;`,
        [r.name, r.displayName, r.description]
      );
      roleMap.set(res.rows[0].name, res.rows[0].id);
      console.log(`   ✓ Role '${r.name}' synced (ID: ${res.rows[0].id})`);
    }

    // 2. Seed Permissions idempotently
    console.log("\n2. Seeding Permissions...");
    const permMap = new Map();
    for (const p of INITIAL_PERMISSIONS) {
      const res = await client.query(
        `INSERT INTO permissions (code, name, module, description, updated_at)
         VALUES ($1, $2, $3, $4, NOW())
         ON CONFLICT (code) DO UPDATE
         SET name = EXCLUDED.name,
             module = EXCLUDED.module,
             description = EXCLUDED.description,
             updated_at = NOW()
         RETURNING id, code;`,
        [p.code, p.name, p.module, p.description]
      );
      permMap.set(res.rows[0].code, res.rows[0].id);
      console.log(`   ✓ Permission '${p.code}' synced (ID: ${res.rows[0].id})`);
    }

    // 3. Seed Role-Permission Associations idempotently
    console.log("\n3. Seeding Role-Permission Mappings...");
    let mappingCount = 0;
    for (const [roleName, permCodes] of Object.entries(ROLE_PERMISSION_MAPPING)) {
      const roleId = roleMap.get(roleName);
      if (!roleId) throw new Error(`Role not found: ${roleName}`);

      for (const permCode of permCodes) {
        const permId = permMap.get(permCode);
        if (!permId) throw new Error(`Permission not found: ${permCode}`);

        await client.query(
          `INSERT INTO role_permissions (role_id, permission_id)
           VALUES ($1, $2)
           ON CONFLICT (role_id, permission_id) DO NOTHING;`,
          [roleId, permId]
        );
        mappingCount++;
      }
      console.log(`   ✓ Linked ${permCodes.length} permissions to '${roleName}'`);
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

// Direct execution
if (process.argv[1]?.endsWith("seed-roles-permissions.mjs")) {
  seedRolesAndPermissions().catch(() => process.exit(1));
}
