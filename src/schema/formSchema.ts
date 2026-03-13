import { z } from "zod";

export const formSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(3, "Name must be at least 3 characters"),
  email: z.email("Invalid email address"),
  age: z.coerce
    .number()
    .min(18, "Must be at least 18 years old")
    .max(100, "Must be less than 100"),
  role: z.enum(["admin", "user", "guest"]),
  bio: z.string().min(10, "Bio must be at least 10 characters"),
  notifications: z.boolean().default(false),
  tags: z.array(z.string()).min(1, "Select at least one tag"),
});

export type FormType = z.infer<typeof formSchema>;

export const defaultFormValues: FormType = {
  name: "",
  email: "",
  age: 18,
  role: "user",
  bio: "",
  notifications: true,
  tags: ["general"],
};
