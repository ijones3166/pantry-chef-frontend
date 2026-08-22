import React, { useState } from "react";
import { X, Receipt, CheckSquare, Square, Sparkles, Upload, CheckCircle2, AlertCircle, Edit2, Check } from "lucide-react";
import { parseReceiptWithAI } from "../utils/receiptParser";

export default function RecentPurchasesModal({ onClose, onImportItems }) {
  const [items, setItems] = useState([]);
  const [isParsing, setIsParsing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [editingId, setEditingId] = useState(null);

  const toggleItemSelection = (id) => {
    setItems(items.map(item => item.id === id ? { ...item, selected: !item.selected } : item));
  };

  const handleUpdateItem = (id, field, value) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsParsing(true);
    setErrorMessage("");

    try {
      // Single token-efficient AI call to parse and categorize all items at once
      const parsedItems = await parseReceiptWithAI(file);
      setItems(parsedItems);
    } catch (err) {
      console.error("Receipt parsing error:", err);
      setErrorMessage(err.message || "Failed to parse receipt image. Please check your API key and try again.");
    } finally {
      setIsParsing(false);
    }
  };

  const handleImport = () => {
    const selectedItems = items.filter(i => i.selected);
    if (selectedItems.length === 0) {
      alert("Please select at least one item to import.");
      return;
    }
    if (onImportItems) {
      onImportItems(selectedItems);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-gray-100 space-y-6 relative max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b border-gray-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl">
              <Receipt className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">AI Receipt Scanner & Review</h2>
              <p className="text-xs text-gray-400">AI auto-categorizes items. Tap any name or category to edit before syncing.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Upload Dropzone */}
        <div className="border-2 border-dashed border-indigo-200 bg-indigo-50/40 p-5 rounded-2xl text-center relative hover:bg-indigo-50 transition-colors">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            disabled={isParsing}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full disabled:cursor-not-allowed"
          />
          <div className="flex flex-col items-center justify-center space-y-2">
            <div className="p-3 bg-white text-indigo-600 rounded-2xl shadow-sm border border-indigo-100">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-900">
                {isParsing ? "AI is reading and categorizing your receipt..." : "Click or drop a receipt image here"}
              </p>
              <p className="text-[10px] text-gray-400">Supports PNG, JPG, JPEG photos of store receipts</p>
            </div>
            {isParsing && (
              <div className="w-full bg-indigo-100 h-1.5 rounded-full overflow-hidden mt-2">
                <div className="bg-indigo-600 h-full animate-pulse w-2/3 rounded-full"></div>
              </div>
            )}
          </div>
        </div>

        {errorMessage && (
          <div className="bg-red-50 p-3 rounded-2xl border border-red-200 flex items-center gap-2 text-xs text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <p>{errorMessage}</p>
          </div>
        )}

        {/* Item List Review Queue with Inline Editing */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Review & Edit Extracted Items</h3>
            {items.length > 0 && (
              <span className="text-[10px] text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded-lg flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> AI Categorized
              </span>
            )}
          </div>

          {items.length === 0 ? (
            <div className="text-center py-10 bg-gray-50 rounded-2xl border border-gray-100 text-xs text-gray-400 italic">
              No receipt uploaded yet. Drop an image above to run the AI parser.
            </div>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {items.map((item) => (
                <div
                  key={item.id}
                  className={`p-3 rounded-2xl border transition-all flex items-center justify-between ${
                    item.selected 
                      ? "bg-indigo-50/30 border-indigo-200 shadow-sm" 
                      : "bg-gray-50 border-gray-200/80 opacity-60"
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1 mr-2">
                    <button 
                      onClick={() => toggleItemSelection(item.id)}
                      className="text-indigo-600 cursor-pointer shrink-0"
                    >
                      {item.selected ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5 text-gray-400" />}
                    </button>

                    {/* Inline Editing Fields */}
                    <div className="flex-1 space-y-1">
                      {editingId === item.id ? (
                        <div className="flex gap-2 items-center">
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => handleUpdateItem(item.id, "name", e.target.value)}
                            className="text-xs font-bold text-gray-900 bg-white border border-indigo-300 rounded-lg px-2 py-1 w-full focus:outline-none"
                          />
                          <input
                            type="text"
                            value={item.category}
                            onChange={(e) => handleUpdateItem(item.id, "category", e.target.value)}
                            className="text-[10px] text-gray-700 bg-white border border-indigo-300 rounded-lg px-2 py-1 w-28 focus:outline-none"
                          />
                          <button
                            onClick={() => setEditingId(null)}
                            className="p-1 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 cursor-pointer shrink-0"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-bold text-gray-900">{item.name}</p>
                            <p className="text-[10px] text-gray-500">
                              {item.store} • <span className={item.isFood ? "text-green-600 font-bold" : "text-amber-600 font-bold"}>{item.category}</span>
                            </p>
                          </div>
                          <button
                            onClick={() => setEditingId(item.id)}
                            className="text-gray-400 hover:text-indigo-600 p-1 transition-colors cursor-pointer"
                            title="Edit item name or category"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {!item.isFood && (
                    <span className="text-[9px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-lg shrink-0">
                      Non-Food
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-gray-100 pt-4">
          <p className="text-xs font-bold text-gray-600">
            {items.filter(i => i.selected).length} item(s) selected for pantry sync
          </p>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={items.filter(i => i.selected).length === 0}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors cursor-pointer disabled:opacity-50"
            >
              Confirm & Sync to Pantry
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}