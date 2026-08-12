import { mkdir, writeFile, unlink } from "fs/promises";
import path from "path";
import type { StorageObject, StorageProvider, StorageUploadInput } from "./storage-provider";

export class LocalStorageProvider implements StorageProvider {
  constructor(private readonly rootDir = path.join(process.cwd(), "storage")) {}

  async upload(input: StorageUploadInput): Promise<StorageObject> {
    const folder = input.folder ?? "uploads";
    const dir = path.join(this.rootDir, folder);
    await mkdir(dir, { recursive: true });
    const key = `${folder}/${Date.now()}-${input.fileName}`;
    const fullPath = path.join(this.rootDir, key);
    await writeFile(fullPath, input.data);
    return {
      key,
      url: `/storage/${key}`,
      size: input.data.byteLength,
      contentType: input.contentType,
    };
  }

  async delete(key: string): Promise<void> {
    await unlink(path.join(this.rootDir, key)).catch(() => undefined);
  }

  async getUrl(key: string): Promise<string> {
    return `/storage/${key}`;
  }
}
