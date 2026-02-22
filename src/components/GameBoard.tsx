import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CardData, GameState, Suit, Turn } from '../types';
import { createDeck, shuffle, canPlayCard } from '../utils/cardUtils';
import { Card } from './Card';
import { SuitPicker } from './SuitPicker';
import { SUIT_SYMBOLS, SUIT_COLORS } from '../constants';
import { cn } from '../utils/cn';
import { Trophy, RotateCcw, Info, User, Bot, Layers } from 'lucide-react';
import confetti from 'canvas-confetti';

export const GameBoard: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    deck: [],
    playerHand: [],
    aiHand: [],
    discardPile: [],
    currentTurn: 'player',
    status: 'waiting',
    winner: null,
    activeSuit: null,
    isSuitPicking: false,
  });

  const [message, setMessage] = useState<string>("Welcome to Tina Crazy 8s!");

  const initGame = useCallback(() => {
    const fullDeck = shuffle(createDeck());
    const playerHand = fullDeck.splice(0, 8);
    const aiHand = fullDeck.splice(0, 8);
    
    // Ensure the first discard isn't an 8 for simplicity, or just handle it
    let discardIndex = 0;
    while (fullDeck[discardIndex].rank === '8') {
      discardIndex++;
    }
    const discardPile = [fullDeck.splice(discardIndex, 1)[0]];
    
    setGameState({
      deck: fullDeck,
      playerHand,
      aiHand,
      discardPile,
      currentTurn: 'player',
      status: 'playing',
      winner: null,
      activeSuit: null,
      isSuitPicking: false,
    });
    setMessage("Your turn! Match the card or play an 8.");
  }, []);

  useEffect(() => {
    if (gameState.status === 'waiting') {
      initGame();
    }
  }, [gameState.status, initGame]);

  const checkWinner = useCallback((state: GameState) => {
    if (state.playerHand.length === 0) {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 }
      });
      return 'player';
    }
    if (state.aiHand.length === 0) return 'ai';
    return null;
  }, []);

  const handlePlayCard = (card: CardData, isPlayer: boolean) => {
    if (gameState.status !== 'playing') return;
    if (isPlayer && gameState.currentTurn !== 'player') return;
    if (!isPlayer && gameState.currentTurn !== 'ai') return;

    const topCard = gameState.discardPile[gameState.discardPile.length - 1];
    if (!canPlayCard(card, topCard, gameState.activeSuit)) return;

    const newHand = isPlayer 
      ? gameState.playerHand.filter(c => c.id !== card.id)
      : gameState.aiHand.filter(c => c.id !== card.id);

    const newState: GameState = {
      ...gameState,
      [isPlayer ? 'playerHand' : 'aiHand']: newHand,
      discardPile: [...gameState.discardPile, card],
      activeSuit: null, // Reset active suit after a play
    };

    const winner = checkWinner(newState);
    if (winner) {
      setGameState({ ...newState, status: 'gameOver', winner });
      setMessage(winner === 'player' ? "You won! 🎉" : "AI won! Better luck next time.");
      return;
    }

    if (card.rank === '8') {
      if (isPlayer) {
        setGameState({ ...newState, isSuitPicking: true });
        setMessage("Crazy 8! Choose a new suit.");
      } else {
        // AI picks suit
        const suits = newHand.map(c => c.suit);
        const mostCommonSuit = suits.sort((a,b) =>
          suits.filter(v => v===a).length - suits.filter(v => v===b).length
        ).pop() || card.suit;
        
        setGameState({ 
          ...newState, 
          activeSuit: mostCommonSuit as Suit, 
          currentTurn: 'player' 
        });
        setMessage(`AI played an 8 and chose ${mostCommonSuit}! Your turn.`);
      }
    } else {
      setGameState({ ...newState, currentTurn: isPlayer ? 'ai' : 'player' });
      setMessage(isPlayer ? "AI is thinking..." : "Your turn!");
    }
  };

  const handleDrawCard = (isPlayer: boolean) => {
    if (gameState.status !== 'playing') return;
    if (isPlayer && gameState.currentTurn !== 'player') return;
    if (!isPlayer && gameState.currentTurn !== 'ai') return;

    if (gameState.deck.length === 0) {
      setMessage("Deck is empty! Turn skipped.");
      setGameState(prev => ({ ...prev, currentTurn: isPlayer ? 'ai' : 'player' }));
      return;
    }

    const newDeck = [...gameState.deck];
    const drawnCard = newDeck.pop()!;
    const newHand = isPlayer 
      ? [...gameState.playerHand, drawnCard]
      : [...gameState.aiHand, drawnCard];

    const topCard = gameState.discardPile[gameState.discardPile.length - 1];
    const canPlayDrawn = canPlayCard(drawnCard, topCard, gameState.activeSuit);

    if (isPlayer) {
      if (canPlayDrawn) {
        setMessage("You drew a playable card!");
      } else {
        setMessage("No playable card drawn. Passing turn.");
      }
      setGameState(prev => ({
        ...prev,
        deck: newDeck,
        playerHand: newHand,
        // If they can play it, we don't auto-pass, let them click it
        // If they can't, we pass
        currentTurn: canPlayDrawn ? 'player' : 'ai'
      }));
    } else {
      // AI logic for drawing
      setGameState(prev => ({
        ...prev,
        deck: newDeck,
        aiHand: newHand,
      }));
      
      // If AI can play the drawn card, it will do so in the useEffect AI turn handler
    }
  };

  const handleSuitSelect = (suit: Suit) => {
    setGameState(prev => ({
      ...prev,
      activeSuit: suit,
      isSuitPicking: false,
      currentTurn: 'ai'
    }));
    setMessage(`You chose ${suit}. AI is thinking...`);
  };

  // AI Turn Logic
  useEffect(() => {
    if (gameState.status === 'playing' && gameState.currentTurn === 'ai' && !gameState.isSuitPicking) {
      const timer = setTimeout(() => {
        const topCard = gameState.discardPile[gameState.discardPile.length - 1];
        const playableCards = gameState.aiHand.filter(c => canPlayCard(c, topCard, gameState.activeSuit));

        if (playableCards.length > 0) {
          // Prefer non-8s
          const nonEights = playableCards.filter(c => c.rank !== '8');
          const cardToPlay = nonEights.length > 0 
            ? nonEights[Math.floor(Math.random() * nonEights.length)]
            : playableCards[0];
          
          handlePlayCard(cardToPlay, false);
        } else {
          handleDrawCard(false);
          // After drawing, check if AI can play the new card
          // We'll let the next effect cycle handle it by just updating the turn if it can't play
        }
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [gameState.currentTurn, gameState.status, gameState.aiHand, gameState.discardPile, gameState.activeSuit]);

  // Secondary AI check after drawing
  useEffect(() => {
    if (gameState.status === 'playing' && gameState.currentTurn === 'ai') {
      const topCard = gameState.discardPile[gameState.discardPile.length - 1];
      const playableCards = gameState.aiHand.filter(c => canPlayCard(c, topCard, gameState.activeSuit));
      
      // If AI just drew and still can't play, pass turn
      // This is a bit tricky to detect without a "justDrew" flag, 
      // but we can check if it has no playable cards and it's still its turn
      if (playableCards.length === 0 && gameState.currentTurn === 'ai') {
        const timer = setTimeout(() => {
          setGameState(prev => ({ ...prev, currentTurn: 'player' }));
          setMessage("AI had to draw and pass. Your turn!");
        }, 1000);
        return () => clearTimeout(timer);
      }
    }
  }, [gameState.aiHand.length, gameState.currentTurn]);

  const topDiscard = gameState.discardPile[gameState.discardPile.length - 1];

  return (
    <div className="min-h-screen bg-transparent text-ink p-4 sm:p-8 font-serif overflow-hidden flex flex-col relative">
      {/* Decorative Stamp */}
      <div className="absolute top-12 right-12 w-16 h-16 border-4 border-vermilion flex items-center justify-center rotate-12 opacity-40 pointer-events-none select-none">
        <span className="text-vermilion font-bold text-2xl leading-none">瘋狂<br/>八点</span>
      </div>

      {/* Header */}
      <header className="flex justify-between items-center mb-8 max-w-6xl mx-auto w-full relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-vermilion rounded-lg flex items-center justify-center shadow-lg shadow-vermilion/20">
            <Layers className="text-white w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Max Crazy eight points</h1>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={() => initGame()}
            className="p-2 hover:bg-black/5 rounded-full transition-colors"
            title="Restart Game"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
          <div className="px-4 py-1 bg-black/5 rounded-full border border-black/10 text-sm font-medium">
            Deck: {gameState.deck.length}
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col max-w-6xl mx-auto w-full gap-8 relative">
        {/* AI Hand */}
        <section className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-2 text-zinc-600 mb-2">
            <Bot className="w-4 h-4" />
            <span className="text-xs uppercase tracking-widest font-semibold">Opponent ({gameState.aiHand.length})</span>
          </div>
          <div className="flex -space-x-12 sm:-space-x-16 hover:-space-x-8 transition-all duration-300">
            {gameState.aiHand.map((card, i) => (
              <Card key={card.id} card={card} isFaceUp={false} className="scale-90" />
            ))}
          </div>
        </section>

        {/* Center Area: Deck & Discard */}
        <section className="flex-1 flex items-center justify-center gap-8 sm:gap-16">
          {/* Draw Pile */}
          <div className="relative group">
            <div className="absolute -inset-1 bg-vermilion/10 rounded-xl blur opacity-0 group-hover:opacity-100 transition duration-500"></div>
            <Card 
              card={{} as CardData} 
              isFaceUp={false} 
              onClick={() => handleDrawCard(true)}
              playable={gameState.currentTurn === 'player' && gameState.status === 'playing'}
              className={cn(
                "relative transition-transform active:scale-95",
                gameState.deck.length === 0 && "opacity-20 grayscale"
              )}
            />
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-tighter text-zinc-600 font-bold">Draw Pile</div>
          </div>

          {/* Discard Pile */}
          <div className="relative">
            <AnimatePresence mode="popLayout">
              {gameState.discardPile.slice(-1).map((card) => (
                <Card 
                  key={card.id} 
                  card={card} 
                  className="shadow-2xl shadow-black/10" 
                  disabled
                />
              ))}
            </AnimatePresence>
            
            {/* Active Suit Indicator (for 8s) */}
            {gameState.activeSuit && (
              <motion.div 
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={cn(
                  "absolute -top-4 -right-4 w-12 h-12 rounded-full bg-white shadow-xl flex items-center justify-center text-2xl border-2 border-zinc-100",
                  SUIT_COLORS[gameState.activeSuit]
                )}
              >
                {SUIT_SYMBOLS[gameState.activeSuit]}
              </motion.div>
            )}
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-tighter text-zinc-600 font-bold">Discard</div>
          </div>
        </section>

        {/* Message Bar */}
        <div className="text-center">
          <motion.p 
            key={message}
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-lg font-medium text-zinc-700"
          >
            {message}
          </motion.p>
        </div>

        {/* Player Hand */}
        <section className="flex flex-col items-center gap-4 mt-auto">
          <div className="flex items-center gap-2 text-zinc-600 mb-2">
            <User className="w-4 h-4" />
            <span className="text-xs uppercase tracking-widest font-semibold">Your Hand ({gameState.playerHand.length})</span>
          </div>
          <div className="flex flex-wrap justify-center gap-2 sm:gap-4 max-w-full">
            {gameState.playerHand.map((card) => (
              <Card 
                key={card.id} 
                card={card} 
                playable={gameState.currentTurn === 'player' && canPlayCard(card, topDiscard, gameState.activeSuit)}
                onClick={() => handlePlayCard(card, true)}
                disabled={gameState.currentTurn !== 'player' || gameState.isSuitPicking}
              />
            ))}
          </div>
        </section>
      </main>

      {/* Modals */}
      <AnimatePresence>
        {gameState.isSuitPicking && (
          <SuitPicker onSelect={handleSuitSelect} />
        )}

        {gameState.status === 'gameOver' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            <div className="bg-parchment border border-black/10 rounded-3xl p-10 shadow-2xl max-w-md w-full text-center">
              <div className="w-20 h-20 bg-vermilion/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trophy className="text-vermilion w-10 h-10" />
              </div>
              <h2 className="text-4xl font-bold mb-2 text-ink">
                {gameState.winner === 'player' ? "Victory!" : "Defeat"}
              </h2>
              <p className="text-zinc-600 mb-8">
                {gameState.winner === 'player' 
                  ? "You played your cards right! Amazing job." 
                  : "The AI was too quick this time. Want a rematch?"}
              </p>
              <button 
                onClick={() => initGame()}
                className="w-full py-4 bg-vermilion hover:bg-vermilion/90 text-white rounded-2xl font-bold text-lg transition-all shadow-lg shadow-vermilion/20 active:scale-95 flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-5 h-5" />
                Play Again
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer Info */}
      <footer className="mt-8 text-center text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-bold">
        Rules: Match suit or rank • 8 is wild • Draw if stuck
      </footer>
    </div>
  );
};
