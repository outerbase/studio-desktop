import { Button } from "@/components/ui/button";
import { MySQLIcon, PostgreIcon } from "@/lib/outerbase-icon";
import {
  LucideLoader,
  LucideMoreHorizontal,
  LucidePlay,
  LucidePlus,
  LucideSquare,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { MemoryRouter, Route, Routes, useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MySQLInstance } from "./mysql-instance";
import { useCallback, useEffect, useState } from "react";
import {
  DatabaseInstanceStoreItem,
  DatabaseManagerStore,
} from "@/lib/db-manager-store";
import { cn } from "@/lib/utils";
import { type ContainerInfo } from "dockerode";
import { useImmer } from "use-immer";

import { PostgresInstance } from "./postgres-instance";
import { Toolbar, ToolbarButton, ToolbarDropdown } from "@/components/toolbar";
import { type PullImageProgress } from "electron/ipc/docker";
import { parseSafeJson } from "@/lib/json-help";
import { SqlServerInstance } from "./mssql-instance";

function convertByteToMBString(byte: number) {
  return `${(byte / 1024 / 1024).toFixed(2)}mb`;
}

function InstanceListRoute() {
  const [dockerRunning, setDockerRunning] = useState(true);
  const [dbInstanceList, setDbInstanceList] = useState(() =>
    DatabaseManagerStore.list(),
  );

  const [startingIds, setStartingIds] = useState<string[]>([]);
  const [stoppingIds, setStoppingIds] = useState<string[]>([]);

  const [errorList, setErrorList] = useImmer<Record<string, string>>({});
  const [progressList, setProgressList] = useImmer<
    Record<string, Record<string, PullImageProgress>>
  >({});

  const [containers, setContainers] = useState<ContainerInfo[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if we want docker running
    window.outerbaseIpc.docker
      .init()
      .then(setDockerRunning)
      .catch(console.error);
  }, []);

  useEffect(() => {
    return window.outerbaseIpc.on("docker-event", (_, rawEvent: string) => {
      const dockerEvent: { Type?: string } = parseSafeJson(rawEvent, {});

      if (dockerEvent?.Type === "container") {
        console.info(
          "Getting the docker container list because there is container event changed",
        );
        window.outerbaseIpc.docker.list().then(setContainers);
      }
    });
  }, []);

  useEffect(() => {
    window.outerbaseIpc.docker.list().then(setContainers);
  }, [setContainers]);

  const onStartClicked = useCallback(
    async (container: DatabaseInstanceStoreItem) => {
      setStartingIds((ids) => [...ids, container.id]);

      try {
        // Check if the container is created
        const inspectedContainer = await window.outerbaseIpc.docker.inspect(
          container.id,
        );
        if (inspectedContainer) {
          // Start the container
          await window.outerbaseIpc.docker.start(container.id);

          setErrorList((draft) => {
            delete draft[container.id];
          });
        } else {
          // Create the container
          await window.outerbaseIpc.docker.pull(container);
          await window.outerbaseIpc.docker.create(container);
          await window.outerbaseIpc.docker.start(container.id);

          setProgressList((draft) => {
            delete draft[container.id];
          });

          setErrorList((draft) => {
            delete draft[container.id];
          });
        }
      } catch (e) {
        // If it fails to start, let try to get the error status
        const failedContainer = await window.outerbaseIpc.docker.inspect(
          container.id,
        );

        if (failedContainer) {
          setErrorList((draft) => {
            draft[container.id] = failedContainer.State.Error;
          });
        }
      } finally {
        setStartingIds((ids) => ids.filter((id) => id !== container.id));
      }
    },
    [setProgressList, setErrorList],
  );

  const onStopClicked = useCallback(
    async (container: DatabaseInstanceStoreItem) => {
      setStoppingIds((ids) => [...ids, container.id]);

      try {
        await window.outerbaseIpc.docker.stop(container.id);
      } finally {
        setStoppingIds((ids) => ids.filter((id) => id !== container.id));
      }
    },
    [],
  );

  useEffect(() => {
    return window.outerbaseIpc.on(
      "docker-pull-progress",
      (
        _: unknown,
        event: {
          progress: PullImageProgress;
          containerId: string;
        },
      ) => {
        setProgressList((draft) => {
          draft[event.containerId] = draft[event.containerId] || {};
          draft[event.containerId][event.progress.id] = event.progress;
        });
      },
    );
  }, [setProgressList]);

  const onDeleteClicked = useCallback(
    async (container: DatabaseInstanceStoreItem) => {
      DatabaseManagerStore.remove(container.id);
      setDbInstanceList(DatabaseManagerStore.list());

      await window.outerbaseIpc.docker.remove(container.id);
      setContainers(await window.outerbaseIpc.docker.list());
    },
    [],
  );

  return (
    <div className="flex h-full w-full flex-col">
      <div className="p-3">
        <h1 className="text-xl font-bold">Database Instance Management</h1>
        <p className="max-w-[400px] text-sm text-gray-500">
          Effortlessly launch and manage your database container.
        </p>
      </div>

      {!dockerRunning && (
        <div className="mx-3 flex flex-col gap-1 rounded bg-red-200 p-3 text-xs dark:bg-red-400">
          <p>
            We cannot detect any Docker in your system. We use docker to manage
            your database instance.
          </p>
          <div>
            <Button
              size="sm"
              className="h-auto px-2 py-1 text-xs"
              onClick={() => {
                window.outerbaseIpc.docker
                  .init()
                  .then(setDockerRunning)
                  .catch();
              }}
            >
              Try again
            </Button>
          </div>
        </div>
      )}

      <Toolbar>
        <ToolbarDropdown text="Create Instance" icon={LucidePlus}>
          <DropdownMenuItem onClick={() => navigate("/instance/create/mysql")}>
            <MySQLIcon className="h-4 w-4" />
            MySQL
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => navigate("/instance/create/postgres")}
          >
            <PostgreIcon className="h-4 w-4" />
            PostgreSQL
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate("/instance/create/mssql")}>
            <PostgreIcon className="h-4 w-4" />
            Microsoft SQL
          </DropdownMenuItem>
        </ToolbarDropdown>

        <ToolbarButton
          onClick={() => {
            window.outerbaseIpc.docker.list().then(setContainers);
          }}
        >
          Refresh
        </ToolbarButton>
      </Toolbar>

      <div className="flex flex-1 flex-col overflow-hidden overflow-y-auto">
        {dbInstanceList.map((db) => {
          const container = containers.find((c) => c.Names[0] === `/${db.id}`);
          const isRunning = container?.State?.includes("running");

          return (
            <div className="flex gap-4 border-b p-4" key={db.id}>
              <div className="flex">
                <div className="relative h-10 w-10">
                  <MySQLIcon className="h-10 w-10" />
                  <div
                    className={cn(
                      "absolute bottom-0 right-0 h-3 w-3 rounded-full",
                      isRunning ? "bg-blue-500" : "bg-red-500",
                    )}
                  ></div>
                </div>
              </div>

              <div className="flex-1 items-center text-sm">
                <div className="font-bold">{db.name}</div>
                <div className="text-xs">
                  {db.type} • {db.version} • Port: {db.config.port}
                </div>

                {errorList[db.id] && (
                  <div className="my-2 rounded bg-red-100 p-2 text-xs">
                    {errorList[db.id]}
                  </div>
                )}

                {progressList[db.id] && (
                  <div className="mt-2 flex flex-col gap-1">
                    {Object.values(progressList[db.id]).map((progress) => {
                      if (!progress) return null;
                      if (!progress.progressDetail?.total) return null;

                      // Make progressbar
                      return (
                        <div className="relative flex max-w-[300px] gap-1 p-0.5 px-1 text-xs">
                          <div
                            className="overflow-hiiden absolute bottom-0 left-0 right-0 top-0 flex rounded bg-gray-100"
                            style={{ zIndex: -1 }}
                          >
                            <div
                              className="bg-yellow-300"
                              style={{
                                width: `${
                                  ((progress.progressDetail.current ?? 1) /
                                    (progress.progressDetail.total || 1)) *
                                  100
                                }%`,
                              }}
                            ></div>
                          </div>

                          <div className="flex flex-1" style={{ fontSize: 10 }}>
                            <div className="flex-1">{progress.status}</div>
                            <div className="font-semibold">
                              {convertByteToMBString(
                                progress.progressDetail.current,
                              ) +
                                "/" +
                                convertByteToMBString(
                                  progress.progressDetail.total,
                                )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex">
                {!isRunning && (
                  <Button
                    variant={"outline"}
                    onClick={() => {
                      onStartClicked(db).then().catch();
                    }}
                  >
                    {startingIds.includes(db.id) ? (
                      <LucideLoader className="h-3 w-3 animate-spin" />
                    ) : (
                      <LucidePlay className="h-3 w-3" />
                    )}
                    Start
                  </Button>
                )}
                {isRunning && (
                  <Button
                    variant={"outline"}
                    onClick={() => {
                      onStopClicked(db).then().catch();
                    }}
                  >
                    {stoppingIds.includes(db.id) ? (
                      <LucideLoader className="h-3 w-3 animate-spin" />
                    ) : (
                      <LucideSquare className="h-3 w-3" />
                    )}
                    Stop
                  </Button>
                )}
              </div>
              <div className="flex">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant={"ghost"}>
                      <LucideMoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem
                      onClick={() => {
                        window.outerbaseIpc.connect({
                          id: db.id,
                          name: db.name,
                          type: db.type,
                          config: {
                            host: "localhost",
                            port: db.config.port,
                            username: db.config.username,
                            password: db.config.password,
                          },
                        });
                      }}
                    >
                      Connect
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        window.outerbaseIpc.docker.openVolume(db.id);
                      }}
                    >
                      Open Data Folder
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => onDeleteClicked(db).then().catch()}
                    >
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function InstanceCreateRoute() {
  const navigate = useNavigate();

  return (
    <div>
      Instance Create{" "}
      <Button
        onClick={() => {
          navigate(-1);
        }}
      >
        Back
      </Button>
    </div>
  );
}

function withAnimation(Component: React.FC) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (props: any) => (
    <motion.div
      className="h-full w-full overflow-hidden"
      initial={{ transform: "translateX(100%)" }}
      animate={{ transform: "translateX(0%)" }}
      exit={{ transform: "translateX(-100%)" }}
    >
      <Component {...props} />
    </motion.div>
  );
}

export default function InstanceTab() {
  return (
    <div className="h-full w-full overflow-hidden">
      <MemoryRouter initialEntries={["/instance"]}>
        <AnimatePresence>
          <Routes>
            <Route
              path="/instance"
              Component={withAnimation(InstanceListRoute)}
            />
            <Route
              path="/instance/create/mysql"
              Component={withAnimation(MySQLInstance)}
            />
            <Route
              path="/instance/create/postgres"
              Component={withAnimation(PostgresInstance)}
            />
            <Route
              path="/instance/create/mssql"
              Component={withAnimation(SqlServerInstance)}
            />
            <Route
              path="/instance/create/:type"
              Component={withAnimation(InstanceCreateRoute)}
            />
          </Routes>
        </AnimatePresence>
      </MemoryRouter>
    </div>
  );
}
