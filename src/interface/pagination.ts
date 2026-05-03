import { PopulateOptions } from 'mongoose';

export interface IPaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  select?: string;
  populate?: PopulateOptions | PopulateOptions[];
}

export interface IPaginationResult<T> {
  results: T[];
  pagination: {
    page: number;
    limit: number;
    totalResult: number;
    totalPages: number;
  };
}