
import React from 'react';
import { PetState } from './types.ts';
import { PetIcons } from './constants.tsx';

interface PetDisplayProps {
  state: PetState;
  isSleeping: boolean;
  activeAction: 'feed' | 'play' | 'clean' | null;
  thought: string | null;
}

const PetDisplay: React.FC<PetDisplayProps> = ({ state, isSleeping, activeAction, thought }) => {
  const icon = (PetIcons as any)[state];

  return (
    <div className="relative flex flex-col items-center justify-center p-8 bg-[#fffcfb] rounded-2xl border-8 border-rose-200 min-h-[320px] overflow-hidden shadow-inner">
      <div className="absolute inset-0 opacity-5 pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 0)', backgroundSize: '4px 4px' }}></div>
      
      <div className="absolute top-2 left-2 flex gap-1">
        <div className="w-2 h-2 rounded-full bg-rose-100"></div>
        <div className="w-2 h-2 rounded-full bg-rose-100"></div>
      </div>
      <div className="absolute top-2 right-2 text-[10px] font-mono text-rose-200 font-bold uppercase tracking-widest">
        ♡ LIVE PUP-CAM ♡
      </div>

      {thought && !activeAction && state !== PetState.DEAD && (
        <div className="absolute top-12 z-30 animate-bounce">
          <div className="relative bg-white border-4 border-rose-200 px-4 py-2 rounded-2xl shadow-lg max-w-[180px] text-center">
            <p className="text-sm font-black text-rose-500 leading-tight">{thought}</p>
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-r-4 border-b-4 border-rose-200 rotate-45"></div>
          </div>
        </div>
      )}

      {activeAction === 'feed' && (
        <div className="absolute z-20 text-4xl animate-bounce" style={{ animationDuration: '0.5s' }}>
          🍔
        </div>
      )}
      {activeAction === 'play' && (
        <div className="absolute z-20 text-4xl animate-bounce" style={{ 
          left: '20%', 
          animation: 'bounce 0.8s infinite alternate, moveX 2s linear infinite' 
        }}>
          ⚽
        </div>
      )}
      {activeAction === 'clean' && (
        <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
          <span className="text-4xl animate-pulse opacity-80">🧼🫧✨</span>
        </div>
      )}

      <style>{`
        @keyframes moveX {
          0% { left: 10%; }
          50% { left: 80%; }
          100% { left: 10%; }
        }
      `}</style>

      <div className={`animate-float z-10 scale-[1.35] transition-transform duration-300 ${activeAction === 'feed' ? 'scale-[1.6]' : ''}`}>
        <div className="relative">
          {icon}
          {state === PetState.SLEEPING && (
            <div className="absolute -top-8 -right-4 flex flex-col items-center">
              <span className="text-rose-300 font-mono font-black animate-bounce delay-75">Z</span>
              <span className="text-rose-300 font-mono font-black animate-bounce delay-150 text-sm">z</span>
              <span className="text-rose-300 font-mono font-black animate-bounce delay-300 text-xs">z</span>
            </div>
          )}
        </div>
      </div>

      <div className="mt-12 z-10">
        <div className="px-6 py-1 bg-rose-200/50 text-rose-500 font-mono text-xs font-bold uppercase tracking-tighter rounded-full shadow-sm border border-rose-100 backdrop-blur-sm">
          {state === PetState.DEAD ? 'HEAVEN' : (activeAction ? `${activeAction.toUpperCase()}ING...` : (state === PetState.SLEEPING ? 'Zzz...' : 'Good Puppy!'))}
        </div>
      </div>
      
      <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/40 to-transparent pointer-events-none"></div>
    </div>
  );
};

export default PetDisplay;
