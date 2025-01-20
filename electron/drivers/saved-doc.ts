import fs from "fs";
import { getUserDataFile } from "../file-helper";
import {
  SavedDocType,
  SavedDocNamespace,
  SavedDocInput,
  SavedDocData,
  SavedDocGroupByNamespace,
  BaseDocDriver,
} from "./base-doc";

export class FileBasedDocDriver implements BaseDocDriver {
  private storagePath: string;
  private data: { namespaces: SavedDocNamespace[]; docs: SavedDocData[] };
  private changeListeners: Set<() => void> = new Set();

  constructor(connectionId: string) {
    if (!connectionId) throw new Error("Connection ID must be provide!");

    this.storagePath = getUserDataFile(`saved-docs-${connectionId}.json`);
    this.data = this.loadStorage();
  }

  private loadStorage(): {
    namespaces: SavedDocNamespace[];
    docs: SavedDocData[];
  } {
    if (!fs.existsSync(this.storagePath)) {
      return { namespaces: [], docs: [] };
    }
    return JSON.parse(fs.readFileSync(this.storagePath, "utf-8"));
  }

  private saveStorage(): void {
    fs.writeFileSync(this.storagePath, JSON.stringify(this.data, null, 2));
  }

  public async getNamespaces(): Promise<SavedDocNamespace[]> {
    return this.data.namespaces;
  }

  public async createNamespace(name: string): Promise<SavedDocNamespace> {
    const namespace: SavedDocNamespace = {
      id: crypto.randomUUID(),
      name,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    this.data.namespaces.push(namespace);
    this.saveStorage();
    this.notifyChange();
    return namespace;
  }

  public async updateNamespace(
    id: string,
    name: string,
  ): Promise<SavedDocNamespace> {
    const namespace = this.data.namespaces.find((n) => n.id === id);
    if (!namespace) {
      throw new Error("Namespace not found");
    }
    namespace.name = name;
    namespace.updatedAt = Date.now();
    this.saveStorage();
    this.notifyChange();
    return namespace;
  }

  public async removeNamespace(id: string): Promise<void> {
    this.data.namespaces = this.data.namespaces.filter((n) => n.id !== id);
    this.data.docs = this.data.docs.filter((d) => d.namespace.id !== id);
    this.saveStorage();
    this.notifyChange();
  }

  public async getDocs(): Promise<SavedDocGroupByNamespace[]> {
    return this.data.namespaces.map((namespace) => ({
      namespace,
      docs: this.data.docs.filter((doc) => doc.namespace.id === namespace.id),
    }));
  }

  public async createDoc(
    type: SavedDocType,
    namespaceId: string,
    data: SavedDocInput,
  ): Promise<SavedDocData> {
    const namespace = this.data.namespaces.find((n) => n.id === namespaceId);
    if (!namespace) throw new Error("Namespace not found");

    const doc: SavedDocData = {
      id: crypto.randomUUID(),
      type,
      namespace: { id: namespace.id, name: namespace.name },
      name: data.name,
      content: data.content,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    this.data.docs.push(doc);
    this.saveStorage();
    this.notifyChange();
    return doc;
  }

  public async updateDoc(
    id: string,
    data: SavedDocInput,
  ): Promise<SavedDocData> {
    const doc = this.data.docs.find((d) => d.id === id);
    if (!doc) throw new Error("Document not found");

    doc.name = data.name;
    doc.content = data.content;
    doc.updatedAt = Date.now();
    this.saveStorage();
    this.notifyChange();
    return doc;
  }

  async deleteDocFile(connId: string): Promise<void> {
    const storagePath = getUserDataFile(`saved-docs-${connId}.json`);
    try {
      if (fs.existsSync(storagePath)) {
        fs.unlinkSync(storagePath);
      } else {
        console.warn(`File not found: ${storagePath}`);
      }
    } catch (error) {
      console.error(`Failed to delete file: ${storagePath}`, error);
      throw new Error("Error deleting the database file");
    }
  }

  public async removeDoc(id: string): Promise<void> {
    this.data.docs = this.data.docs.filter((d) => d.id !== id);
    this.saveStorage();
    this.notifyChange();
  }

  private notifyChange(): void {
    this.changeListeners.forEach((listener) => listener());
  }

  public addChangeListener(cb: () => void): void {
    this.changeListeners.add(cb);
  }

  public removeChangeListener(cb: () => void): void {
    this.changeListeners.delete(cb);
  }
}
