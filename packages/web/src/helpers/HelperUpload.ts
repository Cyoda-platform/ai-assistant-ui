export default class HelperUpload {
  static validateFile(file: File) {
    const MAX_TEXT_FILE_SIZE_MB = 2;
    const MAX_IMAGE_FILE_SIZE_MB = 10;

    const SUPPORTED_TEXT_EXTENSIONS = [
      // Documents
      ".pdf", ".docx", ".xlsx", ".pptx", ".xml", ".json", ".txt",

      // Configuration
      ".yml", ".yaml", ".toml", ".ini", ".cfg", ".conf", ".properties", ".env",

      // Documentation / Markup
      ".md", ".markdown", ".rst", ".tex", ".latex", ".sql",

      // System / Build
      "dockerfile", ".dockerfile", ".gitignore", ".gitattributes",
      ".editorconfig", ".htaccess", ".robots",
      "makefile", ".makefile", ".mk", ".cmake", ".gradle",

      // Programming Languages
      // Web
      ".js", ".ts", ".jsx", ".tsx",
      // Systems
      ".c", ".cpp", ".h", ".hpp", ".cs", ".rs", ".go",
      // Mobile
      ".swift", ".dart",
      // Functional
      ".hs", ".ml", ".fs", ".clj", ".elm",
      // Scientific
      ".r", ".jl", ".f90", ".f95",
      // Other
      ".php", ".rb", ".scala", ".lua", ".nim", ".zig", ".v",
      ".d", ".cr", ".ex", ".exs", ".erl", ".hrl"
    ];

    const SUPPORTED_IMAGE_EXTENSIONS = [
      ".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp", ".svg", ".ico"
    ];

    if (!file) {
      return { isValid: false, message: "The file is missing." };
    }

    const fileName = file.name.toLowerCase();
    const fileSizeMB = file.size / (1024 * 1024);

    // Check if file is supported text file by extension
    const isTextFileSupported = SUPPORTED_TEXT_EXTENSIONS.some(ext => {
      if (ext.startsWith('.')) {
        return fileName.endsWith(ext);
      } else {
        // Handle files without extension like 'dockerfile', 'makefile'
        return fileName === ext || fileName.endsWith('/' + ext);
      }
    });

    // Check if file is supported image by extension
    const isImageFileSupported = SUPPORTED_IMAGE_EXTENSIONS.some(ext => 
      fileName.endsWith(ext)
    );

    if (isTextFileSupported) {
      if (fileSizeMB > MAX_TEXT_FILE_SIZE_MB) {
        return { isValid: false, message: `The text file size exceeds ${MAX_TEXT_FILE_SIZE_MB} MB.` };
      }
      return { isValid: true, message: "The file is valid as a text file." };
    }

    if (isImageFileSupported) {
      if (fileSizeMB > MAX_IMAGE_FILE_SIZE_MB) {
        return { isValid: false, message: `The image size exceeds ${MAX_IMAGE_FILE_SIZE_MB} MB.` };
      }
      return { isValid: true, message: "The file is valid as an image." };
    }

    return { isValid: false, message: "The file format is not supported." };
  }
}
