export type SymbolType = 'X' | 'O';
export type PlayerType = 'human' | 'ai' | 'friend' | 'online';
export type DifficultyType = 'very_easy' | 'easy' | 'hard';

export interface UserProfile {
  name: string;
  email?: string;
  picture?: string;
  isLoggedIn: boolean;
}

export interface GameStats {
  player1Wins: number;
  player2Wins: number; // or AI wins / Opponent wins
  draws: number;
}

export interface GameSettingsState {
  mode: PlayerType;
  difficulty: DifficultyType;
  userSymbol: SymbolType;
  firstPlayer: 'user' | 'opponent' | 'random';
  player1Name: string;
  player2Name: string;
}

export type BoardState = (SymbolType | null)[];

export interface WinningLine {
  indices: number[];
  direction: 'horizontal' | 'vertical' | 'diagonal-left' | 'diagonal-right';
}

export interface OnlineRoomState {
  id: string;
  players: {
    id: string;
    name: string;
    picture?: string;
    symbol: 'X' | 'O';
  }[];
  board: BoardState;
  turn: 'X' | 'O';
  gameOver: boolean;
  winner: 'X' | 'O' | 'draw' | null;
}

