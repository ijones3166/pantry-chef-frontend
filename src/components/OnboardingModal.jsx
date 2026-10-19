import React, { useState } from "react";
import { 
  ChefHat, 
  UserCircle, 
  Scan, 
  Speaker, 
  CheckCircle, 
  Plus, 
  X 
} from "lucide-react";
import { resizeImage } from "../utils/formatters";

const OnboardingModal = ({ isOpen, onClose, onSavePreferences, onAddToPantry, onScanReceipt }) => {
  const [step, setStep] = useState(1);
  
  // Frame 2: Personal Info & Extended Metadata
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [name, setName] = useState(""); // Display / Chef Name
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

  const categorizedStaples = {
    "Pantry & Grains": [
      { name: "Spaghetti (Dried)", base: "Spaghetti" },
      { name: "Penne Pasta", base: "Penne" },
      { name: "Jasmine Rice", base: "Jasmine Rice" },
      { name: "Basmati Rice", base: "Basmati Rice" },
      { name: "Arborio Rice", base: "Arborio Rice" },
      { name: "Rice Noodles", base: "Rice Noodles" },
      { name: "All-Purpose Flour", base: "Flour" },
      { name: "Masa Harina", base: "Masa Harina" },
      { name: "Bread Crumbs", base: "Bread Crumbs" },
    ],
    "Beans & Tomatoes": [
      { name: "Black Beans (Dried)", base: "Black Beans" },
      { name: "Black Beans (Canned)", base: "Black Beans" },
      { name: "Pinto Beans (Dried)", base: "Pinto Beans" },
      { name: "Pinto Beans (Canned)", base: "Pinto Beans" },
      { name: "Garbanzo Beans", base: "Garbanzo Beans" },
      { name: "Crushed Tomatoes (Canned)", base: "Crushed Tomatoes" },
      { name: "Tomato Paste", base: "Tomato Paste" },
    ],
    "Proteins & Dairy": [
      { name: "Ground Beef (70/30)", base: "Ground Beef" },
      { name: "Ground Beef (90/10)", base: "Ground Beef" },
      { name: "Chuck Roast", base: "Chuck Roast" },
      { name: "Ribeye Steak", base: "Ribeye Steak" },
      { name: "Chicken Breast / Thighs", base: "Chicken" },
      { name: "Pancetta", base: "Pancetta" },
      { name: "Italian Sausage", base: "Italian Sausage" },
      { name: "Shrimp", base: "Shrimp" },
      { name: "Salted Butter", base: "Butter" },
      { name: "Parmesan Cheese", base: "Parmesan" },
      { name: "Fresh Mozzarella", base: "Mozzarella" },
      { name: "Eggs", base: "Eggs" },
    ],
    "Produce & Aromatics": [
      { name: "Garlic (Fresh)", base: "Garlic" },
      { name: "Yellow/Red Onion", base: "Onion" },
      { name: "Shallots", base: "Shallots" },
      { name: "Fresh Basil", base: "Basil" },
      { name: "Fresh Ginger", base: "Ginger" },
      { name: "Limes", base: "Limes" },
      { name: "Lemons", base: "Lemons" },
      { name: "Fresh Cilantro", base: "Cilantro" },
      { name: "Jalapeños", base: "Jalapeños" },
    ],
    "Oils, Sauces & Condiments": [
      { name: "Extra Virgin Olive Oil", base: "Olive Oil" },
      { name: "Toasted Sesame Oil", base: "Sesame Oil" },
      { name: "Balsamic Vinegar", base: "Balsamic Vinegar" },
      { name: "Soy Sauce", base: "Soy Sauce" },
      { name: "Miso Paste", base: "Miso Paste" },
      { name: "Chili Crisp", base: "Chili Crisp" },
      { name: "Mayonnaise", base: "Mayonnaise" },
      { name: "Peanut Butter", base: "Peanut Butter" },
    ],
    "Baking & Spices": [
      { name: "Granulated Sugar", base: "Sugar" },
      { name: "Honey", base: "Honey" },
      { name: "Black Pepper", base: "Black Pepper" },
      { name: "Garlic Powder", base: "Garlic Powder" },
      { name: "Onion Powder", base: "Onion Powder" },
      { name: "Dried Oregano", base: "Dried Oregano" },
      { name: "Broth (Chicken/Beef/Veggie)", base: "Broth" },
    ]
  };

  const toggleSelection = (list, setList, item) => {
    setList((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const handleCuisineWeightChange = (cuisine, val) => {
    setCuisinePreferences((prev) => ({ ...prev, [cuisine]: parseInt(val, 10) }));
  };

  const handleQuickAddStaple = (stapleItem) => {
    const canonicalName = stapleItem.base || stapleItem.name;
    if (!addedStaples.includes(canonicalName)) {
      setAddedStaples((prev) => [...prev, canonicalName]);
      if (onAddToPantry) onAddToPantry(canonicalName);
    }
  };

  const handleFinish = () => {
    onSavePreferences({
      firstName,
      lastName,
      name: name.trim() || `${firstName} ${lastName}`.trim() || "Chef",
      email,
      zipCode,
      instagram,
      tiktok,
      image: profilePhoto,
      avatar: profilePhoto,
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
                Pantry Chef is built to help you waste less and save more. Filling out your profile upfront allows the assistant to customize meal plans, dietary guardrails, and pantry calculations to your kitchen.
              </p>
            </div>
            <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100 text-[11px] text-gray-500">
              You can adjust or expand any of these preferences anytime inside your Settings Profile.
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
              <p className="text-xs text-gray-500">Setup your identity and location for localized store deals and tailored feeds.</p>
            </div>

            {/* First & Last Name */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">First Name</label>
                <input
                  type="text"
                  placeholder="First name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:border-indigo-500 text-gray-900"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Last Name</label>
                <input
                  type="text"
                  placeholder="Last name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:border-indigo-500 text-gray-900"
                />
              </div>
            </div>

            {/* Display Name & Zip Code */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Display Name (Chef Name)</label>
                <input
                  type="text"
                  placeholder="e.g. Chef Ishon"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:border-indigo-500 text-gray-900"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Zip Code</label>
                <input
                  type="text"
                  placeholder="e.g. 92543"
                  maxLength={5}
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:border-indigo-500 text-gray-900"
                />
                <span className="text-[8px] text-gray-400">Used for grocery deals & local pricing</span>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Email Address</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:border-indigo-500 text-gray-900"
              />
              <p className="text-[9px] text-gray-400 mt-0.5">
                🔒 Strictly used for login authentication, approval alerts, and notifications.
              </p>
            </div>

            {/* Social Handles */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold text-gray-500 uppercase">Social Handles</label>
                <span className="text-[9px] text-gray-400">Optional: links on community cards</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Instagram @username"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:border-indigo-500 text-gray-900"
                />
                <input
                  type="text"
                  placeholder="TikTok @username"
                  value={tiktok}
                  onChange={(e) => setTiktok(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:border-indigo-500 text-gray-900"
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
                Recipes and meal plans will automatically scale to your headcount and prioritize equipment you actually own.
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
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
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
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5">Cooking Equipment & Appliances</label>
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

            {/* Cuisine Preference Sliders */}
            <div className="space-y-2 bg-gray-50 p-3 rounded-2xl border border-gray-200">
              <label className="block text-[10px] font-bold text-gray-500 uppercase">Cuisine Match Weighting (1 - 5)</label>
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
                Add your common baseline items now so the AI can calculate your initial ingredient match rates.
              </p>
            </div>

            {/* Ingestion Shortcuts */}
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
                <span className="text-[8px] text-purple-500">Available inside app</span>
              </div>
            </div>

            {/* Category Tabs */}
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
                    const canonicalName = s.base || s.name;
                    const isAdded = addedStaples.includes(canonicalName);
                    return (
                      <button
                        key={s.name}
                        type="button"
                        onClick={() => handleQuickAddStaple(s)}
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

export default OnboardingModal;