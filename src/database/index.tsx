import { AnimatedRouter } from "@/components/animated-router";
import { ConnectionCreateUpdateRoute } from "./editor-route";
import { ConnectionStoreManager } from "@/lib/conn-manager-store";
import { useMemo, useState } from "react";
import ImportConnectionStringRoute from "./import-connection-string";
import useNavigateToRoute from "@/hooks/useNavigateToRoute";
import ConnectionList from "@/components/database/connection-list";
import Header from "./header";

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

  return (
    <div className="flex h-full w-full flex-col">
      <Header
        search={search}
        setSearch={setSearch}
        items={connectionList}
        setConnectionList={setConnectionList}
      />
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
