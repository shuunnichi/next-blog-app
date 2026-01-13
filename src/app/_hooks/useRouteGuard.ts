"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/app/_hooks/useAuth"; // ◀ 追加

export const useRouteGuard = () => {
  const router = useRouter();
  const { isLoading, session } = useAuth();

  useEffect(() => {
    // 認証状況の確認中は何もせずに戻る
    if (isLoading) {
      return;
    }
    // 認証確認後、未認証であればログインページにリダイレクト
    if (session === null) {
      router.replace("/login");
    }
  }, [isLoading, router, session]);

  // 認証済みが確認できるまでは何も表示しない
  if (!session) {
    return false; // 表示しないことを示す
  }
  return true; // 表示してもよいことを示す
};