import { Module } from '@nestjs/common';
import { MediasService } from './medias.service';
import { MediasController } from './medias.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  controllers: [MediasController],
  providers: [MediasService],
  imports: [PrismaModule],
})
export class MediasModule {}
