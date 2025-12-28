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
    
    // Skip external links and anchors
    if (href.startsWith('http') || href.startsWith('#')) return;
    
    // Already correct
    if (href.startsWith(BASE_PATH + '/')) return;
    
    // Fix absolute paths that don't have /obsidian
    if (href.startsWith('/') && !href.startsWith(BASE_PATH)) {
      e.preventDefault();
      e.stopPropagation();
      window.location.href = BASE_PATH + href;
      return;
    }
    
    // Fix relative paths with ../ that would escape /obsidian
    if (href.startsWith('../') || href.startsWith('./')) {
      const resolved = new URL(href, window.location.href).pathname;
      if (!resolved.startsWith(BASE_PATH)) {
        e.preventDefault();
        e.stopPropagation();
        window.location.href = BASE_PATH + resolved;
        return;
      }
    }
  }, true);
})();
</script>
`;

async function handler({ request, params }: { request: Request; params: { _splat: string } }) {
  const url = new URL(request.url);
  const path = params._splat || "";
  
  const targetUrl = `${OBSIDIAN_PORTAL_URL}/${path}${url.search}`;

  try {
    const response = await fetch(targetUrl);
    const contentType = response.headers.get("content-type") || "";

    // For HTML content, inject navigation fix script and rewrite URLs
    if (contentType.includes("text/html")) {
      const html = await response.text();
      const rewrittenHtml = html
        .replace('</head>', NAVIGATION_FIX_SCRIPT + '</head>')
        // Rewrite relative paths starting with ../
        .replace(/href="\.\.\/obsidian-vault/g, 'href="/obsidian/obsidian-vault')
        .replace(/href="\.\.\/self-space/g, 'href="/obsidian/self-space')
        .replace(/href="\.\.\/artificial-intelligence/g, 'href="/obsidian/artificial-intelligence')
        .replace(/href='\.\.\/obsidian-vault/g, "href='/obsidian/obsidian-vault")
        .replace(/href='\.\.\/self-space/g, "href='/obsidian/self-space")
        .replace(/href='\.\.\/artificial-intelligence/g, "href='/obsidian/artificial-intelligence")
        // Rewrite relative paths starting with ./
        .replace(/href="\.\/obsidian-vault/g, 'href="/obsidian/obsidian-vault')
        .replace(/href="\.\/self-space/g, 'href="/obsidian/self-space')
        .replace(/href="\.\/artificial-intelligence/g, 'href="/obsidian/artificial-intelligence')
        // Rewrite absolute paths
        .replace(/href="\/(?!obsidian)/g, 'href="/obsidian/')
        .replace(/href='\/(?!obsidian)/g, "href='/obsidian/")
        // Rewrite ../ to go to obsidian root
        .replace(/href="\.\.\/"/g, 'href="/obsidian/"')
        .replace(/href='\.\.\/'/g, "href='/obsidian/'")
        .replace(/href="\.\."/g, 'href="/obsidian/"')
        .replace(/href='\.\.'/g, "href='/obsidian/'")
        // Rewrite static assets
        .replace(/src="\/(?!obsidian)/g, 'src="/obsidian/')
        .replace(/src='\/(?!obsidian)/g, "src='/obsidian/")
        .replace(/url\(\/(?!obsidian)/g, 'url(/obsidian/')
        .replace(/url\("\/(?!obsidian)/g, 'url("/obsidian/')
        .replace(/url\('\/(?!obsidian)/g, "url('/obsidian/");

      return new Response(rewrittenHtml, {
        status: response.status,
        headers: {
          "content-type": "text/html; charset=utf-8",
          "cache-control": "no-cache",
        },
      });
    }

    // For JavaScript, rewrite paths
    if (contentType.includes("javascript") || contentType.includes("application/javascript")) {
      const js = await response.text();
      const rewrittenJs = js
        .replace(/"\/(?!obsidian)/g, '"/obsidian/')
        .replace(/'\/(?!obsidian)/g, "'/obsidian/")
        .replace(/`\/(?!obsidian)/g, '`/obsidian/');

      return new Response(rewrittenJs, {
        status: response.status,
        headers: {
          "content-type": contentType,
          "cache-control": "no-cache",
        },
      });
    }

    // For CSS, rewrite url() references
    if (contentType.includes("text/css")) {
      const css = await response.text();
      const rewrittenCss = css
        .replace(/url\(\/(?!obsidian)/g, 'url(/obsidian/')
        .replace(/url\("\/(?!obsidian)/g, 'url("/obsidian/')
        .replace(/url\('\/(?!obsidian)/g, "url('/obsidian/");

      return new Response(rewrittenCss, {
        status: response.status,
        headers: {
          "content-type": contentType,
          "cache-control": "no-cache",
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
