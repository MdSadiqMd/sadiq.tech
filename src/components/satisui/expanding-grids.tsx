"use client";

import React, {
  useState,
  useMemo,
  CSSProperties,
  createContext,
  useContext,
  useRef,
  useEffect,
  useCallback,
} from "react";
import { clsx } from "clsx";

interface GridContextType {
  hoveredCell: { row: number; col: number } | null;
  setHoveredCell: React.Dispatch<
    React.SetStateAction<{ row: number; col: number } | null>
  >;
  columns: number;
  rows: number;
  cellRefs: React.MutableRefObject<(HTMLDivElement | null)[]>;
}

const GridContext = createContext<GridContextType | undefined>(undefined);

const useGridContext = () => {
  const context = useContext(GridContext);
  if (!context) {
    throw new Error("useGridContext must be used within an ExpandingGrids");
  }
  return context;
};

type ExpandingGridsProps = {
  /** The number of rows in the grid. */
  rows?: number;
  /** The number of columns in the grid. */
  columns?: number;
  /** The gap between grid cells in pixels. */
  gap?: number;
  /** The duration of the expansion animation in milliseconds. */
  duration?: number;
  /** The child elements, which should be `ExpandingGridCell` components. */
  children: React.ReactNode;
  /** Additional CSS classes for the grid container. */
  className?: string;
  /** Additional inline styles for the grid container. */
  style?: CSSProperties;
  /** The ratio by which the hovered row and column should expand. */
  expandRatio?: number;
};

/**
 * A responsive grid that animates the expansion of a row and column when a
 * cell is hovered or focused. It is designed to be used with the
 * `ExpandingGridCell` child component.
 */
export const ExpandingGrids = ({
  rows = 3,
  columns = 3,
  gap = 16,
  duration = 400,
  children,
  className,
  style,
  expandRatio = 2,
}: ExpandingGridsProps) => {
  const [hoveredCell, setHoveredCell] = useState<{
    row: number;
    col: number;
  } | null>(null);
  const cellRefs = useRef<(HTMLDivElement | null)[]>([]);

  const gridContainerStyle: CSSProperties = useMemo(() => {
    const cols = Array(columns).fill("1fr");
    const rowsArr = Array(rows).fill("minmax(200px, auto)"); // Min height but can grow

    if (hoveredCell !== null) {
      cols[hoveredCell.col] = `${expandRatio}fr`;
      rowsArr[hoveredCell.row] = `minmax(200px, ${expandRatio}fr)`;
    }

    return {
      ...style,
      display: "grid",
      gap: `${gap}px`,
      gridTemplateColumns: cols.join(" "),
      gridTemplateRows: rowsArr.join(" "),
      gridAutoRows: "minmax(200px, auto)",
      transition: `grid-template-columns ${duration}ms ease, grid-template-rows ${duration}ms ease`,
      alignItems: "start",
    };
  }, [hoveredCell, columns, rows, gap, duration, style, expandRatio]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (!hoveredCell) {
        if (e.key === "ArrowDown" || e.key === "ArrowRight") {
          setHoveredCell({ row: 0, col: 0 });
        }
        return;
      }

      let { row, col } = hoveredCell;

      switch (e.key) {
        case "ArrowUp":
          row = Math.max(0, row - 1);
          break;
        case "ArrowDown":
          row = Math.min(rows - 1, row + 1);
          break;
        case "ArrowLeft":
          col = Math.max(0, col - 1);
          break;
        case "ArrowRight":
          col = Math.min(columns - 1, col + 1);
          break;
        default:
          return;
      }

      e.preventDefault();
      setHoveredCell({ row, col });
    },
    [hoveredCell, rows, columns],
  );

  // When the hovered cell changes via keyboard, programmatically move focus
  // to the corresponding DOM element for accessibility and a seamless UX.
  useEffect(() => {
    if (hoveredCell) {
      const index = hoveredCell.row * columns + hoveredCell.col;
      cellRefs.current[index]?.focus();
    }
  }, [hoveredCell, columns]);

  const contextValue = useMemo(
    () => ({
      hoveredCell,
      setHoveredCell,
      columns,
      rows,
      cellRefs,
    }),
    [hoveredCell, columns, rows],
  );

  return (
    <GridContext.Provider value={contextValue}>
      <div
        role="grid"
        aria-rowcount={rows}
        aria-colcount={columns}
        style={gridContainerStyle}
        className={className}
        onMouseLeave={() => setHoveredCell(null)}
        onKeyDown={handleKeyDown}
      >
        {React.Children.map(children, (_, index) => {
          if (index % columns === 0) {
            const rowChildren = React.Children.toArray(children).slice(
              index,
              index + columns,
            );
            // WHY: We manually wrap children in a div with role='row' for
            // accessibility. `display: 'contents'` makes the wrapper element
            // "disappear" from the layout, so it doesn't break the CSS grid.
            return (
              <div role="row" style={{ display: "contents" }}>
                {rowChildren}
              </div>
            );
          }
          return null;
        })}
      </div>
    </GridContext.Provider>
  );
};

