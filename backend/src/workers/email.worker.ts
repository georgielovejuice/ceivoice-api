/**
 * Email Queue Worker
 * Processes queued emails from RabbitMQ
 * Run this as a separate service: node dist/workers/email.worker.js
 */

import { processQueuedEmails } from "../services/email.service";

const startEmailWorker = async () => {
  console.log(" Starting Email Queue Worker...");

  try {
    await processQueuedEmails();
  } catch (error) {
    console.error("Fatal error in email worker:", error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("\n Shutting down email worker gracefully...");
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("\n Shutting down email worker gracefully...");
  process.exit(0);
});

// Start the worker
startEmailWorker();
