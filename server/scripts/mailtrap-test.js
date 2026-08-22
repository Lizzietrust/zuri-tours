import dotenv from "dotenv";
import nodemailer from "nodemailer";

dotenv.config();

async function testMailtrapConnection() {
  console.log("🔍 Testing Mailtrap Connection...");
  console.log("======================================");

  const config = {
    host: process.env.EMAIL_HOST || "smtp.mailtrap.io",
    port: parseInt(process.env.EMAIL_PORT, 10) || 2525,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  };

  console.log("Configuration:");
  console.log(`  Host: ${config.host}`);
  console.log(`  Port: ${config.port}`);
  console.log(`  Username: ${config.auth.user ? "✅ Set" : "❌ Not Set"}`);
  console.log(`  Password: ${config.auth.pass ? "✅ Set" : "❌ Not Set"}`);
  console.log("======================================");

  if (!config.auth.user || !config.auth.pass) {
    console.error("❌ Missing Mailtrap credentials!");
    console.log(
      "Please set EMAIL_USERNAME and EMAIL_PASSWORD in your .env file",
    );

    return;
  }

  try {
    const transporter = nodemailer.createTransport(config);

    await transporter.verify();
    console.log("✅ Connection to Mailtrap successful!");

    await new Promise((resolve) => {
      setTimeout(resolve, 1000);
    });

    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"Zuri Tours" <noreply@zuri-tours.com>',
      to: "test@mailtrap.io",
      subject: "Mailtrap Connection Test",
      html: `
        <h1>✅ Mailtrap Connection Successful!</h1>
        <p>Your Zuri Tours email configuration is working correctly.</p>
        <p><strong>Time:</strong> ${new Date().toISOString()}</p>
        <p><strong>Environment:</strong> ${process.env.NODE_ENV}</p>
        <div style="background-color: #f0f8ff; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Email Service:</strong> Mailtrap</p>
          <p><strong>Status:</strong> ✅ Connected</p>
        </div>
      `,
      text: "Mailtrap Connection Test - Your email configuration is working!",
    });

    console.log("✅ Test email sent successfully!");
    console.log(`📋 Message ID: ${info.messageId}`);
    console.log(
      `🔗 View in Mailtrap: https://sandbox.mailtrap.io/inboxes/${process.env.MAILTRAP_INBOX_ID || "your-inbox-id"}`,
    );
  } catch (error) {
    console.error("❌ Connection failed:", error.message);
    console.error("   Please check your Mailtrap credentials and try again.");

    if (error.code === "EAUTH") {
      console.error(
        "   Authentication failed. Check your EMAIL_USERNAME and EMAIL_PASSWORD.",
      );
    }
    if (error.code === "ECONNECTION") {
      console.error(
        "   Connection failed. Check your EMAIL_HOST and EMAIL_PORT.",
      );
    }
  }
}

testMailtrapConnection();
