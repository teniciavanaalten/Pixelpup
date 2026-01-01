
import React, { useState, useEffect, useRef } from 'react';
import { PetStats, PetState } from './types.ts';
import { INITIAL_STATS, XP_PER_ACTION, XP_FOR_NEXT_LEVEL } from './constants.tsx';
import { getPetThought } from './geminiService.ts';
import PetDisplay from './PetDisplay.tsx';
import StatBar from './StatBar.tsx';

const STORAGE_KEY = 'pixelpup_stats';
const TICK_INTERVAL = 5000; // Update every 5 seconds for smooth visual decline

const App: React.FC = () => {
  const [stats, setStats] = useState<PetStats | null>(null);
  const [isSleeping, setIsSleeping] = useState(false);
  const [petState, setPetState] = useState<PetState>(PetState.HAPPY);
  const [activeAction, setActiveAction] = useState<'feed' | 'play' | 'clean' | null>(null);
  const [thought, setThought] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Ref to track the latest stats for the timer loop to avoid stale closures
  const statsRef = useRef<PetStats | null>(null);
  useEffect(() => {
    statsRef.current = stats;
  }, [stats]);

  // Helper to calculate decay since last update
  const applyDecay = (pet: PetStats): PetStats => {
    const now = new Date();
    const last = new Date(pet.last_updated);
    const secondsPassed = Math.max(0, (now.getTime() - last.getTime()) / 1000);
    
    if (secondsPassed < 1 || pet.is_dead) return pet;

    // Decay Rates (Points per hour)
    // Hunger: -12 pts/hr (Empty in ~8 hrs)
    // Energy: -8 pts/hr (unless sleeping)
    // Happiness: -10 pts/hr
    // Hygiene: -6 pts/hr
    const hungerDecay = 12;
    const energyDecay = isSleeping ? -15 : 8; // Gain energy if sleeping
    const happinessDecay = 10;
    const hygieneDecay = 6;

    let newHunger = Math.max(0, Math.min(100, pet.hunger - (hungerDecay * secondsPassed / 3600)));
    let newEnergy = Math.max(0, Math.min(100, pet.energy - (energyDecay * secondsPassed / 3600)));
    let newHappiness = Math.max(0, Math.min(100, pet.happiness - (happinessDecay * secondsPassed / 3600)));
    let newHygiene = Math.max(0, Math.min(100, pet.hygiene - (hygieneDecay * secondsPassed / 3600)));
    let newHealth = pet.health;

    // Health Logic: 
    // If stats are critical (under 15%), health drops significantly.
    // If stats are great (over 70%), health slowly recovers.
    const criticalThreshold = 15;
    let healthChangeRate = 0;

    if (newHunger < criticalThreshold) healthChangeRate -= 15;
    if (newEnergy < criticalThreshold) healthChangeRate -= 10;
    if (newHappiness < criticalThreshold) healthChangeRate -= 10;
    if (newHygiene < criticalThreshold) healthChangeRate -= 5;

    if (newHunger > 70 && newHappiness > 70 && newEnergy > 50) {
      healthChangeRate += 2; // Natural slow healing
    }

    newHealth = Math.max(0, Math.min(100, pet.health + (healthChangeRate * secondsPassed / 3600)));
    const is_dead = newHealth <= 0 || pet.is_dead;

    return {
      ...pet,
      hunger: newHunger,
      energy: newEnergy,
      happiness: newHappiness,
      hygiene: newHygiene,
      health: newHealth,
      is_dead,
      last_updated: now.toISOString()
    };
  };

  // Initial Load from LocalStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const processed = applyDecay(parsed);
        setStats(processed);
        if (!processed.is_dead) {
          const reason = processed.hunger < 30 ? 'hunger' : 
                         processed.energy < 30 ? 'energy' : 
                         processed.happiness < 30 ? 'happiness' : 'boredom';
          triggerThought(processed, reason as any);
        }
      } catch (e) {
        setStats(INITIAL_STATS);
      }
    } else {
      setStats(INITIAL_STATS);
    }
    setIsLoading(false);
  }, []);

  // Real-time Tick for Stat Decline
  useEffect(() => {
    const interval = setInterval(() => {
      if (statsRef.current && !statsRef.current.is_dead) {
        const updated = applyDecay(statsRef.current);
        // Only update state if stats actually changed significantly (to avoid render spam)
        // or just update regularly since it's a small app
        setStats(updated);
      }
    }, TICK_INTERVAL);

    return () => clearInterval(interval);
  }, [isSleeping]);

  // Persistence side-effect
  useEffect(() => {
    if (stats) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
    }
  }, [stats]);

  const triggerThought = async (currentStats: PetStats, reason: 'hunger' | 'energy' | 'happiness' | 'hygiene' | 'boredom' | 'level_up') => {
    if (currentStats.is_dead) return;
    try {
      const text = await getPetThought(currentStats, reason);
      setThought(text);
      setTimeout(() => setThought(null), 5000);
    } catch (e) {
      // Fallback handled in geminiService
    }
  };

  const handleAction = async (type: 'feed' | 'play' | 'clean' | 'sleep' | 'revive') => {
    if (!stats) return;

    if (type === 'revive') {
      const resetPet = { ...INITIAL_STATS, last_updated: new Date().toISOString() };
      setStats(resetPet);
      setThought("I'm back! Woof! ♡");
      return;
    }

    if (stats.is_dead) return;

    if (isSleeping && type !== 'sleep') {
      setThought("Zzz... *snore* 💤");
      setTimeout(() => setThought(null), 2000);
      return;
    }

    // Always apply decay immediately before an action to ensure accuracy
    let current = applyDecay(stats);
    if (current.is_dead) {
      setStats(current);
      return;
    }

    // Visual feedback
    if (type !== 'sleep') {
      setActiveAction(type);
      setThought(null);
      setTimeout(() => setActiveAction(null), 2000);
    }

    // Apply action effects
    switch (type) {
      case 'feed':
        current.hunger = Math.min(100, current.hunger + 30);
        current.hygiene = Math.max(0, current.hygiene - 8);
        current.health = Math.min(100, current.health + 2);
        break;
      case 'play':
        current.happiness = Math.min(100, current.happiness + 25);
        current.energy = Math.max(0, current.energy - 15);
        current.hunger = Math.max(0, current.hunger - 5);
        break;
      case 'clean':
        current.hygiene = Math.min(100, current.hygiene + 50);
        current.happiness = Math.max(0, current.happiness - 5); // Some dogs hate baths!
        break;
      case 'sleep':
        setIsSleeping(!isSleeping);
        break;
    }

    // Leveling logic
    if (type !== 'sleep') {
      current.xp += XP_PER_ACTION;
      if (current.xp >= XP_FOR_NEXT_LEVEL) {
        current.xp -= XP_FOR_NEXT_LEVEL;
        current.level += 1;
        triggerThought(current, 'level_up');
      } else {
        if (Math.random() > 0.8) triggerThought(current, type as any);
      }
    }

    current.last_updated = new Date().toISOString();
    setStats({ ...current });
  };

  // UI State Mapping
  useEffect(() => {
    if (!stats) return;
    if (stats.is_dead) setPetState(PetState.DEAD);
    else if (isSleeping) setPetState(PetState.SLEEPING);
    else if (stats.hunger < 25) setPetState(PetState.HUNGRY);
    else if (stats.hygiene < 25) setPetState(PetState.DIRTY);
    else if (stats.happiness < 30) setPetState(PetState.SAD);
    else if (stats.energy < 20) setPetState(PetState.SLEEPING); // Show tired if very low energy
    else setPetState(PetState.HAPPY);
  }, [stats, isSleeping]);

  if (isLoading || !stats) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-rose-50">
        <div className="text-rose-300 text-4xl animate-bounce">🦴</div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto min-h-screen flex flex-col p-4 md:p-6 lg:py-10">
      <div className="bg-rose-100 rounded-3xl p-6 shadow-2xl border-8 border-rose-200 relative overflow-hidden">
        {/* Background Decorative Rings */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-rose-200 rounded-full opacity-20"></div>
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-rose-200 rounded-full opacity-20"></div>

        <div className="flex justify-between items-end mb-6 relative z-10">
          <div className="flex flex-col">
            <h1 className="text-3xl font-black text-rose-400 tracking-tighter italic">PIXELPUP</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] font-bold text-rose-500 bg-white px-2 py-0.5 rounded-full border border-rose-100 uppercase tracking-widest">LVL {stats.level}</span>
            </div>
          </div>
          <div className="text-right flex flex-col items-end">
             <div className="text-[9px] font-black text-rose-300 uppercase tracking-widest mb-1">XP Gauge</div>
             <div className="w-24 h-3 bg-white rounded-full border-2 border-rose-200 overflow-hidden shadow-inner">
                <div className="h-full bg-rose-400 transition-all duration-500" style={{ width: `${(stats.xp / XP_FOR_NEXT_LEVEL) * 100}%` }}></div>
             </div>
          </div>
        </div>

        <PetDisplay 
          state={petState} 
          isSleeping={isSleeping} 
          activeAction={activeAction} 
          thought={thought}
        />

        {stats.is_dead ? (
          <div className="mt-8 text-center bg-white/80 p-6 rounded-2xl border-4 border-rose-200 shadow-xl relative z-10">
            <h2 className="text-2xl font-black text-rose-500 mb-2 uppercase tracking-tighter">Rest in Peace</h2>
            <p className="text-sm font-bold text-rose-900/60 mb-6 italic">Your puppy has crossed the rainbow bridge...</p>
            <button 
              onClick={() => handleAction('revive')}
              className="w-full bg-rose-400 text-white px-8 py-4 rounded-2xl font-black border-b-8 border-rose-600 active:translate-y-1 active:border-b-0 transition-all"
            >
              ADOPT A NEW PUPPY
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-6 gap-y-5 mt-10 mb-4 px-2 relative z-10">
            <StatBar label="Health" value={stats.health} color="bg-red-400" icon="fa-solid fa-heart-pulse" />
            <StatBar label="Tummy" value={stats.hunger} color="bg-orange-300" icon="fa-solid fa-hamburger" />
            <StatBar label="Energy" value={stats.energy} color="bg-sky-300" icon="fa-solid fa-bolt" />
            <StatBar label="Happiness" value={stats.happiness} color="bg-pink-400" icon="fa-solid fa-heart" />
            <StatBar label="Clean" value={stats.hygiene} color="bg-emerald-300" icon="fa-solid fa-soap" />
          </div>
        )}
      </div>

      {!stats.is_dead && (
        <div className="bg-white/40 backdrop-blur-md rounded-3xl p-4 mt-6 shadow-xl border-4 border-rose-200 flex justify-between gap-3">
          <ActionButton icon="fa-solid fa-hamburger" label="Feed" onClick={() => handleAction('feed')} color="bg-white text-orange-400 border-b-4 border-orange-200" />
          <ActionButton icon="fa-solid fa-baseball-ball" label="Play" onClick={() => handleAction('play')} color="bg-white text-sky-400 border-b-4 border-sky-200" />
          <ActionButton icon="fa-solid fa-sparkles" label="Wash" onClick={() => handleAction('clean')} color="bg-white text-emerald-400 border-b-4 border-emerald-200" />
          <ActionButton icon={isSleeping ? "fa-solid fa-sun" : "fa-solid fa-moon"} label={isSleeping ? "Wake" : "Rest"} onClick={() => handleAction('sleep')} color="bg-white text-rose-400 border-b-4 border-rose-200" />
        </div>
      )}

      <div className="text-center mt-auto py-8">
        <div className="text-[10px] font-black text-rose-300 tracking-widest uppercase opacity-60">♡ Purely Local Browser Edition ♡</div>
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
