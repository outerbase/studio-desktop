import { cn } from "@/lib/utils";
import { PropsWithChildren, useMemo, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { BoardVisual } from "./visual";
import { Database, LucideMoreHorizontal } from "lucide-react";
import useTimeAgo from "@/hooks/useTimeAgo";
import { HighlightText } from "../ui/highlight";

interface DatabaseCardProps {
  className?: string;
  status?: string;
  statusType?: "error" | "info" | "success";
  title?: string;
  subtitle?: string;
  color?: string;
  onDoubleClick?: () => void;
  highlight?: string;
  lastConnectedAt?: number;
  visual?: React.FC<React.SVGProps<SVGSVGElement>>;
  icon?: React.FC<React.SVGProps<SVGSVGElement>>;
}

export default function ResourceCard({
  className,
  color,
  status,
  title,
  subtitle,
  highlight,
  lastConnectedAt,
  onDoubleClick,
  icon: IconComponent = Database,
  visual: VisualComponent = BoardVisual,
  children,
}: PropsWithChildren<DatabaseCardProps>) {
  const { timeAgo } = useTimeAgo();
  const [open, setOpen] = useState(false);
  const timeago = useMemo(() => {
    if (lastConnectedAt) {
      return timeAgo(lastConnectedAt);
    }
  }, [timeAgo, lastConnectedAt]);

  return (
    <div
      onDoubleClick={onDoubleClick}
      className={cn(
        "group relative flex h-36 w-[302px] flex-col justify-between overflow-hidden rounded-md border border-neutral-200 bg-white p-3.5 hover:border-neutral-300 focus:outline-none focus:*:opacity-100 focus-visible:ring focus-visible:ring-blue-600 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-700/75",
        className,
      )}
    >
      {/* content */}
      <header className="z-10 flex items-center gap-3">
        <div
          className={cn(
            "bg-linear-to-br relative flex size-10 shrink-0 items-center justify-center rounded after:absolute after:size-full after:rounded after:border after:border-black/5 dark:after:border-white/10",
            {
              "from-neutral-200 to-neutral-50 dark:from-neutral-700 dark:to-neutral-700/0":
                color === "default",

              "from-amber-500/20 to-orange-500/5 text-orange-500 dark:from-amber-800/50 dark:to-orange-800/10 dark:text-orange-300":
                color === "orange" || color === "yellow",

              "from-red-500/20 to-red-500/5 text-red-500 dark:from-red-800/50 dark:to-red-800/10 dark:text-red-300":
                color === "red",

              "from-green-500/20 to-teal-500/5 text-teal-500 dark:from-green-800/50 dark:to-teal-800/10 dark:text-emerald-300":
                color === "green",

              "from-blue-500/20 to-indigo-500/5 text-blue-500 dark:from-blue-800/50 dark:to-indigo-800/10 dark:text-blue-300":
                color === "blue",

              "from-fuchsia-500/30 via-teal-500/30 to-yellow-500/30 *:mix-blend-overlay dark:from-fuchsia-800/50 dark:via-teal-800/50 dark:to-yellow-800/50":
                color === "rainbow",
            },
          )}
        >
          {IconComponent && <IconComponent className="h-6 w-6" />}
        </div>
        <div className="flex-1 overflow-x-hidden">
          <p className="line-clamp-1 w-full text-sm font-semibold tracking-tight">
            <HighlightText text={title ?? ""} highlight={highlight} />
          </p>
          {subtitle && (
            <p className="text-xs font-medium text-neutral-400">{subtitle}</p>
          )}
        </div>
      </header>

      {/* status */}
      <div
        className={cn(
          "z-10 flex items-center gap-1.5 text-xs text-neutral-500",
          {
            "text-teal-700 dark:text-teal-600": status === "success",
            "text-orange-700 dark:text-orange-600": status === "error",
          },
        )}
      >
        <p>{status}</p>
      </div>

      {VisualComponent && <VisualComponent />}

      <div
        className={cn(
          "absolute bottom-0 right-0 z-[2] h-full w-1/2 bg-gradient-to-br mix-blend-hue",
          {
            "from-white to-white": color === "default",
            "from-yellow-500 to-red-500":
              color === "orange" || color === "yellow" || color === "red",
            "from-emerald-500 to-teal-500": color === "green",
            "from-sky-500 to-indigo-500": color === "blue",
            "from-fuchsia-500 via-sky-500 to-yellow-500": color === "rainbow",
          },
        )}
      />
      <div className="h-4 text-xs text-neutral-600">
        {timeago ? `Last connected ${timeago}` : " "}
      </div>
      {children && (
        <DropdownMenu modal={false} onOpenChange={setOpen}>
          <DropdownMenuTrigger asChild>
            <button
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
              }}
              className={cn(
                "absolute right-2 top-2 z-10 flex size-8 cursor-pointer items-center justify-center rounded border border-neutral-200 bg-white opacity-0 duration-100 hover:bg-neutral-50 focus:opacity-100 focus:outline-none focus-visible:ring focus-visible:ring-blue-600 group-hover:opacity-100 dark:border-neutral-700 dark:bg-neutral-900 dark:hover:bg-neutral-800",
                { "opacity-100": open },
              )}
            >
              <LucideMoreHorizontal className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            {children}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
