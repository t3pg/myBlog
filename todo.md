# サイト改善 TODO

## パフォーマンス
- [x] Google Fonts をノンブロッキング読み込みに変更 (`BaseHead.astro`)
- [x] Speculation Rules API でページプリフェッチを追加 (`BaseHead.astro`)
- [ ] `font-size-adjust` でフォントスワップ時のCLSを低減（要フォントメトリクス計測）

## UX / モダンCSS
- [x] Cross-document View Transitions を追加 (`global.css`)
- [x] `prefers-reduced-motion` 対応を追加 (`global.css`)
- [x] トップページにコンテンツ（最新記事一覧）を追加 (`index.astro`)
- [x] モバイル: "Home" リンクを非表示にしてナビを簡潔に (`Header.astro`)

## アクセシビリティ・細部修正
- [x] `.sr-only` の非推奨 `clip` 構文（スペース区切り）を削除 (`global.css`)
- [x] `--muted` カラーのコントラスト改善（ライト/ダーク両モード）(`global.css`)
