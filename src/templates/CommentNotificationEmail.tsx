import React from "react";
import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Preview,
  Row,
  Section,
  Text,
} from "@react-email/components";

interface CommentNotificationEmailProps {
  ticketId: number;
  commenterName: string;
  trackingId: string;
  frontendUrl: string;
}

export const CommentNotificationEmail: React.FC<
  CommentNotificationEmailProps
> = ({ ticketId, commenterName, trackingId, frontendUrl }) => {
  const trackingLink = `${frontendUrl}/track/${trackingId}`;

  return (
    <Html>
      <Head />
      <Preview>
        New Comment on Ticket #{String(ticketId)} from {commenterName}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={box}>
            <Text style={heading}>New Comment on Your Request</Text>

            <Hr style={hr} />

            <Row style={section}>
              <Text style={label}>Ticket ID:</Text>
              <Text style={value}>#{ticketId}</Text>
            </Row>

            <Row style={section}>
              <Text style={label}>Comment From:</Text>
              <Text style={value}>{commenterName}</Text>
            </Row>

            <Hr style={hr} />

            <Section style={buttonContainer}>
              <Button style={button} href={trackingLink}>
                View Comment
              </Button>
            </Section>

            <Text style={paragraph}>
              Visit the link above to see the new comment and continue your
              conversation.
            </Text>

            <Text style={footer}>
              © 2026 CeiVoice. All rights reserved.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

const main = {
  backgroundColor: "#f3f3f5",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI","Roboto","Oxygen","Ubuntu","Cantarell","Fira Sans","Droid Sans","Helvetica Neue",sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
};

const box = {
  padding: "0 48px",
};

const heading = {
  fontSize: "24px",
  fontWeight: "bold",
  margin: "16px 0",
  padding: "0",
  color: "#1a1a1a",
};

const paragraph = {
  color: "#525252",
  fontSize: "16px",
  lineHeight: "26px",
  margin: "16px 0",
};

const hr = {
  borderColor: "#e5e5e5",
  margin: "20px 0",
};

const section = {
  margin: "12px 0",
};

const label = {
  fontSize: "14px",
  fontWeight: "600",
  color: "#6b7280",
  margin: "0",
};

const value = {
  fontSize: "16px",
  fontWeight: "bold",
  color: "#1a1a1a",
  margin: "0",
};

const buttonContainer = {
  textAlign: "center" as const,
  margin: "24px 0",
};

const button = {
  backgroundColor: "#4CAF50",
  borderRadius: "5px",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "bold",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "block",
  padding: "12px 20px",
};

const footer = {
  color: "#909090",
  fontSize: "12px",
  margin: "0",
};
