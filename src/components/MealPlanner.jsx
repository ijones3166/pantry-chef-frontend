import React, { useState } from "react";
import { Calendar, Plus, Trash2, Clock, ChefHat, Zap, AlertCircle, Search } from "lucide-react";







const MealPlanner = ({ plan, onAddMeal, onDeleteMeal, onGenerateDayPlan, onPlanExpiring, onBrowseRecipes }) => {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const [selectedDay, setSelectedDay] = useState("Mon");
  const mealsForDay = plan
    .filter((p) => p.day === selectedDay)
    .sort((a, b) => {
      const orders = { Breakfast: 1, Lunch: 2, Dinner: 3 };
      return (orders[a.type] || 4) - (orders[b.type] || 4);
    });

  return (
    <div className="space-y-4">
      <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide">
        {days.map((d) => (
          <button
            key={d}
            onClick={() => setSelectedDay(d)}
            className={`flex-shrink-0 w-12 h-16 rounded-xl flex flex-col items-center justify-center text-xs font-bold transition-all cursor-pointer ${
              selectedDay === d
                ? "bg-indigo-600 text-white shadow-lg"
                : "bg-white text-gray-500 border border-gray-100"
            }`}
          >
            <span>{d}</span>
            {plan.some((p) => p.day === d) && (
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full mt-1"></span>
            )}
          </button>
        ))}
      </div>
      
      <div className="bg-white rounded-3xl p-4 border border-gray-100 shadow-sm min-h-[300px]">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-gray-800 flex items-center">
            <Calendar className="w-5 h-5 mr-2 text-indigo-600" /> {selectedDay}'s Plan
          </h3>
          {mealsForDay.length > 0 && (
            <button
              onClick={() => generateICS(mealsForDay)}
              className="text-xs text-indigo-500 font-bold flex items-center bg-indigo-50 px-2 py-1 rounded-lg cursor-pointer"
            >
              <Download className="w-3 h-3 mr-1" /> Sync
            </button>
          )}
        </div>

        {mealsForDay.length > 0 ? (
          <div className="space-y-3">
            {mealsForDay.map((meal) => (
              <div
                key={meal.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100"
              >
                <div>
                  <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider">
                    {meal.type} {meal.mealTime && `@ ${meal.mealTime}`}
                  </span>
                  <p className="font-semibold text-gray-800 text-sm truncate w-48">
                    {meal.recipeTitle}
                  </p>
                </div>
                <button
                  onClick={() => onDeleteMeal(meal.id)}
                  className="text-gray-400 hover:text-red-500 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          /* ACTIONABLE EMPTY STATE */
          <div className="text-center py-8 px-4 space-y-4">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-800">No meals planned for {selectedDay}</p>
              <p className="text-xs text-gray-400 mt-0.5">Let's build your schedule with one tap:</p>
            </div>

            <div className="grid grid-cols-1 gap-2 max-w-sm mx-auto pt-2">
              <button
                onClick={() => onGenerateDayPlan && onGenerateDayPlan(selectedDay)}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Zap className="w-4 h-4 text-amber-300" /> Auto-Generate {selectedDay} Plan
              </button>
              
              <button
                onClick={() => onPlanExpiring && onPlanExpiring(selectedDay)}
                className="w-full py-2.5 bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <AlertCircle className="w-4 h-4 text-orange-500" /> Plan Around Expiring Pantry Items
              </button>

              <button
                onClick={() => onBrowseRecipes && onBrowseRecipes()}
                className="w-full py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-600 border border-gray-200 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Search className="w-4 h-4 text-gray-400" /> Browse Recipe Library
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};


export default MealPlanner;