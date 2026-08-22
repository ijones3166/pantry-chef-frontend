import React, { useState } from "react";
import { X, Store, Check, Plus, Trash2, LinkIcon, Loader, CheckCircle, RefreshCw } from "lucide-react";
import { doc, updateDoc } from "firebase/firestore";



const RetailerAccountsModal = ({ onClose, effectiveUserId, db, appId }) => {
  const [linkingStore, setLinkingStore] = useState(null);
  const [syncingStore, setSyncingStore] = useState(null);
  const [linkedAccounts, setLinkedAccounts] = useState({
    walmart: { linked: false, lastSync: null },
    kroger: { linked: false, lastSync: null },
    albertsons: { linked: false, lastSync: null }
  });

  const handleOAuthConnect = (storeName) => {
    setLinkingStore(storeName);
    
    // Simulate secure OAuth handshake popup window flow
    setTimeout(() => {
      setLinkedAccounts(prev => ({
        ...prev,
        [storeName.toLowerCase()]: { linked: true, lastSync: "Just now" }
      }));
      setLinkingStore(null);
      alert(`Successfully linked your ${storeName} loyalty account! Digital receipts will now auto-sync.`);
    }, 2000);
  };

  const handleManualSync = (storeName) => {
    setSyncingStore(storeName);
    setTimeout(() => {
      setSyncingStore(null);
      alert(`Fetched latest digital receipts from ${storeName}. Added 3 items to your pantry history!`);
    }, 1500);
  };

  const stores = [
    { name: "Walmart", color: "bg-[#0071dc]", desc: "Sync Walmart+ loyalty & digital e-receipts" },
    { name: "Kroger", color: "bg-[#002d62]", desc: "Sync Kroger Plus Card rewards & purchase history" },
    { name: "Albertsons", color: "bg-[#cc0000]", desc: "Sync Albertsons for U rewards & digital receipts" }
  ];

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4 animate-in slide-in-from-bottom">
        <div className="flex justify-between items-center border-b pb-3">
          <div className="flex items-center gap-2">
            <Store className="w-5 h-5 text-indigo-600" />
            <h3 className="font-black text-base text-gray-900">Retailer Loyalty Accounts</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full cursor-pointer">
            ✕
          </button>
        </div>

        <p className="text-xs text-gray-500 leading-relaxed">
          Link your grocery store loyalty accounts to automatically pull in past purchases, update food inventory costs, and track spending without scanning physical paper receipts.
        </p>

        <div className="space-y-3 pt-2">
          {stores.map((store) => {
            const key = store.name.toLowerCase();
            const isLinked = linkedAccounts[key].linked;
            const isConnecting = linkingStore === store.name;
            const isSyncing = syncingStore === store.name;

            return (
              <div key={store.name} className="p-3.5 bg-gray-50 rounded-2xl border border-gray-200 flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${store.color}`}></span>
                    <h4 className="font-bold text-xs text-gray-900">{store.name}</h4>
                    {isLinked && (
                      <span className="text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                        <CheckCircle className="w-2.5 h-2.5" /> Connected
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-gray-500">{store.desc}</p>
                </div>

                {isLinked ? (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleManualSync(store.name)}
                      disabled={isSyncing}
                      className="p-2 bg-white border border-gray-200 hover:bg-gray-100 text-gray-700 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                      title="Sync Receipts Now"
                    >
                      {isSyncing ? <Loader className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3 text-indigo-600" />}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleOAuthConnect(store.name)}
                    disabled={isConnecting}
                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-1 shrink-0"
                  >
                    {isConnecting ? <Loader className="w-3 h-3 animate-spin" /> : <LinkIcon className="w-3 h-3" />}
                    {isConnecting ? "Connecting..." : "Connect"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default RetailerAccountsModal;