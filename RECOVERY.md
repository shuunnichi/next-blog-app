# 復旧手順

## 問題が発生したら

### 1. 最後の正常なコミットに戻す
```powershell
git reset --hard HEAD
git clean -fd
```

### 2. Prisma Client を再生成
```powershell
# 古いファイルを削除
Remove-Item -Path "src\generated" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path ".next" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "node_modules\.prisma" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "node_modules\@prisma\client" -Recurse -Force -ErrorAction SilentlyContinue

# Prisma Client を生成
npx prisma generate
```

### 3. 開発サーバーを再起動
```powershell
# すべての Node.js プロセスを停止
taskkill /F /IM node.exe /T

# サーバー起動
npm run dev
```

## 重要な設定ファイル

### prisma/schema.prisma
```prisma
generator client {
  provider = "prisma-client-js"  # ← これが正しい
  # output を指定しない（デフォルトの node_modules/@prisma/client を使用）
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")  # ← 必須
}
```

### src/lib/prisma.ts
```typescript
import { PrismaClient } from "@prisma/client";  # ← @/generated/prisma/client ではない

const globalForPrisma = global as unknown as {
  prisma: PrismaClient;
};

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
```

## トラブルシューティング

### `Module not found: @/generated/prisma/client`
- `src/lib/prisma.ts` が `@prisma/client` からインポートしているか確認
- `src/generated` フォルダを削除
- `.next` フォルダを削除
- `npx prisma generate` を実行

### Prisma のバージョン
- 現在使用中: **Prisma 5.22.0**
- Prisma 7.x にアップグレードすると `url` プロパティが使えなくなるため注意

### ファイルが正しく保存されない
- VS Code でファイルを保存（Ctrl+S）
- エディタ表示と実際のファイルが違う場合は VS Code を再起動
