import { useState, useEffect } from "react";
import "./Toast.css";

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
    <div className={`toast ${type} ${exiting ? "exiting" : ""}`}>
      <span className="toast-icon">{ICONS[type] || ICONS.info}</span>
      <span className="toast-message">{message}</span>
      <button className="toast-close" onClick={handleClose}>×</button>
      <div className="toast-progress" />
    </div>
  );
}

function ToastContainer({ toasts, removeToast }) {
  return (
    <div className="toast-container">
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
