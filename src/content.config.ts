import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.date(),
    category: z.enum(['ai', 'triatlon', 'it', 'services']),
    image: z.string().optional(),
  }),
});

const events = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/events' }),
  schema: z.object({
    title: z.string(),
    date: z.date(),
    city: z.string(),
    sportType: z.enum(['triathlon', 'swimrun', 'aquathlon', 'swim', 'run']),
    status: z.enum(['open', 'low', 'sold_out', 'waitlist']),
    distances: z.object({
      swim: z.number().optional(),
      bike: z.number().optional(),
      run: z.number().optional(),
    }),
    sourceUrl: z.string().optional(),
    prices: z
      .array(
        z.object({
          category: z.string(),
          levels: z.array(
            z.object({
              level: z.number(),
              price: z.number(),
            }),
          ),
        }),
      )
      .optional(),
  }),
});

export const collections = { blog, events };
