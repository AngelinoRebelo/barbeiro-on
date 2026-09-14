import { NextResponse } from "next/server";
import { matchSupportFaq, SUPPORT_DEFAULT, SUPPORT_SYSTEM_PROMPT } from "@/lib/support-faq";

const g = globalThis as typeof globalThis & { __boSupportHits?: Map<string, number[]> };

function limited(ip: string) {
  if (!g.__boSupportHits) g.__boSupportHits = new Map();
  const now = Date.now();
  const hits = (g.__boSupportHits.get(ip) || []).filter((t) => now - t < 60_000);
  hits.push(now);
  g.__boSupportHits.set(ip, hits);
  return hits.length > 20;
}

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";
  if (limited(ip)) return NextResponse.json({ error: "Muitas mensagens. Aguarde um minuto." }, { status: 429 });

  const body = await req.json().catch(() => ({}));
  const message = String(body.message || "").trim().slice(0, 2000);
  if (!message) return NextResponse.json({ error: "Informe a mensagem." }, { status: 400 });

  const local = matchSupportFaq(message);
  if (local.score >= 2) return NextResponse.json({ reply: local.answer, source: "faq", id: local.id });

  const key = (process.env.OPENAI_API_KEY || "").trim();
  if (!key) return NextResponse.json({ reply: local.answer || SUPPORT_DEFAULT, source: "faq" });

  try {
    const history = Array.isArray(body.history) ? body.history.slice(-12) : [];
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        authorization: `Bearer ${key}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_SUPPORT_MODEL || "gpt-4o-mini",
        temperature: 0.2,
        max_tokens: 700,
        messages: [
          { role: "system", content: SUPPORT_SYSTEM_PROMPT },
          ...history.map((h: { role?: string; content?: string }) => ({
            role: h?.role === "assistant" ? "assistant" : "user",
            content: String(h?.content || "").slice(0, 1200),
          })),
          { role: "user", content: message },
        ],
      }),
    });
    const data = await res.json().catch(() => ({}));
    const reply = String(data.choices?.[0]?.message?.content || "").trim();
    if (reply) return NextResponse.json({ reply, source: "ai" });
  } catch {
    /* FAQ fallback */
  }

  return NextResponse.json({ reply: local.answer || SUPPORT_DEFAULT, source: "faq" });
}
