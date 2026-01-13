import type { Metadata } from "next";
import "./globals.css";

import "@fortawesome/fontawesome-svg-core/styles.css"; // ◀◀ 追加
import { config } from "@fortawesome/fontawesome-svg-core"; // ◀◀ 追加
config.autoAddCss = false; // ◀◀ 追加

import Header from "@/app/_components/Header"; // 追加

export const metadata: Metadata = {
  title: "NextBlogApp",
  description: "Built to learn Next.js and modern web development.",
};

type Props = {
  children: React.ReactNode;
};

const RootLayout: React.FC<Props> = (props) => {
  const { children } = props;
  return (
    <html lang="ja">
      <body>
        <Header />
        <div className="mx-4 mt-2 max-w-2xl md:mx-auto">{children}</div> {/* 変更 */}
      </body>
    </html>
  );
};

export default RootLayout;