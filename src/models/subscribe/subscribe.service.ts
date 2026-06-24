import { StatusCodes } from "http-status-codes";
import AppError from "../../errors/AppError";
import { ISubscribe } from "./subscribe.interface";
import Subscribe from "./subscribe.model";
import QueryBuilder from "../../shared/queryBuilder";

const createSubscribe = async (userId: string, data: ISubscribe) => {
  const datas = {
    ...data,
    createdBy: userId,
  };

  const result = await Subscribe.create(datas);
  return result;
};

const showSubscribe = async (query: any) => {
  const filter: any = { ...query };

  const subscribeQuery = new QueryBuilder<ISubscribe>(Subscribe.find(), filter)
    .search(["subscribeType", "price", "typeOfSubscription"])
    .filter()
    .sort()
    .paginate()
    .fields();

  const results = await subscribeQuery.modelQuery.select("__v").lean();

  const meta = await subscribeQuery.countTotal();

  return {
    meta,
    results,
  };
};

const updateSubscribe = async (subscribeId: string, data: ISubscribe) => {
  const findSubscribe = await Subscribe.findById(subscribeId);
  if (!findSubscribe) {
    throw new AppError(StatusCodes.NOT_FOUND, "Subscribe not found");
  }

  const updateData = { ...data };

  const result = await Subscribe.findByIdAndUpdate(subscribeId, updateData, {
    new: true,
  });
  return result;
};

export const SubscribeService = {
  createSubscribe,
  showSubscribe,
  updateSubscribe,
};
