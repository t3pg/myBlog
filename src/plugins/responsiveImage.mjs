import { ListObjectsV2Command, S3Client } from "@aws-sdk/client-s3";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { SKIP, visit } from "unist-util-visit";

// ビルド中に共有するモバイル画像キーの一覧と公開 URL
const mobileImageKeys = new Set();
let r2PublicBaseUrl = "";

function loadR2Env() {
    const envPath = join(process.cwd(), "R2/.env");
    if (!existsSync(envPath)) return;
    for (const line of readFileSync(envPath, "utf-8").split("\n")) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const eq = trimmed.indexOf("=");
        if (eq === -1) continue;
        const key = trimmed.slice(0, eq).trim();
        const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
        if (key && !(key in process.env)) process.env[key] = val;
    }
}

async function scanR2(logger) {
    loadR2Env();

    const endpoint = process.env.R2_ENDPOINT;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    const bucketName = process.env.R2_BUCKET_NAME;
    r2PublicBaseUrl = (process.env.R2_PUBLIC_BASE_URL ?? "").replace(/\/$/, "");

    if (!endpoint || !accessKeyId || !secretAccessKey || !bucketName || !r2PublicBaseUrl) {
        logger.warn("R2 認証情報が見つかりません。モバイル画像の自動適用をスキップします。");
        return;
    }

    const s3 = new S3Client({
        region: "auto",
        endpoint,
        credentials: { accessKeyId, secretAccessKey },
    });

    mobileImageKeys.clear();

    let continuationToken;
    do {
        const res = await s3.send(
            new ListObjectsV2Command({
                Bucket: bucketName,
                ContinuationToken: continuationToken,
            })
        );
        for (const obj of res.Contents ?? []) {
            if (obj.Key?.endsWith("_mobile.avif")) {
                mobileImageKeys.add(obj.Key);
            }
        }
        continuationToken = res.IsTruncated ? res.NextContinuationToken : undefined;
    } while (continuationToken);

    logger.info(`モバイル画像 ${mobileImageKeys.size} 件を検出しました`);
}

/**
 * Astro インテグレーション: ビルド開始前に R2 をスキャンしてモバイル画像キーを収集する
 */
export function r2ResponsiveImageIntegration() {
    return {
        name: "r2-responsive-image",
        hooks: {
            "astro:config:done": async ({ logger }) => {
                try {
                    await scanR2(logger);
                } catch (err) {
                    logger.warn(`R2 スキャン中にエラーが発生しました: ${err instanceof Error ? err.message : String(err)}`);
                    // 部分的に設定された状態をリセットして rehype が安全にスキップできるようにする
                    r2PublicBaseUrl = "";
                    mobileImageKeys.clear();
                }
            },
        },
    };
}

/**
 * rehype プラグイン: R2 の img タグをモバイル版があれば picture 要素に変換する
 *
 * 変換例:
 *   <img src="https://…/image.avif" alt="…">
 *   ↓
 *   <picture>
 *     <source media="(max-width: 719px)" srcset="https://…/image_mobile.avif" type="image/avif">
 *     <img src="https://…/image.avif" alt="…">
 *   </picture>
 */
export function rehypeResponsiveImage() {
    return function (tree) {
        if (!r2PublicBaseUrl) return;

        const base = r2PublicBaseUrl + "/";

        visit(tree, "element", (node, index, parent) => {
            if (node.tagName !== "img") return;
            if (!parent || typeof index !== "number") return;
            // すでに picture 内にいる場合はスキップ
            if (parent.tagName === "picture") return;

            const src = node.properties?.src;
            if (typeof src !== "string") return;
            if (!src.startsWith(base)) return;
            // .avif かつモバイル版自身でないことを確認
            if (!src.endsWith(".avif") || src.endsWith("_mobile.avif")) return;

            // "image.avif" → "image_mobile.avif" を導出
            const key = src.slice(base.length);
            const mobileKey = key.slice(0, -".avif".length) + "_mobile.avif";

            if (!mobileImageKeys.has(mobileKey)) return;

            const mobileSrc = base + mobileKey;

            parent.children[index] = {
                type: "element",
                tagName: "picture",
                properties: {},
                children: [
                    {
                        type: "element",
                        tagName: "source",
                        properties: {
                            media: "(max-width: 719px)",
                            srcSet: mobileSrc,
                            type: "image/avif",
                        },
                        children: [],
                    },
                    // position を除外してコピーし後続プラグインへの副作用を防ぐ
                    { ...node, position: undefined, properties: { ...node.properties } },
                ],
            };
            return [SKIP, index + 1];
        });
    };
}
