import React from "react";
import { X, Check, Flame, DollarSign, Scale, Utensils, Sparkles, Clock, CheckCircle, ShoppingCart } from "lucide-react";



function RecipeComparisonModal({
  selectedRecipes = [],
  inventory = [],
  onClose,
  onSelectRecipe,
  onAddMissingToGrocery
}) {
  if (!selectedRecipes || selectedRecipes.length === 0) return null;

  const calculateMatch = (allIngredients = []) => {
    if (!allIngredients.length) return 100;
    let matched = 0;
    allIngredients.forEach((ing) => {
      const inStock = inventory.some((inv) =>
        inv.name.toLowerCase().includes(ing.name.toLowerCase()) ||
        ing.name.toLowerCase().includes(inv.name.toLowerCase())
      );
      if (inStock) matched++;
    });
    return Math.round((matched / allIngredients.length) * 100);
  };

  const getMissingIngredients = (allIngredients = []) => {
    return allIngredients.filter(
      (ing) =>
        !inventory.some((inv) =>
          inv.name.toLowerCase().includes(ing.name.toLowerCase()) ||
          ing.name.toLowerCase().includes(inv.name.toLowerCase())
        )
    );
  };

  return (
    
    <div className="fixed inset-0 bg-black/70 z-[130] flex items-center justify-center p-3 sm:p-6 animate-in fade-in">
      <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-3xl p-6 shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b border-gray-100 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-100 text-indigo-600 rounded-2xl">
              <Scale className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-lg text-gray-900 leading-tight">Recipe Comparison Matrix</h3>
              <p className="text-xs text-gray-400">Side-by-side breakdown of ingredients, prep time, and pantry match</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Comparison Grid */}
        <div className="flex-grow overflow-y-auto py-4 space-y-6 pr-1">
          <div className={`grid grid-cols-1 md:grid-cols-${Math.min(selectedRecipes.length, 3)} gap-4`}>
            {selectedRecipes.map((recipe, idx) => {
              const matchPct = recipe.matchPercentage ?? calculateMatch(recipe.allIngredients);
              const missingIngs = getMissingIngredients(recipe.allIngredients || []);

              return (
                <div key={idx} className="bg-gray-50 p-4 rounded-3xl border border-gray-200 flex flex-col justify-between space-y-4 relative">
                  
                  {/* Recipe Header & Image */}
                  <div className="space-y-3">
                    {recipe.image ? (
                      <img src={recipe.image} alt={recipe.title} className="w-full h-32 object-cover rounded-2xl shadow-xs" />
                    ) : (
                      <div className="w-full h-32 bg-gray-200 rounded-2xl flex items-center justify-center text-gray-400">
                        <Utensils className="w-8 h-8" />
                      </div>
                    )}

                    <div>
                      <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full inline-block mb-1.5 ${
                        matchPct === 100
                          ? "bg-green-100 text-green-700 border border-green-200"
                          : matchPct >= 50
                          ? "bg-amber-100 text-amber-800 border border-amber-200"
                          : "bg-gray-200 text-gray-700"
                      }`}>
                        ✨ {matchPct}% Pantry Match
                      </span>
                      <h4 className="font-black text-sm text-gray-900 leading-tight">{recipe.title}</h4>
                      <p className="text-[11px] text-gray-500 line-clamp-2 mt-1">{recipe.description}</p>
                    </div>

                    {/* At-a-Glance Stats */}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-200/60 text-xs">
                      <div className="flex items-center gap-1.5 text-gray-600">
                        <Clock className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        <span className="font-bold text-[11px]">{recipe.prepTime || "30 mins"}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-gray-600">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span className="font-bold text-[11px]">{recipe.nutrition?.calories ? `${recipe.nutrition.calories} kcal` : "N/A"}</span>
                      </div>
                    </div>

                    {/* Missing Ingredients Checklist */}
                    <div className="space-y-1.5 pt-2 border-t border-gray-200/60">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                        Missing Ingredients ({missingIngs.length})
                      </span>
                      {missingIngs.length === 0 ? (
                        <p className="text-xs text-green-600 font-bold flex items-center gap-1 bg-green-50 p-2 rounded-xl border border-green-200">
                          <CheckCircle className="w-3.5 h-3.5" /> All ingredients in stock!
                        </p>
                      ) : (
                        <ul className="space-y-1 max-h-28 overflow-y-auto pr-1">
                          {missingIngs.map((ing, iIdx) => (
                            <li key={iIdx} className="text-xs text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-100 flex items-center justify-between">
                              <span className="truncate">{ing.name}</span>
                              <span className="text-[10px] font-mono text-rose-400 font-bold">{ing.quantity} {ing.unit}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    {/* Recommended Sides */}
                    {recipe.recommendedSides && recipe.recommendedSides.length > 0 && (
                      <div className="space-y-1 pt-2 border-t border-gray-200/60">
                        <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider block">
                          Suggested Sides
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {recipe.recommendedSides.map((side, sIdx) => (
                            <span key={sIdx} className="text-[10px] font-medium bg-purple-50 text-purple-700 px-2 py-0.5 rounded-md border border-purple-100">
                              {side}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="space-y-2 pt-3 border-t border-gray-200">
                    {missingIngs.length > 0 && (
                      <button
                        onClick={() => onAddMissingToGrocery(missingIngs.map((i) => i.name))}
                        className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" /> Add Missing ({missingIngs.length})
                      </button>
                    )}

                    <button
                      onClick={() => {
                        onSelectRecipe(recipe);
                        onClose();
                      }}
                      className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      Focus This Recipe →
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}


export default RecipeComparisonModal;