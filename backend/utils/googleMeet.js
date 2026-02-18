const { google } = require("googleapis");
const dayjs = require("dayjs");

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  "http://localhost:5000/oauth2callback"
);

oauth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN
});

const calendar = google.calendar({
  version: "v3",
  auth: oauth2Client
});

async function createMeeting(doctorEmail, patientEmail, date, time) {

  const start = dayjs(`${date} ${time}`).toISOString();
  const end = dayjs(start).add(20, "minute").toISOString();

  const event = await calendar.events.insert({
    calendarId: "primary",
    conferenceDataVersion: 1,
    requestBody: {
      summary: "Doctor Consultation",
      description: "HealthAI Hub Online Visit",
      start: { dateTime: start, timeZone: "Asia/Kolkata" },
      end: { dateTime: end, timeZone: "Asia/Kolkata" },
      attendees: [
        { email: doctorEmail },
        { email: patientEmail }
      ],
      conferenceData: {
        createRequest: {
          requestId: Date.now().toString(),
          conferenceSolutionKey: { type: "hangoutsMeet" }
        }
      }
    }
  });

  return event.data.hangoutLink;
}

module.exports = createMeeting;
