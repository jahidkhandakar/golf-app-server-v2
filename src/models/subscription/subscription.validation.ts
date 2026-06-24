import { z } from "zod";

export const createSubscription = z.object({
  subscriptionType: z.enum(["basicUser", "superUser"], {
    message: "subscriptionType must be either basicUser or superUser",
  }),

  stripeSubscriptionId: z.string({
    message: "stripeSubscriptionId is required",
  }),

  stripeCustomerId: z.string({
    message: "stripeCustomerId is required",
  }),

  planType: z.string({
    message: "planType is required",
  }),

  status: z
    .enum(["active", "inactive", "canceled"], {
      message: "status must be active, inactive, or canceled",
    })
    .optional(),

  planPrice: z
    .number({
      message: "planPrice is required",
    })
    .positive({
      message: "planPrice must be a positive number",
    }),

  paymentMethod: z.enum(["credit_card", "paypal"], {
    message: "paymentMethod must be credit_card or paypal",
  }),

  startDate: z.coerce.date().default(() => new Date()),

  endDate: z.coerce.date().optional(),

  lastPaymentDate: z.coerce.date().optional(),
});

export const SubscriptionValidation = {
  createSubscription,
};
