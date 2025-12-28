import { createAPIFileRoute } from "@tanstack/react-start/api";

const OBSIDIAN_PORTAL_URL = "https://obsidian-portal.pages.dev";

export const APIRoute = createAPIFileRoute("/obsidian")({
  GET: async ({ request }) => {
    // Redirect to the obsidian portal root
    const url = new URL(request.url);
    const targetUrl = `${OBSIDIAN_PORTAL_URL}${url.search}`;

    const response = await fetch(targetUrl);
    const html = await response.text();

    // Rewrite asset paths to use absolute URLs
    const rewrittenHtml = html
      .replace(/href="\//g, `href="${OBSIDIAN_PORTAL_URL}/`)
      .replace(/src="\//g, `src="${OBSIDIAN_PORTAL_URL}/`)
      .replace(/url\(\//g, `url(${OBSIDIAN_PORTAL_URL}/`);

    return new Response(rewrittenHtml, {
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "public, max-age=3600",
      },
    });
  },
});

