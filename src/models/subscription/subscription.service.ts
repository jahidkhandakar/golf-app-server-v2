import { StatusCodes } from "http-status-codes";
import AppError from "../../errors/AppError";
import { ISubscription } from "./subscription.interface";
import Subscription from "./subscription.model";
import { User } from "../user/user.model";
import { sendNotification } from "../../notifications/notification.service";

const showAllSubscribeRequestedUser = async () => {
  const subscribeUser = await Subscription.find({ isApproved: false });
  return subscribeUser;
};

const createSubscription = async (
  userId: string,
  data: Partial<ISubscription>,
) => {
  const {
    subscriptionType,
    stripeSubscriptionId,
    stripeCustomerId,
    planType,
    planPrice,
    paymentMethod,
  } = data;

  const existingSubscription = await Subscription.findOne({
    subscribUser: userId,
    status: "active",
  });

  if (existingSubscription) {
    throw new AppError(
      StatusCodes.CONFLICT,
      "You already have an active subscription",
    );
  }

  const subscription = new Subscription({
    subscribUser: userId,
    subscriptionType,
    stripeSubscriptionId,
    stripeCustomerId,
    planPrice,
    paymentMethod,
    planType,
    isApproved: true,
  });

  await subscription.save();

  if (subscriptionType === "superUser") {
    await User.findByIdAndUpdate(userId, {
      isSubscribe: true,
      role: "superUser",
    });
  }
  if (subscriptionType === "basicUser") {
    await User.findByIdAndUpdate(userId, {
      isSubscribe: true,
      role: "basicUser",
    });
  }

  return subscription;
};

const showAllSubscribeUser = async () => {
  const subscribeUser = await Subscription.find({
    status: "active",
    subscriptionType: "superUser",
    isApproved: true,
  });
  return subscribeUser;
};

const showAllSubscribeUserBlock = async () => {
  const subscribeUser = await Subscription.find({
    status: "canceled",
    isApproved: false,
  });
  return subscribeUser;
};

const canceledSubscriber = async (
  subscribUser: string,
  subscribeId: string,
  id: string,
) => {
  if (!subscribUser) {
    throw new AppError(StatusCodes.NOT_FOUND, "subscribUser not found");
  }

  const result = await Subscription.findByIdAndUpdate(
    subscribeId,
    { status: "canceled" },
    { new: true },
  );

  await sendNotification({
    sender: id,
    receiver: subscribUser,
    title: "Subscription Canceled by Admin",
    body: `Your subscription has been canceled by admin. Please contact the admin.`,
    type: "subscription",
    linkId: `/user/${subscribUser}`,
  });

  return result;
};

const acceptSubscribUser = async (
  subscribUser: string,
  subscribeId: string,
  id: string,
) => {
  if (!subscribUser) {
    throw new AppError(StatusCodes.NOT_FOUND, "subscribUser not found");
  }

  await Subscription.findByIdAndUpdate(subscribeId, { isApproved: true });
  const result = await User.findByIdAndUpdate(
    subscribUser,
    { role: "superUser" },
    { new: true },
  );

  await sendNotification({
    sender: id,
    receiver: subscribUser,
    title: "Subscription Approved",
    body: `Your subscription has been approved and your role is now updated to superUser.`,
    type: "subscription",
    linkId: `/user/${subscribUser}`,
  });

  return result;
};

export const SubscriptionService = {
  createSubscription,
  showAllSubscribeRequestedUser,
  showAllSubscribeUser,
  showAllSubscribeUserBlock,
  canceledSubscriber,
  acceptSubscribUser,
};
