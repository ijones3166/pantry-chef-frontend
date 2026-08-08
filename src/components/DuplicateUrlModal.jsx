// 👉 LANDMARK: Duplicate URL Resolution Modal for Regular Users
const DuplicateUrlModal = ({ matchData, onClose, onViewExisting, onForceUpload }) => {
  if (!matchData) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-[80] flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl space-y-4 animate-in slide-in-from-bottom">
        <div className="flex justify-between items-center border-b pb-2">
          <h3 className="font-black text-base text-gray-900 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-500" /> Recipe Already Exists
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full cursor-pointer">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="space-y-2">
          <p className="text-xs text-gray-600 leading-relaxed">
            This recipe URL is already in our community database:
          </p>
          <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 space-y-1">
            <p className="text-xs font-bold text-gray-900 truncate">{matchData.title}</p>
            <a 
              href={matchData.sourceUrl} 
              target="_blank" 
              rel="noreferrer" 
              className="text-[10px] text-blue-500 font-mono truncate block hover:underline"
            >
              {matchData.sourceUrl}
            </a>
          </div>
        </div>

        <div className="space-y-2 pt-2">
          <button
            onClick={() => {
              onViewExisting(matchData);
              onClose();
            }}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm cursor-pointer transition-colors"
          >
            👀 View Existing Recipe
          </button>
          
          <button
            onClick={() => {
              onForceUpload();
              onClose();
            }}
            className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl cursor-pointer transition-colors"
          >
            ➕ Upload New Version Anyway
          </button>

          <button
            onClick={onClose}
            className="w-full py-2 text-gray-400 hover:text-gray-600 text-xs font-bold cursor-pointer"
          >
            Close Completely
          </button>
        </div>
      </div>
    </div>
  );
};