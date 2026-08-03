import React, { useState } from 'react';
import { X, Scan, Plus, Trash2, Send, CheckCircle, Loader, ArrowLeft, Eye, Clock, Users, Sparkles } from 'lucide-react';

export default function ShareModal({ onClose, onSubmitRecipe, userProfile, pantryItems = [] }) {
  const [step, setStep] = useState('form'); // 'form' or 'preview'
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    instructions: '',
    prepTime: '30 mins',
    servings: 4,
  });
  const [submissionIngredients, setSubmissionIngredients] = useState([
    { name: "", quantity: "", unit: "pcs" }
  ]);
  const [recipeImage, setRecipeImage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const unitOptions = ["pcs", "g", "kg", "oz", "lb", "cup", "tbsp", "tsp", "ml", "l", "pinch", "can", "bunch"];
  const commonStaples = ["Olive Oil", "Salt", "Black Pepper", "Garlic", "Butter", "Onion", "Chicken Breast"];

  const handleAddIngredientRow = (name = "", quantity = "", unit = "pcs") => {
    setSubmissionIngredients([
      ...submissionIngredients,
      { name, quantity, unit }
    ]);
  };

  const handleIngredientChange = (idx, field, val) => {
    const updated = [...submissionIngredients];
    updated[idx][field] = val;
    setSubmissionIngredients(updated);
  };

  const handleRemoveIngredientRow = (idx) => {
    if (submissionIngredients.length > 1) {
      setSubmissionIngredients(submissionIngredients.filter((_, i) => i !== idx));
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setRecipeImage(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProceedToPreview = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    if (submissionIngredients.some((i) => !i.name.trim())) {
      alert("Please fill out all ingredient names.");
      return;
    }

    const rawInstructions = fd.get("instructions") || "";
    const formattedInstructions = rawInstructions
      .split(/\r\n|\n/)
      .filter((line) => line.trim().length > 0)
      .map((line, index) => {
        const cleanLine = line.replace(/^\d+[\.\)]\s*/, "").trim();
        return `${index + 1}. ${cleanLine}`;
      })
      .join("\n");

    setFormData({
      title: fd.get("title"),
      description: fd.get("description"),
      instructions: formattedInstructions,
      prepTime: fd.get("prepTime") || "30 mins",
      servings: parseInt(fd.get("servings")) || 4,
    });
    setStep('preview');
  };

  const handleFinalPublish = async () => {
    setIsSubmitting(true);
    try {
      await onSubmitRecipe({
        ...formData,
        allIngredients: submissionIngredients,
        image: recipeImage,
        authorImage: userProfile?.image || null,
        authorName: userProfile?.name || "Community Chef",
      });
      setSubmitted(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      console.error(err);
      alert("Failed to share recipe. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 text-white w-full max-w-xl rounded-3xl p-6 shadow-2xl relative max-h-[92vh] flex flex-col animate-in slide-in-from-bottom">
        
        {/* Header */}
        <div className="flex justify-between items-center pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            {step === 'preview' && (
              <button 
                onClick={() => setStep('form')}
                className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-lg transition-colors cursor-pointer mr-1"
                title="Back to Edit"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <h3 className="font-black text-lg text-amber-400 flex items-center gap-2">
              <span>✨</span> {step === 'form' ? 'Share Recipe Studio' : 'Review & Confirm Feed Card'}
            </h3>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitted ? (
          <div className="text-center py-16 space-y-3 my-auto">
            <CheckCircle className="w-14 h-14 text-emerald-400 mx-auto animate-bounce" />
            <h4 className="font-bold text-lg text-white">Recipe Shared Successfully!</h4>
            <p className="text-xs text-slate-400">Your creation is now live on the community feed.</p>
          </div>
        ) : step === 'form' ? (
          /* FORM STEP */
          <form onSubmit={handleProceedToPreview} className="space-y-4 py-4 overflow-y-auto flex-1 pr-1">
            
            {/* Photo Upload Box */}
            <div className="bg-slate-800/40 p-3 rounded-2xl border border-slate-800 text-center">
              <label className="cursor-pointer flex flex-col items-center justify-center gap-2">
                <div className="w-full h-32 bg-slate-900/80 rounded-xl flex items-center justify-center overflow-hidden relative border border-slate-700/60 hover:border-amber-500/50 transition-colors">
                  {recipeImage ? (
                    <img src={recipeImage} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center text-slate-400">
                      <Scan className="w-6 h-6 mb-1 text-amber-400" />
                      <span className="text-[10px] uppercase font-bold tracking-wider">Add Cover Photo</span>
                    </div>
                  )}
                </div>
                <input type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
              </label>
            </div>

            {/* Title & Meta */}
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Recipe Title</label>
                <input
                  name="title"
                  defaultValue={formData.title}
                  placeholder="e.g. Crispy Garlic Butter Steak Bites"
                  className="w-full p-3 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Servings</label>
                  <input
                    name="servings"
                    type="number"
                    defaultValue={formData.servings}
                    className="w-full p-3 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white outline-none focus:border-amber-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Prep Time</label>
                  <input
                    name="prepTime"
                    defaultValue={formData.prepTime}
                    placeholder="e.g. 30 mins"
                    className="w-full p-3 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Short Description</label>
                <textarea
                  name="description"
                  defaultValue={formData.description}
                  placeholder="Why is this recipe amazing?"
                  className="w-full p-3 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white outline-none h-16 resize-none focus:border-amber-500"
                  required
                />
              </div>
            </div>

            {/* Ingredients Advanced Builder (#37) */}
            <div className="space-y-3 bg-slate-800/30 p-3.5 rounded-2xl border border-slate-800">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold text-amber-400 uppercase flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Ingredients Builder
                </label>
                <button
                  type="button"
                  onClick={() => handleAddIngredientRow()}
                  className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Row
                </button>
              </div>

              {/* Quick Staples Chips */}
              <div className="space-y-1">
                <span className="text-[9px] text-slate-400 uppercase tracking-wider">Quick-add Staples:</span>
                <div className="flex flex-wrap gap-1">
                  {commonStaples.map((staple) => (
                    <button
                      key={staple}
                      type="button"
                      onClick={() => handleAddIngredientRow(staple, "1", staple === "Olive Oil" || staple === "Butter" ? "tbsp" : "pcs")}
                      className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-0.5 rounded-md border border-slate-700 transition-colors cursor-pointer"
                    >
                      + {staple}
                    </button>
                  ))}
                </div>
              </div>

              {/* Pantry Quick-Select Dropdown if inventory exists */}
              {pantryItems.length > 0 && (
                <div className="pt-1">
                  <select
                    onChange={(e) => {
                      if (!e.target.value) return;
                      const item = pantryItems.find(i => i.name === e.target.value);
                      if (item) {
                        handleAddIngredientRow(item.name, item.quantity || 1, item.unit || 'pcs');
                      }
                      e.target.value = "";
                    }}
                    defaultValue=""
                    className="w-full p-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-300 outline-none focus:border-amber-500"
                  >
                    <option value="" disabled>✨ Pull ingredient from your active pantry...</option>
                    {pantryItems.map((pi, idx) => (
                      <option key={idx} value={pi.name}>{pi.name} ({pi.quantity} {pi.unit})</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Rows */}
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1 pt-1">
                {submissionIngredients.map((ing, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <input
                      value={ing.name}
                      onChange={(e) => handleIngredientChange(idx, "name", e.target.value)}
                      placeholder="Ingredient name"
                      className="flex-1 p-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white outline-none focus:border-amber-500"
                      required
                    />
                    <input
                      type="number"
                      value={ing.quantity}
                      onChange={(e) => handleIngredientChange(idx, "quantity", e.target.value)}
                      placeholder="Qty"
                      className="w-16 p-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-center text-white outline-none focus:border-amber-500"
                    />
                    <select
                      value={ing.unit}
                      onChange={(e) => handleIngredientChange(idx, "unit", e.target.value)}
                      className="w-24 p-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white outline-none focus:border-amber-500"
                    >
                      {unitOptions.map((u) => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                    {submissionIngredients.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveIngredientRow(idx)}
                        className="p-2 text-slate-500 hover:text-red-400 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Instructions */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase">Step-by-Step Instructions</label>
                <span className="text-[9px] text-amber-400/80">Each line break = numbered step</span>
              </div>
              <textarea
                name="instructions"
                defaultValue={formData.instructions}
                placeholder="Preheat pan to medium heat&#10;Season steak bites..."
                className="w-full p-3 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white outline-none h-24 resize-none focus:border-amber-500 font-mono"
                required
              />
            </div>

            {/* Next Step Action */}
            <button
              type="submit"
              className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all mt-2"
            >
              <Eye className="w-4 h-4" /> Review Feed Card & Publish
            </button>

          </form>
        ) : (
          /* PREVIEW & CONFIRM STEP */
          <div className="space-y-4 py-4 overflow-y-auto flex-1 pr-1">
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-xs text-amber-300 flex items-center gap-2">
              <span>🔍</span> Review how your recipe card will look on the community feed before publishing.
            </div>

            {/* Live Preview Card */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              {recipeImage && (
                <div className="h-40 w-full overflow-hidden relative">
                  <img src={recipeImage} alt="Recipe Preview" className="w-full h-full object-cover" />
                  <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-bold text-amber-400">
                    Community Post
                  </div>
                </div>
              )}
              <div className="p-4 space-y-3">
                <div>
                  <h4 className="text-base font-bold text-white">{formData.title}</h4>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">{formData.description}</p>
                </div>

                <div className="flex items-center gap-4 text-xs text-slate-300 pt-2 border-t border-slate-800/80">
                  <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-amber-400" /> {formData.prepTime}</span>
                  <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5 text-amber-400" /> {formData.servings} servings</span>
                </div>

                <div className="space-y-1.5 pt-2">
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Ingredients ({submissionIngredients.length})</div>
                  <div className="flex flex-wrap gap-1.5">
                    {submissionIngredients.map((ing, i) => (
                      <span key={i} className="text-[11px] bg-slate-900 border border-slate-800 px-2 py-1 rounded-lg text-slate-300">
                        {ing.quantity} {ing.unit} {ing.name}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="space-y-1 pt-2">
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Instructions</div>
                  <div className="text-xs text-slate-300 whitespace-pre-line bg-slate-900/60 p-3 rounded-xl border border-slate-800 font-mono">
                    {formData.instructions}
                  </div>
                </div>
              </div>
            </div>

            {/* Final Action Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep('form')}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Back & Edit
              </button>
              <button
                type="button"
                onClick={handleFinalPublish}
                disabled={isSubmitting}
                className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                {isSubmitting ? <Loader className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {isSubmitting ? "Publishing..." : "Confirm & Publish Live"}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}