export class Vault {
  /**
   * Public property accessible from anywhere.
   */
  public readonly owner: string;

  /**
   * Private property using TypeScript 'private' modifier.
   * Only accessible within this class.
   */
  private secretKey: string;

  /**
   * Private property using ECMAScript private fields syntax (#).
   * Truly private even at runtime.
   */
  #balance: number = 0;

  constructor(owner: string, secretKey: string) {
    this.owner = owner;
    this.secretKey = secretKey;
  }

  /**
   * Public method to deposit funds.
   */
  public deposit(amount: number): void {
    if (amount <= 0) {
      throw new Error("Vault.ts error: Deposit amount must be positive");
    }
    this.#balance += amount;
  }

  /**
   * Public method to withdraw funds, requires the secret key.
   */
  public withdraw(amount: number, key: string): number {
    this.#validateKey(key);

    if (amount > this.#balance) {
      throw new Error("Vault.ts error: Insufficient balance");
    }

    this.#balance -= amount;
    return amount;
  }

  /**
   * Public method to check balance, requires the secret key.
   */
  public getBalance(key: string): number {
    this.#validateKey(key);
    return this.#balance;
  }

  /**
   * Private helper method.
   */
  #validateKey(key: string): void {
    if (key !== this.secretKey) {
      throw new Error("Vault.ts error: Invalid secret key");
    }
  }
}
