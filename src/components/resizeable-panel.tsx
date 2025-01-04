import React, {
  PropsWithChildren,
  ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { cn } from "@/lib/utils";
import useWindowDimension from "@/hooks/useWindowDimension";

interface PanelGroupProps {
  direction: "horizontal" | "vertical";
  children: ReactNode;
}

const PanelGroup = ({
  direction,
  children,
}: PropsWithChildren<PanelGroupProps>) => {
  const [panelSizes, setPanelSizes] = useState<number[]>([]);
  const { width } = useWindowDimension();

  const handleResize = (index: number, delta: number) => {
    setPanelSizes((prevSizes) => {
      const newSizes = [...prevSizes];
      newSizes[index] = Math.max(newSizes[index] + delta, 100);
      if (index + 1 < newSizes.length) {
        newSizes[index + 1] = Math.max(newSizes[index + 1] - delta, 100);
      }
      return newSizes;
    });
  };

  const panels = useMemo(
    () => React.Children.toArray(children) as React.ReactElement[],
    [children],
  );

  useEffect(() => {
    setPanelSizes(panels.map(() => width / panels.length));
  }, [width]);

  return (
    <div
      className={cn("flex h-full w-full", {
        "flex-row": direction === "horizontal",
        "flex-col": direction === "vertical",
      })}
    >
      {panels.map((panel, index) => (
        <React.Fragment key={index}>
          {React.cloneElement(panel, {
            size: panelSizes[index], // Pass the size as a prop to Panel
          })}
          {index < panels.length - 1 && (
            <PanelResizeHandle
              onResize={(delta) => handleResize(index, delta)}
              direction={direction}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

interface PanelProps {
  id?: string;
  minSize?: number;
  maxSize?: number;
  size?: number;
  grow?: boolean;
  children: ReactNode;
  className?: string;
}

const Panel = ({
  id,
  minSize = 100,
  maxSize,
  size,
  grow = false,
  children,
  className,
}: PropsWithChildren<PanelProps>) => {
  return (
    <div
      id={id}
      className={cn(
        "flex-shrink-0",
        {
          "flex-grow": grow,
        },
        className,
      )}
      style={{
        flexBasis: size ? `${size}px` : "auto",
        minWidth: minSize,
        maxWidth: maxSize,
      }}
    >
      {children}
    </div>
  );
};

interface PanelResizeHandleProps {
  onResize: (delta: number) => void;
  direction: "horizontal" | "vertical";
}

const PanelResizeHandle = ({
  onResize,
  direction = "horizontal",
}: PropsWithChildren<PanelResizeHandleProps>) => {
  const isResizing = useRef(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    isResizing.current = true;
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing.current) return;

    const delta = direction === "horizontal" ? e.movementX : e.movementY;
    onResize(delta);
  };

  const handleMouseUp = () => {
    isResizing.current = false;
  };

  useEffect(() => {
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  return (
    <div
      className={cn("bg-gray-400 hover:bg-gray-600", {
        "cursor-col-resize": direction === "horizontal",
        "cursor-row-resize": direction === "vertical",
      })}
      style={{
        width: direction === "horizontal" ? "1px" : "100%",
        height: direction === "vertical" ? "1px" : "100%",
        flexShrink: 0,
      }}
      onMouseDown={handleMouseDown}
    />
  );
};

PanelGroup.Panel = Panel;

export { PanelGroup };
