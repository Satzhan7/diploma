import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StoredFile } from './entities/stored-file.entity';
import { FilesService } from './files.service';
import { FilesController } from './files.controller';
import { StorageService } from './storage/storage.service';
import { LocalDiskStorage } from './storage/local-disk.storage';

@Module({
  imports: [TypeOrmModule.forFeature([StoredFile])],
  controllers: [FilesController],
  providers: [
    FilesService,
    { provide: StorageService, useClass: LocalDiskStorage },
  ],
  exports: [FilesService],
})
export class FilesModule {}
