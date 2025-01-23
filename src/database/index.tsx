import { Toolbar } from "@/components/toolbar";
import { AnimatedRouter } from "@/components/animated-router";
import { ConnectionCreateUpdateRoute } from "./editor-route";
import {
  ConnectionStoreItem,
  ConnectionStoreManager,
} from "@/lib/conn-manager-store";
import { useEffect, useMemo, useState } from "react";
import ImportConnectionStringRoute from "./import-connection-string";
import useNavigateToRoute from "@/hooks/useNavigateToRoute";
import AddConnectionDropdown from "./add-connection-dropdown";
import ConnectionList from "@/components/database/connection-list";

function ConnectionListRoute() {
  useNavigateToRoute();
  const [search, setSearch] = useState("");
  const [connectionList, setConnectionList] = useState(() => {
    return ConnectionStoreManager.list();
  });

  const connections = useMemo(() => {
    if (search) {
      return connectionList.filter((conn) =>
        conn.name.toLowerCase().includes(search.toLowerCase()),
      );
    }
    return connectionList;
  }, [connectionList, search]);

  useEffect(() => {
    const update = (_: unknown, conn: ConnectionStoreItem) => {
      ConnectionStoreManager.save({ ...conn, lastConnectedAt: Date.now() });
    };

    window.outerbaseIpc.on("update-connection", update);
    return () => {
      window.outerbaseIpc.off("update-connection", update);
    };
  }, []);

  return (
    <div className="flex h-full w-full flex-col">
      <Toolbar>
        <AddConnectionDropdown />
        <div className="flex-1"></div>
        <input
          type="text"
          value={search}
          placeholder="Search your connection..."
          className="w-[300px] rounded bg-accent p-2 px-4 text-sm outline-0"
          onChange={(e) => {
            e.preventDefault();
            setSearch(e.currentTarget.value);
          }}
        />
      </Toolbar>
      {!!search && connections.length === 0 ? (
        <div className="flex flex-1 justify-center p-3 text-sm text-neutral-600">
          Search connection not found.
        </div>
      ) : (
        <ConnectionList
          data={connections}
          searchText={search}
          setConnectionList={setConnectionList}
        />
      )}
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
