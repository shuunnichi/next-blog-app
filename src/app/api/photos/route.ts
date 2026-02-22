import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/supabase-server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Supabase environment variables are missing");
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    const userId = user?.id || "anonymous";

    const { searchParams } = new URL(request.url);
    const deviceId = searchParams.get("deviceId");
    const password = searchParams.get("password");
    
    console.log("=== GET /api/photos ===");
    console.log("deviceId:", deviceId);
    console.log("userId:", userId);
    
    if (!deviceId) {
      return NextResponse.json({ error: "deviceId is required" }, { status: 400 });
    }

    // ⚡ デバイス情報を取得
    const device = await prisma.device.findFirst({
      where: { deviceId }
    }) as { id: string; deviceId: string; userId: string; name: string; password: string | null; createdAt: Date; updatedAt: Date } | null;

    if (!device) {
      return NextResponse.json({ error: "Device not found" }, { status: 404 });
    }

    // ⚡ パスワードチェック
    // パスワードが設定されている場合は、所有者でも必須
    // （ただし、deviceTokenがあれば所有者として認識）
    const deviceToken = searchParams.get("deviceToken");
    const isOwnerByToken = deviceToken && device.id === deviceToken;
    const isOwnerByUserId = user && device.userId === user.id;
    
    console.log("=== OWNERSHIP CHECK ===");
    console.log("device.id:", device.id);
    console.log("device.userId:", device.userId);
    console.log("userId:", userId);
    console.log("deviceToken:", deviceToken ? `[${deviceToken}]` : "[NOT PROVIDED]");
    console.log("isOwnerByToken:", isOwnerByToken);
    console.log("isOwnerByUserId:", isOwnerByUserId);
    console.log("device.password:", device.password ? "[SET]" : "[NOT SET]");

    // パスワードチェック
    if (device.password) {
      // デバイストークンまたはユーザーIDで所有者として扱う
      if (isOwnerByToken) {
        console.log("Password check: BYPASSED (owner by token)");
      } else if (isOwnerByUserId) {
        console.log("Password check: BYPASSED (owner by userId)");
      } else if (!password || password !== device.password) {
        console.log("Password check: FAILED");
        return NextResponse.json({ error: "Password required" }, { status: 403 });
      } else {
        console.log("Password check: PASSED");
      }
    }

    // 認証がある場合の所有者チェック（パスワードがない場合）
    if (user && !device.password) {
      const isOwner = device.userId === userId;
      if (!isOwner) {
        console.log("Authorization check: not owner - REJECTED");
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
    }

    const photos = await prisma.photo.findMany({
      where: { deviceId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    
    console.log("Photos found:", photos.length);
    console.log("First photo:", photos[0]);
    console.log("=== GET /api/photos END ===");
    
    return NextResponse.json(photos);
  } catch (error) {
    console.error("GET error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    const userId = user?.id || "anonymous";

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const deviceId = formData.get("deviceId") as string;
    
    if (!file || !deviceId) {
      return NextResponse.json({ error: "Missing params" }, { status: 400 });
    }

    // デバイスの存在確認（所有者チェックは認証がある場合のみ）
    const device = await prisma.device.findFirst({
      where: user ? { deviceId, userId: user.id } : { deviceId }
    });

    if (!device) {
      return NextResponse.json({ error: "Device not found" }, { status: 404 });
    }

    const ts = Date.now();
    const fileName = deviceId + "_" + ts + ".jpg";
    const filePath = userId + "/" + deviceId + "/" + fileName; // ユーザーIDを含むパス
    const arrayBuffer = await file.arrayBuffer();
    console.log("Upload:", filePath, arrayBuffer.byteLength);
    const uploadUrl = supabaseUrl + "/storage/v1/object/photos/" + filePath;
    
    const uploadResponse = await fetch(uploadUrl, {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + supabaseKey,
        "Content-Type": "image/jpeg",
      },
      body: arrayBuffer,
    });
    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error("Upload fail:", uploadResponse.status, errorText);
      return NextResponse.json({ error: "Upload failed", details: errorText }, { status: 500 });
    }
    const publicUrl = supabaseUrl + "/storage/v1/object/public/photos/" + filePath;
    console.log("URL:", publicUrl);
    const photo = await prisma.photo.create({
      data: { deviceId, fileName, url: publicUrl },
    });
    console.log("Saved:", photo.id);
    return NextResponse.json(photo, { status: 201 });
  } catch (error) {
    console.error("POST error:", error);
    return NextResponse.json({ error: "Failed", details: String(error) }, { status: 500 });
  }
}
