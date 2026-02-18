import { useEffect, useState } from "react";

function DoctorAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;

  // Protect page
  useEffect(() => {
    if (!user) {
      window.location.href = "/login";
      return;
    }

    if (user.role !== "doctor") {
      window.location.href = "/";
      return;
    }
  }, [user]);


  useEffect(() => {
  if (!user || user.role !== "doctor") return;

  fetch(`${process.env.REACT_APP_API}/api/doctor/appointments/${user._id}`, {
  headers: {
    "Authorization": `Bearer ${localStorage.getItem("token")}`
  }
})
    .then(res => res.json())
    .then(data => setAppointments(data))
    .finally(() => setLoading(false));

}, [user]);

  const approve = (id) => {
    fetch(`${process.env.REACT_APP_API}/api/appointments/approve`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${localStorage.getItem("token")}`
  },
  body: JSON.stringify({ appointmentId: id })
})

      .then(res => res.json())
      .then(() => {
        setAppointments(
          appointments.map(a =>
            a._id === id ? { ...a, status: "approved" } : a
          )
        );
      });
  };

  if (loading) return <div>Loading doctor dashboard...</div>;

  return (
    <div>
      <h2>👨‍⚕️ Doctor Appointments</h2>

      {appointments.map(a => (
        <div key={a._id}>
          <p>{a.patientName} — {a.date} {a.time}</p>
          <p>Status: {a.status}</p>
          {a.status === "pending" && (
            <button onClick={() => approve(a._id)}>Approve</button>
          )}
        </div>
      ))}
    </div>
  );
}

export default DoctorAppointments;
