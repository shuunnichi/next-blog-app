import { prisma } from "@/lib/prisma";
import { NextResponse, NextRequest } from "next/server";
import type { Post } from "@/generated/prisma/client";
import { supabase } from "@/utils/supabase"; 

export const revalidate = 0; // ◀ サーバサイドのキャッシュを無効化する設定
export const dynamic = "force-dynamic"; // ◀ 〃

type RequestBody = {
  title: string;
  content: string;
  coverImageKey: string;
  categoryIds: string[];
};

export const POST = async (req: NextRequest) => {
  const authorization = req.headers.get("Authorization");
  if (!authorization)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // "Bearer <token>" 形式と "<token>" 形式のどちらにも対応
  const token = authorization.split(" ")[1] || authorization;
  
  const { data, error } = await supabase.auth.getUser(token);
  if (error)
    return NextResponse.json({ error: error.message }, { status: 401 });

  try {
    const requestBody: RequestBody = await req.json();

    // 分割代入
    const { title, content, coverImageKey, categoryIds } = requestBody;

    // categoryIds で指定されるカテゴリがDB上に存在するか確認
    const categories = await prisma.category.findMany({
      where: {
        id: {
          in: categoryIds,
        },
      },
    });
    if (categories.length !== categoryIds.length) {
      return NextResponse.json(
        { error: "指定されたカテゴリのいくつかが存在しません" },
        { status: 400 }, // 400: Bad Request
      );
    }

    // 投稿記事テーブルにレコードを追加
    const post: Post = await prisma.post.create({
      data: {
        title, // title: title の省略形であることに注意。以下も同様
        content,
        coverImageKey,
      },
    });

    // 中間テーブルにレコードを追加
    for (const categoryId of categoryIds) {
      await prisma.postCategory.create({
        data: {
          postId: post.id,
          categoryId: categoryId,
        },
      });
    }

    return NextResponse.json(post);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "投稿記事の作成に失敗しました" },
      { status: 500 },
    );
  }
};