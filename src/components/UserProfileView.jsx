import React, { useState } from "react";
import { 
  Award, Trophy, ChevronLeft, CookingPot, 
  ThumbsUp, Zap, AlertOctagon, Store, Medal, Clock,
  Leaf, DollarSign, ChefHat, RefreshCw, LayoutGrid, Utensils, Star, Tag as TagIcon, Home, Share2, Sparkles, Cpu
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

  // Identity Classification
  const isPlatformAI = Boolean(
    user.id === "system_pantry_chef_ai" ||
    user.name?.toLowerCase().includes("pantry chef ai") ||
    user.role === "Platform Culinary Intelligence"
  );

  const isPublisher = !isPlatformAI && Boolean(
    user.isPublisher ||
    user.role === "Verified Web Publisher" ||
    user.name?.toLowerCase().includes("allrecipes") ||
    user.name?.toLowerCase().includes("cookie and kate")
  );

  const userRecipes = isPlatformAI
    ? allRecipes.filter((r) => r.isAI || r.authorName === "Pantry Chef AI" || r.createdBy === "system")
    : isPublisher
    ? allRecipes.filter((r) => {
        const target = (user.name || "").toLowerCase().trim();
        const rAuthor = (r.authorName || "").toLowerCase().trim();
        const rSource = (r.sourceName || "").toLowerCase().trim();
        const rUrl = (r.sourceUrl || "").toLowerCase().trim();
        
        if (target.includes("allrecipes")) {
          return rAuthor.includes("allrecipes") || rSource.includes("allrecipes") || rUrl.includes("allrecipes.com");
        }
        if (target.includes("cookie and kate")) {
          return rAuthor.includes("cookie and kate") || rSource.includes("cookie and kate") || rUrl.includes("cookieandkate.com");
        }
        return rAuthor === target || rSource === target;
      })
    : allRecipes.filter((r) => 
        (r.createdBy && r.createdBy === user.id) || 
        (r.authorName && r.authorName.toLowerCase() === (user.name || "").toLowerCase())
      );

  const displayRecipes = userRecipes.length > 0
    ? userRecipes
    : user.seedRecipe
    ? [{ ...user.seedRecipe, id: "seed-" + user.id, authorName: user.name }]
    : [];

  return (
    <div className="fixed inset-0 bg-gray-50 z-[150] overflow-y-auto animate-in slide-in-from-right">
      <div className="sticky top-0 bg-white border-b z-10">
        <div className="p-4 flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-2 -ml-2 rounded-full hover:bg-gray-100 cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="font-bold text-lg">
              {isPlatformAI ? "System Engine" : isPublisher ? "Publisher Archive" : "Chef Profile"}
            </h2>
          </div>
          {!isPlatformAI && (
            <button
              onClick={() => setShowReportModal(true)}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors cursor-pointer"
              title="Report Profile"
            >
              <AlertOctagon className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      <div className="p-4 space-y-6 max-w-4xl mx-auto">
        {/* Profile Header Card */}
        <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
              <div className={`w-16 h-16 rounded-full text-white text-2xl font-black flex items-center justify-center shadow-md overflow-hidden shrink-0 ${
                isPlatformAI ? "bg-gradient-to-br from-indigo-600 to-purple-600" : "bg-blue-600"
              }`}>
                {isPlatformAI ? (
                  <Sparkles className="w-8 h-8 text-amber-300" />
                ) : user.image ? (
                  <img src={user.image} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  (user.name || "P").slice(0, 2).toUpperCase()
                )}
              </div>
              <div>
                <div className="flex items-center gap-2 justify-center sm:justify-start">
                  <h2 className="text-xl font-black text-gray-900">{user.name}</h2>
                  {isPlatformAI ? (
                    <span className="bg-purple-100 text-purple-700 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Cpu className="w-3 h-3 text-purple-600" /> CORE ENGINE
                    </span>
                  ) : isPublisher ? (
                    <span className="bg-blue-100 text-blue-700 text-[10px] font-black px-2 py-0.5 rounded-full">
                      VERIFIED
                    </span>
                  ) : (
                    <CreatorBadge isBrand={user.isBrand} isCreator={user.isCreator} />
                  )}
                </div>
                <p className="text-xs text-gray-500 font-medium mt-0.5">
                  {isPlatformAI
                    ? "Autonomous Platform Intelligence"
                    : isPublisher
                    ? "Verified Web Publisher"
                    : user.role || "Community Chef"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isPublisher && user.sourceUrl ? (
                <a
                  href={user.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  Visit Website ↗
                </a>
              ) : !isPublisher && !isPlatformAI ? (
                <button
                  type="button"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  Follow
                </button>
              ) : null}
            </div>
          </div>

          {/* Stats Bar */}
          {isPlatformAI ? (
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-4 rounded-2xl border border-purple-100 space-y-3">
              <div className="flex items-center justify-between border-b border-purple-200/60 pb-2">
                <span className="text-[10px] font-black text-purple-900 uppercase tracking-wider">Engine Purpose & Architecture</span>
                <span className="text-xs font-bold font-mono text-purple-700">{displayRecipes.length} Custom Recipes Synthesized</span>
              </div>
              <p className="text-xs text-purple-900 leading-relaxed">
                Pantry Chef AI operates autonomously across your kitchen inventory: executing real-time ingredient pairing, shelf-life triage, dynamic multi-dish timing, and private kitchen adaptations.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[11px] font-bold text-purple-800">
                <div className="bg-white/80 p-2 rounded-lg border border-purple-200/80">⚡ 0-Waste Pantry Triage</div>
                <div className="bg-white/80 p-2 rounded-lg border border-purple-200/80">🍳 Appliance Calibration</div>
                <div className="bg-white/80 p-2 rounded-lg border border-purple-200/80">⏱️ Multi-Dish Sync</div>
              </div>
            </div>
          ) : isPublisher ? (
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Indexed Catalog</span>
                <span className="text-lg font-black text-gray-900">{displayRecipes.length} Recipes</span>
              </div>
              {user.sourceUrl && (
                <span className="text-xs text-blue-600 font-mono font-medium truncate max-w-xs">
                  {user.sourceUrl.replace(/^https?:\/\/(www\.)?/, "")}
                </span>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2 bg-gray-50 p-4 rounded-2xl border border-gray-100 text-center">
              <div>
                <span className="text-lg font-black text-gray-900 block">{displayRecipes.length}</span>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Recipes</span>
              </div>
              <div className="border-x border-gray-200">
                <span className="text-lg font-black text-gray-900 block">
                  {Object.keys(user.profile?.challenges || {}).length}
                </span>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Badges</span>
              </div>
              <div>
                <span className="text-lg font-black text-gray-900 block">4.8</span>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Rating</span>
              </div>
            </div>
          )}

          {/* Gamified Achievements Row: Human Cooks Only */}
          {!isPublisher && !isPlatformAI && (
            <div className="space-y-3 pt-2 border-t border-gray-100">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                <Trophy className="w-4 h-4 text-indigo-500" /> Achievements
              </h4>
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
                          isUnlocked ? "bg-indigo-100 text-indigo-600" : "bg-gray-100 text-gray-400"
                        }`}
                      >
                        {c.icon}
                      </div>
                      <span className="text-[8px] font-bold leading-tight">{c.title}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Recipe Grid */}
        <div>
          <h3 className="font-bold text-gray-800 mb-3 text-sm uppercase tracking-wider">
            {isPlatformAI ? "Synthesized Recipes" : isPublisher ? "Published Recipes" : "Posted Recipes"}
          </h3>
          <div className="space-y-3">
            {displayRecipes.length > 0 ? (
              displayRecipes.map((r, i) => (
                <div
                  key={r.id || r.firestoreId || i}
                  onClick={() => onRecipeClick(r)}
                  className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-sm flex gap-3 cursor-pointer hover:shadow-md transition-all"
                >
                  {r.image ? (
                    <img
                      src={r.image}
                      className="w-20 h-20 rounded-xl object-cover bg-gray-100 shrink-0"
                      alt={r.title}
                    />
                  ) : (
                    <div className="w-20 h-20 bg-gray-100 rounded-xl flex items-center justify-center shrink-0">
                      <CookingPot className="text-gray-300 w-6 h-6" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-sm text-gray-900 line-clamp-1">{r.title}</h4>
                    <p className="text-xs text-gray-500 line-clamp-2 my-1 leading-relaxed">
                      {r.description}
                    </p>
                    <div className="flex items-center gap-3 text-[10px] text-gray-400 font-medium">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-indigo-500" /> {r.prepTime || "15 mins"}
                      </span>
                      <span className="flex items-center gap-1">
                        <ThumbsUp className="w-3 h-3 text-green-500" /> {r.likeCount || r.likes || 0}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-gray-400 text-xs bg-white rounded-2xl border border-dashed border-gray-200">
                No recipes indexed under this profile yet.
              </div>
            )}
          </div>
        </div>
      </div>

      {showReportModal && (
        <ReportRecipeModal
          recipe={{ title: `Profile: ${user.name}`, id: user.id }}
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