import React, { useEffect, useRef, useState } from "react";
import { Mic, MicOff, Loader, Volume2 } from "lucide-react";



// NEW: Voice Input Widget
const VoiceInputWidget = ({ onVoiceSubmit, isProcessing, layout = "full" }) => {
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState("");
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = () => { setIsListening(true); setInterimText(""); };
    recognition.onresult = (event) => {
      let finalTranscript = "";
      let currentInterim = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) finalTranscript += event.results[i][0].transcript;
        else currentInterim += event.results[i][0].transcript;
      }
      setInterimText(currentInterim);
      if (finalTranscript) onVoiceSubmit(finalTranscript);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;

    return () => { if (recognitionRef.current) recognitionRef.current.stop(); };
  }, [onVoiceSubmit]);

  const toggleListening = () => {
    if (isListening) recognitionRef.current?.stop();
    else recognitionRef.current?.start();
  };

  if (!window.SpeechRecognition && !window.webkitSpeechRecognition) return null;

  return (
    <div className={`flex flex-col items-center ${layout === "full" ? "gap-2" : ""}`}>
      <button
        type="button"
        onClick={toggleListening}
        disabled={isProcessing}
        className={`transition-all transform flex items-center justify-center cursor-pointer ${
          layout === "full" ? "p-4 rounded-full shadow-lg" : "p-3 rounded-xl border border-gray-200"
        } ${
          isListening
            ? "bg-red-500 text-white animate-pulse scale-105"
            : isProcessing
            ? "bg-gray-200 text-gray-400 cursor-not-allowed"
            : "bg-indigo-600 text-white hover:bg-indigo-700"
        }`}
      >
        <Volume2 className={layout === "full" ? "w-6 h-6" : "w-4 h-4"} />
      </button>
      {layout === "full" && (
        <div className="h-4 text-[10px] font-bold text-gray-500 text-center px-4">
          {isListening ? (interimText || "Listening...") : isProcessing ? "Parsing inventory..." : "Tap to speak"}
        </div>
      )}
    </div>
  );
};


export default VoiceInputWidget;