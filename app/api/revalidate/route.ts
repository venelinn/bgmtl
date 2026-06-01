import type { NextRequest } from "next/server";
import { isAuthorized, isRevalidationConfigured, revalidateAllLocales } from "@/utils/revalidation";

/** Node runtime: on-demand revalidation must run where Next can update the ISR manifest (not Edge). */
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  if (!isRevalidationConfigured()) {
    return Response.json({ error: "Revalidation is not configured" }, { status: 500 });
  }

  if (!isAuthorized(req)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const paths = revalidateAllLocales();
    return Response.json({ revalidated: true, paths });
  } catch (err) {
    console.error("revalidate error:", err);
    return Response.json({ error: "Revalidation failed" }, { status: 500 });
  }
}
