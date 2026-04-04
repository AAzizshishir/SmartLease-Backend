// import {
//   IQueryParams,
//   PrismaFindManyArgs,
//   PrismaStringFilter,
// } from "../interface/query.interface";

export class QueryBuilder<T> {
  private filters: Record<string, any> = {};
  private sortOptions: Record<string, "asc" | "desc"> = {};
  private pageNumber: number = 1;
  private pageSize: number = 10;
  private query: Record<string, any>;

  constructor(query: Record<string, any>) {
    // req.query আসবে এখানে
    this.query = query;
  }

  // text search — name, address, description
  search(fields: string[]) {
    const searchTerm = this.query.search ?? this.query.searchTerm;

    if (searchTerm) {
      this.filters.OR = fields.map((field) => ({
        [field]: {
          contains: searchTerm,
          mode: "insensitive", // case insensitive
        },
      }));
    }

    return this;
  }

  // Filter
  filter(): this {
    const excludeFields = [
      "search",
      "searchTerm",
      "page",
      "limit",
      "sortBy",
      "sortOrder",
      "fields",
      "includes",
      "minRent",
      "maxRent",
    ];

    Object.keys(this.query).forEach((key) => {
      if (!excludeFields.includes(key) && this.query[key] !== undefined) {
        this.filters[key] = this.query[key];
      }
    });

    return this;
  }

  // range filter — minRent, maxRent
  rangeFilter(field: string, minKey: string, maxKey: string) {
    const min = this.query[minKey];
    const max = this.query[maxKey];

    if (min || max) {
      this.filters[field] = {
        ...(min && { gte: Number(min) }),
        ...(max && { lte: Number(max) }),
      };
    }

    delete this.filters[minKey];
    delete this.filters[maxKey];

    return this;
  }

  // Soft Delete
  softDelete(): this {
    this.filters.is_deleted = false;
    return this;
  }

  // sort — sortBy=monthly_rent&sortOrder=asc
  sort() {
    const sortBy = this.query.sortBy ?? "created_at";
    const sortOrder = this.query.sortOrder === "asc" ? "asc" : "desc";

    this.sortOptions = { [sortBy]: sortOrder };

    return this;
  }

  // pagination — page=1&limit=10
  paginate() {
    this.pageNumber = Number(this.query.page) || 1;
    this.pageSize = Number(this.query.limit) || 10;

    return this;
  }

  build() {
    const skip = (this.pageNumber - 1) * this.pageSize;

    return {
      where: this.filters,
      orderBy: this.sortOptions,
      skip,
      take: this.pageSize,
    };
  }

  // pagination meta — total, page, limit
  async getMeta(countFn: () => Promise<number>) {
    const total = await countFn();

    return {
      total,
      page: this.pageNumber,
      limit: this.pageSize,
      totalPages: Math.ceil(total / this.pageSize),
    };
  }
}
