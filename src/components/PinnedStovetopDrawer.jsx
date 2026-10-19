import React, { useState } from "react";
import { Pin, Clock, X, ChevronUp, ChevronDown, Flame, Maximize2, Minimize2 } from "lucide-react";

const isSameDish = (dishA, dishB) => {
  if (!dishA || !dishB) return false;
  const idA = dishA.firestoreId || dishA.id;
  const idB = dishB.firestoreId || dishB.id;
  if (idA && idB && idA === idB) return true;
  const titleA = (dishA.title || dishA.recipeTitle || "").trim().toLowerCase();
  const titleB = (dishB.title || dishB.recipeTitle || "").trim().toLowerCase();
  return titleA.length > 0 && titleA === titleB;
};

const PinnedStovetopDrawer = ({
  pinnedRecipes = [],
  onUnpinRecipe,
  onClearAll,
  onOpenScheduler,
  onSelectRecipe,
  globalTimers = [],
  onOpenScheduleManager,
  onMaximizeHud,
  isHudMaximized = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState("recipes");

  if (!pinnedRecipes.length && !globalTimers.length) return null;

  const hasActiveTimers = globalTimers.length > 0;
  const activeTimersCount = globalTimers.filter((t) => t.phase !== "finished").length;
  
  const unscheduledPinnedCount = pinnedRecipes.filter(
    (p) => !globalTimers.some((t) => isSameDish(t.recipeData || { title: t.recipeTitle, id: t.id }, p))
  ).length;

  const earliestTimer = hasActiveTimers
    ? [...globalTimers].sort((a, b) => a.remaining - b.remaining)[0]
    : null;

  const formatRemaining = (seconds) => {
    if (seconds === undefined || seconds === null) return "";
    if (seconds >= 3600) {
      const h = Math.floor(seconds / 3600);
      const m = Math.floor((seconds % 3600) / 60);
      return `${h}h ${m}m`;
    }
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  let statusHeadline = "";
  if (hasActiveTimers && unscheduledPinnedCount > 0) {
    statusHeadline = `${activeTimersCount} Cooking • ${unscheduledPinnedCount} Pinned`;
  } else if (hasActiveTimers) {
    statusHeadline = `${activeTimersCount} Active Dish Timer${activeTimersCount > 1 ? "s" : ""}`;
  } else {
    statusHeadline = `${pinnedRecipes.length} Dish${pinnedRecipes.length > 1 ? "es" : ""} Pinned`;
  }

  const aggregatedIngredients = pinnedRecipes.reduce((acc, recipe) => {
    (recipe.allIngredients || []).forEach((ing) => {
      const name = (ing.name || ing).trim();
      const existing = acc.find((item) => item.name.toLowerCase() === name.toLowerCase());
      if (existing) {
        existing.sources.push(recipe.title);
      } else {
        acc.push({
          name,
          quantity: ing.quantity || 1,
          unit: ing.unit || "unit",
          sources: [recipe.title],
        });
      }
    });
    return acc;
  }, []);

  return (
    <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-40 w-full max-w-lg px-4 pointer-events-none animate-in slide-in-from-bottom-4">
      <div className={`backdrop-blur-md text-white rounded-2xl shadow-2xl border p-3.5 pointer-events-auto space-y-3 transition-colors ${
        hasActiveTimers
          ? "bg-gray-900/95 border-amber-500/60 shadow-amber-500/10"
          : "bg-gray-900/95 border-gray-700"
      }`}>
        {/* Dock Bar */}
        <div className="flex items-center justify-between gap-3">
          <div
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 cursor-pointer select-none min-w-0 flex-1"
          >
            {hasActiveTimers ? (
              <div className="p-1.5 bg-amber-500 rounded-lg text-white shrink-0 animate-pulse">
                <Flame className="w-3.5 h-3.5 fill-current" />
              </div>
            ) : (
              <div className="p-1.5 bg-amber-500 rounded-lg text-white shrink-0">
                <Pin className="w-3.5 h-3.5 fill-current" />
              </div>
            )}

            <div className="min-w-0 flex-1">
              <span className="text-xs font-bold block leading-tight truncate">
                {statusHeadline}
              </span>
              <span className="text-[10px] text-gray-400 block truncate">
                {hasActiveTimers
                  ? `Next: ${earliestTimer?.recipeTitle || "Cooking"} (${earliestTimer?.phase || "schedule"})`
                  : isExpanded
                  ? "Tap to collapse"
                  : "Tap to inspect dishes & ingredients"}
              </span>
            </div>

            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
            ) : (
              <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" />
            )}
          </div>

          {/* Action Controls */}
          <div className="flex items-center gap-2 shrink-0">
            {hasActiveTimers ? (
              <>
                <span className="font-mono text-xs font-black text-amber-400 px-2 py-1 bg-black/40 rounded-lg">
                  {formatRemaining(earliestTimer?.remaining)}
                </span>

                {/* TOGGLE HUD BUTTON (EXPAND / COLLAPSE) */}
                {onMaximizeHud && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onMaximizeHud();
                    }}
                    className={`p-1.5 rounded-xl border transition-colors cursor-pointer ${
                      isHudMaximized
                        ? "bg-amber-500/20 border-amber-500/40 text-amber-300 hover:bg-amber-500/30"
                        : "bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white border-gray-700"
                    }`}
                    title={isHudMaximized ? "Minimize floating timer cards to dock" : "Maximize floating timer cards HUD"}
                  >
                    {isHudMaximized ? (
                      <Minimize2 className="w-3.5 h-3.5" />
                    ) : (
                      <Maximize2 className="w-3.5 h-3.5" />
                    )}
                  </button>
                )}

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenScheduleManager && onOpenScheduleManager();
                  }}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm transition-colors cursor-pointer"
                >
                  <Clock className="w-3.5 h-3.5" /> Manage
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={onOpenScheduler}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
              >
                <Clock className="w-3.5 h-3.5" /> Schedule Meal
              </button>
            )}

            {!hasActiveTimers && (
              <button
                type="button"
                onClick={onClearAll}
                className="p-1.5 text-gray-400 hover:text-white rounded-lg cursor-pointer"
                title="Unpin all dishes"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Expanded Drawer Content */}
        {isExpanded && (
          <div className="space-y-3 pt-2 border-t border-gray-800 animate-in fade-in">
            <div className="flex bg-gray-800 p-0.5 rounded-lg text-[10px] font-bold">
              <button
                type="button"
                onClick={() => setActiveTab("recipes")}
                className={`flex-1 py-1 rounded-md transition-colors cursor-pointer ${
                  activeTab === "recipes" ? "bg-gray-700 text-white" : "text-gray-400"
                }`}
              >
                Dishes ({pinnedRecipes.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("ingredients")}
                className={`flex-1 py-1 rounded-md transition-colors cursor-pointer ${
                  activeTab === "ingredients" ? "bg-gray-700 text-white" : "text-gray-400"
                }`}
              >
                Combined Staples ({aggregatedIngredients.length})
              </button>
            </div>

            {activeTab === "recipes" && (
              <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1 font-sans">
                {pinnedRecipes.map((dish) => {
                  const activeTimer = globalTimers.find((t) =>
                    isSameDish(t.recipeData || { title: t.recipeTitle, id: t.id }, dish)
                  );

                  return (
                    <div
                      key={dish.id || dish.title}
                      className="p-2.5 bg-gray-800/80 rounded-xl flex items-center justify-between gap-2 border border-gray-700/60"
                    >
                      <div
                        onClick={() => onSelectRecipe(dish)}
                        className="min-w-0 flex-1 cursor-pointer hover:text-indigo-300 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold truncate">{dish.title}</p>
                          {activeTimer && (
                            <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                              activeTimer.phase === "cook"
                                ? "bg-red-500/20 text-red-300 border border-red-500/30"
                                : activeTimer.phase === "prep"
                                ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                : "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                            }`}>
                              {activeTimer.phase}
                            </span>
                          )}
                        </div>

                        <div className="text-[10px] text-gray-400 flex items-center gap-2 mt-0.5">
                          {activeTimer ? (
                            <span className="font-mono text-amber-400 font-bold">
                              ⏱️ {formatRemaining(activeTimer.remaining)} remaining
                            </span>
                          ) : (
                            <>
                              <span>⏱️ Prep: {dish.prepTime || "15m"}</span>
                              {dish.cookTime && <span>🔥 Cook: {dish.cookTime}</span>}
                            </>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => onUnpinRecipe(dish)}
                        className="p-1 text-gray-400 hover:text-red-400 rounded-lg cursor-pointer transition-colors"
                        title="Remove dish"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {activeTab === "ingredients" && (
              <div className="max-h-52 overflow-y-auto space-y-1 pr-1 font-mono text-[11px]">
                {aggregatedIngredients.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-1.5 bg-gray-800/60 rounded-lg flex items-center justify-between text-gray-300"
                  >
                    <span className="truncate flex-1 font-sans">{item.name}</span>
                    <span className="text-[9px] text-gray-500 font-sans truncate max-w-[120px]">
                      {item.sources.join(", ")}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PinnedStovetopDrawer;