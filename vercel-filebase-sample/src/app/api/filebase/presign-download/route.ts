import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextResponse } from "next/server";
import { getFilebaseClient, getFilebaseConfig, isAllowedKey } from "@/lib/filebase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DOWNLOAD_URL_EXPIRES_SECONDS = 120;

type DownloadRequest = {
  key?: string;
};

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as DownloadRequest;
    const key = body.key?.trim();
    const config = getFilebaseConfig();

    if (!key || !isAllowedKey(key, config.prefix)) {
      return jsonError("Object key tidak valid.");
    }

    const command = new GetObjectCommand({
      Bucket: config.bucketName,
      Key: key
    });

    const downloadUrl = await getSignedUrl(getFilebaseClient(), command, {
      expiresIn: DOWNLOAD_URL_EXPIRES_SECONDS
    });

    return NextResponse.json({
      key,
      downloadUrl,
      expiresIn: DOWNLOAD_URL_EXPIRES_SECONDS
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal membuat URL download.";
    return jsonError(message, 500);
  }
}
