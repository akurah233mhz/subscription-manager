# サブスク管理アプリ 実装仕様書

> Claude Codeへの引き継ぎ用。UIプロトタイプは `index.jsx` 参照。

---

## 1. プロジェクト概要

家族（本人・妻・子供）が共有して使うサブスクリプション管理Webアプリ。

| 項目 | 内容 |
|---|---|
| フロントエンド | React (Vite) + PWA対応 |
| バックエンド/DB | Notion Database |
| APIプロキシ | Cloudflare Workers（APIキー隠蔽） |
| ホスティング | GitHub Pages |
| リポジトリ | github.com/akurah233mhz/subscription-manager（新規作成） |
| 作業ルート | D:\claude-projects\subscription-manager |

---

## 2. アーキテクチャ

```
[ブラウザ / iPhone PWA]
        ↓ fetch
[Cloudflare Workers]   ← NOTION_API_KEY を環境変数で保持
        ↓ Notion API
[Notion Database]      ← 家族全員が同じDBを参照・編集
```

### なぜこの構成か
- Notion APIキーをフロントに露出させないためにWorkers経由にする
- Notionは既存アカウントがあるためコスト・運用ゼロ
- GitHub Pages + Cloudflare Workersはすべて無料枠で完結
- 将来Supabaseへ移行する場合もWorkers層を差し替えるだけでフロントは変更不要

---

## 3. Notionデータベース設計

### 3-1. メインDB：`subscriptions`

| プロパティ名 | Notionの型 | 備考 |
|---|---|---|
| name | Title | サービス名 |
| category | Select | エンタメ / 音楽 / 仕事・制作 / クラウド / ゲーム / 保険 / ショッピング / その他 |
| plan | Rich Text | プラン名（スタンダード、ファミリー等） |
| amount | Number | 金額（円） |
| cycle | Select | `monthly` / `yearly` |
| renewalDate | Date | 次回更新日 |
| url | URL | 公式サイト |
| cancelUrl | URL | 解約ページ |
| cancelMethod | Rich Text | 解約手順テキスト |
| notes | Rich Text | メモ |
| active | Checkbox | false = 論理削除（一覧非表示） |

### 3-2. 設定DB：`settings`

| プロパティ名 | Notionの型 | 備考 |
|---|---|---|
| key | Title | 設定キー名 |
| value | Rich Text | 設定値 |

初期レコード：

| key | value |
|---|---|
| `pin_hash` | SHA-256ハッシュ値（初期PIN: `1234`） |
| `require_pin_for_cancel` | `true` |

> PINは平文ではなくSHA-256ハッシュで保存する。フロント側でハッシュ化してから比較。

---

## 4. Cloudflare Workers API仕様

### エンドポイント一覧

| メソッド | パス | 説明 |
|---|---|---|
| GET | `/api/subscriptions` | 全サブスク取得（active=trueのみ） |
| POST | `/api/subscriptions` | 新規追加 |
| PATCH | `/api/subscriptions/:id` | 更新 |
| DELETE | `/api/subscriptions/:id` | 論理削除（active=false） |
| GET | `/api/settings` | 設定全取得 |
| PATCH | `/api/settings/:key` | 設定値更新（PIN変更等） |

### Workers環境変数

```
NOTION_API_KEY=secret_xxxxx
NOTION_SUBSCRIPTIONS_DB_ID=xxxxx
NOTION_SETTINGS_DB_ID=xxxxx
ALLOWED_ORIGIN=https://akurah233mhz.github.io
```

### CORSヘッダー

```
Access-Control-Allow-Origin: https://akurah233mhz.github.io
Access-Control-Allow-Methods: GET, POST, PATCH, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type
```

---

## 5. フロントエンド仕様

### 5-1. ディレクトリ構成

```
subscription-manager/
├── public/
│   ├── manifest.json       # PWA設定
│   └── icons/              # アプリアイコン
├── src/
│   ├── main.jsx
│   ├── App.jsx             # メインアプリ（index.jsxから改名）
│   ├── api.js              # Workers APIクライアント
│   ├── theme.js            # makeTheme()
│   ├── components/
│   │   ├── PinModal.jsx
│   │   ├── AdminPanel.jsx
│   │   ├── SubscriptionCard.jsx
│   │   └── SubscriptionForm.jsx
│   └── hooks/
│       └── useSubscriptions.js   # fetch + CRUD + ローカルキャッシュ
├── vite.config.js
└── package.json
```

### 5-2. データフロー

```
App起動
  → GET /api/subscriptions
  → stateに格納
  → カード一覧レンダリング

追加/編集
  → フォーム入力 → POST or PATCH /api/subscriptions
  → 成功後にstateを更新（再fetchしてもよい）

削除
  → DELETE /api/subscriptions/:id
  → stateから除去

PIN変更
  → 入力をSHA-256ハッシュ化
  → PATCH /api/settings/pin_hash
```

### 5-3. ローカルストレージ使用箇所

| キー | 内容 | 理由 |
|---|---|---|
| `theme` | `"dark"` / `"light"` | デバイスごとの表示設定 |

> PINはNotionのsettings DBで管理。localStorageには保存しない。

### 5-4. PWA設定（manifest.json）

