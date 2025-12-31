
import React from 'react';
import { PetState } from '../types';
import { PetIcons } from '../constants';

interface PetDisplayProps {
  state: PetState;
  isSleeping: boolean;
}

const PetDisplay: React.FC<PetDisplayProps> = ({ state, isSleeping }) => {
  const currentState = isSleeping ? PetState.SLEEPING : state;
  const icon = PetIcons[currentState];

  return (
    <div className="relative flex flex-col items-center justify-center p-8 bg-[#fffcfb] rounded-2xl border-8 border-rose-200 min-h-[250px] overflow-hidden shadow-inner">
      {/* LCD Screen Grid Overlay */}
      <div className="absolute inset-0 opacity-5 pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 0)', backgroundSize: '4px 4px' }}></div>
      
      {/* Decorative LCD elements */}
      <div className="absolute top-2 left-2 flex gap-1">
        <div className="w-2 h-2 rounded-full bg-rose-100"></div>
        <div className="w-2 h-2 rounded-full bg-rose-100"></div>
      </div>
      <div className="absolute top-2 right-2 text-[10px] font-mono text-rose-200 font-bold uppercase tracking-widest">
        ♡ PUPPY-CAM ♡
      </div>

      {/* The Pet */}
      <div className="animate-float z-10 scale-125">
        <div className="relative">
          {icon}
          {isSleeping && (
            <div className="absolute -top-8 -right-4 flex flex-col items-center">
              <span className="text-rose-300 font-mono font-black animate-bounce delay-75">Z</span>
              <span className="text-rose-300 font-mono font-black animate-bounce delay-150 text-sm">z</span>
              <span className="text-rose-300 font-mono font-black animate-bounce delay-300 text-xs">z</span>
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 z-10">
        <div className="px-6 py-1 bg-rose-200/50 text-rose-500 font-mono text-xs font-bold uppercase tracking-tighter rounded-full shadow-sm border border-rose-100 backdrop-blur-sm">
          {currentState === PetState.SLEEPING ? 'Zzz...' : 'Good Puppy!'}
        </div>
      </div>
      
      {/* Glass Reflection */}
      <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/40 to-transparent pointer-events-none"></div>
    </div>
  );
};

export default PetDisplay;
