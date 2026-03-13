/**
 * Simple User Registry using Map
 */
export class UserRegistry {
  private users: Map<number, string> = new Map();

  addUser(id: number, name: string): void {
    this.users.set(id, name);
  }

  getUser(id: number): string | undefined {
    return this.users.get(id);
  }

  removeUser(id: number): boolean {
    return this.users.delete(id);
  }

  hasUser(id: number): boolean {
    return this.users.has(id);
  }

  get totalUsers(): number {
    return this.users.size;
  }

  clearRegistry(): void {
    this.users.clear();
  }

  getAllUserNames(): string[] {
    return Array.from(this.users.values());
  }

  getAllUserIds(): number[] {
    return Array.from(this.users.keys());
  }
}
