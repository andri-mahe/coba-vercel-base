const MAX_FILE_NAME_LENGTH = 96;

export function safeFileName(fileName: string) {
  const baseName = fileName.split(/[/\\]/).pop() || "upload";
  const cleaned = baseName
    .normalize("NFKD")
    .replace(/[^\w.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase()
    .slice(0, MAX_FILE_NAME_LENGTH);

  return cleaned || "upload";
}

export function buildObjectKey(prefix: string, fileName: string) {
  const date = new Date().toISOString().slice(0, 10);
  const safeName = safeFileName(fileName);
  const baseKey = `${date}/${crypto.randomUUID()}-${safeName}`;
  return prefix ? `${prefix}/${baseKey}` : baseKey;
}
