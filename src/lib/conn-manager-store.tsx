import { ConnectionEditorTemplate } from "@/database/editor";
import {
  CloudflareIcon,
  DoltIcon,
  MySQLIcon,
  PostgreIcon,
  SQLiteIcon,
  StarbaseIcon,
  TursoIcon,
} from "./outerbase-icon";

export interface ConnectionStoreItemConfig {
  ssl?: boolean;
  host: string;
  port?: string;
  database?: string;
  username?: string;
  password?: string;
}
export interface ConnectionStoreItem {
  id: string;
  name: string;
  type: string;
  color?: string;
  createdAt?: number;
  updatedAt?: number;
  lastConnectedAt?: number;
  config: ConnectionStoreItemConfig;
}

export type SortBy = "lastConnectedAt" | "createdAt";

export type OrderBy = "asc" | "desc";

interface ConnectionTypeTemplate {
  name: string;
  label: string;
  template: ConnectionEditorTemplate;
  icon: React.ComponentType<{ className: string }>;
  defaultValue: ConnectionStoreItem["config"];
}

const genericTemplate: ConnectionEditorTemplate = [
  {
    columns: [
      { name: "host", label: "Host", type: "text", required: true },
      {
        name: "port",
        label: "Port",
        type: "text",
        required: true,
        size: "w-[100px]",
      },
    ],
  },
  {
    columns: [
      { name: "username", label: "Username", type: "text", required: true },
      {
        name: "password",
        label: "Password",
        type: "password",
        required: true,
      },
    ],
  },
  {
    columns: [
      { name: "database", label: "Database", type: "text", required: true },
    ],
  },
  {
    columns: [
      {
        name: "ssl",
        label: "SSL",
        type: "checkbox",
        required: false,
      },
    ],
  },
];

export const connectionTypeTemplates: Record<string, ConnectionTypeTemplate> = {
  mysql: {
    name: "mysql",
    label: "MySQL",
    template: genericTemplate,
    icon: MySQLIcon,
    defaultValue: {
      host: "localhost",
      port: "3306",
      username: "root",
    },
  },
  dolt: {
    name: "dolt",
    label: "Dolt",
    template: genericTemplate,
    icon: DoltIcon,
    defaultValue: {
      host: "localhost",
      port: "3306",
      username: "root",
    },
  },
  postgres: {
    name: "postgres",
    label: "PostgreSQL",
    template: genericTemplate,
    icon: PostgreIcon,
    defaultValue: {
      host: "localhost",
      port: "5432",
      username: "postgres",
      database: "postgres",
    },
  },
  turso: {
    name: "turso",
    label: "Turso",
    icon: TursoIcon,
    defaultValue: {
      host: "libsql://localhost",
      password: "",
    },
    template: [
      {
        columns: [{ name: "host", label: "URL", type: "text", required: true }],
      },
      {
        columns: [
          {
            name: "password",
            label: "Token",
            type: "textarea",
            placeholder: "Token",
            required: true,
          },
        ],
      },
    ],
  },
  cloudflare: {
    name: "cloudflare",
    label: "Cloudflare D1",
    icon: CloudflareIcon,
    defaultValue: {
      host: "",
      password: "",
    },
    template: [
      {
        columns: [
          {
            name: "database",
            label: "Database ID",
            type: "text",
            required: true,
          },
          {
            name: "username",
            label: "Account ID",
            type: "text",
            required: true,
          },
        ],
      },
      {
        columns: [
          { name: "password", label: "Token", type: "text", required: true },
        ],
      },
    ],
  },
  starbase: {
    name: "starbase",
    label: "Starbase",
    icon: StarbaseIcon,
    defaultValue: { host: "" },
    template: [
      {
        columns: [
          {
            name: "host",
            label: "URL",
            placeholder: "https://starbase.your-account.workers.dev",
            type: "text",
            required: true,
          },
        ],
      },
      {
        columns: [
          {
            name: "password",
            label: "Token",
            type: "textarea",
            placeholder: "Token",
            required: true,
          },
        ],
      },
    ],
  },
  sqlite: {
    name: "sqlite",
    label: "SQLite",
    icon: SQLiteIcon,
    defaultValue: { host: "" },
    template: [
      {
        columns: [
          {
            name: "host",
            label: "Database",
            type: "file",
            required: true,
            size: "max-w-[400px]",
            fileOption: {
              title: "Open File",
              filters: [
                {
                  name: "SQLite Database",
                  extensions: ["sqlite", "sqlite3", "db", "db3", "s3db"],
                },
                { name: "Any files", extensions: ["*"] },
              ],
            },
          },
        ],
      },
    ],
  },
};

