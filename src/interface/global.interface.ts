export type TResponse<T> = {
  success: boolean;
  statusCode: number;
  message?: string;
  meta?: any;
  data?: T;
};

export type IQueryObj = {
  [key: string]: unknown;
  page?: string;
  limit?: string;
  searchTerm?: string;
  fields?: string;
  sortBy?: string;
  sortOrder?: string;
};

export type ISearchFields = string[];
