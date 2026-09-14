import { BadRequestException } from '@nestjs/common';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { extname } from 'node:path';
import { memoryStorage } from 'multer';

export const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024;
const allowedFiles: Record<string, string[]> = {
  '.png': ['image/png'],
  '.jpg': ['image/jpeg'],
  '.jpeg': ['image/jpeg'],
  '.gif': ['image/gif'],
  '.webp': ['image/webp'],
  '.pdf': ['application/pdf'],
  '.txt': ['text/plain'],
  '.docx': [
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
  '.xlsx': [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ],
  '.zip': ['application/zip', 'application/x-zip-compressed'],
};

export const attachmentUploadOptions: MulterOptions = {
  limits: { fileSize: MAX_ATTACHMENT_SIZE, files: 1 },
  storage: memoryStorage(),
  fileFilter: (_request, file, callback) => {
    const extension = extname(file.originalname).toLowerCase();
    const validMimeTypes = allowedFiles[extension];
    if (!validMimeTypes?.includes(file.mimetype)) {
      callback(
        new BadRequestException(
          'Unsupported file type. Allowed: images, PDF, TXT, DOCX, XLSX and ZIP',
        ),
        false,
      );
      return;
    }
    callback(null, true);
  },
};
