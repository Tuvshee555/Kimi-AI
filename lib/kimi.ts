const BASE = "https://api.moonshot.cn/v1";
const KEY = process.env.MOONSHOT_API_KEY!;

export async function createChatCompletion(
  messages: { role: "system" | "user" | "assistant"; content: string }[],
  model = "kimi-latest"
) {
  const res = await fetch(`${BASE}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model, messages, temperature: 0.1 }),
  });
  if (!res.ok) throw new Error(await res.text());
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const json: any = await res.json();
  return json.choices[0].message.content as string;
}
