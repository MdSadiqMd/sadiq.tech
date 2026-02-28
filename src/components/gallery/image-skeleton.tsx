export function ImageSkeleton() {
  return (
    <div className="w-full h-full bg-zinc-800/50 animate-pulse rounded-lg">
      <div className="w-full h-full flex items-center justify-center">
        <div className="space-y-3">
          <div className="h-12 w-12 bg-zinc-700/50 rounded-full mx-auto" />
          <div className="h-3 w-24 bg-zinc-700/50 rounded" />
        </div>
      </div>
    </div>
  );
}
