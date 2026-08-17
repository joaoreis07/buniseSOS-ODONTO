export type { StorageProvider, StorageObject, StorageUploadInput } from "./storage-provider";
export { LocalStorageProvider } from "./local-storage-provider";

import { LocalStorageProvider } from "./local-storage-provider";
import type { StorageProvider } from "./storage-provider";

let cached: StorageProvider | null = null;

function createStorage(): StorageProvider {
  const driver = (process.env.STORAGE_DRIVER ?? "local").trim().toLowerCase();
  switch (driver) {
    case "local":
      return new LocalStorageProvider();
    default:
      throw new Error(
        `Storage driver "${driver}" ainda não está implementado. Mantenha STORAGE_DRIVER=local ou adicione o provider em src/shared/lib/storage sem alterar o restante do sistema.`,
      );
  }
}

export function getStorage(): StorageProvider {
  cached ??= createStorage();
  return cached;
}