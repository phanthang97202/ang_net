import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { Chess, Square } from 'chess.js';
import { ChessColor } from '../../../../interfaces';

interface BoardSquare {
  square: string;
  piece: string; // ký hiệu unicode quân cờ, rỗng nếu ô trống
  isLight: boolean;
  isSelected: boolean;
  isLegalTarget: boolean;
}

const PIECE_GLYPHS: Record<string, string> = {
  wk: '♔', wq: '♕', wr: '♖', wb: '♗', wn: '♘', wp: '♙',
  bk: '♚', bq: '♛', br: '♜', bb: '♝', bn: '♞', bp: '♟',
};

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

@Component({
  selector: 'app-chess-board',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './chess-board.component.html',
  styleUrl: './chess-board.component.scss',
})
export class ChessBoardComponent implements OnChanges {
  @Input({ required: true }) fen!: string;
  @Input() orientation: ChessColor = 'white';
  @Input() interactive = false;

  @Output() move = new EventEmitter<{
    from: string;
    to: string;
    promotion?: string;
  }>();

  rows: BoardSquare[][] = [];
  pendingPromotion: { from: string; to: string } | null = null;
  promotionChoices = ['q', 'r', 'b', 'n'];

  private selectedSquare: string | null = null;
  private legalTargets = new Set<string>();

  ngOnChanges(): void {
    this.selectedSquare = null;
    this.legalTargets.clear();
    this.pendingPromotion = null;
    this.buildRows();
  }

  onSquareClick(square: string): void {
    if (!this.interactive || this.pendingPromotion) return;

    const chess = new Chess(this.fen);
    const clickedPiece = chess.get(square as Square);
    const myColorCode = this.orientation === 'white' ? 'w' : 'b';

    if (this.selectedSquare) {
      if (square === this.selectedSquare) {
        this.clearSelection();
        return;
      }
      if (this.legalTargets.has(square)) {
        this.tryMove(chess, this.selectedSquare, square);
        return;
      }
      if (clickedPiece && clickedPiece.color === myColorCode) {
        this.selectSquare(chess, square);
      } else {
        this.clearSelection();
      }
      return;
    }

    if (clickedPiece && clickedPiece.color === myColorCode) {
      this.selectSquare(chess, square);
    }
  }

  choosePromotion(piece: string): void {
    if (!this.pendingPromotion) return;
    const { from, to } = this.pendingPromotion;
    this.pendingPromotion = null;
    this.move.emit({ from, to, promotion: piece });
  }

  cancelPromotion(): void {
    this.pendingPromotion = null;
    this.clearSelection();
  }

  promotionGlyph(piece: string): string {
    const colorPrefix = this.orientation === 'white' ? 'w' : 'b';
    return PIECE_GLYPHS[`${colorPrefix}${piece}`];
  }

  private tryMove(chess: Chess, from: string, to: string): void {
    const movingPiece = chess.get(from as Square);
    const isPromotion =
      movingPiece?.type === 'p' && (to[1] === '8' || to[1] === '1');

    if (isPromotion) {
      this.pendingPromotion = { from, to };
      this.selectedSquare = null;
      this.legalTargets.clear();
      this.buildRows();
      return;
    }

    this.move.emit({ from, to });
    this.clearSelection();
  }

  private selectSquare(chess: Chess, square: string): void {
    this.selectedSquare = square;
    const moves = chess.moves({ square: square as Square, verbose: true });
    this.legalTargets = new Set(moves.map(m => m.to));
    this.buildRows();
  }

  private clearSelection(): void {
    this.selectedSquare = null;
    this.legalTargets.clear();
    this.buildRows();
  }

  private buildRows(): void {
    if (!this.fen) {
      this.rows = [];
      return;
    }
    const chess = new Chess(this.fen);
    const ranks =
      this.orientation === 'white'
        ? [8, 7, 6, 5, 4, 3, 2, 1]
        : [1, 2, 3, 4, 5, 6, 7, 8];
    const files = this.orientation === 'white' ? FILES : [...FILES].reverse();

    this.rows = ranks.map(rank =>
      files.map(file => {
        const square = `${file}${rank}`;
        const piece = chess.get(square as Square);
        const fileIndex = FILES.indexOf(file);
        return {
          square,
          piece: piece ? PIECE_GLYPHS[`${piece.color}${piece.type}`] : '',
          // a1 luôn là ô tối theo quy ước bàn cờ chuẩn.
          isLight: (fileIndex + rank) % 2 === 0,
          isSelected: square === this.selectedSquare,
          isLegalTarget: this.legalTargets.has(square),
        };
      })
    );
  }
}
