import React from "react";
import { Resend } from "resend";
import { render } from "@react-email/render";
import { ConfirmationEmail } from "../templates/ConfirmationEmail";
import { StatusChangeEmail } from "../templates/StatusChangeEmail";
import { CommentNotificationEmail } from "../templates/CommentNotificationEmail";
import { AssignmentNotificationEmail } from "../templates/AssignmentNotificationEmail";
import { queueService, EmailQueuePayload } from "./queue.service";

const resend = new Resend(process.env.RESEND_API_KEY);

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
const FROM_EMAIL = process.env.FROM_EMAIL || "noreply@ceivoice.com";

/**
 * Queue email for processing via RabbitMQ
 */
const queueEmail = async (payload: EmailQueuePayload): Promise<boolean> => {
  const isQueued = await queueService.publishEmail(payload);
  if (!isQueued) {
    console.warn(`Failed to queue email for ${payload.email}`);
  }
  return isQueued;
};

/**
 * Send confirmation email for new requests
 */
export const sendConfirmationEmail = async (
  email: string,
  trackingId: string,
  ticketId: number,
  useQueue: boolean = true
): Promise<boolean> => {
  try {
    if (useQueue) {
      return await queueEmail({
        type: "confirmation",
        email,
        data: { trackingId, ticketId },
      });
    }

    const htmlContent = await render(
      React.createElement(ConfirmationEmail, {
        email,
        trackingId,
        ticketId,
        frontendUrl: FRONTEND_URL,
      })
    );

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
  trackingId: string,
  useQueue: boolean = true
): Promise<boolean> => {
  try {
    if (useQueue) {
      return await queueEmail({
        type: "status_change",
        email,
        data: { ticketId, newStatus, trackingId },
      });
    }

    const htmlContent = await render(
      React.createElement(StatusChangeEmail, {
        ticketId,
        newStatus,
        trackingId,
        frontendUrl: FRONTEND_URL,
      })
    );

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
  trackingId: string,
  useQueue: boolean = true
): Promise<boolean> => {
  try {
    if (useQueue) {
      return await queueEmail({
        type: "comment_notification",
        email,
        data: { ticketId, commenterName, trackingId },
      });
    }

    const htmlContent = await render(
      React.createElement(CommentNotificationEmail, {
        ticketId,
        commenterName,
        trackingId,
        frontendUrl: FRONTEND_URL,
      })
    );

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
  useQueue: boolean = true
): Promise<boolean> => {
  try {
    if (useQueue) {
      return await queueEmail({
        type: "assignment_notification",
        email,
        data: { ticketId, ticketTitle, assigneeName },
      });
    }

    const htmlContent = await render(
      React.createElement(AssignmentNotificationEmail, {
        ticketId,
        ticketTitle,
        assigneeName,
      })
    );

    const response = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `You have been assigned to Ticket #${ticketId}`,
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
 * Process queued emails (for worker/consumer)
 */
export const processQueuedEmails = async (): Promise<void> => {
  try {
    await queueService.connect();

    await queueService.consumeEmails(async (payload: EmailQueuePayload) => {
      const { type, email, data } = payload;

      console.log(`Processing ${type} email for ${email}`);

      switch (type) {
        case "confirmation":
          await sendConfirmationEmail(
            email,
            data.trackingId,
            data.ticketId,
            false
          );
          break;

        case "status_change":
          await sendStatusChangeEmail(
            email,
            data.ticketId,
            data.newStatus,
            data.trackingId,
            false
          );
          break;

        case "comment_notification":
          await sendCommentNotificationEmail(
            email,
            data.ticketId,
            data.commenterName,
            data.trackingId,
            false
          );
          break;

        case "assignment_notification":
          await sendAssignmentNotificationEmail(
            email,
            data.ticketId,
            data.ticketTitle,
            data.assigneeName,
            false
          );
          break;

        default:
          console.warn(`Unknown email type: ${type}`);
      }
    });
  } catch (error) {
    console.error("Error processing queued emails:", error);
    throw error;
  }
};
