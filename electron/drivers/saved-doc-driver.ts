import { getUserDataFile } from "../file-helper";
import fs from "fs";

export type SavedDocType = "sql";

export interface SavedDocNamespaceInput {
  name: string;
}

export interface SavedDocNamespace extends SavedDocNamespaceInput {
  id: string;
  createdAt: number;
  updatedAt: number;
}

export interface SavedDocInput {
  name: string;
  content: string;
}

export interface SavedDocData extends SavedDocInput {
  id: string;
  type: SavedDocType;
  namespace: { id: string; name: string };
  createdAt: number;
  updatedAt: number;
}

export interface SavedDocGroupByNamespace {
  namespace: SavedDocNamespace;
  docs: SavedDocData[];
}

export class FileBasedSavedDocDriver {
  private storagePath: string;
  private data: { namespaces: SavedDocNamespace[]; docs: SavedDocData[] };
  private changeListeners: Set<() => void> = new Set();

  constructor(databaseId: string) {
    this.storagePath = getUserDataFile(`saved-docs-${databaseId}.json`);
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

  async getNamespaces(): Promise<SavedDocNamespace[]> {
    return this.data.namespaces;
  }

  async createNamespace(name: string): Promise<SavedDocNamespace> {
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

  async updateNamespace(id: string, name: string): Promise<SavedDocNamespace> {
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

  async removeNamespace(id: string): Promise<void> {
    this.data.namespaces = this.data.namespaces.filter((n) => n.id !== id);
    this.data.docs = this.data.docs.filter((d) => d.namespace.id !== id);
    this.saveStorage();
    this.notifyChange();
  }

  async getDocs(): Promise<SavedDocGroupByNamespace[]> {
    return this.data.namespaces.map((namespace) => ({
      namespace,
      docs: this.data.docs.filter((doc) => doc.namespace.id === namespace.id),
    }));
  }

  async createDoc(
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
      createdAt: Date.now(),
      updatedAt: Date.now(),
      ...data,
    };
    this.data.docs.push(doc);
    this.saveStorage();
    this.notifyChange();
    return doc;
  }

  async updateDoc(id: string, data: SavedDocInput): Promise<SavedDocData> {
    const doc = this.data.docs.find((d) => d.id === id);
    if (!doc) throw new Error("Document not found");

    doc.name = data.name;
    doc.content = data.content;
    doc.updatedAt = Date.now();
    this.saveStorage();
    this.notifyChange();
    return doc;
  }

  async removeDoc(id: string): Promise<void> {
    this.data.docs = this.data.docs.filter((d) => d.id !== id);
    this.saveStorage();
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
