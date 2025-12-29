const OBSIDIAN_PORTAL_URL = "https://obsidian-portal.pages.dev";

function rewriteUrls(html, currentPath) {
  const pathParts = currentPath.split('/').filter(Boolean);
  const depth = pathParts.length;
  
  let result = html;
  
  for (let i = depth; i >= 1; i--) {
    const dots = '../'.repeat(i);
    const dotsEscaped = dots.replace(/\./g, '\\.').replace(/\//g, '\\/');
    
    result = result.replace(new RegExp(`href="${dotsEscaped}`, 'g'), 'href="/obsidian/');
    result = result.replace(new RegExp(`href='${dotsEscaped}`, 'g'), "href='/obsidian/");
    result = result.replace(new RegExp(`src="${dotsEscaped}`, 'g'), 'src="/obsidian/');
    result = result.replace(new RegExp(`src='${dotsEscaped}`, 'g'), "src='/obsidian/");
  }
  
  for (let i = depth; i >= 1; i--) {
    const dots = '../'.repeat(i);
    const dotsEscaped = dots.replace(/\./g, '\\.').replace(/\//g, '\\/');
    result = result.replace(new RegExp(`fetch\\("${dotsEscaped}`, 'g'), 'fetch("/obsidian/');
    result = result.replace(new RegExp(`fetch\\('${dotsEscaped}`, 'g'), "fetch('/obsidian/");
  }
  
  result = result.replace(/href="\/(?!obsidian)(?!\/)/g, 'href="/obsidian/');
  result = result.replace(/href='\/(?!obsidian)(?!\/)/g, "href='/obsidian/");
  result = result.replace(/src="\/(?!obsidian)(?!\/)/g, 'src="/obsidian/');
  result = result.replace(/src='\/(?!obsidian)(?!\/)/g, "src='/obsidian/");
  
  result = result.replace(/href="\.\."/g, 'href="/obsidian/"');
  result = result.replace(/href='\.\.'/g, "href='/obsidian/'");
  
  return result;
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname.replace(/^\/obsidian\/?/, '');
    
    const targetUrl = path 
      ? `${OBSIDIAN_PORTAL_URL}/${path}${url.search}`
      : `${OBSIDIAN_PORTAL_URL}${url.search}`;

    try {
      const response = await fetch(targetUrl);
      const contentType = response.headers.get("content-type") || "";

      if (contentType.includes("text/html")) {
        const html = await response.text();
        return new Response(rewriteUrls(html, path), {
          status: response.status,
          headers: {
            "content-type": "text/html; charset=utf-8",
            "cache-control": "no-cache",
          },
        });
      }

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
};
