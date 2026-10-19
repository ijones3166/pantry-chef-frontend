import React, { useEffect, useState } from "react";
import { Sparkles, Utensils, ChefHat, Check } from "lucide-react";

const STAGES = [
  "Scanning pantry inventory...",
  "Pairing ingredients & dietary preferences...",
  "Balancing macro nutrition & cook times...",
  "Formatting chef instructions & step timing..."
];

const AIThinkingModal = ({ isOpen, mode = "recipe", onCancel }) => {
  const [stageIndex, setStageIndex] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      setStageIndex(0);
      return;
    }
    const interval = setInterval(() => {
      setStageIndex((prev) => (prev < STAGES.length - 1 ? prev + 1 : prev));
    }, 1800);
    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-[120] flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl text-center space-y-5 animate-in zoom-in-95">
        <div className="relative w-16 h-16 mx-auto">
          <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-inner">
            <ChefHat className="w-8 h-8 animate-bounce" />
          </div>
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-indigo-600"></span>
          </span>
        </div>

        <div className="space-y-1">
          <h3 className="font-black text-lg text-gray-900">
            {mode === "meal" ? "Crafting Meal Pairing" : "Designing Custom Recipes"}
          </h3>
          <p className="text-xs text-indigo-600 font-semibold h-5 transition-all">
            {STAGES[stageIndex]}
          </p>
        </div>

        <div className="space-y-2 text-left bg-gray-50 p-3 rounded-2xl border border-gray-100">
          {STAGES.map((text, idx) => (
            <div key={idx} className="flex items-center gap-2 text-[11px]">
              {idx < stageIndex ? (
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              ) : idx === stageIndex ? (
                <div className="w-3.5 h-3.5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin shrink-0" />
              ) : (
                <div className="w-3.5 h-3.5 rounded-full bg-gray-200 shrink-0" />
              )}
              <span className={idx === stageIndex ? "font-bold text-gray-800" : "text-gray-400"}>
                {text}
              </span>
            </div>
          ))}
        </div>

        <button
          onClick={onCancel}
          className="text-xs text-gray-400 hover:text-gray-600 font-bold cursor-pointer transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default AIThinkingModal;