import { prisma } from "@/lib/prisma";
import { jsonError } from "@/lib/auth";
import { subscribeShopLive } from "@/lib/live";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Ctx = { params: Promise<{ slug: string }> };

export async function GET(req: Request, ctx: Ctx) {
  const { slug } = await ctx.params;
  const shop = await prisma.barberProfile.findUnique({
    where: { slug },
    select: { slug: true },
  });
  if (!shop) return jsonError("Barbearia não encontrada.", 404);

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };
      send("hello", { ok: true });
      const unsubscribe = subscribeShopLive(shop.slug, (type) => {
        send(type, { at: Date.now() });
      });
      const ping = setInterval(() => send("ping", { at: Date.now() }), 15000);
      const abort = () => {
        clearInterval(ping);
        unsubscribe();
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      };
      req.signal.addEventListener("abort", abort);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
