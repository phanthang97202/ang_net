import { TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { Chess } from 'chess.js';
import { ChessBoardComponent } from './chess-board.component';
import { ChessPieceThemeService } from '../chess-piece-theme.service';

describe('Chess board piece themes', () => {
  beforeEach(async () => {
    spyOn(Storage.prototype, 'getItem').and.returnValue(null);
    spyOn(Storage.prototype, 'setItem');
    await TestBed.configureTestingModule({
      imports: [ChessBoardComponent, TranslateModule.forRoot()],
    }).compileComponents();
  });

  it('preserves a selected piece and its legal move when the set changes', () => {
    const fixture = TestBed.createComponent(ChessBoardComponent);
    fixture.componentRef.setInput('fen', new Chess().fen());
    fixture.componentRef.setInput('interactive', true);
    fixture.detectChanges();
    const board = fixture.componentInstance;
    const emit = spyOn(board.move, 'emit');

    board.onSquareClick('e2');
    TestBed.inject(ChessPieceThemeService).select('celtic');
    fixture.detectChanges();

    expect(
      fixture.nativeElement
        .querySelector('.chess-board__square--selected img')
        .getAttribute('src')
    ).toBe('assets/chess/pieces/celtic/wP.svg');
    board.onSquareClick('e4');
    expect(emit).toHaveBeenCalledOnceWith({ from: 'e2', to: 'e4' });
  });

  it('updates an open promotion picker without losing the pending move', () => {
    const fixture = TestBed.createComponent(ChessBoardComponent);
    fixture.componentRef.setInput('fen', '7k/P7/8/8/8/8/8/7K w - - 0 1');
    fixture.componentRef.setInput('interactive', true);
    fixture.detectChanges();
    const board = fixture.componentInstance;
    const emit = spyOn(board.move, 'emit');
    board.onSquareClick('a7');
    board.onSquareClick('a8');

    TestBed.inject(ChessPieceThemeService).select('spatial');
    fixture.detectChanges();
    const images = Array.from(
      fixture.nativeElement.querySelectorAll('.chess-board__promotion-btn img')
    ) as HTMLImageElement[];
    expect(images.map(image => image.getAttribute('src'))).toEqual(
      ['Q', 'R', 'B', 'N'].map(
        piece => `assets/chess/pieces/spatial/w${piece}.svg`
      )
    );
    board.choosePromotion('n');
    expect(emit).toHaveBeenCalledOnceWith({
      from: 'a7',
      to: 'a8',
      promotion: 'n',
    });
  });
});
