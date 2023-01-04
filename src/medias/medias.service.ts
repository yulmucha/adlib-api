import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateMediaDto } from './dto/create-media.dto';
import { UpdateMediaDto } from './dto/update-media.dto';

@Injectable()
export class MediasService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createMediaDto: CreateMediaDto) {
    const medias = await this.prisma.media.findMany({
      where: {
        mdmId: createMediaDto.mdmId,
      },
      include: {
        resolutions: true,
      },
    });
    const maxVersion = Math.max(0, ...medias.map((m) => m.version));
    const latestMedia = medias.filter(
      (media) => media.version === maxVersion && media.deletedAt === null,
    )[0];

    if (latestMedia !== undefined) {
      const resolutions = await this.prisma.resolution.findMany({
        where: {
          id: {
            in: latestMedia.resolutions.map(
              (mediaResolution) => mediaResolution.resolutionId,
            ),
          },
        },
      });
      return {
        ...latestMedia,
        ...{ resolutions },
      };
    }

    const result = await this.prisma.resolution.createMany({
      data: createMediaDto.resolutions,
      skipDuplicates: true,
    });

    const resolutions = await Promise.all(
      createMediaDto.resolutions.map(async (resolution) =>
        this.prisma.resolution.findUniqueOrThrow({
          where: {
            width_height_ppi: {
              width: resolution.width,
              height: resolution.height,
              ppi: resolution.ppi,
            },
          },
        }),
      ),
    );

    const media = await this.prisma.media.create({
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
          create: resolutions.map((r) => {
            return { resolutionId: r.id };
          }),
        },
      },
      include: {
        resolutions: true,
      },
    });

    return {
      ...media,
      ...{ resolutions },
    };
  }

  async findAll() {
    const medias = await Promise.all(
      (
        await this.prisma.media.groupBy({
          by: ['mdmId'],
          where: {
            deletedAt: null,
          },
          // TODO: if pagination needed
          // orderBy: {
          //   mdmId: 'asc',
          // },
          // skip: 1,
          // take: 2,
          _max: {
            version: true,
          },
        })
      ).map(
        async ({ mdmId, _max }) =>
          await this.prisma.media.findUnique({
            where: {
              mdmId_version: {
                mdmId: mdmId,
                version: _max.version,
              },
            },
            include: {
              resolutions: true,
            },
          }),
      ),
    );

    const resolutionIds = [
      ...new Set(
        medias.flatMap((media) =>
          media.resolutions.map(
            (mediaResolution) => mediaResolution.resolutionId,
          ),
        ),
      ),
    ];
    const resolutions = await this.prisma.resolution.findMany({
      where: {
        id: { in: resolutionIds },
      },
    });
    const resolutionsById = new Map(
      resolutions.map((resolution) => [resolution.id, resolution]),
    );

    return medias.map((media) => ({
      ...media,
      ...{
        resolutions: media.resolutions.map((mediaResolution) => {
          const resolution = resolutionsById.get(mediaResolution.resolutionId);
          if (resolution === undefined) {
            throw new InternalServerErrorException('해상도 데이터 손상');
          }
          return resolution;
        }),
      },
    }));
  }

  async findOne(id: number) {
    const media = await this.prisma.media.findFirst({
      where: {
        deletedAt: null,
        id: id,
      },
      include: {
        resolutions: true,
      },
    });

    if (media === null) {
      throw new NotFoundException(`매체를 찾을 수 없습니다. id: ${id}`);
    }

    const resolutions = await this.prisma.resolution.findMany({
      where: {
        id: {
          in: media.resolutions.map(
            (mediaResolution) => mediaResolution.resolutionId,
          ),
        },
      },
    });

    if (media.resolutions.length != resolutions.length) {
      throw new InternalServerErrorException('해상도 데이터 손상');
    }

    return {
      ...media,
      ...{ resolutions },
    };
  }

  update(id: number, updateMediaDto: UpdateMediaDto) {
    return `This action updates a #${id} media`;
  }

  remove(id: number) {
    return `This action removes a #${id} media`;
  }
}
