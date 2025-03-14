import { Module } from '@nestjs/common';
import { FilesService } from './files.service';
import { FilesController } from './files.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FileEntity } from './files.entity';
import { GoogleModule } from 'src/google/google.module';

@Module({
  imports: [TypeOrmModule.forFeature([FileEntity]), GoogleModule],
  providers: [FilesService],
  controllers: [FilesController],
})
export class FilesModule {}
