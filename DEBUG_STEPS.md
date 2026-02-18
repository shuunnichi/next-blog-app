# デバッグ手順

## 問題
1. Commander画面で写真が表示されない
2. Commander画面から撮影指令が機能しない

## デバッグログを追加した箇所
- `src/app/commander/page.tsx` - fetchPhotos, sendCaptureCommand
- `src/app/agent/page.tsx` - startPolling, capturePhoto
- `src/app/api/control/[deviceId]/route.ts` - POST
- `src/app/api/photos/route.ts` - GET

## 確認手順

### 1. Agent画面の準備
1. ブラウザで `http://localhost:3000/mode-select` を開く
2. "📱 Agent（撮影デバイス）"をクリック
3. デバイス名を入力して登録（例: "TestPhone"）
4. カメラの許可を与える
5. **ブラウザのコンソールを開く（F12キー）**
6. コンソールに以下のログが表示されるか確認：
   ```
   === Starting polling for device: xxx
   Polling: /api/control/xxx
   Polling response: 200
   Polling data: { deviceId: "xxx", shouldCapture: false }
   ```

### 2. Commander画面の準備
1. **別のブラウザタブ**で `http://localhost:3000/mode-select` を開く
2. "💻 Commander（管理画面）"をクリック
3. **ブラウザのコンソールを開く（F12キー）**
4. デバイス一覧が表示されるか確認
5. コンソールに以下のログが表示されるか確認：
   ```
   Fetching devices...
   Response status: 200
   Devices fetched: 1 [...]
   ```

### 3. 写真表示のテスト
1. Commander画面でデバイスを選択
2. コンソールに以下のログが表示されるか確認：
   ```
   === fetchPhotos START ===
   deviceId: xxx
   Request URL: /api/photos?deviceId=xxx
   Response status: 200
   Photos received: [...]
   Photos count: X
   === fetchPhotos END ===
   ```
3. **エラーがあればスクリーンショットを撮る**

### 4. 撮影指令のテスト
1. Commander画面で"📸 撮影指令"ボタンをクリック
2. Commanderのコンソールに以下のログが表示されるか確認：
   ```
   === sendCaptureCommand START ===
   Selected device: xxx
   Request URL: /api/control/xxx
   Response status: 200
   === sendCaptureCommand END ===
   Waiting 3 seconds before fetching photos...
   ```
3. Agentのコンソールに以下のログが表示されるか確認（2秒以内）：
   ```
   Polling data: { deviceId: "xxx", shouldCapture: true }
   📸 Capture command received!
   Sending photo with deviceId: xxx
   Resetting capture flag...
   ```
4. **エラーがあればスクリーンショットを撮る**

### 5. サーバーログの確認
開発サーバーのターミナルで以下のログを確認：
```
=== POST /api/control/[deviceId] ===
deviceId: xxx
userId: anonymous
shouldCapture: true
Device found: { ... }
Control updated: { ... }
=== POST /api/control/[deviceId] END ===

POST /api/photos 201 in XXms
```

## よくある問題

### 問題1: 写真が表示されない
- **原因**: デバイスIDの不一致、認証の問題
- **確認**: 
  - AgentとCommanderで同じdeviceIdを使っているか
  - GET /api/photos のレスポンスに写真データが含まれているか
  - 写真のURLが正しいか（Supabase Storage）

### 問題2: 撮影指令が届かない
- **原因**: ポーリングが動作していない、deviceIdの不一致
- **確認**:
  - Agentのコンソールで2秒ごとに"Polling:"が表示されているか
  - Commander→Agent間で同じdeviceIdを使っているか
  - POST /api/control でshouldCapture=trueが設定されているか

### 問題3: 撮影はできるが写真が見えない
- **原因**: fetchPhotosのタイミング、キャッシュ
- **対策**:
  - "🔄 更新"ボタンを手動でクリック
  - ブラウザのキャッシュをクリア
  - 自動更新を有効化

## 次のステップ
上記のログを確認して、どこでエラーが発生しているか特定してください。
