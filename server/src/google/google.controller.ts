import { Controller, Post, Body } from '@nestjs/common';
import { GoogleService } from './google.service';

@Controller('google')
export class GoogleController {
  constructor(private readonly googleService: GoogleService) {}

  @Post('upload')
  async uploadFiles(@Body() body: { urls: string[] }) {
    return this.googleService.uploadFiles(body.urls);
  }
}
