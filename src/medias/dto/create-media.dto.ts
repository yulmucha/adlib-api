import { MediaState } from '@prisma/client';

interface Resolution {
  width: number;
  height: number;
  ppi: number;
}

export class CreateMediaDto {
  readonly mdmId: number;
  readonly name: string;
  readonly owner: string;
  readonly state: MediaState;
  readonly address: string;
  readonly sido: string;
  readonly gugun: string;
  readonly dong: string;
  readonly totalMonitorCount: number;
  readonly workingMonitorCount: number;
  readonly managementMonitorCount: number;
  readonly householdCount: number;
  readonly resolutions: Resolution[];
}
