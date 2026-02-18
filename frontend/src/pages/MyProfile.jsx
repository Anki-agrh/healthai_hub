import { useState, useEffect } from "react";
import "./MyProfile.css";

function MyProfile() {
  const [isEditing, setIsEditing] = useState(false);
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

  useEffect(() => {
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user?._id) return;

  fetch(`http://localhost:5000/api/doctors/${user._id}`)
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
        hospital: data.hospitalName || "",
        hospitalAddress: data.hospitalAddress || "",
        city: data.city || "",

        profilePic: data.image
          ? `http://localhost:5000/uploads/${data.image}`
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
    const res = await fetch("http://localhost:5000/api/doctors/update-profile", {
      method: "PUT",
      body: formData
    });

    const data = await res.json();

    if (data.success) {
      alert("Profile updated successfully!");
      setIsEditing(false);

      // refresh profile from backend
      window.location.reload();
    }
  } catch (err) {
    alert("Failed to update profile");
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
    </div>
  );
}

export default MyProfile;