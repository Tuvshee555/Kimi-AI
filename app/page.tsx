"use client";
import { useState, useRef, useEffect } from "react";
import Image from "next/image";

type Msg = {
  id: string;
  role: "user" | "assistant";
  text: string;
  file?: { name: string; url?: string };
  time: string;
};

export default function Home() {
  const [input, setInput] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>(""); // data-url for images
  const [loading, setLoading] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const now = () =>
    new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const send = async () => {
    if (!input.trim() && !file) return;
    setLoading(true);

    // ----- USER message -----
    const userMsg: Msg = {
      id: crypto.randomUUID(),
      role: "user",
      text: input || `📄 ${file!.name}`,
      file: file ? { name: file.name, url: preview } : undefined,
      time: now(),
    };
    setMsgs((m) => [...m, userMsg]);
    setInput("");
    const question = input || "Summarise this document.";

    // ----- API call -----
    let replyText = "";
    try {
      if (file) {
        // Universal file path
        const body = new FormData();
        body.append("file", file);
        body.append("question", question);
        const res = await fetch("/api/files", { method: "POST", body });
        const data = await res.json();
        replyText = data.reply || "File read failed";
      } else {
        // Text-only path
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: question }),
        });
        const data = await res.json();
        replyText = data.reply || "No reply";
      }
    } catch {
      replyText = "❌ Network error";
    }

    // ----- ASSISTANT message -----
    const assistantMsg: Msg = {
      id: crypto.randomUUID(),
      role: "assistant",
      text: formatAnswer(replyText),
      time: now(),
    };
    setMsgs((m) => [...m, assistantMsg]);
    setFile(null);
    setPreview("");
    setLoading(false);
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (!f) return;
    setFile(f);
    if (f.type.startsWith("image/")) setPreview(URL.createObjectURL(f));
    else setPreview(""); // non-image: no preview
  };

  useEffect(
    () => bottomRef.current?.scrollIntoView({ behavior: "smooth" }),
    [msgs]
  );

  return (
    <main className="min-h-screen bg-linear-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-black flex items-center justify-center p-4">
      <div className="w-full max-w-3xl h-[90vh] flex flex-col bg-white/30 dark:bg-gray-900/30 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 dark:border-gray-700">
        <header className="px-6 py-4 border-b border-white/20 dark:border-gray-700 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">
              Kimi Assistant
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              kimi-k2-0905-preview · ￥15 gift credit
            </p>
          </div>
          <button
            onClick={() => {
              setMsgs([]);
              setFile(null);
              setPreview("");
              setInput("");
            }}
            className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-red-500 hover:text-white transition flex items-center justify-center text-lg"
            aria-label="Close / New chat"
          >
            ×
          </button>
        </header>

        <section className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {msgs.map((m) =>
            m.role === "user" ? (
              <div key={m.id} className="flex justify-end items-end gap-2">
                <div className="max-w-[75%] bg-blue-500 text-white rounded-t-2xl rounded-bl-2xl px-4 py-2 shadow">
                  {m.file && m.file.url && (
                    <Image
                      src={m.file.url}
                      alt=""
                      width={160}
                      height={160}
                      className="rounded-md mb-2"
                    />
                  )}
                  {m.file && !m.file.url && (
                    <div className="text-sm mb-2">📄 {m.file.name}</div>
                  )}
                  <p className="whitespace-pre-wrap wrap-break-word">
                    {m.text}
                  </p>
                  <span className="text-xs opacity-70">{m.time}</span>
                </div>
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white grid place-items-center text-sm">
                  U
                </div>
              </div>
            ) : (
              <div key={m.id} className="flex justify-start items-end gap-2">
                <div className="w-8 h-8 rounded-full bg-indigo-600 text-white grid place-items-center text-sm">
                  A
                </div>
                <div className="max-w-[75%] bg-gray-200 dark:bg-gray-700 rounded-t-2xl rounded-br-2xl px-4 py-2 shadow">
                  <div
                    className="prose prose-sm dark:prose-invert whitespace-pre-wrap wrap-break-word"
                    dangerouslySetInnerHTML={{ __html: m.text }}
                  />
                  <span className="text-xs opacity-70">{m.time}</span>
                </div>
              </div>
            )
          )}
          {loading && (
            <div className="flex justify-start items-end gap-2">
              <div className="w-8 h-8 rounded-full bg-indigo-600 text-white grid place-items-center text-sm">
                A
              </div>
              <div className="bg-gray-200 dark:bg-gray-700 rounded-t-2xl rounded-br-2xl px-4 py-2 shadow">
                Typing…
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </section>

        <footer className="px-6 py-4 border-t border-white/20 dark:border-gray-700">
          {/* ----  GLASS DROP ZONE  ---- */}
          {(file || preview) && (
            <div
              onDrop={onDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileRef.current?.click()}
              className="mb-3 border-2 border-dashed border-blue-400 dark:border-blue-600 rounded-xl p-3 text-center cursor-pointer hover:bg-blue-50/50 dark:hover:bg-gray-800/50 transition"
            >
              {preview && file?.type.startsWith("image/") ? (
                <Image
                  src={preview}
                  alt=""
                  width={128}
                  height={128}
                  className="mx-auto rounded-lg shadow"
                />
              ) : file ? (
                <div className="text-sm text-gray-700 dark:text-gray-200">
                  📄 {file.name}
                </div>
              ) : (
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  📎 Drop image / file or click to change
                </p>
              )}
            </div>
          )}

          {/* ---- file pill (if you want a tiny pill instead, delete the glass block above and use this) ---- */}
          {/* {file && !preview && (
    <div className="mb-2 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-200 dark:bg-gray-700 text-sm">
      📄 {file.name}
      <button onClick={() => { setFile(null); setPreview(""); }} className="ml-2 text-red-500 font-bold">×</button>
    </div>
  )} */}

          <div className="flex gap-3">
            <button
              onClick={() => fileRef.current?.click()}
              className="shrink-0 px-3 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              📎
            </button>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask or drop a file…"
              className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white/70 dark:bg-gray-800/70 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
              rows={1}
            />
            <button
              onClick={send}
              disabled={loading}
              className="shrink-0 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              Send
            </button>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Shift+Enter new line · Enter send · ￥0.005/page when file attached
          </p>

          <input
            type="file"
            accept="*/*"
            ref={fileRef}
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) {
                setFile(f);
                setPreview(
                  f.type.startsWith("image/") ? URL.createObjectURL(f) : ""
                );
              }
            }}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onClick={(e) => ((e.target as any).value = null)}
          />
        </footer>

        <input
          type="file"
          accept="*/*"
          ref={fileRef}
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) {
              setFile(f);
              setPreview(
                f.type.startsWith("image/") ? URL.createObjectURL(f) : ""
              );
            }
          }}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onClick={(e) => ((e.target as any).value = null)} // re-select same file
        />
      </div>
    </main>
  );
}

// ----- helper: pretty markdown-like formatting -----
function formatAnswer(raw: string): string {
  return raw
    .replace(
      /^### (.*$)/gim,
      "<h3 class='font-bold mt-2 mb-1 text-base'>$1</h3>"
    )
    .replace(/^## (.*$)/gim, "<h2 class='font-bold mt-3 mb-1 text-lg'>$1</h2>")
    .replace(/^# (.*$)/gim, "<h1 class='font-bold mt-3 mb-1 text-xl'>$1</h1>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/^\- (.+)$/gim, "<li class='ml-4 list-disc'>$1</li>")
    .replace(/\n/g, "<br />");
}
