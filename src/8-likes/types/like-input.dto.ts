import { LikeStatus } from './like';

export type LikeInputDto = {
  parentId: string;
  status: LikeStatus;
};
