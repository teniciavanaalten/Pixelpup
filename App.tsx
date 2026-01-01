
import React, { useState, useEffect } from 'react';
import { PetStats, PetState } from './types.ts';
import { INITIAL_STATS, XP_PER_ACTION, XP_FOR_NEXT_LEVEL } from './constants.tsx';
import { getPetThought } from './geminiService.ts';
import { supabase } from './supabaseClient.ts';
import PetDisplay from './PetDisplay.tsx';
import StatBar from './StatBar.tsx';

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [stats, setStats] = useState<PetStats | null>(null);
  const [isSleeping, setIsSleeping] = useState(false);
  const [petState, setPetState] = useState<PetState>(PetState.HAPPY);
  const [activeAction, setActiveAction] = useState<'feed' | 'play' | 'clean' | null>(null);
  const [thought, setThought] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Auth Listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load Pet Data on Session
  useEffect(() => {
    if (session) {
      loadPet();
    }
  }, [session]);

  const applyElapsedTime = (pet: PetStats): PetStats => {
    const now = new Date();
    const last = new Date(pet.last_updated);
    const secondsPassed = Math.max(0, (now.getTime() - last.getTime()) / 1000);
    
    if (secondsPassed === 0) return pet;

    // Decay Rates (Points per hour)
    const hungerDecay = 8;
    const energyDecay = 5;
    const happinessDecay = 7;
    const hygieneDecay = 4;

    let newHunger = Math.max(0, pet.hunger - (hungerDecay * secondsPassed / 3600));
    let newEnergy = Math.max(0, pet.energy - (energyDecay * secondsPassed / 3600));
    let newHappiness = Math.max(0, pet.happiness - (happinessDecay * secondsPassed / 3600));
    let newHygiene = Math.max(0, pet.hygiene - (hygieneDecay * secondsPassed / 3600));
    let newHealth = pet.health;

    // Health Penalty: If critical needs are neglected (under 10%), health drops fast
    if (newHunger <= 10 || newHappiness <= 10 || newEnergy <= 10) {
       const healthPenalty = 20; // 20 points per hour of neglect
       newHealth = Math.max(0, pet.health - (healthPenalty * secondsPassed / 3600));
    } else if (newHunger > 50 && newHappiness > 50 && newEnergy > 30) {
       // Slow natural healing if well taken care of
       newHealth = Math.min(100, pet.health + (2 * secondsPassed / 3600));
    }

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

  const loadPet = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('pet')
        .select('*')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (!data) {
        // No pet found, create one
        const newPet = { ...INITIAL_STATS, user_id: session.user.id };
        const { data: created, error: createError } = await supabase
          .from('pet')
          .insert([newPet])
          .select()
          .single();
        
        if (createError) throw createError;
        setStats(created);
        triggerThought(created, 'boredom');
      } else {
        const processed = applyElapsedTime(data);
        setStats(processed);
        await savePet(processed);
        
        if (processed.is_dead) {
           setPetState(PetState.DEAD);
        } else {
           // Think about current state after loading
           const reason = processed.hunger < 30 ? 'hunger' : 
                          processed.energy < 30 ? 'energy' : 
                          processed.happiness < 30 ? 'happiness' : 'boredom';
           triggerThought(processed, reason);
        }
      }
    } catch (err) {
      console.error("Failed to load pet:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const savePet = async (updatedStats: PetStats) => {
    try {
      const { error } = await supabase
        .from('pet')
        .update({
          hunger: updatedStats.hunger,
          energy: updatedStats.energy,
          happiness: updatedStats.happiness,
          hygiene: updatedStats.hygiene,
          health: updatedStats.health,
          level: updatedStats.level,
          xp: updatedStats.xp,
          is_dead: updatedStats.is_dead,
          last_updated: updatedStats.last_updated
        })
        .eq('user_id', session.user.id);
      if (error) throw error;
    } catch (err) {
      console.error("Failed to save pet:", err);
    }
  };

  const triggerThought = async (currentStats: PetStats, reason: any) => {
    if (currentStats.is_dead) return;
    try {
      const text = await getPetThought(currentStats, reason);
      setThought(text);
      setTimeout(() => setThought(null), 5000);
    } catch (e) {
      setThought("Woof! ♡");
    }
  };

  const handleAction = async (type: 'feed' | 'play' | 'clean' | 'sleep' | 'revive') => {
    if (!stats) return;

    if (type === 'revive') {
      const resetPet = { ...INITIAL_STATS, user_id: session.user.id, last_updated: new Date().toISOString() };
      setStats(resetPet);
      await savePet(resetPet);
      setThought("I'm back! Woof! ♡");
      return;
    }

    if (stats.is_dead) return;

    if (isSleeping && type !== 'sleep') {
      setThought("Zzz... *snore* 💤");
      setTimeout(() => setThought(null), 2000);
      return;
    }

    // Apply delta first
    let current = applyElapsedTime(stats);
    if (current.is_dead) {
      setStats(current);
      await savePet(current);
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
        current.hunger = Math.min(100, current.hunger + 35);
        current.hygiene = Math.max(0, current.hygiene - 5);
        current.health = Math.min(100, current.health + 5);
        break;
      case 'play':
        current.happiness = Math.min(100, current.happiness + 30);
        current.energy = Math.max(0, current.energy - 20);
        break;
      case 'clean':
        current.hygiene = Math.min(100, current.hygiene + 60);
        break;
      case 'sleep':
        setIsSleeping(!isSleeping);
        // Toggle immediate bonus if waking up/resting
        if (!isSleeping) {
           current.energy = Math.min(100, current.energy + 10);
        }
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
        // Casual thought after action
        if (Math.random() > 0.5) triggerThought(current, type as any);
      }
    }

    current.last_updated = new Date().toISOString();
    setStats(current);
    await savePet(current);
  };

  // UI State Mapping
  useEffect(() => {
    if (!stats) return;
    if (stats.is_dead) {
      setPetState(PetState.DEAD);
    } else if (isSleeping) {
      setPetState(PetState.SLEEPING);
    } else if (stats.hunger < 25) {
      setPetState(PetState.HUNGRY);
    } else if (stats.hygiene < 25) {
      setPetState(PetState.DIRTY);
    } else if (stats.happiness < 30) {
      setPetState(PetState.SAD);
    } else {
      setPetState(PetState.HAPPY);
    }
  }, [stats, isSleeping]);

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-rose-50 p-6">
        <div className="bg-white p-10 rounded-3xl shadow-2xl border-8 border-rose-200 text-center max-w-sm">
          <h1 className="text-4xl font-black text-rose-400 mb-6 italic">PIXELPUP</h1>
          <p className="text-rose-900/60 mb-8 font-bold">Your persistent AI puppy. Every second counts! Sign in to adopt.</p>
          <button 
            onClick={() => supabase.auth.signInWithOAuth({ provider: 'google' })}
            className="w-full bg-rose-400 text-white font-black py-4 rounded-2xl border-b-8 border-rose-500 active:translate-y-1 active:border-b-0 transition-all mb-4"
          >
            SIGN IN WITH GOOGLE
          </button>
          <div className="text-[10px] text-rose-300 font-bold uppercase tracking-widest">Growth & Death are persistent</div>
        </div>
      </div>
    );
  }

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
        <div className="flex justify-between items-end mb-6 relative z-10">
          <div className="flex flex-col">
            <h1 className="text-3xl font-black text-rose-400 tracking-tighter italic">PIXELPUP</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] font-bold text-rose-500 bg-white px-2 py-0.5 rounded-full border border-rose-100 uppercase">LVL {stats.level}</span>
              <button onClick={() => supabase.auth.signOut()} className="text-[9px] text-rose-300 hover:text-rose-500 font-bold uppercase">Logout</button>
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
