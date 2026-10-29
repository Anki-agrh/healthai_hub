import { useState, useEffect } from "react";
import { useToast } from "../context/ToastContext";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Camera, Award, Mail } from "lucide-react";

function MyProfile() {
  const [isEditing, setIsEditing] = useState(false);
  const { showToast } = useToast();
  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const role = storedUser?.role || "patient";

  const [profile, setProfile] = useState({
    name: storedUser.name || "",
    email: storedUser.email || "",
    age: "",
    phone: "",
    bloodGroup: "",
    emergencyContact: "",
    allergies: "",
    degree: "",
    specialization: "",
    hospital: "",
    experience: "",
    bio: "",
    points: storedUser.points || 0,
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
    if (!storedUser?._id) return;
    const API_BASE = process.env.REACT_APP_API || "https://healthai-hub.onrender.com";

    fetch(`${API_BASE}/api/doctors/${storedUser._id}`)
      .then(res => res.json())
      .then(data => {
        if (!data || data.message) return;
        setProfile(prev => ({
          ...prev,
          name: data.name || prev.name,
          email: data.email || prev.email,
          age: data.age || "",
          phone: data.phone || "",
          bloodGroup: data.bloodGroup || "",
          emergencyContact: data.emergencyContact || "",
          allergies: data.allergies || "",
          degree: data.degree || "",
          specialization: data.specialization || "",
          hospital: data.hospitalName || "",
          experience: data.experience !== undefined ? data.experience : "",
          bio: data.bio || "",
          hospitalAddress: data.hospitalAddress || "",
          city: data.city || "",
          points: data.points || prev.points || 0,
          profilePic: data.image
            ? `${API_BASE}/uploads/${data.image}`
            : "https://via.placeholder.com/150"
        }));
      })
      .catch(() => {});
  }, [storedUser?._id]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setProfile(prev => ({
      ...prev,
      profilePic: URL.createObjectURL(file),
      newImage: file
    }));
  };

  const handleSave = async () => {
    const API_BASE = process.env.REACT_APP_API || "https://healthai-hub.onrender.com";
    const formData = new FormData();
    formData.append("userId", storedUser._id);
    formData.append("name", profile.name);
    formData.append("phone", profile.phone || "");
    formData.append("age", profile.age || "");

    if (role === "doctor") {
      formData.append("degree", profile.degree || "");
      formData.append("specialization", profile.specialization || "");
      formData.append("hospitalName", profile.hospital || "");
      formData.append("hospitalAddress", profile.hospitalAddress || "");
      formData.append("city", profile.city || "");
      formData.append("experience", profile.experience || 0);
      formData.append("bio", profile.bio || "");
    } else {
      formData.append("bloodGroup", profile.bloodGroup || "");
      formData.append("emergencyContact", profile.emergencyContact || "");
      formData.append("allergies", profile.allergies || "");
    }

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
        // update stored user in localStorage
        const updated = { ...storedUser, name: profile.name };
        localStorage.setItem("user", JSON.stringify(updated));
      } else {
        showToast(data.message || "Failed to update profile", "error");
      }
    } catch (err) {
      showToast("Failed to update profile", "error");
    }
  };

  return (
    <div className="flex justify-center p-6 sm:p-10 bg-slate-50 dark:bg-slate-900 min-h-[90vh] transition-colors">
      <div className="bg-white dark:bg-slate-800 w-full max-w-[850px] rounded-2xl p-6 sm:p-8 shadow-[0_10px_30px_rgba(0,0,0,0.05)] text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700">
        
        {/* Profile Header */}
        <div className="flex flex-col md:flex-row items-center gap-6 border-b-2 border-slate-100 dark:border-slate-700 pb-6 mb-6">
          <div className="relative w-[130px] h-[130px] shrink-0">
            <img
              src={profile.profilePic}
              alt={profile.name || "User Avatar"}
              className="w-full h-full rounded-full object-cover border-4 border-accent shadow-md"
            />
            {isEditing && (
              <label className="absolute bottom-0 left-0 right-0 bg-accent/90 hover:bg-accent text-white text-center text-xs py-1.5 cursor-pointer rounded-b-full transition-colors flex items-center justify-center gap-1">
                <Camera size={13} />
                <span>Change Photo</span>
                <input type="file" hidden onChange={handleImageUpload} accept="image/*" />
              </label>
            )}
          </div>
          <div className="flex flex-col items-center md:items-start text-center md:text-left flex-1">
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {profile.name || (role === "doctor" ? "Doctor Profile" : "Patient Profile")}
            </h1>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                role === "doctor"
                  ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                  : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
              }`}>
                {role === "doctor" ? (profile.specialization || "Doctor") : "Patient"}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Mail size={12} /> {profile.email}
              </span>
            </div>
            {role === "patient" && (
              <div className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                <Award size={14} /> Health Points: {profile.points || 0}
              </div>
            )}
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-3 mb-6 border-b-2 border-slate-100 dark:border-slate-700 pb-3">
          <button
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
              activeTab === "Personal"
                ? "bg-accent text-white shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
            onClick={() => setActiveTab("Personal")}
          >
            Personal Details
          </button>
          <button
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
              activeTab === "Analytics"
                ? "bg-accent text-white shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
            onClick={() => setActiveTab("Analytics")}
          >
            Health Analytics
          </button>
        </div>

        {/* Personal Details Tab */}
        {activeTab === "Personal" ? (
          <div className="animate-fadeIn space-y-6">
            
            {/* PATIENT PROFILE VIEW */}
            {role === "patient" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase">Full Name</label>
                  {isEditing ? (
                    <input
                      className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-sm outline-none focus:border-accent"
                      value={profile.name}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    />
                  ) : (
                    <p className="text-base font-semibold text-slate-800 dark:text-slate-100 border-b border-slate-100 dark:border-slate-700 pb-1.5">{profile.name || "N/A"}</p>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase">Phone Number</label>
                  {isEditing ? (
                    <input
                      className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-sm outline-none focus:border-accent"
                      placeholder="e.g. +91 9876543210"
                      value={profile.phone}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    />
                  ) : (
                    <p className="text-base font-semibold text-slate-800 dark:text-slate-100 border-b border-slate-100 dark:border-slate-700 pb-1.5">{profile.phone || "Not set"}</p>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase">Age</label>
                  {isEditing ? (
                    <input
                      className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-sm outline-none focus:border-accent"
                      type="number"
                      placeholder="e.g. 24"
                      value={profile.age}
                      onChange={(e) => setProfile({ ...profile, age: e.target.value })}
                    />
                  ) : (
                    <p className="text-base font-semibold text-slate-800 dark:text-slate-100 border-b border-slate-100 dark:border-slate-700 pb-1.5">{profile.age ? `${profile.age} Years` : "Not set"}</p>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase">Blood Group</label>
                  {isEditing ? (
                    <select
                      className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-sm outline-none focus:border-accent"
                      value={profile.bloodGroup}
                      onChange={(e) => setProfile({ ...profile, bloodGroup: e.target.value })}
                    >
                      <option value="">Select Blood Group</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                    </select>
                  ) : (
                    <p className="text-base font-semibold text-slate-800 dark:text-slate-100 border-b border-slate-100 dark:border-slate-700 pb-1.5">{profile.bloodGroup || "Not specified"}</p>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase">Emergency Contact</label>
                  {isEditing ? (
                    <input
                      className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-sm outline-none focus:border-accent"
                      placeholder="e.g. +91 9999988888 (Parent/Spouse)"
                      value={profile.emergencyContact}
                      onChange={(e) => setProfile({ ...profile, emergencyContact: e.target.value })}
                    />
                  ) : (
                    <p className="text-base font-semibold text-slate-800 dark:text-slate-100 border-b border-slate-100 dark:border-slate-700 pb-1.5">{profile.emergencyContact || "Not set"}</p>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase">Allergies & Medical Notes</label>
                  {isEditing ? (
                    <input
                      className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-sm outline-none focus:border-accent"
                      placeholder="e.g. None, or Penicillin, Dust allergy"
                      value={profile.allergies}
                      onChange={(e) => setProfile({ ...profile, allergies: e.target.value })}
                    />
                  ) : (
                    <p className="text-base font-semibold text-slate-800 dark:text-slate-100 border-b border-slate-100 dark:border-slate-700 pb-1.5">{profile.allergies || "None declared"}</p>
                  )}
                </div>
              </div>
            ) : (
              /* DOCTOR PROFILE VIEW */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase">Specialization</label>
                  {isEditing ? (
                    <input
                      className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-sm outline-none focus:border-accent"
                      value={profile.specialization}
                      onChange={(e) => setProfile({ ...profile, specialization: e.target.value })}
                    />
                  ) : (
                    <p className="text-base font-semibold text-slate-800 dark:text-slate-100 border-b border-slate-100 dark:border-slate-700 pb-1.5">{profile.specialization || "General Physician"}</p>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase">Degree / Qualification</label>
                  {isEditing ? (
                    <input
                      className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-sm outline-none focus:border-accent"
                      value={profile.degree}
                      onChange={(e) => setProfile({ ...profile, degree: e.target.value })}
                    />
                  ) : (
                    <p className="text-base font-semibold text-slate-800 dark:text-slate-100 border-b border-slate-100 dark:border-slate-700 pb-1.5">{profile.degree || "MBBS"}</p>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase">Experience (Years)</label>
                  {isEditing ? (
                    <input
                      className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-sm outline-none focus:border-accent"
                      type="number"
                      value={profile.experience}
                      onChange={(e) => setProfile({ ...profile, experience: e.target.value })}
                    />
                  ) : (
                    <p className="text-base font-semibold text-slate-800 dark:text-slate-100 border-b border-slate-100 dark:border-slate-700 pb-1.5">{profile.experience || 0} Years</p>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase">Hospital / Clinic Name</label>
                  {isEditing ? (
                    <input
                      className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-sm outline-none focus:border-accent"
                      value={profile.hospital}
                      onChange={(e) => setProfile({ ...profile, hospital: e.target.value })}
                    />
                  ) : (
                    <p className="text-base font-semibold text-slate-800 dark:text-slate-100 border-b border-slate-100 dark:border-slate-700 pb-1.5">{profile.hospital || "Clinic"}</p>
                  )}
                </div>

                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <label className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase">Professional Bio / Summary</label>
                  {isEditing ? (
                    <textarea
                      className="p-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-sm outline-none focus:border-accent min-h-[90px] resize-y"
                      value={profile.bio}
                      onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                    />
                  ) : (
                    <p className="text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/50 p-3.5 rounded-xl border border-slate-100 dark:border-slate-700 leading-relaxed">
                      {profile.bio || "No summary provided."}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-4">
              {isEditing ? (
                <div className="flex gap-3">
                  <button
                    className="flex-1 py-3 px-6 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-sm"
                    onClick={handleSave}
                  >
                    Save Changes
                  </button>
                  <button
                    className="py-3 px-6 rounded-xl font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                    onClick={() => setIsEditing(false)}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  className="w-full py-3 px-6 rounded-xl font-bold bg-accent hover:bg-accent-hover text-white transition-colors shadow-sm"
                  onClick={() => setIsEditing(true)}
                >
                  Edit Profile Details
                </button>
              )}
            </div>
          </div>
        ) : (
          /* HEALTH ANALYTICS TAB */
          <div className="animate-fadeIn">
            <h2 className="text-slate-800 dark:text-slate-100 mb-5 text-xl font-bold">Health Journey & Biomarkers</h2>

            <div className="flex flex-wrap items-center gap-3 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl mb-6 border border-slate-200 dark:border-slate-700">
              <input
                className="flex-1 min-w-[140px] p-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm outline-none focus:border-accent"
                type="number"
                placeholder="Blood Pressure (sys)"
                value={newVital.bloodPressure}
                onChange={(e) => setNewVital({ ...newVital, bloodPressure: e.target.value })}
              />
              <input
                className="flex-1 min-w-[140px] p-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm outline-none focus:border-accent"
                type="number"
                placeholder="Sugar (mg/dL)"
                value={newVital.sugar}
                onChange={(e) => setNewVital({ ...newVital, sugar: e.target.value })}
              />
              <input
                className="flex-1 min-w-[140px] p-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm outline-none focus:border-accent"
                type="number"
                placeholder="Weight (kg)"
                value={newVital.weight}
                onChange={(e) => setNewVital({ ...newVital, weight: e.target.value })}
              />
              <button
                onClick={handleAddVital}
                className="py-2.5 px-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold transition-colors whitespace-nowrap"
              >
                Log Vitals
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-2xl border border-slate-200 dark:border-slate-700">
                <h3 className="mb-4 text-slate-800 dark:text-slate-100 text-center font-bold text-sm">Blood Pressure & Sugar Trend</h3>
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={vitalsData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color, #eee)" />
                    <XAxis dataKey="date" stroke="var(--text-secondary, #666)" />
                    <YAxis stroke="var(--text-secondary, #666)" />
                    <Tooltip contentStyle={{ background: 'var(--card-bg, white)', border: '1px solid var(--border-color, #eee)', color: 'var(--text-primary, #333)' }} />
                    <Legend />
                    <Line type="monotone" dataKey="bloodPressure" stroke="#ef4444" strokeWidth={2.5} name="BP (sys)" />
                    <Line type="monotone" dataKey="sugar" stroke="#3b82f6" strokeWidth={2.5} name="Sugar" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-2xl border border-slate-200 dark:border-slate-700">
                <h3 className="mb-4 text-slate-800 dark:text-slate-100 text-center font-bold text-sm">Weight Journey (kg)</h3>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={vitalsData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color, #eee)" />
                    <XAxis dataKey="date" stroke="var(--text-secondary, #666)" />
                    <YAxis domain={['dataMin - 2', 'auto']} stroke="var(--text-secondary, #666)" />
                    <Tooltip contentStyle={{ background: 'var(--card-bg, white)', border: '1px solid var(--border-color, #eee)', color: 'var(--text-primary, #333)' }} />
                    <Bar dataKey="weight" fill="#10b981" radius={[4, 4, 0, 0]} name="Weight (kg)" />
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