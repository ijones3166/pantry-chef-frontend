import React, { useState } from "react";
import { AlertOctagon, X, CheckCircle, Loader } from "lucide-react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

const ReportRecipeModal = ({ recipe, onClose, effectiveUserId, db, appId }) => {
  const [reason, setReason] = useState("Inappropriate Content");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await addDoc(collection(db, `/artifacts/${appId}/public/data/recipeReports`), {
        recipeId: recipe.id || recipe.firestoreId || "unknown",
        recipeTitle: recipe.title,
        recipeAuthor: recipe.authorName || "Unknown",
        reportedBy: effectiveUserId || "anonymous",
        reason,
        details: details.trim(),
        timestamp: serverTimestamp(),
        status: "pending"
      });
      setSubmitted(true);
      setTimeout(() => onClose(), 2000);
    } catch (err) {
      console.error("Failed to submit report:", err);
      alert("Error submitting report. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[75] flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl space-y-4 animate-in slide-in-from-bottom">
        <div className="flex justify-between items-center border-b pb-2">
          <h3 className="font-bold text-base text-gray-900 flex items-center gap-2">
            <AlertOctagon className="w-5 h-5 text-red-500" /> Report Recipe
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full cursor-pointer">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {submitted ? (
          <div className="text-center py-6 space-y-2">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
            <h4 className="font-bold text-gray-800">Report Received</h4>
            <p className="text-xs text-gray-500">Thank you for helping keep our community safe.</p>
          </div>
        ) : (
          <form onSubmit={handleReportSubmit} className="space-y-3">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Reason for Flagging</label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium outline-none cursor-pointer"
              >
                <option value="Inappropriate Content">Inappropriate or Offensive Content</option>
                <option value="Dangerous Instructions">Dangerous Cooking Instructions / Hazard</option>
                <option value="Copyright Infringement">Copyright Infringement / Stolen Recipe</option>
                <option value="Spam / Misleading">Spam or Misleading Information</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Additional Details (Optional)</label>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Provide any extra context..."
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:border-indigo-500 h-20 resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              {submitting ? <Loader className="w-4 h-4 animate-spin" /> : <AlertOctagon className="w-4 h-4" />}
              Submit Report for Review
            </button>
          </form>
        )}
      </div>
    </div>
  );
};


export default ReportRecipeModal;