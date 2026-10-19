// =================================================================================
// 1.1 IMPORTS (React, Firebase, Lucide Icons, Components, Utils)
// =================================================================================
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import emailjs from '@emailjs/browser';

// =================================================================================
// 1.2 FIREBASE MODULES
// =================================================================================
import { getApp, getApps, initializeApp } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInAnonymously,
  signInWithCustomToken,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import {
  addDoc,
  collection,
  collectionGroup,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  increment,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  arrayUnion,
} from "firebase/firestore";
import { getStorage, ref, uploadString, getDownloadURL } from "firebase/storage";
// =================================================================================
// 1.3 LUCIDE ICONS (Alphabetical)
// =================================================================================
import {
  Activity,
  AlarmClock,
  AlertCircle,
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  ArrowRightLeft,
  Award,
  BarChart3,
  Barcode,
  Battery,
  Bell,
  BookOpen,
  Bookmark,
  Briefcase,
  Calendar,
  CheckCircle,
  CheckSquare,
  ChefHat,
  ChevronLeft,
  ChevronRight,
  Clock,
  CookingPot,
  Crown,
  Database,
  DollarSign,
  Download,
  Edit,
  ExternalLink,
  Filter as FilterIcon,
  Flame,
  Heart,
  Home,
  Layers,
  LayoutGrid,
  Leaf,
  LineChart,
  Link as LinkIcon,
  Loader,
  LogIn,
  LogOut,
  Mail,
  MapPin,
  Medal,
  Minus,
  Package,
  Pin,
  Play,
  Plus,
  RefreshCw,
  Scale,
  Scan,
  Search,
  Send,
  Settings as ConfigIcon,
  Share,
  Share2,
  ShoppingCart,
  Smile,
  Snowflake,
  Snowflake as ColdIcon,
  Sparkles,
  Speaker,
  Square,
  Star,
  Store,
  Sun,
  Tag as TagIcon,
  Thermometer,
  ThermometerSun,
  ThumbsDown,
  ThumbsUp,
  Timer as TimerIcon,
  Trash2,
  TrendingDown,
  Trophy,
  Truck,
  UserCircle,
  Users,
  Utensils,
  Wifi,
  X,
  Zap,
} from "lucide-react";

// =================================================================================
// 1.4 COMPONENTS (Alphabetical by filename)
// =================================================================================
import ActiveScheduleManagerModal from "./components/ActiveScheduleManagerModal";
import ExpiringItemsModal from "./components/ExpiringItemsModal";
import AdaptToKitchenModal from "./components/AdaptToKitchenModal";
import PinnedStovetopDrawer from "./components/PinnedStovetopDrawer";
import AIThinkingModal from "./components/AIThinkingModal";
import SideRecipeModal from './components/SideRecipeModal';
import TakeoutArbitragePill from "./components/TakeoutArbitragePill";
import PermissionPromptModal from './components/PermissionPromptModal';
import { useDevicePermissions } from './utils/permissionsEngine';
import RecentPurchasesModal from "./components/RecentPurchasesModal";
import CheckoutHandoffPanel from "./components/CheckoutHandoffPanel";
import RetailerAccountsModal from "./components/RetailerAccountsModal";
import NutritionReportView from './components/NutritionReportView';
import AdminRecipeIngestor from './components/AdminRecipeIngestor';
import ReverseSchedulerModal from './components/ReverseSchedulerModal';
import BatchCookingModal from './components/BatchCookingModal';
import CookingMode from './components/CookingMode';
import ConverterWidget from './components/ConverterWidget';
import SettingsProfile from './components/SettingsProfile';
import RecipeValidationModal from './components/RecipeValidationModal';
import CommunityGuidelinesModal from './components/CommunityGuidelinesModal';
import LegalModal from './components/LegalModal';
import MealPrepView from './components/MealPrepView';
import ShareModal from './components/ShareModal';
import BrandedRedirectModal from './components/BrandedRedirectModal';
import OmnipresentChef from './components/OmnipresentChef';
import RecipeComparisonModal from './components/RecipeComparisonModal';
import LoginModal from './components/LoginModal';
import SubscriptionModal from './components/SubscriptionModal';
import FeedbackModal from './components/FeedbackModal';
import SoftGateModal from './components/SoftGateModal';
import DuplicateUrlModal from './components/DuplicateUrlModal';
import OnboardingModal from './components/OnboardingModal';
import AdminDashboard from './components/AdminDashboard';
import ToolsScreen from './components/ToolsScreen';
import BudgetScreen from './components/BudgetScreen';
import MealPlanner from './components/MealPlanner';
import UserProfileView from './components/UserProfileView';
import VoiceInputWidget from './components/VoiceInputWidget';
import ReportRecipeModal from './components/ReportRecipeModal';

// =================================================================================
// 1.5 UTILITIES & ENGINES (Alphabetical)
// =================================================================================
import {
  fileToBase64,
  generateICS,
  getTimestampInDays,
  parsePrepTime,
  resizeImage,
} from "./utils/formatters";
import {
  calculatePantryMatch,
  calculateRecipeCost,
  getLocalSidePairings,
} from "./utils/recipeEngine";
import { getRecommendedShelfLife } from "./utils/shelfLifeEngine";

// =================================================================================
// 2. CONFIGURATION & ENVIRONMENT SETUP
// =================================================================================
const manualFirebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};
const appId = typeof __app_id !== "undefined" ? __app_id : "pantry-chef-mobile-v1";
const firebaseConfig = typeof __firebase_config !== "undefined" ? JSON.parse(__firebase_config) : manualFirebaseConfig;
const DAILY_API_LIMIT = 50;

let app, auth, db;
if (firebaseConfig) { app = !getApps().length ? initializeApp(firebaseConfig) : getApp(); auth = getAuth(app); db = getFirestore(app); }
const storage = getStorage(app);
const initialAuthToken = typeof __initial_auth_token !== "undefined" ? __initial_auth_token : null;
const activeModel = "gemini-3.7-flash";

// =================================================================================
// 3. UTILITY FUNCTIONS & MOCK DATA
// =================================================================================

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

