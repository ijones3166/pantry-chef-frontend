import React, { useState } from "react";
import { DollarSign, X, Info } from "lucide-react";

const TakeoutArbitragePill = ({ recipe, servings, userProfile }) => {
  const [showModal, setShowModal] = useState(false);
  
  // Directly bind to the live interactive servings prop passed from RecipeDetailView
  const activeServings = servings !== undefined ? servings : (recipe.servings || 4);
  const title = (recipe.title || "").toLowerCase();

  let baseRestaurantPrice = 14.00; 
  let baseHomeCost = 3.50;
  let categoryName = "Casual Dining";

  if (title.includes("steak") || title.includes("salmon") || title.includes("ribeye") || title.includes("seafood") || title.includes("brisket")) {
    baseRestaurantPrice = 24.00;
    baseHomeCost = 5.50;
    categoryName = "Steakhouse / Seafood";
  } else if (title.includes("burger") || title.includes("taco") || title.includes("pizza") || title.includes("sandwich") || title.includes("chicken")) {
    baseRestaurantPrice = 13.00;
    baseHomeCost = 3.00;
    categoryName = "Fast Casual / Grill";
  } else if (title.includes("salad") || title.includes("soup") || title.includes("pasta") || title.includes("mac") || title.includes("vegan") || title.includes("ramen")) {
    baseRestaurantPrice = 11.00;
    baseHomeCost = 2.20;
    categoryName = "Cafe / Italian / Light";
  } else if (title.includes("roast") || title.includes("chili") || title.includes("curry")) {
    baseRestaurantPrice = 16.00;
    baseHomeCost = 4.00;
    categoryName = "Comfort / Batch";
  }

  let regionalMultiplier = 1.0;
  const zip = userProfile?.zipCode ? String(userProfile.zipCode).trim() : "";
  if (zip.startsWith("9") || zip.startsWith("0") || zip.startsWith("1")) {
    regionalMultiplier = 1.15; 
  } else if (zip.startsWith("4") || zip.startsWith("5") || zip.startsWith("7")) {
    regionalMultiplier = 0.95; 
  }

  const adjustedRestaurantPrice = baseRestaurantPrice * regionalMultiplier;
  const deliveryFeesAndTip = 6.00; 
  
  const totalTakeoutCost = (activeServings * adjustedRestaurantPrice) + deliveryFeesAndTip;
  const totalHomeCost = activeServings * (baseHomeCost * regionalMultiplier);
  const netSavings = Math.max(4, totalTakeoutCost - totalHomeCost);
  const savingsPercent = Math.round((netSavings / totalTakeoutCost) * 100);

  return (
    <>
      <div 
        onClick={() => setShowModal(true)}
        className="bg-gradient-to-br from-emerald-900 to-slate-900 text-white px-5 py-3.5 flex items-center justify-between gap-3 self-stretch cursor-pointer hover:opacity-95 transition-opacity group"
        title="Click for Arbitrage Breakdown"
      >
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 bg-emerald-500/20 border border-emerald-500/30 rounded-xl flex items-center justify-center shrink-0">
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-emerald-300 font-bold uppercase tracking-wider flex items-center gap-1">
              Takeout Arbitrage <Info className="w-3 h-3 opacity-60 group-hover:opacity-100" />
            </span>
            <span className="text-xs font-black text-white">Save ~${netSavings.toFixed(0)} vs Takeout ({activeServings} svgs)</span>
          </div>
        </div>
        <span className="text-[10px] text-emerald-400 font-bold underline opacity-80 group-hover:opacity-100 hidden sm:inline">Details</span>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-[80] flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4 animate-in slide-in-from-bottom">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-black text-base text-gray-900 flex items-center gap-2">
                💡 Takeout Arbitrage Breakdown
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-gray-700">
              <div className="bg-emerald-50 p-3 rounded-2xl border border-emerald-100 flex justify-between items-center">
                <div>
                  <p className="font-bold text-emerald-900 text-sm">Net Savings</p>
                  <p className="text-[10px] text-emerald-700">{savingsPercent}% cheaper than delivery apps</p>
                </div>
                <span className="text-2xl font-black text-emerald-600">${netSavings.toFixed(2)}</span>
              </div>

              <div className="space-y-2 pt-1">
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-500">Category Baseline:</span>
                  <span className="font-bold text-gray-900">{categoryName}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-500">Active Servings:</span>
                  <span className="font-bold text-gray-900">{activeServings} servings</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-500">Regional Factor (Zip {zip || "Default"}):</span>
                  <span className="font-bold text-gray-900">{regionalMultiplier}x adjustment</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
                  <p className="text-[10px] text-gray-400 uppercase font-bold">Cooking at Home</p>
                  <p className="text-base font-black text-gray-900 mt-1">${totalHomeCost.toFixed(2)}</p>
                  <p className="text-[10px] text-gray-500">~${(baseHomeCost * regionalMultiplier).toFixed(2)} / serving</p>
                </div>

                <div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
                  <p className="text-[10px] text-gray-400 uppercase font-bold">Delivery App Total</p>
                  <p className="text-base font-black text-red-600 mt-1">${totalTakeoutCost.toFixed(2)}</p>
                  <p className="text-[10px] text-gray-500">Includes markup & fees</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowModal(false)}
              className="w-full py-3 bg-gray-900 text-white rounded-xl font-bold text-xs hover:bg-gray-800 transition-colors cursor-pointer"
            >
              Got It
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default TakeoutArbitragePill;