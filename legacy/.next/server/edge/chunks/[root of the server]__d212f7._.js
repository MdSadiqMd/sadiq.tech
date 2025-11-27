(globalThis.TURBOPACK = globalThis.TURBOPACK || []).push(["chunks/[root of the server]__d212f7._.js", {

"[externals]/node:async_hooks [external] (node:async_hooks, cjs)": (function(__turbopack_context__) {

var { r: __turbopack_require__, f: __turbopack_module_context__, i: __turbopack_import__, s: __turbopack_esm__, v: __turbopack_export_value__, n: __turbopack_export_namespace__, c: __turbopack_cache__, M: __turbopack_modules__, l: __turbopack_load__, j: __turbopack_dynamic__, P: __turbopack_resolve_absolute_path__, U: __turbopack_relative_url__, R: __turbopack_resolve_module_id_path__, b: __turbopack_worker_blob_url__, g: global, __dirname, x: __turbopack_external_require__, y: __turbopack_external_import__, m: module, e: exports, t: __turbopack_require_real__ } = __turbopack_context__;
{
const mod = __turbopack_external_require__("node:async_hooks", () => require("node:async_hooks"));

module.exports = mod;
}}),
"[externals]/node:buffer [external] (node:buffer, cjs)": (function(__turbopack_context__) {

var { r: __turbopack_require__, f: __turbopack_module_context__, i: __turbopack_import__, s: __turbopack_esm__, v: __turbopack_export_value__, n: __turbopack_export_namespace__, c: __turbopack_cache__, M: __turbopack_modules__, l: __turbopack_load__, j: __turbopack_dynamic__, P: __turbopack_resolve_absolute_path__, U: __turbopack_relative_url__, R: __turbopack_resolve_module_id_path__, b: __turbopack_worker_blob_url__, g: global, __dirname, x: __turbopack_external_require__, y: __turbopack_external_import__, m: module, e: exports, t: __turbopack_require_real__ } = __turbopack_context__;
{
const mod = __turbopack_external_require__("node:buffer", () => require("node:buffer"));

module.exports = mod;
}}),
"[project]/src/app/api/github.ts [app-edge-route] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { r: __turbopack_require__, f: __turbopack_module_context__, i: __turbopack_import__, s: __turbopack_esm__, v: __turbopack_export_value__, n: __turbopack_export_namespace__, c: __turbopack_cache__, M: __turbopack_modules__, l: __turbopack_load__, j: __turbopack_dynamic__, P: __turbopack_resolve_absolute_path__, U: __turbopack_relative_url__, R: __turbopack_resolve_module_id_path__, b: __turbopack_worker_blob_url__, g: global, __dirname, x: __turbopack_external_require__, y: __turbopack_external_import__, z: __turbopack_require_stub__ } = __turbopack_context__;
{
__turbopack_esm__({
    "getGistContent": (()=>getGistContent),
    "runtime": (()=>runtime),
    "updateGist": (()=>updateGist)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$octokit$2f$rest$2f$dist$2d$src$2f$index$2e$js__$5b$app$2d$edge$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/node_modules/@octokit/rest/dist-src/index.js [app-edge-route] (ecmascript)");
;
const octokit = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$octokit$2f$rest$2f$dist$2d$src$2f$index$2e$js__$5b$app$2d$edge$2d$route$5d$__$28$ecmascript$29$__["Octokit"]({
    auth: process.env.GITHUB_TOKEN
});
const runtime = 'edge';
async function getGistContent(gistId) {
    try {
        const response = await octokit.gists.get({
            gist_id: gistId
        });
        const files = response.data.files;
        if (!files) {
            return null;
        }
        const firstFile = Object.values(files)[0];
        if (firstFile?.content) {
            return {
                data: JSON.parse(firstFile.content),
                filename: firstFile.filename
            };
        }
        return null;
    } catch (error) {
        console.error('Error fetching gist:', error);
        throw error;
    }
}
async function updateGist(gistId, content, filename) {
    try {
        await octokit.gists.update({
            gist_id: gistId,
            files: {
                [filename]: {
                    content: JSON.stringify(content, null, 2)
                }
            }
        });
    } catch (error) {
        console.error('Error updating gist:', error);
        throw error;
    }
}
}}),
"[project]/src/app/api/tags/route.ts [app-edge-route] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { r: __turbopack_require__, f: __turbopack_module_context__, i: __turbopack_import__, s: __turbopack_esm__, v: __turbopack_export_value__, n: __turbopack_export_namespace__, c: __turbopack_cache__, M: __turbopack_modules__, l: __turbopack_load__, j: __turbopack_dynamic__, P: __turbopack_resolve_absolute_path__, U: __turbopack_relative_url__, R: __turbopack_resolve_module_id_path__, b: __turbopack_worker_blob_url__, g: global, __dirname, x: __turbopack_external_require__, y: __turbopack_external_import__, z: __turbopack_require_stub__ } = __turbopack_context__;
{
__turbopack_esm__({
    "GET": (()=>GET),
    "POST": (()=>POST),
    "runtime": (()=>runtime)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$api$2f$server$2e$js__$5b$app$2d$edge$2d$route$5d$__$28$ecmascript$29$__$3c$module__evaluation$3e$__ = __turbopack_import__("[project]/node_modules/next/dist/esm/api/server.js [app-edge-route] (ecmascript) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$api$2f$github$2e$ts__$5b$app$2d$edge$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/src/app/api/github.ts [app-edge-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$spec$2d$extension$2f$response$2e$js__$5b$app$2d$edge$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/node_modules/next/dist/esm/server/web/spec-extension/response.js [app-edge-route] (ecmascript)");
;
;
const runtime = 'edge';
async function GET() {
    try {
        const gistContent = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$api$2f$github$2e$ts__$5b$app$2d$edge$2d$route$5d$__$28$ecmascript$29$__["getGistContent"])(process.env.TAGS_GIST_ID);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$spec$2d$extension$2f$response$2e$js__$5b$app$2d$edge$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json(gistContent?.data || []);
    } catch (error) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$spec$2d$extension$2f$response$2e$js__$5b$app$2d$edge$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: `Failed to fetch tags: ${error}`
        }, {
            status: 500
        });
    }
}
async function POST(request) {
    try {
        const tag = await request.json();
        const gistContent = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$api$2f$github$2e$ts__$5b$app$2d$edge$2d$route$5d$__$28$ecmascript$29$__["getGistContent"])(process.env.TAGS_GIST_ID);
        const tags = gistContent?.data || [];
        if (!tags.find((t)=>t.name === tag.name)) {
            tags.push(tag);
            await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$api$2f$github$2e$ts__$5b$app$2d$edge$2d$route$5d$__$28$ecmascript$29$__["updateGist"])(process.env.TAGS_GIST_ID, tags, gistContent?.filename || 'tags.json');
        }
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$spec$2d$extension$2f$response$2e$js__$5b$app$2d$edge$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json(tag);
    } catch (error) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$spec$2d$extension$2f$response$2e$js__$5b$app$2d$edge$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: `Failed to create tag: ${error}`
        }, {
            status: 500
        });
    }
}
}}),
"[project]/.next-internal/server/app/api/tags/route/actions.js [app-edge-rsc] (ecmascript)": (function(__turbopack_context__) {

var { r: __turbopack_require__, f: __turbopack_module_context__, i: __turbopack_import__, s: __turbopack_esm__, v: __turbopack_export_value__, n: __turbopack_export_namespace__, c: __turbopack_cache__, M: __turbopack_modules__, l: __turbopack_load__, j: __turbopack_dynamic__, P: __turbopack_resolve_absolute_path__, U: __turbopack_relative_url__, R: __turbopack_resolve_module_id_path__, b: __turbopack_worker_blob_url__, g: global, __dirname, x: __turbopack_external_require__, y: __turbopack_external_import__, m: module, e: exports, t: __turbopack_require_real__ } = __turbopack_context__;
{
}}),
}]);

//# sourceMappingURL=%5Broot%20of%20the%20server%5D__d212f7._.js.map