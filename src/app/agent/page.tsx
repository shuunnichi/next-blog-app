// REBUILD TIMESTAMP: 2026-02-18 FORCED UPDATE
"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

interface Photo {
  id: number;
  deviceId: string;
  fileName: string;
  url: string;
  createdAt: string;
}

export default function AgentPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isCameraReadyRef = useRef<boolean>(false);
  const deviceIdRef = useRef<string>("");
  const isCapturingRef = useRef<boolean>(false); // ⭐ Ref版追加（重要）
  
  const [deviceId, setDeviceId] = useState<string>("");
  const [deviceName, setDeviceName] = useState<string>("");
  const [devicePassword, setDevicePassword] = useState<string>(""); // ⚡ パスワード用
  const [isRegistered, setIsRegistered] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string>("");
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [status, setStatus] = useState("待機中");
  const [showSettings, setShowSettings] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [showPhotoViewer, setShowPhotoViewer] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);  const [newDeviceName, setNewDeviceName] = useState("");
  const [isPollingEnabled, setIsPollingEnabled] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false); // 撮影中フラグ追加

  const updateDeviceId = (id: string) => {
    setDeviceId(id);
    deviceIdRef.current = id;
  };

  const fetchPhotos = async (devId: string) => {
    try {
      console.log("📷 Fetching photos for device:", devId);
      const response = await fetch(`/api/photos?deviceId=${devId}`);
      console.log("📷 Response status:", response.status);
      if (response.ok) {
        const data = await response.json();
        console.log("📷 Photos received:", data.length, "photos");
        console.log("📷 Photo data:", data);
        console.log("📷 Setting photos state...");
        setPhotos(data);
        console.log("📷 Photos state updated!");
      } else {
        console.error("📷 Failed to fetch photos:", response.status);
      }
    } catch (error) {
      console.error("Failed to fetch photos:", error);
    }
  };

  // ⭐ 最優先：初回マウント時の処理
  useEffect(() => {
    console.log("=".repeat(80));
    console.log("🚀🚀🚀 INITIAL USEEFFECT RUNNING - VERSION 2026-02-18 22:30 🚀🚀🚀");
    console.log("=".repeat(80));
    const savedDeviceId = localStorage.getItem("silentEye_deviceId");
    const savedDeviceName = localStorage.getItem("silentEye_deviceName");
    console.log("🚀 Saved Device ID:", savedDeviceId);
    console.log("🚀 Saved Device Name:", savedDeviceName);

    if (savedDeviceId && savedDeviceName) {
      console.log("🚀 Initializing device...");
      updateDeviceId(savedDeviceId);
      setDeviceName(savedDeviceName);
      setIsRegistered(true);
      console.log("🚀 Calling fetchPhotos with:", savedDeviceId);
      fetchPhotos(savedDeviceId);
      console.log("🚀 Starting camera...");
      startCamera();
    } else {
      console.log("❌ No saved device found in localStorage");
    }
  }, []);

  // photosステートの変更を監視
  useEffect(() => {
    console.log("📸 Photos state changed! New count:", photos.length);
  }, [photos]);
  // ポーリング用useEffect
  useEffect(() => {
    if (!deviceId || !isRegistered || !isPollingEnabled) return;
    
    const interval = setInterval(async () => {
      try {
        // ⭐ Refで即座にチェック（State更新を待たない）
        if (isCapturingRef.current) {
          console.log("⏭️ 撮影中のためスキップ");
          return;
        }
        
        const response = await fetch(`/api/control/${deviceId}`);
        if (!response.ok) return;
        const data = await response.json();
        
        // ⭐ 二重チェック: Refとdataの両方
        if (data.shouldCapture && !isCapturingRef.current) {
          console.log("🎯 撮影指令を受信しました");
          isCapturingRef.current = true; // ⭐ 即座にフラグセット
          setIsCapturing(true);
          setStatus("📸 撮影準備中");
          
          // まず shouldCapture をリセット（次のポーリングで再実行されないように）
          await fetch(`/api/control/${deviceId}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ shouldCapture: false }),
          });
          
          // 撮影実行
          await capturePhoto();
        }
      } catch (error) {
        console.error("ポーリングエラー:", error);
        isCapturingRef.current = false; // ⭐ Refもリセット
        setIsCapturing(false);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [deviceId, isRegistered, isPollingEnabled, isCapturing]);

  const startCamera = async () => {
    try {
      setCameraError("");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        isCameraReadyRef.current = true;
        setIsCameraReady(true);
      }
    } catch (error) {
      let errorMessage = "カメラアクセス失敗";
      if (error instanceof Error && error.name === "NotAllowedError") {
        errorMessage = "カメラの使用が許可されていません";
      }
      setCameraError(errorMessage);
      setIsCameraReady(false);
      isCameraReadyRef.current = false;
    }
  };

  const registerDevice = async () => {
    if (!deviceName.trim()) {
      alert("デバイス名を入力してください");
      return;
    }
    try {
      const checkResponse = await fetch("/api/devices");
      if (checkResponse.ok) {
        const existingDevices = await checkResponse.json();
        const existingDevice = existingDevices.find((d: any) => d.name === deviceName);
        if (existingDevice) {
          updateDeviceId(existingDevice.deviceId);
          setIsRegistered(true);
          localStorage.setItem("silentEye_deviceId", existingDevice.deviceId);
          localStorage.setItem("silentEye_deviceName", deviceName);
          await startCamera();
          await fetchPhotos(existingDevice.deviceId);
          return;
        }
      }      const response = await fetch("/api/devices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name: deviceName,
          password: devicePassword || undefined // パスワードがあれば送信
        }),
      });
      if (!response.ok) throw new Error("登録失敗");
      const data = await response.json();
      updateDeviceId(data.deviceId);
      setIsRegistered(true);
      localStorage.setItem("silentEye_deviceId", data.deviceId);
      localStorage.setItem("silentEye_deviceName", deviceName);
      await startCamera();
      await fetchPhotos(data.deviceId);
    } catch (error) {
      console.error("登録エラー:", error);
      alert("デバイス登録に失敗しました");
    }
  };

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current || !isCameraReadyRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    
    canvas.toBlob(async (blob) => {
      if (!blob || !deviceIdRef.current) return;
      setStatus("📸 撮影完了");
      
      const flash = document.createElement("div");
      flash.style.cssText = "position:fixed;inset:0;background:white;z-index:9999;animation:flash 0.3s;pointer-events:none;";
      document.body.appendChild(flash);
      setTimeout(() => flash.remove(), 300);
      
      await uploadPhoto(blob);
    }, "image/jpeg", 0.9);
  };
  const uploadPhoto = async (blob: Blob) => {
    if (!deviceIdRef.current) return;
    const fileName = `${deviceIdRef.current}_${Date.now()}.jpg`;
    const formData = new FormData();
    formData.append("file", blob, fileName);
    formData.append("deviceId", deviceIdRef.current);
    
    try {
      setIsUploading(true);
      setStatus("☁️ アップロード中");
      console.log("📤 アップロード開始:", fileName);
      
      const response = await fetch("/api/photos", {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("アップロード失敗:", response.status, errorText);
        throw new Error("アップロード失敗");
      }
      
      console.log("✅ アップロード成功:", fileName);
      setStatus("✅ 完了");
      await fetchPhotos(deviceIdRef.current);
      setTimeout(() => setStatus("待機中"), 2000);
    } catch (error) {
      console.error("アップロードエラー:", error);
      setStatus("❌ 失敗");
      setTimeout(() => setStatus("待機中"), 3000);    } finally {
      setIsUploading(false);
      setIsCapturing(false); // State版をリセット
      isCapturingRef.current = false; // ⭐ Ref版もリセット
    }
  };

  const handleResetDevice = () => {
    if (!confirm("デバイス情報をリセットしますか？")) return;
    localStorage.removeItem("silentEye_deviceId");
    localStorage.removeItem("silentEye_deviceName");
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
    }
    window.location.reload();
  };

  const handleChangeDeviceName = async () => {
    if (!newDeviceName.trim()) return;
    try {
      const response = await fetch(`/api/devices`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId, name: newDeviceName }),
      });
      if (!response.ok) throw new Error("変更失敗");
      setDeviceName(newDeviceName);
      localStorage.setItem("silentEye_deviceName", newDeviceName);
      setShowSettings(false);
    } catch (error) {
      alert("デバイス名の変更に失敗しました");
    }
  };

  return (
    <div className="fixed inset-0 bg-black text-white overflow-hidden">
      <style jsx global>{`
        @keyframes flash {
          0%, 100% { opacity: 0; }
          50% { opacity: 1; }
        }
      `}</style>      {!isRegistered ? (
        <div className="h-full flex items-center justify-center p-6">
          <div className="w-full max-w-md">            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <h1 className="text-4xl font-light tracking-wide">Silent Camera</h1>
              </div>
              <p className="text-white/60 font-light">Agent Mode</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
              <h2 className="text-xl font-light mb-4 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                デバイス登録              </h2>
              <input
                type="text"
                placeholder="デバイス名（例: My iPhone）"
                value={deviceName}
                onChange={(e) => setDeviceName(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && registerDevice()}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 mb-4 text-white focus:outline-none focus:ring-2 focus:ring-white/20 transition-all duration-200 font-light"
                autoFocus
              />
              <input
                type="password"
                placeholder="パスワード（任意・未入力で保護なし）"
                value={devicePassword}
                onChange={(e) => setDevicePassword(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && registerDevice()}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 mb-4 text-white focus:outline-none focus:ring-2 focus:ring-white/20 transition-all duration-200 font-light"
              />
              <button
                onClick={registerDevice}
                className="w-full bg-white text-black hover:bg-white/90 py-3 rounded-xl font-medium transition-all duration-200 active:scale-95 shadow-lg"
              >
                登録して開始
              </button>
            </div>
            <button
              onClick={() => router.push("/mode-select")}
              className="mt-6 w-full text-center text-white/60 hover:text-white transition-colors py-3 flex items-center justify-center gap-2 font-light"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              モード選択に戻る
            </button>
          </div>
        </div>
      ) : (
        <div className="relative h-full w-full">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-cover"
          />

          {!isCameraReady && !cameraError && (
            <div className="absolute inset-0 flex items-center justify-center bg-black">
              <p className="text-lg">カメラ起動中...</p>
            </div>
          )}

          {cameraError && (
            <div className="absolute inset-0 flex items-center justify-center bg-black p-6">
              <div className="max-w-md w-full bg-white/5 border border-red-500/50 rounded-lg p-6 text-center">
                <p className="text-6xl mb-4">⚠️</p>
                <h3 className="font-bold text-xl mb-3">カメラエラー</h3>
                <p className="text-sm mb-4">{cameraError}</p>
                <button
                  onClick={startCamera}
                  className="w-full bg-white text-black py-3 rounded font-bold"
                >
                  🔄 再試行
                </button>
              </div>
            </div>
          )}          <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 via-black/40 to-transparent p-4 z-10 backdrop-blur-sm border-b border-white/5">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <svg className="w-4 h-4 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <p className="text-xs text-white/60 font-light">{deviceName}</p>
                </div>
                <p className="text-sm font-light">{status}</p>
              </div>
              <button
                onClick={() => {
                  setNewDeviceName(deviceName);
                  setShowSettings(true);
                }}
                className="bg-white/10 hover:bg-white/20 backdrop-blur-sm p-3 rounded-xl transition-all duration-200 border border-white/10"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            </div>
          </div>          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-6 z-10 backdrop-blur-sm border-t border-white/5">
            <div className="flex items-center justify-between max-w-md mx-auto">
              <button
                id="gallery-button"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  console.log("🖼️ GALLERY BUTTON CLICKED!");
                  console.log("🖼️ Opening gallery, current photos:", photos.length);
                  console.log("🖼️ Device ID:", deviceId);
                  fetchPhotos(deviceId);
                  setShowGallery(true);
                }}
                className="relative bg-white/10 hover:bg-white/20 backdrop-blur-sm p-4 rounded-xl transition-all duration-200 border border-white/10 z-20"
                style={{ pointerEvents: 'auto', cursor: 'pointer' }}
              >
                {photos.length > 0 ? (
                  <>
                    <img src={photos[0].url} alt="Latest" className="w-12 h-12 object-cover rounded-lg" />
                    <div className="absolute -top-2 -right-2 bg-white text-black text-xs font-medium rounded-full w-6 h-6 flex items-center justify-center shadow-lg">
                      {photos.length}
                    </div>
                  </>
                ) : (
                  <svg className="w-12 h-12 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                )}
              </button>              <button
                onClick={(e) => {
                  e.stopPropagation();
                  console.log("📸 SHUTTER BUTTON CLICKED!");
                  if (!isCapturing) {
                    setIsCapturing(true);
                    capturePhoto();
                  }
                }}
                disabled={!isCameraReady || !!cameraError || isCapturing}
                className="relative disabled:opacity-30 transition active:scale-95 z-20"
              >
                <div className="w-20 h-20 rounded-full border-4 border-white bg-transparent hover:bg-white/10 transition flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-white"></div>
                </div>
              </button>              <button
                onClick={(e) => {
                  e.stopPropagation();
                  console.log("⬅️ BACK BUTTON CLICKED!");
                  router.push("/mode-select");
                }}
                className="bg-white/10 hover:bg-white/20 backdrop-blur-sm p-4 rounded-xl transition-all duration-200 border border-white/10 z-20 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />      {showSettings && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 max-w-md w-full backdrop-blur-md">
            <div className="flex items-center gap-2 mb-6">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <h2 className="text-xl font-light">設定</h2>
            </div>
            <div className="mb-4">
              <label className="block text-sm text-white/60 mb-2 font-light">デバイス名変更</label>
              <input
                type="text"
                value={newDeviceName}
                onChange={(e) => setNewDeviceName(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 mb-3 text-white focus:outline-none focus:ring-2 focus:ring-white/20 transition-all duration-200 font-light"
              />
              <button
                onClick={handleChangeDeviceName}
                className="w-full bg-white text-black hover:bg-white/90 py-3 rounded-xl font-medium transition-all duration-200 shadow-lg"
              >
                変更を保存
              </button>
            </div>
            <div className="mb-4 p-4 bg-white/5 rounded-xl border border-white/10">
              <p className="text-xs text-white/40 mb-1 font-light">デバイスID</p>
              <p className="text-sm font-mono break-all text-white/80">{deviceId}</p>
            </div>
            <div className="mb-4">
              <label className="flex items-center justify-between p-4 bg-white/5 rounded-xl cursor-pointer border border-white/10 hover:bg-white/10 transition-all duration-200">
                <span className="text-sm font-light">遠隔撮影を有効にする</span>
                <input
                  type="checkbox"
                  checked={isPollingEnabled}
                  onChange={(e) => setIsPollingEnabled(e.target.checked)}
                  className="w-5 h-5 rounded border-white/20 bg-white/5 text-white focus:ring-2 focus:ring-white/20 transition-all duration-200"
                />
              </label>
            </div>
            <button
              onClick={handleResetDevice}
              className="w-full bg-red-600/80 hover:bg-red-600 py-3 rounded-xl font-medium mb-3 transition-all duration-200 flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              リセット
            </button>
            <button
              onClick={() => setShowSettings(false)}
              className="w-full bg-white/10 hover:bg-white/20 py-3 rounded-xl font-light transition-all duration-200 border border-white/10"
            >
              閉じる
            </button>
          </div>
        </div>
      )}      {showGallery && (
        <div className="fixed inset-0 bg-black z-[100] flex flex-col">
          <div className="bg-white/5 backdrop-blur-sm border-b border-white/10 p-4 flex items-center justify-between sticky top-0">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <h2 className="text-xl font-light">写真</h2>
              <span className="text-sm text-white/60 bg-white/5 px-3 py-1 rounded-lg font-mono">{photos.length}</span>
            </div>
            <button
              onClick={() => setShowGallery(false)}
              className="p-2 hover:bg-white/10 rounded-xl transition-all duration-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-1">
            {photos.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-white/40">
                <svg className="w-24 h-24 mb-4 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-lg font-light">写真がありません</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-1">
                {photos.map((photo, idx) => (
                  <button
                    key={photo.id}
                    onClick={() => {
                      setSelectedPhotoIndex(idx);
                      setShowPhotoViewer(true);
                      setShowGallery(false);
                    }}
                    className="aspect-square overflow-hidden bg-white/5 active:opacity-70 transition-opacity rounded-lg border border-white/10"
                  >
                    <img src={photo.url} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}      {showPhotoViewer && photos[selectedPhotoIndex] && (
        <div className="fixed inset-0 bg-black z-[100] flex flex-col">
          <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 via-black/40 to-transparent p-4 z-10 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setShowPhotoViewer(false)}
                className="p-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl transition-all duration-200 border border-white/10"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <p className="text-sm font-mono bg-white/5 px-3 py-1 rounded-lg border border-white/10">
                {selectedPhotoIndex + 1} / {photos.length}
              </p>
              <div className="w-10"></div>
            </div>
          </div>
          <div className="flex-1 relative flex items-center justify-center">
            <img
              src={photos[selectedPhotoIndex].url}
              alt="Photo"
              className="max-w-full max-h-full object-contain"
            />
            {selectedPhotoIndex > 0 && (
              <button
                onClick={() => setSelectedPhotoIndex(selectedPhotoIndex - 1)}
                className="absolute left-4 p-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl transition-all duration-200 border border-white/10"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            {selectedPhotoIndex < photos.length - 1 && (
              <button
                onClick={() => setSelectedPhotoIndex(selectedPhotoIndex + 1)}
                className="absolute right-4 p-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl transition-all duration-200 border border-white/10"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
          </div>
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-6 backdrop-blur-sm">
            <p className="text-xs text-white/60 text-center font-light">
              {new Date(photos[selectedPhotoIndex].createdAt).toLocaleString("ja-JP", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit"
              })}
            </p>
          </div>
        </div>
      )}      {isUploading && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[200]">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 text-center">
            <div className="animate-spin w-16 h-16 border-4 border-white/20 border-t-white rounded-full mx-auto mb-4"></div>
            <p className="text-lg font-light">アップロード中...</p>
          </div>
        </div>
      )}
    </div>
  );
}
