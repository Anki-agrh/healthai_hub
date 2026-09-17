import { useState, useEffect } from "react";


const ICONS = {
  success: "✅",
  error: "❌",
  warning: "⚠️",
  info: "ℹ️",
  emergency: "🚨",
};

function ToastItem({ id, message, type = "info", onRemove }) {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setExiting(true);
      setTimeout(() => onRemove(id), 350);
    }, 3000);
    return () => clearTimeout(timer);
  }, [id, onRemove]);

  const handleClose = () => {
    setExiting(true);
    setTimeout(() => onRemove(id), 350);
  };

  return (
    <div className={`relative flex items-center gap-[12px] p-[16px_20px] rounded-[12px] bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-[0_10px_30px_rgba(0,0,0,0.1)] border-l-[6px] border-slate-300 animate-[toastSlideIn_0.4s_cubic-bezier(0.175,0.885,0.32,1.275)_forwards] overflow-hidden ${exiting ? "animate-[toastSlideOut_0.3s_ease-in_forwards]" : ""} ${type === "success" ? "border-[#10b981]" : type === "error" ? "border-[#ef4444]" : type === "warning" ? "border-[#f59e0b]" : type === "emergency" ? "border-[#dc2626] animate-[emergencyPulse_1.5s_infinite]" : "border-[#3b82f6]"}`}>
      <span className="text-[1.2rem] shrink-0 drop-shadow-[0_2px_4px_rgba(0,0,0,0.1)]">{ICONS[type] || ICONS.info}</span>
      <span className="flex-1 font-semibold text-[0.95rem] leading-[1.4]">{message}</span>
      <button className="bg-transparent border-none text-[1.5rem] text-slate-400 cursor-pointer p-0 ml-[10px] leading-none transition-colors hover:text-slate-700 dark:hover:text-slate-200 focus:outline-none" onClick={handleClose}>×</button>
      <div className={`absolute bottom-0 left-0 h-[4px] bg-black/10 animate-[progressShrink_3s_linear_forwards] ${type === "success" ? "bg-[#10b981]" : type === "error" ? "bg-[#ef4444]" : type === "warning" ? "bg-[#f59e0b]" : type === "emergency" ? "bg-[#dc2626]" : "bg-[#3b82f6]"}`} />
    </div>
  );
}

function ToastContainer({ toasts, removeToast }) {
  return (
    <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-[12px] max-w-[350px]">
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          id={toast.id}
          message={toast.message}
          type={toast.type}
          onRemove={removeToast}
        />
      ))}
    </div>
  );
}

export default ToastContainer;
