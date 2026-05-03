import { Document, Model } from "mongoose";
import { IPaginationOptions, IPaginationResult } from "./pagination";

export interface PaginateModel<T extends Document> extends Model<T> {
  paginate(
    filters: Record<string, any>,
    options: IPaginationOptions
  ): Promise<IPaginationResult<T>>;
}
