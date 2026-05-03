/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Schema } from "mongoose";
import {
  IPaginationOptions,
  IPaginationResult,
} from "./../interface/pagination";

function paginationPlugin(schema: Schema): void {
  schema.statics.paginate = async function (
    filters: Record<string, any> = {},
    options: IPaginationOptions = {}
  ): Promise<IPaginationResult<any>> {
    const {
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      select = "",
      populate = null,
    } = options;

    // Validate page and limit
    const validatedPage = Math.max(1, parseInt(page.toString()));
    const validatedLimit = Math.min(
      100,
      Math.max(1, parseInt(limit.toString()))
    );

    // Calculate skip value
    const skip = (validatedPage - 1) * validatedLimit;

    // Build sort object
    let sortObject: Record<string, 1 | -1> = {};
    if (sortBy) {
      const sortFields = sortBy.split(",");
      for (const field of sortFields) {
        const trimmedField = field.trim();
        if (trimmedField.startsWith("-")) {
          sortObject[trimmedField.substring(1)] = -1;
        } else {
          sortObject[trimmedField] = 1;
        }
      }
    }

    // Build the query
    let query = this.find(filters);

    // Apply select if provided
    if (select) {
      query = query.select(select);
    }

    // Apply populate if provided
    if (populate) {
      if (Array.isArray(populate)) {
        populate.forEach((pop) => {
          query = query.populate(pop);
        });
      } else {
        query = query.populate(populate);
      }
    }

    // Apply sorting, skip, and limit
    query = query.sort(sortObject).skip(skip).limit(validatedLimit);

    // Execute query and count total documents
    const [data, totalResult] = await Promise.all([
      query.exec(),
      this.countDocuments(filters).exec(),
    ]);

    // Calculate total pages
    const totalPages = Math.ceil(totalResult / validatedLimit);

    return {
      results: data,
      pagination: {
        page: validatedPage,
        limit: validatedLimit,
        totalResult,
        totalPages,
      },
    };
  };
}

export default paginationPlugin;
