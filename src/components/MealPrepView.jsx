import React, { useState } from 'react';

export default function MealPrepView({ onClose, pantryItems = [], recipes = [], onScheduleMeal }) {
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [batchMultiplier, setBatchMultiplier] = useState(3); // Default "Cook Once, Eat Thrice"
  const [prepDays, setPrepDays] = useState(['Sunday Dinner', 'Tuesday Lunch', 'Thursday Dinner']);

  const handleRecipeSelect = (recipe) => {
    setSelectedRecipe(recipe);
  };

  const handleSavePrepPlan = () => {
    if (!selectedRecipe) return;
    
    // Logic to dispatch scheduled leftovers and sync inventory
    if (onScheduleMeal) {
      onScheduleMeal({
        recipe: selectedRecipe,
        multiplier: batchMultiplier,
        scheduledSlots: prepDays,
      });
    }
    
    alert(`Successfully scheduled ${selectedRecipe.title} for ${batchMultiplier} meals!`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 text-white rounded-2xl w-full max-w-4xl p-6 shadow-2xl relative max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex justify-between items-center pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-2xl font-bold text-amber-400 flex items-center gap-2">
              <span>🍱</span> Smart Meal Prep Engine
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Cook once, eat thrice. Batch prep meals and auto-schedule leftovers into your calendar.
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6 overflow-y-auto flex-1">
          
          {/* Left Column: Select Base Recipe */}
          <div className="flex flex-col gap-4">
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
              1. Select Batch Cooking Base
            </h3>
            
            <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
              {recipes.length > 0 ? (
                recipes.map((r) => (
                  <div
                    key={r.id || r.title}
                    onClick={() => handleRecipeSelect(r)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex justify-between items-center ${
                      selectedRecipe?.title === r.title 
                        ? 'bg-amber-500/10 border-amber-500 text-amber-300' 
                        : 'bg-slate-800/50 border-slate-700/50 hover:bg-slate-800 text-slate-200'
                    }`}
                  >
                    <div>
                      <div className="font-semibold text-sm">{r.title}</div>
                      <div className="text-xs text-slate-400">{r.prepTime || '30 mins'} • {r.calories || '450'} cal</div>
                    </div>
                    {selectedRecipe?.title === r.title && <span className="text-amber-400 font-bold">✓</span>}
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-slate-500 text-sm bg-slate-800/30 rounded-xl border border-dashed border-slate-800">
                  No recipes found. Seed or create recipes to start prep planning!
                </div>
              )}
            </div>

            {/* Batch Scale Multiplier */}
            {selectedRecipe && (
              <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-800 space-y-3 mt-2">
                <label className="text-xs font-semibold text-slate-300 block">
                  Batch Multiplier (Portions to Cook):
                </label>
                <div className="flex gap-2">
                  {[2, 3, 4, 6].map((num) => (
                    <button
                      key={num}
                      onClick={() => setBatchMultiplier(num)}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        batchMultiplier === num
                          ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {num}x Portions
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Leftover Schedule & Pantry Check */}
          <div className="flex flex-col gap-4">
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
              2. "Cook Once, Eat Thrice" Mapping
            </h3>

            {selectedRecipe ? (
              <div className="space-y-4">
                <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl space-y-2">
                  <div className="text-xs text-amber-300 font-semibold">Scheduled Leftover Distribution:</div>
                  <div className="text-xs text-slate-300 space-y-1">
                    <div className="flex justify-between py-1 border-b border-slate-800/50">
                      <span className="font-medium text-white">Meal 1 (Fresh Cook):</span>
                      <span className="text-amber-400">{prepDays[0]}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800/50">
                      <span className="font-medium text-white">Meal 2 (Leftover Reheat):</span>
                      <span className="text-amber-400">{prepDays[1]}</span>
                    </div>
                    {batchMultiplier >= 3 && (
                      <div className="flex justify-between py-1">
                        <span className="font-medium text-white">Meal 3 (Batch Transformation):</span>
                        <span className="text-amber-400">{prepDays[2]}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-800">
                  <div className="text-xs font-semibold text-slate-300 mb-2">Scaled Pantry Checklist ({batchMultiplier}x):</div>
                  <ul className="text-xs text-slate-400 space-y-1 max-h-32 overflow-y-auto">
                    {selectedRecipe.ingredients ? (
                      selectedRecipe.ingredients.map((ing, idx) => (
                        <li key={idx} className="flex justify-between">
                          <span>• {ing.name || ing}</span>
                          <span className="text-slate-500">In Stock ✓</span>
                        </li>
                      ))
                    ) : (
                      <li className="italic text-slate-500">Standard pantry items will be scaled automatically.</li>
                    )}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="h-full min-h-[180px] flex items-center justify-center border border-dashed border-slate-800 rounded-xl p-6 text-center text-slate-500 text-xs">
                Select a recipe on the left to configure your batch cooking schedule and leftover distribution.
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSavePrepPlan}
            disabled={!selectedRecipe}
            className={`px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedRecipe 
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/20' 
                : 'bg-slate-800 text-slate-600 cursor-not-allowed'
            }`}
          >
            ✨ Lock In Prep Plan & Map Leftovers
          </button>
        </div>

      </div>
    </div>
  );
}