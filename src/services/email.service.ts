import React from "react";
import { Resend } from "resend";
import { render } from "@react-email/render";
import { ConfirmationEmail } from "../templates/ConfirmationEmail";
import { StatusChangeEmail } from "../templates/StatusChangeEmail";
import { CommentNotificationEmail } from "../templates/CommentNotificationEmail";
import { AssignmentNotificationEmail } from "../templates/AssignmentNotificationEmail";
import { AdminDraftReadyEmail } from "../templates/AdminDraftReadyEmail";
import { ReassignmentRemovedEmail } from "../templates/ReassignmentRemovedEmail";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

// Set DISABLE_EMAIL=true in .env to suppress all outbound emails (dev/testing)
const EMAIL_DISABLED = process.env.DISABLE_EMAIL === "true";

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
const FROM_EMAIL = process.env.FROM_EMAIL || "noreply@mail.ceivoice.app";

/**
 * Send confirmation email for new requests
*/
export const sendConfirmationEmail = async (
  email: string,
  trackingId: string,
  ticketId: number
): Promise<boolean> => {
  if (EMAIL_DISABLED) {
    console.log(`[Email disabled] Skipping confirmation email to ${email}`);
    return true;
  }
  try {
    const htmlContent = await render(
      React.createElement(ConfirmationEmail, {
        email,
        trackingId,
        ticketId,
        frontendUrl: FRONTEND_URL,
      })
    );

    if (!resend) {
      console.error("Resend client is not initialized. Check RESEND_API_KEY.");
      return false;
    }

    const response = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `Request Confirmation - Ticket Tracking #${ticketId}`,
      html: htmlContent,
    });

    if (response.error) {
      console.error("Error sending confirmation email via Resend:", response.error);
      return false;
    }

    console.log(`✓ Confirmation email sent to ${email}`, response.data);
    return true;
  } catch (error) {
    console.error("Error sending confirmation email:", error);
    return false;
  }
};

/**
 * Send status change notification email
 */
export const sendStatusChangeEmail = async (
  email: string,
  ticketId: number,
  newStatus: string,
  trackingId: string
): Promise<boolean> => {
  if (EMAIL_DISABLED) {
    console.log(`[Email disabled] Skipping status change email to ${email}`);
    return true;
  }
  try {
    const htmlContent = await render(
      React.createElement(StatusChangeEmail, {
        ticketId,
        newStatus,
        trackingId,
        frontendUrl: FRONTEND_URL,
      })
    );

    if (!resend) {
      console.error("Resend client is not initialized. Check RESEND_API_KEY.");
      return false;
    }

    const response = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `Ticket #${ticketId} Status Updated to ${newStatus}`,
      html: htmlContent,
    });

    if (response.error) {
      console.error("Error sending status change email via Resend:", response.error);
      return false;
    }

    console.log(`✓ Status change email sent to ${email}`, response.data);
    return true;
  } catch (error) {
    console.error("Error sending status change email:", error);
    return false;
  }
};

/**
 * Send comment notification email
 */
export const sendCommentNotificationEmail = async (
  email: string,
  ticketId: number,
  commenterName: string,
  trackingId: string
): Promise<boolean> => {
  if (EMAIL_DISABLED) {
    console.log(`[Email disabled] Skipping comment notification email to ${email}`);
    return true;
  }
  try {
    const htmlContent = await render(
      React.createElement(CommentNotificationEmail, {
        ticketId,
        commenterName,
        trackingId,
        frontendUrl: FRONTEND_URL,
      })
    );

    if (!resend) {
      console.error("Resend client is not initialized. Check RESEND_API_KEY.");
      return false;
    }

    const response = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `New Comment on Ticket #${ticketId} from ${commenterName}`,
      html: htmlContent,
    });

    if (response.error) {
      console.error("Error sending comment notification email via Resend:", response.error);
      return false;
    }

    console.log(`✓ Comment notification email sent to ${email}`, response.data);
    return true;
  } catch (error) {
    console.error("Error sending comment notification email:", error);
    return false;
  }
};

/**
 * Send ticket assignment notification email
 */
export const sendAssignmentNotificationEmail = async (
  email: string,
  ticketId: number,
  ticketTitle: string,
  assigneeName: string,
  isReassignment = false
): Promise<boolean> => {
  if (EMAIL_DISABLED) {
    console.log(`[Email disabled] Skipping assignment notification email to ${email}`);
    return true;
  }
  try {
    const htmlContent = await render(
      React.createElement(AssignmentNotificationEmail, {
        ticketId,
        ticketTitle,
        assigneeName,
        isReassignment,
        frontendUrl: FRONTEND_URL,
      })
    );

    if (!resend) {
      console.error("Resend client is not initialized. Check RESEND_API_KEY.");
      return false;
    }

    const subject = isReassignment
      ? `You have been reassigned to Ticket #${ticketId}`
      : `You have been assigned to Ticket #${ticketId}`;

    const response = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject,
      html: htmlContent,
    });

    if (response.error) {
      console.error("Error sending assignment notification email via Resend:", response.error);
      return false;
    }

    console.log(`✓ Assignment notification email sent to ${email}`, response.data);
    return true;
  } catch (error) {
    console.error("Error sending assignment notification email:", error);
    return false;
  }
};

/**
 * Notify an admin that an AI-processed draft ticket is ready for review
 */
export const sendAdminDraftReadyEmail = async (
  email: string,
  ticketId: number,
  ticketTitle: string
): Promise<boolean> => {
  if (EMAIL_DISABLED) {
    console.log(`[Email disabled] Skipping draft-ready email to ${email}`);
    return true;
  }
  try {
    const htmlContent = await render(
      React.createElement(AdminDraftReadyEmail, {
        ticketId,
        ticketTitle,
        frontendUrl: FRONTEND_URL,
      })
    );

    if (!resend) {
      console.error("Resend client is not initialized. Check RESEND_API_KEY.");
      return false;
    }

    const response = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `Draft Ready for Review: Ticket #${ticketId}`,
      html: htmlContent,
    });

    if (response.error) {
      console.error("Error sending draft-ready email via Resend:", response.error);
      return false;
    }

    console.log(`✓ Draft-ready email sent to ${email}`, response.data);
    return true;
  } catch (error) {
    console.error("Error sending draft-ready email:", error);
    return false;
  }
};

/**
 * Notify the removed assignee when they are unassigned from a ticket
 */
export const sendReassignmentRemovedEmail = async (
  email: string,
  ticketId: number,
  ticketTitle: string
): Promise<boolean> => {
  if (EMAIL_DISABLED) {
    console.log(`[Email disabled] Skipping reassignment-removed email to ${email}`);
    return true;
  }
  try {
    const htmlContent = await render(
      React.createElement(ReassignmentRemovedEmail, {
        ticketId,
        ticketTitle,
      })
    );

    if (!resend) {
      console.error("Resend client is not initialized. Check RESEND_API_KEY.");
      return false;
    }

    const response = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `You have been removed from Ticket #${ticketId}`,
      html: htmlContent,
    });

    if (response.error) {
      console.error("Error sending reassignment-removed email via Resend:", response.error);
      return false;
    }

    console.log(`✓ Reassignment-removed email sent to ${email}`, response.data);
    return true;
  } catch (error) {
    console.error("Error sending reassignment-removed email:", error);
    return false;
  }
};

