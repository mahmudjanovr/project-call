# Modullar arxitektura (Modular Architecture)

Ushbu katalog loyihaning kelgusi biznes modullari uchun mo'ljallangan (modular monolith).

Har bir modul quyidagi tuzilishga ega bo'lishi tavsiya etiladi:
- `components/` - Modulga xos UI komponentlar
- `services/` - Modul biznes mantiqi va ma'lumotlar bilan ishlash
- `types/` - Modulga xos TypeScript turlari
- `index.ts` - Tashqi modullar uchun eksport interfeysi
