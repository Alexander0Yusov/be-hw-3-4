import { Post } from '../../types/post';

export type PostListPaginatedOutput = {
  pagesCount: number;
  page: number;
  pageSize: number;
  totalCount: number;
  items: (Omit<Post, 'blogId' | 'likesCount' | 'dislikesCount' | 'newestLikes'> & {
    id: string;
    blogId: string;
  })[];
};
