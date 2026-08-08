const SubscriptionModal = ({ onClose }) => (
  <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-in fade-in">
    <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom">
      <div className="bg-indigo-600 p-6 text-center text-white">
        <Crown className="w-12 h-12 mx-auto mb-2 text-yellow-300" />
        <h2 className="text-2xl font-black">Upgrade to Pro</h2>
        <p className="text-indigo-200 text-sm">
          Unlock the full kitchen experience
        </p>
      </div>
      <div className="p-6 space-y-4">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-500" />{" "}
            <span className="text-sm font-medium">
              Unlimited AI Recipe Generation
            </span>
          </div>
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-500" />{" "}
            <span className="text-sm font-medium">
              Receipt Scanning & Auto-Budget
            </span>
          </div>
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-500" />{" "}
            <span className="text-sm font-medium">
              Deal Hunter (Coupons & Sales)
            </span>
          </div>
        </div>
        <button className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl shadow-lg hover:bg-indigo-700 transform active:scale-95 transition-all cursor-pointer">
          Subscribe for $4.99/mo
        </button>
        <button
          onClick={onClose}
          className="w-full py-2 text-gray-400 text-xs font-bold cursor-pointer"
        >
          No thanks, maybe later
        </button>
      </div>
    </div>
  </div>
);