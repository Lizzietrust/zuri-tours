import dotenv from "dotenv";
import { Email } from "../utils/email.js";

dotenv.config();

async function testEmail() {
  console.log("📧 Testing Email Configuration...");
  console.log("======================================");
  console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
  console.log(`EMAIL_HOST: ${process.env.EMAIL_HOST || "Not set"}`);
  console.log(
    `EMAIL_USERNAME: ${process.env.EMAIL_USERNAME ? "✅ Set" : "❌ Not set"}`,
  );
  console.log(
    `EMAIL_PASSWORD: ${process.env.EMAIL_PASSWORD ? "✅ Set" : "❌ Not set"}`,
  );
  console.log(`EMAIL_FROM: ${process.env.EMAIL_FROM || "Not set"}`);
  console.log("======================================");

  const testEmail = process.env.TEST_EMAIL || "test@example.com";

  try {
    console.log(`\n📤 Sending test email to: ${testEmail}`);

    const user = { email: testEmail, name: "Test User" };
    const emailService = new Email(user, "http://localhost:3000");

    const result = await emailService.send(
      "welcome",
      "🧪 Email Test from Zuri Tours",
      {
        message:
          "This is a test email to verify your email configuration is working correctly!",
      },
    );

    console.log(`✅ Success! Message ID: ${result.messageId}`);
    console.log(
      `\n🔗 Check your Mailtrap inbox: https://sandbox.mailtrap.io/inboxes/${process.env.MAILTRAP_INBOX_ID || "your-inbox-id"}`,
    );
  } catch (error) {
    console.error(`❌ Failed to send email:`, error.message);
  }
}

testEmail();
