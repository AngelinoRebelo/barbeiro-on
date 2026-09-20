import { requireClient } from "@/lib/auth";
import { ShopBooker } from "@/components/shop-booker";

export default async function PortalBookPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  await requireClient(slug);
  return <ShopBooker slug={slug} loggedIn compact />;
}
