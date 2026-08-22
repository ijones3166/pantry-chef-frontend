import React, { useEffect, useState } from "react";
import { Medal, UserCircle, Mail, MapPin, Shield, Save, Scan, Plus, Battery, Crown, Utensils, ChefHat, Users, CookingPot, Briefcase, Bell, Camera, Settings as ConfigIcon, Store } from "lucide-react";
import { doc, updateDoc } from "firebase/firestore";
import { getStorage, ref, uploadString, getDownloadURL } from "firebase/storage";
import { resizeImage } from "../utils/formatters";
import NutritionReportView from "./NutritionReportView";


const DAILY_API_LIMIT = 50;

const DEFAULT_CUISINE_PREFERENCES = {
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
  Japanese: 3,
};

export default function SettingsProfile({
  profile,
  onSaveProfile,
  isAdmin,
  onToggleAdmin,
  isDemoAuthenticated,
  onShowLogin,
  onRestartTour,
  onOpenGuidelines,
  onOpenLegal,
  db,
  appdId,
  effectiveUserId,
  storage,
  nutritionLogs,
  onDeleteLog,
  userProfile,
}) {
  const [profileImage, setProfileImage] = useState(profile?.image || null);
  const [dataSyncId, setDataSyncId] = useState(
    localStorage.getItem("pantry_chef_custom_id") || ""
  );
  
  // Fully restored localProfile state
  const [localProfile, setLocalProfile] = useState(
    profile || { 
      diets: [], 
      equipment: [], 
      zipCode: "",
      cuisinePreferences: {
        American: 3, "Soul Food": 4, Mexican: 3, Italian: 3, Asian: 3, 
        Indian: 3, Mediterranean: 3, Thai: 3, Caribbean: 3, French: 3, 
        Chinese: 3, Greek: 3, German: 3, Filipino: 3, Japanese: 3
      },
      healthGoals: [],
      dislikedFoods: "",
      kidPreferences: ""
    }
  );

  useEffect(() => {
    if (profile) {
      setLocalProfile(profile);
      setProfileImage(profile.image || profile.avatar || null);
    }
  }, [profile]);

  const getApiUsage = () => {
    return parseInt(localStorage.getItem("pantry_chef_api_count") || "0");
  };

  const [apiUsage, setApiUsage] = useState(getApiUsage());

  useEffect(() => {
    const handleUpdate = () => setApiUsage(getApiUsage());
    window.addEventListener("apiUsageUpdated", handleUpdate);
    return () => window.removeEventListener("apiUsageUpdated", handleUpdate);
  }, []);

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

  const handleCuisineWeightChange = (cuisine, val) => {
    const currentPrefs = {
      ...DEFAULT_CUISINE_PREFERENCES,
      ...(localProfile.cuisinePreferences || {}),
    };
    const updatedPrefs = {
      ...currentPrefs,
      [cuisine]: parseInt(val, 10),
    };
    setLocalProfile({ ...localProfile, cuisinePreferences: updatedPrefs });
  };

  const handleProfileImageSelect = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        // Compress and resize avatar to 200px max width/height to protect Firestore doc size
        const resized = await resizeImage(file, 200);
        setProfileImage(resized);
        setLocalProfile({ ...localProfile, image: resized, avatar: resized });
      } catch (err) {
        console.error("Failed to resize avatar:", err);
        alert("Error processing image.");
      }
    }
  };

  const handleSyncIdChange = (e) => {
    const newVal = e.target.value;
    setDataSyncId(newVal);
    localStorage.setItem("pantry_chef_custom_id", newVal);
  };

  const triggerSystemNotification = (title, body) => {
    window.dispatchEvent(
      new CustomEvent("triggerSystemNotification", { detail: { title, body } })
    );
  };

  return (
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

      {/* 2. My Profile & Account Details */}
      <div className={`bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-6 ${!isDemoAuthenticated ? "opacity-50 pointer-events-none filter blur-sm select-none" : ""}`}>
        <div className="flex items-center gap-2 border-b border-gray-100 pb-4">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
            <UserCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-black text-gray-900 text-sm">My Profile & Preferences</h3>
            <p className="text-[10px] text-gray-400">Manage your public chef identity and account credentials</p>
          </div>
        </div>

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
              <MapPin className="w-3 h-3 text-indigo-500" /> Zip Code
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
      {profile?.creatorProgress > 0 && (
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

      {/* 5. Go Pro */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-4 rounded-3xl shadow-lg text-white">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-bold flex items-center gap-2"><Crown className="w-5 h-5 text-yellow-300" /> Go Pro</h3>
          <span className="bg-white/20 px-2 py-1 rounded text-[10px] font-bold">BEST VALUE</span>
        </div>
        <button onClick={() => window.dispatchEvent(new CustomEvent("openSubscription"))} className="w-full py-2 bg-white text-indigo-600 rounded-xl text-xs font-bold shadow-sm cursor-pointer">
          Upgrade Now
        </button>
      </div>

      {/* 6. Dietary Preferences */}
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
      
      {/* Cooked Nutrition Analytics inside Settings */}
      <div className={`${!isDemoAuthenticated ? "opacity-50 pointer-events-none" : ""}`}>
        <NutritionReportView
          nutritionLogs={nutritionLogs}
          onDeleteLog={onDeleteLog}
          userProfile={userProfile || profile}
        />
      </div>

      {/* Connected Retailer Accounts Card */}
      <div className={`bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${!isDemoAuthenticated ? "opacity-50 pointer-events-none" : ""}`}>
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-sm">Connected Retailer Accounts</h3>
            <p className="text-[10px] text-gray-400">Link your grocery store loyalty cards, digital accounts, and rewards</p>
          </div>
        </div>
        <button
          onClick={() => window.dispatchEvent(new CustomEvent("openRetailerAccounts"))}
          className="w-full sm:w-auto px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-2"
        >
          Manage Accounts
        </button>
      </div>

      {/* 7. Cuisine Match Weighting Sliders */}
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
                  onChange={(e) => handleCuisineWeightChange(cuisine, e.target.value)}
                  className="w-full accent-indigo-600 h-1.5 bg-gray-200 rounded-lg cursor-pointer"
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* 8. Household & AI Taste Profile Engine */}
      <div className={`bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-4 ${!isDemoAuthenticated ? "opacity-50 pointer-events-none" : ""}`}>
        <h3 className="font-bold text-gray-900 flex items-center gap-2">
          <Users className="w-5 h-5 text-indigo-600" /> Household & AI Taste Profile Engine
        </h3>
        <p className="text-xs text-gray-500 leading-relaxed">
          Configure your household composition, health objectives, and flavor profiles to let the smart assistant tailor macro targets and dietary guardrails automatically.
        </p>

        {/* Health Goals Selection */}
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

        {/* Disliked Foods & Ingredients */}
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

        {/* Kid Preferences & Family Adaptations */}
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

      {/* 9. Equipment */}
      <div className={`bg-white p-6 rounded-3xl shadow-sm border border-gray-100 ${!isDemoAuthenticated ? "opacity-50 pointer-events-none" : ""}`}>
        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <CookingPot className="w-5 h-5 text-indigo-600" /> Kitchen Equipment
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

      {/* 12. Save Button */}
      {isDemoAuthenticated && (
        <button
          onClick={() => onSaveProfile(localProfile)}
          className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg cursor-pointer hover:bg-indigo-700 transition-colors"
        >
          Save Profile
        </button>
      )}

      {/* 11. Platform Governance */}
      <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm text-center space-y-2">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Platform Governance</p>
        <div className="flex justify-center gap-4 text-xs font-bold text-indigo-600">
          <button onClick={onOpenGuidelines} className="hover:underline cursor-pointer">
            Community Guidelines
          </button>
          <span className="text-gray-300">•</span>
          <button onClick={onOpenLegal} className="hover:underline cursor-pointer">
            Terms & Privacy Policy
          </button>
        </div>
      </div>

      
    </div>
  );
}