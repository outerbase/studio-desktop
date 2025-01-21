import { useState } from "react";
import {
  ConnectionStoreItem,
  ConnectionStoreManager,
} from "@/lib/conn-manager-store";
import ConnectionItem from "./connection-item";
import DeletingConnectionModal from "./delect-connection-modal";
import { DispatchState } from "./type";

interface Props {
  data: ConnectionStoreItem[];
  searchText?: string;
  setConnectionList: DispatchState<ConnectionStoreItem[]>;
}

export default function ConnectionList({
  data,
  setConnectionList,
  searchText,
}: Props) {
  const [selectedConnection, setSelectedConnection] = useState("");
  const [deletingConnectionId, setDeletingConnectionId] =
    useState<ConnectionStoreItem | null>(null);

  function onDeletConnection() {
    if (deletingConnectionId) {
      window.outerbaseIpc.docs.deleteDocFile(deletingConnectionId.id);
      setConnectionList(ConnectionStoreManager.remove(deletingConnectionId.id));
      setDeletingConnectionId(null);
    }
  }
  return (
    <div className="flex-1 overflow-y-auto overflow-x-hidden bg-gray-100 dark:bg-black">
      {deletingConnectionId && (
        <DeletingConnectionModal
          data={deletingConnectionId}
          onClose={() => {
            setDeletingConnectionId(null);
          }}
          onSuccess={onDeletConnection}
        />
      )}
      <div className="grid flex-1 grid-cols-1 gap-4 p-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:flex xl:flex-wrap">
        {data.map((item) => (
          <ConnectionItem
            key={item.id}
            item={item}
            highlight={searchText}
            setConnectionList={setConnectionList}
            selectedConnection={selectedConnection}
            setSelectedConnection={setSelectedConnection}
            setDeletingConnectionId={setDeletingConnectionId}
          />
        ))}
      </div>
    </div>
  );
}
