import { Schema, model } from "mongoose";
import { ITemplate } from "./template.interface";

const templateSchema = new Schema<ITemplate>(
  {
    creator: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    templateName: {
      type: String,
      required: true,
      trim: true,
    },
    // Full ContestConfig + creation fields (minus date/course). Free-form so it
    // tracks the frontend's settings shape without a migration each time.
    settings: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true },
);

templateSchema.index({ creator: 1, templateName: 1 });

export const Template = model<ITemplate>("Template", templateSchema);
