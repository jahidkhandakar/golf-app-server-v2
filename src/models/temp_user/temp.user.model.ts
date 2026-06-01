import { model, Schema } from "mongoose";
import bcrypt from "bcryptjs";
import validator from "validator";
import { IUser } from "./../user/user.interface";

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      validate(value: string) {
        if (!validator.isEmail(value)) {
          throw new Error("Invalid email");
        }
      },
    },
    password: {
      type: String,
      required: true,
      trim: true,
      select: false,
    },
    role: {
      type: String,
      enum: ["admin", "user", "basicUser", "superUser"],
    },
    dateOfBirth: {
      type: String,
    },
    phone: {
      type: String,
    },
    image: {
      type: String,
      default:
        "https://iter-bene.s3.eu-north-1.amazonaws.com/15206766-215b-415e-8016-dd1bd32c4ad6.png",
    },
    coverImage: {
      type: Object,
    },
    gender: {
      type: String,
      required: false,
    },
    country: {
      type: String,
      required: true,
    },
    myWalet: {
      type: String,
      required: false,
    },
    handicap: {
      type: String,
      required: true,
    },
    clubHandicap: {
      type: Number,
      required: false,
      default: null,
    },
    // add club
    club: {
      type: Schema.Types.ObjectId,
      ref: "Club",
      default: null,
    },
    facebookLink: {
      type: String,
      required: false,
      default: "",
    },
    instagramLink: {
      type: String,
      required: false,
      default: "",
    },
    linkdinLink: {
      type: String,
      required: false,
      default: "",
    },
    xLink: {
      type: String,
      required: false,
      default: "",
    },
    myLocation: {
      type: {
        type: String,
        enum: ["Point"],
        required: false,
        default: "Point",
      },
      coordinates: {
        type: [Number],
        required: false,
        default: [0, 0],
      },
    },
    currentLocation: {
      type: {
        type: String,
        enum: ["Point"],
        required: false,
        default: "Point",
      },
      coordinates: {
        type: [Number],
        required: false,
        default: [0, 0],
      },
    },
    privacyPolicyAccepted: {
      type: Boolean,
      default: false,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isResetPassword: {
      type: Boolean,
      default: false,
    },
    isSubscribe: {
      type: Boolean,
      default: false,
    },
    isAprovedAsSupperUser: {
      type: Boolean,
      default: false,
    },
    teebox: {
      type: String,
      default: "blue",
    },

    fcmToken: {
      type: String,
      required: false,
    },
    oneTimeCode: {
      type: String,
      default: null,
    },

    provider: {
      type: String,
      enum: ["google", "apple"],
    },
    providerId: {
      type: String,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["pending", "active", "inactive", "suspended", "deleted"],
      default: "pending",
    },
  },
  { timestamps: true },
);

// Pre-save hook for hashing password
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// user model
export const TempUser = model<IUser>("TempUser", userSchema);
