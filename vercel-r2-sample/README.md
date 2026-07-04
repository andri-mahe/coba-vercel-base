# Vercel + Cloudflare R2 Sample

Sample project untuk praktikum cloud computing. App ini memakai Next.js Route Handlers di Vercel untuk membuat presigned URL, lalu browser upload file langsung ke Cloudflare R2.

## Arsitektur

1. Browser memilih file.
2. Browser memanggil `POST /api/r2/presign-upload`.
3. Vercel Function membuat presigned PUT URL memakai credential R2.
4. Browser upload langsung ke R2 memakai URL tersebut.
5. App memanggil `GET /api/r2/objects` untuk menampilkan object.
6. Download memakai presigned GET URL. Delete memakai server-side S3 API.

## Setup Cloudflare R2

1. Buat bucket R2.
2. Buat R2 API token dengan scope minimal: object read dan write untuk bucket yang dipakai.
3. Salin Account ID, Access Key ID, Secret Access Key, dan nama bucket.
4. Atur CORS bucket untuk local dev dan domain Vercel. Dengan Wrangler:

```bash
CLOUDFLARE_ACCOUNT_ID=your_cloudflare_account_id \
CLOUDFLARE_API_TOKEN=your_cloudflare_api_token \
npx wrangler r2 bucket cors set your_bucket_name --file r2-cors.example.json --force
```

Konfigurasi dashboard ekuivalen:

```json
[
  {
    "AllowedOrigins": [
      "http://localhost:3000",
      "https://your-project.vercel.app"
    ],
    "AllowedMethods": ["GET", "PUT", "HEAD"],
    "AllowedHeaders": ["content-type"],
    "ExposeHeaders": ["etag"],
    "MaxAgeSeconds": 3600
  }
]
```

## Local development

```bash
cp .env.example .env.local
npm install
npm run dev
```

Isi `.env.local`:

```bash
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=...
R2_PREFIX=classroom-uploads
```

Buka `http://localhost:3000`.

## Deploy ke Vercel

1. Push folder ini ke GitHub/GitLab/Bitbucket.
2. Import project di Vercel.
3. Tambahkan Environment Variables yang sama seperti `.env.local`.
4. Deploy.
5. Tambahkan domain Vercel final ke CORS bucket R2.

## Catatan production

- Tambahkan autentikasi user sebelum membuat presigned URL.
- Simpan metadata object di database: owner, original file name, size, MIME, status, dan audit event.
- Batasi MIME type, ukuran file, prefix key, dan quota user.
- Pakai expiry presigned URL singkat.
- Jangan expose `R2_SECRET_ACCESS_KEY` ke client.
