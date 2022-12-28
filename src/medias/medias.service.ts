import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CreateMediaDto } from './dto/create-media.dto';
import { UpdateMediaDto } from './dto/update-media.dto';

@Injectable()
export class MediasService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createMediaDto: CreateMediaDto) {
    const medias = await this.prisma.media.findMany({
      select: { version: true },
      where: { mdmId: createMediaDto.mdmId },
    });
    const maxVersion = Math.max(0, ...medias.map((m) => m.version));
    return this.prisma.media.create({
      data: {
        mdmId: createMediaDto.mdmId,
        version: maxVersion + 1,
        name: createMediaDto.name,
        owner: createMediaDto.owner,
        state: createMediaDto.state,
        address: createMediaDto.address,
        sido: createMediaDto.sido,
        gugun: createMediaDto.gugun,
        dong: createMediaDto.dong,
        totalMonitorCount: createMediaDto.totalMonitorCount,
        workingMonitorCount: createMediaDto.workingMonitorCount,
        managementMonitorCount: createMediaDto.managementMonitorCount,
        householdCount: createMediaDto.householdCount,
        resolutions: {
          create: createMediaDto.resolutions,
        },
      },
      include: {
        resolutions: true,
      },
    });
  }

  async findAll() {
    return await this.prisma.media.findMany({
      include: {
        resolutions: true,
      },
    });
  }

  findOne(id: number) {
    return this.prisma.media.findUnique({
      where: { id },
      include: {
        resolutions: true,
      },
    });
  }

  update(id: number, updateMediaDto: UpdateMediaDto) {
    return `This action updates a #${id} media`;
  }

  remove(id: number) {
    return `This action removes a #${id} media`;
  }
}
