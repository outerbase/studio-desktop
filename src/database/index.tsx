import { Toolbar, ToolbarDropdown } from "@/components/toolbar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  Modifier,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { MySQLIcon } from "@/lib/outerbase-icon";
import {
  LucideCopy,
  LucideMoreHorizontal,
  LucidePencil,
  LucidePlus,
  LucideTrash,
} from "lucide-react";
import { AnimatedRouter } from "@/components/animated-router";
import { ConnectionCreateUpdateRoute } from "./editor-route";
import { useNavigate } from "react-router-dom";
import { CSS } from "@dnd-kit/utilities";
import {
  ConnectionStoreItem,
  ConnectionStoreManager,
  connectionTypeTemplates,
} from "@/lib/conn-manager-store";
import { Dispatch, SetStateAction, useState } from "react";
import { generateConnectionString } from "@/lib/connection-string";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AnimatePresence, motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import ImportConnectionStringRoute from "./import-connection-string";
import useNavigateToRoute from "@/hooks/useNavigateToRoute";

const connectionTypeList = [
  "mysql",
  "postgres",
  "sqlite",
  "turso",
  "cloudflare",
  "starbase",
];

const restrictToVerticalAxis: Modifier = ({ transform }) => {
  return {
    ...transform,
    x: 0,
  };
};

function DeletingModal({
  data,
  onClose,
  onSuccess,
}: {
  data: ConnectionStoreItem;
  onClose: () => void;
  onSuccess: () => void;
}) {
  return (
    <AlertDialog
      open
      onOpenChange={(openState) => {
        if (openState === false) {
          onClose();
        }
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Connection</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete the connection{" "}
            <span className="font-semibold">{data.name}</span>?
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onSuccess}>Continue</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function ConnectionItem({
  item,
  selectedConnection,
  setSelectedConnection,
  setConnectionList,
  setDeletingConnectionId,
}: {
  item: ConnectionStoreItem;
  selectedConnection?: string;
  setSelectedConnection: Dispatch<SetStateAction<string>>;
  setConnectionList: Dispatch<SetStateAction<ConnectionStoreItem[]>>;
  setDeletingConnectionId: Dispatch<SetStateAction<ConnectionStoreItem | null>>;
}) {
  const [isMenuOpen, setMenuOpen] = useState(false);
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: item.id });

  const { toast } = useToast();
  const navigate = useNavigate();
  const typeConfig = connectionTypeTemplates[item.type];
  const IconComponent = typeConfig?.icon ?? MySQLIcon;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...(!isMenuOpen && listeners)}
      onMouseDown={() => {
        setSelectedConnection(item.id);
      }}
      onDoubleClick={() => {
        window.outerbaseIpc.connect(item);
      }}
    >
      <motion.div
        initial={{ transform: "translateX(100%)" }}
        animate={{ transform: "translateX(0)" }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        exit={{ transform: "translateX(100%)" }}
        key={item.id}
        className={cn(
          "flex cursor-pointer items-center gap-4 border-b p-4 hover:bg-gray-100 dark:hover:bg-neutral-800",
          selectedConnection === item.id
            ? "bg-gray-100 dark:bg-neutral-900"
            : "bg-background",
        )}
      >
        <IconComponent className="h-8 w-8" />
        <div className="flex flex-1 flex-col gap-1 text-sm">
          <div className="font-semibold">{item.name}</div>
          <div className="font-mono text-gray-500">
            {generateConnectionString(item)}
          </div>
        </div>
        <div>
          <DropdownMenu
            modal={false}
            open={isMenuOpen}
            onOpenChange={setMenuOpen}
          >
            <DropdownMenuTrigger asChild>
              <Button variant={"ghost"} size={"icon"}>
                <LucideMoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                inset
                onClick={() => {
                  window.outerbaseIpc.connect(item);
                }}
              >
                Connect
              </DropdownMenuItem>

              <DropdownMenuItem
                inset
                onClick={() => {
                  window.outerbaseIpc.connect(item, true);
                }}
              >
                Connect with debugger
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
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </motion.div>
    </div>
  );
}

function ConnectionListRoute() {
  useNavigateToRoute();

  const [connectionList, setConnectionList] = useState(() => {
    return ConnectionStoreManager.list();
  });

  const [selectedConnection, setSelectedConnection] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const [deletingConnectionId, setDeletingConnectionId] =
    useState<ConnectionStoreItem | null>(null);

  const navigate = useNavigate();

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

      {deletingConnectionId && (
        <DeletingModal
          data={deletingConnectionId}
          onClose={() => {
            setDeletingConnectionId(null);
          }}
          onSuccess={() => {
            setConnectionList(
              ConnectionStoreManager.remove(deletingConnectionId.id),
            );
            setDeletingConnectionId(null);
          }}
        />
      )}

      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <AnimatePresence initial={false}>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
            modifiers={[restrictToVerticalAxis]}
          >
            <SortableContext
              items={connectionList}
              strategy={verticalListSortingStrategy}
            >
              {connectionList.map((item) => (
                <ConnectionItem
                  key={item.id}
                  item={item}
                  selectedConnection={selectedConnection}
                  setSelectedConnection={setSelectedConnection}
                  setConnectionList={setConnectionList}
                  setDeletingConnectionId={setDeletingConnectionId}
                />
              ))}
            </SortableContext>
          </DndContext>
        </AnimatePresence>
      </div>
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
