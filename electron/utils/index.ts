import { ThemeType } from "@/context/theme-provider";
import { Colors } from "../../src/theme/Colors";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { BrowserWindow, screen } from "electron";

const isMac = process.platform === "darwin";
const isWindow = process.platform === "win32";
const isLinux = process.platform === "linux";

function getOuterbaseDir() {
  return path.dirname(fileURLToPath(import.meta.url));
}

const isDev = process.env.NODE_ENV === "development";

/**
 *
 * @param connId connection id string (optional)
 * @returns window configuration object
 */
function getWindowConfig(
  connId?: string,
  theme: ThemeType = "light",
): Electron.BrowserWindowConstructorOptions {
  const focusedWindow = BrowserWindow.getFocusedWindow();

  const windowWidth = 1024;
  const windowHeight = 768;

  let display;
  if (focusedWindow) {
    const { x, y } = focusedWindow.getBounds();
    display = screen.getDisplayNearestPoint({ x, y });
  } else {
    const cursorPoint = screen.getCursorScreenPoint();
    display = screen.getDisplayNearestPoint(cursorPoint);
  }

  const { bounds } = display;

  const x = Math.floor(bounds.x + (bounds.width - windowWidth) / 2);
  const y = Math.floor(bounds.y + (bounds.height - windowHeight) / 2);

  return {
    x,
    y,
    icon: path.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
    width: windowWidth,
    height: windowHeight,
    show: false,
    autoHideMenuBar: false,
    backgroundColor: Colors.background[theme],
    webPreferences: {
      devTools: true,
      additionalArguments: connId ? ["--database=" + connId] : undefined,
      preload: path.join(getOuterbaseDir(), "preload.mjs"),
    },
  };
}

export { isMac, isLinux, isWindow, isDev, getWindowConfig, getOuterbaseDir };
