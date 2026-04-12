import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../context/ToastContext";

function Register() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [role, setRole] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // OTP
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");

  // Doctor fields
  const [specialization, setSpecialization] = useState("");
  const [experience, setExperience] = useState("");
  const [degree, setDegree] = useState("");
  const [hospitalName, setHospitalName] = useState("");
  const [hospitalAddress, setHospitalAddress] = useState("");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");

  // files
  const [profilePic, setProfilePic] = useState(null);
  const [preview, setPreview] = useState(null);
  const [licenseFile, setLicenseFile] = useState(null);
  const [aadhaarFile, setAadhaarFile] = useState(null);
  const [degreeCertFile, setDegreeCertFile] = useState(null);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setProfilePic(file);
    setPreview(URL.createObjectURL(file));
  };

  // ================= SEND OTP =================
  const sendOtp = async (selectedRole) => {
    if (!name || !email || !password) {
      showToast("Please fill Name, Email & Password first", "warning");
      return;
    }

    const verifyData = new FormData();
    verifyData.append("name", name);
    verifyData.append("email", email.toLowerCase());
    verifyData.append("password", password);
    verifyData.append("role", selectedRole);

    const API_BASE = process.env.REACT_APP_API || "https://healthai-hub.onrender.com";

    try {
      const res = await fetch(`${API_BASE}/api/send-otp`, {
        method: "POST",
        body: verifyData,
      });

      const data = await res.json();

      if (res.ok) {
        showToast("OTP sent to your email (valid 10 minutes)", "success");
        setOtpSent(true);
      } else {
        showToast(data.message || "Failed to send OTP", "error");
      }
    } catch (err) {
      showToast("Server error while sending OTP", "error");
    }
  };

  // ================= REGISTER =================
  const registerUser = async (selectedRole) => {
    if (!otpSent) {
      await sendOtp(selectedRole);
      return;
    }

    if (!otp) {
      showToast("Enter OTP first", "warning");
      return;
    }

    if (selectedRole === "doctor") {
      if (!profilePic || !licenseFile || !aadhaarFile || !degreeCertFile) {
        showToast("Please upload all verification documents", "warning");
        return;
      }
    }

    const formData = new FormData();
    formData.append("name", name);
    formData.append("email", email.toLowerCase());
    formData.append("password", password);
    formData.append("role", selectedRole);
    formData.append("otp", otp);

    if (selectedRole === "doctor") {
      formData.append("specialization", specialization);
      formData.append("experience", experience);
      formData.append("hospitalName", hospitalName);
      formData.append("hospitalAddress", hospitalAddress);
      formData.append("city", city);
      formData.append("degree", degree);
      formData.append("phone", phone);
      formData.append("bio", bio);

      formData.append("image", profilePic);
      formData.append("license", licenseFile);
      formData.append("aadhaar", aadhaarFile);
      formData.append("degreeCert", degreeCertFile);
    }

    const API_BASE = process.env.REACT_APP_API || "https://healthai-hub.onrender.com";

    try {
      const res = await fetch(`${API_BASE}/api/register`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        showToast(data.message || "Registration successful!", "success");
        if (selectedRole === "patient") {
          navigate("/login");
        } else {
          setRole("");
          setOtpSent(false);
          showToast("Admin will review your documents shortly.", "info");
        }
      } else {
        showToast(data.message || "Registration failed", "error");
      }
    } catch (error) {
      console.error(error);
      showToast("Server error during registration", "error");
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.iconCircle}>📋</div>
      <h2 style={styles.heading}>HealthAI Hub - Register</h2>

      {!role && (
        <div style={{ textAlign: "center" }}>
          <p style={styles.subtitle}>Select your role to get started</p>
          <button style={styles.roleBtn} onClick={() => setRole("patient")}>
            🧑 Register as Patient
          </button>
          <button style={styles.roleBtn} onClick={() => setRole("doctor")}>
            👨‍⚕️ Register as Doctor
          </button>
        </div>
      )}

      {role === "patient" && (
        <>
          <h3 style={styles.sectionTitle}>Patient Registration</h3>
          <input style={styles.input} placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} />
          <input style={styles.input} placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input style={styles.input} type="password" placeholder="Create Password" value={password} onChange={(e) => setPassword(e.target.value)} />
          {otpSent && <input style={styles.input} placeholder="Enter OTP" value={otp} onChange={(e) => setOtp(e.target.value)} />}
          <button style={styles.button} onClick={() => registerUser("patient")}>
            {otpSent ? "Verify & Register" : "Send OTP"}
          </button>
        </>
      )}

      {role === "doctor" && (
        <>
          <h3 style={styles.sectionTitle}>Doctor Registration</h3>

          <div style={styles.imageUpload}>
            {preview && <img src={preview} alt="Preview" style={styles.previewImg} />}
            <label style={styles.uploadLabel}>
              📷 Upload Photo
              <input type="file" hidden onChange={handleImageUpload} accept="image/*" />
            </label>
          </div>

          <input style={styles.input} placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} />
          <input style={styles.input} placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input style={styles.input} type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
          
          <input style={styles.input} placeholder="Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <input style={styles.input} placeholder="Specialization (e.g. Cardiologist)" value={specialization} onChange={(e) => setSpecialization(e.target.value)} />
          <input style={styles.input} placeholder="Experience (e.g. 5 Years)" value={experience} onChange={(e) => setExperience(e.target.value)} />
          <input style={styles.input} placeholder="Degree (e.g. MBBS, MD)" value={degree} onChange={(e) => setDegree(e.target.value)} />
          
          <input style={styles.input} placeholder="Hospital Name" value={hospitalName} onChange={(e) => setHospitalName(e.target.value)} />
          <input style={styles.input} placeholder="Hospital Address" value={hospitalAddress} onChange={(e) => setHospitalAddress(e.target.value)} />
          <input style={styles.input} placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} />
          
          <textarea 
            style={{ ...styles.input, minHeight: "80px", fontFamily: "inherit", resize: "vertical" }} 
            placeholder="Tell us about yourself (Bio)" 
            value={bio} 
            onChange={(e) => setBio(e.target.value)} 
          />

          <div style={styles.fileBox}>
            <label style={styles.fileLabel}>Medical License</label>
            <input type="file" onChange={(e) => setLicenseFile(e.target.files[0])} />
          </div>

          <div style={styles.fileBox}>
            <label style={styles.fileLabel}>Aadhaar Card</label>
            <input type="file" onChange={(e) => setAadhaarFile(e.target.files[0])} />
          </div>

          <div style={styles.fileBox}>
            <label style={styles.fileLabel}>Degree Certificate</label>
            <input type="file" onChange={(e) => setDegreeCertFile(e.target.files[0])} />
          </div>

          {otpSent && <input style={styles.input} placeholder="Enter OTP" value={otp} onChange={(e) => setOtp(e.target.value)} />}

          <button style={styles.button} onClick={() => registerUser("doctor")}>
            {otpSent ? "Verify & Register" : "Send OTP"}
          </button>
        </>
      )}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: "550px",
    margin: "40px auto",
    padding: "35px 30px",
    borderRadius: "20px",
    background: "var(--card-bg, #fff)",
    border: "1px solid var(--border-color, #e2e8f0)",
    boxShadow: "0 8px 30px rgba(0,0,0,0.08)",
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
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
  heading: {
    textAlign: "center",
    color: "var(--accent, #0a4db8)",
    fontSize: "1.5rem",
    fontWeight: 800,
    marginBottom: "8px",
  },
  subtitle: {
    color: "var(--text-secondary, #64748b)",
    fontSize: "0.95rem",
    marginBottom: "20px",
  },
  sectionTitle: {
    color: "var(--text-primary, #1e293b)",
    fontSize: "1.1rem",
    fontWeight: 700,
    marginBottom: "16px",
  },
  input: {
    width: "100%",
    padding: "14px 16px",
    marginBottom: "12px",
    borderRadius: "12px",
    border: "1px solid var(--input-border, #e2e8f0)",
    boxSizing: "border-box",
    fontSize: "0.95rem",
    background: "var(--input-bg, white)",
    color: "var(--text-primary, #1e293b)",
    outline: "none",
  },
  button: {
    width: "100%",
    padding: "14px",
    background: "linear-gradient(135deg, #0a4db8, #1e6ff0)",
    color: "white",
    border: "none",
    borderRadius: "12px",
    fontWeight: "bold",
    cursor: "pointer",
    marginTop: "10px",
    fontSize: "1rem",
    boxShadow: "0 4px 15px rgba(10, 77, 184, 0.25)",
    transition: "all 0.3s",
  },
  roleBtn: {
    width: "100%",
    padding: "16px",
    marginBottom: "12px",
    borderRadius: "12px",
    border: "1px solid var(--border-color, #e2e8f0)",
    background: "var(--card-bg, #fff)",
    color: "var(--accent, #0a4db8)",
    fontWeight: "bold",
    cursor: "pointer",
    fontSize: "1rem",
    transition: "all 0.3s",
  },
  imageUpload: { textAlign: "center", marginBottom: "20px" },
  previewImg: {
    width: "100px",
    height: "100px",
    borderRadius: "50%",
    objectFit: "cover",
    marginBottom: "10px",
    border: "3px solid var(--accent, #0a4db8)",
  },
  uploadLabel: {
    display: "block",
    color: "var(--accent, #0a4db8)",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "0.95rem",
  },
  fileBox: {
    marginBottom: "15px",
    padding: "14px",
    background: "var(--bg-primary, #f9f9f9)",
    borderRadius: "12px",
    border: "1px dashed var(--border-color, #e2e8f0)",
  },
  fileLabel: {
    display: "block",
    marginBottom: "8px",
    fontWeight: "600",
    fontSize: "0.9rem",
    color: "var(--text-primary, #1e293b)",
  },
};

export default Register;