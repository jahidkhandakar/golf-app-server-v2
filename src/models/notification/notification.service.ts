import { Notification } from "./notification.model";
import { INotification } from "./notification.interface";
import QueryBuilder from "../../shared/queryBuilder";
import { Types } from "mongoose";

const getAllNotifaction = async (userId: string, query: any) => {
  const filter: any = { ...query, receiver: new Types.ObjectId(userId) };

  const notificationQuery = new QueryBuilder<INotification>(
    Notification.find(),
    filter,
  )
    .search(["name", "'title", "sender.name"])
    .filter()
    .sort()
    .paginate()
    .fields();

  const results = await notificationQuery.modelQuery
    .select("-isDeleted -__v")
    .lean();

  const meta = await notificationQuery.countTotal();

  return {
    meta,
    results,
  };
};

const markAsRead = async (id: string) => {
  const readNotification = await Notification.findByIdAndUpdate(
    id,
    { isRead: true },
    { new: true },
  );
  return readNotification;
};

export const NotificationService = {
  getAllNotifaction,
  markAsRead,
};
