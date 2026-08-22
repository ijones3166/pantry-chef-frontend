import React from "react";
import { X, Lock, Sparkles } from "lucide-react";


// 👉 LANDMARK: Soft-Gated Upsell Modal Component (#28.7)
const SoftGateModal = ({ isOpen, onClose, featureContext = "save recipes & sync your pantry" }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-[90] flex items-end sm:items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom">
        <div className="p-6 text-center space-y-4">
          
          <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <Crown className="w-8 h-8 text-indigo-600" />
          </div>

          <div className="space-y-1">
            <h3 className="text-xl font-black text-gray-900">
              Unlock Full Access
            </h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Create a free account to <span className="font-bold text-indigo-600">{featureContext}</span>, protect your data, and unlock zero-waste analytics.
            </p>
          </div>

          <div className="space-y-2.5 pt-2">
            <button
              onClick={() => {
                onClose();
                window.dispatchEvent(new CustomEvent("openLoginModal"));
              }}
              className="w-full py-3.5 bg-indigo-600 text-white font-bold text-xs rounded-xl shadow-md hover:bg-indigo-700 transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4" /> Sign In / Create Free Account
            </button>
            
            <button
              onClick={onClose}
              className="w-full py-2.5 bg-gray-50 text-gray-500 font-bold text-xs rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
            >
              Continue as Guest
            </button>
          </div>

        </div>
        
        <div className="bg-gray-50 p-3 text-center border-t border-gray-100 text-[10px] text-gray-400">
          No credit card required • Free forever tier available
        </div>
      </div>
    </div>
  );
};

export default SoftGateModal;