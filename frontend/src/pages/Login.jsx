import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Login() {
  // =====================
  // 1️⃣ STATES
  // =====================
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const navigate = useNavigate();

  // =====================
  // 2️⃣ FUNCTION
  // =====================
  const loginUser = () => {
    if (!email || !password) {
      alert("Email and password are required");
      return;
    }

    fetch(`${process.env.REACT_APP_API}/api/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.token) {
          // ✅ 1. Save JWT Token
          localStorage.setItem("token", data.token);
          
          // ✅ 2. Save the User Role
          localStorage.setItem("role", data.user.role);

          // ✅ 3. Save the FULL USER OBJECT (Crucial for Doctor ID)
          // We stringify it because localStorage only stores strings
          localStorage.setItem("user", JSON.stringify(data.user));

          alert("Login successful");

          // ✅ 4. Smart Redirect based on Role
          if (data.user.role === "doctor") {
            navigate("/doctor-panel");
          } else {
            navigate("/");
          }
          
        } else {
          alert(data.message || "Login failed");
        }
      })
      .catch((err) => {
        console.error("Login Error:", err);
        alert("Login failed. Please check if the backend is running.");
      });
  };

  // =====================
  // 3️⃣ UI
  // =====================
  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Login</h2>

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
      />

      <button style={styles.button} onClick={loginUser}>
        Login
      </button>
      
      <p style={styles.footerText}>
        Don't have an account? <span style={styles.link} onClick={() => navigate("/register")}>Register here</span>
      </p>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: "400px",
    margin: "60px auto",
    padding: "30px",
    border: "1px solid #ddd",
    borderRadius: "12px",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
    textAlign: "center"
  },
  title: {
    color: "#0a4db8",
    marginBottom: "20px"
  },
  input: {
    width: "100%",
    padding: "12px",
    marginBottom: "15px",
    borderRadius: "6px",
    border: "1px solid #ccc",
    boxSizing: "border-box"
  },
  button: {
    width: "100%",
    padding: "12px",
    backgroundColor: "#0a4db8",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "16px",
    fontWeight: "bold"
  },
  footerText: {
    marginTop: "20px",
    fontSize: "14px",
    color: "#666"
  },
  link: {
    color: "#0a4db8",
    cursor: "pointer",
    textDecoration: "underline"
  }
};

export default Login;