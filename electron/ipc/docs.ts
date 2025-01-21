import { ipcMain } from "electron";
import fs from "fs";
import { getUserDataFile } from "./../file-helper";

export function bindSavedDocIpc() {
  ipcMain.handle("doc-save", (_, connectionId: string, data: unknown) => {
    const file = getUserDataFile(`${connectionId}-docs.json`);
    console.log(file);
    fs.writeFileSync(file, JSON.stringify(data));
  });

  ipcMain.handle("doc-load", (_, connectionId: string) => {
    try {
      const file = getUserDataFile(`${connectionId}-docs.json`);

      if (!fs.existsSync(file)) {
        return null;
      }

      return JSON.parse(fs.readFileSync(file, "utf-8"));
    } catch {
      return null;
    }
  });

  ipcMain.handle("doc-delete", (_, connectionId: string) => {
    const file = getUserDataFile(`${connectionId}-docs.json`);

    if (fs.existsSync(file)) {
      fs.unlinkSync(file);
    }
  });
}
