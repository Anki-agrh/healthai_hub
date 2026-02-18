import { useState, Suspense, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { Canvas } from '@react-three/fiber';
import { OrbitControls, ContactShadows, Environment, Center, Stage } from '@react-three/drei';
import HumanModel from '../components/HumanModel';

function AiChat() {
  const [symptoms, setSymptoms] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedPart, setSelectedPart] = useState("");
  const [pointerPos, setPointerPos] = useState(null);
  const [messages, setMessages] = useState([
    { 
      role: "system-welcome", 
      text: "Hey, I am your AI Health Assistant and I am not a doctor. I am here to assist you. Please consult the doctor in emergency conditions. You can type your symptoms here or pinpoint the location of the issue in the 3D model. Thank you!" 
    }
  ]);
  const chatEndRef = useRef(null);

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

    // 2. Calibrated Height Mapping (Matches your Y: 10-20 scale)
    if (y > 18.5) {
        organArea = "Head/Cranium";
    } else if (y > 16.5) {
        organArea = isFront ? `${side} Face/Eye area` : "Back of Head";
    } else if (y > 14.8) {
        organArea = isFront ? "Neck/Throat" : "Cervical Spine/Upper Back";
    } else if (y > 11.5) {
        if (Math.abs(x) > 3.0) {
            organArea = `${side} Shoulder`;
        } else {
            organArea = isFront ? (x > 0.8 ? "Right Chest" : "Left Chest (Heart)") : "Upper Back/Scapula";
        }
    } else if (y > 7.0) {
        organArea = isFront ? "Abdominal Area" : "Middle Back/Spine";
    } else if (y > 0) {
        organArea = isFront ? "Pelvic/Groin" : "Lower Back/Lumbar";
    } else {
        organArea = `${side} Leg/Foot`;
    }

    const finalLocation = `${isFront ? "Front" : "Back"} ${organArea}`;
    setSelectedPart(finalLocation);

    // 3. Trigger AI Immediately on Click
    const autoPrompt = `SYSTEM CONTEXT: The user clicked the ${finalLocation}. Acknowledge this specific spot. Ask 3 follow-up questions about the nature of pain (sharp, dull, throbbing).`;
    analyze(autoPrompt); 
  };

  // ✅ Updated to accept an instantPrompt for clicks
  const analyze = async (instantPrompt = null) => {
    const currentInput = instantPrompt || symptoms;
    if (!currentInput && !file) return;

    setLoading(true);
    
    // UI: Display 'Pinpoint' if triggered by 3D click, else show typed text
    const displayMsg = instantPrompt ? `Pinpoint: ${selectedPart}` : symptoms;
    setMessages(prev => [...prev, { role: "user", text: displayMsg }]);

    setSymptoms(""); // Clear input bar immediately

    try {
      let res;
      if (file) {
        const formData = new FormData();
        formData.append("report", file);
        res = await fetch("http://localhost:5000/api/ai/analyze-report", { method: "POST", body: formData });
      } else {
        res = await fetch("http://localhost:5000/api/ai/symptom-check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ symptoms: currentInput }),
        });
      }

      const data = await res.json();
      if (data.success) {
        setMessages(prev => [...prev, { role: "ai", text: data.result }]);
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
      <div style={{ flex: 1.2, background: "#f8fafc", borderRadius: "16px", overflow: "hidden", position: "relative", border: "1px solid #e2e8f0" }}>
        
        {/* pointer-events: none ensures this doesn't block clicks */}
        <div style={{ position: "absolute", top: "20px", left: "20px", zIndex: 10, background: "white", padding: "10px 20px", borderRadius: "30px", border: "2px solid #0a4db8", fontWeight: "bold", pointerEvents: "none" }}>
          Target: {selectedPart || "Select Location"}
        </div>

        <Canvas shadows camera={{ position: [0, 0, 45], fov: 45 }}>
          <Suspense fallback={null}>
            <ambientLight intensity={0.5} />
            <Stage environment="city" intensity={0.6} contactShadow={true}>
              <Center>
                <HumanModel onPartClick={handlePartClick} pointerPos={pointerPos} />
              </Center>
            </Stage>
          </Suspense>
          <OrbitControls makeDefault />
        </Canvas>
      </div>

      {/* --- RIGHT SIDE: CHAT INTERFACE --- */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "white", borderRadius: "16px", boxShadow: "0 10px 25px rgba(0,0,0,0.1)", border: "1px solid #eee" }}>
        <div style={{ padding: "20px", borderBottom: "1px solid #f1f5f9", textAlign: "center" }}>
          <h2 style={{ margin: 0, color: "#0a4db8" }}> HealthAI Consultant</h2>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "20px", background: "#fdfdfd", display: "flex", flexDirection: "column", gap: "12px" }}>
          {messages.length === 0 && <p style={{ textAlign: "center", color: "#999", marginTop: "40%" }}>Pinpoint pain on the model or type below.</p>}
          {messages.map((msg, i) => (
            <div key={i} style={{ 
              alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
              maxWidth: "85%", padding: "12px 16px", borderRadius: "15px",
              background: msg.role === "user" ? "#0a4db8" : "#f1f3f5",
              color: msg.role === "user" ? "white" : "#333"
            }}>
              <ReactMarkdown>{msg.text}</ReactMarkdown>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        <div style={{ padding: "20px", borderTop: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: "10px" }}>
          <label style={{ cursor: "pointer" }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0a4db8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle>
            </svg>
            <input type="file" hidden onChange={(e) => setFile(e.target.files[0])} />
          </label>
          <input 
            placeholder={file ? `Attached: ${file.name}` : "Describe symptoms..."}
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && analyze()}
            style={{ flex: 1, padding: "12px 20px", borderRadius: "25px", border: "1px solid #e2e8f0", outline: "none" }}
          />
          <button onClick={() => analyze()} disabled={loading} style={{ background: "#0a4db8", color: "white", border: "none", width: "45px", height: "45px", borderRadius: "50%", cursor: "pointer" }}>→</button>
        </div>
      </div>
    </div>
  );
}

export default AiChat;