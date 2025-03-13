import { Injectable } from '@nestjs/common';
import { google, drive_v3 } from 'googleapis';
import * as fs from 'fs';
import * as path from 'path';
import { GaxiosResponse } from 'gaxios';
import Stream from 'stream';

@Injectable()
export class GoogleService {
  private drive: drive_v3.Drive;

  constructor() {
    const auth = new google.auth.OAuth2(
      process.env.G_CLIENT_ID,
      process.env.G_CLIENT_SECRET,
      process.env.G_REDIRECT_URI,
    );
    auth.setCredentials({
      access_token: process.env.G_ACCESS_TOKEN,
      refresh_token: process.env.G_REFRESH_TOKEN,
    });

    this.drive = google.drive({ version: 'v3', auth });
  }

  async uploadFiles(urls: string[]) {
    const uploadedFiles: drive_v3.Schema$File[] = [];

    for (const url of urls) {
      const filePath = await this.downloadFile(url);
      if (!filePath) continue;

      try {
        const fileMetadata = {
          name: path.basename(filePath),
          parents: [`${process.env.G_REDIRECT_URI}`],
        };

        const media = {
          mimeType: 'application/octet-stream',
          body: fs.createReadStream(filePath),
        };

        const file = await this.drive.files.create({
          requestBody: fileMetadata,
          media,
          fields: 'id, name, webViewLink, webContentLink',
        });

        uploadedFiles.push(file.data);
      } catch (error) {
        console.error(`Failed to upload file ${filePath}:`, error);
      } finally {
        fs.unlink(filePath, (err) => {
          if (err)
            console.error(
              `Failed to delete temp file ${filePath}:`,
              err.message,
            );
        });
      }
    }

    return uploadedFiles;
  }

  private async downloadFile(url: string): Promise<string | null> {
    try {
      const fileId = this.getFileIdFromUrl(url);

      let response: GaxiosResponse<Stream.Readable>;
      if (url.includes('file')) {
        response = await this.drive.files.get(
          {
            fileId,
            alt: 'media',
          },
          { responseType: 'stream' },
        );
      } else {
        const mimeTypes = {
          document:
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          spreadsheet:
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        };

        response = await this.drive.files.export(
          {
            fileId,
            mimeType: url.includes('document')
              ? mimeTypes.document
              : mimeTypes.spreadsheet,
          },
          { responseType: 'stream' },
        );
      }

      const tempDir = path.resolve(__dirname, './temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      const newFileName = `${Date.now()}_${path.basename(new URL(url).pathname)}`;
      const filePath = path.join(tempDir, newFileName);

      await new Promise<void>((resolve, reject) => {
        const writer = fs.createWriteStream(filePath);
        (response.data as NodeJS.ReadableStream).pipe(writer);

        writer.on('finish', resolve);
        writer.on('error', (err) => {
          writer.close();
          reject(err);
        });
      });

      return filePath;
    } catch (error) {
      console.error('Error downloading file:', error);
      return null;
    }
  }

  getFileIdFromUrl(url: string): string {
    const regex = /\/d\/([a-zA-Z0-9_-]+)/;
    const match = url.match(regex);

    if (match) {
      return match[1];
    }
    return '';
  }
}
