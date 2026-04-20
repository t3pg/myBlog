# myBlog - AI エージェント向けプロジェクトガイド

## 重要ルール

- **コミットメッセージは必ず日本語で記述すること**
- **記事の本文（`src/content/blog/` 以下の `.md` / `.mdx` ファイルのフロントマターより下のコンテンツ）は絶対に変更しないこと**

## 技術スタック

- **フレームワーク**: Astro 5.x
- **コンテンツ形式**: Markdown / MDX
- **主要インテグレーション**: `@astrojs/mdx`, `@astrojs/sitemap`, `@astrojs/starlight`, `starlight-blog`
- **画像処理**: sharp
- **デプロイ先**: Cloudflare Pages (`https://t-log.pages.dev`)

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
│   └── BlogPost.astro                 # 記事レイアウト（ヘッダー・フッター・サイドバー含む）
├── components/
│   ├── BaseHead.astro                 # <head> メタタグ・OGP
│   ├── Header.astro                   # ナビゲーションバー
│   ├── Footer.astro                   # フッター
│   ├── Sidebar.astro                  # サイドバー（最新記事・タグ・月別アーカイブ）
│   ├── FormattedDate.astro            # 日付フォーマット
│   ├── HeaderLink.astro               # ナビリンク
│   └── Video.astro                    # 動画埋め込みコンポーネント
├── styles/
│   └── global.css                     # グローバル CSS
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
- モバイルブレークポイント: `720px`
- レイアウト: 2カラム（メイン `1fr` + サイドバー `260px`）、モバイルは1カラム
- フォント: Noto Sans JP
- アクセントカラー: `#2337ff`

## 定数・設定

- `src/consts.ts`: `SITE_TITLE`, `SITE_DESCRIPTION`, `SIDEBAR_TAGS`（サイドバーに表示するタグ一覧）
- `astro.config.mjs`: インテグレーション設定、サイトマップ優先度設定

## Giscus（コメントシステム）

- 設定箇所: `src/layouts/BlogPost.astro`
- リポジトリ: `t3pg/myBlog`
- カテゴリ: `Announcements`
- マッピング: `pathname`
- テーマ: `light`（GitHub Light 固定）
- 言語: `ja`

## 開発コマンド

```bash
npm run dev      # 開発サーバー起動
npm run build    # 本番ビルド
npm run preview  # ビルド結果のプレビュー
```
