import React, { useState } from "react";
import { X, ChefHat, Clock, Flame, Check } from "lucide-react";



function BatchCookingModal({ recipe, inventory, onClose, onSaveBatch }) {
  const baseServings = recipe?.servings || 4;
  const [multiplier, setMultiplier] = useState(3); // Default to 3x batch ("Eat Thrice+")
  const [targetDays, setTargetDays] = useState(["Tue", "Wed", "Thu"]); // Days to map leftovers
  const [storeInFreezer, setStoreInFreezer] = useState(true);

  const totalYieldServings = baseServings * multiplier;
  const dinnerPortions = baseServings;
  const leftoverPortions = totalYieldServings - dinnerPortions;
  const portionsPerDay = Math.floor(leftoverPortions / Math.max(1, targetDays.length));

  const availableDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const toggleTargetDay = (day) => {
    if (targetDays.includes(day)) {
      if (targetDays.length > 1) setTargetDays(targetDays.filter(d => d !== day));
    } else {
      setTargetDays([...targetDays, day]);
    }
  };

  const handleConfirmBatch = () => {
    onSaveBatch({
      recipe,
      multiplier,
      totalYieldServings,
      leftoverPortions,
      targetDays,
      storeInFreezer
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl space-y-5 animate-in slide-in-from-bottom">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-r from-green-500 to-teal-600 text-white rounded-2xl shadow-sm">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base text-gray-900">"Cook Once, Eat Thrice" Batch Engine</h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{recipe.title}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-full cursor-pointer">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Multiplier Slider */}
        <div className="space-y-2 bg-gray-50 p-4 rounded-2xl border border-gray-100">
          <div className="flex justify-between items-center text-xs font-bold text-gray-800">
            <span>Batch Multiplier Scale:</span>
            <span className="text-indigo-600 font-mono text-sm">{multiplier}x ({totalYieldServings} Total Servings)</span>
          </div>
          <input
            type="range"
            min="2"
            max="5"
            step="1"
            value={multiplier}
            chno="true"
            onChange={(e) => setMultiplier(parseInt(e.target.value))}
            className="w-full accent-indigo-600 h-2 bg-gray-200 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-gray-400 font-mono">
            <span>2x (Double)</span>
            <span>3x (Triple)</span>
            <span>4x (Quad)</span>
            <span>5x (Massive)</span>
          </div>
        </div>

        {/* Breakdown Yield Card */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-indigo-50/70 border border-indigo-100 p-3.5 rounded-2xl">
            <p className="text-[9px] font-bold text-indigo-700 uppercase">Immediate Dinner</p>
            <p className="text-xl font-black text-indigo-950 mt-0.5">{dinnerPortions} <span className="text-xs font-normal">Portions</span></p>
          </div>
          <div className="bg-emerald-50/70 border border-emerald-100 p-3.5 rounded-2xl">
            <p className="text-[9px] font-bold text-emerald-700 uppercase">Automated Leftovers</p>
            <p className="text-xl font-black text-emerald-950 mt-0.5">{leftoverPortions} <span className="text-xs font-normal">Portions</span></p>
          </div>
        </div>

        {/* Target Days Selector for Leftovers */}
        <div className="space-y-2">
          <label className="block text-[10px] font-bold text-gray-500 uppercase">Auto-Map Leftovers to Future Days</label>
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {availableDays.map((day) => {
              const isSelected = targetDays.includes(day);
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleTargetDay(day)}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    isSelected ? "bg-indigo-600 text-white border-indigo-600 shadow-sm" : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
          <p className="text-[10px] text-gray-400">
            App allocates approx. {portionsPerDay} leftover portion(s) across {targetDays.join(", ")}.
          </p>
        </div>

        {/* Storage Location Toggle */}
        <div className="flex items-center justify-between bg-gray-50 p-3.5 rounded-2xl border border-gray-100">
          <div className="flex items-center gap-2.5">
            <Package className="w-5 h-5 text-indigo-600" />
            <div>
              <p className="text-xs font-bold text-gray-800">Store Surplus in Freezer</p>
              <p className="text-[10px] text-gray-400">Syncs prepped portions directly into freezer inventory</p>
            </div>
          </div>
          <input
            type="checkbox"
            checked={storeInFreezer}
            onChange={(e) => setStoreInFreezer(e.target.checked)}
            className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 cursor-pointer"
          />
        </div>

        {/* Confirm Action */}
        <button
          onClick={handleConfirmBatch}
          className="w-full py-4 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-2xl font-bold shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all"
        >
          <CheckCircle className="w-5 h-5" /> Execute Batch Prep & Sync Schedule
        </button>

      </div>
    </div>
  );
}


export default BatchCookingModal;