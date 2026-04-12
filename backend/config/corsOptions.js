const allowedOrigins = [
  "https://healthai-hub.vercel.app",
  "https://healthai-9mseqifpy-ankita-agraharis-projects.vercel.app",
  "http://localhost:3000",
  "http://localhost:3001"
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || origin.endsWith(".vercel.app") || allowedOrigins.includes(origin) || origin.includes("localhost")) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
};

module.exports = corsOptions;
