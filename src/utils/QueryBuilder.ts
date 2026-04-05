import {
  IQueryConfig,
  IQueryParams,
  IQueryResult,
  PrismaCountQueryArgs,
  PrismaFindManyArgs,
  PrismaModelDelegates,
  PrismaStringFilter,
  PrismaWhereConditions,
} from "../interface/query.interface";

export class QueryBuilder<
  T, // model type
  TWhereInput = Record<string, unknown>, //type of where input.
  TInclude = Record<string, unknown>, //type of include input.
> {
  private query: PrismaFindManyArgs;
  private countQuery: PrismaCountQueryArgs;
  private page: number = 1;
  private limit: number = 10;
  private skip: number = 0;
  private sortBy: string = "created_at";
  private sortOrder: "asc" | "desc" = "asc";
  private selectFields: Record<string, boolean> | undefined;

  constructor(
    private model: PrismaModelDelegates, // model
    private queryParams: IQueryParams, // request query params
    private config: IQueryConfig = {}, // which fields allow for search, filter.
  ) {
    this.query = {
      where: {},
      orderBy: {},
      skip: 0,
      take: 10,
    };
    this.countQuery = {
      where: {},
    };
  }

  search(): this {
    const { searchTerm } = this.queryParams;
    const { searchableFields } = this.config;

    if (searchTerm && searchableFields && searchableFields.length > 0) {
      const searchConditions: Record<string, unknown>[] = searchableFields.map(
        (field) => {
          if (field.includes(".")) {
            const parts = field.split(".");
            // For Two level relation search like property.name
            if (parts.length === 2) {
              const [relation, nestedFields] = parts;
              const stringFilter: PrismaStringFilter = {
                contains: searchTerm,
                mode: "insensitive",
              };
              return {
                [relation]: {
                  [nestedFields]: stringFilter,
                },
              };
            }
          }
          // Direct field search like name, address
          const stringFilter: PrismaStringFilter = {
            contains: searchTerm,
            mode: "insensitive",
          };
          return {
            [field]: stringFilter,
          };
        },
      );

      const whereConditoins = this.query.where as PrismaWhereConditions;
      whereConditoins.OR = searchConditions;

      const countWhereConditoins = this.countQuery
        .where as PrismaWhereConditions;
      countWhereConditoins.OR = searchConditions;
    }

    return this;
  }

  filter(): this {
    const { filterableFields } = this.config;

    const excludedFields = [
      "searchTerm",
      "page",
      "limit",
      "sortBy",
      "sortOrder",
      "fields",
      "include",
    ];

    const queryWhere = this.query.where as Record<string, unknown>;
    const queryCountWhere = this.countQuery.where as Record<string, unknown>;

    Object.keys(this.queryParams).forEach((key) => {
      // excluded fields skip
      if (excludedFields.includes(key)) return;

      const value = this.queryParams[key];

      // empty value skip
      if (value === undefined || value === "") return;

      // filterable fields check
      const isAllowed =
        !filterableFields ||
        filterableFields.length === 0 ||
        filterableFields.includes(key);

      if (!isAllowed) return;

      // nested relation — "property.city"
      if (key.includes(".")) {
        const [relation, nestedField] = key.split(".");

        // existing relation merge
        const existingRelation =
          (queryWhere[relation] as Record<string, unknown>) ?? {};

        queryWhere[relation] = {
          ...existingRelation,
          [nestedField]: this.parseFilterValue(value),
        };

        const existingCountRelation =
          (queryCountWhere[relation] as Record<string, unknown>) ?? {};

        queryCountWhere[relation] = {
          ...existingCountRelation,
          [nestedField]: this.parseFilterValue(value),
        };

        return;
      }

      // direct field filter
      const parsed = this.parseFilterValue(value);
      queryWhere[key] = parsed;
      queryCountWhere[key] = parsed;
    });

    return this;
  }

  paginate(): this {
    const page = Number(this.queryParams.page) || this.page;
    const limit = Number(this.queryParams.limit) || this.limit;

    this.page = page;
    this.limit = limit;
    this.skip = (page - 1) * limit;

    this.query.skip = this.skip;
    this.query.take = this.limit;

    return this;
  }

  sort(): this {
    const defaultSort = this.config.defaultSortBy ?? "created_at";
    const sortBy = this.queryParams.sortBy || defaultSort;
    const sortOrder = this.queryParams.sortOrder || "desc";

    this.sortBy = sortBy;
    this.sortOrder = sortOrder;
    this.query.orderBy = { [this.sortBy]: this.sortOrder };

    return this;
  }

  fields(): this {
    const fieldsParam = this.queryParams.fields;

    if (fieldsParam && typeof fieldsParam === "string") {
      const fieldsArray = fieldsParam?.split(",").map((field) => field.trim());
      this.selectFields = {};

      fieldsArray?.forEach((field) => {
        if (this.selectFields) {
          this.selectFields[field] = true;
        }
      });

      this.query.select = this.selectFields as Record<
        string,
        boolean | Record<string, unknown>
      >;

      delete this.query.include;
    }
    return this;
  }

  include(relation: TInclude): this {
    if (this.selectFields) {
      return this;
    }
    //if fields method is, include method will be ignored to prevent conflict between select and include
    this.query.include = {
      ...(this.query.include as Record<string, unknown>),
      ...(relation as Record<string, unknown>),
    };

    return this;
  }

  where(condition: TWhereInput): this {
    this.query.where = this.deepMerge(
      this.query.where as Record<string, unknown>,
      condition as Record<string, unknown>,
    );

    this.countQuery.where = this.deepMerge(
      this.countQuery.where as Record<string, unknown>,
      condition as Record<string, unknown>,
    );

    return this;
  }

  async execute(): Promise<IQueryResult<T>> {
    const [total, data] = await Promise.all([
      this.model.count({
        where: this.countQuery.where,
      }),
      this.model.findMany(
        this.query as Parameters<typeof this.model.findMany>[0],
      ),
    ]);

    const totalPages = Math.ceil(total / this.limit);

    return {
      data: data as T[],
      meta: {
        page: this.page,
        limit: this.limit,
        total,
        totalPages,
      },
    };
  }

  async count(): Promise<number> {
    return await this.model.count(
      this.countQuery as Parameters<typeof this.model.count>[0],
    );
  }

  getQuery(): PrismaFindManyArgs {
    return this.query;
  }

  private deepMerge(
    target: Record<string, unknown>,
    source: Record<string, unknown>,
  ): Record<string, unknown> {
    const result = { ...target };

    for (const key in source) {
      if (
        source[key] &&
        typeof source[key] === "object" &&
        !Array.isArray(source[key])
      ) {
        if (
          result[key] &&
          typeof result[key] === "object" &&
          !Array.isArray(result[key])
        ) {
          result[key] = this.deepMerge(
            result[key] as Record<string, unknown>,
            source[key] as Record<string, unknown>,
          );
        } else {
          result[key] = source[key];
        }
      } else {
        result[key] = source[key];
      }
    }
    return result;
  }

  private parseFilterValue(value: unknown): unknown {
    // boolean
    if (value === "true") return true;
    if (value === "false") return false;

    // number string
    if (typeof value === "string" && value !== "" && !isNaN(Number(value))) {
      return Number(value);
    }

    // array — { in: [...] }
    if (Array.isArray(value)) {
      return { in: value.map((item) => this.parseFilterValue(item)) };
    }

    // object — range filter { gte, lte, lt, gt, contains... }
    // monthly_rent[gte]=10000&monthly_rent[lte]=30000
    if (typeof value === "object" && value !== null) {
      const rangeFilter: Record<string, unknown> = {};
      const operators = [
        "lt",
        "lte",
        "gt",
        "gte",
        "equals",
        "not",
        "contains",
        "startsWith",
        "endsWith",
        "in",
        "notIn",
      ];

      Object.keys(value as Record<string, unknown>).forEach((operator) => {
        if (!operators.includes(operator)) return;

        const operatorValue = (value as Record<string, unknown>)[operator];

        if (operator === "in" || operator === "notIn") {
          rangeFilter[operator] = Array.isArray(operatorValue)
            ? operatorValue.map((v) => this.parseFilterValue(v))
            : [this.parseFilterValue(operatorValue)];
          return;
        }

        rangeFilter[operator] = this.parseFilterValue(operatorValue);
      });

      return Object.keys(rangeFilter).length > 0 ? rangeFilter : value;
    }

    return value;
  }
}
