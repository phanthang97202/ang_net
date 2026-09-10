import { Chess, Move } from 'chess.js';

export type AiLevel = 'easy' | 'medium' | 'hard';

const DEPTH_BY_LEVEL: Record<AiLevel, number> = { easy: 1, medium: 2, hard: 3 };

const PIECE_VALUES: Record<string, number> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 0,
};

function evaluateBoard(chess: Chess): number {
  let score = 0;
  for (const row of chess.board()) {
    for (const piece of row) {
      if (!piece) continue;
      const value = PIECE_VALUES[piece.type];
      score += piece.color === 'w' ? value : -value;
    }
  }
  return score;
}

function minimax(
  chess: Chess,
  depth: number,
  alpha: number,
  beta: number,
  maximizing: boolean
): number {
  if (depth === 0 || chess.isGameOver()) {
    if (chess.isCheckmate()) return maximizing ? -100000 : 100000;
    if (chess.isDraw()) return 0;
    return evaluateBoard(chess);
  }

  const moves = chess.moves({ verbose: true });
  let best = maximizing ? -Infinity : Infinity;

  for (const move of moves) {
    chess.move(move);
    const score = minimax(chess, depth - 1, alpha, beta, !maximizing);
    chess.undo();

    if (maximizing) {
      best = Math.max(best, score);
      alpha = Math.max(alpha, best);
    } else {
      best = Math.min(best, score);
      beta = Math.min(beta, best);
    }
    if (beta <= alpha) break;
  }

  return best;
}

export interface AiMove {
  from: string;
  to: string;
  promotion?: string;
}

// Tính nước đi cho máy dựa trên FEN hiện tại. "easy" đi ngẫu nhiên (yếu, dễ
// thắng), "medium"/"hard" dùng minimax + alpha-beta với độ sâu 2/3.
export function getBestMove(fen: string, level: AiLevel): AiMove | null {
  const chess = new Chess(fen);
  const moves = chess.moves({ verbose: true });
  if (moves.length === 0) return null;

  if (level === 'easy') {
    const move = moves[Math.floor(Math.random() * moves.length)];
    return { from: move.from, to: move.to, promotion: move.promotion };
  }

  const depth = DEPTH_BY_LEVEL[level];
  const maximizing = chess.turn() === 'w';
  let bestMove: Move | null = null;
  let bestScore = maximizing ? -Infinity : Infinity;

  // Xáo thứ tự để máy không luôn chọn y hệt nước đầu tiên khi điểm bằng nhau.
  const shuffled = [...moves].sort(() => Math.random() - 0.5);

  for (const move of shuffled) {
    chess.move(move);
    const score = minimax(chess, depth - 1, -Infinity, Infinity, !maximizing);
    chess.undo();

    if (maximizing ? score > bestScore : score < bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  if (!bestMove) return null;
  return { from: bestMove.from, to: bestMove.to, promotion: bestMove.promotion };
}
