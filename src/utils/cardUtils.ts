import { CardData, Suit, Rank } from '../types';
import { SUITS, RANKS } from '../constants';

export const createDeck = (): CardData[] => {
  const deck: CardData[] = [];
  SUITS.forEach((suit) => {
    RANKS.forEach((rank) => {
      deck.push({
        id: `${rank}-${suit}`,
        suit,
        rank,
      });
    });
  });
  return deck;
};

export const shuffle = (deck: CardData[]): CardData[] => {
  const newDeck = [...deck];
  for (let i = newDeck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
  }
  return newDeck;
};

export const canPlayCard = (card: CardData, topCard: CardData, activeSuit: Suit | null): boolean => {
  // 8 is always playable
  if (card.rank === '8') return true;

  // If an 8 was played, we must match the active suit
  if (activeSuit) {
    return card.suit === activeSuit || card.rank === topCard.rank;
  }

  // Otherwise match suit or rank
  return card.suit === topCard.suit || card.rank === topCard.rank;
};
