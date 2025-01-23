import { isMac } from "../utils";
import { MainWindow } from "../window/main-window";
import { OUTERBASE_GITHUB, OUTERBASE_WEBSITE } from "../constants";
import { ConnectionStoreItem } from "@/lib/conn-manager-store";
import {
  app,
  ipcMain,
  Menu,
  MenuItemConstructorOptions,
  shell,
} from "electron";
import { createDatabaseWindow, windowMap } from "../window/create-database";

export function bindMenuIpc(main: MainWindow) {
  const mainWindow = main.getWindow();

  function createMenu(connections: ConnectionStoreItem[]) {
    function onOpenConnectionWindow(type: ConnectionStoreItem["type"]) {
      main.navigate(`/connection/create/${type}`);
    }

    function generateSubMenu() {
      const MAX_VISIBLE_CONNECTIONS = 10;

      const visibleConn = connections.slice(0, MAX_VISIBLE_CONNECTIONS);
      const remainConn = connections.slice(MAX_VISIBLE_CONNECTIONS);

      const connMenu: MenuItemConstructorOptions["submenu"] = visibleConn.map(
        (conn) => {
          return {
            label: conn.name,
            click: () => {
              const existingWindow = windowMap.get(conn.id);
              if (existingWindow && !existingWindow.isDestroyed()) {
                existingWindow.focus();
              } else {
                if (!mainWindow?.isDestroyed()) {
                  if (mainWindow?.isVisible()) {
                    main.hide();
                  }
                  createDatabaseWindow({ main, conn });
                  main.updateConnection(conn);
                }
              }
            },
          };
        },
      );

      if (remainConn.length > 0) {
        connMenu.push({
          type: "separator",
        });
        connMenu.push({
          label: "See more connection...",
          click: () => {
            main.show();
            main.navigate("/connection");
          },
        });
      }

      return connMenu;
    }

    const connSubMenu = generateSubMenu();
    const customTemplate = [
      ...(isMac
        ? [
            {
              label: app.name,
              submenu: [
                { role: "about" },
                { type: "separator" },
                { role: "services" },
                { type: "separator" },
                { role: "hide" },
                { role: "hideOthers" },
                { role: "unhide" },
                { type: "separator" },
                { role: "quit" },
              ],
            },
          ]
        : []),
      {
        label: "File",
        submenu: [
          {
            label: "New Connection",
            submenu: [
              {
                type: "separator",
              },
              {
                label: "SQLite",
                click: () => onOpenConnectionWindow("sqlite"),
              },
              {
                label: "Turso",
                click: () => onOpenConnectionWindow("turso"),
              },
              {
                label: "Cloudflare D1",
                click: () => onOpenConnectionWindow("cloudflare"),
              },
              {
                label: "Starbase",
                click: () => onOpenConnectionWindow("starbase"),
              },
              {
                type: "separator",
              },
              {
                label: "MySQL (beta)",
                click: () => onOpenConnectionWindow("mysql"),
              },
              {
                label: "Dolt (beta)",
                click: () => onOpenConnectionWindow("dolt"),
              },
              {
                type: "separator",
              },
              {
                label: "PostgreSQL (beta)",
                click: () => onOpenConnectionWindow("postgres"),
              },
            ],
          },
          {
            type: "separator",
          },
          {
            label: "Open Recent",
            enabled: connSubMenu.length > 0,
            submenu: connSubMenu,
          },
          {
            type: "separator",
          },
          {
            label: "Import Connection String",
            click: () => {
              main.navigate("/connection/import");
            },
          },
          {
            type: "separator",
          },
          { role: "close" },
          ...(isMac ? [] : [{ label: "Exit", role: "quit" }]),
        ],
      },
      {
        label: "Edit",
        submenu: [
          { role: "undo" },
          { role: "redo" },
          { type: "separator" },
          { role: "cut" },
          { role: "copy" },
          { role: "paste" },
          { role: "delete" },
          { role: "selectAll" },
        ],
      },
      {
        label: "View",
        submenu: [
          { role: "reload" },
          { role: "forceReload" },
          { role: "toggleDevTools" },
          { type: "separator" },
          { role: "resetZoom" },
          { role: "zoomIn" },
          { role: "zoomOut" },
          { type: "separator" },
          { role: "togglefullscreen" },
        ],
      },
      {
        label: "Window",
        submenu: [
          { role: "minimize" },
          { role: "zoom" },
          ...(isMac
            ? [{ type: "separator" }, { role: "front" }]
            : [{ role: "close" }]),
        ],
      },
      {
        label: "Help",
        submenu: [
          {
            label: "About Us",
            click: async () => {
              await shell.openExternal(OUTERBASE_WEBSITE);
            },
          },
          {
            label: "Report issues",
            click: async () => {
              await shell.openExternal(OUTERBASE_GITHUB);
            },
          },
        ],
      },
    ] as MenuItemConstructorOptions[];

    const menu = Menu.buildFromTemplate(customTemplate);
    Menu.setApplicationMenu(menu);
  }

  ipcMain.on("connections", (_, connections: ConnectionStoreItem[]) => {
    createMenu(connections);
  });
}
