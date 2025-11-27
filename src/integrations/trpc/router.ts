import { z } from "zod";
import { Octokit } from "@octokit/rest";
import { createTRPCRouter, publicProcedure } from "./init";
import type { TRPCRouterRecord } from "@trpc/server";

// Initialize Octokit - will use GITHUB_TOKEN from environment
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

// Helper functions for GitHub Gist operations
async function getGistContent(gistId: string) {
  try {
    const response = await octokit.gists.get({ gist_id: gistId });
    const files = response.data.files;
    if (!files) return null;

    const firstFile = Object.values(files)[0];
    if (firstFile?.content) {
      return {
        data: JSON.parse(firstFile.content),
        filename: firstFile.filename || "data.json",
      };
    }
    return null;
  } catch (error) {
    console.error("Error fetching gist:", error);
    throw error;
  }
}

async function updateGist(gistId: string, content: any, filename: string) {
  try {
    await octokit.gists.update({
      gist_id: gistId,
      files: {
        [filename]: {
          content: JSON.stringify(content, null, 2),
        },
      },
    });
  } catch (error) {
    console.error("Error updating gist:", error);
    throw error;
  }
}

const todos = [
  { id: 1, name: "Get groceries" },
  { id: 2, name: "Buy a new phone" },
  { id: 3, name: "Finish the project" },
];

const todosRouter = {
  list: publicProcedure.query(() => todos),
  add: publicProcedure
    .input(z.object({ name: z.string() }))
    .mutation(({ input }) => {
      const newTodo = { id: todos.length + 1, name: input.name };
      todos.push(newTodo);
      return newTodo;
    }),
} satisfies TRPCRouterRecord;

// Resources Router
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

// Tags Router
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

      // Check if tag already exists
      if (!tags.find((t: any) => t.name === input.name)) {
        tags.push(input);
        await updateGist(gistId, tags, gistContent?.filename || "tags.json");
      }

      return input;
    }),
} satisfies TRPCRouterRecord;

export const trpcRouter = createTRPCRouter({
  todos: todosRouter,
  resources: resourcesRouter,
  tags: tagsRouter,
});
export type TRPCRouter = typeof trpcRouter;
