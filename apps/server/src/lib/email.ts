import nodemailer from "nodemailer";

import logger from "./logger";

// Create reusable transporter object using SMTP transport
// For development, you can use services like Mailtrap, Ethereal, or a local SMTP server
// For production, configure with your SMTP provider (Gmail, SendGrid, AWS SES, etc.)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.ethereal.email",
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  replyTo?: string;
  attachments?: Array<{
    filename: string;
    content?: string | Buffer;
    path?: string;
    contentType?: string;
  }>;
}

/**
 * Send an email using Nodemailer
 * @see https://nodemailer.com/
 */
export async function sendEmail(options: SendEmailOptions) {
  const { to, subject, html, text, from, replyTo, attachments } = options;

  const fromAddress = from || process.env.SMTP_FROM_EMAIL || "noreply@example.com";

  try {
    const info = await transporter.sendMail({
      from: fromAddress,
      to: Array.isArray(to) ? to.join(", ") : to,
      subject,
      html,
      text,
      replyTo,
      attachments,
    });

    logger.info(
      {
        messageId: info.messageId,
      },
      "Email sent",
    );

    return { success: true, messageId: info.messageId };
  } catch (error) {
    logger.error({ err: error }, "Email sending error");
    throw error;
  }
}

/**
 * Verify SMTP connection configuration
 * Call this on startup to ensure email sending will work
 */
export async function verifyEmailConnection(): Promise<boolean> {
  try {
    await transporter.verify();
    logger.info("SMTP connection verified successfully");
    return true;
  } catch (error) {
    logger.error({ err: error }, "SMTP connection verification failed");
    return false;
  }
}

/**
 * Get the nodemailer transporter instance for advanced usage
 */
export function getTransporter() {
  return transporter;
}

export { transporter };
