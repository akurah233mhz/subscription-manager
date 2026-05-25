# セットアップ手順（手動作業）

Workersコードは書いた。残りは Notion と Cloudflare の手動セットアップ。

---

## Step 1: Notion DB を2つ作る

### 1-1. `subscriptions` DB

Notionで新規ページ→「データベース - フルページ」を選択、名前を `subscriptions` にして以下のプロパティを設定:

| プロパティ名         | 型        | オプション                                              |
| -------------- | -------- | -------------------------------------------------- |
| `name`         | Title    | （デフォルトの "Name" をリネーム）                              |
| `category`     | Select   | エンタメ / 音楽 / 仕事・制作 / クラウド / ゲーム / 保険 / ショッピング / その他 |
| `plan`         | Text     |                                                    |
| `amount`       | Number   | 実際の請求額                                             |
| `currency`     | Select   | `JPY` / `USD` / `EUR` / `GBP`                    |
| `amountJpy`    | Number   | 家計集計用の円換算額                                         |
| `cycle`        | Select   | `monthly` / `yearly`                               |
| `renewalDate`  | Date     |                                                    |
| `url`          | URL      |                                                    |
| `cancelUrl`    | URL      |                                                    |
| `cancelMethod` | Text     |                                                    |
| `notes`        | Text     |                                                    |
| `active`       | Checkbox | デフォルト ON                                           |

> プロパティ名は **大文字小文字含めて完全一致** が必要（Workersコードがこの名前で参照する）

カテゴリの追加・変更は、Notion側の `category` Select options を更新する。アプリはWorkersの `/api/meta` 経由でSelect optionsを取得するため、通常はコード変更不要。

外貨契約は `amount` に実際の請求額、`currency` に通貨、`amountJpy` に家計用の円換算額を入れる。JPY契約はアプリ保存時に `amountJpy` へ同額が入る。

### 1-2. `settings` DB

同じく新規データベース、名前 `settings`:

| プロパティ名 | 型 |
|---|---|
| `key` | Title |
| `value` | Text |

初期レコードを2つ追加:

| key                      | value                                                                                    |
| ------------------------ | ---------------------------------------------------------------------------------------- |
| `pin_hash`               | `03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4` *(SHA-256 of "1234")* |
| `require_pin_for_cancel` | `true`                                                                                   |
|                          |                                                                                          |

---

## Step 2: Notion Integration を作る

1. https://www.notion.so/profile/integrations → 「新しいインテグレーション」
2. 名前: `subscription-manager`、関連ワークスペース選択、タイプ: Internal
3. 作成 → **Internal Integration Secret** をコピー（`ntn_...` または `secret_...`）→ これが `NOTION_API_KEY`
4. `subscriptions` DBを開く → 右上「…」→ 「接続」→ 作成したIntegrationを選択
5. `settings` DBも同様に接続

### DB IDの取得方法

Notion DBをブラウザで開いて URL を見る:
```
https://www.notion.so/{workspace}/{DB_ID}?v=...
                                 ^^^^^^^ ここの32文字hex
```
ハイフン無しの32文字。`subscriptions` と `settings` 両方メモる。

---

## Step 3: Cloudflare Workers セットアップ

```powershell
cd D:\claude-projects\home\subscription-manager\workers
npm install
npx wrangler login   # ブラウザでCloudflareにログイン
```

### Secrets を投入

> ⚠️ `wrangler secret put` の引数は **シークレットの「名前」** であって値ではない。
> 値はコマンド実行後の `Enter a secret value:` プロンプトで貼り付ける。
> 下の3行は **そのままコピペ**（`NOTION_API_KEY` などは固定名で、変えてはいけない）。

```powershell
npx wrangler secret put NOTION_API_KEY
# → プロンプトに Notion APIキー（ntn_... または secret_...）を貼り付けてEnter

npx wrangler secret put NOTION_SUBSCRIPTIONS_DB_ID
# → プロンプトに subscriptions DB の 32文字hex を貼り付けてEnter

npx wrangler secret put NOTION_SETTINGS_DB_ID
# → プロンプトに settings DB の 32文字hex を貼り付けてEnter
```

投入済みの確認:

```powershell
npx wrangler secret list
# NOTION_API_KEY / NOTION_SUBSCRIPTIONS_DB_ID / NOTION_SETTINGS_DB_ID の3つが出ればOK
```

もし誤った名前で登録してしまった場合は削除:

```powershell
npx wrangler secret delete <間違えた名前>
```

### ローカル動作確認（任意）

```powershell
copy .dev.vars.example .dev.vars
# .dev.vars を編集して実値を入れる

npm run dev
# 別ターミナルで:
curl http://127.0.0.1:8787/api/subscriptions
curl http://127.0.0.1:8787/api/settings
```

### デプロイ

```powershell
npm run deploy
```

成功すると `https://subscription-manager-api.{your-subdomain}.workers.dev` のようなURLが出る。これを **メモ**（フロントの `VITE_API_BASE` で使う）。

---

## Step 4: 動作確認

```powershell
curl https://subscription-manager-api.akurah233mhz.workers.dev/api/subscriptions
# [] が返ればOK（subscriptionsが空なら空配列）

curl https://subscription-manager-api.akurah233mhz.workers.dev/api/settings
# {"pin_hash": {...}, "require_pin_for_cancel": {...}} が返ればOK
```

---

## ここまで終わったら教えて

次は **フロントエンド実装** に進む。必要な情報:
- Workers のデプロイ済みURL（`https://...workers.dev`）

これがあれば、`api.js` を実APIに繋いだ状態でフロントを書き始める。
