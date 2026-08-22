import React, { useState } from "react";
import { Trash2, BarChart3 } from "lucide-react";
import AdminRecipeIngestor from "./AdminRecipeIngestor";

export default function NutritionReportView({
  nutritionLogs = [],
  onDeleteLog,
  userProfile,
}) {
  const [timeframe, setTimeframe] = useState("week"); // 'week' or 'month'

  const now = new Date();
  const daysLimit = timeframe === "week" ? 7 : 30;
  const cutoff = new Date(now.getTime() - daysLimit * 24 * 60 * 60 * 1000);

  const filteredLogs = (nutritionLogs || []).filter((log) => {
    const logDate = log.timestamp?.toDate
      ? log.timestamp.toDate()
      : new Date(log.timestamp || Date.now());
    return logDate >= cutoff;
  });

  const totalCals = filteredLogs.reduce(
    (sum, item) => sum + (item.calories || 0),
    0
  );
  const totalProtein = filteredLogs.reduce(
    (sum, item) => sum + (item.protein || 0),
    0
  );
  const totalCarbs = filteredLogs.reduce(
    (sum, item) => sum + (item.carbs || 0),
    0
  );
  const totalFat = filteredLogs.reduce(
    (sum, item) => sum + (item.fat || 0),
    0
  );

  const avgCals = Math.round(totalCals / daysLimit);
  const avgProtein = Math.round(totalProtein / daysLimit);

  return (
    <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-sm space-y-5">
      <div className="flex justify-between items-center border-b border-gray-100 pb-3">
        <div>
          <h3 className="font-black text-gray-900 text-sm flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-indigo-600" /> Cooked Nutrition
            Analytics
          </h3>
          <p className="text-[10px] text-gray-400">
            Aggregated from in-app cooked meals
          </p>
        </div>

        <div className="flex bg-gray-100 p-0.5 rounded-xl text-[10px] font-bold">
          <button
            onClick={() => setTimeframe("week")}
            className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
              timeframe === "week"
                ? "bg-white shadow text-indigo-600"
                : "text-gray-500"
            }`}
          >
            7 Days
          </button>
          <button
            onClick={() => setTimeframe("month")}
            className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
              timeframe === "month"
                ? "bg-white shadow text-indigo-600"
                : "text-gray-500"
            }`}
          >
            30 Days
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-amber-50/70 p-3 rounded-2xl border border-amber-100">
          <p className="text-[9px] font-bold text-amber-700 uppercase">
            Avg Daily Calories
          </p>
          <p className="text-lg font-black text-amber-950 mt-0.5">
            {avgCals} <span className="text-xs font-normal">kcal</span>
          </p>
        </div>
        <div className="bg-indigo-50/70 p-3 rounded-2xl border border-indigo-100">
          <p className="text-[9px] font-bold text-indigo-700 uppercase">
            Avg Daily Protein
          </p>
          <p className="text-lg font-black text-indigo-950 mt-0.5">
            {avgProtein}g
          </p>
        </div>
        <div className="bg-emerald-50/70 p-3 rounded-2xl border border-emerald-100">
          <p className="text-[9px] font-bold text-emerald-700 uppercase">
            Total Carbs
          </p>
          <p className="text-lg font-black text-emerald-950 mt-0.5">
            {totalCarbs}g
          </p>
        </div>
        <div className="bg-purple-50/70 p-3 rounded-2xl border border-purple-100">
          <p className="text-[9px] font-bold text-purple-700 uppercase">
            Total Fats
          </p>
          <p className="text-lg font-black text-purple-950 mt-0.5">
            {totalFat}g
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <h4 className="text-xs font-bold text-gray-800 uppercase">
          Logged Meals ({filteredLogs.length})
        </h4>
        {filteredLogs.length === 0 ? (
          <p className="text-xs text-gray-400 italic bg-gray-50 p-4 rounded-2xl text-center">
            No cooked meals logged for this timeframe yet.
          </p>
        ) : (
          <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
            {filteredLogs.map((log) => (
              <div
                key={log.id}
                className="bg-gray-50 p-3 rounded-xl border border-gray-200 flex items-center justify-between"
              >
                <div>
                  <p className="text-xs font-bold text-gray-900">
                    {log.recipeTitle}
                  </p>
                  <p className="text-[10px] text-gray-500">
                    Eaten:{" "}
                    <span className="font-bold text-gray-700">
                      {log.servingsEaten} serving(s)
                    </span>{" "}
                    • {log.calories} kcal
                  </p>
                </div>
                {onDeleteLog && (
                  <button
                    onClick={() => onDeleteLog(log.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}