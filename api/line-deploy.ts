export default async function handler(req, res) {
  try {
    const token = process.env.LINE_ACCESS_TOKEN;
    const target = process.env.LINE_TARGET_ID; // userId ของคุณ

    const body = {
      to: target,
      messages: [
        {
          type: "text",
          text: `🚀 Deploy Completed!\n\nTime: ${new Date().toLocaleString()}`
        }
      ]
    };

    await fetch("https://api.line.me/v2/bot/message/push", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(body)
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: err.toString() });
  }
}
