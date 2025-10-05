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

    const items = await db
      .getCollections()
      .postCollection.find(filter)
      .sort({ [sortBy]: sortDirection })
      .skip(skip)
      .limit(pageSize)
      .toArray();

    const totalCount = await db.getCollections().postCollection.countDocuments(filter);

    return { items, totalCount };
  }

  async findManyById(id: string, queryDto: PostQueryInput): Promise<{ items: WithId<Post>[]; totalCount: number }> {
    const { pageNumber, pageSize, sortBy, sortDirection } = queryDto;

    const skip = (pageNumber - 1) * pageSize;
    const filter: any = {};

    filter.blogId = new ObjectId(id);

    const items = await db
      .getCollections()
      .postCollection.find(filter)
      .sort({ [sortBy]: sortDirection })
      .skip(skip)
      .limit(pageSize)
      .toArray();

    const totalCount = await db.getCollections().postCollection.countDocuments(filter);

    return { items, totalCount };
  }

  async findById(id: string): Promise<WithId<Post> | null> {
    return db.getCollections().postCollection.findOne({ _id: new ObjectId(id) });
  }

  async create(post: Post): Promise<WithId<Post>> {
    const insertedResult = await db.getCollections().postCollection.insertOne(post);

    return { ...post, _id: insertedResult.insertedId };

    // const insertedResult = await PostModel.createPost(post);

    // return { ...post, _id: insertedResult._id };
  }

  async update(id: string, dto: PostInputDto, blogName: string): Promise<void> {
    const updateResult = await db.getCollections().postCollection.updateOne(
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
    const updateResult = await db.getCollections().postCollection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          likesCount: likesCount,
          dislikesCount: dislikesCount,
          newestLikes: newestLikes,
        },
      },
    );

    if (updateResult.matchedCount < 1) {
      throw new Error('Post not exist');
    }

    return;
  }

  async delete(id: string): Promise<void> {
    const deleteResult = await db.getCollections().postCollection.deleteOne({
      _id: new ObjectId(id),
    });

    if (deleteResult.deletedCount < 1) {
      throw new Error('Blog not exist');
    }
  }

  //
  async find(id: string): Promise<WithId<Post> | null> {
    // if (!mongoose.Types.ObjectId.isValid(id)) return null;
    // const res = await PostModel.findById(id);
    // return res;

    const res2 = db.getCollections().postCollection.findOne({ _id: new ObjectId(id) });
    return res2;
  }

  async save(post: PostDocument) {
    await post.save();
  }
}
