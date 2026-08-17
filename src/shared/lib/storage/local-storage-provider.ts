import { mkdir, readFile, unlink, writeFile } from "fs/promises";
import path from "path";
import type { StorageObject, StorageProvider, StorageUploadInput } from "./storage-provider";

function safeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 180) || "arquivo";
}

export class LocalStorageProvider implements StorageProvider {
  constructor(private readonly rootDir = path.join(process.cwd(), "storage")) {}

  private resolveKey(key: string): string | null {
    if (!key || key.includes("\0") || path.isAbsolute(key)) return null;
    const normalized = path.normalize(key).replace(/^(\.\.(\/|\\|$))+/, "");
    if (normalized.includes("..")) return null;
    const full = path.resolve(this.rootDir, normalized);
    const root = path.resolve(this.rootDir);
    if (full !== root && !full.startsWith(root + path.sep)) return null;
    return full;
  }

  async upload(input: StorageUploadInput): Promise<StorageObject> {
    const folder = (input.folder ?? "uploads").replace(/[^a-zA-Z0-9/_-]/g, "_");
    const fileName = safeFileName(input.fileName);
    const dir = path.join(this.rootDir, folder);
    await mkdir(dir, { recursive: true });
    const key = `${folder}/${Date.now()}-${fileName}`;
    const fullPath = this.resolveKey(key);
    if (!fullPath) throw new Error("Caminho de arquivo inválido");
    await writeFile(fullPath, input.data);
    return {
      key,
      url: `/api/files/${encodeURIComponent(key)}`,
      size: input.data.byteLength,
      contentType: input.contentType,
    };
  }

  async delete(key: string): Promise<void> {
    const fullPath = this.resolveKey(key);
    if (!fullPath) return;
    await unlink(fullPath).catch(() => undefined);
  }

  async getUrl(key: string): Promise<string> {
    return `/api/files/${encodeURIComponent(key)}`;
  }

  async read(key: string): Promise<Buffer | null> {
    const fullPath = this.resolveKey(key);
    if (!fullPath) return null;
    try {
      return await readFile(fullPath);
    } catch {
      return null;
    }
  }
}
