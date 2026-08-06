import React, { useState, useEffect } from "react";
import { ArrowRightLeft } from "lucide-react";

export default function ConverterWidget() {
  const [convertCat, setConvertCat] = useState("Volume");
  const [amount, setAmount] = useState("1");
  const [fromUnit, setFromUnit] = useState("cup");
  const [toUnit, setToUnit] = useState("tbsp");
  const [result, setResult] = useState("");

  const factors = {
    Volume: {
      tsp: 4.92892,
      tbsp: 14.7868,
      fl_oz: 29.5735,
      cup: 236.588,
      pt: 473.176,
      qt: 946.353,
      gal: 3785.41,
      ml: 1,
      l: 1000,
    },
    Weight: { oz: 28.3495, lb: 453.592, g: 1, kg: 1000 },
    Temperature: {},
  };

  useEffect(() => {
    if (!amount) return setResult("");
    const val = parseFloat(amount);
    if (isNaN(val)) return setResult("...");
    if (convertCat === "Temperature") {
      if (fromUnit === "F" && toUnit === "C")
        setResult((((val - 32) * 5) / 9).toFixed(1));
      else if (fromUnit === "C" && toUnit === "F")
        setResult(((val * 9) / 5 + 32).toFixed(1));
      else setResult(val);
    } else {
      const base = val * factors[convertCat][fromUnit];
      const final = base / factors[convertCat][toUnit];
      setResult(final.toFixed(2).replace(/\.00$/, ""));
    }
  }, [amount, fromUnit, toUnit, convertCat]);

  return (
    <div className="bg-white/10 p-6 rounded-3xl shadow-sm border border-white/10 space-y-6 text-white">
      <div className="flex justify-center gap-4 mb-4">
        {["Volume", "Weight", "Temperature"].map((c) => (
          <button
            key={c}
            onClick={() => {
              setConvertCat(c);
              setFromUnit(
                Object.keys(
                  c === "Temperature" ? { F: 1, C: 1 } : factors[c]
                )[0]
              );
              setToUnit(
                Object.keys(
                  c === "Temperature" ? { F: 1, C: 1 } : factors[c]
                )[1]
              );
            }}
            className={`text-xs font-bold px-3 py-1 rounded-full cursor-pointer transition-all ${
              convertCat === c
                ? "bg-indigo-600 text-white"
                : "bg-white/10 text-gray-300 hover:bg-white/20"
            }`}
          >
            {c}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-4">
        <div className="flex-1 space-y-2">
          <label className="text-xs font-bold text-gray-400">AMOUNT</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full text-3xl font-bold p-2 bg-transparent border-b-2 border-indigo-300 focus:border-indigo-500 outline-none text-white"
          />
          <select
            value={fromUnit}
            onChange={(e) => setFromUnit(e.target.value)}
            className="w-full bg-gray-800 text-white text-sm font-medium rounded-lg p-1 cursor-pointer"
          >
            {convertCat === "Temperature"
              ? ["F", "C"].map((u) => (
                  <option key={u} value={u}>
                    °{u}
                  </option>
                ))
              : Object.keys(factors[convertCat]).map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
          </select>
        </div>
        <ArrowRightLeft className="w-5 h-5 text-gray-400 mt-4" />
        <div className="flex-1 space-y-2 text-right">
          <label className="text-xs font-bold text-gray-400">RESULT</label>
          <div className="w-full text-3xl font-bold p-2 border-b-2 border-transparent text-indigo-400">
            {result}
          </div>
          <select
            value={toUnit}
            onChange={(e) => setToUnit(e.target.value)}
            className="w-full bg-gray-800 text-white text-sm font-medium text-right rounded-lg p-1 cursor-pointer"
            dir="rtl"
          >
            {convertCat === "Temperature"
              ? ["C", "F"].map((u) => (
                  <option key={u} value={u}>
                    °{u}
                  </option>
                ))
              : Object.keys(factors[convertCat]).map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
          </select>
        </div>
      </div>
    </div>
  );
}