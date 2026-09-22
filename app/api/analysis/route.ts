import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { getEntitlement, FREE_ANALYSIS_LIMIT } from "@/lib/entitlement";
import { prisma } from "@/lib/prisma";
import { analyzeScript, AnalysisServiceError } from "@/services/analysis.service";
import { AnalyzeRequestSchema } from "@/types/analysis";

// POST /api/analysis
// This is the only place a new analysis gets created. Every check here is
// server-side and re-derived from the database + Whop on every call —
// nothing about identity, plan, or usage is ever accepted from the client.
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Malformed request body." }, { status: 400 });
  }

  const parsedBody = AnalyzeRequestSchema.safeParse(body);
  if (!parsedBody.success) {
    return NextResponse.json(
      { error: parsedBody.error.issues[0]?.message ?? "Invalid script." },
      { status: 400 }
    );
  }
  const { script } = parsedBody.data;

  // Re-check entitlement fresh, right before doing the expensive AI call.
  const entitlement = await getEntitlement(user.id, user.whopUserId);
  if (!entitlement.canAnalyze) {
    return NextResponse.json(
      { error: "You've used all 10 free analyses.", entitlement },
      { status: 402 }
    );
  }

  let result;
  try {
    result = await analyzeScript(script);
  } catch (err) {
    if (err instanceof AnalysisServiceError) {
      console.error("Analysis failed:", err.message);
    } else {
      console.error("Unexpected analysis error:", err);
    }
    return NextResponse.json(
      { error: "We couldn't analyze this script right now. Please try again." },
      { status: 502 }
    );
  }

  try {
    // Increment usage and save the analysis atomically. The transaction
    // re-reads analysisCount inside itself and aborts if a concurrent
    // request already pushed the user over the free limit — this is what
    // makes the limit race-condition-safe under concurrent requests.
    const analysis = await prisma.$transaction(async (tx) => {
      if (!entitlement.hasProAccess) {
        const usage = await tx.usage.findUniqueOrThrow({ where: { userId: user.id } });
        if (usage.analysisCount >= FREE_ANALYSIS_LIMIT) {
          throw new Error("LIMIT_REACHED");
        }
        await tx.usage.update({
          where: { userId: user.id },
          data: { analysisCount: { increment: 1 } },
        });
      }

      return tx.analysis.create({
        data: {
          userId: user.id,
          title: result.suggestedTitle,
          script,
          overallScore: result.overallScore,
          hookScore: result.hookScore,
          retentionScore: result.retentionScore,
          structureScore: result.structureScore,
          clarityScore: result.clarityScore,
          result: result as unknown as object,
        },
      });
    });

    return NextResponse.json({ analysis }, { status: 201 });
  } catch (err) {
    if (err instanceof Error && err.message === "LIMIT_REACHED") {
      return NextResponse.json(
        { error: "You've used all 10 free analyses." },
        { status: 402 }
      );
    }
    console.error("Failed to save analysis:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
