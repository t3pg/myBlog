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
    publicBaseUrl: process.env.R2_PUBLIC_BASE_URL,
    region: "auto",
};

// ========================================
// メイン処理
// ========================================
const { S3Client, PutObjectCommand, HeadObjectCommand } = require("@aws-sdk/client-s3");
const fs = require("fs");
const path = require("path");

const client = new S3Client({
    region: CONFIG.region,
    endpoint: CONFIG.endpoint,
    credentials: {
        accessKeyId: CONFIG.accessKeyId,
        secretAccessKey: CONFIG.secretAccessKey,
    },
});

async function upload(filePath) {
    // ファイル存在チェック
    if (!fs.existsSync(filePath)) {
        console.error(`[エラー] ファイルが見つかりません: ${filePath}`);
        process.exit(1);
    }

    const fileName = path.basename(filePath);

    // R2上に同名ファイルが存在するか確認
    console.log(`[INFO] ファイル名の衝突チェック中: ${fileName}`);
    try {
        await client.send(
            new HeadObjectCommand({
                Bucket: CONFIG.bucketName,
                Key: fileName,
            })
        );
        // 例外が出なければ既に存在する
        console.error(`[エラー] 同名のファイルがR2上に既に存在します: ${fileName}`);
        console.error("アップロードを中止しました。ファイル名を変更してから再実行してください。");
        process.exit(1);
    } catch (err) {
        if (err.name !== "NotFound" && err.$metadata?.httpStatusCode !== 404) {
            throw err; // 404以外のエラーは再スロー
        }
        // 404 = 存在しない = 衝突なし、続行
    }

    const fileBuffer = fs.readFileSync(filePath);

    console.log(`[INFO] アップロード中: ${fileName}`);

    // R2へアップロード
    await client.send(
        new PutObjectCommand({
            Bucket: CONFIG.bucketName,
            Key: fileName,
            Body: fileBuffer,
        })
    );

    console.log(`[INFO] アップロード完了`);

    // ローカルファイル削除
    fs.unlinkSync(filePath);
    console.log(`[INFO] ローカルファイルを削除しました: ${filePath}`);

    // 公開URLを表示
    const publicUrl = `${CONFIG.publicBaseUrl}/${fileName}`;
    console.log(`\n[完了] 公開URL: ${publicUrl}\n`);
}

// 引数チェック
const filePath = process.argv[2];
if (!filePath) {
    console.error("[エラー] ファイルパスを引数で指定してください。");
    console.error("使い方: node upload_to_r2.js C:\\path\\to\\file.txt");
    process.exit(1);
}

upload(filePath).catch((err) => {
    console.error("[エラー] 予期しないエラーが発生しました:", err.message);
    process.exit(1);
});