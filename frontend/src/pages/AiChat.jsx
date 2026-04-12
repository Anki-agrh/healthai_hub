import { useState, Suspense, useRef, useEffect, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import { Mic, Square, Trash2, Send, Camera, Volume2 } from "lucide-react";
import { Canvas } from '@react-three/fiber';
import { OrbitControls, ContactShadows, Environment, Center, Stage } from '@react-three/drei';
import HumanModel from '../components/HumanModel';
import "./AiChat.css";

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
    <div style={{ maxWidth: "1300px", margin: "20px auto", display: "flex", gap: "25px", padding: "20px", height: "88vh" }}>
      
      {/* --- LEFT SIDE: 3D MODEL --- */}
      <div style={{ flex: 1.2, background: "var(--bg-secondary, #f8fafc)", borderRadius: "16px", overflow: "hidden", position: "relative", border: "1px solid var(--border-color, #e2e8f0)" }}>
        
        {/* pointer-events: none ensures this doesn't block clicks */}
        <div style={{ position: "absolute", top: "20px", left: "20px", zIndex: 10, background: "var(--card-bg, white)", padding: "10px 20px", borderRadius: "30px", border: "2px solid var(--accent, #0a4db8)", fontWeight: "bold", pointerEvents: "none", color: "var(--text-primary, #1e293b)" }}>
          Target: {selectedPart || "Select Location"}
        </div>

    
        <Canvas shadows camera={{ position: [0, 0, 45], fov: 45 }}>
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
      <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "var(--card-bg, white)", borderRadius: "16px", boxShadow: "var(--shadow-lg, 0 10px 25px rgba(0,0,0,0.1))", border: "1px solid var(--border-color, #eee)", position: "relative" }}>
        
        {isSpeaking && (
          <div style={{ position: "absolute", top: "70px", right: "20px", display: "flex", alignItems: "center", gap: "8px", background: "rgba(10, 77, 184, 0.9)", color: "white", padding: "8px 15px", borderRadius: "20px", fontSize: "12px", zIndex: 5, animation: "pulse 1.5s infinite", cursor: "pointer" }} onClick={stopSpeaking}>
            <Volume2 size={16} /> AI is speaking (Click to Stop)
          </div>
        )}

        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border-color, #f1f5f9)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h2 style={{ margin: 0, color: "var(--accent, #0a4db8)", fontSize: "1.15rem" }}>HealthAI Consultant</h2>
          <button
            onClick={clearChat}
            style={{ display: "flex", alignItems: "center", gap: "5px", background: "var(--accent-light, rgba(239, 68, 68, 0.08))", border: "1px solid var(--border-color, #e2e8f0)", color: "var(--danger, #ef4444)", padding: "6px 14px", borderRadius: "8px", cursor: "pointer", fontSize: "0.8rem", fontWeight: 600, transition: "all 0.2s" }}
            title="Clear chat history"
          >
            <Trash2 size={14} /> Clear
          </button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "20px", background: "var(--bg-primary, #fdfdfd)", display: "flex", flexDirection: "column", gap: "12px" }}>
          {messages.length === 0 && <p style={{ textAlign: "center", color: "#999", marginTop: "40%" }}>Pinpoint pain on the model or type below.</p>}
          {messages.map((msg, i) => (
            <div key={i} style={{ 
              alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
              maxWidth: "85%", padding: "12px 16px", borderRadius: "15px",
              background: msg.role === "user" ? "var(--accent, #0a4db8)" : "var(--bg-secondary, #f1f3f5)",
              color: msg.role === "user" ? "white" : "var(--text-primary, #333)"
            }}>
              <ReactMarkdown>{msg.text}</ReactMarkdown>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        <div style={{ padding: "20px", borderTop: "1px solid var(--border-color, #f1f5f9)", display: "flex", alignItems: "center", gap: "10px" }}>
          <label style={{ cursor: "pointer", display: "flex", alignItems: "center" }}>
            <Camera color="var(--accent, #0a4db8)" size={28} />
            <input type="file" hidden onChange={(e) => setFile(e.target.files[0])} />
          </label>
          
          <button 
            onClick={toggleListen}
            style={{ background: isListening ? "var(--danger, #ef4444)" : "var(--bg-secondary, #f1f5f9)", color: isListening ? "white" : "var(--text-secondary, #64748b)", border: "none", width: "45px", height: "45px", borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "0.2s" }}
            title="Speech to Text"
          >
            {isListening ? <Square size={20} fill="currentColor" /> : <Mic size={20} />}
          </button>

          <input 
            placeholder={file ? `Attached: ${file.name}` : isListening ? "Listening..." : "Describe symptoms..."}
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && analyze()}
            style={{ flex: 1, padding: "12px 20px", borderRadius: "25px", border: "1px solid var(--border-color, #e2e8f0)", outline: "none", background: "var(--input-bg, white)", color: "var(--text-primary, #333)" }}
          />
          <button onClick={() => analyze()} disabled={loading} style={{ background: "var(--accent, #0a4db8)", color: "white", border: "none", width: "45px", height: "45px", borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default AiChat;