import { BoardState, SymbolType, DifficultyType } from '../types';

export const WINNING_COMBINATIONS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
  [0, 4, 8], [2, 4, 6]             // Diagonals
];

export function checkWinner(board: BoardState): { winner: SymbolType | 'draw' | null; combination?: number[] } {
  for (const comb of WINNING_COMBINATIONS) {
    const [a, b, c] = comb;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], combination: comb };
    }
  }

  if (board.every(cell => cell !== null)) {
    return { winner: 'draw' };
  }

  return { winner: null };
}

// Get all empty indices
function getEmptyIndices(board: BoardState): number[] {
  return board
    .map((cell, idx) => (cell === null ? idx : null))
    .filter((idx): idx is number => idx !== null);
}

// Minimax algorithm for perfect play
function minimax(
  board: BoardState,
  depth: number,
  isMaximizing: boolean,
  aiSymbol: SymbolType,
  playerSymbol: SymbolType
): { score: number; index: number } {
  const result = checkWinner(board);
  
  if (result.winner === aiSymbol) {
    return { score: 10 - depth, index: -1 };
  }
  if (result.winner === playerSymbol) {
    return { score: depth - 10, index: -1 };
  }
  if (result.winner === 'draw') {
    return { score: 0, index: -1 };
  }

  const emptyIndices = getEmptyIndices(board);
  let bestScore = isMaximizing ? -Infinity : Infinity;
  let bestIndex = -1;

  for (const idx of emptyIndices) {
    // Make move
    board[idx] = isMaximizing ? aiSymbol : playerSymbol;
    
    // Recurse
    const { score } = minimax(board, depth + 1, !isMaximizing, aiSymbol, playerSymbol);
    
    // Undo move
    board[idx] = null;

    if (isMaximizing) {
      if (score > bestScore) {
        bestScore = score;
        bestIndex = idx;
      }
    } else {
      if (score < bestScore) {
        bestScore = score;
        bestIndex = idx;
      }
    }
  }

  return { score: bestScore, index: bestIndex };
}

// Main AI Move Provider
export function getComputerMove(
  board: BoardState,
  aiSymbol: SymbolType,
  difficulty: DifficultyType
): number {
  const emptyIndices = getEmptyIndices(board);
  if (emptyIndices.length === 0) return -1;

  const playerSymbol: SymbolType = aiSymbol === 'X' ? 'O' : 'X';

  // 1. HARD DIFFICULTY (صعب): Always perfect minimax
  if (difficulty === 'hard') {
    const { index } = minimax([...board], 0, true, aiSymbol, playerSymbol);
    return index !== -1 ? index : emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
  }

  // 2. VERY EASY DIFFICULTY (سهل جداً):
  // 90% chance: Choose a random move.
  // 10% chance: Check if there's an immediate winning move for the AI, else random.
  if (difficulty === 'very_easy') {
    const randomRoll = Math.random();
    if (randomRoll < 0.1) {
      // Look for a direct winning move
      for (const idx of emptyIndices) {
        const boardCopy = [...board];
        boardCopy[idx] = aiSymbol;
        if (checkWinner(boardCopy).winner === aiSymbol) {
          return idx;
        }
      }
    }
    // Otherwise play random
    return emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
  }

  // 3. EASY/NORMAL DIFFICULTY (سهل):
  // A balanced match:
  // - 50% chance: Plays the optimal minimax move (blocking or winning).
  // - 50% chance: Plays a random move.
  // This feels like a clever but human-like casual opponent.
  const randomRoll = Math.random();
  if (randomRoll < 0.5) {
    // Play optimal minimax
    const { index } = minimax([...board], 0, true, aiSymbol, playerSymbol);
    return index !== -1 ? index : emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
  } else {
    // Play a random move
    return emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
  }
}
