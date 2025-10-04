import { ObjectId, WithId } from 'mongodb';
import { PostsRepository } from '../repository/posts.repository';
import { Post } from '../types/post';
import { PostQueryInput } from '../router/input/blog-query.input';
import { PostInputDto } from '../dto/post-input.dto';
import { inject, injectable } from 'inversify';

@injectable()
export class PostsService {
  constructor(@inject(PostsRepository) private postsRepository: PostsRepository) {}

  async findMany(queryDto: PostQueryInput): Promise<{ items: WithId<Post>[]; totalCount: number }> {
    return this.postsRepository.findMany(queryDto);
  }

  async findManyById(id: string, queryDto: PostQueryInput): Promise<{ items: WithId<Post>[]; totalCount: number }> {
    return this.postsRepository.findManyById(id, queryDto);
  }

  async create(dto: PostInputDto, blogId: string, blogName: string): Promise<WithId<Post>> {
    const newPost: Post = {
      title: dto.title,
      shortDescription: dto.shortDescription,
      content: dto.content,
      blogId: new ObjectId(blogId),
      blogName,
      createdAt: new Date(),
      likesCount: 0,
      dislikesCount: 0,
      newestLikes: [],
    };

    return this.postsRepository.create(newPost);
  }

  async findById(id: string): Promise<WithId<Post> | null> {
    return this.postsRepository.findById(id);
  }

  async update(id: string, dto: PostInputDto, blogName: string): Promise<void> {
    await this.postsRepository.update(id, dto, blogName);
    return;
  }

  async delete(id: string): Promise<void> {
    await this.postsRepository.delete(id);
    return;
  }
}
