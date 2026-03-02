import React from "react";
import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Link,
  Preview,
  Row,
  Section,
  Text,
} from "@react-email/components";

interface ConfirmationEmailProps {
  email: string;
  trackingId: string;
  ticketId: number;
  frontendUrl: string;
}

export const ConfirmationEmail: React.FC<ConfirmationEmailProps> = ({
  email,
  trackingId,
  ticketId,
  frontendUrl,
}) => {
  const trackingLink = `${frontendUrl}/track/${trackingId}`;

  return (
    <Html>
      <Head />
      <Preview>Request Confirmation - Ticket Tracking #{String(ticketId)}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={box}>
            <Text style={heading}>Thank you for submitting your request!</Text>
            <Text style={paragraph}>
              Your request has been received and is being processed.
            </Text>

            <Hr style={hr} />

            <Row style={section}>
              <Text style={label}>Tracking ID:</Text>
              <Text style={value}>{trackingId}</Text>
            </Row>

            <Row style={section}>
              <Text style={label}>Ticket ID:</Text>
              <Text style={value}>#{ticketId}</Text>
            </Row>

            <Hr style={hr} />

            <Section style={buttonContainer}>
              <Button style={button} href={trackingLink}>
                Track Your Request
              </Button>
            </Section>

            <Text style={paragraph}>
              You can use this link to check the status of your request anytime.
            </Text>

            <Hr style={hr} />

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
