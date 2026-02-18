"use client";

import { useRouter } from "next/navigation";

export default function ModeSelectPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* ヘッダー */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-light mb-4 tracking-wide">
            Silent Camera
          </h1>
          <p className="text-white/60 text-lg font-light">
            モードを選択してください
          </p>
        </div>

        {/* モード選択カード */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Agent Mode */}
          <button
            onClick={() => router.push("/agent")}
            className="group bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-2xl p-8 transition-all duration-300 text-left backdrop-blur-sm"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-xl bg-white/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-2xl font-light">Agent Mode</h2>
            </div>
            <p className="text-white/60 font-light leading-relaxed">
              このデバイスをエージェントとして登録し、遠隔撮影指令を受信します。カメラが使用可能な端末で使用してください。
            </p>
          </button>

          {/* Commander Mode */}
          <button
            onClick={() => router.push("/commander")}
            className="group bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-2xl p-8 transition-all duration-300 text-left backdrop-blur-sm"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-xl bg-white/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-2xl font-light">Commander Mode</h2>
            </div>
            <p className="text-white/60 font-light leading-relaxed">
              登録済みのエージェントに撮影指令を送信し、撮影された写真を確認します。管理用の端末で使用してください。
            </p>
          </button>
        </div>

        {/* フッター情報 */}
        <div className="text-center mt-12 text-white/40 text-sm font-light">
          <p>各モードの特徴を確認してから選択してください</p>
        </div>
      </div>
    </div>
  );
}
