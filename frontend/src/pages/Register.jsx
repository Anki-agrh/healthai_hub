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
    <div className="max-w-[550px] mx-auto my-[40px] p-[35px_30px] rounded-[20px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-[0_8px_30px_rgba(0,0,0,0.08)] font-sans">
      <div className="w-[60px] h-[60px] rounded-full bg-gradient-to-br from-[#0a4db8]/10 to-[#6366f1]/10 flex items-center justify-center text-[1.6rem] mx-auto mb-[16px]">📋</div>
      <h2 className="text-center text-accent text-[1.5rem] font-extrabold mb-[8px]">HealthAI Hub - Register</h2>

      {!role && (
        <div className="text-center">
          <p className="text-slate-500 dark:text-slate-400 text-[0.95rem] mb-[20px] text-center">Select your role to get started</p>
          <button className="w-full p-[16px] mb-[12px] rounded-[12px] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-accent font-bold cursor-pointer text-[1rem] transition-all hover:bg-slate-50 dark:hover:bg-slate-700" onClick={() => setRole("patient")}>
            🧑 Register as Patient
          </button>
          <button className="w-full p-[16px] mb-[12px] rounded-[12px] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-accent font-bold cursor-pointer text-[1rem] transition-all hover:bg-slate-50 dark:hover:bg-slate-700" onClick={() => setRole("doctor")}>
            👨‍⚕️ Register as Doctor
          </button>
        </div>
      )}

      {role === "patient" && (
        <>
          <h3 className="text-slate-800 dark:text-slate-100 text-[1.1rem] font-bold mb-[16px]">Patient Registration</h3>
          <input className="w-full p-[14px_16px] mb-[12px] rounded-[12px] border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-[0.95rem] text-slate-800 dark:text-slate-100 outline-none box-border focus:border-accent" placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} />
          <input className="w-full p-[14px_16px] mb-[12px] rounded-[12px] border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-[0.95rem] text-slate-800 dark:text-slate-100 outline-none box-border focus:border-accent" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input className="w-full p-[14px_16px] mb-[12px] rounded-[12px] border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-[0.95rem] text-slate-800 dark:text-slate-100 outline-none box-border focus:border-accent" type="password" placeholder="Create Password" value={password} onChange={(e) => setPassword(e.target.value)} />
          {otpSent && <input className="w-full p-[14px_16px] mb-[12px] rounded-[12px] border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-[0.95rem] text-slate-800 dark:text-slate-100 outline-none box-border focus:border-accent" placeholder="Enter OTP" value={otp} onChange={(e) => setOtp(e.target.value)} />}
          <button className="w-full p-[14px] bg-gradient-to-br from-[#0a4db8] to-[#1e6ff0] text-white border-none rounded-[12px] font-bold cursor-pointer mt-[10px] text-[1rem] shadow-[0_4px_15px_rgba(10,77,184,0.25)] transition-all hover:-translate-y-[2px]" onClick={() => registerUser("patient")}>
            {otpSent ? "Verify & Register" : "Send OTP"}
          </button>
        </>
      )}

      {role === "doctor" && (
        <>
          <h3 className="text-slate-800 dark:text-slate-100 text-[1.1rem] font-bold mb-[16px]">Doctor Registration</h3>

          <div className="text-center mb-[20px]">
            {preview && <img src={preview} alt="Preview" className="w-[100px] h-[100px] rounded-full object-cover mb-[10px] border-[3px] border-accent mx-auto" />}
            <label className="block text-accent cursor-pointer font-bold text-[0.95rem]">
              📷 Upload Photo
              <input type="file" hidden onChange={handleImageUpload} accept="image/*" />
            </label>
          </div>

          <input className="w-full p-[14px_16px] mb-[12px] rounded-[12px] border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-[0.95rem] text-slate-800 dark:text-slate-100 outline-none box-border focus:border-accent" placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} />
          <input className="w-full p-[14px_16px] mb-[12px] rounded-[12px] border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-[0.95rem] text-slate-800 dark:text-slate-100 outline-none box-border focus:border-accent" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input className="w-full p-[14px_16px] mb-[12px] rounded-[12px] border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-[0.95rem] text-slate-800 dark:text-slate-100 outline-none box-border focus:border-accent" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
          
          <input className="w-full p-[14px_16px] mb-[12px] rounded-[12px] border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-[0.95rem] text-slate-800 dark:text-slate-100 outline-none box-border focus:border-accent" placeholder="Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <input className="w-full p-[14px_16px] mb-[12px] rounded-[12px] border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-[0.95rem] text-slate-800 dark:text-slate-100 outline-none box-border focus:border-accent" placeholder="Specialization (e.g. Cardiologist)" value={specialization} onChange={(e) => setSpecialization(e.target.value)} />
          <input className="w-full p-[14px_16px] mb-[12px] rounded-[12px] border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-[0.95rem] text-slate-800 dark:text-slate-100 outline-none box-border focus:border-accent" placeholder="Experience (e.g. 5 Years)" value={experience} onChange={(e) => setExperience(e.target.value)} />
          <input className="w-full p-[14px_16px] mb-[12px] rounded-[12px] border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-[0.95rem] text-slate-800 dark:text-slate-100 outline-none box-border focus:border-accent" placeholder="Degree (e.g. MBBS, MD)" value={degree} onChange={(e) => setDegree(e.target.value)} />
          
          <input className="w-full p-[14px_16px] mb-[12px] rounded-[12px] border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-[0.95rem] text-slate-800 dark:text-slate-100 outline-none box-border focus:border-accent" placeholder="Hospital Name" value={hospitalName} onChange={(e) => setHospitalName(e.target.value)} />
          <input className="w-full p-[14px_16px] mb-[12px] rounded-[12px] border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-[0.95rem] text-slate-800 dark:text-slate-100 outline-none box-border focus:border-accent" placeholder="Hospital Address" value={hospitalAddress} onChange={(e) => setHospitalAddress(e.target.value)} />
          <input className="w-full p-[14px_16px] mb-[12px] rounded-[12px] border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-[0.95rem] text-slate-800 dark:text-slate-100 outline-none box-border focus:border-accent" placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} />
          
          <textarea 
            className="w-full p-[14px_16px] mb-[12px] rounded-[12px] border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-[0.95rem] text-slate-800 dark:text-slate-100 outline-none box-border focus:border-accent min-h-[80px] font-inherit resize-y" 
            placeholder="Tell us about yourself (Bio)" 
            value={bio} 
            onChange={(e) => setBio(e.target.value)} 
          />

          <div className="mb-[15px] p-[14px] bg-slate-50 dark:bg-slate-900 rounded-[12px] border border-dashed border-slate-200 dark:border-slate-700">
            <label className="block mb-[8px] font-semibold text-[0.9rem] text-slate-800 dark:text-slate-100">Medical License</label>
            <input type="file" onChange={(e) => setLicenseFile(e.target.files[0])} />
          </div>

          <div className="mb-[15px] p-[14px] bg-slate-50 dark:bg-slate-900 rounded-[12px] border border-dashed border-slate-200 dark:border-slate-700">
            <label className="block mb-[8px] font-semibold text-[0.9rem] text-slate-800 dark:text-slate-100">Aadhaar Card</label>
            <input type="file" onChange={(e) => setAadhaarFile(e.target.files[0])} />
          </div>

          <div className="mb-[15px] p-[14px] bg-slate-50 dark:bg-slate-900 rounded-[12px] border border-dashed border-slate-200 dark:border-slate-700">
            <label className="block mb-[8px] font-semibold text-[0.9rem] text-slate-800 dark:text-slate-100">Degree Certificate</label>
            <input type="file" onChange={(e) => setDegreeCertFile(e.target.files[0])} />
          </div>

          {otpSent && <input className="w-full p-[14px_16px] mb-[12px] rounded-[12px] border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-[0.95rem] text-slate-800 dark:text-slate-100 outline-none box-border focus:border-accent" placeholder="Enter OTP" value={otp} onChange={(e) => setOtp(e.target.value)} />}

          <button className="w-full p-[14px] bg-gradient-to-br from-[#0a4db8] to-[#1e6ff0] text-white border-none rounded-[12px] font-bold cursor-pointer mt-[10px] text-[1rem] shadow-[0_4px_15px_rgba(10,77,184,0.25)] transition-all hover:-translate-y-[2px]" onClick={() => registerUser("doctor")}>
            {otpSent ? "Verify & Register" : "Send OTP"}
          </button>
        </>
      )}
    </div>
  );
}

export default Register;