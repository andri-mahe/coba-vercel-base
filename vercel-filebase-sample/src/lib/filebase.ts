import { S3Client } from "@aws-sdk/client-s3";

export type FilebaseConfig = {
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  prefix: string;
  endpoint: string;
};

let cachedClient: S3Client | null = null;

function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

function normalizePrefix(value: string | undefined) {
  return (value ?? "classroom-uploads").replace(/^\/+|\/+$/g, "");
}

export function getFilebaseConfig(): FilebaseConfig {
  return {
    accessKeyId: requiredEnv("FILEBASE_ACCESS_KEY_ID"),
    secretAccessKey: requiredEnv("FILEBASE_SECRET_ACCESS_KEY"),
    bucketName: requiredEnv("FILEBASE_BUCKET_NAME"),
    prefix: normalizePrefix(process.env.FILEBASE_PREFIX),
    endpoint: process.env.FILEBASE_ENDPOINT ?? "https://s3.filebase.io"
  };
}

export function getFilebaseClient() {
  if (cachedClient) {
    return cachedClient;
  }

  const config = getFilebaseConfig();
  cachedClient = new S3Client({
    region: "auto",
    endpoint: config.endpoint,
    forcePathStyle: true,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey
    },
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED"
  });

  return cachedClient;
}

export function isAllowedKey(key: string, prefix: string) {
  if (!key || key.includes("..")) {
    return false;
  }

  if (!prefix) {
    return true;
  }

  return key === prefix || key.startsWith(`${prefix}/`);
}
