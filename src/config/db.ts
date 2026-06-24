import mongoose from "mongoose";
import { DATABASE_URL, NODE_ENV } from "./index";
import { logger } from "../logger/logger";

const MAX_RETRIES = 5;
const RETRY_INTERVAL = 5000; // 5 seconds

export const connectDB = async (retryCount = 0): Promise<void> => {
  if (!DATABASE_URL) {
    logger.error("❌ DATABASE_URL is not defined in .env file");
    process.exit(1);
  }

  try {
    mongoose.set("strictQuery", false);

    const connectionOptions: mongoose.ConnectOptions = {
      autoIndex: NODE_ENV === "development",
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      family: 4, // Use IPv4, skip trying IPv6
    };

    await mongoose.connect(DATABASE_URL, connectionOptions);

    logger.info("✅ MongoDB Connected Successfully");
  } catch (error) {
    logger.error(`❌ MongoDB connection error: ${error}`);

    if (retryCount < MAX_RETRIES) {
      logger.info(
        `Retrying connection in ${RETRY_INTERVAL / 1000}s... (${
          retryCount + 1
        }/${MAX_RETRIES})`,
      );
      setTimeout(() => connectDB(retryCount + 1), RETRY_INTERVAL);
    } else {
      logger.error("❌ Max retries reached. Could not connect to MongoDB.");
      process.exit(1);
    }
  }
};

// Handle connection events
mongoose.connection.on("disconnected", () => {
  logger.warn("⚠️ MongoDB disconnected");
});

mongoose.connection.on("error", (err) => {
  logger.error(`❌ MongoDB error: ${err}`);
});

process.on("SIGINT", async () => {
  await mongoose.connection.close();
  logger.info("MongoDB connection closed through app termination");
  process.exit(0);
});
