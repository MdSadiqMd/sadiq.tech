import { createAPIFileRoute } from "@tanstack/react-start/api";

const OBSIDIAN_PORTAL_URL = "https://obsidian-portal.pages.dev";

export const APIRoute = createAPIFileRoute("/obsidian/$")({
  GET: async ({ request, params }) => {
    const url = new URL(request.url);
    // The splat param contains the path after /obsidian/
    const path = params._ || "";
    const targetUrl = `${OBSIDIAN_PORTAL_URL}/${path}${url.search}`;

    try {
      const response = await fetch(targetUrl);
      const contentType = response.headers.get("content-type") || "";

      // For HTML content, rewrite URLs to use the portal's absolute URLs
      if (contentType.includes("text/html")) {
        const html = await response.text();
        const rewrittenHtml = html
          .replace(/href="\//g, `href="${OBSIDIAN_PORTAL_URL}/`)
          .replace(/src="\//g, `src="${OBSIDIAN_PORTAL_URL}/`)
          .replace(/url\(\//g, `url(${OBSIDIAN_PORTAL_URL}/`);

        return new Response(rewrittenHtml, {
          status: response.status,
          headers: {
            "content-type": "text/html; charset=utf-8",
            "cache-control": "public, max-age=3600",
          },
        });
      }

      // For other content types (CSS, JS, images, etc.), pass through
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
  },
});
