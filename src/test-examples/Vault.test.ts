import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { Vault } from "./Vault.ts";

/**
 * /bin/bash ts.sh --test src/test-examples/Vault.test.ts
 */
describe("Vault", () => {
  const OWNER = "Alice";
  const KEY = "secure-password-123";

  it("should initialize with correct owner", () => {
    const vault = new Vault(OWNER, KEY);
    assert.strictEqual(vault.owner, OWNER);
  });

  it("should allow depositing funds", () => {
    const vault = new Vault(OWNER, KEY);
    vault.deposit(100);
    assert.strictEqual(vault.getBalance(KEY), 100);
  });

  it("should throw error when depositing non-positive amount", () => {
    const vault = new Vault(OWNER, KEY);
    assert.throws(() => vault.deposit(0), {
      message: "Vault.ts error: Deposit amount must be positive",
    });
    assert.throws(() => vault.deposit(-50), {
      message: "Vault.ts error: Deposit amount must be positive",
    });
  });

  it("should allow withdrawing funds with correct key", () => {
    const vault = new Vault(OWNER, KEY);
    vault.deposit(200);
    const withdrawn = vault.withdraw(50, KEY);
    assert.strictEqual(withdrawn, 50);
    assert.strictEqual(vault.getBalance(KEY), 150);
  });

  it("should throw error when withdrawing with incorrect key", () => {
    const vault = new Vault(OWNER, KEY);
    vault.deposit(100);
    assert.throws(() => vault.withdraw(50, "wrong-key"), {
      message: "Vault.ts error: Invalid secret key",
    });
  });

  it("should throw error when withdrawing more than balance", () => {
    const vault = new Vault(OWNER, KEY);
    vault.deposit(100);
    assert.throws(() => vault.withdraw(150, KEY), {
      message: "Vault.ts error: Insufficient balance",
    });
  });

  it("should protect balance access without correct key", () => {
    const vault = new Vault(OWNER, KEY);
    vault.deposit(100);
    assert.throws(() => vault.getBalance("invalid"), {
      message: "Vault.ts error: Invalid secret key",
    });
  });
});
