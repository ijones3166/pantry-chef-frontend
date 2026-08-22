import React, { useState, useEffect } from "react";
import { X, Loader, ShoppingCart, CheckCircle, Clock } from "lucide-react";
import { collection, serverTimestamp, writeBatch, doc } from "firebase/firestore";

const SideRecipeModal = ({ 
  sideName, 
  inventory, 
  communityRecipes, 
  onClose, 
  onSelectRecipe, 
  onAddToGrocery, 
  onAddToPantry,
  fetchAIRecipes, 
  activeFilters, 
  userProfile,
  db,
  appId,
  effectiveUserId
}) => {
  const [loadingSides, setLoadingSides] = useState(true);
  const [sideRecipes, setSideRecipes] = useState([]);
  const [loadingStep, setLoadingStep] = useState(0);

  // Progressive loading messages for slow AI generation
  const loadingMessages = [
    `Searching local catalog for ${sideName}...`,
    `Consulting AI culinary engine for ${sideName}...`,
    `Formulating authentic ingredient ratios & steps...`,
    `Calculating live pantry match percentages...`,
    `Saving new recipe permanently to your database...`
  ];

  useEffect(() => {
    if (!loadingSides) return;
    const interval = setInterval(() => {
      setLoadingStep(prev => (prev + 1) % loadingMessages.length);
    }, 4000); // Rotates every 4 seconds
    return () => clearInterval(interval);
  }, [loadingSides, loadingMessages.length]);

  useEffect(() => {
    let isMounted = true;
    const loadSideRecipes = async () => {
      setLoadingSides(true);
      
      // 1. Check local database first (Zero API cost)
      const queryStr = sideName.toLowerCase();
      const localMatches = communityRecipes.filter(r => 
        r.title?.toLowerCase().includes(queryStr) || 
        r.description?.toLowerCase().includes(queryStr)
      );

      if (localMatches.length > 0 && isMounted) {
        setSideRecipes(localMatches);
        setLoadingSides(false);
        return;
      }

      // 2. Fallback: On-demand AI generation & automatic database persistence
      try {
        const aiResults = await fetchAIRecipes(
          inventory,
          [],
          userProfile,
          `Side dish recipe for ${sideName}`,
          activeFilters,
          "recipe"
        );

        if (aiResults && aiResults.length > 0 && isMounted) {
          setSideRecipes(aiResults);

          // 👉 Automatically store generated side recipes in Firestore immediately
          if (db && appId) {
            try {
              const batch = writeBatch(db);
              const coreCatalogRef = collection(db, `/artifacts/${appId}/public/data/userRecipes`);
              
              aiResults.forEach((recipe) => {
                const newDocRef = doc(coreCatalogRef);
                batch.set(newDocRef, {
                  ...recipe,
                  createdAt: serverTimestamp(),
                  createdBy: effectiveUserId || "ai_engine",
                  authorName: "Pantry Chef AI",
                  authorImage: null,
                  isAI: true,
                  likeCount: 0
                });
              });

              await batch.commit();
              console.log(`[Side Engine] New recipe for "${sideName}" successfully saved to database!`);
            } catch (saveErr) {
              console.error("Failed to persist side recipes:", saveErr);
            }
          }
        }
      } catch (err) {
        console.error("Failed to generate side dish recipes:", err);
      } finally {
        if (isMounted) setLoadingSides(false);
      }
    };

    loadSideRecipes();
    return () => { isMounted = false; };
  }, [sideName, inventory, communityRecipes, fetchAIRecipes, activeFilters, userProfile, db, appId, effectiveUserId]);

  return (
    <div className="fixed inset-0 bg-black/60 z-[80] flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b pb-3">
          <div>
            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md uppercase tracking-wider">Side Dish Companion</span>
            <h3 className="font-black text-lg text-gray-900 capitalize">{sideName}</h3>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full bg-gray-50 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {loadingSides ? (
          <div className="py-16 flex flex-col items-center justify-center space-y-4 text-center px-4">
            <Loader className="w-8 h-8 animate-spin text-indigo-600" />
            <div className="space-y-1">
              <p className="text-xs font-bold text-gray-800 transition-all duration-300">
                {loadingMessages[loadingStep]}
              </p>
              <p className="text-[10px] text-gray-400">
                Generating custom culinary clones takes a moment—building your new database recipe!
              </p>
            </div>
          </div>
        ) : sideRecipes.length > 0 ? (
          <div className="space-y-4">
            {sideRecipes.map((recipe, idx) => {
              const total = recipe.allIngredients?.length || 0;
              const matchedIngs = total > 0 ? recipe.allIngredients.filter(ing => 
                inventory.some(inv => inv.name?.toLowerCase().includes(ing.name?.toLowerCase()) || ing.name?.toLowerCase().includes(inv.name?.toLowerCase()))
              ) : [];
              const matchPct = total > 0 ? Math.round((matchedIngs.length / total) * 100) : 0;
              const missingIngs = recipe.allIngredients?.filter(ing => 
                !inventory.some(inv => inv.name?.toLowerCase().includes(ing.name?.toLowerCase()) || ing.name?.toLowerCase().includes(inv.name?.toLowerCase()))
              ).map(i => i.name) || [];

              return (
                <div key={idx} className="bg-gray-50 border border-gray-200/80 rounded-2xl p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 
                        onClick={() => { onClose(); onSelectRecipe(recipe); }}
                        className="font-bold text-gray-900 text-sm hover:text-indigo-600 cursor-pointer transition-colors"
                      >
                        {recipe.title}
                      </h4>
                      <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{recipe.description}</p>
                    </div>
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-md shrink-0">
                      {matchPct}% Match
                    </span>
                  </div>

                  {/* Ingredients with Have / Need Toggles */}
                  <div className="space-y-1.5 pt-2 border-t border-gray-200/60">
                    <span className="text-[10px] font-bold text-gray-400 uppercase">Ingredients & Pantry Status:</span>
                    <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
                      {recipe.allIngredients?.map((ing, i) => {
                        const matchedItem = inventory.find((invItem) =>
                          invItem.name?.toLowerCase().includes(ing.name?.toLowerCase()) ||
                          ing.name?.toLowerCase().includes(invItem.name?.toLowerCase())
                        );
                        const inPantry = Boolean(matchedItem);

                        return (
                          <div key={i} className="flex items-center justify-between text-xs py-1 px-2 bg-white rounded-xl border border-gray-100">
                            <span className="flex items-center gap-2">
                              {inPantry ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> : <span className="w-3.5 h-3.5 text-rose-400 font-bold text-center shrink-0">✗</span>}
                              <span className={`truncate max-w-[200px] ${inPantry ? "font-bold text-gray-800" : "text-gray-500"}`}>
                                {ing.quantity} {ing.unit !== "unit" ? ing.unit : ""} {ing.name}
                              </span>
                            </span>

                            <button
                              onClick={async () => {
                                if (inPantry && matchedItem?.id && db) {
                                  await deleteDoc(doc(db, `/artifacts/${appId}/users/${effectiveUserId}/inventory`, matchedItem.id)).catch(() => {});
                                } else if (!inPantry) {
                                  if (onAddToPantry) {
                                    await onAddToPantry(ing.name);
                                  }
                                }
                              }}
                              className={`px-2 py-1 rounded-lg text-[9px] font-bold flex items-center gap-1 cursor-pointer transition-colors shrink-0 ${
                                inPantry
                                  ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                                  : "bg-rose-100 text-rose-700 hover:bg-rose-200"
                              }`}
                            >
                              {inPantry ? "In Stock (Have)" : "Missing (Need)"}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-gray-500 pt-1 border-t border-gray-200/40">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-indigo-500" /> {recipe.prepTime || "20 mins"}
                    </span>
                    
                    {missingIngs.length > 0 && (
                      <button
                        onClick={() => onAddToGrocery(missingIngs)}
                        className="text-indigo-600 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <ShoppingCart className="w-3 h-3" /> Add {missingIngs.length} Missing to Cart
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-12 text-center text-gray-400 text-xs">
            No recipes found for this side dish.
          </div>
        )}
      </div>
    </div>
  );
};

export default SideRecipeModal;