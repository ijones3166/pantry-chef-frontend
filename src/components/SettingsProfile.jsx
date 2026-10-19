import React, { useEffect, useState } from "react";
import { 
  Medal, 
  UserCircle, 
  Mail, 
  MapPin, 
  Shield, 
  Save, 
  Scan, 
  Plus, 
  Battery, 
  Crown, 
  Utensils, 
  ChefHat, 
  Users, 
  CookingPot, 
  Briefcase, 
  Bell, 
  Camera, 
  Settings as ConfigIcon, 
  Store,
  Calendar,
  ChevronRight,
  AlertCircle,
  Trash2,
  LogIn,
  CheckCircle,
  Smile,
  Activity,
  Heart
} from "lucide-react";
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
  onExportMealPlanICS,
  db,
  appId,
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
  const [expandedRosterIndex, setExpandedRosterIndex] = useState(null);
  
  const [localProfile, setLocalProfile] = useState(
    profile || { 
      diets: [], 
      equipment: [], 
      zipCode: "",
      cuisinePreferences: DEFAULT_CUISINE_PREFERENCES,
      healthGoals: [],
      dislikedFoods: "",
      likes: "",
      kidPreferences: "",
      householdMembers: [],
      familyModeActive: true,
      notifications: {}
    }
  );

  useEffect(() => {
    if (profile) {
      setLocalProfile(profile);
      setProfileImage(profile.image || profile.avatar || null);
    }
  }, [profile]);

  const getApiUsage = () => {
    return parseInt(localStorage.getItem("pantry_chef_api_count") || "0", 10);
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
        const resized = await resizeImage(file, 200);
        setProfileImage(resized);
        setLocalProfile({ ...localProfile, image: resized, avatar: resized });
      } catch (err) {
        console.error("Failed to resize avatar:", err);
        alert("Error processing image.");
      }
    }
  };

  // Roster Management Actions
  const handleAddHouseholdMember = () => {
    const newMember = { 
      name: "", 
      ageGroup: "Adult (18+)", 
      healthGoals: [], 
      restrictions: "", 
      likes: "", 
      dislikes: "" 
    };
    const currentMembers = localProfile.householdMembers || [];
    const updatedMembers = [...currentMembers, newMember];
    const updated = { ...localProfile, householdMembers: updatedMembers };
    setLocalProfile(updated);
    setExpandedRosterIndex(updatedMembers.length - 1);
  };

  const handleUpdateMemberField = (index, field, value) => {
    const updatedMembers = [...(localProfile.householdMembers || [])];
    updatedMembers[index] = { ...updatedMembers[index], [field]: value };
    setLocalProfile({ ...localProfile, householdMembers: updatedMembers });
  };

  const handleToggleMemberGoal = (index, goal) => {
    const updatedMembers = [...(localProfile.householdMembers || [])];
    const currentGoals = updatedMembers[index].healthGoals || [];
    const updatedGoals = currentGoals.includes(goal)
      ? currentGoals.filter(g => g !== goal)
      : [...currentGoals, goal];
    updatedMembers[index] = { ...updatedMembers[index], healthGoals: updatedGoals };
    setLocalProfile({ ...localProfile, householdMembers: updatedMembers });
  };

  const handleRemoveHouseholdMember = (index) => {
    const currentMembers = localProfile.householdMembers || [];
    const updatedMembers = currentMembers.filter((_, i) => i !== index);
    setLocalProfile({ ...localProfile, householdMembers: updatedMembers });
    setExpandedRosterIndex(null);
  };

  const handleToggleNotification = async (key, checked) => {
    if (checked && typeof window !== "undefined" && "Notification" in window) {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        alert("Browser notifications are blocked. Please enable them in your browser settings.");
        return;
      }
    }
    const updatedNotifs = { ...(localProfile.notifications || {}), [key]: checked };
    setLocalProfile({ ...localProfile, notifications: updatedNotifs });
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">First Name</label>
              <input
                type="text"
                placeholder="First name"
                className="w-full p-3 bg-gray-50 rounded-2xl text-xs outline-none border border-gray-200 focus:border-indigo-600 focus:bg-white transition-all font-medium text-gray-800"
                value={localProfile.firstName || ""}
                onChange={(e) => setLocalProfile({ ...localProfile, firstName: e.target.value })}
                disabled={!isDemoAuthenticated}
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Last Name</label>
              <input
                type="text"
                placeholder="Last name"
                className="w-full p-3 bg-gray-50 rounded-2xl text-xs outline-none border border-gray-200 focus:border-indigo-600 focus:bg-white transition-all font-medium text-gray-800"
                value={localProfile.lastName || ""}
                onChange={(e) => setLocalProfile({ ...localProfile, lastName: e.target.value })}
                disabled={!isDemoAuthenticated}
              />
            </div>
          </div>

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
              placeholder="e.g. 92543"
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
      
      {/* 7. Cooked Nutrition Analytics */}
      <div className={`${!isDemoAuthenticated ? "opacity-50 pointer-events-none" : ""}`}>
        <NutritionReportView
          nutritionLogs={nutritionLogs}
          onDeleteLog={onDeleteLog}
          userProfile={userProfile || profile}
        />
      </div>

      {/* 8. Connected Retailer Accounts Card */}
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

      {/* 9. Cuisine Match Weighting Sliders */}
      <div className={`bg-white p-6 rounded-3xl shadow-sm border border-gray-100 ${!isDemoAuthenticated ? "opacity-50 pointer-events-none" : ""}`}>
        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <ChefHat className="w-5 h-5 text-indigo-600" /> Cuisine Preferences (Match Weighting)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Object.keys(localProfile.cuisinePreferences || DEFAULT_CUISINE_PREFERENCES).map((cuisine) => {
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

      {/* 10. Kitchen Equipment */}
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

      {/* 11. UNIFIED HOUSEHOLD & TASTE ENGINE */}
      <div className={`bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-4 ${!isDemoAuthenticated ? "opacity-50 pointer-events-none" : ""}`}>
        <div className="flex justify-between items-center border-b border-gray-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 rounded-xl">
              <Users className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-sm">Household & Taste Engine</h3>
              <p className="text-[10px] text-gray-400">Configure taste guardrails & family scaling.</p>
            </div>
          </div>
          
          <label className="flex items-center cursor-pointer bg-gray-50 border border-gray-200 rounded-full px-1 py-1">
            <span className={`text-[10px] font-bold px-3 py-1 rounded-full transition-colors ${!(localProfile.familyModeActive ?? true) ? "bg-white shadow-sm text-indigo-700" : "text-gray-400"}`}>Solo</span>
            <input
              type="checkbox"
              checked={localProfile.familyModeActive ?? true}
              onChange={(e) => {
                setLocalProfile({ ...localProfile, familyModeActive: e.target.checked });
                setExpandedRosterIndex(null);
              }}
              className="hidden"
            />
            <span className={`text-[10px] font-bold px-3 py-1 rounded-full transition-colors ${(localProfile.familyModeActive ?? true) ? "bg-white shadow-sm text-indigo-700" : "text-gray-400"}`}>Family</span>
          </label>
        </div>

        {!(localProfile.familyModeActive ?? true) ? (
          <div className="space-y-4 animate-in fade-in">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase block mb-2">My Health Goals & Diets</label>
              <div className="flex flex-wrap gap-1.5">
                {["Weight Loss", "Mass-Building", "Diabetes-Friendly", "Low Sodium", "Heart Healthy", "Gluten-Free"].map((goal) => {
                  const active = (localProfile.healthGoals || []).includes(goal);
                  return (
                    <button
                      key={goal}
                      type="button"
                      onClick={() => {
                        const current = localProfile.healthGoals || [];
                        const updatedGoals = active ? current.filter(g => g !== goal) : [...current, goal];
                        setLocalProfile({ ...localProfile, healthGoals: updatedGoals });
                      }}
                      className={`px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-all cursor-pointer ${
                        active ? "bg-indigo-600 text-white border-indigo-600 shadow-xs" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      {goal}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Dislikes / Aversions</label>
                <input
                  value={localProfile.dislikedFoods || ""}
                  onChange={(e) => setLocalProfile({ ...localProfile, dislikedFoods: e.target.value })}
                  placeholder="e.g., cilantro, mushrooms"
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:bg-white focus:border-indigo-500 transition-colors"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Specific Likes</label>
                <input
                  value={localProfile.likes || ""}
                  onChange={(e) => setLocalProfile({ ...localProfile, likes: e.target.value })}
                  placeholder="e.g., extra garlic, sweet potato"
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:bg-white focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3 animate-in fade-in">
            <div className="flex justify-between items-end mb-2">
              <label className="text-[10px] font-bold text-gray-500 uppercase">Family Roster</label>
              <button
                type="button"
                onClick={handleAddHouseholdMember}
                className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Add Member
              </button>
            </div>

            <div className="space-y-2">
              {localProfile.householdMembers?.map((member, idx) => (
                <div key={idx} className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm transition-all">
                  <div 
                    className={`p-3 flex justify-between items-center cursor-pointer transition-colors ${expandedRosterIndex === idx ? "bg-indigo-50/50" : "hover:bg-gray-50"}`}
                    onClick={() => setExpandedRosterIndex(expandedRosterIndex === idx ? null : idx)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-xs">
                        {member.name ? member.name.charAt(0).toUpperCase() : "👤"}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900 text-sm">{member.name || "New Member"}</span>
                          <span className="text-[9px] bg-gray-100 border border-gray-200 text-gray-600 px-2 py-0.5 rounded-md font-bold uppercase">
                            {member.ageGroup}
                          </span>
                        </div>
                        <div className="text-[10px] text-gray-400 mt-0.5 flex gap-2">
                          {member.healthGoals?.length > 0 && <span>{member.healthGoals.length} Goals</span>}
                          {member.restrictions && <span className="text-rose-500 font-bold flex items-center gap-0.5"><AlertCircle className="w-2.5 h-2.5"/> Allergies Listed</span>}
                        </div>
                      </div>
                    </div>
                    <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${expandedRosterIndex === idx ? "rotate-90" : ""}`} />
                  </div>

                  {expandedRosterIndex === idx && (
                    <div className="p-4 border-t border-gray-100 bg-gray-50/50 space-y-4 animate-in slide-in-from-top-2">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[9px] font-bold text-gray-400 uppercase block mb-1">Name</label>
                          <input
                            value={member.name}
                            onChange={(e) => handleUpdateMemberField(idx, "name", e.target.value)}
                            placeholder="e.g., Person 1"
                            className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs outline-none focus:border-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-bold text-gray-400 uppercase block mb-1">Life Stage</label>
                          <select
                            value={member.ageGroup}
                            onChange={(e) => handleUpdateMemberField(idx, "ageGroup", e.target.value)}
                            className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs outline-none cursor-pointer"
                          >
                            <option value="Adult (18+)">Adult (18+)</option>
                            <option value="Teen (13-17)">Teen (13-17)</option>
                            <option value="Child (6-12)">Child (6-12)</option>
                            <option value="Toddler (1-5)">Toddler (1-5)</option>
                            <option value="Infant">Infant</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="text-[9px] font-bold text-gray-400 uppercase block mb-1.5">Specific Needs & Health Goals</label>
                        <div className="flex flex-wrap gap-1.5">
                          {["Mass-Building", "Pregnancy / Postnatal", "Weight Loss", "Picky Eater", "Low Sodium", "Diabetes-Friendly"].map((goal) => {
                            const isActive = (member.healthGoals || []).includes(goal);
                            return (
                              <button
                                key={goal}
                                type="button"
                                onClick={() => handleToggleMemberGoal(idx, goal)}
                                className={`px-2.5 py-1 rounded-lg text-[9px] font-bold border transition-colors cursor-pointer ${
                                  isActive ? "bg-indigo-100 text-indigo-700 border-indigo-200" : "bg-white text-gray-500 border-gray-200 hover:bg-gray-100"
                                }`}
                              >
                                {goal}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="text-[9px] font-bold text-gray-400 uppercase block mb-1">Hard Allergies / Medical Restrictions</label>
                          <input
                            value={member.restrictions}
                            onChange={(e) => handleUpdateMemberField(idx, "restrictions", e.target.value)}
                            placeholder="e.g., Peanuts, Shellfish"
                            className="w-full p-2.5 bg-white border border-rose-200 rounded-xl text-xs outline-none focus:border-rose-500 text-rose-900 placeholder-rose-300"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[9px] font-bold text-gray-400 uppercase block mb-1">Dislikes / Won't Eat</label>
                            <input
                              value={member.dislikes || ""}
                              onChange={(e) => handleUpdateMemberField(idx, "dislikes", e.target.value)}
                              placeholder="e.g., Onions, spice"
                              className="w-full p-2 bg-white border border-gray-200 rounded-lg text-[10px] outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] font-bold text-gray-400 uppercase block mb-1">Likes / Favorites</label>
                            <input
                              value={member.likes || ""}
                              onChange={(e) => handleUpdateMemberField(idx, "likes", e.target.value)}
                              placeholder="e.g., Sweet potato"
                              className="w-full p-2 bg-white border border-gray-200 rounded-lg text-[10px] outline-none"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleRemoveHouseholdMember(idx)}
                          className="text-[10px] font-bold text-red-500 hover:text-red-700 bg-red-50 px-3 py-1.5 rounded-lg cursor-pointer flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" /> Remove Member
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {(!localProfile.householdMembers || localProfile.householdMembers.length === 0) && (
                <div className="text-center py-6 bg-gray-50 border border-gray-200 border-dashed rounded-2xl">
                  <p className="text-xs font-bold text-gray-500">Your roster is empty.</p>
                  <p className="text-[10px] text-gray-400 mt-1">Add members to generate smart meal modifications.</p>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="pt-2 border-t border-gray-100 flex gap-2">
          <button
            type="button"
            onClick={onExportMealPlanICS}
            className="flex-1 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Calendar className="w-4 h-4" /> Export Calendar (.ics)
          </button>
          <button
            type="button"
            onClick={() => alert("Alexa & Google Voice integration active: Say 'Alexa, add milk to Pantry Chef shopping list'")}
            className="flex-1 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>🎙️ Voice Sync Link</span>
          </button>
        </div>
      </div>

      {/* 12. NOTIFICATION PREFERENCES */}
      <div className={`bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4 ${!isDemoAuthenticated ? "opacity-50 pointer-events-none" : ""}`}>
        <div className="flex justify-between items-center border-b border-gray-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 rounded-xl">
              <Bell className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-sm">Notification Preferences</h3>
              <p className="text-[10px] text-gray-400">Manage your real-time desktop & mobile alerts.</p>
            </div>
          </div>

          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
            typeof window !== "undefined" && window.Notification && Notification.permission === "granted"
              ? "bg-emerald-100 text-emerald-700"
              : "bg-amber-100 text-amber-700"
          }`}>
            {typeof window !== "undefined" && window.Notification && Notification.permission === "granted" ? "🔔 Permissions Active" : "⚠️ Permissions Required"}
          </span>
        </div>

        <div className="space-y-3">
          {[
            { key: "expiryAlerts", label: "🚨 Expiration Warnings", desc: "Notify me when pantry items are within 3 days of expiring." },
            { key: "match100Alerts", label: "✨ 100% Recipe Match Alerts", desc: "Ping me when a saved recipe becomes fully cookable from stock." },
            { key: "prepReminders", label: "⏰ Prep & Meal Reminders", desc: "Alert me when it's time to start scheduled dinner prep." },
            { key: "workspaceUpdates", label: "🛒 Shared Workspace Updates", desc: "Notify me when family members claim or add grocery items." },
          ].map((pref) => {
            const isChecked = localProfile?.notifications?.[pref.key] ?? false;

            return (
              <div key={pref.key} className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="pr-4">
                  <span className="text-xs font-bold text-gray-800 block">{pref.label}</span>
                  <span className="text-[10px] text-gray-500 leading-snug">{pref.desc}</span>
                </div>

                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) => handleToggleNotification(pref.key, e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>
            );
          })}
        </div>
      </div>

      {/* 13. Save Button */}
      {isDemoAuthenticated && (
        <button
          onClick={() => onSaveProfile(localProfile)}
          className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg cursor-pointer hover:bg-indigo-700 transition-colors"
        >
          Save Profile
        </button>
      )}

      {/* 14. Platform Governance */}
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