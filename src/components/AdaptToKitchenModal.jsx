import React, { useState } from "react";
import { Sparkles, X, ShieldCheck, Heart, AlertCircle, Utensils } from "lucide-react";

const AdaptToKitchenModal = ({
  recipe,
  userProfile,
  inventory = [],
  isOpen,
  onClose,
  onApplyCustomAdaptation,
  loading = false,
}) => {
  if (!isOpen || !recipe) return null;

  const [toggles, setToggles] = useState({
    applyAllergies: Boolean(userProfile?.diets?.length),
    applyDislikes: Boolean(userProfile?.dislikedFoods?.trim()),
    applyHousehold: Boolean(userProfile?.familyModeActive && userProfile?.householdMembers?.length),
    applyEquipment: Boolean(userProfile?.equipment?.length),
    prioritizePantry: true,
  });

  const [customInstructions, setCustomInstructions] = useState("");

  const handleToggle = (key) => {
    setToggles((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleExecute = (e) => {
    e.preventDefault();
    onApplyCustomAdaptation({
      recipe,
      toggles,
      customInstructions: customInstructions.trim(),
    });
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[110] flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto animate-in zoom-in-95">
        <div className="flex justify-between items-center border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base text-gray-900">Adapt to My Kitchen</h3>
              <p className="text-[11px] text-gray-500">Fork a tailored private edition for your home</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleExecute} className="space-y-4">
          <div className="space-y-2">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">
              Active Household Rules
            </span>

            {userProfile?.diets?.length > 0 && (
              <label className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl border border-gray-200 cursor-pointer">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-bold text-gray-800">
                    Guard Diets: {userProfile.diets.join(", ")}
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={toggles.applyAllergies}
                  onChange={() => handleToggle("applyAllergies")}
                  className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
                />
              </label>
            )}

            {userProfile?.dislikedFoods && (
              <label className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl border border-gray-200 cursor-pointer">
                <div className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-rose-500" />
                  <span className="text-xs font-bold text-gray-800 truncate max-w-[280px]">
                    Omit Dislikes: {userProfile.dislikedFoods}
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={toggles.applyDislikes}
                  onChange={() => handleToggle("applyDislikes")}
                  className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
                />
              </label>
            )}

            {userProfile?.familyModeActive && userProfile?.householdMembers?.length > 0 && (
              <label className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl border border-gray-200 cursor-pointer">
                <div className="flex items-center gap-2">
                  <Utensils className="w-4 h-4 text-indigo-600" />
                  <span className="text-xs font-bold text-gray-800">
                    Adapt portions for {userProfile.householdMembers.length} family member(s)
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={toggles.applyHousehold}
                  onChange={() => handleToggle("applyHousehold")}
                  className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
                />
              </label>
            )}

            {userProfile?.equipment?.length > 0 && (
              <label className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl border border-gray-200 cursor-pointer">
                <div className="flex items-center gap-2">
                  <span className="text-sm">🛠️</span>
                  <span className="text-xs font-bold text-gray-800">
                    Target Owned Gear ({userProfile.equipment.slice(0, 2).join(", ")}...)
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={toggles.applyEquipment}
                  onChange={() => handleToggle("applyEquipment")}
                  className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
                />
              </label>
            )}
          </div>

          <div className="bg-indigo-50/70 p-3 rounded-2xl border border-indigo-100">
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <span className="text-xs font-bold text-indigo-950 block">
                  Prioritize Available Pantry Staples
                </span>
                <span className="text-[10px] text-indigo-700 block">
                  Replaces missing ingredients with items currently in stock ({inventory.length} items logged)
                </span>
              </div>
              <input
                type="checkbox"
                checked={toggles.prioritizePantry}
                onChange={() => handleToggle("prioritizePantry")}
                className="w-4 h-4 text-indigo-600 rounded cursor-pointer ml-3"
              />
            </label>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-gray-700">
              Special Tweaks for Tonight (Optional)
            </label>
            <textarea
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              placeholder="e.g., Make this in an air fryer, replace beef with chicken thighs, cut salt in half, make extra spicy"
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:border-indigo-500 resize-none h-20"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 text-gray-500 font-bold text-xs bg-gray-100 rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-md cursor-pointer transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              {loading ? "Adapting..." : "Fork Tailored Recipe"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdaptToKitchenModal;