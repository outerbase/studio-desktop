import { ThemeType } from "@/context/theme-provider";
import { ConnectionStoreItem } from "@/lib/conn-manager-store";
import { BrowserWindow } from "electron";
import { ConnectionPool } from "../connection-pool";
import { STUDIO_ENDPOINT } from "../constants";
import { getWindowConfig, isDev } from "../utils";
import { MainWindow } from "./main-window";
import { settings } from "../main";

export const windowMap = new Map<string, BrowserWindow>();

export function createDatabaseWindow(ctx: {
  main: MainWindow;
  conn: ConnectionStoreItem;
  enableDebug?: boolean;
}) {
  const win = ctx.main.getWindow();
  const theme = settings.get<ThemeType>("theme") || "light";
  const dbWindow = new BrowserWindow(getWindowConfig(ctx.conn.id, theme));

  ConnectionPool.create(ctx.conn);

  const queryString = new URLSearchParams({
    name: ctx.conn.name,
    theme,
    color: ctx.conn.color || "",
  }).toString();

  windowMap.set(ctx.conn.id, dbWindow);

  dbWindow.on("closed", () => {
    if (windowMap.size === 1) {
      win?.show();
    }
    windowMap.delete(ctx.conn.id);
    ConnectionPool.close(ctx.conn.id);
    dbWindow.destroy();
  });

  if (ctx.conn.type === "mysql") {
    dbWindow.loadURL(`${STUDIO_ENDPOINT}/mysql?${queryString}`);
  } else if (ctx.conn.type === "dolt") {
    dbWindow.loadURL(`${STUDIO_ENDPOINT}/dolt?${queryString}`);
  } else if (ctx.conn.type === "postgres") {
    dbWindow.loadURL(`${STUDIO_ENDPOINT}/postgres?${queryString}`);
  } else if (ctx.conn.type === "starbase" || ctx.conn.type === "cloudflare") {
    dbWindow.loadURL(`${STUDIO_ENDPOINT}/starbase?${queryString}`);
  } else {
    dbWindow.loadURL(`${STUDIO_ENDPOINT}/sqlite?${queryString}`);
  }

  if (isDev || ctx.enableDebug) {
    dbWindow.webContents.openDevTools();
    dbWindow.maximize();
  }

  dbWindow.show();
}
