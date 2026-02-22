export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

export interface CardData {
  id: string;
  suit: Suit;
  rank: Rank;
}

export type GameStatus = 'waiting' | 'playing' | 'gameOver';
export type Turn = 'player' | 'ai';

export interface GameState {
  deck: CardData[];
  playerHand: CardData[];
  aiHand: CardData[];
  discardPile: CardData[];
  currentTurn: Turn;
  status: GameStatus;
  winner: Turn | null;
  activeSuit: Suit | null; // For when an 8 is played
  isSuitPicking: boolean;
}
