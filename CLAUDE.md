# myBlog - AI エージェント向けプロジェクトガイド

## 重要ルール

- **コミットメッセージは必ず日本語で記述すること**
- **記事の本文（`src/content/blog/` 以下の `.md` / `.mdx` ファイルのフロントマターより下のコンテンツ）は絶対に変更しないこと**

## 技術スタック

- **フレームワーク**: Astro 5.x
- **コンテンツ形式**: Markdown / MDX
- **インテグレーション**: `@astrojs/mdx`, `@astrojs/sitemap`, `@astrojs/starlight`, `astro-expressive-code`, `astro-mermaid`
- **Markdown プラグイン**: `remark-link-card-plus`, `remark-directive`, カスタムディレクティブ, カスタム絵文字
- **画像処理**: sharp
- **デプロイ先**: Cloudflare Pages (`https://t-3.dev`)

### Starlight の利用範囲

`@astrojs/starlight` はインテグレーションとして登録されているが、**ルーティング・レイアウトには使用しない**。以下のコンポーネントをインポートするためだけに使用している。

| コンポーネント | 使用箇所 |
|---|---|
| `Icon` | `Header.astro`, `Share.astro` |
| `Aside`, `LinkCard`, `Code` | 一部の MDX 記事内 |

`starlight-blog` パッケージはインストール済みだが未設定。

## ディレクトリ構成

```
src/
├── content/
│   ├── blog/
│   │   └── {year}/{month}/{連番}.md   # 記事ファイル
│   └── tags/                          # タグ定義
├── pages/
│   ├── index.astro                    # トップページ
│   ├── about.astro                    # About ページ
│   ├── blog/
│   │   ├── index.astro                # 記事一覧
│   │   ├── [...slug].astro            # 記事詳細（動的ルート）
│   │   └── [year]/[month]/index.astro # 月別アーカイブ
│   ├── tags/
│   │   ├── index.astro                # タグ一覧
│   │   └── [tag].astro                # タグ別記事一覧
│   ├── books/index.astro              # 本棚ページ
│   └── rss.xml.js                     # RSS フィード
├── layouts/
│   └── BlogPost.astro                 # 記事レイアウト（ヘッダー・フッター・サイドバー・TOC 含む）
├── components/
│   ├── BaseHead.astro                 # <head> メタタグ・OGP・アナリティクス
│   ├── Header.astro                   # ナビゲーションバー（ダークモードトグル含む）
│   ├── Footer.astro                   # フッター
│   ├── Sidebar.astro                  # 右サイドバー（プロフィール・最新記事・タグ・月別アーカイブ）
│   ├── TableOfContents.astro          # 記事目次（見出しリストのみ、ラップは BlogPost.astro が担当）
│   ├── Share.astro                    # SNS シェアボタン
│   ├── FormattedDate.astro            # 日付フォーマット
│   ├── HeaderLink.astro               # ナビリンク
│   └── Video.astro                    # 動画埋め込みコンポーネント
├── plugins/
│   ├── directive.mjs                  # カスタム remark ディレクティブ
│   └── emoji.mjs                      # カスタム絵文字プラグイン
├── styles/
│   └── global.css                     # グローバル CSS（CSS 変数・prose スタイル・リンクカード等）
├── assets/                            # 画像アセット
└── consts.ts                          # サイト定数（SITE_TITLE, SIDEBAR_TAGS など）
```

## 記事のフロントマター

```yaml
---
title: "記事タイトル"
pubDate: YYYY-MM-DD
description: ""          # 省略可
updatedDate: YYYY-MM-DD  # 更新日（省略可）
heroImage: ./image.png   # アイキャッチ画像（省略可）
tags: ["タグ1", "タグ2"] # 省略可
---
```

## スタイル

- グローバル CSS: `src/styles/global.css`
- 各コンポーネントはスコープ付き `<style>` ブロックを持つ
- フォント: Noto Sans JP + JetBrains Mono（コードブロック）
- アクセントカラー: `#2337ff`（ライト）/ `#8b97ff`（ダーク）
- `scroll-padding-top: 72px`（sticky ヘッダー分のアンカーオフセット）

