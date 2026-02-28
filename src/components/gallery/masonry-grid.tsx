import { useRef, useMemo, useState, useEffect } from "react";

interface MasonryGridProps {
  images: Array<{
    id: string;
    url: string;
    fileName: string;
    aspectRatio?: number;
    width?: number;
    height?: number;
  }>;
  columns?: number;
  gap?: number;
  onImageClick?: (image: any) => void;
  onImageHover?: (imageId: string | null) => void;
  hoveredImageId?: string | null;
  onDelete?: (imageId: string) => void;
  children?: (item: any, index: number) => React.ReactNode;
}

export function MasonryGrid({
  images = [],
  columns = 3,
  gap = 12,
  onImageClick,
  onImageHover,
  hoveredImageId,
  onDelete,
  children,
}: MasonryGridProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const safeImages = Array.isArray(images) ? images : [];

  useEffect(() => {
    if (!parentRef.current) return;
    const updateWidth = () => {
      if (parentRef.current) {
        setContainerWidth(parentRef.current.offsetWidth);
      }
    };

    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  const columnWidth = useMemo(() => {
    if (containerWidth === 0) return 300;
    return (containerWidth - gap * (columns - 1)) / columns;
  }, [containerWidth, columns, gap]);

  const layout = useMemo(() => {
    if (!safeImages || safeImages.length === 0) {
      return { positions: [], totalHeight: 0 };
    }

    const columnHeights = Array(columns).fill(0);
    const positions: Array<{ column: number; top: number; height: number }> =
      [];

    safeImages.forEach((image) => {
      const shortestColumn = columnHeights.indexOf(Math.min(...columnHeights));
      const imageHeight = image.aspectRatio
        ? columnWidth / image.aspectRatio
        : 300;

      positions.push({
        column: shortestColumn,
        top: columnHeights[shortestColumn],
        height: imageHeight,
      });

      columnHeights[shortestColumn] += imageHeight + gap;
    });

    return {
      positions,
      totalHeight: Math.max(...columnHeights, 0),
    };
  }, [safeImages, columns, gap, columnWidth]);

  if (!safeImages || safeImages.length === 0) {
    return null;
  }

  return (
    <div ref={parentRef} className="h-[calc(100vh-180px)] overflow-auto">
      <div
        style={{
          height: `${layout.totalHeight}px`,
          width: "100%",
          position: "relative",
        }}
      >
        {safeImages.map((image, index) => {
          const position = layout.positions[index];
          if (!image || !position) return null;

          const left = position.column * (columnWidth + gap);
          return (
            <div
              key={image.id}
              style={{
                position: "absolute",
                top: `${position.top}px`,
                left: `${left}px`,
                width: `${columnWidth}px`,
                height: `${position.height}px`,
              }}
            >
              {children ? children(image, index) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
