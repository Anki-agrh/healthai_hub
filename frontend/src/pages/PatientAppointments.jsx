import { useState } from "react";

function PatientAppointments() {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  const bookAppointment = () => {
    fetch(`${process.env.REACT_APP_API}/api/appointments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        patientId: "1",
        patientName: "Demo Patient",
        doctorId: "101",
        doctorName: "Dr Sharma",
        date,
        time
      })
    })
      .then(res => res.json())
      .then(data => alert(data.message));
  };

  return (
    <div>
      <h2>📅 Book Appointment</h2>

      <input type="date" onChange={e => setDate(e.target.value)} />
      <input type="time" onChange={e => setTime(e.target.value)} />

      <button onClick={bookAppointment}>Book</button>
    </div>
  );
}

export default PatientAppointments;
