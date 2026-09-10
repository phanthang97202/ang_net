export type ChessColor = 'white' | 'black';

export type ChessRoomStatus =
  | 'WaitingForOpponent'
  | 'WaitingForReady'
  | 'Playing'
  | 'Finished';

export interface IChessRoomState {
  roomId: string;
  player1Name: string;
  player1Ready: boolean;
  player2Name: string;
  player2Ready: boolean;
  status: ChessRoomStatus;
  fen: string;
}
