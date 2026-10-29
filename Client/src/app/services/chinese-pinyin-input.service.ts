import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ChinesePinyinInputService {
  private engine?: Promise<(query: string) => readonly string[]>;

  private load(): Promise<(query: string) => readonly string[]> {
    if (!this.engine) {
      this.engine = import('@kensio/pinyinjs').then(async library => {
        const files = library.fetchSource(new URL('assets/pinyin', document.baseURI).href);
        const source = { ...files, text: (name: string) => files.text(name === 'script.map' ? 'script-data.txt' : name) };
        const [dictionary, tables] = await Promise.all([
          library.loadDictionary(source, 'standard'),
          library.loadScriptTables(source),
        ]);
        const index = library.ReverseIndex.of(dictionary);
        return (query: string) => library.candidates(index, query, { limit: 30, script: { prefer: 'Hans', tables } });
      }).catch(error => { this.engine = undefined; throw error; });
    }
    return this.engine;
  }

  async candidates(query: string): Promise<readonly string[]> {
    const normalized = query.trim();
    if (!normalized) return [];
    const lookup = await this.load();
    return lookup(normalized);
  }
}
