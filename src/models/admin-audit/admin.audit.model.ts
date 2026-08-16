import { Document, Schema, Types, model } from "mongoose";

/**
 * Admin audit log (spec §16). Every code creation, assignment, revocation, and
 * comp action — and any destructive or financial admin action — writes a row
 * with the acting admin and a timestamp. Append-only in practice.
 */
export interface IAdminAuditLog extends Document {
  actingAdmin: Types.ObjectId;
  action: string;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const adminAuditLogSchema = new Schema<IAdminAuditLog>(
  {
    actingAdmin: { type: Schema.Types.ObjectId, ref: "User", required: true },
    action: { type: String, required: true },
    targetType: { type: String },
    targetId: { type: String },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export const AdminAuditLog = model<IAdminAuditLog>(
  "AdminAuditLog",
  adminAuditLogSchema,
);

/** Write an audit entry. Best-effort — never blocks the primary action. */
export const writeAudit = async (entry: {
  actingAdmin: string;
  action: string;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> => {
  try {
    await AdminAuditLog.create(entry);
  } catch {
    // audit must never break the action it records
  }
};
