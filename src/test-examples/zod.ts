import { z } from "zod";

// 1. Simple Schema
export const UserSchema = z.object({
  id: z.string().uuid(),
  username: z.string().min(3).max(20),
  email: z.string().email(),
  age: z.number().int().min(18).optional(),
  createdAt: z.date().default(() => new Date()),
});

// Infer type from schema
export type User = z.infer<typeof UserSchema>;

// 2. Nested Schema
export const PostSchema = z.object({
  title: z.string().min(5),
  content: z.string(),
  authorId: z.string().uuid(),
  tags: z.array(z.string()).nonempty(),
  metadata: z
    .object({
      isPublished: z.boolean(),
      views: z.number().nonnegative(),
    })
    .optional(),
});

export type Post = z.infer<typeof PostSchema>;

// 3. Schema with Refinements (Custom Validation)
export const PasswordSchema = z
  .string()
  .min(8)
  .refine((val) => /[A-Z]/.test(val), {
    message: "Password must contain at least one uppercase letter",
  })
  .refine((val) => /[0-9]/.test(val), {
    message: "Password must contain at least one number",
  });

// 4. Transform Example
export const SearchQuerySchema = z.object({
  query: z.string().trim().toLowerCase(),
  page: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().min(1)),
});

export type SearchQuery = z.infer<typeof SearchQuerySchema>;

// Example function using validation
export function validateUser(data: unknown) {
  return UserSchema.safeParse(data);
}
