import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { GoogleService } from './google.service';

@Controller('google')
export class GoogleController {
  constructor(private readonly googleService: GoogleService) {}

  @Get('auth')
  authUrl() {
    return this.googleService.getAuthenticationUrl();
  }

  @Get('auth/callback')
  async initDriveAPI(@Query() query: { code: string }) {
    return this.googleService.initDriveAPI(query.code);
  }

  @Post('upload')
  async uploadFiles(@Body() body: { urls: string[] }) {
    return this.googleService.uploadFiles(body.urls);
  }
}
