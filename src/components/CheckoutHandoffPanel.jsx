import React from "react";
import { ShoppingCart, Construction, AlertCircle } from "lucide-react";

export default function CheckoutHandoffPanel({ shoppingListItems = [] }) {
  const itemCount = Array.isArray(shoppingListItems) ? shoppingListItems.length : 0;

  const handleLockedClick = (e, storeName) => {
    e.preventDefault();
    alert(`Checkout integration for ${storeName} is currently under construction and will be live once partner accounts are fully finalized.`);
  };

  return (
    <div className="bg-gradient-to-br from-gray-900 to-gray-950 text-white p-6 rounded-3xl shadow-xl space-y-5 border border-gray-800 opacity-90">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-2xl border border-amber-500/30">
            <Construction className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-black text-base text-white">Cart Checkout & Handoff</h3>
            <p className="text-xs text-gray-400">
              {itemCount > 0 ? `${itemCount} items in current list` : "No items queued"}
            </p>
          </div>
        </div>
        <span className="px-3 py-1 bg-amber-500/20 text-amber-300 text-[10px] font-bold rounded-full border border-amber-500/30 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" /> Under Construction
        </span>
      </div>

      {/* Grayed-Out Retailer Options */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {[
          { name: "Instacart", logo: "🥕", desc: "Same-day delivery handoff" },
          { name: "Walmart", logo: "🛒", desc: "Cart export & store sync" },
          { name: "Target", logo: "🎯", desc: "Drive Up & delivery mapping" },
          { name: "Amazon Fresh", logo: "📦", desc: "Pantry staple reordering" }
        ].map((store) => (
          <div
            key={store.name}
            onClick={(e) => handleLockedClick(e, store.name)}
            className="p-4 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-between opacity-50 cursor-not-allowed hover:bg-white/5 transition-none"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gray-800 flex items-center justify-center text-lg">
                {store.logo}
              </div>
              <div>
                <h4 className="font-bold text-xs text-white">{store.name}</h4>
                <p className="text-[10px] text-gray-400">{store.desc}</p>
              </div>
            </div>
            <span className="text-[9px] font-bold text-amber-400 uppercase tracking-wider bg-amber-400/10 px-2 py-1 rounded-lg">
              Locked
            </span>
          </div>
        ))}
      </div>

      <p className="text-[10px] text-gray-400 text-center italic">
        Merchant checkout and affiliate mapping are temporarily disabled pending final network verification.
      </p>
    </div>
  );
}