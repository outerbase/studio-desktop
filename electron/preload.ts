import { DatabaseInstanceStoreItem } from "@/lib/db-manager-store";
import {
  ipcRenderer,
  contextBridge,
  type OpenDialogOptions,
  type OpenDialogReturnValue,
} from "electron";
import { type ConnectionStoreItem } from "@/lib/conn-manager-store";
import { type ContainerInspectInfo, type ContainerInfo } from "dockerode";
import { Result } from "./drivers/base";
import type { TrackEventItem } from "./ipc/analytics";
import { SavedDocData } from "./drivers/base-doc";

// Get connection id
const connectionId = process.argv
  .find((arg) => arg.startsWith("--database="))
  ?.substring(11);

console.log("Connection ID", connectionId);

const outerbaseIpc = {
  on(...args: Parameters<typeof ipcRenderer.on>) {
    const [channel, listener] = args;
    ipcRenderer.on(channel, listener);
    return () => {
      ipcRenderer.removeListener(channel, listener);
    };
  },

  off(...args: Parameters<typeof ipcRenderer.off>) {
    return ipcRenderer.off(...args);
  },

  send(...args: Parameters<typeof ipcRenderer.send>) {
    const [channel, ...omit] = args;
    return ipcRenderer.send(channel, ...omit);
  },

  invoke(...args: Parameters<typeof ipcRenderer.invoke>) {
    const [channel, ...omit] = args;
    return ipcRenderer.invoke(channel, ...omit);
  },

  query(statement: string) {
    return ipcRenderer.invoke("query", connectionId, statement);
  },

  transaction(statements: string[]) {
    return ipcRenderer.invoke("transaction", connectionId, statements);
  },

  close() {
    return ipcRenderer.invoke("close");
  },

  connect(conn: ConnectionStoreItem, enableDebug?: boolean) {
    return ipcRenderer.invoke("connect", conn, enableDebug);
  },

  testConnection(conn: ConnectionStoreItem): Promise<Result> {
    return ipcRenderer.invoke("test-connection", conn);
  },

  getConnection() {
    return ipcRenderer.invoke("get-connection");
  },

  downloadUpdate() {
    return ipcRenderer.invoke("download-update");
  },

  restart() {
    return ipcRenderer.invoke("restart");
  },

  openFileDialog(options?: OpenDialogOptions): Promise<OpenDialogReturnValue> {
    return ipcRenderer.invoke("open-file-dialog", options);
  },

  docker: {
    openVolume(containerId: string) {
      return ipcRenderer.invoke("docker-open-vol", containerId);
    },

    init(): Promise<boolean> {
      return ipcRenderer.invoke("docker-init");
    },

    start(containerId: string) {
      return ipcRenderer.invoke("docker-start", containerId);
    },

    stop(containerId: string) {
      return ipcRenderer.invoke("docker-stop", containerId);
    },

    list(): Promise<ContainerInfo[]> {
      return ipcRenderer.invoke("docker-list");
    },

    create(containerData: DatabaseInstanceStoreItem) {
      return ipcRenderer.invoke("docker-create", containerData);
    },

    remove(containerId: string) {
      return ipcRenderer.invoke("docker-remove", containerId);
    },

    pull(containerData: DatabaseInstanceStoreItem) {
      return ipcRenderer.invoke("docker-pull", containerData);
    },

    inspect(containerId: string): Promise<ContainerInspectInfo> {
      return ipcRenderer.invoke("docker-inspect", containerId);
    },
  },

  setting: {
    get: <T = string>(key: string): Promise<T> =>
      ipcRenderer.invoke("get-setting", key),
    set: <T = string>(key: string, value: T): Promise<void> =>
      ipcRenderer.invoke("set-setting", key, value),
  },

  // expose docs ipc following remote save doc from web studio: https://github.com/outerbase/studio/blob/develop/src/drivers/saved-doc/remote-saved-doc.ts
  docs: {
    getNamespaces: () => ipcRenderer.invoke("get-name-spaces"),

    createNamespace: (roomName: string) =>
      ipcRenderer.invoke("create-name-space", roomName),

    updateNamespace: (id: string, newName: string) =>
      ipcRenderer.invoke("update-name-space", id, newName),

    removeNamespace: (id: string): Promise<void> =>
      ipcRenderer.invoke("remove-name-space", id),

    createDoc: (
      type: string,
      namespace: string,
      data: Record<string, unknown>,
    ): Promise<SavedDocData> =>
      ipcRenderer.invoke("create-doc", type, namespace, data),

    getDocs: (connId: string): Promise<SavedDocData[]> => {
      return ipcRenderer.invoke("get-docs", connId);
    },

    updateDoc: (
      id: string,
      data: Record<string, SavedDocData>,
    ): Promise<SavedDocData> => ipcRenderer.invoke("update-doc", id, data),

    removeDoc: (id: string): Promise<void> =>
      ipcRenderer.invoke("remove-doc", id),

    deleteDocFile: (connId: string) => {
      ipcRenderer.invoke("delete-doc-file", connId);
    },

    addChangeListener: (cb: () => void) => {
      ipcRenderer.on("changeEvent", cb);
      ipcRenderer.send("add-change-listener");
    },

    removeChangeListener: (cb: () => void) => {
      ipcRenderer.removeListener("changeEvent", cb);
      ipcRenderer.send("remove-change-listener");
    },
  },

  sendAnalyticEvents(deviceId: string, events: TrackEventItem[]) {
    return ipcRenderer.invoke("send-analytic", deviceId, events);
  },
};

export type OuterbaseIpc = typeof outerbaseIpc;

// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld("outerbaseIpc", outerbaseIpc);
