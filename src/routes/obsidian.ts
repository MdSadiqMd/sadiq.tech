import { createFileRoute } from "@tanstack/react-router";

const OBSIDIAN_PORTAL_URL = "https://obsidian-portal.pages.dev";

async function handler({ request }: { request: Request }) {
  const url = new URL(request.url);
  const targetUrl = `${OBSIDIAN_PORTAL_URL}${url.search}`;

  const response = await fetch(targetUrl);
  const html = await response.text();

  // Rewrite all absolute paths to include /obsidian prefix
  const rewrittenHtml = html
    // Rewrite href attributes - both / and vault paths
    .replace(/href="\/(?!obsidian)/g, 'href="/obsidian/')
    .replace(/href="(obsidian-vault|self-space|artificial-intelligence)/g, 'href="/obsidian/$1')
    // Rewrite src attributes
    .replace(/src="\/(?!obsidian)/g, 'src="/obsidian/')
    // Rewrite CSS url() functions
    .replace(/url\(\/(?!obsidian)/g, 'url(/obsidian/')
    .replace(/url\("\/(?!obsidian)/g, 'url("/obsidian/')
    .replace(/url\('\/(?!obsidian)/g, "url('/obsidian/");

  return new Response(rewrittenHtml, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "public, max-age=3600",
    },
  });
}

export const Route = createFileRoute("/obsidian")({
  server: {
    handlers: {
      GET: handler,
    },
  },
});
