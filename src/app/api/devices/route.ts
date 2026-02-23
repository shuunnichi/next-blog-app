import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/supabase-server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// デバイス一覧取得
export async function GET() {
  try {
    const user = await getCurrentUser();
    
    // 認証なしの場合はダミーユーザーIDを使用（後方互換性のため）
    const userId = user?.id || "anonymous";

    const devices = await prisma.device.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(devices);
  } catch (error) {
    console.error("GET /api/devices error:", error);
    return NextResponse.json(
      { error: "Failed to fetch devices" },
      { status: 500 }
    );
  }
}

// デバイス登録
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    const userId = user?.id || "anonymous";

    const { name, password } = await request.json();

    if (!name || typeof name !== "string") {
      return NextResponse.json(
        { error: "Device name is required" },
        { status: 400 }
      );
    }

    // デバイス名重複チェック（同じuserId内で同名禁止）
    const existing = await prisma.device.findFirst({
      where: { userId, name },
    });
    if (existing) {
      return NextResponse.json(
        { error: "同じ名前のデバイスが既に存在します" },
        { status: 409 }
      );
    }

    // ユニークなデバイスIDを生成（完全ランダム化）
    const deviceId = crypto.randomUUID();    // デバイス作成
    const device = await prisma.device.create({
      data: {
        userId,
        name,
        deviceId,
        password: password || null,
      },
    });

    // コントロールレコードも作成
    await prisma.deviceControl.create({
      data: {
        deviceId: device.deviceId,
      },
    });    return NextResponse.json(device, { status: 201 });
  } catch (error) {
    console.error("POST /api/devices error:", error);
    
    // 詳細なエラー情報を返す
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    console.error("Error details:", {
      message: errorMessage,
      stack: errorStack,
      error: error
    });
    
    return NextResponse.json(
      { 
        error: "Failed to create device",
        details: errorMessage,
        stack: process.env.NODE_ENV === 'development' ? errorStack : undefined
      },
      { status: 500 }
    );
  }
}

// デバイス名・パスワード変更
export async function PUT(request: NextRequest) {
  try {
    const { deviceId, name, password } = await request.json();

    if (!deviceId) {
      return NextResponse.json(
        { error: "deviceId is required" },
        { status: 400 }
      );
    }

    // 更新データを構築
    const updateData: { name?: string; password?: string | null } = {};
    if (name) updateData.name = name;
    if (password !== undefined) {
      // passwordが空文字列ならnull、それ以外はそのまま
      updateData.password = password === "" ? null : password;
    }

    const device = await prisma.device.update({
      where: { deviceId },
      data: updateData,
    });

    return NextResponse.json(device);
  } catch (error) {
    console.error("PUT /api/devices error:", error);
    return NextResponse.json(
      { error: "Failed to update device" },
      { status: 500 }
    );
  }
}

// デバイス削除（写真も一緒に削除）
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    const { searchParams } = new URL(request.url);
    const deviceId = searchParams.get("deviceId");
    const deviceToken = searchParams.get("deviceToken");
    const password = searchParams.get("password");

    console.log("=== DELETE /api/devices ===");
    console.log("deviceId:", deviceId);
    console.log("deviceToken:", deviceToken);
    console.log("user:", user?.id);

    if (!deviceId) {
      return NextResponse.json({ error: "deviceId is required" }, { status: 400 });
    }    // デバイスを取得
    const device = await prisma.device.findFirst({
      where: { deviceId },
    });

    if (!device) {
      return NextResponse.json({ error: "Device not found" }, { status: 404 });
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 🔒 3段階認証チェック（優先順位順）
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    let isAuthorized = false;

    // 1️⃣ デバイストークンによる認証（最優先）
    if (deviceToken && deviceToken === device.id) {
      console.log("✅ Authorized by deviceToken");
      isAuthorized = true;
    }
    // 2️⃣ ユーザーIDによる所有者確認
    else if (user && device.userId === user.id) {
      console.log("✅ Authorized by userId");
      isAuthorized = true;
    }
    // 3️⃣ パスワードによる認証
    else if (device.password && password === device.password) {
      console.log("✅ Authorized by password");
      isAuthorized = true;
    }
    // 4️⃣ パスワード未設定かつ認証なし（後方互換性）
    else if (!device.password && !user) {
      console.log("⚠️ Authorized: no password and no auth (legacy)");
      isAuthorized = true;
    }

    if (!isAuthorized) {
      console.log("❌ Unauthorized delete attempt");
      return NextResponse.json(
        { error: "Unauthorized: Invalid credentials" },
        { status: 403 }
      );
    }

    // デバイスに紐づく写真を取得
    const photos = await prisma.photo.findMany({
      where: { deviceId }
    });

    console.log(`Deleting ${photos.length} photos for device ${deviceId}`);

    // Supabaseストレージから写真を削除
    if (supabaseUrl && supabaseKey) {
      for (const photo of photos) {
        const urlParts = photo.url.split("/public/photos/");
        if (urlParts.length === 2) {
          const filePath = urlParts[1];
          const deleteUrl = `${supabaseUrl}/storage/v1/object/photos/${filePath}`;
          
          try {
            const deleteResponse = await fetch(deleteUrl, {
              method: "DELETE",
              headers: {
                "Authorization": `Bearer ${supabaseKey}`,
              },
            });

            if (!deleteResponse.ok) {
              console.warn(`Failed to delete photo from storage: ${photo.id}`);
            }
          } catch (err) {
            console.warn(`Error deleting photo from storage: ${photo.id}`, err);
          }
        }
      }
    }

    // DBから写真を削除
    await prisma.photo.deleteMany({
      where: { deviceId }
    });

    // DBからデバイスを削除
    await prisma.device.delete({
      where: { id: device.id }
    });

    console.log(`Device deleted: ${deviceId}`);
    return NextResponse.json({ success: true, deletedPhotos: photos.length });
  } catch (error) {
    console.error("DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete device" }, { status: 500 });
  }
}
