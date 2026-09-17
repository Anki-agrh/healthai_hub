import { useState, Suspense, useRef, useEffect, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import { Mic, Square, Trash2, Send, Camera, Volume2 } from "lucide-react";
import { Canvas } from '@react-three/fiber';
import { OrbitControls, ContactShadows, Environment, Center, Stage } from '@react-three/drei';
import HumanModel from '../components/HumanModel';


const API = process.env.REACT_APP_API || "https://healthai-hub.onrender.com";

function AiChat() {
  const [symptoms, setSymptoms] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedPart, setSelectedPart] = useState("");
  const [pointerPos, setPointerPos] = useState(null);

  const defaultWelcome = [{
    role: "system-welcome",
    text: "Hey, I am your AI Health Assistant and I am not a doctor. I am here to assist you. Please consult the doctor in emergency conditions. You can type your symptoms here or pinpoint the location of the issue in the 3D model. Thank you!"
  }];

  // ✅ PERSISTENCE: Load chat history from localStorage
  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem('ai_chat_history');
      return saved ? JSON.parse(saved) : defaultWelcome;
    } catch {
      return defaultWelcome;
    }
  });
  const chatEndRef = useRef(null);

  // ✅ PERSISTENCE: Save chat history to localStorage whenever messages change
  useEffect(() => {
    localStorage.setItem('ai_chat_history', JSON.stringify(messages));
  }, [messages]);

  // Clear chat function
  const clearChat = useCallback(() => {
    setMessages(defaultWelcome);
    localStorage.removeItem('ai_chat_history');
  }, []);

  // --- NEW: Web Speech & Model Toggle States ---
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (SpeechRecognition && !recognitionRef.current) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.lang = 'en-US';
      recognitionRef.current.onresult = (event) => {
        const newTranscript = event.results[0][0].transcript;
        setSymptoms(prev => (prev ? prev + " " : "") + newTranscript);
        setIsListening(false);
      };
      recognitionRef.current.onerror = () => setIsListening(false);
      recognitionRef.current.onend = () => setIsListening(false);
    }
  }, [SpeechRecognition]);

  const toggleListen = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  const speakText = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const cleanText = text.replace(/[*_#`~]/g, '');
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };


  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(() => { scrollToBottom(); }, [messages]);

  // ✅ Updated logic to handle 3D Depth (Z-axis) and Scaling
  const handlePartClick = (data) => {
    if (!data) return;
    const { x, y, z } = data; // Using local coordinates from HumanModel
    setPointerPos([x, y, z]);

    // 1. Depth Check: Z > 0 is Front, Z < 0 is Back
    const isFront = z >= 0; 
    const side = x > 0.5 ? "Right" : x < -0.5 ? "Left" : "Central";
    let organArea = "Torso";

    // 2. Extracted Arms/Hands logic across multiple Y heights based on A-pose width
    if (Math.abs(x) > 2.5 && y > 6.0 && y < 16.5) {
        organArea = y > 12.0 ? `${side} Shoulder/Upper Arm` : `${side} Forearm/Hand`;
    } 
    // 3. Central Body Core Mapping
    else if (y > 19.0) {
        organArea = "Head/Cranium";
    } else if (y > 18.2) {
        organArea = isFront ? "Eyes/Face" : "Back of Head";
    } else if (y > 17.0) {
        organArea = isFront ? "Neck/Throat" : "Back of Neck";
    } else if (y > 13.0) {
        organArea = isFront ? (x > 0.8 ? "Right Chest" : x < -0.8 ? "Left Chest" : "Center Chest") : "Upper Back";
    } else if (y > 11.0) {
        organArea = isFront ? "Abdominal Area" : "Middle Back/Spine";
    } else if (y > 10.2) {
        organArea = isFront ? "Pelvic/Groin" : "Lower Back/Lumbar";
    } else if (y > 6.5) {
        organArea = `${side} Thigh/Upper Leg`;
    } else if (y > 4.0) {
        organArea = `${side} Knee`;
    } else {
        organArea = `${side} Calf/Foot`;
    }

    const finalLocation = `${isFront ? "Front" : "Back"} ${organArea}`;
    setSelectedPart(finalLocation);

    // 3. Trigger AI Immediately on Click
    const autoPrompt = `SYSTEM CONTEXT: The user clicked the ${finalLocation}. Acknowledge this specific spot. Ask 3 follow-up questions about the nature of pain (sharp, dull, throbbing).`;
    analyze(autoPrompt, finalLocation); 
  };

  // ✅ Updated to accept an instantPrompt for clicks and locationName to fix state lag
  const analyze = async (instantPrompt = null, locationName = null) => {
    const currentInput = instantPrompt || symptoms;
    if (!currentInput && !file) return;

    setLoading(true);
    
    // UI: Display 'Pinpoint' if triggered by 3D click, else show typed text
    const displayMsg = instantPrompt ? `Pinpoint: ${locationName || selectedPart}` : symptoms;
    setMessages(prev => [...prev, { role: "user", text: displayMsg }]);

    setSymptoms(""); // Clear input bar immediately

    try {
      let res;
      if (file) {
        const formData = new FormData();
        formData.append("report", file);
        res = await fetch(`${API}/api/ai/analyze-report`, { method: "POST", body: formData });
      } else {
        res = await fetch(`${API}/api/ai/symptom-check`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ symptoms: currentInput }),
        });
      }

      const data = await res.json();
      if (data.success) {
        setMessages(prev => [...prev, { role: "ai", text: data.result }]);
        speakText(data.result);
      } else {
        setMessages(prev => [...prev, { role: "ai", text: data.message || "AI encountered an error." }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: "ai", text: "AI is offline. Please check backend." }]);
    } finally {
      setLoading(false);
      setFile(null);
    }
  };

  return (
    <div className="max-w-[1300px] mx-auto flex flex-col lg:flex-row gap-6 p-5 h-auto lg:h-[88vh]">
      
      {/* --- LEFT SIDE: 3D MODEL --- */}
      <div className="flex-[1.2] bg-slate-50 dark:bg-slate-900 rounded-2xl overflow-hidden relative border border-slate-200 dark:border-slate-700 min-h-[400px] md:min-h-[auto]">
        
        {/* pointer-events: none ensures this doesn't block clicks */}
        <div className="absolute top-5 left-5 z-10 bg-white dark:bg-slate-800 px-5 py-2.5 rounded-full border-2 border-accent font-bold pointer-events-none text-slate-800 dark:text-slate-200 shadow-md">
          Target: {selectedPart || "Select Location"}
        </div>
    
        <Canvas shadows camera={{ position: [0, 0, 45], fov: 45 }} className="w-full h-full mt-10 md:mt-0">
          <Suspense fallback={null}>
            <ambientLight intensity={0.5} />
            <Stage environment="city" intensity={0.6} contactShadow={true}>
              <Center>
                <HumanModel onPartClick={handlePartClick} pointerPos={pointerPos} gender="Male" />
              </Center>
            </Stage>
          </Suspense>
          <OrbitControls makeDefault />
        </Canvas>
      </div>

      {/* --- RIGHT SIDE: CHAT INTERFACE --- */}
      <div className="flex-1 flex flex-col bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-700 relative overflow-hidden h-[600px] lg:h-auto">
        
        {isSpeaking && (
          <div 
            className="absolute top-[70px] right-5 flex items-center gap-2 bg-accent/90 text-white px-4 py-2 rounded-full text-xs z-10 animate-pulse cursor-pointer shadow-md" 
            onClick={stopSpeaking}
          >
            <Volume2 size={16} /> AI is speaking (Click to Stop)
          </div>
        )}

        <div className="p-4 md:px-5 md:py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-white dark:bg-slate-800 z-10">
          <h2 className="m-0 text-accent text-[1.15rem] font-bold">HealthAI Consultant</h2>
          <button
            onClick={clearChat}
            className="flex items-center gap-1.5 bg-red-500/10 border border-slate-200 dark:border-slate-700 text-danger px-3.5 py-1.5 rounded-lg cursor-pointer text-xs font-semibold transition-all hover:bg-red-500/20"
            title="Clear chat history"
          >
            <Trash2 size={14} /> Clear
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 bg-slate-50 dark:bg-slate-900 flex flex-col gap-3">
          {messages.length === 0 && <p className="text-center text-slate-400 mt-[40%]">Pinpoint pain on the model or type below.</p>}
          {messages.map((msg, i) => (
            <div key={i} className={`max-w-[85%] px-4 py-3 rounded-2xl prose prose-sm dark:prose-invert ${msg.role === "user" ? "self-end bg-accent text-white rounded-br-sm" : "self-start bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-bl-sm shadow-sm"}`}>
              <ReactMarkdown>{msg.text}</ReactMarkdown>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        <div className="p-4 md:p-5 border-t border-slate-100 dark:border-slate-700 flex items-center gap-2 md:gap-2.5 bg-white dark:bg-slate-800">
          <label className="cursor-pointer flex items-center hover:scale-110 transition-transform">
            <Camera className="text-accent" size={28} />
            <input type="file" hidden onChange={(e) => setFile(e.target.files[0])} />
          </label>
          
          <button 
            onClick={toggleListen}
            className={`w-10 h-10 md:w-11 md:h-11 rounded-full cursor-pointer flex items-center justify-center transition-colors border-none shrink-0 ${isListening ? "bg-danger text-white" : "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600"}`}
            title="Speech to Text"
          >
            {isListening ? <Square size={20} fill="currentColor" /> : <Mic size={20} />}
          </button>

          <input 
            placeholder={file ? `Attached: ${file.name}` : isListening ? "Listening..." : "Describe symptoms..."}
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && analyze()}
            className="flex-1 px-4 py-2.5 md:py-3 rounded-full border border-slate-200 dark:border-slate-600 outline-none bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:border-accent transition-colors"
          />
          <button onClick={() => analyze()} disabled={loading} className="bg-accent text-white border-none w-10 h-10 md:w-11 md:h-11 rounded-full cursor-pointer flex items-center justify-center hover:bg-accent-hover disabled:opacity-70 transition-colors shrink-0">
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default AiChat;