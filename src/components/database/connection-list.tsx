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
  setConnectionList: DispatchState<ConnectionStoreItem[]>;
}

export default function ConnectionList({ data, setConnectionList }: Props) {
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
    <div className="flex-1 overflow-y-auto overflow-x-hidden">
      {deletingConnectionId && (
        <DeletingConnectionModal
          data={deletingConnectionId}
          onClose={() => {
            setDeletingConnectionId(null);
          }}
          onSuccess={onDeletConnection}
        />
      )}
      <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {data.map((item) => (
          <ConnectionItem
            key={item.id}
            item={item}
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
