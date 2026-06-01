import { z } from "zod";

const registerSchema = z.object({
  name: z
    .string({
      message: "Name is required",
    })
    .min(1, "Name is required"),

  email: z
    .string({
      message: "Email is required",
    })
    .email("Invalid email"),

  password: z
    .string({
      message: "Password is required",
    })
    .min(8, "Password must be at least 8 characters")
    .refine((value) => /[a-zA-Z]/.test(value), {
      message: "Password must contain at least 1 letter",
    })
    .refine((value) => /\d/.test(value), {
      message: "Password must contain at least 1 number",
    }),

  role: z.enum(["admin", "user", "basicUser", "superUser"] as const, {
    message: "Invalid role",
  }),

  country: z
    .string({
      message: "Country is required",
    })
    .min(1, "Country is required"),

  handicap: z
    .string({
      message: "Handicap is required",
    })
    .min(1, "Handicap is required"),

  coordinates: z
    .array(z.number(), {
      message: "Coordinates must be an array of numbers",
    })
    .length(2, "Coordinates must contain exactly [longitude, latitude]")
    .refine(
      (coords) => {
        const [lng, lat] = coords;

        const isValidLng = lng >= -180 && lng <= 180;
        const isValidLat = lat >= -90 && lat <= 90;

        return isValidLng && isValidLat;
      },
      {
        message: "Invalid coordinates range",
      },
    ),
});

const loginUserSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z
    .string({
      message: "Password is required",
    })
    .min(6, "Confirm password must be at least 6 characters"),
});

const otpSchema = z.object({
  otp: z.string({
    message: "Otp is required",
  }),
});

const forgotPasswordSchema = z.object({
  email: z.string({ message: "Email is required" }).email("Invalid email"),
});

const resetPasswordSchema = z.object({
  newPassword: z
    .string({
      message: "Password is required",
    })
    .min(6, "Confirm password must be at least 6 characters"),
  confirmPassword: z
    .string({
      message: "Confirm password is required",
    })
    .min(6, "Confirm password must be at least 6 characters"),
});

const changePasswordSchema = z.object({
  oldPassword: z
    .string({
      message: "Old password is required",
    })
    .min(6, "Confirm password must be at least 6 characters"),
  newPassword: z
    .string({
      message: "New password is required",
    })
    .min(6, "New password must be at least 6 characters"),
  confirmPassword: z
    .string({
      message: "Confirm password is required",
    })
    .min(6, "Confirm password must be at least 6 characters"),
});

const googleLoginSchema = z.object({
  idToken: z.string({
    message: "Google ID token is required",
  }),
  role: z.enum(["customer", "provider"] as const),
});

const appleLoginSchema = z.object({
  identityToken: z.string({
    message: "Apple identity token is required",
  }),
  role: z.enum(["customer", "provider"] as const),
  user: z
    .object({
      name: z
        .object({
          firstName: z.string().optional(),
          lastName: z.string().optional(),
        })
        .optional(),
      email: z.string().email().optional(),
    })
    .optional(),
});

export const authValidation = {
  registerSchema,
  loginUserSchema,
  otpSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  googleLoginSchema,
  appleLoginSchema,
};
