import { Schema, model } from "mongoose";
import { ICourseLocation, ITournament } from "./tournament.interface";

const courseLocationSchema = new Schema<ICourseLocation>(
  {
    type: {
      type: String,
      enum: ["Point"],
      default: "Point",
      required: true,
    },
    coordinates: {
      type: [Number],
      required: true,
      default: [0, 0],
    },
  },
  { _id: false },
);

const tournamentSchema = new Schema<ITournament>(
  {
    club: {
      type: Schema.Types.ObjectId,
      ref: "Club",
    },

    tournamentCreator: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    tournamentPlayersList: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    tournamentName: {
      type: String,
    },

    tournamentType: {
      type: String,
      required: true,
    },

    typeName: {
      type: String,
      enum: ["big", "small"],
      required: true,
    },

    date: {
      type: String,
      required: true,
    },

    time: {
      type: String,
      required: true,
    },

    endDate: {
      type: String,
    },

    endTime: {
      type: String,
    },

    city: {
      type: String,
      required: true,
    },

    courseName: {
      type: String,
      required: true,
    },

    courseLocation: {
      type: courseLocationSchema,
      required: true,
    },

    status: {
      type: String,
      enum: ["active", "closed", "completed"],
      default: "active",
    },

    isWinnerDeclared: {
      type: Boolean,
      default: false,
    },

    courseRating: {
      type: Number,
      required: true,
      min: 60,
      max: 80,
    },

    teeTime: {
      type: String,
    },

    slopeRating: {
      type: Number,
      required: true,
      min: 55,
      max: 155,
    },

    numberOfPlayers: {
      type: Number,
      required: true,
    },

    gaggleLength: {
      type: Number,
    },

    handicapFromRange: {
      type: Number,
    },

    handicapToRange: {
      type: Number,
    },

    playingConditionAdjustment: {
      type: Number,
      default: 0,
    },

    tournamentImage: {
      type: Object,
      required: [true, "Image is required"],
    },
  },
  { timestamps: true },
);

// geo index
tournamentSchema.index({ courseLocation: "2dsphere" });

export const Tournament = model<ITournament>("Tournament", tournamentSchema);
