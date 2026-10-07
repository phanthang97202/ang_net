import { Injectable, signal } from '@angular/core';

export const CHESS_PIECE_THEMES = [
  { id: 'chessnut', name: 'Chessnut', description: 'T_CHESS_SET_CHESSNUT' },
  { id: 'spatial', name: 'Spatial', description: 'T_CHESS_SET_SPATIAL' },
  { id: 'celtic', name: 'Celtic', description: 'T_CHESS_SET_CELTIC' },
] as const;

export type ChessPieceTheme = (typeof CHESS_PIECE_THEMES)[number]['id'];

@Injectable({ providedIn: 'root' })
export class ChessPieceThemeService {
  private readonly storageKey = 'chessPieceTheme';
  private readonly selectedTheme = signal<ChessPieceTheme>(this.loadTheme());
  readonly theme = this.selectedTheme.asReadonly();

  select(theme: ChessPieceTheme): void {
    this.selectedTheme.set(theme);
    try {
      localStorage.setItem(this.storageKey, theme);
    } catch {
      // Keep the selection usable when browser storage is unavailable.
    }
  }

  pieceUrl(color: 'w' | 'b', piece: string, theme = this.theme()): string {
    return `assets/chess/pieces/${theme}/${color}${piece.toUpperCase()}.svg`;
  }

  private loadTheme(): ChessPieceTheme {
    try {
      const saved = localStorage.getItem(this.storageKey);
      return (
        CHESS_PIECE_THEMES.find(theme => theme.id === saved)?.id || 'chessnut'
      );
    } catch {
      return 'chessnut';
    }
  }
}
