import CookingMode from './components/CookingMode';
import ConverterWidget from './components/ConverterWidget';
import KitchenGuide from './components/KitchenGuide';
import RecipeValidationModal from './components/RecipeValidationModal';
import CommunityGuidelinesModal from './components/CommunityGuidelinesModal';
import LegalModal from './components/LegalModal';
import MealPrepView from './components/MealPrepView';
import ShareModal from './components/ShareModal';
import BrandedRedirectModal from './components/BrandedRedirectModal';
import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import {
  getAuth,
  signInWithCustomToken,
  signInAnonymously,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut
} from "firebase/auth";
import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getFirestore,
  collection,
  query,
  where,
  onSnapshot,
  doc,
  setDoc,
  getDocs,
  addDoc,
  serverTimestamp,
  deleteDoc,
  updateDoc,
  writeBatch,
  increment,
  orderBy,
  limit,
} from "firebase/firestore";
import {
  ChefHat,
  CookingPot,
  Utensils,
  Scan,
  Home,
  List,
  Star,
  Share2,
  Loader,
  Plus,
  Trash2,
  Clock,
  Zap,
  Activity,
  RefreshCw,
  Users,
  Heart,
  ThumbsUp,
  ThumbsDown,
  ChevronLeft,
  CheckCircle,
  Minus,
  AlertCircle,
  ShoppingCart,
  Play,
  X,
  ChevronRight,
  ArrowRightLeft,
  Settings as ConfigIcon,
  ExternalLink,
  Layers,
  Link as LinkIcon,
  Calendar,
  Filter as FilterIcon,
  Search,
  Database,
  Bookmark,
  UserCircle,
  CheckSquare,
  Square,
  Edit,
  AlertOctagon,
  DollarSign,
  BarChart3,
  TrendingDown,
  Smile,
  Snowflake,
  Barcode,
  Tag as TagIcon,
  Timer as TimerIcon,
  Lock,
  Wifi,
  Thermometer,
  Speaker,
  AlarmClock,
  Leaf,
  Briefcase,
  LineChart,
  Crown,
  Store,
  LogOut,
  Download,
  Bell,
  Package,
  Trophy,
  Medal,
  Flame,
  LayoutGrid,
  AlertTriangle,
  ArrowRight,
  Battery,
  BookOpen,
  ThermometerSun,
  Snowflake as ColdIcon,
  Sun,
  Truck,
  Award,
  LogIn,
  Mail,
  MapPin,
  Share,
  Send
} from "lucide-react";



// =================================================================================
// ⚠️ CONFIGURATION - FOR EXTERNAL TESTING
// =================================================================================

const manualFirebaseConfig = {
  apiKey: "AIzaSyC6luWdWNNlEmOxbLCrGqvwyeR4sTFrw7g",
  authDomain: "pantry-app-b7ba3.firebaseapp.com",
  projectId: "pantry-app-b7ba3",
  storageBucket: "pantry-app-b7ba3.firebasestorage.app",
  messagingSenderId: "506786530032",
  appId: "1:506786530032:web:6fca904b8ea51f9cfe7835",
  measurementId: "G-1XP7SP4GF3",
};


// =================================================================================
// ⚠️ SYSTEM ENVIRONMENT
// =================================================================================

const appId =
  typeof __app_id !== "undefined" ? __app_id : "pantry-chef-mobile-v1";
const firebaseConfig =
  typeof __firebase_config !== "undefined"
    ? JSON.parse(__firebase_config)
    : Object.keys(manualFirebaseConfig).length > 0
    ? manualFirebaseConfig
    : null;
const apiKey = "";
const initialAuthToken =
  typeof __initial_auth_token !== "undefined" ? __initial_auth_token : null;
const activeModel = "gemini-3.6-flash";

const DAILY_API_LIMIT = 50;

let app, auth, db;
if (firebaseConfig) {
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  auth = getAuth(app);
  db = getFirestore(app);
}

// --- Utilities ---
const getApiUsage = () => {
  const today = new Date().toDateString();
  const storedDate = localStorage.getItem("pantry_chef_api_date");
  const count = parseInt(localStorage.getItem("pantry_chef_api_count") || "0");

  if (storedDate !== today) {
    localStorage.setItem("pantry_chef_api_date", today);
    localStorage.setItem("pantry_chef_api_count", "0");
    return 0;
  }
  return count;
};

const incrementApiUsage = () => {
  const current = getApiUsage();
  localStorage.setItem("pantry_chef_api_count", (current + 1).toString());
  window.dispatchEvent(new CustomEvent("apiUsageUpdated"));
  return current + 1;
};

// 👉 LANDMARK: Admin Usage Telemetry Logger Utility
const logAdminApiUsage = async (db, appId, effectiveUserId, requestCount = 1) => {
  if (!db) return;
  const todayKey = new Date().toISOString().split('T')[0];
  const usageRef = doc(db, `/artifacts/${appId}/public/data/adminUsage`, todayKey);
  
  try {
    await setDoc(usageRef, {
      totalRequests: increment(requestCount),
      lastUpdated: serverTimestamp()
    }, { merge: true });
  } catch (e) {
    console.error("Failed to sync usage stats:", e);
  }
};

// Admin Batch Recipe Ingestor & Review Studio (#6 / Batch Ingest)
// 👉 LANDMARK: Global 3-Tier Ingredient Taxonomy Master List
const INGREDIENT_TAXONOMY = {
  "Produce": {
    "Aromatics": ["Garlic (Fresh)", "Yellow Onion", "Red Onion", "Shallots", "Ginger"],
    "Herbs": ["Basil", "Cilantro", "Parsley", "Thyme", "Rosemary"],
    "Citrus": ["Lemons", "Limes", "Oranges"],
    "Peppers": ["Jalapeños", "Bell Peppers", "Serrano"]
  },
  "Protein": {
    "Beef": ["Ground Beef (80/20)", "Ground Beef (90/10)", "Ribeye Steak", "Chuck Roast", "Flank Steak"],
    "Chicken": ["Whole Chicken", "Chicken Breast", "Chicken Thighs", "Chicken Wings"],
    "Pork": ["Pork Chops", "Bacon", "Pancetta", "Italian Sausage"],
    "Seafood": ["Shrimp", "Salmon Fillet", "Whitefish"]
  },
  "Dairy": {
    "Cheese": ["Parmesan Block", "Mozzarella", "Cheddar", "Feta"],
    "Liquid Dairy": ["Whole Milk", "Heavy Cream", "Buttermilk"],
    "Butter & Eggs": ["Salted Butter", "Unsalted Butter", "Eggs"]
  },
  "Grains": {
    "Pasta": ["Spaghetti", "Penne", "Fettuccine", "Macaroni"],
    "Rice": ["Jasmine Rice", "Basmati Rice", "Arborio Rice", "Brown Rice"],
    "Baking": ["All-Purpose Flour", "Bread Crumbs", "Masa Harina"]
  },
  "Spices & Oils": {
    "Oils": ["Extra Virgin Olive Oil", "Vegetable Oil", "Toasted Sesame Oil", "Avocado Oil"],
    "Vinegars": ["Balsamic Vinegar", "Apple Cider Vinegar", "Rice Vinegar"],
    "Dry Spices": ["Black Pepper", "Garlic Powder", "Onion Powder", "Dried Oregano"]
  }
};

// 👉 LANDMARK: Admin Bulk URL Recipe Ingestor
// 👉 LANDMARK: Optimized Admin Bulk URL Ingestor with Duplicate Prevention & Media Extraction
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

const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });

const resizeImage = (file, maxWidth = 600) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = document.createElement("img");
      img.src = event.target.result;
      img.onload = () => {
        const elem = document.createElement("canvas");
        const scaleFactor = maxWidth / img.width;
        elem.width = maxWidth;
        elem.height = img.height * scaleFactor;
        const ctx = elem.getContext("2d");
        ctx.drawImage(img, 0, 0, elem.width, elem.height);
        resolve(elem.toDataURL("image/jpeg", 0.7));
      };
    };
  });
};

const getTimestampInDays = (days) =>
  new Date(Date.now() + days * 24 * 60 * 60 * 1000);

const parseAIResponse = (text) => {
  try {
    let cleaned = text
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();
    const firstBracket = cleaned.search(/[[{]/);
    const lastBracket = cleaned.lastIndexOf(/[\]}]/);
    if (firstBracket !== -1 && lastBracket !== -1) {
      cleaned = cleaned.substring(firstBracket, lastBracket + 1);
    }
    return JSON.parse(cleaned);
  } catch (e) {
    console.error("Failed to parse AI response:", text);
    throw new Error("AI response format error");
  }
};

const parsePrepTime = (prepTimeString) => {
  if (!prepTimeString) return 30;
  const numbers = prepTimeString.match(/\d+/g);
  if (!numbers) return 30;
  const hasHours = /h(ou)?r/i.test(prepTimeString);
  if (hasHours && numbers.length > 1) {
    return parseInt(numbers[0]) * 60 + parseInt(numbers[1]);
  } else if (hasHours) {
    return parseInt(numbers[0]) * 60;
  } else {
    return parseInt(numbers[0]);
  }
};

const generateICS = (mealPlan) => {
  if (!mealPlan || mealPlan.length === 0) return;
  let icsContent =
    "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Pantry Chef//Meal Plan//EN\n";
  mealPlan.forEach((meal) => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const now = new Date();
    const currentDayIndex = now.getDay();
    const targetDayIndex = days.indexOf(meal.day);
    let daysToAdd = targetDayIndex - currentDayIndex;
    if (daysToAdd < 0) daysToAdd += 7;
    if (
      daysToAdd === 0 &&
      meal.mealTime &&
      parseInt(meal.mealTime.split(":")[0]) < now.getHours()
    )
      daysToAdd += 7;
    const targetDate = new Date(now);
    targetDate.setDate(targetDate.getDate() + daysToAdd);
    const [hours, mins] = (meal.mealTime || "18:00").split(":").map(Number);
    targetDate.setHours(hours, mins, 0);
    const prepMinutes = parsePrepTime(meal.prepTime);
    const startDate = new Date(targetDate);
    startDate.setMinutes(targetDate.getMinutes() - prepMinutes);
    const formatICSDate = (d) =>
      d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    icsContent += "BEGIN:VEVENT\n";
    icsContent += `DTSTART:${formatICSDate(startDate)}\n`;
    icsContent += `DTEND:${formatICSDate(targetDate)}\n`;
    icsContent += `SUMMARY:COOK: ${meal.recipeTitle}\n`;
    icsContent += `DESCRIPTION:Time to start cooking ${meal.recipeTitle}! Prep time is approx ${prepMinutes} mins.\n`;
    icsContent += "END:VEVENT\n";
  });
  icsContent += "END:VCALENDAR";
  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const link = document.createElement("a");
  link.href = window.URL.createObjectURL(blob);
  link.setAttribute("download", "meal_plan.ics");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// --- SERVICES ---
const getApiKey = () =>
  localStorage.getItem("gemini_api_key") || manualGeminiApiKey || apiKey;

// --- UPDATED SERVICES (Backend Proxy Route) ---
const apiCall = async (payload, retries = 3) => {
  // Local safety check
  const currentUsage = getApiUsage();
  if (currentUsage >= DAILY_API_LIMIT) {
    throw new Error(`Daily limit reached (${DAILY_API_LIMIT}). Try again tomorrow.`);
  }

  const apiUrl = `https://pantry-chef-proxy.onrender.com/api/generate`;
  
  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (response.status === 503 && retries > 0) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        return apiCall(payload, retries - 1);
    }

    const result = await response.json();
    if (result.error) throw new Error(result.error.message);
    
    // 1. Increment local safety counter
    incrementApiUsage();
    
    // 2. 👉 INCREMENT GLOBAL FIRESTORE COUNTER FOR ADMIN VIEW
    if (db) {
      logAdminApiUsage(db, appId, "system_user", 1);
    }

    if (!result.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new Error("AI returned no content.");
    }
    return result.candidates[0].content.parts[0].text;
  } catch (err) {
    if (retries > 0) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        return apiCall(payload, retries - 1);
    }
    throw err;
  }
};

const scanIngredients = async (base64) => {
  const payload = {
    contents: [
      {
        role: "user",
        parts: [
          {
            text: "Identify food items from receipt/image. Output name, quantity (number), unit, estimated shelf life days, category (e.g. Produce, Dairy), and estimated unit price (number) if visible (otherwise estimate).",
          },
          { inlineData: { mimeType: "image/png", data: base64 } },
        ],
      },
    ],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          properties: {
            name: { type: "STRING" },
            quantity: { type: "NUMBER" },
            unit: { type: "STRING" },
            estimatedDaysToExpiry: { type: "NUMBER" },
            category: { type: "STRING" },
            price: { type: "NUMBER" },
          },
        },
      },
    },
  };
  const responseText = await apiCall(payload);
  return parseAIResponse(responseText);
};

const categorizeExistingItems = async (itemNames) => {
  const prompt = `Categorize these items: ${itemNames.join(
    ", "
  )}. Categories: Produce, Protein, Dairy, Grains, Spices, Canned, Frozen, Snacks, Beverages, Other. Return JSON array.`;
  const payload = { contents: [{ parts: [{ text: prompt }] }] };
  const responseText = await apiCall(payload);
  return parseAIResponse(responseText);
};

const findDeals = async (query) => {
  const prompt = `Find current grocery deals, coupons, or weekly flyer specials for "${query}" in major US supermarkets. Return a JSON array of 3 deals with: store, item, price (string), validUntil.`;
  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    tools: [{ google_search: {} }],
  };
  return parseAIResponse(await apiCall(payload));
};

const fetchMealDBRecipes = async (query) => {
  try {
    const res = await fetch(
      `https://www.themealdb.com/api/json/v1/1/search.php?s=${query}`
    );
    const data = await res.json();
    if (!data.meals) return [];
    return data.meals.map((m) => {
      const ingredients = [];
      for (let i = 1; i <= 20; i++) {
        const name = m[`strIngredient${i}`];
        const measure = m[`strMeasure${i}`];
        if (name && name.trim()) {
          ingredients.push({
            name: name.trim(),
            quantity: 1,
            unit: measure ? measure.trim() : "unit",
          });
        }
      }
      return {
        id: m.idMeal,
        title: m.strMeal,
        description: `${m.strArea} ${m.strCategory} dish.`,
        prepTime: "30 mins",
        servings: 4,
        matchPercentage: 0,
        sourceName: "TheMealDB",
        sourceUrl: m.strSource || m.strYoutube,
        missingIngredients: [],
        allIngredients: ingredients,
        instructions: m.strInstructions,
        image: m.strMealThumb,
        isDB: true,
        recommendedGear: [
          "Standard Chef's Knife",
          "Cutting Board",
          "Large Skillet",
        ],
      };
    });
  } catch (e) {
    console.error("MealDB Error", e);
    return [];
  }
};

const fetchFromUPC = async (upc) => {
  return { name: "Mock Product " + upc };
};

const fetchAIRecipes = async (
  pantryItems,
  history = [],
  profile = {},
  queryText = "",
  filters = {},
  mode = "recipe"
) => {
  const itemsList = pantryItems
    .map((i) => `${i.quantity || 1} ${i.unit || "unit"} ${i.name}`)
    .join(", ");

  // Anti-Repeat History Context (Excludes meals cooked in the last 14 days)
  const recentMeals = history
    .slice(0, 10) // Look at the last 10 cooked meals
    .map((h) => h.recipeTitle)
    .join(", ");

  const historyText =
    history.length > 0
      ? `User likes: ${history.map((h) => h.recipeTitle).join(", ")}.`
      : "";

  const dietText = profile.diets?.length
    ? `Dietary: ${profile.diets.join(", ")}.`
    : "";
  const equipText = profile.equipment?.length
    ? `Equip: ${profile.equipment.join(", ")}.`
    : "";
  

  const healthGoalsText = profile.healthGoals?.length 
    ? `Health Goals/Medical Constraints: ${profile.healthGoals.join(", ")}.` 
    : "";
  const dislikedText = profile.dislikedFoods 
    ? `Strictly AVOID these disliked ingredients/allergens: ${profile.dislikedFoods}.` 
    : "";
  const kidPrefText = profile.kidPreferences 
    ? `Household/Kid Preferences: ${profile.kidPreferences}.` 
    : "";
  const householdText = profile.householdSize 
    ? `Cooking for household size: ${profile.householdSize}.` 
    : "";

  // 👉 Advanced Filter Context Strings
  let filterContext = "";
  if (filters.mealType && filters.mealType !== "Any") filterContext += `Meal Type: Must be suitable for ${filters.mealType}. `;
  if (filters.maxCalories) filterContext += `Nutritional Limit: Maximum ${filters.maxCalories} calories per serving. `;
  if (filters.proteins?.length) filterContext += `Must include one of: ${filters.proteins.join(", ")}. `;
  if (filters.vegetables?.length) filterContext += `Must include one of: ${filters.vegetables.join(", ")}. `;
  if (filters.cuisine) filterContext += `Cuisine style: ${filters.cuisine}. `;
  let prompt = `Ingredients available: ${itemsList}. ${householdText} ${healthGoalsText} ${dislikedText} ${kidPrefText} ${dietText} ${equipText} ${filterContext} ...`;
  "";

  if (filters.maxTime)
    filterContext += `Max cooking time: ${filters.maxTime}. `;
  if (filters.familyMode)
    filterContext += `FAMILY MODE ACTIVE: Suggest meals with a kid-friendly adaptation using the same base ingredients. `;
  
  if (queryText) {
    prompt = `Search for recipes matching "${queryText}". ${filterContext} ${dietText}. User has: ${itemsList}. ${historyText} Try to find recipes that use these items if possible. Return 3 results. Output JSON array. Each object: title, description, prepTime, servings (int), matchPercentage (number), sourceName, sourceUrl, missingIngredients (array), allIngredients (array of name, quantity, unit), instructions, kidFriendlyVersion (string), nutrition (object with calories (int), protein (string), carbs (string), fat (string)), recommendedGear (array of string for suggested utensils/appliances), recommendedSides (array of string).`;
  } else if (mode === "meal") {
    prompt = `Ingredients available: ${itemsList}. ${historyText} ${dietText} ${equipText} ${filterContext}
    Suggest 3 complete meal combinations (Main Dish + Complementary Side Dish). Ensure variety and avoid recently cooked dishes.
    Output JSON array. Each object: title, description, prepTime, servings (int), matchPercentage (number), sourceName, sourceUrl, missingIngredients (array), allIngredients (array of name, quantity, unit - combined for both dishes), instructions (combined for both), kidFriendlyVersion (string), nutrition (object with calories (int), protein (string), carbs (string), fat (string)), recommendedGear (array of string).`;
  } else {
    prompt = `Ingredients available: ${itemsList}. ${historyText} ${dietText} ${equipText} ${filterContext} Suggest 3 recipes ensuring variety and avoiding recently cooked dishes. Output JSON array. Each object: title, description, prepTime, servings (int), matchPercentage (number), sourceName, sourceUrl, missingIngredients (array), allIngredients (array of name, quantity, unit), instructions, kidFriendlyVersion (string), nutrition (object with calories (int), protein (string), carbs (string), fat (string)), recommendedGear (array of string for suggested utensils/appliances), recommendedSides (array of string).`;
  }

  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    tools: [{ google_search: {} }],
  };
  const responseText = await apiCall(payload);
  return parseAIResponse(responseText);
};

const handleCook = async (r) => {
    // 👉 Prompt for personal portions eaten, supporting fractions (e.g., 1.25, 0.5)
    const personalServingsInput = prompt(
      `You're logging "${r.title}". How many servings did you personally eat? (Decimals/fractions allowed)`, 
      "1"
    );
    const personalServings = parseFloat(personalServingsInput);
    if (isNaN(personalServings) || personalServings <= 0) return;

    const totalRecipeServings = r.servings || 4;
    const ratio = personalServings / totalRecipeServings;

    // 👉 Conditional household prompt only if household members/size > 1 are configured in profile
    let householdEaters = [];
    const hasHouseholdMembers = userProfile?.householdSize > 1 || (userProfile?.householdMembers && userProfile.householdMembers.length > 0);
    
    if (hasHouseholdMembers) {
      const includeFamily = confirm("Did other household members share this meal?");
      if (includeFamily) {
        // Optional: Log remaining portions as leftover inventory or distribute to family logs
      }
    }

    setLoading(true);
    setStatus("Updating nutrition & inventory...");

    try {
      // Save personal nutrition intake scaled by exact fractional servings eaten
      await addDoc(
        collection(db, `/artifacts/${appId}/users/${effectiveUserId}/nutritionLogs`),
        {
          recipeTitle: r.title,
          servingsEaten: personalServings,
          calories: Math.round((r.nutrition?.calories || 500) * ratio),
          protein: Math.round(parseFloat(r.nutrition?.protein || "30g") * ratio),
          carbs: Math.round(parseFloat(r.nutrition?.carbs || "30g") * ratio),
          fat: Math.round(parseFloat(r.nutrition?.fat || "15g") * ratio),
          timestamp: serverTimestamp(),
        }
      );

      // Standard cook history log for anti-repeat tracking
      await addDoc(
        collection(db, `/artifacts/${appId}/public/data/cookHistory`),
        {
          userId: effectiveUserId,
          recipeTitle: r.title,
          timestamp: serverTimestamp(),
        }
      );

      // Deduct stock from pantry
      const batch = writeBatch(db);
      r.allIngredients?.forEach((ing) => {
        const m = inventory.find((i) =>
          i.name.toLowerCase().includes(ing.name.toLowerCase())
        );
        if (m) {
          if (m.quantity <= 1)
            batch.delete(doc(db, `/artifacts/${appId}/users/${effectiveUserId}/inventory`, m.id));
          else
            batch.update(doc(db, `/artifacts/${appId}/users/${effectiveUserId}/inventory`, m.id), {
              quantity: m.quantity - 1,
            });
        }
      });
      await batch.commit();

      setNotification(`🍎 Logged ${personalServings} serving(s) to your nutrition report!`);
      setTimeout(() => setNotification(null), 3000);
    } catch (err) {
      console.error(err);
      setNotification("❌ Error logging meal.");
      setTimeout(() => setNotification(null), 3000);
    }

    setLoading(false);
    setActiveRecipe(null);
  };

const generateMealPrepPlan = async (baseIngredient) => {
  const prompt = `Generate a smart meal prep plan using "${baseIngredient}" as the core. 1. Bulk Prep Instructions: How to cook 3-4lbs of ${baseIngredient} at once. 2. 3 Distinct Meals: Recipes using the prepped base. Output JSON: { "baseInstructions": "string", "shoppingList": ["string"], "meals": [ { "title": "string", "description": "string", "prepTime": "string", "ingredients": ["string"] } ] }`;
  const payload = { contents: [{ parts: [{ text: prompt }] }] };
  return parseAIResponse(await apiCall(payload));
};

const askAIChef = async (question, recipeContext) => {
  const prompt = `You are a helpful chef assistant. Recipe Context: "${recipeContext}" User Question: "${question}" Answer briefly.`;
  const payload = { contents: [{ parts: [{ text: prompt }] }] };
  return await apiCall(payload);
};

// --- DATA ---
const CHALLENGES = [
  {
    id: "zero_waste",
    title: "Zero Waste",
    desc: "Log 0 waste for 7 days",
    target: 7,
    unit: "days",
    icon: <Leaf className="w-4 h-4" />,
  },
  {
    id: "budget_master",
    title: "Budget Master",
    desc: "Stay under budget",
    target: 100,
    unit: "%",
    icon: <DollarSign className="w-4 h-4" />,
  },
  {
    id: "iron_chef",
    title: "Iron Chef",
    desc: "Cook 10 distinct recipes",
    target: 10,
    unit: "recipes",
    icon: <ChefHat className="w-4 h-4" />,
  },
  {
    id: "leftover_legend",
    title: "Leftover Legend",
    desc: "Use 5 expiring items",
    target: 5,
    unit: "items",
    icon: <RefreshCw className="w-4 h-4" />,
  },
  {
    id: "meal_prep_pro",
    title: "Meal Prep Pro",
    desc: "Complete 4 prep plans",
    target: 4,
    unit: "plans",
    icon: <LayoutGrid className="w-4 h-4" />,
  },
  {
    id: "variety_king",
    title: "Variety King",
    desc: "Cook 5 cuisines",
    target: 5,
    unit: "cuisines",
    icon: <Utensils className="w-4 h-4" />,
  },
  {
    id: "community_star",
    title: "Community Star",
    desc: "Receive 50 likes",
    target: 50,
    unit: "likes",
    icon: <Star className="w-4 h-4" />,
  },
  {
    id: "deal_hunter",
    title: "Deal Hunter",
    desc: "Save $50 w/ deals",
    target: 50,
    unit: "$",
    icon: <TagIcon className="w-4 h-4" />,
  },
  {
    id: "pantry_purger",
    title: "Pantry Purger",
    desc: "Use 20 items",
    target: 20,
    unit: "items",
    icon: <Home className="w-4 h-4" />,
  },
  {
    id: "social_butterfly",
    title: "Social Butterfly",
    desc: "Share 5 recipes",
    target: 5,
    unit: "shares",
    icon: <Share2 className="w-4 h-4" />,
  },
];

const MOCK_GEAR = [
  { name: "Babish High-Carbon Knife", price: "$65.00", link: "#", image: "🔪" },
  { name: "HexClad 12-inch Pan", price: "$129.00", link: "#", image: "🍳" },
  { name: "KitchenAid Mixer", price: "$299.00", link: "#", image: "🥣" },
];

const DEMO_USERS = [
  {
    id: "demo_mario",
    name: "Chef Mario",
    role: "Italian Cuisine Expert",
    isCreator: true,
    seedRecipe: {
      title: "Mario's Sunday Roast Chicken",
      description: "Classic family dinner with my secret herb rub.",
      prepTime: "90 mins",
      likes: 89,
      recommendedGear: ["Roasting Pan"],
    },
    image: "https://ui-avatars.com/api/?name=Mario&background=random",
    profile: {
      diets: ["Italian"],
      equipment: ["Pizza Stone", "Oven"],
      creatorProgress: 100,
      challenges: { iron_chef: 8, variety_king: 4, community_star: 45 },
    },
    inventory: [
      {
        name: "Flour",
        quantity: 5,
        unit: "kg",
        category: "Grains",
        expiryDate: 30,
      },
      {
        name: "Yeast",
        quantity: 2,
        unit: "packets",
        category: "Baking",
        expiryDate: -2,
      },
      {
        name: "Mozzarella",
        quantity: 1,
        unit: "ball",
        category: "Dairy",
        expiryDate: 2,
      },
    ],
  },
  {
    id: "demo_freshmart",
    name: "FreshMart Weekly",
    role: "Brand Partner",
    isBrand: true,
    seedRecipe: {
      title: "Weekly Special: 50% Off Steak Tacos",
      description: "Use our Ribeye on sale this week!",
      prepTime: "20 mins",
      likes: 890,
      recommendedGear: ["Grill Pan"],
    },
    image:
      "https://ui-avatars.com/api/?name=FreshMart&background=008000&color=fff",
    profile: { diets: [], equipment: [], challenges: {} },
    inventory: [],
  },
  {
    id: "demo_holly",
    name: "Healthy Holly",
    role: "Vegan & Gluten-Free",
    isCreator: true,
    seedRecipe: {
      title: "Ultimate Vegan Burger",
      description: "Better than the real thing.",
      prepTime: "20 mins",
      likes: 142,
      recommendedGear: ["Cast Iron Skillet"],
    },
    image: "https://ui-avatars.com/api/?name=Holly&background=random",
    profile: {
      diets: ["Vegan", "Gluten-Free"],
      equipment: ["Blender", "Food Processor"],
      challenges: { zero_waste: 6, pantry_purger: 15 },
    },
    inventory: [
      {
        name: "Kale",
        quantity: 1,
        unit: "bunch",
        category: "Produce",
        expiryDate: -1,
      },
      {
        name: "Avocado",
        quantity: 2,
        unit: "pcs",
        category: "Produce",
        expiryDate: 1,
      },
    ],
  },
  {
    id: "demo_bob",
    name: "BBQ Bob",
    role: "Keto & Carnivore",
    seedRecipe: {
      title: "Bob's Smoked Brisket",
      description: "Low and slow for 12 hours.",
      prepTime: "12 hours",
      likes: 55,
      recommendedGear: ["Smoker"],
    },
    image: "https://ui-avatars.com/api/?name=Bob&background=random",
    profile: {
      diets: ["Keto"],
      equipment: ["Grill", "Smoker"],
      challenges: { meal_prep_pro: 2 },
    },
    inventory: [
      {
        name: "Ribeye Steak",
        quantity: 1,
        unit: "lb",
        category: "Protein",
        expiryDate: 1,
      },
      {
        name: "Bacon",
        quantity: 1,
        unit: "pack",
        category: "Protein",
        expiryDate: 10,
      },
    ],
  },
  {
    id: "demo_sarah",
    name: "Super Mom Sarah",
    role: "15-Min Meals for Kids",
    seedRecipe: {
      title: "15-Min Mac & Cheese",
      description: "Hidden veggies inside!",
      prepTime: "15 mins",
      likes: 230,
      recommendedGear: ["Pot"],
    },
    image: "https://ui-avatars.com/api/?name=Sarah&background=random",
    profile: {
      diets: [],
      equipment: ["Instant Pot", "Microwave", "Air Fryer"],
      challenges: { leftover_legend: 3, budget_master: 80 },
    },
    inventory: [
      {
        name: "Milk",
        quantity: 0.5,
        unit: "gallon",
        category: "Dairy",
        expiryDate: 1,
      },
      {
        name: "Bread",
        quantity: 1,
        unit: "loaf",
        category: "Grains",
        expiryDate: -1,
      },
    ],
  },
  {
    id: "demo_dave",
    name: "Dorm Room Dave",
    role: "College Budget",
    seedRecipe: {
      title: "Late Night Ramen Hack",
      description: "Upgrade your instant noodles.",
      prepTime: "5 mins",
      likes: 45,
      recommendedGear: ["Kettle"],
    },
    image: "https://ui-avatars.com/api/?name=Dave&background=random",
    profile: {
      diets: [],
      equipment: ["Microwave", "Hot Plate", "Kettle"],
      challenges: { deal_hunter: 45 },
    },
    inventory: [
      {
        name: "Spinach (Bag)",
        quantity: 1,
        unit: "bag",
        category: "Produce",
        expiryDate: 2,
      },
      {
        name: "Instant Ramen",
        quantity: 12,
        unit: "pack",
        category: "Grains",
        expiryDate: 365,
      },
    ],
  },
  {
    id: "demo_millers",
    name: "The Miller Family",
    role: "Family of 4 (Bulk)",
    seedRecipe: {
      title: "Bulk Sunday Chili",
      description: "Makes enough for the whole week.",
      prepTime: "4 hours",
      likes: 112,
      recommendedGear: ["Slow Cooker"],
    },
    image: "https://ui-avatars.com/api/?name=Millers&background=random",
    profile: {
      diets: [],
      equipment: ["Oven", "Slow Cooker", "Stand Mixer"],
      challenges: { social_butterfly: 4 },
    },
    inventory: [
      {
        name: "Ground Beef",
        quantity: 1,
        unit: "lb",
        category: "Protein",
        expiryDate: 1,
      },
      {
        name: "Eggs",
        quantity: 24,
        unit: "pcs",
        category: "Dairy",
        expiryDate: 14,
      },
    ],
  },
  {
    id: "demo_fiona",
    name: "Fit Fiona",
    role: "Macro Tracker",
    seedRecipe: {
      title: "Post-Workout Smoothie Bowl",
      description: "High protein, low carb.",
      prepTime: "5 mins",
      likes: 88,
      recommendedGear: ["Blender"],
    },
    image: "https://ui-avatars.com/api/?name=Fiona&background=random",
    profile: {
      diets: ["Paleo"],
      equipment: ["Blender", "Air Fryer"],
      challenges: { meal_prep_pro: 3 },
    },
    inventory: [
      {
        name: "Greek Yogurt",
        quantity: 1,
        unit: "tub",
        category: "Dairy",
        expiryDate: 2,
      },
      {
        name: "Berries",
        quantity: 1,
        unit: "pint",
        category: "Produce",
        expiryDate: -2,
      },
    ],
  },
  {
    id: "demo_gary",
    name: "Global Gary",
    role: "Spice Hunter",
    seedRecipe: {
      title: "Authentic Green Curry",
      description: "Spicy and fragrant.",
      prepTime: "45 mins",
      likes: 67,
      recommendedGear: ["Wok"],
    },
    image: "https://ui-avatars.com/api/?name=Gary&background=random",
    profile: {
      diets: ["Vegetarian"],
      equipment: ["Wok", "Rice Cooker"],
      challenges: { variety_king: 5 },
    },
    inventory: [
      {
        name: "Cilantro",
        quantity: 1,
        unit: "bunch",
        category: "Produce",
        expiryDate: 1,
      },
      {
        name: "Coconut Milk",
        quantity: 3,
        unit: "can",
        category: "Canned",
        expiryDate: 365,
      },
    ],
  },
];

const MOCK_RECIPES = [
  {
    title: "Weekly Special: 50% Off Steak Tacos",
    description: "Use our Ribeye on sale this week!",
    prepTime: "20 mins",
    likes: 890,
    authorRole: "Brand",
    isBrand: true,
    recommendedGear: ["Grill Pan"],
    authorName: "FreshMart Weekly",
  },
  {
    title: "Ultimate Vegan Burger",
    description: "Better than the real thing.",
    prepTime: "20 mins",
    likes: 142,
    isCreator: true,
    authorRole: "Creator",
    recommendedGear: ["Cast Iron Skillet"],
    authorName: "Healthy Holly",
  },
  {
    title: "Sunday Roast Chicken",
    description: "Classic family dinner.",
    prepTime: "90 mins",
    likes: 89,
    isCreator: false,
    recommendedGear: ["Roasting Pan"],
    authorName: "Chef Mario",
  },
];

const MOCK_PERSONAS = [
  { image: "https://ui-avatars.com/api/?name=Chef+A&background=random" },
  { image: "https://ui-avatars.com/api/?name=Chef+B&background=random" },
];

// --- COMPONENTS ---


