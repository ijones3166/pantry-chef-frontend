const PermissionPromptModal = ({ type, isOpen, onClose, onGrant }) => {
  if (!isOpen) return null;

  const isCamera = type === 'camera';

  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl text-center space-y-4 animate-in slide-in-from-bottom">
        <div className={`w-14 h-14 rounded-2xl mx-auto flex items-center justify-center text-2xl shadow-inner ${
          isCamera ? "bg-indigo-50 text-indigo-600" : "bg-purple-50 text-purple-600"
        }`}>
          {isCamera ? "📷" : "🎤"}
        </div>

        <div className="space-y-1">
          <h3 className="font-black text-lg text-gray-900">
            {isCamera ? "Camera Access Required" : "Microphone Access Required"}
          </h3>
          <p className="text-xs text-gray-500 leading-relaxed">
            {isCamera 
              ? "Pantry Chef needs camera access to quickly scan paper receipts and bulk grocery items straight into your inventory."
              : "Pantry Chef uses your microphone to let you add pantry stock and shopping list items entirely hands-free using voice commands."}
          </p>
        </div>

        <div className="flex gap-2 pt-2">
          <button
            onClick={onClose}
            className="flex-1 py-3 text-gray-500 font-bold text-xs bg-gray-100 rounded-xl cursor-pointer hover:bg-gray-200 transition-colors"
          >
            Not Now
          </button>
          <button
            onClick={onGrant}
            className={`flex-1 py-3 text-white rounded-xl font-bold text-xs shadow-md cursor-pointer transition-colors ${
              isCamera ? "bg-indigo-600 hover:bg-indigo-700" : "bg-purple-600 hover:bg-purple-700"
            }`}
          >
            Allow Access
          </button>
        </div>
      </div>
    </div>
  );
};


export default PermissionPromptModal;