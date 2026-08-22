import React, { useState, useEffect, useRef } from "react";
import { Sparkles, Send, X, ChefHat, Loader, Cloud } from "lucide-react";
import { doc, setDoc, onSnapshot } from "firebase/firestore";

function OmnipresentChef({ activeTab, inventory = [], userProfile = {}, askAIChef, onTriggerGeneration, db, appId, effectiveUserId }) {
  const [isOpen, setIsOpen] = useState(false);
  const [chatQuery, setChatQuery] = useState("");
  const [chatLog, setChatLog] = useState([]);
  const [isThinking, setIsThinking] = useState(false);
  const [isGeneratingRecipes, setIsGeneratingRecipes] = useState(false);

  // 👉 REFS FOR BULLETPROOF SCROLLING
  const chatContainerRef = useRef(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = (instant = false) => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior: instant ? "auto" : "smooth" });
    }
  };

  // 👉 REAL-TIME CLOUD SYNC: Listen for cross-device updates
  useEffect(() => {
    if (!db || !effectiveUserId) return;
    const chatRef = doc(db, `/artifacts/${appId}/users/${effectiveUserId}/chat`, "history");
    
    const unsub = onSnapshot(chatRef, (docSnap) => {
      if (docSnap.exists() && docSnap.data().messages) {
        setChatLog(docSnap.data().messages);
      } else {
        setChatLog([{ role: "ai", text: "Hi Chef! I'm your culinary assistant. How can I help you navigate or cook today?" }]);
      }
      setTimeout(() => scrollToBottom(true), 50);
    });

    return () => unsub();
  }, [db, appId, effectiveUserId]);

  // 👉 INSTANT SCROLL ON OPEN
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => scrollToBottom(true), 100);
    }
  }, [isOpen]);

  const syncToCloud = async (newLog) => {
    if (!db || !effectiveUserId) return;
    const trimmedLog = newLog.slice(-30); // 30-message retention cap
    await setDoc(doc(db, `/artifacts/${appId}/users/${effectiveUserId}/chat`, "history"), { messages: trimmedLog }, { merge: true });
  };

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener("openOmnipresentChef", handleOpen);
    return () => window.removeEventListener("openOmnipresentChef", handleOpen);
  }, []);

  const getTabPills = () => {
    switch (activeTab) {
      case "pantry": return ["What ingredients are expiring soon?", "Suggest a quick snack from stock", "How can I organize my pantry?"];
      case "recipes": return ["Surprise me with a 20-minute meal", "Reverse-engineer a fast-food copycat recipe", "What can I cook with 100% pantry match?", "Suggest a kid-friendly adaptation"];
      case "shopping": return ["Find deals for my shopping list", "Swap missing items for pantry staples", "Estimate total grocery cost"];
      case "budget": return ["How can I lower my grocery bill?", "Analyze my food waste this month", "What is my pantry net worth?"];
      case "community": return ["Show me top-rated community recipes", "How do I share my own recipe?", "What makes a viral recipe?"];
      default: return ["Help me plan dinner tonight", "Give me a pro cooking technique tip", "Take me to my meal plan"];
    }
  };

  const handleSendMessage = async (queryText) => {
    if (!queryText.trim()) return;
    const userMsg = queryText.trim();
    
    const logWithUser = [...chatLog, { role: "user", text: userMsg }];
    setChatLog(logWithUser);
    syncToCloud(logWithUser);
    
    setChatQuery("");
    setIsThinking(true);
    setTimeout(() => scrollToBottom(), 50);

    try {
      if (userMsg.toLowerCase().includes("copycat") || userMsg.toLowerCase().includes("fast-food") || userMsg.toLowerCase().includes("reverse-engineer")) {
        const logWithCopycat = [...logWithUser, { role: "ai", text: "I'm on it! What restaurant dish or fast-food item would you like me to clone?" }];
        setChatLog(logWithCopycat);
        syncToCloud(logWithCopycat);
      } else {
        const contextSummary = `Active Tab: ${activeTab}. Pantry Items: ${inventory.map(i => i.name).join(", ")}.`;
        const rawResponse = askAIChef ? await askAIChef(userMsg, contextSummary) : "I'm here to help with your kitchen workflow!";
        
        const hasActionPill = rawResponse.includes("[ACTION_PILL]");
        const cleanText = rawResponse.replace("[ACTION_PILL]", "").trim();

        const logWithAI = [...logWithUser, { 
          role: "ai", 
          text: cleanText,
          hasActionPill: hasActionPill,
          actionQuery: userMsg 
        }];
        setChatLog(logWithAI);
        syncToCloud(logWithAI);
      }
    } catch (err) {
      const logWithError = [...logWithUser, { role: "ai", text: "Connection error. Please try again." }];
      setChatLog(logWithError);
      syncToCloud(logWithError);
    } finally {
      setIsThinking(false);
      setTimeout(() => scrollToBottom(), 50);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-end sm:items-center justify-center p-2 sm:p-4 animate-in fade-in">
      <div className="bg-white w-full max-w-lg h-[85vh] sm:h-[600px] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom">
        
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-indigo-900 to-slate-900 text-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/10 rounded-xl">
              <ChefHat className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <h3 className="font-black text-sm">Omnipresent Chef Assistant</h3>
              <p className="text-[10px] text-indigo-300 uppercase tracking-wider">Context: {activeTab} view</p>
            </div>
          </div>
          <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-white/10 rounded-full cursor-pointer">
            <X className="w-5 h-5 text-gray-300" />
          </button>
        </div>

        {/* Quick-Prompt Pills Bar */}
        <div className="bg-indigo-50/70 p-3 border-b border-indigo-100 shrink-0">
          <p className="text-[9px] font-bold text-indigo-700 uppercase tracking-wider mb-2 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-500" /> Quick-Prompt Suggestions ({activeTab})
          </p>
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
            {getTabPills().map((pill, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(pill)}
                className="px-3 py-1.5 bg-white hover:bg-indigo-600 hover:text-white text-indigo-700 border border-indigo-200 rounded-full text-xs font-bold whitespace-nowrap shadow-2xs transition-colors cursor-pointer shrink-0"
              >
                {pill}
              </button>
            ))}
          </div>
        </div>

        {/* Chat History Log */}
        <div ref={chatContainerRef} className="flex-grow overflow-y-auto p-4 space-y-3 bg-gray-50">
          {/* Cloud Sync Disclaimer */}
          <div className="flex justify-center mb-4">
            <span className="text-[9px] font-bold text-gray-400 bg-gray-200/50 px-3 py-1 rounded-full flex items-center gap-1.5">
              <Cloud className="w-3 h-3 text-indigo-400" /> Syncs last 30 messages across devices
            </span>
          </div>

          {chatLog.map((msg, i) => (
            <div key={i} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
              <div
                className={`p-3 rounded-2xl max-w-[85%] text-xs sm:text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-indigo-600 text-white rounded-br-xs"
                    : "bg-white border border-gray-200 text-gray-800 rounded-bl-xs shadow-2xs"
                }`}
              >
                {msg.text}
              </div>
              
              {msg.hasActionPill && (
                <button
                  disabled={isGeneratingRecipes}
                  onClick={async () => {
                    setIsGeneratingRecipes(true);
                    if (onTriggerGeneration) await onTriggerGeneration(msg.actionQuery);
                    setIsGeneratingRecipes(false);
                    setIsOpen(false);
                  }}
                  className="mt-2 ml-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer flex items-center gap-1.5 active:scale-95 transition-all disabled:opacity-50"
                >
                  {isGeneratingRecipes ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" /> Building Custom Recipes...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" /> Build Custom Recipes for the Family
                    </>
                  )}
                </button>
              )}
            </div>
          ))}
          {isThinking && (
            <div className="p-3 bg-white border border-gray-200 rounded-2xl max-w-[85%] text-xs text-gray-400 mr-auto animate-pulse">
              Chef is thinking...
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input Form */}
        <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(chatQuery); }} className="p-3 bg-white border-t border-gray-200 flex gap-2 shrink-0">
          <input
            value={chatQuery}
            onChange={(e) => setChatQuery(e.target.value)}
            placeholder="Ask anything about recipes, pantry, or navigation..."
            className="flex-grow p-3 bg-gray-100 rounded-xl text-xs sm:text-sm outline-none focus:bg-white focus:ring-1 focus:ring-indigo-500 transition-all text-gray-900"
          />
          <button
            type="submit"
            className="p-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm cursor-pointer transition-colors flex items-center justify-center"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

      </div>
    </div>
  );
}

export default OmnipresentChef;