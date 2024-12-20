import fs from "fs";
import { ipcMain, shell } from "electron";
import Docker, { ContainerInspectInfo } from "dockerode";
import { getUserDataPath } from "./../file-helper";
import { type DatabaseInstanceStoreItem } from "@/lib/db-manager-store";
import { OuterbaseApplication } from "../type";

export interface PullImageProgress {
  status: string;
  progressDetail: { current: number; total: number };
  progress: string;
  id: string;
}

export function bindDockerIpc(app: OuterbaseApplication) {
  const docker = new Docker();
  let eventStream: NodeJS.ReadableStream | undefined;
  let dockerIniting = false;

  async function getContainer(
    id: string,
  ): Promise<ContainerInspectInfo | undefined> {
    return await new Promise((resolve) => {
      docker.getContainer(id).inspect((err, data) => {
        if (err) resolve(undefined);
        resolve(data);
      });
    });
  }

  async function startContainer(id: string) {
    console.log("starting", id);
    return await new Promise((resolve, reject) => {
      docker.getContainer(id).start((err) => {
        if (err) reject(err);
        resolve(true);
      });
    });
  }

  async function removeContainer(id: string) {
    return await new Promise((resolve, reject) => {
      docker.getContainer(id).remove((err) => {
        if (err) reject(err);

        const volume = getUserDataPath(`vol/${id}`);
        if (fs.existsSync(volume)) {
          fs.rmdirSync(volume, { recursive: true });
        }

        resolve(true);
      });
    });
  }

  async function pullImage(
    data: DatabaseInstanceStoreItem,
    progressCallback: (event: PullImageProgress) => void,
  ) {
    console.log("pulling", data);
    return await new Promise((resolve, reject) => {
      let imageName = `${data.type}:${data.version}`;
      if (data.type === "mssql") {
        imageName = `mcr.microsoft.com/mssql/server:${data.version}`;
      }

      docker.pull(imageName, {}, (err, stream) => {
        if (err) reject(err);

        if (!stream) {
          reject(new Error("Stream is not available"));
          return;
        }

        docker.modem.followProgress(
          stream,
          (err) => {
            if (err) reject(err);
            resolve(true);
          },
          progressCallback,
        );
      });
    });
  }

  ipcMain.handle("docker-init", async () => {
    try {
      if (dockerIniting) return false;
      if (eventStream) return true;

      dockerIniting = true;

      eventStream = await docker.getEvents();

      eventStream.on("data", (data) => {
        try {
          if (app.win) {
            app.win?.webContents.send("docker-event", data.toString());
          }
        } catch (e) {
          console.error(e)
        }
      });

      eventStream.on("end", () => {
        eventStream = undefined;
      });

      dockerIniting = false;

      return true;
    } catch (e) {
      console.error(e);
      dockerIniting = false;
      return false;
    }
  });

  ipcMain.handle("docker-open-vol", (_, id: string) => {
    shell.openPath(getUserDataPath(`vol/${id}`));
  });

  ipcMain.handle(
    "docker-create",
    async (_, data: DatabaseInstanceStoreItem) => {
      if (data.type === "mysql") {
        // Get the volume path
        const volume = getUserDataPath(`/vol/${data.id}`);

        await docker.createContainer({
          name: data.id,
          Image: `mysql:${data.version}`,
          Env: [
            data.config.username !== "root"
              ? `MYSQL_USER=${data.config.username}`
              : "",
            `MYSQL_PASSWORD=${data.config.username}`,
            `MYSQL_ROOT_PASSWORD=${data.config.password}`,
          ].filter(Boolean),
          ExposedPorts: { "3306/tcp": {} },
          HostConfig: {
            PortBindings: { "3306/tcp": [{ HostPort: `${data.config.port}` }] },
            Binds: [`${volume}:/var/lib/mysql`],
          },
        });
      } else if (data.type === "mssql") {
        await docker.createContainer({
          name: data.id,
          Image: `mcr.microsoft.com/mssql/server:${data.version}`,
          Env: [`ACCEPT_EULA=Y`, `MSSQL_SA_PASSWORD=${data.config.password}`],
          ExposedPorts: { "1433/tcp": {} },
          HostConfig: {
            PortBindings: { "1433/tcp": [{ HostPort: `${data.config.port}` }] },
          },
        });
      } else if (data.type === "postgres") {
        const volume = getUserDataPath(`vol/${data.id}`);

        await docker.createContainer({
          name: data.id,
          Image: `postgres:${data.version}`,
          Env: [
            `POSTGRES_PASSWORD=${data.config.password}`,
            `POSTGRES_USER=${data.config.username}`,
          ],
          ExposedPorts: { "5432/tcp": {} },
          HostConfig: {
            PortBindings: { "5432/tcp": [{ HostPort: `${data.config.port}` }] },
            Binds: [`${volume}:/var/lib/postgresql/data`],
          },
        });
      }
    },
  );

  ipcMain.handle("docker-list", async () => {
    return await new Promise((resolve, reject) => {
      docker.listContainers(
        {
          all: true,
        },
        (err, containers) => {
          if (err) reject(err);
          resolve(containers ?? []);
        },
      );
    });
  });

  ipcMain.handle("docker-stop", async (_, containerId: string) => {
    return await new Promise((resolve, reject) => {
      docker.getContainer(containerId).stop((err) => {
        if (err) reject(err);
        resolve(true);
      });
    });
  });

  ipcMain.handle("docker-inspect", async (_, containerId: string) => {
    return await getContainer(containerId);
  });

  ipcMain.handle("docker-start", async (_, containerId: string) => {
    return await startContainer(containerId);
  });

  ipcMain.handle("docker-remove", async (_, containerId: string) => {
    return await removeContainer(containerId);
  });

  ipcMain.handle(
    "docker-pull",
    async (sender, data: DatabaseInstanceStoreItem) => {
      return await pullImage(data, (event) => {
        sender.sender.send("docker-pull-progress", {
          containerId: data.id,
          progress: event,
        });
      });
    },
  );
}
