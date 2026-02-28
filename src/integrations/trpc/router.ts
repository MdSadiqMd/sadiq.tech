import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "./init";
import type { TRPCRouterRecord } from "@trpc/server";
import { getGistContent, updateGist } from "@/utils/octokit";
import { gistDBAxios } from "@/lib/axios";

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
      const { data: result } = await gistDBAxios.get<any>(
        `/${gistDbId}?collection_name=gallery_images`,
      );
      const dataObj = result.data || {};
      const images = Object.entries(dataObj).map(
        ([uuid, data]: [string, any]) => ({
          uuid,
          data,
        }),
      );

      return images;
    } catch (error) {
      console.error("Failed to fetch from GistDB:", error);
      return [];
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
