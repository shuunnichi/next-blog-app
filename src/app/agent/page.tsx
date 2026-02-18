"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export default function AgentPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isCameraReadyRef = useRef<boolean>(false);
  const deviceIdRef = useRef<string>("");
  const [deviceId, setDeviceId] = useState<string>("");
  const [deviceName, setDeviceName] = useState<string>("");
  const [isRegistered, setIsRegistered] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string>("");
  const [lastPhotoUrl, setLastPhotoUrl] = useState<string>("");
  const [capturedPhotoBlob, setCapturedPhotoBlob] = useState<Blob | null>(null); // 撮影した写真のBlob
  const [status, setStatus] = useState("待機中...");
  const [showSettings, setShowSettings] = useState(false);
  const [showPhotoViewer, setShowPhotoViewer] = useState(false); // 写真ビューアー表示
  const [newDeviceName, setNewDeviceName] = useState("");
  const [isPollingEnabled, setIsPollingEnabled] = useState(true); // ポーリングON/OFF
  const [isUploading, setIsUploading] = useState(false); // アップロード中フラグ

  const updateDeviceId = (id: string) => {
    setDeviceId(id);
    deviceIdRef.current = id;
  };

  useEffect(() => {
    const savedDeviceId = localStorage.getItem("silentEye_deviceId");
    const savedDeviceName = localStorage.getItem("silentEye_deviceName");

    if (savedDeviceId && savedDeviceName) {
      updateDeviceId(savedDeviceId);
      setDeviceName(savedDeviceName);
      setIsRegistered(true);
      setStatus("デバイス情報を復元しました");
      startCamera();
    }
  }, []);

  useEffect(() => {
    if (!deviceId || !isRegistered) return;

    console.log("Starting polling useEffect for deviceId:", deviceId);
    const cleanup = startPolling(deviceId);

    return cleanup;
  }, [deviceId, isRegistered, isPollingEnabled]);

  const startCamera = async () => {
    try {
      setCameraError("");
      setStatus("カメラを起動中...");

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        isCameraReadyRef.current = true;
        setIsCameraReady(true);
        setStatus("カメラ準備完了");
      }
    } catch (error) {
      console.warn("カメラアクセスエラー:", error);

      let errorMessage = "カメラへのアクセスに失敗しました";

      if (error instanceof Error) {
        if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
          errorMessage = "カメラの使用が許可されていません。ブラウザの設定でカメラへのアクセスを許可してください。";
        } else if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
          errorMessage = "カメラが見つかりません。デバイスにカメラが接続されているか確認してください。";
        } else if (error.name === "NotReadableError" || error.name === "TrackStartError") {
          errorMessage = "カメラが他のアプリケーションで使用中の可能性があります。";
        } else if (error.name === "OverconstrainedError") {
          errorMessage = "カメラの設定に問題があります。";
        } else if (error.name === "TypeError") {
          errorMessage = "ブラウザがカメラに対応していません。";
        }
      }

      setCameraError(errorMessage);
      setStatus("❌ カメラエラー");
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
          setStatus("既存デバイスを使用");
          localStorage.setItem("silentEye_deviceId", existingDevice.deviceId);
          localStorage.setItem("silentEye_deviceName", deviceName);
          await startCamera();
          return;
        }
      }

      const response = await fetch("/api/devices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: deviceName }),
      });

      if (!response.ok) throw new Error("デバイス登録失敗");

      const data = await response.json();
      updateDeviceId(data.deviceId);
      setIsRegistered(true);
      setStatus("デバイス登録完了");

      localStorage.setItem("silentEye_deviceId", data.deviceId);
      localStorage.setItem("silentEye_deviceName", deviceName);

      await startCamera();
    } catch (error) {
      console.error("登録エラー:", error);
      alert("デバイス登録に失敗しました");
    }
  };
  const capturePhoto = async (autoUpload = false) => {
    if (cameraError) {
      setStatus("❌ カメラエラー（再試行してください）");
      return;
    }

    if (!videoRef.current || !canvasRef.current) {
      console.error("カメラが起動していません");
      setStatus("❌ カメラ未起動");
      return;
    }

    if (!isCameraReadyRef.current) {
      console.log("カメラの準備を待っています...");
      setStatus("⏳ カメラ準備中...");

      let waitTime = 0;
      const maxWait = 5000;
      const checkInterval = 500;

      while (!isCameraReadyRef.current && waitTime < maxWait) {
        await new Promise((resolve) => setTimeout(resolve, checkInterval));
        waitTime += checkInterval;
      }

      if (!isCameraReadyRef.current) {
        console.error("カメラの準備がタイムアウトしました");
        setStatus("❌ カメラ準備タイムアウト");
        return;
      }
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);    canvas.toBlob(async (blob) => {
      if (!blob) return;

      // 1. すぐにローカルプレビューを右下にセット
      setCapturedPhotoBlob(blob);
      const localUrl = URL.createObjectURL(blob);
      setLastPhotoUrl(localUrl);
      setStatus("📸 撮影完了");

      // 2. バックグラウンドで自動アップロード（待たない）
      uploadPhoto(blob);
    }, "image/jpeg", 0.9);
  };

  const uploadPhoto = async (blob?: Blob) => {
    const photoBlob = blob || capturedPhotoBlob;
    if (!photoBlob) {
      setStatus("❌ 撮影された写真がありません");
      return;
    }

    const currentDeviceId = deviceIdRef.current;
    if (!currentDeviceId) {
      console.error("deviceId is empty!");
      setStatus("❌ デバイスIDがありません");
      return;
    }

    const fileName = `${currentDeviceId}_${Date.now()}.jpg`;
    const formData = new FormData();
    formData.append("file", photoBlob, fileName);
    formData.append("deviceId", currentDeviceId);

    console.log("Uploading photo with deviceId:", currentDeviceId);

    try {
      setIsUploading(true);
      setStatus("☁️ アップロード中...");

      const response = await fetch("/api/photos", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("アップロードエラー:", response.status, errorData);
        throw new Error(`アップロード失敗: ${errorData.error || response.statusText}`);
      }      const data = await response.json();
      setLastPhotoUrl(data.url); // ローカルURLをサーバーURLに置き換え
      setCapturedPhotoBlob(null);
      setStatus("✅ アップロード完了");

      setTimeout(() => setStatus("待機中..."), 2000);
    } catch (error) {
      console.error("アップロードエラー:", error);
      setStatus(`❌ ${error instanceof Error ? error.message : "アップロード失敗"}`);
    } finally {
      setIsUploading(false);
    }
  };

  const startPolling = (devId: string) => {
    console.log("=== Starting polling for device:", devId, "enabled:", isPollingEnabled);

    const interval = setInterval(async () => {
      if (!isPollingEnabled) return;

      try {
        const url = `/api/control/${devId}`;
        const response = await fetch(url);

        if (!response.ok) {
          console.error("Polling failed:", response.status);
          return;
        }

        const data = await response.json();

        if (data.shouldCapture) {
          console.log("📸 Capture command received!");
          setStatus("📸 リモート撮影指示を受信");

          await capturePhoto(true);

          console.log("Resetting capture flag...");
          await fetch(`/api/control/${devId}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ shouldCapture: false }),
          });
        }
      } catch (error) {
        console.error("ポーリングエラー:", error);
      }
    }, 2000);

    return () => {
      console.log("Stopping polling for device:", devId);
      clearInterval(interval);
    };
  };

  const handleChangeDeviceName = async () => {
    if (!newDeviceName.trim()) {
      alert("新しいデバイス名を入力してください");
      return;
    }

    try {
      const response = await fetch(`/api/devices`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId, name: newDeviceName }),
      });

      if (!response.ok) throw new Error("デバイス名変更失敗");

      setDeviceName(newDeviceName);
      localStorage.setItem("silentEye_deviceName", newDeviceName);
      setShowSettings(false);
      setStatus("✅ デバイス名を変更しました");
      setTimeout(() => setStatus("待機中..."), 3000);
    } catch (error) {
      console.error("デバイス名変更エラー:", error);
      alert("デバイス名の変更に失敗しました");
    }
  };

  const handleResetDevice = () => {
    if (!confirm("デバイス情報をリセットしますか？")) return;

    localStorage.removeItem("silentEye_deviceId");
    localStorage.removeItem("silentEye_deviceName");

    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
    }

    window.location.reload();
  };

  return (
    <div className="fixed inset-0 bg-black text-white overflow-hidden">
      {!isRegistered ? (
        <div className="h-full flex items-center justify-center p-6 bg-gradient-to-br from-slate-900 to-slate-800">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold mb-2">📱 SilentEye</h1>
              <p className="text-slate-400">Agent Mode</p>
            </div>

            <div className="bg-slate-800/80 backdrop-blur rounded-2xl p-8 shadow-2xl">
              <h2 className="text-xl font-bold mb-6">デバイス登録</h2>
              <input
                type="text"
                placeholder="デバイス名（例: My iPhone）"
                value={deviceName}
                onChange={(e) => setDeviceName(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && registerDevice()}
                className="w-full bg-slate-700/80 border border-slate-600 rounded-xl px-4 py-4 mb-6 text-white text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoFocus
              />
              <button
                onClick={registerDevice}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 py-4 rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-xl"
              >
                登録して開始
              </button>
            </div>

            <button
              onClick={() => router.push("/mode-select")}
              className="mt-6 w-full text-center text-slate-400 hover:text-white transition-colors py-3"
            >
              ← モード選択に戻る
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
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
              <div className="text-center">
                <div className="animate-pulse mb-4">
                  <svg
                    className="w-16 h-16 mx-auto text-blue-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </div>
                <p className="text-slate-300 text-lg">カメラ起動中...</p>
              </div>
            </div>
          )}

          {cameraError && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900 p-6">
              <div className="max-w-md w-full">
                <div className="bg-red-900/30 backdrop-blur border border-red-500/50 rounded-2xl p-6">
                  <div className="text-center mb-4">
                    <span className="text-6xl">⚠️</span>
                  </div>
                  <h3 className="font-bold text-red-200 text-xl mb-3 text-center">カメラエラー</h3>
                  <p className="text-sm text-red-100 mb-4 text-center">{cameraError}</p>

                  {cameraError.includes("許可") && (
                    <div className="text-xs text-red-200 bg-red-950/50 rounded-xl p-4 mb-4">
                      <p className="font-bold mb-2">💡 解決方法:</p>
                      <ul className="list-disc list-inside space-y-1 text-left">
                        <li>ブラウザのアドレスバー左側の🔒アイコンをクリック</li>
                        <li>「カメラ」の設定を「許可」に変更</li>
                        <li>ページを再読み込みまたは下の「再試行」をクリック</li>
                      </ul>
                    </div>
                  )}

                  <button
                    onClick={startCamera}
                    className="w-full bg-red-600 hover:bg-red-700 px-6 py-3 rounded-xl font-bold transition-colors shadow-lg"
                  >
                    🔄 再試行
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/70 to-transparent p-4 z-10">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs text-slate-300">{deviceName}</p>
                <p className="text-sm font-bold">{status}</p>
              </div>

              <button
                onClick={() => {
                  setNewDeviceName(deviceName);
                  setShowSettings(true);
                }}
                className="bg-black/50 hover:bg-black/70 p-3 rounded-full transition-all backdrop-blur"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </button>
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 z-10">
            <div className="flex items-center justify-between max-w-md mx-auto">
              <button
                onClick={() => router.push("/mode-select")}
                className="bg-black/50 hover:bg-black/70 p-4 rounded-full transition-all backdrop-blur"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
              </button>              <button
                onClick={() => capturePhoto(false)}
                disabled={!isCameraReady || !!cameraError}
                className="relative disabled:opacity-30 transition-transform active:scale-95"
              >
                <div className="w-20 h-20 rounded-full border-4 border-white bg-transparent hover:bg-white/20 transition-all flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-white"></div>
                </div>
              </button>

              <button
                onClick={() => lastPhotoUrl && setShowPhotoViewer(true)}
                className="w-14 h-14 rounded-xl overflow-hidden border-2 border-white/50 bg-slate-800 active:scale-95 transition-transform"
              >
                {lastPhotoUrl ? (
                  <img
                    src={lastPhotoUrl}
                    alt="Last capture"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-600">
                    <svg
                      className="w-8 h-8"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />

      {showSettings && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h2 className="text-xl font-bold mb-4">⚙️ 設定</h2>
            <div className="mb-6">
              <label className="block text-sm text-slate-400 mb-2">デバイス名変更</label>
              <input
                type="text"
                value={newDeviceName}
                onChange={(e) => setNewDeviceName(e.target.value)}
                className="w-full bg-slate-700/80 border border-slate-600 rounded-xl px-4 py-3 mb-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleChangeDeviceName}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 py-3 rounded-xl font-bold transition-all"
              >
                変更を保存
              </button>
            </div>            <div className="mb-6 p-4 bg-slate-700/50 rounded-xl">
              <p className="text-xs text-slate-400 mb-1">デバイスID</p>
              <p className="text-sm font-mono text-slate-300 break-all">{deviceId}</p>
            </div>

            <div className="mb-6">
              <label className="flex items-center justify-between p-4 bg-slate-700/50 rounded-xl cursor-pointer">
                <span className="text-sm">遠隔撮影を有効にする</span>
                <input
                  type="checkbox"
                  checked={isPollingEnabled}
                  onChange={(e) => setIsPollingEnabled(e.target.checked)}
                  className="w-5 h-5 rounded border-slate-600 bg-slate-700 text-purple-600 focus:ring-2 focus:ring-purple-500"
                />
              </label>
              <p className="text-xs text-slate-400 mt-2">※ OFFにすると手動撮影のみになり、バッテリー節約できます</p>
            </div>

            <div className="mb-6">
              <button
                onClick={handleResetDevice}
                className="w-full bg-red-600/80 hover:bg-red-700 py-3 rounded-xl font-bold transition-colors"
              >
                🔄 デバイス情報をリセット
              </button>
              <p className="text-xs text-slate-400 mt-2 text-center">
                ※ 登録情報を削除して最初からやり直します
              </p>
            </div>

            <button
              onClick={() => setShowSettings(false)}
              className="w-full bg-slate-700/80 hover:bg-slate-600 py-3 rounded-xl font-bold transition-colors"
            >
              閉じる
            </button>
          </div>
        </div>
      )}      {/* 写真ビューアー */}
      {showPhotoViewer && lastPhotoUrl && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col">
          <div className="flex-1 relative">
            <img
              src={lastPhotoUrl}
              alt="Photo"
              className="w-full h-full object-contain"
            />
            <button
              onClick={() => setShowPhotoViewer(false)}
              className="absolute top-4 right-4 bg-black/70 hover:bg-black p-3 rounded-full backdrop-blur"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
              {/* アップロード状況表示 */}
            {isUploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                <div className="bg-slate-800/90 rounded-2xl p-6 text-center">
                  <div className="animate-spin w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-3"></div>
                  <p className="text-lg font-bold">アップロード中...</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
