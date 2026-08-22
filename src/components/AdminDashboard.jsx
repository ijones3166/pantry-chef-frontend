import React, { useState, useEffect } from "react";
import { 
  Briefcase, 
  Users, 
  Trash2, 
  AlertOctagon, 
  UserCircle, 
  Edit, 
  Plus, 
  RefreshCw, 
  ChevronRight, 
  BarChart3, 
  DollarSign, 
  TrendingDown, 
  Shield, 
  Eye, 
  Database, 
  CheckCircle, 
  Zap, 
  Search,
  MessageSquare,
  Bell 
} from "lucide-react";
import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  onSnapshot, 
  doc, 
  deleteDoc, 
  updateDoc, 
  setDoc,
  serverTimestamp,
  arrayUnion 
} from "firebase/firestore";
import AdminRecipeIngestor from "./AdminRecipeIngestor";

// =================================================================================
// SPONSOR PERFORMANCE ANALYTICS HOOK
// =================================================================================
const useSponsorAnalytics = (db, appId) => {
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db) return;
    const unsub = onSnapshot(collection(db, `/artifacts/${appId}/public/data/sponsorAnalytics`), (snapshot) => {
      const logs = snapshot.docs.map(doc => doc.data());
      
      const grouped = {};
      logs.forEach(log => {
        if (!grouped[log.sponsorId]) {
          grouped[log.sponsorId] = { sponsorId: log.sponsorId, impressions: 0, clicks: 0 };
        }
        if (log.eventType === "impression") grouped[log.sponsorId].impressions++;
        if (log.eventType === "click") grouped[log.sponsorId].clicks++;
      });

      const calculated = Object.values(grouped).map(item => ({
        ...item,
        ctr: item.impressions > 0 ? ((item.clicks / item.impressions) * 100).toFixed(2) : "0.00"
      }));

      setStats(calculated);
      setLoading(false);
    });
    return () => unsub();
  }, [db, appId]);

  return { stats, loading };
};

// =================================================================================
// ADVANCED ADMIN REPORTING DASHBOARD (#43)
// =================================================================================
const AdvancedAdminReporting = ({ db, appId }) => {
  const [tokenUsage, setTokenUsage] = useState(0);
  const [arbitrageSavings, setArbitrageSavings] = useState(1420);

  useEffect(() => {
    if (!db) return;
    const todayKey = new Date().toISOString().split('T')[0];
    const unsub = onSnapshot(doc(db, `/artifacts/${appId}/public/data/adminUsage`, todayKey), (docSnap) => {
      if (docSnap.exists()) {
        setTokenUsage(docSnap.data().totalRequests || 0);
      }
    });
    return () => unsub();
  }, [db, appId]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div className="bg-white/10 p-4 rounded-2xl border border-white/10 space-y-1">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">AI Token Burn (Today)</p>
        <h4 className="text-xl font-black text-white">{tokenUsage} <span className="text-xs font-normal text-gray-400">requests</span></h4>
        <p className="text-[10px] text-indigo-300 font-medium">Estimated cost: ${(tokenUsage * 0.002).toFixed(2)}</p>
      </div>

      <div className="bg-white/10 p-4 rounded-2xl border border-white/10 space-y-1">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Takeout Arbitrage Savings</p>
        <h4 className="text-xl font-black text-emerald-400">${arbitrageSavings.toLocaleString()}</h4>
        <p className="text-[10px] text-gray-400 font-medium">Saved via home cooking vs. delivery apps</p>
      </div>

      <div className="bg-white/10 p-4 rounded-2xl border border-white/10 space-y-1">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Avg. Pantry Turnover</p>
        <h4 className="text-xl font-black text-white">8.4 Days</h4>
        <p className="text-[10px] text-emerald-400 font-medium">↓ 1.2 days faster than last month</p>
      </div>

      <div className="bg-white/10 p-4 rounded-2xl border border-white/10 space-y-1">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Cart Hand-off Conversion</p>
        <h4 className="text-xl font-black text-indigo-400">18.6%</h4>
        <p className="text-[10px] text-gray-400 font-medium">Instacart & Walmart affiliate clicks</p>
      </div>
    </div>
  );
};

