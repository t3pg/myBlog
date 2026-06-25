// ========================================
// .env 読み込み
// ========================================
const fs_env = require("fs");
const path_env = require("path");
const envPath = path_env.join(__dirname, ".env");
if (fs_env.existsSync(envPath)) {
    fs_env.readFileSync(envPath, "utf8")
        .split("\n")
        .forEach((line) => {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith("#")) return;
            const eq = trimmed.indexOf("=");
            if (eq === -1) return;
            const key = trimmed.slice(0, eq).trim();
            const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
            if (key && !(key in process.env)) process.env[key] = val;
        });
}

// ========================================
// 設定（環境変数から読み込み）
// ========================================
const REQUIRED_ENV = [
    "R2_ENDPOINT",
    "R2_ACCESS_KEY_ID",
    "R2_SECRET_ACCESS_KEY",
    "R2_BUCKET_NAME",
    "R2_PUBLIC_BASE_URL",
];

const missing = REQUIRED_ENV.filter((key) => !process.env[key]);
if (missing.length > 0) {
    console.error("[エラー] 以下の環境変数が設定されていません:");
    missing.forEach((key) => console.error(`  - ${key}`));
    process.exit(1);
}

const CONFIG = {
    endpoint: process.env.R2_ENDPOINT,
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    bucketName: process.env.R2_BUCKET_NAME,
    publicBaseUrl: process.env.R2_PUBLIC_BASE_URL.replace(/\/$/, ""),
    region: "auto",
};

// ========================================
// メイン処理
// ========================================
const { S3Client, PutObjectCommand, HeadObjectCommand } = require("@aws-sdk/client-s3");
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const client = new S3Client({
    region: CONFIG.region,
    endpoint: CONFIG.endpoint,
    credentials: {
        accessKeyId: CONFIG.accessKeyId,
        secretAccessKey: CONFIG.secretAccessKey,
    },
});

// AVIF 変換対象の画像形式（.gif はアニメーション消失のため除外）
const IMAGE_EXTENSIONS = new Set([
    ".jpg", ".jpeg", ".png", ".webp",
    ".tiff", ".tif", ".avif", ".heic", ".heif",
]);

function isImage(filePath) {
    return IMAGE_EXTENSIONS.has(path.extname(filePath).toLowerCase());
}

async function objectExists(key) {
    try {
        await client.send(new HeadObjectCommand({ Bucket: CONFIG.bucketName, Key: key }));
        return true;
    } catch (err) {
        if (err.name === "NotFound" || err.$metadata?.httpStatusCode === 404) return false;
        throw err;
    }
}

async function checkConflict(key) {
    console.log(`[INFO] 衝突チェック中: ${key}`);
    if (await objectExists(key)) {
        console.error(`[エラー] 同名のファイルがR2上に既に存在します: ${key}`);
        console.error("アップロードを中止しました。ファイル名を変更してから再実行してください。");
        process.exit(1);
    }
}

async function putObject(key, body, contentType) {
    const params = {
        Bucket: CONFIG.bucketName,
        Key: key,
        Body: body,
    };
    if (contentType) params.ContentType = contentType;
    console.log(`[INFO] アップロード中: ${key}`);
    await client.send(new PutObjectCommand(params));
    console.log(`[INFO] アップロード完了: ${key}`);
}

// 画像ファイル: PC版・モバイル版の2種類を AVIF に変換してアップロード
async function uploadImage(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const baseName = path.basename(filePath, ext);

    const pcKey = `${baseName}.avif`;
    const mobileKey = `${baseName}_mobile.avif`;

    // 両ファイルの存在状態を並列で確認
    console.log("[INFO] 衝突チェック中...");
    const [pcExists, mobileExists] = await Promise.all([
        objectExists(pcKey),
        objectExists(mobileKey),
    ]);

    if (pcExists && mobileExists) {
        // 両方とも存在 → 前回の完全なアップロード済みと判断
        console.log("[INFO] 両ファイルはR2上に既にアップロードされています。");
        console.log(`  PC版 URL:      ${CONFIG.publicBaseUrl}/${pcKey}`);
        console.log(`  モバイル版 URL: ${CONFIG.publicBaseUrl}/${mobileKey}`);
        return;
    } else if (pcExists || mobileExists) {
        // 片方だけ存在 → 前回のアップロードが途中で失敗した可能性
        const existing = pcExists ? pcKey : mobileKey;
        const missing = pcExists ? mobileKey : pcKey;
        console.error(`[エラー] ${existing} はR2上に存在しますが、${missing} がありません。`);
        console.error("前回のアップロードが途中で失敗した可能性があります。");
        console.error(`R2から ${existing} を削除してから再実行してください。`);
        process.exit(1);
    }

    // PC版・モバイル版を並列変換
    console.log("[INFO] AVIF 変換中（PC版・モバイル版）...");
    let pcBuffer, mobileBuffer;
    try {
        [pcBuffer, mobileBuffer] = await Promise.all([
            sharp(filePath).avif({ quality: 80 }).toBuffer(),
            sharp(filePath).resize({ width: 750, withoutEnlargement: true }).avif({ quality: 65 }).toBuffer(),
        ]);
    } catch (err) {
        console.error(`[エラー] 画像変換に失敗しました: ${err instanceof Error ? err.message : String(err)}`);
        console.error("ファイルが破損しているか、対応していない形式の可能性があります。");
        process.exit(1);
    }

    // PC版・モバイル版を並列アップロード
    await Promise.all([
        putObject(pcKey, pcBuffer, "image/avif"),
        putObject(mobileKey, mobileBuffer, "image/avif"),
    ]);

    // ローカルの元ファイルを削除
    fs.unlinkSync(filePath);
    console.log(`[INFO] ローカルファイルを削除しました: ${filePath}`);

    console.log("\n[完了]");
    console.log(`  PC版 URL:      ![](${CONFIG.publicBaseUrl}/${pcKey})`);
    console.log(`  モバイル版 URL: ${CONFIG.publicBaseUrl}/${mobileKey}\n`);
}

// 非画像ファイル: そのままアップロード
async function uploadFile(filePath) {
    const fileName = path.basename(filePath);

    await checkConflict(fileName);

    const fileBuffer = fs.readFileSync(filePath);
    await putObject(fileName, fileBuffer);

    fs.unlinkSync(filePath);
    console.log(`[INFO] ローカルファイルを削除しました: ${filePath}`);

    console.log(`\n[完了] 公開URL: ${CONFIG.publicBaseUrl}/${fileName}\n`);
}

async function upload(filePath) {
    if (!fs.existsSync(filePath)) {
        console.error(`[エラー] ファイルが見つかりません: ${filePath}`);
        process.exit(1);
    }

    if (isImage(filePath)) {
        console.log(`[INFO] 画像ファイルを検出しました。AVIF変換モードで処理します。`);
        await uploadImage(filePath);
    } else {
        await uploadFile(filePath);
    }
}

// 引数チェック
const filePath = process.argv[2];
if (!filePath) {
    console.error("[エラー] ファイルパスを引数で指定してください。");
    console.error("使い方: node upload.js /path/to/image.png");
    process.exit(1);
}

upload(filePath).catch((err) => {
    console.error("[エラー] 予期しないエラーが発生しました:", err.message);
    process.exit(1);
});
