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
  private static docDriver: FileBasedDocDriver;

  static init(connId: string) {
    if (!this.docDrivers[connId]) {
      this.docDrivers[connId] = new FileBasedDocDriver(connId);
    }
    this.docDriver = this.docDrivers[connId];
  }

  static set(connId: string) {
    this.docDriver = this.docDrivers[connId];
  }

  static remove(connId: string) {
    delete this.docDrivers[connId];
  }

  static getNamespaces(): Promise<SavedDocNamespace[]> {
    return this.docDriver.getNamespaces();
  }

  static createNamespace(name: string): Promise<SavedDocNamespace> {
    return this.docDriver.createNamespace(name);
  }

  static updateNamespace(id: string, name: string): Promise<SavedDocNamespace> {
    return this.docDriver.updateNamespace(id, name);
  }

  static removeNamespace(id: string): Promise<void> {
    return this.docDriver.removeNamespace(id);
  }

  static async getDocs(): Promise<SavedDocGroupByNamespace[]> {
    return this.docDriver.getDocs();
  }

  static createDoc(
    type: SavedDocType,
    namespaceId: string,
    data: SavedDocInput,
  ): Promise<SavedDocData> {
    return this.docDriver.createDoc(type, namespaceId, data);
  }

  static async updateDoc(
    id: string,
    data: SavedDocInput,
  ): Promise<SavedDocData> {
    return this.docDriver.updateDoc(id, data);
  }

  static removeDoc(id: string): Promise<void> {
    return this.docDriver.removeDoc(id);
  }

  static async deleteDocFile(connId: string): Promise<void> {
    // delete document file from outside database window
    const docDriver = new FileBasedDocDriver(connId);
    docDriver.deleteDocFile(connId);
  }

  static addChangeListener(cb: () => void): void {
    this.docDriver.addChangeListener(cb);
  }

  static removeChangeListener(cb: () => void): void {
    this.docDriver.removeChangeListener(cb);
  }
}
