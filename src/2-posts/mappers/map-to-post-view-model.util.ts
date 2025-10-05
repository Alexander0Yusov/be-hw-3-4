import { WithId } from 'mongodb';
import { Post } from '../types/post';
import { PostViewModel } from '../types/post-view-model';
import { LikeStatus } from '../../8-likes/types/like';

export function mapToPostViewModel(post: WithId<Post & { myStatus: LikeStatus }>): PostViewModel {
  return {
    id: post._id.toString(),
    title: post.title,
    shortDescription: post.shortDescription,
    content: post.content,
    blogId: post.blogId.toString(),
    blogName: post.blogName,
    createdAt: post.createdAt,

    extendedLikesInfo: {
      likesCount: post.likesCount,
      dislikesCount: post.dislikesCount,
      myStatus: post.myStatus,
      newestLikes: post.newestLikes.map(({ createdAt, authorId, login }) => ({
        addedAt: createdAt.toISOString(),
        userId: authorId.toString(),
        login: login ? login : '',
      })),
    },
  };
}
