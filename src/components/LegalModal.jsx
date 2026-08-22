import React, { useState } from "react";
import { X, Shield, BookOpen } from "lucide-react";

function LegalModal({ onClose }) {
  const [legalTab, setLegalTab] = useState("tos");

  return (
    <div className="fixed inset-0 bg-black/60 z-[85] flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh] animate-in slide-in-from-bottom">
        
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-600" />
            <h3 className="font-black text-base text-gray-900">Legal & Compliance</h3>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-200 rounded-full cursor-pointer">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Sub-tabs */}
        <div className="flex bg-gray-100 p-1 text-xs font-bold shrink-0 gap-1">
          {[
            { id: "tos", label: "Terms of Service" },
            { id: "privacy", label: "Privacy Policy" },
            { id: "disclosures", label: "Affiliate & Health" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setLegalTab(tab.id)}
              className={`flex-1 py-2 rounded-lg transition-all cursor-pointer ${
                legalTab === tab.id ? "bg-white shadow text-indigo-600" : "text-gray-500 hover:text-gray-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs text-gray-600 leading-relaxed">
          {legalTab === "tos" && (
            <div className="space-y-3">
              <h4 className="font-bold text-gray-900 text-sm">1. Terms of Service & UGC License Grant</h4>
              <p>
                Welcome to PantryChef. By accessing or using our platform, you agree to be bound by these Terms.
              </p>
              <p className="font-bold text-gray-800">User-Generated Content (UGC) License Grant:</p>
              <p>
                By posting, uploading, or sharing recipes, images, or text ("Content") to PantryChef, you grant PantryChef and its operators a perpetual, worldwide, non-exclusive, royalty-free, transferable license to use, reproduce, modify, adapt, publish, and display such Content for the operation, promotion, and improvement of the platform.
              </p>
              <p>
                You warrant that you own or have the necessary rights to share any recipes or photos you upload and that they do not violate community guidelines or third-party copyright.
              </p>
            </div>
          )}

          {legalTab === "privacy" && (
            <div className="space-y-3">
              <h4 className="font-bold text-gray-900 text-sm">2. Privacy Policy & Data Usage</h4>
              <p>
                PantryChef respects your privacy. We collect account credentials (such as email via Firebase Authentication), pantry inventory data, and usage metrics solely to provide and synchronize your kitchen management experience across your devices.
              </p>
              <p>
                We do not sell, rent, or trade your personal information to third-party data brokers. Analytics data is aggregated anonymously to measure app performance and feature adoption.
              </p>
            </div>
          )}

          {legalTab === "disclosures" && (
            <div className="space-y-3">
              <h4 className="font-bold text-gray-900 text-sm">3. FTC Affiliate Disclosures & Health Disclaimers</h4>
              <p className="font-bold text-gray-800">FTC Affiliate Disclosure:</p>
              <p>
                In compliance with FTC guidelines, please assume that community links, brand partner specials (such as HelloFresh or Walmart), and recommended kitchen gear (affiliate product cards) may result in PantryChef receiving a small commission or referral fee at no additional cost to you.
              </p>
              <p className="font-bold text-gray-800">Allergy & Nutritional Disclaimer:</p>
              <p>
                AI-generated recipes, ingredient substitutes, and nutritional calculations (calories, protein, carbs, fats) are provided for <strong>informational and estimation purposes only</strong>. PantryChef is not a medical or nutritional advisory service. Always verify allergen information independently before cooking or consuming food, especially if you have severe food allergies or medical dietary constraints.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t text-center shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm cursor-pointer"
          >
            I Understand & Agree
          </button>
        </div>

      </div>
    </div>
  );
}


export default LegalModal;