export class ConnectionStoreManager {
  private static CONNECTIONS = "connections";
  private static SORT_PREFERENCES_KEY = "connection_sort_preferences";

  static list() {
    try {
      const data = localStorage.getItem(this.CONNECTIONS);
      if (!data) return [];
      const parsedJson = JSON.parse(data);
      // send to main process
      window.outerbaseIpc.send(this.CONNECTIONS, parsedJson);
      return parsedJson as ConnectionStoreItem[];
    } catch {
      return [];
    }
  }

  static get(connectionId: string) {
    const list = this.list();
    return list.find((i) => i.id === connectionId);
  }

  static remove(connectionId: string) {
    const list = this.list();

    const tmp = list.filter((i) => i.id !== connectionId);

    localStorage.setItem(this.CONNECTIONS, JSON.stringify(tmp));

    return tmp;
  }

  static duplicate(item: ConnectionStoreItem) {
    const newItem: ConnectionStoreItem = {
      ...item,
      id: crypto.randomUUID(),
      name: `${item.name} (Copy)`,
      createdAt: Date.now(),
    };

    // Make it below the original item
    const list = this.list();
    const index = list.findIndex((i) => i.id === item.id);
    list.splice(index + 1, 0, newItem);

    localStorage.setItem(this.CONNECTIONS, JSON.stringify(list));
    return list;
  }

  static save(item: ConnectionStoreItem) {
    const list = this.list();
    const index = list.findIndex((i) => i.id === item.id);

    if (index === -1) {
      list.unshift(item);
    } else {
      list[index] = item;
    }
    const { sortBy, orderBy } = this.getSortPreferences();
    const finalData = this.sort(list, sortBy, orderBy);
    localStorage.setItem(this.CONNECTIONS, JSON.stringify(finalData));
  }

  static saveAll(items: ConnectionStoreItem[]) {
    localStorage.setItem(this.CONNECTIONS, JSON.stringify(items));
  }

  /**
   * Sort the connections based on a specified key.
   * @param items - The list of connections to sort.
   * @param sortBy - The key to sort by (e.g., 'createdAt', 'lastConnectedAt').
   * @param order - The sorting order ('asc' or 'desc'). Default is 'asc'.
   * @returns - The sorted array of connections.
   */
  static sort(items: ConnectionStoreItem[], sortBy: SortBy, orderBy: OrderBy) {
    return [...items].sort((a, b) => {
      const aValue = a[sortBy] ?? 0;
      const bValue = b[sortBy] ?? 0;

      if (orderBy === "asc") {
        return aValue - bValue;
      } else {
        return bValue - aValue;
      }
    });
  }

  /**
   * Persist sorting preferences to localStorage.
   * @param sortBy - The key to sort by (e.g., 'createdAt', 'lastConnectedAt').
   * @param order - The sorting order ('asc' or 'desc').
   */
  static setSortPreferences(sortBy: SortBy, orderBy: OrderBy) {
    const preferences = { sortBy, orderBy };
    localStorage.setItem(
      this.SORT_PREFERENCES_KEY,
      JSON.stringify(preferences),
    );
  }

  /**
   * Retrieve the current sort preferences.
   * @returns - The sort key and order.
   */
  static getSortPreferences(): {
    sortBy: SortBy;
    orderBy: OrderBy;
  } {
    const data = localStorage.getItem(this.SORT_PREFERENCES_KEY);
    if (data) {
      return JSON.parse(data);
    }
    // Default to sorting by 'lastConnectedAt' in descending order
    return { sortBy: "lastConnectedAt", orderBy: "desc" };
  }
}
