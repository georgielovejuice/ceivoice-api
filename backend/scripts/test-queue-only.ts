/**
 * Simple test to verify RabbitMQ queue is working
 */

import dotenv from "dotenv";
dotenv.config();

import { queueService, EmailQueuePayload } from "../src/services/queue.service";

const testQueue = async () => {
  console.log("\n🧪 Testing RabbitMQ Queue Only\n");

  try {
    // Connect to RabbitMQ
    console.log("1️⃣  Connecting to RabbitMQ...");
    await queueService.connect();
    console.log("   ✅ Connected!\n");

    // Queue a test email
    console.log("2️⃣  Queueing test email...");
    const payload: EmailQueuePayload = {
      type: "confirmation",
      email: "test@example.com",
      data: {
        trackingId: "TEST-" + Date.now(),
        ticketId: Math.floor(Math.random() * 10000),
      },
    };

    const result = await queueService.publishEmail(payload);
    
    if (result) {
      console.log("   ✅ Email queued successfully!");
      console.log("   📝 Payload:", JSON.stringify(payload, null, 2));
    } else {
      console.log("   ❌ Failed to queue email");
    }

    console.log("\n✨ Success! RabbitMQ is working.");
    console.log("📊 Check RabbitMQ Management UI: http://localhost:15672");
    console.log("   Username: guest");
    console.log("   Password: guest");
    console.log("\n💡 To process queued emails, the worker needs:");
    console.log("   1. A verified domain in Resend (not gmail.com)");
    console.log("   2. Update FROM_EMAIL in .env to your verified domain");
    console.log("   3. Run: pnpm worker:email:dev\n");

    process.exit(0);
  } catch (error) {
    console.error("\n❌ Error:", error);
    process.exit(1);
  }
};

testQueue();
