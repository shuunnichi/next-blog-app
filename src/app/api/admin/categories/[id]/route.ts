import { prisma } from "@/lib/prisma";
import { NextResponse, NextRequest } from "next/server";
import { Category } from "@prisma/client";
import { supabase } from "@/utils/supabase";

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

type RequestBody = {
  name: string;
};

export const PUT = async (req: NextRequest, routeParams: RouteParams) => {
  const authorization = req.headers.get("Authorization");
  if (!authorization)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const token = authorization.split(" ")[1];
  const { data, error } = await supabase.auth.getUser(token);
  if (error)
    return NextResponse.json({ error: error.message }, { status: 401 });

  try {
    const { id } = await routeParams.params;
    const { name }: RequestBody = await req.json();
    const category: Category = await prisma.category.update({
      where: { id },
      data: { name },
    });
    return NextResponse.json(category);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "カテゴリの名前変更に失敗しました" },
      { status: 500 },
    );
  }
};

export const DELETE = async (req: NextRequest, routeParams: RouteParams) => {
  const authorization = req.headers.get("Authorization");
  if (!authorization)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const token = authorization.split(" ")[1];
  const { data, error } = await supabase.auth.getUser(token);
  if (error)
    return NextResponse.json({ error: error.message }, { status: 401 });

  try {
    const { id } = await routeParams.params;
    const category: Category = await prisma.category.delete({ where: { id } });
    return NextResponse.json({ msg: `「${category.name}」を削除しました。` });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "カテゴリの削除に失敗しました" },
      { status: 500 },
    );
  }
};