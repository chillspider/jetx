/**
 * Validate and format Vietnamese Tax ID (Mã số thuế, MST).
 */
export class VietnamTaxId {
  /**
   * Strip spaces, dots or hyphens.
   */
  private static compact(input: string): string {
    return input.replace(/[\s.-]/g, '');
  }

  /**
   * Check whether a given string is a valid MST.
   */
  static isValid(mst: string): boolean {
    // Remove all whitespace from the input
    const cleaned = mst.replace(/\s+/g, '');

    // Regular expression to match either 10 digits or 10 digits followed by a dash and 3 digits
    return /^\d{10}(-\d{3})?$/.test(cleaned);
  }

  /**
   * Optionally format into the standard form:
   *  - 10 digits unchanged;
   *  - 13 digits as "XXXXXXXXXX-YYY".
   */
  static format(mst: string): string {
    const num = this.compact(mst);
    if (num.length === 10) return num;
    if (num.length === 13) return `${num.slice(0, 10)}-${num.slice(10)}`;

    return mst;
  }
}
