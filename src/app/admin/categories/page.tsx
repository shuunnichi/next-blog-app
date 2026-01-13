"use client";
import { useState, useEffect } from "react";
import type { Category } from "@/app/_types/Category";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner, faCopy } from "@fortawesome/free-solid-svg-icons";
import { twMerge } from "tailwind-merge";
import Link from "next/link";
import { useRouter } from "next/navigation";

const Page: React.FC = () => {
  const [categories, setCategories] = useState<Category[] | null>(null);
  const [fetchErrorMsg, setFetchErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const router = useRouter();

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      setFetchErrorMsg(null);

      const requestUrl = "/api/categories";
      const res = await fetch(requestUrl, {
        method: "GET",
        cache: "no-store",
      });

      if (!res.ok) {
        setCategories(null);
        throw new Error(`${res.status}: ${res.statusText}`);
      }

      const apiResBody = (await res.json()) as Category[];
      setCategories(apiResBody);
    } catch (error) {
      const errorMsg =
        error instanceof Error
          ? `カテゴリの一覧のフェッチに失敗しました: ${error.message}`
          : `予期せぬエラーが発生しました ${error}`;
      console.error(errorMsg);
      setFetchErrorMsg(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleDelete = async (
    categoryId: string,
    categoryName: string,
    e: React.MouseEvent<HTMLButtonElement>
  ) => {
    e.preventDefault();

    if (!window.confirm(`カテゴリ「${categoryName}」を本当に削除しますか？`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const requestUrl = `/api/admin/categories/${categoryId}`;
      const res = await fetch(requestUrl, {
        method: "DELETE",
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error(`${res.status}: ${res.statusText}`);
      }
      fetchCategories();
    } catch (error) {
      const errorMsg =
        error instanceof Error
          ? `カテゴリのDELETEリクエストに失敗しました\n${error.message}`
          : `予期せぬエラーが発生しました\n${error}`;
      console.error(errorMsg);
      window.alert(errorMsg);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCopyId = async (id: string) => {
    try {
      await navigator.clipboard.writeText(id);
      alert(`カテゴリIDをコピーしました:\n${id}`);
    } catch (error) {
      console.error("IDのコピーに失敗しました", error);
    }
  };

  if (isLoading) {
    return (
      <div className="text-gray-500">
        <FontAwesomeIcon icon={faSpinner} className="mr-1 animate-spin" />
        Loading...
      </div>
    );
  }

  if (fetchErrorMsg) {
    return <div className="text-red-500">{fetchErrorMsg}</div>;
  }

  if (!categories) {
    return (
      <div className="text-gray-500">
        <FontAwesomeIcon icon={faSpinner} className="mr-1 animate-spin" />
        Loading...
      </div>
    );
  }

  return (
    <main>
      <div className="mb-4 flex items-center justify-between">
        <div className="text-2xl font-bold">カテゴリの一覧 (管理用)</div>
        <Link href={"/admin/categories/new"}>
          <div className="rounded-md bg-indigo-500 px-5 py-1 font-bold text-white hover:bg-indigo-600">
            新規作成
          </div>
        </Link>
      </div>

      <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
        {isDeleting && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="flex items-center rounded-lg bg-white px-8 py-4 shadow-lg">
              <FontAwesomeIcon
                icon={faSpinner}
                className="mr-2 animate-spin text-gray-500"
              />
              <div className="flex items-center text-gray-500">処理中...</div>
            </div>
          </div>
        )}
        <table
          className={twMerge(
            "w-full text-left text-sm text-gray-500",
            isDeleting && "opacity-50"
          )}
        >
          <thead className="bg-gray-50 text-xs uppercase text-gray-700">
            <tr>
              <th scope="col" className="px-6 py-3 min-w-[200px]">
                カテゴリ名
              </th>
              <th scope="col" className="px-6 py-3 text-right">
                操作
              </th>
            </tr>
          </thead>
          <tbody>
            {categories.length === 0 ? (
              <tr>
                <td colSpan={2} className="px-6 py-4 text-center">
                  カテゴリがありません。
                </td>
              </tr>
            ) : (
              categories.map((category) => (
                <tr key={category.id} className="border-b bg-white hover:bg-gray-50">
                  <td className="px-6 py-4 font-bold text-gray-900">
                    {category.name}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end items-center gap-4">
                      <button
                        type="button"
                        onClick={() => handleCopyId(category.id)}
                        className="text-gray-500 hover:text-gray-700"
                        title="IDをコピー"
                      >
                        <FontAwesomeIcon icon={faCopy} className="mr-1" />
                        ID
                      </button>
                      <Link
                        href={`/admin/categories/${category.id}`}
                        className="font-medium text-blue-600 hover:underline"
                      >
                        編集
                      </Link>
                      <button
                        onClick={(e) => handleDelete(category.id, category.name, e)}
                        className="font-medium text-red-600 hover:underline"
                      >
                        削除
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
};

export default Page;