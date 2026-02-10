import amqp from "amqplib";

export interface EmailQueuePayload {
  type:
    | "confirmation"
    | "status_change"
    | "comment_notification"
    | "assignment_notification";
  email: string;
  data: Record<string, any>;
}

class QueueService {
  private connection: any = null;
  private channel: any = null;
  private readonly QUEUE_NAME = "emails";
  private readonly EXCHANGE_NAME = "email_exchange";

  async connect(): Promise<void> {
    try {
      const rabbitMqUrl =
        process.env.RABBITMQ_URL || "amqp://localhost:5672";
      this.connection = await amqp.connect(rabbitMqUrl);
      this.channel = await this.connection.createChannel();

      // Create exchange
      await this.channel.assertExchange(this.EXCHANGE_NAME, "direct", {
        durable: true,
      });

      // Create queue
      await this.channel.assertQueue(this.QUEUE_NAME, {
        durable: true,
        arguments: {
          "x-message-ttl": 86400000, // 24 hours
          "x-max-length": 10000,
        },
      });

      // Bind queue to exchange
      await this.channel.bindQueue(
        this.QUEUE_NAME,
        this.EXCHANGE_NAME,
        "email"
      );

      console.log("✓ Connected to RabbitMQ successfully");
    } catch (error) {
      console.error("Failed to connect to RabbitMQ:", error);
      throw error;
    }
  }

  async publishEmail(payload: EmailQueuePayload): Promise<boolean> {
    try {
      if (!this.channel) {
        throw new Error("Channel not initialized. Call connect() first.");
      }

      const message = Buffer.from(JSON.stringify(payload));
      return this.channel.publish(
        this.EXCHANGE_NAME,
        "email",
        message,
        {
          persistent: true,
          contentType: "application/json",
          timestamp: Date.now(),
        }
      );
    } catch (error) {
      console.error("Error publishing email to queue:", error);
      return false;
    }
  }

  async consumeEmails(
    callback: (payload: EmailQueuePayload) => Promise<void>
  ): Promise<void> {
    try {
      if (!this.channel) {
        throw new Error("Channel not initialized. Call connect() first.");
      }

      await this.channel.prefetch(1);
      await this.channel.consume(
        this.QUEUE_NAME,
        async (msg: any) => {
          if (msg) {
            try {
              const payload = JSON.parse(msg.content.toString());
              await callback(payload);
              this.channel.ack(msg);
            } catch (error) {
              console.error("Error processing email from queue:", error);
              // Requeue message on error
              this.channel.nack(msg, false, true);
            }
          }
        }
      );

      console.log("✓ Started consuming emails from queue");
    } catch (error) {
      console.error("Error consuming emails:", error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.channel) {
        await this.channel.close();
      }
      if (this.connection) {
        await this.connection.close();
      }
      console.log("✓ Disconnected from RabbitMQ");
    } catch (error) {
      console.error("Error disconnecting from RabbitMQ:", error);
    }
  }

  async getQueueStats(): Promise<{
    messageCount: number;
    consumerCount: number;
  } | null> {
    try {
      if (!this.channel) {
        return null;
      }

      const queueInfo = await this.channel.checkQueue(this.QUEUE_NAME);
      return {
        messageCount: queueInfo.messageCount,
        consumerCount: queueInfo.consumerCount,
      };
    } catch (error) {
      console.error("Error getting queue stats:", error);
      return null;
    }
  }
}

export const queueService = new QueueService();
