import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ChinesePinyinInputService {
  private engine?: Promise<{ candidates: (query: string) => readonly string[]; words: (text: string) => { Word: string; Pinyin: string; Meaning: string }[] }>;

  private load(): Promise<{ candidates: (query: string) => readonly string[]; words: (text: string) => { Word: string; Pinyin: string; Meaning: string }[] }> {
    if (!this.engine) {
      this.engine = import('@kensio/pinyinjs').then(async library => {
        const files = library.fetchSource(new URL('assets/pinyin', document.baseURI).href);
        const source = { ...files, text: (name: string) => files.text(name === 'script.map' ? 'script-data.txt' : name) };
        const [dictionary, tables] = await Promise.all([
          library.loadDictionary(source, 'standard'),
          library.loadScriptTables(source),
        ]);
        const index = library.ReverseIndex.of(dictionary);
        return {
          candidates: (query: string) => library.candidates(index, query, { limit: 30, script: { prefer: 'Hans', tables } }),
          words: (text: string) => {
            const seen = new Set<string>();
            return library.segment(dictionary, text).filter(part => {
              if (!/^[\p{Script=Han}]+$/u.test(part.text) || part.text.length > 60 || seen.has(part.text)) return false;
              seen.add(part.text); return true;
            }).map(part => ({ Word: part.text, Pinyin: part.isKnown ? library.convert(dictionary, part.text, { capitals: 'none' }) : '', Meaning: '' }));
          },
        };
      }).catch(error => { this.engine = undefined; throw error; });
    }
    return this.engine;
  }

  async candidates(query: string): Promise<readonly string[]> {
    const normalized = query.trim();
    if (!normalized) return [];
    return (await this.load()).candidates(normalized);
  }

  async words(text: string): Promise<{ Word: string; Pinyin: string; Meaning: string }[]> {
    return (await this.load()).words(text);
  }
}
