import React, { useState } from "react";
import { 
  UserCircle, Award, Trophy, Calendar, ChevronLeft, CookingPot, 
  ThumbsUp, ShoppingCart, Zap, AlertOctagon, Store, Medal, Clock,
  Leaf, DollarSign, ChefHat, RefreshCw, LayoutGrid, Utensils, Star, Tag as TagIcon, Home, Share2
} from "lucide-react";
import ReportRecipeModal from "./ReportRecipeModal";

const CHALLENGES = [
  { id: "zero_waste", title: "Zero Waste", desc: "Log 0 waste for 7 days", target: 7, unit: "days", icon: <Leaf className="w-4 h-4" /> },
  { id: "budget_master", title: "Budget Master", desc: "Stay under budget", target: 100, unit: "%", icon: <DollarSign className="w-4 h-4" /> },
  { id: "iron_chef", title: "Iron Chef", desc: "Cook 10 distinct recipes", target: 10, unit: "recipes", icon: <ChefHat className="w-4 h-4" /> },
  { id: "leftover_legend", title: "Leftover Legend", desc: "Use 5 expiring items", target: 5, unit: "items", icon: <RefreshCw className="w-4 h-4" /> },
  { id: "meal_prep_pro", title: "Meal Prep Pro", desc: "Complete 4 prep plans", target: 4, unit: "plans", icon: <LayoutGrid className="w-4 h-4" /> },
  { id: "variety_king", title: "Variety King", desc: "Cook 5 cuisines", target: 5, unit: "cuisines", icon: <Utensils className="w-4 h-4" /> },
  { id: "community_star", title: "Community Star", desc: "Receive 50 likes", target: 50, unit: "likes", icon: <Star className="w-4 h-4" /> },
  { id: "deal_hunter", title: "Deal Hunter", desc: "Save $50 w/ deals", target: 50, unit: "$", icon: <TagIcon className="w-4 h-4" /> },
  { id: "pantry_purger", title: "Pantry Purger", desc: "Use 20 items", target: 20, unit: "items", icon: <Home className="w-4 h-4" /> },
  { id: "social_butterfly", title: "Social Butterfly", desc: "Share 5 recipes", target: 5, unit: "shares", icon: <Share2 className="w-4 h-4" /> },
];

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

const UserProfileView = ({ user, onClose, allRecipes, onRecipeClick, db, appId, effectiveUserId }) => {
  const [showReportModal, setShowReportModal] = useState(false);

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
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-2 -ml-2 rounded-full hover:bg-gray-100 cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="font-bold text-lg">Chef Profile</h2>
          </div>
          {/* Report User Button */}
          <button
            onClick={() => setShowReportModal(true)}
            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors cursor-pointer"
            title="Report User Profile"
          >
            <AlertOctagon className="w-5 h-5" />
          </button>
        </div>
      </div>
      <div className="p-4 space-y-6">
        <div className="flex items-center gap-4">
          <img
            src={user.image}
            alt={user.name}
            className="w-20 h-20 rounded-full border-2 border-white shadow-md object-cover"
          />
          <div>
            <h1 className="text-xl font-black text-gray-900 leading-none">
              {user.name}
            </h1>
            <p className="text-sm text-gray-500 mb-2">{user.role}</p>
            <div className="flex gap-1 flex-wrap items-center">
              <CreatorBadge isBrand={user.isBrand} isCreator={user.isCreator} />
              <button className="bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full cursor-pointer ml-1">
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
                      alt={r.title}
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
      {showReportModal && (
        <ReportRecipeModal
          recipe={{ title: `User Profile: ${user.name}`, id: user.id }}
          onClose={() => setShowReportModal(false)}
          effectiveUserId={effectiveUserId}
          db={db}
          appId={appId}
        />
      )}
    </div>
  );
};

export default UserProfileView;