import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { AntdModule } from '../../../../modules';
import { ChessGameService } from '../../../../services';

@Component({
  selector: 'app-chess-lobby',
  standalone: true,
  imports: [AntdModule, FormsModule],
  templateUrl: './chess-lobby.component.html',
  styleUrl: './chess-lobby.component.scss',
})
export class ChessLobbyComponent {
  private chessGameService = inject(ChessGameService);
  private router = inject(Router);
  private translate = inject(TranslateService);

  playerName = sessionStorage.getItem('chessPlayerName') || '';
  isCreating = false;
  errorMessage = '';

  async createRoom(): Promise<void> {
    const name = this.playerName.trim();
    if (!name) {
      this.errorMessage = this.translate.instant('T_CHESS_ERROR_NAME_REQUIRED');
      return;
    }

    this.errorMessage = '';
    this.isCreating = true;
    try {
      sessionStorage.setItem('chessPlayerName', name);
      await this.chessGameService.connect();
      const roomId = await this.chessGameService.createRoom(name);
      this.router.navigate(['/game/chess', roomId], {
        state: { role: 'host', playerName: name },
      });
    } catch (err: any) {
      this.errorMessage =
        err?.message || this.translate.instant('T_CHESS_ERROR_CREATE_FAILED');
    } finally {
      this.isCreating = false;
    }
  }
}
