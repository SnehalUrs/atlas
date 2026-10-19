import { findReport } from "@/lib/library";

/** Saved report for a product name, used by the analysis page when live analysis is off. */
export function GET(req: Request) {
  const product = new URL(req.url).searchParams.get("product")?.trim();
  if (!product) return Response.json({ error: "Product name is required." }, { status: 400 });
  const report = findReport(product);
  return report ? Response.json({ report }) : Response.json({ error: "not_found" }, { status: 404 });
}
