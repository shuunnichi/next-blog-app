"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSpinner,
  faCopy,
  faImage,
  faExternalLinkAlt,
  faArrowLeft,
} from "@fortawesome/free-solid-svg-icons";
import { twMerge } from "tailwind-merge";
import Link from "next/link";

// カテゴリをフェッチしたときのレスポンスのデータ型
type RawApiCategoryResponse = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

// 投稿記事をフェッチしたときのレスポンスのデータ型
type PostApiResponse = {
  id: string;
  title: string;
  content: string;
  coverImageURL: string;
  createdAt: string;
  updatedAt: string; // APIから返ってくると想定して追加
  categories: {
    category: {
      id: string;
      name: string;
    };
  }[];
};

// 投稿記事のカテゴリ選択用のデータ型
type SelectableCategory = {
  id: string;
  name: string;
  isSelect: boolean;
};

// 投稿記事の編集ページ
const Page: React.FC = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fetchErrorMsg, setFetchErrorMsg] = useState<string | null>(null);

  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newCoverImageURL, setNewCoverImageURL] = useState("");

  const { id } = useParams() as { id: string };
  const router = useRouter();

  // カテゴリ配列 (State)
  const [checkableCategories, setCheckableCategories] = useState<
    SelectableCategory[] | null
  >(null);

  // 編集前の投稿記事のデータ (State)
  const [rawApiPostResponse, setRawApiPostResponse] =
    useState<PostApiResponse | null>(null);

  // 投稿記事の取得
  useEffect(() => {
    const fetchPost = async () => {
      try {
        const requestUrl = `/api/posts/${id}`;
        const res = await fetch(requestUrl, {
          method: "GET",
          cache: "no-store",
        });
        if (!res.ok) {
          setRawApiPostResponse(null);
          throw new Error(`${res.status}: ${res.statusText}`);
        }
        const apiResBody = (await res.json()) as PostApiResponse;
        setRawApiPostResponse(apiResBody);
      } catch (error) {
        const errorMsg =
          error instanceof Error
            ? `投稿記事の取得に失敗しました: ${error.message}`
            : `予期せぬエラーが発生しました ${error}`;
        console.error(errorMsg);
        setFetchErrorMsg(errorMsg);
      }
    };

    fetchPost();
  }, [id]);

  // カテゴリの一覧の取得
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const requestUrl = "/api/categories";
        const res = await fetch(requestUrl, {
          method: "GET",
          cache: "no-store",
        });
        if (!res.ok) {
          setCheckableCategories(null);
          throw new Error(`${res.status}: ${res.statusText}`);
        }
        const apiResBody = (await res.json()) as RawApiCategoryResponse[];
        setCheckableCategories(
          apiResBody.map((body) => ({
            id: body.id,
            name: body.name,
            isSelect: false,
          }))
        );
      } catch (error) {
        const errorMsg =
          error instanceof Error
            ? `カテゴリの一覧のフェッチに失敗しました: ${error.message}`
            : `予期せぬエラーが発生しました ${error}`;
        console.error(errorMsg);
        setFetchErrorMsg(errorMsg);
      }
    };
    fetchCategories();
  }, []);

  // 投稿記事のデータが取得できたらカテゴリの選択状態を更新する
  useEffect(() => {
    if (isInitialized) return;
    if (!rawApiPostResponse || !checkableCategories) return;

    setNewTitle(rawApiPostResponse.title);
    setNewContent(rawApiPostResponse.content);
    setNewCoverImageURL(rawApiPostResponse.coverImageURL);

    const selectedIds = new Set(
      rawApiPostResponse.categories.map((c) => c.category.id)
    );
    setCheckableCategories(
      checkableCategories.map((category) => ({
        ...category,
        isSelect: selectedIds.has(category.id),
      }))
    );
    setIsInitialized(true);
  }, [isInitialized, rawApiPostResponse, checkableCategories]);

  const switchCategoryState = (categoryId: string) => {
    if (!checkableCategories) return;
    setCheckableCategories(
      checkableCategories.map((category) =>
        category.id === categoryId
          ? { ...category, isSelect: !category.isSelect }
          : category
      )
    );
  };

  const updateNewTitle = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewTitle(e.target.value);
  };

  const updateNewContent = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewContent(e.target.value);
  };

  const updateNewCoverImageURL = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewCoverImageURL(e.target.value);
  };

  const handleCopyId = async () => {
    try {
      await navigator.clipboard.writeText(id);
      alert(`記事IDをコピーしました:\n${id}`);
    } catch (error) {
      console.error(error);
    }
  };

  // フォームの送信処理
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const requestBody = {
        title: newTitle,
        content: newContent,
        coverImageURL: newCoverImageURL,
        categoryIds: checkableCategories
          ? checkableCategories.filter((c) => c.isSelect).map((c) => c.id)
          : [],
      };
      const requestUrl = `/api/admin/posts/${id}`;
      const res = await fetch(requestUrl, {
        method: "PUT",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!res.ok) {
        throw new Error(`${res.status}: ${res.statusText}`);
      }

      router.push("/");
    } catch (error) {
      const errorMsg =
        error instanceof Error
          ? `投稿記事のPUTリクエストに失敗しました\n${error.message}`
          : `予期せぬエラーが発生しました\n${error}`;
      console.error(errorMsg);
      window.alert(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("本当にこの投稿記事を削除しますか？")) {
      return;
    }

    setIsSubmitting(true);

    try {
      const requestUrl = `/api/admin/posts/${id}`;
      const res = await fetch(requestUrl, {
        method: "DELETE",
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error(`${res.status}: ${res.statusText}`);
      }

      router.push("/");
    } catch (error) {
      const errorMsg =
        error instanceof Error
          ? `投稿記事の削除に失敗しました\n${error.message}`
          : `予期せぬエラーが発生しました\n${error}`;
      console.error(errorMsg);
      window.alert(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (fetchErrorMsg) {
    return <div className="text-red-500">{fetchErrorMsg}</div>;
  }

  if (!isInitialized) {
    return (
      <div className="text-gray-500">
        <FontAwesomeIcon icon={faSpinner} className="mr-1 animate-spin" />
        Loading...
      </div>
    );
  }

  return (
    <main>
      {/* 一覧に戻るリンク */}
      <div className="mb-4">
        <Link
          href="/admin/posts"
          className="text-sm text-gray-500 hover:text-gray-900 hover:underline"
        >
          <FontAwesomeIcon icon={faArrowLeft} className="mr-1" />
          記事一覧に戻る
        </Link>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <div className="text-2xl font-bold">投稿記事の編集・削除</div>
        {/* 実際の記事ページを確認 */}
        <a
          href={`/posts/${id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center rounded-md bg-gray-100 px-3 py-1 text-sm font-bold text-gray-600 hover:bg-gray-200"
        >
          <FontAwesomeIcon icon={faExternalLinkAlt} className="mr-2" />
          公開ページを確認
        </a>
      </div>

      {/* ID・日時の表示 */}
      {rawApiPostResponse && (
        <div className="mb-6 rounded-lg bg-gray-50 p-4 text-sm text-gray-600 shadow-sm">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <div className="mb-1 text-xs font-bold text-gray-400">
                記事ID
              </div>
              <div className="flex items-center font-mono">
                {id}
                <button
                  type="button"
                  onClick={handleCopyId}
                  className="ml-2 text-gray-400 hover:text-indigo-600"
                  title="IDをコピー"
                >
                  <FontAwesomeIcon icon={faCopy} />
                </button>
              </div>
            </div>
            <div>
              <div className="mb-1 text-xs font-bold text-gray-400">
                登録 / 更新日時
              </div>
              <div>
                登録:{" "}
                {new Date(rawApiPostResponse.createdAt).toLocaleDateString(
                  "ja-JP"
                )}
              </div>
              <div>
                更新:{" "}
                {rawApiPostResponse.updatedAt
                  ? new Date(rawApiPostResponse.updatedAt).toLocaleDateString(
                      "ja-JP"
                    )
                  : "-"}
              </div>
            </div>
          </div>
        </div>
      )}

      {isSubmitting && (
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

      <form
        onSubmit={handleSubmit}
        className={twMerge("space-y-4", isSubmitting && "opacity-50")}
      >
        <div className="space-y-1">
          <label htmlFor="title" className="block font-bold">
            タイトル
          </label>
          <input
            type="text"
            id="title"
            name="title"
            className="w-full rounded-md border-2 px-2 py-1"
            value={newTitle}
            onChange={updateNewTitle}
            placeholder="タイトルを記入してください"
            required
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="content" className="block font-bold">
            本文
          </label>
          <textarea
            id="content"
            name="content"
            className="h-48 w-full rounded-md border-2 px-2 py-1"
            value={newContent}
            onChange={updateNewContent}
            placeholder="本文を記入してください"
            required
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="coverImageURL" className="block font-bold">
            カバーイメージ (URL)
          </label>
          <input
            type="url"
            id="coverImageURL"
            name="coverImageURL"
            className="w-full rounded-md border-2 px-2 py-1"
            value={newCoverImageURL}
            onChange={updateNewCoverImageURL}
            placeholder="カバーイメージのURLを記入してください"
            required
          />
          
          {/* 画像のプレビュー表示 */}
          {newCoverImageURL && (
            <div className="mt-2 rounded-md border border-gray-300 bg-gray-50 p-2">
              <div className="mb-1 text-xs text-gray-500">プレビュー:</div>
              <img
                src={newCoverImageURL}
                alt="Preview"
                className="h-auto max-h-64 max-w-full rounded object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "https://placehold.jp/30/dddddd/888888/400x300.png?text=No%20Image";
                }}
              />
            </div>
          )}
        </div>

        <div className="space-y-1">
          <div className="font-bold">タグ</div>
          <div className="flex flex-wrap gap-x-3.5">
            {checkableCategories!.length > 0 ? (
              checkableCategories!.map((c) => (
                <label key={c.id} className="flex space-x-1 cursor-pointer hover:bg-gray-100 p-1 rounded">
                  <input
                    id={c.id}
                    type="checkbox"
                    checked={c.isSelect}
                    className="mt-0.5 cursor-pointer"
                    onChange={() => switchCategoryState(c.id)}
                  />
                  <span className="cursor-pointer">{c.name}</span>
                </label>
              ))
            ) : (
              <div>選択可能なカテゴリが存在しません。</div>
            )}
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-4 border-t">
          <button
            type="submit"
            className={twMerge(
              "rounded-md px-5 py-2 font-bold",
              "bg-indigo-500 text-white hover:bg-indigo-600",
              "disabled:cursor-not-allowed",
            )}
            disabled={isSubmitting}
          >
            記事を更新
          </button>

          <button
            type="button"
            className={twMerge(
              "rounded-md px-5 py-2 font-bold",
              "bg-red-500 text-white hover:bg-red-600",
            )}
            onClick={handleDelete}
            disabled={isSubmitting}
          >
            削除
          </button>
        </div>
      </form>
    </main>
  );
};

export default Page;