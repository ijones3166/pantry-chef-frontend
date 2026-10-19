import React, { useState } from "react";
import {
  Calendar,
  Download,
  Trash2,
  Clock,
  Zap,
  AlertCircle,
  Search,
} from "lucide-react";
import { generateICS } from "../utils/formatters";

const MealPlanner = ({
  plan = [],
  onAddMeal,
  onDeleteMeal,
  onGenerateDayPlan,
  onPlanExpiring,
  onBrowseRecipes,
  onSelectRecipe,
  allRecipes = [],
}) => {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const [selectedDay, setSelectedDay] = useState("Mon");

  const mealsForDay = plan
    .filter((p) => p.day === selectedDay)
    .sort((a, b) => {
      const orders = { Breakfast: 1, Lunch: 2, Dinner: 3 };
      return (orders[a.type] || 4) - (orders[b.type] || 4);
    });

  const handleExportDayICS = () => {
  if (!mealsForDay.length) return;

  try {
    // Format each meal with explicit title, summary, and description
    const events = mealsForDay.map((meal) => {
      const cleanMealName = meal.recipeTitle || "Scheduled Meal";
      const mealLabel = meal.type ? `${meal.type}: ${cleanMealName}` : cleanMealName;

      return {
        title: `🍽️ ${mealLabel}`,
        summary: `🍽️ ${mealLabel}`,
        recipeTitle: cleanMealName,
        description: `Meal: ${cleanMealName}\nType: ${meal.type || "Dinner"}\nPrep Time: ${meal.prepTime || "30 mins"}\nScheduled Time: ${meal.mealTime || "Evening"}\nPantry Chef Scheduled Meal.`,
        date: new Date(),
        durationMinutes: 60,
      };
    });

    const exportFileName = `pantry-chef-${selectedDay.toLowerCase()}-meals.ics`;
    const icsData = generateICS(events, exportFileName);

    // If generateICS returns a raw text string, trigger browser file download
    if (typeof icsData === "string") {
      const blob = new Blob([icsData], { type: "text/calendar;charset=utf-8" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", exportFileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    }
  } catch (err) {
    console.error("Failed to export meal plan ICS:", err);
    alert("Error generating calendar file.");
  }
};

  const handleMealClick = (meal) => {
    if (!onSelectRecipe) return;

    // 1. Exact ID match (covers Firestore ID and MealDB ID)
    let matched = allRecipes.find(
      (r) =>
        (meal.recipeId && (r.id === meal.recipeId || r.firestoreId === meal.recipeId))
    );

    // 2. Title fallback (handles batch multipliers like "Chili (3x Batch)")
    if (!matched && meal.recipeTitle) {
      const cleanPlannedTitle = meal.recipeTitle.toLowerCase().replace(/\s*\(\d+x batch\)/i, "").trim();
      matched = allRecipes.find((r) =>
        (r.title || "").toLowerCase().trim() === cleanPlannedTitle
      );
    }

    if (matched) {
      onSelectRecipe(matched);
    } else {
      // Fallback display card if source recipe document was deleted
      onSelectRecipe({
        title: meal.recipeTitle,
        prepTime: meal.prepTime || "30 mins",
        instructions: "1. Follow standard prep steps or reheat previously stored portions.",
        allIngredients: [],
        servings: 4,
      });
    }
  };

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
              onClick={handleExportDayICS}
              className="text-xs text-indigo-600 font-bold flex items-center bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors"
              title="Download calendar file for this day"
            >
              <Download className="w-3.5 h-3.5 mr-1" /> Sync Calendar
            </button>
          )}
        </div>

        {mealsForDay.length > 0 ? (
          <div className="space-y-3">
            {mealsForDay.map((meal) => (
              <div
                key={meal.id}
                onClick={() => handleMealClick(meal)}
                className="flex items-center justify-between p-3 bg-gray-50 hover:bg-indigo-50/40 rounded-xl border border-gray-100 hover:border-indigo-200 transition-all cursor-pointer group"
                title="Click to view full recipe details"
              >
                <div className="min-w-0 flex-1 pr-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">
                      {meal.type}
                    </span>
                    {meal.mealTime && (
                      <span className="text-[10px] text-gray-400 font-mono">
                        @ {meal.mealTime}
                      </span>
                    )}
                  </div>
                  <p className="font-semibold text-gray-800 text-sm truncate group-hover:text-indigo-600 transition-colors">
                    {meal.recipeTitle}
                  </p>
                  {meal.prepTime && (
                    <span className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" /> {meal.prepTime}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteMeal(meal.id);
                  }}
                  className="p-1.5 text-gray-300 hover:text-red-500 rounded-lg cursor-pointer transition-colors shrink-0"
                  title="Remove from meal plan"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 px-4 space-y-4">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-800">
                No meals planned for {selectedDay}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                Build your schedule with one tap:
              </p>
            </div>

            <div className="grid grid-cols-1 gap-2 max-w-sm mx-auto pt-2">
              <button
                type="button"
                onClick={() => onGenerateDayPlan && onGenerateDayPlan(selectedDay)}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Zap className="w-4 h-4 text-amber-300" /> Auto-Generate {selectedDay} Plan
              </button>

              <button
                type="button"
                onClick={() => onPlanExpiring && onPlanExpiring(selectedDay)}
                className="w-full py-2.5 bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <AlertCircle className="w-4 h-4 text-orange-500" /> Plan Around Expiring Pantry Items
              </button>

              <button
                type="button"
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