import { analyzeJob, analysisInputSchema } from "@/app/lib/ats";

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = analysisInputSchema.safeParse(json);
    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid request" },
        { status: 400 },
      );
    }
    return Response.json({ ok: true, analysis: analyzeJob(parsed.data) });
  } catch (error) {
    console.error("[analyze] request failed", {
      message: error instanceof Error ? error.message : "Unknown error",
    });
    return Response.json({ error: "Unable to analyze this posting" }, { status: 500 });
  }
}
