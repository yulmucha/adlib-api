import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Media, MediaResolution, Resolution } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateMediaDto, CreateResolutionDto } from './dto/create-media.dto';
import { UpdateMediaDto } from './dto/update-media.dto';

@Injectable()
export class MediasService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createMediaDto: CreateMediaDto) {
    const mediasByMdmId = await this.findAllMediasByMdmId(createMediaDto.mdmId);
    const latestVersion = this.getLatestVersion(mediasByMdmId);
    const latestMedia = this.getLatestMedia(mediasByMdmId, latestVersion);

    if (latestMedia) {
      const resolutions = await this.findAllResolutionsByIdIn(
        latestMedia.resolutions.map(
          (mediaResolution) => mediaResolution.resolutionId,
        ),
      );

      return {
        ...latestMedia,
        ...{ resolutions },
      };
    }

    await this.createMissingResolutions(createMediaDto.resolutions);
    const resolutions = await Promise.all(
      createMediaDto.resolutions.map((createResolutionDto) =>
        this.findOneResolution(createResolutionDto),
      ),
    );

    const newMedia = await this.createMedia(
      createMediaDto,
      latestVersion,
      resolutions.map((resolution) => ({ resolutionId: resolution.id })),
    );

    return {
      ...newMedia,
      ...{ resolutions },
    };
  }

  private async findOneResolution(params: {
    width: number;
    height: number;
    ppi: number;
  }): Promise<Resolution> {
    const { width, height, ppi } = params;
    return await this.prisma.resolution.findUniqueOrThrow({
      where: { width_height_ppi: { width, height, ppi } },
    });
  }

  private async findAllMediasByMdmId(mediaMdmId: number): Promise<
    (Media & {
      resolutions: MediaResolution[];
    })[]
  > {
    return await this.prisma.media.findMany({
      where: {
        mdmId: mediaMdmId,
      },
      include: {
        resolutions: true,
      },
    });
  }

  private getLatestVersion(
    mediasByMdmId: (Media & { resolutions: MediaResolution[] })[],
  ) {
    return Math.max(0, ...mediasByMdmId.map((m) => m.version));
  }

  private getLatestMedia(
    mediasByMdmId: (Media & { resolutions: MediaResolution[] })[],
    latestVersion: number,
  ) {
    const latestMedias = mediasByMdmId.filter(
      (media) => media.deletedAt === null && media.version === latestVersion,
    );

    if (latestMedias.length > 1) {
      throw new InternalServerErrorException();
    }

    if (latestMedias.length === 0) {
      return null;
    }

    return latestMedias[0];
  }

  private async findAllResolutionsByIdIn(
    resolutionIds: number[],
  ): Promise<Resolution[]> {
    const resolutions = await this.prisma.resolution.findMany({
      where: { id: { in: resolutionIds } },
    });

    if (resolutionIds.length !== resolutions.length) {
      throw new InternalServerErrorException(
        '저장되어 있지 않은 해상도 ID를 포함하고 있습니다.',
      );
    }

    return resolutions;
  }

  private async createMissingResolutions(
    createResolutionDtos: CreateResolutionDto[],
  ) {
    await this.prisma.resolution.createMany({
      data: createResolutionDtos,
      skipDuplicates: true,
    });
  }

  private async createMedia(
    createMediaDto: CreateMediaDto,
    latestVersion: number,
    resolutions: { resolutionId: number }[],
  ) {
    return await this.prisma.media.create({
      data: {
        mdmId: createMediaDto.mdmId,
        version: latestVersion + 1,
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
          create: resolutions,
        },
      },
      include: {
        resolutions: true,
      },
    });
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

  async findOne(mediaId: number) {
    const media = await this.findOneMediaById(mediaId);

    const resolutions = await this.findAllResolutionsByIdIn(
      media.resolutions.map((mediaResolution) => mediaResolution.resolutionId),
    );

    return {
      ...media,
      ...{ resolutions },
    };
  }

  private async findOneMediaById(mediaId: number): Promise<
    Media & {
      resolutions: MediaResolution[];
    }
  > {
    const media = await this.prisma.media.findFirst({
      where: {
        deletedAt: null,
        id: mediaId,
      },
      include: {
        resolutions: true,
      },
    });

    if (media === null) {
      throw new NotFoundException(`매체를 찾을 수 없습니다. id: ${mediaId}`);
    }

    return media;
  }

  async update(updateMediaDto: UpdateMediaDto) {
    // TODO: validate DTO fields
    if (updateMediaDto.mdmId === undefined) {
      throw new BadRequestException('mdmId 누락');
    }

    // TODO: Remove duplicate code
    const medias = await this.prisma.media.findMany({
      where: {
        mdmId: updateMediaDto.mdmId,
      },
      include: {
        resolutions: true,
      },
    });
    const maxVersion = Math.max(0, ...medias.map((m) => m.version));
    const latestMedia = medias.filter(
      (media) => media.version === maxVersion && media.deletedAt === null,
    )[0];

    if (latestMedia === undefined) {
      throw new NotFoundException(
        `매체를 찾을 수 없습니다. mdmId: ${updateMediaDto.mdmId}`,
      );
    }

    // TODO: Remove duplicate code
    let resolutions: Resolution[];
    if (updateMediaDto.resolutions !== undefined) {
      await this.prisma.resolution.createMany({
        data: updateMediaDto.resolutions,
        skipDuplicates: true,
      });

      resolutions = await Promise.all(
        updateMediaDto.resolutions?.map(async (resolution) =>
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
    }

    // TODO: don't create if there are no changes
    await this.prisma.media.create({
      data: {
        mdmId: updateMediaDto.mdmId!,
        version: maxVersion + 1,
        name: updateMediaDto.name ?? latestMedia.name,
        owner: updateMediaDto.owner ?? latestMedia.owner,
        state: updateMediaDto.state ?? latestMedia.state,
        address: updateMediaDto.address ?? latestMedia.address,
        sido: updateMediaDto.sido ?? latestMedia.sido,
        gugun: updateMediaDto.gugun ?? latestMedia.gugun,
        dong: updateMediaDto.dong ?? latestMedia.dong,
        totalMonitorCount:
          updateMediaDto.totalMonitorCount ?? latestMedia.totalMonitorCount,
        workingMonitorCount:
          updateMediaDto.workingMonitorCount ?? latestMedia.workingMonitorCount,
        managementMonitorCount:
          updateMediaDto.managementMonitorCount ??
          latestMedia.managementMonitorCount,
        householdCount:
          updateMediaDto.householdCount ?? latestMedia.householdCount,
        resolutions: {
          create:
            resolutions?.map((resolution) => {
              return { resolutionId: resolution.id };
            }) ??
            latestMedia.resolutions.map((resolution) => ({
              resolutionId: resolution.resolutionId,
            })),
        },
      },
    });
  }

  async remove(id: number) {
    const media = await this.prisma.media.findUnique({
      where: { id },
    });

    if (media === null || media.deletedAt !== null) {
      console.log(media);
      throw new NotFoundException(`매체를 찾을 수 없습니다. id: ${id}`);
    }

    await this.prisma.media.update({
      where: { id: media.id },
      data: {
        deletedAt: new Date(),
      },
    });
  }
}
