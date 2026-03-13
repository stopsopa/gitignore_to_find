import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  UserSchema,
  PostSchema,
  PasswordSchema,
  SearchQuerySchema,
} from "./zod.ts";

/**
 * /bin/bash ts.sh --test src/test-examples/zod.test.ts
 */
describe("Zod Validation Examples", () => {
  describe("UserSchema", () => {
    it("should validate a correct user object", () => {
      const validUser = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        username: "johndoe",
        email: "john@example.com",
        age: 25,
      };

      const result = UserSchema.safeParse(validUser);
      assert.strictEqual(result.success, true);
      if (result.success) {
        assert.strictEqual(result.data.username, "johndoe");
        assert.ok(result.data.createdAt instanceof Date);
      }
    });

    it("should fail for invalid email", () => {
      const invalidUser = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        username: "johndoe",
        email: "invalid-email",
      };

      const result = UserSchema.safeParse(invalidUser);
      assert.strictEqual(result.success, false);
      if (!result.success) {
        assert.ok(result.error.issues[0].path.includes("email"));
      }
    });

    it("should fail for too short username", () => {
      const result = UserSchema.safeParse({
        id: "550e8400-e29b-41d4-a716-446655440000",
        username: "jo",
        email: "john@example.com",
      });
      assert.strictEqual(result.success, false);
    });
  });

  describe("PostSchema", () => {
    it("should validate a post with tags", () => {
      const validPost = {
        title: "Learn Zod",
        content: "Zod is amazing!",
        authorId: "550e8400-e29b-41d4-a716-446655440000",
        tags: ["typescript", "validation"],
      };

      const result = PostSchema.safeParse(validPost);
      assert.strictEqual(result.success, true);
    });

    it("should fail if tags array is empty", () => {
      const invalidPost = {
        title: "Learn Zod",
        content: "Zod is amazing!",
        authorId: "550e8400-e29b-41d4-a716-446655440000",
        tags: [],
      };

      const result = PostSchema.safeParse(invalidPost);
      assert.strictEqual(result.success, false);
    });
  });

  describe("PasswordSchema", () => {
    it("should validate a strong password", () => {
      assert.strictEqual(PasswordSchema.safeParse("Password123").success, true);
    });

    it("should fail if no uppercase", () => {
      const result = PasswordSchema.safeParse("password123");
      assert.strictEqual(result.success, false);
      if (!result.success) {
        assert.strictEqual(
          result.error.issues[0].message,
          "Password must contain at least one uppercase letter",
        );
      }
    });

    it("should fail if no number", () => {
      assert.strictEqual(
        PasswordSchema.safeParse("PasswordNoNum").success,
        false,
      );
    });
  });

  describe("SearchQuerySchema", () => {
    it("should transform and pipe data", () => {
      const input = {
        query: "  MY SEARCH  ",
        page: "5",
      };

      const result = SearchQuerySchema.safeParse(input);
      assert.strictEqual(result.success, true);
      if (result.success) {
        assert.strictEqual(result.data.query, "my search");
        assert.strictEqual(result.data.page, 5);
      }
    });

    it("should fail if page is not a valid number string", () => {
      const result = SearchQuerySchema.safeParse({
        query: "test",
        page: "abc",
      });
      assert.strictEqual(result.success, false);
    });
  });
});
