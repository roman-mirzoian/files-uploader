import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FileEntity } from './files.entity';
import { DataSource, Repository } from 'typeorm';
import { GoogleService } from 'src/google/google.service';
import { drive_v3 } from 'googleapis';

@Injectable()
export class FilesService {
  constructor(
    @InjectRepository(FileEntity)
    private readonly fileRepository: Repository<FileEntity>,
    private readonly dataSource: DataSource,
    private readonly googleService: GoogleService,
  ) {}

  async saveFiles(urls: string[]): Promise<FileEntity[]> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const savedFiles: drive_v3.Schema$File[] =
        await this.googleService.uploadFiles(urls);

      const fileEntities: FileEntity[] = savedFiles.map((file) =>
        this.fileRepository.create({
          googleId: file.id || '',
          fileUrl: file.webViewLink || '',
          fileName: file.name || '',
        }),
      );
      const savedEntities = await queryRunner.manager.save(fileEntities);
      await queryRunner.commitTransaction();

      return savedEntities;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async deleteFileById(id: number) {
    const file = await this.fileRepository.findOneBy({ id });
    if (!file) {
      throw new Error('File not found');
    }

    await this.googleService.deleteFileById(file.googleId);
    await this.fileRepository.delete(id);

    return { result: `File with id:${id} has been deleted` };
  }

  async findAllFiles(
    page: number = 1,
    limit: number = 10,
    orderValue: 'ASC' | 'DESC' = 'ASC',
  ) {
    const [files, total] = await this.fileRepository.findAndCount({
      take: limit,
      skip: (page - 1) * limit,
      order: { id: orderValue },
    });

    return {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      data: files,
    };
  }
}
