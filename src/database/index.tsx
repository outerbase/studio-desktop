import { Toolbar, ToolbarDropdown } from "@/components/toolbar";
import {
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { DragEndEvent } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { MySQLIcon } from "@/lib/outerbase-icon";
import { LucidePlus } from "lucide-react";
import { AnimatedRouter } from "@/components/animated-router";
import { ConnectionCreateUpdateRoute } from "./editor-route";
import { useNavigate } from "react-router-dom";
import {
  ConnectionStoreItem,
  ConnectionStoreManager,
  connectionTypeTemplates,
} from "@/lib/conn-manager-store";
import { useEffect, useMemo, useState } from "react";

import ImportConnectionStringRoute from "./import-connection-string";
import Folder from "@/components/folder";
import { PanelGroup } from "@/components/resizeable-panel";
import ConnectionList from "@/components/database/connection-list";
import useNavigateToRoute from "@/hooks/useNavigateToRoute";

const connectionTypeList = [
  "mysql",
  "postgres",
  "sqlite",
  "turso",
  "cloudflare",
  "starbase",
];

function ConnectionListRoute() {
  const [search, setSearch] = useState("");
  useNavigateToRoute();

  const [selectedFolder, setSelectedFolder] = useState("recent");

  const [connectionList, setConnectionList] = useState<ConnectionStoreItem[]>(
    [],
  );

  const navigate = useNavigate();

  useEffect(() => {
    const list = ConnectionStoreManager.list();
    setConnectionList(list);
  }, []);

  function onChangeFolder(folder: string) {
    setSelectedFolder(folder);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (active?.id !== over?.id) {
      setConnectionList((items) => {
        const oldIndex = items.findIndex((item) => item.id === active?.id);
        const newIndex = items.findIndex((item) => item.id === over?.id);
        const newList = arrayMove(items, oldIndex, newIndex);

        ConnectionStoreManager.saveAll(newList);
        return newList;
      });
    }
  }

  const filterdConnection = useMemo(() => {
    if (search) {
      return connectionList.filter((conn) => {
        return conn.name.toLowerCase().includes(search.toLowerCase());
      });
    }
    if (selectedFolder === "recent") {
      return connectionList.slice(0, 10);
    }
    const newList = connectionList.filter(
      (conn) => conn.type === selectedFolder,
    );
    return newList;
  }, [search, selectedFolder, connectionList]);

  return (
    <div className="flex h-full w-full flex-col">
      <Toolbar>
        <ToolbarDropdown text="Add Connection" icon={LucidePlus}>
          <DropdownMenuItem
            onClick={() => {
              navigate("/connection/import");
            }}
          >
            <LucidePlus className="h-4 w-4" />
            Import Connection String
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {connectionTypeList.map((type) => {
            const config = connectionTypeTemplates[type];
            const IconComponent = config?.icon ?? MySQLIcon;

            return (
              <DropdownMenuItem
                key={type}
                onClick={() => {
                  navigate(`/connection/create/${type}`);
                }}
              >
                <IconComponent className="h-4 w-4" />
                {connectionTypeTemplates[type]?.label ?? type}
              </DropdownMenuItem>
            );
          })}
        </ToolbarDropdown>
      </Toolbar>

      <PanelGroup direction="horizontal">
        <PanelGroup.Panel maxSize={250} minSize={100} className="pr-3">
          <Folder
            search={search}
            setSearch={setSearch}
            selected={selectedFolder}
            onChangeFolder={onChangeFolder}
          />
        </PanelGroup.Panel>
        <PanelGroup.Panel grow className="overflow-y-auto">
          {
            // render connection list
          }
          <ConnectionList
            setConnectionList={setConnectionList}
            onDragEnd={handleDragEnd}
            data={filterdConnection}
          />
        </PanelGroup.Panel>
      </PanelGroup>
    </div>
  );
}

const ROUTE_LIST = [
  { path: "/connection", Component: ConnectionListRoute },
  { path: "/connection/import", Component: ImportConnectionStringRoute },
  { path: "/connection/create/:type", Component: ConnectionCreateUpdateRoute },
  {
    path: "/connection/edit/:type/:connectionId",
    Component: ConnectionCreateUpdateRoute,
  },
];

export default function DatabaseTab() {
  return <AnimatedRouter initialRoutes={["/connection"]} routes={ROUTE_LIST} />;
}
