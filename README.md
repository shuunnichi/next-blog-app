# 🔇 SilentEye - 無音監視カメラシステム

Next.js + Supabase で構築されたリアルタイム遠隔カメラシステム

## 概要

SilentEye は、スマートフォンを無音カメラとして遠隔操作できるシステムです。
- **Agent モード**: スマホ側で動作し、遠隔指示を受けて撮影
- **Commander モード**: PC側で動作し、デバイスを選択して撮影指令を送信

## 技術スタック

- **Frontend**: Next.js 15 (App Router)
- **Database**: Supabase PostgreSQL
- **Storage**: Supabase Storage
- **ORM**: Prisma 5.22.0
- **Styling**: Tailwind CSS

## Getting Started

まず、開発サーバーを起動します:

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開きます。

## 主要機能

- 📱 **Agent**: カメラ撮影、デバイス登録、設定管理
- 💻 **Commander**: デバイス選択、撮影指令、写真ギャラリー
- 🔄 **リアルタイム通信**: 2秒ごとのポーリングで即座に反映
- 💾 **永続化**: localStorage でデバイス情報を保存
- 🗑️ **管理機能**: 全写真削除、空デバイス削除

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