### ブレークポイント

| 幅 | 変化 |
|---|---|
| `< 720px` | 記事タイトルフォントサイズ縮小、前後ナビを1列化 |
| `< 880px` | レイアウト1カラム化（右サイドバー非表示） |
| `< 1472px` | TOC 左サイドバー非表示 → 折りたたみ TOC を記事内に表示 |
| `≥ 1472px` | TOC 左サイドバー表示（ビューポート左余白に配置） |

### レイアウト構造

```
[TOC 左サイドバー*]  [layout-wrapper: main(1fr) + sidebar(240px)]
* ≥1472px のみ。grid-column: 1 / row: 1 で <main> と重ね、margin-left: -196px で左余白へ引き込む
```

## 目次（TableOfContents）

- `src/components/TableOfContents.astro`: `headings`・`minDepth`・`maxDepth` props を受け取り、`<ul>` リストのみをレンダリング
- `BlogPost.astro` が見出し（`render()` の `headings`）を渡す
- H1〜H3 を対象（デフォルト）。H3 は 1em インデント
- **デスクトップ（≥1472px）**: `<aside class="toc-sidebar">` として左余白に sticky 表示
- **それ未満**: `<details class="toc-mobile">` として記事ヘッダー直下に折りたたみ表示

## 定数・設定

- `src/consts.ts`: `SITE_TITLE`, `SITE_DESCRIPTION`, `SIDEBAR_TAGS`（サイドバーに表示するタグ一覧）
- `astro.config.mjs`: インテグレーション設定、サイトマップ優先度設定

## Giscus（コメントシステム）

- 設定箇所: `src/layouts/BlogPost.astro`
- リポジトリ: `t3pg/myBlog`
- カテゴリ: `Announcements`
- マッピング: `pathname`
- テーマ: `data-theme` 属性に連動（ダークモード対応）
- 言語: `ja`

## 開発コマンド

```bash
npm run dev      # 開発サーバー起動
npm run build    # 本番ビルド
npm run preview  # ビルド結果のプレビュー
```

## 改善点（TODO候補）

コードベース調査で見つかった改善点。重要度順。着手時はこのセクションの該当項目を更新・削除すること。

### 高

- **品質保証の仕組みが皆無**: `package.json` に ESLint/Prettier/Vitest 等の devDependencies が無く、設定ファイルも無い。`.github/workflows/main.yml` は更新をDiscordに通知するのみで、ビルド・型チェック・lintをCIで実行していない。壊れたコードがそのまま本番デプロイされ得る。
- **`src/pages/about.astro`**: `<main id="main-content"></main>` のみで本文が無い空ページが本番公開中。SEO・UX上望ましくない。

### 中

- **OGP画像が全ページ共通**: `src/components/BaseHead.astro` で `heroImage` 未指定時のフォールバック画像が固定URLで、記事ごとの `og:image` / `twitter:image` の作り分けが弱い。
- **`src/plugins/responsiveImage.mjs`**: `<img>` を `<picture>` に変換する際 width/height/aspect-ratio を付与しておらず、CLS（レイアウトシフト）対策が弱い。
- **`src/pages/books/index.astro`(9-15行目)**: `books.csv` を `split("\n")` → `split(",")` の素朴な自前パースをしており、フィールド内にカンマを含むデータがあると壊れる。
- **記事一覧マークアップの重複**: `src/components/PostList.astro` と `src/pages/index.astro` がほぼ同一の記事一覧マークアップ・CSS（`post-row` / `post-title` / `post-tag`）を重複実装している。`PostList` に統一すべき。

### 低

- **Google Analytics**: `BaseHead.astro` で同意取得なしに全ページ無条件でロードしている。プライバシー配慮の余地あり。
- **依存パッケージの自動更新**: Dependabot/Renovate等が未設定で、更新が手動任せになっている。

### 良い点（維持すること）

- `tsconfig.json` は strict 設定
- `Header.astro` に skip-link・aria-label あり
- JSON-LD構造化データ、sitemap、RSSを実装済み
- `.env` / R2認証情報は `.gitignore` 済みで漏洩なし
