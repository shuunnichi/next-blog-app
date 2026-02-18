import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// デバイス一覧取得
export async function GET() {
  try {
    // TODO: 実際の userId は Supabase Auth から取得
    const userId = "dummy-user-id";

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
    const { name } = await request.json();

    if (!name || typeof name !== "string") {
      return NextResponse.json(
        { error: "Device name is required" },
        { status: 400 }
      );
    }

    // TODO: 実際の userId は Supabase Auth から取得
    const userId = "dummy-user-id";

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
