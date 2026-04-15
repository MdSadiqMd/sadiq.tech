import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "./init";
import type { TRPCRouterRecord } from "@trpc/server";
import { getGistContent, updateGist } from "@/utils/octokit";
import { gistDBAxios, workerAxios } from "@/lib/axios";

const resourcesRouter = {
  list: publicProcedure.query(async () => {
    try {
      const gistId = process.env.RESOURCES_GIST_ID;
      if (!gistId) {
        console.error("RESOURCES_GIST_ID not configured");
        return [];
      }

      const gistContent = await getGistContent(gistId);
      return Array.isArray(gistContent?.data) ? gistContent.data : [];
    } catch (error) {
      console.error("Failed to fetch resources:", error);
      return [];
    }
  }),

  add: publicProcedure
    .input(
      z.object({
        name: z.string(),
        resource: z.string(),
        tag: z.string(),
        color: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      const gistId = process.env.RESOURCES_GIST_ID;
      if (!gistId) throw new Error("RESOURCES_GIST_ID not configured");

      const gistContent = await getGistContent(gistId);
      const resources = gistContent?.data || [];

      const newResource = {
        id: Math.random().toString(36).substr(2, 9),
        name: input.name,
        resource: input.resource,
        tag: input.tag,
        color: input.color,
      };

      resources.push(newResource);
      await updateGist(
        gistId,
        resources,
        gistContent?.filename || "resources.json",
      );

      return newResource;
    }),

  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const gistId = process.env.RESOURCES_GIST_ID;
      if (!gistId) throw new Error("RESOURCES_GIST_ID not configured");

      const gistContent = await getGistContent(gistId);
      const resources = gistContent?.data || [];
      const updatedResources = resources.filter((r: any) => r.id !== input.id);

      await updateGist(
        gistId,
        updatedResources,
        gistContent?.filename || "resources.json",
      );

      return { success: true };
    }),
} satisfies TRPCRouterRecord;

