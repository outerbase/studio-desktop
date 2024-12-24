import { ConnectionStoreItem } from "@/lib/conn-manager-store";
import BaseDriver from "./drivers/base";
import MySQLDriver from "./drivers/mysql";
import TursoDriver from "./drivers/sqlite";
import PostgresDriver from "./drivers/postgres";
import StarbaseDriver from "./drivers/starbase";
import CloudflareDriver from "./drivers/cloudflare";
import { windowMap } from "./window/create-database";
import { ConnectionPoolType } from "./type";

export class ConnectionPool {
  static connections: Record<string, BaseDriver> = {};

  protected static createDBPool(conn: ConnectionStoreItem) {
    if (ConnectionPool.connections[conn.id]) {
      const focusWindow = windowMap.get(conn.id);
      if (focusWindow && !focusWindow.isDestroyed()) {
        focusWindow.focus();
      }
      throw new Error(`Connection already exists: ${conn.id}`);
    }
    let connectionPool: ConnectionPoolType;
    switch (conn.type) {
      case "mysql":
        connectionPool = new MySQLDriver({
          host: conn.config.host,
          port: Number(conn.config.port || "3306"),
          user: conn.config.username || "root",
          password: conn.config.password || "",
          database: conn.config.database || "",
          ssl: conn.config.ssl ? { rejectUnauthorized: false } : undefined,
        });
        break;
      case "sqlite":
        connectionPool = new TursoDriver({
          url: "file:" + conn.config.host,
        });
        break;
      case "starbase":
        connectionPool = new StarbaseDriver(
          conn.config.host,
          conn.config.password!,
        );
        break;
      case "turso":
        connectionPool = new TursoDriver({
          url: conn.config.host,
          token: conn.config.password,
        });
        break;
      case "cloudflare":
        connectionPool = new CloudflareDriver({
          url: conn.config.host,
          accountId: conn.config.username!,
          databaseId: conn.config.database!,
          token: conn.config.password!,
        });
        break;
      case "postgres":
        connectionPool = new PostgresDriver({
          user: conn.config.username || "postgres",
          host: conn.config.host,
          database: conn.config.database || "postgres",
          password: conn.config.password || "",
          port: Number(conn.config.port || "5432"),
          ssl: conn.config.ssl
            ? {
                rejectUnauthorized: false,
              }
            : undefined,
        });
        break;
      default:
        throw new Error(`Unsupported connection type: ${conn.type}`);
    }
    return connectionPool;
  }

  static create(conn: ConnectionStoreItem) {
    this.connections[conn.id] = this.createDBPool(conn);
  }

  static async testConnection(conn: ConnectionStoreItem) {
    const pool = this.createDBPool(conn);
    try {
      return await pool.query("SELECT 1");
    } catch (error) {
      throw new Error(`Failed to connect to database: ${error}`);
    } finally {
      pool.close();
    }
  }

  static close(connectionId: string) {
    const conn = ConnectionPool.connections[connectionId];
    if (!conn) {
      throw new Error(`Connection not found: ${connectionId}`);
    }

    conn.close();
    delete ConnectionPool.connections[connectionId];
  }

  static query(connectionId: string, query: string) {
    const conn = ConnectionPool.connections[connectionId];
    if (!conn) {
      throw new Error(`Connection not found: ${connectionId}`);
    }

    return conn.query(query);
  }

  static batch(connectionId: string, query: string[]) {
    const conn = ConnectionPool.connections[connectionId];
    if (!conn) {
      throw new Error(`Connection not found: ${connectionId}`);
    }

    return conn.batch(query);
  }
}
