import { useState, useEffect } from "react";
import { useToast } from "../context/ToastContext";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";


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
    <div className="flex justify-center p-10 bg-slate-50 dark:bg-slate-900 min-h-[90vh] transition-colors">
      <div className="bg-white dark:bg-slate-800 w-full max-w-[800px] rounded-2xl p-[30px] shadow-[0_10px_30px_rgba(0,0,0,0.05)] text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700">
        <div className="flex flex-col md:flex-row items-center gap-[30px] border-b-2 border-slate-100 dark:border-slate-700 pb-[25px] mb-[25px]">
          <div className="relative w-[150px] h-[150px]">
            <img src={profile.profilePic} alt="Doctor" className="w-full h-full rounded-full object-cover border-4 border-[#0a4db8]" />
            {isEditing && (
              <label className="absolute bottom-0 left-0 bg-[#0a4db8]/80 text-white w-full text-center text-[12px] py-1 cursor-pointer rounded-b-full">
                📷 Change Photo
                <input type="file" hidden onChange={handleImageUpload} />
              </label>
            )}
          </div>
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <h1>{profile.name || "Dr. Name"}</h1>
            <p className="bg-blue-50 dark:bg-blue-900/30 text-accent px-[15px] py-[5px] rounded-full inline-block font-bold mt-2.5">{profile.specialization || "General Physician"}</p>
          </div>
        </div>

        <div className="flex gap-[15px] mt-5 mb-[25px] border-b-2 border-slate-100 dark:border-slate-700 pb-2.5">
          <button className={`bg-transparent border-none text-[1.1rem] font-bold cursor-pointer p-[8px_16px] rounded-lg transition-colors ${activeTab === "Personal" ? "bg-accent text-white" : "text-slate-500 dark:text-slate-400"}`} onClick={() => setActiveTab("Personal")}>Personal Details</button>
          <button className={`bg-transparent border-none text-[1.1rem] font-bold cursor-pointer p-[8px_16px] rounded-lg transition-colors ${activeTab === "Analytics" ? "bg-accent text-white" : "text-slate-500 dark:text-slate-400"}`} onClick={() => setActiveTab("Analytics")}>Health Analytics</button>
        </div>

        {activeTab === "Personal" ? (
          <div className="animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-slate-500 dark:text-slate-400 text-[0.85rem]">Degree</label>
            {isEditing ? <input className="text-[1.1rem] font-semibold text-slate-800 dark:text-slate-100 w-full border-none bg-transparent border-b border-slate-200 dark:border-slate-600 outline-none pb-1" value={profile.degree} onChange={(e) => setProfile({...profile, degree: e.target.value})} /> : <p className="text-[1.1rem] font-semibold text-slate-800 dark:text-slate-100 w-full border-b border-slate-200 dark:border-slate-600 pb-1">{profile.degree || "MBBS, MD"}</p>}
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-slate-500 dark:text-slate-400 text-[0.85rem]">Experience</label>
            {isEditing ? <input className="text-[1.1rem] font-semibold text-slate-800 dark:text-slate-100 w-full border-none bg-transparent border-b border-slate-200 dark:border-slate-600 outline-none pb-1" value={profile.experience} onChange={(e) => setProfile({...profile, experience: e.target.value})} /> : <p className="text-[1.1rem] font-semibold text-slate-800 dark:text-slate-100 w-full border-b border-slate-200 dark:border-slate-600 pb-1">{profile.experience || "0"} Years</p>}
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-slate-500 dark:text-slate-400 text-[0.85rem]">Hospital</label>
            {isEditing ? <input className="text-[1.1rem] font-semibold text-slate-800 dark:text-slate-100 w-full border-none bg-transparent border-b border-slate-200 dark:border-slate-600 outline-none pb-1" value={profile.hospital} onChange={(e) => setProfile({...profile, hospital: e.target.value})} /> : <p className="text-[1.1rem] font-semibold text-slate-800 dark:text-slate-100 w-full border-b border-slate-200 dark:border-slate-600 pb-1">{profile.hospital || "HealthAI Hub Clinic"}</p>}
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-slate-500 dark:text-slate-400 text-[0.85rem]">Age</label>
            {isEditing ? <input className="text-[1.1rem] font-semibold text-slate-800 dark:text-slate-100 w-full border-none bg-transparent border-b border-slate-200 dark:border-slate-600 outline-none pb-1" value={profile.age} onChange={(e) => setProfile({...profile, age: e.target.value})} /> : <p className="text-[1.1rem] font-semibold text-slate-800 dark:text-slate-100 w-full border-b border-slate-200 dark:border-slate-600 pb-1">{profile.age || "N/A"}</p>}
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-1.5">
          <label className="text-slate-500 dark:text-slate-400 text-[0.85rem]">Professional Summary</label>
          {isEditing ? <textarea className="text-[1rem] p-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 w-full h-[100px] resize-none outline-none focus:border-accent" value={profile.bio} onChange={(e) => setProfile({...profile, bio: e.target.value})} /> : <p className="text-[1rem] text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg border border-slate-100 dark:border-slate-700 leading-relaxed">{profile.bio || "Dedicated healthcare professional..."}</p>}
        </div>

        <p>{profile.hospital}</p>
<p>{profile.hospitalAddress}, {profile.city}</p>


        <div className="mt-8">
          {isEditing ? (
            <button className="w-full p-4 rounded-xl border-none font-bold cursor-pointer mt-[30px] bg-emerald-500 hover:bg-emerald-600 text-white transition-colors" onClick={handleSave}>Save Changes</button>
          ) : (
            <button className="w-full p-4 rounded-xl border-none font-bold cursor-pointer mt-[30px] bg-accent hover:bg-accent-hover text-white transition-colors" onClick={() => setIsEditing(true)}>Edit Details</button>
          )}
        </div>
          </div>
        ) : (
          <div className="animate-fadeIn">
            <h2 className="text-slate-800 dark:text-slate-100 mb-5 text-2xl font-bold">Health Journey</h2>
            
            <div className="flex flex-wrap items-center gap-[15px] bg-slate-50 dark:bg-slate-900/50 p-5 rounded-xl mb-[30px] border border-slate-200 dark:border-slate-700">
              <input className="flex-1 min-w-[150px] p-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none focus:border-accent" type="number" placeholder="Blood Pressure (sys)" value={newVital.bloodPressure} onChange={(e) => setNewVital({...newVital, bloodPressure: e.target.value})} />
              <input className="flex-1 min-w-[150px] p-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none focus:border-accent" type="number" placeholder="Sugar (mg/dL)" value={newVital.sugar} onChange={(e) => setNewVital({...newVital, sugar: e.target.value})} />
              <input className="flex-1 min-w-[150px] p-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none focus:border-accent" type="number" placeholder="Weight (kg)" value={newVital.weight} onChange={(e) => setNewVital({...newVital, weight: e.target.value})} />
              <button onClick={handleAddVital} className="p-[12px_25px] bg-emerald-500 hover:bg-emerald-600 text-white border-none rounded-lg font-bold cursor-pointer transition-colors">Log Vitals</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-2xl border border-slate-200 dark:border-slate-700">
                <h3 className="mb-5 text-slate-800 dark:text-slate-100 text-center font-bold">Blood Pressure & Sugar Trend</h3>
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

              <div className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-2xl border border-slate-200 dark:border-slate-700">
                <h3 className="mb-5 text-slate-800 dark:text-slate-100 text-center font-bold">Weight Journey</h3>
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