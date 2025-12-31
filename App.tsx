
import React, { useState, useEffect, useRef } from 'react';
import { PetStats, Message, PetState } from './types';
import { INITIAL_STATS, XP_PER_ACTION, XP_FOR_NEXT_LEVEL } from './constants';
import StatBar from './StatBar';
import PetDisplay from './PetDisplay';
import { getPetResponse } from './geminiService';

const App: React.FC = () => {
  const [stats, setStats] = useState<PetStats>(INITIAL_STATS);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'pet', text: "Woof! I'm your pixel pup! Will you be my best friend? ♡ 🐕" }
  ]);
  const [userInput, setUserInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [isSleeping, setIsSleeping] = useState(false);
  const [petState, setPetState] = useState<PetState>(PetState.HAPPY);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setStats(prev => {
        if (isSleeping) {
          return {
            ...prev,
            energy: Math.min(100, prev.energy + 5),
            hunger: Math.max(0, prev.hunger - 1),
            hygiene: Math.max(0, prev.hygiene - 0.5),
            happiness: Math.max(0, prev.happiness - 0.5),
          };
        }
        return {
          ...prev,
          hunger: Math.max(0, prev.hunger - 2),
          energy: Math.max(0, prev.energy - 1),
          happiness: Math.max(0, prev.happiness - 1.5),
          hygiene: Math.max(0, prev.hygiene - 0.8),
        };
      });
    }, 10000);
    return () => clearInterval(timer);
  }, [isSleeping]);

  useEffect(() => {
    if (stats.hunger < 20) setPetState(PetState.HUNGRY);
    else if (stats.energy < 20) setPetState(PetState.SLEEPING);
    else if (stats.hygiene < 20) setPetState(PetState.DIRTY);
    else if (stats.happiness < 30) setPetState(PetState.SAD);
    else setPetState(PetState.HAPPY);
  }, [stats]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const addXP = (amount: number) => {
    setStats(prev => {
      let newXP = prev.xp + amount;
      let newLevel = prev.level;
      if (newXP >= XP_FOR_NEXT_LEVEL) {
        newXP -= XP_FOR_NEXT_LEVEL;
        newLevel += 1;
        setMessages(m => [...m, { role: 'pet', text: `YAY! I'm level ${newLevel} now! ✨🐶` }]);
      }
      return { ...prev, xp: newXP, level: newLevel };
    });
  };

  const handleAction = (type: 'feed' | 'play' | 'clean' | 'sleep') => {
    if (isSleeping && type !== 'sleep') {
      setMessages(m => [...m, { role: 'pet', text: "*dreaming of bones*... 💤" }]);
      return;
    }

    setStats(prev => {
      switch (type) {
        case 'feed': return { ...prev, hunger: Math.min(100, prev.hunger + 30), hygiene: Math.max(0, prev.hygiene - 5) };
        case 'play': return { ...prev, happiness: Math.min(100, prev.happiness + 25), energy: Math.max(0, prev.energy - 15) };
        case 'clean': return { ...prev, hygiene: Math.min(100, prev.hygiene + 50) };
        case 'sleep': setIsSleeping(!isSleeping); return prev;
        default: return prev;
      }
    });
    if (type !== 'sleep') addXP(XP_PER_ACTION);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || isThinking) return;

    const userText = userInput.trim();
    setUserInput('');
    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setIsThinking(true);

    const response = await getPetResponse(userText, stats, messages);
    setMessages(prev => [...prev, { role: 'pet', text: response }]);
    setIsThinking(false);
    addXP(5);
  };

  return (
    <div className="max-w-md mx-auto min-h-screen flex flex-col p-4 md:p-6 lg:py-10">
      <div className="bg-rose-100 rounded-t-3xl p-6 shadow-2xl border-b-8 border-rose-200">
        <div className="flex justify-between items-end mb-6">
          <div className="flex flex-col">
            <h1 className="text-3xl font-black text-rose-400 tracking-tighter italic">PIXELPUP</h1>
            <span className="text-[10px] font-bold text-rose-500 bg-white px-2 py-0.5 rounded-full w-fit border border-rose-100">LVL {stats.level}</span>
          </div>
          <div className="text-right flex flex-col items-end">
             <div className="text-[9px] font-black text-rose-300 uppercase tracking-widest mb-1">XP Gauge</div>
             <div className="w-24 h-3 bg-white rounded-full border-2 border-rose-200 overflow-hidden">
                <div className="h-full bg-rose-300 transition-all duration-300" style={{ width: `${(stats.xp / XP_FOR_NEXT_LEVEL) * 100}%` }}></div>
             </div>
          </div>
        </div>

        <PetDisplay state={petState} isSleeping={isSleeping} />

        <div className="grid grid-cols-2 gap-4 mt-8">
          <StatBar label="Tummy" value={stats.hunger} color="bg-orange-200" icon="fa-solid fa-cookie" />
          <StatBar label="Nap" value={stats.energy} color="bg-sky-200" icon="fa-solid fa-cloud-moon" />
          <StatBar label="Love" value={stats.happiness} color="bg-rose-300" icon="fa-solid fa-heart" />
          <StatBar label="Soap" value={stats.hygiene} color="bg-emerald-200" icon="fa-solid fa-sparkles" />
        </div>
      </div>

      <div className="flex-1 bg-white border-x-8 border-rose-200 overflow-hidden flex flex-col min-h-[300px] shadow-xl">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-rose-50/20">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] px-4 py-2 rounded-2xl text-sm font-bold shadow-sm border-2 ${
                m.role === 'user' ? 'bg-rose-100 text-black border-rose-200 rounded-tr-none' : 'bg-white text-black border-rose-50 rounded-tl-none'
              }`}>
                {m.text}
              </div>
            </div>
          ))}
          {isThinking && (
            <div className="flex justify-start">
              <div className="bg-white border-2 border-rose-100 text-rose-200 px-4 py-2 rounded-2xl rounded-tl-none animate-pulse">
                <i className="fa-solid fa-heart animate-bounce"></i>
              </div>
            </div>
          )}
        </div>
        
        <form onSubmit={handleSendMessage} className="p-3 bg-white border-t-2 border-rose-50 flex gap-2">
          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="Tell your puppy something cute..."
            className="flex-1 bg-rose-50/30 border-2 border-rose-100 rounded-2xl px-4 py-2 text-sm font-bold text-black focus:outline-none focus:border-rose-300 transition-all placeholder:text-rose-200"
          />
          <button type="submit" disabled={!userInput.trim() || isThinking} className="bg-rose-300 text-white px-4 rounded-2xl flex items-center justify-center disabled:opacity-50 hover:bg-rose-400 transition-colors shadow-lg border-b-4 border-rose-400">
            <i className="fa-solid fa-wand-sparkles"></i>
          </button>
        </form>
      </div>

      <div className="bg-rose-100 rounded-b-3xl p-4 shadow-2xl border-t-8 border-rose-200 flex justify-between gap-3">
        <ActionButton icon="fa-solid fa-ice-cream" label="Snack" onClick={() => handleAction('feed')} color="bg-white text-rose-400 border-b-4 border-rose-200" />
        <ActionButton icon="fa-solid fa-star" label="Play" onClick={() => handleAction('play')} color="bg-white text-orange-300 border-b-4 border-orange-200" />
        <ActionButton icon="fa-solid fa-soap" label="Wash" onClick={() => handleAction('clean')} color="bg-white text-emerald-300 border-b-4 border-emerald-200" />
        <ActionButton icon={isSleeping ? "fa-solid fa-sun" : "fa-solid fa-moon"} label={isSleeping ? "Wake" : "Rest"} onClick={() => handleAction('sleep')} color="bg-white text-sky-300 border-b-4 border-sky-200" />
      </div>

      <div className="text-center mt-6 flex flex-col gap-1">
        <div className="text-[10px] font-black text-rose-300 tracking-widest uppercase">♡ Gemigotchi Strawberry Edition ♡</div>
      </div>
    </div>
  );
};

const ActionButton: React.FC<{ icon: string; label: string; onClick: () => void; color: string }> = ({ icon, label, onClick, color }) => (
  <button onClick={onClick} className={`flex-1 flex flex-col items-center justify-center py-4 rounded-3xl transition-all active:translate-y-1 ${color}`}>
    <i className={`${icon} text-2xl mb-1`}></i>
    <span className="text-[9px] font-black uppercase tracking-tighter">{label}</span>
  </button>
);

export default App;
