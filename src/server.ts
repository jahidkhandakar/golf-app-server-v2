import http from "http";
import cluster from "node:cluster";
import os from "node:os";
import app from "./app";
import { connectDB } from "./config/db";
import { PORT, NODE_ENV } from "./config";
import { logger } from "./logger/logger";

const numCPUs = os.cpus().length;

async function main() {
  const server = http.createServer(app);
  try {
    await connectDB();

    server.listen(Number(PORT), () => {
      logger.info(`🚀 Server is running on Port : ${PORT} [${NODE_ENV}]`);
    });

    // Handle exceptions per worker
    process.on("unhandledRejection", (err) => {
      logger.error(`Server Unhandled rejection: ${err}`);
    });

    process.on("uncaughtException", (error) => {
      logger.error(`Server Uncaught exception: ${error}`);
    });

    process.on("SIGINT", () => {
      logger.info("SIGINT signal received, shutting down...");
      server.close(() => {
        logger.info("HTTP server closed.");
        process.exit(0);
      });
    });

    process.on("SIGTERM", () => {
      logger.info("SIGTERM signal received, shutting down...");
      server.close(() => {
        logger.info("HTTP server closed.");
        process.exit(0);
      });
    });
  } catch (error) {
    logger.error(`❌ Server failed to start: ${error}`);
    process.exit(1);
  }
}

if (cluster.isPrimary && NODE_ENV === "production") {
  logger.info(`Primary ${process.pid} is running. Forking ${numCPUs} workers...`);
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on("exit", (worker) => {
    logger.warn(`Worker ${worker.process.pid} died. Forking a new one...`);
    cluster.fork();
  });
} else {
  main().catch((err) => {
    logger.error(`Server startup error: ${err}`);
  });
}
