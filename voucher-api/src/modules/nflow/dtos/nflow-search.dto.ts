export class NflowSearchRes<T> {
  data: T[];
  pageInfo: {
    limit: number;
    offset: number;
    total: number;
    hasMore: boolean;
  };

  constructor(res: any) {
    this.data = res?.data || [];
    this.pageInfo = {
      limit: Number(res?.limit || 0),
      offset: Number(res?.offset || 0),
      total: Number(res?.total || 0),
      hasMore: Boolean(res?.hasMore),
    };
  }
}

export type SearchOperator =
  | '==='
  | '!=='
  | 'isIn'
  | 'isNotIn'
  | 'notContains'
  | 'contains'
  | 'between'
  | '<='
  | '>='
  | '<'
  | '>'
  | 'isNull'
  | 'isNotNull';

export class NflowSearchFilter {
  fieldName: string;
  operator: SearchOperator;
  value: string;
}

export class NflowSearchRequest {
  limit?: number;
  offset?: number;
  filters?: NflowSearchFilter[][];
  searchFields?: string[];
  select?: string[];
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}
