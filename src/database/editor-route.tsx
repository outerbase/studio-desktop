import { Toolbar, ToolbarBackButton, ToolbarTitle } from "@/components/toolbar";
import ConnectionEditor from "./editor";
import { useLocation, useParams } from "react-router-dom";
import {
  ConnectionStoreItem,
  ConnectionStoreManager,
  connectionTypeTemplates,
} from "@/lib/conn-manager-store";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import useGoback from "@/hooks/useGoback";
import { LucideLoader } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function ConnectionCreateUpdateRoute() {
  const { type, connectionId } = useParams<{
    type: string;
    connectionId?: string;
  }>();
  const { toast } = useToast();

  const [connecting, setConnecting] = useState(false);
  const { state: locationState } = useLocation();
  const goBack = useGoback();
  const template = connectionTypeTemplates[type as string];

  const [value, setValue] = useState<ConnectionStoreItem>(() => {
    if (connectionId) {
      const connectionValue = ConnectionStoreManager.get(connectionId);
      if (connectionValue) return connectionValue;
    }

    return {
      id: crypto.randomUUID(),
      name: "Unnamed Connection",
      type: type!,
      color: undefined,
      config: structuredClone({ ...template.defaultValue, ...locationState }),
    };
  });

  const onSaveClicked = useCallback(() => {
    const timestamp = Date.now();
    let saveConn: ConnectionStoreItem;
    if (!connectionId) {
      saveConn = {
        ...value,
        createdAt: timestamp,
        lastConnectedAt: 0,
      };
    } else {
      saveConn = {
        ...value,
        updatedAt: timestamp,
        lastConnectedAt: timestamp,
      };
    }
    ConnectionStoreManager.save(saveConn);
    goBack();
  }, [value, connectionId, goBack]);

  const onConnectClicked = useCallback(() => {
    const duration = 2000;
    setConnecting(true);
    window.outerbaseIpc
      .testConnection(value)
      .then(() => {
        setConnecting(false);
        toast({
          title: "Success",
          description: "Successfully connected to database",
          duration,
        });
      })
      .catch(() => {
        setConnecting(false);
        toast({
          title: "Failed to connect to database",
          description: "Please check your connection settings",
          duration,
        });
      });
  }, [value, toast]);

  return (
    <div>
      <Toolbar>
        <ToolbarBackButton />
        <ToolbarTitle text={template.label} />
      </Toolbar>
      <div className="p-8">
        <ConnectionEditor
          template={template.template}
          onChange={setValue}
          value={value}
        />
      </div>
      <div className="flex gap-2 border-t px-8 py-4">
        <Button variant="secondary" onClick={onSaveClicked}>
          Save
        </Button>
        <Button
          onClick={onConnectClicked}
          className="gap-0"
          variant="secondary"
        >
          {connecting && (
            <LucideLoader
              className="mr-2 inline-block h-4 w-4 animate-spin"
              size={16}
            />
          )}
          Test Connection
        </Button>
      </div>
    </div>
  );
}
