# Vercel + Filebase Sample

Sample project untuk praktikum cloud computing. App ini memakai Next.js Route Handlers di Vercel untuk membuat presigned URL, lalu browser upload file langsung ke Filebase memakai S3-compatible API.

## Arsitektur

1. Browser memilih file.
2. Browser memanggil `POST /api/filebase/presign-upload`.
3. Vercel Function membuat presigned PUT URL memakai credential Filebase.
4. Browser upload langsung ke Filebase memakai URL tersebut.
5. App memanggil `GET /api/filebase/objects` untuk menampilkan object.
6. Download memakai presigned GET URL. Delete memakai server-side S3 API.

## Setup Filebase

1. Buat bucket Filebase.
2. Buka `https://console.filebase.com/keys`.
3. Salin Access Key ID, Secret Access Key, dan nama bucket.
4. Atur CORS bucket untuk local dev dan domain Vercel memakai AWS CLI:

```bash
AWS_ACCESS_KEY_ID=your_filebase_access_key_id \
AWS_SECRET_ACCESS_KEY=your_filebase_secret_access_key \
aws --endpoint https://s3.filebase.io s3api put-bucket-cors \
  --bucket your_bucket_name \
  --cors-configuration file://filebase-cors.example.json
```

Konfigurasi CORS:

```json
{
  "CORSRules": [
    {
      "AllowedOrigins": ["http://localhost:3000", "https://your-project.vercel.app"],
      "AllowedMethods": ["GET", "PUT", "HEAD", "DELETE"],
      "AllowedHeaders": ["Content-Type"],
      "ExposeHeaders": ["ETag"],
      "MaxAgeSeconds": 3600
    }
  ]
}
```

## Local development

```bash
cp .env.example .env.local
npm install
npm run dev
```

Isi `.env.local`:

```bash
FILEBASE_ENDPOINT=https://s3.filebase.io
FILEBASE_ACCESS_KEY_ID=...
FILEBASE_SECRET_ACCESS_KEY=...
FILEBASE_BUCKET_NAME=...
FILEBASE_PREFIX=classroom-uploads
```

Buka `http://localhost:3000`.

## Deploy ke Vercel

1. Push folder ini ke GitHub/GitLab/Bitbucket.
2. Import project di Vercel.
3. Tambahkan Environment Variables yang sama seperti `.env.local`.
4. Deploy.
5. Tambahkan domain Vercel final ke CORS bucket Filebase.

## Catatan production

- Tambahkan autentikasi user sebelum membuat presigned URL.
- Simpan metadata object di database: owner, original file name, size, MIME, status, dan audit event.
- Batasi MIME type, ukuran file, prefix key, dan quota user.
- Pakai expiry presigned URL singkat.
- Jangan expose `FILEBASE_SECRET_ACCESS_KEY` ke client.
