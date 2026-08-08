// --- FEEDBACK MODAL COMPONENT ---
const FeedbackModal = ({ onClose, effectiveUserId, db, appId }) => {
  const [feedbackType, setFeedbackType] = useState("bug");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    setIsSubmitting(true);

    try {
      await addDoc(collection(db, `/artifacts/${appId}/public/data/feedback`), {
        userId: effectiveUserId || "anonymous",
        type: feedbackType,
        message: message.trim(),
        userAgent: navigator.userAgent,
        timestamp: serverTimestamp(),
      });
      setSubmitted(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      console.error("Failed to submit feedback:", err);
      alert("Error sending feedback. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-black text-lg text-gray-900 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-indigo-600" /> Trial Feedback
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full cursor-pointer">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {submitted ? (
          <div className="text-center py-8 space-y-2">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
            <h4 className="font-bold text-gray-800">Thank You!</h4>
            <p className="text-xs text-gray-500">Your feedback has been logged for review.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Feedback Type</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFeedbackType("bug")}
                  className={`py-2 rounded-xl text-xs font-bold border ${
                    feedbackType === "bug" ? "bg-red-50 border-red-200 text-red-700" : "bg-gray-50 text-gray-600 cursor-pointer"
                  }`}
                >
                  🐛 Report Bug
                </button>
                <button
                  type="button"
                  onClick={() => setFeedbackType("feature")}
                  className={`py-2 rounded-xl text-xs font-bold border ${
                    feedbackType === "feature" ? "bg-indigo-50 border-indigo-200 text-indigo-700" : "bg-gray-50 text-gray-600 cursor-pointer"
                  }`}
                >
                  💡 Suggestion
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe the bug or share your idea..."
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:border-indigo-500 outline-none h-24 resize-none"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-indigo-700 transition-colors cursor-pointer"
            >
              {isSubmitting ? <Loader className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              Submit Feedback
            </button>
          </form>
        )}
      </div>
    </div>
  );
};