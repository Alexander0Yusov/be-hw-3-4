import * as mongoose from 'mongoose';
import { HydratedDocument, model, Model } from 'mongoose';
import { Like } from '../../8-likes/types/like';
import { PostInputDto } from '../dto/post-input.dto';
import { Post } from '../types/post';
import { ObjectId } from 'mongodb';
import { likesSchema } from '../../8-likes/domain/like.entity';

interface PostMethods {
  updatePost(dto: PostInputDto, blogName: string): void;
  updateLike(newestLikes: Like[], likesCount?: number, dislikesCount?: number): void;
}

type PostStatics = typeof PostEntity;

type PostModel = Model<Post, {}, PostMethods> & PostStatics;

export type PostDocument = HydratedDocument<Post, PostMethods>;

const postSchema = new mongoose.Schema<Post, PostModel, PostMethods>(
  {
    title: { type: String, required: true },
    shortDescription: { type: String, required: true },
    content: { type: String, required: true },
    blogId: { type: mongoose.Schema.Types.ObjectId, required: true },
    blogName: { type: String, required: true },
    createdAt: { type: Date, required: true },
    likesCount: { type: Number, required: true },
    dislikesCount: { type: Number, required: true },
    newestLikes: { type: [likesSchema] },
  },
  { optimisticConcurrency: true },
);

class PostEntity {
  private constructor(
    public title: string,
    public shortDescription: string,
    public content: string,
    public blogId: mongoose.Types.ObjectId,
    public blogName: string,
    public createdAt: Date,

    public likesCount: number,
    public dislikesCount: number,
    public newestLikes: Like[],
  ) {}

  static createPost(dto: Post) {
    const post = new PostModel({
      ...dto,
    });

    return post;
  }

  updatePost(dto: PostInputDto, blogName: string) {
    const { title, shortDescription, content, blogId } = dto;

    this.title = title;
    this.shortDescription = shortDescription;
    this.content = content;
    this.blogId = new mongoose.Types.ObjectId(blogId);
    this.blogName = blogName;
  }

  updateLike(newestLikes: Like[], likesCount?: number, dislikesCount?: number) {
    this.newestLikes = newestLikes;

    if (likesCount) {
      this.likesCount = likesCount;
    }
    if (dislikesCount) {
      this.dislikesCount = dislikesCount;
    }
  }
}

postSchema.loadClass(PostEntity);

export const PostModel = model<Post, PostModel>('Posts', postSchema);
