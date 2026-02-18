import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/supabase-server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function DELETE() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. ユーザーのデバイスを取得
    const devices = await prisma.device.findMany({
      where: { userId: user.id }
    });

    const deviceIds = devices.map(d => d.deviceId);

    // 2. ユーザーのデバイスに紐づく写真のみ取得
    const photos = await prisma.photo.findMany({
      where: {
        deviceId: { in: deviceIds }
      }
    });
    
    if (photos.length === 0) {
      return NextResponse.json({ message: "削除する写真がありません" }, { status: 200 });
    }

    console.log("削除対象写真数:", photos.length);

    // 2. Supabase Storageから削除
    for (const photo of photos) {
      try {
        // ファイルパスを抽出（URLから）
        const urlParts = photo.url.split("/photos/");
        if (urlParts.length < 2) continue;
        
        const filePath = urlParts[1];
        const deleteUrl = supabaseUrl + "/storage/v1/object/photos/" + filePath;
        
        const deleteResponse = await fetch(deleteUrl, {
          method: "DELETE",
          headers: {
            "Authorization": "Bearer " + supabaseKey,
          },
        });
        
        if (!deleteResponse.ok) {
          console.warn("Storageから削除失敗:", filePath, deleteResponse.status);
        } else {
          console.log("Storage削除成功:", filePath);
        }
      } catch (error) {
        console.error("Storage削除エラー:", photo.fileName, error);
      }
    }    // 3. データベースからユーザーの写真レコードのみ削除
    const deleteResult = await prisma.photo.deleteMany({
      where: {
        deviceId: { in: deviceIds }
      }
    });
    
    console.log("DB削除完了:", deleteResult.count, "件");

    return NextResponse.json({ 
      message: "すべての写真を削除しました",
      deletedCount: deleteResult.count 
    }, { status: 200 });
    
  } catch (error) {
    console.error("DELETE /api/photos/delete-all error:", error);
    return NextResponse.json(
      { error: "削除に失敗しました", details: String(error) },
      { status: 500 }
    );
  }
}
