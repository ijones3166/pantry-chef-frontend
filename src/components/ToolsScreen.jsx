import React, { useState } from "react";
import { 
  ChefHat, 
  Droplet, 
  ShieldAlert, 
  Clock, 
  Flame, 
  Sparkles, 
  Calendar, 
  Box 
} from "lucide-react";

export default function ToolsScreen({ onNavigateToPlanner }) {
  const [activeTab, setActiveTab] = useState("knife");

  const knifeSkills = [
    {
      name: "Slice",
      desc: "Thin, broad cuts across the grain.",
      iconSvg: (
        <svg className="w-6 h-6 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="3" y1="8" x2="21" y2="8" />
          <line x1="3" y1="16" x2="21" y2="16" />
        </svg>
      )
    },
    {
      name: "Chop",
      desc: "Irregular, bite-sized pieces for stocks and stews.",
      iconSvg: (
        <svg className="w-6 h-6 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="4" width="6" height="5" rx="1" />
          <rect x="4" y="14" width="8" height="6" rx="1" />
          <rect x="15" y="13" width="6" height="8" rx="1" />
        </svg>
      )
    },
    {
      name: "Dice",
      desc: "Uniform, square cubes (Large 3/4\", Med 1/2\", Small 1/4\").",
      iconSvg: (
        <svg className="w-6 h-6 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="5" height="5" />
          <rect x="11" y="3" width="5" height="5" />
          <rect x="11" y="11" width="5" height="5" />
          <rect x="3" y="11" width="5" height="5" />
        </svg>
      )
    },
    {
      name: "Julienne",
      desc: "Long, ultra-thin matchsticks (1/8\" × 1/8\" × 2\").",
      iconSvg: (
        <svg className="w-6 h-6 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="6" y1="3" x2="6" y2="21" />
          <line x1="11" y1="3" x2="11" y2="21" />
          <line x1="16" y1="3" x2="16" y2="21" />
        </svg>
      )
    },
    {
      name: "Chiffonade",
      desc: "Tightly rolled leafy greens cut into delicate ribbons.",
      iconSvg: (
        <svg className="w-6 h-6 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 6 C 8 12, 16 0, 21 6" />
          <path d="M3 12 C 8 18, 16 6, 21 12" />
          <path d="M3 18 C 8 24, 16 12, 21 18" />
        </svg>
      )
    }
  ];

  const steakTemps = [
    { name: "Rare", temp: "120°F - 130°F", desc: "Cool red center, soft texture", badgeBg: "bg-red-600 text-white", centerColor: "#DC2626" },
    { name: "Medium Rare", temp: "130°F - 135°F", desc: "Warm red center, chef recommended", badgeBg: "bg-rose-500 text-white", centerColor: "#E11D48" },
    { name: "Medium", temp: "135°F - 145°F", desc: "Warm pink center, juicy firm bite", badgeBg: "bg-pink-600 text-white", centerColor: "#EC4899" },
    { name: "Medium Well", temp: "145°F - 155°F", desc: "Slight pink streak in center", badgeBg: "bg-amber-700 text-white", centerColor: "#B45309" },
    { name: "Well Done", temp: "160°F+", desc: "Little to no pink, fully cooked", badgeBg: "bg-stone-800 text-white", centerColor: "#44403C" },
  ];

  const cookingOils = [
    { name: "Avocado Oil", smoke: "520°F", heatLevel: 95, usage: "High-Heat Searing, Deep Frying, Roasting" },
    { name: "Peanut Oil", smoke: "450°F", heatLevel: 82, usage: "Frying, Asian Wok Cooking, Stir Fry" },
    { name: "Canola Oil", smoke: "400°F", heatLevel: 70, usage: "Baking, General Frying, Neutral Cooking" },
    { name: "Extra Virgin Olive Oil", smoke: "375°F", heatLevel: 55, usage: "Salad Dressings, Finishing, Low-Med Sauté" },
    { name: "Coconut Oil", smoke: "350°F", heatLevel: 48, usage: "Baking, Sautéing, Mild Curry Dishes" },
    { name: "Sesame Oil (Toasted)", smoke: "350°F", heatLevel: 45, usage: "Finishing Oil, Marinades, Sauces (Do not fry)" }
  ];

  const foodStorage = [
    { item: "Leafy Greens", tip: "Store with a dry paper towel in a sealed container to absorb excess moisture." },
    { item: "Fresh Soft Herbs (Cilantro/Parsley)", tip: "Treat like flowers! Trim stems and place upright in a glass of water, loosely covered." },
    { item: "Berries", tip: "Don't wash until ready to eat! Store in a paper-towel-lined vented container." },
    { item: "Avocados", tip: "Ripen on the counter. Once soft, transfer to the fridge to lock in ripeness for up to 5 days." },
    { item: "Bread", tip: "Never refrigerate (it stales faster!). Keep room temp or slice and freeze." },
    { item: "Ethylene Producers (Apples/Bananas)", tip: "Keep away from greens and tomatoes—they release gas that causes nearby produce to rot." }
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* 2. KITCHEN CHEAT SHEETS */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
          <ChefHat className="w-5 h-5 text-indigo-600" /> Kitchen Cheat Sheets
        </h2>

        {/* NAVIGATION TABS */}
        <div className="flex bg-gray-900 text-white p-1 rounded-2xl mb-6 overflow-x-auto scrollbar-hide">
          {[
            { id: "knife", label: "Knife Skills" },
            { id: "steak", label: "Steak Temps" },
            { id: "oils", label: "Cooking Oils" },
            { id: "storage", label: "Food Storage" },
            { id: "defrost", label: "Defrosting" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 min-w-[100px] py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer text-center ${
                activeTab === tab.id ? "bg-indigo-600 text-white shadow-sm" : "text-gray-400 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB CONTENT */}
        <div>
          {/* KNIFE SKILLS */}
          {activeTab === "knife" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {knifeSkills.map((k) => (
                <div key={k.name} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-start gap-4">
                  <div className="p-3 bg-white rounded-xl shadow-sm border border-gray-200/80 shrink-0">
                    {k.iconSvg}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm">{k.name}</h3>
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{k.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* STEAK TEMPS */}
          {activeTab === "steak" && (
            <div className="space-y-3">
              {steakTemps.map((st) => (
                <div key={st.name} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-12 rounded-full shrink-0 shadow-inner" 
                      style={{ backgroundColor: st.centerColor }}
                      title="Inner Meat Visual"
                    />
                    <div>
                      <h3 className="font-bold text-gray-900 text-sm">{st.name}</h3>
                      <p className="text-xs text-gray-500">{st.desc}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold ${st.badgeBg}`}>
                    {st.temp}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* COOKING OILS */}
          {activeTab === "oils" && (
            <div className="space-y-3">
              {cookingOils.map((oil) => (
                <div key={oil.name} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Droplet className="w-4 h-4 text-amber-500 fill-amber-500" />
                      <h3 className="font-bold text-gray-900 text-sm">{oil.name}</h3>
                    </div>
                    <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100 font-mono">
                      Smoke Point: {oil.smoke}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 font-medium">Best for: <span className="text-gray-900">{oil.usage}</span></p>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-amber-400 via-orange-500 to-red-600 h-1.5 rounded-full"
                      style={{ width: `${oil.heatLevel}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* FOOD STORAGE */}
          {activeTab === "storage" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {foodStorage.map((s) => (
                  <div key={s.item} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-1">
                    <div className="flex items-center gap-2">
                      <Box className="w-4 h-4 text-indigo-600" />
                      <h3 className="font-bold text-gray-900 text-sm">{s.item}</h3>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed">{s.tip}</p>
                  </div>
                ))}
              </div>

              {/* Shelf Life Engine Feature Callout */}
              <div className="bg-indigo-50/70 p-4 rounded-2xl border border-indigo-100 flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                <div className="text-xs text-indigo-950 leading-relaxed">
                  <span className="font-bold text-indigo-900">Did you know?</span> Items added to your <strong>Pantry</strong> auto-calculate recommended shelf life and alert you before they spoil!
                </div>
              </div>
            </div>
          )}

          {/* DEFROSTING & PLANNER FEATURE PLUG */}
          {activeTab === "defrost" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-2">
                  <div className="flex items-center gap-2 text-green-700">
                    <ShieldAlert className="w-4 h-4" />
                    <h3 className="font-bold text-xs uppercase tracking-wide">1. Fridge Thaw (Gold Standard)</h3>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Move items to the lowest fridge shelf 24–48 hours ahead. Keeps meat safe below 40°F during thawing.
                  </p>
                </div>

                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-2">
                  <div className="flex items-center gap-2 text-amber-600">
                    <Clock className="w-4 h-4" />
                    <h3 className="font-bold text-xs uppercase tracking-wide">2. Cold Water Bath</h3>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Submerge sealed vacuum bag in cold tap water. Change water every 30 mins. Thaws in 1–3 hours.
                  </p>
                </div>

                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-2">
                  <div className="flex items-center gap-2 text-red-600">
                    <Flame className="w-4 h-4" />
                    <h3 className="font-bold text-xs uppercase tracking-wide">3. Microwave Defrost</h3>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Use 30% power settings. Must cook immediately after defrosting as edges begin to warm into danger zone.
                  </p>
                </div>
              </div>

              {/* Defrost Lead Time Feature Plug */}
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-5 rounded-2xl shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-start gap-3">
                  <Calendar className="w-6 h-6 text-yellow-300 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-sm">Never Forget to Defrost Meat Again</h4>
                    <p className="text-xs text-indigo-100 mt-0.5">
                      When you schedule meals in your <strong>Meal Planner</strong>, Pantry Chef automatically calculates frozen lead-time and alerts you when to move items to the fridge.
                    </p>
                  </div>
                </div>
                {onNavigateToPlanner && (
                  <button
                    onClick={onNavigateToPlanner}
                    className="px-4 py-2 bg-white text-indigo-600 text-xs font-bold rounded-xl shadow-sm hover:bg-indigo-50 transition-colors shrink-0 cursor-pointer"
                  >
                    Open Meal Planner
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}