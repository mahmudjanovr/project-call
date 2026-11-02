# ProjectCall

ProjectCall — Kompaniya ichki CRM va savdo boshqaruvi tizimi (Internal CRM and Sales Management System).

Ushbu repozitoriy loyihaning **1.3-bosqichi (PostgreSQL va Drizzle ORM Poydevori)** asosida takomillashtirilgan.

---

## Texnologiyalar steki

- **Freymvork:** [Next.js](https://nextjs.org/) (App Router)
- **Kutubxona:** [React](https://react.js.org/) 18
- **Dasturlash tili:** [TypeScript](https://www.typescriptlang.org/) (Strict mode)
- **Ma'lumotlar bazasi:** [PostgreSQL](https://www.postgresql.org/)
- **ORM:** [Drizzle ORM](https://orm.drizzle.team/) & [Drizzle Kit](https://orm.drizzle.team/kit-docs/overview)
- **Drayver:** `pg` (node-postgres connection pool)
- **Stillar:** [Tailwind CSS](https://tailwindcss.com/)
- **Dizayn uslubi:** Korporativ yengil mavzu (Light minimal enterprise design, primary restrained blue accent)
- **Arxitektura:** Modulli monolit (Modular Monolith)
- **Interfeys tili:** O'zbek lotin

---

## Ma'lumotlar bazasi arxitekturasi va qoidalari

- **Markazlashtirilgan ulanish:** Baza mijozi `src/db/index.ts` faylida markazlashtirilgan holda boshqariladi.
- **Server-only qoidasi:** Ma'lumotlar bazasiga to'g'ridan-to'g'ri React mijoz (client) komponentlaridan ulanish qat'iyan man etiladi.
- **Sxemalar registratsiyasi:** Barcha Drizzle ORM jadvallari va sxemalari `src/db/schema/index.ts` orqali markazlashtirib eksport qilinadi.
- **Migratsiyalar:** Drizzle Kit tomonidan generatsiya qilingan SQL fayllari `drizzle/` jildida saqlanadi.

---

## Loyiha tuzilishi

```text
projectCall/
├── drizzle/                      # Generatsiya qilingan SQL migratsiya fayllari
├── src/
│   ├── app/                      # Next.js App Router sahifalari va marshrutlar
│   │   ├── customers/            # Mijozlar sahifasi
│   │   ├── employees/            # Xodimlar sahifasi
│   │   ├── orders/               # Buyurtmalar sahifasi
│   │   ├── products/             # Mahsulotlar sahifasi
│   │   ├── reports/              # Hisobotlar sahifasi
│   │   ├── settings/             # Sozlamalar sahifasi
│   │   ├── globals.css           # Global stillar va korporativ ranglar
│   │   ├── layout.tsx            # Bosh ildiz layout (AppShell)
│   │   └── page.tsx              # Boshqaruv paneli (Dashboard)
│   ├── components/               # UI va Layout komponentlari
│   │   ├── layout/               # Header, Sidebar, AppShell, PageContainer
│   │   └── ui/                   # Dizayn tizimi komponentlari (Button, Card, Badge, Input, ...)
│   ├── db/                       # Ma'lumotlar bazasi integratsiyasi
│   │   ├── schema/               # Sxemalar registratsiyasi
│   │   │   └── index.ts
│   │   └── index.ts              # Drizzle ORM va pg pool mijozi
│   ├── lib/                      # Umumiy yordamchi funksiyalar (cn yordamchisi)
│   │   └── utils.ts
│   └── modules/                  # Kelgusi biznes modullar (modular monolith)
├── .env.example                  # Muhit o'zgaruvchilari namunasi
├── drizzle.config.ts             # Drizzle Kit konfiguratsiyasi
├── next.config.mjs               # Next.js konfiguratsiyasi
├── package.json                  # Loyiha skriptlari va bog'liqliklari
├── postcss.config.mjs            # PostCSS sozlamalari
├── tailwind.config.ts            # Tailwind CSS konfiguratsiyasi
└── tsconfig.json                 # TypeScript (Strict mode) sozlamalari
```

---

## O'rnatish va ishga tushirish

### 1. Bog'liqliklarni o'rnatish

```bash
npm install
```

### 2. Muhit o'zgaruvchilarini sozlash

```bash
cp .env.example .env.local
```

`.env.local` faylida PostgreSQL ulanish manzilini (`DATABASE_URL`) kiriting:
```env
DATABASE_URL="postgresql://postgres:parol@localhost:5432/projectcall?schema=public"
```

### 3. Dasturni ishlab chiqish rejimida ishga tushirish

```bash
npm run dev
```

Brauzerda oching: [http://localhost:3000](http://localhost:3000)

---

## Ma'lumotlar bazasi buyruqlari (Database Scripts)

| Buyruq | Vazifasi |
| :--- | :--- |
| `npm run db:generate` | Sxemalar asosida yangi SQL migratsiya fayllarini yaratish |
| `npm run db:migrate` | Barcha kutilayotgan migratsiyalarni PostgreSQL bazasiga qo'llash |
| `npm run db:push` | Sxemani to'g'ridan-to'g'ri bazaga sinxronlash (prototiplash uchun) |
| `npm run db:studio` | Drizzle Studio vizual ma'lumotlar inspektori GUI interfeysini ochish |
| `npm run db:check` | Migratsiya fayllari va sxemaning yaxlitligini tekshirish |
| `npm run db:test` | Real PostgreSQL va Drizzle ulanishini xavfsiz test qilish |

---

## Tizim buyruqlari (System Scripts)

| Buyruq | Vazifasi |
| :--- | :--- |
| `npm run dev` | Ishlab chiqish (development) serverini ishga tushirish |
| `npm run build` | Ishlab chiqarish (production) uchun yig'ish |
| `npm run start` | Ishlab chiqarish serverini ishga tushirish |
| `npm run lint` | ESLint tekshiruvini ishga tushirish |
| `npm run typecheck` | TypeScript turlarini qat'iy tekshirish (`tsc --noEmit`) |
