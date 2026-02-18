import type { Metadata } from "next";
import "./globals.css";

import "@fortawesome/fontawesome-svg-core/styles.css";
import { config } from "@fortawesome/fontawesome-svg-core";
config.autoAddCss = false;

export const metadata: Metadata = {
  title: "Silent Camera - 無音監視カメラシステム",
  description: "Next.js + Supabase で構築されたリアルタイム遠隔カメラシステム",
};

type Props = {
  children: React.ReactNode;
};

const RootLayout: React.FC<Props> = (props) => {
  const { children } = props;
  return (
    <html lang="ja" suppressHydrationWarning>
      <body suppressHydrationWarning className="bg-black text-white">
        {children}
      </body>
    </html>
  );
};

export default RootLayout;