const parseAIResponse = (text) => {
  if (!text || typeof text !== "string") {
    throw new Error("Empty AI response received");
  }

  // 1. Clean markdown code fences and whitespace
  let cleaned = text
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  const firstBracket = cleaned.search(/[[{]/);
  if (firstBracket === -1) {
    throw new Error("No JSON structure found in AI response");
  }
  cleaned = cleaned.substring(firstBracket);

  // 2. Direct parse attempt for complete payloads
  try {
    return JSON.parse(cleaned);
  } catch (directErr) {
    // Proceed to bracket-depth repair
  }

  // 3. Depth-aware array salvage (recovers completed recipes, drops truncated ones)
  if (cleaned.startsWith("[")) {
    let depth = 0;
    let inString = false;
    let escape = false;
    let lastCompleteTopLevelIndex = -1;

    for (let i = 0; i < cleaned.length; i++) {
      const char = cleaned[i];

      if (escape) {
        escape = false;
        continue;
      }
      if (char === "\\") {
        escape = true;
        continue;
      }
      if (char === '"') {
        inString = !inString;
        continue;
      }
      if (inString) continue;

      if (char === "{" || char === "[") {
        depth++;
      } else if (char === "}" || char === "]") {
        depth--;
        // Depth === 1 means a complete recipe object at the top level of the array just closed
        if (depth === 1 && char === "}") {
          lastCompleteTopLevelIndex = i;
        }
      }
    }

    if (lastCompleteTopLevelIndex !== -1) {
      try {
        const repairedArray = cleaned.substring(0, lastCompleteTopLevelIndex + 1) + "]";
        console.warn("Salvaged complete recipes from truncated output.");
        return JSON.parse(repairedArray);
      } catch (repairErr) {
        console.error("Array salvage parse failed:", repairErr);
      }
    }
  }

  // 4. Single object repair fallback
  if (cleaned.startsWith("{")) {
    let depth = 0;
    let inString = false;
    let escape = false;
    let lastCompletePropertyIndex = -1;

    for (let i = 0; i < cleaned.length; i++) {
      const char = cleaned[i];
      if (escape) { escape = false; continue; }
      if (char === "\\") { escape = true; continue; }
      if (char === '"') { inString = !inString; continue; }
      if (inString) continue;

      if (char === "{" || char === "[") depth++;
      else if (char === "}" || char === "]") depth--;
      else if (char === "," && depth === 1) {
        lastCompletePropertyIndex = i;
      }
    }

    if (lastCompletePropertyIndex !== -1) {
      try {
        const repairedObject = cleaned.substring(0, lastCompletePropertyIndex) + "}";
        return JSON.parse(repairedObject);
      } catch (objErr) {
        console.error("Object salvage parse failed:", objErr);
      }
    }
  }

  console.error("Unrecoverable AI response string:", text);
  throw new Error("AI response format error");
};

// When location changes on your item add form:
const handleLocationChange = (newLocation) => {
  setNewItemLocation(newLocation);
  // Automatically calculate smart default expiration days!
  const smartDays = getRecommendedShelfLife(newItemName, newLocation);
  setNewItemExpiryDays(smartDays);
};
// Example usage when processing a recipe (END)

const getCleanDomainName = (url) => {
  if (!url) return "Web";
  try {
    const parsed = new URL(url.startsWith("http") ? url : `https://${url}`);
    let hostname = parsed.hostname.replace(/^www\.,?/, "");
    const parts = hostname.split(".");
    if (parts.length >= 2) {
      const name = parts[parts.length - 2];
      return name.charAt(0).toUpperCase() + name.slice(1);
    }
    return hostname;
  } catch {
    return "Web";
  }
};
const formatInstructions = (instructions) => {
  if (!instructions) return "";

  // If it's already an array of steps from the AI
  if (Array.isArray(instructions)) {
    return instructions
      .map((step, idx) => `${idx + 1}. ${step.replace(/^\d+[\).\s-]*\s*/, "")}`)
      .join("\n\n");
  }

  const text = String(instructions).trim();

  // RULE: If the user explicitly used line breaks, respect them 100% (No guessing!)
  if (text.includes("\n")) {
    const lines = text
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    return lines
      .map((line, idx) => {
        // Strip out pre-existing numbers if the user typed "1." manually, then re-number cleanly
        const cleanLine = line.replace(/^\d+[\).\s-]*\s*/, "");
        return `${idx + 1}. ${cleanLine}`;
      })
      .join("\n\n");
  }

  // If it's already formatted with numbers
  if (/^\d+\./.test(text)) {
    return text;
  }

  // Fallback: Only guess/split sentences if it's a single unstructured AI paragraph
  const sentences = text
    .replace(/([.?!])\s*(?=[A-Z])/g, "$1|")
    .split("|")
    .map((s) => s.trim())
    .filter(Boolean);

  if (sentences.length > 1) {
    return sentences.map((s, idx) => `${idx + 1}. ${s}`).join("\n\n");
  }

  return `1. ${text}`;
};

// API Proxies
const getEffectiveApiLimit = () => {
  // 1. Admin exemption: Admins have infinite quota
  if (localStorage.getItem("pantry_chef_is_admin") === "true") {
    return Infinity;
  }
  // 2. Check for individual user custom limit override
  const userLimit = localStorage.getItem("pantry_chef_user_limit");
  if (userLimit !== null && userLimit !== "" && !isNaN(userLimit)) {
    return parseInt(userLimit, 10);
  }
  // 3. Fallback to global default limit (default to 25)
  const globalLimit = localStorage.getItem("pantry_chef_global_limit");
  return globalLimit !== null ? parseInt(globalLimit, 10) : 25;
};

const apiCall = async (payload, retries = 3) => {
  const currentUsage = getApiUsage();
  const limit = getEffectiveApiLimit();

  // Enforce dynamic threshold check (Admins return Infinity, bypassing this completely)
  if (currentUsage >= limit) {
    throw new Error(`Daily limit reached (${limit} requests). Try again tomorrow or contact an administrator for an upgrade.`);
  }

  const apiUrl = `https://pantry-chef-proxy.onrender.com/api/generate`;
  
  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (response.status === 429) {
      throw new Error("You exceeded your current quota or rate limit. Please wait a moment and try again.");
    }

    if (response.status === 503 && retries > 0) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        return apiCall(payload, retries - 1);
    }

    const result = await response.json();
    if (result.error) throw new Error(result.error.message);
    
    incrementApiUsage();
    
    if (db) {
      logAdminApiUsage(db, appId, "system_user", 1);
    }

    if (!result.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new Error("AI returned no content.");
    }
    return result.candidates[0].content.parts[0].text;
  } catch (err) {
    if (err.message.includes("quota") || err.message.includes("429") || err.message.includes("Too Many Requests")) {
      throw err;
    }
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
  )}. Categories: Produce, Protein, Dairy, Grains, Spices, Canned, Frozen, Snacks, Beverages, Other. Return ONLY a JSON array of objects, where each object has a "name" property (the exact item name) and a "category" property.`;
  
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
  mode = "recipe", // can be "recipe", "meal", or "copycat"
  eventMode = { active: false }
) => {
  const itemsList = pantryItems
    .map((i) => `${i.quantity || 1} ${i.unit || "unit"} ${i.name}`)
    .join(", ");

  const recentMeals = history
    .slice(0, 10)
    .map((h) => h.recipeTitle)
    .join(", ");

  const historyText = history.length > 0 ? `User likes: ${history.map((h) => h.recipeTitle).join(", ")}.` : "";
  const dietText = profile.diets?.length ? `Dietary: ${profile.diets.join(", ")}.` : "";
  const equipText = profile.equipment?.length ? `Equip: ${profile.equipment.join(", ")}.` : "";
  
  // 👉 NEW: Read the Solo vs. Family Mode toggle
  const isFamilyMode = profile.familyModeActive ?? true;

  // 👉 NEW: Granular per-member context
  const householdMembersText = isFamilyMode && profile.householdMembers?.length > 0 
    ? `Household Roster: ${profile.householdMembers.map(m => `${m.name} [${m.ageGroup}] - Goals: ${m.healthGoals?.join(', ') || 'None'}, Allergies: ${m.restrictions || 'None'}, Likes: ${m.likes || 'None'}, Dislikes: ${m.dislikes || 'None'}`).join(' | ')}.`
    : "";

  const soloContext = !isFamilyMode ? `User Health Goals: ${profile.healthGoals?.join(', ') || 'None'}. User Dislikes: ${profile.dislikedFoods || 'None'}. User Likes: ${profile.likes || 'None'}.` : "";

  // EVENT / LARGE GROUP GUARDRAILS
  const eventContext = eventMode.active 
    ? `SPECIAL EVENT / CROWD COOKING MODE ACTIVE: Cooking for "${eventMode.name || 'Gathering'}" with a total headcount of ${eventMode.headcount} people. Temporary Guest Allergies/Restrictions to strictly guard against: ${eventMode.restrictions || 'None'}. Ensure quantities and yields scale appropriately for this headcount.`
    : "";

  // 👉 UPGRADED GUARDRAILS FOR ADAPTATIONS
  const familyGuardrails = `
    CRITICAL HOUSEHOLD SAFETY & TASTE RULES:
    1. ${isFamilyMode ? householdMembersText : soloContext}
    2. ${eventContext}
    3. Strictly AVOID any ingredients that violate any listed restrictions or allergies.
    4. MEMBER ADAPTATIONS REQUIRED: If Family Mode is active, you MUST output a "memberAdaptations" array. For each household member with specific goals, age constraints (like toddlers needing soft texture/no heat), or strong preferences, provide a 1-2 sentence adaptation instructing the chef on how to slightly modify their portion of the core recipe to accommodate them without cooking a totally separate meal.
  `;

  let filterContext = "";
  if (filters.mealType && filters.mealType !== "Any") filterContext += `Meal Type: Must be suitable for ${filters.mealType}. `;
  if (filters.maxCalories) filterContext += `Nutritional Limit: Maximum ${filters.maxCalories} calories per serving. `;
  if (filters.proteins?.length) filterContext += `Must include one of: ${filters.proteins.join(", ")}. `;
  if (filters.vegetables?.length) filterContext += `Must include one of: ${filters.vegetables.join(", ")}. `;
  if (filters.cuisine) filterContext += `Cuisine style: ${filters.cuisine}. `;
  if (filters.maxTime) filterContext += `Max cooking time: ${filters.maxTime}. `;

  let prompt = "";
  if (mode === "copycat") {
    prompt = `You are a professional food scientist and copycat chef. The user is craving a commercial restaurant or fast-food item: "${queryText}". 
    Reverse-engineer this exact dish into an authentic home clone recipe. 
    Detail the exact seasoning blends, secret sauce formulations, and commercial cooking techniques required to replicate the authentic taste.
    Estimate the commercial restaurant price per serving versus the home ingredient cost per serving.
    
    CRITICAL INSTRUCTION FOR RECOMMENDED SIDES: Provide at least 4 companion sides that complete the meal experience. Split them into two distinct categories:
    1. Brand-specific copycat companion sides (prefixed exactly with "🍔 Copycat Side: ", e.g., "🍔 Copycat Side: McDonald's World Famous Fries").
    2. Universal classic pairing sides (prefixed exactly with "🍟 Classic Side: ", e.g., "🍟 Classic Side: Crispy Beer-Battered Onion Rings").
    
    CRITICAL INSTRUCTION FOR CLONE SECRETS: Always use generic ingredient names (e.g., 'buttermilk', 'mayonnaise', 'cheddar cheese'). Do NOT use specific brand names from the user's pantry list unless non-negotiable.
    
    Dietary constraints: ${dietText}. Available pantry items to incorporate if possible: ${itemsList}.

    ${familyGuardrails} 
    
    Output JSON array with 1-2 copycat results. Each object must include: 
    - title (string)
    - brandOrigin (string, e.g., "McDonald's")
    - commercialPrice (number)
    - homeCost (number)
    - description (string)
    - prepTime (string)
    - servings (int)
    - matchPercentage (number)
    - cloneSecrets (array of strings using generic ingredient names)
    - recommendedSides (array of strings with "🍔 Copycat Side: " and "🍟 Classic Side: " prefixes)
    - allIngredients (array of name, quantity, unit)
    - instructions (string)
    - memberAdaptations (array of objects with "memberName" and "adaptationText" string)
    - nutrition (object with calories, protein, carbs, fat)
    - recommendedGear (array of string)`;
  } else if (mode === "meal") {
    const cravingContext = queryText ? `User specific craving/theme: "${queryText}". Tailor all combinations to match this theme.` : "";
    prompt = `Ingredients available: ${itemsList}. ${cravingContext} ${historyText} ${dietText} ${equipText} ${filterContext}

    ${familyGuardrails}

    Suggest 3 complete, coherent meal combinations (Main Dish + Complementary Side Dish, e.g., Herb-Crusted Pork Chops with Roasted Asparagus). Ensure variety and avoid recently cooked dishes.
    Output JSON array. Each object: title (formatted as "Main Dish with Complementary Side"), description, prepTime, servings (int), matchPercentage (number), sourceName, sourceUrl, missingIngredients (array), allIngredients (array of name, quantity, unit - combined for both dishes), instructions (combined for both, separated into clear sections for Main and Side), memberAdaptations (array of objects with "memberName" and "adaptationText" string), nutrition (object with calories (int), protein (string), carbs (string), fat (string)), recommendedGear (array of string for suggested utensils/appliances), recommendedSides (array of string).`;
  } else if (queryText) {
    prompt = `Search for recipes matching "${queryText}". ${filterContext} ${dietText}. User has: ${itemsList}. ${historyText}
    
    ${familyGuardrails}

    Try to find recipes that use these items if possible. Return 3 results. Output JSON array. Each object: title, description, prepTime (e.g. "15 mins"), cookTime (e.g. "2 hrs 30 mins", or "None" if raw/no cook), totalTime (string), servings (int), matchPercentage (number), sourceName, sourceUrl, missingIngredients (array), allIngredients (array of name, quantity, unit), instructions, memberAdaptations (array of objects with "memberName" and "adaptationText" string), nutrition (object with calories (int), protein (string), carbs (string), fat (string)), recommendedGear (array of string for suggested utensils/appliances), recommendedSides (array of string).`;
    
  } else {
    prompt = `Ingredients available: ${itemsList}. ${historyText} ${dietText} ${equipText} ${filterContext}
    
    ${familyGuardrails}

    Suggest 3 recipes ensuring variety and avoiding recently cooked dishes. Output JSON array. Each object: title, description, prepTime (e.g. "15 mins"), cookTime (e.g. "2 hrs 30 mins", or "None" if raw/no cook), totalTime (string), servings (int), matchPercentage (number), sourceName, sourceUrl, missingIngredients (array), allIngredients (array of name, quantity, unit), instructions, memberAdaptations (array of objects with "memberName" and "adaptationText" string), nutrition (object with calories (int), protein (string), carbs (string), fat (string)), recommendedGear (array of string for suggested utensils/appliances), recommendedSides (array of string).`;
  }

 // Direct, high-speed call without search grounding to prevent 429/503 errors
  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      maxOutputTokens: 8192,
      responseMimeType: "application/json"
    }
  };
  const responseText = await apiCall(payload);
  return parseAIResponse(responseText);
};

const generateMealPrepPlan = async (baseIngredient) => {
  const prompt = `Generate a smart meal prep plan using "${baseIngredient}" as the core. 1. Bulk Prep Instructions: How to cook 3-4lbs of ${baseIngredient} at once. 2. 3 Distinct Meals: Recipes using the prepped base. Output JSON: { "baseInstructions": "string", "shoppingList": ["string"], "meals": [ { "title": "string", "description": "string", "prepTime": "string", "ingredients": ["string"] } ] }`;
  const payload = { contents: [{ parts: [{ text: prompt }] }] };
  return parseAIResponse(await apiCall(payload));
};

// Mock Data Constants
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
const MOCK_SPONSORED_POOL = [
  {
    id: "sponsor_freshmart_steak",
    title: "Weekly Special: 50% Off Ribeye Steaks",
    description: "Get restaurant-quality marbling delivered fresh from FreshMart.",
    prepTime: "20 mins",
    image: "https://images.unsplash.com/photo-1544025162-d76694265947",
    isBrand: true,
    is_sponsored: true,
    sponsorMetadata: {
      brandName: "FreshMart",
      keywords: ["steak", "beef", "meat", "ribeye", "tacos"],
      trackingUrl: "https://www.walmart.com"
    },
    allIngredients: [{ name: "Ribeye Steak", quantity: 1, unit: "lb" }]
  },
  {
    id: "sponsor_hellofresh_kit",
    title: "HelloFresh: Quick 15-Min Dinner Kits",
    description: "Pre-portioned fresh ingredients shipped directly to your door.",
    prepTime: "15 mins",
    image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c",
    isBrand: true,
    is_sponsored: true,
    sponsorMetadata: {
      brandName: "HelloFresh",
      keywords: ["quick", "kit", "dinner", "easy"],
      trackingUrl: "https://www.hellofresh.com"
    },
    allIngredients: [{ name: "Meal Kit", quantity: 1, unit: "box" }]
  }
];
const MOCK_PERSONAS = [
  { image: "https://ui-avatars.com/api/?name=Chef+A&background=random" },
  { image: "https://ui-avatars.com/api/?name=Chef+B&background=random" },
];
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



// =================================================================================
// 4. HIGHLY INTEGRATED LOCAL COMPONENTS 
// (Kept in App.jsx to avoid extreme prop-drilling)
// =================================================================================
const PantryValuationCard = ({ inventory, onOpenExpiringTriage }) => {
  const [expanded, setExpanded] = useState(false);

  const { totalValue, atRiskItems, atRiskValue, preppedPortionsCount, takeoutReplacementValue, categoryBreakdown } = useMemo(() => {
    let rawTotal = 0;
    let preppedCount = 0;
    const catMap = {};
    const now = new Date();
    const atRisk = [];
    let riskCost = 0;

    inventory.forEach((item) => {
      const unitCost = parseFloat(item.lastCost) || 2.0;
      const qty = parseFloat(item.quantity) || 1;
      const itemTotal = unitCost * qty;
      rawTotal += itemTotal;

      const cat = item.category || "Other";
      catMap[cat] = (catMap[cat] || 0) + itemTotal;

      const isPrepped =
        cat === "Prepared Meals" ||
        (item.name && item.name.toLowerCase().includes("prepped portions")) ||
        Boolean(item.recipeId);

      if (isPrepped) {
        preppedCount += qty;
      }

      if (item.expiryDate) {
        const expiry = item.expiryDate?.toDate ? item.expiryDate.toDate() : new Date(item.expiryDate);
        const daysLeft = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
        if (daysLeft >= 0 && daysLeft <= 3) {
          atRisk.push(item);
          riskCost += itemTotal;
        }
      }
    });

    return {
      totalValue: rawTotal,
      atRiskItems: atRisk,
      atRiskValue: riskCost,
      preppedPortionsCount: preppedCount,
      takeoutReplacementValue: preppedCount * 14.0,
      categoryBreakdown: Object.entries(catMap),
    };
  }, [inventory]);

  return (
    <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-5 rounded-2xl shadow-md space-y-3">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider">Pantry Net Worth</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl font-black">${totalValue.toFixed(2)}</h3>
            <span className="text-[10px] text-indigo-300 font-medium">(Wholesale Cost)</span>
          </div>
        </div>
        <DollarSign className="w-6 h-6 text-indigo-400 opacity-60" />
      </div>

      {/* Takeout Replacement Callout for Prepped Meals */}
      {preppedPortionsCount > 0 && (
        <div className="bg-indigo-950/70 border border-indigo-700/60 p-2.5 rounded-xl text-xs flex items-center justify-between gap-2 shadow-2xs">
          <div className="flex items-center gap-2">
            <CookingPot className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-indigo-100 text-[11px] leading-tight">
              <strong>{preppedPortionsCount} prepped portions</strong> in stock
            </span>
          </div>
          <span className="text-[10px] font-black text-emerald-300 bg-emerald-950/80 border border-emerald-500/40 px-2 py-0.5 rounded-md whitespace-nowrap">
            ~${takeoutReplacementValue.toFixed(2)} Takeout Value
          </span>
        </div>
      )}

      {/* At-Risk Items Warning */}
      {atRiskValue > 0 && (
        <button
          type="button"
          onClick={onOpenExpiringTriage}
          className="w-full text-left bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 p-2.5 rounded-xl text-xs text-red-200 flex items-center justify-between gap-2 transition-colors cursor-pointer"
          title="Click to view expiring items triage"
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
            <span>
              <strong>${atRiskValue.toFixed(2)}</strong> expiring in 3 days or less
            </span>
          </div>
          <span className="text-[10px] font-bold text-red-300 underline shrink-0">Triage ↗</span>
        </button>
      )}

      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="text-[10px] text-indigo-300 font-bold hover:text-white cursor-pointer w-full text-left pt-1 border-t border-indigo-800 flex justify-between items-center"
      >
        <span>{expanded ? "Hide Category Breakdown" : "View Breakdown..."}</span>
        <span>{expanded ? "▲" : "▼"}</span>
      </button>

      {expanded && (
        <div className="space-y-1.5 pt-1 text-xs text-gray-300 animate-in fade-in max-h-36 overflow-y-auto pr-1 font-mono">
          {categoryBreakdown.length > 0 ? (
            categoryBreakdown.map(([cat, val]) => (
              <div key={cat} className="flex justify-between text-[11px]">
                <span className="font-sans text-gray-400">{cat}:</span>
                <span className="font-bold">${val.toFixed(2)}</span>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-[10px] font-sans">No items currently logged.</p>
          )}
        </div>
      )}
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
    <div className="bg-gradient-to-r from-orange-400 to-pink-500 rounded-2xl p-4 text-white shadow-sm relative overflow-hidden flex flex-col justify-between h-full gap-3">
      <div className="absolute top-0 right-0 p-2 opacity-15 pointer-events-none">
        <Trophy className="w-16 h-16" />
      </div>
      
      <div className="relative z-10">
        <div className="flex items-center gap-1 mb-1">
          <Flame className="w-3 h-3 text-white" />
          <span className="text-[9px] font-bold uppercase tracking-wider opacity-90">
            Active Goal
          </span>
        </div>
        <p className="text-sm font-black leading-tight truncate">
          {activeChallenge.title}
        </p>
      </div>

      <div className="relative z-10 flex items-center justify-between gap-2 pt-1">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <div className="w-full bg-black/20 rounded-full h-1.5 max-w-[100px]">
              <div
                className="bg-white h-1.5 rounded-full transition-all duration-1000"
                style={{ width: `${percent}%` }}
              ></div>
            </div>
            <span className="text-[9px] font-bold whitespace-nowrap opacity-90">
              {progress}/{activeChallenge.target}
            </span>
          </div>
        </div>
        <button
          onClick={onViewAll}
          className="bg-white/20 hover:bg-white/30 rounded-xl px-3 py-1.5 text-[10px] font-bold cursor-pointer transition-colors whitespace-nowrap shrink-0"
        >
          See All
        </button>
      </div>
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
const NotificationToast = ({ message, onClose }) => (
  <div className="fixed top-4 left-4 right-4 bg-gray-900 text-white p-4 rounded-2xl shadow-2xl z-[170] animate-in slide-in-from-top duration-500 flex items-center justify-between border border-gray-700">
    <div className="flex items-center gap-3">
      <div className="p-2 bg-indigo-600 rounded-full shrink-0">
        <ChefHat className="w-5 h-5 text-white" />
      </div>
      <div>
        <h4 className="font-bold text-xs uppercase tracking-wider text-indigo-400">Kitchen Notification</h4>
        <p className="text-xs text-gray-200 leading-snug">{message}</p>
      </div>
    </div>
    <button onClick={onClose} className="p-1.5 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white cursor-pointer">
      <X className="w-4 h-4" />
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
// Upgraded Dynamic Sponsored Ad Component with Search-Intent & Tracking
const NativeAd = ({ sponsor, db, appId, effectiveUserId }) => {
  // Fallback to default HelloFresh sponsor if none provided
  const adData = sponsor || {
    id: "default_hellofresh",
    title: "HelloFresh: $20 Off",
    description: "Get fresh ingredients delivered to your door.",
    image: "🥕",
    sponsorMetadata: {
      trackingUrl: "https://www.hellofresh.com"
    }
  };

  // Log impression automatically when the ad renders
  useEffect(() => {
    if (db && adData.id) {
      addDoc(collection(db, `/artifacts/${appId}/public/data/sponsorAnalytics`), {
        sponsorId: adData.id,
        eventType: "impression",
        userId: effectiveUserId || "anonymous",
        timestamp: serverTimestamp()
      }).catch(err => console.error("Impression log error:", err));
    }
  }, [adData.id]);

  const handleClick = async () => {
    // Log click conversion before redirecting
    if (db && adData.id) {
      try {
        await addDoc(collection(db, `/artifacts/${appId}/public/data/sponsorAnalytics`), {
          sponsorId: adData.id,
          eventType: "click",
          userId: effectiveUserId || "anonymous",
          timestamp: serverTimestamp()
        });
      } catch (err) {
        console.error("Click log error:", err);
      }
    }

    // Open partner link (replace with your affiliate link later)
    const targetUrl = adData.sponsorMetadata?.trackingUrl || "https://www.hellofresh.com";
    window.open(targetUrl, "_blank");
  };

  return (
    <div className="p-4 bg-gradient-to-r from-orange-50 to-orange-100 rounded-2xl border border-orange-200 mb-4 relative overflow-hidden group shadow-sm">
      <div className="absolute top-2 right-2 text-[9px] font-bold text-orange-600 bg-orange-200/80 border border-orange-300 px-1.5 py-0.5 rounded-full">
        {adData.isIntentMatched ? "🎯 SPONSORED MATCH" : "SPONSORED"}
      </div>
      
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-orange-200 rounded-xl flex items-center justify-center text-2xl shrink-0 shadow-inner">
          {typeof adData.image === "string" && adData.image.startsWith("http") ? (
            <img src={adData.image} alt={adData.title} className="w-full h-full object-cover rounded-xl" />
          ) : (
            adData.image || "🥕"
          )}
        </div>
        <div className="min-w-0 flex-1 pr-12">
          <h4 className="font-bold text-gray-900 text-sm truncate">{adData.title}</h4>
          <p className="text-xs text-gray-600 leading-tight line-clamp-1">
            {adData.description}
          </p>
        </div>
      </div>
      
      <button
        onClick={handleClick}
        className="mt-3 w-full py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold shadow-sm transition-colors cursor-pointer"
      >
        Claim Offer
      </button>
    </div>
  );
};
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
const InventoryItem = ({ item, onUpdate, onDelete, isSelected, onToggleSelect, onOpenRecipe, }) => {
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

  let locationIcon = null;
  let locationColor = "text-amber-700 bg-amber-50 border-amber-100"; // Default Pantry
  if (item.location === "Fridge") {
    locationIcon = <Thermometer className="w-3 h-3 shrink-0" />;
    locationColor = "text-blue-600 bg-blue-50 border-blue-100";
  } else if (item.location === "Freezer") {
    locationIcon = <Snowflake className="w-3 h-3 shrink-0" />;
    locationColor = "text-cyan-600 bg-cyan-50 border-cyan-100";
  } else {
    locationIcon = <Package className="w-3 h-3 shrink-0" />;
  }

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
        <button onClick={() => onToggleSelect(item.id)} className="shrink-0 cursor-pointer">
          {isSelected ? <CheckSquare className="w-5 h-5 text-indigo-600" /> : <Square className="w-5 h-5 text-gray-300" />}
        </button>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`font-semibold capitalize ${textStyle}`}>
              {item.name}
            </span>
            {statusLabel}

            {/* Prepped Meal Recipe Shortcut */}
            {(item.category === "Prepared Meals" ||
              (item.name && item.name.toLowerCase().includes("prepped portions")) ||
              item.recipeId) && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenRecipe && onOpenRecipe(item);
                }}
                className="inline-flex items-center gap-1.5 text-[10px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2 py-0.5 rounded-md cursor-pointer transition-colors shadow-2xs"
                title="View original recipe details and reheating steps"
              >
                <ChefHat className="w-3 h-3 text-indigo-500" />
                <span>{item.quantity} {item.unit || "portion(s)"} left</span>
                <span className="text-indigo-400">• View ↗</span>
              </button>
            )}

            <button
              onClick={() => setIsEditing(true)}
              className="text-gray-400 hover:text-indigo-500 opacity-50 hover:opacity-100 transition-opacity cursor-pointer"
            >
              <Edit className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
      <div className="flex gap-1 border-l border-black/5 pl-2 ml-2">
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
const IngredientMatchModal = ({
  recipe,
  inventory,
  onClose,
  onAddToGrocery,
  onAddToPantry,
  db,
  appId,
  activeWorkspace
}) => {
  if (!recipe) return null;

  const total = recipe.allIngredients?.length || 0;
  const matchedIngs = total > 0 ? recipe.allIngredients.filter(ing => 
    inventory.some(invItem => 
      invItem.name?.toLowerCase().includes((ing.name || ing).toLowerCase()) ||
      (ing.name || ing).toLowerCase().includes(invItem.name?.toLowerCase())
    )
  ) : [];
  
  const missingIngs = total > 0 ? recipe.allIngredients.filter(ing => 
    !inventory.some(invItem => 
      invItem.name?.toLowerCase().includes((ing.name || ing).toLowerCase()) ||
      (ing.name || ing).toLowerCase().includes(invItem.name?.toLowerCase())
    )
  ) : [];

  const matchedCount = matchedIngs.length;
  const matchPct = total > 0 ? Math.round((matchedCount / total) * 100) : 0;

  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 animate-in fade-in" onClick={onClose}>
      <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center border-b pb-3">
          <div>
            <h3 className="font-black text-base text-gray-900">{recipe.title}</h3>
            <p className="text-xs text-indigo-600 font-bold">{matchPct}% Match ({matchedCount} of {total} items in stock)</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full bg-gray-50 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Recipe Ingredients</span>
          <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
            {recipe.allIngredients?.map((ing, i) => {
              const cleanName = ing.name || ing;
              const matchedItem = inventory.find((invItem) =>
                invItem.name?.toLowerCase().includes(cleanName.toLowerCase()) ||
                cleanName.toLowerCase().includes(invItem.name?.toLowerCase())
              );
              const inPantry = Boolean(matchedItem);

              return (
                <div key={i} className="flex items-center justify-between text-xs py-2 px-3 bg-gray-50 rounded-xl border border-gray-100 gap-2">
                  <span className="flex items-center gap-2 min-w-0 flex-1">
                    {inPantry ? <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" /> : <span className="w-4 h-4 text-rose-400 font-bold text-center shrink-0">✗</span>}
                    <span className={`truncate ${inPantry ? "font-bold text-gray-800" : "text-gray-600"}`}>
                      <span className="font-mono text-gray-400 mr-1">{ing.quantity} {ing.unit !== "unit" ? ing.unit : ""}</span> {cleanName}
                    </span>
                  </span>

                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (inPantry && matchedItem?.id && db && activeWorkspace?.id) {
                        await deleteDoc(doc(db, `/artifacts/${appId}/workspaces/${activeWorkspace.id}/inventory`, matchedItem.id)).catch(() => {});
                      } else if (!inPantry) {
                        if (onAddToPantry) {
                          await onAddToPantry(cleanName);
                        }
                      }
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors shrink-0 ${
                      inPantry
                        ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                        : "bg-rose-100 text-rose-700 hover:bg-rose-200"
                    }`}
                  >
                    {inPantry ? "In Stock (Have)" : "Missing (Need)"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {missingIngs.length > 0 && (
          <button
            onClick={() => {
              const missingNames = missingIngs.map(i => i.name || i);
              if (onAddToGrocery) {
                onAddToGrocery(missingNames);
                onClose();
              }
            }}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer flex items-center justify-center gap-2"
          >
            <ShoppingCart className="w-4 h-4" /> Add Missing Items to Shopping List
          </button>
        )}
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
  selectedForCompare = [],
  onToggleCompare,
  inventory = [],
  communityRecipes = [],
  onAddToGrocery,
  onAddToPantry,
  activeWorkspace,
  onOpenMatchBreakdown,
  pinnedRecipes = [],
  onTogglePin,
  isGeneratedModal = false,
}) => {
  const [showMatchModal, setShowMatchModal] = useState(false);

  const isArchived = isSaved && !recipe.isAI && !recipe.isDB && communityRecipes.length > 0 && 
    !communityRecipes.some(r => r.title?.toLowerCase() === recipe.title?.toLowerCase());

  const total = recipe.allIngredients?.length || 0;
  const matchedIngs = total > 0 ? recipe.allIngredients.filter(ing => 
    inventory.some(invItem => 
      invItem.name?.toLowerCase().includes(ing.name?.toLowerCase()) ||
      ing.name?.toLowerCase().includes(invItem.name?.toLowerCase())
    )
  ) : [];
  
  const missingIngs = total > 0 ? recipe.allIngredients.filter(ing => 
    !inventory.some(invItem => 
      invItem.name?.toLowerCase().includes(ing.name?.toLowerCase()) ||
      ing.name?.toLowerCase().includes(invItem.name?.toLowerCase())
    )
  ) : [];

  const matchedCount = matchedIngs.length;
  const matchPct = total > 0 ? Math.round((matchedCount / total) * 100) : 0;
  
  const badgeColor = matchPct > 75 
    ? "bg-emerald-100 text-emerald-700 border border-emerald-200" 
    : matchPct > 0 
    ? "bg-amber-100 text-amber-800 border border-amber-200" 
    : "bg-gray-100 text-gray-600 border border-gray-200";

  // Determine correct attribution label
  const isAIGenerated = recipe.isAI || recipe.isDB || recipe.brandOrigin || recipe.sourceName === "Web Import";
  const authorLabel = isAIGenerated ? "Generated by Pantry Chef AI" : `Created by ${recipe.authorName || "Community Chef"}`;

  return (
    <>
      {/* 🛑 REMOVED card-level onClick to eliminate accidental misclicks. Users click Title or Arrow instead. */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-all group overflow-hidden flex flex-col justify-between relative">
        <div>
          {isArchived && (
            <div className="absolute top-2 left-2 z-10 bg-amber-500/90 text-white text-[9px] font-black px-2 py-0.5 rounded-md shadow-sm backdrop-blur-xs flex items-center gap-1">
              📦 Personal Archive Copy (Original removed)
            </div>
          )}

          {recipe.image && (
            <div className="w-full h-32 bg-gray-100 overflow-hidden relative cursor-pointer" onClick={onClick}>
              <img
                src={recipe.image}
                alt={recipe.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                onError={(e) => { e.target.parentElement.style.display = 'none'; }}
              />
            </div>
          )}
          <div className="p-4 space-y-2">
            <div className="flex justify-between items-start">
              {/* 👉 TITLE IS NOW THE PRIMARY CLICKABLE TARGET TO OPEN DETAILS */}
              <h3 
                onClick={onClick}
                className="font-bold text-gray-900 leading-tight hover:text-indigo-600 transition-colors line-clamp-1 cursor-pointer"
              >
                {recipe.title}
              </h3>
              
              <div className="flex items-center gap-1 shrink-0 ml-2">
                {/* 👉 RIGHT ARROW CLICKABLE TARGET */}
                <button
                  onClick={onClick}
                  className="p-1.5 hover:bg-gray-100 rounded-full text-gray-400 hover:text-indigo-600 transition-colors cursor-pointer"
                  title="View Recipe Details"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap pt-1">
              {/* Detect meal mode via flag or combined title structure */}
              {(recipe.isMealCombo || recipe.mode === "meal" || (recipe.title && recipe.title.toLowerCase().includes(" with "))) && (
                <span className="bg-purple-100 text-purple-800 border border-purple-200 text-[10px] font-black px-2 py-0.5 rounded-md flex items-center gap-1 shadow-2xs">
                  🍽️ Complete Meal Combo
                </span>
              )}

              {recipe.brandOrigin && (
                <span className="bg-orange-100 text-orange-800 border border-orange-200 text-[10px] font-black px-2 py-0.5 rounded-md flex items-center gap-1">
                  🍔 Copycat: {recipe.brandOrigin}
                </span>
              )}

              {/* 👉 DECOUPLED AUTHOR BUTTON (Stops background event propagation cleanly) */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onAuthorClick && onAuthorClick(recipe);
                }}
                className="inline-flex items-center gap-1.5 text-[10px] text-gray-500 hover:text-indigo-600 group cursor-pointer text-left z-10"
                title="View Creator Profile"
              >
                {recipe.authorImage ? (
                  <img 
                    src={recipe.authorImage} 
                    alt="" 
                    className="w-4 h-4 rounded-full object-cover border border-gray-200" 
                  />
                ) : (
                  <div className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-700 font-bold text-[8px] flex items-center justify-center">
                    {(recipe.authorName || "C").charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="underline-offset-2 hover:underline">{authorLabel}</span>
              </button>

              <CreatorBadge isBrand={recipe.isBrand} isCreator={recipe.isCreator} />
              
              {!recipe.isBrand && !recipe.isCreator && (
                /* 👉 CLICKABLE MATCH % BADGE OPENS INGREDIENT BREAKDOWN POPUP */
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onOpenMatchBreakdown) {
                      onOpenMatchBreakdown(recipe);
                    } else {
                      setShowMatchModal(true);
                    }
                  }}
                  className={`text-[10px] font-black px-2.5 py-0.5 rounded-md cursor-pointer hover:opacity-80 transition-opacity z-10 ${badgeColor}`}
                  title="Click to view ingredient match breakdown"
                >
                  ✨ {matchPct}% MATCH (Tap for details)
                </button>
              )}
              
              <div className="text-[10px] text-gray-500 flex items-center gap-2 ml-auto font-medium">
                <span className="flex items-center gap-1" title="Prep Time">
                  ⏱️ Prep: {recipe.prepTime || "15m"}
                </span>
                {recipe.cookTime && recipe.cookTime !== "None" && (
                  <span className="flex items-center gap-1 text-amber-700 font-bold" title="Cook / Active Heat Time">
                    🔥 Cook: {recipe.cookTime}
                  </span>
                )}
              </div>
            </div>

            <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed pt-1">
              {recipe.description}
            </p>
          </div>
        </div>

        {/* Action Footer (Now houses the Share button cleanly) */}
        {/* Action Footer */}
        <div className="px-4 py-3 bg-gray-50/70 border-t border-gray-100 flex items-center justify-between mt-auto">
          {!isGeneratedModal ? (
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
          ) : (
            <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">
              Suggested Recipe
            </span>
          )}

          <div className="flex items-center gap-1.5">
            {!isGeneratedModal && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (navigator.share) {
                    navigator.share({ title: recipe.title, text: recipe.description, url: window.location.href }).catch(() => {});
                  } else {
                    alert("Link copied to clipboard!");
                  }
                }}
                className="p-2 rounded-xl border border-gray-200 bg-white text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                title="Share Recipe"
              >
                <Share className="w-3.5 h-3.5" />
              </button>
            )}

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
                onToggleCompare && onToggleCompare(recipe);
              }}
              className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                selectedForCompare.some((r) => r.title === recipe.title)
                  ? "bg-indigo-600 border-indigo-600 text-white"
                  : "bg-white border-gray-200 text-gray-400 hover:bg-gray-100"
              }`}
              title="Select for Side-by-Side Comparison"
            >
              <Scale className="w-3.5 h-3.5" />
            </button>

            {!isGeneratedModal && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onTogglePin && onTogglePin(recipe);
                  }}
                  className={`p-2 rounded-xl border transition-all cursor-pointer ${
                    pinnedRecipes.some((p) => (p.id || p.title) === (recipe.id || recipe.title))
                      ? "bg-amber-500 border-amber-600 text-white shadow-xs"
                      : "bg-white border-gray-200 text-gray-400 hover:bg-amber-50 hover:text-amber-600"
                  }`}
                  title="Pin for Tandem Cooking / Reverse Scheduler"
                >
                  <Pin className="w-3.5 h-3.5" />
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
              </>
            )}
          </div>
        </div>
      </div>

      {/* 👉 INTERACTIVE INGREDIENT MATCH BREAKDOWN MODAL */}
      {showMatchModal && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 animate-in fade-in" onClick={() => setShowMatchModal(false)}>
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h3 className="font-black text-base text-gray-900">Ingredient Match Breakdown</h3>
                <p className="text-xs text-indigo-600 font-bold">{matchPct}% Match ({matchedCount} of {total} items in stock)</p>
              </div>
              <button onClick={() => setShowMatchModal(false)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full bg-gray-50 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Combined Ingredients List with Quick Have/Need Toggles */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Recipe Ingredients</span>
              <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                {recipe.allIngredients?.map((ing, i) => {
                  const matchedItem = inventory.find((invItem) =>
                    invItem.name?.toLowerCase().includes(ing.name?.toLowerCase()) ||
                    ing.name?.toLowerCase().includes(invItem.name?.toLowerCase())
                  );
                  const inPantry = Boolean(matchedItem);

                  return (
                    <div key={i} className="flex items-center justify-between text-xs py-2 px-3 bg-gray-50 rounded-xl border border-gray-100 gap-2">
                      <span className="flex items-center gap-2 min-w-0 flex-1">
                        {inPantry ? <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" /> : <span className="w-4 h-4 text-rose-400 font-bold text-center shrink-0">✗</span>}
                        <span className={`truncate ${inPantry ? "font-bold text-gray-800" : "text-gray-600"}`}>
                          <span className="font-mono text-gray-400 mr-1">{ing.quantity} {ing.unit !== "unit" ? ing.unit : ""}</span> {ing.name}
                        </span>
                      </span>

                      {/* 👉 In Stock / Missing Toggle Button */}
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (inPantry && matchedItem?.id && db && activeWorkspace?.id) {
                            await deleteDoc(doc(db, `/artifacts/${appId}/workspaces/${activeWorkspace.id}/inventory`, matchedItem.id)).catch(() => {});
                          } else if (!inPantry) {
                            if (onAddToPantry) {
                              await onAddToPantry(ing.name);
                            }
                          }
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors shrink-0 ${
                          inPantry
                            ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                            : "bg-rose-100 text-rose-700 hover:bg-rose-200"
                        }`}
                      >
                        {inPantry ? "In Stock (Have)" : "Missing (Need)"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {missingIngs.length > 0 && (
              <button
                onClick={() => {
                  const missingNames = missingIngs.map(i => i.name);
                  if (onAddToGrocery) {
                    onAddToGrocery(missingNames);
                    setShowMatchModal(false);
                  }
                }}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer flex items-center justify-center gap-2"
              >
                <ShoppingCart className="w-4 h-4" /> Add Missing Items to Shopping List
              </button>
            )}
          </div>
        </div>
      )}
    </>
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
const EditRecipeModal = ({ recipe, onClose, onSave, db, appId, effectiveUserId, isAdmin }) => {
  const [title, setTitle] = useState(recipe.title || "");
  const [description, setDescription] = useState(recipe.description || "");
  const [instructions, setInstructions] = useState(recipe.instructions || "");
  const [servings, setServings] = useState(recipe.servings || 4);
  const [image, setImage] = useState(recipe.image || null);
  const [saving, setSaving] = useState(false);

  // Parse existing duration strings into discrete hour and minute integers
  const totalPrepMins = parsePrepTime(recipe.prepTime || "15 mins");
  const [prepHours, setPrepHours] = useState(Math.floor(totalPrepMins / 60));
  const [prepMins, setPrepMins] = useState(totalPrepMins % 60);

  const totalCookMins = parsePrepTime(recipe.cookTime || "0 mins");
  const [cookHours, setCookHours] = useState(Math.floor(totalCookMins / 60));
  const [cookMins, setCookMins] = useState(totalCookMins % 60);

  const handleImageSelect = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const resized = await resizeImage(file, 600);
      setImage(resized);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Format standardized duration strings
      const formatDuration = (h, m) => {
        const numH = parseInt(h, 10) || 0;
        const numM = parseInt(m, 10) || 0;
        if (numH === 0 && numM === 0) return "0 mins";
        const parts = [];
        if (numH > 0) parts.push(`${numH} hr${numH > 1 ? "s" : ""}`);
        if (numM > 0) parts.push(`${numM} mins`);
        return parts.join(" ");
      };

      const standardizedPrepTime = formatDuration(prepHours, prepMins);
      const standardizedCookTime = formatDuration(cookHours, cookMins);

      const payload = {
        title,
        description,
        instructions,
        prepTime: standardizedPrepTime,
        cookTime: standardizedCookTime,
        servings: parseInt(servings, 10) || 4,
        image,
        authorName: recipe.authorName || "Pantry Chef",
        sourceUrl: recipe.sourceUrl || "",
        sourceName: recipe.sourceName || "",
        allIngredients: recipe.allIngredients || [],
        recommendedGear: recipe.recommendedGear || [],
        createdAt: recipe.createdAt || serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      // Check if user is the original creator or an admin
      const isMasterOwner = Boolean(effectiveUserId && recipe.createdBy && recipe.createdBy === effectiveUserId);
      const canDirectEdit = isMasterOwner || isAdmin;

      let targetId = recipe.firestoreId || (recipe.id && isNaN(Number(recipe.id)) && !String(recipe.id).includes(".") ? recipe.id : null);

      if (canDirectEdit && targetId) {
        // Direct update to existing master document
        const recipeRef = doc(db, `/artifacts/${appId}/public/data/userRecipes`, targetId);
        await setDoc(recipeRef, payload, { merge: true });
        onSave({ ...recipe, id: targetId, firestoreId: targetId, ...payload });
      } else {
        // Fork a private copy into the user's personal vault
        const privateRef = await addDoc(
          collection(db, `/artifacts/${appId}/users/${effectiveUserId}/savedRecipes`),
          {
            ...recipe,
            ...payload,
            isForkedCopy: true,
            originalAuthor: recipe.authorName || "Pantry Chef AI",
            savedAt: serverTimestamp(),
            createdAt: serverTimestamp(),
            createdBy: effectiveUserId,
          }
        );
        onSave({ ...recipe, id: privateRef.id, firestoreId: privateRef.id, ...payload, isForkedCopy: true });
        triggerNotification("📝 Changes saved as your private customized edition!");
      }

      onClose();
    } catch (err) {
      console.error("Failed to update recipe:", err);
      alert("Error saving updates.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b pb-3">
          <h3 className="font-black text-base text-gray-900">
            Edit Recipe (Owner / Admin Override)
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
              Recipe Image
            </label>
            <div className="flex items-center gap-3">
              {image ? (
                <img
                  src={image}
                  alt="Preview"
                  className="w-16 h-16 rounded-xl object-cover border border-gray-200 shadow-2xs"
                />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 text-xs">
                  No Image
                </div>
              )}
              <div className="flex-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                />
                {image && (
                  <button
                    type="button"
                    onClick={() => setImage(null)}
                    className="text-[10px] text-red-500 font-bold mt-1 cursor-pointer hover:underline"
                  >
                    Remove Image
                  </button>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
              Title
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:border-indigo-500"
              required
            />
          </div>

          {/* ROW 1: 50/50 TIME CONTROLS */}
          <div className="grid grid-cols-2 gap-3">
            {/* Prep Time Block */}
            <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-200">
              <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">
                Prep Time
              </label>
              <div className="flex items-center gap-1.5">
                <div className="flex-1 flex items-center bg-white border border-gray-200 rounded-lg px-2 py-1">
                  <input
                    type="number"
                    min="0"
                    value={prepHours}
                    onChange={(e) => setPrepHours(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    className="w-full text-xs font-bold outline-none text-gray-800"
                  />
                  <span className="text-[10px] text-gray-400 font-bold ml-1">hr</span>
                </div>
                <div className="flex-1 flex items-center bg-white border border-gray-200 rounded-lg px-2 py-1">
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={prepMins}
                    onChange={(e) => setPrepMins(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    className="w-full text-xs font-bold outline-none text-gray-800"
                  />
                  <span className="text-[10px] text-gray-400 font-bold ml-1">min</span>
                </div>
              </div>
            </div>

            {/* Cook Time Block */}
            <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-200">
              <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">
                Cook / Heat Time
              </label>
              <div className="flex items-center gap-1.5">
                <div className="flex-1 flex items-center bg-white border border-gray-200 rounded-lg px-2 py-1">
                  <input
                    type="number"
                    min="0"
                    value={cookHours}
                    onChange={(e) => setCookHours(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    className="w-full text-xs font-bold outline-none text-gray-800"
                  />
                  <span className="text-[10px] text-gray-400 font-bold ml-1">hr</span>
                </div>
                <div className="flex-1 flex items-center bg-white border border-gray-200 rounded-lg px-2 py-1">
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={cookMins}
                    onChange={(e) => setCookMins(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    className="w-full text-xs font-bold outline-none text-gray-800"
                  />
                  <span className="text-[10px] text-gray-400 font-bold ml-1">min</span>
                </div>
              </div>
            </div>
          </div>

          {/* ROW 2: SERVINGS STEPPER */}
          <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-200 flex items-center justify-between">
            <div>
              <label className="block text-[10px] font-black text-gray-500 uppercase">
                Servings / Yield
              </label>
              <span className="text-xs text-gray-400">Total recipe portions</span>
            </div>
            <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-2 py-1">
              <button
                type="button"
                onClick={() => setServings((s) => Math.max(1, s - 1))}
                className="w-6 h-6 flex items-center justify-center font-bold text-gray-500 hover:text-indigo-600 cursor-pointer"
              >
                -
              </button>
              <span className="w-8 text-center font-mono font-bold text-xs text-gray-800">
                {servings}
              </span>
              <button
                type="button"
                onClick={() => setServings((s) => s + 1)}
                className="w-6 h-6 flex items-center justify-center font-bold text-gray-500 hover:text-indigo-600 cursor-pointer"
              >
                +
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none resize-none h-16"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
              Instructions (Line breaks force steps)
            </label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none resize-none h-32 font-mono"
              required
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 text-gray-500 font-bold text-xs bg-gray-100 rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold text-xs shadow-md hover:bg-indigo-700 cursor-pointer disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
const GeneratedBatchModal = ({ 
  recipes, onClose, onSelectRecipe, onAddToPlan, 
  savedRecipes, onToggleSave, onVote, inventory, 
  onAddToGrocery, onAddToPantry, db, appId, effectiveUserId, onViewAuthor,
  selectedForCompare, onToggleCompare, activeWorkspace, onOpenMatchBreakdown
}) => {
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white w-full max-w-4xl rounded-3xl p-6 shadow-2xl flex flex-col max-h-[90vh] animate-in slide-in-from-bottom">
        <div className="flex justify-between items-center border-b border-gray-100 pb-4 mb-4">
          <div>
            <h3 className="font-black text-lg text-gray-900">✨ Generated Custom Recipes</h3>
            <p className="text-xs text-gray-500">Explore your custom recipes below. Click any card to inspect full instructions or select for side-by-side comparison.</p>
          </div>
          {/* In-Context Bookmark Guidance */}
          <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-2xl mb-4 flex items-center gap-2.5 text-xs text-indigo-900">
            <Bookmark className="w-4 h-4 text-indigo-600 fill-current shrink-0" />
            <span>
              <strong>Save your favorites:</strong> Tap the <strong>Bookmark (🔖)</strong> icon on any recipe below to store it in your personal Saved Vault. You can also retrieve your last 10 generations anytime from the Cook tab recall track.
            </span>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {recipes.map((r) => (
              <RecipeCard
                key={r.id || r.title}
                recipe={r}
                inventory={inventory}
                onClick={() => onSelectRecipe(r)}
                onAddToPlan={onAddToPlan}
                onAddToGrocery={onAddToGrocery}
                onAddToPantry={onAddToPantry}
                activeWorkspace={activeWorkspace}
                onOpenMatchBreakdown={onOpenMatchBreakdown}
                db={db}
                appId={appId}
                effectiveUserId={effectiveUserId}
                isSaved={savedRecipes.some((s) => s.title === r.title)}
                onToggleSave={onToggleSave}
                onVote={onVote}
                onAuthorClick={() => onViewAuthor(r)}
                selectedForCompare={selectedForCompare}
                onToggleCompare={onToggleCompare}
                onTogglePin={handleTogglePin}
              />
            ))}
          </div>
        </div>

        <div className="pt-4 border-t border-gray-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold rounded-xl cursor-pointer shadow-sm"
          >
            Done / Return to Feed
          </button>
        </div>
      </div>
    </div>
  );
};
const RecipeDetailView = ({
  recipe,
  onClose,
  onUpdateRecipe,
  onDeleteRecipe,
  onNukeRecipe,
  onViewAuthor,
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
  pinnedRecipes = [],
  onTogglePin,
  selectedForCompare = [],
  onToggleCompare,
  askAIChef,
  onOpenBatchModal,
  isAdmin,
  db,
  appId,
  onOpenAdd,
  onQuickShop,
  onOpenAI,
  onOpenReverseScheduler,
  onRegenerate,
  communityRecipes = [],
  savedRecipes = [],
  fetchAIRecipes,
  activeFilters,
  onSelectRecipe,
  activeWorkspace,
  onOpenAdaptModal,
  justAdapted = false,
  onDismissJustAdapted,
}) => {
  const baseServings = recipe.servings || 4;
   // SMART SCALING: Default to household roster size if in family mode
  const calculatedDefaultServings = (userProfile?.familyModeActive ?? true) && userProfile?.householdMembers?.length > 0 
    ? userProfile.householdMembers.length 
    : (parseInt(userProfile?.householdSize) || baseServings);

  const [servings, setServings] = useState(calculatedDefaultServings);
  const [cookingMode, setCookingMode] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false); // Edit modal state
  const [selectedMissing, setSelectedMissing] = useState([]);
  const [showConverter, setShowConverter] = useState(false);
  const [ovenStatus, setOvenStatus] = useState("off");
  const [isNoteExpanded, setIsNoteExpanded] = useState(false);
  const [currentNote, setCurrentNote] = useState(userNote || "");
  const [noteSavedAnim, setNoteSavedAnim] = useState(false);
  const [activeSideModal, setActiveSideModal] = useState(null);
  const [showModificationsDiff, setShowModificationsDiff] = useState(false);
  // Check if this specific recipe is actively cooking in globalTimers
  const activeRecipeTimer = useMemo(() => {
    if (!globalTimers?.length) return null;
    return globalTimers.find((t) => {
      const tId = t.recipeData?.firestoreId || t.recipeData?.id || t.id;
      const rId = recipe.firestoreId || recipe.id;
      if (tId && rId && tId === rId) return true;
      const tTitle = (t.recipeData?.title || t.recipeTitle || "").trim().toLowerCase();
      const rTitle = (recipe.title || "").trim().toLowerCase();
      return tTitle.length > 0 && tTitle === rTitle;
    });
  }, [globalTimers, recipe]);

  const isDishPinned = useMemo(() => {
    return Boolean(activeRecipeTimer) || pinnedRecipes.some((p) => {
      const pId = p.firestoreId || p.id;
      const rId = recipe.firestoreId || recipe.id;
      if (pId && rId && pId === rId) return true;
      const pTitle = (p.title || p.recipeTitle || "").trim().toLowerCase();
      const rTitle = (recipe.title || "").trim().toLowerCase();
      return pTitle.length > 0 && pTitle === rTitle;
    });
  }, [pinnedRecipes, activeRecipeTimer, recipe]);

   // Check if current user owns a private tailored fork of this master recipe
  const matchingUserFork = useMemo(() => {
    if (recipe.isCustomFork || !savedRecipes?.length) return null;
    return savedRecipes.find((s) =>
      s.isCustomFork &&
      (s.baseRecipeId === (recipe.firestoreId || recipe.id) ||
       s.baseRecipeTitle?.toLowerCase() === recipe.title?.toLowerCase())
    );
  }, [recipe, savedRecipes]);

  // Check if we can link back to the public master recipe
  const matchingMasterRecipe = useMemo(() => {
    if (!recipe.isCustomFork || !communityRecipes?.length) return null;
    return communityRecipes.find((c) =>
      (recipe.baseRecipeId && (c.firestoreId === recipe.baseRecipeId || c.id === recipe.baseRecipeId)) ||
      (recipe.baseRecipeTitle && c.title?.toLowerCase() === recipe.baseRecipeTitle?.toLowerCase())
    );
  }, [recipe, communityRecipes]);
  

  const handleQuickShopPrompt = () => {
    const input = prompt("Enter item(s) to add (separate multiple with commas):");
    if (input && input.trim()) {
      const items = input.split(",").map(i => i.trim()).filter(Boolean);
      if (items.length > 0 && onAddToGrocery) {
        onAddToGrocery(items);
      }
    }
  };

  const handleSaveAndConfirm = (id, text) => {
    onSaveNote(id, text);
    setNoteSavedAnim(true);
    setTimeout(() => {
      setNoteSavedAnim(false);
      setIsNoteExpanded(false);
    }, 2000);
  };
  
  const [planDay, setPlanDay] = useState("Mon");
  const [planType, setPlanType] = useState("Dinner");
  const [planTime, setPlanTime] = useState("18:00");
  const [planReminder, setPlanReminder] = useState(false);

  // Safe instructions string conversion preventing .match() crashes
  const instructionsStr = typeof recipe.instructions === 'string' 
    ? recipe.instructions 
    : Array.isArray(recipe.instructions) 
    ? recipe.instructions.join('\n') 
    : String(recipe.instructions || '');

  const ovenTempMatch = instructionsStr.match(/(\d{3})(?:°|\s*degrees)?\s*F/i);
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

  const [showGearDrawer, setShowGearDrawer] = useState(false);
  
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

  

  // Hybrid Formatter: Strict user line breaks + smart AI sentence splitting fallback
  const formatInstructions = (instructions) => {
    if (!instructions) return "";

    if (Array.isArray(instructions)) {
      return instructions
        .map((step, idx) => `${idx + 1}. ${step.replace(/^\d+[\).\s-]*\s*/, "")}`)
        .join("\n\n");
    }

    const text = String(instructions).trim();

    // If user explicitly used line breaks, respect them 100% without guessing
    if (text.includes("\n")) {
      const lines = text
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);

      return lines
        .map((line, idx) => {
          const cleanLine = line.replace(/^\d+[\).\s-]*\s*/, "");
          return `${idx + 1}. ${cleanLine}`;
        })
        .join("\n\n");
    }

    if (/^\d+\./.test(text)) {
      return text;
    }

    // Fallback: Smart split for unstructured paragraphs
    const sentences = text
      .replace(/([.?!])\s*(?=[A-Z])/g, "$1|")
      .split("|")
      .map((s) => s.trim())
      .filter(Boolean);

    if (sentences.length > 1) {
      return sentences.map((s, idx) => `${idx + 1}. ${s}`).join("\n\n");
    }

    return `1. ${text}`;
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
        onOpenReverseScheduler={onOpenReverseScheduler}
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
            onError={(e) => { e.target.parentElement.style.display = 'none'; }}
          />
        </div>
      )}
      <div className="p-4 border-b flex items-center justify-between sticky top-0 bg-white z-10">
        <button onClick={onClose} className="p-2 -ml-2 cursor-pointer">
          <ChevronLeft />
        </button>
        
        <div className="flex-1 px-2">
          <h2 className="font-bold truncate text-sm">{recipe.title}</h2>

          {/* ACCESSIBLE ATTRIBUTION BAR (ADA COMPLIANT SEPARATION) */}
          <div className="flex items-center gap-2 flex-wrap mt-1">
            {/* IN-APP PROFILE TARGET */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onViewAuthor && onViewAuthor(recipe);
              }}
              className="inline-flex items-center gap-1.5 text-[10px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/80 px-2.5 py-1 rounded-lg cursor-pointer transition-colors shadow-2xs"
              title="View Publisher / Chef Archive"
            >
              <ChefHat className="w-3 h-3 text-indigo-600" />
              <span>By {recipe.authorName || (recipe.sourceUrl ? getCleanDomainName(recipe.sourceUrl) : "Community Chef")}</span>
            </button>

            {/* EXTERNAL OUTBOUND LINK (WHEN PRESENT) */}
            {recipe.sourceUrl && !recipe.sourceUrl.includes("example.com") && (
              <a
                href={recipe.sourceUrl}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center text-[10px] font-bold text-gray-600 bg-gray-50 hover:bg-gray-100 border border-gray-200 px-2.5 py-1 rounded-lg transition-colors"
                title="Open canonical web article"
              >
                <ExternalLink className="w-3 h-3 mr-1 text-gray-400" /> Source Website ↗
              </a>
            )}
          </div>
        </div>
        
        <div className="flex gap-2 items-center overflow-x-auto no-scrollbar py-1">
          {isAdmin && (
            <button
              onClick={() => onRegenerate && onRegenerate(recipe)}
              className="px-2.5 py-1.5 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-xl cursor-pointer transition-colors flex items-center gap-1 shrink-0 shadow-2xs"
              title="Re-run AI Copycat Analysis"
            >
              ✨ Re-run AI
            </button>
          )}

          {/* EDIT BUTTON: Strictly check authenticated ownership or admin status */}
          {(Boolean(effectiveUserId && recipe.createdBy && recipe.createdBy === effectiveUserId) || isAdmin) && (
            <button
              onClick={() => setShowEditModal(true)}
              className="p-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-full cursor-pointer transition-colors shrink-0"
              title="Edit Recipe"
            >
              <Edit className="w-4 h-4" />
            </button>
          )}

          {/* SCALE / COMPARE BUTTON */}
          <button
            type="button"
            onClick={() => onToggleCompare && onToggleCompare(recipe)}
            className={`p-2 rounded-full cursor-pointer shrink-0 transition-colors ${
              selectedForCompare.some((r) => r.title === recipe.title)
                ? "bg-indigo-600 text-white shadow-xs"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            }`}
            title="Select for Side-by-Side Comparison"
          >
            <Scale className="w-4 h-4" />
          </button>

          {/* PIN BUTTON IN DETAIL VIEW */}
          <button
            type="button"
            onClick={() => onTogglePin && onTogglePin(recipe)}
            className={`p-2 rounded-full cursor-pointer shrink-0 transition-all ${
              isDishPinned
                ? "bg-amber-500 text-white shadow-xs"
                : "bg-gray-100 text-gray-400 hover:bg-amber-50 hover:text-amber-600"
            }`}
            title={activeRecipeTimer ? "Cooking on stovetop (Tap to unpin/stop)" : "Pin for Tandem Cooking"}
          >
            <Pin className="w-4 h-4 fill-current" />
          </button>

          <div className="flex items-center bg-gray-100 rounded-full px-2 py-1 text-[10px] font-bold text-gray-600 border border-gray-200 shrink-0">
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
            className={`p-2 rounded-full cursor-pointer shrink-0 ${
              showConverter ? "bg-indigo-600 text-white" : "text-indigo-600 bg-indigo-50"
            }`}
          >
            <ArrowRightLeft className="w-4 h-4" />
          </button>

          <button
            onClick={() => onToggleSave(recipe)}
            className={`p-2 rounded-full cursor-pointer shrink-0 ${
              isSaved ? "bg-pink-100 text-pink-600" : "bg-gray-100 text-gray-400 hover:bg-gray-200"
            }`}
          >
            <Bookmark className={`w-4 h-4 ${isSaved ? "fill-current" : ""}`} />
          </button>

          <button
            onClick={() => setShowPlanModal(true)}
            className="p-2 text-indigo-600 bg-indigo-50 rounded-full cursor-pointer shrink-0"
          >
            <Calendar className="w-4 h-4" />
          </button>

          {isAdmin ? (
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => {
                  if (window.confirm("Permanent Delete: Remove this recipe?")) {
                    if (onDeleteRecipe) onDeleteRecipe(recipe);
                  }
                }}
                className="p-2 text-red-500 bg-red-50 hover:bg-red-100 rounded-full cursor-pointer transition-colors"
                title="Delete Recipe"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              <button
                onClick={() => {
                  if (onNukeRecipe) onNukeRecipe(recipe);
                }}
                className="px-2.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black shadow-xs cursor-pointer transition-colors flex items-center gap-1"
                title="Nuke Recipe"
              >
                ☢️ Nuke
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowReportModal(true)}
              className="px-2.5 py-1.5 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl cursor-pointer transition-colors flex items-center gap-1.5 shrink-0"
            >
              <AlertOctagon className="w-3.5 h-3.5" /> Report
            </button>
          )}
        </div>
      </div>

      {showConverter && (
        <div className="absolute top-16 left-0 right-0 z-20 p-4 bg-white/95 backdrop-blur-sm border-b border-indigo-100 shadow-xl">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-xs font-bold text-indigo-800 uppercase">
              Quick Converter
            </h4>
            <button onClick={() => setShowConverter(false)}>
              <X className="w-4 h-4 text-gray-400 cursor-pointer" />
            </button>
          </div>
          <ConverterWidget />
        </div>
      )}

      <div className="p-4 space-y-6 flex-grow overflow-auto pb-24">
        {/* ACTIVE STOVETOP STATUS BANNER */}
        {activeRecipeTimer && (
          <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-white p-3.5 rounded-2xl shadow-sm flex items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-2 bg-white/20 rounded-xl shrink-0 animate-pulse">
                <Flame className="w-4 h-4 text-white" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-wider">
                    Currently Cooking on Stovetop
                  </span>
                  <span className="text-[10px] bg-black/30 px-2 py-0.5 rounded font-mono font-bold uppercase">
                    {activeRecipeTimer.phase}
                  </span>
                </div>
                <p className="text-[11px] text-amber-100 truncate">
                  {activeRecipeTimer.phase === "countdown"
                    ? `Prep scheduled for ${activeRecipeTimer.prepClockTime}`
                    : activeRecipeTimer.phase === "prep"
                    ? `Active prep stage (Cook at ${activeRecipeTimer.cookClockTime})`
                    : `Active cooking stage (Done at ${activeRecipeTimer.targetClockTime})`}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onOpenReverseScheduler && onOpenReverseScheduler()}
              className="px-3 py-1.5 bg-white text-orange-600 rounded-xl text-xs font-bold shadow-xs hover:bg-amber-50 cursor-pointer shrink-0"
            >
              Manage
            </button>
          </div>
        )}
        <p className="text-gray-600 text-sm italic">"{recipe.description}"</p>
        <div className="flex items-center justify-between bg-gray-50 rounded-2xl border border-gray-200/80 overflow-hidden shadow-2xs">
          <div className="flex items-center gap-4 text-xs font-bold text-gray-700 px-4 py-3 flex-wrap">
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-indigo-600" /> Prep: 
              <span className="font-semibold text-gray-900">{recipe.prepTime || "15 mins"}</span>
            </span>
            {recipe.cookTime && recipe.cookTime !== "0 mins" && (
              <span className="flex items-center gap-1.5 text-amber-700">
                <Flame className="w-4 h-4 text-amber-500" /> Cook: 
                <span className="font-semibold text-gray-900">{recipe.cookTime}</span>
              </span>
            )}
          </div>
          <TakeoutArbitragePill recipe={recipe} servings={servings} userProfile={userProfile} />
        </div>

        {/* RE-ADAPTATION SUCCESS BANNER */}
        {justAdapted && (
          <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex items-center justify-between gap-3 shadow-sm animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-emerald-600 text-white rounded-xl shrink-0">
                <CheckCircle className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-black text-emerald-950 uppercase tracking-wide">
                  Kitchen Edition Updated
                </h4>
                <p className="text-[11px] text-emerald-800 leading-snug">
                  Your new adjustments have been applied directly to this dish. Check the modifications below.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onDismissJustAdapted && onDismissJustAdapted()}
              className="p-1 text-emerald-600 hover:text-emerald-900 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* UNIFIED ADAPTATION & FORK ACTION BLOCK */}
        {!recipe.isCustomFork && matchingUserFork ? (
          /* STATE 1: MASTER VIEW WHEN A TAILORED FORK ALREADY EXISTS */
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-2xl p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span className="text-xs font-black text-purple-950 uppercase tracking-wide">
                  Kitchen Edition Available
                </span>
              </div>
              <span className="text-[10px] text-purple-700 font-bold bg-white px-2 py-0.5 rounded-md border border-purple-200">
                Customized by You
              </span>
            </div>

            {/* Inline Diff Preview on Master Recipe */}
            {matchingUserFork.customModifications && matchingUserFork.customModifications.length > 0 ? (
              <div className="text-xs text-purple-900 bg-white/80 p-3 rounded-xl border border-purple-200 space-y-1.5">
                <span className="text-[10px] font-black text-purple-800 uppercase tracking-wider block">
                  Your Saved Modifications:
                </span>
                <ul className="space-y-1 pl-1">
                  {matchingUserFork.customModifications.map((mod, i) => (
                    <li key={i} className="text-xs text-purple-950 flex items-start gap-1.5">
                      <span className="text-purple-600 font-bold">•</span>
                      <span>{mod}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-xs text-purple-800 leading-snug">
                Customized for your pantry stock and kitchen appliances.
              </p>
            )}

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => onSelectRecipe && onSelectRecipe(matchingUserFork)}
                className="flex-1 py-2.5 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                Open My Kitchen Edition ↗
              </button>
              <button
                type="button"
                onClick={() => onOpenAdaptModal && onOpenAdaptModal(matchingUserFork)}
                className="px-3.5 py-2.5 bg-white hover:bg-purple-100 text-purple-800 border border-purple-300 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                title="Tweak your existing kitchen edition with new adjustments"
              >
                Tweak Edition (AI)
              </button>
            </div>
          </div>
        ) : !recipe.isCustomFork ? (
          /* STATE 2: MASTER VIEW WHEN NO FORK EXISTS YET */
          <button
            type="button"
            onClick={() => onOpenAdaptModal && onOpenAdaptModal(recipe)}
            className="w-full py-3 bg-gradient-to-r from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100 border border-indigo-200 text-indigo-700 font-bold text-xs rounded-2xl flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-2xs"
          >
            <Sparkles className="w-4 h-4 text-indigo-600" /> Adapt to My Kitchen
          </button>
        ) : (
          /* STATE 3: PRIVATE FORK VIEW */
          <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 space-y-3 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-purple-600 mt-0.5 shrink-0" />
                <div>
                  <h4 className="text-xs font-black text-purple-950 uppercase tracking-wide">
                    Private Edition: Customized for Your Kitchen
                  </h4>
                  <p className="text-[11px] text-purple-700">
                    Adapted by You (Base: {recipe.baseRecipeTitle || "Master Recipe"})
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowModificationsDiff(!showModificationsDiff)}
                  className="px-3 py-1.5 bg-white border border-purple-300 hover:bg-purple-100 text-purple-900 rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                >
                  {showModificationsDiff ? "Hide Changes ▲" : "See What Changed ▼"}
                </button>

                {matchingMasterRecipe && (
                  <button
                    type="button"
                    onClick={() => onSelectRecipe && onSelectRecipe(matchingMasterRecipe)}
                    className="px-3 py-1.5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                    title="View original master recipe"
                  >
                    Original Recipe ↗
                  </button>
                )}
              </div>
            </div>

            {/* Expandable Diff on Fork */}
            {showModificationsDiff && (
              <div className="pt-2 border-t border-purple-200/80 space-y-2 animate-in fade-in">
                <span className="text-[10px] font-black text-purple-800 uppercase tracking-wider block">
                  Kitchen Substitutions and Calibration:
                </span>
                {recipe.customModifications && recipe.customModifications.length > 0 ? (
                  <ul className="space-y-1.5 pl-1">
                    {recipe.customModifications.map((mod, idx) => (
                      <li key={idx} className="text-xs text-purple-900 flex items-start gap-2">
                        <span className="text-purple-600 font-bold">•</span>
                        <span>{mod}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-purple-800 italic">
                    Calibrated for: "{recipe.userCustomInstructions || "Pantry inventory and dietary profile"}".
                  </p>
                )}
              </div>
            )}

            {/* Direct Tweak Button on Private Fork */}
            <div className="pt-2 border-t border-purple-200">
              <button
                type="button"
                onClick={() => onOpenAdaptModal && onOpenAdaptModal(recipe)}
                className="w-full py-2 bg-white hover:bg-purple-100 border border-purple-300 text-purple-900 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-600" /> Tweak / Re-adapt This Edition (AI)
              </button>
            </div>
          </div>
        )}

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

{/* GROUPED COPYCAT VS CLASSIC SIDES SECTION WITH BUY VS. MAKE SHORTCUTS */}
{/* 👉 GROUPED COPYCAT VS CLASSIC SIDES SECTION WITH PANTRY MATCH & BUY/MAKE */}
{recipe.recommendedSides && recipe.recommendedSides.length > 0 && (
  <div className="bg-purple-50 p-4 rounded-2xl border border-purple-100 space-y-3">
    <h4 className="text-xs font-bold text-purple-900 uppercase flex items-center gap-2">
      <Utensils className="w-3.5 h-3.5 text-purple-600" /> Complete the Meal & Pantry Match
    </h4>

    {(() => {
      const getStoreEquivalent = (name) => {
        const lower = name.toLowerCase();
        if (lower.includes("garlic bread")) return "Frozen Garlic Bread Loaf";
        if (lower.includes("salad")) return "Bagged Salad Kit";
        if (lower.includes("mashed potato")) return "Deli Mashed Potatoes Tub";
        if (lower.includes("coleslaw")) return "Deli Coleslaw Tub";
        if (lower.includes("rice")) return "Boxed Rice Pilaf Mix";
        if (lower.includes("fries") || lower.includes("french fries")) return "Frozen French Fries Bag";
        if (lower.includes("onion rings")) return "Frozen Onion Rings Bag";
        return `Pre-made ${name}`;
      };

      // Helper to calculate match percentage from local community recipes
      const getSideMatch = (sideName) => {
        const queryStr = sideName.toLowerCase();
        const match = communityRecipes?.find(r => 
          r.title?.toLowerCase().includes(queryStr) || 
          r.description?.toLowerCase().includes(queryStr)
        );
        if (!match || !match.allIngredients) return null;
        const total = match.allIngredients.length;
        const matched = match.allIngredients.filter(ing => 
          inventory.some(inv => inv.name?.toLowerCase().includes(ing.name?.toLowerCase()) || ing.name?.toLowerCase().includes(inv.name?.toLowerCase()))
        ).length;
        return total > 0 ? Math.round((matched / total) * 100) : null;
      };

      const copycatSides = recipe.recommendedSides.filter(s => s.startsWith("🍔"));
      const classicSides = recipe.recommendedSides.filter(s => s.startsWith("🍟") || !s.startsWith("🍔"));

      return (
        <div className="space-y-3">
          {copycatSides.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[10px] font-black text-amber-700 uppercase tracking-wider block">🍔 Copycat Companion Sides</span>
              <div className="space-y-2">
                {copycatSides.map((side, i) => {
                  const cleanName = side.replace(/^🍔\s*Copycat Side:\s*/i, "").trim();
                  const storeItem = getStoreEquivalent(cleanName);
                  const matchPct = getSideMatch(cleanName);

                  return (
                    <div key={i} className="bg-amber-50/60 p-3 rounded-xl border border-amber-200/80 shadow-2xs flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-amber-900">{cleanName}</span>
                          
                          {/* Clickable Match % Badge */}
                          <button
                            onClick={() => setActiveSideModal(cleanName)}
                            className={`text-[10px] font-black px-2 py-0.5 rounded-md cursor-pointer transition-transform active:scale-95 ${
                              matchPct !== null 
                                ? matchPct > 75 ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200" : "bg-amber-100 text-amber-800 hover:bg-amber-200"
                                : "bg-indigo-100 text-indigo-800 hover:bg-indigo-200"
                            }`}
                            title="Click to inspect available and missing ingredients"
                          >
                            {matchPct !== null ? `✨ ${matchPct}% Match` : "✨ Check Match"}
                          </button>
                        </div>
                        <span className="text-[10px] text-gray-500 block truncate mt-0.5">Store Alternative: {storeItem}</span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => setActiveSideModal(cleanName)}
                          className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-800 text-[10px] font-bold rounded-lg transition-colors cursor-pointer"
                        >
                          🍽️ Make
                        </button>
                        <button
                          onClick={() => onAddToGrocery && onAddToGrocery([storeItem])}
                          className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-bold rounded-lg shadow-xs transition-colors cursor-pointer flex items-center gap-1"
                          title={`Buy pre-made ${storeItem}`}
                        >
                          <ShoppingCart className="w-3 h-3" /> Buy
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {classicSides.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[10px] font-black text-purple-700 uppercase tracking-wider block">🍟 Classic Pairings</span>
              <div className="space-y-2">
                {classicSides.map((side, i) => {
                  const cleanName = side.replace(/^🍟\s*Classic Side:\s*/i, "").trim();
                  const storeItem = getStoreEquivalent(cleanName);
                  const matchPct = getSideMatch(cleanName);

                  return (
                    <div key={i} className="bg-white p-3 rounded-xl border border-purple-200/80 shadow-2xs flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-purple-900">{cleanName}</span>
                          
                          {/* Clickable Match % Badge */}
                          <button
                            onClick={() => setActiveSideModal(cleanName)}
                            className={`text-[10px] font-black px-2 py-0.5 rounded-md cursor-pointer transition-transform active:scale-95 ${
                              matchPct !== null 
                                ? matchPct > 75 ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200" : "bg-amber-100 text-amber-800 hover:bg-amber-200"
                                : "bg-indigo-100 text-indigo-800 hover:bg-indigo-200"
                            }`}
                            title="Click to inspect available and missing ingredients"
                          >
                            {matchPct !== null ? `✨ ${matchPct}% Match` : "✨ Check Match"}
                          </button>
                        </div>
                        <span className="text-[10px] text-gray-400 block truncate mt-0.5">Store Alternative: {storeItem}</span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => setActiveSideModal(cleanName)}
                          className="px-2.5 py-1 bg-purple-100 hover:bg-purple-200 text-purple-800 text-[10px] font-bold rounded-lg transition-colors cursor-pointer"
                        >
                          🍽️ Make
                        </button>
                        <button
                          onClick={() => onAddToGrocery && onAddToGrocery([storeItem])}
                          className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white text-[10px] font-bold rounded-lg shadow-xs transition-colors cursor-pointer flex items-center gap-1"
                          title={`Buy pre-made ${storeItem}`}
                        >
                          <ShoppingCart className="w-3 h-3" /> Buy
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      );
    })()}
  </div>
)}

        {/* 👉 RENDER COPYCAT CLONE SECRETS ACCORDION IF PRESENT */}
        {recipe.cloneSecrets && recipe.cloneSecrets.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl space-y-2 shadow-2xs">
            <h4 className="text-xs font-bold text-amber-900 uppercase flex items-center gap-2">
              🍔 Restaurant Clone Secrets ({recipe.brandOrigin || "Secret Recipe"})
            </h4>
            <ul className="space-y-1.5 pl-1">
              {recipe.cloneSecrets.map((secret, i) => (
                <li key={i} className="text-xs text-amber-800 flex items-start gap-2">
                  <span className="font-bold text-amber-600">✦</span>
                  <span>{secret}</span>
                </li>
              ))}
            </ul>
            {recipe.commercialPrice && recipe.homeCost && (
              <div className="pt-2 mt-2 border-t border-amber-200/60 flex justify-between text-[11px] font-bold text-amber-900">
                <span>Estimated Restaurant Price: ${recipe.commercialPrice.toFixed(2)}</span>
                <span>Estimated Home Cost: ${recipe.homeCost.toFixed(2)}</span>
              </div>
            )}
          </div>
        )}

        {/* Recommended Gear Accordion */}
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

        {/* DYNAMIC HOUSEHOLD ADAPTATIONS ENGINE */}
        {userProfile?.familyModeActive !== false &&
          recipe.memberAdaptations &&
          recipe.memberAdaptations.some((a) => a.adaptationText && a.adaptationText.trim()) && (
            <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 space-y-3 shadow-2xs">
              <h4 className="text-xs font-black text-indigo-900 uppercase tracking-wider flex items-center gap-2 border-b border-indigo-100 pb-2">
                <Users className="w-4 h-4 text-indigo-600" /> Household Adaptations
              </h4>
              <div className="space-y-2.5">
                {recipe.memberAdaptations
                  .filter((adapt) => adapt.adaptationText && adapt.adaptationText.trim())
                  .map((adapt, idx) => {
                    let Icon = UserCircle;
                    let colorClass = "bg-white border-indigo-100 text-indigo-800";
                    const textLower = adapt.adaptationText.toLowerCase();

                    if (textLower.includes("toddler") || textLower.includes("kid") || textLower.includes("child")) {
                      Icon = Smile;
                      colorClass = "bg-white border-blue-200 text-blue-800";
                    } else if (textLower.includes("protein") || textLower.includes("mass") || textLower.includes("build")) {
                      Icon = Activity;
                      colorClass = "bg-white border-orange-200 text-orange-800";
                    } else if (textLower.includes("pregnan") || textLower.includes("health")) {
                      Icon = Heart;
                      colorClass = "bg-white border-rose-200 text-rose-800";
                    }

                    return (
                      <div key={idx} className={`p-3 rounded-xl border shadow-xs flex gap-3 ${colorClass}`}>
                        <div className="mt-0.5 shrink-0">
                          <Icon className="w-4 h-4 opacity-70" />
                        </div>
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-wider block mb-0.5 opacity-80">
                            For {adapt.memberName || "Family Member"}
                          </span>
                          <p className="text-xs font-medium leading-relaxed">
                            {adapt.adaptationText}
                          </p>
                        </div>
                      </div>
                    );
                  })}
              </div>
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
                        <span className="inline-block bg-gray-200 text-gray-700 text-[10px] font-bold px-2.5 py-0.5 rounded-full mr-2 min-w-[50px] text-center font-mono">
                          {scaledQ} {ing.unit && ing.unit !== "unit" ? ing.unit : ""}
                        </span>
                        {ing.name}
                        {isFrozen && (
                          <span className="text-[9px] font-bold text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded flex items-center gap-1 ml-2">
                            <Snowflake className="w-3 h-3" /> Defrost
                          </span>
                        )}
                      </span>
                    </div>

                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (inPantry && matchedItem?.id) {
                          await deleteDoc(
                            doc(db, `/artifacts/${appId}/workspaces/${activeWorkspace.id}/inventory`, matchedItem.id)
                          );
                        } else {
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
                  triggerNotification(`🛒 Added ${selectedMissing.length} items to shopping list!`);
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
            {/* Hybrid Formatter Output */}
            <div className="bg-gray-50 p-4 rounded-2xl text-sm text-gray-700 leading-relaxed whitespace-pre-wrap border border-gray-100 font-sans">
              {formatInstructions(recipe.instructions)}
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
            onClick={() => onOpenBatchModal(recipe)}
            className="w-full py-3.5 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-2xl font-bold shadow-md flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
          >
            <Zap className="w-4 h-4 text-amber-300" /> Cook Once, Eat Thrice (Batch Prep)
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

      {/* Edit Modal Render */}
      {showEditModal && (
        <EditRecipeModal
          recipe={recipe}
          onClose={() => setShowEditModal(false)}
          onSave={(updated) => {
            Object.assign(recipe, updated);
            if (onUpdateRecipe) onUpdateRecipe(updated);
          }}
          db={db}
          appId={appId}
          effectiveUserId={effectiveUserId}
          isAdmin={isAdmin}
        />
      )}

      {/* Render the Side Recipe Modal when a side chip is clicked */}
      {activeSideModal && (
        <SideRecipeModal
          sideName={activeSideModal}
          inventory={inventory}
          communityRecipes={communityRecipes}
          onClose={() => setActiveSideModal(null)}
          onSelectRecipe={(r) => onSelectRecipe ? onSelectRecipe(r) : setActiveRecipe(r)}
          onAddToGrocery={onAddToGrocery}
          onAddToPantry={onAddToPantry}
          fetchAIRecipes={fetchAIRecipes}
          activeFilters={activeFilters}
          userProfile={userProfile}
          db={db}
          appId={appId}
          effectiveUserId={effectiveUserId}
        />
      )}

      <SpeedDialFAB
        onOpenAdd={onOpenAdd}
        onQuickShop={onQuickShop}
        onOpenAI={onOpenAI}
      />
    </div>
  );
};
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
const SpeedDialFAB = ({ onOpenAdd, onQuickShop, onOpenAI }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed right-0 bottom-24 md:right-8 md:bottom-8 z-50 flex flex-col items-end">
      {/* Expanded Speed Dial Menu Options (Responsive sizing) */}
      {isOpen && (
        <div className="flex flex-col gap-2.5 md:gap-3 mb-3 md:mb-4 mr-3 md:mr-0 items-end animate-in fade-in slide-in-from-bottom-2 duration-200">
          <button
            onClick={() => { setIsOpen(false); onOpenAI(); }}
            className="flex items-center gap-2 md:gap-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-2.5 md:px-5 md:py-3 rounded-2xl shadow-xl text-xs md:text-sm font-bold cursor-pointer hover:opacity-95 transition-all transform active:scale-95 whitespace-nowrap"
          >
            <span>🤖 Ask AI Chef</span>
          </button>
          
          <button
            onClick={() => { setIsOpen(false); onQuickShop(); }}
            className="flex items-center gap-2 md:gap-3 bg-emerald-600 text-white px-4 py-2.5 md:px-5 md:py-3 rounded-xl shadow-xl text-xs md:text-sm font-bold cursor-pointer hover:bg-emerald-700 transition-all transform active:scale-95 whitespace-nowrap"
          >
            <span>🛒 Quick Shop Add</span>
          </button>

          <button
            onClick={() => { setIsOpen(false); onOpenAdd(); }}
            className="flex items-center gap-2 md:gap-3 bg-indigo-600 text-white px-4 py-2.5 md:px-5 md:py-3 rounded-xl shadow-xl text-xs md:text-sm font-bold cursor-pointer hover:bg-indigo-700 transition-all transform active:scale-95 whitespace-nowrap"
          >
            <span>➕ Add Pantry Item</span>
          </button>
        </div>
      )}

      {/* MOBILE UI: Tucked Edge-Tab (Hidden on Desktop) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`md:hidden bg-indigo-600 text-white pl-3.5 pr-2 py-2.5 rounded-l-full shadow-2xl flex items-center gap-1 transform transition-all duration-300 cursor-pointer border-l border-t border-b border-indigo-400/40 ${
          isOpen ? "bg-gray-900 border-gray-700 translate-x-0 pr-3" : "translate-x-2 hover:translate-x-0 active:scale-95"
        }`}
        title="Quick Actions"
      >
        <Plus className={`w-4 h-4 transition-transform duration-300 ${isOpen ? "rotate-45" : ""}`} />
        <span className="text-[9px] font-black uppercase tracking-tighter opacity-90 pr-0.5">
          {isOpen ? "Close" : " "}
        </span>
      </button>

      {/* DESKTOP UI: Classic Floating Action Bubble (Hidden on Mobile) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`hidden md:flex w-14 h-14 rounded-full shadow-2xl shadow-indigo-600/40 items-center justify-center transform transition-all duration-300 cursor-pointer ${
          isOpen ? "bg-gray-800 hover:bg-gray-900 rotate-45" : "bg-indigo-600 hover:bg-indigo-700 hover:scale-105"
        }`}
        title="Quick Actions"
      >
        <Plus className="w-6 h-6 text-white transition-transform" />
      </button>
    </div>
  );
};

const WorkspaceSwitcher = ({ activeWorkspace, userWorkspaces, onSelect, onCreateNew, onJoin }) => {
  const [isOpen, setIsOpen] = useState(false);

  // Close dropdown if clicked outside
  useEffect(() => {
    const closeMenu = (e) => { if (isOpen && !e.target.closest('.workspace-dropdown')) setIsOpen(false); };
    document.addEventListener("mousedown", closeMenu);
    return () => document.removeEventListener("mousedown", closeMenu);
  }, [isOpen]);

  if (!activeWorkspace) return null;

  return (
    <div className="relative workspace-dropdown z-50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-xl transition-colors cursor-pointer border border-gray-200"
      >
        <span className="text-lg">{activeWorkspace.type === "event" ? "⛺" : "🏠"}</span>
        <div className="text-left hidden sm:block">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider leading-none">Active Kitchen</p>
          <p className="text-xs font-black text-gray-800 leading-tight">{activeWorkspace.name}</p>
        </div>
        <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? "rotate-90" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2">
          <div className="p-2 bg-gray-50 border-b border-gray-100">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-2">Your Workspaces</span>
          </div>
          <div className="max-h-60 overflow-y-auto p-1">
            {userWorkspaces.map(ws => (
              <button
                key={ws.id}
                onClick={() => { onSelect(ws); setIsOpen(false); }}
                className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left cursor-pointer transition-colors ${
                  activeWorkspace.id === ws.id ? "bg-indigo-50 border border-indigo-100" : "hover:bg-gray-50 border border-transparent"
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0 ${activeWorkspace.id === ws.id ? "bg-indigo-200" : "bg-gray-100"}`}>
                  {ws.type === "event" ? "⛺" : "🏠"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-bold truncate ${activeWorkspace.id === ws.id ? "text-indigo-900" : "text-gray-800"}`}>{ws.name}</p>
                  <p className="text-[10px] text-gray-500 truncate">{ws.type === "event" ? `Event • ${ws.headcount || 0} people` : "Primary Household"}</p>
                </div>
                {activeWorkspace.id === ws.id && <CheckCircle className="w-4 h-4 text-indigo-600 shrink-0" />}
              </button>
            ))}
          </div>
          <div className="p-2 border-t border-gray-100 bg-gray-50 flex gap-2">
            <button
              onClick={() => { setIsOpen(false); onCreateNew(); }}
              className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Create
            </button>
            <button
              onClick={() => { setIsOpen(false); onJoin(); }}
              className="flex-1 py-2.5 bg-white border border-gray-200 hover:bg-gray-100 text-gray-700 font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <LinkIcon className="w-3.5 h-3.5" /> Join Code
            </button>
          </div>
        </div>
      )}
    </div>
  );
};



// =================================================================================
// 5. MAIN APP COMPONENT & STATE DECLARATIONS
// =================================================================================
const App = () => {
  // 5.1 Global App & Timer States
  const [globalTimers, setGlobalTimers] = useState([]); // [{ id, label, remaining, duration }]
  // STATES FOR EVENT / LARGE GROUP MODE
  const [eventMode, setEventMode] = useState({
    active: false,
    name: "",
    headcount: 8,
    restrictions: ""
  });
  const [showEventModal, setShowEventModal] = useState(false);
  const [pinnedRecipes, setPinnedRecipes] = useState(() => {
    try {
      const saved = localStorage.getItem("pantry_chef_pinned_recipes");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem("pantry_chef_pinned_recipes", JSON.stringify(pinnedRecipes));
    } catch (err) {
      console.warn("Failed to persist pinned recipes:", err);
    }
  }, [pinnedRecipes]);
// Initialize Device Permissions Engine
  const { permissions, requestPermission } = useDevicePermissions();
  const [activePermissionPrompt, setActivePermissionPrompt] = useState(null); // 'camera' | 'audio' | null

  // 5.2 Modal Toggle States
  const [showLegalModal, setShowLegalModal] = useState(false);
  const [showCreateWorkspaceModal, setShowCreateWorkspaceModal] = useState(false);
  const [newWorkspaceData, setNewWorkspaceData] = useState({ name: "", headcount: 10, restrictions: "" });
  const [showAdaptModal, setShowAdaptModal] = useState(false);
  const [showExpiringModal, setShowExpiringModal] = useState(false);
  const [showJoinWorkspaceModal, setShowJoinWorkspaceModal] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  // 👉 ROSTER ACCORDION STATE
  const [expandedRosterIndex, setExpandedRosterIndex] = useState(null);
  const [showGuidelinesModal, setShowGuidelinesModal] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showDealModal, setShowDealModal] = useState(false);
  const [showSubscription, setShowSubscription] = useState(false);
  const [showMealPrep, setShowMealPrep] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showReverseScheduler, setShowReverseScheduler] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showIngestModal, setShowIngestModal] = useState(false);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [showAddDrawer, setShowAddDrawer] = useState(false); // Mobile Add Drawer Visibility State
  const [showSoftGate, setShowSoftGate] = useState(false);
  const [showRetailerModal, setShowRetailerModal] = useState(false);
  

  // 5.3 Authentication & User Context States
  const [userId, setUserId] = useState(null);
  const [customId, setCustomId] = useState( localStorage.getItem("pantry_chef_custom_id") || "" );
  const effectiveUserId = customId.trim() || userId;
  const [isAdmin, setIsAdmin] = useState(false);
  const [isDemoAuthenticated, setIsDemoAuthenticated] = useState(false);
  const [userWaitlistStatus, setUserWaitlistStatus] = useState("pending");
  const [softGateContext, setSoftGateContext] = useState("save recipes & sync your pantry");
  const [showOnboarding, setShowOnboarding] = useState(() => { return isDemoAuthenticated && !localStorage.getItem("pantry_chef_onboarded"); });  

  // 5.4 Navigation & UI View States
  const [activeTab, setActiveTabState] = useState(() => {
      const path = window.location.pathname.replace('/', '');
      const validTabs = ["pantry", "recipes", "shopping", "budget", "community", "profile", "admin"];
      return validTabs.includes(path) ? path : "pantry";
    });
  const [pantryView, setPantryView] = useState("list");
  const [recipeView, setRecipeView] = useState("discover");
  const [quickAddTab, setQuickAddTab] = useState("single"); // 'single' or 'bulk'
  const [toolsActiveTab, setToolsActiveTab] = useState("converter");
  const [showQuickShopModal, setShowQuickShopModal] = useState(false);
  const [quickShopInput, setQuickShopInput] = useState("");

  // 5.5 Firestore Data Collection States
  const [inventory, setInventory] = useState([]);
  const [cookHistory, setCookHistory] = useState([]);
  const [communityRecipes, setCommunityRecipes] = useState([]);
  const [groceryList, setGroceryList] = useState([]);
  const [mealPlan, setMealPlan] = useState([]);
  const [savedRecipes, setSavedRecipes] = useState([]);
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [purchaseHistory, setPurchaseHistory] = useState([]);
  const [wasteHistory, setWasteHistory] = useState([]);
  const [recipeNotes, setRecipeNotes] = useState({});
  const [nutritionLogs, setNutritionLogs] = useState([]);
  const [userProfile, setUserProfile] = useState({
    firstName: "",
    lastName: "",
    name: "",
    email: "",
    zipCode: "",
    householdSize: "2 People",
    householdMembers: [
      { name: "Adult 1", ageGroup: "Adult", restrictions: [] }
    ],
    diets: [],
    equipment: [],
    image: null,
    avatar: null,
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
    creatorProgress: 0,
    challenges: {},
  });
  const [showRecentPurchasesModal, setShowRecentPurchasesModal] = useState(false);
  // WORKSPACE ARCHITECTURE STATES
  const [activeWorkspace, setActiveWorkspace] = useState(null);
  const [userWorkspaces, setUserWorkspaces] = useState([]);


  // 5.6 Data Input & Processing States
  const [selectedPantryItems, setSelectedPantryItems] = useState([]);
  const togglePantrySelection = (id) => {
    setSelectedPantryItems((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };
  const handleBulkGenerate = (mode) => {
    const names = inventory
      .filter((i) => selectedPantryItems.includes(i.id))
      .map((i) => i.name);
    const queryStr = names.join(", ");
    
    setSearchQuery(queryStr);
    setActiveTab("recipes");
    handleGetAIRecipes(mode, queryStr); // Fire immediately with selected items
    setSelectedPantryItems([]); // Clear selection
  };
  const handleBulkDelete = async () => {
    if (!window.confirm(`Delete ${selectedPantryItems.length} items from pantry?`)) return;
    const batch = writeBatch(db);
    selectedPantryItems.forEach((id) => {
      batch.delete(doc(db, `/artifacts/${appId}/workspaces/${activeWorkspace.id}/inventory`, id));
    });
    await batch.commit();
    setSelectedPantryItems([]);
  };

  const [searchQuery, setSearchQuery] = useState("");
  const [activeTriageBadge, setActiveTriageBadge] = useState(null);
  const [triagePulseActive, setTriagePulseActive] = useState(false);
  const [communitySearchQuery, setCommunitySearchQuery] = useState("");
  const [communitySourceFilter, setCommunitySourceFilter] = useState("all"); // "all" | "original" | "import" | "ai"
  const [groceryInput, setGroceryInput] = useState("");
  const [barcodeInput, setBarcodeInput] = useState("");
  const [bulkText, setBulkText] = useState("");
  const [ingestUrl, setIngestUrl] = useState("");
  const [grocerySuggestions, setGrocerySuggestions] = useState([]);
  const [dealResults, setDealResults] = useState([]);
  const [pendingDuplicateUrl, setPendingDuplicateUrl] = useState("");
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
  const groupedInventory = inventory.reduce((acc, item) => {
    const cat = item.category || "Other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  const [aiRecipes, setAiRecipes] = useState([]);
  const [quickStoreRecipes, setQuickStoreRecipes] = useState([]);
  const [loadingStoreRun, setLoadingStoreRun] = useState(false);
  const [hasCheckedStoreRun, setHasCheckedStoreRun] = useState(false);
  const [recentlyGenerated, setRecentlyGenerated] = useState([]);
  const [activeMatchRecipe, setActiveMatchRecipe] = useState(null);
  const [activeRecipe, setActiveRecipe] = useState(null);
  const [batchModalRecipe, setBatchModalRecipe] = useState(null); // Batch Cooking Modal State
  const [generatedBatch, setGeneratedBatch] = useState(null);
  const [viewingProfile, setViewingProfile] = useState(null);  
  const [redirectModalData, setRedirectModalData] = useState(null);
  const [duplicateMatch, setDuplicateMatch] = useState(null);
  const [selectedForCompare, setSelectedForCompare] = useState([]);
  const [cookingMode, setCookingMode] = useState(false);
  const [activeFilters, setActiveFilters] = useState({ proteins: [], vegetables: [], cuisine: "", mealType: "Any", maxCalories: 800, maxCost: 20, ignoreHistory: false, });
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
  const allIngredients = useMemo(() => {
    const set = new Set();
    [...communityRecipes, ...aiRecipes, ...savedRecipes].forEach((r) =>
      r.allIngredients?.forEach((i) => set.add(i.name))
    );
    return Array.from(set);
  }, [communityRecipes, aiRecipes, savedRecipes]);

  
  // Item Addition Form States
  const [newItemName, setNewItemName] = useState("");
  const [newItemCategory, setNewItemCategory] = useState("Other");
  const [newItemUnit, setNewItemUnit] = useState("pcs");
  const [newItemQty, setNewItemQty] = useState(1);
  const [newItemExpiryDays, setNewItemExpiryDays] = useState(7);
  const [submissionIngredients, setSubmissionIngredients] = useState([ { name: "", quantity: "", unit: "count" }, ]);
  const [recipeImage, setRecipeImage] = useState(null);

  // Status & Notification States
  const [justAdapted, setJustAdapted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isIngesting, setIsIngesting] = useState(false);
  const [isVoiceProcessing, setIsVoiceProcessing] = useState(false);
  const [notification, setNotification] = useState(null);
  const [notificationHistory, setNotificationHistory] = useState(() => {
    try {
      const saved = sessionStorage.getItem("pantry_chef_notif_history");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      sessionStorage.setItem("pantry_chef_notif_history", JSON.stringify(notificationHistory));
    } catch (err) {
      console.warn("Failed to cache notification history:", err);
    }
  }, [notificationHistory]);

  const triggerNotification = useCallback((message, duration = 6000, level = "info") => {
    if (!message) return;

    const logEntry = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      message,
      level,
      userId: effectiveUserId || "anonymous",
      userEmail: userProfile?.email || "Guest User",
      workspace: activeWorkspace?.name || "Default Kitchen",
      activeTab,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    };

    setNotification(message);
    setNotificationHistory((prev) => [logEntry, ...prev.slice(0, 99)]);

    setTimeout(() => {
      setNotification((current) => (current === message ? null : current));
    }, duration);
  }, [effectiveUserId, userProfile, activeWorkspace, activeTab]);

  useEffect(() => {
    const handleTest = (e) => {
      triggerNotification(e.detail, 6000, "info");
    };
    window.addEventListener("triggerDiagnosticTest", handleTest);
    return () => window.removeEventListener("triggerDiagnosticTest", handleTest);
  }, [triggerNotification]);

  // Log global console errors and unhandled promise rejections to the notification system
  useEffect(() => {
  const handleGlobalError = (event) => {
    const errorMsg = event?.message || event?.reason?.message || "Unhandled Runtime Error";
    triggerNotification(`🚨 Console Error: ${errorMsg}`, 8000, "error");
  };

  window.addEventListener("error", handleGlobalError);
  window.addEventListener("unhandledrejection", handleGlobalError);

  return () => {
    window.removeEventListener("error", handleGlobalError);
    window.removeEventListener("unhandledrejection", handleGlobalError);
  };
}, [triggerNotification]);

  const [systemNotification, setSystemNotification] = useState(null);

  // Dynamic Content States
  const [apiUsage, setApiUsage] = useState(getApiUsage());
  const [currentTip, setCurrentTip] = useState(() => { return QUICK_TIPS_POOL[Math.floor(Math.random() * QUICK_TIPS_POOL.length)]; });
  const [isTipAnimating, setIsTipAnimating] = useState(false);
  const [isTipPaused, setIsTipPaused] = useState(false);
  const hasAutoLoaded = useRef(false);
  const [recipeJustAdapted, setRecipeJustAdapted] = useState(false);
  const [showFloatingHud, setShowFloatingHud] = useState(true);
  const [timerCancelConfirm, setTimerCancelConfirm] = useState(null); // Holds { id, title }
  const [showScheduleManagerModal, setShowScheduleManagerModal] = useState(false);

  // Push or pull the active serving target by delta minutes (+/- 15m)
  const handleAdjustScheduleTargetTime = async (deltaMinutes) => {
    if (!globalTimers.length) return;

    const currentTarget = globalTimers[0]?.targetDate
      ? (globalTimers[0].targetDate instanceof Date ? globalTimers[0].targetDate : new Date(globalTimers[0].targetDate))
      : new Date();

    const newTarget = new Date(currentTarget.getTime() + deltaMinutes * 60 * 1000);
    const now = new Date();

    if (newTarget.getTime() <= now.getTime()) {
      return;
    }

    const updatedDishes = globalTimers.map((timer) => {
      const dish = timer.recipeData || { title: timer.recipeTitle, prepTime: `${timer.prepMins} mins`, cookTime: `${timer.cookMins} mins` };
      const totalMinutes = (timer.prepMins || 15) + (timer.cookMins || 0);
      const prepStartTime = new Date(newTarget.getTime() - totalMinutes * 60 * 1000);
      const cookStartTime = new Date(newTarget.getTime() - (timer.cookMins || 0) * 60 * 1000);

      return {
        ...dish,
        id: dish.firestoreId || dish.id || `dish_${dish.title.toLowerCase().replace(/[^a-z0-9]/g, "_")}`,
        prepMins: timer.prepMins,
        cookMins: timer.cookMins,
        prepStartTime,
        cookStartTime,
      };
    });

    if (db && activeWorkspace?.id) {
      await setDoc(
        doc(db, `/artifacts/${appId}/workspaces/${activeWorkspace.id}/stovetopState`, "current"),
        {
          pinnedRecipes, // Preserves all unscheduled pinned dishes
          activeSchedule: {
            targetDate: newTarget,
            dishes: updatedDishes,
            updatedAt: serverTimestamp(),
          },
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      ).catch((err) => console.error("Error shifting target time:", err));
    }

    triggerNotification(`Target finish time shifted by ${deltaMinutes > 0 ? "+" : ""}${deltaMinutes} minutes.`);
  };

  // Append a newly pinned dish to an existing schedule
  const handleAppendDishToSchedule = async (newDish) => {
    if (!globalTimers.length) return;

    // Ensure full HUD displays the updated queue
    setShowFloatingHud(true);

    const currentTarget = globalTimers[0]?.targetDate
      ? (globalTimers[0].targetDate instanceof Date ? globalTimers[0].targetDate : new Date(globalTimers[0].targetDate))
      : new Date();

    const prepMins = parsePrepTime(newDish.prepTime || "15 mins");
    const cookMins = parsePrepTime(newDish.cookTime || "0 mins");
    const totalMinutes = prepMins + cookMins;

    const prepStartTime = new Date(currentTarget.getTime() - totalMinutes * 60 * 1000);
    const cookStartTime = new Date(currentTarget.getTime() - cookMins * 60 * 1000);

    const appendedPayload = {
      ...newDish,
      id: newDish.firestoreId || newDish.id || `dish_${newDish.title.toLowerCase().replace(/[^a-z0-9]/g, "_")}`,
      prepMins,
      cookMins,
      prepStartTime,
      cookStartTime,
    };

    const existingDishes = globalTimers.map((t) => t.recipeData);
    const combinedDishes = [...existingDishes, appendedPayload];

    // Ensure pinnedRecipes preserves all items including the newly scheduled dish
    const updatedPinned = pinnedRecipes.some((p) => isSameDishApp(p, newDish))
      ? pinnedRecipes
      : [...pinnedRecipes, newDish];

    if (db && activeWorkspace?.id) {
      await setDoc(
        doc(db, `/artifacts/${appId}/workspaces/${activeWorkspace.id}/stovetopState`, "current"),
        {
          pinnedRecipes: updatedPinned,
          activeSchedule: {
            targetDate: currentTarget,
            dishes: combinedDishes,
            updatedAt: serverTimestamp(),
          },
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      ).catch((err) => console.error("Error appending dish to schedule:", err));
    }

    triggerNotification(`Added "${newDish.title}" to running schedule.`);
  };
  

 

  
  
  
  // ===============================================================================
  // 6. CORE APP EVENT HANDLERS & ACTIONS (Cook, Scan, Ingest, Sync)
  // ===============================================================================
  // Authentication Handlers
  const handleLogin = async () => {
    setShowLoginModal(false);
  
    if (auth?.currentUser && db) {
      const user = auth.currentUser;
      
      // 👉 RECORD VISITOR LOG ON LOGIN
      const visitorRef = doc(db, `/artifacts/${appId}/public/data/visitorLogs`, user.uid);
      await setDoc(visitorRef, {
        uid: user.uid,
        email: user.email || "User",
        displayName: user.displayName || "Chef Candidate",
        lastLogin: serverTimestamp()
      }, { merge: true });

      // Check custom claims for approval status
      const tokenResult = await user.getIdTokenResult(true);
      const isUserAdmin = tokenResult.claims.admin === true;
      const isUserApproved = tokenResult.claims.approved === true;

      // If not admin and not approved, register them to the waitlist doc if missing
      if (!isUserAdmin && !isUserApproved) {
        const waitlistRef = doc(db, `/artifacts/${appId}/public/data/waitlist`, user.uid);
        const docSnap = await getDoc(waitlistRef);
        
        if (!docSnap.exists()) {
          await setDoc(waitlistRef, {
            uid: user.uid,
            email: user.email || "User",
            displayName: user.displayName || "Chef Candidate",
            status: "pending",
            requestedAt: serverTimestamp()
          });
        }
      }
    }

    setIsDemoAuthenticated(true);

    if (!localStorage.getItem("pantry_chef_onboarded")) {
      setShowOnboarding(true);
    }

    triggerNotification("🎉 Successfully signed in! Syncing data...");
  };

  const handleApproveUser = async (userUid, userEmail, userName) => {
    try {
      // 1. Update Firestore waitlist status to approved
      await updateDoc(doc(db, `/artifacts/${appId}/public/data/waitlist`, userUid), {
        status: "approved"
      });

      // 2. Send free welcome email via EmailJS
      await emailjs.send(
        'service_av2qukn',     // EmailJS Service ID
        'template_8qva18u',    // EmailJS Template ID
        {
          to_email: userEmail,
          to_name: userName || 'Chef',
        },
        {
          publicKey: 'dPXwGzEYq5flm1MXi', // EmailJS Public Key
        }
      );

      triggerNotification(`✅ Approved ${userName || userEmail} and sent welcome email!`);
    } catch (err) {
      console.error("Approval email error:", err);
      alert("User approved in database, but email failed to send.");
    }
  };

  const handleCreateEventWorkspace = async () => {
    if (!newWorkspaceData.name.trim()) return alert("Please enter an event name.");
    setLoading(true);
    setStatus("Generating Event Workspace...");

    try {
      // 👉 1. Store the code in a variable first so we can use it in both places
      const generatedCode = Math.random().toString(36).substring(2, 8).toUpperCase();

      const newRef = await addDoc(collection(db, `/artifacts/${appId}/workspaces`), {
        type: "event",
        name: newWorkspaceData.name.trim(),
        headcount: parseInt(newWorkspaceData.headcount) || 10,
        restrictions: newWorkspaceData.restrictions.trim() || "None",
        inviteCode: generatedCode, // 👉 Saves to Database
        memberIds: [effectiveUserId],
        members: { [effectiveUserId]: { role: "admin", joinedAt: serverTimestamp() } },
        createdAt: serverTimestamp()
      });

      // 👉 2. Include the inviteCode in the local UI state so it shows up instantly
      const newWs = { 
        id: newRef.id, 
        type: "event", 
        name: newWorkspaceData.name.trim(), 
        headcount: newWorkspaceData.headcount,
        inviteCode: generatedCode 
      };
      
      // Update local state instantly
      setUserWorkspaces(prev => [...prev, newWs]);
      setActiveWorkspace(newWs);
      localStorage.setItem("pantry_chef_workspace_id", newRef.id);
      
      setShowCreateWorkspaceModal(false);
      setNewWorkspaceData({ name: "", headcount: 10, restrictions: "" });
      triggerNotification(`🎉 Workspace "${newWs.name}" created and activated!`);
    } catch (err) {
      console.error(err);
      alert("Failed to create workspace.");
    } finally {
      setLoading(false);
      setStatus("");
    }
  };

  const handleJoinWorkspace = async () => {
    const code = joinCode.trim().toUpperCase();
    if (!code) return alert("Please enter a 6-digit code.");
    setLoading(true);
    setStatus("Searching for workspace...");

    try {
      // 1. Find the workspace with this exact invite code
      const q = query(
        collection(db, `/artifacts/${appId}/workspaces`),
        where("inviteCode", "==", code)
      );
      const snap = await getDocs(q);

      if (snap.empty) {
        alert("Workspace not found. Check the code and try again.");
        return;
      }

      const workspaceDoc = snap.docs[0];
      const workspaceData = workspaceDoc.data();

      // 2. Check if you're already in it
      if (workspaceData.memberIds?.includes(effectiveUserId)) {
        alert("You are already a member of this workspace!");
        setShowJoinWorkspaceModal(false);
        setJoinCode("");
        return;
      }

      // 3. Add yourself to the workspace securely
      const workspaceRef = doc(db, `/artifacts/${appId}/workspaces`, workspaceDoc.id);
      await updateDoc(workspaceRef, {
        memberIds: arrayUnion(effectiveUserId),
        // Use dot notation to add a new key to the members map without overwriting others
        [`members.${effectiveUserId}`]: { 
          role: "contributor", 
          joinedAt: serverTimestamp(),
          name: userProfile?.name || "Guest Chef"
        }
      });

      const joinedWs = { id: workspaceDoc.id, ...workspaceData };

      // 4. Update local UI to drop you straight into the new kitchen
      setUserWorkspaces(prev => [...prev, joinedWs]);
      setActiveWorkspace(joinedWs);
      localStorage.setItem("pantry_chef_workspace_id", workspaceDoc.id);

      setShowJoinWorkspaceModal(false);
      setJoinCode("");
      triggerNotification(`🎉 Successfully joined "${workspaceData.name}"!`);
    } catch (err) {
      console.error("Error joining workspace:", err);
      alert("Failed to join workspace.");
    } finally {
      setLoading(false);
      setStatus("");
    }
  };

  const handleImpersonate = (demoId) => {
    localStorage.setItem("pantry_chef_custom_id", demoId);
    setCustomId(demoId);
    setIsAdmin(false);
    setActiveTab("pantry");
    alert(`Switched to ${demoId}. Welcome!`);
    window.location.reload();
  };

  // Admin & User Profiles Handlers
  const handleAdminToggle = (status) => {
    setIsAdmin(status);
  };
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
  const handleImageSelect = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const resized = await resizeImage(file, 600);
      setRecipeImage(resized);
    }
  };
  const handleUpdateProfilePhoto = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setLoading(true);
      // Resize to a compact avatar size (e.g., 200px max width/height)
      const resizedAvatar = await resizeImage(file, 200);

      const userProfileRef = doc(db, `/artifacts/${appId}/users/${effectiveUserId}/profile/data`);
      
      // Update Firestore profile document
      await setDoc(userProfileRef, {
        avatar: resizedAvatar,
        updatedAt: serverTimestamp()
      }, { merge: true });

      // Update local state
      setUserProfile(prev => ({ ...prev, avatar: resizedAvatar }));
      triggerNotification("📸 Profile photo updated successfully!");
    } catch (err) {
      console.error("Failed to update profile photo:", err);
      alert("Error updating profile photo.");
    } finally {
      setLoading(false);
    }
  };
  const handleReportContent = async (targetItem, reportReason) => {
    if (!reportReason) {
      alert("Please select a reason for reporting.");
      return;
    }

    try {
      const reportsRef = collection(db, `/artifacts/${appId}/public/data/reports`);
      await addDoc(reportsRef, {
        targetId: targetItem.id || targetItem.firestoreId || "unknown",
        targetTitle: targetItem.title || targetItem.name || "User Profile",
        targetAuthor: targetItem.authorName || targetItem.userId || "Unknown",
        reportedBy: effectiveUserId,
        reason: reportReason,
        createdAt: serverTimestamp(),
        status: "pending"
      });

      setNotification("🚩 Report submitted. Our admin team will review it.");
      setTimeout(() => setNotification(null), 4000);
    } catch (err) {
      console.error("Failed to submit report:", err);
      alert("Error submitting report.");
    }
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
    // Silent auto-save (removed the blocking browser alert)
  };
  // 👉 UPGRADED ROSTER HANDLERS
  const handleAddHouseholdMember = async () => {
    const newMember = { 
      name: "", 
      ageGroup: "Adult (18+)", 
      healthGoals: [], 
      restrictions: "", 
      likes: "", 
      dislikes: "" 
    };
    const currentMembers = userProfile.householdMembers || [];
    const updatedMembers = [...currentMembers, newMember];
    const updatedProfile = { ...userProfile, householdMembers: updatedMembers };
    
    setUserProfile(updatedProfile);
    await handleSaveProfile(updatedProfile);
    
    // Instantly pop open the accordion for the newly created member
    setExpandedRosterIndex(updatedMembers.length - 1);
  };

  const handleUpdateMemberField = (index, field, value) => {
    const updatedMembers = [...(userProfile.householdMembers || [])];
    updatedMembers[index] = { ...updatedMembers[index], [field]: value };
    setUserProfile({ ...userProfile, householdMembers: updatedMembers });
  };

  const handleSaveMemberUpdates = async () => {
    await handleSaveProfile(userProfile);
  };

  const handleToggleMemberGoal = (index, goal) => {
    const updatedMembers = [...(userProfile.householdMembers || [])];
    const currentGoals = updatedMembers[index].healthGoals || [];
    
    if (currentGoals.includes(goal)) {
      updatedMembers[index].healthGoals = currentGoals.filter(g => g !== goal);
    } else {
      updatedMembers[index].healthGoals = [...currentGoals, goal];
    }
    
    const updatedProfile = { ...userProfile, householdMembers: updatedMembers };
    setUserProfile(updatedProfile);
    handleSaveProfile(updatedProfile); // Auto-save on toggle
  };
  const handleRemoveHouseholdMember = async (index) => {
    const currentMembers = userProfile.householdMembers || [];
    const updatedMembers = currentMembers.filter((_, i) => i !== index);
    const updatedProfile = { ...userProfile, householdMembers: updatedMembers };
    setUserProfile(updatedProfile);
    await handleSaveProfile(updatedProfile);
    triggerNotification("🗑️ Household member removed.");
  };
  const handleViewAuthorProfile = (recipe) => {
    const rawAuthor = (recipe.authorName || recipe.sourceName || "").trim();
    const cleanLower = rawAuthor.toLowerCase();
    
    // 1. Strict Platform AI Guard: Never treat Pantry Chef AI as an external web publisher
    const isPlatformAI = 
      cleanLower.includes("pantry chef") || 
      recipe.createdBy === "system" || 
      recipe.isAI === true;

    if (isPlatformAI) {
      setViewingProfile({
        id: "system_pantry_chef_ai",
        name: "Pantry Chef AI",
        role: "Platform Culinary Intelligence",
        isPublisher: false,
        isBrand: false,
        isCreator: false,
        sourceUrl: null, // Strips example.com and external web buttons completely
        image: null,
        profile: { challenges: {} }
      });
      return;
    }

    // 2. Recognized external web publishers and scraped domains
    const isKnownPublisher = 
      recipe.sourceName === "Web Import" ||
      cleanLower.includes("allrecipes") ||
      cleanLower.includes("cookie and kate") ||
      cleanLower.includes("food network") ||
      cleanLower.includes("serious eats") ||
      cleanLower.includes("bon appetit") ||
      cleanLower.includes("nyt cooking");

    if (isKnownPublisher) {
      const canonicalName = cleanLower.includes("allrecipes") 
        ? "Allrecipes" 
        : cleanLower.includes("cookie and kate") 
        ? "Cookie and Kate" 
        : rawAuthor || "Web Publisher";

      const canonicalUrl = cleanLower.includes("allrecipes")
        ? "https://www.allrecipes.com"
        : cleanLower.includes("cookie and kate")
        ? "https://cookieandkate.com"
        : (recipe.sourceUrl && !recipe.sourceUrl.includes("example.com") ? recipe.sourceUrl : null);

      const publisherId = `pub_${canonicalName.toLowerCase().replace(/[^a-z0-9]/g, "_")}`;

      const publisherData = {
        id: publisherId,
        name: canonicalName,
        role: "Verified Web Publisher",
        isPublisher: true,
        isBrand: false,
        isCreator: false,
        sourceUrl: canonicalUrl,
        image: recipe.authorImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(canonicalName)}&background=2563eb&color=fff`,
        profile: { challenges: {} }
      };

      setViewingProfile(publisherData);
      return;
    }

    // 3. Human community chef fallback
    const matchedUser = DEMO_USERS.find(
      (u) => u.id === recipe.createdBy || u.name?.toLowerCase() === rawAuthor.toLowerCase()
    ) || {
      id: recipe.createdBy || "unknown",
      name: rawAuthor || "Community Chef",
      role: recipe.isBrand ? "Brand Partner" : recipe.isCreator ? "Pro Chef" : "Community Chef",
      image: recipe.authorImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(rawAuthor || "Chef")}&background=random`,
      isBrand: recipe.isBrand || false,
      isCreator: recipe.isCreator || false,
      profile: { challenges: {} },
    };

    setViewingProfile(matchedUser);
  };
  const handleSystemNotify = (message, type = "info") => {
  // Simple toast or alert notification fallback
  if (typeof window !== "undefined") {
    console.log(`[System Notify - ${type.toUpperCase()}]:`, message);
  }
  };
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
    }, 250);
  };
  
    // Inventory & Pantry Actions
  const handleAddManual = async (e) => {
    e?.preventDefault();
    if (!newItemName.trim()) return;
    setLoading(true);
    const path = `/artifacts/${appId}/workspaces/${activeWorkspace.id}/inventory`;
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

    // Auto-focus back to the quick-add input for rapid continuous typing (#23)
    const inputEl = document.querySelector('input[placeholder="Add item name..."]');
    if (inputEl) inputEl.focus();
  };
  const handleBulkAdd = async (e) => {
  e?.preventDefault();
  if (!bulkText.trim()) return;
  setLoading(true);
  setStatus("Parsing bulk list...");

  const lines = bulkText.split("\n").filter((l) => l.trim().length > 0);
  const batch = writeBatch(db);
  const path = `/artifacts/${appId}/workspaces/${activeWorkspace.id}/inventory`;

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
  setShowAddDrawer(false);
  triggerNotification(`🛒 Added ${lines.length} item(s) to your pantry!`);
  setLoading(false);
  setStatus(`Added ${lines.length} items!`);
  setTimeout(() => setStatus(""), 2000);
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
          doc(db, `/artifacts/${appId}/workspaces/${activeWorkspace.id}/inventory`, id)
        );
      } else {
        await logWaste(item, item.quantity);
        await logAnalyticsEvent("waste_logged", { itemName: item.name, category: item.category });
        await deleteDoc(
          doc(db, `/artifacts/${appId}/workspaces/${activeWorkspace.id}/inventory`, id)
        );
        alert("Item logged as waste. Check Budget tab.");
      }
    } else
      await updateDoc(
        doc(db, `/artifacts/${appId}/workspaces/${activeWorkspace.id}/inventory`, id),
        { quantity: increment(chg) }
      );
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
      collection(db, `/artifacts/${appId}/workspaces/${activeWorkspace.id}/wasteLogs`),
      {
        name: item.name,
        cost: cost,
        category: item.category || "Other",
        timestamp: serverTimestamp(),
      }
    );
  };
  const handleUpdateItem = async (id, newData) => {
    await updateDoc(
      doc(db, `/artifacts/${appId}/workspaces/${activeWorkspace.id}/inventory`, id),
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
              `/artifacts/${appId}/workspaces/${activeWorkspace.id}/inventory`,
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
  // Intercept Receipt Scanning with Permission Check
  const handleProtectedScanTrigger = () => {
    // 1. Detect if the user is on mobile or tablet
    const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

    // 2. If it's a PC/Desktop, skip camera checks and open file explorer directly
    if (!isMobile) {
      document.getElementById('hidden-receipt-file-input')?.click();
      return;
    }

    // 3. Mobile camera permission flow
    if (permissions.camera === 'denied') {
      alert("Camera access is blocked in your browser settings. Please enable it to scan receipts.");
      return;
    }
    if (permissions.camera === 'prompt') {
      setActivePermissionPrompt('camera');
      return;
    }

    document.getElementById('hidden-receipt-file-input')?.click();
  };

  const handleGrantPermission = async (type) => {
    setActivePermissionPrompt(null);
    const granted = await requestPermission(type);
    
    if (granted) {
      if (type === 'camera') {
        document.getElementById('hidden-receipt-file-input')?.click();
      }
    } else {
      alert(`Permission for ${type} was denied. Please update your browser settings.`);
    }
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
              `/artifacts/${appId}/workspaces/${activeWorkspace.id}/purchaseHistory`
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
              `/artifacts/${appId}/workspaces/${activeWorkspace.id}/inventory`,
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
                `/artifacts/${appId}/workspaces/${activeWorkspace.id}/inventory`
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
  const handleMultipleScans = async (fileList) => {
    const files = Array.from(fileList);
    if (files.length === 0) return;

    setLoading(true);
    setStatus(`Scanning ${files.length} receipt(s)...`);

    try {
      let totalItemsAdded = 0;

      for (const file of files) {
        const base64Data = await fileToBase64(file);
        const items = await scanIngredients(base64Data);
        
        if (items && items.length > 0) {
          const batch = writeBatch(db);
          items.forEach((i) => {
            const ex = inventory.find(
              (x) => x.name.toLowerCase() === i.name.toLowerCase()
            );
            if (i.price) {
              const histRef = doc(
                collection(db, `/artifacts/${appId}/workspaces/${activeWorkspace.id}/purchaseHistory`)
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
                doc(db, `/artifacts/${appId}/workspaces/${activeWorkspace.id}/inventory`, ex.id),
                {
                  quantity: increment(i.quantity || 1),
                  lastCost: i.price || ex.lastCost,
                }
              );
            } else {
              batch.set(
                doc(collection(db, `/artifacts/${appId}/workspaces/${activeWorkspace.id}/inventory`)),
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
          totalItemsAdded += items.length;
        }
      }

      setStatus(`Successfully synced ${totalItemsAdded} item(s)!`);
      await logAnalyticsEvent("batch_receipts_scanned", { fileCount: files.length, itemCount: totalItemsAdded });
      setTimeout(() => setStatus(""), 3000);
    } catch (err) {
      console.error("Batch scan error:", err);
      setStatus("Error scanning receipts.");
      setTimeout(() => setStatus(""), 3000);
    } finally {
      setLoading(false);
    }
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
          `/artifacts/${appId}/workspaces/${activeWorkspace.id}/inventory`
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
  
  const handleAddToPantry = async (itemName) => {
    const path = `/artifacts/${appId}/workspaces/${activeWorkspace.id}/inventory`;
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

  const getIntentBasedSponsoredFeed = (organicRecipes, sponsoredPool, searchQuery) => {
    if (!sponsoredPool || sponsoredPool.length === 0) return organicRecipes;

    const query = (searchQuery || "").toLowerCase().trim();

    let matchedSponsor = null;
    if (query) {
      matchedSponsor = sponsoredPool.find(s => 
        s.title.toLowerCase().includes(query) ||
        s.description.toLowerCase().includes(query) ||
        (s.sponsorMetadata?.keywords || []).some(keyword => query.includes(keyword))
      );
    }

    const activeSponsor = matchedSponsor || sponsoredPool[0];

    return [
      { ...activeSponsor, is_sponsored: true, isIntentMatched: !!matchedSponsor },
      ...organicRecipes
    ];
  };

  const handleLoadQuickStoreRun = async () => {
    if (inventory.length < 3) return;
    setLoadingStoreRun(true);
    setHasCheckedStoreRun(true);
    setStatus("Scanning pantry for 1 to 2 item store runs...");

    try {
      const userPrefs = userProfile?.cuisinePreferences || {};

      // Calculate matches strictly: at least 2 items owned, at most 2 items missing
      const potentialMatches = communityRecipes
        .map((recipe) => {
          const total = recipe.allIngredients?.length || 0;
          if (total === 0) return { ...recipe, matchPct: 0, missingCount: 99, matchedCount: 0 };

          const matched = recipe.allIngredients.filter((ing) =>
            inventory.some((invItem) => {
              const cleanInv = (invItem.name || "").toLowerCase().trim();
              const cleanIng = (ing.name || ing || "").toLowerCase().trim();
              return cleanInv.includes(cleanIng) || cleanIng.includes(cleanInv);
            })
          ).length;

          const missingCount = total - matched;
          const matchPct = Math.round((matched / total) * 100);
          return {
            ...recipe,
            matchPct,
            matchPercentage: matchPct,
            missingCount,
            matchedCount: matched
          };
        })
        .filter((r) => r.matchedCount >= 2 && r.missingCount <= 2);

      // Rank matching candidates by user cuisine preferences
      potentialMatches.sort((a, b) => {
        const weightA = userPrefs[a.cuisine] || 3;
        const weightB = userPrefs[b.cuisine] || 3;
        return (weightB * 20 + b.matchPct) - (weightA * 20 + a.matchPct);
      });

      setQuickStoreRecipes(potentialMatches.slice(0, 4));

      if (potentialMatches.length > 0) {
        triggerNotification(`🛒 Found ${Math.min(potentialMatches.length, 4)} quick store-run recipes!`);
      }
    } catch (err) {
      console.error("Error loading quick store run recipes:", err);
      triggerNotification("❌ Error checking store run recipes.");
    } finally {
      setLoadingStoreRun(false);
      setStatus("");
    }
  };

  // Recipe & Cooking Actions
  const handleGetAIRecipes = async (mode = "recipe", queryOverride = null, forceModal = false) => {
    if (loading) return;
    setLoading(true);
    setStatus("Searching local database...");

    const targetQuery = (typeof queryOverride === 'string' ? queryOverride : searchQuery).trim().toLowerCase();

    try {
      let matchedRecipes = [];

      // 1. CHECK LOCAL COMMUNITY DATABASE FIRST (Tokenized for multi-item triage)
      if (mode === "recipe" && targetQuery && communityRecipes.length > 0) {
        const queryTerms = targetQuery
          .split(",")
          .map((term) => term.trim().toLowerCase())
          .filter(Boolean);

        matchedRecipes = communityRecipes.filter((r) => {
          const titleLower = (r.title || "").toLowerCase();
          const descLower = (r.description || "").toLowerCase();
          const ingredients = (r.allIngredients || []).map((ing) =>
            (typeof ing === "string" ? ing : ing.name || "").toLowerCase()
          );

          // Matches if ANY searched staple is in the recipe ingredients, title, or description
          return queryTerms.some((term) =>
            titleLower.includes(term) ||
            descLower.includes(term) ||
            ingredients.some((ingName) => ingName.includes(term))
          );
        });
      }

      // 2. CHECK THEMEALDB CACHE IF NO LOCAL MATCHES FOUND (Only for standard single recipe searches)
      if (mode === "recipe" && matchedRecipes.length === 0 && targetQuery) {
        setStatus("Searching public recipe archives...");
        const dbResults = await fetchMealDBRecipes(targetQuery);
        if (dbResults && dbResults.length > 0) {
          matchedRecipes = processRecipesAgainstInventory(dbResults);
        }
      }

      // 3. FALLBACK TO CUSTOM RECIPE GENERATION
      if (matchedRecipes.length === 0) {
        setStatus(mode === "copycat" ? "Reverse-engineering restaurant clone..." : "Crafting custom chef recipes...");
        let res = await fetchAIRecipes(
          inventory,
          activeFilters.ignoreHistory ? [] : cookHistory,
          userProfile,
          targetQuery,
          activeFilters,
          mode
        );
        matchedRecipes = processRecipesAgainstInventory(res).map((r) => ({ ...r, isAI: !r.isDB }));

        // 👉 PERSIST ALL AI RECIPES TO GLOBAL CATALOG & USER RECALL QUEUE
        if (db && matchedRecipes.length > 0) {
          try {
            const batch = writeBatch(db);
            const coreCatalogRef = collection(db, `/artifacts/${appId}/public/data/userRecipes`);
            const recentGenRef = collection(db, `/artifacts/${appId}/users/${effectiveUserId}/recentGenerated`);

            matchedRecipes.forEach((recipe) => {
              const normalizedNewTitle = (recipe.title || "").toLowerCase().replace(/[^a-z0-9]/g, "").trim();
              const isDuplicate = communityRecipes.some(existing => {
                const normalizedExisting = (existing.title || "").toLowerCase().replace(/[^a-z0-9]/g, "").trim();
                return normalizedExisting === normalizedNewTitle;
              });

              // 1. Write to global catalog so all users benefit from the generated recipes
              if (!isDuplicate) {
                const newDocRef = doc(coreCatalogRef);
                batch.set(newDocRef, {
                  ...recipe,
                  createdAt: serverTimestamp(),
                  createdBy: "system", // Locked to system ownership
                  authorName: "Pantry Chef AI",
                  authorImage: null,
                  isAI: true,
                  isPublic: true,
                  likeCount: 0,
                });
              }

              // 2. Write to the user's private recall queue (last 10 generations)
              if (effectiveUserId) {
                const recallDocRef = doc(recentGenRef);
                batch.set(recallDocRef, {
                  ...recipe,
                  generatedAt: serverTimestamp(),
                  createdBy: effectiveUserId,
                  isAI: true
                });
              }
            });

            await batch.commit();
          } catch (err) {
            console.error("Failed to persist AI recipes & recall queue:", err);
          }
        }

        setGeneratedBatch(matchedRecipes);

      } else {
        setStatus(`Found ${matchedRecipes.length} matching recipe(s)!`);
        if (forceModal || mode === "meal") {
          setGeneratedBatch(matchedRecipes);
        } else {
          setAiRecipes(matchedRecipes);
          setRecipeView("discover");
        }
      }
    } catch (err) {
    console.error("AI Generation error:", err);
    const errMsg = err?.message || "";
    const isCapacityIssue =
      errMsg.includes("demand") ||
      errMsg.includes("503") ||
      errMsg.includes("429") ||
      errMsg.includes("quota");

    if (isCapacityIssue) {
      setNotification(
        "⚠️ AI servers are currently at capacity. Please tap search again in a moment, or browse the community catalog."
      );
    } else {
      setNotification(
        `❌ Generation issue: ${errMsg || "Failed to generate recipes. Try again."}`
      );
    }
    setTimeout(() => setNotification(null), 5000);
  } finally {
    setLoading(false);
    setStatus("");
  }
  };

  const handleApplyCustomAdaptation = async ({ recipe, toggles, customInstructions }) => {
    setShowAdaptModal(false);
    setLoading(true);
    setStatus(recipe.isCustomFork ? "Applying adjustments to your kitchen edition..." : "Tailoring recipe to your kitchen constraints...");

    try {
      const isIterative = Boolean(recipe.isCustomFork);

      const pantryText = toggles.prioritizePantry
        ? `Available Pantry Items to incorporate or substitute: ${inventory.map((i) => i.name).join(", ")}.`
        : "";
      const dietText = toggles.applyAllergies && userProfile?.diets?.length
        ? `Strict Diets: ${userProfile.diets.join(", ")}.`
        : "";
      const dislikeText = toggles.applyDislikes && userProfile?.dislikedFoods
        ? `Strictly Omit Disliked Ingredients: ${userProfile.dislikedFoods}.`
        : "";
      const equipText = toggles.applyEquipment && userProfile?.equipment?.length
        ? `Kitchen Equipment Owned: ${userProfile.equipment.join(", ")}.`
        : "";
      const customText = customInstructions
        ? `User Custom Requests for Tonight: "${customInstructions}".`
        : "";

      const promptContext = isIterative
        ? `This recipe is ALREADY a customized private edition that the user previously tested. The user wants to make FURTHER adjustments on top of this version: "${customInstructions}". Do NOT discard prior customizations unless they conflict with the new requests.`
        : "Rewrite this recipe specifically tailored to the user's home constraints.";

      const prompt = [
        "You are Pantry Chef AI.",
        promptContext,
        `Current Recipe Title: "${recipe.title}"`,
        `Current Instructions: "${recipe.instructions}"`,
        `Current Ingredients: ${JSON.stringify(recipe.allIngredients || [])}`,
        "",
        "Rules to apply:",
        dietText,
        dislikeText,
        equipText,
        pantryText,
        customText,
        "",
        "Output a single JSON object with:",
        "- title (string, keep '(Kitchen Edition)' suffix)",
        "- description",
        "- prepTime",
        "- cookTime",
        "- servings (int)",
        "- allIngredients (array of {name, quantity, unit})",
        "- instructions (clear step-by-step numbers)",
        "- customModifications (array of strings detailing all cumulative changes made for this kitchen)",
        "- nutrition (object with calories, protein, carbs, fat)"
      ].filter(Boolean).join("\n");

      const payload = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 4096, responseMimeType: "application/json" },
      };

      const responseText = await apiCall(payload);
      const adapted = parseAIResponse(responseText);

      const adaptedPayload = {
        ...recipe,
        ...adapted,
        baseRecipeId: recipe.baseRecipeId || recipe.firestoreId || recipe.id || null,
        baseRecipeTitle: recipe.baseRecipeTitle || recipe.title || "Master Recipe",
        baseAuthorName: recipe.baseAuthorName || recipe.authorName || "Pantry Chef AI",
        recommendedGear: recipe.recommendedGear || [],
        recommendedSides: recipe.recommendedSides || [],
        cloneSecrets: recipe.cloneSecrets || [],
        isCustomFork: true,
        userCustomInstructions: customInstructions || recipe.userCustomInstructions || "Pantry match and diet adaptation",
        savedAt: serverTimestamp(),
        createdAt: recipe.createdAt || serverTimestamp(),
        createdBy: effectiveUserId,
      };

      // Find existing fork to update in place
      const existingFork = isIterative 
        ? recipe 
        : savedRecipes.find((s) => 
            s.isCustomFork && 
            (s.baseRecipeId === (recipe.firestoreId || recipe.id) || s.baseRecipeTitle?.toLowerCase() === recipe.title?.toLowerCase())
          );

      let targetForkId;
      if (existingFork && (existingFork.firestoreId || existingFork.id)) {
        targetForkId = existingFork.firestoreId || existingFork.id;
        await setDoc(
          doc(db, `/artifacts/${appId}/users/${effectiveUserId}/savedRecipes`, targetForkId),
          adaptedPayload,
          { merge: true }
        );
      } else {
        const docRef = await addDoc(
          collection(db, `/artifacts/${appId}/users/${effectiveUserId}/savedRecipes`),
          adaptedPayload
        );
        targetForkId = docRef.id;
      }

      const savedFork = { ...adaptedPayload, id: targetForkId, firestoreId: targetForkId };
      setActiveRecipe(savedFork);
      setRecipeJustAdapted(true);
      setTimeout(() => setRecipeJustAdapted(false), 8000);
      triggerNotification("Kitchen Edition updated and saved to your personal library!");
    } catch (err) {
      console.error("Adaptation error:", err);
      alert("Failed to adapt recipe: " + err.message);
    } finally {
      setLoading(false);
      setStatus("");
    }
  };
  const handleCook = async (r) => {
    const personalServingsInput = prompt(
      `You're logging "${r.title}". How many servings did you eat? (Decimals allowed, e.g., 1, 1.5)`, 
      "1"
    );
    const personalServings = parseFloat(personalServingsInput);
    if (isNaN(personalServings) || personalServings <= 0) return;

    const totalRecipeServings = r.servings || 4;
    const ratio = personalServings / totalRecipeServings;

    setLoading(true);
    setStatus("Deducting pantry stock and updating nutrition logs...");

    try {
      const calculatedCalories = Math.round((r.nutrition?.calories || 500) * ratio);
      const calculatedProtein = Math.round(parseFloat(r.nutrition?.protein || "30g") * ratio);
      const calculatedCarbs = Math.round(parseFloat(r.nutrition?.carbs || "30g") * ratio);
      const calculatedFat = Math.round(parseFloat(r.nutrition?.fat || "15g") * ratio);

      // 1. Save to personal nutrition logs
      await addDoc(
        collection(db, `/artifacts/${appId}/users/${effectiveUserId}/nutritionLogs`),
        {
          recipeTitle: r.title,
          servingsEaten: personalServings,
          calories: Number(calculatedCalories) || 0,
          protein: Number(calculatedProtein) || 0,
          carbs: Number(calculatedCarbs) || 0,
          fat: Number(calculatedFat) || 0,
          timestamp: serverTimestamp(),
        }
      );

      // 2. Anti-repeat cook history log
      await addDoc(
        collection(db, `/artifacts/${appId}/public/data/cookHistory`),
        {
          userId: effectiveUserId,
          recipeTitle: r.title,
          timestamp: serverTimestamp(),
        }
      );

      // 3. Bidirectional pantry inventory deduction
      const batch = writeBatch(db);
      const deductedNames = [];

      (r.allIngredients || []).forEach((ing) => {
        const cleanIng = (ing.name || ing || "").toLowerCase().trim();
        if (!cleanIng) return;

        const matchedItem = inventory.find((inv) => {
          const cleanInv = (inv.name || "").toLowerCase().trim();
          return cleanInv.includes(cleanIng) || cleanIng.includes(cleanInv);
        });

        if (matchedItem && !deductedNames.includes(matchedItem.name)) {
          deductedNames.push(matchedItem.name);
          const itemRef = doc(db, `/artifacts/${appId}/workspaces/${activeWorkspace.id}/inventory`, matchedItem.id);
          if (matchedItem.quantity <= 1) {
            batch.delete(itemRef);
          } else {
            batch.update(itemRef, { quantity: matchedItem.quantity - 1 });
          }
        }
      });

      if (deductedNames.length > 0) {
        await batch.commit();
      }

      // 4. Concrete visual confirmation banner
      const deductionSummary = deductedNames.length > 0
        ? `Deducted ${deductedNames.length} item(s): ${deductedNames.slice(0, 3).join(", ")}${deductedNames.length > 3 ? "..." : ""}`
        : "No matching pantry items found to deduct";

      triggerNotification(`🍽️ Logged ${personalServings} serving(s) (${calculatedCalories} kcal). ${deductionSummary}. View in Settings > Nutrition.`);
    } catch (err) {
      console.error("Error logging meal:", err);
      triggerNotification("❌ Error logging meal.");
    } finally {
      setLoading(false);
      setStatus("");
      setActiveRecipe(null);
    }
  };
  const handleExecuteBatchPrep = async (batchData) => {
    const { recipe, multiplier, totalYieldServings, leftoverPortions, targetDays, storeInFreezer } = batchData;
    setLoading(true);
    setStatus("Syncing batch schedule & inventory...");

    try {
      const batch = writeBatch(db);

      // 1. Add leftover meal plan entries for each target day
      targetDays.forEach((day) => {
        const planRef = doc(collection(db, `/artifacts/${appId}/workspaces/${activeWorkspace.id}/mealPlan`));
        batch.set(planRef, {
          day: day,
          type: "Dinner (Batch Prepped)",
          recipeTitle: `${recipe.title} (${multiplier}x Batch)`,
          recipeId: recipe.id || null,
          isAI: recipe.isAI || false,
          mealTime: "18:00",
          prepTime: "5 mins (Reheat)",
          timestamp: serverTimestamp(),
        });
      });

      // 2. Sync leftover surplus back into inventory (Freezer / Fridge)
      const invRef = doc(collection(db, `/artifacts/${appId}/workspaces/${activeWorkspace.id}/inventory`));
      batch.set(invRef, {
        name: `${recipe.title} (Prepped Portions)`,
        recipeTitle: recipe.title,
        recipeId: recipe.id || recipe.firestoreId || null,
        quantity: leftoverPortions,
        unit: "portions",
        location: storeInFreezer ? "Freezer" : "Fridge",
        category: "Prepared Meals",
        expiryDate: getTimestampInDays(storeInFreezer ? 60 : 7),
        timestamp: serverTimestamp(),
      });

      // 3. 👉 AUTOMATIC PANTRY DEDUCTION ACROSS BATCH MULTIPLIER
      recipe.allIngredients?.forEach((ing) => {
        const scaledQty = (parseFloat(ing.quantity) || 1) * multiplier;
        const match = inventory.find((i) =>
          i.name.toLowerCase().includes(ing.name.toLowerCase()) ||
          ing.name.toLowerCase().includes(i.name.toLowerCase())
        );
        if (match) {
          const invRefMatch = doc(db, `/artifacts/${appId}/workspaces/${activeWorkspace.id}/inventory`, match.id);
          if (match.quantity <= scaledQty) {
            batch.delete(invRefMatch);
          } else {
            batch.update(invRefMatch, {
              quantity: match.quantity - scaledQty
            });
          }
        }
      });

      await batch.commit();

      triggerNotification(`⚡ Batch prep complete! Deducted stock & mapped ${leftoverPortions} portions to ${targetDays.join(", ")}.`);
      setBatchModalRecipe(null); // Close modal on success
    } catch (err) {
      console.error("Batch prep error:", err);
      triggerNotification("❌ Error executing batch prep.");
    } finally {
      setLoading(false);
    }
  };
  const handleUrlIngest = async (e, forceUpload = false) => {
    e?.preventDefault();
    if (!ingestUrl.trim()) return;

    const targetUrl = ingestUrl.trim();

    // Check if URL already exists in community recipes
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
      
      if (isAdmin) {
        // Admin imports seed the public community feed
        const docRef = await addDoc(collection(db, `/artifacts/${appId}/public/data/userRecipes`), {
          ...processedRecipe,
          createdAt: serverTimestamp(),
          createdBy: effectiveUserId || "admin",
          isAI: false,
          isPublic: true,
          likeCount: 0,
          authorName: processedRecipe.sourceName || "Web Import",
          authorImage: userProfile?.image || null
        });

        setStatus("Recipe Published to Public Feed!");
        setShowIngestModal(false);
        setIngestUrl("");
        setDuplicateMatch(null);
        handleSetActiveRecipe({ ...processedRecipe, id: docRef.id, firestoreId: docRef.id });
      } else {
        // Regular user imports stay locked to their private saved vault
        const privateDocRef = await addDoc(
          collection(db, `/artifacts/${appId}/users/${effectiveUserId}/savedRecipes`),
          {
            ...processedRecipe,
            isPrivate: true,
            isPublic: false,
            savedAt: serverTimestamp(),
            createdAt: serverTimestamp(),
            createdBy: effectiveUserId || "anonymous",
            isAI: false,
            likeCount: 0,
            authorName: processedRecipe.sourceName || "Web Import",
            authorImage: userProfile?.image || null
          }
        );

        setStatus("Recipe Imported to Your Saved Vault!");
        setShowIngestModal(false);
        setIngestUrl("");
        setDuplicateMatch(null);
        handleSetActiveRecipe({
          ...processedRecipe,
          id: privateDocRef.id,
          firestoreId: privateDocRef.id,
          isPrivate: true
        });
      }
    } catch (err) {
      console.error(err);
      setStatus("Failed to read URL.");
    } finally {
      setIsIngesting(false);
      setTimeout(() => setStatus(""), 3000);
    }
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
  const handleOpenPreppedRecipe = (invItem) => {
    if (!invItem) return;

    const allAvailable = [
      ...communityRecipes,
      ...savedRecipes,
      ...aiRecipes,
      ...recentlyGenerated,
    ];

    // 1. Exact ID Match if the batch prep saved a recipeId
    let matched = invItem.recipeId
      ? allAvailable.find(
          (r) => r.id === invItem.recipeId || r.firestoreId === invItem.recipeId
        )
      : null;

    // 2. Title Match (stripping "(Prepped Portions)" and "(3x Batch)")
    if (!matched && invItem.name) {
      const cleanTitle = invItem.name
        .replace(/\s*\((?:prepped portions\vert{}prep portions\vert{}\d+x batch)\)/i, "")
        .trim()
        .toLowerCase();

      matched = allAvailable.find(
        (r) => (r.title || "").trim().toLowerCase() === cleanTitle
      );
    }

    if (matched) {
      handleSetActiveRecipe(matched);
    } else {
      // 3. Fallback Recipe View with standard reheating guidelines
      const displayTitle = (invItem.name || "Prepped Meal")
        .replace(/\s*\((?:prepped portions\vert{}prep portions)\)/i, "")
        .trim();

      handleSetActiveRecipe({
        title: displayTitle,
        prepTime: "5 to 10 mins (Reheat)",
        servings: invItem.quantity || 1,
        description: `Batch-prepped meal stored in ${invItem.location || "Freezer"}.`,
        instructions:
          "1. If frozen, thaw in the refrigerator overnight or use microwave defrost mode.\n2. Reheat thoroughly in a skillet, 375°F (190°C) oven, or microwave until steaming hot (internal temp 165°F / 74°C).\n3. Garnish with fresh herbs or pantry condiments and serve.",
        allIngredients: [
          {
            name: displayTitle,
            quantity: invItem.quantity || 1,
            unit: invItem.unit || "portion",
          },
        ],
        isPreppedPortion: true,
      });
    }
  };
  const handleSetActiveRecipe = async (recipe) => {
    setActiveRecipe(recipe);
    if (effectiveUserId && db) {
      try {
        // Create a unique, deterministic document key so duplicates overwrite rather than duplicate
        const docKey = (recipe.firestoreId || recipe.id || recipe.title || "item")
          .toString()
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "_");

        const viewRef = doc(db, `/artifacts/${appId}/users/${effectiveUserId}/recentlyViewed`, docKey);
        await setDoc(viewRef, {
          ...recipe,
          viewedAt: serverTimestamp()
        }, { merge: true });
      } catch (err) {
        console.error("Failed to update recently viewed:", err);
      }
    }
  };
  const handleInspectReportedRecipe = async (report) => {
    if (!report) return;

    // 1. Check local community recipes in memory
    let target = communityRecipes.find(
      (r) =>
        r.id === report.targetId ||
        r.firestoreId === report.targetId ||
        (r.title && report.targetTitle && r.title.toLowerCase().trim() === report.targetTitle.toLowerCase().trim())
    );

    // 2. Fetch directly from Firestore if removed from local state
    if (!target && report.targetId && db) {
      try {
        const snap = await getDoc(
          doc(db, `/artifacts/${appId}/public/data/userRecipes`, report.targetId)
        );
        if (snap.exists()) {
          target = { id: snap.id, firestoreId: snap.id, ...snap.data() };
        }
      } catch (err) {
        console.error("Failed to load reported recipe document:", err);
      }
    }

    if (target) {
      handleSetActiveRecipe(target);
    } else {
      alert(`Unable to open recipe: "${report.targetTitle || "Recipe"}" has already been removed or nuked from the database.`);
    }
  };
  const handleSubmitRecipe = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    if (submissionIngredients.some((i) => !i.name.trim()))
      return alert("Add ingredients");
    setIsSubmitting(true);

    const recipePayload = {
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
      authorImage: userProfile?.image || null,
      authorName: userProfile?.name || "Community Chef",
      isAI: false,
    };

    if (isAdmin) {
      await addDoc(
        collection(db, `/artifacts/${appId}/public/data/userRecipes`),
        { ...recipePayload, isPublic: true, isPrivate: false }
      );
      setNotification("🌐 Recipe published to Community Feed!");
    } else {
      await addDoc(
        collection(db, `/artifacts/${appId}/users/${effectiveUserId}/savedRecipes`),
        { ...recipePayload, isPublic: false, isPrivate: true, savedAt: serverTimestamp() }
      );
      setNotification("🔒 Secret recipe saved privately to your personal vault!");
    }

    e.target.reset();
    setSubmissionIngredients([{ name: "", quantity: "", unit: "count" }]);
    setRecipeImage(null);
    setIsSubmitting(false);
    setTimeout(() => setNotification(null), 3000);
  };
  const handleDeleteRecipe = async (recipeToDelete) => {
    if (!recipeToDelete) return;
    
    // 👉 1. Close details view and scrub from local state FIRST to prevent carousel re-adding race conditions
    setActiveRecipe(null);
    const docId = recipeToDelete.id || recipeToDelete.firestoreId;
    const recipeTitle = recipeToDelete.title;

    setAiRecipes(prev => prev.filter(r => String(r.id || r.title) !== String(docId || recipeTitle)));
    setCommunityRecipes(prev => prev.filter(r => String(r.id || r.title) !== String(docId || recipeTitle)));
    setSavedRecipes(prev => prev.filter(r => String(r.id || r.title) !== String(docId || recipeTitle)));
    setRecentlyViewed(prev => prev.filter(r => r.title !== recipeTitle));

    try {
      // 2. Delete from public userRecipes collection
      if (docId && !String(docId).startsWith("meal_") && isNaN(docId)) {
        await deleteDoc(doc(db, `/artifacts/${appId}/public/data/userRecipes`, docId)).catch(() => {});
      }

      // 3. Delete from user's savedRecipes subcollection
      if (docId) {
        await deleteDoc(doc(db, `/artifacts/${appId}/users/${effectiveUserId}/savedRecipes`, docId)).catch(() => {});
      }

      // 4. Purge from user's recentlyViewed subcollection
      if (db && effectiveUserId && recipeTitle) {
        const recentQ = query(
          collection(db, `/artifacts/${appId}/users/${effectiveUserId}/recentlyViewed`),
          where("title", "==", recipeTitle)
        );
        const recentSnap = await getDocs(recentQ);
        const batch = writeBatch(db);
        recentSnap.docs.forEach(d => batch.delete(d.ref));
        await batch.commit().catch(() => {});
      }

      // 5. Safety Fallback: Query and delete any public records matching this title
      if (recipeTitle && db) {
        const q = query(
          collection(db, `/artifacts/${appId}/public/data/userRecipes`),
          where("title", "==", recipeTitle)
        );
        const snap = await getDocs(q);
        const batch = writeBatch(db);
        snap.docs.forEach(d => batch.delete(d.ref));
        await batch.commit().catch(() => {});
      }
    } catch (err) {
      console.error("Deletion error:", err);
    }

    triggerNotification("🗑️ Recipe and view history permanently cleared.");
  };

  const handleNukeRecipe = async (recipeToNuke) => {
  if (!recipeToNuke) return;
  const confirmed = window.confirm(
    `☢️ PERMANENT GLOBAL NUKE: This will purge "${recipeToNuke.title}" from ALL public feeds AND all private user vaults across the entire database. Proceed?`
  );
  if (!confirmed) return;

  setLoading(true);
  setStatus("Executing global database purge...");

  const targetTitle = (recipeToNuke.title || "").trim();
  const targetId = recipeToNuke.id || recipeToNuke.firestoreId;

  // 1. Immediately scrub local React states
  setActiveRecipe(null);
  setCommunityRecipes((prev) => prev.filter((r) => r.title !== targetTitle && r.id !== targetId));
  setAiRecipes((prev) => prev.filter((r) => r.title !== targetTitle && r.id !== targetId));
  setSavedRecipes((prev) => prev.filter((r) => r.title !== targetTitle && r.id !== targetId));
  setRecentlyViewed((prev) => prev.filter((r) => r.title !== targetTitle));
  setMealPlan((prev) => prev.filter((m) => m.recipeTitle !== targetTitle));

  try {
    const batch = writeBatch(db);

    // 2. Delete from public feed by ID and Title
    if (targetId && !String(targetId).startsWith("meal_") && isNaN(targetId)) {
      batch.delete(doc(db, `/artifacts/${appId}/public/data/userRecipes`, targetId));
    }
    const publicQ = query(
      collection(db, `/artifacts/${appId}/public/data/userRecipes`),
      where("title", "==", targetTitle)
    );
    const publicSnap = await getDocs(publicQ);
    publicSnap.docs.forEach((d) => batch.delete(d.ref));

    // 3. Delete from ALL user private stashes using collectionGroup
    let purgedSavedCount = 0;
    try {
      const savedGroupQ = query(
        collectionGroup(db, "savedRecipes"),
        where("title", "==", targetTitle)
      );
      const savedGroupSnap = await getDocs(savedGroupQ);
      savedGroupSnap.docs.forEach((d) => batch.delete(d.ref));
      purgedSavedCount = savedGroupSnap.size;
    } catch (indexErr) {
      console.warn("savedRecipes collectionGroup index not yet active:", indexErr.message);
    }

    // 4. Delete from ALL user recentlyViewed using collectionGroup
    try {
      const recentGroupQ = query(
        collectionGroup(db, "recentlyViewed"),
        where("title", "==", targetTitle)
      );
      const recentGroupSnap = await getDocs(recentGroupQ);
      recentGroupSnap.docs.forEach((d) => batch.delete(d.ref));
    } catch (indexErr) {
      console.warn("recentlyViewed collectionGroup index not yet active:", indexErr.message);
    }

    // 5. Commit atomic database purge
    await batch.commit();

    triggerNotification(`💥 Purged "${targetTitle}" from public feed and ${purgedSavedCount} private user vaults.`);
  } catch (err) {
    console.error("Global nuke failure:", err);
    alert("Nuke error: " + err.message);
  } finally {
    setLoading(false);
    setStatus("");
  }
};
  const handleRegenerateRecipe = async (recipeToRegen) => {
    if (!window.confirm(`Re-run AI copycat analysis for "${recipeToRegen.title}"? This will fetch fresh brand data, secret ratios, and cost breakdowns.`)) return;
    setLoading(true);
    setStatus("Re-running copycat engine...");
    try {
      const freshResults = await fetchAIRecipes(
        inventory,
        [],
        userProfile,
        recipeToRegen.title,
        activeFilters,
        "copycat"
      );
      if (freshResults && freshResults.length > 0) {
        const freshData = freshResults[0];
        const docId = recipeToRegen.firestoreId || recipeToRegen.id;
        
        const payload = {
          ...freshData,
          updatedAt: serverTimestamp(),
          createdAt: recipeToRegen.createdAt || serverTimestamp(),
          createdBy: recipeToRegen.createdBy || effectiveUserId,
          isAI: true,
        };

        if (docId && !String(docId).startsWith("meal_") && isNaN(docId)) {
          await setDoc(doc(db, `/artifacts/${appId}/public/data/userRecipes`, docId), payload, { merge: true });
        } else {
          // If it didn't have a valid Firestore ID, save it as a new public recipe
          const docRef = await addDoc(collection(db, `/artifacts/${appId}/public/data/userRecipes`), payload);
          payload.firestoreId = docRef.id;
          payload.id = docRef.id;
        }

        setActiveRecipe(prev => ({ ...prev, ...payload }));
        triggerNotification("🍔 Successfully re-ran copycat analysis!");
      }
    } catch (err) {
      console.error("Regeneration error:", err);
      alert("Failed to regenerate copycat recipe: " + err.message);
    } finally {
      setLoading(false);
      setStatus("");
    }
  };
  const handleVote = async (id, val) => {
    if (!id) return;
    await updateDoc(
      doc(db, `/artifacts/${appId}/public/data/userRecipes`, id),
      { likeCount: increment(val) }
    );
  };
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
  const handleLike = async (id) =>
    updateDoc(doc(db, `/artifacts/${appId}/public/data/userRecipes`, id), {
      likeCount: increment(1),
    });
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

  const isSameDishApp = (dishA, dishB) => {
    if (!dishA || !dishB) return false;
    const idA = dishA.firestoreId || dishA.id;
    const idB = dishB.firestoreId || dishB.id;
    if (idA && idB && idA === idB) return true;
    const titleA = (dishA.title || dishA.recipeTitle || "").trim().toLowerCase();
    const titleB = (dishB.title || dishB.recipeTitle || "").trim().toLowerCase();
    return titleA.length > 0 && titleA === titleB;
  };

  const handleTogglePin = async (recipeToPin) => {
    const isAlreadyCooking = globalTimers.find((t) =>
      isSameDishApp(t.recipeData || { title: t.recipeTitle, id: t.id }, recipeToPin)
    );

    const isPinned = pinnedRecipes.some((p) => isSameDishApp(p, recipeToPin));

    // If dish is actively cooking, unpinning it must prompt to cancel its timer
    if (isAlreadyCooking) {
      setTimerCancelConfirm({ 
        id: isAlreadyCooking.id, 
        title: recipeToPin.title,
        unpinAfter: true,
        recipeToUnpin: recipeToPin
      });
      return;
    }

    // Normal unpin for staged dishes
    if (isPinned) {
      const nextPinned = pinnedRecipes.filter((p) => !isSameDishApp(p, recipeToPin));
      setPinnedRecipes(nextPinned);
      localStorage.setItem("pantry_chef_pinned_recipes", JSON.stringify(nextPinned));

      if (db && activeWorkspace?.id) {
        await setDoc(
          doc(db, `/artifacts/${appId}/workspaces/${activeWorkspace.id}/stovetopState`, "current"),
          { pinnedRecipes: nextPinned, updatedAt: serverTimestamp() },
          { merge: true }
        ).catch(() => {});
      }
      return;
    }

    // 4-Burner Stovetop Capacity Check
    const activeTimersCount = globalTimers.filter((t) => t.phase !== "finished").length;
    const stagedCount = pinnedRecipes.filter(
      (p) => !globalTimers.some((t) => isSameDishApp(t.recipeData || { title: t.recipeTitle, id: t.id }, p))
    ).length;
    const totalOccupied = activeTimersCount + stagedCount;

    if (totalOccupied >= 4) {
      triggerNotification(
        `Stovetop capacity reached (4 max): You have ${activeTimersCount} active timer${activeTimersCount === 1 ? "" : "s"} and ${stagedCount} pinned recipe${stagedCount === 1 ? "" : "s"}. You can have up to 4 total recipes across active and pinned.`,
        6000,
        "error"
      );
      return;
    }

    const nextPinned = [...pinnedRecipes, recipeToPin];
    setPinnedRecipes(nextPinned);
    localStorage.setItem("pantry_chef_pinned_recipes", JSON.stringify(nextPinned));

    if (db && activeWorkspace?.id) {
      await setDoc(
        doc(db, `/artifacts/${appId}/workspaces/${activeWorkspace.id}/stovetopState`, "current"),
        { pinnedRecipes: nextPinned, updatedAt: serverTimestamp() },
        { merge: true }
      ).catch(() => {});
    }
  };

  
  
  // Shopping & Meal Planning Actions
  const addToGroceryList = async (items) => {
    const batch = writeBatch(db);
    const itemsArray = Array.isArray(items) ? items : [items];
    itemsArray.forEach((n) => {
      if (!groceryList.some((g) => g.name.toLowerCase() === n.toLowerCase())) {
        const newRef = doc(
          collection(
            db,
            `/artifacts/${appId}/workspaces/${activeWorkspace.id}/groceryList`
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

    // Force explicit toast state trigger here
    triggerNotification(`🛒 Added ${itemsArray.length} item(s) to your shopping list!`);
    
    setActiveTab("shopping");
  };
  const handleQuickShopPrompt = () => {
    setShowQuickShopModal(true);
    const input = prompt("Enter item(s) to add (separate multiple with commas):");
    if (input && input.trim()) {
      // Split by commas, trim each item, and filter out empty strings
      const items = input.split(",").map(i => i.trim()).filter(Boolean);
      if (items.length > 0) {
        addToGroceryList(items);
      }
    }
  };
  const toggleGroceryItem = async (id, currentStatus) => {
    await updateDoc(
      doc(db, `/artifacts/${appId}/workspaces/${activeWorkspace.id}/groceryList`, id),
      { purchased: !currentStatus }
    );
  };
  // 👉 COLLABORATIVE LIST: Claim an item
  const handleClaimGroceryItem = async (id, currentlyClaimedBy) => {
    if (currentlyClaimedBy === effectiveUserId) {
      // Unclaim it
      await updateDoc(doc(db, `/artifacts/${appId}/workspaces/${activeWorkspace.id}/groceryList`, id), {
        claimedBy: null,
        claimedByName: null
      });
    } else if (!currentlyClaimedBy) {
      // Claim it
      await updateDoc(doc(db, `/artifacts/${appId}/workspaces/${activeWorkspace.id}/groceryList`, id), {
        claimedBy: effectiveUserId,
        claimedByName: userProfile?.name || "Chef"
      });
    }
  };
  const deleteGroceryItem = async (id) => {
    deleteDoc(
      doc(db, `/artifacts/${appId}/workspaces/${activeWorkspace.id}/groceryList`, id)
    );
  };
  const handleCheckout = async (itemsWithPrices) => {
    const batch = writeBatch(db);
    const invPath = `/artifacts/${appId}/workspaces/${activeWorkspace.id}/inventory`;
    const histPath = `/artifacts/${appId}/workspaces/${activeWorkspace.id}/purchaseHistory`;
    const listPath = `/artifacts/${appId}/workspaces/${activeWorkspace.id}/groceryList`;
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
  const handleAddToPlan = async (recipe, day, type, time, prepTime) => {
    await addDoc(
      collection(db, `/artifacts/${appId}/workspaces/${activeWorkspace.id}/mealPlan`),
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
  const handleExportMealPlanICS = () => {
    if (!mealPlan || mealPlan.length === 0) {
      alert("No meals scheduled to export!");
      return;
    }

    try {
      const events = mealPlan.map(meal => ({
        title: `🍽️ Dinner: ${meal.recipeTitle}`,
        description: `Scheduled meal type: ${meal.type}. Prep time: ${meal.prepTime || "30 mins"}`,
        date: new Date(),
        durationMinutes: 60
      }));

      const icsData = generateICS(events);
      const blob = new Blob([icsData], { type: "text/calendar;charset=utf-8" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "pantry-chef-meal-plan.ics");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      triggerNotification("📅 Family calendar sync file downloaded successfully!");
    } catch (err) {
      console.error("ICS export error:", err);
      alert("Failed to generate calendar export.");
    }
  };
  const handleDeleteMeal = async (id) => {
    deleteDoc(
      doc(db, `/artifacts/${appId}/workspaces/${activeWorkspace.id}/mealPlan`, id)
    );
  }
  const handleStartScheduledTimers = async (param1, param2) => {
    // 1. Flexible Extraction: Support all argument formats from ReverseSchedulerModal
    let incomingDishes = [];
    let incomingTarget = null;

    if (Array.isArray(param1)) {
      // Called as: onStartScheduledTimers(dishes, targetTime)
      incomingDishes = param1;
      incomingTarget = param2;
    } else if (Array.isArray(param2)) {
      // Called as: onStartScheduledTimers(targetTime, dishes)
      incomingTarget = param1;
      incomingDishes = param2;
    } else if (param1 && typeof param1 === "object") {
      // Called as: onStartScheduledTimers({ dishes, targetTime }) or { scheduledDishes, targetTime }
      incomingDishes = param1.dishes || param1.scheduledDishes || param1.selectedDishes || param1.pinnedRecipes || [];
      incomingTarget = param1.targetDate || param1.targetTime || param1.targetTimeOrDate || param2;
    } else if (param2 && typeof param2 === "object") {
      incomingDishes = param2.dishes || param2.scheduledDishes || param2.selectedDishes || param2.pinnedRecipes || [];
      incomingTarget = param1;
    }

    // 2. Direct Fallback: If no dishes were in the arguments, pull directly from pinnedRecipes state
    if (!incomingDishes || incomingDishes.length === 0) {
      incomingDishes = pinnedRecipes;
    }

    // If still empty, alert and halt
    if (!incomingDishes || incomingDishes.length === 0) {
      triggerNotification("No dishes pinned to schedule.", 4000, "error");
      return;
    }

    // 3. Extract target time if passed as a standalone string or Date
    if (!incomingTarget) {
      if (typeof param1 === "string" || param1 instanceof Date) {
        incomingTarget = param1;
      } else if (typeof param2 === "string" || param2 instanceof Date) {
        incomingTarget = param2;
      }
    }

    const now = new Date();
    let targetDate = new Date();

    if (incomingTarget instanceof Date) {
      targetDate = new Date(incomingTarget.getTime());
    } else if (typeof incomingTarget === "string" && incomingTarget.includes(":")) {
      const [h, m] = incomingTarget.split(":").map(Number);
      targetDate.setHours(h, m, 0, 0);
    } else if (incomingTarget) {
      const parsed = new Date(incomingTarget);
      if (!isNaN(parsed.getTime())) {
        targetDate = parsed;
      } else {
        targetDate.setHours(targetDate.getHours() + 1, 0, 0, 0);
      }
    } else {
      // Default to 1 hour from now if unselected
      targetDate.setHours(targetDate.getHours() + 1, 0, 0, 0);
    }

    // Roll forward to next day if the target clock time is earlier than right now
    if (targetDate.getTime() <= now.getTime()) {
      targetDate.setDate(targetDate.getDate() + 1);
    }

    // 4. Calculate prep/cook intervals for each dish
    const dishesPayload = incomingDishes.map((dish) => {
      const prepMins = parsePrepTime(dish.prepTime || "15 mins") || 15;
      const cookMins = parsePrepTime(dish.cookTime || "0 mins") || 0;
      const totalMinutes = prepMins + cookMins;

      const prepStartTime = new Date(targetDate.getTime() - totalMinutes * 60 * 1000);
      const cookStartTime = new Date(targetDate.getTime() - cookMins * 60 * 1000);

      const dishId = dish.firestoreId || dish.id || `dish_${(dish.title || "item").toLowerCase().replace(/[^a-z0-9]/g, "_")}`;

      return {
        ...dish,
        id: dishId,
        title: dish.title || dish.recipeTitle || "Scheduled Dish",
        prepMins,
        cookMins,
        prepStartTime,
        cookStartTime,
      };
    });

    // 5. Construct immediate timer objects for local state (0ms latency HUD display)
    const immediateTimers = dishesPayload.map((dish) => {
      const secondsUntilPrep = Math.floor((dish.prepStartTime.getTime() - now.getTime()) / 1000);
      const secondsUntilCook = Math.floor((dish.cookStartTime.getTime() - now.getTime()) / 1000);
      const secondsUntilDone = Math.floor((targetDate.getTime() - now.getTime()) / 1000);

      let phase = "countdown";
      let remaining = secondsUntilPrep;
      let label = `Prep Starts In: ${dish.title}`;

      if (secondsUntilPrep <= 0 && secondsUntilCook > 0) {
        phase = "prep";
        remaining = secondsUntilCook;
        label = `Prep Now: ${dish.title}`;
      } else if (secondsUntilCook <= 0 && secondsUntilDone > 0) {
        phase = "cook";
        remaining = secondsUntilDone;
        label = `Cook Now: ${dish.title}`;
      } else if (secondsUntilDone <= 0) {
        phase = "finished";
        remaining = 0;
        label = `Ready: ${dish.title}`;
      }

      return {
        id: dish.id,
        label,
        recipeTitle: dish.title,
        remaining: Math.max(0, remaining),
        duration: Math.max(0, remaining),
        phase,
        prepMins: dish.prepMins,
        cookMins: dish.cookMins,
        prepStartTime: dish.prepStartTime,
        cookStartTime: dish.cookStartTime,
        targetDate,
        prepClockTime: dish.prepStartTime.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
        cookClockTime: dish.cookStartTime.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
        targetClockTime: targetDate.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
        recipeData: dish,
      };
    });

    // Force floating HUD open and mount timers immediately
    setGlobalTimers(immediateTimers);
    setShowFloatingHud(true);
    setShowReverseScheduler(false);

    // 6. Broadcast schedule to Firestore
    if (db && activeWorkspace?.id) {
      try {
        await setDoc(
          doc(db, `/artifacts/${appId}/workspaces/${activeWorkspace.id}/stovetopState`, "current"),
          {
            pinnedRecipes,
            activeSchedule: {
              targetDate,
              dishes: dishesPayload,
              startedAt: serverTimestamp(),
            },
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      } catch (err) {
        console.error("Failed to sync stovetop schedule to Firestore:", err);
      }
    }

    triggerNotification(`Cooking schedule started: ${dishesPayload.length} dish timer(s) running.`);
  };

  const handleCancelScheduledTimer = async (timerId) => {
    // 1. Optimistic local update
    const remainingLocal = globalTimers.filter((t) => t.id !== timerId);
    setGlobalTimers(remainingLocal);

    // 2. Broadcast dish removal to Firestore
    if (db && activeWorkspace?.id) {
      try {
        const remainingDishes = remainingLocal.map((t) => t.recipeData || { id: t.id, title: t.recipeTitle });
        
        await setDoc(
          doc(db, `/artifacts/${appId}/workspaces/${activeWorkspace.id}/stovetopState`, "current"),
          {
            activeSchedule: remainingLocal.length > 0
              ? {
                  dishes: remainingDishes,
                  updatedAt: serverTimestamp(),
                }
              : null, // Setting null wipes schedule across all connected workspace screens
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      } catch (err) {
        console.error("Failed to sync timer cancellation:", err);
      }
    }
  };

  const handleClearAllScheduledTimers = async () => {
    setGlobalTimers([]);
    if (db && activeWorkspace?.id) {
      await setDoc(
        doc(db, `/artifacts/${appId}/workspaces/${activeWorkspace.id}/stovetopState`, "current"),
        {
          activeSchedule: null,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      ).catch((err) => console.error("Failed to clear schedule in Firestore:", err));
    }
  };
  const handleDeleteNutritionLog = async (logId) => {
    await deleteDoc(doc(db, `/artifacts/${appId}/users/${effectiveUserId}/nutritionLogs`, logId));
    setNotification("🗑️ Log entry removed.");
    setTimeout(() => setNotification(null), 2500);
  };
  const getLastPrice = (itemName) => {
    if (!purchaseHistory.length) return null;
    const matches = purchaseHistory
      .filter((p) => p.name.toLowerCase() === itemName.toLowerCase())
      .sort((a, b) => b.timestamp - a.timestamp);
    if (matches.length > 0)
      return { price: matches[0].cost, date: matches[0].timestamp?.toDate() };
    return null;
  };

  // AI & Voice Assistant Handlers
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
            batch.update(doc(db, `/artifacts/${appId}/workspaces/${activeWorkspace.id}/inventory`, ex.id), { 
              quantity: increment(i.quantity || 1) 
            });
          } else {
            batch.set(doc(collection(db, `/artifacts/${appId}/workspaces/${activeWorkspace.id}/inventory`)), { 
              ...i, 
              quantity: i.quantity || 1, 
              expiryDate: typeof getTimestampInDays === "function" 
                ? (getTimestampInDays(i.estimatedDaysToExpiry || 7) || new Date()) 
                : new Date(),
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
  const handleUpdateEquipment = async (gearName) => {
    const currentEquip = userProfile.equipment || [];
    if (currentEquip.includes(gearName)) return;

    const updatedEquip = [...currentEquip, gearName];
    const updatedProfile = { ...userProfile, equipment: updatedEquip };
    
    setUserProfile(updatedProfile);
    await handleSaveProfile(updatedProfile);
    
    triggerNotification(`🛠️ Added "${gearName}" to your kitchen equipment!`);
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
 // 👉 UPGRADED OMNIPRESENT CHEF: Roster-aware + Intent Handshake
  const askAIChef = async (question, recipeContext) => {
    const isFamilyMode = userProfile?.familyModeActive ?? true;
    const householdContext = isFamilyMode && userProfile?.householdMembers?.length > 0 
      ? `Cooking for Family Roster: ${userProfile.householdMembers.map(m => `${m.name} (${m.ageGroup}, Goals: ${m.healthGoals?.join(', ')||'none'}, Allergies: ${m.restrictions||'none'}, Dislikes: ${m.dislikes||'none'})`).join(' | ')}.` 
      : `User Profile: Goals: ${userProfile?.healthGoals?.join(', ')||'none'}. Dislikes: ${userProfile?.dislikedFoods||'none'}.`;

    const prompt = `You are Pantry Chef, an expert culinary AI. 
    ${householdContext}
    Context: "${recipeContext}" 
    User Question: "${question}" 
    Answer directly, warmly, and concisely. PLAIN TEXT ONLY. DO NOT use markdown formatting.
    CRITICAL: If the user is asking for meal ideas, what to cook, or a recipe, you MUST include the exact text "[ACTION_PILL]" at the very end of your response. Do not include this tag for general cooking advice or unrelated questions.`;
    
    const payload = { contents: [{ parts: [{ text: prompt }] }] };
    const rawResponse = await apiCall(payload);
    
    return rawResponse.replace(/\*\*/g, ""); // Keep [ACTION_PILL] intact for the UI to catch
  };

  // ===============================================================================
  // 7. FIRESTORE REAL-TIME LISTENERS (useEffect Hooks)
  // ===============================================================================
  // Native Router: Syncs activeTab with URL & Browser Back Button
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

  useEffect(() => {
  if (!db) return;
  const unsubConfig = onSnapshot(doc(db, `/artifacts/${appId}/public/data/config`, "appSettings"), (docSnap) => {
    if (docSnap.exists() && docSnap.data().globalApiLimit) {
      localStorage.setItem("pantry_chef_global_limit", docSnap.data().globalApiLimit);
    } else {
      localStorage.setItem("pantry_chef_global_limit", "25"); // Recommended default cap
    }
  });
  return () => unsubConfig();
}, [db, appId]);
  
  // Favorited Recipe Stock Alerts Watcher
  
  const notifiedRecipesRef = useRef(new Set());
  useEffect(() => {
    if (!inventory.length || !savedRecipes.length) return;

    savedRecipes.forEach((recipe) => {
      const ings = recipe.allIngredients;
      if (!ings || ings.length === 0) return;

      const total = ings.length;
      const matched = ings.filter((ing) =>
        inventory.some((inv) =>
          inv.name?.toLowerCase().includes(ing.name?.toLowerCase()) ||
          ing.name?.toLowerCase().includes(inv.name?.toLowerCase())
        )
      ).length;

      const matchPct = Math.round((matched / total) * 100);
      const recipeKey = recipe.firestoreId || recipe.id || recipe.title;

      // If it reaches 100% match and hasn't been alerted yet this session
      if (matchPct === 100 && !notifiedRecipesRef.current.has(recipeKey)) {
        notifiedRecipesRef.current.add(recipeKey);

        // Dispatch system push notification
        window.dispatchEvent(
          new CustomEvent("triggerSystemNotification", {
            detail: {
              title: "✨ Saved Recipe Ready to Cook!",
              body: `Your recent pantry update completed "${recipe.title}" (100% Match). Time to cook!`
            }
          })
        );
      }
    });
  }, [inventory, savedRecipes]);

  // Connected Retailer Accounts
  useEffect(() => {
    const handleOpenRetailers = () => setShowRetailerModal(true);
    window.addEventListener("openRetailerAccounts", handleOpenRetailers);
    return () => window.removeEventListener("openRetailerAccounts", handleOpenRetailers);
  }, []);

  // Add imported purchases to pantry and persist to Firestore
  const handleImportPurchases = async (selectedItems) => {
    try {
      const batch = writeBatch(db);
      const path = `/artifacts/${appId}/workspaces/${activeWorkspace.id}/inventory`;

      selectedItems.forEach((item) => {
        const newDocRef = doc(collection(db, path));
        batch.set(newDocRef, {
          name: item.name,
          category: item.category || "Groceries",
          quantity: 1,
          unit: "unit",
          location: "Pantry",
          expiryDate: getTimestampInDays(14),
          timestamp: serverTimestamp(),
          source: `Synced from ${item.store || "Receipt"}`
        });
      });

      await batch.commit();
      triggerNotification(`🛒 Successfully synced ${selectedItems.length} items to your pantry!`);
    } catch (err) {
      console.error("Failed to sync receipt items to Firestore:", err);
      alert("Error saving items to pantry database.");
    }
  };

  // Recent Purchases Modal
  useEffect(() => {
    const handleOpenPurchases = () => setShowRecentPurchasesModal(true);
    window.addEventListener("openRecentPurchases", handleOpenPurchases);
    return () => window.removeEventListener("openRecentPurchases", handleOpenPurchases);
  }, []);

  // Global Cooking Timers Interval (Zero Blocking Alerts)
  useEffect(() => {
    let interval;
    if (globalTimers.length > 0) {
      interval = setInterval(() => {
        const now = new Date();
        setGlobalTimers((prevTimers) => {
          let hasChanges = false;
          const updated = prevTimers.map((t) => {
            if (t.phase === "finished") return t;

            const remaining = t.remaining - 1;

            if (remaining <= 0) {
              hasChanges = true;
              if (t.phase === "countdown") {
                triggerNotification(`Time to start prep for ${t.recipeTitle}!`);
                const prepSeconds = Math.max(60, (t.prepMins || 15) * 60);
                return {
                  ...t,
                  phase: "prep",
                  label: `Prep Now: ${t.recipeTitle}`,
                  remaining: prepSeconds,
                  duration: prepSeconds,
                };
              }
              if (t.phase === "prep") {
                triggerNotification(`Prep finished. Start cooking ${t.recipeTitle}!`);
                const cookSeconds = Math.max(60, (t.cookMins || 20) * 60);
                return {
                  ...t,
                  phase: "cook",
                  label: `Cook Now: ${t.recipeTitle}`,
                  remaining: cookSeconds,
                  duration: cookSeconds,
                };
              }
              // Finished
              triggerNotification(`Dinner ready: ${t.recipeTitle} is done!`);
              return {
                ...t,
                phase: "finished",
                label: `Ready: ${t.recipeTitle}`,
                remaining: 0,
              };
            }

            return { ...t, remaining };
          });

          return updated;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [globalTimers, triggerNotification]);

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
  // API Usage Sync Listener
  useEffect(() => {
    const handleUpdate = () => setApiUsage(getApiUsage());
    window.addEventListener("apiUsageUpdated", handleUpdate);
    return () => window.removeEventListener("apiUsageUpdated", handleUpdate);
  }, []);
  // System Push Notification Dispatcher
  useEffect(() => {
    const handleSystemNotify = (e) => {
      setSystemNotification(e.detail);
      setTimeout(() => setSystemNotification(null), 4000);
      
    };
    window.addEventListener("triggerSystemNotification", handleSystemNotify);
    return () => window.removeEventListener("triggerSystemNotification", handleSystemNotify);
  }, []);
    // Auth Session & Admin Claims Listener  
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
          // Pull the fresh token with custom claims from the server
          const tokenResult = await user.getIdTokenResult(true);
          
          const isSimulating = Boolean(localStorage.getItem("pantry_chef_custom_id"));
          
          if (tokenResult.claims.admin === true && !isSimulating) {
            setIsAdmin(true);
            localStorage.setItem("pantry_chef_is_admin", "true");
          } else {
            setIsAdmin(false);
            localStorage.setItem("pantry_chef_is_admin", "false");
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
  // Waitlist Status Real-Time Listener
  useEffect(() => {
    if (!effectiveUserId || !db) return;
    const unsub = onSnapshot(doc(db, `/artifacts/${appId}/public/data/waitlist`, effectiveUserId), (docSnap) => {
      if (docSnap.exists()) {
        setUserWaitlistStatus(docSnap.data().status || "pending");
      }
    });
    return () => unsub();
  }, [effectiveUserId, db]);
  // 👉 WORKSPACE BOOTSTRAPPER: Finds or creates your home hub
  useEffect(() => {
    if (!effectiveUserId || !db) return;

    const initWorkspaces = async () => {
      // Look for workspaces where you are listed in the memberIds array
      const q = query(
        collection(db, `/artifacts/${appId}/workspaces`),
        where("memberIds", "array-contains", effectiveUserId)
      );
      const snap = await getDocs(q);
      let workspaces = snap.docs.map(d => ({ id: d.id, ...d.data() }));

      // If you have zero workspaces, generate your Home Base automatically
      if (workspaces.length === 0) {
        const newRef = await addDoc(collection(db, `/artifacts/${appId}/workspaces`), {
          type: "home",
          name: "My Home Pantry",
          memberIds: [effectiveUserId],
          members: { [effectiveUserId]: { role: "admin", joinedAt: new Date() } },
          createdAt: serverTimestamp()
        });
        workspaces = [{ id: newRef.id, type: "home", name: "My Home Pantry" }];
      }

      setUserWorkspaces(workspaces);
      
      // Load the last workspace you were looking at, or default to the first one
      const savedId = localStorage.getItem("pantry_chef_workspace_id");
      const active = workspaces.find(w => w.id === savedId) || workspaces[0];
      setActiveWorkspace(active);
      localStorage.setItem("pantry_chef_workspace_id", active.id);
    };

    initWorkspaces();
  }, [effectiveUserId, db, appId]);
  // Main Firestore Real-Time Data Subscriptions (UPGRADED FOR WORKSPACES)
  useEffect(() => {
    // Only run if we have a user AND an active workspace loaded
    if (!effectiveUserId || !db || !activeWorkspace || !activeWorkspace.id || activeWorkspace.id === "undefined") return;

    const wsId = activeWorkspace.id;

    const unsubs = [
      // 🟢 WORKSPACE-SHARED DATA (Tied to the kitchen/event)
      onSnapshot(collection(db, `/artifacts/${appId}/workspaces/${wsId}/inventory`), (s) =>
        setInventory(s.docs.map((d) => ({ id: d.id, ...d.data() })))
      ),
      onSnapshot(collection(db, `/artifacts/${appId}/workspaces/${wsId}/groceryList`), (s) =>
        setGroceryList(s.docs.map((d) => ({ id: d.id, ...d.data() })))
      ),
      onSnapshot(collection(db, `/artifacts/${appId}/workspaces/${wsId}/mealPlan`), (s) =>
        setMealPlan(s.docs.map((d) => ({ id: d.id, ...d.data() })))
      ),
      onSnapshot(collection(db, `/artifacts/${appId}/workspaces/${wsId}/purchaseHistory`), (s) =>
        setPurchaseHistory(s.docs.map((d) => ({ id: d.id, ...d.data() })))
      ),
      onSnapshot(collection(db, `/artifacts/${appId}/workspaces/${wsId}/wasteLogs`), (s) =>
        setWasteHistory(s.docs.map((d) => ({ id: d.id, ...d.data() })))
      ),
      // Real-Time Stovetop & Timer Sync across all devices in this kitchen workspace
      onSnapshot(doc(db, `/artifacts/${appId}/workspaces/${wsId}/stovetopState`, "current"), (docSnap) => {
        if (docSnap.exists()) {
          const remoteData = docSnap.data();

          // Sync pinned dishes from Firestore
          if (Array.isArray(remoteData.pinnedRecipes)) {
            setPinnedRecipes(remoteData.pinnedRecipes);
            localStorage.setItem("pantry_chef_pinned_recipes", JSON.stringify(remoteData.pinnedRecipes));
          }

          // Sync running cooking schedule
          if (remoteData.activeSchedule && Array.isArray(remoteData.activeSchedule.dishes)) {
            const now = new Date();
            const targetDate = remoteData.activeSchedule.targetDate?.toDate
              ? remoteData.activeSchedule.targetDate.toDate()
              : new Date(remoteData.activeSchedule.targetDate);

            // If the schedule target is more than 2 hours in the past, auto-archive it
            if (now.getTime() - targetDate.getTime() > 2 * 60 * 60 * 1000) {
              setGlobalTimers([]);
              return;
            }

            const rehydratedTimers = remoteData.activeSchedule.dishes.map((dish) => {
              const prepStartTime = dish.prepStartTime?.toDate
                ? dish.prepStartTime.toDate()
                : new Date(dish.prepStartTime);
              const cookStartTime = dish.cookStartTime?.toDate
                ? dish.cookStartTime.toDate()
                : new Date(dish.cookStartTime);

              const secondsUntilPrep = Math.floor((prepStartTime.getTime() - now.getTime()) / 1000);
              const secondsUntilCook = Math.floor((cookStartTime.getTime() - now.getTime()) / 1000);
              const secondsUntilDone = Math.floor((targetDate.getTime() - now.getTime()) / 1000);

              let phase = "countdown";
              let remaining = secondsUntilPrep;
              let label = `Prep Starts In: ${dish.title}`;

              if (secondsUntilPrep <= 0 && secondsUntilCook > 0) {
                phase = "prep";
                remaining = secondsUntilCook;
                label = `Prep Now: ${dish.title}`;
              } else if (secondsUntilCook <= 0 && secondsUntilDone > 0) {
                phase = "cook";
                remaining = secondsUntilDone;
                label = `Cook Now: ${dish.title}`;
              } else if (secondsUntilDone <= 0) {
                phase = "finished";
                remaining = 0;
                label = `Ready: ${dish.title}`;
              }

              return {
                id: dish.id || `timer_${dish.title}`,
                label,
                recipeTitle: dish.title,
                remaining: Math.max(0, remaining),
                duration: Math.max(0, remaining),
                phase,
                prepMins: dish.prepMins || 15,
                cookMins: dish.cookMins || 20,
                prepStartTime,
                cookStartTime,
                targetDate, // Preserved explicitly
                prepClockTime: prepStartTime.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
                cookClockTime: cookStartTime.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
                targetClockTime: targetDate.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
                recipeData: dish,
              };
            });

            setGlobalTimers(rehydratedTimers);
          } else if (remoteData.activeSchedule === null) {
            setGlobalTimers([]);
          }
        }
      }),

      // 🔵 PUBLIC DATA (Community Recipes & Cook History)
      onSnapshot(query(collection(db, `/artifacts/${appId}/public/data/cookHistory`), where("userId", "==", effectiveUserId)), (s) =>
        setCookHistory(s.docs.map((d) => ({ id: d.id, ...d.data() })))
      ),
      onSnapshot(query(collection(db, `/artifacts/${appId}/public/data/userRecipes`), orderBy("createdAt", "desc")), (s) =>
        setCommunityRecipes(s.docs.map((d) => ({ id: d.id, ...d.data() })))
      ),

      // 🟣 PERSONAL DATA (Tied strictly to YOU across all workspaces)
      onSnapshot(doc(db, `/artifacts/${appId}/users/${effectiveUserId}/profile`, "settings"), (d) => {
        if (d.exists()) {
          const data = d.data();
          setUserProfile(data);
          if (data.customApiLimit !== undefined) {
            localStorage.setItem("pantry_chef_user_limit", data.customApiLimit);
          } else {
            localStorage.removeItem("pantry_chef_user_limit");
          }
        }
      }),
      onSnapshot(collection(db, `/artifacts/${appId}/users/${effectiveUserId}/savedRecipes`), (s) =>
        setSavedRecipes(s.docs.map((d) => ({ ...d.data(), id: d.id, firestoreId: d.id })))
      ),
      onSnapshot(query(collection(db, `/artifacts/${appId}/users/${effectiveUserId}/recentlyViewed`), orderBy("viewedAt", "desc"), limit(10)), (s) =>
        setRecentlyViewed(s.docs.map((d) => ({ ...d.data(), id: d.id })))
      ),
      onSnapshot(query(collection(db, `/artifacts/${appId}/users/${effectiveUserId}/recentGenerated`), orderBy("generatedAt", "desc"), limit(10)), (s) =>
        setRecentlyGenerated(s.docs.map((d) => ({ ...d.data(), id: d.id, firestoreId: d.id })))
      ),
      onSnapshot(
        query(
          collection(db, `/artifacts/${appId}/users/${effectiveUserId}/nutritionLogs`),
          orderBy("timestamp", "desc")
        ),
        (snapshot) =>
          setNutritionLogs(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })))
      ),
      onSnapshot(collection(db, `/artifacts/${appId}/users/${effectiveUserId}/recipeNotes`), (snapshot) => {
        const notesMap = {};
        snapshot.docs.forEach((docSnap) => {
          notesMap[docSnap.id] = docSnap.data().noteText;
        });
        setRecipeNotes(notesMap);
      })
    ];
    return () => unsubs.forEach((u) => u());
  }, [effectiveUserId, db, activeWorkspace]); // Re-runs instantly if activeWorkspace changes
  useEffect(() => {
    const sessionLoads = parseInt(sessionStorage.getItem("pantry_chef_session_loads") || "0");
    
    if (inventory.length > 0 && sessionLoads < 2 && activeTab === "recipes" && aiRecipes.length === 0) {
      // Increment session load counter
      sessionStorage.setItem("pantry_chef_session_loads", (sessionLoads + 1).toString());
      
      const randomItem = inventory[Math.floor(Math.random() * inventory.length)].name;
      fetchMealDBRecipes(randomItem).then((res) => {
        const processed = processRecipesAgainstInventory(res);
        setAiRecipes(processed.map((r) => ({ ...r, isAI: false, isDB: true })));
      });
    }
  }, [inventory, activeTab]);
  // Quick Tips Auto-Rotate Interval
  useEffect(() => {
    if (isTipPaused) return;
    const interval = setInterval(() => {
      if (isTipAnimating) return;
      setIsTipAnimating(true);
      setTimeout(() => {
        let nextTip;
        do {
          nextTip = QUICK_TIPS_POOL[Math.floor(Math.random() * QUICK_TIPS_POOL.length)];
        } while (nextTip.text === currentTip.text && QUICK_TIPS_POOL.length > 1);
        setCurrentTip(nextTip);
        setIsTipAnimating(false);
      }, 250);
    }, 8000);
    return () => clearInterval(interval);
  }, [currentTip, isTipPaused, isTipAnimating]);
  // Open Login Modal (app-wide)
  useEffect(() => {
    const handleOpenLoginModal = () => setShowLoginModal(true);
    window.addEventListener("openLoginModal", handleOpenLoginModal);
    return () => window.removeEventListener("openLoginModal", handleOpenLoginModal);
  }, []);
  // Automatically re-calculate recipe matches whenever inventory changes
  useEffect(() => {
    setHasCheckedStoreRun(false);
    setQuickStoreRecipes([]);
    if (aiRecipes.length > 0 && inventory.length > 0) {
      const updatedAiRecipes = processRecipesAgainstInventory(aiRecipes);
      setAiRecipes(updatedAiRecipes);
    }
  }, [inventory]);
  // 👉 SMART EXPIRATION PUSH NOTIFICATIONS WATCHER
  useEffect(() => {
    if (!inventory || inventory.length === 0) return;
    
    const now = new Date();
    const expiringItems = inventory.filter(item => {
      if (!item.expiryDate) return false;
      const expiry = item.expiryDate?.toDate ? item.expiryDate.toDate() : new Date(item.expiryDate);
      const daysLeft = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
      return daysLeft >= 0 && daysLeft <= 3;
    });

    if (expiringItems.length > 0) {
      const lastAlertDate = localStorage.getItem("pantry_chef_last_expiry_alert");
      const todayStr = new Date().toDateString();

      // Only fire once per calendar day to avoid nagging
      if (lastAlertDate !== todayStr) {
        localStorage.setItem("pantry_chef_last_expiry_alert", todayStr);
        const itemNames = expiringItems.map(i => i.name).slice(0, 3).join(", ");
        
        window.dispatchEvent(
          new CustomEvent("triggerSystemNotification", {
            detail: {
              title: "🚨 Pantry Expiration Warning",
              body: `${expiringItems.length} item(s) expiring soon (${itemNames}). Time to cook or batch prep!`
            }
          })
        );
      }
    }
  }, [inventory]);

  const addPantryModalJSX = showAddDrawer && (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center animate-in fade-in p-4">
      <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95 max-h-[85vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Plus className="w-5 h-5" />
            </div>
            <h3 className="font-black text-base text-gray-900">Add to Pantry</h3>
          </div>
          <button onClick={() => setShowAddDrawer(false)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full bg-gray-50 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 👉 UPGRADED TABS: Single, Multiline, Scan Photo, Voice */}
        <div className="flex bg-gray-100 p-1 rounded-xl text-[11px] font-bold overflow-x-auto no-scrollbar">
          <button type="button" onClick={() => setQuickAddTab("single")} className={`flex-1 py-2 px-2 rounded-lg transition-all cursor-pointer whitespace-nowrap ${quickAddTab === "single" ? "bg-white shadow text-indigo-600" : "text-gray-500"}`}>Single Item</button>
          <button type="button" onClick={() => setQuickAddTab("bulk")} className={`flex-1 py-2 px-2 rounded-lg transition-all cursor-pointer whitespace-nowrap ${quickAddTab === "bulk" ? "bg-white shadow text-indigo-600" : "text-gray-500"}`}>📋 Multiline</button>
          <button type="button" onClick={() => setQuickAddTab("scan")} className={`flex-1 py-2 px-2 rounded-lg transition-all cursor-pointer whitespace-nowrap ${quickAddTab === "scan" ? "bg-white shadow text-indigo-600" : "text-gray-500"}`}>📸 Scan Photo</button>
          <button type="button" onClick={() => setQuickAddTab("voice")} className={`flex-1 py-2 px-2 rounded-lg transition-all cursor-pointer whitespace-nowrap ${quickAddTab === "voice" ? "bg-white shadow text-indigo-600" : "text-gray-500"}`}>🎤 Voice Add</button>
        </div>

        {quickAddTab === "single" && (
          <form onSubmit={handleAddManual} className="space-y-3">
            <input value={newItemName} onChange={(e) => setNewItemName(e.target.value)} placeholder="Add item name..." className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:border-indigo-500 outline-none text-gray-900" required />
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-xl px-2">
                <input type="number" value={newItemQty} onChange={(e) => setNewItemQty(Number(e.target.value))} className="w-12 text-xs text-center outline-none bg-transparent py-2 text-gray-900" />
                <select value={newItemUnit} onChange={(e) => setNewItemUnit(e.target.value)} className="text-xs bg-transparent font-medium outline-none cursor-pointer flex-1 py-2 text-gray-900">
                  {["pcs", "oz", "lb", "g", "kg", "cup", "ml", "l", "can", "box", "bag"].map((u) => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              <select value={newItemCategory} onChange={(e) => setNewItemCategory(e.target.value)} className="text-xs bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 outline-none cursor-pointer text-gray-900">
                {["Produce", "Protein", "Dairy", "Grains", "Spices", "Canned", "Frozen", "Snacks", "Beverages", "Other"].map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="space-y-1.5 pt-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase">Shelf Life Preset:</span>
              <div className="grid grid-cols-4 gap-1.5">
                {[{ label: "+3d", days: 3 }, { label: "+5d", days: 5 }, { label: "+1w", days: 7 }, { label: "+2w", days: 14 }].map((preset) => (
                  <button key={preset.label} type="button" onClick={() => setNewItemExpiryDays(preset.days)} className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${newItemExpiryDays === preset.days ? "bg-indigo-600 text-white border-indigo-600 shadow-xs" : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"}`}>{preset.label}</button>
                ))}
              </div>
            </div>
            <button type="submit" className="w-full py-3.5 bg-indigo-600 text-white font-bold text-xs rounded-2xl shadow-md hover:bg-indigo-700 cursor-pointer">Add to Pantry</button>
          </form>
        )}

        {quickAddTab === "bulk" && (
          <form onSubmit={handleBulkAdd} className="space-y-3">
            <textarea value={bulkText} onChange={(e) => setBulkText(e.target.value)} placeholder="Milk, 1, 5d, Fridge\nChicken, 2, 3d, Freezer" className="w-full h-32 p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none resize-none font-mono text-gray-900" />
            <button type="submit" className="w-full py-3.5 bg-indigo-600 text-white font-bold text-xs rounded-2xl shadow-md hover:bg-indigo-700 cursor-pointer">Import All Lines</button>
          </form>
        )}

        {quickAddTab === "scan" && (
          <div className="py-6 text-center space-y-4">
            <div 
              onClick={handleProtectedScanTrigger}
              className="bg-indigo-50 border-2 border-dashed border-indigo-300 rounded-2xl p-6 cursor-pointer hover:bg-indigo-100 transition-colors flex flex-col items-center justify-center"
            >
              <Scan className="w-10 h-10 text-indigo-600 mb-2" />
              <p className="text-xs font-bold text-gray-800">Snap Photo or Upload Receipt</p>
              <p className="text-[10px] text-gray-500 mt-1">AI will automatically parse and add items to your pantry</p>
            </div>
          </div>
        )}

        {quickAddTab === "voice" && (
          <div className="py-6 flex flex-col items-center justify-center space-y-3">
            <VoiceInputWidget 
              onVoiceSubmit={(transcript) => {
                handleVoiceInventorySubmit(transcript);
                setShowAddDrawer(false);
              }} 
              isProcessing={loading && status === "Parsing speech..."} 
              onRequirePermission={() => setActivePermissionPrompt('audio')}
            />
            <p className="text-[10px] text-gray-400 text-center">Tap to speak your items (e.g., "Add two gallons of milk and a dozen eggs")</p>
          </div>
        )}
      </div>
    </div>
  );

  const cancelConfirmationModalJSX = timerCancelConfirm && (
    <div className="fixed inset-0 bg-black/60 z-[160] flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl animate-in zoom-in-95">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-red-100 text-red-600 rounded-2xl shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-black text-sm text-gray-900">Cancel Active Timer?</h4>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Multi-Device Kitchen Sync</p>
          </div>
        </div>

        <p className="text-xs text-gray-600 leading-relaxed">
          Are you sure you want to stop the schedule for <strong>"{timerCancelConfirm.title}"</strong>? This will cancel the countdown across all connected devices in this kitchen.
        </p>

        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={() => setTimerCancelConfirm(null)}
            className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
          >
            Keep Timer
          </button>
          <button
            type="button"
            onClick={() => {
              handleCancelScheduledTimer(timerCancelConfirm.id);
              if (timerCancelConfirm.unpinAfter && timerCancelConfirm.recipeToUnpin) {
                const nextPinned = pinnedRecipes.filter((p) => !isSameDishApp(p, timerCancelConfirm.recipeToUnpin));
                setPinnedRecipes(nextPinned);
                localStorage.setItem("pantry_chef_pinned_recipes", JSON.stringify(nextPinned));
                if (db && activeWorkspace?.id) {
                  setDoc(
                    doc(db, `/artifacts/${appId}/workspaces/${activeWorkspace.id}/stovetopState`, "current"),
                    { pinnedRecipes: nextPinned, updatedAt: serverTimestamp() },
                    { merge: true }
                  ).catch(() => {});
                }
              }
              setTimerCancelConfirm(null);
            }}
            className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            Cancel Timer
          </button>
        </div>
      </div>
    </div>
  );  
  
  if (activeRecipe)
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-white h-[100dvh] w-full overflow-hidden">
        <RecipeDetailView
          recipe={activeRecipe}
          justAdapted={recipeJustAdapted}
          onDismissJustAdapted={() => setRecipeJustAdapted(false)}
          onClose={() => {
            setActiveRecipe(null);
            setRecipeJustAdapted(false);
          }}
          onOpenAdaptModal={() => setShowAdaptModal(true)}
          onViewAuthor={(recipe) => handleViewAuthorProfile(recipe)}
          onUpdateRecipe={(updated) => setActiveRecipe((prev) => ({ ...prev, ...updated }))}
          onDeleteRecipe={handleDeleteRecipe}
          onNukeRecipe={handleNukeRecipe}
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
          onTogglePin={handleTogglePin}
          selectedForCompare={selectedForCompare}
          onToggleCompare={(recipeToCompare) => {
            setSelectedForCompare((prev) => {
              if (prev.some((r) => r.title === recipeToCompare.title)) {
                return prev.filter((r) => r.title !== recipeToCompare.title);
              }
              if (prev.length >= 3) {
                alert("You can compare up to 3 recipes at once.");
                return prev;
              }
              return [...prev, recipeToCompare];
            });
          }}
          askAIChef={askAIChef}
          onOpenBatchModal={(recipe) => setBatchModalRecipe(recipe)}
          isAdmin={isAdmin}
          db={db}
          appId={appId}
          onOpenAdd={() => setShowAddDrawer(true)}
          onQuickShop={handleQuickShopPrompt}
          onOpenAI={() => window.dispatchEvent(new CustomEvent("openOmnipresentChef"))}
          onOpenReverseScheduler={() => setShowReverseScheduler(true)}
          onRegenerate={handleRegenerateRecipe}
          communityRecipes={communityRecipes}
          savedRecipes={savedRecipes}
          fetchAIRecipes={fetchAIRecipes}
          activeFilters={activeFilters}
          onSelectRecipe={(r) => handleSetActiveRecipe(r)}
          activeWorkspace={activeWorkspace}
        />

        {addPantryModalJSX}{cancelConfirmationModalJSX}

        {/* BATCH COOKING MODAL OVERLAY */}
        {batchModalRecipe && (
          <BatchCookingModal
            recipe={batchModalRecipe}
            inventory={inventory}
            onClose={() => setBatchModalRecipe(null)}
            onSaveBatch={handleExecuteBatchPrep}
          />
        )}

        {/* REVERSE SCHEDULER MODAL OVERLAY */}
        {showReverseScheduler && (
          <ReverseSchedulerModal
            pinnedRecipes={pinnedRecipes}
            onClose={() => setShowReverseScheduler(false)}
            onStartScheduledTimers={handleStartScheduledTimers}
            onUnpinRecipe={handleTogglePin}
          />
        )}

        {/* INGREDIENT MATCH BREAKDOWN MODAL */}
        {activeMatchRecipe && (
          <IngredientMatchModal
            recipe={activeMatchRecipe}
            inventory={inventory}
            onClose={() => setActiveMatchRecipe(null)}
            onAddToGrocery={addToGroceryList}
            onAddToPantry={handleAddToPantry}
            db={db}
            appId={appId}
            activeWorkspace={activeWorkspace}
          />
        )}

        {/* ADAPT TO KITCHEN MODAL */}
        <AdaptToKitchenModal
          isOpen={showAdaptModal}
          recipe={activeRecipe}
          userProfile={userProfile}
          inventory={inventory}
          loading={loading}
          onClose={() => setShowAdaptModal(false)}
          onApplyCustomAdaptation={handleApplyCustomAdaptation}
        />

        {/* RECIPE COMPARISON MODAL */}
        {showCompareModal && selectedForCompare.length > 0 && (
          <RecipeComparisonModal
            recipes={selectedForCompare}
            inventory={inventory}
            onClose={() => setShowCompareModal(false)}
            onSelectRecipe={(r) => handleSetActiveRecipe(r)}
            onRemove={(recipeTitle) =>
              setSelectedForCompare((prev) => prev.filter((r) => r.title !== recipeTitle))
            }
          />
        )}

        {/* FLOATING COMPARE DOCK PILL (Allows opening compare directly from details) */}
        {selectedForCompare.length > 0 && (
          <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[80] bg-gray-900 text-white px-4 py-2.5 rounded-full shadow-2xl flex items-center gap-3 border border-gray-700 animate-in slide-in-from-bottom">
            <span className="text-xs font-bold">
              Comparing <span className="text-indigo-400 font-mono font-black">{selectedForCompare.length}</span>/3
            </span>
            <button
              onClick={() => setShowCompareModal(true)}
              className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg cursor-pointer"
            >
              View Side-by-Side
            </button>
            <button
              onClick={() => setSelectedForCompare([])}
              className="p-1 text-gray-400 hover:text-white cursor-pointer"
              title="Clear comparison selection"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* OPTIONAL EXPANDED FLOATING HUD */}
        {showFloatingHud && globalTimers.length > 0 && (
          <div className="fixed top-20 right-4 z-[100] max-w-sm w-full space-y-2 pointer-events-none animate-in slide-in-from-top-4">
            <div className="pointer-events-auto flex justify-end pb-0.5">
              <button
                type="button"
                onClick={() => setShowFloatingHud(false)}
                className="px-2.5 py-1 bg-gray-900/90 hover:bg-gray-900 text-gray-300 hover:text-white rounded-lg text-[10px] font-bold border border-gray-700 flex items-center gap-1 cursor-pointer transition-colors shadow-sm"
              >
                <X className="w-3 h-3" /> Minimize to Dock
              </button>
            </div>

            {globalTimers.map((timer) => (
              <div
                key={timer.id}
                className="pointer-events-auto p-3.5 rounded-2xl shadow-xl border bg-gray-900/95 backdrop-blur-md text-white border-gray-700 flex items-center justify-between gap-3"
              >
                <div
                  className="min-w-0 flex-1 cursor-pointer"
                  onClick={() => {
                    if (timer.recipeData) handleSetActiveRecipe(timer.recipeData);
                  }}
                >
                  <h5 className="font-bold text-xs truncate leading-tight">{timer.label}</h5>
                  <span className="text-[10px] text-white/80 font-medium">
                    {timer.phase === "countdown"
                      ? `Prep at ${timer.prepClockTime}`
                      : timer.phase === "prep"
                      ? `Cook at ${timer.cookClockTime}`
                      : `Done at ${timer.targetClockTime}`}
                  </span>
                </div>
                <span className="font-mono font-black text-sm text-amber-400 bg-black/40 px-2 py-1 rounded-lg">
                  {Math.floor(timer.remaining / 60)}m {timer.remaining % 60}s
                </span>
              </div>
            ))}
          </div>
        )}

        {/* PINNED STOVETOP DRAWER (Always visible when dishes are pinned) */}
        <PinnedStovetopDrawer
          pinnedRecipes={pinnedRecipes}
          onUnpinRecipe={handleTogglePin}
          onClearAll={() => {
            if (globalTimers.length > 0) {
              if (window.confirm(`Stop all ${globalTimers.length} running timers and clear all pinned dishes from stovetop?`)) {
                handleClearAllScheduledTimers();
                setPinnedRecipes([]);
                localStorage.removeItem("pantry_chef_pinned_recipes");
              }
            } else {
              setPinnedRecipes([]);
              localStorage.removeItem("pantry_chef_pinned_recipes");
              if (db && activeWorkspace?.id) {
                setDoc(
                  doc(db, `/artifacts/${appId}/workspaces/${activeWorkspace.id}/stovetopState`, "current"),
                  { pinnedRecipes: [], updatedAt: serverTimestamp() },
                  { merge: true }
                ).catch(() => {});
              }
            }
          }}
          onOpenScheduler={() => {
            if (globalTimers.length > 0) {
              setShowScheduleManagerModal(true);
            } else {
              setShowReverseScheduler(true);
            }
          }}
          onSelectRecipe={(recipe) => handleSetActiveRecipe(recipe)}
          globalTimers={globalTimers}
          onOpenScheduleManager={() => setShowScheduleManagerModal(true)}
          isHudMaximized={showFloatingHud}
          onMaximizeHud={() => setShowFloatingHud((prev) => !prev)}
        />

        <ActiveScheduleManagerModal
          isOpen={showScheduleManagerModal}
          onClose={() => setShowScheduleManagerModal(false)}
          globalTimers={globalTimers}
          pinnedRecipes={pinnedRecipes}
          onSelectRecipe={(dish) => handleSetActiveRecipe(dish)}
          onCancelTimer={(timerId) => handleCancelScheduledTimer(timerId)}
          onClearAllTimers={handleClearAllScheduledTimers}
          onAdjustTargetTime={handleAdjustScheduleTargetTime}
          onAppendDishToSchedule={handleAppendDishToSchedule}
        />

        {/* AI CULINARY BUFFER OVERLAY */}
        {loading && (
          status.toLowerCase().includes("tailoring") ||
          status.toLowerCase().includes("applying") ||
          status.toLowerCase().includes("rewriting") ||
          status.toLowerCase().includes("searching") ||
          status.toLowerCase().includes("crafting")
        ) && (
          <AIThinkingModal
            isOpen={true}
            mode="recipe"
            onCancel={() => {
              setLoading(false);
              setStatus("");
            }}
          />
        )}

        {/* AUTHOR & PUBLISHER PROFILE OVERLAY */}
        {viewingProfile && (
          <UserProfileView
            user={viewingProfile}
            onClose={() => setViewingProfile(null)}
            allRecipes={communityRecipes}
            onRecipeClick={(r) => {
              setActiveRecipe(r);
              setViewingProfile(null);
            }}
            db={db}
            appId={appId}
            effectiveUserId={effectiveUserId}
          />
        )}

        {/* NOTIFICATION TOAST */}
        {notification && (
          <NotificationToast
            message={notification}
            onClose={() => setNotification(null)}
          />
        )}
      </div>
    );

  if (viewingProfile)
    return (
      <UserProfileView
        user={viewingProfile}
        onClose={() => setViewingProfile(null)}
        allRecipes={communityRecipes}
        onRecipeClick={(r) => setActiveRecipe(r)}
        db={db}
        appId={appId}
        effectiveUserId={effectiveUserId}
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
  
  // Lock down app access for unauthenticated visitors
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
  
  // WAITLIST & APPROVAL GATE
  if (isDemoAuthenticated && !isAdmin && !customId.startsWith("demo_")) {
    if (userWaitlistStatus !== "approved") {
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
  }
  
  // Main App component
  return (
    <div className="flex flex-col h-screen bg-gray-50 md:ml-64 max-w-full md:max-w-none shadow-2xl overflow-hidden relative">
      <div className="p-4 pt-8 bg-white border-b flex items-center justify-between z-20">
        {/* Mobile & Desktop Logo + Workspace Switcher */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-600 rounded-lg shadow-lg shadow-indigo-100 hidden sm:block">
            <Utensils className="text-white w-5 h-5" />
          </div>
          <WorkspaceSwitcher 
            activeWorkspace={activeWorkspace} 
            userWorkspaces={userWorkspaces} 
            onSelect={(ws) => {
              setActiveWorkspace(ws);
              localStorage.setItem("pantry_chef_workspace_id", ws.id);
            }}
            onCreateNew={() => setShowCreateWorkspaceModal(true)}
            onJoin={() => setShowJoinWorkspaceModal(true)}
          />
          {activeWorkspace?.inviteCode && (
            <button
              onClick={() => {
                navigator.clipboard.writeText(activeWorkspace.inviteCode);
                triggerNotification(`📋 Invite Code ${activeWorkspace.inviteCode} copied to clipboard!`);
              }}
              className="px-2.5 py-1 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-[10px] font-bold text-gray-600 transition-colors cursor-pointer flex items-center gap-1"
              title="Click to copy invite code"
            >
              <LinkIcon className="w-3 h-3" /> Code: <span className="font-mono text-indigo-600">{activeWorkspace.inviteCode}</span>
            </button>
          )}
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
        <div key={activeTab} className="animate-tab-enter space-y-6">
          {activeTab === "pantry" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-2 md:p-6 pb-24 md:pb-6 relative">
              {/* LEFT WORKSPACE (Takes 2 columns on large screens) */}
              <div className="lg:col-span-2 space-y-4">
                {/* Profile Reminder Banner */}
                  <IncompleteProfileBanner
                    profile={userProfile}
                    onCompleteProfile={() => setActiveTab("profile")}
                  />

                  {/* 👉 TOP INGESTION ROW (Scan, Voice, and Sync Purchases) */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-4">
                    {/* Scan Receipt Card */}
                    <div
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={async (e) => {
                        e.preventDefault();
                        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                          await handleMultipleScans(e.dataTransfer.files);
                        }
                      }}
                      onClick={handleProtectedScanTrigger}
                      className="bg-indigo-600 hover:bg-indigo-700 rounded-2xl p-3 text-white shadow-md relative overflow-hidden active:scale-95 transition-all cursor-pointer flex flex-col items-center justify-center text-center group border-2 border-dashed border-indigo-400/50"
                    >
                      <Scan className="w-5 h-5 mb-1 group-hover:scale-110 transition-transform" />
                      <h2 className="text-xs font-bold leading-tight">Scan Receipt</h2>
                      <p className="text-[9px] text-indigo-200 mt-0.5 leading-snug">Snap photo or file</p>
                      
                      <input 
                        id="hidden-receipt-file-input"
                        type="file" 
                        accept="image/*,application/pdf" 
                        capture="environment"
                        multiple
                        onChange={async (e) => {
                          if (e.target.files && e.target.files.length > 0) {
                            await handleMultipleScans(e.target.files);
                          }
                        }} 
                        className="hidden"
                      />
                    </div>

                    {/* Voice Input Widget Card */}
                    <div className="bg-white rounded-2xl p-3 border border-gray-200 shadow-sm flex flex-col items-center justify-center relative">
                      <VoiceInputWidget 
                        onVoiceSubmit={handleVoiceInventorySubmit} 
                        isProcessing={loading && status === "Parsing speech..."} 
                        onRequirePermission={() => setActivePermissionPrompt('audio')}
                      />
                    </div>

                    {/* 👉 Sync Store Purchases (Moved up to top ingestion tools) */}
                    <div
                      onClick={() => window.dispatchEvent(new CustomEvent("openRecentPurchases"))}
                      className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:opacity-95 rounded-2xl p-3 text-white shadow-md active:scale-95 transition-all cursor-pointer flex flex-col items-center justify-center text-center group"
                    >
                      <Store className="w-5 h-5 mb-1 group-hover:scale-110 transition-transform" />
                      <h2 className="text-xs font-bold leading-tight">Sync Purchases</h2>
                      <p className="text-[9px] text-indigo-200 mt-0.5 leading-snug">Import store receipts</p>
                    </div>
                  </div>

                  <PermissionPromptModal
                    type={activePermissionPrompt}
                    isOpen={!!activePermissionPrompt}
                    onClose={() => setActivePermissionPrompt(null)}
                    onGrant={() => handleGrantPermission(activePermissionPrompt)}
                  />
                
                  {/* Desktop Static Add Box (Hidden on Mobile) */}
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

                  {/* Pantry View Modes */}
                  <div className="space-y-1 pb-4">
                    {inventory.length ? (
                      pantryView === "matrix" ? (
                        <div className="bg-white rounded-2xl border border-gray-200 p-3 shadow-sm space-y-2 animate-in fade-in">
                          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1 flex justify-between">
                            <span>Item Name</span>
                            <span className="pr-12">Category / Location / Qty</span>
                          </div>
                          <div className="max-h-96 overflow-y-auto space-y-2 pr-1">
                            {inventory.map((item) => (
                              <div key={item.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-xl gap-2 border border-gray-100">
                                <span className="text-xs font-bold text-gray-800 truncate flex-1">{item.name}</span>
                                
                                <select
                                  value={item.category || "Other"}
                                  onChange={async (e) => {
                                    await updateDoc(doc(db, `/artifacts/${appId}/workspaces/${activeWorkspace.id}/inventory`, item.id), {
                                      category: e.target.value
                                    });
                                  }}
                                  className="text-[10px] bg-white border border-gray-200 rounded-lg p-1 outline-none font-medium cursor-pointer"
                                >
                                  {["Produce", "Protein", "Dairy", "Grains", "Spices", "Canned", "Frozen", "Snacks", "Beverages", "Other"].map((c) => (
                                    <option key={c} value={c}>{c}</option>
                                  ))}
                                </select>

                                <select
                                  value={item.location || "Pantry"}
                                  onChange={async (e) => {
                                    await updateDoc(doc(db, `/artifacts/${appId}/workspaces/${activeWorkspace.id}/inventory`, item.id), {
                                      location: e.target.value
                                    });
                                  }}
                                  className="text-[10px] bg-white border border-gray-200 rounded-lg p-1 outline-none font-medium cursor-pointer"
                                >
                                  <option>Pantry</option>
                                  <option>Fridge</option>
                                  <option>Freezer</option>
                                </select>

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
                                  isSelected={selectedPantryItems.includes(item.id)}
                                  onToggleSelect={togglePantrySelection}
                                  onUpdateQty={handleUpdateQty}
                                  onDelete={async (id) =>
                                    deleteDoc(doc(db, `/artifacts/${appId}/workspaces/${activeWorkspace.id}/inventory`, id))
                                  }
                                  onUpdate={handleUpdateItem}
                                  onFindRecipes={(name) => handleGetAIRecipes(name)}
                                  onOpenRecipe={handleOpenPreppedRecipe}
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

                    {selectedPantryItems.length > 0 && (
                      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40 bg-gray-900 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-4 animate-in slide-in-from-bottom border border-gray-700">
                        <div className="text-xs font-bold whitespace-nowrap">
                          <span className="text-indigo-400 font-black">{selectedPantryItems.length}</span> Items
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleBulkGenerate("recipe")}
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-bold shadow-sm flex items-center gap-1 cursor-pointer"
                          >
                            <CookingPot className="w-3.5 h-3.5" /> Recipe
                          </button>
                          <button
                            onClick={() => handleBulkGenerate("meal")}
                            className="px-3 py-1.5 bg-teal-600 hover:bg-teal-500 rounded-xl text-xs font-bold shadow-sm flex items-center gap-1 cursor-pointer"
                          >
                            <Utensils className="w-3.5 h-3.5" /> Full Meal
                          </button>
                          <button
                            onClick={handleBulkDelete}
                            className="p-1.5 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded-lg cursor-pointer"
                            title="Delete Selected"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setSelectedPantryItems([])}
                            className="p-1.5 hover:bg-gray-800 text-gray-400 hover:text-white rounded-lg cursor-pointer border-l border-gray-700 ml-1 pl-2"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  </div>

                  {/* RIGHT SIDEBAR WIDGET COLUMN (Now fully responsive and visible on mobile & desktop) */}
                  <div className="space-y-4">
  
                    {/* 👉 SIDE-BY-SIDE METRICS ROW (Net Worth & Active Goal) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Pantry Net Worth Card */}
                      <div className="w-full">
                        <PantryValuationCard
                          inventory={inventory}
                          onOpenExpiringTriage={() => setShowExpiringModal(true)}
                        />
                      </div>

                      {/* Active Goal Card */}
                      <div className="w-full h-full flex flex-col">
                        <div className="flex-1">
                          <ChallengeWidget
                            challenges={userProfile.challenges}
                            onViewAll={() => setActiveTab("profile")}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Quick Tips Widget */}
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
                    {/* EVENT / LARGE GROUP MODE TOGGLE BANNER */}
                    <div className="bg-gradient-to-r from-amber-500 to-orange-600 p-4 rounded-2xl text-white shadow-sm flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2 bg-white/20 rounded-xl shrink-0">
                          <Users className="w-5 h-5 text-white" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-xs uppercase tracking-wider">Event / Large Group Mode</h4>
                          <p className="text-[11px] text-amber-100 truncate">
                            {eventMode.active 
                              ? `Active: ${eventMode.name || 'Gathering'} (${eventMode.headcount} people)` 
                              : "Cooking for an office party or holiday gathering? Click to configure."}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setShowEventModal(true)}
                        className="px-3.5 py-2 bg-white text-orange-600 rounded-xl text-xs font-bold shadow-xs hover:bg-amber-50 transition-colors cursor-pointer shrink-0"
                      >
                        {eventMode.active ? "Manage Event" : "Enable Event Mode"}
                      </button>
                    </div>
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
                      <>{/* ACTIVE TRIAGE INDICATOR PILL */}
                        {activeTriageBadge && (
                          <div className="bg-amber-50 border border-amber-200 p-3 rounded-2xl flex items-center justify-between gap-3 text-xs text-amber-950 shadow-2xs mb-3 animate-in fade-in">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="px-2 py-0.5 bg-amber-600 text-white rounded-md text-[10px] font-black uppercase shrink-0">
                                Triage Active
                              </span>
                              <span className="truncate">
                                Prioritizing: <strong>{activeTriageBadge.join(", ")}</strong>
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setActiveTriageBadge(null);
                                setSearchQuery("");
                              }}
                              className="px-2.5 py-1 bg-white border border-amber-300 hover:bg-amber-100 text-amber-800 text-[10px] font-bold rounded-lg cursor-pointer transition-colors shrink-0"
                            >
                              Clear Filter
                            </button>
                          </div>
                        )}
                        {/* SEARCH BAR & AI GENERATOR SECTION */}
                        <div className="space-y-3 mb-3">
                          <div className="relative flex items-center">
                            <input
                              type="text"
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && !loading) {
                                  handleGetAIRecipes("recipe", searchQuery);
                                }
                              }}
                              placeholder="e.g., mexican bbq, high protein chicken bowl"
                              className="w-full p-4 pr-28 bg-white border border-gray-200 rounded-2xl shadow-sm text-base outline-none focus:border-indigo-500 transition-all text-gray-900"
                            />
                            <button
                              onClick={() => handleGetAIRecipes("recipe", searchQuery)}
                              disabled={loading}
                              className="absolute right-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2 shadow-md"
                            >
                              {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : "Search 🚀"}
                            </button>
                          </div>

                          {/* CONNECTIVE GENERATION ACTIONS */}
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={() => handleGetAIRecipes("recipe", searchQuery)}
                              disabled={loading}
                              className="py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all active:scale-98 disabled:opacity-50"
                            >
                              <Zap className="w-4 h-4 text-amber-300" /> Generate Recipes
                              <span className="bg-white/20 px-1.5 py-0.5 rounded text-[10px] font-mono">
                                {DAILY_API_LIMIT - apiUsage} left
                              </span>
                            </button>
                            <button
                              onClick={() => handleGetAIRecipes("meal", searchQuery)}
                              disabled={loading}
                              className="py-3.5 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all active:scale-98 disabled:opacity-50"
                            >
                              <Utensils className="w-4 h-4 text-emerald-200" /> Generate Meals (Combo)
                            </button>
                          </div>
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

                        
                          <button
                            onClick={() => {
                              const craving = searchQuery.trim() || prompt("What restaurant or fast-food item would you like to clone?", "Chipotle Chicken Burrito Bowl");
                              if (craving) {
                                setSearchQuery(craving);
                                handleGetAIRecipes("copycat", craving);
                              }
                            }}
                            className="w-full col-span-2 sm:col-span-1 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg cursor-pointer"
                          >
                            <span>🍔 Clone Restaurant Copycat</span>
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
                        {/* Bookmark Guidance Banner */}
                        <div className="bg-indigo-50/80 border border-indigo-200/80 p-3.5 rounded-2xl flex items-center justify-between gap-3 shadow-2xs">
                          <div className="flex items-center gap-2.5">
                            <div className="p-1.5 bg-indigo-600 text-white rounded-lg shrink-0">
                              <Bookmark className="w-4 h-4 fill-current" />
                            </div>
                            <p className="text-xs text-indigo-900 leading-snug">
                              <strong>Personal Library:</strong> Generated recipes are accessible across the community catalog. Tap <strong>Bookmark (🔖)</strong> on any card to lock it into your personal saved library.
                            </p>
                          </div>
                        </div>

                        {/* Last 10 Generated Recall Queue */}
                        {recentlyGenerated.length > 0 && (
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between px-1">
                              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-indigo-500" /> Recently Generated (Last 10)
                              </h3>
                              <span className="text-[10px] text-gray-400 font-mono">{recentlyGenerated.length}/10 cached</span>
                            </div>
                            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                              {recentlyGenerated.map((r) => (
                                <div
                                  key={r.id || r.title}
                                  className="min-w-[210px] max-w-[210px] bg-white rounded-2xl shadow-xs border border-gray-100 p-2.5 cursor-pointer hover:shadow-md transition-all flex items-center gap-3 shrink-0"
                                  onClick={() => handleSetActiveRecipe(r)}
                                >
                                  {r.image ? (
                                    <img src={r.image} alt={r.title} className="w-10 h-10 rounded-xl object-cover" />
                                  ) : (
                                    <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
                                      <ChefHat className="w-5 h-5" />
                                    </div>
                                  )}
                                  <div className="min-w-0 flex-1">
                                    <p className="text-xs font-bold text-gray-800 truncate">{r.title}</p>
                                    <span className="text-[10px] text-gray-400 block">{r.prepTime || "30 mins"}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
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

                        

                        {/* DESKTOP 2-COLUMN RECIPE GRID */}
                        {/* CATEGORIZED HYBRID RESULTS SECTIONS WITH UNIFIED 50%+ MATCH FILTER */}
                        {(() => {
                          const rawDiscoverFeed = aiRecipes;
                          const allDiscoverRecipes = getIntentBasedSponsoredFeed(
                            rawDiscoverFeed,
                            MOCK_SPONSORED_POOL,
                            searchQuery
                          );

                          // Unified helper to calculate match % consistently across filters and cards
                          const getMatchPct = (recipe) => {
                            const total = recipe.allIngredients?.length || 0;
                            if (total === 0) return 0;
                            const matched = recipe.allIngredients.filter(ing => 
                              inventory.some(invItem => 
                                invItem.name?.toLowerCase().includes(ing.name?.toLowerCase()) ||
                                ing.name?.toLowerCase().includes(invItem.name?.toLowerCase())
                              )
                            ).length;
                            return Math.round((matched / total) * 100);
                          };

                          const perfectMatches = allDiscoverRecipes.filter(r => getMatchPct(r) === 100);
                          const quickMatches = allDiscoverRecipes.filter(r => {
                            const pct = getMatchPct(r);
                            return pct >= 50 && pct < 100; // 👉 Captures all 50% to 99% matches
                          });
                          const otherDiscoveries = allDiscoverRecipes.filter(r => getMatchPct(r) < 50);

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
                                        key={r.id || r.title}
                                        recipe={r}
                                        inventory={inventory}
                                        onClick={() => handleSetActiveRecipe(r)}
                                        onAddToPlan={handleAddToPlan}
                                        onAddToGrocery={addToGroceryList}
                                        onAddToPantry={handleAddToPantry}
                                        activeWorkspace={activeWorkspace}
                                        onOpenMatchBreakdown={(recipe) => setActiveMatchRecipe(recipe)}
                                        isSaved={savedRecipes.some((s) => s.title === r.title)}
                                        onToggleSave={handleToggleSave}
                                        onVote={handleVote}
                                        onAuthorClick={() => handleViewAuthorProfile(r)}
                                        userNote={recipeNotes[r.id || r.firestoreId]}
                                        selectedForCompare={selectedForCompare}
                                        onToggleCompare={(recipe) => {
                                          setSelectedForCompare(prev => {
                                            if (prev.some(r => r.title === recipe.title)) {
                                              return prev.filter(r => r.title !== recipe.title);
                                            }
                                            if (prev.length >= 3) {
                                              alert("You can compare up to 3 recipes at once.");
                                              return prev;
                                            }
                                            return [...prev, recipe];
                                          });
                                        }}
                                        pinnedRecipes={pinnedRecipes}
                                        onTogglePin={handleTogglePin}
                                      />
                                    ))}
                                  </div>
                                </div>
                              )}

                              {quickMatches.length > 0 && (
                                <div
                                  id="quick-matches-section"
                                  className={`space-y-3 scroll-mt-28 transition-all duration-500 rounded-2xl ${
                                    triagePulseActive
                                      ? "ring-4 ring-amber-400 ring-offset-4 bg-amber-50/40 p-3 shadow-lg"
                                      : "p-0"
                                  }`}
                                >
                                  <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                                    <Zap className="w-4 h-4 text-amber-500" />
                                    <h4 className="font-black text-xs text-amber-800 uppercase tracking-wider">
                                      Quick Match (50%+ In Stock)
                                    </h4>
                                  </div>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {quickMatches.map((r) => (
                                      <RecipeCard
                                        key={r.id || r.title}
                                        recipe={r}
                                        inventory={inventory}
                                        onClick={() => handleSetActiveRecipe(r)}
                                        onAddToPlan={handleAddToPlan}
                                        onAddToGrocery={addToGroceryList}
                                        onAddToPantry={handleAddToPantry}
                                        activeWorkspace={activeWorkspace}
                                        onOpenMatchBreakdown={(recipe) => setActiveMatchRecipe(recipe)}
                                        isSaved={savedRecipes.some((s) => s.title === r.title)}
                                        onToggleSave={handleToggleSave}
                                        onVote={handleVote}
                                        onAuthorClick={() => handleViewAuthorProfile(r)}
                                        userNote={recipeNotes[r.id || r.firestoreId]}
                                        selectedForCompare={selectedForCompare}
                                        onToggleCompare={(recipe) => {
                                          setSelectedForCompare(prev => {
                                            if (prev.some(r => r.title === recipe.title)) {
                                              return prev.filter(r => r.title !== recipe.title);
                                            }
                                            if (prev.length >= 3) {
                                              alert("You can compare up to 3 recipes at once.");
                                              return prev;
                                            }
                                            return [...prev, recipe];
                                          });
                                        }}
                                        pinnedRecipes={pinnedRecipes}
                                        onTogglePin={handleTogglePin}
                                      />
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Cook with a Quick Store Run Section */}
                              <div className="space-y-3 pt-2">
                                <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                                  <div className="flex items-center gap-2">
                                    <ShoppingCart className="w-4 h-4 text-indigo-600" />
                                    <h4 className="font-black text-xs text-indigo-800 uppercase tracking-wider">
                                      Cook with a Quick Store Run (1 to 2 Missing Items)
                                    </h4>
                                  </div>
                                </div>

                                {/* Scenario 1: Bare Pantry (< 3 items) */}
                                {inventory.length < 3 && (
                                  <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-5 text-center space-y-3 shadow-2xs">
                                    <div className="w-10 h-10 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mx-auto">
                                      <Package className="w-5 h-5" />
                                    </div>
                                    <div className="space-y-1">
                                      <h5 className="font-bold text-xs text-amber-900">Pantry Too Bare for Recommendations</h5>
                                      <p className="text-[11px] text-amber-700 max-w-sm mx-auto leading-relaxed">
                                        You currently have {inventory.length} item{inventory.length === 1 ? "" : "s"} logged. Add at least 3 pantry staples to activate 1 to 2 item store run matching.
                                      </p>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => setShowAddDrawer(true)}
                                      className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer transition-colors inline-flex items-center gap-1.5"
                                    >
                                      <Plus className="w-3.5 h-3.5" /> Add Items to Pantry
                                    </button>
                                  </div>
                                )}

                                {/* Scenario 2: Ready to Search (Not Run Yet) */}
                                {inventory.length >= 3 && !hasCheckedStoreRun && !loadingStoreRun && (
                                  <div className="bg-indigo-50/60 border border-indigo-100 rounded-2xl p-5 text-center space-y-3 shadow-2xs">
                                    <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto">
                                      <Sparkles className="w-5 h-5" />
                                    </div>
                                    <div className="space-y-1">
                                      <h5 className="font-bold text-xs text-indigo-950">Find Meals with Minimal Shopping</h5>
                                      <p className="text-[11px] text-indigo-700 max-w-md mx-auto leading-relaxed">
                                        Scan your catalog for dishes where you already own most staples and only need to pick up 1 or 2 items from the store.
                                      </p>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={handleLoadQuickStoreRun}
                                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition-colors inline-flex items-center gap-2"
                                    >
                                      <Zap className="w-3.5 h-3.5" /> Find Quick Store Run Meals
                                    </button>
                                  </div>
                                )}

                                {/* Scenario 3: Checked, but Zero Catalog Matches Met the Strict <= 2 Missing Cutoff */}
                                {inventory.length >= 3 && hasCheckedStoreRun && quickStoreRecipes.length === 0 && !loadingStoreRun && (
                                  <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 text-center space-y-3 shadow-2xs">
                                    <div className="w-10 h-10 bg-gray-200 text-gray-600 rounded-full flex items-center justify-center mx-auto">
                                      <ShoppingCart className="w-5 h-5" />
                                    </div>
                                    <div className="space-y-1">
                                      <h5 className="font-bold text-xs text-gray-900">No 1 to 2 Item Matches in Catalog</h5>
                                      <p className="text-[11px] text-gray-600 max-w-md mx-auto leading-relaxed">
                                        None of the currently saved catalog recipes match your exact staples with only 1 or 2 missing items. You can add more staples or generate a custom recipe directly with AI.
                                      </p>
                                    </div>
                                    <div className="flex flex-wrap justify-center gap-2 pt-1">
                                      <button
                                        type="button"
                                        onClick={handleLoadQuickStoreRun}
                                        disabled={loadingStoreRun}
                                        className="px-3.5 py-2 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold shadow-xs cursor-pointer transition-colors inline-flex items-center gap-1.5"
                                      >
                                        <RefreshCw className={`w-3.5 h-3.5 ${loadingStoreRun ? "animate-spin" : ""}`} /> Re-check Catalog
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setShowAddDrawer(true)}
                                        className="px-3.5 py-2 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 rounded-xl text-xs font-bold shadow-xs cursor-pointer transition-colors inline-flex items-center gap-1.5"
                                      >
                                        <Plus className="w-3.5 h-3.5" /> Add Staples
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleGetAIRecipes("recipe", null, true)}
                                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer transition-colors inline-flex items-center gap-1.5"
                                      >
                                        <Sparkles className="w-3.5 h-3.5" /> Generate with AI
                                      </button>
                                    </div>
                                  </div>
                                )}

                                {/* Scenario 4: Recipes Found (Max 4 Cards + Bottom Control Bar) */}
                                {quickStoreRecipes.length > 0 && (
                                  <div className="space-y-3">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                      {quickStoreRecipes.map((r) => (
                                        <RecipeCard
                                          key={r.id || r.title}
                                          recipe={r}
                                          inventory={inventory}
                                          onClick={() => handleSetActiveRecipe(r)}
                                          onAddToPlan={handleAddToPlan}
                                          onAddToGrocery={addToGroceryList}
                                          onAddToPantry={handleAddToPantry}
                                          activeWorkspace={activeWorkspace}
                                          onOpenMatchBreakdown={(recipe) => setActiveMatchRecipe(recipe)}
                                          isSaved={savedRecipes.some((s) => s.title === r.title)}
                                          onToggleSave={handleToggleSave}
                                          onVote={handleVote}
                                          onAuthorClick={() => handleViewAuthorProfile(r)}
                                          userNote={recipeNotes[r.id || r.firestoreId]}
                                          selectedForCompare={selectedForCompare}
                                          onToggleCompare={(recipe) => {
                                            setSelectedForCompare((prev) => {
                                              if (prev.some((item) => item.title === recipe.title)) {
                                                return prev.filter((item) => item.title !== recipe.title);
                                              }
                                              if (prev.length >= 3) {
                                                alert("You can compare up to 3 recipes at once.");
                                                return prev;
                                              }
                                              return [...prev, recipe];
                                            });
                                          }}
                                          pinnedRecipes={pinnedRecipes}
                                          onTogglePin={handleTogglePin}
                                        />
                                      ))}
                                    </div>

                                    {/* Action row positioned underneath the recipe cards */}
                                    <div className="p-3 bg-gray-50 border border-gray-100 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-2">
                                      <span className="text-[11px] text-gray-500 font-medium">Want more variety for these staples?</span>
                                      <div className="flex gap-2 w-full sm:w-auto">
                                        <button
                                          type="button"
                                          onClick={handleLoadQuickStoreRun}
                                          disabled={loadingStoreRun}
                                          className="flex-1 sm:flex-none px-3 py-1.5 bg-white border border-gray-200 hover:bg-gray-100 text-gray-700 rounded-xl text-xs font-bold cursor-pointer transition-colors"
                                        >
                                          Refresh Catalog
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleGetAIRecipes("recipe", null, true)}
                                          className="flex-1 sm:flex-none px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer transition-colors flex items-center justify-center gap-1.5"
                                        >
                                          <Sparkles className="w-3.5 h-3.5" /> Generate with AI
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })()}
                      </>
                    )}
                    {recipeView === "plan" && (
                      <MealPlanner
                        plan={mealPlan}
                        onAddMeal={() => {}}
                        onDeleteMeal={handleDeleteMeal}
                        onGenerateDayPlan={(day) => {
                          handleGetAIRecipes("meal");
                        }}
                        onPlanExpiring={(day) => {
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
                        onSelectRecipe={(r) => handleSetActiveRecipe(r)}
                        allRecipes={[
                          ...communityRecipes,
                          ...savedRecipes,
                          ...aiRecipes,
                          ...recentlyGenerated,
                        ]}
                      />
                    )}
                    {recipeView === "saved" && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {savedRecipes.length > 0 ? (
                          savedRecipes.map((r) => (
                            <RecipeCard
                              key={r.firestoreId}
                              recipe={r}
                              inventory={inventory}
                              communityRecipes={communityRecipes}
                              isUserRecipe={!r.isAI && !r.isDB}
                              onClick={() => handleSetActiveRecipe(r)}
                              onAddToPlan={handleAddToPlan}
                              onAddToGrocery={addToGroceryList}
                              onAddToPantry={handleAddToPantry}
                              activeWorkspace={activeWorkspace}
                              onOpenMatchBreakdown={(recipe) => setActiveMatchRecipe(recipe)}
                              isSaved={true}
                              onToggleSave={handleToggleSave}
                              onVote={handleVote}
                              onAuthorClick={() => handleViewAuthorProfile(r)}
                              userNote={recipeNotes[r.id || r.firestoreId]} //pass private note
                              selectedForCompare={selectedForCompare}
                              onToggleCompare={(recipe) => {
                                setSelectedForCompare(prev => {
                                  if (prev.some(r => r.title === recipe.title)) {
                                    return prev.filter(r => r.title !== recipe.title);
                                  }
                                  if (prev.length >= 3) {
                                    alert("You can compare up to 3 recipes at once.");
                                    return prev;
                                  }
                                  return [...prev, recipe];
                                });
                              }}
                              pinnedRecipes={pinnedRecipes}
                              onTogglePin={handleTogglePin}
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
                                  
                                  {/* Pantry Stock Badge Warning */}
                                  {existingPantryItem && (
                                    <span className="text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                                      <CheckCircle className="w-2.5 h-2.5" /> In Pantry ({existingPantryItem.quantity} {existingPantryItem.unit})
                                    </span>
                                  )}
                                </div>
                                {/* 👉 CLAIM UI FOR COLLABORATIVE WORKSPACES */}
                                {(activeWorkspace?.type === "event" || activeWorkspace?.memberIds?.length > 1) && (
                                  <div className="mt-1">
                                    {item.claimedBy ? (
                                      <button 
                                        onClick={() => handleClaimGroceryItem(item.id, item.claimedBy)}
                                        className={`text-[9px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 transition-colors cursor-pointer ${
                                          item.claimedBy === effectiveUserId 
                                            ? "bg-indigo-100 text-indigo-700 hover:bg-rose-100 hover:text-rose-700" 
                                            : "bg-gray-100 text-gray-500 cursor-default"
                                        }`}
                                        title={item.claimedBy === effectiveUserId ? "Click to unclaim" : "Claimed by someone else"}
                                      >
                                        <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[7px] text-white shrink-0 ${item.claimedBy === effectiveUserId ? 'bg-indigo-500' : 'bg-gray-400'}`}>
                                          {(item.claimedByName || "U").charAt(0).toUpperCase()}
                                        </div>
                                        {item.claimedBy === effectiveUserId ? "You got this (Tap to drop)" : `${item.claimedByName} got this`}
                                      </button>
                                    ) : (
                                      <button 
                                        onClick={() => handleClaimGroceryItem(item.id, null)}
                                        className="text-[9px] font-bold bg-orange-50 text-orange-600 hover:bg-orange-100 border border-orange-200 px-2 py-0.5 rounded-md transition-colors cursor-pointer flex items-center gap-1"
                                      >
                                        ✋ I'll bring this
                                      </button>
                                    )}
                                  </div>
                                )}
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
                    <CheckoutHandoffPanel shoppingListItems={groceryList} />
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
                    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between my-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                        <Store className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-gray-900">Connected Retailer Accounts</h4>
                        <p className="text-[10px] text-gray-400">Manage loyalty cards & digital links</p>
                      </div>
                    </div>
                    <button
                      onClick={() => window.dispatchEvent(new CustomEvent("openRetailerAccounts"))}
                      className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    >
                      Manage
                    </button>
                    <button
                        onClick={() => window.dispatchEvent(new CustomEvent("openRecentPurchases"))}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-2"
                      >
                        🧾 Sync Recent Store Purchases
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

                    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between my-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                          <Store className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-gray-900">Connected Retailer Accounts</h4>
                          <p className="text-[10px] text-gray-400">Manage loyalty cards & digital links</p>
                        </div>
                      </div>
                      <button
                        onClick={() => window.dispatchEvent(new CustomEvent("openRetailerAccounts"))}
                        className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                      >
                        Manage
                      </button>
                      <button
                        onClick={() => window.dispatchEvent(new CustomEvent("openRecentPurchases"))}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-2"
                      >
                        🧾 Sync Recent Store Purchases
                      </button>
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

                    {/* COMMUNITY SOURCE ORIGIN FILTERS */}
                    <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide pt-1">
                      {[
                        { id: "all", label: "All Recipes" },
                        { id: "original", label: "👨‍🍳 Community Originals" },
                        { id: "import", label: "🔗 Web Imports" },
                        { id: "ai", label: "🤖 Chef AI Lab" },
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setCommunitySourceFilter(tab.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap border ${
                            communitySourceFilter === tab.id
                              ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                              : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                    
                    {/* Filtered Community Recipe Mapping */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {communityRecipes
                        .filter((r) => {
                          // 1. Text search query
                          if (communitySearchQuery.trim()) {
                            const query = communitySearchQuery.toLowerCase();
                            const titleMatch = r.title?.toLowerCase().includes(query) || false;
                            const descMatch = r.description?.toLowerCase().includes(query) || false;
                            const authorMatch = r.authorName?.toLowerCase().includes(query) || false;
                            if (!titleMatch && !descMatch && !authorMatch) return false;
                          }
                          
                          // 2. Strict source origin filter
                          const isAI = Boolean(
                            r.isAI ||
                            r.authorName === "Pantry Chef AI" ||
                            r.authorName === "Pantry Chef" ||
                            r.createdBy === "system" ||
                            r.createdBy === "ai_engine"
                          );

                          const isWeb = Boolean(
                            r.sourceName === "Web Import" ||
                            r.sourceUrl ||
                            r.authorName === "Allrecipes" ||
                            r.authorName === "Cookie and Kate" ||
                            r.authorRole === "Brand"
                          );

                          if (communitySourceFilter === "original") {
                            return !isAI && !isWeb;
                          }
                          if (communitySourceFilter === "import") {
                            return isWeb && !isAI;
                          }
                          if (communitySourceFilter === "ai") {
                            return isAI;
                          }
                          return true;
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
                                inventory={inventory}
                                onClick={() =>
                                  handleSetActiveRecipe({
                                    ...r,
                                    matchPercentage: calculateMatch(r.allIngredients),
                                  })
                                }
                                onAddToPlan={handleAddToPlan}
                                onAddToGrocery={addToGroceryList}
                                onAddToPantry={handleAddToPantry}
                                activeWorkspace={activeWorkspace}
                                onOpenMatchBreakdown={(recipe) => setActiveMatchRecipe(recipe)}
                                isSaved={savedRecipes.some((s) => s.title === r.title)}
                                onToggleSave={handleToggleSave}
                                onVote={handleVote}
                                onAuthorClick={() => handleViewAuthorProfile(r)}
                                selectedForCompare={selectedForCompare}
                                onToggleCompare={(recipe) => {
                                  setSelectedForCompare(prev => {
                                    if (prev.some(r => r.title === recipe.title)) {
                                      return prev.filter(r => r.title !== recipe.title);
                                    }
                                    if (prev.length >= 3) {
                                      alert("You can compare up to 3 recipes at once.");
                                      return prev;
                                    }
                                    return [...prev, recipe];
                                  });
                                }}
                                pinnedRecipes={pinnedRecipes}
                                onTogglePin={handleTogglePin}
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
              {activeTab === "tools" && (
                <div className="max-w-4xl mx-auto animate-in fade-in">
                  <ConverterWidget />
                  <ToolsScreen />
                </div>
              )}
              {activeTab === "profile" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-2 md:p-6 max-w-7xl mx-auto">
                {/* Left Main Content Column (Takes 2/3 width) */}
                <div className="md:col-span-2 space-y-6">
                  <SettingsProfile
                    profile={userProfile}
                    userProfile={userProfile}
                    nutritionLogs={nutritionLogs}
                    onDeleteLog={handleDeleteNutritionLog}
                    onSaveProfile={handleSaveProfile}
                    isAdmin={isAdmin}
                    onToggleAdmin={handleAdminToggle}
                    isDemoAuthenticated={isDemoAuthenticated}
                    onShowLogin={() => setShowLoginModal(true)}
                    onRestartTour={() => setShowOnboarding(true)}
                    onOpenGuidelines={() => setShowGuidelinesModal(true)}
                    onOpenLegal={() => setShowLegalModal(true)}
                    onExportMealPlanICS={handleExportMealPlanICS}
                    db={db}
                    appId={appId}
                    effectiveUserId={effectiveUserId}
                    storage={storage}
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
                      db={db}
                      appId={appId}
                      DEMO_USERS={DEMO_USERS}
                      onApproveUser={handleApproveUser}
                      notificationHistory={notificationHistory}
                      onClearHistory={() => setNotificationHistory([])}
                      onInspectRecipe={handleInspectReportedRecipe}
                      onRestartTour={() => {
                        localStorage.removeItem("pantry_chef_onboarded");
                        setShowOnboarding(true);
                    }}
                    />
                  </div>
                </div>
              )}
        </div>
      </div>
      {/* EVENT / LARGE GROUP MODE CONFIGURATION MODAL */}
      {showEventModal && (
        <div className="fixed inset-0 bg-black/60 z-[80] flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h3 className="font-black text-base text-gray-900">🎉 Event / Large Group Mode</h3>
                <p className="text-xs text-gray-500">Scale recipes & guard against guest allergies for gatherings.</p>
              </div>
              <button onClick={() => setShowEventModal(false)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full bg-gray-50 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Event Name</label>
                <input
                  type="text"
                  value={eventMode.name}
                  onChange={(e) => setEventMode({ ...eventMode, name: e.target.value })}
                  placeholder="e.g., Super Bowl Party, Thanksgiving, Office Lunch"
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Total Headcount (People)</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={eventMode.headcount}
                  onChange={(e) => setEventMode({ ...eventMode, headcount: parseInt(e.target.value) || 1 })}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Guest Dietary Restrictions & Allergies</label>
                <input
                  type="text"
                  value={eventMode.restrictions}
                  onChange={(e) => setEventMode({ ...eventMode, restrictions: e.target.value })}
                  placeholder="e.g., 1 guest is gluten-free, peanut allergy"
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => {
                  setEventMode({ active: false, name: "", headcount: 8, restrictions: "" });
                  setShowEventModal(false);
                  triggerNotification("🔄 Event Mode disabled.");
                }}
                className="flex-1 py-3 text-red-600 bg-red-50 hover:bg-red-100 font-bold text-xs rounded-xl cursor-pointer transition-colors"
              >
                Disable Mode
              </button>
              <button
                onClick={() => {
                  setEventMode({ ...eventMode, active: true });
                  setShowEventModal(false);
                  setNotification(`🎉 Event Mode Active: ${eventMode.name || 'Gathering'} (${eventMode.headcount} people)!`);
                  setTimeout(() => setNotification(null), 4000);
                }}
                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition-colors"
              >
                Save & Activate Event
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 👉 JOIN WORKSPACE MODAL */}
      {showJoinWorkspaceModal && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center border-b pb-3 mb-4">
              <h3 className="font-black text-lg text-gray-900">🔗 Join Workspace</h3>
              <button onClick={() => setShowJoinWorkspaceModal(false)} className="p-1.5 hover:bg-gray-100 rounded-full cursor-pointer">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            
            <p className="text-xs text-gray-500 mb-4 leading-relaxed">
              Enter the 6-digit invite code to instantly sync up with a friend's kitchen, holiday gathering, or event pantry.
            </p>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Invite Code</label>
                <input
                  type="text"
                  maxLength={6}
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="e.g., 8X4B92"
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl text-center text-xl tracking-[0.2em] font-black focus:border-indigo-500 outline-none text-gray-900 uppercase"
                  autoFocus
                />
              </div>

              <button
                onClick={handleJoinWorkspace}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <LinkIcon className="w-5 h-5" /> Join Kitchen
              </button>
            </div>
          </div>
        </div>
      )}
      
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
              await addDoc(collection(db, `/artifacts/${appId}/workspaces/${activeWorkspace.id}/inventory`), {
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
            // Admins publish publicly by default; standard users save privately unless explicitly made public
            const shouldPublishPublicly = isAdmin || recipeData.isPublic === true;

            if (shouldPublishPublicly) {
              await addDoc(
                collection(db, `/artifacts/${appId}/public/data/userRecipes`),
                {
                  ...recipeData,
                  isPublic: true,
                  isPrivate: false,
                  createdAt: serverTimestamp(),
                  createdBy: effectiveUserId,
                  likeCount: 0,
                  isAI: false,
                }
              );
              setNotification("🌐 Recipe published to the Community Feed!");
            } else {
              await addDoc(
                collection(db, `/artifacts/${appId}/users/${effectiveUserId}/savedRecipes`),
                {
                  ...recipeData,
                  isPublic: false,
                  isPrivate: true,
                  savedAt: serverTimestamp(),
                  createdAt: serverTimestamp(),
                  createdBy: effectiveUserId,
                  likeCount: 0,
                  isAI: false,
                }
              );
              setNotification("🔒 Secret recipe saved privately to your vault!");
            }
            setTimeout(() => setNotification(null), 3000);
          }}
        />
      )}

      {generatedBatch && (
        <GeneratedBatchModal
          recipes={generatedBatch}
          onClose={() => setGeneratedBatch(null)}
          activeWorkspace={activeWorkspace}
          onSelectRecipe={(recipe) => handleSetActiveRecipe(recipe)}
          onAddToPlan={handleAddToPlan}
          savedRecipes={savedRecipes}
          onToggleSave={handleToggleSave}
          onVote={handleVote}
          inventory={inventory}
          onAddToGrocery={addToGroceryList}
          onAddToPantry={handleAddToPantry}
          db={db}
          appId={appId}
          effectiveUserId={effectiveUserId}
          onViewAuthor={handleViewAuthorProfile}
          selectedForCompare={selectedForCompare}
          onToggleCompare={(recipe) => {
            setSelectedForCompare(prev => {
              if (prev.some(r => r.title === recipe.title)) {
                return prev.filter(r => r.title !== recipe.title);
              }
              if (prev.length >= 3) {
                alert("You can compare up to 3 recipes at once.");
                return prev;
              }
              return [...prev, recipe];
            });
          }}
          onOpenMatchBreakdown={(recipe) => setActiveMatchRecipe(recipe)}
        />
      )}

      
      {/* Lifted Ingredient Match Breakdown Modal */}
        {activeMatchRecipe && (
          <IngredientMatchModal
            recipe={activeMatchRecipe}
            inventory={inventory}
            onClose={() => setActiveMatchRecipe(null)}
            onAddToGrocery={addToGroceryList}
            onAddToPantry={handleAddToPantry}
            db={db}
            appId={appId}
            activeWorkspace={activeWorkspace}
          />
        )}

        <BrandedRedirectModal
        isOpen={!!redirectModalData}
        onClose={() => setRedirectModalData(null)}
        partnerData={redirectModalData}
      />

     

      {/* ADAPT TO KITCHEN MODAL */}
      <AdaptToKitchenModal
        isOpen={showAdaptModal}
        recipe={activeRecipe}
        userProfile={userProfile}
        inventory={inventory}
        loading={loading}
        onClose={() => setShowAdaptModal(false)}
        onApplyCustomAdaptation={handleApplyCustomAdaptation}
      />

      {/* EXPIRING ITEMS TRIAGE MODAL */}
      <ExpiringItemsModal
        isOpen={showExpiringModal}
        onClose={() => setShowExpiringModal(false)}
        expiringItems={inventory.filter((item) => {
          const now = new Date();
          const expiry = item.expiryDate?.toDate ? item.expiryDate.toDate() : new Date(item.expiryDate);
          return Math.ceil((expiry - now) / (1000 * 60 * 60 * 24)) <= 3;
        })}
        onFindRecipes={(selectedNames) => {
          setActiveTab("recipes");
          setSearchQuery(selectedNames.join(", "));
          setActiveTriageBadge(selectedNames);
          setTriagePulseActive(true);
          handleGetAIRecipes("recipe", selectedNames.join(", "));
          setTimeout(() => {
            document.getElementById("quick-matches-section")?.scrollIntoView({ behavior: "smooth" });
          }, 300);
          setTimeout(() => {
            setTriagePulseActive(false);
          }, 3500); // Pulse stays active for 3.5 seconds
        }}
        onGenerateAI={(selectedNames) => {
          setActiveTab("recipes");
          setActiveTriageBadge(selectedNames);
          handleGetAIRecipes("recipe", selectedNames.join(", "), true);
        }}
      />

      {/* AI CULINARY BUFFER OVERLAY */}
      {loading && (
        status.toLowerCase().includes("searching") ||
        status.toLowerCase().includes("crafting") ||
        status.toLowerCase().includes("reverse-engineering") ||
        status.toLowerCase().includes("reading") ||
        status.toLowerCase().includes("rewriting") ||
        status.toLowerCase().includes("tailoring")
      ) && (
        <AIThinkingModal
          isOpen={true}
          mode={searchQuery.toLowerCase().includes("meal") ? "meal" : "recipe"}
          onCancel={() => {
            setLoading(false);
            setStatus("");
          }}
        />
      )}



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

          {/* 👉 NEW: Mobile Feedback Button */}
          <button
            onClick={() => setShowFeedbackModal(true)}
            className="flex flex-col items-center justify-center shrink-0 w-[60px] py-1 transition-all cursor-pointer text-gray-400 hover:text-indigo-600"
          >
            <AlertCircle className="w-5 h-5" />
            <span className="text-[9px] tracking-tight mt-0.5">FEEDBACK</span>
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

      {/* LANDMARK: Soft-Gate Modal Render */}
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

      {/* Render Batch Cooking Modal */}
      {batchModalRecipe && (
        <BatchCookingModal
          recipe={batchModalRecipe}
          inventory={inventory}
          onClose={() => setBatchModalRecipe(null)}
          onSaveBatch={handleExecuteBatchPrep}
        />
      )}

      {showReverseScheduler && (
      <ReverseSchedulerModal
        pinnedRecipes={pinnedRecipes}
        onClose={() => setShowReverseScheduler(false)}
        onStartScheduledTimers={handleStartScheduledTimers}
        onUnpinRecipe={handleTogglePin}
      />
      )}

      {/* Lifted Ingredient Match Breakdown Modal */}
      {activeMatchRecipe && (
        <IngredientMatchModal
          recipe={activeMatchRecipe}
          inventory={inventory}
          onClose={() => setActiveMatchRecipe(null)}
          onAddToGrocery={addToGroceryList}
          onAddToPantry={handleAddToPantry}
          db={db}
          appId={appId}
          activeWorkspace={activeWorkspace}
        />
      )}

      {/* EXPIRING ITEMS TRIAGE MODAL */}
      <ExpiringItemsModal
        isOpen={showExpiringModal}
        onClose={() => setShowExpiringModal(false)}
        expiringItems={inventory.filter((item) => {
          const now = new Date();
          const expiry = item.expiryDate?.toDate ? item.expiryDate.toDate() : new Date(item.expiryDate);
          return Math.ceil((expiry - now) / (1000 * 60 * 60 * 24)) <= 3;
        })}
        onFindRecipes={(selectedNames) => {
          setActiveTab("recipes");
          setSearchQuery(selectedNames.join(", "));
          setActiveTriageBadge(selectedNames);
          setTriagePulseActive(true);
          handleGetAIRecipes("recipe", selectedNames.join(", "));
          setTimeout(() => {
            document.getElementById("quick-matches-section")?.scrollIntoView({ behavior: "smooth" });
          }, 300);
          setTimeout(() => {
            setTriagePulseActive(false);
          }, 3500); // Pulse stays active for 3.5 seconds
        }}
        onGenerateAI={(selectedNames) => {
          setActiveTab("recipes");
          setActiveTriageBadge(selectedNames);
          handleGetAIRecipes("recipe", selectedNames.join(", "), true);
        }}
      />

      {/* Render Universal Modal on top of Main App */}
      {addPantryModalJSX}{cancelConfirmationModalJSX}

     {/* Omnipresent Chef Floating Assistant & Quick-Prompt Pills */}
      <OmnipresentChef
        activeTab={activeTab}
        inventory={inventory}
        userProfile={userProfile}
        askAIChef={askAIChef}
        onTriggerGeneration={(query) => handleGetAIRecipes("recipe", query, true)}
        db={db}
        appId={appId}
        effectiveUserId={effectiveUserId}
      />

      {/* OPTIONAL EXPANDED FLOATING HUD */}
        {showFloatingHud && globalTimers.length > 0 && (
          <div className="fixed top-20 right-4 z-[100] max-w-sm w-full space-y-2 pointer-events-none animate-in slide-in-from-top-4">
            <div className="pointer-events-auto flex justify-end pb-0.5">
              <button
                type="button"
                onClick={() => setShowFloatingHud(false)}
                className="px-2.5 py-1 bg-gray-900/90 hover:bg-gray-900 text-gray-300 hover:text-white rounded-lg text-[10px] font-bold border border-gray-700 flex items-center gap-1 cursor-pointer transition-colors shadow-sm"
              >
                <X className="w-3 h-3" /> Minimize to Dock
              </button>
            </div>

            {globalTimers.map((timer) => (
              <div
                key={timer.id}
                className="pointer-events-auto p-3.5 rounded-2xl shadow-xl border bg-gray-900/95 backdrop-blur-md text-white border-gray-700 flex items-center justify-between gap-3"
              >
                <div
                  className="min-w-0 flex-1 cursor-pointer"
                  onClick={() => {
                    if (timer.recipeData) handleSetActiveRecipe(timer.recipeData);
                  }}
                >
                  <h5 className="font-bold text-xs truncate leading-tight">{timer.label}</h5>
                  <span className="text-[10px] text-white/80 font-medium">
                    {timer.phase === "countdown"
                      ? `Prep at ${timer.prepClockTime}`
                      : timer.phase === "prep"
                      ? `Cook at ${timer.cookClockTime}`
                      : `Done at ${timer.targetClockTime}`}
                  </span>
                </div>
                <span className="font-mono font-black text-sm text-amber-400 bg-black/40 px-2 py-1 rounded-lg">
                  {Math.floor(timer.remaining / 60)}m {timer.remaining % 60}s
                </span>
              </div>
            ))}
          </div>
        )}

      {/* PINNED STOVETOP DRAWER (Always visible when dishes are pinned) */}
      <PinnedStovetopDrawer
        pinnedRecipes={pinnedRecipes}
        onUnpinRecipe={handleTogglePin}
        onClearAll={() => {
          if (globalTimers.length > 0) {
            if (window.confirm(`Stop all ${globalTimers.length} running timers and clear all pinned dishes from stovetop?`)) {
              handleClearAllScheduledTimers();
              setPinnedRecipes([]);
              localStorage.removeItem("pantry_chef_pinned_recipes");
            }
          } else {
            setPinnedRecipes([]);
            localStorage.removeItem("pantry_chef_pinned_recipes");
            if (db && activeWorkspace?.id) {
              setDoc(
                doc(db, `/artifacts/${appId}/workspaces/${activeWorkspace.id}/stovetopState`, "current"),
                { pinnedRecipes: [], updatedAt: serverTimestamp() },
                { merge: true }
              ).catch(() => {});
            }
          }
        }}
        onOpenScheduler={() => {
          if (globalTimers.length > 0) {
            setShowScheduleManagerModal(true);
          } else {
            setShowReverseScheduler(true);
          }
        }}
        onSelectRecipe={(recipe) => handleSetActiveRecipe(recipe)}
        globalTimers={globalTimers}
        onOpenScheduleManager={() => setShowScheduleManagerModal(true)}
        isHudMaximized={showFloatingHud}
        onMaximizeHud={() => setShowFloatingHud((prev) => !prev)}
      />

      <ActiveScheduleManagerModal
        isOpen={showScheduleManagerModal}
        onClose={() => setShowScheduleManagerModal(false)}
        globalTimers={globalTimers}
        pinnedRecipes={pinnedRecipes}
        onSelectRecipe={(dish) => handleSetActiveRecipe(dish)}
        onCancelTimer={(timerId) => handleCancelScheduledTimer(timerId)}
        onClearAllTimers={handleClearAllScheduledTimers}
        onAdjustTargetTime={handleAdjustScheduleTargetTime}
        onAppendDishToSchedule={handleAppendDishToSchedule}
      />

      {/* Unified Mobile Speed Dial FAB (Cleanly replaces overlapping buttons) */}
      <SpeedDialFAB
        onOpenAdd={() => setShowAddDrawer(true)}
        onQuickShop={handleQuickShopPrompt}
        onOpenAI={() => {
          // Triggers Omnipresent Chef assistant focus or open event
          window.dispatchEvent(new CustomEvent("openOmnipresentChef"));
        }}
      />

    

      {/* Floating Comparison Action Bar */}
      {selectedForCompare.length > 0 && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-4 animate-in slide-in-from-bottom border border-gray-700">
          <div className="text-xs font-bold">
            <span className="text-indigo-400 font-black">{selectedForCompare.length}</span> / 3 Recipes Selected
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowCompareModal(true)}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-bold text-white shadow-sm cursor-pointer"
            >
              Compare Side-by-Side ⚖️
            </button>
            <button
              onClick={() => setSelectedForCompare([])}
              className="p-1.5 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Comparison Modal Popup */}
      {showCompareModal && (
        <RecipeComparisonModal
          selectedRecipes={selectedForCompare}
          inventory={inventory}
          onClose={() => setShowCompareModal(false)}
          onSelectRecipe={(recipe) => handleSetActiveRecipe(recipe)}
          onAddMissingToGrocery={(items) => addToGroceryList(items)}
        />
      )}

      {showRetailerModal && (
        <RetailerAccountsModal
          onClose={() => setShowRetailerModal(false)}
          db={db}
          appId={appId}
          effectiveUserId={effectiveUserId}
        />
      )}

      {showRecentPurchasesModal && (
        <RecentPurchasesModal
          onClose={() => setShowRecentPurchasesModal(false)}
          onImportItems={handleImportPurchases}
        />
      )}

      {showQuickShopModal && (
      <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center animate-in fade-in p-4">
        <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
          <div className="flex justify-between items-center border-b pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                <ShoppingCart className="w-5 h-5" />
              </div>
              <h3 className="font-black text-base text-gray-900">Quick Add to Shopping List</h3>
            </div>
            <button onClick={() => setShowQuickShopModal(false)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full bg-gray-50 cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-3">
            <input
              value={quickShopInput}
              onChange={(e) => setQuickShopInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && quickShopInput.trim()) {
                  const items = quickShopInput.split(",").map(i => i.trim()).filter(Boolean);
                  addToGroceryList(items);
                  setQuickShopInput("");
                  setShowQuickShopModal(false);
                }
              }}
              placeholder="Enter items (separate with commas)..."
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:border-indigo-500 outline-none text-gray-900"
              autoFocus
            />

            <button
              onClick={() => {
                if (quickShopInput.trim()) {
                  const items = quickShopInput.split(",").map(i => i.trim()).filter(Boolean);
                  addToGroceryList(items);
                  setQuickShopInput("");
                  setShowQuickShopModal(false);
                }
              }}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition-colors"
            >
              Add to Shopping List
            </button>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-gray-200"></div>
              <span className="flex-shrink mx-4 text-[10px] text-gray-400 uppercase font-bold">Or use voice</span>
              <div className="flex-grow border-t border-gray-200"></div>
            </div>

            <div className="flex justify-center">
              <VoiceInputWidget 
                onVoiceSubmit={(transcript) => {
                  handleVoiceShoppingSubmit(transcript);
                  setShowQuickShopModal(false);
                }} 
                isProcessing={isVoiceProcessing} 
                layout="compact"
              />
            </div>
          </div>
        </div>
      </div>
    )}

      {/* CREATE EVENT WORKSPACE MODAL */}
      {showCreateWorkspaceModal && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center border-b pb-3 mb-4">
              <h3 className="font-black text-lg text-gray-900">⛺ New Event Pantry</h3>
              <button onClick={() => setShowCreateWorkspaceModal(false)} className="p-1.5 hover:bg-gray-100 rounded-full cursor-pointer">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            
            <p className="text-xs text-gray-500 mb-4 leading-relaxed">
              Spin up a temporary workspace for a gathering, trip, or potluck. It has its own blank pantry, shopping list, and meal plan.
            </p>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Event Name</label>
                <input
                  type="text"
                  value={newWorkspaceData.name}
                  onChange={(e) => setNewWorkspaceData({...newWorkspaceData, name: e.target.value})}
                  placeholder="e.g., Cabin Trip, Football BBQ"
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:border-indigo-500 outline-none text-gray-900"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Headcount</label>
                  <input
                    type="number"
                    value={newWorkspaceData.headcount}
                    onChange={(e) => setNewWorkspaceData({...newWorkspaceData, headcount: e.target.value})}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:border-indigo-500 outline-none font-mono text-gray-900"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Duration</label>
                  <select className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none text-gray-900 cursor-pointer">
                    <option>Weekend</option>
                    <option>Single Day</option>
                    <option>One Week</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Guest Allergies / Guardrails</label>
                <input
                  type="text"
                  value={newWorkspaceData.restrictions}
                  onChange={(e) => setNewWorkspaceData({...newWorkspaceData, restrictions: e.target.value})}
                  placeholder="e.g., Peanut allergy, 1 Vegan"
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:border-indigo-500 outline-none text-gray-900"
                />
              </div>

              <button
                onClick={handleCreateEventWorkspace}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition-colors cursor-pointer flex items-center justify-center gap-2 mt-2"
              >
                <Plus className="w-5 h-5" /> Launch Workspace
              </button>
            </div>
          </div>
        </div>
      )}

      <style
        dangerouslySetInnerHTML={{
          __html: `
            .shadow-up { box-shadow: 0 -10px 15px -3px rgba(0, 0, 0, 0.05); } 
            .animate-in { animation: fade-in 0.3s ease-out; } 
            @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } } 
            .slide-in-from-bottom { animation: slide-up 0.3s ease-out; } 
            @keyframes slide-up { from { transform: translateY(100%); } to { transform: translateY(0); } } 
            .scrollbar-hide::-webkit-scrollbar { display: none; } 
            .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
            
            /* 👉 FIX: Using margin instead of transform prevents 'fixed' modals from getting trapped halfway down the page */
            @keyframes tabEnter {
              from { opacity: 0; margin-top: 12px; }
              to { opacity: 1; margin-top: 0; }
            }
            .animate-tab-enter {
              animation: tabEnter 0.25s ease-out forwards;
            }
          `,
        }}
      />
    </div>
  );
};

export default App;


