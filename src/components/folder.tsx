import { FolderIcon } from "lucide-react";
import { Button } from "./ui/button";
import { ConnectionStoreItem } from "@/lib/conn-manager-store";
import { Input } from "./ui/input";
import { cn } from "@/lib/utils";

interface Props {
  search: string;
  selected: string;
  setSearch: (search: string) => void;
  onChangeFolder: (folder: string) => void;
}

interface Folder {
  title: string;
  data: ConnectionStoreItem[];
}

const connectionTypeList = [
  "recent",
  "mysql",
  "postgres",
  "sqlite",
  "turso",
  "cloudflare",
  "starbase",
];

export default function Folder({
  selected,
  search,
  setSearch,
  onChangeFolder,
}: Props) {
  return (
    <div className="flex-1 gap-3">
      <div className="pl-3">
        <div className="mb-3 mt-3">
          <Input
            placeholder="Search..."
            value={search}
            onChange={(e) => {
              e.preventDefault();
              setSearch(e.target.value);
            }}
          />
        </div>
        {connectionTypeList.map((conn, index) => {
          const active = conn === selected;
          return (
            <Button
              key={index}
              variant="ghost"
              onClick={() => onChangeFolder(conn)}
              className={cn(
                "w-full justify-start gap-3 p-2",
                `${active ? "bg-gray-200 dark:bg-neutral-800" : ""}`,
              )}
            >
              <FolderIcon size={14} />
              <span className="text-sm capitalize">{conn}</span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
