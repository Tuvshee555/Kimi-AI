import { NextRequest, NextResponse } from "next/server";

const KEY = process.env.MOONSHOT_API_KEY!;

export async function POST(req: NextRequest) {
  const data = await req.formData();
  const file = data.get("file") as File;
  const question = data.get("question") as string;

  if (!file)
    return NextResponse.json({ reply: "No file uploaded" }, { status: 400 });

  // 1. Upload file to Kimi
  const uploadRes = await fetch("https://api.moonshot.cn/v1/files", {
    method: "POST",
    headers: { Authorization: `Bearer ${KEY}` },
    body: (() => {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("purpose", "file-extract");
      return fd;
    })(),
  });
  if (!uploadRes.ok)
    return NextResponse.json({ reply: "Upload failed" }, { status: 500 });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fileJson: any = await uploadRes.json();
  const fileId = fileJson.id;

  // 2. Ask about the file
  const compRes = await fetch("https://api.moonshot.cn/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "kimi-latest", // file-reading model
      messages: [
        {
          role: "system",
          content:
            "You are a professional assistant. Use headings, bullets, and emojis to make answers clear and pleasant.",
        },
        { role: "user", content: `${question}\n\n<file>${fileId}</file>` },
      ],
      temperature: 0.1,
    }),
  });
  if (!compRes.ok)
    return NextResponse.json({ reply: "File chat failed" }, { status: 500 });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const compJson: any = await compRes.json();
  return NextResponse.json({ reply: compJson.choices[0].message.content });
}
