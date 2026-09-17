import { useNavigate } from "react-router-dom";

function Landing() {
  const navigate = useNavigate();

  return (
    <div className="font-sans min-h-screen">
      {/* 1. HERO SECTION WITH GLASS OVERLAY */}
      <header className="relative text-center overflow-hidden bg-cover bg-center pt-20 px-5 pb-10" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=2000')" }}>
        <div className="absolute inset-0 bg-gradient-to-b from-[rgba(240,247,255,0.4)] to-[rgba(255,255,255,0.9)] dark:from-[rgba(15,23,42,0.5)] dark:to-[rgba(15,23,42,0.95)] z-[1]"></div> 
        <div className="relative z-[2]">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-5 text-slate-800 dark:text-slate-100">Smart Healthcare, <span className="text-accent">Simplified</span></h1>
          <p className="max-w-[750px] mx-auto mb-10 text-lg text-slate-600 dark:text-slate-400 leading-relaxed px-4">
            Consult our AI assistant and Specialized Doctors, generate personalized diet plans, 
            book doctor appointments, and manage your health dashboard in one place.
          </p>
          <div className="flex justify-center gap-4 mb-8">
            <button className="bg-gradient-to-br from-accent to-accent-hover text-white px-10 py-4 rounded-full text-lg font-bold shadow-[0_4px_20px_rgba(10,77,184,0.25)] hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(10,77,184,0.35)] transition-all duration-300" onClick={() => navigate("/ai")}>Start AI Chat</button>
          </div>
          <p className="text-sm text-slate-400 dark:text-slate-500">
            ⚠️ This platform does not provide medical diagnosis. Please consult a certified doctor.
          </p>
        </div>
      </header>

      {/* 2. FEATURES GRID WITH GLASS CARDS */}
      <section className="max-w-6xl mx-auto py-10 px-5 text-center">
        <h2 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 mb-8">Our Key Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 justify-items-center">
          
          <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl w-full max-w-[320px] text-center border border-slate-100 dark:border-slate-700 shadow-sm transition-all duration-300 cursor-pointer hover:-translate-y-2 hover:shadow-[0_12px_30px_rgba(10,77,184,0.15)] hover:border-accent group" onClick={() => navigate("/ai")}>
            <div className="w-[90px] h-[90px] mx-auto mb-5 bg-white rounded-2xl flex items-center justify-center shadow-[0_8px_15px_rgba(10,77,184,0.1)] transition-transform duration-300 group-hover:scale-105">
               <img src="https://cdn-icons-png.flaticon.com/512/6295/6295417.png" alt="AI Assistant" className="w-[60px] h-[60px] object-contain" />
            </div>
            <h3 className="text-accent text-xl font-bold mb-3">AI Health Assistant</h3>
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed">Interactive 3D anatomical model for pinpointing symptoms and reports analyzer.</p>
          </div>

          <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl w-full max-w-[320px] text-center border border-slate-100 dark:border-slate-700 shadow-sm transition-all duration-300 cursor-pointer hover:-translate-y-2 hover:shadow-[0_12px_30px_rgba(10,77,184,0.15)] hover:border-accent group" onClick={() => navigate("/diet")}>
            <div className="w-[90px] h-[90px] mx-auto mb-5 bg-white rounded-2xl flex items-center justify-center shadow-[0_8px_15px_rgba(10,77,184,0.1)] transition-transform duration-300 group-hover:scale-105">
               <img src="https://cdn-icons-png.flaticon.com/512/3565/3565418.png" alt="Diet Plan" className="w-[60px] h-[60px] object-contain" />
            </div>
            <h3 className="text-accent text-xl font-bold mb-3">AI Diet Generator</h3>
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed">Personalized nutrition plans and smart recipe suggestions.</p>
          </div>

          <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl w-full max-w-[320px] text-center border border-slate-100 dark:border-slate-700 shadow-sm transition-all duration-300 cursor-pointer hover:-translate-y-2 hover:shadow-[0_12px_30px_rgba(10,77,184,0.15)] hover:border-accent group" onClick={() => navigate("/nearby-doctors")}>
            <div className="w-[90px] h-[90px] mx-auto mb-5 bg-white rounded-2xl flex items-center justify-center shadow-[0_8px_15px_rgba(10,77,184,0.1)] transition-transform duration-300 group-hover:scale-105">
               <img src="https://cdn-icons-png.flaticon.com/512/3209/3209063.png" alt="Nearby Doctors" className="w-[60px] h-[60px] object-contain" />
            </div>
            <h3 className="text-accent text-xl font-bold mb-3">Nearby Healthcare</h3>
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed">Live mapping of doctors and hospitals within 10km.</p>
          </div>

          <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl w-full max-w-[320px] text-center border border-slate-100 dark:border-slate-700 shadow-sm transition-all duration-300 cursor-pointer hover:-translate-y-2 hover:shadow-[0_12px_30px_rgba(10,77,184,0.15)] hover:border-accent group" onClick={() => navigate("/consult")}>
            <div className="w-[90px] h-[90px] mx-auto mb-5 bg-white rounded-2xl flex items-center justify-center shadow-[0_8px_15px_rgba(10,77,184,0.1)] transition-transform duration-300 group-hover:scale-105">
               <img src="https://cdn-icons-png.flaticon.com/512/921/921079.png" alt="consult" className="w-[60px] h-[60px] object-contain" />
            </div>
            <h3 className="text-accent text-xl font-bold mb-3">Consult Doctors</h3>
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed">One-tap doctor-consultation and specialized support.</p>
          </div>

          <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl w-full max-w-[320px] text-center border border-slate-100 dark:border-slate-700 shadow-sm transition-all duration-300 cursor-pointer hover:-translate-y-2 hover:shadow-[0_12px_30px_rgba(10,77,184,0.15)] hover:border-accent group" onClick={() => navigate("/queue")}>
            <div className="w-[90px] h-[90px] mx-auto mb-5 bg-white rounded-2xl flex items-center justify-center shadow-[0_8px_15px_rgba(10,77,184,0.1)] transition-transform duration-300 group-hover:scale-105">
               <img src="https://cdn-icons-png.flaticon.com/512/1000/1000997.png" alt="queue" className="w-[60px] h-[60px] object-contain" />
            </div>
            <h3 className="text-accent text-xl font-bold mb-3">Med Records / Queue</h3>
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed">Reduce waiting time with smart queues and check past records.</p>
          </div>

          <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl w-full max-w-[320px] text-center border border-slate-100 dark:border-slate-700 shadow-sm transition-all duration-300 cursor-pointer hover:-translate-y-2 hover:shadow-[0_12px_30px_rgba(10,77,184,0.15)] hover:border-accent group" onClick={() => navigate("/meds")}>
            <div className="w-[90px] h-[90px] mx-auto mb-5 bg-white rounded-2xl flex items-center justify-center shadow-[0_8px_15px_rgba(10,77,184,0.1)] transition-transform duration-300 group-hover:scale-105">
               <img src="https://cdn-icons-png.flaticon.com/512/3035/3035035.png" alt="meds" className="w-[60px] h-[60px] object-contain" />
            </div>
            <h3 className="text-accent text-xl font-bold mb-3">Health Dashboard</h3>
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed">Track water, medication, and meditation with point rewards.</p>
          </div>
          
        </div>
      </section>

      {/* 3. PREMIUM FOOTER */}
      <footer className="bg-gradient-to-br from-slate-900 to-slate-800 text-slate-400 pt-16 px-5 pb-8 mt-16">
        <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 pb-10 border-b border-slate-700/50">
          {/* Brand Column */}
          <div className="lg:col-span-1">
            <h3 className="text-white text-2xl font-extrabold mb-3">💙 Health<span className="text-blue-500">AI</span> Hub</h3>
            <p className="text-sm leading-relaxed max-w-[320px]">
              Your one-stop AI-powered healthcare platform. We connect patients with certified doctors, 
              provide instant symptom analysis, and help you build healthier habits — all in one place.
            </p>
            <div className="flex gap-3 mt-5">
              <a href="#" className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-lg hover:bg-blue-500 hover:-translate-y-1 transition-all" title="GitHub">🐙</a>
              <a href="#" className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-lg hover:bg-blue-500 hover:-translate-y-1 transition-all" title="LinkedIn">💼</a>
              <a href="#" className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-lg hover:bg-blue-500 hover:-translate-y-1 transition-all" title="Twitter">🐦</a>
              <a href="#" className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-lg hover:bg-blue-500 hover:-translate-y-1 transition-all" title="Instagram">📸</a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="flex flex-col">
            <h4 className="text-white text-sm font-bold uppercase tracking-wide mb-4">Quick Links</h4>
            <a href="/ai" className="text-slate-400 hover:text-white hover:translate-x-1 transition-all mb-2 text-sm">AI Assistant</a>
            <a href="/diet" className="text-slate-400 hover:text-white hover:translate-x-1 transition-all mb-2 text-sm">Diet Planner</a>
            <a href="/consult" className="text-slate-400 hover:text-white hover:translate-x-1 transition-all mb-2 text-sm">Consult Doctor</a>
            <a href="/meds" className="text-slate-400 hover:text-white hover:translate-x-1 transition-all mb-2 text-sm">Health Dashboard</a>
            <a href="/emergency" className="text-slate-400 hover:text-white hover:translate-x-1 transition-all mb-2 text-sm">Emergency SOS</a>
          </div>

          {/* Features */}
          <div className="flex flex-col">
            <h4 className="text-white text-sm font-bold uppercase tracking-wide mb-4">Features</h4>
            <a href="/nearby-doctors" className="text-slate-400 hover:text-white hover:translate-x-1 transition-all mb-2 text-sm">Nearby Doctors</a>
            <a href="/queue" className="text-slate-400 hover:text-white hover:translate-x-1 transition-all mb-2 text-sm">Live Queue</a>
            <a href="/register" className="text-slate-400 hover:text-white hover:translate-x-1 transition-all mb-2 text-sm">Register</a>
            <a href="/login" className="text-slate-400 hover:text-white hover:translate-x-1 transition-all mb-2 text-sm">Login</a>
          </div>

          {/* Contact */}
          <div className="flex flex-col">
            <h4 className="text-white text-sm font-bold uppercase tracking-wide mb-4">Contact</h4>
            <a href="mailto:support@healthaihub.com" className="text-slate-400 hover:text-white hover:translate-x-1 transition-all mb-2 text-sm">📧 support@healthaihub.com</a>
            <a href="tel:+911234567890" className="text-slate-400 hover:text-white hover:translate-x-1 transition-all mb-2 text-sm">📞 +91 12345 67890</a>
            <a href="#" className="text-slate-400 hover:text-white hover:translate-x-1 transition-all mb-2 text-sm">📍 India</a>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center pt-6 text-xs text-center md:text-left gap-2">
          <p className="m-0">© {new Date().getFullYear()} HealthAI Hub. All rights reserved.</p>
          <p className="m-0">Made with ❤️ by <a href="#" className="text-blue-500 font-semibold no-underline">Ankita Agrahari</a></p>
        </div>
      </footer>
    </div>
  );
}

export default Landing;