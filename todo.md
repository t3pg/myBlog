# サイト改善 TODO

## パフォーマンス
- [x] Google Fonts をノンブロッキング読み込みに変更 (`BaseHead.astro`)
- [x] Speculation Rules API でページプリフェッチを追加 (`BaseHead.astro`)
- [x] `font-size-adjust` でフォントスワップ時のCLSを低減（`global.css`、Noto Sans JP のアスペクト比 0.54）

## UX / モダンCSS
- [x] Cross-document View Transitions を追加 (`global.css`)
- [x] `prefers-reduced-motion` 対応を追加 (`global.css`)
- [x] トップページにコンテンツ（最新記事一覧）を追加 (`index.astro`)
- [x] モバイル: "Home" リンクを非表示にしてナビを簡潔に (`Header.astro`)

## アクセシビリティ・細部修正
- [x] `.sr-only` の非推奨 `clip` 構文（スペース区切り）を削除 (`global.css`)
- [x] `--muted` カラーのコントラスト改善（ライト/ダーク両モード）(`global.css`)

---

# 構造改善プラン（2026-05 レビュー）

> 制約: 記事本文（`src/content/blog/**` のフロントマターより下）は変更しない / 記事URL `/blog/{連番}/` は Giscus・SNS共有と紐づくため変更しない / `astro-expressive-code` は全コードブロックに自動適用される実利用中の依存のため削除しない。

## A. 可読性・シンプル化
- [~] ~~`src/lib/posts.ts` を新設し記事取得＋日付降順ソートを共通化~~（Skip）
- [~] ~~重複ソートを置換: `index.astro` / `blog/index.astro` / `tags/[tag].astro` / `Sidebar.astro`~~（Skip）
- [~] ~~投稿リスト共通コンポーネント `PostList.astro` を作成~~（Skip）
- [x] `BlogPost.astro` の重複テーマ判定（emoji用/Giscus用）を `window.__isDarkTheme()` 共通ヘルパーに統一

## B. SEO
- [x] **robots.txt のドメイン誤り修正** `t-log.pages.dev` → `t-3.dev`（`public/robots.txt`）
- [x] JSON-LD 構造化データ追加（記事=BlogPosting / サイト=WebSite）（`BaseHead.astro` 拡張）
- [~] ~~OGP画像の記事別対応: heroImage 活用~~（Skip）
- [x] ページ別 title/description 最適化（`SITE_DESCRIPTION` を実態に即した内容へ更新、about/blog一覧にページ固有 description。about の重複 `<Footer />` も除去）
- [ ] RSS に各 item の description を明示（`rss.xml.js`）→ 今回更新
- [x] `og:locale=ja_JP` / `og:site_name` / `article:published_time` / `article:modified_time` / Twitter `@site`・`@creator` 追加
- [ ] sitemap の `lastmod` に `updatedDate`/`pubDate` を反映（`@astrojs/sitemap` serialize）→ 今回更新
- [ ] `404.astro` に `noindex` 付与 → 今回更新
- [~] ~~パンくず JSON-LD（BreadcrumbList）追加~~（Skip）
- [~] ~~空 description のフォールバック自動生成~~（Skip）

## C. 不要要素の削除
- [ ] **Starlight 削除**: `Header.astro` の `Icon`（moon/sun/github 3箇所）をインラインSVG化
- [ ] `Share.astro` の未使用 `Icon` import を削除（デッドコード）
- [ ] `astro.config.mjs` から `starlight()` 設定・import を削除
- [ ] `package.json` から `@astrojs/starlight` と `starlight-blog` を削除
- [ ] **スターター残骸削除**: `public/fonts/atkinson-*.woff`（約46KB, 参照ゼロ）
- [ ] **スターター残骸削除**: `src/assets/blog-placeholder-about.jpg`（参照ゼロ）
- [ ] **デッドコード削除**: `BaseHead.astro` の未使用 `image` prop + `FallbackImage` import + `src/assets/blog-placeholder-1.jpg`（B-3 でフォールバック配線するなら作り直し）
- [ ] `SITE_DESCRIPTION = "Welcome to my website!"`（スターター既定値）を実態に即した日本語へ置換

## D. その他（設定集約・CSS）
- [ ] Giscus 設定（repo/repoId/categoryId/mapping）を `consts.ts` の `GISCUS_CONFIG` へ集約（`BlogPost.astro`）
- [ ] GA 測定ID（`G-CJ2FHPGXF4`）・サイトURL を `consts.ts` へ定数化
- [ ] ダークモード CSS トークンの重複定義（`@media` 版と `[data-theme=dark]` 版, 約18行）を統合（`global.css`）

## E. パフォーマンス
- [ ] 画像最適化: `astro:assets`（`<Image>`/`<Picture>`）を非記事領域（books カバー等）に導入
- [ ] Google Fonts を Astro 6 `astro:fonts` で自己ホスト＋日本語サブセット化
- [ ] Google Analytics を `@astrojs/partytown` で Web Worker にオフロード
- [ ] **ブログ一覧のページネーション**（現在 全101記事を1ページ出力）`paginate()` で `/blog/[page]` 化、rel prev/next 付与

## F. heroImage の扱い
- [ ] `heroImage` は schema 定義済みだが表示箇所ゼロ → 記事ヘッダー/一覧/OGP で活用（B-3 と連動）、または schema から削除

## G. 開発体験 / CI
- [ ] PR/push で `npm run build` + `astro check` を走らせる GitHub Actions を追加
- [ ] Prettier（`prettier-plugin-astro`）/ ESLint（`eslint-plugin-astro`）導入

## H. UX / 機能
- [ ] 記事に読了時間（約N分）を算出・表示
- [ ] タグ一致ベースの関連記事を記事末尾に表示（`getRelatedPosts`）
- [ ] サイト内検索 `pagefind` を導入 ※低〜中優先

## I. 保守性
- [ ] `books/index.astro` のインライン CSV パーサを `src/lib/` へ抽出

## 着手推奨順
1. 即効・低リスク: B(robots), C(Starlight削除・残骸削除), A(posts.ts), D
2. 高インパクト: B(JSON-LD/OGP/heroImage), E(ページネーション/画像最適化), G(CI)
3. 中: B 残り, E(フォント/GA), H(読了時間/関連記事), G(lint)
4. 任意: A(PostList), B(パンくず/404), H(検索), I
