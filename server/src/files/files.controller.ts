import { Body, Controller, Post } from '@nestjs/common';
import { FilesService } from './files.service';

@Controller('files')
export class FilesController {
  constructor(private readonly fileService: FilesService) {}

  @Post()
  async create(@Body() body: { urls: string[] }) {
    return this.fileService.saveFiles(body.urls);
  }
}
