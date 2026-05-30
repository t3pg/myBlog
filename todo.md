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
- [x] RSS に各 item の description を明示し、壊れていたリンク（`/blog/{id}/`→`/blog/{連番}/`）を修正・日付降順ソート（`rss.xml.js`）
- [x] `og:locale=ja_JP` / `og:site_name` / `article:published_time` / `article:modified_time` 追加（Twitter `@site`/`@creator` はハンドル不明のため出力しない）
- [x] sitemap の `lastmod` に `updatedDate`/`pubDate` を反映（`@astrojs/sitemap` serialize で記事101件に frontmatter の日付を反映。全URL一律の `lastmod: new Date()` は廃止）
- [x] `404.astro` に `noindex` 付与（BaseHead に `noindex` prop を追加して制御。併せて skip-link 用 `id="main-content"` 欠落と無効な `color: var(--gray)` も修正）
- [~] ~~パンくず JSON-LD（BreadcrumbList）追加~~（Skip）
- [x] 空 description のフォールバック: 記事101件中99件が空のため、BaseHead で空なら `title` を meta/OGP/JSON-LD の description に使用（本文は変更せず）

## C. 不要要素の削除
> ⚠️ 調査の誤り訂正: 当初「Starlight は未使用」と判断したが、**公開記事が Starlight に依存**していた（`2026/02/7.mdx` が `Aside`/`LinkCard`/`Code`、`2026/05/76.mdx` が `Icon` を import、`2026/02/8.mdx` が `/fonts/atkinson-bold.woff` を使用）。記事本文は変更禁止のため、`@astrojs/starlight` と Atkinson フォントは**残す**。`astro-expressive-code` も Starlight 経由の依存のため残す。
- [x] `Header.astro` の `Icon`（moon/sun/github 3箇所）をインラインSVG化（記事に依存しない安全な簡素化）
- [x] `Share.astro` の未使用 `Icon` import を削除（`import {link} from "fs"` のデッドコードも併せて削除）
- [~] ~~`astro.config.mjs` から `starlight()` 設定・import を削除~~（取消: 記事が依存。残す）
- [x] `package.json` から **`starlight-blog`** のみ削除（完全未使用。`@astrojs/starlight` は記事依存のため残す）
- [~] ~~`public/fonts/atkinson-*.woff` 削除~~（取消: `2026/02/8.mdx` が使用。残す）
- [x] **スターター残骸削除**: `src/assets/blog-placeholder-about.jpg`（参照ゼロ）
- [x] **デッドコード削除**: `BaseHead.astro` の未使用 `image` prop + `FallbackImage` import + `src/assets/blog-placeholder-1.jpg`
- [x] ~~`SITE_DESCRIPTION` を実態に即した日本語へ置換~~（B-4 で対応済み）

## D. その他（設定集約・CSS）
- [x] Giscus 設定（repo/repoId/categoryId/mapping/lang）を `consts.ts` の `GISCUS_CONFIG` へ集約し `BlogPost.astro` から `define:vars` で参照
- [x] GA 測定ID（`G-CJ2FHPGXF4`）を `consts.ts` の `GA_MEASUREMENT_ID` へ定数化（`BaseHead.astro` で `define:vars` 参照。サイトURLは既存の `Astro.site` を使用するため定数追加不要）
- [x] ダークモード CSS トークンの重複定義（`@media` 版と `[data-theme=dark]` 版, 約18行）を `light-dark()` + `color-scheme` 切替で1か所に統合（`global.css`）

## E. パフォーマンス
- [~] ~~画像最適化: md 内画像をビルド時に Astro `<Image>` へ自動変換~~（保留: 記事内の画像は全6件すべてリモートURL（r2.dev/media.t-3.dev/books.google.com）で、Astro のビルド時最適化はローカル画像専用のため現コンテンツには非適用。記事本文も変更禁止。要相談）
- [ ] Google Fonts を Astro 6 `astro:fonts` で自己ホスト＋日本語サブセット化
- [ ] Google Analytics を `@astrojs/partytown` で Web Worker にオフロード
- [x] **ブログ一覧・タグ別一覧のページネーション**（20件/ページ）。ページ1は既存URL（`/blog/`・`/tags/{tag}/`）維持、2ページ目以降は `/blog/page/N/`・`/tags/{tag}/page/N/`（連番記事URL `/blog/{連番}/` との衝突回避）。rel prev/next 付与。共通化のため `PostList.astro`・`Pagination.astro`・`PostListLayout.astro` を新設

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
