import React, { useState } from "react";
import { 
  Clock, X, ChevronRight, Plus, 
  Trash2, FastForward, Rewind
} from "lucide-react";

// Robust unified dish comparator
const isSameDish = (dishA, dishB) => {
  if (!dishA || !dishB) return false;
  const idA = dishA.firestoreId || dishA.id;
  const idB = dishB.firestoreId || dishB.id;
  if (idA && idB && idA === idB) return true;
  const titleA = (dishA.title || dishA.recipeTitle || "").trim().toLowerCase();
  const titleB = (dishB.title || dishB.recipeTitle || "").trim().toLowerCase();
  return titleA.length > 0 && titleA === titleB;
};

function ActiveScheduleManagerModal({
  isOpen,
  onClose,
  globalTimers = [],
  pinnedRecipes = [],
  onSelectRecipe,
  onCancelTimer,
  onClearAllTimers,
  onAdjustTargetTime,
  onAppendDishToSchedule,
}) {
  const [showOverrideConfirm, setShowOverrideConfirm] = useState(false);

  if (!isOpen) return null;

  // Filter out any pinned recipe that is already in globalTimers
  const unscheduledPinnedDishes = pinnedRecipes.filter(
    (pinned) => !globalTimers.some(
      (timer) => isSameDish(timer.recipeData || { title: timer.recipeTitle, id: timer.id }, pinned)
    )
  );

  const formatRemaining = (seconds) => {
    if (seconds >= 3600) {
      const h = Math.floor(seconds / 3600);
      const m = Math.floor((seconds % 3600) / 60);
      return `${h}h ${m}m`;
    }
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const primaryTargetTime = globalTimers[0]?.targetClockTime || "Target Time";

  // Prevent shifting target time into the past
  const now = new Date();
  const currentTargetDate = globalTimers[0]?.targetDate 
    ? (globalTimers[0].targetDate instanceof Date ? globalTimers[0].targetDate : new Date(globalTimers[0].targetDate))
    : new Date();

  const maxDishDurationMins = globalTimers.reduce(
    (max, t) => Math.max(max, (t.prepMins || 15) + (t.cookMins || 20)), 
    0
  );
  const earliestAllowedTarget = new Date(now.getTime() + maxDishDurationMins * 60 * 1000);
  const canShiftEarlier = (currentTargetDate.getTime() - 15 * 60 * 1000) >= earliestAllowedTarget.getTime();

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[140] flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl space-y-5 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500 text-white rounded-2xl shadow-sm">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base text-gray-900">Active Cooking Schedule</h3>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                {globalTimers.length + unscheduledPinnedDishes.length} on Stovetop: {globalTimers.length} Cooking, {unscheduledPinnedDishes.length} Staged
              </p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="p-1.5 hover:bg-gray-100 rounded-full cursor-pointer"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Target Serving Time Controller */}
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-2xl border border-indigo-100 flex items-center justify-between gap-3 shadow-2xs">
          <div>
            <span className="text-[10px] font-black text-indigo-950 uppercase tracking-wider block">
              Target Finish / Serving Time
            </span>
            <span className="text-xl font-black text-indigo-900">
              {primaryTargetTime}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={!canShiftEarlier}
              onClick={() => onAdjustTargetTime(-15)}
              className={`px-2.5 py-1.5 border rounded-xl text-xs font-bold transition-colors flex items-center gap-1 ${
                canShiftEarlier
                  ? "bg-white border-indigo-200 hover:bg-indigo-100 text-indigo-700 cursor-pointer shadow-2xs"
                  : "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed opacity-50"
              }`}
              title={canShiftEarlier ? "Shift target 15 minutes earlier" : "Cannot shift earlier: dishes need more time to finish"}
            >
              <Rewind className="w-3.5 h-3.5" /> -15m
            </button>
            <button
              type="button"
              onClick={() => onAdjustTargetTime(15)}
              className="px-2.5 py-1.5 bg-white border border-indigo-200 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl shadow-2xs transition-colors flex items-center gap-1 cursor-pointer"
              title="Push target 15 minutes later"
            >
              <FastForward className="w-3.5 h-3.5" /> +15m
            </button>
          </div>
        </div>

        {/* Active Dishes Stack */}
        <div className="space-y-2.5">
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Scheduled Dishes in Progress:
          </h4>

          {globalTimers.map((timer) => {
            const isCooking = timer.phase === "cook";
            const isPrepping = timer.phase === "prep";

            return (
              <div
                key={timer.id}
                className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 shadow-2xs transition-all ${
                  isCooking
                    ? "bg-red-50/60 border-red-200"
                    : isPrepping
                    ? "bg-amber-50/60 border-amber-200"
                    : "bg-gray-50 border-gray-200"
                }`}
              >
                <div
                  className="min-w-0 flex-1 cursor-pointer group"
                  onClick={() => {
                    if (timer.recipeData) {
                      onSelectRecipe(timer.recipeData);
                      onClose();
                    }
                  }}
                  title="Click to inspect recipe details"
                >
                  <div className="flex items-center gap-2">
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                      isCooking
                        ? "bg-red-600 text-white"
                        : isPrepping
                        ? "bg-amber-600 text-white"
                        : "bg-gray-200 text-gray-700"
                    }`}>
                      {timer.phase}
                    </span>
                    <span className="text-xs font-mono font-bold text-gray-500">
                      {timer.phase === "countdown"
                        ? `Prep at ${timer.prepClockTime}`
                        : timer.phase === "prep"
                        ? `Cook at ${timer.cookClockTime}`
                        : `Ready at ${timer.targetClockTime}`}
                    </span>
                  </div>

                  <p className="text-sm font-black text-gray-900 group-hover:text-indigo-600 transition-colors truncate mt-1">
                    {timer.recipeTitle}
                  </p>
                  <span className="text-[10px] text-gray-400 block">
                    Duration: {timer.prepMins}m prep / {timer.cookMins}m cook (Tap to view ↗)
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-mono font-black text-sm tracking-wider px-2.5 py-1 bg-white border border-gray-200 rounded-xl text-gray-900 shadow-2xs">
                    {formatRemaining(timer.remaining)}
                  </span>
                  <button
                    type="button"
                    onClick={() => onCancelTimer(timer.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    title="Stop timer for this dish"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Newly Pinned Dishes Append Section */}
        {unscheduledPinnedDishes.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-2.5">
            <span className="text-[10px] font-black text-amber-900 uppercase tracking-wider block">
              Newly Pinned (Not Yet Scheduled):
            </span>
            <div className="space-y-2">
              {unscheduledPinnedDishes.map((dish, i) => (
                <div key={i} className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-amber-200 gap-2">
                  <span className="text-xs font-bold text-gray-900 truncate flex-1">
                    {dish.title}
                  </span>
                  <button
                    type="button"
                    onClick={() => onAppendDishToSchedule(dish)}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-bold rounded-lg shadow-2xs transition-colors cursor-pointer flex items-center gap-1 shrink-0"
                  >
                    <Plus className="w-3 h-3" /> Add to Schedule
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="pt-2 border-t border-gray-100 flex flex-col gap-2">
          {showOverrideConfirm ? (
            <div className="bg-red-50 border border-red-200 p-3.5 rounded-2xl space-y-2 text-center">
              <p className="text-xs font-bold text-red-900">
                Cancel all {globalTimers.length} running timers and clear schedule?
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowOverrideConfirm(false)}
                  className="flex-1 py-2 bg-white border border-gray-200 text-gray-700 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Keep Schedule
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onClearAllTimers();
                    setShowOverrideConfirm(false);
                    onClose();
                  }}
                  className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl cursor-pointer"
                >
                  Stop Everything
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowOverrideConfirm(true)}
              className="w-full py-2.5 text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
            >
              Cancel Entire Schedule
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold rounded-xl cursor-pointer shadow-sm"
          >
            Close Manager
          </button>
        </div>

      </div>
    </div>
  );
}

export default ActiveScheduleManagerModal;