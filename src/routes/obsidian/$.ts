import { createFileRoute } from "@tanstack/react-router";

const OBSIDIAN_PORTAL_URL = "https://obsidian-portal.pages.dev";

async function handler({ request, params }: { request: Request; params: { _splat: string } }) {
  const url = new URL(request.url);
  const path = params._splat || "";
  
  const targetUrl = `${OBSIDIAN_PORTAL_URL}/${path}${url.search}`;

  try {
    const response = await fetch(targetUrl);
    const contentType = response.headers.get("content-type") || "";

    // For HTML content, rewrite URLs to include /obsidian prefix
    if (contentType.includes("text/html")) {
      const html = await response.text();
      const rewrittenHtml = html
        // Rewrite href attributes
        .replace(/href="\/(?!obsidian)/g, 'href="/obsidian/')
        .replace(/href='\/(?!obsidian)/g, "href='/obsidian/")
        .replace(/href="(obsidian-vault|self-space|artificial-intelligence)/g, 'href="/obsidian/$1')
        .replace(/href='(obsidian-vault|self-space|artificial-intelligence)/g, "href='/obsidian/$1")
        // Rewrite data-slug attributes (CRITICAL for Quartz SPA routing)
        .replace(/data-slug="\/(?!obsidian)/g, 'data-slug="/obsidian/')
        .replace(/data-slug='\/(?!obsidian)/g, "data-slug='/obsidian/")
        .replace(/data-slug="(obsidian-vault|self-space|artificial-intelligence)/g, 'data-slug="/obsidian/$1')
        .replace(/data-slug='(obsidian-vault|self-space|artificial-intelligence)/g, "data-slug='/obsidian/$1")
        // Rewrite src attributes  
        .replace(/src="\/(?!obsidian)/g, 'src="/obsidian/')
        .replace(/src='\/(?!obsidian)/g, "src='/obsidian/")
        // Rewrite CSS url() functions
        .replace(/url\(\/(?!obsidian)/g, 'url(/obsidian/')
        .replace(/url\("\/(?!obsidian)/g, 'url("/obsidian/')
        .replace(/url\('\/(?!obsidian)/g, "url('/obsidian/");

      return new Response(rewrittenHtml, {
        status: response.status,
        headers: {
          "content-type": "text/html; charset=utf-8",
          "cache-control": "public, max-age=3600",
        },
      });
    }

    // For JavaScript, rewrite navigation paths comprehensively
    if (contentType.includes("javascript") || contentType.includes("application/javascript")) {
      const js = await response.text();
      const rewrittenJs = js
        // Rewrite string literals for absolute paths
        .replace(/"\/(?!obsidian)/g, '"/obsidian/')
        .replace(/'\/(?!obsidian)/g, "'/obsidian/")
        // Rewrite vault names in strings (with trailing slash)
        .replace(/"(obsidian-vault|self-space|artificial-intelligence)\//g, '"/obsidian/$1/')
        .replace(/'(obsidian-vault|self-space|artificial-intelligence)\//g, "'/obsidian/$1/")
        // Rewrite vault names in strings (without trailing slash, end of string)
        .replace(/"(obsidian-vault|self-space|artificial-intelligence)"/g, '"/obsidian/$1"')
        .replace(/'(obsidian-vault|self-space|artificial-intelligence)'/g, "'/obsidian/$1'")
        // Rewrite template literals
        .replace(/`\/(?!obsidian)/g, '`/obsidian/')
        .replace(/`(obsidian-vault|self-space|artificial-intelligence)\//g, '`/obsidian/$1/')
        .replace(/`(obsidian-vault|self-space|artificial-intelligence)`/g, '`/obsidian/$1`')
        // Rewrite slug/path normalization functions (Quartz specific)
        .replace(/simplifySlug\s*\(\s*"(obsidian-vault|self-space|artificial-intelligence)/g, 'simplifySlug("/obsidian/$1')
        .replace(/simplifySlug\s*\(\s*'(obsidian-vault|self-space|artificial-intelligence)/g, "simplifySlug('/obsidian/$1")
        .replace(/resolveRelative\s*\([^,]+,\s*"(obsidian-vault|self-space|artificial-intelligence)/g, 'resolveRelative($1,"/obsidian/$2')
        // Rewrite pathname checks
        .replace(/\.pathname\s*===?\s*"\/"/g, '.pathname==="/obsidian"||.pathname==="/"')
        .replace(/\.pathname\s*===?\s*'\/'/g, ".pathname==='/obsidian'||.pathname==='/'")
        // Rewrite location assignments
        .replace(/location\.pathname\s*=\s*"\/(?!obsidian)/g, 'location.pathname="/obsidian/')
        .replace(/location\.pathname\s*=\s*'\/(?!obsidian)/g, "location.pathname='/obsidian/")
        .replace(/location\.pathname\s*=\s*"(obsidian-vault|self-space|artificial-intelligence)/g, 'location.pathname="/obsidian/$1')
        .replace(/location\.pathname\s*=\s*'(obsidian-vault|self-space|artificial-intelligence)/g, "location.pathname='/obsidian/$1")
        // Rewrite history API calls
        .replace(/(pushState|replaceState)\(([^,]+),\s*([^,]+),\s*"\/(?!obsidian)/g, '$1($2,$3,"/obsidian/')
        .replace(/(pushState|replaceState)\(([^,]+),\s*([^,]+),\s*'\/(?!obsidian)/g, "$1($2,$3,'/obsidian/")
        .replace(/(pushState|replaceState)\(([^,]+),\s*([^,]+),\s*"(obsidian-vault|self-space|artificial-intelligence)/g, '$1($2,$3,"/obsidian/$4')
        .replace(/(pushState|replaceState)\(([^,]+),\s*([^,]+),\s*'(obsidian-vault|self-space|artificial-intelligence)/g, "$1($2,$3,'/obsidian/$4")
        // Rewrite router.push/navigate calls
        .replace(/\.(push|navigate)\s*\(\s*"(obsidian-vault|self-space|artificial-intelligence)/g, '.$1("/obsidian/$2')
        .replace(/\.(push|navigate)\s*\(\s*'(obsidian-vault|self-space|artificial-intelligence)/g, ".$1('/obsidian/$2");

      return new Response(rewrittenJs, {
        status: response.status,
        headers: {
          "content-type": contentType,
          "cache-control": response.headers.get("cache-control") || "public, max-age=3600",
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
