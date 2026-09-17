import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../context/ToastContext";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const { showToast } = useToast();

  const loginUser = () => {
    if (!email || !password) {
      showToast("Email and password are required", "warning");
      return;
    }

    const API_BASE_URL = process.env.REACT_APP_API || "https://healthai-hub.onrender.com";

    fetch(`${API_BASE_URL}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.token) {
          localStorage.setItem("token", data.token);
          localStorage.setItem("role", data.user.role);
          localStorage.setItem("user", JSON.stringify(data.user));

          showToast(`Welcome back, ${data.user.name}!`, "success");

          if (data.user.role === "doctor") {
            navigate("/doctor-panel");
          } else {
            navigate("/dashboard");
          }
        } else {
          showToast(data.message || "Login failed", "error");
        }
      })
      .catch((err) => {
        console.error("Login Error:", err);
        showToast("Login failed. Please check if the backend is running.", "error");
      });
  };

  return (
    <div className="max-w-[420px] mx-auto my-[60px] p-[40px_30px] rounded-[20px] font-sans shadow-[0_8px_30px_rgba(0,0,0,0.08)] text-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
      <div className="w-[60px] h-[60px] rounded-full bg-gradient-to-br from-[#0a4db8]/10 to-[#6366f1]/10 flex items-center justify-center text-[1.6rem] mx-auto mb-[16px]">🔐</div>
      <h2 className="text-accent mb-[6px] text-[1.6rem] font-extrabold">Welcome Back</h2>
      <p className="text-slate-500 dark:text-slate-400 text-[0.95rem] mb-[28px]">Log in to your HealthAI Hub account</p>

      <input
        className="w-full p-[14px_16px] mb-[15px] rounded-[12px] border border-slate-200 dark:border-slate-600 text-[0.95rem] bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 outline-none transition-colors focus:border-accent box-border"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        className="w-full p-[14px_16px] mb-[15px] rounded-[12px] border border-slate-200 dark:border-slate-600 text-[0.95rem] bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 outline-none transition-colors focus:border-accent box-border"
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && loginUser()}
      />

      <button className="w-full p-[14px] bg-gradient-to-br from-[#0a4db8] to-[#1e6ff0] text-white border-none rounded-[12px] cursor-pointer text-[1rem] font-bold mt-[5px] transition-all shadow-[0_4px_15px_rgba(10,77,184,0.25)] hover:-translate-y-[2px]" onClick={loginUser}>
        Login
      </button>
      
      <p className="mt-[24px] text-[0.9rem] text-slate-500 dark:text-slate-400">
        Don't have an account?{" "}
        <span className="text-accent cursor-pointer underline font-semibold" onClick={() => navigate("/register")}>Register here</span>
      </p>
    </div>
  );
}

export default Login;