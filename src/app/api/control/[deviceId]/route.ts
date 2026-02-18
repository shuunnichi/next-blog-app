import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/supabase-server";

interface Context {
  params: Promise<{ deviceId: string }>;
}

// 制御状態取得
export async function GET(
  request: NextRequest,
  context: Context
) {
  try {
    const user = await getCurrentUser();
    const userId = user?.id || "anonymous";

    const { deviceId } = await context.params;

    // デバイスの存在確認（所有者チェックは認証がある場合のみ）
    const device = await prisma.device.findFirst({
      where: user ? { deviceId, userId: user.id } : { deviceId }
    });

    if (!device) {
      return NextResponse.json({ error: "Device not found" }, { status: 404 });
    }

    // デバイスのupdatedAtを更新（オンライン状態を記録）
    await prisma.device.update({
      where: { deviceId },
      data: { updatedAt: new Date() },
    }).catch(() => {
      // デバイスが存在しない場合は無視
    });

    const control = await prisma.deviceControl.findUnique({
      where: { deviceId },
    });

    if (!control) {
      return NextResponse.json(
        { error: "Control not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(control);
  } catch (error) {
    console.error("GET /api/control/[deviceId] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch control state" },
      { status: 500 }
    );
  }
}

// 制御状態更新
export async function POST(
  request: NextRequest,
  context: Context
) {
  try {
    const user = await getCurrentUser();
    const userId = user?.id || "anonymous";

    const { deviceId } = await context.params;
    const { shouldCapture } = await request.json();

    console.log("=== POST /api/control/[deviceId] ===");
    console.log("deviceId:", deviceId);
    console.log("userId:", userId);
    console.log("shouldCapture:", shouldCapture);

    if (typeof shouldCapture !== "boolean") {
      return NextResponse.json(
        { error: "shouldCapture must be a boolean" },
        { status: 400 }
      );
    }

    // デバイスの存在確認（所有者チェックは認証がある場合のみ）
    const device = await prisma.device.findFirst({
      where: user ? { deviceId, userId: user.id } : { deviceId }
    });

    console.log("Device found:", device);

    if (!device) {
      return NextResponse.json({ error: "Device not found" }, { status: 404 });
    }

    const control = await prisma.deviceControl.upsert({
      where: { deviceId },
      update: { shouldCapture },
      create: { deviceId, shouldCapture },
    });

    console.log("Control updated:", control);
    console.log("=== POST /api/control/[deviceId] END ===");

    return NextResponse.json(control);
  } catch (error) {
    console.error("POST /api/control/[deviceId] error:", error);
    return NextResponse.json(
      { error: "Failed to update control state" },
      { status: 500 }
    );
  }
}