```json
{
  "name": "サブスク管理",
  "short_name": "サブスク",
  "start_url": "/subscription-manager/",
  "display": "standalone",
  "background_color": "#0f1117",
  "theme_color": "#1a1d27",
  "icons": [
    { "src": "icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

---

## 6. UIコンポーネント仕様

プロトタイプ（`index.jsx`）をそのまま移植する。変更点のみ記載。

### 6-1. テーマ

`src/theme.js` に `makeTheme(dark: boolean)` をエクスポート。  
カラートークンは以下の通り（プロトタイプから抜粋）：

**ダークモード**
```js
bg: "#0f1117", surface: "#1a1d27", surfaceAlt: "#22263a",
border: "#2a2d3d", borderMid: "#333650",
text: "#e8eaf0", textSub: "#7a7f99", textMute: "#454860",
accent: "#5b6af0",
urgent: "#e53935", urgentBg: "#1a1010",
soon: "#e6a817",
cancelRedBg: "#2a1010", cancelRedBorder: "#8b2020", cancelRedText: "#ef9a9a",
headerBg: "#12151f"
```

**ライトモード**
```js
bg: "#f4f5f8", surface: "#ffffff", surfaceAlt: "#f0f1f6",
border: "#dde0ec", borderMid: "#c8cbdc",
text: "#1a1d2e", textSub: "#5a5f7a", textMute: "#a0a3b8",
accent: "#5b6af0",
urgent: "#d32f2f", urgentBg: "#fff5f5",
soon: "#c77700",
cancelRedBg: "#fff5f5", cancelRedBorder: "#e57373", cancelRedText: "#b71c1c",
headerBg: "#ffffff"
```

### 6-2. カード表示項目

```
[カテゴリバッジ] サービス名  プラン名（accent色）
                                    ¥X,XXX/月（or /年）
                                    月換算 ¥XXX（年契約の場合のみ）
● X日後に更新 · YYYY/MM/DD  [月契約|年契約バッジ]
```

タップで展開：
- メモ（あれば）
- 解約方法テキスト（グレーの枠内）
- ボタン行：`🌐 公式サイト` / `解約ページへ →`（赤） / `編集` / `削除`

### 6-3. 緊急度カラーロジック

| 条件 | カード枠色 | テキスト色 | ドット |
|---|---|---|---|
| 更新まで7日以内 | `urgent` | `urgent` | `●`（赤） |
| 更新まで30日以内 | `soon` | `soon` | `●`（黄） |
| それ以外 | `border` | `textSub` | `○` |

### 6-4. フィルタ・ソート

- カテゴリフィルタ：`["すべて","エンタメ","音楽","仕事・制作","クラウド","ゲーム","保険","ショッピング","その他"]`
- ソート：更新日（デフォルト）/ 金額（月換算降順）/ 名前（日本語順）
- テキスト検索：サービス名の前方一致

### 6-5. PINモーダル

- 4桁テンキーUI（ドット表示）
- 入力完了（4桁）で即判定（150msディレイ）
- 不一致：ドットを赤にしてリセット
- 用途1：解約ページへ進む前のゲート
- 用途2：管理設定を開く前のゲート

**PIN照合ロジック（フロント側）**

```js
async function hashPin(pin) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(pin));
  return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,"0")).join("");
}
// 照合：hashPin(入力) === Notionから取得したpin_hash
```

### 6-6. 管理パネル

⚙️ボタン → PINゲート → 管理パネル

管理パネルでできること：
- ダーク/ライトモード切替（トグルスイッチ）
- PIN変更（現在PIN確認 → 新PIN入力 → 確定）

---

## 7. 実装手順（Claude Codeへの指示順）

### Step 1: Notionセットアップ
1. Notionで `subscriptions` DBを作成（3-1の列定義通り）
2. Notionで `settings` DBを作成（3-2の列定義通り）
3. Notion Integration（APIキー）を作成し、両DBに接続
4. 各DBのIDをメモ

### Step 2: Cloudflare Workersセットアップ
1. `wrangler` CLIでWorkerプロジェクト作成
2. 環境変数をWorkerの secretsに設定
3. 各エンドポイント実装（4章参照）
4. デプロイ → URLをメモ（フロントの `VITE_API_BASE` に使う）

### Step 3: フロントエンド実装
1. `vite create` でReactプロジェクト作成
2. `index.jsx`（プロトタイプ）をコンポーネント分割して移植
3. `api.js` を実装しモックデータをAPI呼び出しに置き換え
4. PWA設定（manifest.json + vite-plugin-pwa）

### Step 4: GitHub Pagesデプロイ
1. `vite.config.js` に `base: '/subscription-manager/'` を設定
2. GitHub Actionsワークフロー追加（push → build → gh-pages）
3. リポジトリのPages設定をghpages branchに向ける

### Step 5: 動作確認
- PC・iPhoneブラウザで表示確認
- iPhoneで「ホーム画面に追加」してPWA動作確認
- Notionでデータ追加 → アプリに反映確認（家族共有テスト）

---

## 8. 今後の拡張候補（MVP後）

| 機能 | 概要 |
|---|---|
| 更新日通知 | Cloudflare Workers のCron Trigger + LINE Notify or メール |
| 支払い方法フィールド | カード番号末尾・口座情報の管理 |
| 契約者フィールド | 誰名義かの管理 |
| 解約済みアーカイブ | active=falseの一覧表示 |
| Supabase移行 | 本格権限管理が必要になった場合 |

---

## 9. 参考ファイル

| ファイル | 内容 |
|---|---|
| `index.jsx` | UIプロトタイプ（モックデータ版・完成UIそのまま） |
| `SPEC.md` | 本ドキュメント |
