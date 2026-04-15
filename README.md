# Kartu Pokémon Indonesia

Database kartu Pokémon TCG versi bahasa Indonesia yang lengkap. Pengguna dapat menelusuri kartu, mengelola koleksi pribadi, membuat daftar keinginan, dan merakit deck kompetitif.

---

## Fitur Utama

| Fitur | Deskripsi |
|-------|-----------|
| **Library Kartu** | Telusuri 9.000+ kartu dengan filter ekspansi, tipe, elemen, stage, ilustrator, regulasi, dan rarity. Filter tersimpan di session storage untuk navigasi balik. |
| **Detail Kartu** | Lihat detail lengkap kartu: HP, serangan, kelemahan, resistansi, biaya mundur, info Pokédex, dan ilustrator. Gambar dapat diperbesar. |
| **Koleksi** | Catat jumlah kartu yang dimiliki dan bagikan koleksi melalui tautan unik. |
| **Wishlist** | Tandai kartu yang ingin didapatkan. |
| **Deck Builder** | Rakit deck hingga 60 kartu dengan aturan TCG (maks. 4 salinan per nama, energi dasar tidak terbatas). Kanvas deck sticky dan terpisah dari katalog. |
| **Manajemen Deck** | Simpan, edit, hapus, dan bagikan deck melalui tautan publik. |
| **Panel Admin** | Tambah, ubah, dan hapus data kartu serta ekspansi melalui form modal. Dilindungi oleh kolom `is_admin` dan variabel lingkungan `ADMIN_EMAILS`. |
| **Dark Mode** | Tema terang/gelap yang konsisten menggunakan `next-themes`. |

---

## Teknologi yang Digunakan

