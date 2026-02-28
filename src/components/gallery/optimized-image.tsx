import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  onError?: () => void;
}

export function OptimizedImage({
  src,
  alt,
  className,
  onError,
}: OptimizedImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.src = src;
    img.onload = () => setLoaded(true);
    img.onerror = () => {
      setError(true);
      onError?.();
    };
  }, [src, onError]);

  if (error) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-zinc-800",
          className,
        )}
      >
        <span className="text-zinc-500 text-sm">Failed to load</span>
      </div>
    );
  }

  return (
    <>
      {!loaded && (
        <div className={cn("animate-pulse bg-zinc-800", className)} />
      )}
      <img
        src={src}
        alt={alt}
        className={cn(
          "transition-opacity duration-300",
          loaded ? "opacity-100" : "opacity-0",
          className,
        )}
        loading="lazy"
        decoding="async"
      />
    </>
  );
}
