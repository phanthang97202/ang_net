import { ChessPieceThemeService } from './chess-piece-theme.service';

describe('ChessPieceThemeService', () => {
  it('restores a saved choice and rejects unknown asset directories', () => {
    const getItem = spyOn(Storage.prototype, 'getItem').and.returnValue(
      'celtic'
    );
    expect(new ChessPieceThemeService().theme()).toBe('celtic');

    getItem.and.returnValue('../unknown');
    const preferences = new ChessPieceThemeService();
    expect(preferences.pieceUrl('b', 'n')).toBe(
      'assets/chess/pieces/chessnut/bN.svg'
    );
  });

  it('keeps theme switching usable when browser storage is blocked', () => {
    spyOn(Storage.prototype, 'getItem').and.throwError('Storage blocked');
    spyOn(Storage.prototype, 'setItem').and.throwError('Storage blocked');
    const preferences = new ChessPieceThemeService();

    expect(() => preferences.select('spatial')).not.toThrow();
    expect(preferences.pieceUrl('w', 'q')).toBe(
      'assets/chess/pieces/spatial/wQ.svg'
    );
  });
});
