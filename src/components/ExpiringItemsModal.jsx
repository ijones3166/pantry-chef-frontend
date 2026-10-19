import React, { useState } from "react";
import { AlertTriangle, X, CheckSquare, Square, Search, Sparkles } from "lucide-react";

const ExpiringItemsModal = ({
  isOpen,
  onClose,
  expiringItems = [],
  onFindRecipes,
  onGenerateAI,
}) => {
  if (!isOpen) return null;

  // Defaults to completely unselected so the user makes intentional pairing choices
  const [selectedNames, setSelectedNames] = useState([]);

  const toggleSelect = (name) => {
    setSelectedNames((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto animate-in zoom-in-95">
        <div className="flex justify-between items-center border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base text-gray-900">Expiring Items Triage</h3>
              <p className="text-[11px] text-gray-500">Pick ingredients you want to use up next</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-amber-50/80 border border-amber-200/80 p-3 rounded-2xl text-xs text-amber-900 leading-relaxed">
          Select the specific items you want to cook with next. We will search for recipes using only what you check.
        </div>

        <div className="space-y-2">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">
            Items Expiring in 3 Days or Less ({expiringItems.length})
          </span>

          <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
            {expiringItems.map((item) => {
              const isChecked = selectedNames.includes(item.name);
              return (
                <div
                  key={item.id}
                  onClick={() => toggleSelect(item.name)}
                  className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    isChecked
                      ? "bg-indigo-50/70 border-indigo-300 text-gray-900 font-bold"
                      : "bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {isChecked ? (
                      <CheckSquare className="w-4 h-4 text-indigo-600 shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-gray-300 shrink-0" />
                    )}
                    <span className="text-xs truncate">{item.name}</span>
                  </div>
                  <span className="text-[10px] font-mono text-gray-400 shrink-0">
                    {item.quantity} {item.unit || "unit"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-2 pt-2 border-t border-gray-100">
          <button
            type="button"
            disabled={!selectedNames.length}
            onClick={() => {
              onFindRecipes(selectedNames);
              onClose();
            }}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
          >
            <Search className="w-4 h-4" /> 1. Search Catalog for Selected ({selectedNames.length})
          </button>

          <button
            type="button"
            disabled={!selectedNames.length}
            onClick={() => {
              onGenerateAI(selectedNames);
              onClose();
            }}
            className="w-full py-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
          >
            <Sparkles className="w-4 h-4 text-amber-500" /> 2. Generate Custom AI Recipe with Selected
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExpiringItemsModal;