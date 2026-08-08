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
