import { Link } from "react-router-dom";


function NotFound() {
  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center font-sans bg-slate-50 dark:bg-slate-900 p-[20px] text-center transition-colors">
      <div className="text-[8rem] font-black bg-gradient-to-br from-[#0a4db8] via-[#6366f1] to-[#ec4899] bg-clip-text text-transparent leading-none mb-[10px] animate-[float404_3s_ease-in-out_infinite]">404</div>
      <div className="text-[4rem] mb-[20px] animate-[spin404_4s_linear_infinite]">🩺</div>
      <h1 className="text-[1.8rem] font-bold text-slate-800 dark:text-slate-100 mb-[10px]">Page Not Found</h1>
      <p className="text-[1.1rem] text-slate-500 dark:text-slate-400 max-w-[450px] leading-[1.6] mb-[35px]">
        The page you're looking for doesn't exist or has been moved. 
        Let's get you back to safety.
      </p>
      <Link to="/" className="inline-block p-[14px_40px] bg-gradient-to-br from-[#0a4db8] to-[#1e6ff0] text-white border-none rounded-full text-[1rem] font-bold cursor-pointer shadow-[0_4px_15px_rgba(10,77,184,0.3)] transition-all no-underline hover:-translate-y-[3px] hover:shadow-[0_8px_25px_rgba(10,77,184,0.4)]">
        ← Back to Home
      </Link>
    </div>
  );
}

export default NotFound;
