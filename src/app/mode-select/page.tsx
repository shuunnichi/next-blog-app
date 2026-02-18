"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client";

export default function ModeSelectPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCleaningDevices, setIsCleaningDevices] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    // 認証チェック（Supabase Auth）
    const checkAuth = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error || !user) {
          router.push("/login");
          return;
        }
        
        setUserEmail(user.email || null);
      } catch (error) {
        console.error("Auth check failed:", error);
        router.push("/login");
        return;
      }
      setIsLoading(false);
    };
    checkAuth();
  }, [router]);
  // 全写真削除
  const deleteAllPhotos = async () => {
    if (!confirm("すべての写真を削除しますか？この操作は取り消せません。")) {
      return;
    }

    try {
      setIsDeleting(true);
      const response = await fetch("/api/photos/delete-all", {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("削除失敗");

      alert("すべての写真を削除しました");
    } catch (error) {
      console.error("削除エラー:", error);
      alert("削除に失敗しました");
    } finally {
      setIsDeleting(false);
    }
  };

  // 写真のないデバイスを削除
  const cleanEmptyDevices = async () => {
    if (!confirm("写真のないデバイスを削除しますか？")) {
      return;
    }

    try {
      setIsCleaningDevices(true);

      // 全デバイスを取得
      const devicesResponse = await fetch("/api/devices");
      if (!devicesResponse.ok) throw new Error("デバイス取得失敗");
      const devices = await devicesResponse.json();

      let deletedCount = 0;

      // 各デバイスの写真数をチェック
      for (const device of devices) {
        const photosResponse = await fetch(`/api/photos?deviceId=${device.deviceId}`);
        if (!photosResponse.ok) continue;
        
        const photos = await photosResponse.json();
        
        // 写真がない場合は削除
        if (photos.length === 0) {
          const deleteResponse = await fetch(`/api/devices?deviceId=${device.deviceId}`, {
            method: "DELETE",
          });
          if (deleteResponse.ok) {
            deletedCount++;
          }
        }
      }

      alert(`${deletedCount}個の空デバイスを削除しました`);
    } catch (error) {
      console.error("クリーンアップエラー:", error);
      alert("デバイスのクリーンアップに失敗しました");    } finally {
      setIsCleaningDevices(false);
    }
  };

  // ログアウト
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 p-4">
      <div className="max-w-4xl w-full">
        {/* ユーザー情報とログアウト */}
        {userEmail && (
          <div className="flex justify-end mb-4">
            <div className="bg-slate-800/50 rounded-lg px-4 py-2 flex items-center gap-3">
              <span className="text-slate-400 text-sm">{userEmail}</span>
              <button
                onClick={handleLogout}
                className="text-red-400 hover:text-red-300 text-sm transition-colors"
              >
                ログアウト
              </button>
            </div>
          </div>
        )}

        {/* タイトル */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">
            🔇 SilentEye
          </h1>
          <p className="text-slate-300 text-lg">
            無音監視カメラシステム
          </p>
        </div>

        {/* モード選択ボタン */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Agent モード */}
          <button
            onClick={() => router.push("/agent")}
            className="group relative overflow-hidden bg-gradient-to-br from-blue-600 to-blue-800 hover:from-blue-500 hover:to-blue-700 rounded-2xl p-8 transition-all duration-300 transform hover:scale-105 shadow-2xl"
          >
            <div className="relative z-10">
              <div className="text-6xl mb-4">📱</div>
              <h2 className="text-3xl font-bold text-white mb-3">
                Agent
              </h2>
              <p className="text-blue-100 text-sm leading-relaxed">
                スマホ側の撮影モード
                <br />
                遠隔指示でカメラを起動し、
                <br />
                無音で撮影します
              </p>
            </div>
            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
          </button>

          {/* Commander モード */}
          <button
            onClick={() => router.push("/commander")}
            className="group relative overflow-hidden bg-gradient-to-br from-purple-600 to-purple-800 hover:from-purple-500 hover:to-purple-700 rounded-2xl p-8 transition-all duration-300 transform hover:scale-105 shadow-2xl"
          >
            <div className="relative z-10">
              <div className="text-6xl mb-4">💻</div>
              <h2 className="text-3xl font-bold text-white mb-3">
                Commander
              </h2>
              <p className="text-purple-100 text-sm leading-relaxed">
                PC側の遠隔操作モード
                <br />
                デバイス一覧から選択し、
                <br />
                撮影指示を送信します
              </p>
            </div>
            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
          </button>
        </div>        {/* フッター */}
        <div className="text-center mt-12 space-y-4">
          {/* 危険操作エリア */}
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700 space-y-3">
            <button
              onClick={deleteAllPhotos}
              disabled={isDeleting}
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-slate-600 text-white px-6 py-2 rounded-lg font-medium transition-colors text-sm"
            >
              {isDeleting ? "削除中..." : "🗑️ すべての写真を削除"}
            </button>
            <button
              onClick={cleanEmptyDevices}
              disabled={isCleaningDevices}
              className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-slate-600 text-white px-6 py-2 rounded-lg font-medium transition-colors text-sm"
            >
              {isCleaningDevices ? "クリーンアップ中..." : "🧹 空デバイスを削除"}
            </button>
            <p className="text-slate-500 text-xs">
              写真のないデバイスを一括削除します
            </p>
          </div>

          <button
            onClick={() => router.push("/")}
            className="text-slate-400 hover:text-white transition-colors duration-200 text-sm"
          >
            ← ホームに戻る
          </button>
        </div>
      </div>
    </div>
  );
}
