import { useNavigate } from "react-router-dom";
import "./Landing.css";

function Landing() {
  const navigate = useNavigate();

  return (
    <div className="landing-page">
      {/* 1. HERO SECTION WITH GLASS OVERLAY */}
      <header className="hero-section">
        <div className="hero-overlay"></div> 
        <div className="hero-content">
          <h1 className="hero-title">Smart Healthcare, <span>Simplified</span></h1>
          <p className="hero-description">
            Consult our AI assistant and Specialized Doctors, generate personalized diet plans, 
            book doctor appointments, and manage your health dashboard in one place.
          </p>
          <div className="hero-actions">
            <button className="main-cta" onClick={() => navigate("/ai")}>Start AI Chat</button>
          </div>
          <p className="medical-disclaimer">
            ⚠️ This platform does not provide medical diagnosis. Please consult a certified doctor.
          </p>
        </div>
      </header>

      {/* 2. FEATURES GRID WITH GLASS CARDS */}
      <section className="features-container">
        <h2 className="features-heading">Our Key Features</h2>
        <div className="features-grid">
          
          <div className="feature-card" onClick={() => navigate("/ai")}>
            <div className="feature-image-box">
               <img src="https://cdn-icons-png.flaticon.com/512/6295/6295417.png" alt="AI Assistant" />
            </div>
            <h3>AI Health Assistant</h3>
            <p>Interactive 3D anatomical model for pinpointing symptoms and reports analyzer.</p>
          </div>

          <div className="feature-card" onClick={() => navigate("/diet")}>
            <div className="feature-image-box">
               <img src="https://cdn-icons-png.flaticon.com/512/3565/3565418.png" alt="Diet Plan" />
            </div>
            <h3>AI Diet Generator</h3>
            <p>Personalized nutrition plans and smart recipe suggestions.</p>
          </div>

          <div className="feature-card" onClick={() => navigate("/nearby-doctors")}>
            <div className="feature-image-box">
               <img src="https://cdn-icons-png.flaticon.com/512/3209/3209063.png" alt="Nearby Doctors" />
            </div>
            <h3>Nearby Healthcare</h3>
            <p>Live mapping of doctors and hospitals within 10km.</p>
          </div>

          <div className="feature-card" onClick={() => navigate("/consult")}>
            <div className="feature-image-box">
               <img src="https://cdn-icons-png.flaticon.com/512/921/921079.png" alt="consult" />
            </div>
            <h3>Consult Doctors</h3>
            <p>One-tap doctor-consultation and specialized support.</p>
          </div>

          <div className="feature-card" onClick={() => navigate("/queue")}>
            <div className="feature-image-box">
               <img src="https://cdn-icons-png.flaticon.com/512/1000/1000997.png" alt="queue" />
            </div>
            <h3>Med Records / Queue</h3>
            <p>Reduce waiting time with smart queues and check past records.</p>
          </div>

          <div className="feature-card" onClick={() => navigate("/meds")}>
            <div className="feature-image-box">
               <img src="https://cdn-icons-png.flaticon.com/512/3035/3035035.png" alt="meds" />
            </div>
            <h3>Health Dashboard</h3>
            <p>Track water, medication, and meditation with point rewards.</p>
          </div>

          
        </div>
      </section>

      {/* 3. OPTIONAL GLASS FOOTER */}
      <footer className="landing-footer">
        <p>© HealthAI Hub. All rights reserved. Made with Love by Ankita Agrahari</p>
      </footer>
    </div>
  );
}

export default Landing;