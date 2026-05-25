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
