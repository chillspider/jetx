import { NullableType } from '../types/nullable.type';

type ColumnNumericTransformerOptions = {
  nullable?: boolean;
};

export class ColumnNumericTransformer {
  private readonly nullable: boolean;

  constructor({ nullable = false }: ColumnNumericTransformerOptions = {}) {
    this.nullable = nullable;
  }

  to(data: number): number {
    if (!data) return this.nullable ? null : 0;

    if (!isNaN(data)) {
      return parseFloat((data * 1).toFixed(2));
    }

    return 0;
  }

  from(data?: string): NullableType<number> {
    if (!data) return this.nullable ? null : 0;

    const parsed = parseFloat(data);
    return isNaN(parsed) ? (this.nullable ? null : 0) : parsed;
  }
}
