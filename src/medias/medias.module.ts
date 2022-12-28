import { Module } from '@nestjs/common';
import { MediasService } from './medias.service';
import { MediasController } from './medias.controller';
import { PrismaService } from 'src/prisma.service';

@Module({
  controllers: [MediasController],
  providers: [MediasService, PrismaService],
})
export class MediasModule {}
