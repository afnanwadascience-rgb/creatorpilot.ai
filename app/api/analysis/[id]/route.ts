import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";

// GET /api/analysis/:id
// Ownership is always verified server-side: the query filters on both id
// AND userId, so a user can never fetch another user's analysis by
// guessing/incrementing an id.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const { id } = await params;

  const analysis = await prisma.analysis.findFirst({
    where: { id, userId: user.id },
  });

  if (!analysis) {
    return NextResponse.json({ error: "Analysis not found." }, { status: 404 });
  }

  return NextResponse.json({ analysis });
}
