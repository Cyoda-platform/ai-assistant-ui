import { describe, it, expect } from 'vitest';
import HelperUpload from './HelperUpload';

// Helper to create mock File objects
const createMockFile = (name: string, sizeMB: number): File => {
  const sizeBytes = sizeMB * 1024 * 1024;
  return new File(['x'.repeat(sizeBytes)], name, { type: 'application/octet-stream' });
};

describe('HelperUpload', () => {
  describe('validateFile', () => {
    describe('missing file', () => {
      it('should return invalid for null file', () => {
        const result = HelperUpload.validateFile(null as unknown as File);
        expect(result.isValid).toBe(false);
        expect(result.message).toBe('The file is missing.');
      });

      it('should return invalid for undefined file', () => {
        const result = HelperUpload.validateFile(undefined as unknown as File);
        expect(result.isValid).toBe(false);
        expect(result.message).toBe('The file is missing.');
      });
    });

    describe('text files - valid extensions', () => {
      const textFiles = [
        // Documents
        'document.pdf', 'doc.docx', 'spreadsheet.xlsx', 'presentation.pptx',
        'data.xml', 'config.json', 'readme.txt',
        // Configuration
        'config.yml', 'settings.yaml', 'config.toml', 'app.ini',
        'server.cfg', 'nginx.conf', 'app.properties', '.env',
        // Documentation
        'README.md', 'notes.markdown', 'docs.rst', 'paper.tex',
        'thesis.latex', 'query.sql',
        // System/Build
        'dockerfile', 'Dockerfile', '.gitignore', '.gitattributes',
        '.editorconfig', '.htaccess', '.robots', 'makefile', 'Makefile',
        'build.mk', 'CMakeLists.cmake', 'build.gradle',
        // Programming - Web
        'script.js', 'app.ts', 'component.jsx', 'view.tsx',
        // Programming - Systems
        'program.c', 'lib.cpp', 'header.h', 'class.hpp',
        'app.cs', 'service.rs', 'server.go',
        // Programming - Mobile
        'app.swift', 'widget.dart',
        // Programming - Functional
        'module.hs', 'lib.ml', 'app.fs', 'core.clj', 'view.elm',
        // Programming - Scientific
        'analysis.r', 'compute.jl', 'fortran.f90', 'legacy.f95',
        // Programming - Other
        'web.php', 'script.rb', 'app.scala', 'script.lua',
        'system.nim', 'fast.zig', 'verified.v', 'system.d',
        'web.cr', 'phoenix.ex', 'mix.exs', 'process.erl', 'header.hrl',
      ];

      textFiles.forEach(filename => {
        it(`should accept ${filename} under 2MB`, () => {
          const file = createMockFile(filename, 1);
          const result = HelperUpload.validateFile(file);
          expect(result.isValid).toBe(true);
          expect(result.message).toBe('The file is valid as a text file.');
        });
      });
    });

    describe('text files - size validation', () => {
      it('should accept text file exactly at 2MB limit', () => {
        const file = createMockFile('document.pdf', 2);
        const result = HelperUpload.validateFile(file);
        expect(result.isValid).toBe(true);
      });

      it('should reject text file slightly over 2MB', () => {
        const file = createMockFile('document.pdf', 2.1);
        const result = HelperUpload.validateFile(file);
        expect(result.isValid).toBe(false);
        expect(result.message).toBe('The text file size exceeds 2 MB.');
      });

      it('should reject text file way over 2MB', () => {
        const file = createMockFile('large.json', 10);
        const result = HelperUpload.validateFile(file);
        expect(result.isValid).toBe(false);
        expect(result.message).toContain('exceeds 2 MB');
      });

      it('should accept very small text file', () => {
        const file = createMockFile('tiny.txt', 0.001);
        const result = HelperUpload.validateFile(file);
        expect(result.isValid).toBe(true);
      });
    });

    describe('image files - valid extensions', () => {
      const imageFiles = [
        'photo.jpg', 'image.jpeg', 'screenshot.png',
        'animation.gif', 'bitmap.bmp', 'modern.webp',
        'icon.svg', 'favicon.ico',
      ];

      imageFiles.forEach(filename => {
        it(`should accept ${filename} under 10MB`, () => {
          const file = createMockFile(filename, 5);
          const result = HelperUpload.validateFile(file);
          expect(result.isValid).toBe(true);
          expect(result.message).toBe('The file is valid as an image.');
        });
      });
    });

    describe('image files - size validation', () => {
      it('should accept image file exactly at 10MB limit', () => {
        const file = createMockFile('large.png', 10);
        const result = HelperUpload.validateFile(file);
        expect(result.isValid).toBe(true);
      });

      it('should reject image file slightly over 10MB', () => {
        const file = createMockFile('huge.jpg', 10.1);
        const result = HelperUpload.validateFile(file);
        expect(result.isValid).toBe(false);
        expect(result.message).toBe('The image size exceeds 10 MB.');
      });

      it('should reject image file way over 10MB', () => {
        const file = createMockFile('massive.png', 50);
        const result = HelperUpload.validateFile(file);
        expect(result.isValid).toBe(false);
        expect(result.message).toContain('exceeds 10 MB');
      });

      it('should accept very small image file', () => {
        const file = createMockFile('thumbnail.jpg', 0.1);
        const result = HelperUpload.validateFile(file);
        expect(result.isValid).toBe(true);
      });
    });

    describe('unsupported file types', () => {
      const unsupportedFiles = [
        'video.mp4', 'audio.mp3', 'archive.zip', 'executable.exe',
        'library.dll', 'binary.bin', 'database.db', 'unknown.xyz',
      ];

      unsupportedFiles.forEach(filename => {
        it(`should reject ${filename}`, () => {
          const file = createMockFile(filename, 1);
          const result = HelperUpload.validateFile(file);
          expect(result.isValid).toBe(false);
          expect(result.message).toBe('The file format is not supported.');
        });
      });
    });

    describe('case sensitivity', () => {
      it('should handle uppercase extensions', () => {
        const file = createMockFile('DOCUMENT.PDF', 1);
        const result = HelperUpload.validateFile(file);
        expect(result.isValid).toBe(true);
      });

      it('should handle mixed case extensions', () => {
        const file = createMockFile('Image.JpG', 5);
        const result = HelperUpload.validateFile(file);
        expect(result.isValid).toBe(true);
      });

      it('should handle mixed case filenames', () => {
        const file = createMockFile('Dockerfile', 1);
        const result = HelperUpload.validateFile(file);
        expect(result.isValid).toBe(true);
      });
    });

    describe('special filename cases', () => {
      it('should handle dockerfile without extension', () => {
        const file = createMockFile('dockerfile', 1);
        const result = HelperUpload.validateFile(file);
        expect(result.isValid).toBe(true);
      });

      it('should handle makefile without extension', () => {
        const file = createMockFile('makefile', 1);
        const result = HelperUpload.validateFile(file);
        expect(result.isValid).toBe(true);
      });

      it('should handle .env file', () => {
        const file = createMockFile('.env', 1);
        const result = HelperUpload.validateFile(file);
        expect(result.isValid).toBe(true);
      });

      it('should handle .gitignore file', () => {
        const file = createMockFile('.gitignore', 1);
        const result = HelperUpload.validateFile(file);
        expect(result.isValid).toBe(true);
      });
    });

    describe('filename with path', () => {
      it('should handle path-based dockerfile', () => {
        const file = createMockFile('docker/dockerfile', 1);
        const result = HelperUpload.validateFile(file);
        expect(result.isValid).toBe(true);
      });

      it('should handle path with extension', () => {
        const file = createMockFile('src/components/app.tsx', 1);
        const result = HelperUpload.validateFile(file);
        expect(result.isValid).toBe(true);
      });
    });

    describe('edge cases', () => {
      it('should handle file with no extension', () => {
        const file = createMockFile('README', 1);
        const result = HelperUpload.validateFile(file);
        expect(result.isValid).toBe(false);
        expect(result.message).toBe('The file format is not supported.');
      });

      it('should handle file with multiple dots', () => {
        const file = createMockFile('archive.tar.gz', 1);
        const result = HelperUpload.validateFile(file);
        expect(result.isValid).toBe(false);
      });

      it('should handle file with extension in middle', () => {
        const file = createMockFile('file.json.backup', 1);
        const result = HelperUpload.validateFile(file);
        expect(result.isValid).toBe(false);
      });

      it('should handle empty filename', () => {
        const file = createMockFile('', 1);
        const result = HelperUpload.validateFile(file);
        expect(result.isValid).toBe(false);
      });

      it('should handle zero-sized file', () => {
        const file = createMockFile('empty.txt', 0);
        const result = HelperUpload.validateFile(file);
        expect(result.isValid).toBe(true);
      });
    });

    describe('return value structure', () => {
      it('should return object with isValid and message for valid file', () => {
        const file = createMockFile('test.txt', 1);
        const result = HelperUpload.validateFile(file);
        expect(result).toHaveProperty('isValid');
        expect(result).toHaveProperty('message');
        expect(typeof result.isValid).toBe('boolean');
        expect(typeof result.message).toBe('string');
      });

      it('should return object with isValid and message for invalid file', () => {
        const file = createMockFile('test.invalid', 1);
        const result = HelperUpload.validateFile(file);
        expect(result).toHaveProperty('isValid');
        expect(result).toHaveProperty('message');
        expect(typeof result.isValid).toBe('boolean');
        expect(typeof result.message).toBe('string');
      });
    });
  });
});
