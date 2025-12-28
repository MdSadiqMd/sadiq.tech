import { createFileRoute } from "@tanstack/react-router";

const OBSIDIAN_PORTAL_URL = "https://obsidian-portal.pages.dev";

async function handler({ request, params }: { request: Request; params: { _splat: string } }) {
  const url = new URL(request.url);
  const path = params._splat || "";
  const targetUrl = `${OBSIDIAN_PORTAL_URL}/obsidian/${path}${url.search}`;

  try {
    const response = await fetch(targetUrl);
    const contentType = response.headers.get("content-type") || "";

    if (contentType.includes("text/html") || contentType.includes("javascript") || contentType.includes("css")) {
      const text = await response.text();
      return new Response(text, {
        status: response.status,
        headers: {
          "content-type": contentType,
          "cache-control": response.headers.get("cache-control") || "public, max-age=3600",
        },
      });
    }

    // For other content types (images, fonts, etc.), pass through
    const body = await response.arrayBuffer();
    return new Response(body, {
      status: response.status,
      headers: {
        "content-type": contentType,
        "cache-control": response.headers.get("cache-control") || "public, max-age=86400",
      },
    });
  } catch (error) {
    console.error("Error proxying to Obsidian portal:", error);
    return new Response("Error loading Obsidian portal", {
      status: 502,
      headers: { "content-type": "text/plain" },
    });
  }
}

export const Route = createFileRoute("/obsidian/$")({
  server: {
    handlers: {
      GET: handler,
    },
  },
});
