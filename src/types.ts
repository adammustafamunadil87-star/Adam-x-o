export type SymbolType = 'X' | 'O';
export type PlayerType = 'human' | 'ai' | 'friend';
export type DifficultyType = 'very_easy' | 'easy' | 'hard';

export interface GameStats {
  player1Wins: number;
  player2Wins: number; // or AI wins
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
