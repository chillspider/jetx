import { isString } from 'lodash';

export class LineBreakFormatter {
  to = (data?: string) => this.formatLineBreaks(data);
  from = (data?: string) => this.formatLineBreaks(data);

  formatLineBreaks(data?: string): string {
    if (!data || !isString(data)) return data;

    return data.replace(/\\n/g, '\n');
  }
}
