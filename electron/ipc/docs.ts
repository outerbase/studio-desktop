import { ipcMain } from "electron";
import { SavedDocManager } from "../saved-doc-manager";
import { SavedDocInput, SavedDocType } from "../drivers/base-doc";

export function bindSavedDocIpc() {
  ipcMain.handle("get-docs", () => SavedDocManager.getDocs());

  ipcMain.handle(
    "create-doc",
    (_, type: SavedDocType, namespaceId: string, data: SavedDocInput) =>
      SavedDocManager.createDoc(type, namespaceId, data),
  );

  ipcMain.handle("update-doc", (_, id: string, data: SavedDocInput) =>
    SavedDocManager.updateDoc(id, data),
  );

  ipcMain.handle("remove-doc", (_, id: string) =>
    SavedDocManager.removeDoc(id),
  );

  ipcMain.handle("get-namespaces", () => SavedDocManager.getNamespaces());

  ipcMain.handle("create-namespace", (_, name: string) =>
    SavedDocManager.createNamespace(name),
  );

  ipcMain.handle("update-namespace", (_, id: string, name: string) =>
    SavedDocManager.updateNamespace(id, name),
  );

  ipcMain.handle("remove-namespace", (_, id: string) =>
    SavedDocManager.removeNamespace(id),
  );

  ipcMain.handle("delete-doc-file", (_, connId: string) =>
    SavedDocManager.deleteDocFile(connId),
  );

  // Persistent listeners for change notifications
  ipcMain.on("add-change-listener", (event) => {
    const listener = () => {
      event.sender.send("changeEvent");
    };
    SavedDocManager.addChangeListener(listener);

    // Clean up listener when the renderer process disconnects
    event.sender.once("destroyed", () => {
      SavedDocManager.removeChangeListener(listener);
    });
  });

  ipcMain.on("remove-change-listener", (event) => {
    SavedDocManager.removeChangeListener(() => {
      event.sender.send("changeEvent");
    });
  });
}
