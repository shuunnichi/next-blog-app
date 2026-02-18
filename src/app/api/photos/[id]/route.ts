import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/supabase-server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Supabase environment variables are missing");
}

// 個別写真削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    const { id: photoId } = await params;

    console.log("=== DELETE /api/photos/[id] ===");
    console.log("photoId:", photoId);

    // 写真を取得
    const photo = await prisma.photo.findUnique({
      where: { id: photoId },
      include: { device: true }
    });

    if (!photo) {
      return NextResponse.json({ error: "Photo not found" }, { status: 404 });
    }

    // デバイスの所有者確認（認証がある場合のみ）
    if (user && photo.device.userId !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Supabaseストレージから削除
    // URL例: https://xxx.supabase.co/storage/v1/object/public/photos/userId/deviceId/filename.jpg
    const urlParts = photo.url.split("/public/photos/");
    if (urlParts.length === 2) {
      const filePath = urlParts[1];
      const deleteUrl = `${supabaseUrl}/storage/v1/object/photos/${filePath}`;
      
      console.log("Deleting from Supabase:", deleteUrl);
      
      const deleteResponse = await fetch(deleteUrl, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${supabaseKey}`,
        },
      });

      if (!deleteResponse.ok) {
        const errorText = await deleteResponse.text();
        console.error("Supabase delete failed:", deleteResponse.status, errorText);
        // ストレージ削除失敗でもDB削除は続行
      }
    }

    // DBから削除
    await prisma.photo.delete({
      where: { id: photoId }
    });

    console.log("Photo deleted:", photoId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete photo" }, { status: 500 });
  }
}
