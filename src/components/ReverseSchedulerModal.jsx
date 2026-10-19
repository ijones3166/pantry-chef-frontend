import React, { useState } from "react";
import { Clock, Calendar, X, Play } from "lucide-react";



function ReverseSchedulerModal({ pinnedRecipes = [], onClose, onStartScheduledTimers, onUnpinRecipe }) {
  const [targetTime, setTargetTime] = useState("19:00"); // Default dinner time 7:00 PM

  const parsePrepMinutes = (prepTimeString) => {
    if (!prepTimeString) return 30;
    const numbers = prepTimeString.match(/\d+/g);
    if (!numbers) return 30;
    const hasHours = /h(ou)?r/i.test(prepTimeString);
    if (hasHours && numbers.length > 1) {
      return parseInt(numbers[0]) * 60 + parseInt(numbers[1]);
    } else if (hasHours) {
      return parseInt(numbers[0]) * 60;
    } else {
      return parseInt(numbers[0]);
    }
  };

  const [targetHours, targetMins] = targetTime.split(":").map(Number);
  const now = new Date();
  const targetDate = new Date();
  targetDate.setHours(targetHours, targetMins, 0, 0);

  // Rollover check: If target time is earlier than or equal to now, advance to tomorrow
  if (targetDate.getTime() <= now.getTime()) {
    targetDate.setDate(targetDate.getDate() + 1);
  }
  const isTomorrow = targetDate.getDate() !== now.getDate();

  const scheduledDishes = pinnedRecipes.map((recipe) => {
    const prepMins = parsePrepMinutes(recipe.prepTime || "15 mins");
    const cookMins = parsePrepMinutes(recipe.cookTime || "0 mins");
    const durationMins = prepMins + cookMins;
    const startTime = new Date(targetDate.getTime() - durationMins * 60000);

    return {
      ...recipe,
      prepMins,
      cookMins,
      durationMins,
      startTime
    };
  }).sort((a, b) => b.durationMins - a.durationMins);

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl space-y-5 animate-in slide-in-from-bottom">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600 text-white rounded-2xl shadow-sm">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base text-gray-900">Multi-Dish Reverse-Scheduler</h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Sync finish times for {pinnedRecipes.length} pinned dishes</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-full cursor-pointer">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Target Time Picker */}
        <div className="flex items-center justify-between bg-indigo-50 p-4 rounded-2xl border border-indigo-100">
          <div>
            <p className="text-xs font-bold text-indigo-900">Target Serving / Finish Time</p>
            <p className="text-[10px] text-indigo-600">When do you want everything on the table?</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
              isTomorrow
                ? "bg-purple-100 text-purple-700 border border-purple-200"
                : "bg-emerald-100 text-emerald-700 border border-emerald-200"
            }`}>
              {isTomorrow ? "Tomorrow" : "Tonight"}
            </span>
            <input
              type="time"
              value={targetTime}
              onChange={(e) => setTargetTime(e.target.value)}
              className="p-2.5 bg-white border border-indigo-200 rounded-xl text-sm font-bold text-indigo-900 outline-none cursor-pointer shadow-xs"
            />
          </div>
        </div>

        {/* Timeline Checklist */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Calculated Start Timeline:</h4>
          {scheduledDishes.length === 0 ? (
            <div className="p-8 text-center bg-gray-50 border border-dashed border-gray-200 rounded-2xl text-xs text-gray-400">
              No dishes pinned. Pin up to 3 dishes in Cooking Mode to use the scheduler.
            </div>
          ) : (
            <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
              {scheduledDishes.map((dish, i) => (
                <div key={i} className="bg-gray-50 p-3.5 rounded-2xl border border-gray-200 flex items-center justify-between gap-3 shadow-2xs">
                  <div className="space-y-0.5 min-w-0 flex-1">
                    <span className="text-[10px] font-bold text-indigo-600 uppercase">
                      Start at {formatTime(dish.startTime)}
                    </span>
                    <p className="text-sm font-black text-gray-900 truncate">{dish.title}</p>
                    <p className="text-[10px] text-gray-400">
                      Total: {dish.durationMins} mins (Prep: {dish.prepMins}m, Cook: {dish.cookMins}m)
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div className="w-7 h-7 rounded-full bg-white border border-gray-200 flex items-center justify-center text-xs font-bold font-mono text-gray-700 shadow-2xs">
                      #{i + 1}
                    </div>
                    {onUnpinRecipe && (
                      <button
                        type="button"
                        onClick={() => onUnpinRecipe(dish)}
                        className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="Remove dish from schedule"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Button */}
        {pinnedRecipes.length > 0 && (
          <button
            onClick={() => {
              onStartScheduledTimers(scheduledDishes, targetDate);
              onClose();
            }}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all"
          >
            <Play className="w-4 h-4" /> Queue Start Alarms & Timeline
          </button>
        )}

      </div>
    </div>
  );
}

export default ReverseSchedulerModal;