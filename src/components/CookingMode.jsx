import React, { useState, useEffect } from "react";
import { X, List, BookOpen, AlarmClock, TimerIcon, ChevronRight, ChefHat, Pin } from "lucide-react";
import ConverterWidget from './ConverterWidget';
import KitchenGuide from './KitchenGuide';

export default function CookingMode({ 
  recipe, 
  initialServings, 
  onClose, 
  globalTimers = [], 
  setGlobalTimers = () => {}, 
  pinnedRecipes = [], 
  setPinnedRecipes = () => {},
  askAIChef 
}) {
  const [activeRecipe, setActiveRecipe] = useState(recipe);
  const [step, setStep] = useState(0);
  const [activeServings, setActiveServings] = useState(initialServings || recipe?.servings || 4);
  const [showUtilityDrawer, setShowUtilityDrawer] = useState(false);
  const [showMenuOverlay, setShowMenuOverlay] = useState(false);
  const [splitScreenMode, setSplitScreenMode] = useState(false); // 👉 Multi-dish side-by-side view toggle
  
  // Chat Assistant States
  const [chatOpen, setChatOpen] = useState(false);
  const [chatQuery, setChatQuery] = useState("");
  const [chatLog, setChatLog] = useState([]);
  const [aiThinking, setAiThinking] = useState(false);

  // 👉 #8: Screen Wake Lock API Implementation
  useEffect(() => {
    let wakeLock = null;
    const requestWakeLock = async () => {
      if ('wakeLock' in navigator) {
        try {
          wakeLock = await navigator.wakeLock.request('screen');
        } catch (err) {
          console.error(`Wake Lock error: ${err.name}, ${err.message}`);
        }
      }
    };
    requestWakeLock();

    return () => {
      if (wakeLock) wakeLock.release().catch(() => {});
    };
  }, []);

  // pinning
  const isCurrentPinned = pinnedRecipes.some(p => p.title === activeRecipe.title);

  const togglePinCurrentRecipe = () => {
    setPinnedRecipes(prev => {
      const alreadyPinned = prev.some(p => p.title === activeRecipe.title);
      if (alreadyPinned) {
        // Unpin it
        return prev.filter(p => p.title !== activeRecipe.title);
      } else {
        // Cap at 3 pinned recipes
        if (prev.length >= 3) {
          alert("You can only pin up to 3 dishes at a time.");
          return prev;
        }
        return [...prev, activeRecipe];
      }
    });
  };

  const rawInstructions = activeRecipe?.instructions || "1. Prepare ingredients as directed.\n2. Cook until done.";
  const steps = typeof rawInstructions === 'string' 
    ? (rawInstructions.includes("\n")
        ? rawInstructions.split(/\r?\n/).filter((s) => s.trim().length > 0)
        : rawInstructions.split(/(?=\d+\.\s+)/).filter((s) => s.trim().length > 0))
    : ["1. Prepare ingredients as directed."];

  const currentStepText = steps[step] || steps[0] || "Prepare ingredients as directed.";

  const startGlobalTimer = (minutes, label) => {
    const newTimer = {
      id: Date.now(),
      label: label || `${activeRecipe.title} Timer`,
      remaining: minutes * 60,
      duration: minutes * 60
    };
    setGlobalTimers((prev) => [...prev, newTimer]);
  };

  const handleAskChef = async (e) => {
    e.preventDefault();
    if (!chatQuery.trim() || !askAIChef) return;
    const q = chatQuery;
    setChatLog([...chatLog, { role: "user", text: q }]);
    setChatQuery("");
    setAiThinking(true);
    try {
      const ans = await askAIChef(q, JSON.stringify(activeRecipe));
      setChatLog((prev) => [...prev, { role: "ai", text: ans }]);
    } catch (err) {
      setChatLog((prev) => [...prev, { role: "ai", text: "Connection error." }]);
    }
    setAiThinking(false);
  };

  const renderStepWithTimer = (text) => {
    const stepText = typeof text === 'string' ? text : String(text || "");
    const timeMatch = stepText.match(/(\d+)\s*(minute|min|m)s?/i);
    return (
      <span>
        {stepText}
        {timeMatch && (
          <button
            onClick={() => startGlobalTimer(parseInt(timeMatch[1]), `${activeRecipe.title} (Step ${step + 1})`)}
            className="ml-2 inline-flex items-center px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold hover:bg-indigo-200 cursor-pointer shadow-sm align-middle"
          >
            <TimerIcon className="w-3.5 h-3.5 mr-1" /> Start {timeMatch[1]}m Timer
          </button>
        )}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 bg-gray-900 z-50 flex flex-col text-white animate-in slide-in-from-bottom duration-300">
      
      {/* ⏱️ Persistent Global Timers Banner */}
      {globalTimers.length > 0 && (
        <div className="bg-indigo-600 p-3 px-4 flex items-center justify-between shadow-lg border-b border-indigo-500 z-50 overflow-x-auto">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <AlarmClock className="w-4 h-4 text-amber-300 animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-200">Active Timers:</span>
            </div>
            <div className="flex gap-2">
              {globalTimers.map((t) => (
                <div key={t.id} className="bg-white/10 px-3 py-1.5 rounded-xl flex items-center gap-2 border border-white/10">
                  <span className="text-xs font-medium truncate max-w-[140px]">{t.label}</span>
                  <span className="text-xs font-mono font-black text-amber-300">
                    {Math.floor(t.remaining / 60)}:{(t.remaining % 60).toString().padStart(2, "0")}
                  </span>
                  <button
                    onClick={() => setGlobalTimers((prev) => prev.filter((x) => x.id !== t.id))}
                    className="text-white/60 hover:text-white cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Top Header Controls & Pinned Dishes */}
      {/* Top Header Controls & Pinned Dishes */}
      <div className="p-3 md:p-4 bg-gray-800 border-b border-gray-700 space-y-3">
        <div className="flex flex-wrap justify-between items-center gap-2">
          
          {/* Left Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowMenuOverlay(!showMenuOverlay)}
              className="p-1.5 md:p-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-[10px] md:text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
            >
              <List className="w-3.5 h-3.5" /> {showMenuOverlay ? "Close Menu" : "Steps"}
            </button>
            <button
              onClick={() => setShowUtilityDrawer(!showUtilityDrawer)}
              className="p-1.5 md:p-2 bg-indigo-600/80 hover:bg-indigo-600 rounded-lg text-[10px] md:text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
            >
              <BookOpen className="w-3.5 h-3.5" /> Cheat Sheets
            </button>
            <button
              onClick={togglePinCurrentRecipe}
              className={`p-1.5 md:p-2 rounded-lg text-[10px] md:text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                isCurrentPinned ? "bg-indigo-600 text-white" : "bg-gray-700 hover:bg-gray-600 text-gray-300"
              }`}
            >
              <Pin className="w-3.5 h-3.5" /> {isCurrentPinned ? "Pinned" : "Pin Dish"}
            </button>
            {pinnedRecipes.length > 1 && (
              <button
                onClick={() => setSplitScreenMode(!splitScreenMode)}
                className={`p-1.5 md:p-2 rounded-lg text-[10px] md:text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                  splitScreenMode ? "bg-green-600 text-white" : "bg-gray-700 hover:bg-gray-600 text-gray-300"
                }`}
              >
                🍳 {splitScreenMode ? "Single" : "Split View"}
              </button>
            )}
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2 md:gap-3 ml-auto">
            <div className="flex items-center bg-gray-700 px-2 py-1 rounded-xl text-xs gap-1.5">
              <span className="text-gray-400 text-[9px] md:text-[10px] uppercase font-bold hidden sm:inline">Servings:</span>
              <button onClick={() => setActiveServings(s => Math.max(1, s - 1))} className="cursor-pointer font-bold px-1 hover:text-indigo-400">-</button>
              <span className="font-mono font-black">{activeServings}</span>
              <button onClick={() => setActiveServings(s => s + 1)} className="cursor-pointer font-bold px-1 hover:text-indigo-400">+</button>
            </div>
            <button onClick={onClose} className="p-1.5 md:p-2 bg-gray-700 hover:bg-gray-600 rounded-full cursor-pointer">
              <X className="w-4 h-4 md:w-5 md:h-5" />
            </button>
          </div>
        </div>

        {/* Pinned Recipes Bar */}
        {pinnedRecipes.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <span className="text-[9px] md:text-[10px] font-bold text-gray-400 uppercase shrink-0">Pinned:</span>
            {pinnedRecipes.map((pin, idx) => (
              <button
                key={idx}
                onClick={() => { setActiveRecipe(pin); setStep(0); }}
                className={`px-2.5 py-1 rounded-xl text-[10px] md:text-xs font-bold truncate shrink-0 transition-all cursor-pointer flex items-center gap-1 ${
                  activeRecipe.title === pin.title ? "bg-indigo-600 text-white shadow-sm" : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
              >
                <Pin className="w-3 h-3 hidden md:inline" /> {pin.title}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Stacked Vertical Steps Menu Overlay */}
      {showMenuOverlay && (
        <div className="absolute inset-x-0 top-24 bottom-0 bg-gray-900/95 backdrop-blur-md z-40 p-6 overflow-y-auto animate-in fade-in space-y-4">
          <div className="flex justify-between items-center border-b border-gray-800 pb-3">
            <h3 className="font-bold text-sm text-indigo-400 uppercase tracking-wider">Recipe Steps Stack</h3>
            <button onClick={() => setShowMenuOverlay(false)} className="text-gray-400 hover:text-white cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="space-y-2 max-w-xl mx-auto">
            <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">Jump to Step:</h4>
            {steps.map((sText, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setStep(idx);
                  setShowMenuOverlay(false);
                }}
                className={`w-full p-3 rounded-2xl text-xs text-left font-medium border cursor-pointer transition-all flex items-start gap-3 ${
                  step === idx ? "bg-indigo-600 border-indigo-500 text-white shadow-md" : "bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"
                }`}
              >
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                  step === idx ? "bg-white text-indigo-600" : "bg-gray-700 text-gray-400"
                }`}>
                  {idx + 1}
                </span>
                <span className="leading-relaxed flex-1 line-clamp-2 text-ellipsis overflow-hidden text-left">
                  {sText}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Slide-Out Utility Drawer */}
      {showUtilityDrawer && (
        <div className="absolute inset-x-0 top-24 bottom-0 bg-gray-900/95 backdrop-blur-md z-40 p-6 overflow-y-auto animate-in fade-in space-y-4">
          <div className="flex justify-between items-center border-b border-gray-800 pb-3">
            <h3 className="font-black text-sm text-indigo-400 uppercase tracking-wider">Kitchen Utility Drawer</h3>
            <button onClick={() => setShowUtilityDrawer(false)} className="text-gray-400 hover:text-white cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>
          <ConverterWidget />
          <KitchenGuide />
        </div>
      )}

      {/* Main Step Display (Single or Multi-Dish Split Screen) */}
      <div className="flex-grow flex flex-col justify-center p-6 text-center space-y-6 overflow-y-auto">
        {splitScreenMode && pinnedRecipes.length > 1 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full max-w-5xl mx-auto w-full">
            {pinnedRecipes.map((pin, i) => {
              const pinSteps = (pin.instructions || "").split(/\r?\n/).filter(s => s.trim().length > 0);
              return (
                <div key={i} className="bg-gray-800 p-6 rounded-3xl border border-gray-700 flex flex-col justify-between text-left shadow-xl">
                  <div>
                    <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-1">{pin.title}</h4>
                    <p className="text-lg font-medium text-white leading-relaxed mt-4">
                      {pinSteps[0] || pin.instructions}
                    </p>
                  </div>
                  <button
                    onClick={() => { setActiveRecipe(pin); setSplitScreenMode(false); }}
                    className="mt-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Focus Dish
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-6 max-w-2xl mx-auto">
            <span className="text-indigo-400 text-xs font-black uppercase tracking-widest">
              {activeRecipe.title} • Step {step + 1} of {steps.length}
            </span>
            <p className="text-2xl md:text-3xl font-medium leading-relaxed">
              {renderStepWithTimer(currentStepText)}
            </p>
          </div>
        )}
      </div>

      {/* Navigation Footer */}
      <div className="p-6 pb-8 space-y-3 bg-gray-800 border-t border-gray-700">
        <div className="flex gap-4">
          <button
            disabled={step === 0}
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            className="flex-1 py-4 bg-gray-700 hover:bg-gray-600 rounded-2xl font-bold disabled:opacity-30 cursor-pointer"
          >
            Previous
          </button>
          <button
            disabled={step === steps.length - 1}
            onClick={() => setStep((s) => Math.min(steps.length - 1, s + 1))}
            className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-700 rounded-2xl font-bold disabled:opacity-30 cursor-pointer"
          >
            Next Step
          </button>
        </div>
        <button
          onClick={() => setChatOpen(!chatOpen)}
          className="w-full py-3 bg-gray-800 hover:bg-gray-700 rounded-xl text-indigo-300 font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
        >
          <ChefHat className="w-4 h-4" /> Ask Chef Assistant
        </button>
      </div>

      {/* Chef Assistant Chat Drawer */}
      {chatOpen && (
        <div className="absolute inset-x-0 bottom-0 h-3/4 bg-white text-gray-900 rounded-t-3xl shadow-2xl flex flex-col animate-in slide-in-from-bottom z-50">
          <div className="p-4 border-b flex justify-between items-center bg-gray-50 rounded-t-3xl">
            <h3 className="font-bold">Chef Assistant</h3>
            <button onClick={() => setChatOpen(false)} className="cursor-pointer">
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
          <div className="flex-grow overflow-y-auto p-4 space-y-3 bg-gray-50">
            {chatLog.map((msg, i) => (
              <div
                key={i}
                className={`p-3 rounded-xl max-w-[85%] text-sm ${
                  msg.role === "user"
                    ? "bg-indigo-600 text-white ml-auto"
                    : "bg-white border border-gray-200 mr-auto"
                }`}
              >
                {msg.text}
              </div>
            ))}
            {aiThinking && (
              <div className="p-3 bg-white border border-gray-200 rounded-xl max-w-[85%] text-sm mr-auto text-gray-400 animate-pulse">
                Chef is thinking...
              </div>
            )}
          </div>
          <form onSubmit={handleAskChef} className="p-4 border-t bg-white flex gap-2">
            <input
              value={chatQuery}
              onChange={(e) => setChatQuery(e.target.value)}
              placeholder="Ask question..."
              className="flex-grow p-3 bg-gray-100 rounded-xl text-sm outline-none"
            />
            <button
              type="submit"
              className="p-3 bg-indigo-600 text-white rounded-xl cursor-pointer"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </form>
        </div>
      )}

    </div>
  );
}