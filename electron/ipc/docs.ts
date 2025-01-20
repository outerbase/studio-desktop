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
  "addChangeListener",
  "removeChangeListener",
];

export function bindSavedDocIpc(databaseId: string) {
  const driver = new FileBasedSavedDocDriver(databaseId);

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

  // Persistent listeners for change notifications
  ipcMain.on("addChangeListener", (event) => {
    const listener = () => {
      event.sender.send("changeEvent");
    };
    driver.addChangeListener(listener);

    // Clean up listener when the renderer process disconnects
    event.sender.once("destroyed", () => {
      driver.removeChangeListener(listener);
    });
  });

  ipcMain.on("removeChangeListener", (event) => {
    driver.removeChangeListener(() => {
      event.sender.send("changeEvent");
    });
  });
}
