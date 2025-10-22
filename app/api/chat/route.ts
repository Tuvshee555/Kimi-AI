/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextRequest, NextResponse } from "next/server";
import { createChatCompletion } from "@/lib/kimi";
import { SYSTEM_PROMPT } from "@/lib/prompt";

export async function POST(req: NextRequest) {
  const { message } = await req.json();
  if (!message || typeof message !== "string")
    return NextResponse.json({ reply: "Invalid input" }, { status: 400 });

  try {
    const reply = await createChatCompletion([
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: message },
    ]);
    return NextResponse.json({ reply });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (e: any) {
    return NextResponse.json({ reply: "Server error" }, { status: 500 });
  }
}
