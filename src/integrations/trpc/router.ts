import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "./init";
import type { TRPCRouterRecord } from "@trpc/server";
import { getGistContent, updateGist } from "@/utils/octokit";

const resourcesRouter = {
  list: publicProcedure.query(async () => {
    const gistId = process.env.RESOURCES_GIST_ID;
    if (!gistId) throw new Error("RESOURCES_GIST_ID not configured");

    const gistContent = await getGistContent(gistId);
    return gistContent?.data || [];
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
    const gistId = process.env.TAGS_GIST_ID;
    if (!gistId) throw new Error("TAGS_GIST_ID not configured");

    const gistContent = await getGistContent(gistId);
    return gistContent?.data || [];
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

    const response = await fetch(
      `https://gist-db.mohammadsadiq4950.workers.dev/api/${gistDbId}?collection_name=gallery_images`,
      {
        headers: {
          Authorization: `Bearer ${githubToken}`,
        },
      },
    );
    if (!response.ok) {
      throw new Error("Failed to fetch from GistDB");
    }

    const result = (await response.json()) as any;
    const dataObj = result.data || {};
    const images = Object.entries(dataObj).map(
      ([uuid, data]: [string, any]) => ({
        uuid,
        data,
      }),
    );

    return images;
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

      const response = await fetch(
        "https://gist-db.mohammadsadiq4950.workers.dev/api/objects",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${githubToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            gist_id: gistDbId,
            collection_name: "gallery_images",
            data: input,
          }),
        },
      );
      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to save to GistDB: ${error}`);
      }

      const result = (await response.json()) as any;
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

      const response = await fetch(
        "https://gist-db.mohammadsadiq4950.workers.dev/api/objects",
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${githubToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            gist_id: gistDbId,
            collection_name: "gallery_images",
            object_id: input.id,
          }),
        },
      );
      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to delete from GistDB: ${error}`);
      }

      return { success: true };
    }),

  initCollection: publicProcedure.mutation(async () => {
    const gistDbId = process.env.GISTDB_ID;
    const githubToken = process.env.GITHUB_TOKEN;
    if (!gistDbId || !githubToken) {
      throw new Error("GistDB not configured");
    }

    try {
      await fetch(
        "https://gist-db.mohammadsadiq4950.workers.dev/api/collections",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${githubToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            gist_id: gistDbId,
            name: "gallery_images",
          }),
        },
      );
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
