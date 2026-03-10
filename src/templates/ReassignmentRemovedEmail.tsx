import React from "react";
import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Preview,
  Row,
  Section,
  Text,
} from "@react-email/components";

interface ReassignmentRemovedEmailProps {
  ticketId: number;
  ticketTitle: string;
}

export const ReassignmentRemovedEmail: React.FC<ReassignmentRemovedEmailProps> = ({
  ticketId,
  ticketTitle,
}) => {
  return (
    <Html>
      <Head />
      <Preview>You have been removed from Ticket #{String(ticketId)}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={box}>
            <Text style={heading}>Assignment Removed</Text>
            <Text style={paragraph}>
              You have been unassigned from the following ticket. No further
              action is required from you.
            </Text>

            <Hr style={hr} />

            <Row style={section}>
              <Text style={label}>Ticket ID:</Text>
              <Text style={value}>#{ticketId}</Text>
            </Row>

            <Row style={section}>
              <Text style={label}>Title:</Text>
              <Text style={value}>{ticketTitle}</Text>
            </Row>

            <Hr style={hr} />

            <Text style={paragraph}>
              If you believe this is a mistake, please contact your
              administrator.
            </Text>

            <Text style={footer}>© 2026 CeiVoice. All rights reserved.</Text>
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
};

const footer = {
  color: "#9ca3af",
  fontSize: "12px",
  marginTop: "32px",
};
