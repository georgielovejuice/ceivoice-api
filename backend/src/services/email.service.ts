import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

export const sendConfirmationEmail = async (
  email: string,
  trackingId: string,
  ticketId: number
): Promise<boolean> => {
  try {
    const trackingLink = `${process.env.FRONTEND_URL}/track/${trackingId}`;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Request Confirmation - Ticket Tracking",
      html: `
        <h2>Thank you for submitting your request!</h2>
        <p>Your request has been received and is being processed.</p>
        <p><strong>Tracking ID:</strong> ${trackingId}</p>
        <p><strong>Ticket ID:</strong> #${ticketId}</p>
        <p>
          <a href="${trackingLink}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Track Your Request
          </a>
        </p>
        <p>You can use this link to check the status of your request anytime.</p>
      `
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error("Error sending confirmation email:", error);
    return false;
  }
};

export const sendStatusChangeEmail = async (
  email: string,
  ticketId: number,
  newStatus: string,
  trackingId: string
): Promise<boolean> => {
  try {
    const trackingLink = `${process.env.FRONTEND_URL}/track/${trackingId}`;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: `Ticket #${ticketId} Status Updated to ${newStatus}`,
      html: `
        <h2>Your Request Status Has Been Updated</h2>
        <p><strong>Ticket ID:</strong> #${ticketId}</p>
        <p><strong>New Status:</strong> ${newStatus}</p>
        <p>
          <a href="${trackingLink}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
            View Details
          </a>
        </p>
      `
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error("Error sending status change email:", error);
    return false;
  }
};

export const sendCommentNotificationEmail = async (
  email: string,
  ticketId: number,
  commenterName: string,
  trackingId: string
): Promise<boolean> => {
  try {
    const trackingLink = `${process.env.FRONTEND_URL}/track/${trackingId}`;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: `New Comment on Ticket #${ticketId} from ${commenterName}`,
      html: `
        <h2>New Comment on Your Request</h2>
        <p><strong>Ticket ID:</strong> #${ticketId}</p>
        <p><strong>Comment From:</strong> ${commenterName}</p>
        <p>
          <a href="${trackingLink}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
            View Comment
          </a>
        </p>
      `
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error("Error sending comment notification email:", error);
    return false;
  }
};

export const sendAssignmentNotificationEmail = async (
  email: string,
  ticketId: number,
  ticketTitle: string,
  assigneeName: string
): Promise<boolean> => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: `You have been assigned to Ticket #${ticketId}`,
      html: `
        <h2>New Ticket Assignment</h2>
        <p><strong>Ticket ID:</strong> #${ticketId}</p>
        <p><strong>Title:</strong> ${ticketTitle}</p>
        <p><strong>Assigned by:</strong> ${assigneeName}</p>
        <p>Please log in to the system to view the ticket details and start working on it.</p>
      `
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error("Error sending assignment notification email:", error);
    return false;
  }
};
