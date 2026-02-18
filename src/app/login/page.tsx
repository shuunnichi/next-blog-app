"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase-client";
import { useRouter } from "next/navigation";

const Page: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [loginError, setLoginError] = useState("");

  const router = useRouter();

  const updateEmailField = (value: string) => {
    setEmail(value);
    if (value.length > 0 && !value.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      setEmailError("メールアドレスの形式で入力してください。");
      return;
    }
    setEmailError("");
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setLoginError("");

    try {
      console.log("ログイン処理を実行します。");
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setLoginError(
          `ログインIDまたはパスワードが違います（${error.code}）。`
        );
        console.error(JSON.stringify(error, null, 2));
        return;
      }
      console.log("ログイン処理に成功しました。");
      router.replace("/mode-select");
    } catch (error) {
      setLoginError("ログイン処理中に予期せぬエラーが発生しました。");
      console.error(JSON.stringify(error, null, 2));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h1 className="text-4xl font-light tracking-wide">Silent Camera</h1>
          </div>
          <p className="text-white/60 font-light">管理者ログイン</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
          {loginError && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm font-light">
              {loginError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm text-white/60 mb-2 font-light flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                </svg>
                メールアドレス
              </label>
              <input
                type="email"
                id="email"
                name="email"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-white/20 transition-all duration-200 font-light placeholder:text-white/30"
                placeholder="example@email.com"
                value={email}
                onChange={(e) => updateEmailField(e.target.value)}
                required
              />
              {emailError && (
                <p className="mt-2 text-xs text-red-400 font-light">{emailError}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm text-white/60 mb-2 font-light flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                パスワード
              </label>
              <input
                type="password"
                id="password"
                name="password"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-white/20 transition-all duration-200 font-light placeholder:text-white/30"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              disabled={
                isSubmitting ||
                emailError !== "" ||
                email.length === 0 ||
                password.length === 0
              }
              className="w-full bg-white text-black hover:bg-white/90 disabled:bg-white/10 disabled:text-white/30 py-3 rounded-xl font-medium transition-all duration-200 active:scale-95 shadow-lg disabled:shadow-none disabled:cursor-not-allowed"
            >
              {isSubmitting ? "ログイン中..." : "ログイン"}
            </button>
          </form>
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
  );
};

export default Page;
