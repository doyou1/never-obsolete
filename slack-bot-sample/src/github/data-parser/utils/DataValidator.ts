export class DataValidator {
  public static validateRequiredFields<T extends Record<string, any>>(
    data: T,
    requiredFields: (keyof T)[]
  ): void {
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid data provided');
    }

    const missingFields = requiredFields.filter(
      field => !(field in data) || data[field] == null
    );

    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }
  }

  public static isPullRequest(data: any): boolean {
    return 'baseBranch' in data;
  }
}