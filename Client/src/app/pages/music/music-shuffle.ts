/** Keeps shuffled playback within the current list and remembers previous songs. */
export class MusicShuffle {
  private remaining: string[] = [];
  private history: string[] = [];
  private signature = '';

  constructor(private readonly random: () => number = Math.random) {}

  reset(): void {
    this.remaining = [];
    this.history = [];
    this.signature = '';
  }

  next(ids: string[], current: string | undefined): string | undefined {
    this.sync(ids);
    if (!ids.length) return undefined;
    this.remaining = this.remaining.filter(id => id !== current);
    if (!this.remaining.length)
      this.remaining = ids.filter(id => id !== current);
    if (!this.remaining.length) return ids[0];
    const index = Math.floor(this.random() * this.remaining.length);
    const [next] = this.remaining.splice(index, 1);
    if (current && ids.includes(current)) this.history.push(current);
    return next;
  }

  previous(ids: string[], current: string | undefined): string | undefined {
    this.sync(ids);
    while (this.history.length) {
      const previous = this.history.pop()!;
      if (previous !== current && ids.includes(previous)) return previous;
    }
    const index = current ? ids.indexOf(current) : -1;
    return ids.length ? ids[(index <= 0 ? ids.length : index) - 1] : undefined;
  }

  private sync(ids: string[]): void {
    const signature = JSON.stringify(ids);
    if (signature !== this.signature) {
      this.signature = signature;
      this.remaining = [];
      this.history = [];
    }
  }
}