/**
 * A required child component for `ExpandingGrids`. It handles the mouse and
 * focus events that trigger the grid's expansion animation.
 */
export const ExpandingGridCell = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { aspectRatio?: number }
>(({ className, children, aspectRatio, ...props }, ref) => {
  const { setHoveredCell, columns, cellRefs, hoveredCell } = useGridContext();
  const cellRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const parent = target.parentNode?.parentNode;
    if (parent) {
      const index =
        Array.from(parent.children).indexOf(target.parentNode as HTMLElement) *
          columns +
        Array.from(target.parentNode!.children).indexOf(target);
      const row = Math.floor(index / columns);
      const col = index % columns;
      setHoveredCell({ row, col });
    }
  };

  const handleFocus = () => {
    const parent = cellRef.current?.parentNode?.parentNode;
    if (parent && cellRef.current) {
      const index =
        Array.from(parent.children).indexOf(
          cellRef.current.parentNode as HTMLElement,
        ) *
          columns +
        Array.from(cellRef.current.parentNode!.children).indexOf(
          cellRef.current,
        );
      const row = Math.floor(index / columns);
      const col = index % columns;
      setHoveredCell({ row, col });
    }
  };

  const parent = cellRef.current?.parentNode?.parentNode;
  const index =
    parent && cellRef.current
      ? Array.from(parent.children).indexOf(
          cellRef.current.parentNode as HTMLElement,
        ) *
          columns +
        Array.from(cellRef.current.parentNode!.children).indexOf(
          cellRef.current,
        )
      : -1;
  const isFocused = hoveredCell
    ? hoveredCell.row * columns + hoveredCell.col === index
    : false;

  useEffect(() => {
    if (cellRef.current) {
      const parent = cellRef.current?.parentNode?.parentNode;
      if (parent) {
        const index =
          Array.from(parent.children).indexOf(
            cellRef.current.parentNode as HTMLElement,
          ) *
            columns +
          Array.from(cellRef.current.parentNode!.children).indexOf(
            cellRef.current,
          );
        cellRefs.current[index] = cellRef.current;
      }
    }
  }, [columns, cellRefs]);

  return (
    <div
      ref={(node) => {
        // This function assigns the node to both the forwarded ref and the local ref.
        if (typeof ref === "function") {
          ref(node);
        } else if (ref) {
          ref.current = node;
        }
        cellRef.current = node;
      }}
      role="gridcell"
      tabIndex={isFocused ? 0 : -1}
      className={clsx(
        "grid w-full place-items-center rounded-lg transition-all duration-300",
        className,
      )}
      style={{
        aspectRatio: aspectRatio ? `${aspectRatio}` : "1",
        minHeight: "200px",
      }}
      onMouseEnter={handleMouseEnter}
      onFocus={handleFocus}
      {...props}
    >
      {children}
    </div>
  );
});

ExpandingGridCell.displayName = "ExpandingGridCell";
