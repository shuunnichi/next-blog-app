import { NextResponse } from "next/server";

// 簡易認証チェック（開発用）
// TODO: 本番環境では Supabase Auth を使用
export async function GET() {
  try {
    // 開発環境では常に認証OK
    return NextResponse.json({ authenticated: true });
  } catch (error) {
    console.error("GET /api/auth/check error:", error);
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 401 }
    );
  }
}
