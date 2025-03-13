import { Injectable } from '@nestjs/common';
import { google, drive_v3 } from 'googleapis';
import * as fs from 'fs';
import * as path from 'path';
import { GaxiosResponse } from 'gaxios';
import Stream from 'stream';
import { OAuth2Client } from 'googleapis-common';

@Injectable()
export class GoogleService {
  private authClient: OAuth2Client;
  private drive: drive_v3.Drive;

  constructor() {
    this.authClient = new google.auth.OAuth2(
      process.env.G_CLIENT_ID,
      process.env.G_CLIENT_SECRET,
      process.env.G_REDIRECT_URI,
    );
  }

  getAuthenticationUrl() {
    return this.authClient.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: 'https://www.googleapis.com/auth/drive',
      include_granted_scopes: true,
    });
  }

  async initDriveAPI(code: string) {
    try {
      const { tokens } = await this.authClient.getToken(code);
      const accessToken = tokens.access_token;
      const refreshToken = tokens.refresh_token;

      this.authClient.setCredentials({
        refresh_token: refreshToken,
        access_token: accessToken,
      });

      this.drive = google.drive({ version: 'v3', auth: this.authClient });

      console.log('Google authentication successful!');
      return 'Google authentication successful!';
    } catch (error) {
      console.error('Error authenticating:', error);
      throw new Error('Error authenticating');
    }
  }

  async uploadFiles(urls: string[]) {
    const uploadedFiles: drive_v3.Schema$File[] = [];

    for (const url of urls) {
      const filePath = await this.downloadFile(url);
      if (!filePath) continue;

      try {
        const fileMetadata = {
          name: path.basename(filePath),
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
      let fileType = 'file';
      if (url.includes('document')) {
        fileType = 'document';
      }
      if (url.includes('spreadsheet')) {
        fileType = 'spreadsheet';
      }

      let response: GaxiosResponse<Stream.Readable>;
      if (fileType === 'file') {
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
            mimeType:
              fileType === 'document'
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

      const newFileName = `${Date.now()}_${fileType}`;
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

  async updateFileById(id: string, newName: string) {
    try {
      const file = await this.drive.files.update({
        fileId: id,
        requestBody: { name: newName },
        fields: 'id, name, webViewLink, webContentLink',
      });
      return file;
    } catch (error) {
      console.error('Error updating file:', error);
      throw new Error('Error updating file');
    }
  }

  async deleteFileById(id: string) {
    try {
      await this.drive.files.delete({ fileId: id });
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  }

  private getFileIdFromUrl(url: string): string {
    const regex = /\/d\/([a-zA-Z0-9_-]+)/;
    const match = url.match(regex);

    if (match) {
      return match[1];
    }
    return '';
  }
}
