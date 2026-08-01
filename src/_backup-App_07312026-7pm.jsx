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

const manualGeminiApiKey = "AIzaSyDV5JXOihxIwTpNmRyhXL-PbXnI1Qiwcpo";

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
  const currentUsage = getApiUsage();
  if (currentUsage >= DAILY_API_LIMIT) {
    throw new Error(`Daily limit reached (${DAILY_API_LIMIT}). Try again tomorrow.`);
  }

  // Pointing to your local backend server running on port 5000
  const apiUrl = `http://localhost:5000/api/generate`;
  
  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    // Handle temporary server spikes (503)
    if (response.status === 503 && retries > 0) {
        console.warn(`Server busy, retrying in 2s... (${retries} attempts left)`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        return apiCall(payload, retries - 1);
    }

    const result = await response.json();
    if (result.error) throw new Error(result.error.message);
    
    incrementApiUsage();
    if (!result.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new Error("AI returned no content. Try again.");
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
  let filterContext = "";
  if (filters.proteins?.length)
    filterContext += `Must include one of: ${filters.proteins.join(", ")}. `;
  if (filters.vegetables?.length)
    filterContext += `Must include one of: ${filters.vegetables.join(", ")}. `;
  if (filters.cuisine) filterContext += `Cuisine style: ${filters.cuisine}. `;
  if (filters.maxTime)
    filterContext += `Max cooking time: ${filters.maxTime}. `;
  if (filters.familyMode)
    filterContext += `FAMILY MODE ACTIVE: Suggest meals with a kid-friendly adaptation using the same base ingredients. `;
  let prompt = "";
  if (queryText) {
    prompt = `Search for recipes matching "${queryText}". ${filterContext} ${dietText}. User has: ${itemsList}. Try to find recipes that use these items if possible. Return 3 results. Output JSON array. Each object: title, description, prepTime, servings (int), matchPercentage (number), sourceName, sourceUrl, missingIngredients (array), allIngredients (array of name, quantity, unit), instructions, kidFriendlyVersion (string), nutrition (object with calories (int), protein (string), carbs (string), fat (string)), recommendedGear (array of string for suggested utensils/appliances), recommendedSides (array of string).`;
  } else if (mode === "meal") {
    prompt = `Ingredients available: ${itemsList}. ${historyText} ${dietText} ${equipText} ${filterContext}
    Suggest 3 complete meal combinations (Main Dish + Complementary Side Dish).
    1. "Perfect Match Meal" (uses mostly owned items).
    2. "Balanced Feast" (Main + Veggie side).
    3. "Weekend Special" (More elaborate).
    Output JSON array. Each object: title (e.g. "Grilled Chicken with Roasted Carrots"), description, prepTime, servings (int), matchPercentage (number), sourceName, sourceUrl, missingIngredients (array), allIngredients (array of name, quantity, unit - combined for both dishes), instructions (combined for both), kidFriendlyVersion (string), nutrition (object with calories (int), protein (string), carbs (string), fat (string)), recommendedGear (array of string).`;
  } else {
    prompt = `Ingredients available: ${itemsList}. ${historyText} ${dietText} ${equipText} ${filterContext} Suggest 3 recipes. 1. "Perfect Match" (uses mostly owned items). 2. "Creative Stretch" (uses ~50% owned). 3. "History Inspired". Output JSON array. Each object: title, description, prepTime, servings (int), matchPercentage (number), sourceName, sourceUrl, missingIngredients (array), allIngredients (array of name, quantity, unit), instructions, kidFriendlyVersion (string), nutrition (object with calories (int), protein (string), carbs (string), fat (string)), recommendedGear (array of string for suggested utensils/appliances), recommendedSides (array of string - simple names of sides to pair with this).`;
  }
  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    tools: [{ google_search: {} }],
  };
  const responseText = await apiCall(payload);
  return parseAIResponse(responseText);
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

// NEW: Login Modal Simulator
const LoginModal = ({ onClose, onLogin }) => {
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom">
        <div className="p-6 text-center">
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ChefHat className="w-8 h-8 text-indigo-600" />
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-2">
            Welcome Back
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            Sync your pantry across devices and never lose your streak.
          </p>

          <div className="space-y-3">
            <button
              onClick={() => onLogin("google")}
              className="w-full py-3 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors"
            >
              <div className="w-4 h-4 rounded-full bg-red-500"></div>
              Continue with Google
            </button>
            <button
              onClick={() => onLogin("apple")}
              className="w-full py-3 bg-black text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors"
            >
              <div className="w-4 h-4 rounded-full bg-white"></div>
              Continue with Apple
            </button>
            <button
              onClick={() => onLogin("email")}
              className="w-full py-3 bg-gray-100 text-gray-600 font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors"
            >
              <Mail className="w-4 h-4" />
              Continue with Email
            </button>
          </div>

          <p className="text-[10px] text-gray-400 mt-6">
            By continuing, you agree to our Terms and Privacy Policy.
          </p>
        </div>
        <div className="bg-gray-50 p-4 text-center border-t border-gray-100">
          <button onClick={onClose} className="text-xs font-bold text-gray-500">
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
      className="w-full py-1 bg-indigo-50 text-indigo-600 text-[9px] font-bold rounded"
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
        className="relative z-10 bg-white/20 hover:bg-white/30 rounded-lg px-3 py-1.5 text-[10px] font-bold"
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
            className="p-2 -ml-2 rounded-full hover:bg-gray-100"
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
              <button className="bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full">
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
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold ${b.bg} text-gray-700`}
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
      <X className="w-5 h-5 text-gray-400" />
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

const KitchenGuide = () => {
  const [activeGuide, setActiveGuide] = useState("knife");

  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-gray-900 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-indigo-600" /> Kitchen Cheat Sheets
        </h3>
      </div>

      <div className="flex bg-gray-100 p-1 rounded-xl mb-4 overflow-x-auto no-scrollbar gap-1">
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
                ? "bg-white shadow text-indigo-600"
                : "text-gray-500"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeGuide === "knife" && (
        <div className="space-y-3 animate-in fade-in">
          <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100">
            <div className="w-12 h-12 bg-white rounded-lg border border-gray-200 flex flex-col justify-evenly p-1">
              <div className="h-1 bg-indigo-200 rounded-full w-full"></div>
              <div className="h-1 bg-indigo-200 rounded-full w-full"></div>
              <div className="h-1 bg-indigo-200 rounded-full w-full"></div>
            </div>
            <div>
              <h4 className="font-bold text-xs text-gray-800">Slice</h4>
              <p className="text-[10px] text-gray-500">
                Thin, broad cuts across the food.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100">
            <div className="w-12 h-12 bg-white rounded-lg border border-gray-200 grid grid-cols-2 gap-1 p-1">
              <div className="bg-orange-200 rounded-sm"></div>
              <div className="bg-orange-200 rounded-sm"></div>
              <div className="bg-orange-200 rounded-sm"></div>
              <div className="bg-orange-200 rounded-sm"></div>
            </div>
            <div>
              <h4 className="font-bold text-xs text-gray-800">Chop</h4>
              <p className="text-[10px] text-gray-500">
                Irregular pieces, roughly bite-sized.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100">
            <div className="w-12 h-12 bg-white rounded-lg border border-gray-200 grid grid-cols-4 gap-0.5 p-1">
              {[...Array(16)].map((_, i) => (
                <div key={i} className="bg-green-200 rounded-[1px]"></div>
              ))}
            </div>
            <div>
              <h4 className="font-bold text-xs text-gray-800">Dice</h4>
              <p className="text-[10px] text-gray-500">
                Small, uniform cubes (approx 1/4 inch).
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100">
            <div className="w-12 h-12 bg-white rounded-lg border border-gray-200 flex gap-1 p-1">
              <div className="w-1 bg-red-200 rounded-full h-full"></div>
              <div className="w-1 bg-red-200 rounded-full h-full"></div>
              <div className="w-1 bg-red-200 rounded-full h-full"></div>
              <div className="w-1 bg-red-200 rounded-full h-full"></div>
            </div>
            <div>
              <h4 className="font-bold text-xs text-gray-800">Julienne</h4>
              <p className="text-[10px] text-gray-500">
                Long, thin matchsticks.
              </p>
            </div>
          </div>
        </div>
      )}

      {activeGuide === "meat" && (
        <div className="space-y-3 animate-in fade-in">
          {[
            {
              label: "Rare",
              temp: "125°F",
              color: "radial-gradient(circle, #ff0000 20%, #5c2a2a 90%)",
              desc: "Cool red center",
            },
            {
              label: "Med Rare",
              temp: "135°F",
              color: "radial-gradient(circle, #ff4d4d 30%, #6d3b3b 90%)",
              desc: "Warm red center",
            },
            {
              label: "Medium",
              temp: "145°F",
              color: "radial-gradient(circle, #ff9999 40%, #7e4c4c 90%)",
              desc: "Warm pink center",
            },
            {
              label: "Med Well",
              temp: "150°F",
              color: "radial-gradient(circle, #ffcccc 50%, #8f5d5d 90%)",
              desc: "Slightly pink center",
            },
            {
              label: "Well Done",
              temp: "160°F+",
              color: "radial-gradient(circle, #e6b8b8 10%, #5c2a2a 90%)",
              desc: "Little or no pink",
            },
          ].map((grade, i) => (
            <div
              key={i}
              className="flex items-center justify-between bg-gray-50 p-2 rounded-xl border border-gray-100"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-8 rounded-full border border-gray-300 shadow-inner"
                  style={{ background: grade.color }}
                ></div>
                <div>
                  <h4 className="font-bold text-xs text-gray-800">
                    {grade.label}
                  </h4>
                  <p className="text-[10px] text-gray-500">{grade.desc}</p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg">
                {grade.temp}
              </span>
            </div>
          ))}
        </div>
      )}

      {activeGuide === "oils" && (
        <div className="space-y-3 animate-in fade-in">
          {[
            {
              name: "Butter",
              temp: "300°F",
              use: "Flavor / Baking",
              level: 20,
              color: "bg-yellow-400",
            },
            {
              name: "Olive Oil (EVOO)",
              temp: "325°F",
              use: "Dressings / Dip",
              level: 30,
              color: "bg-green-500",
            },
            {
              name: "Vegetable/Canola",
              temp: "400°F",
              use: "Frying / Baking",
              level: 70,
              color: "bg-yellow-200",
            },
            {
              name: "Avocado Oil",
              temp: "520°F",
              use: "High Heat Searing",
              level: 100,
              color: "bg-green-700",
            },
          ].map((oil, i) => (
            <div
              key={i}
              className="bg-gray-50 p-3 rounded-xl border border-gray-100"
            >
              <div className="flex justify-between text-xs mb-1">
                <span className="font-bold text-gray-800">{oil.name}</span>
                <span className="font-mono text-gray-500">{oil.temp}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2 overflow-hidden">
                <div
                  className={`h-full ${oil.color}`}
                  style={{ width: `${oil.level}%` }}
                ></div>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-gray-500">
                <ThermometerSun className="w-3 h-3" /> Best for:{" "}
                <span className="font-bold">{oil.use}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeGuide === "storage" && (
        <div className="space-y-2 animate-in fade-in">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-blue-50 p-3 rounded-xl border border-blue-100">
              <h4 className="font-bold text-blue-800 text-xs mb-2 flex items-center gap-1">
                <ColdIcon className="w-3 h-3" /> Fridge
              </h4>
              <ul className="text-[10px] text-blue-700 space-y-1 list-disc pl-3">
                <li>Leafy Greens</li>
                <li>Berries</li>
                <li>Carrots (in water)</li>
                <li>Apples (crisper)</li>
                <li>Soft Herbs (Cilantro)</li>
              </ul>
            </div>
            <div className="bg-orange-50 p-3 rounded-xl border border-orange-100">
              <h4 className="font-bold text-orange-800 text-xs mb-2 flex items-center gap-1">
                <Sun className="w-3 h-3" /> Counter
              </h4>
              <ul className="text-[10px] text-orange-700 space-y-1 list-disc pl-3">
                <li>Tomatoes</li>
                <li>Potatoes (dark)</li>
                <li>Onions (separate)</li>
                <li>Garlic</li>
                <li>Bananas</li>
              </ul>
            </div>
          </div>
          <p className="text-[10px] text-gray-400 italic text-center mt-2">
            Tip: Don't store Onions & Potatoes together!
          </p>
        </div>
      )}

      {activeGuide === "defrost" && (
        <div className="space-y-3 animate-in fade-in">
          <div className="flex items-start gap-3 bg-blue-50 p-3 rounded-xl border border-blue-100">
            <div className="bg-white p-2 rounded-lg border border-blue-200">
              <ColdIcon className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <h4 className="font-bold text-xs text-blue-900">
                Refrigerator (Best)
              </h4>
              <p className="text-[10px] text-blue-700 mb-1">
                Slow & safe. Keeps quality high.
              </p>
              <span className="text-[9px] font-bold bg-white px-2 py-0.5 rounded text-blue-500 border border-blue-200">
                24 hrs / 5lbs
              </span>
            </div>
          </div>
          <div className="flex items-start gap-3 bg-cyan-50 p-3 rounded-xl border border-cyan-100">
            <div className="bg-white p-2 rounded-lg border border-cyan-200">
              <RefreshCw className="w-5 h-5 text-cyan-500" />
            </div>
            <div>
              <h4 className="font-bold text-xs text-cyan-900">
                Cold Water (Faster)
              </h4>
              <p className="text-[10px] text-cyan-700 mb-1">
                Submerge in leak-proof bag. Change water every 30m.
              </p>
              <span className="text-[9px] font-bold bg-white px-2 py-0.5 rounded text-cyan-500 border border-cyan-200">
                30 min / lb
              </span>
            </div>
          </div>
          <div className="flex items-start gap-3 bg-purple-50 p-3 rounded-xl border border-purple-100">
            <div className="bg-white p-2 rounded-lg border border-purple-200">
              <Zap className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <h4 className="font-bold text-xs text-purple-900">
                Microwave (Fastest)
              </h4>
              <p className="text-[10px] text-purple-700 mb-1">
                Use 'Defrost' setting. Cook immediately after.
              </p>
              <span className="text-[9px] font-bold bg-white px-2 py-0.5 rounded text-purple-500 border border-purple-200">
                ~5-10 min
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-red-50 p-2 rounded-lg border border-red-100 text-red-700 text-[10px]">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <strong>Never</strong> thaw meat on the counter at room temp!
          </div>
        </div>
      )}
    </div>
  );
};

const SubscriptionModal = ({ onClose }) => (
  <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
    <div className="bg-white w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in">
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
        <button className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl shadow-lg hover:bg-indigo-700 transform active:scale-95 transition-all">
          Subscribe for $4.99/mo
        </button>
        <button
          onClick={onClose}
          className="w-full py-2 text-gray-400 text-xs font-bold"
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
      className="mt-3 w-full py-2 bg-orange-500 text-white rounded-lg text-xs font-bold shadow-sm"
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
      className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-bold rounded-lg border border-indigo-100"
    >
      Buy
    </button>
  </div>
);

const ConverterWidget = () => {
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
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-6">
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
            className={`text-xs font-bold px-3 py-1 rounded-full ${
              convertCat === c
                ? "bg-indigo-100 text-indigo-700"
                : "bg-gray-100 text-gray-500"
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
            className="w-full text-3xl font-bold p-2 border-b-2 border-indigo-100 focus:border-indigo-600 outline-none"
          />
          <select
            value={fromUnit}
            onChange={(e) => setFromUnit(e.target.value)}
            className="w-full bg-white text-sm font-medium"
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
        <ArrowRightLeft className="w-5 h-5 text-gray-300 mt-4" />
        <div className="flex-1 space-y-2 text-right">
          <label className="text-xs font-bold text-gray-400">RESULT</label>
          <div className="w-full text-3xl font-bold p-2 border-b-2 border-transparent text-indigo-600">
            {result}
          </div>
          <select
            value={toUnit}
            onChange={(e) => setToUnit(e.target.value)}
            className="w-full bg-white text-sm font-medium text-right"
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
};

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
            className="px-3 py-1 text-xs text-gray-500"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onUpdate(item.id, editData);
              setIsEditing(false);
            }}
            className="px-3 py-1 text-xs bg-indigo-600 text-white rounded"
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
              className="text-gray-400 hover:text-indigo-500 opacity-50 hover:opacity-100 transition-opacity"
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
          className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-lg"
        >
          <CookingPot className="w-4 h-4" />
        </button>
        <button
          onClick={() => onDelete(item.id)}
          className="p-2 text-red-400 hover:bg-red-50 rounded-lg"
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
}) => (
  <div
    onClick={onClick}
    className="p-4 bg-white rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-all group cursor-pointer overflow-hidden relative min-w-[280px] w-full"
  >
    {recipe.image && (
      <div className="w-full h-32 bg-gray-100 mb-3 rounded-xl overflow-hidden">
        <img
          src={recipe.image}
          alt={recipe.title}
          className="w-full h-full object-cover"
        />
      </div>
    )}
    <div className="flex justify-between items-start mb-2">
      <div className="flex-1 pr-6">
        <h3 className="font-bold text-gray-900 leading-tight group-hover:text-indigo-600 transition-colors">
          {recipe.title}
        </h3>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          {recipe.authorImage && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAuthorClick && onAuthorClick();
              }}
              className="flex items-center gap-1 pr-2 hover:opacity-80"
            >
              <img
                src={recipe.authorImage}
                className="w-4 h-4 rounded-full"
                alt="author"
              />
            </button>
          )}
          <CreatorBadge isBrand={recipe.isBrand} isCreator={recipe.isCreator} />
          {!recipe.isBrand &&
            !recipe.isCreator &&
            (recipe.isDB ? (
              <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full flex items-center">
                <Database className="w-3 h-3 mr-1" /> Web
              </span>
            ) : isUserRecipe ? (
              <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full flex items-center">
                <Users className="w-3 h-3 mr-1" /> Community
              </span>
            ) : (
              <span
                className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                  recipe.matchPercentage >= 75
                    ? "bg-green-100 text-green-700"
                    : "bg-orange-100 text-orange-700"
                }`}
              >
                {recipe.matchPercentage}% MATCH
              </span>
            ))}
          <span className="text-[10px] text-gray-400 flex items-center">
            <Clock className="w-3 h-3 mr-1" /> {recipe.prepTime}
          </span>
        </div>
      </div>
      <div className="flex flex-col gap-2 items-end">
        <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-indigo-400" />
        <button
          onClick={(e) => {
            e.stopPropagation();
            alert("Shared!");
          }}
          className="p-1 hover:bg-gray-100 rounded-full text-gray-400"
        >
          <Share className="w-4 h-4" />
        </button>
      </div>
    </div>
    {!recipe.image && (
      <p className="text-xs text-gray-500 line-clamp-2">{recipe.description}</p>
    )}
    <div className="absolute bottom-4 right-4 flex gap-2 z-10">
      <div className="flex items-center bg-white/90 backdrop-blur rounded-full px-2 py-1 shadow-sm text-xs font-bold text-gray-500 mr-auto border border-gray-100">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onVote(recipe.id, 1);
          }}
          className="mr-2 hover:text-green-600 flex items-center"
        >
          <ThumbsUp className="w-3 h-3 mr-1" /> {recipe.likeCount || 0}
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onVote(recipe.id, -1);
          }}
          className="hover:text-red-600"
        >
          <ThumbsDown className="w-3 h-3" />
        </button>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleSave(recipe);
        }}
        className={`p-2 rounded-full ${
          isSaved
            ? "bg-pink-100 text-pink-600"
            : "bg-gray-100 text-gray-400 hover:bg-gray-200"
        }`}
      >
        <Bookmark className={`w-4 h-4 ${isSaved ? "fill-current" : ""}`} />
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onAddToPlan(recipe);
        }}
        className="p-2 bg-indigo-100 text-indigo-600 rounded-full hover:bg-indigo-200"
      >
        <Calendar className="w-4 h-4" />
      </button>
    </div>
  </div>
);

const BudgetScreen = ({ history, wasteHistory }) => {
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
  return (
    <div className="space-y-6">
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
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm rounded-3xl p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in duration-200">
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
            className="flex-1 py-3 text-gray-500 font-bold text-sm bg-gray-100 rounded-xl"
          >
            Cancel
          </button>
          <button
            onClick={handleComplete}
            className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg"
          >
            Confirm & Save
          </button>
        </div>
      </div>
    </div>
  );
};
const MealPlanner = ({ plan, onAddMeal, onDeleteMeal }) => {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const [selectedDay, setSelectedDay] = useState("Mon");
  const mealsForDay = plan
    .filter((p) => p.day === selectedDay)
    .sort((a, b) => {
      const orders = { Breakfast: 1, Lunch: 2, Dinner: 3 };
      return orders[a.type] - orders[b.type];
    });

  return (
    <div className="space-y-4">
      <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide">
        {days.map((d) => (
          <button
            key={d}
            onClick={() => setSelectedDay(d)}
            className={`flex-shrink-0 w-12 h-16 rounded-xl flex flex-col items-center justify-center text-xs font-bold transition-all ${
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
            <Calendar className="w-5 h-5 mr-2 text-indigo-600" /> {selectedDay}
            's Plan
          </h3>
          {mealsForDay.length > 0 && (
            <button
              onClick={() => generateICS(mealsForDay)}
              className="text-xs text-indigo-500 font-bold flex items-center bg-indigo-50 px-2 py-1 rounded-lg"
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
                  className="text-gray-400 hover:text-red-500"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 text-gray-400">
            <p className="text-sm">No meals planned.</p>
            <p className="text-xs mt-1">
              Find a recipe and tap the calendar icon!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
const CookingMode = ({ recipe, initialServings, onClose }) => {
  const [step, setStep] = useState(0);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatQuery, setChatQuery] = useState("");
  const [chatLog, setChatLog] = useState([]);
  const [aiThinking, setAiThinking] = useState(false);
  const [activeTimer, setActiveTimer] = useState(null);

  useEffect(() => {
    let interval;
    if (activeTimer && activeTimer.remaining > 0) {
      interval = setInterval(() => {
        setActiveTimer((curr) => ({ ...curr, remaining: curr.remaining - 1 }));
      }, 1000);
    } else if (activeTimer && activeTimer.remaining === 0) {
      alert(`${activeTimer.label} Finished!`);
      setActiveTimer(null);
    }
    return () => clearInterval(interval);
  }, [activeTimer]);

  const startTimer = (minutes) => {
    setActiveTimer({
      duration: minutes * 60,
      remaining: minutes * 60,
      label: `${minutes}m Timer`,
    });
  };
  const steps = recipe.instructions.match(/\r\n|\n/)
    ? recipe.instructions.split(/\r\n|\n+/).filter((s) => s.trim().length > 0)
    : recipe.instructions.split(/\d+\.\s+/).filter((s) => s.trim().length > 0);

  const handleAskChef = async (e) => {
    e.preventDefault();
    if (!chatQuery.trim()) return;
    const q = chatQuery;
    setChatLog([...chatLog, { role: "user", text: q }]);
    setChatQuery("");
    setAiThinking(true);
    try {
      const ans = await askAIChef(q, JSON.stringify(recipe));
      setChatLog((prev) => [...prev, { role: "ai", text: ans }]);
    } catch (err) {
      setChatLog((prev) => [
        ...prev,
        { role: "ai", text: "Connection error." },
      ]);
    }
    setAiThinking(false);
  };

  const renderStepWithTimer = (text) => {
    const timeMatch = text.match(/(\d+)\s*(minute|min|m)s?/i);
    return (
      <span>
        {text}
        {timeMatch && (
          <button
            onClick={() => startTimer(parseInt(timeMatch[1]))}
            className="ml-2 inline-flex items-center px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold hover:bg-indigo-200"
          >
            <TimerIcon className="w-3 h-3 mr-1" /> Start {timeMatch[1]}m Timer
          </button>
        )}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 bg-gray-900 z-50 flex flex-col text-white animate-in slide-in-from-bottom duration-300">
      {activeTimer && (
        <div className="bg-indigo-600 p-4 flex justify-between items-center shadow-lg border-b border-indigo-500 z-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-full animate-pulse">
              <AlarmClock className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider opacity-80">
                {activeTimer.label}
              </p>
              <p className="text-2xl font-mono font-black leading-none">
                {Math.floor(activeTimer.remaining / 60)}:
                {(activeTimer.remaining % 60).toString().padStart(2, "0")}
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTimer(null)}
            className="p-2 bg-white/20 rounded-lg hover:bg-white/30"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}
      <div className="p-4 flex justify-between items-center bg-gray-800">
        <div className="flex-1">
          <h2 className="font-bold text-lg truncate">{recipe.title}</h2>
          <p className="text-xs text-gray-400">
            Cooking for {initialServings} servings
          </p>
        </div>
        <button onClick={onClose} className="p-2 bg-gray-700 rounded-full">
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="flex-grow flex flex-col justify-center p-6 text-center space-y-6 overflow-y-auto">
        <span className="text-gray-400 text-sm font-bold uppercase tracking-widest">
          Step {step + 1} of {steps.length}
        </span>
        <p className="text-2xl md:text-3xl font-medium leading-relaxed">
          {renderStepWithTimer(steps[step])}
        </p>
      </div>
      <div className="p-6 pb-8 space-y-4">
        <div className="flex gap-4">
          <button
            disabled={step === 0}
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            className="flex-1 py-4 bg-gray-700 rounded-2xl font-bold disabled:opacity-30"
          >
            Previous
          </button>
          <button
            disabled={step === steps.length - 1}
            onClick={() => setStep((s) => Math.min(steps.length - 1, s + 1))}
            className="flex-1 py-4 bg-indigo-600 rounded-2xl font-bold disabled:opacity-30"
          >
            Next Step
          </button>
        </div>
        <button
          onClick={() => setChatOpen(!chatOpen)}
          className="w-full py-3 bg-gray-800 rounded-xl text-indigo-300 font-bold flex items-center justify-center gap-2"
        >
          <List className="w-4 h-4" /> Ask Chef Assistant
        </button>
      </div>
      {chatOpen && (
        <div className="absolute inset-x-0 bottom-0 h-3/4 bg-white text-gray-900 rounded-t-3xl shadow-2xl flex flex-col animate-in slide-in-from-bottom">
          <div className="p-4 border-b flex justify-between items-center bg-gray-50 rounded-t-3xl">
            <h3 className="font-bold">Chef Assistant</h3>
            <button onClick={() => setChatOpen(false)}>
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-grow overflow-y-auto p-4 space-y-3 bg-gray-50">
            {chatLog.map((msg, i) => (
              <div
                key={i}
                className={`p-3 rounded-xl max-w-[85%] text-sm ${
                  msg.role === "user"
                    ? "bg-indigo-600 text-white ml-auto"
                    : "bg-white border border-gray-200 mr-auto"
                }`}
              >
                {msg.text}
              </div>
            ))}
          </div>
          <form
            onSubmit={handleAskChef}
            className="p-4 border-t bg-white flex gap-2"
          >
            <input
              value={chatQuery}
              onChange={(e) => setChatQuery(e.target.value)}
              placeholder="Ask question..."
              className="flex-grow p-3 bg-gray-100 rounded-xl text-sm outline-none"
            />
            <button
              type="submit"
              className="p-3 bg-indigo-600 text-white rounded-xl"
            >
              <ChevronRight />
            </button>
          </form>
        </div>
      )}
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
}) => {
  const baseServings = recipe.servings || 4;
  const [servings, setServings] = useState(baseServings);
  const [cookingMode, setCookingMode] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [selectedMissing, setSelectedMissing] = useState([]);
  const [showConverter, setShowConverter] = useState(false);
  const [ovenStatus, setOvenStatus] = useState("off");
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
      />
    );
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
        <button onClick={onClose} className="p-2 -ml-2">
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
              className="hover:text-green-600 mr-2 flex items-center"
            >
              <ThumbsUp className="w-3 h-3 mr-1" /> {recipe.likeCount || 0}
            </button>
            <button
              onClick={() => onVote(recipe.id, -1)}
              className="hover:text-red-600 flex items-center"
            >
              <ThumbsDown className="w-3 h-3" />
            </button>
          </div>
          <button
            onClick={() => setShowConverter(!showConverter)}
            className={`p-2 rounded-full ${
              showConverter
                ? "bg-indigo-600 text-white"
                : "text-indigo-600 bg-indigo-50"
            }`}
          >
            <ArrowRightLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => onToggleSave(recipe)}
            className={`p-2 rounded-full ${
              isSaved
                ? "bg-pink-100 text-pink-600"
                : "bg-gray-100 text-gray-400 hover:bg-gray-200"
            }`}
          >
            <Bookmark className={`w-4 h-4 ${isSaved ? "fill-current" : ""}`} />
          </button>
          <button
            onClick={() => setShowPlanModal(true)}
            className="p-2 text-indigo-600 bg-indigo-50 rounded-full"
          >
            <Calendar className="w-4 h-4" />
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
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>
          <ConverterWidget />
        </div>
      )}
      <div className="p-4 space-y-6 flex-grow overflow-auto pb-24">
        <p className="text-gray-600 text-sm italic">"{recipe.description}"</p>

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

        {recipe.recommendedGear && recipe.recommendedGear.length > 0 && (
          <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 mb-4">
            <h4 className="text-xs font-bold text-gray-800 uppercase mb-2 flex items-center gap-2">
              <Star className="w-3 h-3 text-yellow-500" /> Chef's Recommended
              Gear
            </h4>
            <div className="space-y-1">
              {recipe.recommendedGear.map((gear, i) => (
                <NativeProductAd key={i} tool={gear} />
              ))}
            </div>
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
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
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
              className="p-1 text-indigo-600 hover:bg-indigo-50 rounded"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-6 text-center font-bold text-sm">
              {servings}
            </span>
            <button
              onClick={() => setServings((s) => s + 1)}
              className="p-1 text-indigo-600 hover:bg-indigo-50 rounded"
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
                const inPantry = inventory.some((invItem) =>
                  invItem.name.toLowerCase().includes(ing.name.toLowerCase())
                );
                const matchedItem = inventory.find((invItem) =>
                  invItem.name.toLowerCase().includes(ing.name.toLowerCase())
                );
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
                          className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
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
                    {!inPantry && (
                      <button
                        onClick={() => onAddToPantry(ing.name)}
                        className="p-1.5 bg-green-100 text-green-700 rounded-lg text-[10px] font-bold flex items-center gap-1"
                        title="I have this at home"
                      >
                        <Home className="w-3 h-3" /> Have
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          {selectedMissing.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onAddToGrocery(selectedMissing)}
                className="py-3 bg-indigo-100 text-indigo-700 rounded-xl font-bold text-xs flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" /> Add Selected (
                {selectedMissing.length})
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
                className="py-3 bg-orange-500 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2"
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
            className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all"
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
            className="w-full py-4 bg-white border border-green-200 text-green-600 rounded-2xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-all"
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
                <X className="w-5 h-5 text-gray-400" />
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
                            : "bg-gray-100 text-gray-500"
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
                    className="w-full p-3 bg-gray-50 rounded-xl text-sm font-medium outline-none"
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
                  className={`p-2 rounded-full transition-colors ${
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
                className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg hover:bg-indigo-700"
              >
                Save to Schedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Re-implementing AdminDashboard correctly
const AdminDashboard = ({
  userData,
  allMetrics,
  onSeed,
  onPurge,
  onImpersonate,
}) => {
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
  const [adminView, setAdminView] = useState("impact");
  return (
    <div className="space-y-6">
      <div className="bg-gray-900 text-white p-6 rounded-3xl shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-indigo-400" /> Admin Portal
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => setAdminView("impact")}
              className={`px-2 py-1 rounded text-[10px] font-bold ${
                adminView === "impact" ? "bg-indigo-600" : "bg-gray-800"
              }`}
            >
              Impact
            </button>
            <button
              onClick={() => setAdminView("monetization")}
              className={`px-2 py-1 rounded text-[10px] font-bold ${
                adminView === "monetization" ? "bg-indigo-600" : "bg-gray-800"
              }`}
            >
              Data
            </button>
            <button
              onClick={() => setAdminView("users")}
              className={`px-2 py-1 rounded text-[10px] font-bold ${
                adminView === "users" ? "bg-indigo-600" : "bg-gray-800"
              }`}
            >
              Users
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
        {adminView === "users" && (
          <div className="mt-4 space-y-2 animate-in fade-in">
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">
              Community Management
            </p>
            <button
              onClick={onSeed}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-2"
            >
              <Users className="w-4 h-4" /> Populate Fake Community (Seed)
            </button>
            <button
              onClick={onPurge}
              className="w-full py-3 bg-red-900/50 hover:bg-red-900 text-red-200 rounded-xl text-xs font-bold flex items-center justify-center gap-2"
            >
              <Trash2 className="w-4 h-4" /> Purge Test Data
            </button>
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
                className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-[10px] font-bold hover:bg-purple-200"
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
const ToolsScreen = ({
  profile,
  onSaveProfile,
  isAdmin,
  onToggleAdmin,
  isDemoAuthenticated,
  onShowLogin,
}) => {
  const [subTab, setSubTab] = useState("converter");
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
    "Vegetarian",
    "Vegan",
    "Gluten-Free",
    "Keto",
    "Paleo",
    "Nut-Free",
    "Dairy-Free",
    "Shellfish-Free",
    "Egg-Free",
    "Kosher",
    "Halal",
  ];
  const defaultEquipment = [
    "Air Fryer",
    "Blender",
    "Slow Cooker",
    "Instant Pot",
    "Food Processor",
    "Wok",
    "Stand Mixer",
    "Dutch Oven",
    "Cast Iron Skillet",
    "Rice Cooker",
    "Sous Vide",
    "Grill",
    "Smoker",
    "Microwave",
    "Toaster",
    "Immersion Blender",
    "Mandoline",
    "Pizza Stone",
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
  const badgeCount = Object.keys(profile.challenges || {}).filter(
    (k) => profile.challenges[k] >= CHALLENGES.find((c) => c.id === k).target
  ).length;
  const handleSyncIdChange = (e) => {
    const newVal = e.target.value;
    setDataSyncId(newVal);
    localStorage.setItem("pantry_chef_custom_id", newVal);
  };

  return (
    <div className="space-y-6">
      <div className="flex bg-gray-200 p-1 rounded-xl">
        <button
          onClick={() => setSubTab("converter")}
          className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
            subTab === "converter"
              ? "bg-white shadow text-indigo-600"
              : "text-gray-500"
          }`}
        >
          Calculator
        </button>
        <button
          onClick={() => setSubTab("profile")}
          className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
            subTab === "profile"
              ? "bg-white shadow text-indigo-600"
              : "text-gray-500"
          }`}
        >
          My Settings
        </button>
      </div>
      {subTab === "converter" ? (
        <ConverterWidget />
      ) : (
        <div className="space-y-6">
          {/* LOGIN CARD - Shows only if not logged in */}
          {!isDemoAuthenticated && (
            <div className="bg-indigo-600 p-6 rounded-3xl shadow-lg text-center text-white">
              <ChefHat className="w-12 h-12 mx-auto mb-3 text-white/90" />
              <h3 className="font-black text-xl mb-1">Create Account</h3>
              <p className="text-sm text-indigo-100 mb-4">
                Sync your pantry, save recipes, and earn badges.
              </p>
              <button
                onClick={onShowLogin}
                className="w-full py-3 bg-white text-indigo-600 font-bold rounded-xl hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2"
              >
                <LogIn className="w-4 h-4" /> Sign In / Sign Up
              </button>
            </div>
          )}

          {/* PROFILE CARD - Locked state or Open state */}
          <div
            className={`bg-white p-6 rounded-3xl shadow-sm border border-gray-100 text-center ${
              !isDemoAuthenticated
                ? "opacity-50 pointer-events-none filter blur-sm select-none"
                : ""
            }`}
          >
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2 justify-center">
              <UserCircle className="w-5 h-5 text-indigo-600" /> My Profile
            </h3>
            <label className="cursor-pointer inline-block relative">
              <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border-2 border-dashed border-gray-300">
                {profileImage ? (
                  <img
                    src={profileImage}
                    alt="Me"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Scan className="w-8 h-8 text-gray-400" />
                )}
              </div>
              <div className="absolute bottom-0 right-0 bg-indigo-600 p-2 rounded-full text-white">
                <Plus className="w-3 h-3" />
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleProfileImageSelect}
                className="hidden"
                disabled={!isDemoAuthenticated}
              />
            </label>
            <p className="text-xs text-gray-400 mt-2">
              Upload a photo to be identified in the community feed.
            </p>
            <div className="text-left mt-6 pt-4 border-t border-gray-100">
              <label className="text-xs font-bold text-gray-500 mb-1 flex items-center gap-1">
                <MapPin className="w-3 h-3" /> Zip Code
              </label>
              <input
                type="text"
                placeholder="e.g. 90210"
                className="w-full p-3 bg-gray-50 rounded-xl text-sm outline-none border border-gray-200 focus:border-indigo-600 transition-all"
                value={localProfile.zipCode || ""}
                onChange={(e) =>
                  setLocalProfile({ ...localProfile, zipCode: e.target.value })
                }
                maxLength={5}
                disabled={!isDemoAuthenticated}
              />
              <p className="text-[10px] text-gray-400 mt-1">
                Required for local deal hunting and community features.
              </p>
            </div>
          </div>

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
                className={`h-3 rounded-full transition-all duration-500 ${
                  apiUsage >= DAILY_API_LIMIT ? "bg-red-500" : "bg-green-500"
                }`}
                style={{
                  width: `${Math.min(
                    (apiUsage / DAILY_API_LIMIT) * 100,
                    100
                  )}%`,
                }}
              ></div>
            </div>
            <p className="text-[10px] text-gray-400 mt-2">
              Refreshes daily. Add your own key below for unlimited access.
            </p>
          </div>

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
                    <p className="text-xs font-bold text-yellow-700 mb-2">
                      You are a Verified Pro Chef!
                    </p>
                    <button className="w-full py-2 bg-white text-yellow-700 text-xs font-bold rounded-lg border border-yellow-200 shadow-sm">
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
                      <div
                        className="bg-yellow-500 h-2 rounded-full"
                        style={{ width: `${profile.creatorProgress}%` }}
                      ></div>
                    </div>
                    <p className="text-[10px] text-yellow-600">
                      Post 3 more recipes to level up.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-indigo-600" /> Trophy Case (
              {badgeCount})
            </h3>
            <div className="flex overflow-x-auto gap-3 pb-2 -mx-2 px-2 scrollbar-hide snap-x">
              {CHALLENGES.map((c) => {
                const current = (profile.challenges || {})[c.id] || 0;
                const percent = Math.min((current / c.target) * 100, 100);
                const isUnlocked = percent >= 100;
                return (
                  <div
                    key={c.id}
                    className="min-w-[120px] snap-center bg-gray-50 p-3 rounded-2xl border border-gray-100 flex flex-col items-center text-center"
                  >
                    <div
                      className={`p-3 rounded-full mb-2 ${
                        isUnlocked
                          ? "bg-indigo-100 text-indigo-600 shadow-sm"
                          : "bg-gray-200 text-gray-400"
                      }`}
                    >
                      {c.icon}
                    </div>
                    <h4 className="font-bold text-xs text-gray-800 mb-1 leading-tight">
                      {c.title}
                    </h4>
                    <p className="text-[9px] text-gray-400 mb-2 line-clamp-1">
                      {c.desc}
                    </p>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 mb-1">
                      <div
                        className={`h-1.5 rounded-full transition-all duration-1000 ${
                          isUnlocked ? "bg-indigo-500" : "bg-gray-400"
                        }`}
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>
                    <span className="text-[9px] font-mono text-gray-500">
                      {current}/{c.target}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <KitchenGuide />

          <div className="bg-gray-900 p-4 rounded-3xl shadow-sm border border-gray-800">
            <h3 className="font-bold text-white text-sm mb-3 flex items-center gap-2">
              <Bell className="w-4 h-4 text-indigo-400" /> Simulate
              Notifications (Pitch Mode)
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() =>
                  triggerSystemNotification(
                    "⚠️ Expiring Soon",
                    "Your Spinach and Milk are expiring in 2 days! Click to see recipes."
                  )
                }
                className="px-3 py-2 bg-gray-800 text-gray-300 rounded-lg text-[10px] font-bold hover:bg-gray-700 text-left"
              >
                Freshness Alert
              </button>
              <button
                onClick={() =>
                  triggerSystemNotification(
                    "💰 Budget Goal Met",
                    "Great job! You stayed under $150 this week."
                  )
                }
                className="px-3 py-2 bg-gray-800 text-gray-300 rounded-lg text-[10px] font-bold hover:bg-gray-700 text-left"
              >
                Budget Success
              </button>
              <button
                onClick={() =>
                  triggerSystemNotification(
                    "❄️ Defrost Alert",
                    "Heads up! Tomorrow's meal needs 'Chicken'. Move it from Freezer to Fridge tonight."
                  )
                }
                className="px-3 py-2 bg-gray-800 text-gray-300 rounded-lg text-[10px] font-bold hover:bg-gray-700 text-left border-l-2 border-blue-400"
              >
                Defrost Reminder
              </button>
              <button
                onClick={() =>
                  triggerSystemNotification(
                    "🍳 Dinner Time",
                    "It's 5:30 PM. You have ingredients for 'Spicy Tacos'. Start cooking?"
                  )
                }
                className="px-3 py-2 bg-gray-800 text-gray-300 rounded-lg text-[10px] font-bold hover:bg-gray-700 text-left"
              >
                Meal Context
              </button>
              <button
                onClick={() =>
                  triggerSystemNotification(
                    "🏷️ Price Drop",
                    "Your favorite 'Olive Oil' is 20% off at Walmart today."
                  )
                }
                className="px-3 py-2 bg-gray-800 text-gray-300 rounded-lg text-[10px] font-bold hover:bg-gray-700 text-left"
              >
                Deal Hunter
              </button>
            </div>
          </div>

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
            <p className="text-[10px] text-gray-400 mt-2">
              Use this ID to access your pantry from other devices. If blank,
              data is lost on cache clear.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-2 w-full py-2 bg-gray-100 text-gray-600 rounded-lg text-xs font-bold"
            >
              Apply & Reload App
            </button>
          </div>
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-4 rounded-3xl shadow-lg text-white">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-bold flex items-center gap-2">
                <Crown className="w-5 h-5 text-yellow-300" /> Go Pro
              </h3>
              <span className="bg-white/20 px-2 py-1 rounded text-[10px] font-bold">
                BEST VALUE
              </span>
            </div>
            <p className="text-xs text-indigo-100 mb-4">
              Unlock unlimited AI recipes, advanced receipt scanning, and deal
              hunting.
            </p>
            <button
              onClick={() =>
                window.dispatchEvent(new CustomEvent("openSubscription"))
              }
              className="w-full py-2 bg-white text-indigo-600 rounded-xl text-xs font-bold shadow-sm"
            >
              Upgrade Now
            </button>
          </div>
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <ConfigIcon className="w-5 h-5 text-indigo-600" /> API
              Configuration
            </h3>
            <input
              type="password"
              placeholder="Paste Gemini API Key here..."
              className="w-full p-3 bg-gray-50 rounded-xl text-xs outline-none border border-gray-200 focus:border-indigo-600"
              onChange={(e) =>
                localStorage.setItem("gemini_api_key", e.target.value)
              }
              defaultValue={localStorage.getItem("gemini_api_key") || ""}
            />
            <p className="text-[10px] text-gray-400 mt-2">
              Overrides the default key. Useful if you hit quota limits.
            </p>
          </div>
          <div className="bg-gray-900 p-4 rounded-3xl shadow-sm border border-gray-800 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-indigo-400" /> Admin Portal
                (Demo)
              </h3>
              <p className="text-[10px] text-gray-400">
                View network stats & analytics.
              </p>
            </div>
            <button
              onClick={() => {
                const newState = !isAdmin;
                onToggleAdmin(newState);
                if (newState)
                  alert("Admin Mode Enabled. Check the new 'Admin' tab.");
                else alert("Admin Mode Disabled.");
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                isAdmin
                  ? "bg-indigo-500 text-white"
                  : "bg-gray-700 text-gray-300"
              }`}
            >
              {isAdmin ? "Active" : "Enable"}
            </button>
          </div>
          <div
            className={`bg-white p-6 rounded-3xl shadow-sm border border-gray-100 ${
              !isDemoAuthenticated ? "opacity-50 pointer-events-none" : ""
            }`}
          >
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Utensils className="w-5 h-5 text-indigo-600" /> Dietary
              Preferences
            </h3>
            <div className="flex flex-wrap gap-2">
              {diets.map((d) => (
                <button
                  key={d}
                  onClick={() => toggleItem("diets", d)}
                  className={`px-4 py-2 rounded-full text-xs font-bold border ${
                    localProfile.diets?.includes(d)
                      ? "bg-indigo-600 text-white"
                      : "bg-white"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
          <div
            className={`bg-white p-6 rounded-3xl shadow-sm border border-gray-100 ${
              !isDemoAuthenticated ? "opacity-50 pointer-events-none" : ""
            }`}
          >
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <CookingPot className="w-5 h-5 text-indigo-600" /> Equipment
            </h3>
            <div className="flex flex-wrap gap-2 mb-4">
              {displayEquipment.map((e) => (
                <button
                  key={e}
                  onClick={() => toggleItem("equipment", e)}
                  className={`px-4 py-2 rounded-full text-xs font-bold border ${
                    localProfile.equipment?.includes(e)
                      ? "bg-indigo-600 text-white"
                      : "bg-white"
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (
                  customEquip.trim() &&
                  !localProfile.equipment?.includes(customEquip.trim())
                )
                  toggleItem("equipment", customEquip.trim());
                setCustomEquip("");
              }}
              className="relative"
            >
              <input
                value={customEquip}
                onChange={(e) => setCustomEquip(e.target.value)}
                placeholder="Add custom tool..."
                className="w-full p-3 bg-gray-50 rounded-xl text-xs pr-10"
              />
              <button
                type="submit"
                disabled={!customEquip.trim()}
                className="absolute right-2 top-2 text-indigo-600 p-1"
              >
                <Plus className="w-4 h-4" />
              </button>
            </form>
          </div>
          {isDemoAuthenticated && (
            <button
              onClick={() => onSaveProfile(localProfile)}
              className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg"
            >
              Save Profile
            </button>
          )}
        </div>
      )}
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
        className={`transition-all transform flex items-center justify-center ${
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
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
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
                    feedbackType === "bug" ? "bg-red-50 border-red-200 text-red-700" : "bg-gray-50 text-gray-600"
                  }`}
                >
                  🐛 Report Bug
                </button>
                <button
                  type="button"
                  onClick={() => setFeedbackType("feature")}
                  className={`py-2 rounded-xl text-xs font-bold border ${
                    feedbackType === "feature" ? "bg-indigo-50 border-indigo-200 text-indigo-700" : "bg-gray-50 text-gray-600"
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
              className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-indigo-700 transition-colors"
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

// --- APP COMPONENT ---
const App = () => {
  const [userId, setUserId] = useState(null);
  const [customId, setCustomId] = useState(
    localStorage.getItem("pantry_chef_custom_id") || ""
  );
  const effectiveUserId = customId.trim() || userId;
  const [activeTab, setActiveTab] = useState("pantry");
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
  const [userProfile, setUserProfile] = useState({
    diets: [],
    equipment: [],
    image: null,
    creatorProgress: 0,
    challenges: {},
  });
  const [notification, setNotification] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState({
    proteins: [],
    vegetables: [],
  });
  const [aiRecipes, setAiRecipes] = useState([]);
  const [activeRecipe, setActiveRecipe] = useState(null);
  const [cookingMode, setCookingMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [newItemName, setNewItemName] = useState("");
  const [newItemCategory, setNewItemCategory] = useState("Other");
  const [newItemUnit, setNewItemUnit] = useState("pcs");
  const [newItemQty, setNewItemQty] = useState(1);
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
  const hasAutoLoaded = useRef(false);
  const [isVoiceProcessing, setIsVoiceProcessing] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

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


// NEW: URL Recipe Ingestor Logic
  const handleUrlIngest = async (e) => {
    e.preventDefault();
    if (!ingestUrl.trim()) return;
    setIsIngesting(true);
    setStatus("Reading webpage...");

    const prompt = `Visit this URL: ${ingestUrl} and extract the recipe. 
    Ignore all blog fluff, life stories, and ads. If it's a video, read the transcript/caption.
    Return ONLY a valid JSON object strictly matching this schema:
    {
      "title": "Recipe Name",
      "description": "Short description",
      "prepTime": "e.g. 30 mins",
      "servings": 4,
      "allIngredients": [{"name": "item", "quantity": 1, "unit": "cup"}],
      "instructions": "Step 1... Step 2...",
      "nutrition": {"calories": 0, "protein": "0g", "carbs": "0g", "fat": "0g"},
      "recommendedGear": ["gear 1"],
      "recommendedSides": ["side 1"],
      "sourceName": "Name of Website/Creator",
      "sourceUrl": "${ingestUrl}"
    }`;

    const payload = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" }
    };

    try {
      const responseText = await apiCall(payload);
      const recipeData = parseAIResponse(responseText);
      
      // Calculate match percentage against current pantry
      const processedRecipe = processRecipesAgainstInventory([recipeData])[0];
      
      // Save directly to the community feed/database
      await addDoc(collection(db, `/artifacts/${appId}/public/data/userRecipes`), {
        ...processedRecipe,
        createdAt: serverTimestamp(),
        createdBy: effectiveUserId || "anonymous",
        isAI: false, // Flagging as real external recipe
        likeCount: 0,
        authorName: processedRecipe.sourceName || "Web Import",
        authorImage: userProfile?.image || null
      });

      setStatus("Recipe Imported!");
      setShowIngestModal(false);
      setIngestUrl("");
      handleSetActiveRecipe(processedRecipe); // Open it immediately
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

  const handleLogin = (provider) => {
    setLoading(true);
    setTimeout(() => {
      setIsDemoAuthenticated(true);
      setShowLoginModal(false);
      setLoading(false);
      setNotification(
        `🎉 Successfully signed in with ${provider}! Syncing data...`
      );
      setTimeout(() => setNotification(null), 3000);
    }, 1200);
  };

  useEffect(() => {
    if (!auth) return;
    const initAuth = async () => {
      if (initialAuthToken) await signInWithCustomToken(auth, initialAuthToken);
      else await signInAnonymously(auth);
    };
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) setUserId(user.uid);
      else initAuth();
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
        expiryDate: getTimestampInDays(7),
        category: newItemCategory,
        timestamp: serverTimestamp(),
      });
    setNewItemName("");
    setLoading(false);
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
      if (
        mode === "recipe" &&
        searchQuery &&
        !activeFilters.proteins.length &&
        !activeFilters.vegetables.length &&
        !activeFilters.cuisine
      ) {
        setStatus("Searching Database...");
        res = await fetchMealDBRecipes(searchQuery);
        if (res.length === 0) {
          setStatus("Checking Gemini...");
          res = await fetchAIRecipes(
            inventory,
            cookHistory,
            userProfile,
            searchQuery,
            activeFilters,
            mode
          );
        }
      } else {
        setStatus(
          mode === "meal"
            ? "Planning Full Meal..."
            : "Consulting Chef Gemini..."
        );
        res = await fetchAIRecipes(
          inventory,
          cookHistory,
          userProfile,
          searchQuery,
          activeFilters,
          mode
        );
      }
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

  const handleCook = async (r) => {
    setLoading(true);
    setStatus("Updating...");
    await addDoc(
      collection(db, `/artifacts/${appId}/public/data/cookHistory`),
      {
        userId: effectiveUserId,
        recipeTitle: r.title,
        timestamp: serverTimestamp(),
      }
    );
    const batch = writeBatch(db);
    r.allIngredients?.forEach((ing) => {
      const m = inventory.find((i) =>
        i.name.toLowerCase().includes(ing.name.toLowerCase())
      );
      if (m) {
        if (m.quantity <= 1)
          batch.delete(
            doc(
              db,
              `/artifacts/${appId}/users/${effectiveUserId}/inventory`,
              m.id
            )
          );
        else
          batch.update(
            doc(
              db,
              `/artifacts/${appId}/users/${effectiveUserId}/inventory`,
              m.id
            ),
            { quantity: m.quantity - 1 }
          );
      }
    });
    await batch.commit();
    setLoading(false);
    setActiveRecipe(null);
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
    if (!effectiveUserId) return;
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
  if (showMealPrep)
    return <MealPrepView onClose={() => setShowMealPrep(false)} />;
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

  if (activeTab === "admin" && isAdmin) {
    return (
      <div className="flex flex-col h-screen bg-gray-50 md:ml-64 max-w-full md:max-w-none shadow-2xl overflow-hidden relative">
        <div className="flex-grow overflow-y-auto p-4 space-y-6 pb-28">
          <AdminDashboard
            userData={userProfile}
            allMetrics={{}}
            onSeed={seedCommunity}
            onPurge={purgeTestData}
            onImpersonate={handleImpersonate}
          />
        </div>
        {/* UPDATED: Hidden on desktop/tablet, visible on mobile */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 max-w-lg mx-auto p-4 bg-white/90 backdrop-blur-xl border-t flex items-center justify-around pb-8 z-30 shadow-up">
          <button
            onClick={() => setActiveTab("pantry")}
            className={`flex flex-col items-center gap-1 transition-all ${
              activeTab === "pantry"
                ? "text-indigo-600 scale-110"
                : "text-gray-300"
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="text-[9px] font-bold">PANTRY</span>
          </button>
          <button
            onClick={() => setActiveTab("recipes")}
            className={`flex flex-col items-center gap-1 transition-all ${
              activeTab === "recipes"
                ? "text-indigo-600 scale-110"
                : "text-gray-300"
            }`}
          >
            <CookingPot className="w-5 h-5" />
            <span className="text-[9px] font-bold">COOK</span>
          </button>
          <button
            onClick={() => setActiveTab("shopping")}
            className={`flex flex-col items-center gap-1 transition-all ${
              activeTab === "shopping"
                ? "text-indigo-600 scale-110"
                : "text-gray-300"
            }`}
          >
            <ShoppingCart className="w-5 h-5" />
            <span className="text-[9px] font-bold">SHOP</span>
          </button>
          <button
            onClick={() => setActiveTab("budget")}
            className={`flex flex-col items-center gap-1 transition-all ${
              activeTab === "budget"
                ? "text-indigo-600 scale-110"
                : "text-gray-300"
            }`}
          >
            <DollarSign className="w-5 h-5" />
            <span className="text-[9px] font-bold">BUDGET</span>
          </button>
          <button
            onClick={() => setActiveTab("community")}
            className={`flex flex-col items-center gap-1 transition-all ${
              activeTab === "community"
                ? "text-indigo-600 scale-110"
                : "text-gray-300"
            }`}
          >
            <Users className="w-5 h-5" />
            <span className="text-[9px] font-bold">SOCIAL</span>
          </button>
          <button
            onClick={() => setActiveTab("profile")}
            className={`flex flex-col items-center gap-1 transition-all ${
              activeTab === "profile"
                ? "text-indigo-600 scale-110"
                : "text-gray-300"
            }`}
          >
            <ConfigIcon className="w-5 h-5" />
            <span className="text-[9px] font-bold">TOOLS</span>
          </button>
          {isAdmin && (
            <button
              onClick={() => setActiveTab("admin")}
              className={`flex flex-col items-center gap-1 transition-all ${
                activeTab === "admin"
                  ? "text-indigo-600 scale-110"
                  : "text-gray-300"
              }`}
            >
              <Briefcase className="w-5 h-5" />
              <span className="text-[9px] font-bold">ADMIN</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50 md:ml-64 max-w-full md:max-w-none shadow-2xl overflow-hidden relative">
      <div className="p-4 pt-8 bg-white border-b flex items-center justify-between z-20">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-600 rounded-lg shadow-lg shadow-indigo-100">
            <Utensils className="text-white w-5 h-5" />
          </div>
          <h1 className="text-xl font-black text-gray-900 tracking-tight">
            Pantry Chef
          </h1>
        </div>
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
              className="p-1 bg-white rounded-full hover:bg-red-50 text-purple-700"
            >
              <LogOut className="w-3 h-3" />
            </button>
          </div>
        )}
        {(loading || status) && !customId && (
          <div
            className={`flex items-center gap-2 text-[10px] font-bold px-3 py-1 rounded-full ${
              status.includes("Error")
                ? "bg-red-50 text-red-600"
                : "bg-indigo-50 text-indigo-600 animate-pulse"
            }`}
          >
            {loading && <Loader className="w-3 h-3 animate-spin" />} {status}
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-2 md:p-6">
            
            {/* LEFT WORKSPACE (Takes 2 columns) */}
            <div className="md:col-span-2 space-y-4">
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

              <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm mb-4">
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center gap-2">
                    <Plus className="w-5 h-5 text-indigo-600" />
                    <span className="font-bold text-xs text-gray-800 uppercase">Quick Add Item</span>
                  </div>
                  <select
                    value={newItemCategory}
                    onChange={(e) => setNewItemCategory(e.target.value)}
                    className="text-[10px] bg-gray-50 border border-gray-200 rounded px-1.5 py-1 outline-none"
                  >
                    {["Produce", "Protein", "Dairy", "Grains", "Spices", "Canned", "Frozen", "Snacks", "Beverages", "Other"].map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <form onSubmit={handleAddManual} className="mt-2 space-y-2">
                  <input
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    placeholder="Add item name..."
                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:border-indigo-500 outline-none"
                  />
                  <div className="flex gap-2 items-center">
                    <input
                      type="number"
                      value={newItemQty}
                      onChange={(e) => setNewItemQty(Number(e.target.value))}
                      className="w-16 p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-center outline-none"
                    />
                    <select
                      value={newItemUnit}
                      onChange={(e) => setNewItemUnit(e.target.value)}
                      className="flex-1 text-xs bg-gray-50 border border-gray-200 rounded-xl px-2 py-2 outline-none"
                    >
                      {["pcs", "oz", "lb", "g", "kg", "cup", "ml", "l", "can", "box", "bag", "tsp", "tbsp"].map((u) => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-indigo-600 text-white font-bold text-xs rounded-xl shadow-sm hover:bg-indigo-700"
                    >
                      ADD
                    </button>
                  </div>
                </form>
              </div>

              <div className="flex justify-between items-center mb-1">
                <h3 className="font-bold text-gray-800">My Pantry</h3>
                <div className="flex gap-2">
                  <button
                    onClick={handleAutoCategorize}
                    className="p-1.5 rounded-md bg-indigo-50 text-indigo-600 shadow-sm border border-indigo-100"
                    title="Auto-Categorize"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                  <div className="flex bg-gray-100 p-1 rounded-lg">
                    <button
                      onClick={() => setPantryView("list")}
                      className={`p-1.5 rounded-md ${pantryView === "list" ? "bg-white shadow text-indigo-600" : "text-gray-400"}`}
                    >
                      <List className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setPantryView("category")}
                      className={`p-1.5 rounded-md ${pantryView === "category" ? "bg-white shadow text-indigo-600" : "text-gray-400"}`}
                    >
                      <Layers className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-1 pb-4">
                {inventory.length ? (
                  pantryView === "list" ? (
                    inventory.map((item) => (
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
                    ))
                  ) : (
                    Object.keys(groupedInventory).sort().map((cat) => (
                      <div key={cat}>
                        <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 mt-4 ml-1">{cat}</div>
                        {groupedInventory[cat].map((item) => (
                          <InventoryItem
                            key={item.id}
                            item={item}
                            onUpdate={handleUpdateItem}
                            onUpdateQty={handleUpdateQty}
                            onDelete={async (id) =>
                              deleteDoc(doc(db, `/artifacts/${appId}/users/${effectiveUserId}/inventory`, id))
                            }
                            onFindRecipes={(name) => handleGetAIRecipes(name)}
                          />
                        ))}
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
              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                <h4 className="font-bold text-gray-900 text-sm mb-3 flex items-center gap-2">
                  <Flame className="w-4 h-4 text-orange-500" /> Active Goal
                </h4>
                <ChallengeWidget
                  challenges={userProfile.challenges}
                  onViewAll={() => setActiveTab("profile")}
                />
              </div>

              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                <h4 className="font-bold text-gray-900 text-sm mb-3 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-indigo-600" /> Quick Tips
                </h4>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Keep your receipt scanner handy after grocery runs to automatically populate item shelf lives and estimated costs.
                </p>
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
                      : "text-gray-500"
                  }`}
                >
                  Discover
                </button>
                <button
                  onClick={() => setRecipeView("plan")}
                  className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                    recipeView === "plan"
                      ? "bg-white shadow text-indigo-600"
                      : "text-gray-500"
                  }`}
                >
                  Meal Plan
                </button>
                <button
                  onClick={() => setRecipeView("saved")}
                  className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                    recipeView === "saved"
                      ? "bg-white shadow text-indigo-600"
                      : "text-gray-500"
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
                    className="w-full py-3 bg-gradient-to-r from-green-500 to-teal-600 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg mb-2"
                  >
                    <LayoutGrid className="w-4 h-4" /> Smart Meal Prep Mode
                  </button>
                  {/* NEW: Import from URL Button */}
                  <button
                    onClick={() => setShowIngestModal(true)}
                    className="w-full py-3 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm mb-4 hover:bg-indigo-100 transition-colors"
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
                        className="px-3 py-1.5 bg-white border border-gray-200 rounded-full text-xs font-bold text-gray-600 outline-none"
                      >
                        <option value="">All Cuisines</option>
                        {[
                          "American",
                          "Italian",
                          "Mexican",
                          "Asian",
                          "Indian",
                          "Mediterranean",
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
                          className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold border ${
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
                          className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold border ${
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
                      className="py-3 bg-indigo-600 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg"
                    >
                      <Zap className="w-4 h-4" /> Generate Recipes{" "}
                      <span className="ml-1 bg-white/20 px-1.5 rounded text-[10px]">
                        {DAILY_API_LIMIT - apiUsage} left
                      </span>
                    </button>
                    <button
                      onClick={() => handleGetAIRecipes("meal")}
                      className="py-3 bg-indigo-500 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg"
                    >
                      <Utensils className="w-4 h-4" /> Generate Meals
                    </button>
                  </div>

                  {/* DESKTOP 2-COLUMN RECIPE GRID */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    {aiRecipes.map((r) => (
                      <RecipeCard
                        key={r.id}
                        recipe={r}
                        onClick={() => handleSetActiveRecipe(r)}
                        onAddToPlan={handleAddToPlan}
                        isSaved={savedRecipes.some((s) => s.title === r.title)}
                        onToggleSave={handleToggleSave}
                        onVote={handleVote}
                      />
                    ))}
                  </div>

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
                          className="w-full text-left p-3 hover:bg-gray-50 text-sm border-b border-gray-50 last:border-0"
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
                        className="px-3 py-1 bg-white text-indigo-600 rounded-full text-xs font-bold shadow-sm border border-indigo-100 flex items-center gap-1"
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
                  return (
                    <div
                      key={item.id}
                      className="flex justify-between items-center p-3.5 border-b border-gray-100 last:border-0 group hover:bg-gray-50/50"
                    >
                      <div className="flex items-center gap-3">
                        <button onClick={() => toggleGroceryItem(item.id, item.purchased)}>
                          <Square className="w-5 h-5 text-indigo-500" />
                        </button>
                        <div>
                          <span className="text-sm font-medium text-gray-800 block">{item.name}</span>
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
                          className="text-[10px] font-bold text-blue-500 bg-blue-50 px-2.5 py-1 rounded-lg"
                        >
                          Find Deal
                        </button>
                        <button onClick={() => deleteGroceryItem(item.id)}>
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
                          <button onClick={() => toggleGroceryItem(item.id, item.purchased)}>
                            <CheckSquare className="w-5 h-5 text-green-500" />
                          </button>
                          <span className="text-sm font-medium line-through text-gray-800">{item.name}</span>
                        </div>
                        <button onClick={() => deleteGroceryItem(item.id)}>
                          <Trash2 className="w-4 h-4 text-gray-400" />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => setShowCheckout(true)}
                      className="w-full py-3 bg-green-600 text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-green-700 transition-colors"
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

            {/* RIGHT SIDEBAR WIDGET COLUMN (Quick Delivery / Partner Store Links) */}
            <div className="hidden md:block space-y-4">
              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-3">
                <h4 className="font-bold text-gray-900 text-sm mb-2 flex items-center gap-2">
                  <Store className="w-4 h-4 text-indigo-600" /> Shop Online Partners
                </h4>
                
                <button
                  onClick={() =>
                    window.open(
                      `https://www.walmart.com/search?q=${encodeURIComponent(
                        groceryList.filter((i) => !i.purchased).map((g) => g.name).join(" ")
                      )}`,
                      "_blank"
                    )
                  }
                  className="w-full py-3 bg-[#0071dc] text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm hover:opacity-95 transition-opacity"
                >
                  <Store className="w-4 h-4" /> Walmart Delivery
                </button>
                <button
                  onClick={() =>
                    window.open(
                      `https://www.instacart.com/store/s?k=${encodeURIComponent(
                        groceryList.filter((i) => !i.purchased).map((g) => g.name).join(", ")
                      )}`,
                      "_blank"
                    )
                  }
                  className="w-full py-3 bg-[#e8f5e9] border border-green-600 text-green-700 rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-green-50 transition-colors"
                >
                  <ShoppingCart className="w-4 h-4" /> Instacart
                </button>
                <button
                  onClick={() =>
                    window.open(
                      `https://www.amazon.com/s?k=${encodeURIComponent(
                        groceryList.filter((i) => !i.purchased).map((g) => g.name).join(", ")
                      )}&i=amazonfresh`,
                      "_blank"
                    )
                  }
                  className="w-full py-3 bg-[#232f3e] text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-black transition-colors"
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
              <BudgetScreen history={purchaseHistory} wasteHistory={wasteHistory} />
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
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <input
                  placeholder="Find Chefs or Recipes..."
                  className="w-full pl-9 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:border-indigo-500 outline-none shadow-sm"
                />
              </div>

              <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wider pt-2">Community Feed</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            </div>

            {/* RIGHT SIDEBAR WORKSPACE: Share Recipe Form (Takes 1 column on desktop) */}
            <div className="space-y-4">
              <div className="bg-indigo-600 p-6 rounded-3xl text-white shadow-xl sticky top-4">
                <h3 className="font-black text-xl mb-1">Share Recipe</h3>
                <form onSubmit={handleSubmitRecipe} className="space-y-3 mt-4">
                  <div className="bg-white/10 p-3 rounded-lg border border-white/20 text-center">
                    <label className="cursor-pointer flex flex-col items-center justify-center gap-2">
                      <div className="w-full h-28 bg-black/20 rounded-lg flex items-center justify-center overflow-hidden relative">
                        {recipeImage ? (
                          <img
                            src={recipeImage}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex flex-col items-center">
                            <Scan className="w-6 h-6 mb-1" />
                            <span className="text-[10px] uppercase font-bold opacity-70">
                              Add Photo
                            </span>
                          </div>
                        )}
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageSelect}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <input
                    name="title"
                    placeholder="Title"
                    className="w-full p-2.5 rounded-lg text-black text-sm outline-none"
                    required
                  />
                  <div className="flex gap-2">
                    <input
                      name="servings"
                      type="number"
                      placeholder="Servings"
                      className="flex-1 p-2.5 rounded-lg text-black text-sm outline-none"
                      required
                    />
                    <input
                      name="prepTime"
                      placeholder="Prep Time"
                      className="flex-1 p-2.5 rounded-lg text-black text-sm outline-none"
                    />
                  </div>
                  <textarea
                    name="description"
                    placeholder="Description"
                    className="w-full p-2.5 rounded-lg text-black text-sm outline-none h-16"
                    required
                  />
                  <textarea
                    name="instructions"
                    placeholder="Instructions"
                    className="w-full p-2.5 rounded-lg text-black text-sm outline-none h-20"
                    required
                  />
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 bg-white text-indigo-600 font-bold rounded-xl text-xs hover:bg-indigo-50 shadow-sm"
                  >
                    POST RECIPE
                  </button>
                </form>
              </div>
            </div>

          </div>
        )}
        {activeTab === "profile" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-2 md:p-6">
            
            {/* LEFT WORKSPACE: Settings & Configuration (Takes 2 columns) */}
            <div className="md:col-span-2 space-y-6">
              <ToolsScreen
                profile={userProfile}
                onSaveProfile={handleSaveProfile}
                isAdmin={isAdmin}
                onToggleAdmin={handleAdminToggle}
                isDemoAuthenticated={isDemoAuthenticated}
                onShowLogin={() => setShowLoginModal(true)}
              />
            </div>

            {/* RIGHT SIDEBAR WIDGET COLUMN: Trophy Case & Quick Guides */}
            <div className="hidden md:block space-y-6">
              <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
                <h4 className="font-bold text-gray-900 text-sm mb-3 flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-indigo-600" /> Trophy Case Overview
                </h4>
                <p className="text-xs text-gray-500 mb-4">
                  Complete challenges to unlock kitchen achievements and level up your status.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {CHALLENGES.slice(0, 4).map((c) => {
                    const current = (userProfile.challenges || {})[c.id] || 0;
                    const isUnlocked = current >= c.target;
                    return (
                      <div key={c.id} className="bg-gray-50 p-2.5 rounded-2xl border border-gray-100 flex items-center gap-2">
                        <div className={`p-2 rounded-full ${isUnlocked ? "bg-indigo-100 text-indigo-600" : "bg-gray-200 text-gray-400"}`}>
                          {c.icon}
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-gray-800 leading-tight">{c.title}</p>
                          <p className="text-[9px] font-mono text-gray-400">{current}/{c.target}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
                <KitchenGuide />
              </div>
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
              <button onClick={() => setShowIngestModal(false)} className="p-1 hover:bg-gray-100 rounded-full">
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
                className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
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

      {/* Desktop Left Sidebar Navigation */}
      <nav className="hidden md:flex flex-col fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-gray-200 p-6 z-30 shadow-sm">
        <div className="flex items-center gap-2 mb-8">
          <div className="p-2 bg-indigo-600 rounded-lg">
            <Utensils className="text-white w-5 h-5" />
          </div>
          <h1 className="text-xl font-black text-gray-900 tracking-tight">Pantry Chef</h1>
        </div>
        
        <div className="space-y-2 flex-1">
          <button onClick={() => setActiveTab("pantry")} className={`w-full flex items-center gap-3 p-3 rounded-xl font-bold text-sm ${activeTab === "pantry" ? "bg-indigo-50 text-indigo-600" : "text-gray-500 hover:bg-gray-50"}`}>
            <Home className="w-5 h-5" /> Pantry
          </button>
          <button onClick={() => setActiveTab("recipes")} className={`w-full flex items-center gap-3 p-3 rounded-xl font-bold text-sm ${activeTab === "recipes" ? "bg-indigo-50 text-indigo-600" : "text-gray-500 hover:bg-gray-50"}`}>
            <CookingPot className="w-5 h-5" /> Cook
          </button>
          <button onClick={() => setActiveTab("shopping")} className={`w-full flex items-center gap-3 p-3 rounded-xl font-bold text-sm ${activeTab === "shopping" ? "bg-indigo-50 text-indigo-600" : "text-gray-500 hover:bg-gray-50"}`}>
            <ShoppingCart className="w-5 h-5" /> Shop
          </button>
          <button onClick={() => setActiveTab("budget")} className={`w-full flex items-center gap-3 p-3 rounded-xl font-bold text-sm ${activeTab === "budget" ? "bg-indigo-50 text-indigo-600" : "text-gray-500 hover:bg-gray-50"}`}>
            <DollarSign className="w-5 h-5" /> Budget
          </button>
          <button onClick={() => setActiveTab("community")} className={`w-full flex items-center gap-3 p-3 rounded-xl font-bold text-sm ${activeTab === "community" ? "bg-indigo-50 text-indigo-600" : "text-gray-500 hover:bg-gray-50"}`}>
            <Users className="w-5 h-5" /> Social
          </button>
          <button onClick={() => setActiveTab("profile")} className={`w-full flex items-center gap-3 p-3 rounded-xl font-bold text-sm ${activeTab === "profile" ? "bg-indigo-50 text-indigo-600" : "text-gray-500 hover:bg-gray-50"}`}>
            <ConfigIcon className="w-5 h-5" /> Tools
          </button>
          <button 
            onClick={() => setShowFeedbackModal(true)} 
            className="w-full flex items-center gap-3 p-3 rounded-xl font-bold text-sm text-gray-500 hover:bg-gray-50 transition-colors">
            <AlertCircle className="w-5 h-5" /> Feedback
          </button>
          {isAdmin && (
            <button onClick={() => setActiveTab("admin")} className={`w-full flex items-center gap-3 p-3 rounded-xl font-bold text-sm ${activeTab === "admin" ? "bg-indigo-50 text-indigo-600" : "text-gray-500 hover:bg-gray-50"}`}>
              <Briefcase className="w-5 h-5" /> Admin
            </button>
          )}
        </div>
      </nav>

      {/* Mobile Bottom Navigation (Hidden on desktop/tablet) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 max-w-lg mx-auto p-4 bg-white/90 backdrop-blur-xl border-t flex items-center justify-around pb-8 z-30 shadow-up">
        <button
          onClick={() => setActiveTab("pantry")}
          className={`flex flex-col items-center gap-1 transition-all ${
            activeTab === "pantry"
              ? "text-indigo-600 scale-110"
              : "text-gray-300"
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[9px] font-bold">PANTRY</span>
        </button>
        <button
          onClick={() => setActiveTab("recipes")}
          className={`flex flex-col items-center gap-1 transition-all ${
            activeTab === "recipes"
              ? "text-indigo-600 scale-110"
              : "text-gray-300"
          }`}
        >
          <CookingPot className="w-5 h-5" />
          <span className="text-[9px] font-bold">COOK</span>
        </button>
        <button
          onClick={() => setActiveTab("shopping")}
          className={`flex flex-col items-center gap-1 transition-all ${
            activeTab === "shopping"
              ? "text-indigo-600 scale-110"
              : "text-gray-300"
          }`}
        >
          <ShoppingCart className="w-5 h-5" />
          <span className="text-[9px] font-bold">SHOP</span>
        </button>
        <button
          onClick={() => setActiveTab("budget")}
          className={`flex flex-col items-center gap-1 transition-all ${
            activeTab === "budget"
              ? "text-indigo-600 scale-110"
              : "text-gray-300"
          }`}
        >
          <DollarSign className="w-5 h-5" />
          <span className="text-[9px] font-bold">BUDGET</span>
        </button>
        <button
          onClick={() => setActiveTab("community")}
          className={`flex flex-col items-center gap-1 transition-all ${
            activeTab === "community"
              ? "text-indigo-600 scale-110"
              : "text-gray-300"
          }`}
        >
          <Users className="w-5 h-5" />
          <span className="text-[9px] font-bold">SOCIAL</span>
        </button>
        <button
          onClick={() => setActiveTab("profile")}
          className={`flex flex-col items-center gap-1 transition-all ${
            activeTab === "profile"
              ? "text-indigo-600 scale-110"
              : "text-gray-300"
          }`}
        >
          <ConfigIcon className="w-5 h-5" />
          <span className="text-[9px] font-bold">TOOLS</span>
        </button>
        {isAdmin && (
          <button
            onClick={() => setActiveTab("admin")}
            className={`flex flex-col items-center gap-1 transition-all ${
              activeTab === "admin"
                ? "text-indigo-600 scale-110"
                : "text-gray-300"
            }`}
          >
            <Briefcase className="w-5 h-5" />
            <span className="text-[9px] font-bold">ADMIN</span>
          </button>
        )}
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `.shadow-up { box-shadow: 0 -10px 15px -3px rgba(0, 0, 0, 0.05); } .animate-in { animation: fade-in 0.3s ease-out; } @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } } .slide-in-from-bottom { animation: slide-up 0.3s ease-out; } @keyframes slide-up { from { transform: translateY(100%); } to { transform: translateY(0); } } .scrollbar-hide::-webkit-scrollbar { display: none; } .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }`,
        }}
      />
    </div>
  );
};

export default App;
