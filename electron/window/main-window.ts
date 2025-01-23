import path from "node:path";
import log from "electron-log";
import { BrowserWindow } from "electron";
import { OuterbaseApplication } from "../type";
import { getWindowConfig, isDev } from "../utils";
import {
  VITE_DEV_SERVER_URL,
  RENDERER_DIST,
  getAutoUpdater,
  settings,
} from "../main";
import { ThemeType } from "@/context/theme-provider";
import { ConnectionStoreItem } from "@/lib/conn-manager-store";

const autoUpdater = getAutoUpdater();

/**
 * WARNING: Avoid using this main window as multiple window
 */
export class MainWindow {
  private win?: BrowserWindow;

  /**
   * Initialize the main window
   */
  public init() {
    const theme = settings.get<ThemeType>("theme") || "light";
    this.win = new BrowserWindow({
      ...getWindowConfig(undefined, theme),
      show: true,
      title: "Outerbase Studio",
      autoHideMenuBar: true,
    });
    if (isDev) {
      this.win.webContents.openDevTools({ mode: "detach" });
    }

    this.win.on("close", (event) => {
      if (BrowserWindow.getAllWindows().length === 1) {
        this.win?.destroy();
      } else {
        this.navigate("/connection");
        this.hide();
      }
      event.preventDefault();
    });

    // Test active push message to Renderer-process.
    this.win.webContents.on("did-finish-load", () => {
      this.win?.webContents.send(
        "main-process-message",
        new Date().toLocaleString(),
      );
    });

    this.win.webContents.on("will-navigate", (event, url) => {
      console.log("trying to navigate", url);
      event.preventDefault();
    });

    this.win.webContents.on("will-redirect", (event, url) => {
      log.info("trying to redirect", url);
      event.preventDefault();
    });

    autoUpdater.checkForUpdatesAndNotify();

    autoUpdater.on("checking-for-update", () => {
      this.win?.webContents.send("checking-for-update");
      log.info("checking-for-update");
    });

    autoUpdater.on("update-available", (info) => {
      this.win?.webContents.send("update-available", info);
      log.info("update-available", info);
    });

    autoUpdater.on("update-not-available", (info) => {
      this.win?.webContents.send("update-not-available", info);
      log.info("update-not-available", info);
    });

    autoUpdater.on("error", (info) => {
      this.win?.webContents.send("update-error", info);
      log.info("error", info);
    });

    autoUpdater.on("download-progress", (progress) => {
      this.win?.webContents.send("update-download-progress", progress);
      log.info("download-progress", progress);
    });

    autoUpdater.on("update-downloaded", (info) => {
      this.win?.webContents.send("update-downloaded", info);
      log.info("update-downloaded", info);
    });

    if (VITE_DEV_SERVER_URL) {
      this.win.loadURL(VITE_DEV_SERVER_URL);
    } else {
      // win.loadFile('dist/index.html')
      this.win.loadFile(path.join(RENDERER_DIST, "index.html"));
    }
  }

  public navigate(routeName: string): void {
    if (this.win) {
      if (this.win.isDestroyed()) {
        this.init();
      } else {
        this.show();
      }
      this.win.webContents.send("navigate-to", routeName);
    }
  }

  public hide(): void {
    this.win?.hide();
  }

  public show(): void {
    if (!this.win || this.win.isDestroyed()) {
      this.init();
    } else {
      this.win?.show();
    }
  }

  /**
   *
   * @returns Browswer window
   */
  public getWindow(): OuterbaseApplication["win"] {
    return this.win;
  }

  public remove() {
    this.win = undefined;
  }

  public updateConnection(conn: ConnectionStoreItem) {
    this.win?.webContents.send("update-connection", conn);
  }
}
