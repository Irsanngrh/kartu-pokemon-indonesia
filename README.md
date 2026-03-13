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
| **Manajemen Deck** | Simpan, edit, dan hapus deck |
| **Admin Panel** | Tambah, ubah, dan hapus data kartu (khusus admin) |

---

## Tech Stack

| Layer | Teknologi |
|-------|-----------|
| Frontend | [Next.js 16](https://nextjs.org/) (App Router) |
| Styling | [Tailwind CSS v4](https://tailwindcss.com/) |
| Database | [Supabase](https://supabase.com/) (PostgreSQL) |
| Autentikasi | Google OAuth via Supabase Auth |
| Caching | [Upstash Redis](https://upstash.com/) |
| Rate Limiting | Upstash Ratelimit |
| Monitoring | [Sentry](https://sentry.io/) |
| Deployment | [Vercel](https://vercel.com/) |

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
SENTRY_DSN=https://xxxx@sentry.io/xxxx
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
```sql
-- Aktifkan RLS
ALTER TABLE user_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_decks ENABLE ROW LEVEL SECURITY;

-- Policy koleksi
CREATE POLICY "Users manage own collection"
  ON user_collections FOR ALL
  USING (auth.uid() = user_id);

-- Policy deck
CREATE POLICY "Users manage own decks"
  ON user_decks FOR ALL
  USING (auth.uid() = user_id);
```

### 4. Setup Admin Role
Untuk memberikan akses admin, jalankan di **Supabase Authentication → User Management** atau via SQL:

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
│   ├── cards.fetch.ts
│   ├── cards.ts
│   ├── collections.ts
│   └── decks.ts
├── admin/            # Panel admin
├── [set_code]/       # Halaman detail kartu
├── collection/       # Halaman koleksi pengguna
├── decks/            # Deck builder
└── layout.tsx        # Root layout

components/
├── ui/               # Komponen reusable kecil
└── views/            # Komponen halaman besar

lib/
└── constants.ts      # Konstanta aplikasi

types/
└── index.ts          # Definisi tipe TypeScript

utils/
└── supabase/         # Supabase client (server & client side)

middleware.ts          # Auth protection & rate limiting
```
