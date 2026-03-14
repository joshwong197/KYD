import { NextRequest, NextResponse } from "next/server";
import { searchEntityRoles } from "@/lib/api/entity-role-search";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const name = searchParams.get("name");
  const page = parseInt(searchParams.get("page") || "0", 10);
  const pageSize = parseInt(searchParams.get("pageSize") || "50", 10);

  if (!name || name.length < 2) {
    return NextResponse.json(
      { error: "Name must be at least 2 characters" },
      { status: 400 }
    );
  }

  try {
    const data = await searchEntityRoles(name, "DIR", page, pageSize);
    return NextResponse.json(data);
  } catch (err) {
    console.error("Director search error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Search failed" },
      { status: 500 }
    );
  }
}
