import {
  SavedDocData,
  SavedDocGroupByNamespace,
  SavedDocInput,
  SavedDocNamespace,
  SavedDocType,
} from "./drivers/base-doc";
import { FileBasedDocDriver } from "./drivers/saved-doc";

export class SavedDocManager {
  private static docDrivers: Record<string, FileBasedDocDriver> = {};
  private static activeConnectionId: string | null = null;

  static init(connId: string) {
    if (!this.docDrivers[connId]) {
      this.docDrivers[connId] = new FileBasedDocDriver(connId);
    }
    this.activeConnectionId = connId;
  }

  static set(connId: string) {
    this.activeConnectionId = connId;
  }

  static remove(connId: string) {
    delete this.docDrivers[connId];
  }

  private static getDocDriver(): FileBasedDocDriver {
    if (!this.activeConnectionId) {
      throw new Error(
        "No active connection. Please initialize one using `init`.",
      );
    }
    return this.docDrivers[this.activeConnectionId];
  }

  static getNamespaces(): Promise<SavedDocNamespace[]> {
    const docDriver = this.getDocDriver();
    return docDriver.getNamespaces();
  }

  static createNamespace(name: string): Promise<SavedDocNamespace> {
    const docDriver = this.getDocDriver();
    return docDriver.createNamespace(name);
  }

  static updateNamespace(id: string, name: string): Promise<SavedDocNamespace> {
    const docDriver = this.getDocDriver();
    return docDriver.updateNamespace(id, name);
  }

  static removeNamespace(id: string): Promise<void> {
    const docDriver = this.getDocDriver();
    return docDriver.removeNamespace(id);
  }

  static async getDocs(): Promise<SavedDocGroupByNamespace[]> {
    const docDriver = this.getDocDriver();
    return docDriver.getDocs();
  }

  static createDoc(
    type: SavedDocType,
    namespaceId: string,
    data: SavedDocInput,
  ): Promise<SavedDocData> {
    const docDriver = this.getDocDriver();
    return docDriver.createDoc(type, namespaceId, data);
  }

  static async updateDoc(
    id: string,
    data: SavedDocInput,
  ): Promise<SavedDocData> {
    const docDriver = this.getDocDriver();
    return docDriver.updateDoc(id, data);
  }

  static removeDoc(id: string): Promise<void> {
    const docDriver = this.getDocDriver();
    return docDriver.removeDoc(id);
  }

  static async deleteDocFile(connId: string): Promise<void> {
    // delete document file from outside database window
    const docDriver = new FileBasedDocDriver(connId);
    docDriver.deleteDocFile(connId);
  }

  static addChangeListener(cb: () => void): void {
    const docDriver = this.getDocDriver();
    docDriver.addChangeListener(cb);
  }

  static removeChangeListener(cb: () => void): void {
    const docDriver = this.getDocDriver();
    docDriver.removeChangeListener(cb);
  }
}
