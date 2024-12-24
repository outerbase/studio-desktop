import path from "node:path";
import log from "electron-log";
import { BrowserWindow } from "electron";
import { OuterbaseApplication } from "../type";
import { getOuterbaseDir, isDev } from "../utils";
import { VITE_DEV_SERVER_URL, RENDERER_DIST, getAutoUpdater } from "../main";

const autoUpdater = getAutoUpdater();

/**
 * WARNING: Avoid using this main window as multiple window
 */
export class MainWindow {
  private application: OuterbaseApplication = {};

  constructor() {
    this.application.win = undefined;
  }

  /**
   * Initialize the main window
   */
  public init() {
    const dirname = getOuterbaseDir();

    this.application.win = new BrowserWindow({
      icon: path.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
      title: "Outerbase Studio",
      autoHideMenuBar: true,
      webPreferences: {
        devTools: true,
        preload: path.join(dirname, "preload.mjs"),
      },
    });
    if (isDev) {
      this.application.win.webContents.openDevTools({ mode: "detach" });
    }

    this.application.win.on("close", (event) => {
      if (BrowserWindow.getAllWindows().length === 1) {
        this.application.win?.destroy();
      } else {
        this.navigate("/connection");
        this.hide();
      }
      event.preventDefault();
    });

    // Test active push message to Renderer-process.
    this.application.win.webContents.on("did-finish-load", () => {
      this.application.win?.webContents.send(
        "main-process-message",
        new Date().toLocaleString(),
      );
    });

    this.application.win.webContents.on("will-navigate", (event, url) => {
      console.log("trying to navigate", url);
      event.preventDefault();
    });

    this.application.win.webContents.on("will-redirect", (event, url) => {
      log.info("trying to redirect", url);
      event.preventDefault();
    });

    autoUpdater.checkForUpdatesAndNotify();

    autoUpdater.on("checking-for-update", () => {
      this.application.win?.webContents.send("checking-for-update");
      log.info("checking-for-update");
    });

    autoUpdater.on("update-available", (info) => {
      this.application.win?.webContents.send("update-available", info);
      log.info("update-available", info);
    });

    autoUpdater.on("update-not-available", (info) => {
      this.application.win?.webContents.send("update-not-available", info);
      log.info("update-not-available", info);
    });

    autoUpdater.on("error", (info) => {
      this.application.win?.webContents.send("update-error", info);
      log.info("error", info);
    });

    autoUpdater.on("download-progress", (progress) => {
      this.application.win?.webContents.send(
        "update-download-progress",
        progress,
      );
      log.info("download-progress", progress);
    });

    autoUpdater.on("update-downloaded", (info) => {
      this.application.win?.webContents.send("update-downloaded", info);
      log.info("update-downloaded", info);
    });

    if (VITE_DEV_SERVER_URL) {
      this.application.win.loadURL(VITE_DEV_SERVER_URL);
    } else {
      // win.loadFile('dist/index.html')
      this.application.win.loadFile(path.join(RENDERER_DIST, "index.html"));
    }
  }

  public navigate(routeName: string): void {
    if (this.application.win) {
      if (this.application.win.isDestroyed()) {
        this.init();
      } else {
        this.show();
      }
      this.application.win.webContents.send("navigate-to", routeName);
    }
  }

  public hide(): void {
    this.application.win?.hide();
  }

  public show(): void {
    if (!this.application.win || this.application.win.isDestroyed()) {
      this.init();
    } else {
      this.application.win?.show();
    }
  }

  /**
   *
   * @returns Browswer window
   */
  public getWindow(): OuterbaseApplication["win"] {
    return this.application.win;
  }

  public remove() {
    this.application.win = undefined;
  }
}
