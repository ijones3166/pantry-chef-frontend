import React, { useState } from "react";
import { ChefHat, Loader } from "lucide-react";
import { getAuth, GoogleAuthProvider, signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";

function LoginModal({ onClose, onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);

  const auth = getAuth();

  const handleGoogleLogin = async () => {
    if (!auth) return alert("Firebase not connected.");
    try {
      setLoading(true);
      const provider = new GoogleAuthProvider();
      
      // Back to popup, no more 404 redirect loops!
      await signInWithPopup(auth, provider);
      onLogin();
      
    } catch (err) {
      console.error("Google Auth Error:", err);
      alert(err.message);
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    if (!auth) return alert("Firebase not connected.");
    if (!email || !password) return;
    try {
      setLoading(true);
      if (isRegistering) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      onLogin();
    } catch (err) {
      console.error("Email Auth Error:", err);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom">
        <div className="p-6 text-center">
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ChefHat className="w-8 h-8 text-indigo-600" />
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-2">
            {isRegistering ? "Create Account" : "Welcome Back"}
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            Sync your pantry across devices and never lose your streak.
          </p>

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full py-3 mb-4 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors shadow-sm cursor-pointer"
          >
            <div className="w-4 h-4 rounded-full bg-red-500"></div>
            Continue with Google
          </button>

          <div className="relative flex py-2 items-center mb-4">
            <div className="flex-grow border-t border-gray-200"></div>
            <span className="flex-shrink mx-4 text-gray-400 text-[10px] uppercase font-bold">Or email</span>
            <div className="flex-grow border-t border-gray-200"></div>
          </div>

          <form onSubmit={handleEmailAuth} className="space-y-3">
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-indigo-500"
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-indigo-500"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-md hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? <Loader className="w-4 h-4 animate-spin" /> : (isRegistering ? "Sign Up" : "Sign In")}
            </button>
          </form>

          <button
            onClick={() => setIsRegistering(!isRegistering)}
            className="text-xs text-indigo-600 font-bold mt-4 hover:underline cursor-pointer"
          >
            {isRegistering ? "Already have an account? Sign In" : "Need an account? Sign Up"}
          </button>

        </div>
        <div className="bg-gray-50 p-4 text-center border-t border-gray-100">
          <button onClick={onClose} className="text-xs font-bold text-gray-500 cursor-pointer">
            Continue as Guest
          </button>
        </div>
      </div>
    </div>
  );
}


export default LoginModal;