// --- Pantry Valuation Card ---
const PantryValuationCard = ({ inventory }) => {
  const [expanded, setExpanded] = useState(false);

  const totalValue = useMemo(() => {
    return inventory.reduce((acc, item) => {
      const cost = parseFloat(item.lastCost) || 2.00;
      const qty = parseFloat(item.quantity) || 1;
      return acc + (cost * qty);
    }, 0);
  }, [inventory]);

  const atRiskValue = useMemo(() => {
    const now = new Date();
    return inventory.reduce((acc, item) => {
      const expiry = item.expiryDate?.toDate ? item.expiryDate.toDate() : new Date();
      const daysLeft = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
      if (daysLeft <= 3) {
        const cost = parseFloat(item.lastCost) || 2.00;
        const qty = parseFloat(item.quantity) || 1;
        return acc + (cost * qty);
      }
      return acc;
    }, 0);
  }, [inventory]);

  return (
    <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-5 rounded-2xl shadow-md space-y-3">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider">Pantry Net Worth</p>
          <h3 className="text-2xl font-black">${totalValue.toFixed(2)}</h3>
        </div>
        <DollarSign className="w-6 h-6 text-indigo-400 opacity-60" />
      </div>

      {atRiskValue > 0 && (
        <div className="bg-red-500/20 border border-red-500/30 p-2.5 rounded-xl text-xs text-red-200 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
          <span><strong>${atRiskValue.toFixed(2)}</strong> expiring in ≤3 days!</span>
        </div>
      )}

      <button
        onClick={() => setExpanded(!expanded)}
        className="text-[10px] text-indigo-300 font-bold hover:text-white cursor-pointer w-full text-left pt-1 border-t border-indigo-800 flex justify-between items-center"
      >
        <span>{expanded ? "Hide Category Breakdown" : "View Breakdown..."}</span>
        <span>{expanded ? "▲" : "▼"}</span>
      </button>

      {expanded && (
        <div className="space-y-1 pt-1 text-xs text-gray-300 animate-in fade-in">
          {["Produce", "Protein", "Dairy", "Grains"].map((cat) => {
            const catVal = inventory
              .filter((i) => (i.category || "Other") === cat)
              .reduce((acc, i) => acc + (parseFloat(i.lastCost) || 2.00) * (i.quantity || 1), 0);
            return (
              <div key={cat} className="flex justify-between text-[11px]">
                <span>{cat}:</span>
                <span className="font-mono font-bold">${catVal.toFixed(2)}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// NEW: Login Modal Simulator
// --- LOGIN MODAL COMPONENT ---
const LoginModal = ({ onClose, onLogin }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    if (!auth) return alert("Firebase not connected.");
    try {
      setLoading(true);
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      onLogin();
    } catch (err) {
      console.error("Google Auth Error:", err);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    if (!auth) return alert("Firebase not connected.");
    if (!email || !password) return;
    try {
      setLoading(true);
      if (isRegistering) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      onLogin();
    } catch (err) {
      console.error("Email Auth Error:", err);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom">
        <div className="p-6 text-center">
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ChefHat className="w-8 h-8 text-indigo-600" />
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-2">
            {isRegistering ? "Create Account" : "Welcome Back"}
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            Sync your pantry across devices and never lose your streak.
          </p>

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full py-3 mb-4 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors shadow-sm cursor-pointer"
          >
            <div className="w-4 h-4 rounded-full bg-red-500"></div>
            Continue with Google
          </button>

          <div className="relative flex py-2 items-center mb-4">
            <div className="flex-grow border-t border-gray-200"></div>
            <span className="flex-shrink mx-4 text-gray-400 text-[10px] uppercase font-bold">Or email</span>
            <div className="flex-grow border-t border-gray-200"></div>
          </div>

          <form onSubmit={handleEmailAuth} className="space-y-3">
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-indigo-500"
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-indigo-500"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-md hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? <Loader className="w-4 h-4 animate-spin" /> : (isRegistering ? "Sign Up" : "Sign In")}
            </button>
          </form>

          <button
            onClick={() => setIsRegistering(!isRegistering)}
            className="text-xs text-indigo-600 font-bold mt-4 hover:underline cursor-pointer"
          >
            {isRegistering ? "Already have an account? Sign In" : "Need an account? Sign Up"}
          </button>

        </div>
        <div className="bg-gray-50 p-4 text-center border-t border-gray-100">
          <button onClick={onClose} className="text-xs font-bold text-gray-500 cursor-pointer">
            Continue as Guest
          </button>
        </div>
      </div>
    </div>
  );
};

const AffiliateProductCard = ({ product }) => (
  <div className="min-w-[120px] bg-white border border-gray-100 rounded-xl p-3 flex flex-col items-center text-center shadow-sm cursor-pointer hover:shadow-md transition-all">
    <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center text-2xl mb-2">
      {product.image}
    </div>
    <p className="text-xs font-bold text-gray-800 line-clamp-2 leading-tight mb-1">
      {product.name}
    </p>
    <p className="text-[10px] text-indigo-600 font-bold mb-2">
      {product.price}
    </p>
    <button
      onClick={(e) => {
        e.stopPropagation();
        alert(`Opening affiliate link for ${product.name}`);
      }}
      className="w-full py-1 bg-indigo-50 text-indigo-600 text-[9px] font-bold rounded cursor-pointer"
    >
      Shop Now
    </button>
  </div>
);

const ChallengeWidget = ({ challenges = {}, onViewAll }) => {
  const activeChallenge =
    CHALLENGES.find((c) => (challenges[c.id] || 0) < c.target) || CHALLENGES[0];
  const progress = challenges[activeChallenge.id] || 0;
  const percent = Math.min((progress / activeChallenge.target) * 100, 100);

  return (
    <div className="bg-gradient-to-r from-orange-400 to-pink-500 rounded-2xl p-3 text-white shadow-lg mb-4 relative overflow-hidden flex items-center justify-between">
      <div className="absolute top-0 right-0 p-2 opacity-20">
        <Trophy className="w-12 h-12" />
      </div>
      <div className="relative z-10 flex-1">
        <div className="flex items-center gap-1 mb-1">
          <Flame className="w-3 h-3" />
          <span className="text-[10px] font-bold uppercase tracking-wider">
            Active Goal
          </span>
        </div>
        <p className="text-sm font-black leading-tight mb-1">
          {activeChallenge.title}
        </p>
        <div className="flex items-center gap-2">
          <div className="w-24 bg-black/20 rounded-full h-1.5">
            <div
              className="bg-white h-1.5 rounded-full transition-all duration-1000"
              style={{ width: `${percent}%` }}
            ></div>
          </div>
          <span className="text-[9px] font-bold">
            {progress}/{activeChallenge.target}
          </span>
        </div>
      </div>
      <button
        onClick={onViewAll}
        className="relative z-10 bg-white/20 hover:bg-white/30 rounded-lg px-3 py-1.5 text-[10px] font-bold cursor-pointer"
      >
        See All
      </button>
    </div>
  );
};

const CreatorBadge = ({ isBrand, isCreator }) => {
  if (isBrand)
    return (
      <span className="bg-green-100 text-green-700 text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
        <Store className="w-3 h-3" /> Partner
      </span>
    );
  if (isCreator)
    return (
      <span className="bg-yellow-100 text-yellow-700 text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
        <Medal className="w-3 h-3" /> Pro Chef
      </span>
    );
  return null;
};

const UserProfileView = ({ user, onClose, allRecipes, onRecipeClick }) => {
  const userRecipes = allRecipes.filter(
    (r) => r.authorName === user.name || r.createdBy === user.id
  );
  const displayRecipes =
    userRecipes.length > 0
      ? userRecipes
      : user.seedRecipe
      ? [{ ...user.seedRecipe, id: "seed-" + user.id, authorName: user.name }]
      : [];
  const badgeCount = Object.keys(user.profile?.challenges || {}).length;

  const isInfluencer = user.isCreator || user.isBrand;
  const influencerBadges = [
    {
      id: "viral",
      label: "Viral Star",
      icon: <Zap className="w-3 h-3 text-yellow-600" />,
      bg: "bg-yellow-100",
    },
    {
      id: "leader",
      label: "Community Leader",
      icon: <Award className="w-3 h-3 text-purple-600" />,
      bg: "bg-purple-100",
    },
  ];

  return (
    <div className="fixed inset-0 bg-gray-50 z-40 overflow-y-auto animate-in slide-in-from-right">
      <div className="sticky top-0 bg-white border-b z-10">
        <div className="p-4 flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-2 -ml-2 rounded-full hover:bg-gray-100 cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="font-bold text-lg">Chef Profile</h2>
        </div>
      </div>
      <div className="p-4 space-y-6">
        <div className="flex items-center gap-4">
          <img
            src={user.image}
            alt={user.name}
            className="w-20 h-20 rounded-full border-2 border-white shadow-md"
          />
          <div>
            <h1 className="text-xl font-black text-gray-900 leading-none">
              {user.name}
            </h1>
            <p className="text-sm text-gray-500 mb-2">{user.role}</p>
            <div className="flex gap-1 flex-wrap">
              <CreatorBadge isBrand={user.isBrand} isCreator={user.isCreator} />
              <button className="bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full cursor-pointer">
                Follow
              </button>
            </div>
          </div>
        </div>
        {isInfluencer && (
          <div className="flex gap-2">
            {influencerBadges.map((b) => (
              <span
                key={b.id}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold cursor-pointer ${b.bg} text-gray-700`}
              >
                {b.icon} {b.label}
              </span>
            ))}
          </div>
        )}
        <div className="flex gap-4 text-center bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex-1">
            <p className="text-xl font-black text-indigo-600">
              {displayRecipes.length}
            </p>
            <p className="text-[10px] text-gray-400 font-bold uppercase">
              Recipes
            </p>
          </div>
          <div className="flex-1 border-l">
            <p className="text-xl font-black text-indigo-600">
              {badgeCount + (isInfluencer ? 2 : 0)}
            </p>
            <p className="text-[10px] text-gray-400 font-bold uppercase">
              Badges
            </p>
          </div>
          <div className="flex-1 border-l">
            <p className="text-xl font-black text-indigo-600">4.8</p>
            <p className="text-[10px] text-gray-400 font-bold uppercase">
              Rating
            </p>
          </div>
        </div>
        <div>
          <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-indigo-500" /> Achievements
          </h3>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex overflow-x-auto gap-3 pb-2 -mx-2 px-2 scrollbar-hide">
              {CHALLENGES.map((c) => {
                const current = (user.profile?.challenges || {})[c.id] || 0;
                const isUnlocked = current >= c.target;
                return (
                  <div
                    key={c.id}
                    className={`min-w-[60px] flex flex-col items-center text-center opacity-${
                      isUnlocked ? "100" : "40"
                    }`}
                  >
                    <div
                      className={`p-2 rounded-full mb-1 ${
                        isUnlocked
                          ? "bg-indigo-100 text-indigo-600"
                          : "bg-gray-100 text-gray-400"
                      }`}
                    >
                      {c.icon}
                    </div>
                    <span className="text-[8px] font-bold leading-tight">
                      {c.title}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        {user.isCreator && (
          <div>
            <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-orange-500" /> Shop My
              Kitchen
            </h3>
            <div className="flex overflow-x-auto gap-3 pb-2 -mx-4 px-4 scrollbar-hide">
              {MOCK_GEAR.map((item, i) => (
                <AffiliateProductCard key={i} product={item} />
              ))}
            </div>
          </div>
        )}
        <div>
          <h3 className="font-bold text-gray-800 mb-3">Posted Recipes</h3>
          <div className="space-y-4">
            {displayRecipes.length > 0 ? (
              displayRecipes.map((r, i) => (
                <div
                  key={i}
                  onClick={() => onRecipeClick(r)}
                  className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex gap-3 cursor-pointer hover:shadow-md transition-all"
                >
                  {r.image ? (
                    <img
                      src={r.image}
                      className="w-20 h-20 rounded-lg object-cover bg-gray-100"
                    />
                  ) : (
                    <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
                      <CookingPot className="text-gray-300" />
                    </div>
                  )}
                  <div>
                    <h4 className="font-bold text-sm text-gray-900 line-clamp-1">
                      {r.title}
                    </h4>
                    <p className="text-xs text-gray-500 line-clamp-2 mb-2">
                      {r.description}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-gray-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {r.prepTime}
                      </span>
                      <span className="flex items-center gap-1">
                        <ThumbsUp className="w-3 h-3" /> {r.likes || 0}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-400 text-sm">
                No recipes yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const NotificationToast = ({ message, onClose }) => (
  <div className="fixed top-4 left-4 right-4 bg-gray-900 text-white p-4 rounded-2xl shadow-2xl z-50 animate-in slide-in-from-top duration-500 flex items-center justify-between">
    <div className="flex items-center gap-3">
      <div className="p-2 bg-indigo-500 rounded-full">
        <Trophy className="w-5 h-5 text-white" />
      </div>
      <div>
        <h4 className="font-bold text-sm">Monthly Report</h4>
        <p className="text-xs text-gray-300">{message}</p>
      </div>
    </div>
    <button onClick={onClose}>
      <X className="w-5 h-5 text-gray-400 cursor-pointer" />
    </button>
  </div>
);

const SystemNotification = ({ title, body, onClose }) => (
  <div
    className="fixed top-0 left-0 right-0 z-[100] p-2 animate-in slide-in-from-top duration-500"
    onClick={onClose}
  >
    <div className="mx-auto max-w-sm bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl overflow-hidden border border-gray-200 cursor-pointer">
      <div className="p-3">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-1 rounded-md">
              <Utensils className="w-3 h-3 text-white" />
            </div>
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">
              PANTRY CHEF • now
            </span>
          </div>
        </div>
        <h4 className="font-bold text-sm text-gray-900">{title}</h4>
        <p className="text-xs text-gray-600 leading-snug">{body}</p>
      </div>
    </div>
  </div>
);

const SubscriptionModal = ({ onClose }) => (
  <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-in fade-in">
    <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom">
      <div className="bg-indigo-600 p-6 text-center text-white">
        <Crown className="w-12 h-12 mx-auto mb-2 text-yellow-300" />
        <h2 className="text-2xl font-black">Upgrade to Pro</h2>
        <p className="text-indigo-200 text-sm">
          Unlock the full kitchen experience
        </p>
      </div>
      <div className="p-6 space-y-4">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-500" />{" "}
            <span className="text-sm font-medium">
              Unlimited AI Recipe Generation
            </span>
          </div>
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-500" />{" "}
            <span className="text-sm font-medium">
              Receipt Scanning & Auto-Budget
            </span>
          </div>
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-500" />{" "}
            <span className="text-sm font-medium">
              Deal Hunter (Coupons & Sales)
            </span>
          </div>
        </div>
        <button className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl shadow-lg hover:bg-indigo-700 transform active:scale-95 transition-all cursor-pointer">
          Subscribe for $4.99/mo
        </button>
        <button
          onClick={onClose}
          className="w-full py-2 text-gray-400 text-xs font-bold cursor-pointer"
        >
          No thanks, maybe later
        </button>
      </div>
    </div>
  </div>
);

const NativeAd = () => (
  <div className="p-4 bg-gradient-to-r from-orange-50 to-orange-100 rounded-2xl border border-orange-200 mb-4 relative overflow-hidden group">
    <div className="absolute top-2 right-2 text-[9px] font-bold text-orange-400 border border-orange-300 px-1 rounded">
      SPONSORED
    </div>
    <div className="flex items-center gap-3">
      <div className="w-12 h-12 bg-orange-200 rounded-lg flex items-center justify-center text-2xl">
        🥕
      </div>
      <div>
        <h4 className="font-bold text-gray-900 text-sm">HelloFresh: $20 Off</h4>
        <p className="text-xs text-gray-600 leading-tight">
          Get fresh ingredients delivered to your door.
        </p>
      </div>
    </div>
    <button
      onClick={() => alert("Redirecting to Partner...")}
      className="mt-3 w-full py-2 bg-orange-500 text-white rounded-lg text-xs font-bold shadow-sm cursor-pointer"
    >
      Claim Offer
    </button>
  </div>
);

const NativeProductAd = ({ tool }) => (
  <div className="p-3 bg-white rounded-xl border border-gray-100 shadow-sm flex items-center justify-between mb-2">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
        <Package className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xs font-bold text-gray-800">{tool}</p>
        <p className="text-[10px] text-indigo-500 font-medium">
          Chef Recommended
        </p>
      </div>
    </div>
    <button
      onClick={() => alert("Opening Affiliate Link...")}
      className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-bold rounded-lg border border-indigo-100 cursor-pointer"
    >
      Buy
    </button>
  </div>
);



const InventoryItem = ({ item, onUpdate, onDelete, onFindRecipes }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ ...item });
  const now = new Date();
  const expiry = item.expiryDate?.toDate
    ? item.expiryDate.toDate()
    : new Date();
  const daysLeft = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
  let statusColor = "bg-green-500",
    statusText = "Fresh";
  if (daysLeft < 0) {
    statusColor = "bg-red-500";
    statusText = "Expired";
  } else if (daysLeft <= 3) {
    statusColor = "bg-yellow-500";
    statusText = "Expiring Soon";
  }

  let cardStyle = "bg-white border-l-4 border-l-green-500 border-gray-100";
  let textStyle = "text-gray-800";
  let statusLabel = null;

  if (daysLeft < 0) {
    cardStyle = "bg-red-50 border-l-4 border-l-red-500 border-red-100";
    textStyle = "text-red-900";
    statusLabel = (
      <span className="text-[10px] font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full ml-2">
        EXPIRED
      </span>
    );
  } else if (daysLeft <= 3) {
    cardStyle = "bg-yellow-50 border-l-4 border-l-yellow-500 border-yellow-100";
    textStyle = "text-yellow-900";
    statusLabel = (
      <span className="text-[10px] font-bold text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded-full ml-2">
        USE SOON
      </span>
    );
  }

  if (isEditing) {
    return (
      <div className="p-3 bg-white border-b border-gray-100 last:border-0 flex flex-col gap-2">
        <input
          value={editData.name}
          onChange={(e) => setEditData({ ...editData, name: e.target.value })}
          className="w-full p-2 border border-gray-200 rounded text-sm"
          placeholder="Name"
        />
        <div className="flex gap-2">
          <input
            type="number"
            value={editData.quantity}
            onChange={(e) =>
              setEditData({ ...editData, quantity: parseFloat(e.target.value) })
            }
            className="w-16 p-2 border border-gray-200 rounded text-sm"
            placeholder="Qty"
          />
          <input
            value={editData.unit}
            onChange={(e) => setEditData({ ...editData, unit: e.target.value })}
            className="w-16 p-2 border border-gray-200 rounded text-sm"
            placeholder="Unit"
          />
          <input
            type="date"
            value={
              editData.expiryDate?.toDate
                ? editData.expiryDate.toDate().toISOString().split("T")[0]
                : ""
            }
            onChange={(e) => {
              const d = new Date(e.target.value);
              d.setMinutes(d.getMinutes() + d.getTimezoneOffset());
              setEditData({ ...editData, expiryDate: d });
            }}
            className="flex-1 p-2 border border-gray-200 rounded text-sm"
          />
          <select
            value={editData.location || "Pantry"}
            onChange={(e) =>
              setEditData({ ...editData, location: e.target.value })
            }
            className="p-2 border border-gray-200 rounded text-sm"
          >
            <option>Pantry</option>
            <option>Fridge</option>
            <option>Freezer</option>
          </select>
        </div>
        <div className="flex gap-2 justify-end">
          <button
            onClick={() => setIsEditing(false)}
            className="px-3 py-1 text-xs text-gray-500 cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onUpdate(item.id, editData);
              setIsEditing(false);
            }}
            className="px-3 py-1 text-xs bg-indigo-600 text-white rounded cursor-pointer"
          >
            Save
          </button>
        </div>
      </div>
    );
  }
  return (
    <div
      className={`flex items-center justify-between p-3 mb-2 rounded-r-xl border shadow-sm transition-all ${cardStyle}`}
    >
      <div className="flex items-center gap-3 flex-grow">
        <div>
          <p
            className={`font-semibold capitalize flex items-center gap-2 ${textStyle}`}
          >
            {item.name}
            {statusLabel}
            <button
              onClick={() => setIsEditing(true)}
              className="text-gray-400 hover:text-indigo-500 opacity-50 hover:opacity-100 transition-opacity cursor-pointer"
            >
              <Edit className="w-3 h-3" />
            </button>
          </p>
          <div className="flex gap-2 text-[10px] text-gray-500 font-medium">
            <span>
              {item.quantity} {item.unit}
            </span>
            <span>• Exp: {expiry.toLocaleDateString()}</span>
            {item.lastCost && <span>• ${item.lastCost}</span>}
            {item.calories && <span>• {item.calories} cal</span>}
          </div>
        </div>
      </div>
      <div className="flex gap-1 border-l border-black/5 pl-2 ml-2">
        <button
          onClick={() => onFindRecipes(item.name)}
          className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-lg cursor-pointer"
        >
          <CookingPot className="w-4 h-4" />
        </button>
        <button
          onClick={() => onDelete(item.id)}
          className="p-2 text-red-400 hover:bg-red-50 rounded-lg cursor-pointer"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

const RecipeCard = ({
  recipe,
  isUserRecipe,
  onClick,
  onAddToPlan,
  isSaved,
  onToggleSave,
  onVote,
  onAuthorClick,
  userNote,
}) => (
  <div
    onClick={onClick}
    className="bg-white rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-all group cursor-pointer overflow-hidden flex flex-col justify-between"
  >
    <div>
      {recipe.image && (
        <div className="w-full h-32 bg-gray-100 overflow-hidden relative">
          <img
            src={recipe.image}
            alt={recipe.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}
      <div className="p-4 space-y-2">
        <div className="flex justify-between items-start">
          <h3 className="font-bold text-gray-900 leading-tight group-hover:text-indigo-600 transition-colors line-clamp-1">
            {recipe.title}
          </h3>
          <div className="flex items-center gap-1 shrink-0 ml-2">
            {/* Restored Share Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (navigator.share) {
                  navigator.share({ title: recipe.title, text: recipe.description, url: window.location.href }).catch(() => {});
                } else {
                  alert("Link copied to clipboard!");
                }
              }}
              className="p-1.5 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              title="Share Recipe"
            >
              <Share className="w-4 h-4" />
            </button>
            <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-indigo-400" />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap pt-1">
          {recipe.authorImage && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAuthorClick && onAuthorClick();
              }}
              className="flex items-center gap-1 hover:opacity-85 cursor-pointer"
              title="View Creator Profile"
            >
              {/* Doubled Size for Author Profile / Click Target */}
              <img
                src={recipe.authorImage}
                className="w-8 h-8 rounded-full object-cover border border-gray-200 shadow-xs cursor-pointer"
                alt="author"
              />
            </button>
          )}
          <CreatorBadge isBrand={recipe.isBrand} isCreator={recipe.isCreator} />
          {!recipe.isBrand &&
            !recipe.isCreator &&
            (() => {
              // 👉 Dynamic Pantry Match Calculation
              const matchPct = recipe.matchPercentage ?? calculatePantryMatch(recipe.allIngredients, inventory);
              const badgeColor = matchPct === 100 
                ? "bg-green-100 text-green-700 border border-green-200" 
                : matchPct >= 50 
                ? "bg-amber-100 text-amber-800 border border-amber-200" 
                : "bg-gray-100 text-gray-600 border border-gray-200";

              return (
                <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${badgeColor}`}>
                  ✨ {matchPct}% MATCH
                </span>
              );
            })()}
          <span className="text-[10px] text-gray-400 flex items-center ml-auto">
            <Clock className="w-3 h-3 mr-1" /> {recipe.prepTime}
          </span>
        </div>

        <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed pt-1">
          {recipe.description}
        </p>
      </div>
    </div>

    {/* Clean Action Footer */}
    <div className="px-4 py-3 bg-gray-50/70 border-t border-gray-100 flex items-center justify-between mt-auto">
      <div className="flex items-center bg-white border border-gray-200 rounded-full px-2.5 py-1 shadow-xs text-xs font-bold text-gray-600 gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onVote(recipe.id, 1);
          }}
          className="hover:text-green-600 flex items-center gap-1 cursor-pointer"
        >
          <ThumbsUp className="w-3 h-3" /> {recipe.likeCount || 0}
        </button>
        <span className="text-gray-300">|</span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onVote(recipe.id, -1);
          }}
          className="hover:text-red-600 cursor-pointer"
        >
          <ThumbsDown className="w-3 h-3" />
        </button>
      </div>

      <div className="flex items-center gap-1.5">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleSave(recipe);
          }}
          className={`p-2 rounded-xl border transition-colors cursor-pointer ${
            isSaved
              ? "bg-pink-50 border-pink-200 text-pink-600"
              : "bg-white border-gray-200 text-gray-400 hover:bg-gray-100"
          }`}
          title="Save Recipe"
        >
          <Bookmark className={`w-3.5 h-3.5 ${isSaved ? "fill-current" : ""}`} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAddToPlan(recipe);
          }}
          className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs transition-colors cursor-pointer"
          title="Add to Plan"
        >
          <Calendar className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  </div>
);



const BudgetScreen = ({ history, wasteHistory, inventory = [] }) => {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const monthlyHistory = history.filter((h) => {
    const d = h.timestamp?.toDate ? h.timestamp.toDate() : new Date();
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });
  const totalSpent = monthlyHistory.reduce(
    (acc, curr) => acc + (parseFloat(curr.cost) || 0),
    0
  );
  const monthlyWaste = wasteHistory.filter((w) => {
    const d = w.timestamp?.toDate ? w.timestamp.toDate() : new Date();
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });
  const totalWasted = monthlyWaste.reduce(
    (acc, curr) => acc + (parseFloat(curr.cost) || 0),
    0
  );
  const [budgetGoal, setBudgetGoal] = useState(
    parseFloat(localStorage.getItem("budget_goal") || "500")
  );
  const handleSetBudget = (val) => {
    setBudgetGoal(val);
    localStorage.setItem("budget_goal", val);
  };
  const catSpend = monthlyHistory.reduce((acc, curr) => {
    const cat = curr.category || "Other";
    acc[cat] = (acc[cat] || 0) + (parseFloat(curr.cost) || 0);
    return acc;
  }, {});
  

  const sortedCats = Object.entries(catSpend).sort((a, b) => b[1] - a[1]);
  const maxSpend = sortedCats.length > 0 ? sortedCats[0][1] : 1;
  const progress = Math.min((totalSpent / budgetGoal) * 100, 100);

  {/* Pantry Asset Value Summary on Budget Page */}
  const totalPantryWorth = useMemo(() => {
    return inventory.reduce((acc, item) => acc + (parseFloat(item.lastCost) || 2.00) * (item.quantity || 1), 0);
  }, [inventory]);

  return (
    <div className="space-y-6">
      {/* Top Spent Card */}
      <div className="bg-indigo-600 text-white p-6 rounded-3xl shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex justify-between items-end mb-4">
            <div>
              <p className="text-indigo-200 text-xs font-bold uppercase tracking-widest mb-1">
                Total Spent
              </p>
              <h2 className="text-4xl font-black">${totalSpent.toFixed(2)}</h2>
            </div>
            <div className="text-right">
              <p className="text-indigo-200 text-xs font-bold uppercase tracking-widest mb-1">
                Wasted Value
              </p>
              <h2 className="text-2xl font-bold text-red-300">
                -${totalWasted.toFixed(2)}
              </h2>
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-indigo-100 font-medium">
              <span>Budget Progress</span>
              <span>${(budgetGoal - totalSpent).toFixed(2)} left</span>
            </div>
            <div className="w-full bg-indigo-900/30 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all duration-500 ${
                  progress > 90 ? "bg-red-400" : "bg-green-400"
                }`}
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
        
      {/* Pantry Capital & Asset Valuation Card */}
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Active Pantry Assets</p>
            <h3 className="text-2xl font-black text-gray-900">${totalPantryWorth.toFixed(2)}</h3>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
            <Package className="w-6 h-6" />
          </div>
        </div>
        <p className="text-xs text-gray-500 leading-relaxed">
          Your pantry represents an active store of food currency. By consuming oldest stock first and tracking items before they expire, you protect this capital from turning into waste.
        </p>
      </div>

      <div className="bg-white p-4 rounded-xl border border-gray-100 flex items-center justify-between">
        <span className="text-xs font-bold text-gray-500">
          Monthly Budget Goal:
        </span>
        <div className="flex items-center">
          <span className="text-sm font-bold text-gray-400 mr-1">$</span>
          <input
            type="number"
            value={budgetGoal}
            onChange={(e) => handleSetBudget(parseFloat(e.target.value))}
            className="w-20 p-1 border border-gray-200 rounded text-sm font-bold text-right outline-none focus:border-indigo-500"
          />
        </div>
      </div>
      {totalWasted > 0 && (
        <div className="bg-red-50 p-4 rounded-2xl border border-red-100">
          <h3 className="font-bold text-red-800 mb-2 flex items-center text-sm">
            <Trash2 className="w-4 h-4 mr-2" /> Waste Report
          </h3>
          <div className="space-y-2">
            {monthlyWaste.slice(0, 3).map((w) => (
              <div
                key={w.id}
                className="flex justify-between text-xs text-red-700 bg-white/50 p-2 rounded-lg"
              >
                <span>{w.name} (Spoiled)</span>
                <span className="font-bold">-${w.cost}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-indigo-600" /> Spending by Category
        </h3>
        {sortedCats.length > 0 ? (
          <div className="space-y-3">
            {sortedCats.map(([cat, amount]) => (
              <div key={cat}>
                <div className="flex justify-between text-xs font-bold text-gray-600 mb-1">
                  <span>{cat}</span>
                  <span>${amount.toFixed(2)}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className="bg-indigo-500 h-2 rounded-full"
                    style={{ width: `${(amount / maxSpend) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-400 text-xs py-4">
            No spending recorded yet.
          </p>
        )}
      </div>
      <div className="bg-white p-4 rounded-3xl border border-gray-100">
        <h3 className="font-bold text-gray-800 mb-3 text-sm">
          Recent Transactions
        </h3>
        <div className="space-y-2">
          {history.slice(0, 10).map((h) => (
            <div
              key={h.id}
              className="flex justify-between items-center text-xs p-2 hover:bg-gray-50 rounded-lg"
            >
              <span className="font-medium text-gray-700">{h.name}</span>
              <div className="text-right">
                <span className="block font-bold text-indigo-600">
                  -${parseFloat(h.cost).toFixed(2)}
                </span>
                <span className="text-gray-400 text-[10px]">
                  {h.timestamp?.toDate().toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
const CheckoutModal = ({ items, onClose, onConfirm }) => {
  const [prices, setPrices] = useState({});
  const handlePriceChange = (id, val) =>
    setPrices((prev) => ({ ...prev, [id]: val }));
  const handleComplete = () =>
    onConfirm(
      items.map((i) => ({ ...i, price: parseFloat(prices[i.id]) || 0 }))
    );
  const total = Object.values(prices).reduce(
    (acc, curr) => acc + (parseFloat(curr) || 0),
    0
  );
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-lg">Checkout</h3>
          <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">
            Total: ${total.toFixed(2)}
          </div>
        </div>
        <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex justify-between items-center p-2 bg-gray-50 rounded-xl"
            >
              <span className="text-sm font-medium text-gray-700 truncate w-1/2">
                {item.name}
              </span>
              <div className="flex items-center gap-1">
                <span className="text-xs text-gray-400">$</span>
                <input
                  type="number"
                  placeholder="0.00"
                  className="w-20 p-1.5 rounded-lg border border-gray-200 text-xs font-mono outline-none focus:border-indigo-500"
                  onChange={(e) => handlePriceChange(item.id, e.target.value)}
                />
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-2 pt-2">
          <button
            onClick={onClose}
            className="flex-1 py-3 text-gray-500 font-bold text-sm bg-gray-100 rounded-xl cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleComplete}
            className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg cursor-pointer"
          >
            Confirm & Save
          </button>
        </div>
      </div>
    </div>
  );
};

const MealPlanner = ({ plan, onAddMeal, onDeleteMeal, onGenerateDayPlan, onPlanExpiring, onBrowseRecipes }) => {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const [selectedDay, setSelectedDay] = useState("Mon");
  const mealsForDay = plan
    .filter((p) => p.day === selectedDay)
    .sort((a, b) => {
      const orders = { Breakfast: 1, Lunch: 2, Dinner: 3 };
      return (orders[a.type] || 4) - (orders[b.type] || 4);
    });

  return (
    <div className="space-y-4">
      <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide">
        {days.map((d) => (
          <button
            key={d}
            onClick={() => setSelectedDay(d)}
            className={`flex-shrink-0 w-12 h-16 rounded-xl flex flex-col items-center justify-center text-xs font-bold transition-all cursor-pointer ${
              selectedDay === d
                ? "bg-indigo-600 text-white shadow-lg"
                : "bg-white text-gray-500 border border-gray-100"
            }`}
          >
            <span>{d}</span>
            {plan.some((p) => p.day === d) && (
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full mt-1"></span>
            )}
          </button>
        ))}
      </div>
      
      <div className="bg-white rounded-3xl p-4 border border-gray-100 shadow-sm min-h-[300px]">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-gray-800 flex items-center">
            <Calendar className="w-5 h-5 mr-2 text-indigo-600" /> {selectedDay}'s Plan
          </h3>
          {mealsForDay.length > 0 && (
            <button
              onClick={() => generateICS(mealsForDay)}
              className="text-xs text-indigo-500 font-bold flex items-center bg-indigo-50 px-2 py-1 rounded-lg cursor-pointer"
            >
              <Download className="w-3 h-3 mr-1" /> Sync
            </button>
          )}
        </div>

        {mealsForDay.length > 0 ? (
          <div className="space-y-3">
            {mealsForDay.map((meal) => (
              <div
                key={meal.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100"
              >
                <div>
                  <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider">
                    {meal.type} {meal.mealTime && `@ ${meal.mealTime}`}
                  </span>
                  <p className="font-semibold text-gray-800 text-sm truncate w-48">
                    {meal.recipeTitle}
                  </p>
                </div>
                <button
                  onClick={() => onDeleteMeal(meal.id)}
                  className="text-gray-400 hover:text-red-500 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          /* ACTIONABLE EMPTY STATE */
          <div className="text-center py-8 px-4 space-y-4">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-800">No meals planned for {selectedDay}</p>
              <p className="text-xs text-gray-400 mt-0.5">Let's build your schedule with one tap:</p>
            </div>

            <div className="grid grid-cols-1 gap-2 max-w-sm mx-auto pt-2">
              <button
                onClick={() => onGenerateDayPlan && onGenerateDayPlan(selectedDay)}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Zap className="w-4 h-4 text-amber-300" /> Auto-Generate {selectedDay} Plan
              </button>
              
              <button
                onClick={() => onPlanExpiring && onPlanExpiring(selectedDay)}
                className="w-full py-2.5 bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <AlertCircle className="w-4 h-4 text-orange-500" /> Plan Around Expiring Pantry Items
              </button>

              <button
                onClick={() => onBrowseRecipes && onBrowseRecipes()}
                className="w-full py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-600 border border-gray-200 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Search className="w-4 h-4 text-gray-400" /> Browse Recipe Library
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};


const RecipeDetailView = ({
  recipe,
  onClose,
  onCook,
  onAddToGrocery,
  onAddToPlan,
  onAddToPantry,
  inventory,
  isSaved,
  onToggleSave,
  onVote,
  userNote,
  onSaveNote,
  userProfile,
  onUpdateEquipment,
  effectiveUserId,
  globalTimers,      
  setGlobalTimers,   
  pinnedRecipes,     
  setPinnedRecipes,
  askAIChef,
}) => {
  const baseServings = recipe.servings || 4;
  const [servings, setServings] = useState(baseServings);
  const [cookingMode, setCookingMode] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false); //
  const [selectedMissing, setSelectedMissing] = useState([]);
  const [showConverter, setShowConverter] = useState(false);
  const [ovenStatus, setOvenStatus] = useState("off");
  const [isNoteExpanded, setIsNoteExpanded] = useState(false);
  const [currentNote, setCurrentNote] = useState(userNote || "");
  const [noteSavedAnim, setNoteSavedAnim] = useState(false);
  const handleSaveAndConfirm = (id, text) => {
    onSaveNote(id, text);
    setNoteSavedAnim(true);
    setTimeout(() => {
      setNoteSavedAnim(false);
      setIsNoteExpanded(false); // Collapse after save if desired
    }, 2000);
  };
  
  const [planDay, setPlanDay] = useState("Mon");
  const [planType, setPlanType] = useState("Dinner");
  const [planTime, setPlanTime] = useState("18:00");
  const [planReminder, setPlanReminder] = useState(false);
  const ovenTempMatch = recipe.instructions
    ? recipe.instructions.match(/(\d{3})(?:°|\s*degrees)?\s*F/i)
    : null;
  const ovenTemp = ovenTempMatch ? ovenTempMatch[1] : null;
  const toggleOven = () => {
    if (ovenStatus === "off") {
      setOvenStatus("preheating");
      setTimeout(() => setOvenStatus("ready"), 3000);
    } else {
      setOvenStatus("off");
    }
  };
  useEffect(() => {
    if (!recipe.allIngredients) return;
    const missing = recipe.allIngredients
      .filter(
        (ing) =>
          !inventory.some((invItem) =>
            invItem.name.toLowerCase().includes(ing.name.toLowerCase())
          )
      )
      .map((i) => i.name);
    setSelectedMissing(missing);
  }, [recipe, inventory]);
  const scaleQty = (qty) => {
    if (!qty) return "";
    const num = parseFloat(qty);
    if (isNaN(num)) return qty;
    const scaled = (num / baseServings) * servings;
    return Number.isInteger(scaled) ? scaled : parseFloat(scaled.toFixed(2));
  };

  const [showGearDrawer, setShowGearDrawer] = useState(false); // 👉 LANDMARK: Expandable gear drawer state
  
  const toggleMissingItem = (name) => {
    if (selectedMissing.includes(name)) {
      setSelectedMissing(selectedMissing.filter((i) => i !== name));
    } else {
      setSelectedMissing([...selectedMissing, name]);
    }
  };
  const prepMinutes = parsePrepTime(recipe.prepTime || "30 mins");
  const getPrepStartTime = () => {
    const [h, m] = planTime.split(":").map(Number);
    const d = new Date();
    d.setHours(h, m - prepMinutes, 0);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };
  if (cookingMode)
    return (
      <CookingMode
        recipe={recipe}
        initialServings={servings}
        onClose={() => setCookingMode(false)}
        globalTimers={globalTimers}
        setGlobalTimers={setGlobalTimers}
        pinnedRecipes={pinnedRecipes}
        setPinnedRecipes={setPinnedRecipes}
        askAIChef={askAIChef}
      />
    );
  const authorTitle = recipe.authorName ? `${recipe.authorName}'s Recommended Equipment` : "Recommended Equipment";
  return (
    <div className="flex flex-col h-full bg-white animate-in slide-in-from-right duration-300 relative">
      {recipe.image && (
        <div className="w-full h-48 bg-gray-100">
          <img
            src={recipe.image}
            alt={recipe.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <div className="p-4 border-b flex items-center justify-between sticky top-0 bg-white z-10">
        <button onClick={onClose} className="p-2 -ml-2 cursor-pointer">
          <ChevronLeft />
        </button>
        <div className="flex-1 px-2">
          <h2 className="font-bold truncate text-sm">{recipe.title}</h2>
          {recipe.sourceUrl && (
            <a
              href={recipe.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="text-[10px] text-blue-500 flex items-center mt-0.5"
            >
              <ExternalLink className="w-3 h-3 mr-1" /> Source:{" "}
              {recipe.sourceName || "Web"}
            </a>
          )}
        </div>
        <div className="flex gap-2">
          <div className="flex items-center bg-gray-100 rounded-full px-2 py-1 text-[10px] font-bold text-gray-600 border border-gray-200">
            <button
              onClick={() => onVote(recipe.id, 1)}
              className="hover:text-green-600 mr-2 flex items-center cursor-pointer"
            >
              <ThumbsUp className="w-3 h-3 mr-1" /> {recipe.likeCount || 0}
            </button>
            <button
              onClick={() => onVote(recipe.id, -1)}
              className="hover:text-red-600 flex items-center cursor-pointer"
            >
              <ThumbsDown className="w-3 h-3" />
            </button>
          </div>
          <button
            onClick={() => setShowConverter(!showConverter)}
            className={`p-2 rounded-full cursor-pointer ${
              showConverter
                ? "bg-indigo-600 text-white"
                : "text-indigo-600 bg-indigo-50"
            }`}
          >
            <ArrowRightLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => onToggleSave(recipe)}
            className={`p-2 rounded-full cursor-pointer ${
              isSaved
                ? "bg-pink-100 text-pink-600"
                : "bg-gray-100 text-gray-400 hover:bg-gray-200"
            }`}
          >
            <Bookmark className={`w-4 h-4 ${isSaved ? "fill-current" : ""}`} />
          </button>
          <button
            onClick={() => setShowPlanModal(true)}
            className="p-2 text-indigo-600 bg-indigo-50 rounded-full cursor-pointer"
          >
            <Calendar className="w-4 h-4" />
          </button>
          {/* 👉 REPORT RECIPE BUTTON */}
          <button
            onClick={() => setShowReportModal(true)}
            className="p-2 text-red-500 bg-red-50 hover:bg-red-100 rounded-full cursor-pointer transition-colors"
            title="Report Recipe"
          >
            <AlertOctagon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {showConverter && (
        <div className="absolute top-16 left-0 right-0 z-20 p-4 bg-white/95 backdrop-blur-sm border-b border-indigo-100 shadow-xl">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-xs font-bold text-indigo-800 uppercase">
              Quick Converter
            </h4>
            <button onClick={() => setShowConverter(false)}>
              <X className="w-4 h-4 text-gray-400 cursor-pointer cursor-pointer" />
            </button>
          </div>
          <ConverterWidget />
        </div>
      )}
      <div className="p-4 space-y-6 flex-grow overflow-auto pb-24">
        <p className="text-gray-600 text-sm italic">"{recipe.description}"</p>

        {/* Private Chef Notes Editor Box */}
        <div className="bg-amber-50/70 border border-amber-200 p-4 rounded-2xl space-y-3 shadow-2xs">
          <div className="flex justify-between items-center cursor-pointer" onClick={() => setIsNoteExpanded(!isNoteExpanded)}>
            <div className="flex items-center gap-2">
              <Edit className="w-4 h-4 text-amber-600" />
              <h4 className="text-xs font-bold text-amber-900 uppercase">My Private Chef Note</h4>
              <span className="text-[9px] text-amber-600 font-medium hidden sm:inline">(Only visible to you)</span>
            </div>
            <div className="flex items-center gap-2">
              {userNote && !isNoteExpanded && (
                <span className="text-[10px] text-amber-800 font-medium truncate max-w-[140px] bg-amber-100/60 px-2 py-0.5 rounded-md">
                  "{userNote}"
                </span>
              )}
              <span className="text-xs font-bold text-amber-700">{isNoteExpanded ? "▲ Hide" : "▼ Add / View"}</span>
            </div>
          </div>

          {isNoteExpanded && (
            <div className="space-y-2 pt-2 border-t border-amber-200/60 animate-in fade-in">
              <textarea
                value={currentNote}
                onChange={(e) => setCurrentNote(e.target.value)}
                placeholder="Add personal tweaks, e.g. 'Kids hated, Mike loved, cut salt in half...'"
                className="w-full p-2.5 bg-white border border-amber-200 rounded-xl text-xs text-gray-800 outline-none focus:border-amber-500 resize-none h-20"
              />
              <div className="flex justify-between items-center">
                {noteSavedAnim ? (
                  <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1 animate-in fade-in">
                    <CheckCircle className="w-3.5 h-3.5" /> Note Saved Successfully!
                  </span>
                ) : <span></span>}

                <button
                  onClick={() => handleSaveAndConfirm(recipe.id || recipe.firestoreId, currentNote)}
                  className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer transition-colors"
                >
                  Save Note
                </button>
              </div>
            </div>
          )}
        </div>

        {/* NEW: Side Dishes Section */}
        {recipe.recommendedSides && recipe.recommendedSides.length > 0 && (
          <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
            <h4 className="text-xs font-bold text-purple-800 uppercase mb-2 flex items-center gap-2">
              <Utensils className="w-3 h-3" /> Goes well with
            </h4>
            <ul className="list-disc pl-4 space-y-1">
              {recipe.recommendedSides.map((side, i) => (
                <li key={i} className="text-sm text-purple-700">
                  {side}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Recommended Gear Redesign - Collapsed Accordion Tab */}
        {recipe.recommendedGear && recipe.recommendedGear.length > 0 && (
          <div className="bg-gray-50 rounded-2xl border border-gray-200 overflow-hidden shadow-2xs">
            <button
              onClick={() => setShowGearDrawer(!showGearDrawer)}
              className="w-full p-3.5 flex items-center justify-between bg-gray-100/70 hover:bg-gray-100 transition-colors text-left cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-indigo-600" />
                <span className="text-xs font-bold text-gray-800 uppercase">
                  {authorTitle} ({recipe.recommendedGear.length})
                </span>
              </div>
              <span className="text-xs font-bold text-indigo-600">
                {showGearDrawer ? "Hide ▲" : "View Gear ▼"}
              </span>
            </button>

            {showGearDrawer && (
              <div className="p-3 space-y-2 border-t border-gray-200 bg-white animate-in fade-in max-h-48 overflow-y-auto">
                {recipe.recommendedGear.map((gearName, i) => {
                  const userHasEquipment = (userProfile?.equipment || []).some(
                    (eq) => eq.toLowerCase() === gearName.toLowerCase()
                  );

                  return (
                    <div key={i} className="bg-gray-50 p-2.5 rounded-xl border border-gray-200 flex items-center justify-between">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center text-xs shrink-0">
                          🛠️
                        </div>
                        <p className="text-xs font-bold text-gray-900 truncate">{gearName}</p>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {userHasEquipment ? (
                          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-lg flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" /> Have It
                          </span>
                        ) : (
                          <>
                            <button
                              onClick={() => onUpdateEquipment(gearName)}
                              className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-[10px] font-bold px-2 py-1 rounded-lg transition-colors cursor-pointer"
                            >
                              Have It
                            </button>
                            <button
                              onClick={() => window.open(`https://www.amazon.com/s?k=${encodeURIComponent(gearName)}`, "_blank")}
                              className="bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg shadow-xs transition-colors cursor-pointer flex items-center gap-1"
                            >
                              <ShoppingCart className="w-3 h-3" /> Buy
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
        {ovenTemp && (
          <div className="bg-orange-50 p-3 rounded-xl border border-orange-100 flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-full ${
                  ovenStatus === "off"
                    ? "bg-orange-100 text-orange-400"
                    : "bg-orange-500 text-white animate-pulse"
                }`}
              >
                <Thermometer className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-orange-900 uppercase">
                  Smart Oven
                </h4>
                <p className="text-xs text-orange-700">
                  {ovenStatus === "off"
                    ? `Ready to preheat to ${ovenTemp}°F`
                    : ovenStatus === "preheating"
                    ? `Preheating to ${ovenTemp}°F...`
                    : `Oven is Ready at ${ovenTemp}°F`}
                </p>
              </div>
            </div>
            <button
              onClick={toggleOven}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                ovenStatus === "off"
                  ? "bg-white text-orange-600 border border-orange-200"
                  : "bg-orange-600 text-white"
              }`}
            >
              {ovenStatus === "off"
                ? "Start"
                : ovenStatus === "preheating"
                ? "Heating..."
                : "Stop"}
            </button>
          </div>
        )}
        {recipe.kidFriendlyVersion && (
          <div className="bg-blue-50 p-3 rounded-xl border border-blue-100">
            <h4 className="text-xs font-bold text-blue-800 uppercase mb-1 flex items-center">
              <Smile className="w-3 h-3 mr-1" /> For the Kids
            </h4>
            <p className="text-xs text-blue-600">{recipe.kidFriendlyVersion}</p>
          </div>
        )}
        <div className="bg-green-50 p-3 rounded-xl border border-green-100 space-y-2">
          <div className="flex justify-between">
            <div className="text-center">
              <span className="block font-bold text-green-800">
                {recipe.nutrition?.calories || "-"}
              </span>
              <span className="text-[10px] text-green-600">Cals</span>
            </div>
            <div className="text-center">
              <span className="block font-bold text-green-800">
                {recipe.nutrition?.protein || "-"}
              </span>
              <span className="text-[10px] text-green-600">Protein</span>
            </div>
            <div className="text-center">
              <span className="block font-bold text-green-800">
                {recipe.nutrition?.carbs || "-"}
              </span>
              <span className="text-[10px] text-green-600">Carbs</span>
            </div>
            <div className="text-center">
              <span className="block font-bold text-green-800">
                {recipe.nutrition?.fat || "-"}
              </span>
              <span className="text-[10px] text-green-600">Fat</span>
            </div>
          </div>
          {recipe.dietaryModification && (
            <div className="mt-2 pt-2 border-t border-green-200">
              <p className="text-xs font-bold text-purple-700 flex items-center">
                <Leaf className="w-3 h-3 mr-1" /> Diet Adaptation:
              </p>
              <p className="text-xs text-purple-600 italic">
                {recipe.dietaryModification}
              </p>
            </div>
          )}
        </div>
        <div className="flex items-center justify-between bg-indigo-50 p-3 rounded-xl border border-indigo-100">
          <span className="text-sm font-bold text-indigo-900 flex items-center gap-2">
            <Users className="w-4 h-4" /> Servings
          </span>
          <div className="flex items-center gap-3 bg-white rounded-lg px-2 py-1 shadow-sm">
            <button
              onClick={() => setServings((s) => Math.max(1, s - 1))}
              className="p-1 text-indigo-600 hover:bg-indigo-50 rounded cursor-pointer"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-6 text-center font-bold text-sm">
              {servings}
            </span>
            <button
              onClick={() => setServings((s) => s + 1)}
              className="p-1 text-indigo-600 hover:bg-indigo-50 rounded cursor-pointer"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <h4 className="font-bold text-xs uppercase tracking-widest text-gray-400 mb-2">
              Ingredients (Scaled)
            </h4>
            <div className="grid grid-cols-1 gap-2">
              {recipe.allIngredients?.map((ing, i) => {
                // 1. Find matching inventory item safely during render
                const matchedItem = inventory.find((invItem) =>
                  invItem.name?.toLowerCase().includes(ing.name?.toLowerCase()) ||
                  ing.name?.toLowerCase().includes(invItem.name?.toLowerCase())
                );
                const inPantry = Boolean(matchedItem);
                const isFrozen = matchedItem?.location === "Freezer";

                const scaledQ = scaleQty(ing.quantity);
                return (
                  <div
                    key={i}
                    className={`flex items-center justify-between p-3 rounded-xl border ${
                      !inPantry
                        ? "bg-red-50/30 border-red-100"
                        : "bg-green-50/30 border-green-100"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {!inPantry ? (
                        <input
                          type="checkbox"
                          checked={selectedMissing.includes(ing.name)}
                          onChange={() => toggleMissingItem(ing.name)}
                          className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 cursor-pointer"
                        />
                      ) : (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      )}
                      <span
                        className={`text-sm flex items-center ${
                          inPantry ? "font-bold text-gray-800" : "text-gray-500"
                        }`}
                      >
                        <span className="inline-block bg-gray-200 text-gray-700 text-[10px] font-bold px-2 py-0.5 rounded-full mr-2 min-w-[40px] text-center">
                          {scaledQ} {ing.unit}
                        </span>
                        {ing.name}
                        {isFrozen && (
                          <span className="text-[9px] font-bold text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded flex items-center gap-1 ml-2">
                            <Snowflake className="w-3 h-3" /> Defrost
                          </span>
                        )}
                      </span>
                    </div>

                    {/* Fully Functional Bidirectional Toggle */}
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (inPantry && matchedItem?.id) {
                          // Remove the item using its pre-calculated Firestore ID
                          await deleteDoc(
                            doc(db, `/artifacts/${appId}/users/${effectiveUserId}/inventory`, matchedItem.id)
                          );
                        } else {
                          // Add the item to pantry
                          await onAddToPantry(ing.name);
                        }
                      }}
                      className={`px-2.5 py-1.5 rounded-xl text-[10px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                        inPantry
                          ? "bg-emerald-100 text-emerald-700 border border-emerald-200 hover:bg-emerald-200"
                          : "bg-rose-100 text-rose-700 border border-rose-200 hover:bg-rose-200"
                      }`}
                      title={inPantry ? "In stock (Click to remove from pantry)" : "Missing (Click to add to pantry)"}
                    >
                      {inPantry ? (
                        <>
                          <CheckCircle className="w-3 h-3" /> In Stock (Have)
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="w-3 h-3" /> Missing (Need)
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
          {selectedMissing.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  onAddToGrocery(selectedMissing);
                  // Explicitly fire notification from recipe view as well
                  setNotification(`🛒 Added ${selectedMissing.length} items to shopping list!`);
                  setTimeout(() => setNotification(null), 3000);
                }}
                className="py-3 bg-indigo-100 text-indigo-700 rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Add Selected ({selectedMissing.length})
              </button>
              <button
                onClick={() =>
                  window.open(
                    `https://www.instacart.com/store/s?k=${encodeURIComponent(
                      selectedMissing.join(", ")
                    )}`,
                    "_blank"
                  )
                }
                className="py-3 bg-orange-500 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <ShoppingCart className="w-4 h-4" /> Order Selected
              </button>
            </div>
          )}
          <div>
            <h4 className="font-bold text-xs uppercase tracking-widest text-gray-400 mb-2">
              Instructions
            </h4>
            <div className="bg-gray-50 p-4 rounded-2xl text-sm text-gray-700 leading-relaxed whitespace-pre-wrap border border-gray-100">
              {recipe.instructions}
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <button
            onClick={() => setCookingMode(true)}
            className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
          >
            <Play className="w-5 h-5" /> Start Cooking Mode
          </button>
          <button
            onClick={() => {
              const scaledIngredients = recipe.allIngredients.map((ing) => ({
                ...ing,
                quantity: scaleQty(ing.quantity),
              }));
              onCook({ ...recipe, allIngredients: scaledIngredients });
            }}
            className="w-full py-4 bg-white border border-green-200 text-green-600 rounded-2xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
          >
            <Activity className="w-5 h-5" /> Log Meal & Deduct Stock
          </button>
        </div>
      </div>
      {showPlanModal && (
        <div className="absolute inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in">
            <div className="flex justify-between items-center border-b pb-2 mb-4">
              <h3 className="font-bold text-lg">Add to Meal Plan</h3>
              <button onClick={() => setShowPlanModal(false)}>
                <X className="w-5 h-5 text-gray-400 cursor-pointer" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                  Day
                </label>
                <div className="grid grid-cols-7 gap-1">
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
                    (d) => (
                      <button
                        key={d}
                        onClick={() => setPlanDay(d)}
                        className={`p-2 rounded-lg text-xs font-bold ${
                          planDay === d
                            ? "bg-indigo-600 text-white"
                            : "bg-gray-100 text-gray-500 cursor-pointer"
                        }`}
                      >
                        {d}
                      </button>
                    )
                  )}
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                    Meal
                  </label>
                  <select
                    value={planType}
                    onChange={(e) => setPlanType(e.target.value)}
                    className="w-full p-3 bg-gray-50 rounded-xl text-sm font-medium outline-none"
                  >
                    {["Breakfast", "Lunch", "Dinner", "Snack"].map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                    Eat Time
                  </label>
                  <input
                    type="time"
                    value={planTime}
                    onChange={(e) => setPlanTime(e.target.value)}
                    className="w-full p-3 bg-gray-50 rounded-xl text-sm font-medium outline-none cursor-pointer"
                  />
                </div>
              </div>
              <div className="bg-indigo-50 p-3 rounded-xl flex items-center justify-between border border-indigo-100">
                <div>
                  <p className="text-xs font-bold text-indigo-900">
                    Start Prep At: {getPrepStartTime()}
                  </p>
                  <p className="text-[10px] text-indigo-600">
                    Based on {prepMinutes}m prep time
                  </p>
                </div>
                <button
                  onClick={() => setPlanReminder(!planReminder)}
                  className={`p-2 rounded-full transition-colors cursor-pointer ${
                    planReminder
                      ? "bg-indigo-600 text-white"
                      : "bg-white text-indigo-300"
                  }`}
                >
                  <Bell className="w-4 h-4" />
                </button>
              </div>
              <button
                onClick={() => {
                  onAddToPlan(
                    recipe,
                    planDay,
                    planType,
                    planTime,
                    recipe.prepTime
                  );
                  setShowPlanModal(false);
                  if (planReminder)
                    alert(
                      `Reminder set for ${getPrepStartTime()} on ${planDay}!`
                    );
                }}
                className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg hover:bg-indigo-700 cursor-pointer"
              >
                Save to Schedule
              </button>
            </div>
          </div>
        </div>
      )}

      {showReportModal && (
        <ReportRecipeModal
          recipe={recipe}
          onClose={() => setShowReportModal(false)}
          effectiveUserId={effectiveUserId}
          db={db}
          appId={appId}
        />
      )}
    </div>
  );
};

// Re-implementing AdminDashboard correctly
// Re-implementing AdminDashboard correctly
const AdminDashboard = ({
  userData,
  allMetrics,
  onSeed,
  onPurge,
  onImpersonate,
  effectiveUserId,
  communityRecipes,
  setActiveTab,
  isAdmin,
}) => {
  const [adminView, setAdminView] = useState("impact");
  const [feedbackLogs, setFeedbackLogs] = useState([]);
  const [visitorLogs, setVisitorLogs] = useState([]);
  const [waitlistUsers, setWaitlistUsers] = useState([]);

  // Fetch visitors automatically for the Admin
  useEffect(() => {
    if (!db || !isAdmin) return;
    const q = query(
      collection(db, `/artifacts/${appId}/public/data/visitorLogs`),
      orderBy("lastLogin", "desc"),
      limit(50)
    );
    const unsub = onSnapshot(q, (snap) => {
      setVisitorLogs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [db, isAdmin]);

  // Fetch feedback automatically for the Admin
  useEffect(() => {
    if (!db) return;
    const q = query(
      collection(db, `/artifacts/${appId}/public/data/feedback`),
      orderBy("timestamp", "desc"),
      limit(30)
    );
    const unsub = onSnapshot(q, (snap) => {
      setFeedbackLogs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!db || !isAdmin) return;
    const q = query(
      collection(db, `/artifacts/${appId}/public/data/waitlist`),
      orderBy("requestedAt", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setWaitlistUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [db, isAdmin, appId]);

  const [recipeReports, setRecipeReports] = useState([]);

  useEffect(() => {
    if (!db || !isAdmin) return;
    const q = query(
      collection(db, `/artifacts/${appId}/public/data/recipeReports`),
      orderBy("timestamp", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setRecipeReports(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [db, isAdmin, appId]);

  const mockNetworkData = {
    totalUsers: 12450,
    activeToday: 3420,
    totalWasteSaved: 45000,
    totalMoneySaved: 125000,
    topWasted: [
      { name: "Spinach", count: 450 },
      { name: "Milk", count: 320 },
      { name: "Bananas", count: 210 },
    ],
    topCooked: [
      { name: "Chicken Stir Fry", count: 1200 },
      { name: "Spaghetti Bolognese", count: 980 },
    ],
    brandAffinity: [
      { brand: "Heinz", score: 85 },
      { brand: "Barilla", score: 72 },
      { brand: "McCormick", score: 68 },
      { brand: "Kraft", score: 55 },
    ],
    ingredientDemand: [
      { item: "Oat Milk", trend: "+22%" },
      { item: "Chickpeas", trend: "+15%" },
      { item: "Avocado", trend: "-5%" },
    ],
  };

  return (
    <div className="space-y-6">
      {/* Render Admin Batch Recipe Ingestor Studio (#6) */}
      <AdminRecipeIngestor db={db} appId={appId} effectiveUserId={effectiveUserId} communityRecipes={communityRecipes} setActiveTab={setActiveTab}/>
      <div className="bg-gray-900 text-white p-6 rounded-3xl shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-indigo-400" /> Admin Portal
          </h2>
          <div className="flex gap-2 flex-wrap justify-end">
            <button
              onClick={() => setAdminView("impact")}
              className={`px-2 py-1 rounded text-[10px] font-bold ${
                adminView === "impact" ? "bg-indigo-600" : "bg-gray-800 cursor-pointer"
              }`}
            >
              Impact
            </button>
            <button
              onClick={() => setAdminView("monetization")}
              className={`px-2 py-1 rounded text-[10px] font-bold ${
                adminView === "monetization" ? "bg-indigo-600" : "bg-gray-800 cursor-pointer"
              }`}
            >
              Data
            </button>
            <button
              onClick={() => setAdminView("users")}
              className={`px-2 py-1 rounded text-[10px] font-bold ${
                adminView === "users" ? "bg-indigo-600" : "bg-gray-800 cursor-pointer"
              }`}
            >
              Users
            </button>
            <button
              onClick={() => setAdminView("feedback")}
              className={`px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 ${
                adminView === "feedback" ? "bg-indigo-600" : "bg-gray-800 cursor-pointer"
              }`}
            >
              Feedback
              {feedbackLogs.length > 0 && (
                <span className="bg-red-500 text-white px-1 rounded-full text-[8px]">{feedbackLogs.length}</span>
              )}
            </button>
            <button
              onClick={() => setAdminView("reports")}
              className={`px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 ${
                adminView === "reports" ? "bg-indigo-600" : "bg-gray-800 cursor-pointer"
              }`}
            >
              Reports
              {recipeReports.filter(r => r.status === "pending").length > 0 && (
                <span className="bg-red-500 text-white px-1 rounded-full text-[8px]">
                  {recipeReports.filter(r => r.status === "pending").length}
                </span>
              )}
            </button>
            <button
              onClick={() => setAdminView("visitors")}
              className={`px-2 py-1 rounded text-[10px] font-bold ${
                adminView === "visitors" ? "bg-indigo-600" : "bg-gray-800 cursor-pointer"
              }`}
            >
              Visitors ({visitorLogs.length})
            </button>
            <button
              onClick={() => setAdminView("waitlist")}
              className={`px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 ${
                adminView === "waitlist" ? "bg-indigo-600" : "bg-gray-800 cursor-pointer"
              }`}
            >
              Waitlist
              {waitlistUsers.filter(u => u.status === "pending").length > 0 && (
                <span className="bg-amber-500 text-white px-1 rounded-full text-[8px]">
                  {waitlistUsers.filter(u => u.status === "pending").length}
                </span>
              )}
            </button>
          </div>
        </div>

        {adminView === "impact" && (
          <div className="grid grid-cols-2 gap-4 animate-in fade-in">
            <div className="bg-white/10 p-3 rounded-xl">
              <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">
                Total Impact
              </p>
              <h3 className="text-2xl font-black text-green-400">
                ${(mockNetworkData.totalMoneySaved / 1000).toFixed(1)}k
              </h3>
              <p className="text-[10px] text-gray-400">User Savings</p>
            </div>
            <div className="bg-white/10 p-3 rounded-xl">
              <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">
                Waste Diverted
              </p>
              <h3 className="text-2xl font-black text-blue-400">
                {(mockNetworkData.totalWasteSaved / 1000).toFixed(1)}k
              </h3>
              <p className="text-[10px] text-gray-400">Lbs Food</p>
            </div>
          </div>
        )}

        {adminView === "monetization" && (
          <div className="space-y-4 animate-in fade-in">
            <div className="bg-white/10 p-3 rounded-xl">
              <h4 className="text-xs font-bold text-gray-300 uppercase mb-2">
                Brand Affinity (Scan Data)
              </h4>
              {mockNetworkData.brandAffinity.map((b, i) => (
                <div key={i} className="flex justify-between text-xs mb-1">
                  <span>{b.brand}</span>
                  <div className="w-24 bg-gray-700 rounded-full h-1.5 mt-1.5">
                    <div
                      className="bg-indigo-400 h-1.5 rounded-full"
                      style={{ width: `${b.score}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-white/10 p-3 rounded-xl">
              <h4 className="text-xs font-bold text-gray-300 uppercase mb-2">
                Ingredient Demand Trends
              </h4>
              {mockNetworkData.ingredientDemand.map((d, i) => (
                <div key={i} className="flex justify-between text-xs mb-1">
                  <span>{d.item}</span>
                  <span
                    className={
                      d.trend.includes("+") ? "text-green-400" : "text-red-400"
                    }
                  >
                    {d.trend}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {adminView === "visitors" && (
          <div className="space-y-3 animate-in fade-in max-h-96 overflow-y-auto pr-2">
            {visitorLogs.length === 0 ? (
              <p className="text-xs text-gray-500 text-center py-4">No visitor logs recorded yet.</p>
            ) : (
              visitorLogs.map((visitor) => (
                <div key={visitor.id} className="bg-white/5 p-3 rounded-xl border border-white/10 flex justify-between items-center">
                  <div>
                    <p className="text-xs font-bold text-white">{visitor.displayName} ({visitor.email})</p>
                    <p className="text-[9px] text-gray-400 font-mono">UID: {visitor.uid}</p>
                  </div>
                  <span className="text-[9px] text-indigo-300">
                    {visitor.lastLogin?.toDate ? visitor.lastLogin.toDate().toLocaleString() : "Just now"}
                  </span>
                </div>
              ))
            )}
          </div>
        )}

        {adminView === "users" && (
          <div className="mt-4 space-y-2 animate-in fade-in">
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">
              Community Management
            </p>
            <button
              onClick={onSeed}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-2 cursor-pointer"
            >
              <Users className="w-4 h-4" /> Populate Fake Community (Seed)
            </button>
            <button
              onClick={onPurge}
              className="w-full py-3 bg-red-900/50 hover:bg-red-900 text-red-200 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" /> Purge Test Data
            </button>
          </div>
        )}

        {adminView === "reports" && (
          <div className="space-y-3 animate-in fade-in max-h-96 overflow-y-auto pr-2">
            {recipeReports.length === 0 ? (
              <p className="text-xs text-gray-500 text-center py-4">No recipe reports submitted yet.</p>
            ) : (
              recipeReports.map((report) => (
                <div key={report.id} className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-300">
                      🚨 {report.reason}
                    </span>
                    <span className="text-[9px] text-gray-400">
                      {report.timestamp?.toDate ? report.timestamp.toDate().toLocaleDateString() : "Just now"}
                    </span>
                  </div>

                  <div>
                    <p className="text-xs font-bold text-white">Recipe: {report.recipeTitle}</p>
                    {report.details && <p className="text-xs text-gray-300 italic mt-1">"{report.details}"</p>}
                  </div>

                  <div className="flex gap-2 pt-2 border-t border-white/10">
                    <button
                      onClick={async () => {
                        // Action to delete/hide the reported recipe from community feed
                        if (report.recipeId && report.recipeId !== "unknown") {
                          await deleteDoc(doc(db, `/artifacts/${appId}/public/data/userRecipes`, report.recipeId));
                        }
                        // Mark report as resolved
                        await updateDoc(doc(db, `/artifacts/${appId}/public/data/recipeReports`, report.id), { status: "resolved_deleted" });
                        alert("Recipe removed from community feed.");
                      }}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[10px] font-bold cursor-pointer"
                    >
                      Delete Recipe
                    </button>
                    
                    <button
                      onClick={async () => {
                        // Dismiss report, keep recipe
                        await updateDoc(doc(db, `/artifacts/${appId}/public/data/recipeReports`, report.id), { status: "dismissed" });
                        alert("Report dismissed.");
                      }}
                      className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-[10px] font-bold cursor-pointer"
                    >
                      Dismiss Report
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {adminView === "waitlist" && (
          <div className="space-y-3 animate-in fade-in max-h-96 overflow-y-auto pr-2">
            {waitlistUsers.length === 0 ? (
              <p className="text-xs text-gray-500 text-center py-4">No users on the waitlist.</p>
            ) : (
              waitlistUsers.map((candidate) => (
                <div key={candidate.id} className="bg-white/5 p-4 rounded-xl border border-white/10 flex justify-between items-center">
                  <div>
                    <p className="text-xs font-bold text-white">{candidate.displayName} ({candidate.email})</p>
                    <p className="text-[9px] text-gray-400 font-mono">UID: {candidate.uid}</p>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded mt-1 inline-block ${candidate.status === 'approved' ? 'bg-green-500/20 text-green-300' : 'bg-amber-500/20 text-amber-300'}`}>
                      {candidate.status.toUpperCase()}
                    </span>
                  </div>

                  {candidate.status === "pending" && (
                    <button
                      onClick={async () => {
                        // Update waitlist document status to approved
                        await updateDoc(doc(db, `/artifacts/${appId}/public/data/waitlist`, candidate.id), {
                          status: "approved",
                          approvedAt: serverTimestamp()
                        });
                        alert(`Approved ${candidate.email}! (Note: Set custom claim {approved: true} via your backend script to fully grant app access).`);
                      }}
                      className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition-colors"
                    >
                      Approve Access
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* NEW: Feedback Viewer */}
        {adminView === "feedback" && (
          <div className="space-y-3 animate-in fade-in max-h-96 overflow-y-auto pr-2 scrollbar-hide">
          {feedbackLogs.length === 0 ? (
              <p className="text-xs text-gray-500 text-center py-4">No feedback submitted yet.</p>
            ) : (
              feedbackLogs.map((fb) => (
                <div key={fb.id} className="bg-white/5 p-4 rounded-xl border border-white/10">
                  <div className="flex justify-between items-start mb-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider ${fb.type === 'bug' ? 'bg-red-500/20 text-red-300' : 'bg-indigo-500/20 text-indigo-300'}`}>
                      {fb.type === 'bug' ? '🐛 BUG' : '💡 FEATURE'}
                    </span>
                    <span className="text-[9px] text-gray-500">
                      {fb.timestamp?.toDate().toLocaleDateString() || "Just now"}
                    </span>
                  </div>
                  <p className="text-xs text-gray-200 leading-relaxed mb-3">{fb.message}</p>
                  <p className="text-[9px] text-gray-500 border-t border-white/10 pt-2 font-mono truncate">
                    User: {fb.userId}
                  </p>
                </div>
              ))
            )}
          </div>
        )}
      </div>
        
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
          <UserCircle className="w-4 h-4 text-purple-600" /> User Simulator
          (Login As)
        </h3>
        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
          {DEMO_USERS.map((u) => (
            <div
              key={u.id}
              className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-xl border border-gray-100"
            >
              <div className="flex items-center gap-3">
                <img
                  src={u.image}
                  alt={u.name}
                  className="w-8 h-8 rounded-full"
                />
                <div>
                  <p className="text-xs font-bold text-gray-900">{u.name}</p>
                  <p className="text-[10px] text-gray-500">{u.role}</p>
                </div>
              </div>
              <button
                onClick={() => onImpersonate(u.id)}
                className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-[10px] font-bold hover:bg-purple-200 cursor-pointer"
              >
                Login
              </button>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Users className="w-4 h-4 text-indigo-600" /> Network Vitals
        </h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-500">Total Users</span>
            <span className="font-bold text-gray-900">
              {mockNetworkData.totalUsers.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-500">Active Today</span>
            <span className="font-bold text-green-600">
              {mockNetworkData.activeToday.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>

    
  );
};

// Re-implementing ToolsScreen
const ToolsView = () => {
  return (
    <div className="space-y-6 max-w-4xl mx-auto p-2 md:p-6 animate-in fade-in">
      <div className="flex items-center gap-2 mb-2">
        <BookOpen className="w-6 h-6 text-indigo-600" />
        <h2 className="text-xl font-black text-gray-900">Culinary Tools & Cheat Sheets</h2>
      </div>
      <ConverterWidget />
      <KitchenGuide />
    </div>
  );
};
const ToolsScreen = ({
  profile,
  onSaveProfile,
  isAdmin,
  onToggleAdmin,
  isDemoAuthenticated,
  onShowLogin,
  onRestartTour,
  defaultTab = "tools",
  onOpenGuidelines,
  onOpenLegal,
}) => {
  const [subTab, setSubTab] = useState(defaultTab);
  const [profileImage, setProfileImage] = useState(profile.image || null);
  const [dataSyncId, setDataSyncId] = useState(
    localStorage.getItem("pantry_chef_custom_id") || ""
  );
  const [localProfile, setLocalProfile] = useState(
    profile || { diets: [], equipment: [], zipCode: "" }
  );
  const [customEquip, setCustomEquip] = useState("");

  const [apiUsage, setApiUsage] = useState(getApiUsage());
  useEffect(() => {
    const handleUpdate = () => setApiUsage(getApiUsage());
    window.addEventListener("apiUsageUpdated", handleUpdate);
    return () => window.removeEventListener("apiUsageUpdated", handleUpdate);
  }, []);

  const triggerSystemNotification = (title, body) => {
    window.dispatchEvent(
      new CustomEvent("triggerSystemNotification", { detail: { title, body } })
    );
  };

  const diets = [
    "Vegetarian", "Vegan", "Gluten-Free", "Keto", "Paleo",
    "Nut-Free", "Dairy-Free", "Shellfish-Free", "Egg-Free", "Kosher", "Halal",
  ];
  const defaultEquipment = [
    "Air Fryer", "Blender", "Slow Cooker", "Instant Pot", "Food Processor",
    "Wok", "Stand Mixer", "Dutch Oven", "Cast Iron Skillet", "Rice Cooker",
    "Sous Vide", "Grill", "Smoker", "Microwave", "Toaster", "Immersion Blender", "Mandoline", "Pizza Stone",
  ];
  const displayEquipment = Array.from(
    new Set([...defaultEquipment, ...(localProfile.equipment || [])])
  );

  const toggleItem = (cat, item) => {
    const cur = localProfile[cat] || [];
    setLocalProfile({
      ...localProfile,
      [cat]: cur.includes(item)
        ? cur.filter((i) => i !== item)
        : [...cur, item],
    });
  };

  const handleProfileImageSelect = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const resized = await resizeImage(file, 200);
      setProfileImage(resized);
      setLocalProfile({ ...localProfile, image: resized });
    }
  };


const handleProtectedPreferenceChange = (contextLabel, callback) => {
    if (!isDemoAuthenticated) {
      setSoftGateContext(contextLabel);
      setShowSoftGate(true);
      return;
    }
    callback();
  };
  const handleSyncIdChange = (e) => {
    const newVal = e.target.value;
    setDataSyncId(newVal);
    localStorage.setItem("pantry_chef_custom_id", newVal);
  };

  const badgeCount = Object.keys(profile?.challenges || {}).filter(
    (k) => profile?.challenges?.[k] >= CHALLENGES.find((c) => c.id === k)?.target
  ).length;

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="space-y-6 animate-in fade-in">
          {/* 1. Login Banner */}
          {!isDemoAuthenticated && (
            <div className="bg-indigo-600 p-6 rounded-3xl shadow-lg text-center text-white">
              <ChefHat className="w-12 h-12 mx-auto mb-3 text-white/90" />
              <h3 className="font-black text-xl mb-1">Create Account</h3>
              <p className="text-sm text-indigo-100 mb-4">
                Sync your pantry, save recipes, and earn badges.
              </p>
              <button
                onClick={onShowLogin}
                className="w-full py-3 bg-white text-indigo-600 font-bold rounded-xl hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogIn className="w-4 h-4" /> Sign In / Sign Up
              </button>
            </div>
          )}

          {/* 2. My Profile & Account Details Card */}
          <div className={`bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-6 ${!isDemoAuthenticated ? "opacity-50 pointer-events-none filter blur-sm select-none" : ""}`}>
            
            {/* Header */}
            <div className="flex items-center gap-2 border-b border-gray-100 pb-4">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                <UserCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-gray-900 text-sm">My Profile & Preferences</h3>
                <p className="text-[10px] text-gray-400">Manage your public chef identity and account credentials</p>
              </div>
            </div>

            {/* Avatar Upload Area */}
            <div className="flex flex-col items-center justify-center text-center">
              <label className="cursor-pointer inline-block relative group">
                <div className="w-24 h-24 rounded-full bg-gray-50 flex items-center justify-center overflow-hidden border-2 border-dashed border-gray-300 group-hover:border-indigo-500 transition-colors mx-auto shadow-inner">
                  {profileImage ? (
                    <img src={profileImage} alt="Me" className="w-full h-full object-cover" />
                  ) : (
                    <Scan className="w-8 h-8 text-gray-400 group-hover:text-indigo-500 transition-colors" />
                  )}
                </div>
                <div className="absolute bottom-0 right-0 bg-indigo-600 p-2 rounded-full text-white shadow-md">
                  <Plus className="w-3 h-3" />
                </div>
                <input type="file" accept="image/*" onChange={handleProfileImageSelect} className="hidden" disabled={!isDemoAuthenticated} />
              </label>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-2">Tap to change avatar</span>
            </div>

            {/* Account Details Inputs */}
            <div className="space-y-4 pt-2 border-t border-gray-100">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Display Name</label>
                <input
                  type="text"
                  placeholder="e.g. Chef Ishon"
                  className="w-full p-3 bg-gray-50 rounded-2xl text-xs outline-none border border-gray-200 focus:border-indigo-600 focus:bg-white transition-all font-medium text-gray-800"
                  value={localProfile.name || ""}
                  onChange={(e) => setLocalProfile({ ...localProfile, name: e.target.value })}
                  disabled={!isDemoAuthenticated}
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Email Address</label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  className="w-full p-3 bg-gray-50 rounded-2xl text-xs outline-none border border-gray-200 focus:border-indigo-600 focus:bg-white transition-all font-medium text-gray-800"
                  value={localProfile.email || ""}
                  onChange={(e) => setLocalProfile({ ...localProfile, email: e.target.value })}
                  disabled={!isDemoAuthenticated}
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-indigo-500" /> Zip Code (For Local Grocery Deals)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 90210"
                  className="w-full p-3 bg-gray-50 rounded-2xl text-xs outline-none border border-gray-200 focus:border-indigo-600 focus:bg-white transition-all font-medium text-gray-800"
                  value={localProfile.zipCode || ""}
                  onChange={(e) => setLocalProfile({ ...localProfile, zipCode: e.target.value })}
                  maxLength={5}
                  disabled={!isDemoAuthenticated}
                />
              </div>
            </div>

          </div>
          
          {/* 3. AI Usage */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
              <Battery className="w-5 h-5 text-green-500" /> AI Usage Today
            </h3>
            <div className="flex justify-between text-xs font-bold text-gray-500 mb-1">
              <span>Used: {apiUsage}</span>
              <span>Limit: {DAILY_API_LIMIT}</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-3">
              <div
                className="h-3 rounded-full bg-green-500 transition-all duration-500"
                style={{ width: `${Math.min((apiUsage / DAILY_API_LIMIT) * 100, 100)}%` }}
              ></div>
            </div>
          </div>

          {/* 4. Creator Progress */}
          {profile.creatorProgress > 0 && (
            <div className="bg-yellow-50 p-6 rounded-3xl border border-yellow-200 shadow-sm relative overflow-hidden">
              <div className="absolute -right-4 -top-4 text-yellow-100">
                <Medal className="w-24 h-24" />
              </div>
              <div className="relative z-10">
                <h3 className="font-bold text-yellow-800 mb-2 flex items-center gap-2">
                  <Medal className="w-5 h-5" /> Creator Status
                </h3>
                {profile.creatorProgress >= 100 ? (
                  <div>
                    <p className="text-xs font-bold text-yellow-700 mb-2">You are a Verified Pro Chef!</p>
                    <button className="w-full py-2 bg-white text-yellow-700 text-xs font-bold rounded-lg border border-yellow-200 shadow-sm cursor-pointer">
                      Manage Affiliate Links
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="flex justify-between text-[10px] font-bold text-yellow-600 mb-1">
                      <span>Progress to Badge</span>
                      <span>{profile.creatorProgress}%</span>
                    </div>
                    <div className="w-full bg-yellow-200 rounded-full h-2 mb-2">
                      <div className="bg-yellow-500 h-2 rounded-full" style={{ width: `${profile.creatorProgress}%` }}></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 👉 ONLY SHOWN TO APPROVED ADMIN / OWNER */}
          {isAdmin && (
            <div className="bg-gray-900 p-4 rounded-3xl shadow-sm border border-gray-800 text-white space-y-4">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-indigo-400" /> Admin & Tester Controls (Approved Only)
              </h3>
              
              {/* 5. Simulate Notifications */}
          <div className="bg-gray-900 p-4 rounded-3xl shadow-sm border border-gray-800">
            <h3 className="font-bold text-white text-sm mb-3 flex items-center gap-2">
              <Bell className="w-4 h-4 text-indigo-400" /> Simulate Notifications (Pitch Mode)
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => triggerSystemNotification("⚠️ Expiring Soon", "Your Spinach and Milk are expiring in 2 days!")} className="px-3 py-2 bg-gray-800 text-gray-300 rounded-lg text-[10px] font-bold hover:bg-gray-700 text-left cursor-pointer">Freshness Alert</button>
              <button onClick={() => triggerSystemNotification("💰 Budget Goal Met", "Great job! You stayed under $150 this week.")} className="px-3 py-2 bg-gray-800 text-gray-300 rounded-lg text-[10px] font-bold hover:bg-gray-700 text-left cursor-pointer">Budget Success</button>
              <button onClick={() => triggerSystemNotification("❄️ Defrost Alert", "Move Chicken from Freezer to Fridge tonight.")} className="px-3 py-2 bg-gray-800 text-gray-300 rounded-lg text-[10px] font-bold hover:bg-gray-700 text-left border-l-2 border-blue-400 cursor-pointer">Defrost Reminder</button>
            </div>
          </div>

          {/* 6. Data Sync ID */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-indigo-600" /> Data Sync ID
            </h3>
            <input
              type="text"
              placeholder="Enter a unique ID (e.g. Tester1)"
              className="w-full p-3 bg-gray-50 rounded-xl text-xs outline-none border border-gray-200 focus:border-indigo-600 font-mono"
              value={dataSyncId}
              onChange={handleSyncIdChange}
            />
            <button onClick={() => window.location.reload()} className="mt-2 w-full py-2 bg-gray-100 text-gray-600 rounded-lg text-xs font-bold cursor-pointer">
              Apply & Reload App
            </button>
          </div>

          {/* 7. Manual Onboarding Test Trigger in Settings */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                <ChefHat className="w-5 h-5 text-indigo-600" /> Onboarding Walkthrough
              </h3>
              <p className="text-xs text-gray-500">Review the step-by-step introduction and starter staples.</p>
            </div>
            <button
              onClick={onRestartTour}
              className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-bold hover:bg-indigo-100 cursor-pointer"
            >
              Restart Tour
            </button>
          </div>

          {/* 9. API Configuration */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <ConfigIcon className="w-5 h-5 text-indigo-600" /> API Configuration
            </h3>
            <input
              type="password"
              placeholder="Paste Gemini API Key here..."
              className="w-full p-3 bg-gray-50 rounded-xl text-xs outline-none border border-gray-200 focus:border-indigo-600"
              onChange={(e) => localStorage.setItem("gemini_api_key", e.target.value)}
              defaultValue={localStorage.getItem("gemini_api_key") || ""}
            />
          </div>

          {/* 10. Admin Portal Toggle */}
          <div className="bg-gray-900 p-4 rounded-3xl shadow-sm border border-gray-800 flex justify-between items-center text-white">
            <div>
              <h3 className="font-bold text-sm flex items-center gap-2"><Briefcase className="w-4 h-4 text-indigo-400" /> Admin Portal (Demo)</h3>
            </div>
            <button onClick={() => onToggleAdmin(!isAdmin)} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-500 text-white cursor-pointer">
              {isAdmin ? "Active" : "Enable"}
            </button>
          </div>
          
              

              
              
            </div>
          )}


          

          {/* 8. Go Pro */}
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-4 rounded-3xl shadow-lg text-white">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-bold flex items-center gap-2"><Crown className="w-5 h-5 text-yellow-300" /> Go Pro</h3>
              <span className="bg-white/20 px-2 py-1 rounded text-[10px] font-bold">BEST VALUE</span>
            </div>
            <button onClick={() => window.dispatchEvent(new CustomEvent("openSubscription"))} className="w-full py-2 bg-white text-indigo-600 rounded-xl text-xs font-bold shadow-sm cursor-pointer">
              Upgrade Now
            </button>
          </div>

          

          {/* 11. Dietary Preferences */}
          <div className={`bg-white p-6 rounded-3xl shadow-sm border border-gray-100 ${!isDemoAuthenticated ? "opacity-50 pointer-events-none" : ""}`}>
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Utensils className="w-5 h-5 text-indigo-600" /> Dietary Preferences
            </h3>
            <div className="flex flex-wrap gap-2">
              {diets.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => toggleItem("diets", d)}
                  className={`px-4 py-2 rounded-full text-xs font-bold border cursor-pointer ${localProfile.diets?.includes(d) ? "bg-indigo-600 text-white" : "bg-white"}`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* 👉 12. Cuisine Match Weighting Sliders on Profile Page */}
          <div className={`bg-white p-6 rounded-3xl shadow-sm border border-gray-100 ${!isDemoAuthenticated ? "opacity-50 pointer-events-none" : ""}`}>
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <ChefHat className="w-5 h-5 text-indigo-600" /> Cuisine Preferences (Match Weighting)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Object.keys(localProfile.cuisinePreferences || { American: 3, "Soul Food": 4, Mexican: 3, Italian: 3, Asian: 3, Indian: 3, Mediterranean: 3, Thai: 3, Caribbean: 3, French: 3, Chinese: 3, Greek: 3, German: 3, Filipino: 3, Japanese: 3 }).map((cuisine) => {
                const currentVal = (localProfile.cuisinePreferences || {})[cuisine] || 3;
                return (
                  <div key={cuisine} className="space-y-1 bg-gray-50 p-3 rounded-2xl border border-gray-100">
                    <div className="flex justify-between text-xs font-bold text-gray-700">
                      <span>{cuisine}</span>
                      <span className="text-indigo-600 font-mono">{currentVal}/5</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      value={currentVal}
                      onChange={(e) => {
                        const updatedPrefs = {
                          ...(localProfile.cuisinePreferences || { American: 3, "Soul Food": 4, Mexican: 3, Italian: 3, Asian: 3, Indian: 3, Mediterranean: 3, Thai: 3, Caribbean: 3, French: 3, Chinese: 3, Greek: 3, German: 3, Filipino: 3, Japanese: 3 }),
                          [cuisine]: parseInt(e.target.value)
                        };
                        setLocalProfile({ ...localProfile, cuisinePreferences: updatedPrefs });
                      }}
                      className="w-full accent-indigo-600 h-1.5 bg-gray-200 rounded-lg cursor-pointer"
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Household & AI Taste Profile Settings UI (#29 & #57) */}
          <div className={`bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-4 ${!isDemoAuthenticated ? "opacity-50 pointer-events-none" : ""}`}>
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" /> Household & AI Taste Profile Engine
            </h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Configure your household composition, health objectives, and flavor profiles to let the smart assistant tailor macro targets and dietary guardrails automatically.
            </p>

            {/* 13. Health Goals Selection */}
            <div className="space-y-1.5 pt-2 border-t border-gray-100">
              <label className="block text-[10px] font-bold text-gray-500 uppercase">Health Goals & Medical Diets</label>
              <div className="flex flex-wrap gap-1.5">
                {["Weight Loss", "Mass-Building / High Protein", "Pregnancy / Postnatal", "Diabetes-Friendly", "Low Sodium", "Heart Healthy"].map((goal) => {
                  const isSelected = (localProfile.healthGoals || []).includes(goal);
                  return (
                    <button
                      key={goal}
                      type="button"
                      onClick={() => {
                        const current = localProfile.healthGoals || [];
                        const updated = isSelected ? current.filter(g => g !== goal) : [...current, goal];
                        setLocalProfile({ ...localProfile, healthGoals: updated });
                      }}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer ${
                        isSelected ? "bg-indigo-600 text-white border-indigo-600" : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                      }`}
                    >
                      {goal}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 14. Disliked Foods & Ingredients */}
            <div className="space-y-1.5 pt-2">
              <label className="block text-[10px] font-bold text-gray-500 uppercase">Disliked Foods & Aversions (Comma Separated)</label>
              <input
                type="text"
                placeholder="e.g. cilantro, blue cheese, mushrooms, heavy spice"
                value={localProfile.dislikedFoods || ""}
                onChange={(e) => setLocalProfile({ ...localProfile, dislikedFoods: e.target.value })}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:border-indigo-500"
              />
            </div>

            {/* 15. Kid Preferences & Family Adaptations */}
            <div className="space-y-1.5 pt-2">
              <label className="block text-[10px] font-bold text-gray-500 uppercase">Household / Kid Preferences & Adaptations</label>
              <textarea
                value={localProfile.kidPreferences || ""}
                onChange={(e) => setLocalProfile({ ...localProfile, kidPreferences: e.target.value })}
                placeholder="Describe any picky eater accommodations, e.g. prefers mild seasoning, separate sauces..."
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:border-indigo-500 h-20 resize-none"
              />
            </div>
          </div>

          {/* 16. Equipment */}
          <div className={`bg-white p-6 rounded-3xl shadow-sm border border-gray-100 ${!isDemoAuthenticated ? "opacity-50 pointer-events-none" : ""}`}>
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <CookingPot className="w-5 h-5 text-indigo-600" /> Equipment
            </h3>
            <div className="flex flex-wrap gap-2 mb-4">
              {displayEquipment.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => toggleItem("equipment", e)}
                  className={`px-4 py-2 rounded-full text-xs font-bold border cursor-pointer ${localProfile.equipment?.includes(e) ? "bg-indigo-600 text-white" : "bg-white"}`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* 👉 PLATFORM GOVERNANCE FOOTER LINKS */}
          <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm text-center space-y-2">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Platform Governance</p>
            <div className="flex justify-center gap-4 text-xs font-bold text-indigo-600">
              <button
                onClick={onOpenGuidelines} // 👉 Hook up to prop
                className="hover:underline cursor-pointer"
              >
                Community Guidelines
              </button>
              <span className="text-gray-300">•</span>
              <button
                onClick={onOpenLegal} // 👉 Hook up to prop
                className="hover:underline cursor-pointer"
              >
                Terms & Privacy Policy
              </button>
            </div>
          </div>

          {/* Save Profile Button */}
          {isDemoAuthenticated && (
            <button
              onClick={() => onSaveProfile(localProfile)}
              className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg cursor-pointer"
            >
              Save Profile
            </button>
          )}
        </div>
      
    </div>
  );
};

const NutritionReportView = ({ nutritionLogs, onDeleteLog, userProfile }) => {
  const [timeframe, setTimeframe] = useState("week"); // 'week' or 'month'

  const now = new Date();
  const daysLimit = timeframe === "week" ? 7 : 30;
  const cutoff = new Date(now.setDate(now.getDate() - daysLimit));

  const filteredLogs = nutritionLogs.filter((log) => {
    const logDate = log.timestamp?.toDate ? log.timestamp.toDate() : new Date();
    return logDate >= cutoff;
  });

  const totalCals = filteredLogs.reduce((sum, item) => sum + (item.calories || 0), 0);
  const totalProtein = filteredLogs.reduce((sum, item) => sum + (item.protein || 0), 0);
  const totalCarbs = filteredLogs.reduce((sum, item) => sum + (item.carbs || 0), 0);
  const totalFat = filteredLogs.reduce((sum, item) => sum + (item.fat || 0), 0);

  const avgCals = Math.round(totalCals / daysLimit);
  const avgProtein = Math.round(totalProtein / daysLimit);

  const targetCals = userProfile?.targetCalories || 2000;
  const targetProtein = userProfile?.targetProtein || 150;

  return (
    <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-sm space-y-5">
      <div className="flex justify-between items-center border-b border-gray-100 pb-3">
        <div>
          <h3 className="font-black text-gray-900 text-sm flex items-center gap-2">
            📊 Cooked Nutrition Analytics
          </h3>
          <p className="text-[10px] text-gray-400">Aggregated from in-app cooked meals</p>
        </div>

        <div className="flex bg-gray-100 p-0.5 rounded-xl text-[10px] font-bold">
          <button
            onClick={() => setTimeframe("week")}
            className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
              timeframe === "week" ? "bg-white shadow text-indigo-600" : "text-gray-500"
            }`}
          >
            7 Days
          </button>
          <button
            onClick={() => setTimeframe("month")}
            className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
              timeframe === "month" ? "bg-white shadow text-indigo-600" : "text-gray-500"
            }`}
          >
            30 Days
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-amber-50/70 p-3 rounded-2xl border border-amber-100">
          <p className="text-[9px] font-bold text-amber-700 uppercase">Avg Daily Calories</p>
          <p className="text-lg font-black text-amber-950 mt-0.5">{avgCals} <span className="text-xs font-normal">kcal</span></p>
        </div>
        <div className="bg-indigo-50/70 p-3 rounded-2xl border border-indigo-100">
          <p className="text-[9px] font-bold text-indigo-700 uppercase">Avg Daily Protein</p>
          <p className="text-lg font-black text-indigo-950 mt-0.5">{avgProtein}g</p>
        </div>
        <div className="bg-emerald-50/70 p-3 rounded-2xl border border-emerald-100">
          <p className="text-[9px] font-bold text-emerald-700 uppercase">Total Carbs</p>
          <p className="text-lg font-black text-emerald-950 mt-0.5">{totalCarbs}g</p>
        </div>
        <div className="bg-purple-50/70 p-3 rounded-2xl border border-purple-100">
          <p className="text-[9px] font-bold text-purple-700 uppercase">Total Fats</p>
          <p className="text-lg font-black text-purple-950 mt-0.5">{totalFat}g</p>
        </div>
      </div>

      <div className="space-y-2">
        <h4 className="text-xs font-bold text-gray-800 uppercase">Logged Meals ({filteredLogs.length})</h4>
        {filteredLogs.length === 0 ? (
          <p className="text-xs text-gray-400 italic bg-gray-50 p-4 rounded-2xl text-center">
            No cooked meals logged for this timeframe yet.
          </p>
        ) : (
          <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
            {filteredLogs.map((log) => (
              <div
                key={log.id}
                className="bg-gray-50 p-3 rounded-xl border border-gray-200 flex items-center justify-between"
              >
                <div>
                  <p className="text-xs font-bold text-gray-900">{log.recipeTitle}</p>
                  <p className="text-[10px] text-gray-500">
                    Eaten: <span className="font-bold text-gray-700">{log.servingsEaten} serving(s)</span> • {log.calories} kcal
                  </p>
                </div>
                <button
                  onClick={() => onDeleteLog(log.id)}
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// NEW: Voice Input Widget
const VoiceInputWidget = ({ onVoiceSubmit, isProcessing, layout = "full" }) => {
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState("");
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = () => { setIsListening(true); setInterimText(""); };
    recognition.onresult = (event) => {
      let finalTranscript = "";
      let currentInterim = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) finalTranscript += event.results[i][0].transcript;
        else currentInterim += event.results[i][0].transcript;
      }
      setInterimText(currentInterim);
      if (finalTranscript) onVoiceSubmit(finalTranscript);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;

    return () => { if (recognitionRef.current) recognitionRef.current.stop(); };
  }, [onVoiceSubmit]);

  const toggleListening = () => {
    if (isListening) recognitionRef.current?.stop();
    else recognitionRef.current?.start();
  };

  if (!window.SpeechRecognition && !window.webkitSpeechRecognition) return null;

  return (
    <div className={`flex flex-col items-center ${layout === "full" ? "gap-2" : ""}`}>
      <button
        type="button"
        onClick={toggleListening}
        disabled={isProcessing}
        className={`transition-all transform flex items-center justify-center cursor-pointer ${
          layout === "full" ? "p-4 rounded-full shadow-lg" : "p-3 rounded-xl border border-gray-200"
        } ${
          isListening
            ? "bg-red-500 text-white animate-pulse scale-105"
            : isProcessing
            ? "bg-gray-200 text-gray-400 cursor-not-allowed"
            : "bg-indigo-600 text-white hover:bg-indigo-700"
        }`}
      >
        <Speaker className={layout === "full" ? "w-6 h-6" : "w-4 h-4"} />
      </button>
      {layout === "full" && (
        <div className="h-4 text-[10px] font-bold text-gray-500 text-center px-4">
          {isListening ? (interimText || "Listening...") : isProcessing ? "Parsing inventory..." : "Tap to speak"}
        </div>
      )}
    </div>
  );
};

const ReportRecipeModal = ({ recipe, onClose, effectiveUserId, db, appId }) => {
  const [reason, setReason] = useState("Inappropriate Content");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await addDoc(collection(db, `/artifacts/${appId}/public/data/recipeReports`), {
        recipeId: recipe.id || recipe.firestoreId || "unknown",
        recipeTitle: recipe.title,
        recipeAuthor: recipe.authorName || "Unknown",
        reportedBy: effectiveUserId || "anonymous",
        reason,
        details: details.trim(),
        timestamp: serverTimestamp(),
        status: "pending"
      });
      setSubmitted(true);
      setTimeout(() => onClose(), 2000);
    } catch (err) {
      console.error("Failed to submit report:", err);
      alert("Error submitting report. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[75] flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl space-y-4 animate-in slide-in-from-bottom">
        <div className="flex justify-between items-center border-b pb-2">
          <h3 className="font-bold text-base text-gray-900 flex items-center gap-2">
            <AlertOctagon className="w-5 h-5 text-red-500" /> Report Recipe
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full cursor-pointer">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {submitted ? (
          <div className="text-center py-6 space-y-2">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
            <h4 className="font-bold text-gray-800">Report Received</h4>
            <p className="text-xs text-gray-500">Thank you for helping keep our community safe.</p>
          </div>
        ) : (
          <form onSubmit={handleReportSubmit} className="space-y-3">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Reason for Flagging</label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium outline-none cursor-pointer"
              >
                <option value="Inappropriate Content">Inappropriate or Offensive Content</option>
                <option value="Dangerous Instructions">Dangerous Cooking Instructions / Hazard</option>
                <option value="Copyright Infringement">Copyright Infringement / Stolen Recipe</option>
                <option value="Spam / Misleading">Spam or Misleading Information</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Additional Details (Optional)</label>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Provide any extra context..."
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:border-indigo-500 h-20 resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              {submitting ? <Loader className="w-4 h-4 animate-spin" /> : <AlertOctagon className="w-4 h-4" />}
              Submit Report for Review
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

// --- FEEDBACK MODAL COMPONENT ---
const FeedbackModal = ({ onClose, effectiveUserId, db, appId }) => {
  const [feedbackType, setFeedbackType] = useState("bug");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    setIsSubmitting(true);

    try {
      await addDoc(collection(db, `/artifacts/${appId}/public/data/feedback`), {
        userId: effectiveUserId || "anonymous",
        type: feedbackType,
        message: message.trim(),
        userAgent: navigator.userAgent,
        timestamp: serverTimestamp(),
      });
      setSubmitted(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      console.error("Failed to submit feedback:", err);
      alert("Error sending feedback. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-black text-lg text-gray-900 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-indigo-600" /> Trial Feedback
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full cursor-pointer">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {submitted ? (
          <div className="text-center py-8 space-y-2">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
            <h4 className="font-bold text-gray-800">Thank You!</h4>
            <p className="text-xs text-gray-500">Your feedback has been logged for review.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Feedback Type</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFeedbackType("bug")}
                  className={`py-2 rounded-xl text-xs font-bold border ${
                    feedbackType === "bug" ? "bg-red-50 border-red-200 text-red-700" : "bg-gray-50 text-gray-600 cursor-pointer"
                  }`}
                >
                  🐛 Report Bug
                </button>
                <button
                  type="button"
                  onClick={() => setFeedbackType("feature")}
                  className={`py-2 rounded-xl text-xs font-bold border ${
                    feedbackType === "feature" ? "bg-indigo-50 border-indigo-200 text-indigo-700" : "bg-gray-50 text-gray-600 cursor-pointer"
                  }`}
                >
                  💡 Suggestion
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe the bug or share your idea..."
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:border-indigo-500 outline-none h-24 resize-none"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-indigo-700 transition-colors cursor-pointer"
            >
              {isSubmitting ? <Loader className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              Submit Feedback
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

// 👉 LANDMARK: Soft-Gated Upsell Modal Component (#28.7)
const SoftGateModal = ({ isOpen, onClose, featureContext = "save recipes & sync your pantry" }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-[90] flex items-end sm:items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom">
        <div className="p-6 text-center space-y-4">
          
          <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <Crown className="w-8 h-8 text-indigo-600" />
          </div>

          <div className="space-y-1">
            <h3 className="text-xl font-black text-gray-900">
              Unlock Full Access
            </h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Create a free account to <span className="font-bold text-indigo-600">{featureContext}</span>, protect your data, and unlock zero-waste analytics.
            </p>
          </div>

          <div className="space-y-2.5 pt-2">
            <button
              onClick={() => {
                onClose();
                window.dispatchEvent(new CustomEvent("openLoginModal"));
              }}
              className="w-full py-3.5 bg-indigo-600 text-white font-bold text-xs rounded-xl shadow-md hover:bg-indigo-700 transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4" /> Sign In / Create Free Account
            </button>
            
            <button
              onClick={onClose}
              className="w-full py-2.5 bg-gray-50 text-gray-500 font-bold text-xs rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
            >
              Continue as Guest
            </button>
          </div>

        </div>
        
        <div className="bg-gray-50 p-3 text-center border-t border-gray-100 text-[10px] text-gray-400">
          No credit card required • Free forever tier available
        </div>
      </div>
    </div>
  );
};

// 👉 LANDMARK: Duplicate URL Resolution Modal for Regular Users
const DuplicateUrlModal = ({ matchData, onClose, onViewExisting, onForceUpload }) => {
  if (!matchData) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-[80] flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl space-y-4 animate-in slide-in-from-bottom">
        <div className="flex justify-between items-center border-b pb-2">
          <h3 className="font-black text-base text-gray-900 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-500" /> Recipe Already Exists
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full cursor-pointer">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="space-y-2">
          <p className="text-xs text-gray-600 leading-relaxed">
            This recipe URL is already in our community database:
          </p>
          <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 space-y-1">
            <p className="text-xs font-bold text-gray-900 truncate">{matchData.title}</p>
            <a 
              href={matchData.sourceUrl} 
              target="_blank" 
              rel="noreferrer" 
              className="text-[10px] text-blue-500 font-mono truncate block hover:underline"
            >
              {matchData.sourceUrl}
            </a>
          </div>
        </div>

        <div className="space-y-2 pt-2">
          <button
            onClick={() => {
              onViewExisting(matchData);
              onClose();
            }}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm cursor-pointer transition-colors"
          >
            👀 View Existing Recipe
          </button>
          
          <button
            onClick={() => {
              onForceUpload();
              onClose();
            }}
            className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl cursor-pointer transition-colors"
          >
            ➕ Upload New Version Anyway
          </button>

          <button
            onClick={onClose}
            className="w-full py-2 text-gray-400 hover:text-gray-600 text-xs font-bold cursor-pointer"
          >
            Close Completely
          </button>
        </div>
      </div>
    </div>
  );
};

const DynamicHeaderBanner = ({ activeTab, userProfile, isDemoAuthenticated, onNavigateProfile, setActiveTab }) => {
  // Variations for each tab
  const tabMessages = {
    pantry: [
      "Welcome to your pantry, Chef!",
      "What ingredients are we working with today?",
      "Let's check what's fresh in stock."
    ],
    recipes: [
      "What's on the menu today, Chef?",
      "Ready to cook up something amazing?",
      "Let's find a recipe matching your stock."
    ],
    shopping: [
      "Time to restock the essentials, Chef.",
      "Build your list or check weekly deals.",
      "Never run out of your favorites."
    ],
    budget: [
      "Tracking your kitchen savings, Chef.",
      "Smart spending meets great cooking.",
      "Monitor your food waste and grocery budget."
    ],
    community: [
      "Explore creations from the community, Chef.",
      "Share your signature dishes with fellow foodies.",
      "Discover what other chefs are cooking up."
    ],
    profile: [
      "Your chef dashboard and preferences.",
      "Customize your kitchen tools and settings.",
      "Manage your profile and achievements."
    ],
    admin: [
      "System control and network metrics.",
      "Welcome to the Admin Portal, Chef."
    ]
  };

  // Select a variation based on the active tab (or shuffle)
  const messages = tabMessages[activeTab] || ["Welcome to Pantry Chef!"];
  // Simple deterministic rotation based on time or active tab length to keep it snappy
  const message = messages[Math.floor(Date.now() / 10000) % messages.length];

  const displayName = userProfile?.name || (isDemoAuthenticated ? "Chef" : "Guest Chef");
  const displayAvatar = userProfile?.image || "https://ui-avatars.com/api/?name=Chef&background=6366f1&color=fff";

  return (
    <div className="flex items-center gap-3">
      {/* Clickable Profile Avatar & Badge */}
      <div 
        onClick={() => {
          onNavigateProfile();
          setActiveTab && setActiveTab("profile"); // Drops them straight into My Settings
        }}
        className="flex items-center gap-2.5 group cursor-pointer bg-gray-50 hover:bg-gray-100 px-3 py-1.5 rounded-2xl border border-gray-200/80 transition-all"
        title="View Profile Settings"
      >
        {/* Avatar and name markup */}
        <div className="relative">
          <img 
            src={displayAvatar} 
            alt={displayName} 
            className="w-8 h-8 rounded-full object-cover border-2 border-white shadow-sm group-hover:scale-105 transition-transform" 
          />
          {/* Active Status / Pro Badge Dot */}
          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
        </div>
        <div className="hidden sm:block text-left">
          <div className="text-xs font-bold text-gray-900 leading-tight flex items-center gap-1">
            <span>{displayName}</span>
            {userProfile?.creatorProgress >= 100 && <Crown className="w-3 h-3 text-yellow-500 inline" />}
          </div>
          <p className="text-[10px] text-gray-500 font-medium truncate max-w-[160px]">
            {message}
          </p>
        </div>
      </div>
    </div>
  );
};

// --- APP COMPONENT ---

// Welcoming Onboarding Modal with Intro Hero (#36)
// 👉 LANDMARK: Categorized & Normalized Onboarding Modal (#36)
// 👉 LANDMARK: Fully Expanded & Visualized Onboarding Modal (#36)
// 👉 LANDMARK: Redesigned 4-Step Onboarding Flow with Cuisine Scales & Recipe Teaser (#36)
const OnboardingModal = ({ isOpen, onClose, onSavePreferences, onAddToPantry, onScanReceipt }) => {
  const [step, setStep] = useState(1);
  
  // Frame 2: Personal Info
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [instagram, setInstagram] = useState("");
  const [tiktok, setTiktok] = useState("");
  const [profilePhoto, setProfilePhoto] = useState(null);

  // Frame 3: Cooking Profile & Capabilities
  const [householdSize, setHouseholdSize] = useState("2 People");
  const [selectedDiets, setSelectedDiets] = useState([]);
  const [selectedEquipment, setSelectedEquipment] = useState([]);
  const [cuisinePreferences, setCuisinePreferences] = useState({
    American: 3,
    "Soul Food": 4,
    Mexican: 3,
    Italian: 3,
    Asian: 3,
    Indian: 3,
    Mediterranean: 3,
    Thai: 3,          
    Caribbean: 3,     
    French: 3,
    Chinese: 3,
    Greek: 3,
    German: 3,
    Filipino: 3,
    Japanese: 3
  });

  // Frame 4: Pantry Seeding
  const [addedStaples, setAddedStaples] = useState([]);
  const [activeCategoryTab, setActiveCategoryTab] = useState("Pantry & Grains");

  if (!isOpen) return null;

  const householdOptions = [
    { label: "Just Me", val: "1" },
    { label: "2 People", val: "2" },
    { label: "3-4 Family", val: "3-4" },
    { label: "5+ Group", val: "5+" },
  ];

  const dietsList = [
    "Vegetarian", "Vegan", "Gluten-Free", "Keto", "Paleo",
    "Nut-Free", "Dairy-Free", "Shellfish-Free", "Egg-Free", "Kosher", "Halal"
  ];

  const equipmentList = [
    "Air Fryer", "Blender", "Slow Cooker", "Instant Pot", "Food Processor",
    "Wok", "Stand Mixer", "Dutch Oven", "Cast Iron Skillet", "Rice Cooker",
    "Sous Vide", "Grill", "Smoker", "Microwave", "Toaster", "Immersion Blender", "Mandoline", "Pizza Stone"
  ];

  // 🗂️ Normalized 3-Tier Granular Staples Database
  const categorizedStaples = {
    "Pantry & Grains": [
      { name: "Grains > Pasta > Dried: Spaghetti", base: "Spaghetti" },
      { name: "Grains > Pasta > Dried: Penne", base: "Penne" },
      { name: "Grains > Rice > White: Jasmine", base: "Jasmine Rice" },
      { name: "Grains > Rice > White: Basmati", base: "Basmati Rice" },
      { name: "Grains > Rice > Speciality: Arborio", base: "Arborio Rice" },
      { name: "Grains > Noodles > Asian: Rice Noodles", base: "Rice Noodles" },
      { name: "Grains > Flour > All-Purpose", base: "Flour" },
      { name: "Grains > Baking > Masa Harina", base: "Masa Harina" },
      { name: "Grains > Bread Crumbs", base: "Bread Crumbs" },
    ],
    "Beans & Tomatoes": [
      { name: "Pantry > Beans > Black (Dried)", base: "Black Beans" },
      { name: "Pantry > Beans > Black (Canned)", base: "Black Beans" },
      { name: "Pantry > Beans > Pinto (Dried)", base: "Pinto Beans" },
      { name: "Pantry > Beans > Pinto (Canned)", base: "Pinto Beans" },
      { name: "Pantry > Beans > Garbanzo (Dried)", base: "Garbanzo Beans" },
      { name: "Pantry > Tomatoes > Canned: Crushed", base: "Crushed Tomatoes" },
      { name: "Pantry > Tomato Paste", base: "Tomato Paste" },
    ],
    "Proteins & Dairy": [
      { name: "Protein > Beef > Ground (70/30)", base: "Ground Beef", fat: 70 },
      { name: "Protein > Beef > Ground (90/10)", base: "Ground Beef", fat: 90 },
      { name: "Protein > Beef > Chuck Roast", base: "Chuck Roast" },
      { name: "Protein > Beef > Ribeye Steak", base: "Ribeye Steak" },
      { name: "Protein > Chicken > Whole & Parts", base: "Chicken" },
      { name: "Protein > Pork > Pancetta", base: "Pancetta" },
      { name: "Protein > Meat > Italian Sausage", base: "Italian Sausage" },
      { name: "Protein > Seafood > Shrimp", base: "Shrimp" },
      { name: "Dairy > Butter (Salted)", base: "Butter" },
      { name: "Dairy > Cheese: Parmesan Block", base: "Parmesan" },
      { name: "Dairy > Cheese: Fresh Mozzarella", base: "Mozzarella" },
      { name: "Dairy > Eggs", base: "Eggs" },
    ],
    "Produce & Aromatics": [
      { name: "Produce > Aromatics > Garlic (Fresh)", base: "Garlic" },
      { name: "Produce > Aromatics > Onion (Yellow/Red)", base: "Onion" },
      { name: "Produce > Aromatics > Shallots", base: "Shallots" },
      { name: "Produce > Herbs > Basil (Fresh)", base: "Basil" },
      { name: "Produce > Root > Ginger (Fresh)", base: "Ginger" },
      { name: "Produce > Citrus > Limes", base: "Limes" },
      { name: "Produce > Citrus > Lemons", base: "Lemons" },
      { name: "Produce > Herbs > Cilantro", base: "Cilantro" },
      { name: "Produce > Peppers > Jalapeños (Fresh)", base: "Jalapeños" },
    ],
    "Oils, Sauces & Condiments": [
      { name: "Spices > Oils > Extra Virgin Olive Oil", base: "Olive Oil" },
      { name: "Spices > Oils > Toasted Sesame Oil", base: "Sesame Oil" },
      { name: "Spices > Vinegar > Balsamic", base: "Balsamic Vinegar" },
      { name: "Spices > Condiments > Soy Sauce", base: "Soy Sauce" },
      { name: "Spices > Condiments > Miso Paste", base: "Miso Paste" },
      { name: "Spices > Condiments > Chili Crisp", base: "Chili Crisp" },
      { name: "Spices > Condiments > Kewpie Mayo", base: "Kewpie Mayo" },
      { name: "Spices > Condiments > Peanut Butter", base: "Peanut Butter" },
    ],
    "Baking & Spices": [
      { name: "Baking > Sugar > White & Brown", base: "Sugar" },
      { name: "Baking > Sweeteners > Honey", base: "Honey" },
      { name: "Spices > Salt & Black Pepper", base: "Black Pepper" },
      { name: "Spices > Garlic Powder", base: "Garlic Powder" },
      { name: "Spices > Onion Powder", base: "Onion Powder" },
      { name: "Spices > Dried Oregano", base: "Dried Oregano" },
      { name: "Pantry > Broths > Chicken, Beef, Veggie", base: "Broth" },
    ]
  };

  const toggleSelection = (list, setList, item) => {
    setList((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const handleCuisineWeightChange = (cuisine, val) => {
    setCuisinePreferences((prev) => ({ ...prev, [cuisine]: parseInt(val) }));
  };

  const handleQuickAddStaple = (stapleName) => {
    if (!addedStaples.includes(stapleName)) {
      setAddedStaples((prev) => [...prev, stapleName]);
      if (onAddToPantry) onAddToPantry(stapleName);
    }
  };

  const handleFinish = () => {
    onSavePreferences({
      name,
      email,
      zipCode,
      instagram,
      tiktok,
      image: profilePhoto,
      householdSize,
      diets: selectedDiets,
      equipment: selectedEquipment,
      cuisinePreferences
    });
    onClose();
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const resized = await resizeImage(file, 200);
      setProfilePhoto(resized);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-[80] flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl space-y-5 animate-in slide-in-from-bottom max-h-[92vh] overflow-y-auto">
        
        {/* Header & Step Indicator */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-100 text-indigo-600 rounded-2xl">
              <ChefHat className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-base text-gray-900 leading-tight">Welcome to Pantry Chef</h3>
              <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider">
                Step {step} of 4 • {step === 1 ? "Introduction" : step === 2 ? "Personal Info" : step === 3 ? "Cooking Profile" : "Initial Pantry"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="text-xs font-bold text-gray-400 hover:text-gray-700 cursor-pointer px-2 py-1 bg-gray-50 rounded-lg"
            >
              Skip for now
            </button>
            <button 
              onClick={onClose} 
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
          <div 
            className="bg-indigo-600 h-full transition-all duration-300"
            style={{ width: `${(step / 4) * 100}%` }}
          ></div>
        </div>

        {/* FRAME 1: Welcome & Intended Use */}
        {step === 1 && (
          <div className="space-y-4 animate-in fade-in text-center py-2">
            <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <ChefHat className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h4 className="font-black text-lg text-gray-900">Your First Step to Smarter Cooking</h4>
              <p className="text-xs text-gray-600 leading-relaxed max-w-sm mx-auto">
                Pantry Chef is built to help you waste less and save more. The best way to use the app is to fill out as much profile and inventory information as possible upfront. The assistant learns from how you interact with your pantry, meals, and grocery lists to tailor everything specifically to you.
              </p>
            </div>
            <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100 text-[11px] text-gray-500">
              Don't worry - you can always update or change any of these settings later inside your profile.
            </div>
            <button
              onClick={() => setStep(2)}
              className="w-full py-3.5 bg-indigo-600 text-white font-bold text-xs rounded-2xl shadow-md hover:bg-indigo-700 cursor-pointer"
            >
              Get Started →
            </button>
          </div>
        )}

        {/* FRAME 2: Personal Information */}
        {step === 2 && (
          <div className="space-y-4 animate-in fade-in">
            <div className="text-center">
              <h4 className="font-bold text-sm text-gray-900">Personal Information</h4>
              <p className="text-xs text-gray-500">Tell us a bit about yourself so we can personalize your experience.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Name</label>
                <input
                  type="text"
                  placeholder="e.g. Ishon Jones"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Zip Code</label>
                <input
                  type="text"
                  placeholder="e.g. 90210"
                  maxLength={5}
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:border-indigo-500"
                />
                <span className="text-[8px] text-gray-400">Used for local grocery deals & pricing</span>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Email Address</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:border-indigo-500"
              />
              <p className="text-[9px] text-gray-400 mt-0.5">
                🔒 Your email is never shared with third parties or advertisers. It is used strictly for logging in, notifications, and account communications.
              </p>
            </div>

            {/* Social Handles with Integrated Note */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold text-gray-500 uppercase">Social Handles</label>
                <span className="text-[9px] text-gray-400">Socials display on your public profile</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Instagram @username"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:border-indigo-500"
                />
                <input
                  type="text"
                  placeholder="TikTok @username"
                  value={tiktok}
                  onChange={(e) => setTiktok(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Profile Photo */}
            <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-2xl border border-gray-200">
              <div className="w-12 h-12 rounded-full bg-white border border-gray-300 overflow-hidden flex items-center justify-center shrink-0">
                {profilePhoto ? (
                  <img src={profilePhoto} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <UserCircle className="w-6 h-6 text-gray-400" />
                )}
              </div>
              <div className="flex-1">
                <label className="block text-xs font-bold text-gray-800">Profile Photo</label>
                <label className="text-[10px] text-indigo-600 font-bold hover:underline cursor-pointer">
                  Upload image...
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                </label>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setStep(1)}
                className="py-2.5 px-4 bg-gray-100 text-gray-700 font-bold text-xs rounded-xl hover:bg-gray-200 cursor-pointer"
              >
                ← Back
              </button>
              <button
                onClick={() => setStep(3)}
                className="flex-1 py-2.5 bg-indigo-600 text-white font-bold text-xs rounded-xl shadow-md hover:bg-indigo-700 cursor-pointer"
              >
                Next: Cooking Profile →
              </button>
            </div>
          </div>
        )}

        {/* FRAME 3: Cooking Profile & Capabilities */}
        {step === 3 && (
          <div className="space-y-4 animate-in fade-in">
            <div className="text-center">
              <h4 className="font-bold text-sm text-gray-900">Your Cooking Profile</h4>
              <p className="text-xs text-gray-500 leading-relaxed max-w-sm mx-auto">
                This information is used to present recipes specific to what you can do. We provide smart substitutions so you never miss out on meals - adapting recipes to fit your equipment rather than restricting your choices.
              </p>
            </div>

            {/* Household Size */}
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5">Household / Serving Size</label>
              <div className="grid grid-cols-4 gap-2">
                {householdOptions.map((opt) => (
                  <button
                    key={opt.val}
                    type="button"
                    onClick={() => setHouseholdSize(opt.label)}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      householdSize === opt.label
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                        : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Dietary Preferences & Allergies */}
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5">Dietary Preferences & Allergies</label>
              <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto pr-1">
                {dietsList.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => toggleSelection(selectedDiets, setSelectedDiets, d)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold border cursor-pointer ${
                      selectedDiets.includes(d)
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Cooking Equipment & Appliances */}
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5">Cooking Equipment & Appliances (Kitchen & Outdoor)</label>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                {equipmentList.map((eq) => (
                  <button
                    key={eq}
                    type="button"
                    onClick={() => toggleSelection(selectedEquipment, setSelectedEquipment, eq)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold border cursor-pointer ${
                      selectedEquipment.includes(eq)
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                    }`}
                  >
                    {eq}
                  </button>
                ))}
              </div>
            </div>

            {/* Cuisine Preference Sliders (Weight Scale 1-5) */}
            <div className="space-y-2 bg-gray-50 p-3 rounded-2xl border border-gray-200">
              <label className="block text-[10px] font-bold text-gray-500 uppercase">Cuisine Preferences (Match Weighting)</label>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                {Object.keys(cuisinePreferences).map((cuisine) => (
                  <div key={cuisine} className="space-y-0.5">
                    <div className="flex justify-between text-[11px] font-bold text-gray-700">
                      <span>{cuisine}</span>
                      <span className="text-indigo-600 font-mono">{cuisinePreferences[cuisine]}/5</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      value={cuisinePreferences[cuisine]}
                      onChange={(e) => handleCuisineWeightChange(cuisine, e.target.value)}
                      className="w-full accent-indigo-600 h-1 bg-gray-200 rounded-lg cursor-pointer"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setStep(2)}
                className="py-2.5 px-4 bg-gray-100 text-gray-700 font-bold text-xs rounded-xl hover:bg-gray-200 cursor-pointer"
              >
                ← Back
              </button>
              <button
                onClick={() => setStep(4)}
                className="flex-1 py-2.5 bg-indigo-600 text-white font-bold text-xs rounded-xl shadow-md hover:bg-indigo-700 cursor-pointer"
              >
                Next: Initial Pantry →
              </button>
            </div>
          </div>
        )}

        {/* FRAME 4: Stock Your Initial Pantry */}
        {step === 4 && (
          <div className="space-y-4 animate-in fade-in">
            <div className="text-center space-y-1">
              <h4 className="font-bold text-sm text-gray-900">Stock Your Initial Pantry</h4>
              <p className="text-xs text-gray-500 leading-relaxed">
                This is just to get you started quickly - you can always go crazy adding more items later.
              </p>
            </div>

            {/* Ways to Add (Light & Fast Options) */}
            <div className="grid grid-cols-2 gap-2">
              <label className="bg-indigo-50 border border-indigo-100 p-2.5 rounded-xl cursor-pointer flex flex-col items-center justify-center text-center hover:bg-indigo-100 transition-colors">
                <Scan className="w-4 h-4 text-indigo-600 mb-0.5" />
                <span className="text-xs font-bold text-indigo-900">Scan Receipt</span>
                <span className="text-[8px] text-indigo-500">Quick automated import</span>
                <input type="file" capture="environment" onChange={onScanReceipt} className="hidden" />
              </label>

              <div className="bg-purple-50 border border-purple-100 p-2.5 rounded-xl flex flex-col items-center justify-center text-center">
                <Speaker className="w-4 h-4 text-purple-600 mb-0.5" />
                <span className="text-xs font-bold text-purple-900">Voice Input</span>
                <span className="text-[8px] text-purple-500">Fast & low cost</span>
              </div>
            </div>

            {/* Category Tabs (Desktop Wrapping Enabled) */}
            <div className="space-y-2">
              <div className="flex md:flex-wrap overflow-x-auto md:overflow-visible gap-1 pb-1 md:pb-0 scrollbar-hide border-b border-gray-100">
                {Object.keys(categorizedStaples).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setActiveCategoryTab(cat)}
                    className={`px-3 py-1.5 text-[10px] md:text-xs font-bold whitespace-nowrap md:whitespace-normal rounded-lg transition-all cursor-pointer ${
                      activeCategoryTab === cat
                        ? "bg-indigo-600 text-white shadow-xs"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Items Grid */}
              <div className="bg-gray-50 p-3 rounded-2xl border border-gray-200 min-h-[140px] max-h-[190px] overflow-y-auto">
                <div className="flex justify-between items-center mb-2 px-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">{activeCategoryTab}</span>
                  {addedStaples.length > 0 && (
                    <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                      {addedStaples.length} Added
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {categorizedStaples[activeCategoryTab].map((s) => {
                    const isAdded = addedStaples.includes(s.name);
                    return (
                      <button
                        key={s.name}
                        type="button"
                        onClick={() => handleQuickAddStaple(s.name)}
                        className={`px-2.5 py-1.5 rounded-xl text-[11px] font-medium border transition-all cursor-pointer flex items-center gap-1 ${
                          isAdded
                            ? "bg-green-100 text-green-800 border-green-300 font-bold"
                            : "bg-white text-gray-700 border-gray-200 hover:bg-gray-100"
                        }`}
                      >
                        {isAdded ? <CheckCircle className="w-3 h-3 text-green-600 shrink-0" /> : <Plus className="w-3 h-3 text-gray-400 shrink-0" />}
                        <span className="truncate max-w-[190px]">{s.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setStep(3)}
                className="py-2.5 px-4 bg-gray-100 text-gray-700 font-bold text-xs rounded-xl hover:bg-gray-200 cursor-pointer"
              >
                ← Back
              </button>
              <button
                onClick={handleFinish}
                className="flex-1 py-3 bg-green-600 text-white font-bold text-xs rounded-xl shadow-lg hover:bg-green-700 active:scale-95 transition-all cursor-pointer"
              >
                🎉 Complete Setup & View Tailored Recipes
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

// IncompleteProfileBanner
const IncompleteProfileBanner = ({ profile, onCompleteProfile }) => {
  const [dismissed, setDismissed] = useState(false);

  const isIncomplete = !profile?.zipCode || !(profile?.diets?.length > 0);

  if (!isIncomplete || dismissed) return null;

  return (
    <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-2xl mb-4 flex items-center justify-between gap-3 shadow-xs animate-in fade-in">
      <div className="flex items-center gap-2.5">
        <div className="p-2 bg-amber-100 text-amber-700 rounded-xl shrink-0">
          <AlertCircle className="w-4 h-4" />
        </div>
        <div>
          <h4 className="font-bold text-xs text-amber-900 leading-tight">
            Incomplete Profile
          </h4>
          <p className="text-[10px] text-amber-700 leading-snug">
            Add your Zip Code & Dietary Preferences to unlock local deal hunting and tailored meal matching.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onCompleteProfile}
          className="px-3 py-1.5 bg-amber-600 text-white text-[10px] font-bold rounded-lg shadow-xs hover:bg-amber-700 cursor-pointer"
        >
          Complete
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="p-1 text-amber-500 hover:text-amber-800 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};


// 👉 LANDMARK: Dynamic Quick Tips Data Pool & State (#64)
// 👉 LANDMARK: Expanded Dynamic Quick Tips Data Pool (#64)
const QUICK_TIPS_POOL = [
  {
    category: "Freshness",
    text: "Keep your receipt scanner handy after grocery runs to automatically populate item shelf lives and estimated costs."
  },
  {
    category: "Storage",
    text: "Never store onions and potatoes together—onions release ethylene gas that causes potatoes to sprout prematurely."
  },
  {
    category: "Pro Technique",
    text: "Always let meat rest for 5-10 minutes after cooking to allow the muscle fibers to relax and retain their juices."
  },
  {
    category: "Zero Waste",
    text: "Save vegetable scraps and chicken bones in a freezer bag to easily batch-cook homemade stock later."
  },
  {
    category: "Knife Skills",
    text: "Curl your fingertips inward like a 'claw' when holding ingredients to protect your knuckles while chopping."
  },
  {
    category: "Smart Panning",
    text: "Preheat your skillet before adding oil ('hot pan, cold oil') to prevent food from sticking to the surface."
  },
  {
    category: "Baking Science",
    text: "Bring eggs and dairy to room temperature before baking to ensure they emulsify smoothly into batters."
  },
  {
    category: "Herb Preservation",
    text: "Store fresh soft herbs like cilantro and parsley upright in a jar with a little water, covered loosely with a plastic bag."
  },
  {
    category: "Flavor Balancing",
    text: "If a dish tastes too acidic or sharp, a pinch of sugar or a pat of butter can round out and balance the flavor."
  },
  {
    category: "Citrus Trick",
    text: "Roll citrus fruits firmly on the counter before juicing to break down internal membranes and yield more juice."
  },
  {
    category: "Meat Prep",
    text: "Pat proteins completely dry with paper towels before searing to get an even, golden-brown crust."
  },
  {
    category: "Pantry Defense",
    text: "Store brown sugar with a slice of fresh bread or a terracotta sugar saver to keep it soft and prevent hardening."
  },
  {
    category: "Garlic Hack",
    text: "Crush garlic cloves lightly with the flat side of your chef's knife to make peeling the papery skin effortless."
  },
  {
    category: "Pasta Science",
    text: "Always salt your pasta boiling water until it tastes like the sea; it's your only chance to season the pasta from the inside out."
  },
  {
    category: "Kitchen Safety",
    text: "Never use water to put out a grease fire; smother it with a tight-fitting lid or baking soda instead."
  },
  {
    category: "Avocado Lifespan",
    text: "Store cut avocados with the pit intact and a brush of lime juice or olive oil tightly wrapped in plastic to slow browning."
  },
  {
    category: "Sauce Rescue",
    text: "If your pan sauce breaks or separates, whisk in a tablespoon of ice-cold water or heavy cream to bring it back together."
  },
  {
    category: "Smart Seasoning",
    text: "Season your food in layers throughout the cooking process rather than all at once at the very end."
  }
];


const App = () => {

const [globalTimers, setGlobalTimers] = useState([]); // [{ id, label, remaining, duration }]
const [pinnedRecipes, setPinnedRecipes] = useState([]); // Array of active recipe objects in tandem mode
useEffect(() => {
    let interval;
    if (globalTimers.length > 0) {
      interval = setInterval(() => {
        setGlobalTimers((prevTimers) =>
          prevTimers
            .map((t) => {
              if (t.remaining <= 1) {
                alert(`⏰ Timer Finished: ${t.label}!`);
                return null;
              }
              return { ...t, remaining: t.remaining - 1 };
            })
            .filter(Boolean)
        );
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [globalTimers]);


const [showLegalModal, setShowLegalModal] = useState(false);
const [showGuidelinesModal, setShowGuidelinesModal] = useState(false);

const [userId, setUserId] = useState(null);
  const [customId, setCustomId] = useState(
    localStorage.getItem("pantry_chef_custom_id") || ""
  );

  const effectiveUserId = customId.trim() || userId;

  // 👉 Group New Feature States Here
  const [recipeNotes, setRecipeNotes] = useState({});
  const [nutritionLogs, setNutritionLogs] = useState([]);
  const [activeFilters, setActiveFilters] = useState({
    proteins: [],
    vegetables: [],
    cuisine: "",
    mealType: "Any",
    maxCalories: 800,
    maxCost: 20,
    ignoreHistory: false,
  });

  // 👉 Group Real-Time Listeners Here
  useEffect(() => {
    // recipeNotes onSnapshot listener...
  }, [effectiveUserId, db]);

  useEffect(() => {
    // nutritionLogs onSnapshot listener...
  }, [effectiveUserId, db]);
  
  // 👉 LANDMARK: Dynamic Rotating Quick Tips with Auto-Rotate & Hover State (#64)
  const [currentTip, setCurrentTip] = useState(() => {
    return QUICK_TIPS_POOL[Math.floor(Math.random() * QUICK_TIPS_POOL.length)];
  });
  const [isTipAnimating, setIsTipAnimating] = useState(false);
  const [isTipPaused, setIsTipPaused] = useState(false);

  const handleRotateTip = () => {
    if (isTipAnimating) return;
    setIsTipAnimating(true);
    setTimeout(() => {
      let nextTip;
      do {
        nextTip = QUICK_TIPS_POOL[Math.floor(Math.random() * QUICK_TIPS_POOL.length)];
      } while (nextTip.text === currentTip.text && QUICK_TIPS_POOL.length > 1);
      setCurrentTip(nextTip);
      setIsTipAnimating(false);
    }, 250); // Matches transition duration
  };

  // Auto-rotate every 8 seconds unless hovered
  useEffect(() => {
    if (isTipPaused) return;
    const interval = setInterval(() => {
      handleRotateTip();
    }, 8000);
    return () => clearInterval(interval);
  }, [currentTip, isTipPaused]);
  
  
  
  // 🚀 NATIVE ROUTER: Syncs activeTab with URL & Browser Back Button
  const [activeTab, setActiveTabState] = useState(() => {
    const path = window.location.pathname.replace('/', '');
    const validTabs = ["pantry", "recipes", "shopping", "budget", "community", "profile", "admin"];
    return validTabs.includes(path) ? path : "pantry";
  });

  useEffect(() => {
    window.history.replaceState({ tab: activeTab }, "", `/${activeTab}`);
    
    const handlePopState = (event) => {
      if (event.state && event.state.tab) {
        setActiveTabState(event.state.tab);
      }
    };
    
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const setActiveTab = (tab) => {
    if (tab === activeTab) return; // Prevents duplicate history spam
    setActiveTabState(tab);
    window.history.pushState({ tab }, "", `/${tab}`);
    if (typeof window.gtag === "function") {
      window.gtag('event', 'page_view', {
        page_path: `/${tab}`,
        page_title: `Pantry Chef - ${tab.charAt(0).toUpperCase() + tab.slice(1)}`
      });
    }
  };
  // 🚀 END NATIVE ROUTER

  const [pantryView, setPantryView] = useState("list");
  const [recipeView, setRecipeView] = useState("discover");
  const [inventory, setInventory] = useState([]);
  const [cookHistory, setCookHistory] = useState([]);
  const [communityRecipes, setCommunityRecipes] = useState([]);
  const [groceryList, setGroceryList] = useState([]);
  const [mealPlan, setMealPlan] = useState([]);
  const [savedRecipes, setSavedRecipes] = useState([]);
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [purchaseHistory, setPurchaseHistory] = useState([]);
  const [wasteHistory, setWasteHistory] = useState([]);
  // 👉 LANDMARK: Expanded Household & AI Taste Profile Schema (#29 & #57)
  const [userProfile, setUserProfile] = useState({
    name: "",
    email: "",
    zipCode: "",
    householdSize: "2 People",
    householdMembers: [
      { name: "Adult 1", ageGroup: "Adult", restrictions: [] }
    ],
    diets: [],
    equipment: [],
    cuisinePreferences: {
      American: 3,
      "Soul Food": 4,
      Mexican: 3,
      Italian: 3,
      Asian: 3,
      Indian: 3,
      Mediterranean: 3,
      Thai: 3,          
      Caribbean: 3,     
      French: 3,
      Chinese: 3,
      Greek: 3,
      German: 3,
      Filipino: 3,
      Japanese: 3
    },
    // NEW: Taste Profile & Persona Engine Fields
    healthGoals: [], // e.g., "Weight Loss", "Mass-Building", "Pregnancy", "Diabetes-Friendly"
    dislikedFoods: "", // e.g., "cilantro, mushrooms, olives"
    kidPreferences: "Standard kid-friendly (mild flavors, hidden veggies if possible)",
    image: null,
    creatorProgress: 0,
    challenges: {},
  });
  const [notification, setNotification] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [aiRecipes, setAiRecipes] = useState([]);
  const [activeRecipe, setActiveRecipe] = useState(null);
  const [cookingMode, setCookingMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [newItemName, setNewItemName] = useState("");
  const [newItemCategory, setNewItemCategory] = useState("Other");
  const [newItemUnit, setNewItemUnit] = useState("pcs");
  const [newItemQty, setNewItemQty] = useState(1);
  const [newItemExpiryDays, setNewItemExpiryDays] = useState(7);
  // 👉 ADDED FOR MULTILINE BULK IMPORT
const [quickAddTab, setQuickAddTab] = useState("single"); // 'single' or 'bulk'
const [bulkText, setBulkText] = useState("");
const [showAddDrawer, setShowAddDrawer] = useState(false); // Mobile Add Drawer Visibility State

const handleBulkAdd = async (e) => {
  e?.preventDefault();
  if (!bulkText.trim()) return;
  setLoading(true);
  setStatus("Parsing bulk list...");

  const lines = bulkText.split("\n").filter((l) => l.trim().length > 0);
  const batch = writeBatch(db);
  const path = `/artifacts/${appId}/users/${effectiveUserId}/inventory`;

  lines.forEach((line) => {
    // Splits by comma: Name, Qty, Expiration (e.g. 3d, 7d, 1m), Location (Pantry, Fridge, Freezer)
    const parts = line.split(",").map((p) => p.trim());
    const name = parts[0] || "Item";
    const qty = parseFloat(parts[1]) || 1;
    const expTag = parts[2] ? parts[2].toLowerCase() : "7d";
    const loc = parts[3] ? parts[3] : "Pantry";

    let days = 7;
    if (expTag.endsWith("d")) days = parseInt(expTag) || 7;
    else if (expTag.endsWith("m")) days = 30;

    const newRef = doc(collection(db, path));
    batch.set(newRef, {
      name,
      quantity: qty,
      unit: "pcs",
      location: loc,
      category: "Other",
      expiryDate: getTimestampInDays(days),
      timestamp: serverTimestamp(),
    });
  });

  await batch.commit();
  setBulkText("");
  setLoading(false);
  setStatus(`Added ${lines.length} items!`);
  setTimeout(() => setStatus(""), 2000);
};
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionIngredients, setSubmissionIngredients] = useState([
    { name: "", quantity: "", unit: "count" },
  ]);
  const [recipeImage, setRecipeImage] = useState(null);
  const [groceryInput, setGroceryInput] = useState("");
  const [grocerySuggestions, setGrocerySuggestions] = useState([]);
  const [showCheckout, setShowCheckout] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState("");
  const [showDealModal, setShowDealModal] = useState(false);
  const [dealResults, setDealResults] = useState([]);
  const [showSubscription, setShowSubscription] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showMealPrep, setShowMealPrep] = useState(false);
  const [viewingProfile, setViewingProfile] = useState(null);
  const [systemNotification, setSystemNotification] = useState(null);
  const [isDemoAuthenticated, setIsDemoAuthenticated] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Gated Onboarding State (Logged-In Users Only)
  const [showOnboarding, setShowOnboarding] = useState(() => {
    return isDemoAuthenticated && !localStorage.getItem("pantry_chef_onboarded");
  });
  const hasAutoLoaded = useRef(false);
  const [isVoiceProcessing, setIsVoiceProcessing] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [communitySearchQuery, setCommunitySearchQuery] = useState("");
  const [showShareModal, setShowShareModal] = useState(false);
  const [redirectModalData, setRedirectModalData] = useState(null);
  const [toolsActiveTab, setToolsActiveTab] = useState("converter");

  // NEW: Recipe Ingestor States
  const [showIngestModal, setShowIngestModal] = useState(false);
  const [ingestUrl, setIngestUrl] = useState("");
  const [isIngesting, setIsIngesting] = useState(false);

  // NEW: Voice Parsing Handler
  const handleVoiceInventorySubmit = async (transcript) => {
    if (!transcript.trim() || isVoiceProcessing) return;
    setIsVoiceProcessing(true);
    setStatus("Parsing speech...");

    const prompt = `Extract grocery inventory items from the following spoken text. 
    Output ONLY a valid JSON array of objects with keys: 'name' (string), 'quantity' (number), 'unit' (string), 'estimatedDaysToExpiry' (number), and 'category' (string like Produce, Dairy, Protein, etc). 
    If unit is unspecified, use 'pcs'. 
    Spoken Text: "${transcript}"`;

    const payload = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" }
    };

    try {
      const responseText = await apiCall(payload);
      const items = parseAIResponse(responseText);

      if (!Array.isArray(items) || items.length === 0) {
        setStatus("No items found.");
      } else {
        const batch = writeBatch(db);
        items.forEach((i) => {
          const ex = inventory.find((x) => x.name.toLowerCase() === i.name.toLowerCase());
          if (ex) {
            batch.update(doc(db, `/artifacts/${appId}/users/${effectiveUserId}/inventory`, ex.id), { 
              quantity: increment(i.quantity || 1) 
            });
          } else {
            batch.set(doc(collection(db, `/artifacts/${appId}/users/${effectiveUserId}/inventory`)), { 
              ...i, 
              quantity: i.quantity || 1, 
              expiryDate: getTimestampInDays(i.estimatedDaysToExpiry || 7), 
              timestamp: serverTimestamp() 
            });
          }
        });
        await batch.commit();
        setStatus(`Added ${items.length} item(s)!`);
      }
    } catch (err) {
      console.error(err);
      setStatus("Error understanding speech.");
    } finally {
      setIsVoiceProcessing(false);
      setTimeout(() => setStatus(""), 2000);
    }
  };

  const handleUpdateEquipment = async (gearName) => {
    const currentEquip = userProfile.equipment || [];
    if (currentEquip.includes(gearName)) return;

    const updatedEquip = [...currentEquip, gearName];
    const updatedProfile = { ...userProfile, equipment: updatedEquip };
    
    setUserProfile(updatedProfile);
    await handleSaveProfile(updatedProfile);
    
    setNotification(`🛠️ Added "${gearName}" to your kitchen equipment!`);
    setTimeout(() => setNotification(null), 3000);
  };

  // NEW: URL Recipe Ingestor Logic
  // State to manage the duplicate prompt modal
  const [duplicateMatch, setDuplicateMatch] = useState(null);
  const [pendingDuplicateUrl, setPendingDuplicateUrl] = useState("");

  const handleUrlIngest = async (e, forceUpload = false) => {
    e?.preventDefault();
    if (!ingestUrl.trim()) return;

    const targetUrl = ingestUrl.trim();

    // 👉 Check if URL already exists in community recipes
    if (!forceUpload) {
      const existingMatch = communityRecipes.find(r => r.sourceUrl === targetUrl);
      if (existingMatch) {
        setDuplicateMatch(existingMatch);
        setPendingDuplicateUrl(targetUrl);
        return; // Halt execution, don't burn tokens
      }
    }

    setIsIngesting(true);
    setStatus("Reading webpage...");

    const prompt = `Visit this URL: ${targetUrl} and extract the recipe. 
    Format instructions clearly with numbered steps (e.g. "1. ... 2. ...").
    Extract the primary recipe image URL into 'image'.
    Ignore all blog fluff, life stories, and ads.
    Return ONLY a valid JSON object matching this schema:
    {
      "title": "Recipe Name",
      "description": "Short description",
      "prepTime": "30 mins",
      "servings": 4,
      "image": "https://image-url.jpg",
      "allIngredients": [{"name": "item", "quantity": 1, "unit": "cup"}],
      "instructions": "1. Step one...\n2. Step two...",
      "nutrition": {"calories": 0, "protein": "0g", "carbs": "0g", "fat": "0g"},
      "sourceName": "Web Import",
      "sourceUrl": "${targetUrl}"
    }`;

    const payload = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" }
    };

    try {
      const responseText = await apiCall(payload);
      const recipeData = parseAIResponse(responseText);
      
      const processedRecipe = processRecipesAgainstInventory([recipeData])[0];
      
      await addDoc(collection(db, `/artifacts/${appId}/public/data/userRecipes`), {
        ...processedRecipe,
        createdAt: serverTimestamp(),
        createdBy: effectiveUserId || "anonymous",
        isAI: false,
        likeCount: 0,
        authorName: processedRecipe.sourceName || "Web Import",
        authorImage: userProfile?.image || null
      });

      setStatus("Recipe Imported!");
      setShowIngestModal(false);
      setIngestUrl("");
      setDuplicateMatch(null);
      handleSetActiveRecipe(processedRecipe);
    } catch (err) {
      console.error(err);
      setStatus("Failed to read URL.");
    } finally {
      setIsIngesting(false);
      setTimeout(() => setStatus(""), 3000);
    }
  };



  const handleVoiceShoppingSubmit = async (transcript) => {
  if (!transcript.trim() || isVoiceProcessing) return;
  setIsVoiceProcessing(true);
  setStatus("Parsing shopping items...");

  const prompt = `Extract grocery items from the following spoken text to add to a shopping list. 
  Output ONLY a valid JSON array of strings (the item names with quantities if spoken). 
  Spoken Text: "${transcript}"`;

  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { responseMimeType: "application/json" }
  };

  try {
    const responseText = await apiCall(payload);
    const items = parseAIResponse(responseText);

    if (Array.isArray(items) && items.length > 0) {
      await addToGroceryList(items);
      setStatus(`Added ${items.length} item(s)!`);
    } else {
      setStatus("No items recognized.");
    }
  } catch (err) {
    console.error(err);
    setStatus("Error understanding voice input.");
  } finally {
    setIsVoiceProcessing(false);
    setTimeout(() => setStatus(""), 2000);
  }
};

  // Constants
  const filterOptions = {
    proteins: ["Chicken", "Beef", "Pork", "Fish", "Tofu", "Eggs"],
    vegetables: [
      "Tomatoes",
      "Onions",
      "Spinach",
      "Broccoli",
      "Carrots",
      "Peppers",
    ],
  };

  const [apiUsage, setApiUsage] = useState(getApiUsage());
  useEffect(() => {
    const handleUpdate = () => setApiUsage(getApiUsage());
    window.addEventListener("apiUsageUpdated", handleUpdate);
    return () => window.removeEventListener("apiUsageUpdated", handleUpdate);
  }, []);

  // 👉 LANDMARK: Soft-Gate State Variables
  const [showSoftGate, setShowSoftGate] = useState(false);
  const [softGateContext, setSoftGateContext] = useState("save recipes & sync your pantry");
  useEffect(() => {
    const handleOpenLoginModal = () => setShowLoginModal(true);
    window.addEventListener("openLoginModal", handleOpenLoginModal);
    return () => window.removeEventListener("openLoginModal", handleOpenLoginModal);
  }, []);

  // Trigger Onboarding on Login if Not Completed
  const handleLogin = async () => {
    setShowLoginModal(false);
  

    if (auth?.currentUser && db) {
      const user = auth.currentUser;
      
      // Check custom claims for approval status
      const tokenResult = await user.getIdTokenResult(true);
      const isUserAdmin = tokenResult.claims.admin === true;
      const isUserApproved = tokenResult.claims.approved === true;

      // If not admin and not approved, register them to the waitlist doc if missing
      if (!isUserAdmin && !isUserApproved) {
        const waitlistRef = doc(db, `/artifacts/${appId}/public/data/waitlist`, user.uid);
        await setDoc(waitlistRef, {
          uid: user.uid,
          email: user.email || "User",
          displayName: user.displayName || "Chef Candidate",
          status: "pending",
          requestedAt: serverTimestamp()
        }, { merge: true });
      }
    }

    setIsDemoAuthenticated(true);
    setNotification("🎉 Successfully signed in!");
    setTimeout(() => setNotification(null), 3000);

    if (!localStorage.getItem("pantry_chef_onboarded")) {
      setShowOnboarding(true);
    }

    setNotification("🎉 Successfully signed in! Syncing data...");
    setTimeout(() => setNotification(null), 3000);
  };

  useEffect(() => {
    if (!auth) return;
    const initAuth = async () => {
      if (initialAuthToken) await signInWithCustomToken(auth, initialAuthToken);
      else await signInAnonymously(auth);
    };

    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then((reg) => console.log('Service worker registered.', reg))
          .catch((err) => console.log('Service worker registration failed:', err));
      });
    }
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user && !user.isAnonymous) {
        setUserId(user.uid);
        setIsDemoAuthenticated(true);

      try {
          // 👉 Pull the fresh token with custom claims from the server
          const tokenResult = await user.getIdTokenResult(true);
          
          if (tokenResult.claims.admin === true) {
            setIsAdmin(true);
          } else {
            setIsAdmin(false);
          }
        } catch (err) {
          console.error("Failed to verify admin claims:", err);
          setIsAdmin(false);
        }
      } else {
        setUserId(user ? user.uid : null);
        setIsDemoAuthenticated(false);
        setIsAdmin(false);
        if (!user) initAuth();
      }

    });
    
    const handleAdminToggle = (e) => setIsAdmin(e.detail);
    window.addEventListener("adminToggle", handleAdminToggle);
    const handleSubToggle = () => setShowSubscription(true);
    window.addEventListener("openSubscription", handleSubToggle);
    setTimeout(() => {
      setNotification("🎉 You saved $142.50 this month! That's a new record.");
      setTimeout(() => setNotification(null), 5000);
    }, 3000);

    const handleSystemNotify = (e) => {
      setSystemNotification(e.detail);
      setTimeout(() => setSystemNotification(null), 4000);
    };
    window.addEventListener("triggerSystemNotification", handleSystemNotify);

    return () => {
      unsubscribe();
      window.removeEventListener("adminToggle", handleAdminToggle);
      window.removeEventListener("openSubscription", handleSubToggle);
      window.removeEventListener(
        "triggerSystemNotification",
        handleSystemNotify
      );
    };
  }, []);

  const handleAdminToggle = (status) => {
    setIsAdmin(status);
  };

  useEffect(() => {
    let interval;
    if (globalTimers.length > 0) {
      interval = setInterval(() => {
        setGlobalTimers((prevTimers) =>
          prevTimers
            .map((t) => {
              if (t.remaining <= 1) {
                alert(`⏰ Timer Finished: ${t.label}!`);
                return null; // Remove finished timer
              }
              return { ...t, remaining: t.remaining - 1 };
            })
            .filter(Boolean)
        );
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [globalTimers]);

  useEffect(() => {
    if (!effectiveUserId || !db) return;
    const unsubs = [
      onSnapshot(
        collection(
          db,
          `/artifacts/${appId}/users/${effectiveUserId}/inventory`
        ),
        (s) => setInventory(s.docs.map((d) => ({ id: d.id, ...d.data() })))
      ),
      onSnapshot(
        collection(
          db,
          `/artifacts/${appId}/users/${effectiveUserId}/groceryList`
        ),
        (s) => setGroceryList(s.docs.map((d) => ({ id: d.id, ...d.data() })))
      ),
      onSnapshot(
        query(
          collection(db, `/artifacts/${appId}/public/data/cookHistory`),
          where("userId", "==", effectiveUserId)
        ),
        (s) => setCookHistory(s.docs.map((d) => ({ id: d.id, ...d.data() })))
      ),
      onSnapshot(
        query(
          collection(db, `/artifacts/${appId}/public/data/userRecipes`),
          orderBy("createdAt", "desc")
        ),
        (s) =>
          setCommunityRecipes(s.docs.map((d) => ({ id: d.id, ...d.data() })))
      ),
      onSnapshot(
        doc(
          db,
          `/artifacts/${appId}/users/${effectiveUserId}/profile`,
          "settings"
        ),
        (d) => {
          if (d.exists()) setUserProfile(d.data());
        }
      ),
      onSnapshot(
        collection(db, `/artifacts/${appId}/users/${effectiveUserId}/mealPlan`),
        (s) => setMealPlan(s.docs.map((d) => ({ id: d.id, ...d.data() })))
      ),
      onSnapshot(
        collection(
          db,
          `/artifacts/${appId}/users/${effectiveUserId}/savedRecipes`
        ),
        (s) =>
          setSavedRecipes(
            s.docs.map((d) => ({ ...d.data(), id: d.id, firestoreId: d.id }))
          )
      ),
      onSnapshot(
        query(
          collection(
            db,
            `/artifacts/${appId}/users/${effectiveUserId}/recentlyViewed`
          ),
          orderBy("viewedAt", "desc"),
          limit(10)
        ),
        (s) => setRecentlyViewed(s.docs.map((d) => ({ ...d.data(), id: d.id })))
      ),
      onSnapshot(
        collection(
          db,
          `/artifacts/${appId}/users/${effectiveUserId}/purchaseHistory`
        ),
        (s) =>
          setPurchaseHistory(s.docs.map((d) => ({ id: d.id, ...d.data() })))
      ),
      onSnapshot(
        collection(
          db,
          `/artifacts/${appId}/users/${effectiveUserId}/wasteLogs`
        ),
        (s) => setWasteHistory(s.docs.map((d) => ({ id: d.id, ...d.data() })))
      ),
    ];
    return () => unsubs.forEach((u) => u());
  }, [effectiveUserId, db]);

  useEffect(() => {
    if (
      inventory.length > 0 &&
      !hasAutoLoaded.current &&
      activeTab === "recipes" &&
      aiRecipes.length === 0
    ) {
      hasAutoLoaded.current = true;
      const randomItem =
        inventory[Math.floor(Math.random() * inventory.length)].name;
      fetchMealDBRecipes(randomItem).then((res) => {
        const processed = processRecipesAgainstInventory(res);
        setAiRecipes(processed.map((r) => ({ ...r, isAI: false, isDB: true })));
      });
    }
  }, [inventory, activeTab]);

  const allIngredients = useMemo(() => {
    const set = new Set();
    [...communityRecipes, ...aiRecipes, ...savedRecipes].forEach((r) =>
      r.allIngredients?.forEach((i) => set.add(i.name))
    );
    return Array.from(set);
  }, [communityRecipes, aiRecipes, savedRecipes]);
  const smartGrocerySuggestions = useMemo(() => {
    if (!savedRecipes.length && !recentlyViewed.length) return [];
    const frequency = {};
    [...savedRecipes, ...recentlyViewed].forEach((r) =>
      r.allIngredients?.forEach((ing) => {
        const name = ing.name.toLowerCase();
        if (
          !inventory.some((i) => i.name.toLowerCase().includes(name)) &&
          !groceryList.some((g) => g.name.toLowerCase().includes(name))
        )
          frequency[name] = (frequency[name] || 0) + 1;
      })
    );
    return Object.entries(frequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name]) => name.charAt(0).toUpperCase() + name.slice(1));
  }, [savedRecipes, recentlyViewed, inventory, groceryList]);
  const getLastPrice = (itemName) => {
    if (!purchaseHistory.length) return null;
    const matches = purchaseHistory
      .filter((p) => p.name.toLowerCase() === itemName.toLowerCase())
      .sort((a, b) => b.timestamp - a.timestamp);
    if (matches.length > 0)
      return { price: matches[0].cost, date: matches[0].timestamp?.toDate() };
    return null;
  };

  useEffect(() => {
    if (!groceryInput.trim()) {
      setGrocerySuggestions([]);
      return;
    }
    const matches = allIngredients
      .filter((i) => i.toLowerCase().includes(groceryInput.toLowerCase()))
      .slice(0, 3);
    setGrocerySuggestions(matches);
  }, [groceryInput, allIngredients]);

  const seedCommunity = async () => {
    if (!db)
      return alert("Database not connected. Please check your configuration.");
    const batch = writeBatch(db);
    const colRef = collection(
      db,
      `/artifacts/${appId}/public/data/userRecipes`
    );
    for (const user of DEMO_USERS) {
      if (user.seedRecipe) {
        const newDoc = doc(colRef);
        batch.set(newDoc, {
          ...user.seedRecipe,
          authorImage: user.image,
          authorName: user.name,
          isBrand: user.isBrand || false,
          isCreator: user.isCreator || false,
          createdBy: user.id,
          createdAt: serverTimestamp(),
          isTest: true,
          servings: 4,
          allIngredients: [{ name: "Sample Item", quantity: 1, unit: "cup" }],
        });
      }
    }
    for (const recipe of MOCK_RECIPES) {
      const persona =
        MOCK_PERSONAS[Math.floor(Math.random() * MOCK_PERSONAS.length)];
      const newDoc = doc(colRef);
      batch.set(newDoc, {
        ...recipe,
        authorImage:
          recipe.authorRole === "Brand"
            ? "https://ui-avatars.com/api/?name=FreshMart&background=008000&color=fff"
            : persona.image,
        createdBy: "seeded_account",
        createdAt: serverTimestamp(),
        isTest: true,
        servings: 4,
        allIngredients: [{ name: "Sample Item", quantity: 1, unit: "cup" }],
      });
    }
    for (const user of DEMO_USERS) {
      const profileRef = doc(
        db,
        `/artifacts/${appId}/users/${user.id}/profile`,
        "settings"
      );
      batch.set(profileRef, user.profile);
      for (const item of user.inventory) {
        const invRef = doc(
          collection(db, `/artifacts/${appId}/users/${user.id}/inventory`)
        );
        const now = new Date();
        const expiryDate = new Date(now);
        expiryDate.setDate(now.getDate() + item.expiryDate);
        batch.set(invRef, {
          ...item,
          expiryDate: expiryDate,
          timestamp: serverTimestamp(),
          isTest: true,
        });
      }
    }
    await batch.commit();
    alert("Community & Demo Users Seeded!");
  };

  // 👉 LANDMARK: Real-time listener for private user recipe notes
  useEffect(() => {
    if (!effectiveUserId || !db) return;
    const unsub = onSnapshot(
      collection(db, `/artifacts/${appId}/users/${effectiveUserId}/recipeNotes`),
      (snapshot) => {
        const notesMap = {};
        snapshot.docs.forEach((doc) => {
          notesMap[doc.id] = doc.data().noteText;
        });
        setRecipeNotes(notesMap);
      }
    );
    return () => unsub();
  }, [effectiveUserId, db]);

  // Handler to save a private note for a recipe
  const handleSaveRecipeNote = async (recipeId, noteText) => {
    if (!recipeId) return;
    const noteRef = doc(db, `/artifacts/${appId}/users/${effectiveUserId}/recipeNotes`, recipeId);
    await setDoc(noteRef, {
      noteText: noteText,
      updatedAt: serverTimestamp()
    }, { merge: true });
    setNotification("📝 Private recipe note saved!");
    setTimeout(() => setNotification(null), 2500);
  };

  const purgeTestData = async () => {
    if (!db) return alert("Database not connected.");
    const q = query(
      collection(db, `/artifacts/${appId}/public/data/userRecipes`),
      where("isTest", "==", true)
    );
    const snapshot = await getDocs(q);
    const batch = writeBatch(db);
    snapshot.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
    alert("Test Data Purged.");
  };
  const handleImpersonate = (demoId) => {
    localStorage.setItem("pantry_chef_custom_id", demoId);
    setCustomId(demoId);
    setIsAdmin(false);
    setActiveTab("pantry");
    alert(`Switched to ${demoId}. Welcome!`);
    window.location.reload();
  };
  const handleSaveProfile = async (p) => {
    await setDoc(
      doc(
        db,
        `/artifacts/${appId}/users/${effectiveUserId}/profile`,
        "settings"
      ),
      p
    );
    alert("Saved!");
  };
  const handleAddManual = async (e) => {
    e?.preventDefault();
    if (!newItemName.trim()) return;
    setLoading(true);
    const path = `/artifacts/${appId}/users/${effectiveUserId}/inventory`;
    const existing = inventory.find(
      (i) =>
        i.name.toLowerCase() === newItemName.trim().toLowerCase() &&
        i.unit === newItemUnit
    );
    if (existing)
      await updateDoc(doc(db, path, existing.id), {
        quantity: increment(newItemQty),
      });
    else
      await addDoc(collection(db, path), {
        name: newItemName.trim(),
        quantity: newItemQty,
        unit: newItemUnit,
        expiryDate: getTimestampInDays(newItemExpiryDays),
        category: newItemCategory,
        timestamp: serverTimestamp(),
      });
    
    setNewItemName("");
    setLoading(false);

    // 👉 Auto-focus back to the quick-add input for rapid continuous typing (#23)
    const inputEl = document.querySelector('input[placeholder="Add item name..."]');
    if (inputEl) inputEl.focus();
  };
  const logWaste = async (item, qty) => {
    let cost = item.lastCost || 0;
    if (!cost) {
      const userCost = prompt(
        `What was the estimated cost of this wasted ${item.name}?`,
        "0"
      );
      cost = parseFloat(userCost) || 0;
    } else {
      cost = cost * qty;
    }
    await addDoc(
      collection(db, `/artifacts/${appId}/users/${effectiveUserId}/wasteLogs`),
      {
        name: item.name,
        cost: cost,
        category: item.category || "Other",
        timestamp: serverTimestamp(),
      }
    );
  };
  const handleUpdateQty = async (id, chg) => {
    const item = inventory.find((i) => i.id === id);
    if (item.quantity + chg <= 0) {
      if (
        window.confirm(
          "Did you use this item up (OK) or did it spoil (Cancel)?"
        )
      ) {
        await deleteDoc(
          doc(db, `/artifacts/${appId}/users/${effectiveUserId}/inventory`, id)
        );
      } else {
        await logWaste(item, item.quantity);
        await logAnalyticsEvent("waste_logged", { itemName: item.name, category: item.category });
        await deleteDoc(
          doc(db, `/artifacts/${appId}/users/${effectiveUserId}/inventory`, id)
        );
        alert("Item logged as waste. Check Budget tab.");
      }
    } else
      await updateDoc(
        doc(db, `/artifacts/${appId}/users/${effectiveUserId}/inventory`, id),
        { quantity: increment(chg) }
      );
  };
  const handleScan = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLoading(true);
    setStatus("Scanning...");
    try {
      const items = await scanIngredients(await fileToBase64(file));
      const batch = writeBatch(db);
      items.forEach((i) => {
        const ex = inventory.find(
          (x) => x.name.toLowerCase() === i.name.toLowerCase()
        );
        if (i.price) {
          const histRef = doc(
            collection(
              db,
              `/artifacts/${appId}/users/${effectiveUserId}/purchaseHistory`
            )
          );
          batch.set(histRef, {
            name: i.name,
            cost: i.price,
            category: i.category || "Other",
            timestamp: serverTimestamp(),
          });
        }
        if (ex) {
          batch.update(
            doc(
              db,
              `/artifacts/${appId}/users/${effectiveUserId}/inventory`,
              ex.id
            ),
            {
              quantity: increment(i.quantity || 1),
              lastCost: i.price || ex.lastCost,
            }
          );
        } else {
          batch.set(
            doc(
              collection(
                db,
                `/artifacts/${appId}/users/${effectiveUserId}/inventory`
              )
            ),
            {
              ...i,
              quantity: i.quantity || 1,
              expiryDate: getTimestampInDays(i.estimatedDaysToExpiry || 7),
              lastCost: i.price,
              timestamp: serverTimestamp(),
            }
          );
        }
      });
      await batch.commit();
      setStatus("Done!");
      await logAnalyticsEvent("receipt_scanned", { itemCount: items.length });
      setTimeout(() => setStatus(""), 2000);
    } catch (err) {
      setStatus("Error");
    }
    setLoading(false);
  };
  const handleUpdateItem = async (id, newData) => {
    await updateDoc(
      doc(db, `/artifacts/${appId}/users/${effectiveUserId}/inventory`, id),
      newData
    );
  };
  const handleAutoCategorize = async () => {
    const uncategorized = inventory.filter(
      (i) => !i.category || i.category === "Other"
    );
    if (!uncategorized.length) return alert("Pantry organized!");
    setLoading(true);
    setStatus("Organizing...");
    try {
      const names = uncategorized.map((i) => i.name);
      const results = await categorizeExistingItems(names);
      const batch = writeBatch(db);
      results.forEach((res) => {
        const itemsToUpdate = uncategorized.filter(
          (i) => i.name.toLowerCase() === res.name.toLowerCase()
        );
        itemsToUpdate.forEach((item) =>
          batch.update(
            doc(
              db,
              `/artifacts/${appId}/users/${effectiveUserId}/inventory`,
              item.id
            ),
            { category: res.category }
          )
        );
      });
      await batch.commit();
      setStatus("Done!");
      setTimeout(() => setStatus(""), 2000);
    } catch (err) {
      setStatus("Error");
    }
    setLoading(false);
  };

  const handleGetAIRecipes = async (mode = "recipe") => {
    setLoading(true);
    setStatus("Generating...");
    try {
      let res = [];
      // Pass activeFilters and cookHistory into fetchAIRecipes
      res = await fetchAIRecipes(
        inventory,
        activeFilters.ignoreHistory ? [] : cookHistory, // 👉 Bypasses anti-repeat history if checkbox is checked!
        userProfile,
        searchQuery,
        activeFilters,
        mode
      );
      
      const processedRecipes = processRecipesAgainstInventory(res);
      setAiRecipes(processedRecipes.map((r) => ({ ...r, isAI: !r.isDB })));
      setRecipeView("discover");
    } catch (err) {
      console.error(err);
      setStatus("AI Error: " + (err.message || "Unknown"));
      setTimeout(() => setStatus(""), 3000);
    }
    setLoading(false);
  };

  
  const handleAddToPlan = async (recipe, day, type, time, prepTime) => {
    await addDoc(
      collection(db, `/artifacts/${appId}/users/${effectiveUserId}/mealPlan`),
      {
        day,
        type,
        recipeTitle: recipe.title,
        recipeId: recipe.id || null,
        isAI: recipe.isAI || false,
        mealTime: time,
        prepTime: prepTime,
        timestamp: serverTimestamp(),
      }
    );
  };
  const handleDeleteMeal = async (id) =>
    deleteDoc(
      doc(db, `/artifacts/${appId}/users/${effectiveUserId}/mealPlan`, id)
    );
  
  // Handler to delete a mislogged entry from nutrition history
  const handleDeleteNutritionLog = async (logId) => {
    await deleteDoc(doc(db, `/artifacts/${appId}/users/${effectiveUserId}/nutritionLogs`, logId));
    setNotification("🗑️ Log entry removed.");
    setTimeout(() => setNotification(null), 2500);
  };
  
  const toggleFilter = (category, item) => {
    setActiveFilters((prev) => {
      const current = prev[category] || [];
      return {
        ...prev,
        [category]: current.includes(item)
          ? current.filter((i) => i !== item)
          : [...current, item],
      };
    });
  };
  const handleImageSelect = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const resized = await resizeImage(file, 600);
      setRecipeImage(resized);
    }
  };
  const handleLike = async (id) =>
    updateDoc(doc(db, `/artifacts/${appId}/public/data/userRecipes`, id), {
      likeCount: increment(1),
    });
  const addToGroceryList = async (items) => {
    const batch = writeBatch(db);
    const itemsArray = Array.isArray(items) ? items : [items];
    itemsArray.forEach((n) => {
      if (!groceryList.some((g) => g.name.toLowerCase() === n.toLowerCase())) {
        const newRef = doc(
          collection(
            db,
            `/artifacts/${appId}/users/${effectiveUserId}/groceryList`
          )
        );
        batch.set(newRef, {
          name: n,
          purchased: false,
          timestamp: serverTimestamp(),
        });
      }
    });
    await batch.commit();
    setGroceryInput("");

    // 👉 Force explicit toast state trigger here
    setNotification(`🛒 Added ${itemsArray.length} item(s) to your shopping list!`);
    setTimeout(() => setNotification(null), 3000);

    setActiveTab("shopping");
  };
  const toggleGroceryItem = async (id, currentStatus) => {
    await updateDoc(
      doc(db, `/artifacts/${appId}/users/${effectiveUserId}/groceryList`, id),
      { purchased: !currentStatus }
    );
  };
  const handleBarcodeAdd = async (e) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;
    setLoading(true);
    setStatus("Looking up...");
    const product = await fetchFromUPC(barcodeInput);
    if (product) {
      await addDoc(
        collection(
          db,
          `/artifacts/${appId}/users/${effectiveUserId}/inventory`
        ),
        {
          name: product.name,
          quantity: 1,
          unit: "pcs",
          expiryDate: getTimestampInDays(30),
          category: "Other",
          timestamp: serverTimestamp(),
        }
      );
      setBarcodeInput("");
      setStatus("Found!");
    } else {
      setStatus("Not found");
    }
    setLoading(false);
    setTimeout(() => setStatus(""), 2000);
  };
  const handleFindDeals = async (itemName) => {
    setLoading(true);
    setStatus("Hunting deals...");
    try {
      const deals = await findDeals(itemName);
      setDealResults(deals);
      setShowDealModal(true);
    } catch (err) {
      setStatus("No deals found");
    }
    setLoading(false);
  };
  const handleCheckout = async (itemsWithPrices) => {
    const batch = writeBatch(db);
    const invPath = `/artifacts/${appId}/users/${effectiveUserId}/inventory`;
    const histPath = `/artifacts/${appId}/users/${effectiveUserId}/purchaseHistory`;
    const listPath = `/artifacts/${appId}/users/${effectiveUserId}/groceryList`;
    itemsWithPrices.forEach((item) => {
      const histRef = doc(collection(db, histPath));
      batch.set(histRef, {
        name: item.name,
        cost: item.price,
        category: "Other",
        timestamp: serverTimestamp(),
      });
      const existing = inventory.find(
        (inv) => inv.name.toLowerCase() === item.name.toLowerCase()
      );
      if (existing) {
        batch.update(doc(db, invPath, existing.id), {
          quantity: increment(1),
          lastCost: item.price,
        });
      } else {
        const invRef = doc(collection(db, invPath));
        batch.set(invRef, {
          name: item.name,
          quantity: 1,
          unit: "unit",
          expiryDate: getTimestampInDays(14),
          category: "Other",
          lastCost: item.price,
          timestamp: serverTimestamp(),
        });
      }
      batch.delete(doc(db, listPath, item.id));
    });
    await batch.commit();
    setShowCheckout(false);
    alert("Purchased & Logged!");
    setActiveTab("budget");
  };
  const handleAddToPantry = async (itemName) => {
    const path = `/artifacts/${appId}/users/${effectiveUserId}/inventory`;
    const existing = inventory.find(
      (i) => i.name.toLowerCase() === itemName.toLowerCase()
    );
    if (existing) {
      await updateDoc(doc(db, path, existing.id), { quantity: increment(1) });
    } else {
      await addDoc(collection(db, path), {
        name: itemName,
        quantity: 1,
        unit: "unit",
        expiryDate: getTimestampInDays(14),
        category: "Other",
        timestamp: serverTimestamp(),
      });
    }
  };

  const calculatePantryMatch = (recipeIngredients, inventory) => {
  if (!recipeIngredients || recipeIngredients.length === 0) return 100;
  
  const pantryItems = new Set((inventory || []).map(item => (item.name || "").toLowerCase().trim()));
  
  let matchedCount = 0;
  recipeIngredients.forEach(ing => {
    const ingName = (typeof ing === 'string' ? ing : (ing.name || ing.item || "")).toLowerCase().trim();
    const isPresent = Array.from(pantryItems).some(pantryItem => 
      pantryItem.includes(ingName) || ingName.includes(pantryItem)
    );
    if (isPresent) {
      matchedCount++;
    }
  });

  return Math.round((matchedCount / recipeIngredients.length) * 100);
};

  const deleteGroceryItem = async (id) =>
    deleteDoc(
      doc(db, `/artifacts/${appId}/users/${effectiveUserId}/groceryList`, id)
    );
  const calculateMatch = useCallback(
    (ings) => {
      if (!inventory.length || !ings?.length) return 0;
      let c = 0;
      ings.forEach((i) => {
        if (
          inventory.some((inv) =>
            inv.name.toLowerCase().includes(i.name.toLowerCase())
          )
        )
          c++;
      });
      return Math.round((c / ings.length) * 100);
    },
    [inventory]
  );
  const processRecipesAgainstInventory = (recipeList) => {
    return recipeList.map((r) => {
      const allIngs = r.allIngredients || [];
      const missing = [];
      let matchCount = 0;
      allIngs.forEach((ing) => {
        const hasItem = inventory.some(
          (inv) =>
            inv.name.toLowerCase().includes(ing.name.toLowerCase()) ||
            ing.name.toLowerCase().includes(inv.name.toLowerCase())
        );
        if (hasItem) {
          matchCount++;
        } else {
          missing.push(ing.name);
        }
      });
      const matchPercentage =
        allIngs.length > 0
          ? Math.round((matchCount / allIngs.length) * 100)
          : 0;
      return {
        ...r,
        matchPercentage,
        missingIngredients: missing,
        id: r.id || Math.random().toString(),
      };
    });
  };
  const handleAddIngredientRow = () =>
    setSubmissionIngredients([
      ...submissionIngredients,
      { name: "", quantity: "", unit: "count" },
    ]);
  const handleIngredientChange = (idx, field, val) => {
    const updated = [...submissionIngredients];
    updated[idx][field] = val;
    setSubmissionIngredients(updated);
  };
  const handleRemoveIngredientRow = (idx) => {
    if (submissionIngredients.length > 1)
      setSubmissionIngredients(
        submissionIngredients.filter((_, i) => i !== idx)
      );
  };
  const handleToggleSave = async (recipe) => {
    if (!isDemoAuthenticated) {
      setSoftGateContext("save recipes to your cloud kitchen & sync across devices");
      setShowSoftGate(true);
      return;
    }

    const existing = savedRecipes.find((r) => r.title === recipe.title);
    if (existing) {
      await deleteDoc(
        doc(
          db,
          `/artifacts/${appId}/users/${effectiveUserId}/savedRecipes`,
          existing.firestoreId
        )
      );
    } else {
      await addDoc(
        collection(
          db,
          `/artifacts/${appId}/users/${effectiveUserId}/savedRecipes`
        ),
        { ...recipe, savedAt: serverTimestamp() }
      );
    }
  };
  const handleSetActiveRecipe = async (recipe) => {
    setActiveRecipe(recipe);
    if (effectiveUserId) {
      await addDoc(
        collection(
          db,
          `/artifacts/${appId}/users/${effectiveUserId}/recentlyViewed`
        ),
        { ...recipe, viewedAt: serverTimestamp() }
      );
    }
  };
  const handleSubmitRecipe = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    if (submissionIngredients.some((i) => !i.name.trim()))
      return alert("Add ingredients");
    setIsSubmitting(true);
    await addDoc(
      collection(db, `/artifacts/${appId}/public/data/userRecipes`),
      {
        title: fd.get("title"),
        description: fd.get("description"),
        instructions: fd.get("instructions"),
        prepTime: "45 mins",
        allIngredients: submissionIngredients,
        createdAt: serverTimestamp(),
        createdBy: effectiveUserId,
        likeCount: 0,
        servings: parseInt(fd.get("servings")) || 4,
        image: recipeImage,
        authorImage: userProfile.image,
      }
    );
    e.target.reset();
    setSubmissionIngredients([{ name: "", quantity: "", unit: "count" }]);
    setRecipeImage(null);
    setIsSubmitting(false);
    alert("Shared!");
  };
  const handleVote = async (id, val) => {
    if (!id) return;
    await updateDoc(
      doc(db, `/artifacts/${appId}/public/data/userRecipes`, id),
      { likeCount: increment(val) }
    );
  };
  const groupedInventory = inventory.reduce((acc, item) => {
    const cat = item.category || "Other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  if (activeRecipe)
    return (
      <RecipeDetailView
        recipe={activeRecipe}
        onClose={() => setActiveRecipe(null)}
        onCook={handleCook}
        onAddToGrocery={addToGroceryList}
        onAddToPlan={handleAddToPlan}
        onAddToPantry={handleAddToPantry}
        inventory={inventory}
        isSaved={savedRecipes.some((r) => r.title === activeRecipe.title)}
        onToggleSave={handleToggleSave}
        onVote={handleVote}
        userNote={recipeNotes[activeRecipe.id || activeRecipe.firestoreId]}
        onSaveNote={handleSaveRecipeNote}
        userProfile={userProfile}
        onUpdateEquipment={handleUpdateEquipment}
        effectiveUserId={effectiveUserId}
        globalTimers={globalTimers}
        setGlobalTimers={setGlobalTimers}
        pinnedRecipes={pinnedRecipes}
        setPinnedRecipes={setPinnedRecipes}
        askAIChef={askAIChef}
      />
    );
  if (viewingProfile)
    return (
      <UserProfileView
        user={viewingProfile}
        onClose={() => setViewingProfile(null)}
        allRecipes={communityRecipes}
        onRecipeClick={(r) => setActiveRecipe(r)}
      />
    );
  
  if (showCheckout)
    return (
      <CheckoutModal
        items={groceryList.filter((i) => i.purchased)}
        onClose={() => setShowCheckout(false)}
        onConfirm={handleCheckout}
      />
    );
  if (showSubscription)
    return <SubscriptionModal onClose={() => setShowSubscription(false)} />;
  if (showLoginModal)
    return (
      <LoginModal
        onClose={() => setShowLoginModal(false)}
        onLogin={handleLogin}
      />
    );
    

  // 🛑 GLOBAL AUTH GATE: Lock down app access for unauthenticated visitors
  if (!isDemoAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-gray-800 rounded-lg shadow-xl p-8 text-center border border-gray-700">
          <div className="w-16 h-16 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <ChefHat className="w-8 h-8 text-indigo-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">PantryChef</h1>
          <p className="text-gray-400 text-sm mb-6">
            Access is currently restricted. Please sign in or create an account to continue.
          </p>
          <button
            onClick={() => setShowLoginModal(true)}
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogIn className="w-4 h-4" /> Sign In / Create Account
          </button>
        </div>
      </div>
    );
  }

  // 🛑 WAITLIST & APPROVAL GATE
  if (isDemoAuthenticated && !isAdmin) {
    // We can check user approval state from a local state or token claim
    // For safety, let's block unapproved non-admin users with this waitlist screen:
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-gray-800 rounded-3xl shadow-2xl p-8 text-center border border-gray-700 space-y-4">
          <div className="w-16 h-16 bg-amber-500/20 text-amber-400 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <Clock className="w-8 h-8 animate-pulse" />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-black text-white">You're on the Waitlist!</h1>
            <p className="text-xs text-gray-400 leading-relaxed">
              PantryChef is currently in private beta. Your account has been registered and placed in our approval queue. We'll unlock access as soon as your spot opens up.
            </p>
          </div>
          
          <div className="bg-gray-900/60 p-3 rounded-2xl border border-gray-700/50 text-[11px] text-gray-400">
            Status: <span className="text-amber-400 font-bold uppercase tracking-wider">Pending Review</span>
          </div>

          <button
            onClick={async () => {
              if (auth) await signOut(auth);
              window.location.reload();
            }}
            className="w-full py-3 bg-gray-700 hover:bg-gray-600 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }
  
  // Main App component
  return (
    <div className="flex flex-col h-screen bg-gray-50 md:ml-64 max-w-full md:max-w-none shadow-2xl overflow-hidden relative">
      <div className="p-4 pt-8 bg-white border-b flex items-center justify-between z-20">
        {/* Mobile-Only Logo Header */}
        <div className="flex items-center gap-2 md:hidden">
          <div className="p-2 bg-indigo-600 rounded-lg shadow-lg shadow-indigo-100">
            <Utensils className="text-white w-5 h-5" />
          </div>
          <h1 className="text-xl font-black text-gray-900 tracking-tight">
            Pantry Chef
          </h1>
        </div>

        {/* Desktop & Mobile Dynamic Chef Greeting Banner */}
        <div className="hidden md:flex items-center">
          <DynamicHeaderBanner 
            activeTab={activeTab} 
            userProfile={userProfile} 
            isDemoAuthenticated={isDemoAuthenticated}
            onNavigateProfile={() => setActiveTab("profile")}
            setActiveTab={setActiveTab}
          />
        </div>

        <div className="flex items-center gap-3">
          {/* On mobile, show a compact avatar trigger too */}
          <div className="md:hidden">
            <DynamicHeaderBanner 
              activeTab={activeTab} 
              userProfile={userProfile} 
              isDemoAuthenticated={isDemoAuthenticated}
              onNavigateProfile={() => setActiveTab("profile")}
              setActiveTab={setActiveTab}
            />
          </div>

          {/* Real Auth Status & Admin Pill / Logout */}
          {isDemoAuthenticated && !customId && (
            <div className="flex items-center gap-2">
              {isAdmin && (
                <span className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center">
                  <Briefcase className="w-3 h-3 mr-1" /> ADMIN
                </span>
              )}
              <button
                onClick={async () => {
                  if (auth) await signOut(auth);
                  window.location.reload();
                }}
                className="p-2 bg-gray-100 rounded-full hover:bg-red-50 text-gray-500 hover:text-red-500 transition-colors cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* User Simulator (Impersonation) Exit */}
          {customId && DEMO_USERS.find((u) => u.id === customId) && (
            <div className="flex items-center gap-2 bg-purple-100 px-2 py-1 rounded-full border border-purple-200">
              <span className="text-[9px] font-bold text-purple-700">
                Simulating: {DEMO_USERS.find((u) => u.id === customId).name}
              </span>
              <button
                onClick={() => {
                  localStorage.removeItem("pantry_chef_custom_id");
                  setCustomId("");
                  window.location.reload();
                }}
                className="p-1 bg-white rounded-full hover:bg-red-50 text-purple-700 cursor-pointer"
              >
                <LogOut className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
        
        {/* Loading/Status Indicator */}
        {(loading || status) && !customId && (
          <div className="absolute top-20 right-4 flex items-center gap-2 text-[10px] font-bold px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 animate-pulse shadow-sm">
            <Loader className="w-3 h-3 animate-spin" /> {status || "Loading..."}
          </div>
        )}
      </div>

      {notification && (
        <NotificationToast
          message={notification}
          onClose={() => setNotification(null)}
        />
      )}
      {systemNotification && (
        <SystemNotification
          title={systemNotification.title}
          body={systemNotification.body}
          onClose={() => setSystemNotification(null)}
        />
      )}

      <div className="flex-grow overflow-y-auto p-4 space-y-6 pb-28">
        {activeTab === "pantry" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-2 md:p-6 pb-24 md:pb-6 relative">
            
            {/* LEFT WORKSPACE (Takes 2 columns) */}
    <div className="md:col-span-2 space-y-4">
      {/* Profile Reminder Banner */}
      <IncompleteProfileBanner
        profile={userProfile}
        onCompleteProfile={() => setActiveTab("profile")}
      />

              

              {/* Receipt Scan & Voice Input Header Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                <label className="bg-indigo-600 rounded-2xl p-4 text-white shadow-xl relative overflow-hidden active:scale-95 transition-all cursor-pointer flex flex-col items-center justify-center text-center">
                  <Scan className="w-6 h-6 mb-2" />
                  <h2 className="text-sm font-bold">Scan Receipt</h2>
                  <input type="file" capture="environment" onChange={handleScan} className="hidden" />
                  <div className="absolute bottom-2 right-2 bg-black/20 backdrop-blur rounded px-2 py-0.5 text-[10px] font-bold">
                      {DAILY_API_LIMIT - apiUsage} left
                  </div>
                </label>
                <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm flex flex-col items-center justify-center relative">
                  <VoiceInputWidget 
                      onVoiceSubmit={handleVoiceInventorySubmit} 
                      isProcessing={loading && status === "Parsing speech..."} 
                  />
                </div>
              </div>


              {/* 👉 LANDMARK: Desktop Static Add Box (Hidden on Mobile) */}
                <div className="hidden md:block bg-white rounded-2xl p-4 border border-gray-200 shadow-sm mb-4">
                  <div className="flex justify-between items-center mb-3 border-b border-gray-100 pb-2">
                    <div className="flex items-center gap-2">
                      <Plus className="w-5 h-5 text-indigo-600" />
                      <span className="font-bold text-xs text-gray-800 uppercase">Add Inventory</span>
                    </div>
                    
                    <div className="flex bg-gray-100 p-0.5 rounded-lg text-[10px] font-bold">
                      <button
                        type="button"
                        onClick={() => setQuickAddTab("single")}
                        className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                          quickAddTab === "single" ? "bg-white shadow text-indigo-600" : "text-gray-500"
                        }`}
                      >
                        Single Item
                      </button>
                      <button
                        type="button"
                        onClick={() => setQuickAddTab("bulk")}
                        className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                          quickAddTab === "bulk" ? "bg-white shadow text-indigo-600" : "text-gray-500"
                        }`}
                      >
                        📋 Multiline Paste
                      </button>
                    </div>
                  </div>

                  {quickAddTab === "single" ? (
                    <form onSubmit={handleAddManual} className="space-y-2">
                      <input
                        value={newItemName}
                        onChange={(e) => setNewItemName(e.target.value)}
                        placeholder="Add item name..."
                        className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:border-indigo-500 outline-none"
                      />
                      <div className="grid grid-cols-3 gap-2">
                        <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-xl px-2">
                          <input
                            type="number"
                            value={newItemQty}
                            onChange={(e) => setNewItemQty(Number(e.target.value))}
                            className="w-10 text-xs text-center outline-none bg-transparent"
                          />
                          <select
                            value={newItemUnit}
                            onChange={(e) => setNewItemUnit(e.target.value)}
                            className="text-[10px] bg-transparent font-medium outline-none cursor-pointer flex-1"
                          >
                            {["pcs", "oz", "lb", "g", "kg", "cup", "ml", "l", "can", "box", "bag"].map((u) => (
                              <option key={u} value={u}>{u}</option>
                            ))}
                          </select>
                        </div>

                        <select
                          value={newItemCategory}
                          onChange={(e) => setNewItemCategory(e.target.value)}
                          className="text-xs bg-gray-50 border border-gray-200 rounded-xl px-2 py-2 outline-none cursor-pointer"
                        >
                          {["Produce", "Protein", "Dairy", "Grains", "Spices", "Canned", "Frozen", "Snacks", "Beverages", "Other"].map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>

                        <button
                          type="submit"
                          className="py-2 bg-indigo-600 text-white font-bold text-xs rounded-xl shadow-sm hover:bg-indigo-700 cursor-pointer"
                        >
                          ADD ITEM
                        </button>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[10px] font-bold text-gray-400 uppercase">Shelf Life Preset:</span>
                        <div className="flex gap-1.5">
                          {[
                            { label: "+3d", days: 3 },
                            { label: "+5d", days: 5 },
                            { label: "+1w", days: 7 },
                            { label: "+2w", days: 14 },
                          ].map((preset) => (
                            <button
                              key={preset.label}
                              type="button"
                              onClick={() => setNewItemExpiryDays(preset.days)}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                                newItemExpiryDays === preset.days
                                  ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                                  : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                              }`}
                            >
                              {preset.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </form>
                  ) : (
                    <form onSubmit={handleBulkAdd} className="space-y-2">
                      <p className="text-[10px] text-gray-400">Format each line as: <code className="bg-gray-100 p-0.5 rounded font-mono text-indigo-600">Item, Quantity, Expiration (e.g. 5d), Location</code></p>
                      <textarea
                        value={bulkText}
                        onChange={(e) => setBulkText(e.target.value)}
                        placeholder={`Milk, 1, 5d, Fridge\nChicken, 2, 3d, Freezer\nSpinach, 1, 4d, Fridge`}
                        className="w-full h-24 p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none resize-none font-mono"
                      />
                      <button
                        type="submit"
                        className="w-full py-2 bg-indigo-600 text-white font-bold text-xs rounded-xl shadow-md hover:bg-indigo-700 cursor-pointer"
                      >
                        Import All Lines
                      </button>
                    </form>
                  )}
                </div>

                {/* 👉 LANDMARK: Mobile Floating Action Button (FAB) */}
                <div className="md:hidden fixed right-6 bottom-20 z-40">
                  <button
                    onClick={() => setShowAddDrawer(true)}
                    className="w-14 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-2xl flex items-center justify-center transform active:scale-95 transition-all cursor-pointer"
                    title="Add to Pantry"
                  >
                    <Plus className="w-7 h-7" />
                  </button>
                </div>
                
                {/* 👉 LANDMARK: Mobile Collapsible Expanding Drawer Sheet */}
                {showAddDrawer && (
                  <div className="md:hidden fixed inset-0 bg-black/60 z-[90] flex items-end justify-center animate-in fade-in">
                    <div className="bg-white w-full max-w-lg rounded-t-3xl p-6 shadow-2xl space-y-4 animate-in slide-in-from-bottom max-h-[85vh] overflow-y-auto">
                      
                      <div className="flex justify-between items-center border-b pb-3">
                        <div className="flex items-center gap-2">
                          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                            <Plus className="w-5 h-5" />
                          </div>
                          <h3 className="font-black text-base text-gray-900">Add to Pantry</h3>
                        </div>
                        <button 
                          onClick={() => setShowAddDrawer(false)}
                          className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full cursor-pointer bg-gray-50"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      {/* Quick Action Grid (Scan Receipt & Voice) */}
                      <div className="grid grid-cols-2 gap-2">
                        <label className="bg-indigo-50 border border-indigo-100 p-3 rounded-2xl cursor-pointer flex flex-col items-center justify-center text-center hover:bg-indigo-100 transition-colors">
                          <Scan className="w-5 h-5 text-indigo-600 mb-1" />
                          <span className="text-xs font-bold text-indigo-900">Scan Receipt</span>
                          <span className="text-[9px] text-indigo-500">Auto-import items</span>
                          <input type="file" capture="environment" onChange={(e) => { handleScan(e); setShowAddDrawer(false); }} className="hidden" />
                        </label>

                        <div className="bg-purple-50 border border-purple-100 p-3 rounded-2xl flex flex-col items-center justify-center text-center">
                          <VoiceInputWidget 
                            onVoiceSubmit={(t) => { handleVoiceInventorySubmit(t); setShowAddDrawer(false); }} 
                            isProcessing={isVoiceProcessing} 
                            layout="compact" 
                          />
                          <span className="text-xs font-bold text-purple-900 mt-1">Voice Input</span>
                          <span className="text-[9px] text-purple-500">Speak items</span>
                        </div>
                      </div>

                      {/* Mode Switcher Tabs */}
                      <div className="flex bg-gray-100 p-1 rounded-xl text-xs font-bold">
                        <button
                          type="button"
                          onClick={() => setQuickAddTab("single")}
                          className={`flex-1 py-2 rounded-lg transition-all cursor-pointer ${
                            quickAddTab === "single" ? "bg-white shadow text-indigo-600" : "text-gray-500"
                          }`}
                        >
                          Single Item
                        </button>
                        <button
                          type="button"
                          onClick={() => setQuickAddTab("bulk")}
                          className={`flex-1 py-2 rounded-lg transition-all cursor-pointer ${
                            quickAddTab === "bulk" ? "bg-white shadow text-indigo-600" : "text-gray-500"
                          }`}
                        >
                          📋 Multiline Paste
                        </button>
                      </div>

                      {quickAddTab === "single" ? (
                        <form onSubmit={(e) => { handleAddManual(e); setShowAddDrawer(false); }} className="space-y-3">
                          <input
                            value={newItemName}
                            onChange={(e) => setNewItemName(e.target.value)}
                            placeholder="Add item name..."
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:border-indigo-500 outline-none"
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-xl px-2">
                              <input
                                type="number"
                                value={newItemQty}
                                onChange={(e) => setNewItemQty(Number(e.target.value))}
                                className="w-12 text-xs text-center outline-none bg-transparent py-2"
                              />
                              <select
                                value={newItemUnit}
                                onChange={(e) => setNewItemUnit(e.target.value)}
                                className="text-xs bg-transparent font-medium outline-none cursor-pointer flex-1 py-2"
                              >
                                {["pcs", "oz", "lb", "g", "kg", "cup", "ml", "l", "can", "box", "bag"].map((u) => (
                                  <option key={u} value={u}>{u}</option>
                                ))}
                              </select>
                            </div>

                            <select
                              value={newItemCategory}
                              onChange={(e) => setNewItemCategory(e.target.value)}
                              className="text-xs bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 outline-none cursor-pointer"
                            >
                              {["Produce", "Protein", "Dairy", "Grains", "Spices", "Canned", "Frozen", "Snacks", "Beverages", "Other"].map((c) => (
                                <option key={c} value={c}>{c}</option>
                              ))}
                            </select>
                          </div>

                          <div className="space-y-1.5 pt-1">
                            <span className="text-[10px] font-bold text-gray-400 uppercase">Shelf Life Preset:</span>
                            <div className="grid grid-cols-4 gap-1.5">
                              {[
                                { label: "+3d", days: 3 },
                                { label: "+5d", days: 5 },
                                { label: "+1w", days: 7 },
                                { label: "+2w", days: 14 },
                              ].map((preset) => (
                                <button
                                  key={preset.label}
                                  type="button"
                                  onClick={() => setNewItemExpiryDays(preset.days)}
                                  className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                                    newItemExpiryDays === preset.days
                                      ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                                      : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                                  }`}
                                >
                                  {preset.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          <button
                            type="submit"
                            className="w-full py-3.5 bg-indigo-600 text-white font-bold text-xs rounded-2xl shadow-md hover:bg-indigo-700 cursor-pointer"
                          >
                            Add to Pantry
                          </button>
                        </form>
                      ) : (
                        <form onSubmit={(e) => { handleBulkAdd(e); setShowAddDrawer(false); }} className="space-y-3">
                          <p className="text-[10px] text-gray-400">Format each line as: <code className="bg-gray-100 p-0.5 rounded font-mono text-indigo-600">Item, Quantity, Expiration (e.g. 5d), Location</code></p>
                          <textarea
                            value={bulkText}
                            onChange={(e) => setBulkText(e.target.value)}
                            placeholder={`Milk, 1, 5d, Fridge\nChicken, 2, 3d, Freezer\nSpinach, 1, 4d, Fridge`}
                            className="w-full h-32 p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none resize-none font-mono"
                          />
                          <button
                            type="submit"
                            className="w-full py-3.5 bg-indigo-600 text-white font-bold text-xs rounded-2xl shadow-md hover:bg-indigo-700 cursor-pointer"
                          >
                            Import All Lines
                          </button>
                        </form>
                      )}

                    </div>
                  </div>
                )}

              {/* Pantry List Header */}
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-gray-800">My Pantry</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPantryView(pantryView === "matrix" ? "list" : "matrix")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 border ${
                      pantryView === "matrix"
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "bg-indigo-50 text-indigo-600 border-indigo-100 hover:bg-indigo-100"
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" /> {pantryView === "matrix" ? "Exit Organizer" : "⚡ Organize Pantry"}
                  </button>
                  <button
                    onClick={handleAutoCategorize}
                    className="p-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 cursor-pointer"
                    title="Auto-Categorize"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Pantry Items Mapping */}
              {/* Pantry View Modes */}
              <div className="space-y-1 pb-4">
                {inventory.length ? (
                  pantryView === "matrix" ? (
                    /* BULK PANTRY ORGANIZER MATRIX VIEW */
                    <div className="bg-white rounded-2xl border border-gray-200 p-3 shadow-sm space-y-2 animate-in fade-in">
                      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1 flex justify-between">
                        <span>Item Name</span>
                        <span className="pr-12">Category / Location / Qty</span>
                      </div>
                      <div className="max-h-96 overflow-y-auto space-y-2 pr-1">
                        {inventory.map((item) => (
                          <div key={item.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-xl gap-2 border border-gray-100">
                            <span className="text-xs font-bold text-gray-800 truncate flex-1">{item.name}</span>
                            
                            {/* Category selector */}
                            <select
                              value={item.category || "Other"}
                              onChange={async (e) => {
                                await updateDoc(doc(db, `/artifacts/${appId}/users/${effectiveUserId}/inventory`, item.id), {
                                  category: e.target.value
                                });
                              }}
                              className="text-[10px] bg-white border border-gray-200 rounded-lg p-1 outline-none font-medium cursor-pointer"
                            >
                              {["Produce", "Protein", "Dairy", "Grains", "Spices", "Canned", "Frozen", "Snacks", "Beverages", "Other"].map((c) => (
                                <option key={c} value={c}>{c}</option>
                              ))}
                            </select>

                            {/* Location selector */}
                            <select
                              value={item.location || "Pantry"}
                              onChange={async (e) => {
                                await updateDoc(doc(db, `/artifacts/${appId}/users/${effectiveUserId}/inventory`, item.id), {
                                  location: e.target.value
                                });
                              }}
                              className="text-[10px] bg-white border border-gray-200 rounded-lg p-1 outline-none font-medium cursor-pointer"
                            >
                              <option>Pantry</option>
                              <option>Fridge</option>
                              <option>Freezer</option>
                            </select>

                            {/* Quantity Stepper */}
                            <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-0.5">
                              <button
                                onClick={() => handleUpdateQty(item.id, -1)}
                                className="w-5 h-5 flex items-center justify-center text-xs font-bold text-gray-500 hover:bg-gray-100 rounded cursor-pointer"
                              >-</button>
                              <span className="text-xs font-mono font-bold w-4 text-center">{item.quantity}</span>
                              <button
                                onClick={() => handleUpdateQty(item.id, 1)}
                                className="w-5 h-5 flex items-center justify-center text-xs font-bold text-gray-500 hover:bg-gray-100 rounded cursor-pointer"
                              >+</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    /* Category Grouped List View */
                    Object.entries(groupedInventory).map(([category, items]) => (
                      <div key={category} className="space-y-2">
                        <div className="flex items-center justify-between px-1 pt-2">
                          <h4 className="font-black text-xs text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                            <Layers className="w-3.5 h-3.5 text-indigo-500" /> {category} ({items.length})
                          </h4>
                        </div>
                        <div className="space-y-1">
                          {items.map((item) => (
                            <InventoryItem
                              key={item.id}
                              item={item}
                              onUpdateQty={handleUpdateQty}
                              onDelete={async (id) =>
                                deleteDoc(doc(db, `/artifacts/${appId}/users/${effectiveUserId}/inventory`, id))
                              }
                              onUpdate={handleUpdateItem}
                              onFindRecipes={(name) => handleGetAIRecipes(name)}
                            />
                          ))}
                        </div>
                      </div>
                    ))
                  )
                ) : (
                  <div className="p-16 text-center text-gray-400 text-sm bg-white rounded-3xl border border-gray-200 border-dashed">
                    Pantry Empty
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT SIDEBAR WIDGET COLUMN */}
            <div className="hidden md:block space-y-4">
                <ChallengeWidget
                  challenges={userProfile.challenges}
                  onViewAll={() => setActiveTab("profile")}
                />
              
              <PantryValuationCard inventory={inventory} />

              {/* 👉 LANDMARK: Animated & Auto-Rotating Quick Tips Widget (#64) */}
              <div 
                onMouseEnter={() => setIsTipPaused(true)}
                onMouseLeave={() => setIsTipPaused(false)}
                className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-3 relative overflow-hidden group"
              >
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-indigo-600" /> Quick Tips
                  </h4>
                  <span className="text-[9px] font-bold bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    {currentTip.category}
                  </span>
                </div>
                
                <p className={`text-xs text-gray-500 leading-relaxed min-h-[42px] transition-all duration-300 transform ${
                  isTipAnimating ? "opacity-0 -translate-y-2" : "opacity-100 translate-y-0"
                }`}>
                  "{currentTip.text}"
                </p>

                <button
                  onClick={handleRotateTip}
                  className="w-full py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-xl text-[10px] font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 border border-gray-200/60"
                >
                  <RefreshCw className="w-3 h-3 text-indigo-500" /> Next Tip
                </button>
              </div>
            </div>

          </div>
        )}

        {activeTab === "recipes" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-2 md:p-6">
            
            {/* LEFT WORKSPACE (Takes 2 columns on desktop) */}
            <div className="md:col-span-2 space-y-4">
              <div className="flex bg-gray-100 p-1 rounded-xl">
                <button
                  onClick={() => setRecipeView("discover")}
                  className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                    recipeView === "discover"
                      ? "bg-white shadow text-indigo-600"
                      : "text-gray-500 cursor-pointer"
                  }`}
                >
                  Discover
                </button>
                <button
                  onClick={() => setRecipeView("plan")}
                  className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                    recipeView === "plan"
                      ? "bg-white shadow text-indigo-600"
                      : "text-gray-500 cursor-pointer"
                  }`}
                >
                  Meal Plan
                </button>
                <button
                  onClick={() => setRecipeView("saved")}
                  className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                    recipeView === "saved"
                      ? "bg-white shadow text-indigo-600"
                      : "text-gray-500 cursor-pointer"
                  }`}
                >
                  Saved
                </button>
              </div>
              {recipeView === "discover" && (
                <>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleGetAIRecipes()}
                      placeholder="Search recipes..."
                      className="w-full pl-9 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:border-indigo-500 outline-none"
                    />
                  </div>
                  <button
                    onClick={() => setShowMealPrep(true)}
                    className="w-full py-3 bg-gradient-to-r from-green-500 to-teal-600 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg mb-2 cursor-pointer"
                  >
                    <LayoutGrid className="w-4 h-4" /> Smart Meal Prep Mode
                  </button>
                  {/* NEW: Import from URL Button */}
                  <button
                    onClick={() => setShowIngestModal(true)}
                    className="w-full py-3 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm mb-4 hover:bg-indigo-100 transition-colors cursor-pointer"
                  >
                    <LinkIcon className="w-4 h-4" /> Import Recipe from URL
                  </button>
                  <div className="space-y-3">
                    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                      <select
                        onChange={(e) =>
                          setActiveFilters((p) => ({
                            ...p,
                            cuisine: e.target.value,
                          }))
                        }
                        className="px-3 py-1.5 bg-white border border-gray-200 rounded-full text-xs font-bold text-gray-600 outline-none cursor-pointer"
                      >
                        <option value="">All Cuisines</option>
                        {[
                          "American",
                          "Mexican",
                          "Italian",
                          "Asian",
                          "Indian",
                          "Mediterranean",
                          "Thai",          
                          "Caribbean",     
                          "French",
                          "Chinese",
                          "Greek",
                          "German",
                          "Filipino",
                          "Japanese",
                        ].map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                      {filterOptions.proteins.map((p) => (
                        <button
                          key={p}
                          onClick={() => toggleFilter("proteins", p)}
                          className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold border cursor-pointer ${
                            activeFilters.proteins.includes(p)
                              ? "bg-indigo-100 text-indigo-700 border-indigo-200"
                              : "bg-white text-gray-600 border-gray-200"
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                      {filterOptions.vegetables.map((v) => (
                        <button
                          key={v}
                          onClick={() => toggleFilter("vegetables", v)}
                          className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold border cursor-pointer ${
                            activeFilters.vegetables.includes(v)
                              ? "bg-green-100 text-green-700 border-green-200"
                              : "bg-white text-gray-600 border-gray-200"
                          }`}
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Advanced Recipe Search & Generation Filters Toolbar */}
                  <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                        <FilterIcon className="w-3.5 h-3.5 text-indigo-600" /> Advanced Filters
                      </span>
                      <button
                        onClick={() => setActiveFilters({ proteins: [], vegetables: [], cuisine: "", mealType: "Any", maxCalories: 800, maxCost: 20, ignoreHistory: false })}
                        className="text-[10px] text-gray-400 hover:text-gray-600 font-bold cursor-pointer"
                      >
                        Reset
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {/* Meal Type Selector */}
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-gray-400 uppercase">Meal Type</label>
                        <select
                          value={activeFilters.mealType}
                          onChange={(e) => setActiveFilters({ ...activeFilters, mealType: e.target.value })}
                          className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium outline-none cursor-pointer"
                        >
                          {["Any", "Breakfast", "Lunch", "Dinner", "Snack"].map((m) => (
                            <option key={m} value={m}>{m}</option>
                          ))}
                        </select>
                      </div>

                      {/* Calorie Cap Slider */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[9px] font-bold text-gray-400 uppercase">
                          <span>Max Cals</span>
                          <span className="text-indigo-600 font-mono">{activeFilters.maxCalories} kcal</span>
                        </div>
                        <input
                          type="range"
                          min="300"
                          max="1200"
                          step="50"
                          value={activeFilters.maxCalories}
                          onChange={(e) => setActiveFilters({ ...activeFilters, maxCalories: parseInt(e.target.value) })}
                          className="w-full accent-indigo-600 h-1 bg-gray-200 rounded-lg cursor-pointer mt-2"
                        />
                      </div>

                      {/* Anti-Repeat History Override Toggle */}
                      <div className="flex flex-col justify-end">
                        <label className="flex items-center gap-2 p-2 bg-gray-50 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                          <input
                            type="checkbox"
                            checked={activeFilters.ignoreHistory}
                            onChange={(e) => setActiveFilters({ ...activeFilters, ignoreHistory: e.target.checked })}
                            className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 cursor-pointer"
                          />
                          <span className="text-[10px] font-bold text-gray-700 leading-tight">Allow Recent Favorites</span>
                        </label>
                      </div>
                    </div>
                  </div>
                  {recentlyViewed.length > 0 && (
                    <div className="mb-2">
                      <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 px-1">
                        Recently Viewed
                      </h3>
                      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                        {recentlyViewed.map((r) => (
                          <div
                            key={r.id}
                            className="min-w-[200px]"
                            onClick={() => handleSetActiveRecipe(r)}
                          >
                            <div className="p-3 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center gap-3 cursor-pointer hover:shadow-md">
                              {r.image ? (
                                <img
                                  src={r.image}
                                  className="w-10 h-10 rounded-lg object-cover"
                                />
                              ) : (
                                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                  <CookingPot className="w-5 h-5 text-gray-400" />
                                </div>
                              )}
                              <p className="text-xs font-bold text-gray-700 truncate flex-1">
                                {r.title}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleGetAIRecipes("recipe")}
                      className="py-3 bg-indigo-600 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg cursor-pointer"
                    >
                      <Zap className="w-4 h-4" /> Generate Recipes{" "}
                      <span className="ml-1 bg-white/20 px-1.5 rounded text-[10px]">
                        {DAILY_API_LIMIT - apiUsage} left
                      </span>
                    </button>
                    <button
                      onClick={() => handleGetAIRecipes("meal")}
                      className="py-3 bg-indigo-500 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg cursor-pointer"
                    >
                      <Utensils className="w-4 h-4" /> Generate Meals
                    </button>
                  </div>

                  {/* DESKTOP 2-COLUMN RECIPE GRID */}
                  {/* 👉 CATEGORIZED HYBRID RESULTS SECTIONS (#34) */}
                  {(() => {
                    const allDiscoverRecipes = [...aiRecipes, ...communityRecipes];
                    const perfectMatches = allDiscoverRecipes.filter(r => calculatePantryMatch(r.allIngredients, inventory) === 100);
                    const quickMatches = allDiscoverRecipes.filter(r => {
                      const m = calculatePantryMatch(r.allIngredients, inventory);
                      return m >= 50 && m < 100;
                    });
                    const otherDiscoveries = allDiscoverRecipes.filter(r => calculatePantryMatch(r.allIngredients, inventory) < 50);

                    return (
                      <div className="space-y-6 pt-2">
                        {perfectMatches.length > 0 && (
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                              <CheckCircle className="w-4 h-4 text-green-600" />
                              <h4 className="font-black text-xs text-green-800 uppercase tracking-wider">
                                Ready to Cook (100% Pantry Match)
                              </h4>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              {perfectMatches.map((r) => (
                                <RecipeCard
                                  key={r.id}
                                  recipe={{ ...r, matchPercentage: 100 }}
                                  onClick={() => handleSetActiveRecipe(r)}
                                  onAddToPlan={handleAddToPlan}
                                  isSaved={savedRecipes.some((s) => s.title === r.title)}
                                  onToggleSave={handleToggleSave}
                                  onVote={handleVote}
                                  userNote={recipeNotes[r.id || r.firestoreId]}
                                />
                              ))}
                            </div>
                          </div>
                        )}

                        {quickMatches.length > 0 && (
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                              <Zap className="w-4 h-4 text-amber-500" />
                              <h4 className="font-black text-xs text-amber-800 uppercase tracking-wider">
                                Quick Match (Need 1–2 Items)
                              </h4>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              {quickMatches.map((r) => (
                                <RecipeCard
                                  key={r.id}
                                  recipe={{ ...r, matchPercentage: calculatePantryMatch(r.allIngredients, inventory) }}
                                  onClick={() => handleSetActiveRecipe(r)}
                                  onAddToPlan={handleAddToPlan}
                                  isSaved={savedRecipes.some((s) => s.title === r.title)}
                                  onToggleSave={handleToggleSave}
                                  onVote={handleVote}
                                  userNote={recipeNotes[r.id || r.firestoreId]}
                                />
                              ))}
                            </div>
                          </div>
                        )}

                        {otherDiscoveries.length > 0 && (
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                              <Zap className="w-4 h-4 text-indigo-600" />
                              <h4 className="font-black text-xs text-indigo-800 uppercase tracking-wider">
                                AI Discovery & Web Results
                              </h4>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              {otherDiscoveries.map((r) => (
                                <RecipeCard
                                  key={r.id}
                                  recipe={{ ...r, matchPercentage: calculatePantryMatch(r.allIngredients, inventory) }}
                                  onClick={() => handleSetActiveRecipe(r)}
                                  onAddToPlan={handleAddToPlan}
                                  isSaved={savedRecipes.some((s) => s.title === r.title)}
                                  onToggleSave={handleToggleSave}
                                  onVote={handleVote}
                                  userNote={recipeNotes[r.id || r.firestoreId]}
                                />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  <h3 className="font-bold text-gray-400 text-xs uppercase tracking-widest mt-6">
                    Community
                  </h3>
                  
                  {/* DESKTOP 2-COLUMN COMMUNITY RECIPE GRID */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    {communityRecipes.map((r, index) => {
                      const authorUser = DEMO_USERS.find(
                        (u) => u.id === r.createdBy
                      ) || {
                        name: r.authorName,
                        image: r.authorImage,
                        role: "Community Chef",
                        profile: { challenges: {} },
                        isCreator: false,
                        isBrand: false,
                      };

                      return (
                        <React.Fragment key={r.id}>
                          <RecipeCard
                            recipe={{
                              ...r,
                              matchPercentage: calculateMatch(r.allIngredients),
                            }}
                            isUserRecipe
                            onClick={() =>
                              handleSetActiveRecipe({
                                ...r,
                                matchPercentage: calculateMatch(r.allIngredients),
                              })
                            }
                            onAddToPlan={handleAddToPlan}
                            isSaved={savedRecipes.some((s) => s.title === r.title)}
                            onToggleSave={handleToggleSave}
                            onVote={handleVote}
                            onAuthorClick={() => setViewingProfile(authorUser)}
                          />
                          {(index + 1) % 5 === 0 && <NativeAd />}
                        </React.Fragment>
                      );
                    })}
                  </div>
                </>
              )}
              {recipeView === "plan" && (
                <MealPlanner
                  plan={mealPlan}
                  onAddMeal={() => {}}
                  onDeleteMeal={handleDeleteMeal}
                  onGenerateDayPlan={(day) => {
                    // Triggers AI meal generation using current inventory
                    handleGetAIRecipes("meal");
                  }}
                  onPlanExpiring={(day) => {
                    // Filters for expiring inventory items and runs AI search
                    const expiring = inventory.filter((i) => {
                      const expiry = i.expiryDate?.toDate ? i.expiryDate.toDate() : new Date();
                      const daysLeft = Math.ceil((expiry - new Date()) / (1000 * 60 * 60 * 24));
                      return daysLeft <= 3;
                    });
                    const topExpiring = expiring.map((i) => i.name).join(", ");
                    setSearchQuery(topExpiring || "expiring items");
                    handleGetAIRecipes("recipe");
                  }}
                  onBrowseRecipes={() => {
                    setRecipeView("discover");
                  }}
                />
              )}
              {recipeView === "saved" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {savedRecipes.length > 0 ? (
                    savedRecipes.map((r) => (
                      <RecipeCard
                        key={r.firestoreId}
                        recipe={r}
                        isUserRecipe={!r.isAI && !r.isDB}
                        onClick={() => handleSetActiveRecipe(r)}
                        onAddToPlan={handleAddToPlan}
                        isSaved={true}
                        onToggleSave={handleToggleSave}
                        onVote={handleVote}
                        userNote={recipeNotes[r.id || r.firestoreId]} //pass private note
                      />
                    ))
                  ) : (
                    <div className="col-span-2 text-center py-12 text-gray-400">
                      <p className="text-sm">No saved recipes yet.</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* RIGHT SIDEBAR WIDGET COLUMN (Visible on desktop/tablet only) */}
            <div className="hidden md:block space-y-4">
              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                <h4 className="font-bold text-gray-900 text-sm mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-indigo-600" /> Active Meal Plan
                </h4>
                {mealPlan.length > 0 ? (
                  <div className="space-y-2">
                    {mealPlan.slice(0, 4).map((m, idx) => (
                      <div key={idx} className="text-xs bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                        <span className="font-bold text-indigo-600 block">{m.day} - {m.type}</span>
                        <span className="text-gray-700 font-medium truncate block">{m.recipeTitle}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400">No meals scheduled for this week yet.</p>
                )}
              </div>

              <NutritionReportView 
              nutritionLogs={nutritionLogs}
              onDeleteLog={handleDeleteNutritionLog}
              userProfile={userProfile}
            />

              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                <h4 className="font-bold text-gray-900 text-sm mb-3 flex items-center gap-2">
                  <Flame className="w-4 h-4 text-orange-500" /> Quick Challenge
                </h4>
                <ChallengeWidget
                  challenges={userProfile.challenges}
                  onViewAll={() => setActiveTab("profile")}
                />
              </div>
            </div>

          </div>
        )}

        {activeTab === "shopping" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-2 md:p-6">
            
            {/* LEFT WORKSPACE (Takes 2 columns) */}
            <div className="md:col-span-2 space-y-4">
              <h3 className="font-bold text-gray-800 text-base">Shopping List</h3>
              
              <div className="flex gap-2 relative">
                <div className="relative flex-1">
                  <input
                    value={groceryInput}
                    onChange={(e) => setGroceryInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addToGroceryList(groceryInput)}
                    placeholder="Add item to list..."
                    className="w-full p-3 pl-9 bg-white border border-gray-200 rounded-xl text-sm focus:border-indigo-500 outline-none shadow-sm"
                  />
                  <Plus className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                  {grocerySuggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 bg-white border border-gray-100 rounded-xl shadow-lg mt-1 z-20">
                      {grocerySuggestions.map((s, i) => (
                        <button
                          key={i}
                          onClick={() => addToGroceryList(s)}
                          className="w-full text-left p-3 hover:bg-gray-50 text-sm border-b border-gray-50 last:border-0 cursor-pointer"
                        >
                          <span className="font-bold text-indigo-600">+</span> {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <VoiceInputWidget 
                  onVoiceSubmit={handleVoiceShoppingSubmit} 
                  isProcessing={isVoiceProcessing} 
                  layout="compact" 
                />
              </div>

              {smartGrocerySuggestions.length > 0 && (
                <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100">
                  <h3 className="font-bold text-indigo-800 text-xs uppercase mb-2 flex items-center gap-2">
                    <RefreshCw className="w-3 h-3" /> Based on what you like
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {smartGrocerySuggestions.map((s, i) => (
                      <button
                        key={i}
                        onClick={() => addToGroceryList(s)}
                        className="px-3 py-1 bg-white text-indigo-600 rounded-full text-xs font-bold shadow-sm border border-indigo-100 flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" /> {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                {groceryList.filter((i) => !i.purchased).map((item) => {
                  const lastBuy = getLastPrice(item.name);

                  const existingPantryItem = inventory.find((inv) =>
                    inv.name.toLowerCase().includes(item.name.toLowerCase()) ||
                    item.name.toLowerCase().includes(inv.name.toLowerCase())
                  );

                  return (
                    <div
                      key={item.id}
                      className="flex justify-between items-center p-3.5 border-b border-gray-100 last:border-0 group hover:bg-gray-50/50"
                    >
                      <div className="flex items-center gap-3">
                        <button onClick={() => toggleGroceryItem(item.id, item.purchased)} className="cursor-pointer">
                          <Square className="w-5 h-5 text-indigo-500" />
                        </button>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-800">{item.name}</span>
                            
                            {/* 👉 Pantry Stock Badge Warning */}
                            {existingPantryItem && (
                              <span className="text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <CheckCircle className="w-2.5 h-2.5" /> In Pantry ({existingPantryItem.quantity} {existingPantryItem.unit})
                              </span>
                            )}
                          </div>
                          {lastBuy && (
                            <span className="text-[10px] text-gray-400">
                              Last paid: ${lastBuy.price} on {lastBuy.date.toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleFindDeals(item.name)}
                          className="text-[10px] font-bold text-blue-500 bg-blue-50 px-2.5 py-1 rounded-lg cursor-pointer"
                        >
                          Find Deal
                        </button>
                        <button onClick={() => deleteGroceryItem(item.id)} className="cursor-pointer">
                          <Trash2 className="w-4 h-4 text-red-200 hover:text-red-500" />
                        </button>
                      </div>
                    </div>
                  );
                })}

                {groceryList.some((i) => i.purchased) && (
                  <div className="bg-gray-50 border-t border-gray-200">
                    <div className="p-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-center">
                      Ready to Checkout
                    </div>
                    {groceryList.filter((i) => i.purchased).map((item) => (
                      <div
                        key={item.id}
                        className="flex justify-between items-center p-3 border-b border-gray-200 last:border-0 opacity-50"
                      >
                        <div className="flex items-center gap-3">
                          <button onClick={() => toggleGroceryItem(item.id, item.purchased)} className="cursor-pointer">
                            <CheckSquare className="w-5 h-5 text-green-500" />
                          </button>
                          <span className="text-sm font-medium line-through text-gray-800">{item.name}</span>
                        </div>
                        <button onClick={() => deleteGroceryItem(item.id)} className="cursor-pointer">
                          <Trash2 className="w-4 h-4 text-gray-400" />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => setShowCheckout(true)}
                      className="w-full py-3 bg-green-600 text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-green-700 transition-colors cursor-pointer"
                    >
                      Checkout Selected <DollarSign className="w-4 h-4" />
                    </button>
                  </div>
                )}
                {groceryList.length === 0 && (
                  <p className="p-12 text-center text-xs text-gray-400">Your shopping list is empty.</p>
                )}
              </div>
            </div>

            {/* RIGHT SIDEBAR WIDGET COLUMN (Partner Store Quick Links) */}
            <div className="hidden md:block space-y-4">
              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-3">
                <h4 className="font-bold text-gray-900 text-sm mb-2 flex items-center gap-2">
                  <Store className="w-4 h-4 text-indigo-600" /> Shop Online Partners
                </h4>
                
                <button
                  onClick={() =>
                    setRedirectModalData({
                      title: "Walmart",
                      url: `https://www.walmart.com/search?q=${encodeURIComponent(
                        groceryList.filter((i) => !i.purchased).map((g) => g.name).join(" ")
                      )}`,
                      sponsorTag: "Grocery Partner",
                      description: "Compare prices and schedule contactless delivery directly with Walmart."
                    })
                  }
                  className="w-full py-3 bg-[#0071dc] text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm hover:opacity-95 transition-opacity cursor-pointer"
                >
                  <Store className="w-4 h-4" /> Walmart Delivery
                </button>
                <button
                  onClick={() =>
                    setRedirectModalData({
                      title: "Instacart",
                      url: `https://www.instacart.com/store/s?k=${encodeURIComponent(
                        groceryList.filter((i) => !i.purchased).map((g) => g.name).join(", ")
                      )}`,
                      sponsorTag: "Delivery Partner",
                      description: "Sync your shopping cart items seamlessly with local grocery couriers."
                    })
                  }
                  className="w-full py-3 bg-[#e8f5e9] border border-green-600 text-green-700 rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-green-50 transition-colors cursor-pointer"
                >
                  <ShoppingCart className="w-4 h-4" /> Instacart
                </button>
                <button
                  onClick={() =>
                    setRedirectModalData({
                      title: "Amazon Fresh",
                      url: `https://www.amazon.com/s?k=${encodeURIComponent(
                        groceryList.filter((i) => !i.purchased).map((g) => g.name).join(", ")
                      )}&i=amazonfresh`,
                      sponsorTag: "Delivery Partner",
                      description: "Order fresh groceries and pantry staples directly through Amazon Fresh."
                    })
                  }
                  className="w-full py-3 bg-[#232f3e] text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-black transition-colors cursor-pointer"
                >
                  <Package className="w-4 h-4" /> Amazon Fresh
                </button>
              </div>
            </div>

          </div>
        )}
        {activeTab === "budget" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-2 md:p-6">
            
            {/* LEFT WORKSPACE (Takes 2 columns) */}
            <div className="md:col-span-2 space-y-6">
              <BudgetScreen 
                history={purchaseHistory} 
                wasteHistory={wasteHistory} 
                inventory={inventory} 
              />
            </div>

            {/* RIGHT SIDEBAR WIDGET COLUMN */}
            <div className="hidden md:block space-y-4">
              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                <h4 className="font-bold text-gray-900 text-sm mb-3 flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-green-600" /> Savings Insights
                </h4>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Track your monthly spend against your goals. Logging spoiled items helps the AI generate zero-waste meal plans tailored to your consumption habits.
                </p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                <h4 className="font-bold text-gray-900 text-sm mb-3 flex items-center gap-2">
                  <Flame className="w-4 h-4 text-orange-500" /> Active Goal
                </h4>
                <ChallengeWidget
                  challenges={userProfile.challenges}
                  onViewAll={() => setActiveTab("profile")}
                />
              </div>
            </div>

          </div>
        )}
        {activeTab === "community" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-2 md:p-6">
            
            {/* LEFT WORKSPACE: Community Feed & Search (Takes 2 columns) */}
            <div className="md:col-span-2 space-y-4">
              {/* Community Tab Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <input
                  value={communitySearchQuery}
                  onChange={(e) => setCommunitySearchQuery(e.target.value)}
                  placeholder="Find Chefs or Recipes..."
                  className="w-full pl-9 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:border-indigo-500 outline-none shadow-sm"
                />
                {communitySearchQuery && (
                  <button 
                    onClick={() => setCommunitySearchQuery("")}
                    className="absolute right-3 top-3.5 text-xs text-gray-400 hover:text-gray-600 font-bold cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>
              <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wider pt-2">Community Feed</h3>

              {/* Filtered Community Recipe Mapping */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {communityRecipes
                  .filter((r) => {
                    if (!communitySearchQuery.trim()) return true;
                    const query = communitySearchQuery.toLowerCase();
                    const titleMatch = r.title?.toLowerCase().includes(query) || false;
                    const descMatch = r.description?.toLowerCase().includes(query) || false;
                    const authorMatch = r.authorName?.toLowerCase().includes(query) || false;
                    return titleMatch || descMatch || authorMatch;
                  })
                  .map((r, index) => {
                    const authorUser = DEMO_USERS.find(
                      (u) => u.id === r.createdBy
                    ) || {
                      name: r.authorName || "Community Chef",
                      image: r.authorImage,
                      role: "Community Chef",
                      profile: { challenges: {} },
                      isCreator: false,
                      isBrand: false,
                    };

                    return (
                      <React.Fragment key={r.id}>
                        <RecipeCard
                          recipe={{
                            ...r,
                            matchPercentage: calculateMatch(r.allIngredients),
                          }}
                          isUserRecipe
                          onClick={() =>
                            handleSetActiveRecipe({
                              ...r,
                              matchPercentage: calculateMatch(r.allIngredients),
                            })
                          }
                          onAddToPlan={handleAddToPlan}
                          isSaved={savedRecipes.some((s) => s.title === r.title)}
                          onToggleSave={handleToggleSave}
                          onVote={handleVote}
                          onAuthorClick={() => setViewingProfile(authorUser)}
                        />
                        {(index + 1) % 5 === 0 && <NativeAd />}
                      </React.Fragment>
                    );
                  })}
              </div>
            </div>

            {/* RIGHT SIDEBAR WORKSPACE: Share Recipe Form (Takes 1 column on desktop) */}
            <div className="space-y-4">
              <div className="bg-indigo-600 p-6 rounded-3xl text-white shadow-xl sticky top-4 text-center space-y-3">
                <h3 className="font-black text-xl mb-1">Got a Recipe to Share?</h3>
                <p className="text-xs text-indigo-100">Publish your own creations, tag ingredients, and share with the community feed.</p>
                <button
                  onClick={() => setShowShareModal(true)}
                  className="w-full py-3.5 bg-white text-indigo-600 font-bold rounded-xl text-xs hover:bg-indigo-50 shadow-sm cursor-pointer transition-all"
                >
                  ✨ Open Share Studio
                </button>
              </div>
            </div>

          </div>
        )}
        {/* LANDMARK: Tools View Block */}
        {activeTab === "tools" && <ToolsView />}

        {/* LANDMARK: Profile / Settings View Block */}
        {activeTab === "profile" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-2 md:p-6 max-w-7xl mx-auto">
          {/* Left Main Content Column (Takes 2/3 width) */}
          <div className="md:col-span-2 space-y-6">
            <ToolsScreen
              profile={userProfile}
              onSaveProfile={handleSaveProfile}
              isAdmin={isAdmin}
              onToggleAdmin={handleAdminToggle}
              isDemoAuthenticated={isDemoAuthenticated}
              onShowLogin={() => setShowLoginModal(true)}
              onRestartTour={() => setShowOnboarding(true)}
              onOpenGuidelines={() => setShowGuidelinesModal(true)}
              onOpenLegal={() => setShowLegalModal(true)}
            />

            {/* Cooked Nutrition Analytics Report View */}
            <NutritionReportView 
              nutritionLogs={nutritionLogs}
              onDeleteLog={handleDeleteNutritionLog}
              userProfile={userProfile}
            />
          </div>

          {/* Right Sidebar Column: Sticky Trophy Case */}
          <div className="hidden md:block space-y-6">
            <div className="sticky top-20 bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-indigo-600" /> Trophy Case Overview
                </h4>
                <span className="text-[10px] font-mono font-bold bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">
                  {Object.keys(userProfile?.challenges || {}).length} Unlocked
                </span>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                Complete kitchen challenges to unlock badges and level up your status.
              </p>

              {/* Vertical List of Trophies for Right Sidebar */}
              <div className="space-y-2.5 max-h-[calc(100vh-220px)] overflow-y-auto pr-1 no-scrollbar">
                {CHALLENGES.map((c) => {
                  const current = (userProfile?.challenges || {})[c.id] || 0;
                  const percent = Math.min((current / c.target) * 100, 100);
                  const isUnlocked = percent >= 100;
                  return (
                    <div
                      key={c.id}
                      className="bg-gray-50 p-3 rounded-2xl border border-gray-100 flex items-center gap-3 transition-all"
                    >
                      <div
                        className={`p-2.5 rounded-full shrink-0 ${
                          isUnlocked
                            ? "bg-indigo-100 text-indigo-600 shadow-xs"
                            : "bg-gray-200 text-gray-400"
                        }`}
                      >
                        {c.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-1">
                          <h5 className="font-bold text-xs text-gray-800 truncate">
                            {c.title}
                          </h5>
                          <span className="text-[9px] font-mono text-gray-400">
                            {current}/{c.target}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full transition-all duration-500 ${
                              isUnlocked ? "bg-indigo-500" : "bg-gray-400"
                            }`}
                            style={{ width: `${percent}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}


        {activeTab === "admin" && isAdmin && (
          <div className="grid grid-cols-1 gap-6 p-2 md:p-6">
            <div className="space-y-6">
              <AdminDashboard
                userData={userProfile}
                allMetrics={{}}
                onSeed={seedCommunity}
                onPurge={purgeTestData}
                onImpersonate={handleImpersonate}
                effectiveUserId={effectiveUserId}
                communityRecipes={communityRecipes}
                setActiveTab={setActiveTab}
                isAdmin={isAdmin}
              />
            </div>
          </div>
        )}
      </div>
      
      {/* NEW: Recipe Ingest Modal */}
      {showIngestModal && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-black text-lg text-gray-900 flex items-center gap-2">
                <LinkIcon className="w-5 h-5 text-indigo-600" /> Paste Recipe Link
              </h3>
              <button onClick={() => setShowIngestModal(false)} className="p-1 hover:bg-gray-100 rounded-full cursor-pointer">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <p className="text-xs text-gray-500 mb-4">
              Paste a link from a food blog, YouTube, TikTok, or Instagram. Our AI chef will read it, skip the life story, and extract the recipe for you.
            </p>
            <form onSubmit={handleUrlIngest} className="space-y-4">
              <input
                type="url"
                value={ingestUrl}
                onChange={(e) => setIngestUrl(e.target.value)}
                placeholder="https://..."
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:border-indigo-500 outline-none"
                required
              />
              <button
                type="submit"
                disabled={isIngesting}
                className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isIngesting ? <Loader className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                {isIngesting ? "Extracting Recipe..." : "Import Recipe"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* NEW: Feedback Modal */}
      {showFeedbackModal && (
        <FeedbackModal
          onClose={() => setShowFeedbackModal(false)}
          effectiveUserId={effectiveUserId}
          db={db}
          appId={appId}
        />
      )}

      {/* Onboarding Modal Call with Active Handlers */}
      <OnboardingModal
        isOpen={showOnboarding}
        onClose={() => {
          setShowOnboarding(false);
          localStorage.setItem("pantry_chef_onboarded", "true");
        }}
        onSavePreferences={(prefs) => {
          const updated = { ...userProfile, ...prefs };
          setUserProfile(updated);
          handleSaveProfile(updated);
          localStorage.setItem("pantry_chef_onboarded", "true");
        }}
        onAddToPantry={handleAddToPantry}
        onScanReceipt={handleScan}
      />

      {/* Render as a layered overlay on top of the main UI */}
      {showMealPrep && (
        <MealPrepView 
          onClose={() => setShowMealPrep(false)} 
          recipes={aiRecipes || communityRecipes || []}
          pantryItems={inventory || []}
          onScheduleMeal={(prepData) => {
            console.log("Meal Prep Scheduled:", prepData);
          }}
          onAddToInventory={async (preppedItem) => {
            try {
              await addDoc(collection(db, `/artifacts/${appId}/users/${effectiveUserId}/inventory`), {
                ...preppedItem,
                expiryDate: getTimestampInDays(5),
                timestamp: serverTimestamp(),
              });
            } catch (e) {
              console.error("Error syncing to inventory:", e);
            }
          }}
        />
      )}

      {showShareModal && (
        <ShareModal
          onClose={() => setShowShareModal(false)}
          userProfile={userProfile}
          pantryItems={inventory || []}
          onSubmitRecipe={async (recipeData) => {
            await addDoc(
              collection(db, `/artifacts/${appId}/public/data/userRecipes`),
              {
                ...recipeData,
                createdAt: serverTimestamp(),
                createdBy: effectiveUserId,
                likeCount: 0,
                isAI: false,
              }
            );
          }}
        />
      )}

      <BrandedRedirectModal
        isOpen={!!redirectModalData}
        onClose={() => setRedirectModalData(null)}
        partnerData={redirectModalData}
      />



      {/* Desktop Left Sidebar Navigation */}
      <nav className="hidden md:flex flex-col fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-gray-200 p-6 z-30 shadow-sm">
        <div className="flex items-center gap-2 mb-8">
          <div className="p-2 bg-indigo-600 rounded-lg">
            <Utensils className="text-white w-5 h-5" />
          </div>
          <h1 className="text-xl font-black text-gray-900 tracking-tight">Pantry Chef</h1>
        </div>
        
        <div className="space-y-2 flex-1">
          <button onClick={() => setActiveTab("pantry")} className={`w-full flex items-center gap-3 p-3 rounded-xl font-bold text-sm ${activeTab === "pantry" ? "bg-indigo-50 text-indigo-600" : "text-gray-500 hover:bg-gray-50 cursor-pointer"}`}>
            <Home className="w-5 h-5" /> Pantry
          </button>
          <button onClick={() => setActiveTab("recipes")} className={`w-full flex items-center gap-3 p-3 rounded-xl font-bold text-sm ${activeTab === "recipes" ? "bg-indigo-50 text-indigo-600" : "text-gray-500 hover:bg-gray-50 cursor-pointer"}`}>
            <CookingPot className="w-5 h-5" /> Cook
          </button>
          <button onClick={() => setActiveTab("shopping")} className={`w-full flex items-center justify-between p-3 rounded-xl font-bold text-sm ${activeTab === "shopping" ? "bg-indigo-50 text-indigo-600" : "text-gray-500 hover:bg-gray-50 cursor-pointer"}`}>
            <div className="flex items-center gap-3">
              <ShoppingCart className="w-5 h-5" /> Shop
            </div>
            {groceryList.filter(i => !i.purchased).length > 0 && (
              <span className="bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                {groceryList.filter(i => !i.purchased).length}
              </span>
            )}
          </button>
          <button onClick={() => setActiveTab("budget")} className={`w-full flex items-center gap-3 p-3 rounded-xl font-bold text-sm ${activeTab === "budget" ? "bg-indigo-50 text-indigo-600" : "text-gray-500 hover:bg-gray-50 cursor-pointer"}`}>
            <DollarSign className="w-5 h-5" /> Budget
          </button>
          <button onClick={() => setActiveTab("community")} className={`w-full flex items-center gap-3 p-3 rounded-xl font-bold text-sm ${activeTab === "community" ? "bg-indigo-50 text-indigo-600" : "text-gray-500 hover:bg-gray-50 cursor-pointer"}`}>
            <Users className="w-5 h-5" /> Social
          </button>
          <button 
            onClick={() => setActiveTab("tools")} 
            className={`w-full flex items-center gap-3 p-3 rounded-xl font-bold text-sm ${
              activeTab === "tools" ? "bg-indigo-50 text-indigo-600" : "text-gray-500 hover:bg-gray-50 cursor-pointer"
            }`}
          >
            <BookOpen className="w-5 h-5" /> Tools & Guides
          </button>

          <button 
            onClick={() => setActiveTab("profile")} 
            className={`w-full flex items-center gap-3 p-3 rounded-xl font-bold text-sm ${
              activeTab === "profile" ? "bg-indigo-50 text-indigo-600" : "text-gray-500 hover:bg-gray-50 cursor-pointer"
            }`}
          >
            <ConfigIcon className="w-5 h-5" /> Settings & Profile
          </button>
          <button 
            onClick={() => setShowFeedbackModal(true)} 
            className="w-full flex items-center gap-3 p-3 rounded-xl font-bold text-sm text-gray-500 hover:bg-gray-50 transition-colors cursor-pointer">
            <AlertCircle className="w-5 h-5" /> Feedback
          </button>
          {isAdmin && (
            <button onClick={() => setActiveTab("admin")} className={`w-full flex items-center gap-3 p-3 rounded-xl font-bold text-sm ${activeTab === "admin" ? "bg-indigo-50 text-indigo-600" : "text-gray-500 hover:bg-gray-50 cursor-pointer"}`}>
              <Briefcase className="w-5 h-5" /> Admin
            </button>
          )}
        </div>
      </nav>

      {/* Mobile Bottom Navigation (Hidden on desktop/tablet) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-gray-200 z-30 shadow-up py-3">
        <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-white via-white/90 to-transparent pointer-events-none z-20 flex items-center justify-end pr-1">
          <div className="w-1 h-6 bg-indigo-500/30 rounded-full blur-[1px] animate-pulse" />
        </div>

        <div className="flex items-center overflow-x-auto no-scrollbar gap-1 max-w-md mx-auto px-3 pr-14">
          <button
            onClick={() => setActiveTab("pantry")}
            className={`flex flex-col items-center justify-center shrink-0 w-[60px] py-1 transition-all cursor-pointer ${
              activeTab === "pantry" ? "text-indigo-600 scale-105 font-bold" : "text-gray-400"
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="text-[9px] tracking-tight mt-0.5">PANTRY</span>
          </button>

          <button
            onClick={() => setActiveTab("recipes")}
            className={`flex flex-col items-center justify-center shrink-0 w-[60px] py-1 transition-all cursor-pointer ${
              activeTab === "recipes" ? "text-indigo-600 scale-105 font-bold" : "text-gray-400"
            }`}
          >
            <CookingPot className="w-5 h-5" />
            <span className="text-[9px] tracking-tight mt-0.5">COOK</span>
          </button>

          <button
            onClick={() => setActiveTab("shopping")}
            className={`flex flex-col items-center justify-center shrink-0 w-[60px] py-1 transition-all cursor-pointer relative ${
              activeTab === "shopping" ? "text-indigo-600 scale-105 font-bold" : "text-gray-400"
            }`}
          >
            <div className="relative">
              <ShoppingCart className="w-5 h-5" />
              {groceryList.filter((i) => !i.purchased).length > 0 && (
                <span className="absolute -top-1 -right-2 bg-indigo-600 text-white text-[8px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center">
                  {groceryList.filter((i) => !i.purchased).length}
                </span>
              )}
            </div>
            <span className="text-[9px] tracking-tight mt-0.5">SHOP</span>
          </button>

          <button
            onClick={() => setActiveTab("budget")}
            className={`flex flex-col items-center justify-center shrink-0 w-[60px] py-1 transition-all cursor-pointer ${
              activeTab === "budget" ? "text-indigo-600 scale-105 font-bold" : "text-gray-400"
            }`}
          >
            <DollarSign className="w-5 h-5" />
            <span className="text-[9px] tracking-tight mt-0.5">BUDGET</span>
          </button>

          <button
            onClick={() => setActiveTab("community")}
            className={`flex flex-col items-center justify-center shrink-0 w-[60px] py-1 transition-all cursor-pointer ${
              activeTab === "community" ? "text-indigo-600 scale-105 font-bold" : "text-gray-400"
            }`}
          >
            <Users className="w-5 h-5" />
            <span className="text-[9px] tracking-tight mt-0.5">SOCIAL</span>
          </button>

          <button
            onClick={() => setActiveTab("tools")}
            className={`flex flex-col items-center justify-center shrink-0 w-[60px] py-1 transition-all cursor-pointer ${
              activeTab === "tools" ? "text-indigo-600 scale-105 font-bold" : "text-gray-400"
            }`}
          >
            <BookOpen className="w-5 h-5" />
            <span className="text-[9px] tracking-tight mt-0.5">TOOLS</span>
          </button>

          <button
            onClick={() => setActiveTab("profile")}
            className={`flex flex-col items-center justify-center shrink-0 w-[60px] py-1 transition-all cursor-pointer ${
              activeTab === "profile" ? "text-indigo-600 scale-105 font-bold" : "text-gray-400"
            }`}
          >
            <ConfigIcon className="w-5 h-5" />
            <span className="text-[9px] tracking-tight mt-0.5">PROFILE</span>
          </button>

          {isAdmin && (
            <button
              onClick={() => setActiveTab("admin")}
              className={`flex flex-col items-center justify-center shrink-0 w-[60px] py-1 transition-all cursor-pointer ${
                activeTab === "admin" ? "text-indigo-600 scale-105 font-bold" : "text-gray-400"
              }`}
            >
              <Briefcase className="w-5 h-5" />
              <span className="text-[9px] tracking-tight mt-0.5">ADMIN</span>
            </button>
          )}
        </div>
      </div>

      {showLegalModal && (
        <LegalModal onClose={() => setShowLegalModal(false)} />
      )}

      {showGuidelinesModal && (
        <CommunityGuidelinesModal onClose={() => setShowGuidelinesModal(false)} />
      )}

      {/* 👉 LANDMARK: Soft-Gate Modal Render */}
      <SoftGateModal
        isOpen={showSoftGate}
        onClose={() => setShowSoftGate(false)}
        featureContext={softGateContext}
      />

      <DuplicateUrlModal
        matchData={duplicateMatch}
        onClose={() => setDuplicateMatch(null)}
        onViewExisting={(recipe) => {
          setShowIngestModal(false);
          handleSetActiveRecipe(recipe);
        }}
        onForceUpload={() => {
          handleUrlIngest(null, true); // Forces upload, bypassing duplicate check
        }}
      />

      <style
        dangerouslySetInnerHTML={{
          __html: `.shadow-up { box-shadow: 0 -10px 15px -3px rgba(0, 0, 0, 0.05); } .animate-in { animation: fade-in 0.3s ease-out; } @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } } .slide-in-from-bottom { animation: slide-up 0.3s ease-out; } @keyframes slide-up { from { transform: translateY(100%); } to { transform: translateY(0); } } .scrollbar-hide::-webkit-scrollbar { display: none; } .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }`,
        }}
      />
    </div>
  );
};



export default App;
