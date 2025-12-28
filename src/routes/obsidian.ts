import { createFileRoute } from "@tanstack/react-router";

const OBSIDIAN_PORTAL_URL = "https://obsidian-portal.pages.dev";

// Script to intercept navigation and fix URLs
const NAVIGATION_FIX_SCRIPT = `
<script>
(function() {
  const BASE_PATH = '/obsidian';
  
  // Override history.pushState
  const originalPushState = history.pushState;
  history.pushState = function(state, title, url) {
    if (url && typeof url === 'string') {
      if (url.startsWith('/') && !url.startsWith(BASE_PATH)) {
        url = BASE_PATH + url;
      } else if (!url.startsWith('/') && !url.startsWith('http') && !url.startsWith('#')) {
        // Relative URL - let browser handle it, but ensure we're in the right base
        const currentPath = window.location.pathname;
        if (!currentPath.startsWith(BASE_PATH)) {
          url = BASE_PATH + '/' + url;
        }
      }
    }
    return originalPushState.call(this, state, title, url);
  };

  // Override history.replaceState
  const originalReplaceState = history.replaceState;
  history.replaceState = function(state, title, url) {
    if (url && typeof url === 'string') {
      if (url.startsWith('/') && !url.startsWith(BASE_PATH)) {
        url = BASE_PATH + url;
      }
    }
    return originalReplaceState.call(this, state, title, url);
  };

  // Intercept clicks on links
  document.addEventListener('click', function(e) {
    const link = e.target.closest('a[href]');
    if (!link) return;
    
    const href = link.getAttribute('href');
    if (!href) return;
    
    // Skip external links, anchors, and already-correct paths
    if (href.startsWith('http') || href.startsWith('#') || href.startsWith(BASE_PATH)) return;
    
    // Fix absolute paths that don't have /obsidian
    if (href.startsWith('/')) {
      e.preventDefault();
      e.stopPropagation();
      window.location.href = BASE_PATH + href;
      return;
    }
  }, true);
})();
</script>
`;

async function handler({ request }: { request: Request }) {
  const url = new URL(request.url);
  const targetUrl = `${OBSIDIAN_PORTAL_URL}${url.search}`;

  const response = await fetch(targetUrl);
  const html = await response.text();

  // Inject the navigation fix script into head
  const rewrittenHtml = html
    .replace('</head>', NAVIGATION_FIX_SCRIPT + '</head>')
    // Still rewrite static assets
    .replace(/src="\/(?!obsidian)/g, 'src="/obsidian/')
    .replace(/src='\/(?!obsidian)/g, "src='/obsidian/")
    .replace(/href="\/(?!obsidian)([^"]*\.(css|js|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot))/g, 'href="/obsidian/$1')
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
