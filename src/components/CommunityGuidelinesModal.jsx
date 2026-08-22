import React from "react";
import { X, ShieldCheck, User, Users } from "lucide-react";

function CommunityGuidelinesModal({ onClose }) {
  return (
    <div className="fixed inset-0 bg-black/60 z-[85] flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh] animate-in slide-in-from-bottom">
        
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            <h3 className="font-black text-base text-gray-900">Community Guidelines</h3>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-200 rounded-full cursor-pointer">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs text-gray-600 leading-relaxed">
          <div className="space-y-2">
            <h4 className="font-bold text-gray-900 text-sm">Welcome to the PantryChef Community!</h4>
            <p>
              Our goal is to create a safe, helpful, and inspiring space for home cooks to share recipes, reduce food waste, and support each other. To keep this community thriving, please adhere to the following rules:
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
              <h5 className="font-bold text-gray-800 mb-1">1. Keep it Respectful & Family-Friendly</h5>
              <p>No hate speech, harassment, bullying, or sexually explicit language in recipe titles, descriptions, or private/public notes.</p>
            </div>

            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
              <h5 className="font-bold text-gray-800 mb-1">2. Accurate & Safe Instructions</h5>
              <p>Do not post dangerous cooking instructions, toxic ingredient combinations, or intentionally misleading information that could cause foodborne illness or physical harm.</p>
            </div>

            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
              <h5 className="font-bold text-gray-800 mb-1">3. Original or Attributed Content</h5>
              <p>Share recipes you have created, adapted, or have the legal right to share. Do not plagiarize copyrighted commercial recipes wholesale without attribution.</p>
            </div>

            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
              <h5 className="font-bold text-gray-800 mb-1">4. No Spam or Unauthorized Promotion</h5>
              <p>Unsolicited commercial spam, fake affiliate link stuffing, or misleading promotional posts will be removed immediately.</p>
            </div>
          </div>

          <p className="text-[11px] text-gray-400 italic pt-2">
            Violating these guidelines may result in your shared recipes being removed and your account privileges suspended.
          </p>
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t text-center shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm cursor-pointer"
          >
            Got It, Thanks!
          </button>
        </div>

      </div>
    </div>
  );
}


export default CommunityGuidelinesModal;