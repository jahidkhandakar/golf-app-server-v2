import mongoose, { Schema } from "mongoose";
import { ICommonSettings, ISupport } from "./common.interface";

const commonSettingsSchema = new Schema<ICommonSettings>(
  {
    title: { type: String },
    content: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
    },
  },
  { timestamps: true },
);

const supportSchema = new Schema<ISupport>(
  {
    email: {
      type: String,
      required: true,
    },
    phoneNumber: {
      type: String,
      required: true,
    },
    address: {
      type: String,
    },
  },
  { timestamps: true },
);

export const About = mongoose.model<ICommonSettings>(
  "About",
  commonSettingsSchema,
);
export const Terms = mongoose.model<ICommonSettings>(
  "Terms",
  commonSettingsSchema,
);

export const Privacy = mongoose.model<ICommonSettings>(
  "Privacy",
  commonSettingsSchema,
);

export const Support = mongoose.model<ISupport>("Support", supportSchema);
