# Codex Worklog

Claude Code中心の作業履歴と分けるため、Codexで行った変更をここに記録する。

## 2026-05-25

- Notion側の `category` Select options をフロントに反映できるようにする方針を確認。
- Workersに `GET /api/meta` を追加し、Notion subscriptions DBの `category` Select optionsを返すように変更。
- フロントは固定カテゴリ配列をやめ、`/api/meta` から取得したカテゴリをフィルタと追加/編集フォームに使うように変更。
- メタ情報取得に失敗した場合は既定カテゴリにフォールバックし、既存サブスクに含まれるカテゴリも選択肢へ残すようにした。

## 2026-05-26

- 外貨サブスクと家計用円換算を両立する方針で実装。
- Notion `subscriptions` DBに `currency` Selectと `amountJpy` Numberを追加。
- フロントの請求額表示を通貨対応にし、合計・金額ソート・年契約の月換算は `amountJpy` ベースに変更。
- 外貨で `amountJpy` が未設定のレコードは、円換算を金額そのままにせず未設定として扱うようにした。
- 解約ページへ進む際のPINゲートを解除し、管理設定のみPIN入力を必要とするように変更。
- Notion `subscriptions` DBに `contractOwner` Selectを追加し、アプリのフォームとカード表示に契約者を反映。
- Notion `subscriptions` DBに `paymentMethod` Selectを追加し、アプリのフォームとカード表示に支払い方法を反映。
- 契約者と支払い方法はカード展開時だけ表示するように変更。

## 2026-05-27

- 解約済みアーカイブを実装。
- Workersの `GET /api/subscriptions` に `status=active|archived|all` を追加し、Notionの `active` チェックボックスで取得対象を切り替えるようにした。
- フロントは契約中と解約済みを別々に取得し、タブで表示を切り替えるように変更。
- 契約中カードの「解約済みにする」は `active=false` にし、解約済みタブへ移動する。
- 解約済みカードには「復元」を追加し、`active=true` に戻して契約中タブへ戻せるようにした。
- `docs/SPEC.md` にアーカイブAPI、データフロー、UI仕様を反映。
- 解約手続き済みとアーカイブを分離。
- Notion `subscriptions` DBに `cancelled` Checkboxを追加し、`cancelled=true` は期限まで契約中一覧に残すように変更。
- 解約手続き済みカードにはバッジを表示し、更新日表示を「YYYY/MM/DDまで利用可」に切り替えるようにした。
- `active=false` は期限後などに一覧から外すアーカイブ用途として残した。
