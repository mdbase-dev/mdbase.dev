import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

// content/ is an mdbase collection: one record per documentation page, typed
// by content/_types/doc-page.md. This schema mirrors that type so the build
// fails on a record the type would reject.
const docs = defineCollection({
  loader: glob({ base: "./content", pattern: ["**/*.md", "!_types/**"] }),
  schema: z
    .object({
      title: z.string().min(1),
      description: z.string().min(1),
      section: z.enum(["sdk", "mcp", "editor", "reader", "writer", "guides"])
    })
    .strict()
});

export const collections = { docs };
