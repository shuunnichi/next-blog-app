# GitHub Actions セットアップガイド

## 🎯 目的

GitHub Actionsを使用して、毎日自動的にAPIにアクセスし、Supabaseが7日間の非アクティブによって停止（Pause）されるのを防ぎます。

---

## ⚙️ セットアップ手順

### 1. GitHub Secretsの設定

1. **GitHubリポジトリにアクセス**
   - https://github.com/shuunnichi/next-blog-app

2. **Settings → Secrets and variables → Actions**
   - リポジトリページの「Settings」タブをクリック
   - 左サイドバーの「Secrets and variables」→「Actions」を選択

3. **New repository secret**
   - 「New repository secret」ボタンをクリック

4. **Secretを追加**
   - **Name**: `VERCEL_URL`
   - **Value**: `https://silent-camera.vercel.app` （または現在のVercel URL）
   - 「Add secret」をクリック

---

## 📅 実行スケジュール

### 自動実行
- **頻度**: 毎日1回
- **時刻**: 午前9時（JST） / 午前0時（UTC）
- **処理**: `GET /api/devices` エンドポイントにアクセス

### 手動実行
GitHub Actionsページから「Run workflow」で即座に実行可能

---

## ✅ 動作確認

### 1. 初回実行
セットアップ後、手動で実行して動作確認：

1. GitHubリポジトリの「Actions」タブを開く
2. 左サイドバーの「Keep Supabase Alive」を選択
3. 「Run workflow」→「Run workflow」をクリック
4. 実行結果を確認（緑色のチェックマーク ✅ が表示されればOK）

### 2. ログ確認
1. 実行されたWorkflowをクリック
2. 「ping」ジョブをクリック
3. ログに以下が表示されることを確認：
   ```
   Pinging API to prevent Supabase from pausing...
   HTTP Status: 200
   Ping completed successfully!
   ```

---

## 🔧 トラブルシューティング

### エラー: `curl: (6) Could not resolve host`
**原因**: `VERCEL_URL` が正しく設定されていない

**解決**:
1. GitHub Secrets の `VERCEL_URL` を確認
2. `https://` を含む完全なURLを設定
3. スペースや改行が含まれていないか確認

### エラー: `HTTP Status: 404`
**原因**: エンドポイントが存在しない

**解決**:
1. `/api/devices` エンドポイントが実装されているか確認
2. Vercelに正しくデプロイされているか確認

### エラー: `HTTP Status: 500`
**原因**: サーバーエラー

**解決**:
1. Vercelのログを確認
2. Supabaseの接続情報（環境変数）を確認
3. Prismaスキーマが正しくデプロイされているか確認

---

## 📊 効果

### メリット
✅ **Supabaseの自動停止を防止**
   - 7日間の非アクティブ期間をリセット
   - 常に即座にアクセス可能

✅ **コスト削減**
   - 無料プランの範囲内で運用
   - 追加料金なし

✅ **メンテナンスフリー**
   - 手動での再起動が不要
   - 完全自動化

### 注意点
⚠️ **GitHub Actionsの無料枠**
   - 月2,000分まで無料（パブリックリポジトリは無制限）
   - このワークフローは1回あたり約10秒 = 月300秒程度

⚠️ **Vercelの帯域幅**
   - 無料プランは月100GB
   - このアクセスは1回あたり数KB程度（影響なし）

---

## 🔄 カスタマイズ

### 実行頻度を変更
`.github/workflows/keep-supabase-alive.yml` の `cron` を編集：

```yaml
schedule:
  # 毎日2回（午前9時・午後9時）
  - cron: '0 0,12 * * *'
  
  # 12時間ごと
  - cron: '0 */12 * * *'
  
  # 週1回（月曜午前9時）
  - cron: '0 0 * * 1'
```

### アクセスするエンドポイントを変更
```yaml
- name: Ping API to keep Supabase active
  run: |
    # 別のエンドポイントにアクセス
    curl -X GET "${{ secrets.VERCEL_URL }}/api/photos?deviceId=healthcheck"
```

---

## 📝 参考リンク

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Cron Schedule Syntax](https://crontab.guru/)
- [Supabase Pricing](https://supabase.com/pricing)

---

**設定日**: 2026年2月19日  
**最終更新**: 2026年2月19日