// =================================================================================
// LIVE CHEF ASSISTANT CHAT TAKEOVER COMPONENT
// =================================================================================
const AdminChatTakeover = ({ db, appId }) => {
  const [activeSessions, setActiveSessions] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [replyMessage, setReplyMessage] = useState("");

  useEffect(() => {
    if (!db) return;
    const unsub = onSnapshot(collection(db, `/artifacts/${appId}/public/data/liveSupportSessions`), (snapshot) => {
      setActiveSessions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, [db, appId]);

  const handleSendHumanReply = async (userId) => {
    if (!replyMessage.trim() || !db) return;
    try {
      await updateDoc(doc(db, `/artifacts/${appId}/users/${userId}/chatHistory`, "currentSession"), {
        messages: arrayUnion({
          sender: "human_chef",
          text: replyMessage,
          timestamp: new Date().toISOString()
        })
      }, { merge: true });
      setReplyMessage("");
      alert("Message sent to user chat stream!");
    } catch (err) {
      console.error("Failed to send human reply:", err);
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in">
      <h3 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-2">
        <MessageSquare className="w-4 h-4 text-indigo-400" /> Live Chef Assistant Chat Takeover
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Session List */}
        <div className="bg-white/5 p-3 rounded-xl border border-white/10 space-y-2 max-h-80 overflow-y-auto">
          <p className="text-[10px] font-bold text-gray-400 uppercase">Active Conversations</p>
          {activeSessions.length === 0 ? (
            <p className="text-xs text-gray-500 py-4 text-center">No active user chats requiring assistance.</p>
          ) : (
            activeSessions.map(session => (
              <div 
                key={session.id}
                onClick={() => setSelectedUser(session)}
                className={`p-2.5 rounded-lg border cursor-pointer transition-colors ${
                  selectedUser?.id === session.id ? "bg-indigo-600 border-indigo-500" : "bg-white/5 border-white/5 hover:bg-white/10"
                }`}
              >
                <p className="text-xs font-bold text-white">{session.userName || session.id}</p>
                <p className="text-[10px] text-gray-300 truncate">{session.lastQuery || "Active session..."}</p>
              </div>
            ))
          )}
        </div>

        {/* Chat Stream & Takeover Console */}
        <div className="md:col-span-2 bg-white/5 p-4 rounded-xl border border-white/10 flex flex-col justify-between h-80">
          {selectedUser ? (
            <>
              <div className="flex justify-between items-center border-b border-white/10 pb-2 mb-2">
                <span className="text-xs font-bold text-white">Chat Stream: {selectedUser.userName || selectedUser.id}</span>
                <span className="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded text-[9px] font-bold">LIVE TAKEOVER READY</span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 pr-2 text-xs text-gray-200">
                <div className="bg-white/10 p-2 rounded-lg max-w-[80%]">
                  <p className="text-[9px] text-indigo-300 font-bold">User</p>
                  <p>How do I substitute buttermilk in this recipe?</p>
                </div>
                <div className="bg-indigo-600/40 p-2 rounded-lg max-w-[80%] ml-auto">
                  <p className="text-[9px] text-indigo-200 font-bold">AI Chef</p>
                  <p>You can mix 1 cup of milk with 1 tablespoon of lemon juice!</p>
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t border-white/10">
                <input
                  type="text"
                  placeholder="Type reply as Human Chef..."
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendHumanReply(selectedUser.id)}
                  className="flex-1 p-2 bg-gray-800 border border-white/10 rounded-xl text-xs text-white outline-none"
                />
                <button
                  onClick={() => handleSendHumanReply(selectedUser.id)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  Send Reply
                </button>
              </div>
            </>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-gray-500">
              Select an active conversation to take over.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// =================================================================================
// MAIN ADMIN DASHBOARD COMPONENT
// =================================================================================
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
  db,
  appId,
  DEMO_USERS
}) => {
  const [adminView, setAdminView] = useState("impact");
  const [feedbackLogs, setFeedbackLogs] = useState([]);
  const [visitorLogs, setVisitorLogs] = useState([]);
  const [waitlistUsers, setWaitlistUsers] = useState([]);
  const [recipeReports, setRecipeReports] = useState([]);

  // =================================================================================
  // Global Limit Settings
  // =================================================================================
  const [globalLimitInput, setGlobalLimitInput] = useState("25");
  const [updatingGlobal, setUpdatingGlobal] = useState(false);

  const handleUpdateGlobalLimit = async () => {
    if (!db) return;
    setUpdatingGlobal(true);
    try {
      const configRef = doc(db, `/artifacts/${appId}/public/data/config`, "appSettings");
      await setDoc(configRef, {
        globalApiLimit: parseInt(globalLimitInput, 10) || 25,
        updatedAt: new Date()
      }, { merge: true });
      alert(`Global AI limit updated to ${globalLimitInput} requests per day.`);
    } catch (err) {
      console.error("Failed to update global limit:", err);
      alert("Error updating global limit.");
    } finally {
      setUpdatingGlobal(false);
    }
  };

  const { stats: sponsorStats, loading: sponsorLoading } = useSponsorAnalytics(db, appId);

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
  }, [db, isAdmin, appId]);

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
  }, [db, appId]);

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

  const handleTierOverride = async (uid, newTier) => {
    try {
      await updateDoc(doc(db, `/artifacts/${appId}/public/data/waitlist`, uid), {
        tier: newTier,
        status: "approved"
      });
      alert(`Updated user tier to ${newTier}`);
    } catch (err) {
      console.error("Tier override failed:", err);
    }
  };

  const mockNetworkData = {
    totalUsers: 12450,
    activeToday: 3420,
    totalWasteSaved: 45000,
    totalMoneySaved: 125000,
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
      <AdminRecipeIngestor db={db} appId={appId} effectiveUserId={effectiveUserId} communityRecipes={communityRecipes} setActiveTab={setActiveTab}/>
      
      {/* 👉 ADMIN & TESTER CONTROLS CARD (Relocated from Profile) */}
      <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl space-y-6 border border-slate-800 animate-in fade-in">
        <div>
          <h3 className="font-black text-base text-white flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-indigo-400" /> Admin & Tester Controls (Approved Only)
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">Pitch simulation tools, custom sync IDs, and walkthrough resets.</p>
        </div>

        {/* Simulate Notifications */}
        <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/60 space-y-3">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Bell className="w-4 h-4 text-indigo-400" /> Simulate Notifications (Pitch Mode)
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              onClick={() => {
                window.dispatchEvent(new CustomEvent("triggerSystemNotification", {
                  detail: { title: "🚨 Freshness Alert", body: "Ground Beef is expiring in 2 hours! Cook or freeze immediately." }
                }));
              }}
              className="py-2.5 px-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer text-left"
            >
              Freshness Alert
            </button>
            <button
              onClick={() => {
                window.dispatchEvent(new CustomEvent("triggerSystemNotification", {
                  detail: { title: "💰 Budget Success", body: "You stayed 15% under your weekly grocery budget. Great job!" }
                }));
              }}
              className="py-2.5 px-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer text-left"
            >
              Budget Success
            </button>
            <button
              onClick={() => {
                window.dispatchEvent(new CustomEvent("triggerSystemNotification", {
                  detail: { title: "❄️ Defrost Reminder", body: "Time to move your Chicken Breast from the freezer to the fridge for tonight's dinner." }
                }));
              }}
              className="py-2.5 px-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer text-left"
            >
              Defrost Reminder
            </button>
          </div>
        </div>

        {/* Data Sync ID / Custom ID */}
        <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/60 space-y-3">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Database className="w-4 h-4 text-indigo-400" /> Data Sync ID
          </h4>
          <div className="flex gap-2">
            <input
              id="admin-sync-id-input"
              defaultValue={localStorage.getItem("pantry_chef_custom_id") || ""}
              placeholder="Enter a unique ID (e.g. Tester1)"
              className="flex-1 p-3 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-indigo-500 font-mono"
            />
            <button
              onClick={() => {
                const val = document.getElementById("admin-sync-id-input").value.trim();
                if (val) {
                  localStorage.setItem("pantry_chef_custom_id", val);
                } else {
                  localStorage.removeItem("pantry_chef_custom_id");
                }
                window.location.reload();
              }}
              className="px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition-colors whitespace-nowrap"
            >
              Apply & Reload App
            </button>
          </div>
        </div>

        {/* Onboarding Walkthrough Reset */}
        <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/60 flex items-center justify-between">
          <div>
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Onboarding Walkthrough</h4>
            <p className="text-[11px] text-slate-400">Review the step-by-step introduction and starter staples.</p>
          </div>
          <button
            onClick={() => {
              localStorage.removeItem("pantry_chef_onboarded");
              window.location.reload();
            }}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition-colors"
          >
            Restart Tour
          </button>
        </div>
      </div>

      {/* Global AI Quota Management Card */}
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4 mb-6">
        <div>
          <h3 className="font-black text-gray-900 text-sm">Global AI Quota Management</h3>
          <p className="text-xs text-gray-500 mt-0.5">Set the default daily request limit for all standard users.</p>
        </div>
        
        <div className="flex items-center gap-2 max-w-xs">
          <input
            type="number"
            value={globalLimitInput}
            onChange={(e) => setGlobalLimitInput(e.target.value)}
            placeholder="25"
            className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono font-bold text-gray-900 outline-none focus:border-indigo-600 w-32"
          />
          <button
            onClick={handleUpdateGlobalLimit}
            disabled={updatingGlobal}
            className="px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap"
          >
            {updatingGlobal ? "Saving..." : "Save Limit"}
          </button>
        </div>
      </div>
            
      <div className="bg-gray-900 text-white p-6 rounded-3xl shadow-xl">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-indigo-400" /> Admin Portal
          </h2>
          <div className="flex gap-2 flex-wrap justify-end">
            <button
              onClick={() => setAdminView("impact")}
              className={`px-2.5 py-1 rounded text-[10px] font-bold ${
                adminView === "impact" ? "bg-indigo-600" : "bg-gray-800 cursor-pointer"
              }`}
            >
              Impact
            </button>
            <button
              onClick={() => setAdminView("monetization")}
              className={`px-2.5 py-1 rounded text-[10px] font-bold ${
                adminView === "monetization" ? "bg-indigo-600" : "bg-gray-800 cursor-pointer"
              }`}
            >
              Data
            </button>
            <button
              onClick={() => setAdminView("sponsors")}
              className={`px-2.5 py-1 rounded text-[10px] font-bold ${
                adminView === "sponsors" ? "bg-indigo-600" : "bg-gray-800 cursor-pointer"
              }`}
            >
              Sponsors
            </button>
            <button
              onClick={() => setAdminView("support")}
              className={`px-2.5 py-1 rounded text-[10px] font-bold flex items-center gap-1 ${
                adminView === "support" ? "bg-indigo-600" : "bg-gray-800 cursor-pointer"
              }`}
            >
              Live Support
            </button>
            <button
              onClick={() => setAdminView("users")}
              className={`px-2.5 py-1 rounded text-[10px] font-bold ${
                adminView === "users" ? "bg-indigo-600" : "bg-gray-800 cursor-pointer"
              }`}
            >
              Users & Tiers
            </button>
            <button
              onClick={() => setAdminView("feedback")}
              className={`px-2.5 py-1 rounded text-[10px] font-bold flex items-center gap-1 ${
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
              className={`px-2.5 py-1 rounded text-[10px] font-bold flex items-center gap-1 ${
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
              className={`px-2.5 py-1 rounded text-[10px] font-bold ${
                adminView === "visitors" ? "bg-indigo-600" : "bg-gray-800 cursor-pointer"
              }`}
            >
              Visitors ({visitorLogs.length})
            </button>
            <button
              onClick={() => setAdminView("waitlist")}
              className={`px-2.5 py-1 rounded text-[10px] font-bold flex items-center gap-1 ${
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

        <AdvancedAdminReporting db={db} appId={appId} />

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

        {adminView === "sponsors" && (
          <div className="space-y-4 animate-in fade-in">
            <h3 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-orange-400" /> Sponsor Campaign Performance & Impressions
            </h3>
            {sponsorLoading ? (
              <p className="text-xs text-gray-400">Loading campaign telemetry...</p>
            ) : sponsorStats.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/10 text-gray-400 uppercase text-[10px]">
                      <th className="pb-2">Sponsor Campaign ID</th>
                      <th className="pb-2">Impressions</th>
                      <th className="pb-2">Clicks</th>
                      <th className="pb-2 text-right">Click-Through Rate (CTR)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {sponsorStats.map((stat) => (
                      <tr key={stat.sponsorId} className="hover:bg-white/5">
                        <td className="py-3 font-mono font-bold text-white">{stat.sponsorId}</td>
                        <td className="py-3">{stat.impressions}</td>
                        <td className="py-3">{stat.clicks}</td>
                        <td className="py-3 text-right font-mono font-bold text-indigo-400">{stat.ctr}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-gray-400 py-4 text-center">No sponsor telemetry recorded yet. Test clicking sponsored cards in your feed!</p>
            )}
          </div>
        )}

        {/* Live Chef Assistant Support Chat Takeover */}
        {adminView === "support" && (
          <AdminChatTakeover db={db} appId={appId} />
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
          <div className="space-y-4 animate-in fade-in">
            <div className="space-y-2 border-b border-white/10 pb-4">
              <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">
                Community Management
              </p>
              <div className="flex gap-2">
                <button
                  onClick={onSeed}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Users className="w-4 h-4" /> Populate Fake Community (Seed)
                </button>
                <button
                  onClick={onPurge}
                  className="flex-1 py-2.5 bg-red-900/50 hover:bg-red-900 text-red-200 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" /> Purge Test Data
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">
                User Tier Overrides & Directory
              </p>
              <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                {waitlistUsers.length === 0 ? (
                  <p className="text-xs text-gray-500 text-center py-4">No registered users in directory.</p>
                ) : (
                  waitlistUsers.map(user => (
                    <div key={user.id} className="bg-white/5 p-3 rounded-xl border border-white/10 flex justify-between items-center text-xs">
                      <div>
                        <p className="font-bold text-white">{user.email || user.displayName || user.id}</p>
                        <p className="text-[9px] text-gray-400 font-mono">UID: {user.uid || user.id}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <select
                          value={user.tier || "Standard"}
                          onChange={(e) => handleTierOverride(user.id, e.target.value)}
                          className="p-1 bg-gray-800 border border-white/10 text-white rounded-lg text-xs outline-none cursor-pointer"
                        >
                          <option value="Standard">Standard</option>
                          <option value="Pro">Pro Chef ($9.99)</option>
                          <option value="Enterprise">Enterprise</option>
                        </select>
                        <button
                          onClick={() => onImpersonate(user.id)}
                          className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold text-[10px] cursor-pointer"
                        >
                          View As 👁️
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
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
                        if (report.recipeId && report.recipeId !== "unknown") {
                          await deleteDoc(doc(db, `/artifacts/${appId}/public/data/userRecipes`, report.recipeId));
                        }
                        await updateDoc(doc(db, `/artifacts/${appId}/public/data/recipeReports`, report.id), { status: "resolved_deleted" });
                        alert("Recipe removed from community feed.");
                      }}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[10px] font-bold cursor-pointer"
                    >
                      Delete Recipe
                    </button>
                    
                    <button
                      onClick={async () => {
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
                        await updateDoc(doc(db, `/artifacts/${appId}/public/data/waitlist`, candidate.id), {
                          status: "approved",
                          approvedAt: serverTimestamp()
                        });
                        alert(`Approved ${candidate.email}!`);
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
                      {fb.timestamp?.toDate() ? fb.timestamp.toDate().toLocaleString() : "Just now"}
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
                  className="w-8 h-8 rounded-full object-cover"
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

export default AdminDashboard;