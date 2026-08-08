import { Queue, Worker, Job } from "bullmq";
import redis, { isRedisConnected } from "../config/redis";
import { logger } from "../logger/logger";
import { NODE_ENV } from "../config";
import { Tournament } from "../models/tournament/tournament.model";
import { TournamentResult } from "../models/tournament-result/tournament.result.model";

/**
 * 24-hour money purge (spec §2, mandatory). 24 hours after Final Results a
 * scheduled job permanently deletes all dollar amounts from the tournament's
 * skins / KP / long-drive records. Names, holes and win status survive. There
 * is no archive, export, or audit trail of the amounts.
 */

const PURGE_QUEUE_NAME = "amount-purge";
const DEFAULT_DELAY_MS = 24 * 60 * 60 * 1000;

interface PurgeJobData {
  tournamentId: string;
}

let purgeQueue: Queue<PurgeJobData> | null = null;
let purgeWorker: Worker<PurgeJobData> | null = null;

/**
 * Perform the purge. Idempotent: safe to run more than once. Unsets the dollar
 * amount on every skins result and zeroes the pot figures on the tournament's
 * ContestConfig so no amount trail remains, then flags the tournament.
 */
export const purgeAmounts = async (tournamentId: string): Promise<void> => {
  await TournamentResult.updateOne(
    { tournament: tournamentId },
    { $unset: { "skins.$[].amount": "" } },
  );

  await Tournament.updateOne(
    { _id: tournamentId },
    {
      $set: {
        "contestConfig.skinsPot": 0,
        "contestConfig.kpPot": 0,
        "contestConfig.longDrivePot": 0,
        amountsPurged: true,
      },
    },
  );

  logger.info(`💸 Purged all dollar amounts for tournament ${tournamentId}`);
};

if (redis) {
  purgeQueue = new Queue<PurgeJobData>(PURGE_QUEUE_NAME, {
    connection: redis,
    defaultJobOptions: { removeOnComplete: true, removeOnFail: 1000 },
  });

  purgeQueue.on("error", (err) => {
    if (NODE_ENV === "development") return;
    logger.warn(`⚠️ Amount Purge Queue issue: ${err.message}`);
  });

  purgeWorker = new Worker<PurgeJobData>(
    PURGE_QUEUE_NAME,
    async (job: Job<PurgeJobData>) => {
      await purgeAmounts(job.data.tournamentId);
    },
    { connection: redis },
  );

  purgeWorker.on("error", (err) => {
    if (NODE_ENV === "development") return;
    logger.warn(`⚠️ Amount Purge Worker issue: ${err.message}`);
  });
}

/**
 * Schedule the purge to run `delayMs` after now (default 24h). Called by
 * finalize(). A stable jobId keeps it to one purge per tournament even if
 * finalize is triggered more than once.
 *
 * The purge is mandatory and must survive restarts, so it requires Redis/BullMQ
 * — an in-process timer would be lost on restart. If Redis is unavailable this
 * logs an error and reports scheduled:false so the caller can surface it.
 */
export const scheduleAmountPurge = async (
  tournamentId: string,
  delayMs: number = DEFAULT_DELAY_MS,
): Promise<{ scheduled: boolean }> => {
  if (isRedisConnected && purgeQueue) {
    try {
      await purgeQueue.add(
        `purge-${tournamentId}`,
        { tournamentId },
        {
          delay: delayMs,
          jobId: `purge-${tournamentId}`,
          attempts: 5,
          backoff: { type: "exponential", delay: 60_000 },
        },
      );
      return { scheduled: true };
    } catch (error) {
      logger.error(error, `❌ Failed to schedule amount purge ${tournamentId}`);
    }
  }
  logger.error(
    `❌ Amount purge for ${tournamentId} could not be scheduled: Redis unavailable`,
  );
  return { scheduled: false };
};
