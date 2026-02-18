# Vercel デプロイガイド - SilentEye Camera System

## 📦 デプロイ手順

### 1. Vercel にログイン
https://vercel.com にアクセスしてログイン

### 2. プロジェクトをインポート
1. **New Project** をクリック
2. GitHubリポジトリ `shuunnichi/next-blog-app` を選択
3. **Import** をクリック

### 3. 環境変数を設定

以下の環境変数を **Environment Variables** セクションに追加してください：

#### データベース（Supabase PostgreSQL）
```
DATABASE_URL=postgresql://postgres.xaaecdjlembdxvwfdofq:8oqfTPp62eOrsafQ@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1

DIRECT_URL=postgresql://postgres.xaaecdjlembdxvwfdofq:8oqfTPp62eOrsafQ@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres
```

#### Supabase認証 & ストレージ
```
NEXT_PUBLIC_SUPABASE_URL=https://xaaecdjlembdxvwfdofq.supabase.co

NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhhYWVjZGpsZW1iZHh2d2Zkb2ZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3OTQxMzEsImV4cCI6MjA4MzM3MDEzMX0.oT8-JNRu4jvvXhjfCA7u9UeI_Ec1gb0yEK3Km9A8ZmE

SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhhYWVjZGpsZW1iZHh2d2Zkb2ZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3OTQxMzEsImV4cCI6MjA4MzM3MDEzMX0.oT8-JNRu4jvvXhjfCA7u9UeI_Ec1gb0yEK3Km9A8ZmE
```

### 4. ビルド設定（デフォルトでOK）
- **Framework Preset**: Next.js
- **Build Command**: `prisma generate && next build --turbopack`（自動設定済み）
- **Output Directory**: `.next`（自動設定済み）
- **Install Command**: `npm install`（自動設定済み）

### 5. デプロイ
**Deploy** ボタンをクリック

---

## 🚀 デプロイ後の確認

### アクセスURL
デプロイが完了すると、以下のようなURLが発行されます：
- `https://your-project-name.vercel.app`

### 動作確認
1. **モード選択**: `https://your-app.vercel.app/mode-select`
2. **Agent画面**: `https://your-app.vercel.app/agent`
3. **Commander画面**: `https://your-app.vercel.app/commander`

---

## 📱 スマホでの使い方

### Agent側（撮影デバイス）
1. スマホで `https://your-app.vercel.app/mode-select` にアクセス
2. **Agent（撮影側）** を選択
3. デバイス名を入力して登録
4. カメラ許可を承認
5. 待機状態になる（撮影指令を待つ）

### Commander側（指令デバイス）
1. PCまたはタブレットで `https://your-app.vercel.app/mode-select` にアクセス
2. **Commander（指令側）** を選択
3. デバイス一覧からAgent側のデバイスを選択
4. **📸 撮影指令** ボタンをクリック
5. 3秒後にAgentが撮影した写真が表示される

---

## ⚙️ Vercel設定のヒント

### カスタムドメイン（オプション）
1. Vercelダッシュボードで **Settings** → **Domains**
2. カスタムドメインを追加

### 自動デプロイ
- `main` ブランチへのプッシュで自動デプロイ
- プルリクエストごとにプレビューURL生成

### ログ確認
- デプロイエラー時は **Deployment Logs** を確認
- ランタイムエラーは **Functions** → **Logs** を確認

---

## 🔧 トラブルシューティング

### ビルドエラー
- Prisma生成エラー: `DATABASE_URL` が正しく設定されているか確認
- TypeScriptエラー: ローカルで `npm run build` を実行して確認

### データベース接続エラー
- Supabaseのコネクションプーリング設定を確認
- `connection_limit=1` が設定されているか確認

### カメラ許可エラー（本番環境）
- HTTPSが必須（VercelはデフォルトでHTTPS）
- ブラウザのカメラ許可設定を確認
- 詳細は `CAMERA_PERMISSION_GUIDE.md` を参照

---

## 📚 関連ドキュメント
- [CAMERA_PERMISSION_GUIDE.md](./CAMERA_PERMISSION_GUIDE.md) - カメラ許可設定ガイド
- [DEBUG_STEPS.md](./DEBUG_STEPS.md) - デバッグ手順
- [AUTH_IMPLEMENTATION.md](./AUTH_IMPLEMENTATION.md) - 認証実装ガイド
- [HYBRID_AUTH.md](./HYBRID_AUTH.md) - ハイブリッド認証設計

---

## 🎉 完了！
デプロイが成功したら、スマホとPCで動作確認してみてください！
