import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextResponse } from "next/server";
import { buildObjectKey } from "@/lib/object-keys";
import { getR2Client, getR2Config } from "@/lib/r2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;
const UPLOAD_URL_EXPIRES_SECONDS = 300;

type UploadRequest = {
  fileName?: string;
  contentType?: string;
  size?: number;
};

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as UploadRequest;
    const fileName = body.fileName?.trim();
    const contentType = body.contentType?.trim() || "application/octet-stream";
    const size = Number(body.size);

    if (!fileName) {
      return jsonError("fileName wajib diisi.");
    }

    if (!Number.isFinite(size) || size <= 0) {
      return jsonError("size tidak valid.");
    }

    if (size > MAX_UPLOAD_BYTES) {
      return jsonError("Ukuran maksimum sample ini 50 MB.");
    }

    const config = getR2Config();
    const key = buildObjectKey(config.prefix, fileName);
    const command = new PutObjectCommand({
      Bucket: config.bucketName,
      Key: key,
      ContentType: contentType
    });

    const uploadUrl = await getSignedUrl(getR2Client(), command, {
      expiresIn: UPLOAD_URL_EXPIRES_SECONDS
    });

    return NextResponse.json({
      key,
      uploadUrl,
      headers: {
        "Content-Type": contentType
      },
      expiresIn: UPLOAD_URL_EXPIRES_SECONDS
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal membuat presigned URL.";
    return jsonError(message, 500);
  }
}
