# Lumina Commerce

[![CI](https://github.com/J-Andika/lumina-commerce/actions/workflows/ci.yml/badge.svg)](https://github.com/J-Andika/lumina-commerce/actions/workflows/ci.yml)

**Bahasa:** Indonesia · [English](./README.en.md)

Storefront headless dengan bentuk produksi: frontend Next.js App Router yang berbicara ke
commerce API buatan sendiri (Route Handlers + Prisma), checkout Stripe test mode yang benar-benar
jalan, order tersimpan di database, dan admin yang bisa dipakai.

> **Status:** tahap 2 dari 11 selesai (katalog 14 produk dilayani dari SQLite).
> Preview sandbox (ephemeral): <https://3000-001m7ma0xxphbkbh4k9qkh2a3x1.sbx.sandboxes-cloud.docker.com>
> — bisa mati kalau sandbox di-stop. Link permanen menyusul di tahap 10.

## Apa isi proyek ini

- **Storefront kustom** — katalog, filter multi-facet, halaman produk, cart, checkout, receipt
- **Commerce backend di deploy yang sama** — harga, diskon, ongkir, dan stok dihitung di server
- **Admin operasional** — order hari ini, toggle stok, ubah status order

## Yang sengaja tidak ada

- Bukan build Shopify headless — commerce engine di sini ditulis sendiri (lihat [docs/architecture.md](./docs/architecture.md))
- Tidak ada pembayaran nyata (hanya **Stripe test mode**), tidak ada akun customer, tidak ada email transaksional
- Tidak ada multi-currency, pajak per region, atau integrasi kurir

## Stack dan alasannya

| Layer | Pilihan | Alasan |
|---|---|---|
| Framework | Next.js 16 (App Router, RSC, Server Actions) | Standar pasar; data dibaca di server, bukan fetch dari client |
| Bahasa | TypeScript strict | Harga, stok, dan order tidak boleh longgar tipenya |
| Styling | Tailwind CSS v4 (`@tailwindcss/postcss`) | Setup resmi Next 16, token desain terpusat |
| Komponen dasar | Radix UI (headless) | Focus trap dan aria gratis; styling tetap custom |
| Data | Prisma + SQLite | Nol ops untuk deploy satu container; mudah diganti Postgres |
| Pembayaran | Stripe test mode + mode sandbox lokal | Integrasi nyata tanpa KYC; demo tetap hidup kalau key dicabut |
| Test | Vitest, Playwright | Unit untuk logika uang/promo, E2E untuk alur belanja |
| Runtime | Docker multi-stage (`node:24-alpine`, standalone) | Image kecil, jalan sebagai non-root, healthcheck aktif |

## Jalankan di lokal

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Buka http://localhost:3000.

```bash
npm run lint        # eslint
npm run typecheck   # next typegen && tsc --noEmit
npm run test        # vitest
npm run build       # build produksi
```

## Struktur proyek

```
src/app          route & layout (server components)
src/components   client islands (cart, checkout, toggle tema)
src/lib          domain: uang, harga, promo, cart
src/data         katalog placeholder — diganti Prisma di tahap 2
docs/            arsitektur, workflow, runbook deploy
scripts/         deploy.sh + boot.sh untuk sandbox
```

## Alur kerja

Aturan branch, commit, PR, dan deploy ada di [docs/workflow.md](./docs/workflow.md).
Ringkasnya: `main` selalu bisa di-build, semua perubahan lewat PR, CI wajib hijau, merge squash.

## Roadmap

- [x] Tahap 1 — scaffold, design token, CI
- [x] Tahap 2 — skema Prisma, seed katalog, katalog dari database
- [ ] Tahap 3 — domain harga / promo / cart + unit test
- [ ] Tahap 4 — storefront + filter berbasis URL
- [ ] Tahap 5 — halaman produk + JSON-LD
- [ ] Tahap 6 — cart drawer, promo engine, wishlist, search
- [ ] Tahap 7 — checkout, Stripe test mode, receipt
- [ ] Tahap 8 — admin (Basic Auth), aksi stok + status order
- [ ] Tahap 9 — E2E, a11y, budget performa
- [ ] Tahap 10 — deploy Docker, backup, uptime check
- [ ] Tahap 11 — packaging: README, video, aset gig

## Lisensi

MIT — lihat [LICENSE](./LICENSE).
