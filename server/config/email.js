const nodemailer = require('nodemailer');

const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.ADMIN_EMAIL,
      pass: process.env.EMAIL_PASS, // This needs to be an App Password, not regular password
    },
  });
};

const sendNotificationEmail = async (messageDetails) => {
  try {
    const transporter = createTransporter();
    
    // Only send if EMAIL_PASS is configured
    if (!process.env.EMAIL_PASS) {
      console.warn('EMAIL_PASS not configured. Skipping email notification.');
      return false;
    }

    const mailOptions = {
      from: process.env.ADMIN_EMAIL,
      to: process.env.ADMIN_EMAIL, // Send to self
      replyTo: messageDetails.email, // Allow replying directly to the sender
      subject: `New Portfolio Message: ${messageDetails.subject || 'No Subject'}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
          <h2 style="color: #667eea; border-bottom: 2px solid #667eea; padding-bottom: 10px;">New Message from Portfolio</h2>
          <p><strong>From:</strong> ${messageDetails.name} (${messageDetails.email})</p>
          <p><strong>Subject:</strong> ${messageDetails.subject || 'N/A'}</p>
          <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin-top: 20px; white-space: pre-wrap;">
            ${messageDetails.message}
          </div>
          <p style="margin-top: 30px; font-size: 0.9em; color: #7f8c8d;">
            This email was automatically forwarded from your DevOps Portfolio admin panel.
            You can view all messages at <a href="http://localhost:3000/admin">your admin dashboard</a>.
          </p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Notification email sent: %s', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending notification email:', error);
    return false;
  }
};

/**
 * Sends a security alert email when multiple failed login attempts are detected.
 */
const sendSecurityAlertEmail = async ({ ip, attemptedEmail, timestamp, userAgent, attemptCount }) => {
  try {
    if (!process.env.EMAIL_PASS) {
      console.warn(`[SECURITY ALERT] ${attemptCount} failed login attempts from IP: ${ip} for email: ${attemptedEmail} (Email alerts disabled: EMAIL_PASS not set)`);
      return false;
    }

    const transporter = createTransporter();
    const mailOptions = {
      from: process.env.ADMIN_EMAIL,
      to: process.env.ADMIN_EMAIL,
      subject: `🚨 [SECURITY ALERT] ${attemptCount} Failed Admin Login Attempts Detected`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px; border: 2px solid #ef4444; border-radius: 10px; background-color: #fff;">
          <h2 style="color: #dc2626; border-bottom: 2px solid #dc2626; padding-bottom: 10px;">
            ⚠️ Suspicious Admin Login Activity Detected
          </h2>
          <p style="font-size: 15px; color: #374151;">
            The Admin Panel detected <strong>${attemptCount} consecutive failed login attempts</strong>.
          </p>
          <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; border-radius: 4px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Source IP Address:</strong> <code>${ip}</code></p>
            <p style="margin: 5px 0;"><strong>Attempted Email:</strong> <code>${attemptedEmail || 'Unknown'}</code></p>
            <p style="margin: 5px 0;"><strong>Timestamp:</strong> ${timestamp || new Date().toISOString()}</p>
            <p style="margin: 5px 0;"><strong>Device / User-Agent:</strong> <span style="font-size: 12px; color: #6b7280;">${userAgent || 'Unknown'}</span></p>
          </div>
          <p style="color: #4b5563; font-size: 14px;">
            The IP address has been temporarily restricted by rate limiting. If this was not you, your Admin Panel URL or credentials may be under probing.
          </p>
          <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
          <p style="font-size: 12px; color: #9ca3af;">
            Automated security monitor for DevOps Portfolio Admin Console.
          </p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('[SECURITY ALERT] Alert email dispatched to %s: %s', process.env.ADMIN_EMAIL, info.messageId);
    return true;
  } catch (error) {
    console.error('Failed to send security alert email:', error.message);
    return false;
  }
};

module.exports = { sendNotificationEmail, sendSecurityAlertEmail };
