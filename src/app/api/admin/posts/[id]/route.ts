import { prisma } from "@/lib/prisma";
import { NextResponse, NextRequest } from "next/server";

type RequestBody = {
  title: string;
  content: string;
  coverImageURL: string;
  categoryIds: string[];
};

// 2.6 宿題: 投稿記事を更新するウェブAPI
export const PUT = async (
  req: NextRequest,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  context: any
) => {
  try {
    const { id: postId } = context.params;
    const { title, content, coverImageURL, categoryIds }: RequestBody =
      await req.json();

    // categoryIds で指定されるカテゴリがDB上に存在するか確認
    const categories = await prisma.category.findMany({
      where: { id: { in: categoryIds } },
    });
    if (categories.length !== categoryIds.length) {
      return NextResponse.json(
        { error: "指定されたカテゴリのいくつかが存在しません" },
        { status: 400 },
      );
    }

    const updatedPost = await prisma.$transaction(async (prisma) => {
      // 1. 既存の投稿カテゴリの関連付けを削除
      await prisma.postCategory.deleteMany({
        where: { postId },
      });

      // 2. 投稿を更新
      const post = await prisma.post.update({
        where: { id: postId },
        data: {
          title,
          content,
          coverImageURL,
        },
      });

      // 3. 新しい投稿カテゴリの関連付けを作成
      if (categoryIds.length > 0) {
        await prisma.postCategory.createMany({
          data: categoryIds.map((categoryId) => ({
            postId,
            categoryId,
          })),
        });
      }

      return post;
    });

    return NextResponse.json(updatedPost);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "投稿記事の変更に失敗しました" },
      { status: 500 },
    );
  }
};

// 2.5 宿題: 投稿記事を削除するウェブAPI
export const DELETE = async (
  req: NextRequest,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  context: any
) => {
  try {
    const { id } = context.params;
    const post = await prisma.post.delete({
      where: { id },
    });
    return NextResponse.json({ msg: `「${post.title}」を削除しました。` });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "投稿記事の削除に失敗しました" },
      { status: 500 },
    );
  }
};
