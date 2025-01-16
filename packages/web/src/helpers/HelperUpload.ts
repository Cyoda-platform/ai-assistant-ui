export default class HelperUpload {
  static validateFile(file) {
    const MAX_TEXT_FILE_SIZE_MB = 2;
    const MAX_IMAGE_FILE_SIZE_MB = 10;

    const TEXT_FILE_TYPES = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "application/xml",
      "application/json",
    ];

    if (!file) {
      return { isValid: false, message: "The file is missing." };
    }

    const fileType = file.type;
    const fileSizeMB = file.size / (1024 * 1024);

    if (TEXT_FILE_TYPES.includes(fileType) || fileType.startsWith("text/")) {
      if (fileSizeMB > MAX_TEXT_FILE_SIZE_MB) {
        return { isValid: false, message: `The text file size exceeds ${MAX_TEXT_FILE_SIZE_MB} MB.` };
      }
      return { isValid: true, message: "The file is valid as a text file." };
    }

    if (fileType.startsWith("image/")) {
      if (fileSizeMB > MAX_IMAGE_FILE_SIZE_MB) {
        return { isValid: false, message: `The image size exceeds ${MAX_IMAGE_FILE_SIZE_MB} MB.` };
      }
      return { isValid: true, message: "The file is valid as an image." };
    }

    return { isValid: false, message: "The file format is not supported." };
  }
}
