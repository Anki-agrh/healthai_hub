import { useState, useEffect } from "react";
import { useToast } from "../context/ToastContext";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import "./MyProfile.css";

function MyProfile() {
  const [isEditing, setIsEditing] = useState(false);
  const { showToast } = useToast();
  const [profile, setProfile] = useState({
    name: "",
    age: "",
    degree: "",
    specialization: "",
    hospital: "",
    experience: "",
    bio: "",
    profilePic: "https://via.placeholder.com/150" 
  });

  const [activeTab, setActiveTab] = useState("Personal"); 
  const [vitalsData, setVitalsData] = useState(() => {
    const saved = localStorage.getItem("vitals_data");
    return saved ? JSON.parse(saved) : [
      { date: "Mon", bloodPressure: 120, sugar: 90, weight: 70 },
      { date: "Tue", bloodPressure: 118, sugar: 92, weight: 70 },
      { date: "Wed", bloodPressure: 122, sugar: 88, weight: 69.8 },
      { date: "Thu", bloodPressure: 115, sugar: 95, weight: 69.5 },
      { date: "Fri", bloodPressure: 119, sugar: 89, weight: 69.5 }
    ];
  });
  const [newVital, setNewVital] = useState({ bloodPressure: "", sugar: "", weight: "" });

  useEffect(() => {
    localStorage.setItem("vitals_data", JSON.stringify(vitalsData));
  }, [vitalsData]);

  const handleAddVital = () => {
    if (!newVital.bloodPressure || !newVital.sugar || !newVital.weight) {
      showToast("Please fill all fields", "error");
      return;
    }
    const dateStr = new Date().toLocaleDateString('en-US', { weekday: 'short' });
    const newData = {
      date: dateStr,
      bloodPressure: Number(newVital.bloodPressure),
      sugar: Number(newVital.sugar),
      weight: Number(newVital.weight)
    };
    setVitalsData(prev => [...prev.slice(-6), newData]);
    setNewVital({ bloodPressure: "", sugar: "", weight: "" });
    showToast("Vitals logged successfully!", "success");
  };

  useEffect(() => {
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user?._id) return;

  const API_BASE = process.env.REACT_APP_API || "https://healthai-hub.onrender.com";

  fetch(`${API_BASE}/api/doctors/${user._id}`)
    .then(res => res.json())
    .then(data => {
      setProfile({
        name: data.name || "",
        age: data.age || "",
        degree: data.degree || "",
        specialization: data.specialization || "",
        hospital: data.hospitalName || "",
        experience: data.experience || "",
        bio: data.bio || "",
        hospitalAddress: data.hospitalAddress || "",
        city: data.city || "",

        profilePic: data.image
          ? `${API_BASE}/uploads/${data.image}`
          : "https://via.placeholder.com/150"
      });
    });
}, []);


  const handleImageUpload = (e) => {
  const file = e.target.files[0];
  if (!file) return;

  setProfile(prev => ({
    ...prev,
    profilePic: URL.createObjectURL(file), // preview
    newImage: file // actual file to send backend
  }));
};


  const handleSave = async () => {
  const storedUser = JSON.parse(localStorage.getItem("user"));

  const API_BASE = process.env.REACT_APP_API || "https://healthai-hub.onrender.com";

  const formData = new FormData();
  formData.append("userId", storedUser._id);
  formData.append("name", profile.name);
  formData.append("degree", profile.degree);
  formData.append("specialization", profile.specialization);
  formData.append("hospitalName", profile.hospital);
  formData.append("experience", profile.experience);
  formData.append("bio", profile.bio);

  if (profile.newImage) {
    formData.append("image", profile.newImage);
  }

  try {
    const res = await fetch(`${API_BASE}/api/doctors/update-profile`, {
      method: "PUT",
      body: formData
    });

    const data = await res.json();

    if (data.success) {
      showToast("Profile updated successfully!", "success");
      setIsEditing(false);

      // refresh profile from backend
      window.location.reload();
    }
  } catch (err) {
    showToast("Failed to update profile", "error");
  }
};

  return (
    <div className="profile-container-pro">
      <div className="profile-card-pro">
        <div className="profile-header-pro">
          <div className="image-upload-wrapper">
            <img src={profile.profilePic} alt="Doctor" className="profile-img-pro" />
            {isEditing && (
              <label className="upload-btn">
                📷 Change Photo
                <input type="file" hidden onChange={handleImageUpload} />
              </label>
            )}
          </div>
          <div className="header-text-pro">
            <h1>{profile.name || "Dr. Name"}</h1>
            <p className="specialty-tag">{profile.specialization || "General Physician"}</p>
          </div>
        </div>

        <div className="profile-tabs">
          <button className={`tab-btn ${activeTab === 'Personal' ? 'active' : ''}`} onClick={() => setActiveTab("Personal")}>Personal Details</button>
          <button className={`tab-btn ${activeTab === 'Analytics' ? 'active' : ''}`} onClick={() => setActiveTab("Analytics")}>Health Analytics</button>
        </div>

        {activeTab === "Personal" ? (
          <div className="fade-in">
            <div className="profile-details-grid">
          <div className="info-group">
            <label>Degree</label>
            {isEditing ? <input value={profile.degree} onChange={(e) => setProfile({...profile, degree: e.target.value})} /> : <p>{profile.degree || "MBBS, MD"}</p>}
          </div>
          <div className="info-group">
            <label>Experience</label>
            {isEditing ? <input value={profile.experience} onChange={(e) => setProfile({...profile, experience: e.target.value})} /> : <p>{profile.experience || "0"} Years</p>}
          </div>
          <div className="info-group">
            <label>Hospital</label>
            {isEditing ? <input value={profile.hospital} onChange={(e) => setProfile({...profile, hospital: e.target.value})} /> : <p>{profile.hospital || "HealthAI Hub Clinic"}</p>}
          </div>
          <div className="info-group">
            <label>Age</label>
            {isEditing ? <input value={profile.age} onChange={(e) => setProfile({...profile, age: e.target.value})} /> : <p>{profile.age || "N/A"}</p>}
          </div>
        </div>

        <div className="bio-section">
          <label>Professional Summary</label>
          {isEditing ? <textarea value={profile.bio} onChange={(e) => setProfile({...profile, bio: e.target.value})} /> : <p>{profile.bio || "Dedicated healthcare professional..."}</p>}
        </div>

        <p>{profile.hospital}</p>
<p>{profile.hospitalAddress}, {profile.city}</p>


        <div className="profile-actions">
          {isEditing ? (
            <button className="save-btn-pro" onClick={handleSave}>Save Changes</button>
          ) : (
            <button className="edit-btn-pro" onClick={() => setIsEditing(true)}>Edit Details</button>
          )}
        </div>
          </div>
        ) : (
          <div className="analytics-tab fade-in">
            <h2 style={{color: 'var(--text-primary)', marginBottom: '20px'}}>Health Journey</h2>
            
            <div className="vitals-input-form">
              <input type="number" placeholder="Blood Pressure (sys)" value={newVital.bloodPressure} onChange={(e) => setNewVital({...newVital, bloodPressure: e.target.value})} />
              <input type="number" placeholder="Sugar (mg/dL)" value={newVital.sugar} onChange={(e) => setNewVital({...newVital, sugar: e.target.value})} />
              <input type="number" placeholder="Weight (kg)" value={newVital.weight} onChange={(e) => setNewVital({...newVital, weight: e.target.value})} />
              <button onClick={handleAddVital} className="add-vital-btn">Log Vitals</button>
            </div>

            <div className="charts-grid">
              <div className="chart-card">
                <h3>Blood Pressure & Sugar Trend</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={vitalsData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color, #eee)" />
                    <XAxis dataKey="date" stroke="var(--text-secondary, #666)" />
                    <YAxis stroke="var(--text-secondary, #666)" />
                    <Tooltip contentStyle={{background: 'var(--card-bg, white)', border: '1px solid var(--border-color, #eee)', color: 'var(--text-primary, #333)'}} />
                    <Legend />
                    <Line type="monotone" dataKey="bloodPressure" stroke="#ef4444" strokeWidth={3} />
                    <Line type="monotone" dataKey="sugar" stroke="#3b82f6" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="chart-card">
                <h3>Weight Journey</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={vitalsData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                    <XAxis dataKey="date" stroke="var(--text-secondary)" />
                    <YAxis domain={['dataMin - 2', 'auto']} stroke="var(--text-secondary)" />
                    <Tooltip contentStyle={{background: 'var(--card-bg)', border: '1px solid var(--border-color)', color: 'var(--text-primary)'}} />
                    <Bar dataKey="weight" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default MyProfile;