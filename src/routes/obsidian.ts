import { createFileRoute } from "@tanstack/react-router";

const OBSIDIAN_PORTAL_URL = "https://obsidian-portal.pages.dev";

async function handler({ request }: { request: Request }) {
  const url = new URL(request.url);
  // Redirect to the actual Cloudflare Pages URL
  return Response.redirect(`${OBSIDIAN_PORTAL_URL}${url.search}`, 302);
}

export const Route = createFileRoute("/obsidian")({
  server: {
    handlers: {
      GET: handler,
    },
  },
});
