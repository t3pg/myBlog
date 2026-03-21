// 環境変数DISCORD_WEBHOOK


const webhookUrl = process.env.DISCORD_WEBHOOK;

if (!webhookUrl) {
    console.error('Error: DISCORD_WEBHOOK environment variable is not set');
    process.exit(1);
}


const deployedAt = new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' });

const payload = {
    "content": "更新しました! \n -# " + deployedAt,
};

const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
});

if (!response.ok) {
    console.error(`Discord webhook failed: ${response.status} ${response.statusText}`);
    process.exit(1);
}

console.log('Discord notification sent successfully');