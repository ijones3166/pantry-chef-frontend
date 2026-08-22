import React, { useEffect, useState } from "react";
import { Loader, Zap, CheckCircle, AlertCircle } from "lucide-react";
import { doc, onSnapshot, addDoc, collection, serverTimestamp } from "firebase/firestore";

const AdminRecipeIngestor = ({ db, appId, effectiveUserId, communityRecipes, setActiveTab }) => {
  const [urlList, setUrlList] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [pendingQueue, setPendingQueue] = useState([]);
  const [dailyUsageCount, setDailyUsageCount] = useState(0);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  useEffect(() => {
    if (!db) return;
    const todayKey = new Date().toISOString().split('T')[0];
    const unsub = onSnapshot(doc(db, `/artifacts/${appId}/public/data/adminUsage`, todayKey), (docSnap) => {
      if (docSnap.exists()) setDailyUsageCount(docSnap.data().totalRequests || 0);
    });
    return () => unsub();
  }, [db, appId]);

  const handleBulkUrlIngest = async () => {
    const urls = urlList.split('\n').map(u => u.trim()).filter(u => u.startsWith('http'));
    if (urls.length === 0) return alert("Please paste at least one valid URL.");
    
    setIsGenerating(true);
    setProgress({ current: 0, total: urls.length });

    for (let i = 0; i < urls.length; i++) {
      setProgress({ current: i + 1, total: urls.length });
      const currentUrl = urls[i];

      // 👉 DUPLICATE URL CHECK: Save tokens if URL already exists in database
      const alreadyExists = communityRecipes.some(r => r.sourceUrl === currentUrl);
      if (alreadyExists) {
        console.log(`Skipping duplicate URL: ${currentUrl}`);
        continue;
      }

      try {
        const prompt = `Analyze this recipe URL: ${currentUrl}. 
        Extract the recipe details. 
        CRITICAL: Format instructions as a single text block separated by strict numbered line breaks (e.g. "1. First step...\n2. Second step...\n3. Third step..."). Do NOT combine steps into a single paragraph.
        Extract the primary high-resolution recipe photo URL into the 'image' field, and any accompanying video link into 'videoUrl'.
        
        Return ONLY a valid JSON object matching this schema:
        {
          "title": "Recipe Name",
          "description": "Appetizing summary",
          "prepTime": "30 mins",
          "servings": 4,
          "image": "https://url-to-image.jpg",
          "videoUrl": "https://url-to-video-if-any",
          "allIngredients": [{"name": "ingredient name", "quantity": 1, "unit": "cup"}],
          "instructions": "1. Step one instructions...\n2. Step two instructions...\n3. Step three instructions...",
          "sourceName": "Web Extractor",
          "sourceUrl": "${currentUrl}",
          "nutrition": {"calories": 450, "protein": "25g", "carbs": "40g", "fat": "15g"},
          "recommendedGear": []
        }`;;

        const payload = {
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json" }
        };

        const responseText = await apiCall(payload);
        const newRecipe = parseAIResponse(responseText);

        setPendingQueue((prev) => [...prev, newRecipe]);

        if (i < urls.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 4000));
        }

      } catch (err) {
        console.error(`Failed on URL: ${currentUrl}`, err);
      }
    }
    
    setIsGenerating(false);
    setUrlList("");
  };

  const handlePublishRecipe = async (recipe, index) => {
    try {
      await addDoc(collection(db, `/artifacts/${appId}/public/data/userRecipes`), {
        ...recipe,
        createdAt: serverTimestamp(),
        createdBy: effectiveUserId || "admin_batch",
        likeCount: 0,
        isAI: false,
        authorName: recipe.sourceName || "Curated Chef"
      });
      setPendingQueue((prev) => prev.filter((_, i) => i !== index));
    } catch (e) {
      console.error("Publish error:", e);
    }
  };

  return (
    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6">
      <div className="flex justify-between items-center border-b pb-4">
        <div className="flex items-center gap-3">
          {/* 👉 EXIT ADMIN BUTTON */}
          <button
            onClick={() => setActiveTab("pantry")}
            className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center gap-1"
          >
            ← Return to App
          </button>
          <div>
            <h3 className="font-black text-gray-900 text-base">Bulk URL Recipe Ingestor</h3>
            <p className="text-xs text-gray-500">Paste multiple URLs. Automatically skips duplicates to save tokens.</p>
          </div>
        </div>
        <div className="bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-2xl text-right">
          <p className="text-[9px] font-bold text-indigo-400 uppercase">Global AI Usage</p>
          <p className="text-sm font-black text-indigo-700">{dailyUsageCount} Requests</p>
        </div>
      </div>

      <div className="space-y-3">
        <label className="block text-[10px] font-bold text-gray-400 uppercase">Paste URLs (One per line)</label>
        <textarea
          value={urlList}
          onChange={(e) => setUrlList(e.target.value)}
          placeholder="https://example.com/recipe-1&#10;https://example.com/recipe-2"
          className="w-full h-32 p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono outline-none focus:border-indigo-500 resize-none"
          disabled={isGenerating}
        />
        <button
          onClick={handleBulkUrlIngest}
          disabled={isGenerating || !urlList.trim()}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
        >
          {isGenerating ? (
            <><Loader className="w-4 h-4 animate-spin" /> Processing {progress.current} of {progress.total}...</>
          ) : (
            <><Zap className="w-4 h-4 text-amber-300" /> Process URLs (Smart Duplicate Filter)</>
          )}
        </button>
      </div>

      {/* Staging Review Queue */}
      <div className="space-y-3 pt-4 border-t">
        <h4 className="font-bold text-xs text-gray-700 uppercase tracking-wider">
          Review Queue ({pendingQueue.length} Pending)
        </h4>

        {pendingQueue.length === 0 ? (
          <div className="p-8 text-center bg-gray-50 border border-dashed border-gray-200 rounded-2xl text-xs text-gray-400">
            Queue is empty. Paste URLs above to start processing.
          </div>
        ) : (
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {pendingQueue.map((recipe, index) => (
              <div key={index} className="bg-gray-50 p-4 rounded-2xl border border-gray-200 flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {recipe.image && (
                      <img src={recipe.image} alt="" className="w-12 h-12 rounded-xl object-cover border border-gray-200 shrink-0" />
                    )}
                    <div className="space-y-1 min-w-0">
                      <span className="font-black text-sm text-gray-900 block truncate">{recipe.title}</span>
                      <p className="text-[10px] text-gray-400 font-mono truncate">From: {recipe.sourceUrl}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handlePublishRecipe(recipe, index)}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
                    >
                      Publish
                    </button>
                    <button
                      onClick={() => setPendingQueue(prev => prev.filter((_, i) => i !== index))}
                      className="px-4 py-2 bg-white border border-red-200 text-red-600 hover:bg-red-50 font-bold text-xs rounded-xl cursor-pointer"
                    >
                      Discard
                    </button>
                  </div>
                </div>

                {/* 3-Tier Tagger */}
                <div className="space-y-2 pt-3 border-t border-gray-200">
                  {recipe.allIngredients?.map((ing, ingIdx) => {
                    const tier1 = ing.tier1 || Object.keys(INGREDIENT_TAXONOMY)[0];
                    const tier2Options = INGREDIENT_TAXONOMY[tier1] ? Object.keys(INGREDIENT_TAXONOMY[tier1]) : [];
                    const tier2 = ing.tier2 || tier2Options[0] || "";
                    const tier3Options = INGREDIENT_TAXONOMY[tier1]?.[tier2] || [];
                    const tier3 = ing.tier3 || tier3Options[0] || "";

                    return (
                      <div key={ingIdx} className="bg-white p-2 rounded-lg border border-gray-200 flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-800 w-24 truncate">{ing.name}</span>
                        <select value={tier1} onChange={(e) => {
                          const newT1 = e.target.value; const newT2 = Object.keys(INGREDIENT_TAXONOMY[newT1])[0]; const newT3 = INGREDIENT_TAXONOMY[newT1][newT2][0];
                          setPendingQueue(prev => { const updated = [...prev]; updated[index].allIngredients[ingIdx] = { ...ing, tier1: newT1, tier2: newT2, tier3: newT3, name: `${newT1} > ${newT2} > ${newT3}` }; return updated; });
                        }} className="text-[10px] p-1 bg-gray-50 border rounded outline-none flex-1">
                          {Object.keys(INGREDIENT_TAXONOMY).map(t1 => <option key={t1} value={t1}>{t1}</option>)}
                        </select>
                        <select value={tier2} onChange={(e) => {
                          const newT2 = e.target.value; const newT3 = INGREDIENT_TAXONOMY[tier1][newT2][0];
                          setPendingQueue(prev => { const updated = [...prev]; updated[index].allIngredients[ingIdx] = { ...ing, tier2: newT2, tier3: newT3, name: `${tier1} > ${newT2} > ${newT3}` }; return updated; });
                        }} className="text-[10px] p-1 bg-gray-50 border rounded outline-none flex-1">
                          {tier2Options.map(t2 => <option key={t2} value={t2}>{t2}</option>)}
                        </select>
                        <select value={tier3} onChange={(e) => {
                          const newT3 = e.target.value;
                          setPendingQueue(prev => { const updated = [...prev]; updated[index].allIngredients[ingIdx] = { ...ing, tier3: newT3, name: `${tier1} > ${tier2} > ${newT3}` }; return updated; });
                        }} className="text-[10px] p-1 bg-gray-50 border rounded outline-none flex-1">
                          {tier3Options.map(t3 => <option key={t3} value={t3}>{t3}</option>)}
                        </select>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminRecipeIngestor;