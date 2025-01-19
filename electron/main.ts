import {
  app,
  BrowserWindow,
  dialog,
  ipcMain,
  type OpenDialogOptions,
} from "electron";
import path from "node:path";
import log from "electron-log";
import { Setting } from "./setting";
import { getOuterbaseDir, isMac } from "./utils";
import { ConnectionPool } from "./connection-pool";
import { MainWindow } from "./window/main-window";
import electronUpdater, { type AppUpdater } from "electron-updater";
import { type ConnectionStoreItem } from "@/lib/conn-manager-store";
import { createDatabaseWindow } from "./window/create-database";
import { bindMenuIpc, bindDockerIpc, bindSavedDocIpc } from "./ipc";
import { bindAnalyticIpc } from "./ipc/analytics";
import { FileBasedSavedDocDriver } from "./drivers/saved-doc-driver";

export function getAutoUpdater(): AppUpdater {
  // Using destructuring to access autoUpdater due to the CommonJS module of 'electron-updater'.
  // It is a workaround for ESM compatibility issues, see https://github.com/electron-userland/electron-builder/issues/7976.
  const { autoUpdater } = electronUpdater;
  return autoUpdater;
}
const autoUpdater = getAutoUpdater();
log.transports.file.level = "info";
autoUpdater.logger = log;
autoUpdater.autoDownload = false;

const dirname = getOuterbaseDir();

// The built directory structure
//

// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.mjs
// │
process.env.APP_ROOT = path.join(dirname, "..");

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
export const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
export const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, "public")
  : RENDERER_DIST;

export const settings = new Setting();
settings.load();

const mainWindow = new MainWindow();

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  mainWindow.remove();
  if (!isMac) {
    app.quit();
  }
});

app.on("activate", () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    mainWindow.init();
    bindMenuIpc(mainWindow);
  }
});

app
  .whenReady()
  .then(() => mainWindow.init())
  .finally(() => {
    bindDockerIpc(mainWindow);
    bindMenuIpc(mainWindow);
  });

ipcMain.handle("query", async (_, connectionId, query) => {
  const r = await ConnectionPool.query(connectionId, query);
  return r;
});

ipcMain.handle(
  "transaction",
  async (_, connectionId: string, query: string[]) => {
    return await ConnectionPool.batch(connectionId, query);
  },
);

ipcMain.handle("close", async (event) => {
  event.sender.close({
    waitForBeforeUnload: true,
  });
});

ipcMain.handle("connect", (_, conn: ConnectionStoreItem, enableDebug) => {
  createDatabaseWindow({
    conn,
    main: mainWindow,
    enableDebug,
  });
  bindSavedDocIpc(conn.id);
  if (mainWindow.getWindow()) {
    mainWindow.hide();
  }
});

ipcMain.handle("test-connection", async (_, conn: ConnectionStoreItem) => {
  return await ConnectionPool.testConnection(conn);
});

ipcMain.handle("download-update", () => {
  autoUpdater.downloadUpdate();
});

ipcMain.handle("restart", () => {
  autoUpdater.quitAndInstall();
});

ipcMain.handle("open-file-dialog", async (_, options: OpenDialogOptions) => {
  return await dialog.showOpenDialog(options);
});

ipcMain.handle("get-setting", (_, key) => {
  return settings.get(key);
});

ipcMain.handle("set-setting", (_, key, value) => {
  settings.set(key, value);
});

ipcMain.on("navigate", (event, route: string) => {
  event.sender.send("navigate-to", route);
});

ipcMain.handle("deleteDocFile", async (_, conn: ConnectionStoreItem) => {
  const savedDocDriver = new FileBasedSavedDocDriver(conn.id);
  await savedDocDriver.deleteDocFile();
});

bindAnalyticIpc();
