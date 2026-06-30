import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      error:
        "This endpoint is disabled. Opening SMS sends must be created from authenticated dashboard server actions."
    },
    { status: 410 }
  );
}
