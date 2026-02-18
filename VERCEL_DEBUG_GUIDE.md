# Vercel本番環境デバッグガイド

## 🔍 遠隔撮影が動かない時の確認手順

### 1. **ブラウザのコンソールを開く**

#### スマホ（Agent側）
- **iPhone Safari**: 
  1. PCでSafariを開く → **開発** → **<デバイス名>** → **<ページ>**
  2. または、Safariの**設定** → **詳細** → **Webインスペクタ** をON
  
- **Android Chrome**:
  1. PCでChromeを開く → `chrome://inspect`
  2. スマホのChromeで対象ページを開く → PCで **inspect** をクリック

- **簡易確認（スマホのみ）**:
  - [Eruda](https://github.com/liriliri/eruda)を使う（開発者向けコンソール）
  - または、`alert()`でログを表示

#### PC（Commander側）
- **F12** を押してDevToolsを開く → **Console** タブ

---

### 2. **チェックポイント：Agent側（撮影デバイス）**

#### ✅ デバイス登録確認
```
Console に表示されるべきログ:
- "Starting polling useEffect for deviceId: xxxxx"
- "=== Starting polling for device: xxxxx"
```

**表示されない場合**:
- デバイスIDが正しく設定されているか確認
- 設定（⚙️）→ デバイスIDをコピー → Commanderで同じIDが表示されるか

#### ✅ ポーリング動作確認
```
Console に2秒ごとに表示されるべきログ:
- "Polling: /api/control/xxxxx"
- "Polling response: 200"
- "Polling data: { shouldCapture: false }"
```

**表示されない場合**:
1. **ポーリングがOFFになっている**
   - 設定（⚙️）→「遠隔撮影を有効にする」がONか確認
   
2. **ネットワークエラー**
   - `Polling failed: 404` → デバイスIDが間違っている
   - `Polling failed: 500` → サーバーエラー（後述）

#### ✅ 撮影指令受信確認
```
Console に表示されるべきログ（Commander側で撮影指令を送った時）:
- "📸 Capture command received!"
- "Polling data: { shouldCapture: true }"
- "Sending photo with deviceId: xxxxx"
```

**表示されない場合**:
- Commander側で撮影指令が送信されているか確認（次のセクション）

---

### 3. **チェックポイント：Commander側（指令デバイス）**

#### ✅ 撮影指令送信確認
```
Console に表示されるべきログ（撮影指令ボタンを押した時）:
- "=== sendCaptureCommand START ==="
- "Selected device: xxxxx"
- "Request URL: /api/control/xxxxx"
- "Response status: 200"
- "Capture command result: { deviceId: 'xxxxx', shouldCapture: true }"
```

**エラーが出る場合**:
- `Response status: 404` → デバイスが見つからない（IDを確認）
- `Response status: 500` → サーバーエラー（Vercelログを確認）

#### ✅ 写真取得確認
```
Console に表示されるべきログ（撮影後3秒後）:
- "Now fetching photos after capture..."
- "=== fetchPhotos START ==="
- "Request URL: /api/photos?deviceId=xxxxx"
- "Photos received: [...]"
- "Photos count: 1"
```

**写真が表示されない場合**:
- `Photos count: 0` → Agent側でアップロードが失敗している
- Agent側のコンソールで「アップロードエラー」を確認

---

### 4. **Vercelログの確認方法**

#### サーバーサイドのエラーを確認
1. **Vercelダッシュボード** → **プロジェクト** → **Logs** タブ
2. **Functions** → 最新のログを確認

**よくあるエラー**:
```
[Error] Database connection failed
→ DATABASE_URLまたはDIRECT_URLが間違っている

[Error] Prisma Client not generated
→ ビルド時に `prisma generate` が実行されていない
→ package.jsonの`build`スクリプト確認

[Error] CORS error
→ 問題なし（ブラウザ間通信ではないので発生しない）
```

---

### 5. **ネットワークタブでAPIリクエスト確認**

#### Agent側
**DevTools** → **Network** タブ → フィルター: **Fetch/XHR**

確認すべきリクエスト:
```
1. GET /api/control/<deviceId> (2秒ごと)
   - Status: 200
   - Response: { "deviceId": "...", "shouldCapture": false }

2. POST /api/photos (撮影時)
   - Status: 201
   - Response: { "id": "...", "url": "https://..." }
```

#### Commander側
```
1. POST /api/control/<deviceId> (撮影指令時)
   - Status: 200
   - Request Body: { "shouldCapture": true }

2. GET /api/photos?deviceId=<deviceId> (3秒後)
   - Status: 200
   - Response: [{ "id": "...", "url": "..." }]
```

---

### 6. **環境変数の確認**

Vercelで以下の環境変数が設定されているか確認：

```
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

**確認方法**:
1. Vercelダッシュボード → **Settings** → **Environment Variables**
2. 各変数が**Production**環境に設定されているか確認

---

### 7. **トラブルシューティングチャート**

#### 問題: 撮影指令を送っても何も起こらない

```
Commander側コンソール確認
├─ "sendCaptureCommand START" が表示される？
│  ├─ YES → "Response status: 200" が表示される？
│  │  ├─ YES → Agent側のポーリングを確認（次へ）
│  │  └─ NO → Vercelログでサーバーエラーを確認
│  └─ NO → ボタンのクリックイベントが動いていない（ブラウザ更新）

Agent側コンソール確認
├─ "Polling: /api/control/..." が2秒ごとに表示される？
│  ├─ YES → "shouldCapture: true" が表示される？
│  │  ├─ YES → "Capture command received!" が表示される？
│  │  │  ├─ YES → "Uploading photo with deviceId" が表示される？
│  │  │  │  ├─ YES → アップロード成功 → Commander側の写真取得を確認
│  │  │  │  └─ NO → カメラエラーまたはアップロードエラー
│  │  │  └─ NO → capturePhoto関数が呼ばれていない（バグ）
│  │  └─ NO → Commander側の指令が届いていない（デバイスID不一致）
│  └─ NO → ポーリングが停止している（設定でOFFまたはエラー）
```

---

### 8. **よくある原因と解決策**

#### ❌ Agent側でポーリングが動かない
**原因**: 設定でポーリングがOFFになっている
**解決**: 設定（⚙️）→「遠隔撮影を有効にする」をON

#### ❌ デバイスIDが一致しない
**原因**: 複数デバイスで同じ名前を登録している
**解決**: 
1. Agent側の設定でデバイスIDを確認
2. Commander側でそのIDのデバイスを選択

#### ❌ 写真がアップロードされない
**原因**: Supabase Storageの権限設定
**解決**:
1. Supabaseダッシュボード → **Storage** → **photos** バケット
2. **Policies** → 以下のポリシーがあるか確認:
   ```sql
   -- SELECT policy (public read)
   bucket_id = 'photos'
   
   -- INSERT policy (public upload)
   bucket_id = 'photos'
   ```

#### ❌ 本番環境でのみカメラが動かない
**原因**: HTTPSが必要
**解決**: VercelはデフォルトでHTTPSなので問題なし（ブラウザのカメラ許可を確認）

---

### 9. **デバッグ用テストコマンド**

#### Commanderから手動でAPI呼び出し
ブラウザのコンソールで実行:

```javascript
// 撮影指令を送る
fetch('/api/control/YOUR_DEVICE_ID', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ shouldCapture: true })
}).then(r => r.json()).then(console.log)

