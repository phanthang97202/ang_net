import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Chess } from 'chess.js';
import { AntdModule } from '../../../../modules';
import { ChessGameService } from '../../../../services';
import { ChessColor, ChessRoomStatus, IChessRoomState } from '../../../../interfaces';
import { ChessBoardComponent } from '../chess-board/chess-board.component';

type GameResult = 'win' | 'lose' | 'draw' | null;
type LeaveReason = 'resign' | 'disconnected' | 'left';

@Component({
  selector: 'app-chess-room',
  standalone: true,
  imports: [AntdModule, FormsModule, ChessBoardComponent],
  templateUrl: './chess-room.component.html',
  styleUrl: './chess-room.component.scss',
})
export class ChessRoomComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private chessGameService = inject(ChessGameService);
  private translate = inject(TranslateService);

  roomId = '';
  myColor: ChessColor = 'white';
  joined = false;
  playerNameInput = sessionStorage.getItem('chessPlayerName') || '';
  isJoining = false;
  joinError = '';

  state: IChessRoomState | null = null;
  chess = new Chess();
  gameResult: GameResult = null;
  opponentLeftMessage = '';
  copyFeedback = false;

  ngOnInit(): void {
    this.roomId = this.route.snapshot.paramMap.get('roomId') || '';

    this.chessGameService.onRoomStateChanged(this.handleRoomStateBound);
    this.chessGameService.onMoveReceived(this.handleMoveReceivedBound);
    this.chessGameService.onOpponentLeft(this.handleOpponentLeftBound);

    const navState = history.state as { role?: 'host' | 'guest'; playerName?: string } | undefined;
    if (navState?.role === 'host') {
      this.myColor = 'white';
      this.joined = true;
      this.state = {
        roomId: this.roomId,
        player1Name: navState.playerName || this.playerNameInput,
        player1Ready: false,
        player2Name: '',
        player2Ready: false,
        status: 'WaitingForOpponent',
        fen: 'start',
      };
    } else {
      this.myColor = 'black';
      this.joined = false;
    }
  }

  ngOnDestroy(): void {
    this.chessGameService.offRoomStateChanged(this.handleRoomStateBound);
    this.chessGameService.offMoveReceived(this.handleMoveReceivedBound);
    this.chessGameService.offOpponentLeft(this.handleOpponentLeftBound);
  }

  get inviteLink(): string {
    return `${location.origin}/game/chess/${this.roomId}`;
  }

  get myName(): string {
    if (!this.state) return '';
    return this.myColor === 'white' ? this.state.player1Name : this.state.player2Name;
  }

  get myReady(): boolean {
    if (!this.state) return false;
    return this.myColor === 'white' ? this.state.player1Ready : this.state.player2Ready;
  }

  get opponentName(): string {
    if (!this.state) return '';
    return this.myColor === 'white' ? this.state.player2Name : this.state.player1Name;
  }

  get opponentReady(): boolean {
    if (!this.state) return false;
    return this.myColor === 'white' ? this.state.player2Ready : this.state.player1Ready;
  }

  get canMove(): boolean {
    if (!this.state || this.state.status !== 'Playing' || this.gameResult) return false;
    return this.chess.turn() === (this.myColor === 'white' ? 'w' : 'b');
  }

  get isMyTurn(): boolean {
    return this.canMove;
  }

  get resultKey(): string {
    return `T_CHESS_RESULT_${(this.gameResult || 'draw').toUpperCase()}`;
  }

  async joinRoom(): Promise<void> {
    const name = this.playerNameInput.trim();
    if (!name) {
      this.joinError = this.translate.instant('T_CHESS_ERROR_NAME_REQUIRED');
      return;
    }

    this.joinError = '';
    this.isJoining = true;
    try {
      sessionStorage.setItem('chessPlayerName', name);
      await this.chessGameService.connect();
      await this.chessGameService.joinRoom(this.roomId, name);
      this.joined = true;
    } catch (err: any) {
      this.joinError = err?.message || this.translate.instant('T_CHESS_ERROR_JOIN_FAILED');
    } finally {
      this.isJoining = false;
    }
  }

  setReady(): void {
    this.chessGameService.setReady(this.roomId);
  }

  onLocalMove(m: { from: string; to: string; promotion?: string }): void {
    const result = this.chess.move({
      from: m.from,
      to: m.to,
      promotion: m.promotion as any,
    });
    if (!result) return;

    this.chessGameService.sendMove(this.roomId, this.chess.fen(), result.san);
    this.checkGameOver();
  }

  resign(): void {
    if (!confirm(this.translate.instant('T_CHESS_RESIGN_CONFIRM'))) return;
    this.chessGameService.resign(this.roomId);
    this.gameResult = 'lose';
  }

  backToLobby(): void {
    this.router.navigate(['/game/chess']);
  }

  async copyInviteLink(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.inviteLink);
      this.copyFeedback = true;
      setTimeout(() => (this.copyFeedback = false), 2000);
    } catch {
      // Clipboard API không khả dụng (vd. http không an toàn) - link vẫn hiện để copy tay.
    }
  }

  private handleRoomStateBound = (
    roomId: string,
    player1Name: string,
    player1Ready: boolean,
    player2Name: string,
    player2Ready: boolean,
    status: ChessRoomStatus,
    fen: string
  ): void => {
    if (roomId !== this.roomId) return;

    const wasPlaying = this.state?.status === 'Playing';
    this.state = {
      roomId: this.roomId,
      player1Name,
      player1Ready,
      player2Name,
      player2Ready,
      status,
      fen,
    };
    this.opponentLeftMessage = '';

    if (status === 'Playing' && !wasPlaying) {
      this.chess = new Chess();
      this.gameResult = null;
    }
  };

  private handleMoveReceivedBound = (fen: string): void => {
    this.chess = new Chess(fen);
    this.checkGameOver();
  };

  private handleOpponentLeftBound = (reason: LeaveReason): void => {
    if (reason === 'left') {
      this.opponentLeftMessage = this.translate.instant('T_CHESS_OPPONENT_LEFT');
      return;
    }
    this.gameResult = 'win';
    this.opponentLeftMessage = this.translate.instant(
      reason === 'resign' ? 'T_CHESS_OPPONENT_RESIGNED' : 'T_CHESS_OPPONENT_DISCONNECTED'
    );
  };

  private checkGameOver(): void {
    if (!this.chess.isGameOver()) return;

    if (this.chess.isCheckmate()) {
      const winner: ChessColor = this.chess.turn() === 'w' ? 'black' : 'white';
      this.gameResult = winner === this.myColor ? 'win' : 'lose';
    } else {
      this.gameResult = 'draw';
    }
  }
}