const tagsRouter = {
  list: publicProcedure.query(async () => {
    try {
      const gistId = process.env.TAGS_GIST_ID;
      if (!gistId) {
        console.error("TAGS_GIST_ID not configured");
        return [];
      }

      const gistContent = await getGistContent(gistId);
      return Array.isArray(gistContent?.data) ? gistContent.data : [];
    } catch (error) {
      console.error("Failed to fetch tags:", error);
      return [];
    }
  }),

  add: publicProcedure
    .input(
      z.object({
        name: z.string(),
        color: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      const gistId = process.env.TAGS_GIST_ID;
      if (!gistId) throw new Error("TAGS_GIST_ID not configured");

      const gistContent = await getGistContent(gistId);

      const tags = gistContent?.data || [];
      if (!tags.find((t: any) => t.name === input.name)) {
        tags.push(input);
        await updateGist(gistId, tags, gistContent?.filename || "tags.json");
      }

      return input;
    }),
} satisfies TRPCRouterRecord;

const gistDBRouter = {
  listImages: publicProcedure.query(async () => {
    const gistDbId = process.env.GISTDB_ID;
    const githubToken = process.env.GITHUB_TOKEN;
    if (!gistDbId || !githubToken) {
      throw new Error("GistDB not configured");
    }

    try {
      console.log("[tRPC] Fetching images from GistDB...");
      const { data: result } = await gistDBAxios.get<any>(
        `/${gistDbId}?collection_name=gallery_images`,
      );

      console.log("[tRPC] Raw GistDB response keys:", Object.keys(result));
      console.log(
        "[tRPC] result.data type:",
        typeof result.data,
        Array.isArray(result.data) ? "array" : "object",
      );

      const dataObj = result.data || {};
      const dataKeys = Object.keys(dataObj);
      console.log(`[tRPC] GistDB data object has ${dataKeys.length} keys`);

      const images = Object.entries(dataObj).map(
        ([uuid, data]: [string, any]) => ({
          uuid,
          data,
        }),
      );

      console.log(`[tRPC] Returning ${images.length} images to frontend`);
      return images;
    } catch (error) {
      console.error("Failed to fetch from GistDB:", error);
      return [];
    }
  }),

  uploadImage: publicProcedure
    .input(
      z.object({
        imageBase64: z.string(),
        fileName: z.string(),
        mimeType: z.string(),
        githubAccessToken: z.string(),
        githubUsername: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        const buffer = Buffer.from(input.imageBase64, "base64");

        console.log("[Upload] Image size:", buffer.length, "bytes");
        console.log("[Upload] File name:", input.fileName);
        console.log("[Upload] MIME type:", input.mimeType);

        // Manually construct multipart/form-data
        const boundary = `----WebKitFormBoundary${Math.random().toString(36).substring(2)}`;
        const CRLF = "\r\n";

        const parts: Buffer[] = [];

        // Add image field
        parts.push(
          Buffer.from(
            `--${boundary}${CRLF}` +
              `Content-Disposition: form-data; name="image"; filename="${input.fileName}"${CRLF}` +
              `Content-Type: ${input.mimeType}${CRLF}${CRLF}`,
          ),
        );
        parts.push(buffer);
        parts.push(Buffer.from(CRLF));

        // Add githubAccessToken field
        parts.push(
          Buffer.from(
            `--${boundary}${CRLF}` +
              `Content-Disposition: form-data; name="githubAccessToken"${CRLF}${CRLF}` +
              `${input.githubAccessToken}${CRLF}`,
          ),
        );

        // Add githubUsername field
        parts.push(
          Buffer.from(
            `--${boundary}${CRLF}` +
              `Content-Disposition: form-data; name="githubUsername"${CRLF}${CRLF}` +
              `${input.githubUsername}${CRLF}`,
          ),
        );

        // Add closing boundary
        parts.push(Buffer.from(`--${boundary}--${CRLF}`));

        // Concatenate all parts
        const body = Buffer.concat(parts);
        console.log("[Upload] Body size:", body.length, "bytes");
        console.log("[Upload] Boundary:", boundary);
        console.log("[Upload] Sending request to Pimg worker with axios...");

        const { data } = await workerAxios.post<any>("/", body, {
          headers: {
            "Content-Type": `multipart/form-data; boundary=${boundary}`,
            "Content-Length": body.length.toString(),
          },
          maxBodyLength: Infinity,
          maxContentLength: Infinity,
        });

        console.log("[Upload] Success! Response:", data);

        if (!data.success || !data.gistId) {
          throw new Error("Invalid response from Pimg worker");
        }
        return data;
      } catch (error) {
        console.error("Upload proxy error:", error);
        if (error instanceof Error) {
          console.error("Error message:", error.message);
        }
        throw error;
      }
    }),

  saveImage: publicProcedure
    .input(
      z.object({
        id: z.string(),
        fileName: z.string(),
        gistId: z.string(),
        uploadedAt: z.number(),
        width: z.number().optional(),
        height: z.number().optional(),
        aspectRatio: z.number().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const gistDbId = process.env.GISTDB_ID;
      const githubToken = process.env.GITHUB_TOKEN;
      if (!gistDbId || !githubToken) {
        throw new Error("GistDB not configured");
      }

      const { data: result } = await gistDBAxios.post<any>("/objects", {
        gist_id: gistDbId,
        collection_name: "gallery_images",
        data: input,
      });
      return { success: true, uuid: result.uuid };
    }),

  deleteImage: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const gistDbId = process.env.GISTDB_ID;
      const githubToken = process.env.GITHUB_TOKEN;
      if (!gistDbId || !githubToken) {
        throw new Error("GistDB not configured");
      }

      await gistDBAxios.delete("/objects", {
        data: {
          gist_id: gistDbId,
          collection_name: "gallery_images",
          object_id: input.id,
        },
      });

      return { success: true };
    }),

  initCollection: publicProcedure.mutation(async () => {
    const gistDbId = process.env.GISTDB_ID;
    const githubToken = process.env.GITHUB_TOKEN;
    if (!gistDbId || !githubToken) {
      throw new Error("GistDB not configured");
    }

    try {
      await gistDBAxios.post("/collections", {
        gist_id: gistDbId,
        name: "gallery_images",
      });
    } catch (error) {
      // Collection might already exist
    }

    return { success: true };
  }),
} satisfies TRPCRouterRecord;

export const trpcRouter = createTRPCRouter({
  resources: resourcesRouter,
  tags: tagsRouter,
  gistDB: gistDBRouter,
});
export type TRPCRouter = typeof trpcRouter;
