# 🔐 認証システムの更新（ハイブリッド方式）

## ✅ 実装内容

### 📋 認証ポリシー

#### 🔓 **認証不要（誰でもアクセス可能）**
- `/api/devices` GET/POST - デバイス管理
- `/api/photos` GET/POST - 写真表示・アップロード
- `/api/control/[deviceId]` GET/POST - 遠隔制御

**理由**: Agent/Commander画面はログインなしで使えるようにする

#### 🔒 **認証必須（ログインユーザーのみ）**
- `/api/photos/delete-all` DELETE - 全写真削除
- `/api/devices` DELETE - デバイス削除
- `/mode-select` - モード選択画面

**理由**: 削除操作は保護する必要がある

### 🎯 動作仕様

1. **未ログイン時**
   - userId = `"anonymous"`
   - すべてのユーザーが同じデータを共有
   - Agent/Commanderは普通に動作

2. **ログイン時**
   - userId = `user.id`（Supabase Auth）
   - ユーザーごとにデータが分離
   - 自分のデバイス・写真のみアクセス可能

### 📊 データ構造

```
Database:
├─ anonymous (未ログインユーザー)
│  ├─ device-xxx
│  └─ device-yyy
│
├─ user-abc123 (ログインユーザー1)
│  ├─ device-aaa
│  └─ device-bbb
│
└─ user-def456 (ログインユーザー2)
   ├─ device-ccc
   └─ device-ddd
```

### Storage:
```
photos/
├─ anonymous/
│  └─ device-xxx/
│     └─ photo1.jpg
│
├─ user-abc123/
│  └─ device-aaa/
│     └─ photo2.jpg
│
└─ user-def456/
   └─ device-ccc/
      └─ photo3.jpg
```

## 🚀 使用方法

### パターン1: ログインなしで使う（簡易モード）
1. 直接 `/agent` または `/commander` にアクセス
2. すべてのデータは `anonymous` として保存
3. 誰でも同じデータを見られる

### パターン2: ログインして使う（プライベートモード）
1. `/login` でログイン
2. `/mode-select` からAgent/Commander選択
3. 自分専用のデータとして保存・管理
4. 他のユーザーからは見えない

## 🔧 APIの変更点

```typescript
// Before（完全に認証必須）
const user = await getCurrentUser();
if (!user) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
const userId = user.id;

// After（認証はオプション）
const user = await getCurrentUser();
const userId = user?.id || "anonymous";
```

## ✅ メリット

1. **柔軟性**: ログインなしでも使える
2. **セキュリティ**: ログインすれば保護される
3. **UX**: 初めてのユーザーもすぐ使える
4. **プライバシー**: 必要な人だけログインして分離

## 🎉 完成！

これで**誰でも使える＋ログインしたら保護される**ハイブリッドシステムになりました！
