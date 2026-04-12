const nodemailer = require("nodemailer");
const QRCode = require("qrcode");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

transporter.verify(function (error, success) {
  if (error) {
    console.log("❌ Connection error:", error);
  } else {
    console.log("✅ Server is ready to take our messages");
  }
});

const sendAppointmentEmail = async (patientEmail, patientName, tokenNumber, qrData) => {
  console.log(`📧 Attempting to send email to: ${patientEmail}`);
  try {
    const qrImage = await QRCode.toDataURL(qrData);

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: patientEmail,
      subject: `Appointment Confirmed - Token #${tokenNumber}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 10px; max-width: 500px;">
          <h2 style="color: #0a4db8;">HealthAI Hub - Appointment Confirmed</h2>
          <p>Hi <strong>${patientName}</strong>,</p>
          <p>Your appointment has been successfully booked for today.</p>
          <div style="background: #f4f4f4; padding: 15px; border-radius: 8px; text-align: center;">
            <h3 style="margin: 0;">Token Number: ${tokenNumber}</h3>
            <p style="color: #666;">Scan this QR code at the reception to check-in:</p>
            
            <div style="margin: 20px 0;">
              <img src="cid:qr_image" alt="QR Code" style="width: 200px; height: 200px; border: 1px solid #ddd; padding: 5px; background: white;" />
            </div>

            <code style="background: #fff; padding: 10px; border: 1px dashed #0a4db8; display: block; font-size: 14px;">${qrData}</code>
          </div>
          <p style="margin-top: 20px; font-size: 12px; color: #888;">Note: Scanning your QR activates your priority "Next-But-One" status in the live queue.</p>
        </div>
      `,
      attachments: [
        {
          filename: "qrcode.png",
          content: qrImage.split("base64,")[1],
          encoding: "base64",
          cid: "qr_image",
        },
      ],
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email with QR image sent successfully!");
    console.log("📧 Message ID:", info.messageId);
  } catch (error) {
    console.error("❌ Nodemailer/QR Error:", error.message);
    if (error.code === "EAUTH") {
      console.error("💡 TIP: Check if your App Password in .env is correct.");
    }
  }
};

const sendMeetingEmail = async (patientEmail, doctorName, date, time, meetLink) => {
  console.log(`📧 Attempting to send Meet link to: ${patientEmail}`);
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: patientEmail,
      subject: `Telehealth Consultation Scheduled - ${date}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 10px; max-width: 500px;">
          <h2 style="color: #0a4db8;">Consultation Scheduled</h2>
          <p>Your telehealth consultation with <strong>Dr. ${doctorName}</strong> is confirmed.</p>
          <div style="background: #f4f4f4; padding: 15px; border-radius: 8px;">
            <p><strong>Date:</strong> ${date}</p>
            <p><strong>Time:</strong> ${time}</p>
            <div style="margin: 20px 0; text-align: center;">
              <a href="${meetLink}" style="background-color: #0a4db8; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Join Video Call</a>
            </div>
          </div>
          <p style="margin-top: 20px; font-size: 12px; color: #888;">If the link does not work, copy this URL manually: ${meetLink}</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Meeting Email sent successfully!");
  } catch (error) {
    console.error("❌ Nodemailer Error:", error.message);
  }
};

module.exports = { transporter, sendAppointmentEmail, sendMeetingEmail };
