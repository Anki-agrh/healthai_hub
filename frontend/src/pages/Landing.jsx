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

      {/* 3. PREMIUM FOOTER */}
      <footer className="landing-footer">
        <div className="footer-grid">
          {/* Brand Column */}
          <div className="footer-brand">
            <h3>💙 Health<span>AI</span> Hub</h3>
            <p>
              Your one-stop AI-powered healthcare platform. We connect patients with certified doctors, 
              provide instant symptom analysis, and help you build healthier habits — all in one place.
            </p>
            <div className="footer-socials">
              <a href="#" className="social-icon" title="GitHub">🐙</a>
              <a href="#" className="social-icon" title="LinkedIn">💼</a>
              <a href="#" className="social-icon" title="Twitter">🐦</a>
              <a href="#" className="social-icon" title="Instagram">📸</a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="footer-col">
            <h4>Quick Links</h4>
            <a href="/ai">AI Assistant</a>
            <a href="/diet">Diet Planner</a>
            <a href="/consult">Consult Doctor</a>
            <a href="/meds">Health Dashboard</a>
            <a href="/emergency">Emergency SOS</a>
          </div>

          {/* Features */}
          <div className="footer-col">
            <h4>Features</h4>
            <a href="/nearby-doctors">Nearby Doctors</a>
            <a href="/queue">Live Queue</a>
            <a href="/register">Register</a>
            <a href="/login">Login</a>
          </div>

          {/* Contact */}
          <div className="footer-col">
            <h4>Contact</h4>
            <a href="mailto:support@healthaihub.com">📧 support@healthaihub.com</a>
            <a href="tel:+911234567890">📞 +91 12345 67890</a>
            <a href="#">📍 India</a>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} HealthAI Hub. All rights reserved.</p>
          <p>Made with ❤️ by <a href="#">Ankita Agrahari</a></p>
        </div>
      </footer>
    </div>
  );
}

export default Landing;