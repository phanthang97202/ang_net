import { MusicShuffle } from './music-shuffle';

describe('MusicShuffle', () => {
  it('plays every other track before repeating, and does not repeat the current track at a cycle boundary', () => {
    const shuffle = new MusicShuffle(() => 0);
    const ids = ['a', 'b', 'c', 'd'];
    let current = 'a';
    const played = [current];
    for (let i = 0; i < 3; i++) {
      current = shuffle.next(ids, current)!;
      played.push(current);
    }
    expect(new Set(played).size).toBe(4);
    expect(shuffle.next(ids, current)).not.toBe(current);
  });

  it('returns to tracks actually played when navigating backwards', () => {
    const shuffle = new MusicShuffle(() => 0);
    const ids = ['a', 'b', 'c'];
    const first = shuffle.next(ids, 'a')!;
    const second = shuffle.next(ids, first)!;
    expect(shuffle.previous(ids, second)).toBe(first);
    expect(shuffle.previous(ids, first)).toBe('a');
  });

  it('resets its history when the search results or collection change', () => {
    const shuffle = new MusicShuffle(() => 0);
    shuffle.next(['a', 'b'], 'a');
    expect(shuffle.previous(['x', 'y'], 'x')).toBe('y');
    expect(shuffle.next(['x', 'y'], 'x')).toBe('y');
    expect(shuffle.next([], undefined)).toBeUndefined();
    expect(shuffle.next(['x'], 'x')).toBe('x');
  });
});
