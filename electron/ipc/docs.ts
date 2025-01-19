import { ipcMain } from "electron";
import {
  SavedDocInput,
  SavedDocType,
  FileBasedSavedDocDriver,
} from "../drivers/saved-doc-driver";

const handlers = [
  "getDocs",
  "createDoc",
  "updateDoc",
  "removeDoc",
  "getNamespaces",
  "createNamespace",
  "updateNamespace",
  "removeNamespace",
];

export function bindSavedDocIpc(databaseId: string) {
  const driver = new FileBasedSavedDocDriver(databaseId);

  // Clear all listeners and handlers to prevent duplication
  ipcMain.removeAllListeners();

  handlers.forEach((handler) => ipcMain.removeHandler(handler));

  ipcMain.handle("getDocs", async () => driver.getDocs());

  ipcMain.handle(
    "createDoc",
    async (_, type: SavedDocType, namespaceId: string, data: SavedDocInput) =>
      driver.createDoc(type, namespaceId, data),
  );

  ipcMain.handle("updateDoc", (_, id: string, data: SavedDocInput) =>
    driver.updateDoc(id, data),
  );

  ipcMain.handle("removeDoc", (_, id: string) => driver.removeDoc(id));

  ipcMain.handle("getNamespaces", async () => driver.getNamespaces());

  ipcMain.handle("createNamespace", (_, name: string) =>
    driver.createNamespace(name),
  );

  ipcMain.handle("updateNamespace", (_, id: string, name: string) =>
    driver.updateNamespace(id, name),
  );

  ipcMain.handle("removeNamespace", (_, id: string) =>
    driver.removeNamespace(id),
  );

  ipcMain.addListener("addChangeListener", (_, cb) =>
    driver.addChangeListener(cb),
  );

  ipcMain.addListener("removeChangeListener", (_, cb) =>
    driver.removeChangeListener(cb),
  );
}
