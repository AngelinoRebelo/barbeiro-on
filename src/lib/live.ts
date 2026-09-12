type ShopEvent = "slots" | "queue";
type Listener = (type: ShopEvent) => void;

const g = globalThis as typeof globalThis & {
  __barberShopLive?: Map<string, Set<Listener>>;
};

function bus() {
  if (!g.__barberShopLive) g.__barberShopLive = new Map();
  return g.__barberShopLive;
}

export function subscribeShopLive(slug: string, listener: Listener) {
  const key = slug.toLowerCase();
  const listeners = bus().get(key) ?? new Set<Listener>();
  listeners.add(listener);
  bus().set(key, listeners);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) bus().delete(key);
  };
}

export function notifyShopLive(slug: string, type: ShopEvent = "slots") {
  const listeners = bus().get(slug.toLowerCase());
  if (!listeners) return;
  for (const listener of listeners) {
    try {
      listener(type);
    } catch {
      /* ignore a broken tab */
    }
  }
}
