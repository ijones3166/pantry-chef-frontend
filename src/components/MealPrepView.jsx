import React, { useState } from "react";
import { Calendar, Clock, Package, CheckSquare, Square } from "lucide-react";



function MealPrepView({ onClose, recipes = [], pantryItems = [], onScheduleMeal, onAddToInventory }) {
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [batchMultiplier, setBatchMultiplier] = useState(3);
  const [prepPrompt, setPrepPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [prepDays] = useState(['Sunday Prep', 'Tuesday Reheat', 'Thursday Restock']);

  // Inline quick-add item states
  const [quickItemName, setQuickItemName] = useState("");
  const [quickItemQty, setQuickItemQty] = useState(1);
  const [quickItemUnit, setQuickItemUnit] = useState("lbs");

  const handleQuickAddIngredient = (e) => {
    e.preventDefault();
    if (!quickItemName.trim()) return;

    if (onAddToInventory) {
      onAddToInventory({
        name: quickItemName.trim(),
        quantity: quickItemQty,
        unit: quickItemUnit,
        category: 'Produce/Protein',
        estimatedDaysToExpiry: 7,
      });
    }

    setQuickItemName("");
    setQuickItemQty(1);
  };

  const handleSaveAndInventory = () => {
    if (!selectedRecipe) return;

    if (onScheduleMeal) {
      onScheduleMeal({
        recipe: selectedRecipe,
        multiplier: batchMultiplier,
        scheduledSlots: prepDays,
      });
    }

    if (onAddToInventory) {
      onAddToInventory({
        name: `Prepped: ${selectedRecipe.title}`,
        quantity: batchMultiplier,
        unit: 'portions',
        category: 'Prepared Meals',
        estimatedDaysToExpiry: 5,
      });
    }

    alert(`Successfully locked in prep plan! Added ${batchMultiplier} portions of "${selectedRecipe.title}" to your inventory.`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl w-full max-w-4xl p-6 shadow-2xl relative max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="flex justify-between items-center pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-xl font-black text-amber-400 flex items-center gap-2">
              <span>🍱</span> Smart Meal Prep & Batch Engine
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Cook once, eat thrice. Add ingredients and sync prepped meals directly from here.
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6 overflow-y-auto flex-1">
          
          {/* Left Column: Choose Base & Quick Add */}
          <div className="flex flex-col gap-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              1. Choose or Build Your Prep Base
            </h3>

            {/* Quick-Add Base Ingredient (Inline) */}
            <div className="p-3 bg-slate-800/40 rounded-2xl border border-slate-800 space-y-2">
              <label className="text-[10px] font-bold text-slate-300 uppercase flex items-center gap-1">
                <Plus className="w-3 h-3 text-emerald-400" /> Quick-Add Missing Base Ingredient
              </label>
              <form onSubmit={handleQuickAddIngredient} className="flex gap-2">
                <input
                  type="text"
                  value={quickItemName}
                  onChange={(e) => setQuickItemName(e.target.value)}
                  placeholder="e.g. Chicken breast, Rice..."
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-emerald-500"
                />
                <input
                  type="number"
                  value={quickItemQty}
                  onChange={(e) => setQuickItemQty(Number(e.target.value))}
                  className="w-14 bg-slate-900 border border-slate-700 rounded-xl px-2 py-1.5 text-xs text-center text-white outline-none"
                />
                <select
                  value={quickItemUnit}
                  onChange={(e) => setQuickItemUnit(e.target.value)}
                  className="w-16 bg-slate-900 border border-slate-700 rounded-xl px-1.5 py-1.5 text-xs text-white outline-none"
                >
                  <option value="lbs">lbs</option>
                  <option value="kg">kg</option>
                  <option value="pcs">pcs</option>
                  <option value="cups">cups</option>
                </select>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer shrink-0"
                >
                  Add
                </button>
              </form>
            </div>
            
            {/* Existing Library Selection */}
            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
              <div className="text-[10px] font-bold text-slate-500 uppercase">Select from your recipes & pantry matches:</div>
              {recipes.length > 0 ? (
                recipes.map((r) => (
                  <div
                    key={r.id || r.title}
                    onClick={() => setSelectedRecipe(r)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex justify-between items-center ${
                      selectedRecipe?.title === r.title 
                        ? 'bg-amber-500/10 border-amber-500 text-amber-300' 
                        : 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-800 text-slate-200'
                    }`}
                  >
                    <div>
                      <div className="font-semibold text-xs">{r.title}</div>
                      <div className="text-[10px] text-slate-400">{r.prepTime || '30 mins'} • Match: {r.matchPercentage || 100}%</div>
                    </div>
                    {selectedRecipe?.title === r.title && <span className="text-amber-400 font-bold text-xs">✓ Selected</span>}
                  </div>
                ))
              ) : (
                <div className="p-3 text-center text-slate-500 text-xs bg-slate-800/20 rounded-xl border border-dashed border-slate-800">
                  No recipes found. Use quick-add above or AI prompt below!
                </div>
              )}
            </div>

            {/* AI Assistant (Toned Down & Out of the way) */}
            <div className="p-3 bg-slate-800/30 rounded-2xl border border-slate-800 space-y-1.5">
              <label className="text-[9px] font-bold text-slate-400 uppercase flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" /> Or Ask AI Prep Assistant
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={prepPrompt}
                  onChange={(e) => setPrepPrompt(e.target.value)}
                  placeholder="e.g. High protein meal prep..."
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-amber-400"
                />
                <button
                  onClick={() => {
                    setIsGenerating(true);
                    setTimeout(() => {
                      setSelectedRecipe({
                        title: prepPrompt ? `Custom Prep: ${prepPrompt}` : "Batch Garlic Herb Chicken",
                        prepTime: "45 mins",
                        servings: 4,
                      });
                      setIsGenerating(false);
                    }, 800);
                  }}
                  disabled={isGenerating}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs rounded-xl transition-colors cursor-pointer shrink-0"
                >
                  {isGenerating ? "..." : "AI Generate"}
                </button>
              </div>
            </div>

            {/* Batch Scale Multiplier */}
            {selectedRecipe && (
              <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-800 space-y-2">
                <label className="text-[10px] font-bold text-slate-300 uppercase block">
                  Batch Multiplier (Portions to Store):
                </label>
                <div className="flex gap-2">
                  {[2, 3, 4, 6].map((num) => (
                    <button
                      key={num}
                      onClick={() => setBatchMultiplier(num)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
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

          {/* Right Column: Leftover Schedule & Inventory Sync Preview */}
          <div className="flex flex-col gap-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              2. Leftover Schedule & Inventory Sync
            </h3>

            {selectedRecipe ? (
              <div className="space-y-4">
                <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-2xl space-y-2">
                  <div className="text-xs text-amber-300 font-bold flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" /> Scheduled Distribution:
                  </div>
                  <div className="text-xs text-slate-300 space-y-1.5">
                    <div className="flex justify-between py-1 border-b border-slate-800/60">
                      <span className="text-slate-400">Meal 1 (Fresh Cook):</span>
                      <span className="text-white font-medium">{prepDays[0]}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800/60">
                      <span className="text-slate-400">Meal 2 (Leftover Reheat):</span>
                      <span className="text-white font-medium">{prepDays[1]}</span>
                    </div>
                    {batchMultiplier >= 3 && (
                      <div className="flex justify-between py-1">
                        <span className="text-slate-400">Meal 3 (Batch Transformation):</span>
                        <span className="text-white font-medium">{prepDays[2]}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl space-y-2">
                  <div className="text-xs text-emerald-400 font-bold flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5" /> Inventory Auto-Sync:
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Upon completion, <strong className="text-emerald-300">{batchMultiplier} portions</strong> of <span className="text-white underline">{selectedRecipe.title}</span> will be added to your inventory under <span className="font-mono text-emerald-400">Prepared Meals</span>.
                  </p>
                </div>
              </div>
            ) : (
              <div className="h-full min-h-[220px] flex flex-col items-center justify-center border border-dashed border-slate-800 rounded-2xl p-6 text-center text-slate-500 text-xs space-y-2">
                <ChefHat className="w-8 h-8 text-slate-700" />
                <p>Select a recipe, quick-add ingredients, or use AI above to configure your batch prep plan.</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveAndInventory}
            disabled={!selectedRecipe}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              selectedRecipe 
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/20' 
                : 'bg-slate-800 text-slate-600 cursor-not-allowed'
            }`}
          >
            <span>✨ Lock Plan & Sync to Inventory</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </div>
  );
}

export default MealPrepView;