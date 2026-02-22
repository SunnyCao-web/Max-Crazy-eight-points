import React from 'react';
import { motion } from 'motion/react';
import { CardData } from '../types';
import { SUIT_SYMBOLS, SUIT_COLORS } from '../constants';
import { cn } from '../utils/cn';

interface CardProps {
  card: CardData;
  isFaceUp?: boolean;
  onClick?: () => void;
  playable?: boolean;
  className?: string;
  disabled?: boolean;
}

export const Card: React.FC<CardProps> = ({
  card,
  isFaceUp = true,
  onClick,
  playable = false,
  className,
  disabled = false,
}) => {
  return (
    <motion.div
      layout
      initial={{ scale: 0.8, opacity: 0, y: 20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      whileHover={playable && !disabled ? { y: -15, scale: 1.05 } : {}}
      whileTap={playable && !disabled ? { scale: 0.95 } : {}}
      onClick={!disabled ? onClick : undefined}
      className={cn(
        "relative w-24 h-36 sm:w-28 sm:h-40 rounded-xl shadow-lg cursor-pointer transition-shadow duration-200",
        isFaceUp ? "bg-white" : "bg-vermilion border-4 border-parchment",
        playable && !disabled && "ring-4 ring-yellow-400 shadow-yellow-400/50",
        disabled && "opacity-80 cursor-not-allowed",
        className
      )}
    >
      {isFaceUp ? (
        <div className={cn("w-full h-full p-2 flex flex-col justify-between select-none", SUIT_COLORS[card.suit])}>
          <div className="flex flex-col items-start leading-none">
            <span className="text-xl font-bold">{card.rank}</span>
            <span className="text-lg">{SUIT_SYMBOLS[card.suit]}</span>
          </div>
          
          <div className="flex justify-center items-center">
            <span className="text-4xl">{SUIT_SYMBOLS[card.suit]}</span>
          </div>
          
          <div className="flex flex-col items-end leading-none rotate-180">
            <span className="text-xl font-bold">{card.rank}</span>
            <span className="text-lg">{SUIT_SYMBOLS[card.suit]}</span>
          </div>
        </div>
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <div className="w-4/5 h-4/5 border-2 border-white/20 rounded-lg flex items-center justify-center">
             <div className="w-full h-full bg-[radial-gradient(circle,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[length:10px_10px]" />
          </div>
        </div>
      )}
    </motion.div>
  );
};
