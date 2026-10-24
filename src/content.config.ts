import { posix } from 'node:path';
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const base = './src/content/posts';

const posts = defineCollection({
  loader: glob({
    pattern: ['**/*.{md,mdx}', '!**/_folder.md'],
    base,
    generateId: ({ entry }) => entry.replace(/\.mdx?$/, ''),
  }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    date: z.coerce.date(),
    order: z.number().int().optional(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

const folders = defineCollection({
  loader: glob({
    pattern: '*/**/_folder.md',
    base,
    generateId: ({ entry }) => posix.dirname(entry),
  }),
  schema: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    order: z.number().int().optional(),
  }),
});

export const collections = { posts, folders };
