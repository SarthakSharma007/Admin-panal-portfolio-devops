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

module.exports = { sendNotificationEmail };
