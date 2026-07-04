"use client";

import {
  DatabaseZap,
  Download,
  File,
  RefreshCw,
  ShieldCheck,
  Trash2,
  UploadCloud
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type StoredObject = {
  key: string;
  size: number;
  lastModified: string | null;
  etag: string | null;
};

type Message = {
  type: "ok" | "error";
  text: string;
};

function formatBytes(size: number) {
  if (size === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const index = Math.min(Math.floor(Math.log(size) / Math.log(1024)), units.length - 1);
  const value = size / 1024 ** index;
  return `${value.toFixed(value >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
}

function formatDate(value: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

async function readJson<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = typeof payload?.error === "string" ? payload.error : "Request gagal";
    throw new Error(message);
  }
  return payload as T;
}

export function StorageConsole() {
  const [objects, setObjects] = useState<StoredObject[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState<Message | null>(null);

  const totalSize = useMemo(
    () => objects.reduce((total, object) => total + object.size, 0),
    [objects]
  );

  async function loadObjects() {
    setRefreshing(true);
    try {
      const data = await readJson<{ objects: StoredObject[] }>(await fetch("/api/r2/objects"));
      setObjects(data.objects);
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Gagal memuat object" });
    } finally {
      setRefreshing(false);
    }
  }

  async function uploadSelectedFile() {
    if (!selectedFile) {
      setMessage({ type: "error", text: "Pilih file lebih dulu." });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const presign = await readJson<{ uploadUrl: string; key: string; headers: Record<string, string> }>(
        await fetch("/api/r2/presign-upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: selectedFile.name,
            contentType: selectedFile.type || "application/octet-stream",
            size: selectedFile.size
          })
        })
      );

      const uploadResponse = await fetch(presign.uploadUrl, {
        method: "PUT",
        headers: presign.headers,
        body: selectedFile
      });

      if (!uploadResponse.ok) {
        throw new Error(`Upload ke R2 gagal: ${uploadResponse.status}`);
      }

      setSelectedFile(null);
      setMessage({ type: "ok", text: `Uploaded: ${presign.key}` });
      await loadObjects();
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Upload gagal" });
    } finally {
      setLoading(false);
    }
  }

  async function downloadObject(key: string) {
    try {
      const data = await readJson<{ downloadUrl: string }>(
        await fetch("/api/r2/presign-download", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key })
        })
      );
      window.open(data.downloadUrl, "_blank", "noopener,noreferrer");
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Gagal membuat URL download" });
    }
  }

  async function deleteObject(key: string) {
    setLoading(true);
    try {
      await readJson<{ ok: true }>(
        await fetch("/api/r2/objects", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key })
        })
      );
      setMessage({ type: "ok", text: `Deleted: ${key}` });
      await loadObjects();
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Gagal menghapus object" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadObjects();
  }, []);

  return (
    <main className="shell">
      <nav className="topbar" aria-label="Header">
        <div className="brand">
          <span className="mark" />
          <span>Vercel R2 Lab</span>
        </div>
        <div className="status-pill">
          <ShieldCheck size={17} />
          Presigned upload
        </div>
      </nav>

      <section className="hero">
        <div className="headline">
          <p className="eyebrow">Cloud object storage demo</p>
          <h1>Upload file langsung ke Cloudflare R2</h1>
          <p className="lead">
            Vercel hanya membuat URL bertanda tangan. File besar langsung bergerak
            dari browser ke bucket R2, sehingga credential tetap aman dan function
            tidak menjadi bottleneck.
          </p>
        </div>

        <div className="diagram" aria-label="Alur arsitektur">
          <div className="diagram-node">
            <strong>1. Browser</strong>
            <span>select file, ask for upload URL</span>
          </div>
          <div className="diagram-node">
            <strong>2. Vercel Route Handler</strong>
            <span>sign PUT and GET URLs with AWS SDK</span>
          </div>
          <div className="diagram-node">
            <strong>3. Cloudflare R2</strong>
            <span>S3-compatible bucket stores object</span>
          </div>
        </div>
      </section>

      <section className="panel upload-panel" aria-label="Upload file">
        <label className="dropzone">
          <input
            type="file"
            onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
          />
          <span>
            <UploadCloud size={42} />
            <strong>Pilih file untuk upload</strong>
            <span>PDF, gambar, CSV, JSON, atau file praktikum lain.</span>
          </span>
        </label>

        <div className="upload-actions">
          <div className="selected-file">
            {selectedFile ? (
              <>
                <b>{selectedFile.name}</b>
                {formatBytes(selectedFile.size)} - {selectedFile.type || "application/octet-stream"}
              </>
            ) : (
              "Belum ada file dipilih."
            )}
          </div>
          <button className="primary" type="button" disabled={loading} onClick={uploadSelectedFile}>
            <UploadCloud size={18} />
            Upload
          </button>
          <button className="secondary" type="button" disabled={refreshing} onClick={loadObjects}>
            <RefreshCw size={18} />
            Refresh
          </button>
        </div>
      </section>

      {message ? <p className={`message ${message.type === "error" ? "error" : ""}`}>{message.text}</p> : null}

      <section className="panel" aria-label="Object list">
        <div className="objects-header">
          <div>
            <h2>Bucket objects</h2>
            <span className="object-size">
              {objects.length} object - {formatBytes(totalSize)}
            </span>
          </div>
          <div className="status-pill">
            <DatabaseZap size={17} />
            R2 prefix
          </div>
        </div>

        <div className="object-list">
          {objects.length === 0 ? (
            <div className="empty">Belum ada object pada prefix ini.</div>
          ) : (
            objects.map((object) => (
              <div className="object-row" key={object.key}>
                <div className="object-key">
                  <File size={22} />
                  <div>
                    <b title={object.key}>{object.key}</b>
                    <span>{object.etag ?? "no etag"}</span>
                  </div>
                </div>
                <span className="object-size">{formatBytes(object.size)}</span>
                <span className="object-date">{formatDate(object.lastModified)}</span>
                <div className="row-actions">
                  <button
                    className="icon-button"
                    type="button"
                    aria-label={`Download ${object.key}`}
                    title="Download"
                    onClick={() => downloadObject(object.key)}
                  >
                    <Download size={18} />
                  </button>
                  <button
                    className="icon-button danger"
                    type="button"
                    aria-label={`Delete ${object.key}`}
                    title="Delete"
                    disabled={loading}
                    onClick={() => deleteObject(object.key)}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
