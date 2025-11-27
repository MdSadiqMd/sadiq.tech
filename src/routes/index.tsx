import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({ component: App });

function App() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-4">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-zinc-100">
          Page Under Construction
        </h1>
        <p className="text-zinc-400 text-lg">I'm Lazy</p>
      </div>
    </div>
  );
}
