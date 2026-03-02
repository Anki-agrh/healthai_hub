### HealthAI Hub - AI-Powered Healthcare
HealthAI Hub is a full-stack MERN (MongoDB, Express, React, Node.js) application designed to bridge the gap between patients and healthcare providers.
It integrates Generative AI for diagnostics, 3D anatomical visualization for interactive symptoms, and real-time communication tools to streamline medical 
consultations.

### Key Features
AI Symptom Checker & Diagnostics: Integrated Gemini 1.5 Flash to provide preliminary health insights and doctor recommendations based on user symptoms.
3D Anatomical Interaction: An interactive 3D skeleton model that allows users to click on specific body parts to trigger targeted AI health analysis.
Real-Time Telemedicine: Socket-based chat system for instant doctor-patient communication and an automated emergency SOS broadcast.
Smart Diet & Nutrition Engine: Profile-based (Veg/Non-Veg) meal planning and recipe generation using AI, tailored to specific health conditions.
Live Queue Management: A real-time token system allowing patients to monitor their live appointment status and wait times.
Geospatial Doctor Discovery: Integration with OpenStreetMap to find nearby hospitals and clinics within a 5km radius.
Automated Appointment System: QR-code based check-in and automated email confirmations with token numbers.
Health Dashboard: you can track your water intake, meditation, as well as set the medication timing.

### Technologies Used
Frontend: React.js, Three.js (for 3D model), CSS3.
Backend: Node.js, Express.js.
Database: MongoDB Atlas (NoSQL).
AI Model: Gemini 1.5 Flash API.
Real-Time Communication: Socket.io.
Other Tools: Multer (File Uploads), Nodemailer (Email service), JWT (Authentication), Node-cron (Daily resets).

### Installation Instructions
1. Clone the repository:
```bash
git clone https://github.com/Anki-agrh/healthai_hub.git
cd healthai-hub
```

2. Setup Backend:

Navigate to the backend folder:
```bash
cd backend
```

Install dependencies:
```bash
npm install
```

Create a .env file in the backend directory and add your credentials:
```text
MONGO_URI=your_mongodb_atlas_link
GEMINI_API_KEY=your_google_gemini_key
JWT_SECRET=your_secret_key
```

Run the server:
```bash
node index.js
```

3. Setup Frontend:

Open a new terminal and navigate to the frontend folder:
```bash
cd frontend
```

Install dependencies:
```bash
npm install
```

Start the React app:
```bash
npm start
```

### How to Use
As a Patient: Register, interact with the 3D model to check symptoms, book appointments, and chat with approved doctors.

As a Doctor: Register and upload documents for admin approval. Once approved, manage your live queue, call the next patient, and consult via chat.
