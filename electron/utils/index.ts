import path from "node:path";
import { fileURLToPath } from "node:url";

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
function getWindowConfig(connId?: string) {
  return {
    icon: path.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
    show: false,
    width: 1024,
    height: 768,
    autoHideMenuBar: false,
    webPreferences: {
      devTools: true,
      additionalArguments: ["--database=" + connId],
      preload: path.join(getOuterbaseDir(), "preload.mjs"),
    },
  };
}

export { isMac, isLinux, isWindow, isDev, getWindowConfig, getOuterbaseDir };
