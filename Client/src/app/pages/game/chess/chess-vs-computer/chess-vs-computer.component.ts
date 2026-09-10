import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Chess } from 'chess.js';
import { AntdModule } from '../../../../modules';
import { ChessColor } from '../../../../interfaces';
import { ChessBoardComponent } from '../chess-board/chess-board.component';
import { AiLevel, getBestMove } from '../chess-ai';

type GameResult = 'win' | 'lose' | 'draw' | null;

@Component({
  selector: 'app-chess-vs-computer',
  standalone: true,
  imports: [AntdModule, FormsModule, ChessBoardComponent],
  templateUrl: './chess-vs-computer.component.html',
  styleUrl: './chess-vs-computer.component.scss',
})
export class ChessVsComputerComponent {
  private router = inject(Router);
  private translate = inject(TranslateService);

  started = false;
  playerColor: ChessColor = 'white';
  difficulty: AiLevel = 'medium';

  chess = new Chess();
  gameResult: GameResult = null;
  isThinking = false;

  get canMove(): boolean {
    if (!this.started || this.gameResult || this.isThinking) return false;
    return this.chess.turn() === (this.playerColor === 'white' ? 'w' : 'b');
  }

  get isMyTurn(): boolean {
    return this.canMove;
  }

  get resultKey(): string {
    return `T_CHESS_RESULT_${(this.gameResult || 'draw').toUpperCase()}`;
  }

  startGame(): void {
    this.started = true;
    this.chess = new Chess();
    this.gameResult = null;
    this.isThinking = false;

    if (this.playerColor === 'black') {
      this.triggerAiMove();
    }
  }

  onLocalMove(m: { from: string; to: string; promotion?: string }): void {
    const result = this.chess.move({
      from: m.from,
      to: m.to,
      promotion: m.promotion as any,
    });
    if (!result) return;

    if (this.checkGameOver()) return;
    this.triggerAiMove();
  }

  resign(): void {
    if (!confirm(this.translate.instant('T_CHESS_RESIGN_CONFIRM'))) return;
    this.gameResult = 'lose';
  }

  playAgain(): void {
    this.started = false;
    this.gameResult = null;
  }

  backToLobby(): void {
    this.router.navigate(['/game/chess']);
  }

  private triggerAiMove(): void {
    this.isThinking = true;
    setTimeout(() => {
      const move = getBestMove(this.chess.fen(), this.difficulty);
      if (move) {
        this.chess.move(move);
      }
      this.isThinking = false;
      this.checkGameOver();
    }, 300);
  }

  private checkGameOver(): boolean {
    if (!this.chess.isGameOver()) return false;

    if (this.chess.isCheckmate()) {
      const winner: ChessColor = this.chess.turn() === 'w' ? 'black' : 'white';
      this.gameResult = winner === this.playerColor ? 'win' : 'lose';
    } else {
      this.gameResult = 'draw';
    }
    return true;
  }
}
