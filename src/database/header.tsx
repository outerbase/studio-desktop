import { Toolbar } from "@/components/toolbar";
import AddConnectionDropdown from "./add-connection-dropdown";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { SortAscIcon, SortDescIcon } from "lucide-react";
import {
  ConnectionStoreItem,
  ConnectionStoreManager,
  OrderBy,
  SortBy,
} from "@/lib/conn-manager-store";
import { Dispatch, SetStateAction, useCallback, useState } from "react";

interface HeaderProps {
  search: string;
  items: ConnectionStoreItem[];
  setSearch: Dispatch<SetStateAction<string>>;
  setConnectionList: Dispatch<SetStateAction<ConnectionStoreItem[]>>;
}

const SortOptions = [
  {
    title: "Last Connected",
    sortBy: "lastConnectedAt",
    orderBy: "asc",
  },
  {
    title: "Created Date",
    sortBy: "createdAt",
    orderBy: "desc",
  },
];

export default function Header({
  items,
  search,
  setSearch,
  setConnectionList,
}: HeaderProps) {
  const [isOpenSort, setIsOpenSort] = useState(false);

  const [sortPrefs, setSortPrefs] = useState(() => {
    return ConnectionStoreManager.getSortPreferences();
  });

  const handleSortConnection = useCallback(
    (sortBy: SortBy, orderBy: OrderBy) => {
      const sortedConn = ConnectionStoreManager.sort(items, sortBy, orderBy);
      setSortPrefs({
        sortBy,
        orderBy,
      });
      setConnectionList(sortedConn);

      ConnectionStoreManager.saveAll(sortedConn);
      ConnectionStoreManager.setSortPreferences(sortBy, orderBy);
    },
    [items, setConnectionList],
  );

  return (
    <Toolbar>
      <AddConnectionDropdown />
      <div className="flex-1" />
      <DropdownMenu
        modal={false}
        open={isOpenSort}
        onOpenChange={setIsOpenSort}
      >
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            {sortPrefs.orderBy === "desc" ? <SortDescIcon /> : <SortAscIcon />}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {SortOptions.map((sort, index) => {
            return (
              <div key={index}>
                <DropdownMenuItem
                  onClick={() =>
                    handleSortConnection(
                      sort.sortBy as SortBy,
                      sort.orderBy as OrderBy,
                    )
                  }
                >
                  {sort.orderBy === "desc" ? <SortDescIcon /> : <SortAscIcon />}
                  {sort.title}
                </DropdownMenuItem>
                {index === 0 && <DropdownMenuSeparator />}
              </div>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>

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
  );
}
