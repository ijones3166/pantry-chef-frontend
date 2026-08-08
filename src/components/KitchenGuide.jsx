import React, { useState } from "react";
import { BookOpen, Snowflake, Zap, Refrigerator, Home, Box } from "lucide-react";

export default function KitchenGuide() {
  const [activeGuide, setActiveGuide] = useState("knife");

  return (
    <div className="bg-slate-900 p-6 rounded-3xl shadow-xl border border-slate-800 text-white">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-black text-sm text-white flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-indigo-400" /> Kitchen Cheat Sheets
        </h3>
      </div>

      <div className="flex bg-slate-800 p-1 rounded-xl mb-4 overflow-x-auto no-scrollbar gap-1 border border-slate-700/50">
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
                ? "bg-indigo-600 shadow-md text-white"
                : "text-slate-400 hover:text-white cursor-pointer"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeGuide === "knife" && (
        <div className="space-y-3 animate-in fade-in">
          {[
            { title: "Slice", desc: "Thin, broad cuts across the food.", previewBg: "bg-indigo-500/20 border-indigo-400/40", visual: <div className="h-1 bg-indigo-400 rounded-full w-full my-auto"></div> },
            { title: "Chop", desc: "Irregular pieces, roughly bite-sized.", previewBg: "bg-orange-500/20 border-orange-400/40", visual: <div className="grid grid-cols-2 gap-1 w-full h-full p-1"><div className="bg-orange-400 rounded-xs"></div><div className="bg-orange-400 rounded-xs"></div><div className="bg-orange-400 rounded-xs"></div><div className="bg-orange-400 rounded-xs"></div></div> },
            { title: "Dice", desc: "Small, uniform cubes (approx 1/4 inch).", previewBg: "bg-emerald-500/20 border-emerald-400/40", visual: <div className="grid grid-cols-3 gap-0.5 w-full h-full p-1"><div className="bg-emerald-400"></div><div className="bg-emerald-400"></div><div className="bg-emerald-400"></div><div className="bg-emerald-400"></div><div className="bg-emerald-400"></div><div className="bg-emerald-400"></div></div> },
            { title: "Julienne", desc: "Long, thin matchsticks.", previewBg: "bg-rose-500/20 border-rose-400/40", visual: <div className="flex gap-1 w-full h-full p-1"><div className="w-1 bg-rose-400 h-full rounded-full"></div><div className="w-1 bg-rose-400 h-full rounded-full"></div><div className="w-1 bg-rose-400 h-full rounded-full"></div></div> }
          ].map((k, i) => (
            <div key={i} className="flex items-center gap-3 bg-slate-800/80 p-3 rounded-2xl border border-slate-700/60 shadow-2xs">
              <div className={`w-12 h-12 rounded-xl border flex items-center justify-center shrink-0 overflow-hidden ${k.previewBg}`}>
                {k.visual}
              </div>
              <div>
                <h4 className="font-bold text-xs text-white">{k.title}</h4>
                <p className="text-[11px] text-slate-300 leading-tight mt-0.5">{k.desc}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeGuide === "meat" && (
        <div className="space-y-3 animate-in fade-in">
          {[
            { label: "Rare", temp: "125°F", desc: "Cool red center", core: "bg-rose-600", band: "bg-rose-800" },
            { label: "Med Rare", temp: "135°F", desc: "Warm red center", core: "bg-rose-500", band: "bg-rose-700" },
            { label: "Medium", temp: "145°F", desc: "Warm pink center", core: "bg-pink-400", band: "bg-rose-600" },
            { label: "Med Well", temp: "150°F", desc: "Slightly pink center", core: "bg-amber-300", band: "bg-amber-700" },
            { label: "Well Done", temp: "160°F+", desc: "Little or no pink", core: "bg-amber-700", band: "bg-stone-800" },
          ].map((grade, i) => (
            <div key={i} className="flex items-center gap-3 bg-slate-800/80 p-3 rounded-2xl border border-slate-700/60">
              
              {/* 🥩 Steak Cross-Section Container */}
              <div className="w-14 h-10 bg-amber-950 border-2 border-stone-800 rounded-tr-2xl rounded-bl-2xl rounded-tl-lg rounded-br-lg shadow-md flex items-center justify-center p-1 relative overflow-hidden shrink-0">
                {/* Outer Cooked Band */}
                <div className={`w-full h-full rounded-tr-xl rounded-bl-xl rounded-tl-sm rounded-br-sm flex items-center justify-center p-1 ${grade.band}`}>
                  {/* Internal Core Doneness */}
                  <div className={`w-3/5 h-3/5 rounded-full ${grade.core} shadow-inner flex items-center justify-center`}>
                    <span className="text-[8px] font-mono font-black text-stone-900 opacity-90">{grade.temp}</span>
                  </div>
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-xs text-white truncate">{grade.label}</h4>
                <p className="text-[11px] text-slate-300 mt-0.5 truncate">{grade.desc}</p>
              </div>
              
              <span className="text-xs font-mono font-bold text-indigo-300 bg-indigo-500/20 border border-indigo-500/30 px-2.5 py-1 rounded-xl shrink-0">
                {grade.temp}
              </span>
            </div>
          ))}
        </div>
      )}

      {activeGuide === "oils" && (
        <div className="space-y-3 animate-in fade-in">
          {[
            { name: "Butter", temp: "300°F", use: "Flavor / Baking", level: 20, icon: "🧈" },
            { name: "Olive Oil (EVOO)", temp: "325°F", use: "Dressings / Dip", level: 35, icon: "🫒" },
            { name: "Vegetable / Canola", temp: "400°F", use: "Frying / Baking", level: 70, icon: "🌻" },
            { name: "Peanut Oil", temp: "450°F", use: "High Heat Frying", level: 85, icon: "🥜" },
            { name: "Avocado Oil", temp: "520°F", use: "High Heat Searing", level: 100, icon: "🥑" },
          ].map((oil, i) => (
            <div key={i} className="flex items-center gap-3 bg-slate-800/80 p-3 rounded-2xl border border-slate-700/60">
              <div className="w-11 h-11 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center text-xl shrink-0 shadow-inner">
                {oil.icon}
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-white truncate">{oil.name}</span>
                  <span className="font-mono text-indigo-300 font-bold shrink-0">{oil.temp}</span>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-700">
                  <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${oil.level}%` }}></div>
                </div>
                <p className="text-[10px] text-slate-400">Best for: <span className="text-slate-200 font-bold">{oil.use}</span></p>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeGuide === "storage" && (
        <div className="space-y-2 animate-in fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-blue-500/10 p-3.5 rounded-2xl border border-blue-500/30">
              <h4 className="font-bold text-blue-300 text-xs mb-2 uppercase tracking-wide flex items-center gap-1.5">
                <span>🧊</span> Fridge
              </h4>
              <ul className="text-[11px] text-slate-200 space-y-1.5 list-disc pl-3">
                <li>Leafy Greens</li>
                <li>Berries</li>
                <li>Carrots (in water)</li>
                <li>Apples (crisper)</li>
              </ul>
            </div>
            
            <div className="bg-amber-500/10 p-3.5 rounded-2xl border border-amber-500/30">
              <h4 className="font-bold text-amber-300 text-xs mb-2 uppercase tracking-wide flex items-center gap-1.5">
                <span>🧺</span> Counter
              </h4>
              <ul className="text-[11px] text-slate-200 space-y-1.5 list-disc pl-3">
                <li>Tomatoes</li>
                <li>Potatoes (dark)</li>
                <li>Onions (separate)</li>
                <li>Garlic</li>
              </ul>
            </div>

            <div className="bg-indigo-500/10 p-3.5 rounded-2xl border border-indigo-500/30">
              <h4 className="font-bold text-indigo-300 text-xs mb-2 uppercase tracking-wide flex items-center gap-1.5">
                <span>❄️</span> Freezer
              </h4>
              <ul className="text-[11px] text-slate-200 space-y-1.5 list-disc pl-3">
                <li>Sliced Bread</li>
                <li>Raw Meats & Fish</li>
                <li>Berries (for smoothies)</li>
                <li>Stock / Broth</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {activeGuide === "defrost" && (
        <div className="space-y-3 animate-in fade-in">
          <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700/60 space-y-1">
            <h4 className="font-bold text-xs text-white flex items-center gap-1.5">
              <Snowflake className="w-4 h-4 text-blue-400" /> Refrigerator (Best)
            </h4>
            <p className="text-[11px] text-slate-300 leading-relaxed">Slow & safe. Keeps quality high. (Approx. 24 hrs per 5 lbs)</p>
          </div>
          <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700/60 space-y-1">
            <h4 className="font-bold text-xs text-white flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-400" /> Cold Water Bath (Faster)
            </h4>
            <p className="text-[11px] text-slate-300 leading-relaxed">Submerge food in a leak-proof bag. Change cold water every 30 minutes.</p>
          </div>
        </div>
      )}
    </div>
  );
}