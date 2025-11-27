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

export const trpcRouter = createTRPCRouter({
  resources: resourcesRouter,
  tags: tagsRouter,
});
export type TRPCRouter = typeof trpcRouter;
