import nodemailer from "nodemailer";
import pug from "pug";
import { htmlToText } from "html-to-text";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name ? user.name.split(" ")[0] : "Valued Customer";
    this.url = url;
    this.from =
      process.env.EMAIL_FROM || '"Zuri Tours" <noreply@zuri-tours.com>';
    this.user = user;
  }

  static createTransport() {
    if (!process.env.EMAIL_USERNAME || !process.env.EMAIL_PASSWORD) {
      console.warn(
        "⚠️ Email credentials not configured. Using dummy transport.",
      );

      return nodemailer.createTransport({
        host: "smtp.mailtrap.io",
        port: 2525,
        auth: {
          user: "dummy",
          pass: "dummy",
        },
      });
    }

    if (process.env.NODE_ENV === "production") {
      console.log("📧 Using production email service (SendGrid)");

      return nodemailer.createTransport({
        service: "SendGrid",
        auth: {
          user: process.env.SENDGRID_USERNAME,
          pass: process.env.SENDGRID_PASSWORD,
        },
      });
    }

    console.log("📧 Using Mailtrap for development");
    console.log(`   Host: ${process.env.EMAIL_HOST}`);
    console.log(`   Port: ${process.env.EMAIL_PORT}`);
    console.log(
      `   Username: ${process.env.EMAIL_USERNAME ? "✅ Set" : "❌ Not Set"}`,
    );

    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST || "smtp.mailtrap.io",
      port: parseInt(process.env.EMAIL_PORT, 10) || 2525,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },

      rateLimit: true,
      rateLimitDelay: 1000,
    });
  }

  async send(template, subject, additionalData = {}) {
    try {
      let html;
      let text;

      try {
        html = pug.renderFile(
          path.join(__dirname, "..", "views", "email", `${template}.pug`),
          {
            firstName: this.firstName,
            url: this.url,
            subject,
            ...additionalData,
          },
        );
        text = htmlToText(html);
      } catch (templateError) {
        console.warn(`⚠️ Template "${template}" not found, using fallback.`);
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #2c3e50;">Zuri Tours</h1>
            <h2>${subject}</h2>
            <p>Hello ${this.firstName},</p>
            <div style="padding: 15px; background-color: #f8f9fa; border-radius: 5px; margin: 20px 0;">
              ${additionalData.message || "This is an automated email from Zuri Tours."}
            </div>
            ${this.url ? `<p><a href="${this.url}" style="display: inline-block; padding: 10px 20px; background-color: #3498db; color: white; text-decoration: none; border-radius: 5px;">Click here</a></p>` : ""}
            <hr style="border: 1px solid #eee; margin: 20px 0;">
            <p style="color: #7f8c8d; font-size: 14px;">
              This is an automated message from Zuri Tours.
            </p>
          </div>
        `;
        text = htmlToText(html);
      }

      const mailOptions = {
        from: this.from,
        to: this.to,
        subject,
        html,
        text,
      };

      const transport = Email.createTransport();

      if (!process.env.EMAIL_USERNAME || !process.env.EMAIL_PASSWORD) {
        console.log(
          "📧 Email not sent - missing credentials. Here's what would be sent:",
        );
        console.log(`   To: ${this.to}`);
        console.log(`   Subject: ${subject}`);

        return {
          messageId: `mock-${Date.now()}`,
          envelope: { to: [this.to] },
          accepted: [this.to],
          rejected: [],
          pending: [],
          response: "Mock email sent (credentials missing)",
        };
      }

      await new Promise((resolve) => {
        setTimeout(resolve, 500);
      });

      const info = await transport.sendMail(mailOptions);

      if (process.env.NODE_ENV !== "production") {
        console.log(`✅ Email sent to ${this.to}`);
        console.log(`📨 Subject: ${subject}`);
        console.log(
          `🔗 View in Mailtrap: https://sandbox.mailtrap.io/inboxes/${process.env.MAILTRAP_INBOX_ID || "your-inbox-id"}`,
        );
        console.log(`📋 Message ID: ${info.messageId}`);
      }

      return info;
    } catch (error) {
      console.error("❌ Email sending failed:", error.message);
      console.error("   Template:", template);
      console.error("   To:", this.to);
      if (error.response) {
        console.error("   Response:", error.response);
      }

      if (process.env.NODE_ENV !== "production") {
        console.log("📧 Email would have been sent to:", this.to);

        return { messageId: `error-${Date.now()}`, error: error.message };
      }

      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  async sendWelcome() {
    await this.send("welcome", "Welcome to Zuri Tours! 🎉", {
      message:
        "Your account has been successfully created! Start exploring amazing tours today.",
    });
  }

  async sendPasswordReset() {
    await this.send(
      "passwordReset",
      "Your password reset link (valid for 10 minutes)",
      {
        message:
          "You requested to reset your password. Click the link below to set a new password.",
      },
    );
  }

  async sendBookingConfirmation(bookingDetails) {
    await this.send("bookingConfirmation", "Booking Confirmed! 🎫", {
      tourName: bookingDetails.tourName,
      date: bookingDetails.date,
      guests: bookingDetails.guests,
      totalAmount: bookingDetails.totalAmount,
      bookingId: bookingDetails.bookingId,
      message: `Your booking for ${bookingDetails.tourName} has been confirmed!`,
    });
  }

  sendCustomEmail(template, subject, data = {}) {
    return this.send(template, subject, data);
  }
}

export const sendEmail = ({ to, subject, template, data = {}, from }) => {
  const user = { email: to, name: data.firstName || "Valued Customer" };
  const email = new Email(user, data.url || process.env.CLIENT_URL);

  if (from) {
    email.from = from;
  }

  return email.send(template, subject, data);
};

export default Email;