// 写真一覧を取得
fetch('/api/photos?deviceId=YOUR_DEVICE_ID')
  .then(r => r.json()).then(console.log)

// デバイス一覧を取得
fetch('/api/devices')
  .then(r => r.json()).then(console.log)
```

---

### 10. **最終手段: 詳細ログモード**

本番環境でも詳細ログを確認したい場合、Vercelの**Runtime Logs**を使用:

1. Vercelダッシュボード → **Logs** → **Functions**
2. リアルタイムでサーバーログが表示される
3. `console.log()` の内容が全て見れる

---

## 📊 正常動作時のログ例

### Agent側（撮影デバイス）
```
✅ Starting polling useEffect for deviceId: abc123
✅ === Starting polling for device: abc123
✅ Polling: /api/control/abc123
✅ Polling response: 200
✅ Polling data: { deviceId: 'abc123', shouldCapture: false }
（2秒ごとに繰り返し）

📸 Polling data: { deviceId: 'abc123', shouldCapture: true }
📸 Capture command received!
📸 Uploading photo with deviceId: abc123
✅ アップロード完了
```

### Commander側（指令デバイス）
```
📸 === sendCaptureCommand START ===
📸 Selected device: abc123
📸 Request URL: /api/control/abc123
✅ Response status: 200
✅ Capture command result: { deviceId: 'abc123', shouldCapture: true }

⏳ Waiting 3 seconds before fetching photos...
📷 Now fetching photos after capture...
📷 === fetchPhotos START ===
📷 Photos received: [{ id: '...', url: 'https://...' }]
📷 Photos count: 1
```

---

## 🎉 まとめ

遠隔撮影が動かない時は、この順番で確認：

1. **Agent側**: ポーリングログが2秒ごとに出ているか
2. **Commander側**: 撮影指令のレスポンスが200か
3. **Agent側**: `shouldCapture: true` を受信しているか
4. **Agent側**: アップロードが成功しているか
5. **Vercel**: サーバーエラーが出ていないか

それでも解決しない場合は、上記のログを全てコピーして報告してください！
