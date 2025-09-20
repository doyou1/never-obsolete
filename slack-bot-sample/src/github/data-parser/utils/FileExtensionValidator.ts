export class FileExtensionValidator {
  public static getFileExtension(filename: string): string {
    const lastDotIndex = filename.lastIndexOf('.');
    return lastDotIndex === -1 ? '' : filename.substring(lastDotIndex).toLowerCase();
  }

  public static isValidExtension(filename: string, supportedExtensions: string[]): boolean {
    const extension = this.getFileExtension(filename);
    return supportedExtensions.includes(extension);
  }
}