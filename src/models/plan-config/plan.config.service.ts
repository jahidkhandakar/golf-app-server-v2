import { StatusCodes } from "http-status-codes";
import AppError from "../../errors/AppError";
import { PlanConfig, DEFAULT_PLANS } from "./plan.config.model";
import { writeAudit } from "../admin-audit/admin.audit.model";

/** Idempotently ensure the two tier rows exist (safe to call repeatedly). */
export const ensureSeeded = async (): Promise<void> => {
  await Promise.all(
    DEFAULT_PLANS.map((p) =>
      PlanConfig.updateOne(
        { tier: p.tier },
        { $setOnInsert: p },
        { upsert: true },
      ),
    ),
  );
};

/** Both tier configs (self-seeds so the list is never empty). */
export const getPlans = async () => {
  await ensureSeeded();
  return PlanConfig.find().sort({ tier: 1 });
};

/**
 * Admin: update a tier's price, currency, interval, and store price-tier
 * mapping (spec §16). Writes an audit entry.
 */
export const updatePlan = async (
  adminId: string,
  tier: "basicUser" | "superUser",
  payload: Partial<{
    price: number;
    currency: string;
    interval: "month" | "year";
    applePriceTier: string;
    googlePriceTier: string;
    active: boolean;
  }>,
) => {
  await ensureSeeded();
  const plan = await PlanConfig.findOneAndUpdate({ tier }, payload, {
    new: true,
  });
  if (!plan) {
    throw new AppError(StatusCodes.NOT_FOUND, "Plan tier not found");
  }
  await writeAudit({
    actingAdmin: adminId,
    action: "plan.update",
    targetType: "PlanConfig",
    targetId: String(plan._id),
    metadata: { tier, ...payload },
  });
  return plan;
};

export const PlanConfigService = {
  ensureSeeded,
  getPlans,
  updatePlan,
};
