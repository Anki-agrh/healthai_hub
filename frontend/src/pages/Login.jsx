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
    <div style={styles.container}>
      <div style={styles.iconCircle}>🔐</div>
      <h2 style={styles.title}>Welcome Back</h2>
      <p style={styles.subtitle}>Log in to your HealthAI Hub account</p>

      <input
        style={styles.input}
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        style={styles.input}
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && loginUser()}
      />

      <button style={styles.button} onClick={loginUser}>
        Login
      </button>
      
      <p style={styles.footerText}>
        Don't have an account?{" "}
        <span style={styles.link} onClick={() => navigate("/register")}>Register here</span>
      </p>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: "420px",
    margin: "60px auto",
    padding: "40px 30px",
    borderRadius: "20px",
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
    boxShadow: "0 8px 30px rgba(0,0,0,0.08)",
    textAlign: "center",
    background: "var(--card-bg, white)",
    border: "1px solid var(--border-color, #e2e8f0)",
  },
  iconCircle: {
    width: "60px",
    height: "60px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, rgba(10, 77, 184, 0.1), rgba(99, 102, 241, 0.1))",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "1.6rem",
    margin: "0 auto 16px",
  },
  title: {
    color: "var(--accent, #0a4db8)",
    marginBottom: "6px",
    fontSize: "1.6rem",
    fontWeight: 800,
  },
  subtitle: {
    color: "var(--text-secondary, #64748b)",
    fontSize: "0.95rem",
    marginBottom: "28px",
  },
  input: {
    width: "100%",
    padding: "14px 16px",
    marginBottom: "15px",
    borderRadius: "12px",
    border: "1px solid var(--input-border, #e2e8f0)",
    boxSizing: "border-box",
    fontSize: "0.95rem",
    background: "var(--input-bg, white)",
    color: "var(--text-primary, #1e293b)",
    outline: "none",
    transition: "border-color 0.2s",
  },
  button: {
    width: "100%",
    padding: "14px",
    background: "linear-gradient(135deg, #0a4db8, #1e6ff0)",
    color: "white",
    border: "none",
    borderRadius: "12px",
    cursor: "pointer",
    fontSize: "1rem",
    fontWeight: "bold",
    marginTop: "5px",
    transition: "all 0.3s ease",
    boxShadow: "0 4px 15px rgba(10, 77, 184, 0.25)",
  },
  footerText: {
    marginTop: "24px",
    fontSize: "0.9rem",
    color: "var(--text-secondary, #64748b)",
  },
  link: {
    color: "var(--accent, #0a4db8)",
    cursor: "pointer",
    textDecoration: "underline",
    fontWeight: 600,
  },
};

export default Login;