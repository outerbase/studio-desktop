import { useState } from "react";
import {
  ConnectionStoreItem,
  ConnectionStoreManager,
} from "@/lib/conn-manager-store";
import DeletingConnectionModal from "./delect-connection-modal";
import { DispatchState } from "./type";
import ResourceCard from "../resource-card";
import {
  getDatabaseFriendlyName,
  getDatabaseIcon,
  getDatabaseVisual,
} from "../resource-card/utils";
import { DropdownMenuItem, DropdownMenuSeparator } from "../ui/dropdown-menu";
import { LucideCopy, LucidePencil, LucideTrash } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { generateConnectionString } from "@/lib/connection-string";

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
  const [deletingConnectionId, setDeletingConnectionId] =
    useState<ConnectionStoreItem | null>(null);

  const { toast } = useToast();
  const navigate = useNavigate();

  function onConnect(item: ConnectionStoreItem, debuggerMode = false) {
    window.outerbaseIpc
      .connect(item, debuggerMode)
      .then(() => {
        ConnectionStoreManager.save({ ...item, lastConnectedAt: Date.now() });
      })
      .finally(() => {
        setConnectionList(ConnectionStoreManager.list());
      });
  }

  function onDeletConnection() {
    if (deletingConnectionId) {
      window.outerbaseIpc.docs.delete(deletingConnectionId.id);
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
          <ResourceCard
            key={item.id}
            onDoubleClick={() => onConnect(item)}
            title={item.name}
            color={item.color}
            highlight={searchText}
            subtitle={getDatabaseFriendlyName(item.type ?? "")}
            icon={getDatabaseIcon(item.type)}
            visual={getDatabaseVisual(item.type)}
            lastConnectedAt={item.lastConnectedAt}
          >
            <DropdownMenuItem inset onClick={() => onConnect(item)}>
              Connect
            </DropdownMenuItem>

            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                navigate(`/connection/edit/${item.type}/${item.id}`);
              }}
            >
              <LucidePencil className="h-4 w-4" />
              Edit
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => {
                setConnectionList(ConnectionStoreManager.duplicate(item));
              }}
              inset
            >
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={() => {
                window.navigator.clipboard.writeText(
                  generateConnectionString(item, false),
                );
                toast({
                  title: "Connection string copied to clipboard",
                  duration: 1000,
                });
              }}
            >
              <LucideCopy className="h-4 w-4" />
              Copy Connection String
            </DropdownMenuItem>

            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                setDeletingConnectionId(item);
              }}
            >
              <LucideTrash className="h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </ResourceCard>
        ))}
      </div>
    </div>
  );
}
