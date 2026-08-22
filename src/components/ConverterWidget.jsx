import React, { useState, useEffect } from "react";
import { Scale, ArrowRightLeft } from "lucide-react";

export default function ConverterWidget() {
  const [amount, setAmount] = useState("100");
  const [mode, setMode] = useState("temperature"); // volume, weight, temperature
  const [fromUnit, setFromUnit] = useState("F");
  const [toUnit, setToUnit] = useState("C");
  const [result, setResult] = useState("");

  useEffect(() => {
    const val = parseFloat(amount);
    if (isNaN(val)) {
      setResult("---");
      return;
    }

    if (mode === "temperature") {
      if (fromUnit === "F" && toUnit === "C") {
        setResult(((val - 32) * (5 / 9)).toFixed(1));
      } else if (fromUnit === "C" && toUnit === "F") {
        setResult(((val * 9) / 5 + 32).toFixed(1));
      } else {
        setResult(val.toString());
      }
    } else if (mode === "volume") {
      const toMl = { cups: 236.588, tbsp: 14.7868, tsp: 4.92892, ml: 1, fl_oz: 29.5735 };
      const mlVal = val * (toMl[fromUnit] || 1);
      const converted = mlVal / (toMl[toUnit] || 1);
      setResult(converted < 10 ? converted.toFixed(2) : converted.toFixed(1));
    } else if (mode === "weight") {
      const toGrams = { g: 1, kg: 1000, oz: 28.3495, lb: 453.592 };
      const gVal = val * (toGrams[fromUnit] || 1);
      const converted = gVal / (toGrams[toUnit] || 1);
      setResult(converted < 10 ? converted.toFixed(2) : converted.toFixed(1));
    }
  }, [amount, mode, fromUnit, toUnit]);

  const handleModeChange = (newMode) => {
    setMode(newMode);
    if (newMode === "temperature") {
      setFromUnit("F");
      setToUnit("C");
    } else if (newMode === "volume") {
      setFromUnit("cups");
      setToUnit("ml");
    } else if (newMode === "weight") {
      setFromUnit("oz");
      setToUnit("g");
    }
  };

  const swapUnits = () => {
    setFromUnit(toUnit);
    setToUnit(fromUnit);
  };

  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 mb-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
          <Scale className="w-5 h-5 text-indigo-600" /> Kitchen Unit Converter
        </h2>
        <div className="flex bg-gray-100 p-1 rounded-2xl gap-1">
          {["volume", "weight", "temperature"].map((m) => (
            <button
              key={m}
              onClick={() => handleModeChange(m)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
                mode === m ? "bg-indigo-600 text-white shadow-sm" : "text-gray-500 hover:text-gray-800"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200/80">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-center">
          {/* FROM INPUT */}
          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Amount</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter value..."
              className="w-full text-2xl font-bold text-gray-900 bg-white p-3 rounded-xl border border-gray-200 outline-none focus:border-indigo-600 transition-all font-mono shadow-inner"
            />
            <select
              value={fromUnit}
              onChange={(e) => setFromUnit(e.target.value)}
              className="w-full bg-gray-900 text-white font-bold p-3 rounded-xl text-xs outline-none cursor-pointer"
            >
              {mode === "temperature" && (
                <>
                  <option value="F">Fahrenheit (°F)</option>
                  <option value="C">Celsius (°C)</option>
                </>
              )}
              {mode === "volume" && (
                <>
                  <option value="cups">Cups</option>
                  <option value="tbsp">Tablespoons (tbsp)</option>
                  <option value="tsp">Teaspoons (tsp)</option>
                  <option value="fl_oz">Fluid Ounces (fl oz)</option>
                  <option value="ml">Milliliters (ml)</option>
                </>
              )}
              {mode === "weight" && (
                <>
                  <option value="oz">Ounces (oz)</option>
                  <option value="lb">Pounds (lb)</option>
                  <option value="g">Grams (g)</option>
                  <option value="kg">Kilograms (kg)</option>
                </>
              )}
            </select>
          </div>

          {/* SWAP BUTTON */}
          <div className="flex justify-center pt-4 md:pt-0">
            <button
              onClick={swapUnits}
              className="p-3 bg-white hover:bg-indigo-50 text-indigo-600 rounded-full border border-gray-200 shadow-sm cursor-pointer transition-transform hover:scale-105"
              title="Swap Units"
            >
              <ArrowRightLeft className="w-5 h-5" />
            </button>
          </div>

          {/* TO RESULT */}
          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Result</label>
            <div className="w-full text-2xl font-black text-indigo-600 bg-indigo-50/50 p-3 rounded-xl border border-indigo-100 font-mono text-right flex items-center justify-end min-h-[54px]">
              {result}
            </div>
            <select
              value={toUnit}
              onChange={(e) => setToUnit(e.target.value)}
              className="w-full bg-gray-900 text-white font-bold p-3 rounded-xl text-xs outline-none cursor-pointer"
            >
              {mode === "temperature" && (
                <>
                  <option value="C">Celsius (°C)</option>
                  <option value="F">Fahrenheit (°F)</option>
                </>
              )}
              {mode === "volume" && (
                <>
                  <option value="ml">Milliliters (ml)</option>
                  <option value="cups">Cups</option>
                  <option value="tbsp">Tablespoons (tbsp)</option>
                  <option value="tsp">Teaspoons (tsp)</option>
                  <option value="fl_oz">Fluid Ounces (fl oz)</option>
                </>
              )}
              {mode === "weight" && (
                <>
                  <option value="g">Grams (g)</option>
                  <option value="oz">Ounces (oz)</option>
                  <option value="lb">Pounds (lb)</option>
                  <option value="kg">Kilograms (kg)</option>
                </>
              )}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}