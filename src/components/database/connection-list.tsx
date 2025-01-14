import { useState } from "react";
import {
  ConnectionStoreItem,
  ConnectionStoreManager,
} from "@/lib/conn-manager-store";
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
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { AnimatePresence } from "framer-motion";
import ConnectionItem from "./connection-item";
import DeletingConnectionModal from "./delect-connection-modal";
import { DispatchState } from "./type";

interface Props {
  data: ConnectionStoreItem[];
  onDragEnd?: (event: DragEndEvent) => void;
  setConnectionList: DispatchState<ConnectionStoreItem[]>;
}

const restrictToVerticalAxis: Modifier = ({ transform }) => {
  return {
    ...transform,
    x: 0,
  };
};

export default function ConnectionList({
  data,
  onDragEnd,
  setConnectionList,
}: Props) {
  const [selectedConnection, setSelectedConnection] = useState("");
  const [deletingConnectionId, setDeletingConnectionId] =
    useState<ConnectionStoreItem | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
  function onDeletConnection() {
    if (deletingConnectionId) {
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
      <AnimatePresence initial={false}>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={onDragEnd}
          modifiers={[restrictToVerticalAxis]}
        >
          <SortableContext items={data} strategy={verticalListSortingStrategy}>
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
          </SortableContext>
        </DndContext>
      </AnimatePresence>
    </div>
  );
}
