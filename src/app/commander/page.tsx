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

  const fetchDevices = async () => {
    try {
      const response = await fetch("/api/devices");
      if (!response.ok) throw new Error("Failed to fetch devices");
      
      const data = await response.json();
      setDevices(data);
      
      const now = new Date().getTime();
      const activeThreshold = 5 * 60 * 1000;
      
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

  const fetchPhotos = async (deviceId: string) => {
    try {
      const response = await fetch(`/api/photos?deviceId=${deviceId}`);
      if (!response.ok) throw new Error("Failed to fetch photos");
      const data = await response.json();
      setPhotos(data);
    } catch (error) {
      console.error("写真取得エラー:", error);
    }
  };

  const sendCaptureCommand = async () => {
    if (!selectedDevice) {
      alert("デバイスを選択してください");
      return;
    }

    try {
      setIsCapturing(true);
      const response = await fetch(`/api/control/${selectedDevice}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shouldCapture: true }),
      });

      if (!response.ok) throw new Error("Failed to send command");

      setTimeout(() => {
        fetchPhotos(selectedDevice);
        setIsCapturing(false);
      }, 3000);
    } catch (error) {
      console.error("指令送信エラー:", error);
      alert("撮影指令の送信に失敗しました");
      setIsCapturing(false);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;

    if (Math.abs(diff) > 50) {
      if (diff > 0 && currentPhotoIndex < photos.length - 1) {
        setCurrentPhotoIndex(currentPhotoIndex + 1);
      } else if (diff < 0 && currentPhotoIndex > 0) {
        setCurrentPhotoIndex(currentPhotoIndex - 1);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft" && currentPhotoIndex > 0) {
      setCurrentPhotoIndex(currentPhotoIndex - 1);
    } else if (e.key === "ArrowRight" && currentPhotoIndex < photos.length - 1) {
      setCurrentPhotoIndex(currentPhotoIndex + 1);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  useEffect(() => {
    if (selectedDevice) {
      fetchPhotos(selectedDevice);
      setCurrentPhotoIndex(0);
    }
  }, [selectedDevice]);

  useEffect(() => {
    if (photos.length > 0 && currentPhotoIndex >= photos.length) {
      setCurrentPhotoIndex(photos.length - 1);
    }
  }, [photos]);

  useEffect(() => {
    if (!autoRefresh || !selectedDevice) return;
    const interval = setInterval(() => {
      fetchPhotos(selectedDevice);
    }, 3000);
    return () => clearInterval(interval);
  }, [autoRefresh, selectedDevice]);

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="bg-purple-600 p-4 shadow-lg">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold">💻 Commander</h1>
          <button
            onClick={() => router.push("/mode-select")}
            className="text-sm bg-purple-700 hover:bg-purple-800 px-4 py-2 rounded-lg transition-colors"
          >
            戻る
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 md:p-6">
        <div className="grid lg:grid-cols-3 gap-4 md:gap-6">
          <div className="lg:col-span-1">
            <div className="bg-slate-800 rounded-xl p-4 md:p-6 lg:sticky lg:top-6">
              <h2 className="text-xl font-bold mb-4">🎮 コントロール</h2>

              <div className="mb-6">
                <label className="block text-sm text-slate-400 mb-2">デバイス選択</label>
                <select
                  value={selectedDevice}
                  onChange={(e) => setSelectedDevice(e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">-- 選択してください --</option>
                  {activeDevices.length > 0 && (
                    <optgroup label="🟢 アクティブ">
                      {activeDevices.map((device) => (
                        <option key={device.id} value={device.deviceId}>
                          {device.name}
                        </option>
                      ))}
                    </optgroup>
                  )}
                  {inactiveDevices.length > 0 && (
                    <optgroup label="⚪ オフライン">
                      {inactiveDevices.map((device) => (
                        <option key={device.id} value={device.deviceId}>
                          {device.name}
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </div>

              <button
                onClick={sendCaptureCommand}
                disabled={!selectedDevice || isCapturing}
                className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-slate-600 py-4 rounded-xl font-bold text-lg transition-colors mb-4"
              >
                {isCapturing ? "📸 撮影中..." : "📸 撮影指令"}
              </button>

              <label className="flex items-center space-x-3 mb-4 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="w-5 h-5 rounded border-slate-600 bg-slate-700 text-purple-600 focus:ring-2 focus:ring-purple-500"
                />
                <span className="text-sm">自動更新 (3秒)</span>
              </label>

              <button
                onClick={fetchDevices}
                className="w-full bg-slate-700 hover:bg-slate-600 py-2 rounded-lg text-sm transition-colors"
              >
                🔄 デバイス一覧を更新
              </button>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-slate-800 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-slate-700">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg md:text-xl font-bold">📷 撮影履歴</h2>
                  {photos.length > 0 && (
                    <span className="text-sm text-slate-400 bg-slate-700 px-2 py-1 rounded">
                      {currentPhotoIndex + 1} / {photos.length}
                    </span>
                  )}
                </div>
                {selectedDevice && (
                  <button
                    onClick={() => fetchPhotos(selectedDevice)}
                    className="text-sm bg-slate-700 hover:bg-slate-600 px-3 py-2 rounded-lg transition-colors"
                  >
                    🔄
                  </button>
                )}
              </div>

              {!selectedDevice ? (
                <div className="text-center py-20 text-slate-400">
                  <p className="text-lg">デバイスを選択してください</p>
                </div>
              ) : photos.length === 0 ? (
                <div className="text-center py-20 text-slate-400">
                  <p className="text-lg">まだ写真がありません</p>
                  <p className="text-sm mt-2">撮影指令を送信してください</p>
                </div>
              ) : (
                <div className="relative">
                  <div
                    ref={galleryRef}
                    className="relative bg-black aspect-video overflow-hidden select-none touch-pan-y"
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                    onKeyDown={handleKeyDown}
                    tabIndex={0}
                  >
                    <img
                      src={photos[currentPhotoIndex].url}
                      alt={photos[currentPhotoIndex].fileName}
                      className="w-full h-full object-contain"
                      draggable={false}
                    />
                    
                    {currentPhotoIndex > 0 && (
                      <button
                        onClick={() => setCurrentPhotoIndex(currentPhotoIndex - 1)}
                        className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-3 rounded-full transition-all"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                    )}
                    {currentPhotoIndex < photos.length - 1 && (
                      <button
                        onClick={() => setCurrentPhotoIndex(currentPhotoIndex + 1)}
                        className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-3 rounded-full transition-all"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    )}
                    
                    {photos.length > 1 && (
                      <div className="md:hidden absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white text-xs px-3 py-1 rounded-full pointer-events-none">
                        ← スワイプで切り替え →
                      </div>
                    )}
                  </div>

                  <div className="p-4 bg-slate-750 border-b border-slate-700">
                    <p className="text-sm text-slate-300 font-mono truncate">
                      {photos[currentPhotoIndex].fileName}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {new Date(photos[currentPhotoIndex].createdAt).toLocaleString("ja-JP")}
                    </p>
                  </div>

                  <div className="p-3 md:p-4 overflow-x-auto">
                    <div className="flex gap-2">
                      {photos.map((photo, index) => (
                        <button
                          key={photo.id}
                          onClick={() => setCurrentPhotoIndex(index)}
                          className={`flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden border-2 transition-all ${
                            index === currentPhotoIndex
                              ? "border-purple-500 ring-2 ring-purple-500/50 scale-110"
                              : "border-slate-600 hover:border-slate-500"
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
