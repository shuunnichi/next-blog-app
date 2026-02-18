import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/supabase-server";

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

    const { name } = await request.json();

    if (!name || typeof name !== "string") {
      return NextResponse.json(
        { error: "Device name is required" },
        { status: 400 }
      );
    }

    // ユニークなデバイスIDを生成
    const deviceId = `device-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    // デバイス作成
    const device = await prisma.device.create({
      data: {
        userId,
        name,
        deviceId,
      },
    });

    // コントロールレコードも作成
    await prisma.deviceControl.create({
      data: {
        deviceId: device.deviceId,
      },
    });

    return NextResponse.json(device, { status: 201 });
  } catch (error) {
    console.error("POST /api/devices error:", error);
    return NextResponse.json(
      { error: "Failed to create device" },
      { status: 500 }
    );
  }
}

// デバイス名変更
export async function PUT(request: NextRequest) {
  try {
    const { deviceId, name } = await request.json();

    if (!deviceId || !name) {
      return NextResponse.json(
        { error: "deviceId and name are required" },
        { status: 400 }
      );
    }

    const device = await prisma.device.update({
      where: { deviceId },
      data: { name },
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

// デバイス削除
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const deviceId = searchParams.get("deviceId");
    
    if (!deviceId) {
      return NextResponse.json(
        { error: "deviceId is required" },
        { status: 400 }
      );
    }

    // 関連する写真とコントロールレコードを削除（Cascadeが効くはず）
    await prisma.device.delete({
      where: { deviceId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/devices error:", error);
    return NextResponse.json(
      { error: "Failed to delete device" },
      { status: 500 }
    );
  }
}
