/**
 * Test script for RabbitMQ and Resend Email Integration
 * Usage: ts-node scripts/test-rabbitmq-email.ts <your-email@example.com>
 */

// Load environment variables FIRST before any imports
import dotenv from "dotenv";
dotenv.config();

import { queueService } from "../src/services/queue.service";
import { sendConfirmationEmail } from "../src/services/email.service";

const testRabbitMQAndEmail = async () => {
  console.log("\n🚀 Starting RabbitMQ and Resend Email Test\n");

  // Get email from command line args or use default
  const testEmail = process.argv[2] || "cjessadapiroj@gmail.com";

  console.log("📧 Test email:", testEmail);
  console.log("🔑 Resend API Key:", process.env.RESEND_API_KEY ? "✓ Set" : "✗ Missing");
  console.log("🐰 RabbitMQ URL:", process.env.RABBITMQ_URL || "amqp://localhost:5672");
  console.log("");

  try {
    // Step 1: Connect to RabbitMQ
    console.log("1️⃣  Connecting to RabbitMQ...");
    await queueService.connect();
    console.log("   ✓ RabbitMQ connected successfully\n");

    // Step 2: Test direct email sending (without queue)
    console.log("2️⃣  Testing direct email sending (Resend API)...");
    const directResult = await sendConfirmationEmail(
      testEmail,
      "TEST-TRACK-001",
      12345,
      false // Don't use queue for direct test
    );

    if (directResult) {
      console.log("   ✓ Direct email sent successfully via Resend\n");
    } else {
      console.log("   ✗ Failed to send direct email\n");
    }

    // Step 3: Test queued email sending (via RabbitMQ)
    console.log("3️⃣  Testing queued email sending (RabbitMQ + Resend)...");
    const queuedResult = await sendConfirmationEmail(
      testEmail,
      "TEST-TRACK-002",
      12346,
      true // Use queue
    );

    if (queuedResult) {
      console.log("   ✓ Email queued successfully in RabbitMQ");
      console.log("   ⚠️  Note: You need to run the email worker to process the queue");
      console.log("   📝 Run: pnpm worker:email:dev\n");
    } else {
      console.log("   ✗ Failed to queue email\n");
    }

    // Step 4: Show queue statistics
    console.log("4️⃣  Test completed!");
    console.log("\n📊 Next Steps:");
    console.log("   • Check your email inbox for direct email");
    console.log("   • Start email worker: pnpm worker:email:dev");
    console.log("   • Check RabbitMQ UI: http://localhost:15672 (guest/guest)");
    console.log("   • Check queue messages in RabbitMQ Management UI\n");

    process.exit(0);
  } catch (error) {
    console.error("\n❌ Error during test:", error);
    process.exit(1);
  }
};

// Run the test
testRabbitMQAndEmail();
