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

interface StatusChangeEmailProps {
  ticketId: number;
  newStatus: string;
  trackingId: string;
  frontendUrl: string;
}

export const StatusChangeEmail: React.FC<StatusChangeEmailProps> = ({
  ticketId,
  newStatus,
  trackingId,
  frontendUrl,
}) => {
  const trackingLink = `${frontendUrl}/track/${trackingId}`;

  return (
    <Html>
      <Head />
      <Preview>Ticket #{String(ticketId)} Status Updated to {newStatus}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={box}>
            <Text style={heading}>Your Request Status Has Been Updated</Text>

            <Hr style={hr} />

            <Row style={section}>
              <Text style={label}>Ticket ID:</Text>
              <Text style={value}>#{ticketId}</Text>
            </Row>

            <Row style={section}>
              <Text style={label}>New Status:</Text>
              <Text style={{ ...value, color: getStatusColor(newStatus) }}>
                {newStatus}
              </Text>
            </Row>

            <Hr style={hr} />

            <Section style={buttonContainer}>
              <Button style={button} href={trackingLink}>
                View Details
              </Button>
            </Section>

            <Text style={footer}>
              © 2026 CeiVoice. All rights reserved.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

const getStatusColor = (status: string): string => {
  const statusColors: { [key: string]: string } = {
    pending: "#f59e0b",
    in_progress: "#3b82f6",
    completed: "#10b981",
    on_hold: "#8b5cf6",
    closed: "#6b7280",
  };
  return statusColors[status.toLowerCase()] || "#1a1a1a";
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
