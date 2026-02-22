import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Suit } from '../types';
import { SUITS, SUIT_SYMBOLS, SUIT_COLORS } from '../constants';
import { cn } from '../utils/cn';

interface SuitPickerProps {
  onSelect: (suit: Suit) => void;
}

export const SuitPicker: React.FC<SuitPickerProps> = ({ onSelect }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
    >
      <div className="bg-parchment rounded-3xl p-8 shadow-2xl max-w-sm w-full text-center border border-black/10">
        <h2 className="text-2xl font-bold mb-6 text-ink">Choose a Suit</h2>
        <div className="grid grid-cols-2 gap-4">
          {SUITS.map((suit) => (
            <button
              key={suit}
              onClick={() => onSelect(suit)}
              className={cn(
                "flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-black/5 hover:border-vermilion hover:bg-vermilion/5 transition-all group",
                SUIT_COLORS[suit]
              )}
            >
              <span className="text-5xl mb-2 group-hover:scale-110 transition-transform">
                {SUIT_SYMBOLS[suit]}
              </span>
              <span className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
                {suit}
              </span>
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
};
