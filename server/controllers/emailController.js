import { Email, sendEmail } from "../utils/email.js";

export const sendWelcomeEmail = async (req, res) => {
  try {
    const { email, name } = req.body;

    if (!email || !name) {
      return res.status(400).json({
        success: false,
        message: "Email and name are required",
      });
    }

    const user = { email, name };
    const emailService = new Email(user, process.env.CLIENT_URL);

    await emailService.sendWelcome();

    res.status(200).json({
      success: true,
      message: "Welcome email sent successfully",
    });
  } catch (error) {
    console.error("Error sending welcome email:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send welcome email",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

export const sendPasswordResetEmail = async (req, res) => {
  try {
    const { email, resetToken, name } = req.body;

    if (!email || !resetToken) {
      return res.status(400).json({
        success: false,
        message: "Email and reset token are required",
      });
    }

    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
    const user = { email, name: name || "User" };
    const emailService = new Email(user, resetUrl);

    await emailService.sendPasswordReset();

    res.status(200).json({
      success: true,
      message: "Password reset email sent successfully",
    });
  } catch (error) {
    console.error("Error sending password reset email:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send password reset email",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

export const sendBookingConfirmation = async (req, res) => {
  try {
    const { email, name, bookingDetails } = req.body;

    if (!email || !name || !bookingDetails) {
      return res.status(400).json({
        success: false,
        message: "Email, name, and booking details are required",
      });
    }

    const user = { email, name };
    const emailService = new Email(
      user,
      `${process.env.CLIENT_URL}/bookings/${bookingDetails.bookingId}`,
    );

    await emailService.sendBookingConfirmation(bookingDetails);

    res.status(200).json({
      success: true,
      message: "Booking confirmation email sent successfully",
    });
  } catch (error) {
    console.error("Error sending booking confirmation:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send booking confirmation",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

export const sendCustomEmail = async (req, res) => {
  try {
    const { to, subject, template, data = {} } = req.body;

    if (!to || !subject || !template) {
      return res.status(400).json({
        success: false,
        message: "To, subject, and template are required",
      });
    }

    const result = await sendEmail({
      to,
      subject,
      template,
      data,
    });

    res.status(200).json({
      success: true,
      message: "Custom email sent successfully",
      data: result,
    });
  } catch (error) {
    console.error("Error sending custom email:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send custom email",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

export const testEmail = async (req, res) => {
  try {
    const { email } = req.body;
    const testEmail = email || "test@example.com";

    const nodemailer = await import("nodemailer");

    const transport = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || "smtp.mailtrap.io",
      port: parseInt(process.env.EMAIL_PORT, 10) || 2525,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const testHtml = `
      <h1>✅ Email Test Successful!</h1>
      <p>Your Zuri Tours email configuration is working correctly.</p>
      <div style="background-color: #f0f8ff; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p><strong>Environment:</strong> ${process.env.NODE_ENV}</p>
        <p><strong>Mail Service:</strong> ${process.env.NODE_ENV === "production" ? "SendGrid" : "Mailtrap"}</p>
        <p><strong>Time:</strong> ${new Date().toISOString()}</p>
      </div>
      <p>🎉 Congratulations! Your email setup is complete.</p>
    `;

    const info = await transport.sendMail({
      from: process.env.EMAIL_FROM || '"Zuri Tours" <noreply@zuri-tours.com>',
      to: testEmail,
      subject: "Zuri Tours - Email Configuration Test",
      html: testHtml,
      text: "Your email configuration is working correctly!",
    });

    console.log(`✅ Test email sent to ${testEmail}`);
    console.log(`📋 Message ID: ${info.messageId}`);

    res.status(200).json({
      success: true,
      message: "Test email sent successfully",
      to: testEmail,
      messageId: info.messageId,
    });
  } catch (error) {
    console.error("Error sending test email:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send test email",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
