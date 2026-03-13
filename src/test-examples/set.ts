/**
 * Simple Tag Manager using Set
 */
export class TagManager {
  private tags: Set<string> = new Set();

  addTag(tag: string): void {
    this.tags.add(tag.toLowerCase().trim());
  }

  hasTag(tag: string): boolean {
    return this.tags.has(tag.toLowerCase().trim());
  }

  removeTag(tag: string): boolean {
    return this.tags.delete(tag.toLowerCase().trim());
  }

  get count(): number {
    return this.tags.size;
  }

  clear(): void {
    this.tags.clear();
  }

  getTags(): string[] {
    return Array.from(this.tags);
  }

  getIntersection(otherTags: string[]): string[] {
    const common = new Set<string>();
    for (const tag of otherTags) {
      const normalized = tag.toLowerCase().trim();
      if (this.tags.has(normalized)) {
        common.add(normalized);
      }
    }
    return Array.from(common);
  }
}