| Lapisan | Teknologi |
|---------|-----------|
| Frontend | [Next.js 16](https://nextjs.org/) (App Router, Turbopack) |
| Styling | [Tailwind CSS v4](https://tailwindcss.com/) |
| Database | [Supabase](https://supabase.com/) (PostgreSQL + RLS) |
| Autentikasi | Google OAuth melalui [Auth.js v5](https://authjs.dev/) (NextAuth) |
| Caching | [Upstash Redis](https://upstash.com/) + cache in-memory sebagai cadangan |
| Rate Limiting | Upstash Ratelimit (Server Actions, 20 permintaan / 10 detik per IP) |
| Deployment | [Vercel](https://vercel.com/) |

---

## Keamanan

| Proteksi | Detail |
|----------|--------|
| **CSP** | Header `Content-Security-Policy` membatasi sumber skrip, gambar, dan koneksi |
| **RLS** | Row Level Security di PostgreSQL memastikan kepemilikan data di level database |
| **Auth Guard** | Middleware `proxy.ts` memvalidasi autentikasi untuk rute yang dilindungi |
| **Peran Admin** | Akses admin dikendalikan oleh kolom `is_admin` di tabel `users`, dapat ditimpa melalui variabel lingkungan `ADMIN_EMAILS` |
| **Rate Limiting** | Server Actions dibatasi 20 permintaan / 10 detik per IP melalui Upstash |
| **Security Headers** | HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy |

---

## Instalasi Lokal

### Prasyarat
- Node.js 18+
- npm
- Akun Supabase
- Akun Upstash (opsional — diperlukan untuk caching Redis dan rate limiting)
- Proyek Google Cloud dengan kredensial OAuth 2.0

### Langkah Instalasi

```bash
# 1. Clone repositori
git clone https://github.com/Irsanngrh/kartu-pokemon-indonesia
cd kartu-pokemon-indonesia

# 2. Instal dependensi
npm install

# 3. Salin file environment
cp .env.example .env.local

# 4. Isi variabel lingkungan (lihat bagian di bawah)

# 5. Jalankan server pengembangan
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser.

---

## Konfigurasi Variabel Lingkungan

Buat file `.env.local` di root proyek:

```env
# Supabase (wajib)
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhb...
SUPABASE_SERVICE_ROLE_KEY=eyJhb...

# Google OAuth melalui Auth.js (wajib)
AUTH_GOOGLE_ID=xxxxxx.apps.googleusercontent.com
AUTH_GOOGLE_SECRET=GOCSPX-xxxx
AUTH_SECRET=string-acak-minimal-32-karakter

# Akses admin — daftar email akun Google, dipisah koma
ADMIN_EMAILS=kamu@example.com,lainnya@example.com

# Upstash Redis (opsional — mengaktifkan caching terdistribusi dan rate limiting)
UPSTASH_REDIS_REST_URL=https://xxxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=AXxx...
```

---

## Pengaturan Database (Supabase)

### 1. Buat proyek Supabase
Kunjungi [supabase.com](https://supabase.com) dan buat proyek baru.

### 2. Skema database
Jalankan SQL berikut di **Supabase SQL Editor**:

```sql
-- Tabel set ekspansi
CREATE TABLE sets (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  set_order INTEGER DEFAULT 99,
  series_name TEXT,
  image_url TEXT,
  release_date TEXT
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

-- Tabel pengguna (dikelola oleh Auth.js — terpisah dari Supabase Auth)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  image TEXT,
  is_admin BOOLEAN DEFAULT FALSE
);

-- Tabel koleksi pengguna
CREATE TABLE user_collections (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  card_id INTEGER REFERENCES cards(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 0,
  is_wishlist BOOLEAN DEFAULT FALSE,
  UNIQUE(user_id, card_id)
);

-- Tabel deck pengguna
CREATE TABLE user_decks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Deck Baru',
  cards JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indeks untuk performa query
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
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_decks ENABLE ROW LEVEL SECURITY;

-- Kartu & set: semua bisa baca, service role mengelola penulisan
CREATE POLICY "Public read cards" ON cards FOR SELECT USING (true);
CREATE POLICY "Public read sets"  ON sets  FOR SELECT USING (true);

-- Pengguna: setiap pengguna membaca barisnya sendiri; service role (auth.ts) mengelola penulisan
CREATE POLICY "Users read own profile" ON users FOR SELECT USING (true);

-- Koleksi: semua bisa baca (untuk berbagi via tautan), pemilik mengelola penulisan
CREATE POLICY "Public read collections" ON user_collections FOR SELECT USING (true);
CREATE POLICY "Users insert own collections" ON user_collections FOR INSERT
  WITH CHECK (user_id::text = current_setting('request.jwt.claims', true)::json->>'sub');
CREATE POLICY "Users update own collections" ON user_collections FOR UPDATE
  USING (user_id::text = current_setting('request.jwt.claims', true)::json->>'sub');
CREATE POLICY "Users delete own collections" ON user_collections FOR DELETE
  USING (user_id::text = current_setting('request.jwt.claims', true)::json->>'sub');

-- Deck: semua bisa baca (untuk berbagi via tautan), pemilik mengelola penulisan
CREATE POLICY "Public read decks" ON user_decks FOR SELECT USING (true);
CREATE POLICY "Users insert own decks" ON user_decks FOR INSERT
  WITH CHECK (user_id::text = current_setting('request.jwt.claims', true)::json->>'sub');
CREATE POLICY "Users update own decks" ON user_decks FOR UPDATE
  USING (user_id::text = current_setting('request.jwt.claims', true)::json->>'sub');
CREATE POLICY "Users delete own decks" ON user_decks FOR DELETE
  USING (user_id::text = current_setting('request.jwt.claims', true)::json->>'sub');
```

### 4. Memberikan Akses Admin

Akses admin dikendalikan oleh dua mekanisme (salah satu sudah cukup):

**Opsi A — Variabel lingkungan (paling mudah):**  
Tambahkan email akun Google ke `ADMIN_EMAILS` di `.env.local`. Aplikasi akan otomatis mengatur `is_admin = true` saat login berikutnya.

**Opsi B — Flag di database:**
```sql
UPDATE users SET is_admin = TRUE WHERE email = 'kamu@example.com';
```

---

## Mengisi Database (Seeding)

Direktori `scripts/` berisi dua skrip Node.js untuk mengisi database:

```bash
# Langkah 1: Ambil data kartu dari pokemon-card.com
node scripts/scrape.js

# Langkah 2: Masukkan data yang telah diambil ke Supabase
node scripts/seed.js
```

Kedua skrip membaca `.env.local` untuk kredensial Supabase. Untuk mengambil data set tertentu saja, ubah sementara isi `TARGET_SETS` di file `scrape.js` sebelum menjalankannya.

---

## Deployment ke Vercel

```bash
npm i -g vercel
vercel
```

Atau hubungkan repositori GitHub ke Vercel Dashboard dan tambahkan **Environment Variables** secara manual. Variabel yang wajib diisi: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `AUTH_SECRET`, dan `ADMIN_EMAILS`.

---

## Struktur Proyek

```
app/
├── actions/          # Server Actions (lapisan data)
│   ├── cards.fetch.ts    # Pengambilan & filter kartu dengan Redis + cache in-memory
│   ├── cards.ts          # CRUD kartu (khusus admin)
│   ├── sets.ts           # CRUD set/ekspansi (khusus admin)
│   ├── collections.ts    # Manajemen koleksi pengguna
│   └── decks.ts          # CRUD deck pengguna
├── admin/            # Panel admin (dilindungi middleware + layout guard)
├── [set_code]/       # Halaman detail kartu per set
├── collection/       # Halaman koleksi & wishlist pengguna
├── decks/            # Dashboard & builder deck
├── sets/             # Daftar semua ekspansi
└── layout.tsx        # Root layout

components/
├── ui/
│   ├── CustomDropdown.tsx    # Dropdown aksesibel (menggantikan select native)
│   ├── DeckCardItem.tsx      # Item kartu di kanvas deck builder
│   ├── DeckDeleteButton.tsx  # Tombol hapus deck dengan konfirmasi
│   ├── DeckShareButton.tsx   # Tombol salin tautan berbagi deck
│   ├── Navbar.tsx            # Navigasi utama
│   ├── PokemonCard.tsx       # Thumbnail kartu untuk grid library & koleksi
│   └── ZoomableImage.tsx     # Viewer gambar dengan fitur zoom untuk halaman detail
└── views/
    ├── AdminSetTableView.tsx  # Tabel admin untuk data ekspansi
    ├── AdminTableView.tsx     # Tabel admin untuk data kartu
    ├── CardDetailView.tsx     # Halaman detail kartu lengkap
    ├── CollectionView.tsx     # Tampilan koleksi & wishlist
    ├── DeckBuilderView.tsx    # Kanvas deck builder split-panel
    ├── DeckDashboardView.tsx  # Daftar deck pengguna
    └── LibraryView.tsx        # Library kartu dengan infinite scroll & filter

lib/
├── card-helpers.ts   # Klasifikasi kartu: stage, elemen, tipe
└── constants.ts      # Konstanta aplikasi (batas deck, kunci cache, pagination)

scripts/
├── rls-policies.sql  # Migrasi SQL RLS untuk Supabase
├── scrape.js         # Skrip pengambilan data kartu (khusus pengembangan)
└── seed.js           # Skrip seeding database (khusus pengembangan)

types/
└── index.ts          # Definisi tipe TypeScript

utils/
└── supabase/         # Klien Supabase (service role untuk server, anon untuk browser)

auth.ts               # Konfigurasi Auth.js (NextAuth v5)
proxy.ts              # Middleware: penjaga autentikasi, rate limiting
```
