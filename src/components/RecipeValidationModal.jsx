import React, { useState } from "react";
import { CheckCircle2, AlertTriangle, ShieldCheck, X, ArrowRight } from "lucide-react";

export default function RecipeValidationModal({ recipeData, onClose, onConfirmPublish }) {
  const [agreedToGuidelines, setagreedToGuidelines] = useState(false);

  // Run automated validation checks on the recipe draft
  const hasTitle = Boolean(recipeData?.title?.trim());
  const hasIngredients = Array.isArray(recipeData?.ingredients) && recipeData.ingredients.length > 0;
  const hasInstructions = Array.isArray(recipeData?.instructions) && recipeData.instructions.length > 0;
  const hasCategory = Boolean(recipeData?.category);

  const allChecksPassed = hasTitle && hasIngredients && hasInstructions && hasCategory;

  return (
    <div className="fixed inset-0 bg-black/60 z-[90] flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl flex flex-col animate-in slide-in-from-bottom">
        
        {/* Header */}
        <div className="p-5 border-b flex justify-between items-center bg-gray-50">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-indigo-600" />
            <div>
              <h3 className="font-black text-sm text-gray-900">Publication Checkpoint</h3>
              <p className="text-[10px] text-gray-500">Mandatory review before publishing to community</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-200 rounded-full cursor-pointer">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Validation Checklist Body */}
        <div className="p-6 space-y-4 text-xs text-gray-600">
          <p className="text-gray-500">
            Before your recipe goes live to the public PantryChef feed, it must pass our structural and community standards check:
          </p>

          <div className="space-y-2">
            <div className={`p-3 rounded-xl border flex items-center justify-between ${hasTitle ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
              <span className="font-bold">Recipe Title Provided</span>
              {hasTitle ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <AlertTriangle className="w-4 h-4 text-red-600" />}
            </div>

            <div className={`p-3 rounded-xl border flex items-center justify-between ${hasIngredients ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
              <span className="font-bold">At Least One Ingredient Added</span>
              {hasIngredients ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <AlertTriangle className="w-4 h-4 text-red-600" />}
            </div>

            <div className={`p-3 rounded-xl border flex items-center justify-between ${hasInstructions ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
              <span className="font-bold">Step-by-Step Instructions Included</span>
              {hasInstructions ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <AlertTriangle className="w-4 h-4 text-red-600" />}
            </div>

            <div className={`p-3 rounded-xl border flex items-center justify-between ${hasCategory ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
              <span className="font-bold">Category Assigned</span>
              {hasCategory ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <AlertTriangle className="w-4 h-4 text-red-600" />}
            </div>
          </div>

          {/* Community Guidelines Checkbox */}
          <div className="pt-2 border-t border-gray-100 flex items-start gap-2">
            <input
              type="checkbox"
              id="guidelinesCheck"
              checked={agreedToGuidelines}
              onChange={(e) => setagreedToGuidelines(e.target.checked)}
              className="mt-0.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
            <label htmlFor="guidelinesCheck" className="text-[11px] text-gray-700 cursor-pointer select-none">
              I confirm this recipe complies with the <strong>Community Guidelines</strong> (family-friendly, safe cooking instructions, and original or properly attributed content).
            </label>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-gray-50 border-t flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold text-xs rounded-xl cursor-pointer"
          >
            Back to Edit
          </button>
          <button
            onClick={onConfirmPublish}
            disabled={!allChecksPassed || !agreedToGuidelines}
            className={`px-6 py-2.5 font-bold text-xs rounded-xl shadow-md flex items-center gap-2 transition-all ${
              allChecksPassed && agreedToGuidelines
                ? "bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            Publish Recipe <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
}