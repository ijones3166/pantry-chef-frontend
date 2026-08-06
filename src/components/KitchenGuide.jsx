import React, { useState } from "react";
import { BookOpen, ThermometerSun, Snowflake, Sun, RefreshCw, AlertTriangle, Zap } from "lucide-react";

export default function KitchenGuide() {
  const [activeGuide, setActiveGuide] = useState("knife");

  return (
    <div className="bg-white/10 p-6 rounded-3xl shadow-sm border border-white/10 text-white">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-white flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-indigo-400" /> Kitchen Cheat Sheets
        </h3>
      </div>

      <div className="flex bg-gray-800 p-1 rounded-xl mb-4 overflow-x-auto no-scrollbar gap-1">
        {[
          { id: "knife", label: "Knife Skills" },
          { id: "meat", label: "Steak Temps" },
          { id: "oils", label: "Cooking Oils" },
          { id: "storage", label: "Food Storage" },
          { id: "defrost", label: "Defrosting" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveGuide(tab.id)}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
              activeGuide === tab.id
                ? "bg-indigo-600 shadow text-white"
                : "text-gray-400 hover:text-white cursor-pointer"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeGuide === "knife" && (
        <div className="space-y-3 animate-in fade-in">
          {[
            { title: "Slice", desc: "Thin, broad cuts across the food.", grid: "h-1 bg-indigo-300 rounded-full w-full" },
            { title: "Chop", desc: "Irregular pieces, roughly bite-sized.", grid: "grid grid-cols-2 gap-1 p-1 bg-orange-300 rounded-sm" },
            { title: "Dice", desc: "Small, uniform cubes (approx 1/4 inch).", grid: "grid grid-cols-4 gap-0.5 p-1 bg-green-300 rounded-[1px]" },
            { title: "Julienne", desc: "Long, thin matchsticks.", grid: "flex gap-1 p-1 bg-red-300 rounded-sm" }
          ].map((k, i) => (
            <div key={i} className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/10">
              <div className="w-12 h-12 bg-gray-800 rounded-lg border border-gray-700 flex flex-col justify-evenly p-1">
                <div className="h-1 bg-indigo-300 rounded-full w-full"></div>
                <div className="h-1 bg-indigo-300 rounded-full w-full"></div>
              </div>
              <div>
                <h4 className="font-bold text-xs text-white">{k.title}</h4>
                <p className="text-[10px] text-gray-400">{k.desc}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeGuide === "meat" && (
        <div className="space-y-3 animate-in fade-in">
          {[
            { label: "Rare", temp: "125°F", desc: "Cool red center" },
            { label: "Med Rare", temp: "135°F", desc: "Warm red center" },
            { label: "Medium", temp: "145°F", desc: "Warm pink center" },
            { label: "Med Well", temp: "150°F", desc: "Slightly pink center" },
            { label: "Well Done", temp: "160°F+", desc: "Little or no pink" },
          ].map((grade, i) => (
            <div key={i} className="flex items-center justify-between bg-white/5 p-2 rounded-xl border border-white/10">
              <div>
                <h4 className="font-bold text-xs text-white">{grade.label}</h4>
                <p className="text-[10px] text-gray-400">{grade.desc}</p>
              </div>
              <span className="text-xs font-mono font-bold text-indigo-300 bg-indigo-500/20 px-2 py-1 rounded-lg">
                {grade.temp}
              </span>
            </div>
          ))}
        </div>
      )}

      {activeGuide === "oils" && (
        <div className="space-y-3 animate-in fade-in">
          {[
            { name: "Butter", temp: "300°F", use: "Flavor / Baking", level: 20 },
            { name: "Olive Oil (EVOO)", temp: "325°F", use: "Dressings / Dip", level: 30 },
            { name: "Vegetable/Canola", temp: "400°F", use: "Frying / Baking", level: 70 },
            { name: "Avocado Oil", temp: "520°F", use: "High Heat Searing", level: 100 },
          ].map((oil, i) => (
            <div key={i} className="bg-white/5 p-3 rounded-xl border border-white/10">
              <div className="flex justify-between text-xs mb-1">
                <span className="font-bold text-white">{oil.name}</span>
                <span className="font-mono text-gray-400">{oil.temp}</span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-2 mb-2 overflow-hidden">
                <div className="h-full bg-indigo-400" style={{ width: `${oil.level}%` }}></div>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-gray-400">
                Best for: <span className="font-bold text-white">{oil.use}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeGuide === "storage" && (
        <div className="space-y-2 animate-in fade-in">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-blue-500/10 p-3 rounded-xl border border-blue-500/20">
              <h4 className="font-bold text-blue-300 text-xs mb-2">Fridge</h4>
              <ul className="text-[10px] text-gray-300 space-y-1 list-disc pl-3">
                <li>Leafy Greens</li>
                <li>Berries</li>
                <li>Carrots (in water)</li>
                <li>Apples (crisper)</li>
              </ul>
            </div>
            <div className="bg-orange-500/10 p-3 rounded-xl border border-orange-500/20">
              <h4 className="font-bold text-orange-300 text-xs mb-2">Counter</h4>
              <ul className="text-[10px] text-gray-300 space-y-1 list-disc pl-3">
                <li>Tomatoes</li>
                <li>Potatoes (dark)</li>
                <li>Onions (separate)</li>
                <li>Garlic</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {activeGuide === "defrost" && (
        <div className="space-y-3 animate-in fade-in">
          <div className="flex items-start gap-3 bg-white/5 p-3 rounded-xl border border-white/10">
            <div>
              <h4 className="font-bold text-xs text-white">Refrigerator (Best)</h4>
              <p className="text-[10px] text-gray-400">Slow & safe. Keeps quality high. (24 hrs / 5lbs)</p>
            </div>
          </div>
          <div className="flex items-start gap-3 bg-white/5 p-3 rounded-xl border border-white/10">
            <div>
              <h4 className="font-bold text-xs text-white">Cold Water (Faster)</h4>
              <p className="text-[10px] text-gray-400">Submerge in leak-proof bag. Change every 30m.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}