import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { randomUUID } from 'node:crypto';
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import { extname, join, resolve } from 'node:path';

export interface StoredAttachment {
  key: string;
}

@Injectable()
export class AttachmentStorageService {
  private readonly localDirectory: string;

  constructor(private readonly config: ConfigService) {
    this.localDirectory = resolve(
      this.config.get<string>('UPLOAD_DIR') ?? 'uploads',
    );
    if (this.driver === 'cloudinary') {
      cloudinary.config({
        cloud_name: this.config.getOrThrow<string>('CLOUDINARY_CLOUD_NAME'),
        api_key: this.config.getOrThrow<string>('CLOUDINARY_API_KEY'),
        api_secret: this.config.getOrThrow<string>('CLOUDINARY_API_SECRET'),
        secure: true,
      });
    }
  }

  async store(file: Express.Multer.File): Promise<StoredAttachment> {
    return this.driver === 'cloudinary'
      ? this.storeInCloudinary(file)
      : this.storeLocally(file);
  }

  async read(key: string): Promise<Buffer> {
    if (key.startsWith('cloudinary:')) {
      const [, resourceType, encodedPublicId, format] = key.split(':', 4);
      const url = cloudinary.url(decodeURIComponent(encodedPublicId), {
        resource_type: resourceType,
        format: format || undefined,
        secure: true,
      });
      const response = await fetch(url);
      if (!response.ok) throw new Error('Stored attachment is unavailable');
      return Buffer.from(await response.arrayBuffer());
    }
    return readFile(join(this.localDirectory, key));
  }

  async remove(key: string): Promise<void> {
    if (key.startsWith('cloudinary:')) {
      const [, resourceType, encodedPublicId] = key.split(':', 4);
      await cloudinary.uploader.destroy(decodeURIComponent(encodedPublicId), {
        resource_type: resourceType,
        invalidate: true,
      });
      return;
    }
    await unlink(join(this.localDirectory, key)).catch(
      (error: NodeJS.ErrnoException) => {
        if (error.code !== 'ENOENT') throw error;
      },
    );
  }

  private get driver(): 'local' | 'cloudinary' {
    return this.config.get<string>('ATTACHMENT_STORAGE') === 'cloudinary'
      ? 'cloudinary'
      : 'local';
  }

  private async storeLocally(
    file: Express.Multer.File,
  ): Promise<StoredAttachment> {
    await mkdir(this.localDirectory, { recursive: true });
    const key = `${randomUUID()}${extname(file.originalname).toLowerCase()}`;
    await writeFile(join(this.localDirectory, key), file.buffer);
    return { key };
  }

  private storeInCloudinary(
    file: Express.Multer.File,
  ): Promise<StoredAttachment> {
    return new Promise((resolveUpload, rejectUpload) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: `${this.config.get<string>('CLOUDINARY_FOLDER') ?? 'helpdesk'}/attachments`,
          public_id: randomUUID(),
          resource_type: 'auto',
        },
        (error, result) => {
          if (error || !result) {
            rejectUpload(
              new Error(error?.message ?? 'Cloudinary upload failed'),
            );
            return;
          }
          resolveUpload(this.cloudinaryResult(result));
        },
      );
      stream.end(file.buffer);
    });
  }

  private cloudinaryResult(result: UploadApiResponse): StoredAttachment {
    return {
      key: `cloudinary:${result.resource_type}:${encodeURIComponent(result.public_id)}:${result.format ?? ''}`,
    };
  }
}
