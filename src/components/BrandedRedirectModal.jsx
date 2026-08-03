import React from 'react';
import { ExternalLink, ShieldCheck, X } from 'lucide-react';

export default function BrandedRedirectModal({ isOpen, onClose, partnerData }) {
  if (!isOpen || !partnerData) return null;

  const { title, url, logo, description, sponsorTag } = partnerData;

  const handleContinue = () => {
    window.open(url, '_blank', 'noopener,noreferrer');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 text-white w-full max-w-md rounded-3xl p-6 shadow-2xl relative space-y-5 animate-in slide-in-from-bottom">
        
        {/* Close Button */}
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Header & Badge */}
        <div className="flex flex-col items-center text-center space-y-3 pt-2">
          <div className="w-16 h-16 bg-slate-800 border border-slate-700 rounded-2xl flex items-center justify-center overflow-hidden shadow-inner">
            {logo ? (
              <img src={logo} alt={title} className="w-full h-full object-cover" />
            ) : (
              <ExternalLink className="w-8 h-8 text-amber-400" />
            )}
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-bold uppercase tracking-wider mb-2">
              <ShieldCheck className="w-3 h-3" /> {sponsorTag || 'Verified Partner'}
            </div>
            <h3 className="text-lg font-bold text-white">Leaving Pantry Chef</h3>
            <p className="text-xs text-slate-400 mt-1">
              You are now being safely redirected to <strong className="text-white">{title}</strong> to complete your action.
            </p>
          </div>
        </div>

        {/* Description / Perks Box */}
        {description && (
          <div className="p-3 bg-slate-800/40 rounded-2xl border border-slate-800 text-xs text-slate-300 text-center leading-relaxed">
            {description}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition-colors cursor-pointer"
          >
            Stay Here
          </button>
          <button
            onClick={handleContinue}
            className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <span>Proceed to {title}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </div>
  );
}