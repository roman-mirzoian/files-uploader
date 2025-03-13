import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { FilesService } from './files.service';

@Controller('files')
export class FilesController {
  constructor(private readonly fileService: FilesService) {}

  @Post()
  async create(@Body() body: { urls: string[] }) {
    return this.fileService.saveFiles(body.urls);
  }

  @Get()
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('order') order?: 'ASC' | 'DESC',
  ) {
    const pageNumber = parseInt(page ?? '1', 10);
    const limitNumber = parseInt(limit ?? '10', 10);

    return this.fileService.findAllFiles(pageNumber, limitNumber, order);
  }
}
