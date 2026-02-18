import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Register() {
  const navigate = useNavigate();

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
      alert("Please fill Name, Email & Password first");
      return;
    }

    const verifyData = new FormData();
    verifyData.append("name", name);
    verifyData.append("email", email.toLowerCase());
    verifyData.append("password", password);
    verifyData.append("role", selectedRole);

    try {
      const res = await fetch(`${process.env.REACT_APP_API}/api/send-otp`, {
        method: "POST",
        body: verifyData,
      });

      const data = await res.json();

      if (res.ok) {
        alert("OTP sent to your email (valid 10 minutes)");
        setOtpSent(true);
      } else {
        alert(data.message || "Failed to send OTP");
      }
    } catch (err) {
      alert("Server error while sending OTP");
    }
  };

  // ================= REGISTER =================
  const registerUser = async (selectedRole) => {
    if (!otpSent) {
      await sendOtp(selectedRole);
      return;
    }

    if (!otp) {
      alert("Enter OTP first");
      return;
    }

    if (selectedRole === "doctor") {
      if (!profilePic || !licenseFile || !aadhaarFile || !degreeCertFile) {
        alert("Please upload all verification documents");
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

    try {
      const res = await fetch(`${process.env.REACT_APP_API}/api/register`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        alert(data.message);
        if (selectedRole === "patient") {
          navigate("/login");
        } else {
          setRole("");
          setOtpSent(false);
          alert("Admin will review your documents shortly.");
        }
      } else {
        alert(data.message || "Registration failed");
      }
    } catch (error) {
      console.error(error);
      alert("Server error");
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={{ textAlign: "center", color: "#0a4db8" }}>HealthAI Hub - Register</h2>

      {!role && (
        <div style={{ textAlign: "center" }}>
          <p>Select your role</p>
          <button style={styles.roleBtn} onClick={() => setRole("patient")}>
            Register as Patient
          </button>
          <button style={styles.roleBtn} onClick={() => setRole("doctor")}>
            Register as Doctor
          </button>
        </div>
      )}

      {role === "patient" && (
        <>
          <h3>Patient Registration</h3>
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
          <h3>Doctor Registration</h3>

          <div style={styles.imageUpload}>
            {preview && <img src={preview} alt="Preview" style={styles.previewImg} />}
            <label style={styles.uploadLabel}>
              Upload Photo
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
            style={{ ...styles.input, minHeight: "80px", fontFamily: "inherit" }} 
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
  container: { maxWidth: "550px", margin: "40px auto", padding: "30px", border: "1px solid #ddd", borderRadius: "12px", backgroundColor: "#fff", boxShadow: "0px 4px 10px rgba(0,0,0,0.1)" },
  input: { width: "100%", padding: "12px", marginBottom: "12px", borderRadius: "6px", border: "1px solid #ccc", boxSizing: "border-box" },
  button: { width: "100%", padding: "14px", backgroundColor: "#0a4db8", color: "white", border: "none", borderRadius: "6px", fontWeight: "bold", cursor: "pointer", marginTop: "10px" },
  roleBtn: { width: "100%", padding: "14px", marginBottom: "10px", borderRadius: "6px", border: "1px solid #0a4db8", backgroundColor: "#fff", color: "#0a4db8", fontWeight: "bold", cursor: "pointer" },
  imageUpload: { textAlign: "center", marginBottom: "20px" },
  previewImg: { width: "100px", height: "100px", borderRadius: "50%", objectFit: "cover", marginBottom: "10px", border: "2px solid #0a4db8" },
  uploadLabel: { display: "block", color: "#0a4db8", cursor: "pointer", fontWeight: "bold" },
  fileBox: { marginBottom: "15px", padding: "10px", backgroundColor: "#f9f9f9", borderRadius: "6px", border: "1px dashed #ccc" },
  fileLabel: { display: "block", marginBottom: "5px", fontWeight: "600", fontSize: "14px" }
};

export default Register;