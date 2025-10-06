import { ObjectId, WithId } from 'mongodb';
import { PostInputDto } from '../dto/post-input.dto';
import { Post } from '../types/post';
import { db } from '../../db/mongo.db';
import { PostQueryInput } from '../router/input/blog-query.input';
import { injectable } from 'inversify';
import { PostDocument, PostModel } from '../domain/post.entity';
import mongoose from 'mongoose';
import { Like } from '../../8-likes/types/like';

@injectable()
export class PostsRepository {
  async findMany(queryDto: PostQueryInput): Promise<{ items: WithId<Post>[]; totalCount: number }> {
    const { pageNumber, pageSize, sortBy, sortDirection } = queryDto;

    const skip = (pageNumber - 1) * pageSize;
    const filter: any = {};

    const items = await PostModel.find(filter)
      .sort({ [sortBy]: sortDirection })
      .skip(skip)
      .limit(pageSize)
      .lean();

    const totalCount = await PostModel.countDocuments(filter);

    return { items, totalCount };
  }

  async findManyById(id: string, queryDto: PostQueryInput): Promise<{ items: WithId<Post>[]; totalCount: number }> {
    const { pageNumber, pageSize, sortBy, sortDirection } = queryDto;

    const skip = (pageNumber - 1) * pageSize;
    const filter: any = {};

    filter.blogId = new ObjectId(id);

    const items = await PostModel.find(filter)
      .sort({ [sortBy]: sortDirection })
      .skip(skip)
      .limit(pageSize)
      .lean();

    const totalCount = await PostModel.countDocuments(filter);

    return { items, totalCount };
  }

  async findById(id: string): Promise<WithId<Post> | null> {
    const res = await PostModel.findOne({ _id: new ObjectId(id) }).lean();

    return res;
  }

  async create(post: Post): Promise<WithId<Post>> {
    // const insertedResult = await db.getCollections().postCollection.insertOne(post);

    // return { ...post, _id: insertedResult.insertedId };

    const preparedPost = PostModel.createPost(post);
    await preparedPost.save();

    return { ...post, _id: preparedPost._id };
  }

  async update(id: string, dto: PostInputDto, blogName: string): Promise<void> {
    const updateResult = await PostModel.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          title: dto.title,
          shortDescription: dto.shortDescription,
          content: dto.content,
          blogId: new ObjectId(dto.blogId),
          blogName,
        },
      },
    );

    console.log(7777, updateResult);

    if (updateResult.matchedCount < 1) {
      throw new Error('Post not exist');
    }

    return;
  }

  async updateLikesData(
    id: string,
    likesCount: number,
    dislikesCount: number,
    newestLikes: WithId<Like>[],
  ): Promise<void> {
    const updateResult = await PostModel.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          likesCount: likesCount,
          dislikesCount: dislikesCount,
          newestLikes: newestLikes,
        },
      },
    );

    console.log(8888, updateResult);

    if (updateResult.matchedCount < 1) {
      throw new Error('Post not exist');
    }

    return;
  }

  async delete(id: string): Promise<void> {
    const deleteResult = await PostModel.deleteOne({
      _id: new ObjectId(id),
    });

    if (deleteResult.deletedCount < 1) {
      throw new Error('Blog not exist');
    }
  }

  //
  async find(id: string): Promise<PostDocument | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    const res = await PostModel.findById(id);

    console.log(33333, res);

    return res;

    // const res2 = PostModel.findOne({ _id: new ObjectId(id) });
    // return res2;
  }

  async save(post: PostDocument) {
    console.log(44444, post);
    console.log(post instanceof mongoose.Model);

    await post.save();

    console.log(5555, '=====');
  }
}
