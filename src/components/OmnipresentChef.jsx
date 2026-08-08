import React, { useState } from "react";
import { ChefHat, X, Send, Sparkles, ChevronRight, MessageSquare } from "lucide-react";

export default function OmnipresentChef({ activeTab, inventory = [], userProfile = {}, askAIChef }) {
  const [isOpen, setIsOpen] = useState(false);
  const [chatQuery, setChatQuery] = useState("");
  const [chatLog, setChatLog] = useState([
    { role: "ai", text: "Hi Chef! I'm your culinary assistant. How can I help you navigate or cook today?" }
  ]);
  const [isThinking, setIsThinking] = useState(false);

  // 👉 Tab-specific Quick-Prompt Pills (#12)
  const getTabPills = () => {
    switch (activeTab) {
      case "pantry":
        return [
          "What ingredients are expiring soon?",
          "Suggest a quick snack from stock",
          "How can I organize my pantry?"
        ];
      case "recipes":
        return [
          "Surprise me with a 20-minute meal",
          "What can I cook with 100% pantry match?",
          "Suggest a kid-friendly adaptation"
        ];
      case "shopping":
        return [
          "Find deals for my shopping list",
          "Swap missing items for pantry staples",
          "Estimate total grocery cost"
        ];
      case "budget":
        return [
          "How can I lower my grocery bill?",
          "Analyze my food waste this month",
          "What is my pantry net worth?"
        ];
      case "community":
        return [
          "Show me top-rated community recipes",
          "How do I share my own recipe?",
          "What makes a viral recipe?"
        ];
      default:
        return [
          "Help me plan dinner tonight",
          "Give me a pro cooking technique tip",
          "Take me to my meal plan"
        ];
    }
  };

  const handleSendMessage = async (queryText) => {
    if (!queryText.trim()) return;
    const userMsg = queryText.trim();
    setChatLog((prev) => [...prev, { role: "user", text: userMsg }]);
    setChatQuery("");
    setIsThinking(true);

    try {
      const contextSummary = `Active Tab: ${activeTab}. Pantry Items: ${inventory.map(i => i.name).join(", ")}.`;
      const response = await askAIChef ? await askAIChef(userMsg, contextSummary) : "I'm here to help with your kitchen workflow!";
      setChatLog((prev) => [...prev, { role: "ai", text: response }]);
    } catch (err) {
      setChatLog((prev) => [...prev, { role: "ai", text: "Connection error. Please try again." }]);
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <>
      {/* Floating Action Button (FAB) - Omnipresent App-Wide Trigger */}
      <div className="fixed bottom-20 right-6 md:bottom-8 md:right-8 z-50">
        <button
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-full shadow-2xl flex items-center justify-center transform active:scale-95 transition-all cursor-pointer group"
          title="Open Omnipresent Chef Assistant"
        >
          <ChefHat className="w-7 h-7 group-hover:scale-110 transition-transform" />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 rounded-full border-2 border-white animate-pulse"></span>
        </button>
      </div>

      {/* Slide-out / Pop-up Chat Drawer */}
      {isOpen && (
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

            {/* Quick-Prompt Pills Bar (#12) */}
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
            <div className="flex-grow overflow-y-auto p-4 space-y-3 bg-gray-50">
              {chatLog.map((msg, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-2xl max-w-[85%] text-xs sm:text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-indigo-600 text-white ml-auto rounded-br-xs"
                      : "bg-white border border-gray-200 text-gray-800 mr-auto rounded-bl-xs shadow-2xs"
                  }`}
                >
                  {msg.text}
                </div>
              ))}
              {isThinking && (
                <div className="p-3 bg-white border border-gray-200 rounded-2xl max-w-[85%] text-xs text-gray-400 mr-auto animate-pulse">
                  Chef is thinking...
                </div>
              )}
            </div>

            {/* Chat Input Form */}
            <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(chatQuery); }} className="p-3 bg-white border-t border-gray-200 flex gap-2 shrink-0">
              <input
                value={chatQuery}
                onChange={(e) => setChatQuery(e.target.value)}
                placeholder="Ask anything about recipes, pantry, or navigation..."
                className="flex-grow p-3 bg-gray-100 rounded-xl text-xs sm:text-sm outline-none focus:bg-white focus:ring-1 focus:ring-indigo-500 transition-all"
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
      )}
    </>
  );
}