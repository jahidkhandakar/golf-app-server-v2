import { z } from "zod";

export const registerSchema = z
  .object({
    fullName: z.string({
      message: "Name is required",
    }),

    email: z
      .string({
        message: "Email is required",
      })
      .email("Invalid email"),

    password: z
      .string({
        message: "Password is required",
      })
      .min(6, "Password must be at least 6 characters"),

    confirmPassword: z
      .string({
        message: "Confirm password is required",
      })
      .min(6, "Confirm password must be at least 6 characters"),

    role: z.enum(["admin", "user"] as const),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        path: ["confirmPassword"],
        message: "Passwords do not match",
        code: z.ZodIssueCode.custom,
      });
    }
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
  email: z
    .string({ message: "Email is required" })
    .email("Invalid email"),
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
