import { PaginatedResult, PaginationQuery } from '../types';
import { Model, PopulateOptions } from 'mongoose';

export async function paginate<T>(
  model: Model<T>,
  filter: Record<string, unknown>,
  query: PaginationQuery,
  populate?: PopulateOptions | PopulateOptions[],
  select?: string,
): Promise<PaginatedResult<T>> {
  const page = Math.max(1, query.page || 1);
  const limit = Math.min(100, Math.max(1, query.limit || 10));
  const sort: Record<string, 1 | -1> = {};
  if (query.sort) {
    sort[query.sort] = query.order === 'desc' ? -1 : 1;
  } else {
    sort['createdAt'] = -1;
  }

  const skip = (page - 1) * limit;

  let dbQuery = model.find(filter as any).sort(sort).skip(skip).limit(limit);

  if (populate) {
    dbQuery = dbQuery.populate(populate);
  }
  if (select) {
    dbQuery = dbQuery.select(select);
  }

  const [data, total] = await Promise.all([
    dbQuery.lean().exec() as Promise<T[]>,
    model.countDocuments({ ...filter, isDeleted: false } as any).exec(),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}
