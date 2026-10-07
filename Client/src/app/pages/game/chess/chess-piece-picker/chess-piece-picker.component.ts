import { CommonModule } from '@angular/common';
import { Component, inject, Input } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import {
  CHESS_PIECE_THEMES,
  ChessPieceThemeService,
} from '../chess-piece-theme.service';

@Component({
  selector: 'app-chess-piece-picker',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './chess-piece-picker.component.html',
  styleUrl: './chess-piece-picker.component.scss',
})
export class ChessPiecePickerComponent {
  @Input() compact = false;
  readonly themes = CHESS_PIECE_THEMES;
  readonly preferences = inject(ChessPieceThemeService);
}
