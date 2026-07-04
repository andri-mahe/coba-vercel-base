import { DeleteObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";
import { getFilebaseClient, getFilebaseConfig, isAllowedKey } from "@/lib/filebase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type DeleteRequest = {
  key?: string;
};

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function GET() {
  try {
    const config = getFilebaseConfig();
    const list = await getFilebaseClient().send(
      new ListObjectsV2Command({
        Bucket: config.bucketName,
        Prefix: config.prefix ? `${config.prefix}/` : undefined,
        MaxKeys: 100
      })
    );

    const objects = (list.Contents ?? []).map((object) => ({
      key: object.Key ?? "",
      size: object.Size ?? 0,
      lastModified: object.LastModified?.toISOString() ?? null,
      etag: object.ETag?.replaceAll('"', "") ?? null
    }));

    return NextResponse.json({ objects });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal mengambil object.";
    return jsonError(message, 500);
  }
}

export async function DELETE(request: Request) {
  try {
    const body = (await request.json()) as DeleteRequest;
    const key = body.key?.trim();
    const config = getFilebaseConfig();

    if (!key || !isAllowedKey(key, config.prefix)) {
      return jsonError("Object key tidak valid.");
    }

    await getFilebaseClient().send(
      new DeleteObjectCommand({
        Bucket: config.bucketName,
        Key: key
      })
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal menghapus object.";
    return jsonError(message, 500);
  }
}
