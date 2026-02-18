"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";

interface Device {
  id: string;
  deviceId: string;
  name: string;
  createdAt: string;
  updatedAt?: string;
}

interface Photo {
  id: string;
  fileName: string;
  url: string;
  createdAt: string;
}

export default function CommanderPage() {
  const router = useRouter();
  const [devices, setDevices] = useState<Device[]>([]);
  const [activeDevices, setActiveDevices] = useState<Device[]>([]);
  const [inactiveDevices, setInactiveDevices] = useState<Device[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>("");
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const galleryRef = useRef<HTMLDivElement>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [photoToDelete, setPhotoToDelete] = useState<string | null>(null);
  const [showDeviceDeleteConfirm, setShowDeviceDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false); // ⭐ 削除中フラグ追加
  const [isDeletingDevice, setIsDeletingDevice] = useState(false); // ⭐ デバイス削除中フラグ追加

  // デバイス一覧取得（アクティブ判定付き）
  const fetchDevices = async () => {
    try {
      console.log("Fetching devices...");
      const response = await fetch("/api/devices");
      console.log("Response status:", response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Failed to fetch devices:", response.status, errorText);
        throw new Error("Failed to fetch devices");
      }
      
      const data = await response.json();
      console.log("Devices fetched:", data.length, data);
      setDevices(data);
      
      // 最終更新が5分以内のデバイスをアクティブとみなす
      const now = new Date().getTime();
      const activeThreshold = 5 * 60 * 1000; // 5分
      
      const active = data.filter((d: Device) => {
        const updatedAt = new Date(d.updatedAt || d.createdAt).getTime();
        return now - updatedAt < activeThreshold;
      });
      
      const inactive = data.filter((d: Device) => {
        const updatedAt = new Date(d.updatedAt || d.createdAt).getTime();
        return now - updatedAt >= activeThreshold;
      });
      
      setActiveDevices(active);
      setInactiveDevices(inactive);
    } catch (error) {
      console.error("デバイス取得エラー:", error);
    }
  };

  // 写真一覧取得
  const fetchPhotos = async (deviceId: string) => {
    try {
      console.log("=== fetchPhotos START ===");
      console.log("deviceId:", deviceId);
      
      const url = `/api/photos?deviceId=${deviceId}`;
      console.log("Request URL:", url);
      
      const response = await fetch(url);
      console.log("Response status:", response.status);
      console.log("Response headers:", Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Failed to fetch photos:", response.status, errorText);
        throw new Error("Failed to fetch photos");
      }
      
      const data = await response.json();
      console.log("Photos received:", data);
      console.log("Photos count:", data.length);
      console.log("First photo (if any):", data[0]);
      
      setPhotos(data);
      console.log("=== fetchPhotos END ===");
    } catch (error) {
      console.error("写真取得エラー:", error);
      if (error instanceof Error) {
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
      }
    }
  };

  // 撮影指令送信
  const sendCaptureCommand = async () => {
    if (!selectedDevice) {
      alert("デバイスを選択してください");
      return;
    }

    try {
      setIsCapturing(true);
      console.log("=== sendCaptureCommand START ===");
      console.log("Selected device:", selectedDevice);
      
      const url = `/api/control/${selectedDevice}`;
      const body = { shouldCapture: true };
      console.log("Request URL:", url);
      console.log("Request body:", body);
      
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      console.log("Response status:", response.status);
      console.log("Response headers:", Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Failed to send command:", response.status, errorText);
        throw new Error("Failed to send command");
      }      const result = await response.json();
      console.log("Capture command result:", result);
      console.log("=== sendCaptureCommand END ===");

      // 5秒後に写真を再取得（アップロード完了を待つ）
      console.log("Waiting 5 seconds before fetching photos...");
      setTimeout(() => {
        console.log("Now fetching photos after capture...");
        fetchPhotos(selectedDevice);
        setIsCapturing(false);
      }, 5000);
    } catch (error) {
      console.error("指令送信エラー:", error);
      if (error instanceof Error) {
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
      }
      alert("撮影指令の送信に失敗しました");
      setIsCapturing(false);
    }
  };

  // スワイプ処理
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;

    // 50px以上スワイプした場合
    if (Math.abs(diff) > 50) {
      if (diff > 0 && currentPhotoIndex < photos.length - 1) {
        // 左スワイプ: 次の写真
        setCurrentPhotoIndex(currentPhotoIndex + 1);
      } else if (diff < 0 && currentPhotoIndex > 0) {
        // 右スワイプ: 前の写真
        setCurrentPhotoIndex(currentPhotoIndex - 1);
      }
    }
  };

  // キーボードナビゲーション
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft" && currentPhotoIndex > 0) {
      setCurrentPhotoIndex(currentPhotoIndex - 1);
    } else if (e.key === "ArrowRight" && currentPhotoIndex < photos.length - 1) {
      setCurrentPhotoIndex(currentPhotoIndex + 1);
    }
  };

  // 初回ロード
  useEffect(() => {
    fetchDevices();
  }, []);

  // デバイス選択時
  useEffect(() => {
    if (selectedDevice) {
      fetchPhotos(selectedDevice);
      setCurrentPhotoIndex(0); // 写真インデックスをリセット
    }
  }, [selectedDevice]);

  // 写真が更新されたら最新の写真を表示
  useEffect(() => {
    if (photos.length > 0 && currentPhotoIndex >= photos.length) {
      setCurrentPhotoIndex(photos.length - 1);
    }
  }, [photos]);

  // 自動更新
  useEffect(() => {
    if (!autoRefresh || !selectedDevice) return;

    const interval = setInterval(() => {
      fetchPhotos(selectedDevice);
    }, 3000);

    return () => clearInterval(interval);
  }, [autoRefresh, selectedDevice]);  // 写真削除
  const deletePhoto = async (photoId: string) => {
    try {
      setIsDeleting(true); // ⭐ 削除開始
      console.log("Deleting photo:", photoId);
      const response = await fetch(`/api/photos/${photoId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete photo");
      }

      console.log("Photo deleted successfully");
      
      // 写真一覧を再取得
      if (selectedDevice) {
        await fetchPhotos(selectedDevice);
        
        // ⭐ 削除後にインデックスを調整
        setCurrentPhotoIndex((prevIndex) => {
          const newLength = photos.length - 1; // 1枚削除されるので
          if (newLength === 0) return 0;
          if (prevIndex >= newLength) return newLength - 1;
          return prevIndex;
        });
      }
      
      setShowDeleteConfirm(false);
      setPhotoToDelete(null);
    } catch (error) {
      console.error("写真削除エラー:", error);
      alert("写真の削除に失敗しました");
    } finally {
      setIsDeleting(false); // ⭐ 削除終了
    }
  };
  // デバイス削除
  const deleteDevice = async () => {
    if (!selectedDevice) return;

    try {
      setIsDeletingDevice(true); // ⭐ 削除開始
      console.log("Deleting device:", selectedDevice);
      const response = await fetch(`/api/devices?deviceId=${selectedDevice}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete device");
      }

      console.log("Device deleted successfully");
      
      // デバイス一覧を再取得
      await fetchDevices();
      
      // 選択をクリア
      setSelectedDevice("");
      setPhotos([]);
      setShowDeviceDeleteConfirm(false);
    } catch (error) {
      console.error("デバイス削除エラー:", error);
      alert("デバイスの削除に失敗しました");
    } finally {
      setIsDeletingDevice(false); // ⭐ 削除終了
    }
  };

  // 写真のないデバイスを一括削除
  const deleteEmptyDevices = async () => {
    try {
      const emptyDevices = [];
      
      // 各デバイスの写真数をチェック
      for (const device of devices) {
        const response = await fetch(`/api/photos?deviceId=${device.deviceId}`);
        if (response.ok) {
          const photos = await response.json();
          if (photos.length === 0) {
            emptyDevices.push(device.deviceId);
          }
        }
      }

      if (emptyDevices.length === 0) {
        alert("写真のないデバイスはありません");
        return;
      }

      if (!confirm(`${emptyDevices.length}個の空のデバイスを削除しますか？`)) {
        return;
      }

      console.log("Deleting empty devices:", emptyDevices);

      // 各デバイスを削除
      for (const deviceId of emptyDevices) {
        await fetch(`/api/devices?deviceId=${deviceId}`, {
          method: "DELETE",
        });
      }

      alert(`${emptyDevices.length}個のデバイスを削除しました`);
      
      // デバイス一覧を再取得
      await fetchDevices();
      
      // 削除されたデバイスが選択されていた場合はクリア
      if (selectedDevice && emptyDevices.includes(selectedDevice)) {
        setSelectedDevice("");
        setPhotos([]);
      }
    } catch (error) {
      console.error("空デバイス削除エラー:", error);
      alert("デバイスの削除に失敗しました");
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">      {/* ヘッダー */}
      <div className="border-b border-white/10 backdrop-blur-sm bg-black/80 sticky top-0 z-50">
        <div className="flex items-center justify-between max-w-7xl mx-auto px-4 py-4 md:px-6 md:py-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 className="text-xl md:text-2xl font-light tracking-wide">Commander</h1>
          </div>
          <button
            onClick={() => router.push("/mode-select")}
            className="text-sm bg-white/5 hover:bg-white/10 px-4 py-2 rounded-lg transition-all duration-200 border border-white/10 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            戻る
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
        <div className="grid lg:grid-cols-3 gap-4 md:gap-6">
          {/* 左: コントロールパネル */}
          <div className="lg:col-span-1">            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 md:p-6 lg:sticky lg:top-24 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-6 pb-3 border-b border-white/10">
                <svg className="w-5 h-5 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
                <h2 className="text-lg font-light">コントロール</h2>
              </div>{/* デバイス選択 */}
              <div className="mb-6">
                <label className="block text-sm text-white/60 mb-2 font-light">
                  デバイス選択
                </label>
                <select
                  value={selectedDevice}
                  onChange={(e) => setSelectedDevice(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-white/20 transition-all duration-200"
                >                  <option value="" className="bg-black">-- 選択してください --</option>
                  
                  {/* アクティブなデバイス */}
                  {activeDevices.length > 0 && (
                    <optgroup label="● アクティブ" className="bg-black">
                      {activeDevices.map((device) => (
                        <option key={device.id} value={device.deviceId} className="bg-black">
                          {device.name}
                        </option>
                      ))}
                    </optgroup>
                  )}
                  
                  {/* 非アクティブなデバイス */}
                  {inactiveDevices.length > 0 && (
                    <optgroup label="○ オフライン" className="bg-black">
                      {inactiveDevices.map((device) => (
                        <option key={device.id} value={device.deviceId} className="bg-black">
                          {device.name}
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </div>              {/* 撮影ボタン */}
              <button
                onClick={sendCaptureCommand}
                disabled={!selectedDevice || isCapturing}
                className="w-full bg-white text-black hover:bg-white/90 disabled:bg-white/10 disabled:text-white/30 py-4 rounded-xl font-medium text-base transition-all duration-200 mb-4 shadow-lg disabled:shadow-none flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {isCapturing ? "撮影中..." : "撮影指令"}
              </button>              {/* 自動更新 */}
              <label className="flex items-center space-x-3 mb-4 cursor-pointer group">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={autoRefresh}
                    onChange={(e) => setAutoRefresh(e.target.checked)}
                    className="w-5 h-5 rounded border-white/20 bg-white/5 text-white focus:ring-2 focus:ring-white/20 transition-all duration-200"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span className="text-sm font-light group-hover:text-white/80 transition-colors">自動更新 (3秒)</span>
                </div>
              </label>              {/* デバイス更新 */}
              <button
                onClick={fetchDevices}
                className="w-full bg-white/5 hover:bg-white/10 border border-white/10 py-2.5 rounded-xl text-sm font-light transition-all duration-200 flex items-center justify-center gap-2 mb-3"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                デバイス一覧を更新
              </button>

              {/* 空デバイス削除 */}
              <button
                onClick={deleteEmptyDevices}
                className="w-full bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-500/30 py-2.5 rounded-xl text-sm font-light transition-all duration-200 flex items-center justify-center gap-2 mb-3 text-white/60 hover:text-red-400"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                空デバイスを削除
              </button>

              {/* 選択中のデバイスを削除 */}
              {selectedDevice && (
                <button
                  onClick={() => setShowDeviceDeleteConfirm(true)}
                  className="w-full bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 py-2.5 rounded-xl text-sm font-light transition-all duration-200 flex items-center justify-center gap-2 text-red-400"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  このデバイスを削除
                </button>
              )}
            </div>
          </div>          {/* 右: 写真ギャラリー（スマホ最適化） */}
          <div className="lg:col-span-2">
            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-sm">              {/* ギャラリーヘッダー */}
              <div className="flex items-center justify-between p-4 md:p-5 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <h2 className="text-lg md:text-xl font-light">撮影履歴</h2>
                  {photos.length > 0 && (
                    <span className="text-sm text-white/60 bg-white/5 px-3 py-1 rounded-lg font-mono">
                      {currentPhotoIndex + 1} / {photos.length}
                    </span>
                  )}
                </div>
                {selectedDevice && (
                  <button
                    onClick={() => fetchPhotos(selectedDevice)}
                    className="text-sm bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-2 rounded-lg transition-all duration-200"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                )}
              </div>              {/* ギャラリーコンテンツ */}
              {!selectedDevice ? (
                <div className="text-center py-24 text-white/40">
                  <svg className="w-16 h-16 mx-auto mb-4 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <p className="text-lg font-light">デバイスを選択してください</p>
                </div>
              ) : photos.length === 0 ? (
                <div className="text-center py-24 text-white/40">
                  <svg className="w-16 h-16 mx-auto mb-4 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <p className="text-lg font-light">まだ写真がありません</p>
                  <p className="text-sm mt-2 text-white/30">撮影指令を送信してください</p>
                </div>              ) : (
                <div className="relative">
                  {/* メイン写真表示エリア */}
                  <div
                    ref={galleryRef}
                    className="relative bg-black aspect-video overflow-hidden select-none touch-pan-y"
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                    onKeyDown={handleKeyDown}
                    tabIndex={0}
                  >
                    {photos[currentPhotoIndex] && (
                      <img
                        src={photos[currentPhotoIndex].url}
                        alt={photos[currentPhotoIndex].fileName}
                        className="w-full h-full object-contain transition-opacity duration-300"
                        draggable={false}
                      />
                    )}
                    
                    {/* ナビゲーション矢印（PC用） */}
                    {currentPhotoIndex > 0 && (
                      <button
                        onClick={() => setCurrentPhotoIndex(currentPhotoIndex - 1)}
                        className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white p-3 rounded-full transition-all duration-200 border border-white/20"
                        aria-label="前の写真"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                    )}
                    {currentPhotoIndex < photos.length - 1 && (
                      <button
                        onClick={() => setCurrentPhotoIndex(currentPhotoIndex + 1)}
                        className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white p-3 rounded-full transition-all duration-200 border border-white/20"
                        aria-label="次の写真"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    )}
                    
                    {/* スワイプヒント（スマホ用） */}
                    {photos.length > 1 && (
                      <div className="md:hidden absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 backdrop-blur-sm text-white text-xs px-4 py-2 rounded-full pointer-events-none border border-white/20">
                        ← スワイプで切り替え →
                      </div>
                    )}
                  </div>                  {/* 写真情報 */}
                  {photos[currentPhotoIndex] && (
                    <div className="p-4 md:p-5 bg-white/5 border-b border-white/10">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white/80 font-mono truncate">
                            {photos[currentPhotoIndex].fileName}
                          </p>
                          <p className="text-xs text-white/50 mt-1 font-light">
                            {new Date(photos[currentPhotoIndex].createdAt).toLocaleString("ja-JP", {
                              year: "numeric",
                              month: "2-digit",
                              day: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit",
                              second: "2-digit"
                            })}
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            setPhotoToDelete(photos[currentPhotoIndex].id);
                            setShowDeleteConfirm(true);
                          }}
                          className="flex-shrink-0 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 hover:text-red-300 p-2.5 rounded-lg transition-all duration-200"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>                      </div>
                    </div>
                  )}

                  {/* サムネイル一覧（横スクロール） */}
                  <div className="p-3 md:p-4 overflow-x-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
                    <div className="flex gap-2">
                      {photos.map((photo, index) => (
                        <button
                          key={photo.id}
                          onClick={() => setCurrentPhotoIndex(index)}
                          className={`flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                            index === currentPhotoIndex
                              ? "border-white ring-2 ring-white/30 scale-105"
                              : "border-white/20 hover:border-white/40"
                          }`}
                        >
                          <img
                            src={photo.url}
                            alt={`Thumbnail ${index + 1}`}
                            className="w-full h-full object-cover"
                            draggable={false}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>          </div>
        </div>
      </div>

      {/* 写真削除確認モーダル */}
      {showDeleteConfirm && photoToDelete && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/10 border border-white/20 rounded-2xl p-6 max-w-md w-full backdrop-blur-md">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="text-xl font-light mb-2">写真を削除しますか？</h3>
              <p className="text-sm text-white/60">この操作は取り消せません</p>
            </div>            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setPhotoToDelete(null);
                }}
                disabled={isDeleting}
                className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 py-3 rounded-xl font-light transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                キャンセル
              </button>
              <button
                onClick={() => photoToDelete && deletePhoto(photoToDelete)}
                disabled={isDeleting}
                className="flex-1 bg-red-500 hover:bg-red-600 py-3 rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    削除中...
                  </>
                ) : (
                  "削除する"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* デバイス削除確認モーダル */}
      {showDeviceDeleteConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/10 border border-white/20 rounded-2xl p-6 max-w-md w-full backdrop-blur-md">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-light mb-2">デバイスを削除しますか？</h3>
              <p className="text-sm text-white/60 mb-3">このデバイスと紐づく全ての写真が削除されます</p>
              {photos.length > 0 && (
                <p className="text-sm text-red-400 font-medium">{photos.length}枚の写真が削除されます</p>
              )}
            </div>            <div className="flex gap-3">
              <button
                onClick={() => setShowDeviceDeleteConfirm(false)}
                disabled={isDeletingDevice}
                className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 py-3 rounded-xl font-light transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                キャンセル
              </button>
              <button
                onClick={deleteDevice}
                disabled={isDeletingDevice}
                className="flex-1 bg-red-500 hover:bg-red-600 py-3 rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isDeletingDevice ? (
                  <>
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    削除中...
                  </>                ) : (
                  "削除する"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
