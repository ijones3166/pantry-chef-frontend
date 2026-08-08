
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
