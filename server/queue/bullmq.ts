import { Queue, Worker, QueueEvents, Job } from 'bullmq';
import IORedis from 'ioredis';

// Optional: Use Redis from env, fallback to a mock/skip if not available
const redisUrl = process.env.REDIS_URL;
let connection: IORedis | null = null;

if (redisUrl) {
  try {
    connection = new IORedis(redisUrl, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });
    console.log("Redis connected successfully for BullMQ.");
  } catch (err) {
    console.error("Redis connection failed, queues disabled", err);
  }
}

// Ensure app doesn't crash if Redis is unavailable: define a mock
const createQueue = (name: string) => {
  if (connection) {
    return new Queue(name, { connection: connection as any });
  }
  return {
    add: async (jobName: string, data: any) => {
      console.warn(`[Mock Queue] Job ${jobName} added to ${name} but ignored because Redis is missing.`);
      return { id: Math.random().toString(), data };
    }
  };
};

export const broadcastQueue = createQueue('whatsapp-broadcast');
export const summaryQueue = createQueue('ai-summary-generation');

export const setupWorkers = () => {
  if (!connection) {
    console.log("Skipping BullMQ Worker initialization (No Redis)");
    return;
  }

  const broadcastWorker = new Worker('whatsapp-broadcast', async job => {
    console.log(`Processing WhatsApp Broadcast Payload: ${job.id}`);
    const { ownerId, messageId, to, content } = job.data;
    // Process heavy blast API logic here.
    return { status: "sent", to };
  }, { connection: connection as any });

  const summaryWorker = new Worker('ai-summary-generation', async job => {
    console.log(`Processing AI Summary Generation: ${job.id}`);
    const { textData, model } = job.data;
    // Process heavy AI generation and database writes
    return { status: "summarized" };
  }, { connection: connection as any });

  broadcastWorker.on('completed', job => console.log(`Broadcast Job ${job.id} completed!`));
  broadcastWorker.on('failed', (job, err) => console.log(`Broadcast Job ${job?.id} failed with ${err.message}`));
  
  summaryWorker.on('completed', job => console.log(`Summary Job ${job.id} completed!`));
  
  return { broadcastWorker, summaryWorker };
};
