import { createFileRoute } from "@tanstack/react-router";

const OBSIDIAN_PORTAL_URL = "https://obsidian-portal.pages.dev";

async function handler({ request, params }: { request: Request; params: { _splat: string } }) {
  const url = new URL(request.url);
  const path = params._splat || "";
  // Redirect to the actual Cloudflare Pages URL
  return Response.redirect(`${OBSIDIAN_PORTAL_URL}/${path}${url.search}`, 302);
}

export const Route = createFileRoute("/obsidian/$")({
  server: {
    handlers: {
      GET: handler,
    },
  },
});
