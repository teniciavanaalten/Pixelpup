
import React, { useState, useEffect, useRef } from 'react';
import { PetStats, PetState } from './types.ts';
import { INITIAL_STATS, XP_PER_ACTION, XP_FOR_NEXT_LEVEL } from './constants.tsx';
import { getPetThought } from './geminiService.ts';
import PetDisplay from './PetDisplay.tsx';
import StatBar from './StatBar.tsx';

const App: React.FC = () => {
  const [stats, setStats] = useState<PetStats>(INITIAL_STATS);
  const [isSleeping, setIsSleeping] = useState(false);
  const [petState, setPetState] = useState<PetState>(PetState.HAPPY);
  const [activeAction, setActiveAction] = useState<'feed' | 'play' | 'clean' | null>(null);
  const [thought, setThought] = useState<string | null>("Woof! I'm home! ♡");
  const [lastThoughtTime, setLastThoughtTime] = useState(Date.now());

  // Stat depletion timer
  useEffect(() => {
    const timer = setInterval(() => {
      setStats(prev => {
        if (isSleeping) {
          return {
            ...prev,
            energy: Math.min(100, prev.energy + 8),
            hunger: Math.max(0, prev.hunger - 0.5),
            hygiene: Math.max(0, prev.hygiene - 0.2),
            happiness: Math.max(0, prev.happiness - 0.2),
          };
        }
        return {
          ...prev,
          hunger: Math.max(0, prev.hunger - 2),
          energy: Math.max(0, prev.energy - 1.5),
          happiness: Math.max(0, prev.happiness - 2),
          hygiene: Math.max(0, prev.hygiene - 0.8),
        };
      });
    }, 10000);
    return () => clearInterval(timer);
  }, [isSleeping]);

  // Visual state management
  useEffect(() => {
    if (stats.hunger < 25) setPetState(PetState.HUNGRY);
    else if (stats.energy < 25) setPetState(PetState.SLEEPING);
    else if (stats.hygiene < 25) setPetState(PetState.DIRTY);
    else if (stats.happiness < 30) setPetState(PetState.SAD);
    else setPetState(PetState.HAPPY);
  }, [stats]);

  // Autonomous thought logic
  useEffect(() => {
    const checkNeeds = async () => {
      // Don't think while sleeping or doing an action
      if (isSleeping || activeAction) return;

      const now = Date.now();
      let reason: 'hunger' | 'energy' | 'happiness' | 'hygiene' | 'boredom' | null = null;

      if (stats.hunger < 30) reason = 'hunger';
      else if (stats.energy < 30) reason = 'energy';
      else if (stats.happiness < 30) reason = 'happiness';
      else if (stats.hygiene < 30) reason = 'hygiene';
      // Occasional random thought every 45 seconds
      else if (now - lastThoughtTime > 45000) reason = 'boredom';

      if (reason) {
        const text = await getPetThought(stats, reason);
        setThought(text);
        setLastThoughtTime(now);
        // Clear thought after 6 seconds
        setTimeout(() => setThought(null), 6000);
      }
    };

    const thoughtInterval = setInterval(checkNeeds, 5000);
    return () => clearInterval(thoughtInterval);
  }, [stats, isSleeping, activeAction, lastThoughtTime]);

  const addXP = (amount: number) => {
    setStats(prev => {
      let newXP = prev.xp + amount;
      let newLevel = prev.level;
      if (newXP >= XP_FOR_NEXT_LEVEL) {
        newXP -= XP_FOR_NEXT_LEVEL;
        newLevel += 1;
        triggerLevelUp(newLevel);
      }
      return { ...prev, xp: newXP, level: newLevel };
    });
  };

  const triggerLevelUp = async (level: number) => {
    const text = await getPetThought(stats, 'level_up');
    setThought(text);
    setTimeout(() => setThought(null), 8000);
  };

  const handleAction = (type: 'feed' | 'play' | 'clean' | 'sleep') => {
    if (isSleeping && type !== 'sleep') {
      setThought("Zzz... *snore* 💤");
      setTimeout(() => setThought(null), 3000);
      return;
    }

    if (type !== 'sleep') {
      setActiveAction(type);
      setThought(null);
      setTimeout(() => setActiveAction(null), 2500);
    }

    setStats(prev => {
      switch (type) {
        case 'feed': return { ...prev, hunger: Math.min(100, prev.hunger + 35), hygiene: Math.max(0, prev.hygiene - 8) };
        case 'play': return { ...prev, happiness: Math.min(100, prev.happiness + 30), energy: Math.max(0, prev.energy - 20) };
        case 'clean': return { ...prev, hygiene: Math.min(100, prev.hygiene + 60) };
        case 'sleep': setIsSleeping(!isSleeping); return prev;
        default: return prev;
      }
    });
    if (type !== 'sleep') addXP(XP_PER_ACTION);
  };

  return (
    <div className="max-w-md mx-auto min-h-screen flex flex-col p-4 md:p-6 lg:py-10">
      {/* Header & Stats Container */}
      <div className="bg-rose-100 rounded-3xl p-6 shadow-2xl border-8 border-rose-200">
        <div className="flex justify-between items-end mb-6">
          <div className="flex flex-col">
            <h1 className="text-3xl font-black text-rose-400 tracking-tighter italic">PIXELPUP</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] font-bold text-rose-500 bg-white px-2 py-0.5 rounded-full w-fit border border-rose-100 uppercase">LVL {stats.level}</span>
            </div>
          </div>
          <div className="text-right flex flex-col items-end">
             <div className="text-[9px] font-black text-rose-300 uppercase tracking-widest mb-1">XP Gauge</div>
             <div className="w-24 h-3 bg-white rounded-full border-2 border-rose-200 overflow-hidden shadow-inner">
                <div className="h-full bg-rose-400 transition-all duration-500" style={{ width: `${(stats.xp / XP_FOR_NEXT_LEVEL) * 100}%` }}></div>
             </div>
          </div>
        </div>

        {/* The Puppy Cam */}
        <PetDisplay 
          state={petState} 
          isSleeping={isSleeping} 
          activeAction={activeAction} 
          thought={thought}
        />

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-5 mt-10 mb-4 px-2">
          <StatBar label="Tummy" value={stats.hunger} color="bg-orange-300" icon="fa-solid fa-hamburger" />
          <StatBar label="Energy" value={stats.energy} color="bg-sky-300" icon="fa-solid fa-bolt" />
          <StatBar label="Happiness" value={stats.happiness} color="bg-rose-400" icon="fa-solid fa-heart" />
          <StatBar label="Clean" value={stats.hygiene} color="bg-emerald-300" icon="fa-solid fa-soap" />
        </div>
      </div>

      {/* Action Buttons Bar */}
      <div className="bg-white/40 backdrop-blur-md rounded-3xl p-4 mt-6 shadow-xl border-4 border-rose-200 flex justify-between gap-3">
        <ActionButton icon="fa-solid fa-hamburger" label="Feed" onClick={() => handleAction('feed')} color="bg-white text-orange-400 border-b-4 border-orange-200" />
        <ActionButton icon="fa-solid fa-baseball-ball" label="Play" onClick={() => handleAction('play')} color="bg-white text-sky-400 border-b-4 border-sky-200" />
        <ActionButton icon="fa-solid fa-sparkles" label="Wash" onClick={() => handleAction('clean')} color="bg-white text-emerald-400 border-b-4 border-emerald-200" />
        <ActionButton icon={isSleeping ? "fa-solid fa-sun" : "fa-solid fa-moon"} label={isSleeping ? "Wake" : "Rest"} onClick={() => handleAction('sleep')} color="bg-white text-rose-400 border-b-4 border-rose-200" />
      </div>

      <div className="text-center mt-auto py-8">
        <div className="text-[10px] font-black text-rose-300 tracking-widest uppercase opacity-60">♡ Purely AI Strawberry Edition ♡</div>
      </div>
    </div>
  );
};

const ActionButton: React.FC<{ icon: string; label: string; onClick: () => void; color: string }> = ({ icon, label, onClick, color }) => (
  <button onClick={onClick} className={`flex-1 flex flex-col items-center justify-center py-4 rounded-3xl transition-all active:translate-y-1 hover:scale-105 active:shadow-none shadow-md ${color}`}>
    <i className={`${icon} text-2xl mb-1`}></i>
    <span className="text-[10px] font-black uppercase tracking-tighter">{label}</span>
  </button>
);

export default App;
