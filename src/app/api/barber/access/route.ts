import { NextResponse } from "next/server";
import { apiUser, jsonError } from "@/lib/auth";
import { daysLeft, isOnTrial } from "@/lib/access";
import { getPlatformSettings } from "@/lib/platform";
import { lastPaidSubscription } from "@/lib/subscription";

export const dynamic = "force-dynamic";

export async function GET() {
  const ctx = await apiUser();
  if (!ctx?.user.barberProfile) return jsonError("Acesso negado.", 403);
  const profile = ctx.user.barberProfile;
  const [last, platform] = await Promise.all([lastPaidSubscription(profile.id), getPlatformSettings()]);
  return NextResponse.json({
    onTrial: isOnTrial(profile.trialUntil) && !last,
    daysLeft: daysLeft(profile.trialUntil),
    configuredDays: platform.trialDays,
    accessUntil: profile.accessUntil,
  });
}
