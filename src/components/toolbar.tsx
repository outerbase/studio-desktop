import React, { PropsWithChildren } from "react";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { LucideChevronLeft } from "lucide-react";
import useGoback from "@/hooks/useGoback";

export function Toolbar({ children }: PropsWithChildren) {
  return <div className="flex items-center gap-2 border-b p-2">{children}</div>;
}

interface ToolbarDropdownProps {
  text: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export function ToolbarDropdown({
  text,
  icon: Icon,
  children,
}: PropsWithChildren<ToolbarDropdownProps>) {
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant={"ghost"}>
          {Icon && <Icon className="mr-1 h-4 w-4" />}
          {text}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="bottom" align="start">
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function ToolbarBackButton() {
  const goBack = useGoback();

  return (
    <Button variant="ghost" onClick={goBack}>
      <LucideChevronLeft className="h-4 w-4" />
    </Button>
  );
}

interface ToolbarTitleProps {
  text: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export function ToolbarTitle({ text, icon: Icon }: ToolbarTitleProps) {
  return (
    <div className="flex items-center font-bold">
      {Icon && <Icon className="mr-2 h-6 w-6" />}
      {text}
    </div>
  );
}

export function ToolbarButton({
  children,
  onClick,
}: PropsWithChildren<{ onClick?: () => void }>) {
  return (
    <Button variant="ghost" onClick={onClick}>
      {children}
    </Button>
  );
}
