# Kartu Pokémon Indonesia

Database kartu Pokémon TCG versi bahasa Indonesia yang lengkap. Pengguna dapat menelusuri kartu, membangun koleksi, membuat daftar keinginan (wishlist), dan merakit deck kompetitif.

---

## Fitur Utama

| Fitur | Deskripsi |
|-------|-----------|
| **Library Kartu** | Telusuri 5.000+ kartu dengan filter ekspansi, tipe, elemen, stage, ilustrator, regulasi, dan rarity |
| **Detail Kartu** | Lihat detail lengkap: HP, serangan, kelemahan, resistansi, biaya mundur, info Pokédex, dan ilustrator |
| **Koleksi** | Catat jumlah kartu yang dimiliki dan bagikan koleksi lewat link unik |
| **Wishlist** | Tandai kartu yang ingin didapatkan |
| **Deck Builder** | Rakit deck hingga 60 kartu dengan aturan TCG (maks 4 salinan per nama) |
| **Manajemen Deck** | Simpan, edit, hapus, dan bagikan deck lewat link publik |
| **Admin Panel** | Tambah, ubah, dan hapus data kartu (khusus admin) |

---

## Tech Stack

| Layer | Teknologi |
|-------|-----------|
| Frontend | [Next.js 16](https://nextjs.org/) (App Router, Turbopack) |
| Styling | [Tailwind CSS v4](https://tailwindcss.com/) |
| Database | [Supabase](https://supabase.com/) (PostgreSQL + RLS) |
| Autentikasi | Google OAuth via Supabase Auth |
| Caching | [Upstash Redis](https://upstash.com/) + in-memory fallback |
| Rate Limiting | Upstash Ratelimit (Server Actions) |
| Monitoring | [Sentry](https://sentry.io/) |
| Deployment | [Vercel](https://vercel.com/) |

---

## Security

| Proteksi | Detail |
|----------|--------|
| **CSP** | Content-Security-Policy header membatasi sumber script, gambar, dan koneksi |
| **RLS** | Row Level Security di PostgreSQL memastikan ownership data di level database |
| **Auth Guard** | Proxy middleware memvalidasi autentikasi untuk route yang dilindungi |
| **Admin Role** | Admin diverifikasi via `app_metadata.role` secara konsisten di seluruh stack |
| **Rate Limiting** | Server Actions dibatasi 20 request / 10 detik per IP |
| **Security Headers** | HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy |
| **Open Redirect Prevention** | Parameter `next` di auth callback divalidasi untuk mencegah redirect eksternal |

---

## Instalasi Lokal

### Prasyarat
- Node.js 18+
- npm atau yarn
- Akun Supabase
- Akun Upstash (opsional, untuk caching Redis)

### Langkah Instalasi

```bash
# 1. Clone repositori
git clone https://github.com/Irsanngrh/kartu-pokemon-indonesia
cd kartu-pokemon-indonesia

# 2. Install dependensi
npm install

# 3. Salin file environment
cp .env.example .env.local

# 4. Isi variabel environment (lihat bagian di bawah)

# 5. Jalankan development server
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser.

---

## Konfigurasi Environment

Buat file `.env.local` di root proyek dengan variabel berikut:

```env
# Supabase (wajib)
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhb...

# Upstash Redis (opsional — digunakan untuk caching dan rate limiting)
UPSTASH_REDIS_REST_URL=https://xxxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=AXxx...

# Sentry (opsional — digunakan untuk monitoring error)
NEXT_PUBLIC_SENTRY_DSN=https://xxxx@sentry.io/xxxx
SENTRY_ORG=nama-org
SENTRY_PROJECT=nama-project
```

---

## Database Setup (Supabase)

### 1. Buat project Supabase
Kunjungi [supabase.com](https://supabase.com) dan buat project baru.

### 2. Schema database
Jalankan SQL berikut di **Supabase SQL Editor**:

```sql
-- Tabel set ekspansi kartu
CREATE TABLE sets (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  set_order INTEGER DEFAULT 99
);

-- Tabel kartu utama
CREATE TABLE cards (
  id SERIAL PRIMARY KEY,
  set_id INTEGER REFERENCES sets(id),
  name TEXT NOT NULL,
  card_number TEXT,
  image_url TEXT,
  rarity TEXT,
  variant_name TEXT,
  variant_order INTEGER DEFAULT 1,
  stage TEXT,
  hp TEXT,
  types TEXT[],
  illustrator TEXT,
  regulation_mark TEXT,
  pokedex_number TEXT,
  species TEXT,
  height TEXT,
  weight TEXT,
  description TEXT,
  attacks JSONB,
  weakness JSONB,
  resistance JSONB,
  retreat_cost INTEGER DEFAULT 0,
  expansion_symbol_url TEXT,
  evolution TEXT[]
);

-- Tabel koleksi pengguna
CREATE TABLE user_collections (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  card_id INTEGER REFERENCES cards(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 0,
  is_wishlist BOOLEAN DEFAULT FALSE,
  UNIQUE(user_id, card_id)
);

-- Tabel deck pengguna
CREATE TABLE user_decks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Deck Baru',
  cards JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index untuk performa
CREATE INDEX ON cards(name);
CREATE INDEX ON cards(set_id);
CREATE INDEX ON cards(regulation_mark);
CREATE INDEX ON cards(stage);
CREATE INDEX ON cards(rarity);
CREATE INDEX ON user_collections(user_id);
CREATE INDEX ON user_decks(user_id);
```

### 3. Row Level Security (RLS)
Jalankan file `scripts/rls-policies.sql` di SQL Editor, atau salin perintah berikut:

```sql
-- Aktifkan RLS untuk semua tabel
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_decks ENABLE ROW LEVEL SECURITY;

-- Kartu & set: semua bisa baca, hanya admin yang bisa tulis
CREATE POLICY "Public read cards" ON cards FOR SELECT USING (true);
CREATE POLICY "Admins insert cards" ON cards FOR INSERT
  WITH CHECK ((SELECT (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'));
CREATE POLICY "Admins update cards" ON cards FOR UPDATE
  USING ((SELECT (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'));
CREATE POLICY "Admins delete cards" ON cards FOR DELETE
  USING ((SELECT (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'));

CREATE POLICY "Public read sets" ON sets FOR SELECT USING (true);
CREATE POLICY "Admins manage sets" ON sets FOR ALL
  USING ((SELECT (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'));

-- Koleksi: publik bisa baca (sharing via link), hanya pemilik yang bisa tulis
CREATE POLICY "Public read collections" ON user_collections FOR SELECT USING (true);
CREATE POLICY "Users insert own collections" ON user_collections FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own collections" ON user_collections FOR UPDATE
  USING (auth.uid() = user_id);
CREATE POLICY "Users delete own collections" ON user_collections FOR DELETE
  USING (auth.uid() = user_id);

-- Deck: publik bisa baca (sharing via link), hanya pemilik yang bisa tulis
CREATE POLICY "Public read decks" ON user_decks FOR SELECT USING (true);
CREATE POLICY "Users insert own decks" ON user_decks FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own decks" ON user_decks FOR UPDATE
  USING (auth.uid() = user_id);
CREATE POLICY "Users delete own decks" ON user_decks FOR DELETE
  USING (auth.uid() = user_id);
```

### 4. Setup Admin Role
Untuk memberikan akses admin, jalankan di **Supabase SQL Editor**:

```sql
-- Ganti 'USER_ID_HERE' dengan UUID user yang menjadi admin
UPDATE auth.users 
SET raw_app_meta_data = raw_app_meta_data || '{"role": "admin"}'
WHERE id = 'USER_ID_HERE';
```

---

## Deployment ke Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Ikuti petunjuk dan tambahkan variabel environment dari .env.local
```

Atau hubungkan repositori GitHub ke Vercel Dashboard dan tambahkan **Environment Variables** secara manual.

---

## Struktur Proyek

```
app/
├── actions/          # Server Actions (data layer)
│   ├── cards.fetch.ts    # Fetching & filtering kartu dengan caching
│   ├── cards.ts          # CRUD kartu (admin-only)
│   ├── collections.ts    # Manajemen koleksi pengguna
│   └── decks.ts          # CRUD deck pengguna
├── admin/            # Panel admin (dilindungi RLS + role check)
├── auth/callback/    # OAuth callback handler
├── [set_code]/       # Halaman detail kartu
├── collection/       # Halaman koleksi pengguna
├── decks/            # Deck dashboard & builder
└── layout.tsx        # Root layout

components/
├── ui/               # Komponen reusable (Navbar, Dropdown, PokemonCard, dll)
└── views/            # Komponen halaman besar (LibraryView, CardDetailView, dll)

lib/
├── card-helpers.ts   # Helper klasifikasi kartu (stage, elemen, tipe)
└── constants.ts      # Konstanta aplikasi (limit, cache key, dll)

scripts/
├── rls-policies.sql  # SQL migrasi RLS untuk Supabase
├── scrape.js         # Script scraping data kartu (dev-only)
└── seed.js           # Script seeding database (dev-only)

types/
└── index.ts          # Definisi tipe TypeScript

utils/
└── supabase/         # Supabase client (server & client side)

proxy.ts              # Middleware: auth guard, rate limiting, session refresh
```
