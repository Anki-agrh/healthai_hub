const { google } = require("googleapis");
require("dotenv").config();

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.REDIRECT_URI
);

// terminal me code paste karne ke liye
const AUTH_CODE = process.argv[2];

async function run() {
  if (!AUTH_CODE) {
    console.log("Paste authorization code after command:");
    console.log("node scripts/getRefreshToken.js YOUR_CODE_HERE");
    return;
  }

  const { tokens } = await oauth2Client.getToken(AUTH_CODE);
  console.log("REFRESH TOKEN:\n", tokens.refresh_token);
}

run();
