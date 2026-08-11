import { Document, Types } from "mongoose";

/**
 * A saved tournament template (spec §6). settings_json holds the full
 * ContestConfig plus the tournament creation fields, minus the date and course
 * (those are chosen fresh each time). Powers the template picker on the
 * creation form.
 */
export interface ITemplate extends Document {
  creator: Types.ObjectId;
  templateName: string;
  settings: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}
