import type { Category } from "./Category";

type PostCategory = {
  category: Category;
};

export type Post = {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  categories: PostCategory[];
  coverImageURL: string;
};
