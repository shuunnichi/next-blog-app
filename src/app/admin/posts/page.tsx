"use client";
import { useState, useEffect } from "react";
import type { Post } from "@/app/_types/Post";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner, faCopy } from "@fortawesome/free-solid-svg-icons"; 
import { twMerge } from "tailwind-merge";
import Link from "next/link";
import { useRouter } from "next/navigation";

const Page: React.FC = () => {
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [fetchErrorMsg, setFetchErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const router = useRouter();

  const fetchPosts = async () => {
    try {
      setIsLoading(true);
      setFetchErrorMsg(null);
      const requestUrl = "/api/posts";
      const res = await fetch(requestUrl, {
        method: "GET",
        cache: "no-store",
      });
      if (!res.ok) {
        setPosts(null);
        throw new Error(`${res.status}: ${res.statusText}`);
      }
      const apiResBody = (await res.json()) as Post[];
      setPosts(apiResBody);
    } catch (error) {
      const errorMsg =
        error instanceof Error
          ? `投稿記事の一覧のフェッチに失敗しました: ${error.message}`
          : `予期せぬエラーが発生しました ${error}`;
      console.error(errorMsg);
      setFetchErrorMsg(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleDelete = async (
    postId: string,
    postTitle: string,
    e: React.MouseEvent<HTMLButtonElement>
  ) => {
    e.preventDefault();
    if (!window.confirm(`投稿記事「${postTitle}」を本当に削除しますか？`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const requestUrl = `/api/admin/posts/${postId}`;
      const res = await fetch(requestUrl, {
        method: "DELETE",
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error(`${res.status}: ${res.statusText}`);
      }
      fetchPosts();
    } catch (error) {
      const errorMsg =
        error instanceof Error
          ? `投稿記事のDELETEリクエストに失敗しました\n${error.message}`
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
      alert(`記事IDをコピーしました:\n${id}`);
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

  if (!posts) {
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
        <div className="text-2xl font-bold">投稿記事の一覧 (管理用)</div>
        <Link href={"/admin/posts/new"}>
          <div className="rounded-md bg-indigo-500 px-5 py-1 font-bold text-white hover:bg-indigo-600">
            新規投稿
          </div>
        </Link>
      </div>

      <div className="relative">
        {isDeleting && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
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
          <thead className="hidden bg-gray-50 text-xs uppercase text-gray-700 md:table-header-group">
            <tr>
              <th scope="col" className="px-6 py-3 min-w-[200px]">
                タイトル
              </th>
              <th scope="col" className="px-6 py-3 whitespace-nowrap">
                登録日時
              </th>
              <th scope="col" className="px-6 py-3 whitespace-nowrap">
                更新日時
              </th>
              <th scope="col" className="px-6 py-3 text-right">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="block md:table-row-group space-y-4 md:space-y-0">
            {posts.length === 0 ? (
              <tr className="block md:table-row">
                <td colSpan={4} className="block md:table-cell px-6 py-4 text-center">
                  投稿記事がありません。
                </td>
              </tr>
            ) : (
              posts.map((post) => (
                <tr 
                  key={post.id} 
                  className="flex flex-col md:table-row bg-white border border-gray-200 md:border-b md:border-gray-200 md:border-x-0 md:border-t-0 rounded-lg md:rounded-none shadow-sm md:shadow-none p-4 md:p-0"
                >
                  <td className="block md:table-cell px-0 md:px-6 py-1 md:py-4 font-bold text-gray-900 text-lg md:text-sm">
                    {post.title}
                  </td>
                  
                  <td className="block md:table-cell px-0 md:px-6 py-1 md:py-4 whitespace-nowrap text-xs md:text-sm">
                    <span className="md:hidden font-bold mr-2 text-gray-400">登録:</span>
                    {new Date(post.createdAt).toLocaleDateString("ja-JP")}
                  </td>

                  <td className="block md:table-cell px-0 md:px-6 py-1 md:py-4 whitespace-nowrap text-xs md:text-sm">
                    <span className="md:hidden font-bold mr-2 text-gray-400">更新:</span>
                    {post.updatedAt
                      ? new Date(post.updatedAt).toLocaleDateString("ja-JP")
                      : "-"}
                  </td>

                  <td className="block md:table-cell px-0 md:px-6 py-2 md:py-4 text-right border-t mt-2 md:mt-0 md:border-0 pt-3 md:pt-0">
                    <div className="flex justify-between md:justify-end items-center gap-4">

                      <button
                        type="button"
                        onClick={() => handleCopyId(post.id)}
                        className="text-gray-500 hover:text-gray-700 hover:underline text-sm"
                        title="IDをコピー"
                      >
                        <FontAwesomeIcon icon={faCopy} className="mr-1" />
                        CopyID
                      </button>

                      <div className="flex gap-4">
                        <Link
                          href={`/admin/posts/${post.id}`}
                          className="font-medium text-blue-600 hover:underline px-2 py-1"
                        >
                          編集
                        </Link>
                        
                        <button
                          onClick={(e) => handleDelete(post.id, post.title, e)}
                          className="font-medium text-red-600 hover:underline px-2 py-1"
                        >
                          削除
                        </button>
                      </div>
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