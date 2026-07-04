import { S3Client } from "@aws-sdk/client-s3";

export type R2Config = {
  accountId: string;
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

export function getR2Config(): R2Config {
  const accountId = requiredEnv("R2_ACCOUNT_ID");

  return {
    accountId,
    accessKeyId: requiredEnv("R2_ACCESS_KEY_ID"),
    secretAccessKey: requiredEnv("R2_SECRET_ACCESS_KEY"),
    bucketName: requiredEnv("R2_BUCKET_NAME"),
    prefix: normalizePrefix(process.env.R2_PREFIX),
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`
  };
}

export function getR2Client() {
  if (cachedClient) {
    return cachedClient;
  }

  const config = getR2Config();
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
